/**
 * 🔧 ÉDITEUR D'EMBEDS DISCORD - COMPLET
 * ======================================
 * Outils pour scanner, récupérer et modifier des embeds existants
 */

import { z } from 'zod';
import type { FastMCP } from 'fastmcp';
import {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
} from 'discord.js';
import { ensureDiscordConnection } from './common.js';
import Logger from '../utils/logger.js';
import { isSvgUrl as checkIsSvgUrl, convertSvgUrlToPng } from '../utils/svgConverter.js';
import {
  upsertPersistentButton,
  upsertPersistentMenu,
  type PersistentButton,
  type PersistentSelectMenu,
} from '../utils/distPersistence.js';
import { isLocalLogoUrl } from './embeds.js';
import { generateGuidanceMessage, applyTheme } from './embeds_utils.js';

// ============================================================================
// ENREGISTREMENT DES OUTILS
// ============================================================================

/**
 * Type d'erreur de mention
 */
type MentionErrorType = 'user' | 'channel' | 'role' | 'unknown';

/**
 * Analyse une mention invalide et retourne son type probable
 */
function analyzeInvalidMention(mention: string): MentionErrorType {
  if (mention.startsWith('<@') || mention.startsWith('<@!')) {
    return 'user';
  } else if (mention.startsWith('<#')) {
    return 'channel';
  } else if (mention.startsWith('<@&')) {
    return 'role';
  }
  return 'unknown';
}

/**
 * Valide que les mentions Discord respectent les formats valides
 * Formats acceptés: <@ID>, <@!ID>, <#ID>, <@&ID>
 * Renvoie un objet détaillé avec les erreurs par type
 */
function validateDiscordMentions(text: string): {
  valid: boolean;
  errors: {
    user: string[];
    channel: string[];
    role: string[];
    other: string[];
  };
  allInvalid: string[];
} {
  // Regex pour détecter les mentions (valides ET invalides)
  const mentionPattern = /<[@!&][^>]+>/g;
  const mentions = text.match(mentionPattern) || [];

  const errors = {
    user: [] as string[],
    channel: [] as string[],
    role: [] as string[],
    other: [] as string[],
  };

  const validFormats = [
    { pattern: /^<@\d+>$/, type: 'user' as const, name: '<@USER_ID>' },
    { pattern: /^<@!\d+>$/, type: 'user' as const, name: '<@!USER_ID>' },
    { pattern: /^<#\d+>$/, type: 'channel' as const, name: '<#CHANNEL_ID>' },
    { pattern: /^<@&\d+>$/, type: 'role' as const, name: '<@&ROLE_ID>' },
  ];

  for (const mention of mentions) {
    let isValid = false;
    for (const format of validFormats) {
      if (format.pattern.test(mention)) {
        isValid = true;
        break;
      }
    }

    if (!isValid) {
      const errorType = analyzeInvalidMention(mention);
      if (errorType === 'user') {
        errors.user.push(mention);
      } else if (errorType === 'channel') {
        errors.channel.push(mention);
      } else if (errorType === 'role') {
        errors.role.push(mention);
      } else {
        errors.other.push(mention);
      }
    }
  }

  const allInvalid = [...errors.user, ...errors.channel, ...errors.role, ...errors.other];

  return {
    valid: allInvalid.length === 0,
    errors,
    allInvalid,
  };
}

/**
 * Génère le message d'erreur pour les mentions invalides
 */
function generateMentionErrorMessage(
  validation: ReturnType<typeof validateDiscordMentions>,
  fieldName: string
): string {
  const message = `❌ **Format de mention invalide détecté dans ${fieldName} !**\n\n`;

  const parts: string[] = [];

  if (validation.errors.user.length > 0) {
    parts.push(`**Mentions utilisateur invalides :** ${validation.errors.user.join(', ')}`);
    parts.push(`  ✅ Format correct : \`<@293572859941617674>\` ou \`<@!293572859941617674>\``);
  }

  if (validation.errors.channel.length > 0) {
    parts.push(`**Mentions de canal invalides :** ${validation.errors.channel.join(', ')}`);
    parts.push(`  ✅ Format correct : \`<#1442317829998383235>\``);
  }

  if (validation.errors.role.length > 0) {
    parts.push(`**Mentions de rôle invalides :** ${validation.errors.role.join(', ')}`);
    parts.push(`  ✅ Format correct : \`<@&ROLE_ID>\``);
  }

  if (validation.errors.other.length > 0) {
    parts.push(`**Autres mentions invalides :** ${validation.errors.other.join(', ')}`);
  }

  return message + parts.join('\n\n');
}

/**
 * Convertit les paramètres du bouton en action persistante
 */
function buildButtonAction(btn: any): any {
  switch (btn.action) {
    case 'link':
      if (btn.value) {
        return { type: 'link', url: btn.value };
      }
      return { type: 'message', content: 'Lien non configuré', ephemeral: true };

    case 'delete':
      return { type: 'delete' };

    case 'edit':
      return { type: 'edit', newEmbed: btn.customData?.embed };

    case 'refresh':
      return { type: 'refresh' };

    case 'role':
      if (btn.roleId) {
        return { type: 'role', roleId: btn.roleId };
      }
      return { type: 'message', content: 'Rôle non configuré', ephemeral: true };

    case 'message':
      return {
        type: 'message',
        content: btn.customData?.message || btn.value || `${btn.label} cliqué !`,
        ephemeral: btn.customData?.ephemeral !== false,
      };

    case 'embed':
      return {
        type: 'embed',
        embed: btn.customData?.embed,
        ephemeral: btn.customData?.ephemeral !== false,
      };

    case 'custom':
      if (btn.customData?.embed) {
        return {
          type: 'embed',
          embed: btn.customData.embed,
          ephemeral: btn.customData.ephemeral !== false,
        };
      }
      return {
        type: 'message',
        content: btn.customData?.message || btn.value || `${btn.label} cliqué !`,
        ephemeral: btn.customData?.ephemeral !== false,
      };

    default:
      return {
        type: 'message',
        content: `${btn.label} cliqué !`,
        ephemeral: true,
      };
  }
}

/**
 * Convertit les paramètres du menu en action persistante
 */
function buildMenuAction(menu: any): any {
  switch (menu.action) {
    case 'link':
      if (menu.url) {
        return { type: 'link', url: menu.url, template: menu.template };
      }
      return { type: 'message', content: 'Lien non configuré', ephemeral: true };

    case 'delete':
      return { type: 'delete' };

    case 'edit':
      return { type: 'edit', newEmbed: menu.customData?.embed };

    case 'refresh':
      return { type: 'refresh' };

    case 'role':
      if (menu.roleId) {
        return { type: 'role', roleId: menu.roleId };
      }
      return { type: 'message', content: 'Rôle non configuré', ephemeral: true };

    case 'embed':
      if (menu.customData?.embed) {
        return {
          type: 'embed',
          embed: menu.customData.embed,
          ephemeral: true,
        };
      }
      return { type: 'message', content: 'Embed non configuré', ephemeral: true };

    case 'modal':
      if (menu.customData?.modalId) {
        return { type: 'modal', modalId: menu.customData.modalId };
      }
      return { type: 'message', content: 'Modal non configuré', ephemeral: true };

    case 'custom':
      return {
        type: 'custom',
        handler: menu.customData?.handler || 'customHandler',
      };

    default:
      return {
        type: 'message',
        content: menu.content || `Sélection: ${menu.action}`,
        template: menu.template,
        ephemeral: true,
      };
  }
}

export function registerEditEmbedTools(server: FastMCP) {
  Logger.info("[EDIT_EMBED] === DÉBUT ENREGISTREMENT DES OUTILS D'ÉDITION D'EMBEDS ===");

  // ============================================================================
  // 1. LISTE DES EMBEDS D'UN CHANNEL
  // ============================================================================
  server.addTool({
    name: 'list_embeds',
    description:
      "Scanne un channel et liste tous les messages avec des embeds. Retourne les ID de messages, titres, descriptions, et toutes les infos des embeds pour permettre l'édition.",
    parameters: z.object({
      channelId: z.string().describe('ID du canal Discord à scanner'),
      limit: z
        .number()
        .optional()
        .default(50)
        .describe('Nombre maximum de messages à scanner (défaut: 50)'),
    }),
    execute: async args => {
      try {
        const client = await ensureDiscordConnection();
        const channel = await client.channels.fetch(args.channelId);

        if (!channel || !('messages' in channel)) {
          return `❌ Canal invalide ou inaccessible`;
        }

        // Récupérer les messages
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

              // Extraire toutes les propriétés de l'embed
              if (embed.title) embedData.title = embed.title;
              if (embed.description)
                embedData.description =
                  embed.description.substring(0, 200) +
                  (embed.description.length > 200 ? '...' : '');
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

        // Formater la réponse
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

        response += `\n💡 **Utilisez \`get_embed_details\` avec le messageId pour voir les détails complets**`;
        response += `\n💡 **Utilisez \`update_embed\` avec le messageId pour modifier l'embed**`;

        return response;
      } catch (error: any) {
        return `❌ Erreur: ${error.message}`;
      }
    },
  });

  // ============================================================================
  // 2. DÉTAILS COMPLETS D'UN EMBED
  // ============================================================================
  server.addTool({
    name: 'get_embed_details',
    description:
      "Récupère les détails complets d'un embed existant pour permettre l'édition. Retourne toutes les propriétés (title, description, color, author, thumbnail, image, footer, fields, components) en format structuré.",
    parameters: z.object({
      channelId: z.string().describe('ID du canal Discord'),
      messageId: z.string().describe("ID du message contenant l'embed"),
      embedIndex: z
        .number()
        .optional()
        .default(0)
        .describe("Index de l'embed si le message en contient plusieurs (défaut: 0)"),
    }),
    execute: async args => {
      try {
        const client = await ensureDiscordConnection();
        const channel = await client.channels.fetch(args.channelId);

        if (!channel || !('messages' in channel)) {
          return `❌ Canal invalide ou inaccessible`;
        }

        const message = await channel.messages.fetch(args.messageId);

        if (!message || message.embeds.length === 0) {
          return `❌ Message sans embed introuvable`;
        }

        const embed = message.embeds[args.embedIndex];
        if (!embed) {
          return `❌ Embed introuvable à l'index ${args.embedIndex}`;
        }

        // Construire l'objet de détails
        const details: any = {
          messageId: args.messageId,
          embedIndex: args.embedIndex,
          messageUrl: message.url,
        };

        // Propriétés principales
        if (embed.title) details.title = embed.title;
        if (embed.description) details.description = embed.description;
        if (embed.color) details.color = embed.color.toString(16).padStart(6, '0');
        if (embed.url) details.url = embed.url;

        // Author
        if (embed.author) {
          details.authorName = embed.author.name;
          if (embed.author.url) details.authorUrl = embed.author.url;
          if (embed.author.iconURL) details.authorIcon = embed.author.iconURL;
        }

        // Images
        if (embed.thumbnail) details.thumbnail = embed.thumbnail.url;
        if (embed.image) details.image = embed.image.url;

        // Footer
        if (embed.footer) {
          details.footerText = embed.footer.text;
          if (embed.footer.iconURL) details.footerIcon = embed.footer.iconURL;
        }

        // Timestamp
        if (embed.timestamp) details.timestamp = embed.timestamp;

        // Fields
        if (embed.fields && embed.fields.length > 0) {
          details.fields = embed.fields.map(f => ({
            name: f.name,
            value: f.value,
            inline: f.inline,
          }));
        }

        // Components (boutons)
        if (message.components.length > 0) {
          details.components = [];
          message.components.forEach((row: any) => {
            row.components.forEach((component: any) => {
              if (component.componentType === 2) {
                // Button
                details.components.push({
                  type: 'button',
                  label: component.label,
                  style: ['Primary', 'Secondary', 'Success', 'Danger'][component.style],
                  emoji: component.emoji?.name,
                  customId: component.customId,
                });
              }
            });
          });
        }

        // Formater en JSON pour faciliter la réutilisation
        return `📋 **DÉTAILS DE L'EMBED**
Message ID: \`${details.messageId}\`
Message URL: ${details.messageUrl}

\`\`\`json
${JSON.stringify(details, null, 2)}
\`\`\`

💡 **Copiez ces données et modifiez-les, puis utilisez \`update_embed\` pour appliquer les changements.**
`;
      } catch (error: any) {
        return `❌ Erreur: ${error.message}`;
      }
    },
  });

  // ============================================================================
  // 3. METTRE À JOUR UN EMBED
  // ============================================================================
  server.addTool({
    name: 'update_embed',
    description:
      "Modifie un embed existant. Permet de changer le titre, description, couleur, les 4 positions d'images (authorIcon, thumbnail, image, footerIcon), d'ajouter/modifier des champs, et d'ajouter/modifier des boutons. Peut aussi appliquer un thème prédéfini.\n\n⚡ MENTIONS DISCORD: title/authorName/footerText NE supportent PAS les mentions. description SUPPORTE les mentions (<@ID>, <@!ID>, <#ID>, <@&ID>).",
    parameters: z.object({
      channelId: z.string().describe('ID du canal Discord'),
      messageId: z.string().describe("ID du message contenant l'embed à modifier"),
      embedIndex: z.number().optional().default(0).describe("Index de l'embed (défaut: 0)"),
      title: z.string().optional().describe('Nouveau titre (NE supporte PAS les mentions Discord)'),
      description: z
        .string()
        .optional()
        .describe(
          'Nouvelle description (SUPPORTE les mentions Discord: <@USER_ID>, <@!USER_ID>, <#CHANNEL_ID>, <@&ROLE_ID>)'
        ),
      color: z.string().optional().describe('Nouvelle couleur en hex (#RRGGBB)'),
      url: z.string().optional().describe('Nouvelle URL cliquable'),
      authorName: z
        .string()
        .optional()
        .describe('⚠️ NE supporte PAS les mentions Discord. Utilisez un simple texte.'),
      authorUrl: z.string().optional().describe("Nouvelle URL d'auteur"),
      authorIcon: z.string().optional().describe("Nouvelle icône d'auteur (PETITE - haut-gauche)"),
      thumbnail: z.string().optional().describe('Nouvelle thumbnail (MOYENNE - haut-droite)'),
      image: z.string().optional().describe('Nouvelle image (GRANDE - bas)'),
      footerText: z
        .string()
        .optional()
        .describe('⚠️ NE supporte PAS les mentions Discord. Utilisez un simple texte.'),
      footerIcon: z.string().optional().describe('Nouvelle icône footer (PETITE - bas-gauche)'),
      fields: z
        .array(
          z.object({
            name: z.string(),
            value: z.string(),
            inline: z.boolean().optional().default(false),
          })
        )
        .optional()
        .describe('Nouveaux champs (remplace les existants si fourni)'),
      appendFields: z
        .array(
          z.object({
            name: z.string(),
            value: z.string(),
            inline: z.boolean().optional().default(false),
          })
        )
        .optional()
        .describe('Ajoute des champs aux existants'),
      clearFields: z
        .boolean()
        .optional()
        .default(false)
        .describe('Supprimer tous les champs existants'),
      clearComponents: z
        .boolean()
        .optional()
        .default(false)
        .describe('Supprimer tous les boutons existants'),
      buttons: z
        .array(
          z.object({
            label: z.string(),
            style: z.enum(['Primary', 'Secondary', 'Success', 'Danger']),
            emoji: z.string().optional(),
            action: z.enum([
              'none',
              'refresh',
              'link',
              'custom',
              'delete',
              'edit',
              'role',
              'modal',
              'message',
              'embed',
            ]),
            value: z.string().optional(),
            roleId: z.string().optional(),
            custom_id: z.string().optional().describe('🔒 ID personnalisé (fortement recommandé)'),
            persistent: z
              .boolean()
              .optional()
              .default(false)
              .describe('Si true, le bouton est sauvegardé et hooké aux handlers persistants'),
            customData: z
              .object({
                message: z.string().optional(),
                ephemeral: z.boolean().optional(),
                embed: z
                  .object({
                    title: z.string().optional(),
                    description: z.string().optional(),
                    color: z.number().optional(),
                  })
                  .optional(),
              })
              .optional(),
          })
        )
        .max(5)
        .optional()
        .describe('Nouveaux boutons (remplace les existants si fourni)'),
      selectMenus: z
        .array(
          z.object({
            custom_id: z.string().optional().describe('🔒 ID personnalisé (fortement recommandé)'),
            type: z.enum(['string', 'user', 'role', 'channel', 'mentionable']).default('string'),
            placeholder: z.string().optional(),
            minValues: z.number().optional().default(1),
            maxValues: z.number().optional().default(1),
            options: z
              .array(
                z.object({
                  label: z.string(),
                  value: z.string(),
                  description: z.string().optional(),
                  emoji: z.string().optional(),
                })
              )
              .optional()
              .describe('Options pour type=string'),
            action: z
              .enum([
                'message',
                'embed',
                'role',
                'delete',
                'refresh',
                'link',
                'edit',
                'custom',
                'modal',
              ])
              .default('message'),
            roleId: z.string().optional().describe('ID du rôle pour action role'),
            url: z.string().optional().describe('URL pour action link'),
            content: z.string().optional().describe('Contenu du message pour action message'),
            template: z.string().optional().describe('Template avec {values} et {user}'),
            persistent: z
              .boolean()
              .optional()
              .default(false)
              .describe('Si true, le menu est sauvegardé dans dist/data/'),
            customData: z
              .object({
                embed: z
                  .object({
                    title: z.string().optional(),
                    description: z.string().optional(),
                    color: z.number().optional(),
                  })
                  .optional(),
                handler: z.string().optional().describe('Handler pour action custom'),
                modalId: z.string().optional().describe('ID du modal pour action modal'),
              })
              .optional(),
          })
        )
        .max(5)
        .optional()
        .describe('Nouveaux menus de sélection (remplace les existants si fourni)'),
      theme: z
        .enum(['cyberpunk', 'minimal', 'gaming', 'corporate', 'sunset', 'ocean', 'noel'])
        .optional()
        .describe('Appliquer un thème prédéfini'),
      timestamp: z.boolean().optional().describe('Ajouter/mettre à jour le timestamp'),
    }),
    execute: async args => {
      try {
        const client = await ensureDiscordConnection();
        const channel = await client.channels.fetch(args.channelId);

        if (!channel || !('messages' in channel)) {
          return `❌ Canal invalide ou inaccessible`;
        }

        const message = await channel.messages.fetch(args.messageId);

        if (!message || message.embeds.length === 0) {
          return `❌ Message sans embed introuvable`;
        }

        const originalEmbed = message.embeds[args.embedIndex];
        if (!originalEmbed) {
          return `❌ Embed introuvable à l'index ${args.embedIndex}`;
        }

        // Créer le nouvel embed à partir de l'original
        const embedData = originalEmbed.toJSON();

        // Appliquer le thème si demandé
        if (args.theme) {
          const themedData = applyTheme(args.theme, {});
          if (themedData.color && !args.color) args.color = themedData.color;
        }

        // Mise à jour des propriétés de base
        if (args.title) embedData.title = args.title;
        if (args.description) embedData.description = args.description;
        if (args.color) {
          const colorHex = args.color.replace('#', '');
          embedData.color = parseInt(colorHex, 16);
        }
        if (args.url) embedData.url = args.url;

        // ============================================================================
        // VALIDATION DES MENTIONS DISCORD
        // ============================================================================
        // Valider les mentions dans title et description
        if (args.title) {
          const validation = validateDiscordMentions(args.title);
          if (!validation.valid) {
            return generateMentionErrorMessage(validation, 'le titre');
          }
        }

        if (args.description) {
          const validation = validateDiscordMentions(args.description);
          if (!validation.valid) {
            return generateMentionErrorMessage(validation, 'la description');
          }
        }

        // ============================================================================
        // VÉRIFICATION DES URLs D'IMAGES - VALIDATION IDENTIQUE À creer_embed
        // ============================================================================

        // Vérifier thumbnail
        if (args.thumbnail) {
          if (!isLocalLogoUrl(args.thumbnail)) {
            return generateGuidanceMessage('thumbnail', args.thumbnail);
          }
        }

        // Vérifier image
        if (args.image) {
          if (!isLocalLogoUrl(args.image)) {
            return generateGuidanceMessage('image', args.image);
          }
        }

        // ============================================================================
        // CONVERSION AUTOMATIQUE SVG → PNG
        // Discord ne supporte pas les SVG, on les convertit automatiquement
        // ============================================================================

        // Collection des fichiers à attacher (PNG convertis depuis SVG)
        const attachmentsToUpload: Map<string, string> = new Map(); // attachmentName -> filePath

        // Convertir authorIcon SVG → PNG
        if (args.authorIcon && checkIsSvgUrl(args.authorIcon)) {
          Logger.info(`[UPDATE_EMBED] Converting authorIcon SVG to PNG: ${args.authorIcon}`);
          try {
            const pngData = await convertSvgUrlToPng(args.authorIcon, 64);
            args.authorIcon = pngData.attachmentUrl; // attachment://filename.png
            attachmentsToUpload.set(pngData.attachmentName, pngData.path);
            Logger.info(`[UPDATE_EMBED] authorIcon converted to: ${pngData.attachmentUrl}`);
          } catch (error: any) {
            Logger.error(`[UPDATE_EMBED] Failed to convert authorIcon:`, error);
            return `❌ Erreur lors de la conversion SVG→PNG pour authorIcon: ${error.message}`;
          }
        }

        // Convertir footerIcon SVG → PNG
        if (args.footerIcon && checkIsSvgUrl(args.footerIcon)) {
          Logger.info(`[UPDATE_EMBED] Converting footerIcon SVG to PNG: ${args.footerIcon}`);
          try {
            const pngData = await convertSvgUrlToPng(args.footerIcon, 64);
            args.footerIcon = pngData.attachmentUrl; // attachment://filename.png
            attachmentsToUpload.set(pngData.attachmentName, pngData.path);
            Logger.info(`[UPDATE_EMBED] footerIcon converted to: ${pngData.attachmentUrl}`);
          } catch (error: any) {
            Logger.error(`[UPDATE_EMBED] Failed to convert footerIcon:`, error);
            return `❌ Erreur lors de la conversion SVG→PNG pour footerIcon: ${error.message}`;
          }
        }

        // ============================================================================
        // VALIDATION DES DOMAINES DE CONFIANCE (après conversion SVG)
        // ============================================================================

        // Vérifier authorIcon (domaine de confiance)
        if (args.authorIcon) {
          if (!isLocalLogoUrl(args.authorIcon) && !args.authorIcon.startsWith('attachment://')) {
            return generateGuidanceMessage('authorIcon', args.authorIcon);
          }
        }

        // Vérifier footerIcon (domaine de confiance)
        if (args.footerIcon) {
          if (!isLocalLogoUrl(args.footerIcon) && !args.footerIcon.startsWith('attachment://')) {
            return generateGuidanceMessage('footerIcon', args.footerIcon);
          }
        }

        // Author
        if (args.authorName || args.authorIcon) {
          embedData.author = {
            name: args.authorName || embedData.author?.name || 'Auteur',
            icon_url: args.authorIcon || embedData.author?.icon_url,
            url: args.authorUrl || embedData.author?.url,
          };
        }

        // Images
        if (args.thumbnail) embedData.thumbnail = { url: args.thumbnail };
        if (args.image) embedData.image = { url: args.image };

        // Footer
        if (args.footerText || args.footerIcon) {
          embedData.footer = {
            text: args.footerText || embedData.footer?.text || ' ',
            icon_url: args.footerIcon || embedData.footer?.icon_url,
          };
        }

        // Timestamp
        if (args.timestamp === true) {
          embedData.timestamp = new Date().toISOString();
        } else if (args.timestamp === false) {
          delete embedData.timestamp;
        }

        // Fields
        if (args.clearFields) {
          embedData.fields = [];
        } else if (args.fields) {
          embedData.fields = args.fields.map(f => ({
            name: f.name || '',
            value: f.value || '',
            inline: f.inline || false,
          }));
        } else if (args.appendFields) {
          const currentFields = embedData.fields || [];
          embedData.fields = [
            ...currentFields,
            ...args.appendFields.map(f => ({
              name: f.name || '',
              value: f.value || '',
              inline: f.inline || false,
            })),
          ];
        }

        // Créer l'embed modifié
        const updatedEmbed = new EmbedBuilder(embedData);

        // Components (boutons)
        const components: any[] = [];
        const persistentButtonsInfo: string[] = [];

        if (!args.clearComponents && args.buttons && args.buttons.length > 0) {
          const styleMap: Record<string, ButtonStyle> = {
            Primary: ButtonStyle.Primary,
            Secondary: ButtonStyle.Secondary,
            Success: ButtonStyle.Success,
            Danger: ButtonStyle.Danger,
          };

          const row = new ActionRowBuilder<ButtonBuilder>();

          for (let i = 0; i < args.buttons.length; i++) {
            const btn = args.buttons[i];

            // Validation stricte de custom_id selon recommandation utilisateur
            if (!btn.custom_id && btn.action !== 'link') {
              throw new Error(
                `❌ Le paramètre 'custom_id' est OBLIGATOIRE pour le bouton "${btn.label}" (action: ${btn.action}).`
              );
            }

            const buttonId =
              btn.custom_id ||
              (btn.persistent
                ? `pb_${args.messageId}_${i}`
                : `embed_${Date.now()}_${btn.action}_${Math.random().toString(36).substr(2, 5)}`);

            const button = new ButtonBuilder()
              .setCustomId(buttonId)
              .setLabel(btn.label)
              .setStyle(styleMap[btn.style] || ButtonStyle.Primary);

            if (btn.emoji) button.setEmoji(btn.emoji);

            row.addComponents(button);

            // Sauvegarder les boutons persistants
            if (btn.persistent) {
              const persistentBtn: PersistentButton = {
                id: buttonId,
                messageId: args.messageId,
                channelId: args.channelId,
                embedIndex: args.embedIndex,
                label: btn.label,
                style: btn.style,
                emoji: btn.emoji,
                action: buildButtonAction(btn),
                createdAt: new Date().toISOString(),
              };

              await upsertPersistentButton(persistentBtn);
              persistentButtonsInfo.push(`\`🔒 ${buttonId}\` → ${btn.label}`);
            }
          }

          components.push(row);
        }

        // GESTION DES SELECT MENUS (y compris persistants)
        const persistentMenusInfo: string[] = [];

        if (!args.clearComponents && args.selectMenus && args.selectMenus.length > 0) {
          for (let menuIndex = 0; menuIndex < args.selectMenus.length; menuIndex++) {
            const menu = args.selectMenus[menuIndex];

            // Créer un ID unique pour le menu
            const menuId = menu.persistent
              ? `pm_${args.messageId}_${menuIndex}`
              : `embed_menu_${Date.now()}_${menu.action}_${Math.random().toString(36).substr(2, 5)}`;

            // Créer le menu selon le type
            let selectMenu: any;

            if (menu.type === 'string') {
              selectMenu = new StringSelectMenuBuilder()
                .setCustomId(menuId)
                .setPlaceholder(menu.placeholder || 'Sélectionnez une option')
                .setMinValues(menu.minValues ?? 1)
                .setMaxValues(menu.maxValues ?? 1);

              // Ajouter les options si fournies
              if (menu.options && menu.options.length > 0) {
                menu.options.forEach(opt => {
                  const option = new StringSelectMenuOptionBuilder()
                    .setLabel(opt.label)
                    .setValue(opt.value);

                  if (opt.description) option.setDescription(opt.description);
                  if (opt.emoji) option.setEmoji(opt.emoji);

                  (selectMenu as StringSelectMenuBuilder).addOptions(option);
                });
              }
            } else {
              // Pour les autres types (user, role, channel, mentionable)
              selectMenu = new StringSelectMenuBuilder()
                .setCustomId(menuId)
                .setPlaceholder(menu.placeholder || 'Sélectionnez')
                .setMinValues(menu.minValues ?? 1)
                .setMaxValues(menu.maxValues ?? 1);
            }

            const menuRow = new ActionRowBuilder<any>().addComponents(selectMenu);
            components.push(menuRow);

            // 🔒 MENU PERSISTANT → Sauvegarder dans dist/data/
            if (menu.persistent) {
              const persistentMenu: PersistentSelectMenu = {
                id: menuId,
                messageId: args.messageId,
                channelId: args.channelId,
                embedIndex: args.embedIndex,
                type: menu.type,
                placeholder: menu.placeholder,
                minValues: menu.minValues,
                maxValues: menu.maxValues,
                options: menu.options as any,
                action: buildMenuAction(menu),
                createdAt: new Date().toISOString(),
              };

              await upsertPersistentMenu(persistentMenu);
              persistentMenusInfo.push(`\`🔒 ${menuId}\` → ${menu.action}`);
            }
          }
        }

        // Préparer les fichiers attachment si des SVG ont été convertis
        const attachmentFiles =
          attachmentsToUpload.size > 0
            ? Array.from(attachmentsToUpload.entries()).map(([name, path]) => ({
                attachment: path,
                name: name,
              }))
            : undefined;

        // Effectuer la mise à jour
        await message.edit({
          embeds: [updatedEmbed],
          components: components.length > 0 ? components : args.clearComponents ? [] : undefined,
          files: attachmentFiles,
        });

        let response = `✅ **Embed mis à jour avec succès !**\n\n`;
        response += `📌 Message ID: \`${args.messageId}\`\n`;
        response += `🔗 Message URL: ${message.url}\n`;

        if (args.title) response += `📝 Nouveau titre: ${args.title}\n`;
        if (args.theme) response += `🎨 Thème appliqué: ${args.theme}\n`;
        if (args.buttons) {
          response += `🔘 ${args.buttons.length} bouton(s) configuré(s)\n`;
          if (persistentButtonsInfo.length > 0) {
            response += `\n🔒 **Boutons persistants (hookés):**\n`;
            persistentButtonsInfo.forEach(info => {
              response += `   ${info}\n`;
            });
            response += `\n💾 Données sauvegardées dans: \`dist/data/persistent-buttons.json\`\n`;
          }
        }
        if (args.selectMenus) {
          response += `📋 ${args.selectMenus.length} menu(s) configuré(s)\n`;
          if (persistentMenusInfo.length > 0) {
            response += `\n🔒 **Menus persistants (hookés):**\n`;
            persistentMenusInfo.forEach(info => {
              response += `   ${info}\n`;
            });
            response += `\n💾 Données sauvegardées dans: \`dist/data/persistent-menus.json\`\n`;
          }
        }
        if (args.clearFields) response += `🗑️ Champs supprimés\n`;
        if (args.clearComponents) response += `🗑️ Composants supprimés (boutons et menus)\n`;

        return response;
      } catch (error: any) {
        return `❌ Erreur: ${error.message}`;
      }
    },
  });

  Logger.info("[EDIT_EMBED] === FIN ENREGISTREMENT DES OUTILS D'ÉDITION D'EMBEDS ===");
}
