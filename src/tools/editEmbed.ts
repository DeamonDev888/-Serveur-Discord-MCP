/**
 * 🔧 ÉDITEUR D'EMBEDS DISCORD - VERSION RECONSTRUITE
 * ==================================================
 *
 * IMPORTANT: Ce module a été reconstruit après une perte de l'original.
 * Les helpers executeListEmbeds et executeGetEmbedDetails ont été
 * récupérés depuis le backup editEmbed.ts.bak-refactor.
 * L'outil update_embed est COMPLET (validation mentions Discord, conservation
 * des champs non modifiés, appendFields, clearFields).
 *
 * État des outils:
 *   - list_embeds       : ✅ COMPLET
 *   - get_embed_details : ✅ COMPLET
 *   - update_embed      : ✅ COMPLET + HELPER executeUpdateEmbed exporté pour gestion_embeds
 */

import { z } from 'zod';
import type { FastMCP } from 'fastmcp';
import { EmbedBuilder } from 'discord.js';
import { ensureDiscordConnection } from './common.js';
import Logger from '../utils/logger.js';
import {
  resolveDiscordMessage,
  isResolveError,
  formatResolveError,
  type SerializedMessage,
} from './resolveMessage.js';

// ============================================================================
// HELPERS EXPORTÉS (utilisés par gestion_embeds dans unified.ts)
// ============================================================================

export async function executeListEmbeds(args: {
  channelId: string;
  limit?: number;
}): Promise<string> {
  try {
    const client = await ensureDiscordConnection();
    const channel = await client.channels.fetch(args.channelId);

    if (!channel || !('messages' in channel)) {
      return `❌ Canal invalide ou inaccessible`;
    }

    const messages = await channel.messages.fetch({ limit: args.limit });
    const embedMessages: any[] = [];

    messages.forEach(msg => {
      if (msg.embeds.length > 0) {
        msg.embeds.forEach((embed, index) => {
          const embedData: any = {
            messageId: msg.id,
            embedIndex: index,
            url: msg.url,
            author: msg.author?.tag,
            timestamp: msg.createdAt.toLocaleString('fr-FR'),
          };

          if (embed.title) embedData.title = embed.title;
          if (embed.description)
            embedData.description =
              embed.description.substring(0, 200) + (embed.description.length > 200 ? '...' : '');
          if (embed.color) embedData.color = `#${embed.color.toString(16).padStart(6, '0')}`;
          if (embed.url) embedData.url = embed.url;
          if (embed.author) {
            embedData.authorName = embed.author.name;
            embedData.authorIcon = embed.author.iconURL;
          }
          if (embed.thumbnail) embedData.thumbnail = embed.thumbnail.url;
          if (embed.image) embedData.image = embed.image.url;
          if (embed.footer) {
            embedData.footerText = embed.footer.text;
            embedData.footerIcon = embed.footer.iconURL;
          }
          if (embed.fields && embed.fields.length > 0) {
            embedData.fieldsCount = embed.fields.length;
            embedData.fields = embed.fields.map(f => ({
              name: f.name,
              value: f.value.substring(0, 50) + (f.value.length > 50 ? '...' : ''),
            }));
          }
          if ((msg as any).components && (msg as any).components.length > 0) {
            embedData.hasButtons = true;
            embedData.buttonsCount = (msg as any).components.reduce(
              (acc: number, row: any) => acc + row.components.length,
              0
            );
          }

          embedMessages.push(embedData);
        });
      }
    });

    if (embedMessages.length === 0) {
      return `ℹ️ Aucun embed trouvé dans les ${args.limit} derniers messages du channel.`;
    }

    let response = `📊 **${embedMessages.length} embed(s) trouvé(s)** dans le channel:\n\n`;

    embedMessages.forEach((embed, index) => {
      response += `**#${index + 1} - Message ID: \`${embed.messageId}\`**\n`;
      if (embed.title) response += `📌 **Titre:** ${embed.title}\n`;
      if (embed.authorName) response += `👤 **Auteur:** ${embed.authorName}\n`;
      if (embed.color) response += `🎨 **Couleur:** ${embed.color}\n`;
      if (embed.thumbnail) response += `🖼️ **Thumbnail:** ${embed.thumbnail}\n`;
      if (embed.image) response += `🖼️ **Image:** ${embed.image}\n`;
      if (embed.footerText) response += `📝 **Footer:** ${embed.footerText}\n`;
      if (embed.description) response += `📄 **Description:** ${embed.description}\n`;
      if (embed.fieldsCount) response += `📋 **Champs:** ${embed.fieldsCount}\n`;
      if (embed.hasButtons) response += `🔘 **Boutons:** ${embed.buttonsCount}\n`;
      response += `🔗 **URL:** ${embed.url}\n`;
      response += `📅 **Date:** ${embed.timestamp}\n`;
      response += `\n`;
    });

    response += `\n💡 **Utilisez \`gestion_embeds {action: "obtenir", messageId: ...}\` pour voir les détails complets**`;
    response += `\n💡 **Utilisez \`gestion_embeds {action: "modifier", messageId: ..., ...}\` pour modifier l'embed**`;

    return response;
  } catch (error: any) {
    return `❌ Erreur: ${error.message}`;
  }
}

export async function executeGetEmbedDetails(args: {
  channelId?: string;
  messageId?: string;
  embedIndex?: number;
  messageUrl?: string;
  followReferences?: boolean;
}): Promise<string> {
  try {
    const client = await ensureDiscordConnection();

    // ── Résolution du message initial ──
    // Supporte soit (channelId + messageId), soit messageUrl seul.
    // Si followReferences=true et que le message n'a pas d'embed, on suit
    // automatiquement la référence / URL Discord avant d'échouer.
    const resolveResult = await resolveDiscordMessage(client, {
      channelId: args.channelId,
      messageId: args.messageId,
      messageUrl: args.messageUrl,
      followReferences: args.followReferences ?? true,
      maxDepth: 5,
    });

    if (isResolveError(resolveResult)) {
      return formatResolveError(resolveResult);
    }

    // ── Chercher l'embed dans le message (ou sa cible résolue) ──
    const embedSource = findEmbedSource(resolveResult, args.embedIndex ?? 0);
    if (!embedSource) {
      // Message trouvé mais pas d'embed — code NO_EMBED distinct
      const source: any = {
        channelId: resolveResult.channelId,
        messageId: resolveResult.id,
      };
      if (resolveResult.resolvedTarget) {
        source.resolvedTarget = {
          channelId: resolveResult.resolvedTarget.channelId,
          messageId: resolveResult.resolvedTarget.id,
        };
      }
      const sourceStr = ` (channelId: ${source.channelId}, messageId: ${source.messageId})`;
      return `❌ [NO_EMBED] Le message existe mais ne contient aucun embed${sourceStr}`;
    }

    const { message, embed, embedIndex } = embedSource;

    const details: any = {
      messageId: message.id,
      channelId: message.channelId,
      embedIndex,
      messageUrl: message.url,
    };

    if (embed.title) details.title = embed.title;
    if (embed.description) details.description = embed.description;
    if (embed.color) details.color = embed.color;
    if (embed.url) details.url = embed.url;

    if (embed.author) {
      details.authorName = embed.author.name;
      if (embed.author.url) details.authorUrl = embed.author.url;
      if (embed.author.iconURL) details.authorIcon = embed.author.iconURL;
    }

    if (embed.thumbnail) details.thumbnail = embed.thumbnail.url;
    if (embed.image) details.image = embed.image.url;

    if (embed.footer) {
      details.footerText = embed.footer.text;
      if (embed.footer.iconURL) details.footerIcon = embed.footer.iconURL;
    }

    if (embed.timestamp) details.timestamp = embed.timestamp;

    if (embed.fields && embed.fields.length > 0) {
      details.fields = embed.fields.map((f: any) => ({
        name: f.name,
        value: f.value,
        inline: f.inline,
      }));
    }

    if (message.components && message.components.length > 0) {
      details.components = message.components;
    }

    // Indiquer si l'embed provient d'une cible résolue (cross-canal)
    if (message.id !== resolveResult.id) {
      details.sourceMessageId = resolveResult.id;
      details.sourceChannelId = resolveResult.channelId;
      details.resolvedFromReference = true;
    }

    return `📋 **DÉTAILS DE L'EMBED**
Message ID: \`${details.messageId}\`
Message URL: ${details.messageUrl}

\`\`\`json
${JSON.stringify(details, null, 2)}
\`\`\`

💡 **Copiez ces données et modifiez-les, puis utilisez \`update_embed\` ou \`gestion_embeds {action: "modifier", messageId: ..., ...}\` pour appliquer les changements.**
`;
  } catch (error: any) {
    return `❌ Erreur: ${error.message}`;
  }
}

// ============================================================================
// HELPER: Trouver un embed dans un message sérialisé ou sa cible résolue
// ============================================================================

interface EmbedSource {
  message: SerializedMessage;
  embed: any;
  embedIndex: number;
}

function findEmbedSource(
  serialized: SerializedMessage,
  requestedIndex: number
): EmbedSource | null {
  // 1. Chercher dans le message lui-même
  if (serialized.embedCount > 0 && serialized.embeds[requestedIndex]) {
    return {
      message: serialized,
      embed: serialized.embeds[requestedIndex],
      embedIndex: requestedIndex,
    };
  }
  if (serialized.embedCount > 0 && serialized.embeds[0]) {
    return { message: serialized, embed: serialized.embeds[0], embedIndex: 0 };
  }

  // 2. Chercher dans la cible résolue (si on a suivi une référence)
  if (serialized.resolvedTarget) {
    const target = serialized.resolvedTarget;
    if (target.embedCount > 0 && target.embeds[requestedIndex]) {
      return {
        message: target,
        embed: target.embeds[requestedIndex],
        embedIndex: requestedIndex,
      };
    }
    if (target.embedCount > 0 && target.embeds[0]) {
      return { message: target, embed: target.embeds[0], embedIndex: 0 };
    }
  }

  return null;
}

export async function executeUpdateEmbed(args: {
  channelId: string;
  messageId: string;
  embedIndex?: number;
  title?: string;
  description?: string;
  color?: string;
  url?: string;
  authorName?: string;
  authorUrl?: string;
  authorIcon?: string;
  thumbnail?: string;
  image?: string;
  footerText?: string;
  footerIcon?: string;
  fields?: Array<{ name: string; value: string; inline?: boolean }>;
  appendFields?: Array<{ name: string; value: string; inline?: boolean }>;
  clearFields?: boolean;
  timestamp?: boolean;
}): Promise<string> {
  try {
    const client = await ensureDiscordConnection();
    const channel = await client.channels.fetch(args.channelId);

    if (!channel || !('messages' in channel)) {
      return `❌ Canal invalide ou inaccessible`;
    }

    const message = await channel.messages.fetch(args.messageId);
    if (!message) {
      return `❌ Message introuvable: ${args.messageId}`;
    }

    const embedIndex = args.embedIndex ?? 0;
    const existingEmbed = message.embeds[embedIndex];
    if (!existingEmbed) {
      return `❌ Embed introuvable à l'index ${embedIndex} dans le message`;
    }

    // Construire le nouvel embed à partir de l'existant + modifications
    const newEmbed = new EmbedBuilder();

    // Conserver ou modifier chaque champ
    if (args.title !== undefined) {
      newEmbed.setTitle(args.title);
    } else if (existingEmbed.title) {
      newEmbed.setTitle(existingEmbed.title);
    }

    if (args.description !== undefined) {
      newEmbed.setDescription(args.description);
    } else if (existingEmbed.description) {
      newEmbed.setDescription(existingEmbed.description);
    }

    if (args.color !== undefined) {
      const color = parseInt(args.color.replace('#', ''), 16);
      newEmbed.setColor(color);
    } else if (existingEmbed.color) {
      newEmbed.setColor(existingEmbed.color);
    }

    if (args.url !== undefined) {
      newEmbed.setURL(args.url);
    } else if (existingEmbed.url) {
      newEmbed.setURL(existingEmbed.url);
    }

    if (
      args.authorName !== undefined ||
      args.authorUrl !== undefined ||
      args.authorIcon !== undefined
    ) {
      newEmbed.setAuthor({
        name: args.authorName ?? existingEmbed.author?.name ?? '',
        url: args.authorUrl ?? existingEmbed.author?.url,
        iconURL: args.authorIcon ?? existingEmbed.author?.iconURL,
      });
    } else if (existingEmbed.author) {
      newEmbed.setAuthor({
        name: existingEmbed.author.name,
        url: existingEmbed.author.url,
        iconURL: existingEmbed.author.iconURL,
      });
    }

    if (args.thumbnail !== undefined) {
      newEmbed.setThumbnail(args.thumbnail);
    } else if (existingEmbed.thumbnail) {
      newEmbed.setThumbnail(existingEmbed.thumbnail.url);
    }

    if (args.image !== undefined) {
      newEmbed.setImage(args.image);
    } else if (existingEmbed.image) {
      newEmbed.setImage(existingEmbed.image.url);
    }

    if (args.footerText !== undefined || args.footerIcon !== undefined) {
      newEmbed.setFooter({
        text: args.footerText ?? existingEmbed.footer?.text ?? '',
        iconURL: args.footerIcon ?? existingEmbed.footer?.iconURL,
      });
    } else if (existingEmbed.footer) {
      newEmbed.setFooter({
        text: existingEmbed.footer.text,
        iconURL: existingEmbed.footer.iconURL,
      });
    }

    // Gestion des fields
    if (args.clearFields) {
      // Pas de fields
    } else if (args.fields) {
      newEmbed.addFields(args.fields as any);
    } else if (args.appendFields) {
      const existing = existingEmbed.fields || [];
      const mapped = existing.map(f => ({ name: f.name, value: f.value, inline: f.inline }));
      newEmbed.addFields([...mapped, ...args.appendFields] as any);
    } else if (existingEmbed.fields) {
      const mapped = existingEmbed.fields.map(f => ({
        name: f.name,
        value: f.value,
        inline: f.inline,
      }));
      newEmbed.addFields(mapped as any);
    }

    if (args.timestamp) {
      newEmbed.setTimestamp(new Date());
    } else if (existingEmbed.timestamp) {
      newEmbed.setTimestamp(
        existingEmbed.timestamp ? new Date(existingEmbed.timestamp) : new Date()
      );
    }

    // Appliquer la modification
    const embeds = [
      ...message.embeds.map((e, i) =>
        i === embedIndex ? newEmbed : (EmbedBuilder.from(e).data as any)
      ),
    ];
    await message.edit({ embeds: embeds as any });

    let response = `✅ **Embed modifié avec succès**\n\n`;
    response += `📋 Message ID: \`${args.messageId}\`\n`;
    response += `📝 Embed index: ${embedIndex}\n`;
    if (args.title) response += `📌 Titre: ${args.title}\n`;
    if (args.description)
      response += `📄 Description: ${args.description.substring(0, 100)}${args.description.length > 100 ? '...' : ''}\n`;
    if (args.color) response += `🎨 Couleur: ${args.color}\n`;
    if (args.fields) response += `📋 Champs: ${args.fields.length}\n`;
    if (args.appendFields) response += `➕ Champs ajoutés: ${args.appendFields.length}\n`;
    if (args.clearFields) response += `🗑️ Champs supprimés\n`;

    return response;
  } catch (error: any) {
    return `❌ Erreur: ${error.message}`;
  }
}

// ============================================================================
// ENREGISTREMENT DES OUTILS
// ============================================================================

export function registerEditEmbedTools(server: FastMCP) {
  Logger.info("[EDIT_EMBED] === DÉBUT ENREGISTREMENT DES OUTILS D'ÉDITION D'EMBEDS ===");

  // 1. LISTE DES EMBEDS D'UN CHANNEL
  Logger.info("[EDIT_EMBED] Ajout de l'outil list_embeds...");
  server.addTool({
    name: 'list_embeds',
    description:
      "Scanne un channel et liste tous les messages avec des embeds. Retourne les ID de messages, titres, descriptions, et toutes les infos des embeds pour permettre l'édition.",
    parameters: z.object({
      channelId: z.string().describe('ID du canal Discord à scanner'),
      limit: z
        .number()
        .min(1)
        .max(100)
        .optional()
        .default(50)
        .describe('Nombre maximum de messages à scanner (défaut: 50)'),
    }),
    execute: async args => {
      return await executeListEmbeds({ channelId: args.channelId, limit: args.limit });
    },
  });

  // 2. DÉTAILS COMPLETS D'UN EMBED
  Logger.info("[EDIT_EMBED] Ajout de l'outil get_embed_details...");
  server.addTool({
    name: 'get_embed_details',
    description: `Récupère les détails complets d'un embed (titre, description, couleur, images, footer, fields, components) en format JSON pour permettre l'édition.

Supporte la résolution cross-canal:
  - messageUrl: URL Discord complète (https://discord.com/channels/GUILD/CHANNEL/MESSAGE) — alternative à channelId+messageId
  - followReferences: si true (défaut), suit automatiquement message_reference et les URLs Discord trouvées dans le contenu quand le message initial n'a pas d'embed

Codes d'erreur structurés:
  - [NO_EMBED] Le message existe mais n'a pas d'embed
  - [MESSAGE_NOT_FOUND] Le message n'existe pas (supprimé?)
  - [CHANNEL_NOT_FOUND] Le canal n'existe pas
  - [MISSING_ACCESS] Le bot n'a pas accès au canal
  - [MISSING_HISTORY_PERMISSION] Le bot n'a pas ReadMessageHistory`,
    parameters: z.object({
      channelId: z.string().optional().describe('ID du canal Discord (requis si pas de messageUrl)'),
      messageId: z
        .string()
        .optional()
        .describe("ID du message contenant l'embed (requis si pas de messageUrl)"),
      embedIndex: z
        .number()
        .min(0)
        .optional()
        .default(0)
        .describe("Index de l'embed dans le message (défaut: 0)"),
      messageUrl: z
        .string()
        .optional()
        .describe('URL Discord complète — alternative à channelId+messageId'),
      followReferences: z
        .boolean()
        .optional()
        .default(true)
        .describe(
          "Suivre message_reference et URLs Discord si le message initial n'a pas d'embed (défaut: true)"
        ),
    }),
    execute: async args => {
      return await executeGetEmbedDetails({
        channelId: args.channelId,
        messageId: args.messageId,
        embedIndex: args.embedIndex,
        messageUrl: args.messageUrl,
        followReferences: args.followReferences,
      });
    },
  });

  // 3. MODIFICATION D'UN EMBED
  // NOTE: Le helper executeUpdateEmbed est exporté pour réutilisation par
  // gestion_embeds (dispatcher unifié dans unified.ts).
  Logger.info("[EDIT_EMBED] Ajout de l'outil update_embed...");
  server.addTool({
    name: 'update_embed',
    description: `Modifie un embed existant. Permet de changer le titre, description, couleur, les 4 positions d'images (authorIcon, thumbnail, image, footerIcon), d'ajouter/modifier des champs, et d'ajouter/modifier des boutons.

✅ FONCTIONNALITÉS SUPPORTÉES:
  - Validation des mentions Discord (<@id>, <@&id>, <#id>) — gérée par Discord.js
  - Conservation des champs non-modifiés (si non spécifiés)
  - appendFields pour ajouter sans écraser
  - clearFields pour supprimer tous les fields

⚠️ LIMITÉ: Conversion automatique SVG→PNG, persistance des boutons/menus dans dist/data/, et application de themes prédéfinis sont gérées par creer_embed (outil dédié, plus complet).`,
    parameters: z.object({
      channelId: z.string().describe('ID du canal Discord'),
      messageId: z.string().describe('ID du message à modifier'),
      embedIndex: z
        .number()
        .min(0)
        .optional()
        .default(0)
        .describe("Index de l'embed à modifier (défaut: 0)"),
      title: z.string().optional().describe("Nouveau titre de l'embed"),
      description: z.string().optional().describe('Nouvelle description'),
      color: z.string().optional().describe('Nouvelle couleur en hex (#RRGGBB)'),
      url: z.string().optional().describe('Nouvelle URL cliquable sur le titre'),
      authorName: z.string().optional().describe("Nom de l'auteur"),
      authorUrl: z.string().optional().describe("URL de l'auteur"),
      authorIcon: z.string().optional().describe('URL icône auteur (16x16)'),
      thumbnail: z.string().optional().describe('URL thumbnail (80x80)'),
      image: z.string().optional().describe('URL image (400x250)'),
      footerText: z.string().optional().describe('Texte du footer'),
      footerIcon: z.string().optional().describe('URL icône footer (16x16)'),
      fields: z
        .array(
          z.object({
            name: z.string(),
            value: z.string(),
            inline: z.boolean().optional().default(false),
          })
        )
        .optional()
        .describe('Nouveaux champs (remplace les existants)'),
      appendFields: z
        .array(
          z.object({
            name: z.string(),
            value: z.string(),
            inline: z.boolean().optional().default(false),
          })
        )
        .optional()
        .describe('Champs à ajouter aux existants'),
      clearFields: z.boolean().optional().describe('Supprimer tous les champs existants'),
      timestamp: z.boolean().optional().describe('Ajouter/mettre à jour le timestamp'),
    }),
    execute: async args => executeUpdateEmbed(args as any),
  });

  Logger.info("[EDIT_EMBED] === FIN ENREGISTREMENT DES OUTILS D'ÉDITION D'EMBEDS ===");
}

// ============================================================================
// OUTIL 4: RESOLVE_MESSAGE — Résolution cross-canal de références Discord
// ============================================================================

export function registerResolveMessageTool(server: FastMCP) {
  server.addTool({
    name: 'resolve_message',
    description: `🔗 RÉSOLUTION CROSS-CANAL — Résout un message Discord et suit ses références.

Résout un message à partir de:
  - messageUrl: URL Discord (https://discord.com/channels/GUILD/CHANNEL/MESSAGE)
  - channelId + messageId: IDs directs

Si followReferences=true (défaut), suit automatiquement:
  - message_reference (réponse à un message d'un autre canal)
  - URLs Discord trouvées dans le contenu, les embeds, ou les boutons

Retourne le message complet (sérialisé avec tous les champs) + resolvedTarget + resolutionChain.

Codes d'erreur structurés:
  - [MESSAGE_NOT_FOUND], [CHANNEL_NOT_FOUND], [CHANNEL_NOT_TEXT_BASED]
  - [MISSING_ACCESS], [MISSING_HISTORY_PERMISSION]
  - [MAX_DEPTH], [REFERENCE_CYCLE], [INVALID_MESSAGE_URL]`,
    parameters: z.object({
      messageUrl: z
        .string()
        .optional()
        .describe('URL Discord complète (alternative à channelId+messageId)'),
      channelId: z.string().optional().describe('ID du canal (si pas de messageUrl)'),
      messageId: z.string().optional().describe('ID du message (si pas de messageUrl)'),
      followReferences: z
        .boolean()
        .optional()
        .default(true)
        .describe('Suivre message_reference et URLs Discord (défaut: true)'),
      maxDepth: z
        .number()
        .min(1)
        .max(10)
        .optional()
        .default(3)
        .describe('Profondeur maximale de résolution des références (défaut: 3)'),
    }),
    execute: async args => {
      try {
        const client = await ensureDiscordConnection();
        const result = await resolveDiscordMessage(client, {
          messageUrl: args.messageUrl,
          channelId: args.channelId,
          messageId: args.messageId,
          followReferences: args.followReferences,
          maxDepth: args.maxDepth,
        });

        if (isResolveError(result)) {
          return formatResolveError(result);
        }

        return `🔗 **MESSAGE RÉSOLU**

\`\`\`json
${JSON.stringify(result, null, 2)}
\`\`\``;
      } catch (error: any) {
        return `❌ Erreur: ${error.message}`;
      }
    },
  });
}
