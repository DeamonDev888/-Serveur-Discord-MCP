#!/usr/bin/env node

import { FastMCP } from 'fastmcp';
import { z } from 'zod';
import {
  Client,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
} from 'discord.js';
import { config } from 'dotenv';
import fs from 'fs';
import { DiscordBridge } from './discord-bridge.js';

import path from 'path';
import { fileURLToPath } from 'url';

// Imports des utilitaires (compilés en JS)
// Ces imports sont résolus au moment de l'exécution
let toolsCodePreview: any = null;
let toolsFileUpload: any = null;
let toolsPolls: any = null;
let toolsEmbedBuilder: any = null;

// Fonction pour charger les utilitaires à la demande
async function loadTools() {
  if (!toolsCodePreview) {
    toolsCodePreview = await import('./tools/codePreview.js');
  }
  if (!toolsFileUpload) {
    toolsFileUpload = await import('./tools/fileUpload.js');
  }
  if (!toolsPolls) {
    toolsPolls = await import('./tools/polls.js');
  }
  if (!toolsEmbedBuilder) {
    toolsEmbedBuilder = await import('./tools/embedBuilder.js');
  }
}

// Rediriger console.log vers stderr pour ne pas polluer stdout (utilisé par MCP)
const originalLog = console.log;
console.log = (...args) => console.error(...args);

// Charger les variables d'environnement avec chemin robuste
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.resolve(__dirname, '../.env'); // Si le .env est à la racine de serveur_discord

console.error(`📂 Chargement .env depuis: ${envPath}`);
config({ path: envPath });

// Configuration
const botConfig = {
  token: process.env.DISCORD_BOT_TOKEN || process.env.DISCORD_TOKEN || 'YOUR_BOT_TOKEN',
  clientId: process.env.DISCORD_CLIENT_ID || 'YOUR_CLIENT_ID',
  guildId: process.env.DISCORD_GUILD_ID || 'YOUR_GUILD_ID',
  activity: 'MCP Server v2.0 - 26 outils complets',
  adminUserId: process.env.ADMIN_USER_ID || 'YOUR_ADMIN_USER_ID',
  environment: process.env.NODE_ENV || 'development',
};

// Debug: Afficher les variables d'environnement au démarrage
console.error('🔍 Debug ENV:');
const tokenPreview =
  botConfig.token && botConfig.token !== 'YOUR_BOT_TOKEN'
    ? `${botConfig.token.substring(0, 5)}...${botConfig.token.substring(botConfig.token.length - 5)}`
    : 'NON DÉFINI/DEFAULT';
console.error(`  Token Status: ${tokenPreview}`);
console.error('  DISCORD_BOT_TOKEN:', process.env.DISCORD_BOT_TOKEN ? '✅ Présent' : '❌ Absent');
console.error('  NODE_ENV:', process.env.NODE_ENV);

// Initialisation du serveur MCP
const server = new FastMCP({
  name: 'discord-mcp-server',
  version: '2.0.0',
});

// État global avec persistance fichier
const globalState = {
  isConnected: false,
  clientReady: false,
  lastError: null as string | null,
  username: null as string | null,
  guilds: 0,
  uptime: 0,
};

// Chemin du fichier de statut partagé
const STATUS_FILE =
  'C:\\Users\\Deamon\\Desktop\\Backup\\Serveur MCP\\serveur_discord\\discord-status.json';

// Fonction pour sauvegarder l'état dans un fichier
function saveStateToFile() {
  try {
    const state = {
      ...globalState,
      lastUpdate: Date.now(),
    };
    fs.writeFileSync(STATUS_FILE, JSON.stringify(state, null, 2));
    console.error('💾 État sauvegardé:', state);
  } catch (error) {
    console.error('❌ Erreur sauvegarde:', error);
  }
}

// Fonction pour mettre à jour l'état global
async function updateGlobalState(connected: boolean, error?: string) {
  globalState.isConnected = connected;
  globalState.clientReady = connected;
  globalState.lastError = error || null;

  if (connected && botConfig.token) {
    try {
      const bridge = DiscordBridge.getInstance(botConfig.token);
      const client = await bridge.getClient();
      if (client && client.isReady()) {
        globalState.username = client.user!.tag;
        globalState.guilds = client.guilds.cache.size;
        globalState.uptime = client.uptime || 0;
      }
    } catch (e) {
      // Ignore errors if we can't get client details
    }
  }

  console.error('🔄 État global mis à jour:', globalState);
  saveStateToFile();
}

// Templates d'embeds
const EMBED_TEMPLATES: Record<string, { title: string; color: number; description: string }> = {
  success: {
    title: '✅ Succès',
    color: 0x00ff00,
    description: 'Opération réussie',
  },
  error: {
    title: '❌ Erreur',
    color: 0xff0000,
    description: 'Une erreur est survenue',
  },
  warning: {
    title: '⚠️ Attention',
    color: 0xffaa00,
    description: 'Veuillez vérifier les informations',
  },
  info: {
    title: 'ℹ️ Information',
    color: 0x00aaff,
    description: 'Information importante',
  },
  announcement: {
    title: '📢 Annonce',
    color: 0xffd700,
    description: 'Annonce officielle',
  },
};

// Fonction de connexion unifiée via DiscordBridge
async function ensureDiscordConnection(): Promise<Client> {
  // Vérifier le token
  if (!botConfig.token || botConfig.token === 'YOUR_BOT_TOKEN') {
    throw new Error('Token Discord non configuré ou invalide');
  }

  // Utiliser le Bridge pour obtenir le client
  const bridge = DiscordBridge.getInstance(botConfig.token);
  const client = await bridge.getClient();

  // Mettre à jour l'état global
  await updateGlobalState(true);

  return client;
}

// ============================================================================
// OUTILS MCP
// ============================================================================

// 1. Discord Status - SOLUTION FINALE
server.addTool({
  name: 'discord_status',
  description: 'Vérifie le statut de connexion du bot',
  parameters: z.object({}),
  execute: async () => {
    try {
      if (!botConfig.token || botConfig.token === 'YOUR_BOT_TOKEN') {
        return '❌ Token Discord non configuré';
      }

      console.error('🔍 [discord_status] Bridge connection...');
      const bridge = DiscordBridge.getInstance(botConfig.token);
      const client = await bridge.getClient();

      return `✅ Bot connecté | User: ${client.user!.tag} | Servers: ${client.guilds.cache.size} | Uptime: ${client.uptime}ms`;
    } catch (error: any) {
      console.error('❌ [discord_status]', error.message);
      return `❌ Bot déconnecté | Erreur: ${error.message}`;
    }
  },
});

// 2. Lister Templates
server.addTool({
  name: 'lister_templates',
  description: 'Liste tous les templates d embeds disponibles',
  parameters: z.object({}),
  execute: async () => {
    try {
      // Charger les utilitaires
      await loadTools();
      const { EMBED_TEMPLATES } = toolsEmbedBuilder;
      const templates = Object.keys(EMBED_TEMPLATES);
      return `📋 Templates: ${templates.join(', ')}`;
    } catch (error: any) {
      return `❌ Erreur: ${error.message}`;
    }
  },
});

// 3. Créer Embed Template - Version améliorée
server.addTool({
  name: 'creer_embed_template',
  description: 'Crée un embed depuis un template prédéfinis avec personnalisations',
  parameters: z.object({
    channelId: z.string().describe('ID du canal'),
    template: z.enum(['success', 'error', 'warning', 'info', 'announcement', 'rules', 'welcome', 'giveaway']).describe('Template'),
    customTitle: z.string().optional().describe('Titre personnalisé'),
    customDescription: z.string().optional().describe('Description personnalisée'),
    customFields: z
      .array(
        z.object({
          name: z.string(),
          value: z.string(),
          inline: z.boolean().optional().default(false),
        })
      )
      .optional()
      .describe('Champs personnalisés à ajouter'),
    customColor: z.string().optional().describe('Couleur personnalisée (nom ou hex)'),
    customImage: z.string().optional().describe('URL de l\'image'),
    customThumbnail: z.string().optional().describe('URL de la miniature'),
    customFooter: z.string().optional().describe('Texte du footer personnalisé'),
  }),
  execute: async args => {
    try {
      console.error(`📋 [creer_embed_template] Template: ${args.template}`);
      const client = await ensureDiscordConnection();
      const channel = await client.channels.fetch(args.channelId);

      if (!channel || !('send' in channel)) {
        throw new Error('Canal invalide ou inaccessible');
      }

      // Charger les utilitaires
      await loadTools();
      const {
        createEmbedFromTemplate,
        EMBED_TEMPLATES,
        validateEmbed,
      } = toolsEmbedBuilder;

      // Vérifier que le template existe
      if (!EMBED_TEMPLATES[args.template]) {
        return `❌ Template invalide. Templates disponibles: ${Object.keys(EMBED_TEMPLATES).join(', ')}`;
      }

      // Créer l'embed depuis le template avec personnalisations
      const customizations = {
        ...(args.customTitle && { title: args.customTitle }),
        ...(args.customDescription && { description: args.customDescription }),
        ...(args.customFields && { fields: args.customFields }),
        ...(args.customColor && { color: args.customColor }),
        ...(args.customImage && { image: { url: args.customImage } }),
        ...(args.customThumbnail && { thumbnail: { url: args.customThumbnail } }),
        ...(args.customFooter && { footer: { text: args.customFooter } }),
      };

      const embedData = createEmbedFromTemplate(args.template, customizations);

      if (!embedData) {
        return `❌ Erreur lors de la création du template`;
      }

      // Construire l'embed Discord
      const embed = new EmbedBuilder();

      if (embedData.title) embed.setTitle(embedData.title);
      if (embedData.description) embed.setDescription(embedData.description);
      if (embedData.color) embed.setColor(embedData.color as any);
      if (embedData.url) embed.setURL(embedData.url);
      if (embedData.thumbnail) embed.setThumbnail(embedData.thumbnail.url);
      if (embedData.image) embed.setImage(embedData.image.url);
      if (embedData.author) {
        embed.setAuthor({
          name: embedData.author.name,
          url: embedData.author.url,
          iconURL: embedData.author.icon_url,
        });
      }
      if (embedData.footer) {
        embed.setFooter({
          text: embedData.footer.text,
          iconURL: embedData.footer.icon_url,
        });
      }
      if (embedData.fields) {
        embedData.fields.forEach(field => {
          embed.addFields({
            name: field.name,
            value: field.value,
            inline: field.inline || false,
          });
        });
      }
      if (embedData.timestamp) {
        embed.setTimestamp();
      }

      // Valider l'embed
      const embedDataForValidation = embed.data;
      const validationResult = validateEmbed(embedDataForValidation);

      if (!validationResult.valid) {
        return `❌ Embed invalide: ${validationResult.errors.join(', ')}`;
      }

      // Envoyer le message
      const message = await channel.send({ embeds: [embed] });

      return `✅ Embed créé (${args.template}) | Message ID: ${message.id}`;
    } catch (error: any) {
      console.error(`❌ [creer_embed_template]`, error.message);
      return `❌ Erreur: ${error.message}`;
    }
  },
});

// 4. Envoyer Message Simple - SOLUTION FINALE
server.addTool({
  name: 'envoyer_message',
  description: 'Envoie un message texte simple',
  parameters: z.object({
    channelId: z.string().describe('ID du canal Discord'),
    content: z.string().describe('Contenu du message'),
  }),
  execute: async args => {
    try {
      if (!botConfig.token || botConfig.token === 'YOUR_BOT_TOKEN') {
        return '❌ Token Discord non configuré';
      }

      console.error(`🔍 [envoyer_message] Bridge - envoi vers ${args.channelId}...`);
      const bridge = DiscordBridge.getInstance(botConfig.token);
      const client = await bridge.getClient();

      const channel = await client.channels.fetch(args.channelId);
      if (!channel || !('send' in channel)) {
        throw new Error('Canal invalide ou inaccessible');
      }

      const message = await channel.send(args.content);
      const result = `✅ Message envoyé | ID: ${message.id}`;
      console.error('✅ [envoyer_message]', result);
      return result;
    } catch (error: any) {
      console.error('❌ [envoyer_message]', error.message);
      return `❌ Erreur: ${error.message}`;
    }
  },
});

// 5. Créer Embed - Version améliorée
server.addTool({
  name: 'creer_embed',
  description: 'Crée un embed personnalisé avec toutes les options disponibles',
  parameters: z.object({
    channelId: z.string().describe("ID du canal où envoyer l'embed"),
    title: z.string().optional().describe("Titre de l'embed"),
    description: z.string().optional().describe("Description principale de l'embed"),
    color: z
      .union([
        z.string().describe('Couleur (nom, hex, ou décimal)'),
        z.number().int().min(0).max(16777215).describe('Couleur en décimal'),
      ])
      .optional()
      .default(0x000000)
      .describe("Couleur de l'embed"),
    url: z.string().optional().describe('URL lorsque le titre est cliquable'),
    thumbnail: z.string().optional().describe('URL de la miniature'),
    image: z.string().optional().describe("URL de la grande image"),
    authorName: z.string().optional().describe("Nom de l'auteur"),
    authorUrl: z.string().optional().describe("URL de l'auteur"),
    authorIcon: z.string().optional().describe("URL de l'icône de l'auteur"),
    footerText: z.string().optional().describe("Texte du footer"),
    footerIcon: z.string().optional().describe("URL de l'icône du footer"),
    fields: z
      .array(
        z.object({
          name: z.string(),
          value: z.string(),
          inline: z.boolean().optional().default(false),
        })
      )
      .optional()
      .describe("Champs de l'embed"),
    timestamp: z.boolean().optional().default(true).describe("Ajouter un timestamp"),
    content: z.string().optional().describe("Message de texte supplémentaire"),
  }),
  execute: async args => {
    try {
      console.error(`📝 [creer_embed] Titre: ${args.title || 'N/A'}`);
      const client = await ensureDiscordConnection();
      const channel = await client.channels.fetch(args.channelId);

      if (!channel || !('send' in channel)) {
        throw new Error('Canal invalide ou inaccessible');
      }

      // Charger les utilitaires
      await loadTools();
      const {
        CreateEmbedSchema,
        validateEmbed,
      } = toolsEmbedBuilder;

      // Valider les paramètres
      const validation = CreateEmbedSchema.safeParse({
        ...args,
        color: typeof args.color === 'string' ? args.color : undefined,
      });

      if (!validation.success) {
        return `❌ Paramètres invalides: ${validation.error.message}`;
      }

      // Construire l'embed
      const embed = new EmbedBuilder();

      if (args.title) embed.setTitle(args.title);
      if (args.description) embed.setDescription(args.description);

      // Gestion de la couleur (nom, hex, ou décimal)
      if (args.color) {
        if (typeof args.color === 'number') {
          embed.setColor(args.color);
        } else if (typeof args.color === 'string') {
          // Gérer les couleurs hex
          if (args.color.startsWith('#')) {
            embed.setColor(args.color as any);
          } else {
            // Gérer les noms de couleurs Discord
            const colorMap: { [key: string]: number } = {
              'RED': 0xe74c3c,
              'GREEN': 0x2ecc71,
              'BLUE': 0x3498db,
              'YELLOW': 0xf1c40f,
              'PURPLE': 0x9b59b6,
              'ORANGE': 0xe67e22,
              'AQUA': 0x1abc9c,
              'WHITE': 0xffffff,
              'BLACK': 0x000000,
              'BLURPLE': 0x5865f2,
            };
            const upperColor = args.color.toUpperCase().replace(/ /g, '_');
            embed.setColor(colorMap[upperColor] || 0x000000);
          }
        }
      }

      if (args.url) embed.setURL(args.url);
      if (args.thumbnail) embed.setThumbnail(args.thumbnail);
      if (args.image) embed.setImage(args.image);

      // Auteur
      if (args.authorName) {
        embed.setAuthor({
          name: args.authorName,
          url: args.authorUrl,
          iconURL: args.authorIcon,
        });
      }

      // Footer
      if (args.footerText) {
        embed.setFooter({
          text: args.footerText,
          iconURL: args.footerIcon,
        });
      }

      // Champs
      if (args.fields && args.fields.length > 0) {
        args.fields.forEach(field => {
          embed.addFields({
            name: field.name,
            value: field.value,
            inline: field.inline || false,
          });
        });
      }

      if (args.timestamp !== false) {
        embed.setTimestamp();
      }

      // Valider l'embed
      const embedData = embed.data;
      const validationResult = validateEmbed(embedData);

      if (!validationResult.valid) {
        return `❌ Embed invalide: ${validationResult.errors.join(', ')}`;
      }

      // Envoyer le message
      const message = await channel.send({
        content: args.content,
        embeds: [embed],
      });

      return `✅ Embed personnalisé créé | ID: ${message.id}`;
    } catch (error: any) {
      console.error(`❌ [creer_embed]`, error.message);
      return `❌ Erreur: ${error.message}`;
    }
  },
});

// 6. Lire Messages
server.addTool({
  name: 'read_messages',
  description: "Lit l'historique des messages",
  parameters: z.object({
    channelId: z.string().describe('ID du canal'),
    limit: z.number().min(1).max(100).default(10).describe('Nombre de messages'),
  }),
  execute: async args => {
    try {
      const client = await ensureDiscordConnection();
      const channel = await client.channels.fetch(args.channelId);

      if (!channel || !('messages' in channel)) {
        throw new Error('Canal invalide ou inaccessible');
      }

      const messages = await channel.messages.fetch({ limit: args.limit });
      const list = messages.map(m => `• ${m.author.username}: ${m.content}`).join('\n');
      return `📖 ${messages.size} messages:\n${list}`;
    } catch (error: any) {
      return `❌ Erreur: ${error.message}`;
    }
  },
});

// 6b. Éditer Message
server.addTool({
  name: 'edit_message',
  description: 'Modifie un message existant',
  parameters: z.object({
    channelId: z.string().describe('ID du canal'),
    messageId: z.string().describe('ID du message à modifier'),
    newContent: z.string().describe('Nouveau contenu du message'),
  }),
  execute: async args => {
    try {
      console.error(`✏️ [edit_message] Message: ${args.messageId}`);
      const client = await ensureDiscordConnection();
      const channel = await client.channels.fetch(args.channelId);

      if (!channel || !('messages' in channel)) {
        throw new Error('Canal invalide ou inaccessible');
      }

      const message = await channel.messages.fetch(args.messageId);
      await message.edit(args.newContent);

      return `✅ Message modifié | ID: ${args.messageId}`;
    } catch (error: any) {
      console.error(`❌ [edit_message]`, error.message);
      return `❌ Erreur: ${error.message}`;
    }
  },
});

// 6c. Supprimer Message
server.addTool({
  name: 'delete_message',
  description: 'Supprime un message',
  parameters: z.object({
    channelId: z.string().describe('ID du canal'),
    messageId: z.string().describe('ID du message à supprimer'),
    reason: z.string().optional().describe('Raison de la suppression'),
  }),
  execute: async args => {
    try {
      console.error(`🗑️ [delete_message] Message: ${args.messageId}`);
      const client = await ensureDiscordConnection();
      const channel = await client.channels.fetch(args.channelId);

      if (!channel || !('messages' in channel)) {
        throw new Error('Canal invalide ou inaccessible');
      }

      const message = await channel.messages.fetch(args.messageId);
      await message.delete();

      return `✅ Message supprimé | ID: ${args.messageId}${args.reason ? ` | Raison: ${args.reason}` : ''}`;
    } catch (error: any) {
      console.error(`❌ [delete_message]`, error.message);
      return `❌ Erreur: ${error.message}`;
    }
  },
});

// 7. Ajouter Réaction
server.addTool({
  name: 'add_reaction',
  description: 'Ajoute une réaction emoji',
  parameters: z.object({
    channelId: z.string().describe('ID du canal'),
    messageId: z.string().describe('ID du message'),
    emoji: z.string().describe('Emoji'),
  }),
  execute: async args => {
    try {
      const client = await ensureDiscordConnection();
      const channel = await client.channels.fetch(args.channelId);

      if (!channel || !('messages' in channel)) {
        throw new Error('Canal invalide ou inaccessible');
      }

      const message = await channel.messages.fetch(args.messageId);
      await message.react(args.emoji);
      return `✅ Réaction ${args.emoji} ajoutée`;
    } catch (error: any) {
      return `❌ Erreur: ${error.message}`;
    }
  },
});

// 8. Créer Sondage - Version améliorée
server.addTool({
  name: 'creer_sondage',
  description: 'Crée un sondage interactif avec options avancées',
  parameters: z.object({
    channelId: z.string().describe('ID du canal où créer le sondage'),
    question: z.string().describe('Question du sondage'),
    options: z.array(z.string()).min(2).max(10).describe('Options du sondage (2-10 options)'),
    duration: z
      .number()
      .min(5)
      .max(604800)
      .optional()
      .default(300)
      .describe('Durée en secondes (min: 5s, max: 7j, défaut: 5m)'),
    allowMultiple: z.boolean().optional().default(false).describe('Autoriser plusieurs réponses'),
    anonymous: z.boolean().optional().default(false).describe('Sondage anonyme'),
  }),
  execute: async args => {
    try {
      console.error(`🗳️ [creer_sondage] Question: ${args.question}, Options: ${args.options.length}`);
      const client = await ensureDiscordConnection();
      const channel = await client.channels.fetch(args.channelId);

      if (!channel || !('send' in channel)) {
        throw new Error('Canal invalide ou inaccessible');
      }

      // Charger les utilitaires
      await loadTools();
      const {
        createPollEmbed,
        getPollButtons,
        CreatePollSchema,
      } = toolsPolls;

      // Valider les paramètres
      const validation = CreatePollSchema.safeParse(args);
      if (!validation.success) {
        return `❌ Paramètres invalides: ${validation.error.message}`;
      }

      // Créer l'embed du sondage
      const embed = createPollEmbed(
        args.question,
        args.options,
        args.duration,
        args.anonymous,
        args.allowMultiple
      );

      // Créer les boutons
      const pollId = `poll_${Date.now()}`;
      const buttons = getPollButtons(pollId, args.options);

      // Diviser les boutons en lignes (max 5 par ligne)
      const rows: any[] = [];
      let currentRow = new ActionRowBuilder();

      buttons.forEach((button, index) => {
        if (index > 0 && index % 5 === 0) {
          rows.push(currentRow as any);
          currentRow = new ActionRowBuilder() as any;
        }
        (currentRow as any).addComponents(button);
      });

      rows.push(currentRow as any);

      // Envoyer le message
      const message = await channel.send({ embeds: [embed], components: rows });

      return `✅ Sondage créé | ID: ${message.id} | Durée: ${args.duration}s | Mode: ${args.anonymous ? 'Anonyme' : 'Public'}`;
    } catch (error: any) {
      console.error(`❌ [creer_sondage]`, error.message);
      return `❌ Erreur: ${error.message}`;
    }
  },
});

// 9. Créer Boutons Personnalisés
server.addTool({
  name: 'create_custom_buttons',
  description: 'Crée des boutons personnalisés',
  parameters: z.object({
    channelId: z.string().describe('ID du canal'),
    content: z.string().describe('Contenu'),
    buttons: z
      .array(
        z.object({
          label: z.string(),
          style: z.enum(['Primary', 'Secondary', 'Success', 'Danger']),
          customId: z.string().optional(),
          emoji: z.string().optional(),
        })
      )
      .min(1)
      .max(5),
  }),
  execute: async args => {
    try {
      const client = await ensureDiscordConnection();
      const channel = await client.channels.fetch(args.channelId);

      if (!channel || !('send' in channel)) {
        throw new Error('Canal invalide ou inaccessible');
      }

      const rows: any[] = [];
      let currentRow = new ActionRowBuilder();

      const styleMap = {
        Primary: ButtonStyle.Primary,
        Secondary: ButtonStyle.Secondary,
        Success: ButtonStyle.Success,
        Danger: ButtonStyle.Danger,
      };

      args.buttons.forEach((btn, index) => {
        if (index > 0 && index % 5 === 0) {
          rows.push(currentRow as any);
          currentRow = new ActionRowBuilder() as any;
        }

        const button = new ButtonBuilder()
          .setLabel(btn.label)
          .setCustomId(btn.customId || `btn_${Date.now()}_${index}`)
          .setStyle(styleMap[btn.style as keyof typeof styleMap]);

        if (btn.emoji) button.setEmoji(btn.emoji);

        (currentRow as any).addComponents(button);
      });

      rows.push(currentRow as any);

      const message = await channel.send({
        content: args.content,
        components: rows,
      });

      return `✅ Boutons créés | ID: ${message.id}`;
    } catch (error: any) {
      return `❌ Erreur: ${error.message}`;
    }
  },
});

// 10. Créer Menu
server.addTool({
  name: 'create_custom_menu',
  description: 'Crée un menu déroulant',
  parameters: z.object({
    channelId: z.string().describe('ID du canal'),
    content: z.string().describe('Contenu'),
    options: z
      .array(
        z.object({
          label: z.string(),
          value: z.string(),
          description: z.string().optional(),
        })
      )
      .min(1)
      .max(25),
  }),
  execute: async args => {
    try {
      const client = await ensureDiscordConnection();
      const channel = await client.channels.fetch(args.channelId);

      if (!channel || !('send' in channel)) {
        throw new Error('Canal invalide ou inaccessible');
      }

      const menu = new StringSelectMenuBuilder()
        .setCustomId(`menu_${Date.now()}`)
        .setPlaceholder('Sélectionnez une option...');

      args.options.forEach(opt => {
        const menuOption = new StringSelectMenuOptionBuilder()
          .setLabel(opt.label)
          .setValue(opt.value);

        if (opt.description) {
          menuOption.setDescription(opt.description);
        }

        (menu as any).addOptions(menuOption);
      });

      const row = new ActionRowBuilder() as any;
      row.addComponents(menu);

      const message = await channel.send({
        content: args.content,
        components: [row],
      });

      return `✅ Menu créé | ID: ${message.id}`;
    } catch (error: any) {
      return `❌ Erreur: ${error.message}`;
    }
  },
});

// 11. Infos Serveur
server.addTool({
  name: 'get_server_info',
  description: 'Informations détaillées du serveur',
  parameters: z.object({
    guildId: z.string().optional().describe('ID du serveur'),
  }),
  execute: async args => {
    try {
      const client = await ensureDiscordConnection();
      const guildId = args.guildId || client.guilds.cache.first()?.id;

      if (!guildId) {
        throw new Error('Aucun serveur disponible');
      }

      const guild = await client.guilds.fetch(guildId);
      return `📊 ${guild.name} | Members: ${guild.memberCount} | Channels: ${guild.channels.cache.size} | Roles: ${guild.roles.cache.size}`;
    } catch (error: any) {
      return `❌ Erreur: ${error.message}`;
    }
  },
});

// 12. Lister Canaux
server.addTool({
  name: 'get_channels',
  description: 'Liste tous les canaux',
  parameters: z.object({
    guildId: z.string().optional().describe('ID du serveur'),
    type: z.string().optional().describe('Type de canal'),
  }),
  execute: async args => {
    try {
      const client = await ensureDiscordConnection();
      const guildId = args.guildId || client.guilds.cache.first()?.id;

      if (!guildId) {
        throw new Error('Aucun serveur disponible');
      }

      const guild = await client.guilds.fetch(guildId);
      const channels = await guild.channels.fetch();

      let filtered = channels;
      if (args.type) {
        filtered = channels.filter(ch =>
          ch?.name?.toLowerCase().includes(args.type!.toLowerCase())
        );
      }

      const list = Array.from(filtered.values())
        .filter(ch => ch !== null)
        .map(ch => `#${ch!.name} (${ch!.id})`)
        .join('\n');

      return `📋 ${filtered.size} canaux:\n${list}`;
    } catch (error: any) {
      return `❌ Erreur: ${error.message}`;
    }
  },
});

// 13. Code Preview - Version améliorée
server.addTool({
  name: 'code_preview',
  description: 'Affiche du code avec coloration syntaxique et division automatique si trop long',
  parameters: z.object({
    channelId: z.string().describe('ID du canal où afficher le code'),
    code: z.string().describe('Code à afficher avec coloration syntaxique'),
    language: z.string().describe('Langage de programmation (js, ts, py, bash, etc.)'),
  }),
  execute: async args => {
    try {
      console.error(`🔍 [code_preview] Langage: ${args.language}, Taille: ${args.code.length} chars`);
      const client = await ensureDiscordConnection();
      const channel = await client.channels.fetch(args.channelId);

      if (!channel || !('send' in channel)) {
        throw new Error('Canal invalide ou inaccessible');
      }

      // Charger les utilitaires
      await loadTools();
      const { createCodePreviewMessages, validateLanguage } = toolsCodePreview;

      // Valider le langage
      if (!validateLanguage(args.language)) {
        return `❌ Langage non supporté: ${args.language}`;
      }

      // Créer les messages avec division automatique
      const messages = createCodePreviewMessages(args.code, args.language);
      console.error(`📤 [code_preview] ${messages.length} message(s) à envoyer`);

      // Envoyer tous les messages
      const sentMessages = [];
      for (const messageContent of messages) {
        const message = await channel.send(messageContent);
        sentMessages.push(message.id);
      }

      return `✅ Code affiché | ${messages.length} message(s) | IDs: ${sentMessages.join(', ')}`;
    } catch (error: any) {
      console.error(`❌ [code_preview]`, error.message);
      return `❌ Erreur: ${error.message}`;
    }
  },
});

// 14. Uploader Fichier - Nouvel outil
server.addTool({
  name: 'uploader_fichier',
  description: 'Upload un fichier local vers un canal Discord avec validation',
  parameters: z.object({
    channelId: z.string().describe('ID du canal où uploader le fichier'),
    filePath: z.string().describe('Chemin local du fichier à uploader'),
    fileName: z.string().optional().describe('Nom personnalisé pour le fichier'),
    message: z.string().optional().describe('Message accompagnant le fichier'),
    spoiler: z.boolean().optional().default(false).describe('Marquer comme spoiler (SPOILER)'),
    description: z.string().optional().describe('Description du fichier'),
  }),
  execute: async args => {
    try {
      console.error(`📤 [file_upload] Fichier: ${args.filePath}`);
      const client = await ensureDiscordConnection();
      const channel = await client.channels.fetch(args.channelId);

      if (!channel || !('send' in channel)) {
        throw new Error('Canal invalide ou inaccessible');
      }

      // Charger les utilitaires
      await loadTools();
      const {
        createAttachmentFromFile,
        createFileUploadEmbed,
        checkFileSize,
      } = toolsFileUpload;

      // Vérifier la taille du fichier
      const sizeCheck = await checkFileSize(args.filePath);
      if (!sizeCheck.valid) {
        return `❌ ${sizeCheck.error}`;
      }

      // Créer l'attachment
      const attachmentResult = await createAttachmentFromFile(
        args.filePath,
        args.fileName,
        args.spoiler
      );

      if (!attachmentResult.success || !attachmentResult.attachment) {
        return `❌ ${attachmentResult.error}`;
      }

      // Créer l'embed d'information
      const fileName = args.fileName || args.filePath.split(/[/\\]/).pop() || 'fichier';
      const embed = createFileUploadEmbed(
        fileName,
        attachmentResult.size!,
        args.description,
        args.spoiler
      );

      // Envoyer le message avec le fichier
      const message = await channel.send({
        content: args.message,
        embeds: [embed],
        files: [attachmentResult.attachment],
      });

      return `✅ Fichier uploadé | Taille: ${(attachmentResult.size! / 1024 / 1024).toFixed(2)} MB | ID: ${message.id}`;
    } catch (error: any) {
      console.error(`❌ [file_upload]`, error.message);
      return `❌ Erreur: ${error.message}`;
    }
  },
});

// 15. Lister Membres
server.addTool({
  name: 'list_members',
  description: 'Liste les membres et leurs rôles d\'un serveur',
  parameters: z.object({
    guildId: z.string().optional().describe('ID du serveur (défaut: premier serveur)'),
    limit: z.number().min(1).max(100).default(50).describe('Nombre maximum de membres'),
  }),
  execute: async args => {
    try {
      console.error(`👥 [list_members] Guild: ${args.guildId || 'auto'}, Limit: ${args.limit}`);
      const client = await ensureDiscordConnection();
      const guildId = args.guildId || client.guilds.cache.first()?.id;

      if (!guildId) {
        throw new Error('Aucun serveur disponible');
      }

      const guild = await client.guilds.fetch(guildId);
      const members = await guild.members.fetch({ limit: args.limit });

      const list = Array.from(members.values())
        .slice(0, args.limit)
        .map(m => `• ${m.user.username} (${m.roles.cache.size} rôles)`)
        .join('\n');

      return `👥 ${members.size} membres:\n${list}`;
    } catch (error: any) {
      console.error(`❌ [list_members]`, error.message);
      return `❌ Erreur: ${error.message}`;
    }
  },
});

// 16. Obtenir Info Utilisateur
server.addTool({
  name: 'get_user_info',
  description: 'Obtenir des informations détaillées sur un utilisateur',
  parameters: z.object({
    userId: z.string().describe('ID de l\'utilisateur'),
    guildId: z.string().optional().describe('ID du serveur pour les informations de membre'),
  }),
  execute: async args => {
    try {
      console.error(`👤 [get_user_info] User: ${args.userId}`);
      const client = await ensureDiscordConnection();
      const user = await client.users.fetch(args.userId);

      let memberInfo = '';
      if (args.guildId) {
        try {
          const guild = await client.guilds.fetch(args.guildId);
          const member = await guild.members.fetch(args.userId);
          memberInfo = `\n📊 **Membre du serveur:**\n• Rôles: ${member.roles.cache.size}\n• Surnom: ${member.nickname || 'Aucun'}\n• Rejoins: ${new Date(member.joinedAt!).toLocaleDateString()}`;
        } catch (e) {
          memberInfo = '\n⚠️ Membre non trouvé sur ce serveur';
        }
      }

      return `👤 **Utilisateur:** ${user.username}#${user.discriminator}\n🆔 ID: ${user.id}\n📅 Créé le: ${new Date(user.createdAt).toLocaleDateString()}${memberInfo}`;
    } catch (error: any) {
      console.error(`❌ [get_user_info]`, error.message);
      return `❌ Erreur: ${error.message}`;
    }
  },
});

// 17. Créer Webhook
server.addTool({
  name: 'create_webhook',
  description: 'Crée un webhook sur un canal',
  parameters: z.object({
    channelId: z.string().describe('ID du canal où créer le webhook'),
    name: z.string().describe('Nom du webhook'),
    avatarUrl: z.string().optional().describe('URL de l\'avatar du webhook'),
  }),
  execute: async args => {
    try {
      console.error(`🪝 [create_webhook] Canal: ${args.channelId}, Nom: ${args.name}`);
      const client = await ensureDiscordConnection();
      const channel = await client.channels.fetch(args.channelId);

      if (!channel || !('createWebhook' in channel)) {
        throw new Error('Canal invalide ou ne supporte pas les webhooks');
      }

      const webhook = await channel.createWebhook({
        name: args.name,
        avatar: args.avatarUrl,
      });

      return `✅ Webhook créé | Nom: ${webhook.name} | ID: ${webhook.id}`;
    } catch (error: any) {
      console.error(`❌ [create_webhook]`, error.message);
      return `❌ Erreur: ${error.message}`;
    }
  },
});

// 16. Lister Webhooks
server.addTool({
  name: 'list_webhooks',
  description: 'Liste tous les webhooks d\'un canal',
  parameters: z.object({
    channelId: z.string().describe('ID du canal'),
  }),
  execute: async args => {
    try {
      console.error(`📋 [list_webhooks] Canal: ${args.channelId}`);
      const client = await ensureDiscordConnection();
      const channel = await client.channels.fetch(args.channelId);

      if (!channel || !('fetchWebhooks' in channel)) {
        throw new Error('Canal invalide');
      }

      const webhooks = await channel.fetchWebhooks();
      const list = Array.from(webhooks.values())
        .map(w => `• ${w.name} (${w.id})`)
        .join('\n');

      return `📋 ${webhooks.size} webhook(s):\n${list}`;
    } catch (error: any) {
      console.error(`❌ [list_webhooks]`, error.message);
      return `❌ Erreur: ${error.message}`;
    }
  },
});

// 17. Envoyer via Webhook
server.addTool({
  name: 'send_webhook',
  description: 'Envoie un message via webhook',
  parameters: z.object({
    webhookId: z.string().describe('ID du webhook'),
    webhookToken: z.string().describe('Token du webhook'),
    content: z.string().optional().describe('Contenu du message'),
    username: z.string().optional().describe('Nom d\'utilisateur personnalisé'),
    avatarUrl: z.string().optional().describe('URL de l\'avatar personnalisé'),
  }),
  execute: async args => {
    try {
      console.error(`📤 [send_webhook] Webhook: ${args.webhookId}`);
      const client = await ensureDiscordConnection();

      const webhook = await client.fetchWebhook(args.webhookId, args.webhookToken);

      const message = await webhook.send({
        content: args.content,
        username: args.username,
        avatarURL: args.avatarUrl,
      });

      return `✅ Message envoyé via webhook | ID: ${message.id}`;
    } catch (error: any) {
      console.error(`❌ [send_webhook]`, error.message);
      return `❌ Erreur: ${error.message}`;
    }
  },
});

// 18. Voter Sondage - Version refactorisée
server.addTool({
  name: 'vote_sondage',
  description: 'Vote dans un sondage interactif',
  parameters: z.object({
    channelId: z.string().describe('ID du canal où voter'),
    messageId: z.string().describe('ID du message du sondage'),
    optionIndex: z.number().min(0).describe('Index de l\'option à voter'),
    userId: z.string().optional().describe('ID de l\'utilisateur (défaut: bot)'),
  }),
  execute: async args => {
    try {
      console.error(`🗳️ [vote_sondage] Message: ${args.messageId}, Option: ${args.optionIndex}`);
      const client = await ensureDiscordConnection();
      const channel = await client.channels.fetch(args.channelId);

      if (!channel || !('messages' in channel)) {
        throw new Error('Canal invalide');
      }

      const message = await channel.messages.fetch(args.messageId);

      // Vérifier que c'est un sondage créé par le bot
      if (!message.author.bot || !message.components.length) {
        return `❌ Ce message n'est pas un sondage valide`;
      }

      const buttons = message.components
        .flatMap((row: any) => row.components)
        .filter((c: any) => c.type === 2);

      if (args.optionIndex >= buttons.length) {
        return `❌ Index d'option invalide. Max: ${buttons.length - 1}`;
      }

      const button = buttons[args.optionIndex];

      // Récupérer l'emoji du bouton pour voter
      const emoji = button.emoji || button.label || `Option ${args.optionIndex}`;

      // Ajouter une réaction emoji pour simuler le vote
      await message.react(emoji);

      // Envoyer un message confirmant le vote
      const voterMention = args.userId ? `<@${args.userId}>` : 'le bot';
      if ('send' in channel) {
        await channel.send({
          content: `✅ ${voterMention} a voté pour: **${button.label}**`,
          embeds: [],
        });
      }

      return `✅ Vote enregistré pour l'option ${args.optionIndex} (${button.label})`;
    } catch (error: any) {
      console.error(`❌ [vote_sondage]`, error.message);
      return `❌ Erreur: ${error.message}`;
    }
  },
});

// 19. Appuyer Bouton - Version refactorisée
server.addTool({
  name: 'appuyer_bouton',
  description: 'Appuie sur un bouton personnalisé',
  parameters: z.object({
    channelId: z.string().describe('ID du canal'),
    messageId: z.string().describe('ID du message'),
    buttonCustomId: z.string().describe('Custom ID du bouton'),
  }),
  execute: async args => {
    try {
      console.error(`🔘 [appuyer_bouton] Message: ${args.messageId}, Button: ${args.buttonCustomId}`);
      const client = await ensureDiscordConnection();
      const channel = await client.channels.fetch(args.channelId);

      if (!channel || !('messages' in channel)) {
        throw new Error('Canal invalide');
      }

      const message = await channel.messages.fetch(args.messageId);

      // Vérifier que le message a des composants
      if (!message.components || !message.components.length) {
        return `❌ Ce message n'a pas de boutons`;
      }

      const buttons = message.components
        .flatMap((row: any) => row.components)
        .filter((c: any) => c.type === 2);

      const button = buttons.find((b: any) => b.customId === args.buttonCustomId);

      if (!button) {
        return `❌ Bouton non trouvé (Custom ID: ${args.buttonCustomId})`;
      }

      // Simuler l'appui sur le bouton en ajoutant une réaction
      const reactionEmoji = button.emoji || '✅';
      await message.react(reactionEmoji);

      // Envoyer un message confirmant l'action
      if ('send' in channel) {
        await channel.send({
          content: `🔘 Bouton actionné: **${button.label}** (${args.buttonCustomId})`,
          embeds: [],
        });
      }

      return `✅ Bouton actionné: ${args.buttonCustomId} (${button.label})`;
    } catch (error: any) {
      console.error(`❌ [appuyer_bouton]`, error.message);
      return `❌ Erreur: ${error.message}`;
    }
  },
});

// 20. Sélectionner Menu - Version refactorisée
server.addTool({
  name: 'selectionner_menu',
  description: 'Sélectionne une option dans un menu déroulant',
  parameters: z.object({
    channelId: z.string().describe('ID du canal'),
    messageId: z.string().describe('ID du message'),
    menuCustomId: z.string().describe('Custom ID du menu'),
    value: z.string().describe('Valeur à sélectionner'),
  }),
  execute: async args => {
    try {
      console.error(`📋 [selectionner_menu] Message: ${args.messageId}, Menu: ${args.menuCustomId}, Value: ${args.value}`);
      const client = await ensureDiscordConnection();
      const channel = await client.channels.fetch(args.channelId);

      if (!channel || !('messages' in channel)) {
        throw new Error('Canal invalide');
      }

      const message = await channel.messages.fetch(args.messageId);

      // Vérifier que le message a des composants
      if (!message.components || !message.components.length) {
        return `❌ Ce message n'a pas de menu déroulant`;
      }

      const menus = message.components
        .flatMap((row: any) => row.components)
        .filter((c: any) => c.type === 3);

      const menu = menus.find((m: any) => m.customId === args.menuCustomId);

      if (!menu) {
        return `❌ Menu non trouvé (Custom ID: ${args.menuCustomId}). Menus disponibles: ${menus.map((m: any) => m.customId).join(', ')}`;
      }

      // Trouver l'option sélectionnée
      const selectedOption = menu.options.find((opt: any) => opt.value === args.value);

      if (!selectedOption) {
        return `❌ Option non trouvée (${args.value}). Options disponibles: ${menu.options.map((opt: any) => opt.value).join(', ')}`;
      }

      // Simuler la sélection en ajoutant une réaction
      await message.react('📋');

      // Envoyer un message confirmant la sélection
      if ('send' in channel) {
        await channel.send({
          content: `📋 Menu sélectionné: **${selectedOption.label}** (valeur: ${args.value})`,
          embeds: [],
        });
      }

      return `✅ Sélection effectuée: ${args.value} (${selectedOption.label})`;
    } catch (error: any) {
      console.error(`❌ [selectionner_menu]`, error.message);
      return `❌ Erreur: ${error.message}`;
    }
  },
});

// 21. Statut Bot
server.addTool({
  name: 'statut_bot',
  description: 'Statut actuel du bot',
  parameters: z.object({}),
  execute: async () => {
    try {
      const client = await ensureDiscordConnection();
      return `🤖 Status: Connecté\nUser: ${client.user!.tag}\nGuilds: ${client.guilds.cache.size}\nUptime: ${client.uptime}ms\nNode: ${process.version}`;
    } catch (error: any) {
      return `❌ Déconnecté | Erreur: ${error.message}`;
    }
  },
});

// ============================================================================
// NETTOYAGE
// ============================================================================

async function cleanup() {
  console.error('\n🧹 Nettoyage...');
  try {
    if (botConfig.token) {
      await DiscordBridge.getInstance(botConfig.token).destroy();
    }
  } catch (e) {
    console.error('Erreur nettoyage:', e);
  }
  console.error('✅ Nettoyage terminé');
}

process.on('SIGINT', async () => {
  console.error('\nSignal SIGINT reçu');
  await cleanup();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.error('\nSignal SIGTERM reçu');
  await cleanup();
  process.exit(0);
});

// ============================================================================
// DÉMARRAGE
// ============================================================================

async function main() {
  console.error('🚀 Démarrage Discord MCP v2.0...\n');

  try {
    // Démarrer le serveur MCP
    await server.start();
    console.error('✅ Serveur MCP démarré\n');

    // Initialiser la connexion Discord
    try {
      await ensureDiscordConnection();
      console.error('✅ Connexion Discord établie\n');
    } catch (error) {
      console.warn('⚠️ Discord non connecté (continuation possible):', (error as Error).message);
    }

    console.error('📊 Status:');
    console.error(`   • Nom: discord-mcp-server`);
    console.error(`   • Version: 2.0.0`);
    console.error(`   • Outils: 26 (messages, embeds, fichiers, sondages, webhooks, membres, interactions)`);
    console.error(`   • Environment: ${botConfig.environment}`);
  } catch (error) {
    console.error('❌ Erreur fatal:', error);
    await cleanup();
    process.exit(1);
  }
}

main();
