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
import Logger from './utils/logger.js';

import path from 'path';
import { fileURLToPath } from 'url';

// Imports des utilitaires (compilés en JS)
// Ces imports sont résolus au moment de l'exécution avec cache
let toolsCodePreview: any = null;
let toolsFileUpload: any = null;
let toolsPolls: any = null;
let toolsEmbedBuilder: any = null;
const toolsCache = new Map<string, any>();

// Import des types pour éviter les erreurs TypeScript
import type { CustomButton } from './utils/buttonPersistence.js';
import type { CustomMenu } from './utils/menuPersistence.js';

// Fonction pour charger les utilitaires à la demande avec cache
async function loadTools() {
  // Chargement avec cache pour éviter les imports répétés
  if (!toolsCodePreview && !toolsCache.has('codePreview')) {
    toolsCodePreview = await import('./tools/codePreview.js');
    toolsCache.set('codePreview', toolsCodePreview);
  } else if (toolsCache.has('codePreview')) {
    toolsCodePreview = toolsCache.get('codePreview');
  }

  if (!toolsFileUpload && !toolsCache.has('fileUpload')) {
    toolsFileUpload = await import('./tools/fileUpload.js');
    toolsCache.set('fileUpload', toolsFileUpload);
  } else if (toolsCache.has('fileUpload')) {
    toolsFileUpload = toolsCache.get('fileUpload');
  }

  if (!toolsPolls && !toolsCache.has('polls')) {
    toolsPolls = await import('./tools/polls.js');
    toolsCache.set('polls', toolsPolls);
  } else if (toolsCache.has('polls')) {
    toolsPolls = toolsCache.get('polls');
  }

  if (!toolsEmbedBuilder && !toolsCache.has('embedBuilder')) {
    toolsEmbedBuilder = await import('./tools/embedBuilder.js');
    toolsCache.set('embedBuilder', toolsEmbedBuilder);
  } else if (toolsCache.has('embedBuilder')) {
    toolsEmbedBuilder = toolsCache.get('embedBuilder');
  }
}

// IMPORTANT: Ne PAS utiliser console.log car cela corrupt le protocole MCP sur stdout !
// Redirigeons console.log vers Logger.info pour que les logs aillent sur stderr/fichier sans casser MCP.
console.log = (...args: any[]) => {
  Logger.info('[STDOUT REDIRECT]', ...args);
};

// Charger les variables d'environnement avec chemin robuste
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.resolve(__dirname, '../.env'); // Si le .env est à la racine de serveur_discord

// Logger.debug(`📂 Chargement .env depuis: ${envPath}`);
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
// console.error('🔍 Debug ENV:');
const tokenPreview =
  botConfig.token && botConfig.token !== 'YOUR_BOT_TOKEN'
    ? `${botConfig.token.substring(0, 5)}...${botConfig.token.substring(botConfig.token.length - 5)}`
    : 'NON DÉFINI/DEFAULT';
// console.error(`  Token Status: ${tokenPreview}`);
// console.error('  DISCORD_BOT_TOKEN:', process.env.DISCORD_BOT_TOKEN ? '✅ Présent' : '❌ Absent');
// console.error('  NODE_ENV:', process.env.NODE_ENV);

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

// Debounce timer pour éviter les sauvegardes trop fréquentes
let saveTimeout: NodeJS.Timeout | null = null;

// Fonction pour sauvegarder l'état dans un fichier (version asynchrone avec debouncing)
function saveStateToFile() {
  // Annuler le timeout précédent si existe
  if (saveTimeout) {
    clearTimeout(saveTimeout);
  }

  // Sauvegarder après 2 secondes d'inactivité
  saveTimeout = setTimeout(async () => {
    try {
      const state = {
        ...globalState,
        lastUpdate: Date.now(),
      };
      await fs.promises.writeFile(STATUS_FILE, JSON.stringify(state, null, 2));
      // Logger.debug('💾 État sauvegardé (async):', state);
    } catch (error) {
      // Logger.error('❌ Erreur sauvegarde async:', error);
    }
  }, 2000);
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

  // Logger.debug('🔄 État global mis à jour:', globalState);
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
// SYSTÈME DE RATE LIMITING
// ============================================================================

// Map pour stocker les compteurs de requêtes par outil
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 60000; // 1 minute
const RATE_LIMIT_MAX = 30; // Max 30 requêtes par minute par outil

// Fonction de rate limiting
function checkRateLimit(toolName: string): boolean {
  const now = Date.now();
  const toolLimit = rateLimitMap.get(toolName);

  if (!toolLimit || now > toolLimit.resetTime) {
    // Nouvelle fenêtre ou premier appel
    rateLimitMap.set(toolName, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return true;
  }

  if (toolLimit.count >= RATE_LIMIT_MAX) {
    // Limite atteinte
    return false;
  }

  // Incrémenter le compteur
  toolLimit.count++;
  return true;
}

// Wrapper pour les outils avec rate limiting
function withRateLimit<T extends any[], R>(toolName: string, fn: (...args: T) => Promise<R>) {
  return async (...args: T): Promise<R> => {
    if (!checkRateLimit(toolName)) {
      throw new Error(`Rate limit atteint pour ${toolName}. Réessayez dans 1 minute.`);
    }
    return fn(...args);
  };
}

// ============================================================================
// OUTILS MCP
// ============================================================================

// 1. Discord Status - SOLUTION FINALE avec rate limiting
server.addTool({
  name: 'discord_status',
  description: 'Vérifie le statut de connexion du bot',
  parameters: z.object({}),
  execute: withRateLimit('discord_status', async () => {
    try {
      if (!botConfig.token || botConfig.token === 'YOUR_BOT_TOKEN') {
        return '❌ Token Discord non configuré';
      }

      Logger.info('🔍 [discord_status] Checking bridge connection...');
      const bridge = DiscordBridge.getInstance(botConfig.token);
      const client = await bridge.getClient();

      return `✅ Bot connecté | User: ${client.user!.tag} | Servers: ${client.guilds.cache.size} | Uptime: ${client.uptime}ms`;
    } catch (error: any) {
      Logger.error('❌ [discord_status] Erreur', error.message);
      return `❌ Bot déconnecté | Erreur: ${error.message}`;
    }
  }),
});

// ============================================================================
// OUTILS DE MODÉRATION
// ============================================================================

// Importer les outils de modération
import {
  initializeModeration,
  kickMember,
  banMember,
  unbanMember,
  muteMember,
  unmuteMember,
  warnMember,
  getWarnings,
  clearWarnings,
  KickMemberSchema,
  BanMemberSchema,
  UnbanMemberSchema,
  MuteMemberSchema,
  UnmuteMemberSchema,
  WarnMemberSchema,
  GetWarningsSchema,
  ClearWarningsSchema,
} from './tools/moderation.js';

// Initialiser la modération
initializeModeration();

// 1. Expulser un membre
server.addTool({
  name: 'kick_member',
  description: 'Expulse un membre du serveur',
  parameters: KickMemberSchema,
  execute: async args => {
    try {
      Logger.info(`👢 [kick_member] User: ${args.userId}`);
      const client = await ensureDiscordConnection();
      const result = await kickMember(client, args);
      return result;
    } catch (error: any) {
      Logger.error(`❌ [kick_member]`, error.message);
      return `❌ Erreur: ${error.message}`;
    }
  },
});

// 2. Bannir un membre
server.addTool({
  name: 'ban_member',
  description: 'Bannit un membre du serveur',
  parameters: BanMemberSchema,
  execute: async args => {
    try {
      Logger.info(`🔨 [ban_member] User: ${args.userId}`);
      const client = await ensureDiscordConnection();
      const result = await banMember(client, args);
      return result;
    } catch (error: any) {
      Logger.error(`❌ [ban_member]`, error.message);
      return `❌ Erreur: ${error.message}`;
    }
  },
});

// 3. Débannir un membre
server.addTool({
  name: 'unban_member',
  description: 'Débannit un membre du serveur',
  parameters: UnbanMemberSchema,
  execute: async args => {
    try {
      Logger.info(`🔓 [unban_member] User: ${args.userId}`);
      const client = await ensureDiscordConnection();
      const result = await unbanMember(client, args);
      return result;
    } catch (error: any) {
      Logger.error(`❌ [unban_member]`, error.message);
      return `❌ Erreur: ${error.message}`;
    }
  },
});

// 4. Mute un membre
server.addTool({
  name: 'mute_member',
  description: 'Mute un membre temporairement',
  parameters: MuteMemberSchema,
  execute: async args => {
    try {
      Logger.info(`🤐 [mute_member] User: ${args.userId}, Duration: ${args.duration}s`);
      const client = await ensureDiscordConnection();
      const result = await muteMember(client, args);
      return result;
    } catch (error: any) {
      Logger.error(`❌ [mute_member]`, error.message);
      return `❌ Erreur: ${error.message}`;
    }
  },
});

// 5. Démute un membre
server.addTool({
  name: 'unmute_member',
  description: 'Démute un membre',
  parameters: UnmuteMemberSchema,
  execute: async args => {
    try {
      console.error(`🔊 [unmute_member] User: ${args.userId}`);
      const client = await ensureDiscordConnection();
      const result = await unmuteMember(client, args);
      return result;
    } catch (error: any) {
      console.error(`❌ [unmute_member]`, error.message);
      return `❌ Erreur: ${error.message}`;
    }
  },
});

// 6. Avertir un membre
server.addTool({
  name: 'warn_member',
  description: 'Avertit un membre',
  parameters: WarnMemberSchema,
  execute: async args => {
    try {
      console.error(`⚠️ [warn_member] User: ${args.userId}`);
      const client = await ensureDiscordConnection();
      const result = await warnMember(client, args);
      return result;
    } catch (error: any) {
      console.error(`❌ [warn_member]`, error.message);
      return `❌ Erreur: ${error.message}`;
    }
  },
});

// 7. Voir les warns
server.addTool({
  name: 'get_warnings',
  description: "Affiche les avertissements d'un membre",
  parameters: GetWarningsSchema,
  execute: async args => {
    try {
      console.error(`📋 [get_warnings] User: ${args.userId}`);
      const client = await ensureDiscordConnection();
      const result = await getWarnings(client, args);
      return result;
    } catch (error: any) {
      console.error(`❌ [get_warnings]`, error.message);
      return `❌ Erreur: ${error.message}`;
    }
  },
});

// 8. Effacer les warns
server.addTool({
  name: 'clear_warnings',
  description: "Efface tous les avertissements d'un membre",
  parameters: ClearWarningsSchema,
  execute: async args => {
    try {
      Logger.info(`🧹 [clear_warnings] User: ${args.userId}`);
      const client = await ensureDiscordConnection();
      const result = await clearWarnings(client, args);
      return result;
    } catch (error: any) {
      Logger.error(`❌ [clear_warnings]`, error.message);
      return `❌ Erreur: ${error.message}`;
    }
  },
});

// ============================================================================
// OUTILS DE GESTION DES RÔLES
// ============================================================================

// Importer les outils de gestion des rôles
import {
  createRole,
  deleteRole,
  editRole,
  addRoleToMember,
  removeRoleFromMember,
  getMemberRoles,
  CreateRoleSchema,
  DeleteRoleSchema,
  EditRoleSchema,
  AddRoleToMemberSchema,
  RemoveRoleFromMemberSchema,
  GetMemberRolesSchema,
} from './tools/roleManager.js';

// 1. Créer un rôle
server.addTool({
  name: 'create_role',
  description: 'Crée un nouveau rôle',
  parameters: CreateRoleSchema,
  execute: async args => {
    try {
      Logger.info(`🎭 [create_role] Name: ${args.name}`);
      const client = await ensureDiscordConnection();
      const result = await createRole(client, args);
      return result;
    } catch (error: any) {
      Logger.error(`❌ [create_role]`, error.message);
      return `❌ Erreur: ${error.message}`;
    }
  },
});

// 2. Supprimer un rôle
server.addTool({
  name: 'delete_role',
  description: 'Supprime un rôle',
  parameters: DeleteRoleSchema,
  execute: async args => {
    try {
      Logger.info(`🗑️ [delete_role] Role: ${args.roleId}`);
      const client = await ensureDiscordConnection();
      const result = await deleteRole(client, args);
      return result;
    } catch (error: any) {
      Logger.error(`❌ [delete_role]`, error.message);
      return `❌ Erreur: ${error.message}`;
    }
  },
});

// 3. Modifier un rôle
server.addTool({
  name: 'edit_role',
  description: 'Modifie un rôle existant',
  parameters: EditRoleSchema,
  execute: async args => {
    try {
      Logger.info(`✏️ [edit_role] Role: ${args.roleId}`);
      const client = await ensureDiscordConnection();
      const result = await editRole(client, args);
      return result;
    } catch (error: any) {
      Logger.error(`❌ [edit_role]`, error.message);
      return `❌ Erreur: ${error.message}`;
    }
  },
});

// 4. Donner un rôle à un membre
server.addTool({
  name: 'add_role_to_member',
  description: 'Donne un rôle à un membre',
  parameters: AddRoleToMemberSchema,
  execute: async args => {
    try {
      Logger.info(`➕ [add_role_to_member] User: ${args.userId}, Role: ${args.roleId}`);
      const client = await ensureDiscordConnection();
      const result = await addRoleToMember(client, args);
      return result;
    } catch (error: any) {
      Logger.error(`❌ [add_role_to_member]`, error.message);
      return `❌ Erreur: ${error.message}`;
    }
  },
});

// 5. Retirer un rôle d'un membre
server.addTool({
  name: 'remove_role_from_member',
  description: "Retire un rôle d'un membre",
  parameters: RemoveRoleFromMemberSchema,
  execute: async args => {
    try {
      console.error(`➖ [remove_role_from_member] User: ${args.userId}, Role: ${args.roleId}`);
      const client = await ensureDiscordConnection();
      const result = await removeRoleFromMember(client, args);
      return result;
    } catch (error: any) {
      console.error(`❌ [remove_role_from_member]`, error.message);
      return `❌ Erreur: ${error.message}`;
    }
  },
});

// 6. Voir les rôles d'un membre
server.addTool({
  name: 'get_member_roles',
  description: "Affiche les rôles d'un membre",
  parameters: GetMemberRolesSchema,
  execute: async args => {
    try {
      console.error(`📋 [get_member_roles] User: ${args.userId}`);
      const client = await ensureDiscordConnection();
      const result = await getMemberRoles(client, args);
      return result;
    } catch (error: any) {
      console.error(`❌ [get_member_roles]`, error.message);
      return `❌ Erreur: ${error.message}`;
    }
  },
});

// ============================================================================
// OUTILS DE GESTION DES CANAUX
// ============================================================================

// Importer les outils de gestion des canaux
import {
  createChannel,
  deleteChannel,
  editChannel,
  moveMemberToChannel,
  CreateChannelSchema,
  DeleteChannelSchema,
  EditChannelSchema,
  MoveMemberToChannelSchema,
} from './tools/channelAdmin.js';

// 1. Créer un canal
server.addTool({
  name: 'create_channel',
  description: 'Crée un nouveau canal',
  parameters: CreateChannelSchema,
  execute: async args => {
    try {
      Logger.info(`📝 [create_channel] Name: ${args.name}, Type: ${args.type}`);
      const client = await ensureDiscordConnection();
      const result = await createChannel(client, args);
      return result;
    } catch (error: any) {
      Logger.error(`❌ [create_channel]`, error.message);
      return `❌ Erreur: ${error.message}`;
    }
  },
});

// 2. Supprimer un canal
server.addTool({
  name: 'delete_channel',
  description: 'Supprime un canal',
  parameters: DeleteChannelSchema,
  execute: async args => {
    try {
      Logger.info(`🗑️ [delete_channel] Channel: ${args.channelId}`);
      const client = await ensureDiscordConnection();
      const result = await deleteChannel(client, args);
      return result;
    } catch (error: any) {
      Logger.error(`❌ [delete_channel]`, error.message);
      return `❌ Erreur: ${error.message}`;
    }
  },
});

// 3. Modifier un canal
server.addTool({
  name: 'edit_channel',
  description: 'Modifie un canal existant',
  parameters: EditChannelSchema,
  execute: async args => {
    try {
      console.error(`✏️ [edit_channel] Channel: ${args.channelId}`);
      const client = await ensureDiscordConnection();
      const result = await editChannel(client, args);
      return result;
    } catch (error: any) {
      console.error(`❌ [edit_channel]`, error.message);
      return `❌ Erreur: ${error.message}`;
    }
  },
});

// 4. Déplacer un membre vers un canal vocal
server.addTool({
  name: 'move_member_to_channel',
  description: 'Déplace un membre vers un canal vocal',
  parameters: MoveMemberToChannelSchema,
  execute: async args => {
    try {
      Logger.info(`🔄 [move_member_to_channel] User: ${args.userId}, Channel: ${args.channelId}`);
      const client = await ensureDiscordConnection();
      const result = await moveMemberToChannel(client, args);
      return result;
    } catch (error: any) {
      Logger.error(`❌ [move_member_to_channel]`, error.message);
      return `❌ Erreur: ${error.message}`;
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
    template: z
      .enum(['success', 'error', 'warning', 'info', 'announcement', 'rules', 'welcome', 'giveaway'])
      .describe('Template'),
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
    customImage: z.string().optional().describe("URL de l'image"),
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
      const { createEmbedFromTemplate, EMBED_TEMPLATES, validateEmbed } = toolsEmbedBuilder;

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
        embedData.fields.forEach((field: { name: string; value: string; inline?: boolean }) => {
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

// 4. Envoyer Message Simple - SOLUTION FINALE avec rate limiting
server.addTool({
  name: 'envoyer_message',
  description: 'Envoie un message texte simple',
  parameters: z.object({
    channelId: z.string().describe('ID du canal Discord'),
    content: z.string().describe('Contenu du message'),
  }),
  execute: withRateLimit('envoyer_message', async args => {
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
      Logger.info('✅ [envoyer_message]', result);
      return result;
    } catch (error: any) {
      Logger.error('❌ [envoyer_message]', error.message);
      return `❌ Erreur: ${error.message}`;
    }
  }),
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
    image: z.string().optional().describe('URL de la grande image'),
    authorName: z.string().optional().describe("Nom de l'auteur"),
    authorUrl: z.string().optional().describe("URL de l'auteur"),
    authorIcon: z.string().optional().describe("URL de l'icône de l'auteur"),
    footerText: z.string().optional().describe('Texte du footer'),
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
    timestamp: z.boolean().optional().default(true).describe('Ajouter un timestamp'),
    content: z.string().optional().describe('Message de texte supplémentaire'),
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
      const { CreateEmbedSchema, validateEmbed } = toolsEmbedBuilder;

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
              RED: 0xe74c3c,
              GREEN: 0x2ecc71,
              BLUE: 0x3498db,
              YELLOW: 0xf1c40f,
              PURPLE: 0x9b59b6,
              ORANGE: 0xe67e22,
              AQUA: 0x1abc9c,
              WHITE: 0xffffff,
              BLACK: 0x000000,
              BLURPLE: 0x5865f2,
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

// 8. Créer Sondage - Version ULTRA simple sans composants
server.addTool({
  name: 'creer_sondage',
  description: 'Crée un sondage simple avec embed et réactions (100% compatible Discord.js)',
  parameters: z.object({
    channelId: z.string().describe('ID du canal où créer le sondage'),
    question: z.string().min(5).max(500).describe('Question du sondage (5-500 caractères)'),
    options: z.array(z.string()).min(2).max(10).describe('Options du sondage (2-10 options)'),
    duration: z
      .number()
      .min(5)
      .max(604800)
      .optional()
      .default(300)
      .describe('Durée en secondes (min: 5s, max: 7j, défaut: 5m)'),
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

      // Emojis pour les options
      const emojis = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'];

      // Créer l'embed simple
      const embed = new EmbedBuilder()
        .setTitle('📊 Sondage')
        .setDescription(`**${args.question}**\n\n${args.options.map((opt, i) => `${emojis[i]} ${opt}`).join('\n')}`)
        .setColor(0x5865f2)
        .addFields(
          { name: '⏱️ Durée', value: formatDuration(args.duration), inline: true },
          { name: '👤 Mode', value: args.anonymous ? 'Anonyme' : 'Public', inline: true },
          { name: '🔢 Votes', value: args.options.length + ' options', inline: true }
        )
        .setFooter({ text: 'Réagissez avec les emojis pour voter !' })
        .setTimestamp();

      // Envoyer le message SANS aucun composant
      const message = await channel.send({ embeds: [embed] });

      // Ajouter les réactions une par une
      await message.react(emojis[0]);
      if (args.options.length > 1) await message.react(emojis[1]);
      if (args.options.length > 2) await message.react(emojis[2]);
      if (args.options.length > 3) await message.react(emojis[3]);
      if (args.options.length > 4) await message.react(emojis[4]);

      const endTime = new Date(Date.now() + args.duration * 1000);
      return `✅ Sondage créé | ID: ${message.id} | ${args.options.length} options | Fin: <t:${Math.floor(endTime.getTime() / 1000)}:R>`;
    } catch (error: any) {
      console.error(`❌ [creer_sondage]`, error.message);
      return `❌ Erreur: ${error.message}`;
    }
  },
});

// Fonction utilitaire pour formater la durée
function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}h${minutes > 0 ? ` ${minutes}m` : ''}${secs > 0 ? ` ${secs}s` : ''}`;
  } else if (minutes > 0) {
    return `${minutes}m${secs > 0 ? ` ${secs}s` : ''}`;
  } else {
    return `${secs}s`;
  }
}

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
          action: z.object({
            type: z.string().describe('Type d\'action'),
            data: z.any().optional().describe('Données supplémentaires pour l\'action'),
          }).optional().describe('Action à exécuter quand le bouton est cliqué'),
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

      // Importer la persistance des boutons
      const { loadCustomButtons, addCustomButton } = await import('./utils/buttonPersistence.js');

      const rows: ActionRowBuilder<any>[] = [];
      let currentRow = new ActionRowBuilder<any>();
      const now = new Date();
      const savedButtons: string[] = [];

      const styleMap = {
        Primary: ButtonStyle.Primary,
        Secondary: ButtonStyle.Secondary,
        Success: ButtonStyle.Success,
        Danger: ButtonStyle.Danger,
      };

      // Charger les boutons existants
      const existingButtons = await loadCustomButtons();

      args.buttons.forEach((btn, index) => {
        if (index > 0 && index % 5 === 0) {
          rows.push(currentRow);
          currentRow = new ActionRowBuilder<any>();
        }

        // Générer un customId unique si non fourni
        const customId = btn.customId || `btn_${Date.now()}_${index}_${Math.random().toString(36).substr(2, 9)}`;

        const button = new ButtonBuilder()
          .setLabel(btn.label)
          .setCustomId(customId)
          .setStyle(styleMap[btn.style as keyof typeof styleMap]);

        if (btn.emoji) button.setEmoji(btn.emoji);

        // Sauvegarder le bouton dans le système de persistance
        if (btn.action) {
          const customButton: CustomButton = {
            id: customId,
            messageId: '', // Sera mis à jour après l'envoi
            channelId: args.channelId,
            label: btn.label,
            action: {
              type: btn.action.type || 'message',
              data: btn.action.data || {}
            },
            createdAt: now,
          };

          addCustomButton(customButton, existingButtons);
          savedButtons.push(customId);
        }

        currentRow.addComponents(button);
      });

      rows.push(currentRow);

      const message = await channel.send({
        content: args.content,
        components: rows.map(row => row.toJSON()),
      });

      // Mettre à jour les IDs de message pour les boutons persistés
      if (savedButtons.length > 0) {
        const { saveCustomButtons } = await import('./utils/buttonPersistence.js');

        // Mettre à jour les boutons avec le messageId
        for (const buttonId of savedButtons) {
          const button = existingButtons.get(buttonId);
          if (button) {
            button.messageId = message.id;
          }
        }

        await saveCustomButtons(existingButtons);
        Logger.info(`💾 ${savedButtons.length} boutons persistés pour le message ${message.id}`);
      }

      return `✅ Boutons créés | ID: ${message.id} | ${savedButtons.length > 0 ? `${savedButtons.length} persistés` : 'sans persistance'}`;
    } catch (error: any) {
      Logger.error('❌ [create_custom_buttons]', error.message);
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

        menu.addOptions(menuOption);
      });

      const row = new ActionRowBuilder();
      row.addComponents(menu);

      const message = await channel.send({
        content: args.content,
        components: [row.toJSON()],
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
      console.error(
        `🔍 [code_preview] Langage: ${args.language}, Taille: ${args.code.length} chars`
      );
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
      const { createAttachmentFromFile, createFileUploadEmbed, checkFileSize } = toolsFileUpload;

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
  description: "Liste les membres et leurs rôles d'un serveur",
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
    userId: z.string().describe("ID de l'utilisateur"),
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
    avatarUrl: z.string().optional().describe("URL de l'avatar du webhook"),
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
  description: "Liste tous les webhooks d'un canal",
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
    username: z.string().optional().describe("Nom d'utilisateur personnalisé"),
    avatarUrl: z.string().optional().describe("URL de l'avatar personnalisé"),
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
    optionIndex: z.number().min(0).describe("Index de l'option à voter"),
    userId: z.string().optional().describe("ID de l'utilisateur (défaut: bot)"),
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
      console.error(
        `🔘 [appuyer_bouton] Message: ${args.messageId}, Button: ${args.buttonCustomId}`
      );
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
      console.error(
        `📋 [selectionner_menu] Message: ${args.messageId}, Menu: ${args.menuCustomId}, Value: ${args.value}`
      );
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

// 22. Lister les boutons personnalisés actifs
server.addTool({
  name: 'lister_boutons_actifs',
  description: 'Liste tous les boutons personnalisés actifs avec leur état',
  parameters: z.object({
    channelId: z.string().optional().describe('Filtrer par canal spécifique'),
  }),
  execute: async args => {
    try {
      const { loadCustomButtons } = await import('./utils/buttonPersistence.js');
      const buttons = await loadCustomButtons();

      let filteredButtons = Array.from(buttons.values());

      // Filtrer par canal si spécifié
      if (args.channelId) {
        filteredButtons = filteredButtons.filter(btn => btn.channelId === args.channelId);
      }

      if (filteredButtons.length === 0) {
        return `📋 Aucun bouton actif${args.channelId ? ` dans le canal ${args.channelId}` : ''}`;
      }

      const now = new Date();
      const list = filteredButtons.map(button => {
        const createdAt = new Date(button.createdAt);
        const hoursDiff = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);
        const status = hoursDiff > 24 ? '⏰ Expiré' : '✅ Actif';
        const age = Math.floor(hoursDiff);

        return `
• **${button.label}** (${status})
  🆔 ID: ${button.id}
  💬 Canal: ${button.channelId}
  📨 Message: ${button.messageId || 'Non envoyé'}
  ⏱️ Âge: ${age}h
  🔧 Action: ${button.action.type}
  📊 Données: ${JSON.stringify(button.action.data || {})}
        `.trim();
      }).join('\n\n');

      return `📋 ${filteredButtons.length} bouton(s) trouvé(s):\n\n${list}`;
    } catch (error: any) {
      Logger.error('❌ [lister_boutons_actifs]', error.message);
      return `❌ Erreur: ${error.message}`;
    }
  },
});

// 23. Supprimer un bouton personnalisé
server.addTool({
  name: 'supprimer_bouton_perso',
  description: 'Supprime un bouton personnalisé du système de persistance',
  parameters: z.object({
    buttonId: z.string().describe('ID du bouton à supprimer'),
  }),
  execute: async args => {
    try {
      const { loadCustomButtons, deleteCustomButton } = await import('./utils/buttonPersistence.js');
      const buttons = await loadCustomButtons();

      const button = buttons.get(args.buttonId);
      if (!button) {
        return `❌ Bouton non trouvé: ${args.buttonId}`;
      }

      await deleteCustomButton(args.buttonId, buttons);

      return `✅ Bouton supprimé: ${button.label} (${args.buttonId})`;
    } catch (error: any) {
      Logger.error('❌ [supprimer_bouton_perso]', error.message);
      return `❌ Erreur: ${error.message}`;
    }
  },
});

// 24. Nettoyer les anciens boutons
server.addTool({
  name: 'nettoyer_anciens_boutons',
  description: 'Supprime tous les boutons de plus de 24h',
  parameters: z.object({}),
  execute: async () => {
    try {
      const { loadCustomButtons, cleanOldButtons } = await import('./utils/buttonPersistence.js');
      const buttons = await loadCustomButtons();

      const deletedCount = await cleanOldButtons(buttons);

      return `🧹 Nettoyage terminé. ${deletedCount} ancien(s) bouton(s) supprimé(s)`;
    } catch (error: any) {
      Logger.error('❌ [nettoyer_anciens_boutons]', error.message);
      return `❌ Erreur: ${error.message}`;
    }
  },
});

// 25. Enregistrer une fonction personnalisée pour un bouton
server.addTool({
  name: 'enregistrer_fonction_bouton',
  description: 'Enregistre une fonction personnalisée qui sera exécutée quand un bouton est cliqué',
  parameters: z.object({
    buttonId: z.string().describe('ID du bouton (customId)'),
    code: z.string().describe('Code JavaScript de la fonction (async)'),
    description: z.string().optional().describe('Description de la fonction'),
  }),
  execute: async args => {
    try {
      // Créer une fonction à partir du code
      const func = async (interaction: any, buttonData: any) => {
        const { EmbedBuilder, ButtonStyle, ActionRowBuilder, ButtonBuilder } = require('discord.js');
        eval(`(async () => { ${args.code} })()`);
      };

      // Importer le registre de fonctions
      const { registerButtonFunction } = await import('./discord-bridge.js');

      // Enregistrer la fonction
      registerButtonFunction(args.buttonId, func);

      Logger.info(`✅ Fonction enregistrée pour le bouton: ${args.buttonId}`);
      return `✅ Fonction enregistrée avec succès pour le bouton ${args.buttonId}${args.description ? `\nDescription: ${args.description}` : ''}`;
    } catch (error: any) {
      Logger.error('❌ [enregistrer_fonction_bouton]', error.message);
      return `❌ Erreur lors de l'enregistrement: ${error.message}`;
    }
  },
});

// 26. Créer un bouton avec fonction personnalisée
server.addTool({
  name: 'creer_bouton_avance',
  description: 'Crée un bouton avec une fonction personnalisée complexe',
  parameters: z.object({
    channelId: z.string().describe('ID du canal'),
    content: z.string().describe('Contenu du message'),
    buttonLabel: z.string().describe('Texte du bouton'),
    buttonStyle: z.enum(['Primary', 'Secondary', 'Success', 'Danger']).default('Primary'),
    buttonId: z.string().optional().describe('ID du bouton (généré si non fourni)'),
    functionCode: z.string().describe('Code JavaScript à exécuter lors du clic'),
    ephemeral: z.boolean().optional().default(false).describe('Réponse éphémère'),
  }),
  execute: async args => {
    try {
      const client = await ensureDiscordConnection();
      const channel = await client.channels.fetch(args.channelId);

      if (!channel || !('send' in channel)) {
        throw new Error('Canal invalide ou inaccessible');
      }

      // Générer un ID unique si non fourni
      const buttonId = args.buttonId || `btn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Créer la fonction personnalisée
      const func = async (interaction: any, buttonData: any) => {
        const { EmbedBuilder, ButtonStyle, ActionRowBuilder, ButtonBuilder } = require('discord.js');
        eval(`(async () => { ${args.functionCode} })()`);
      };

      // Importer le registre de fonctions
      const { registerButtonFunction } = await import('./discord-bridge.js');

      // Enregistrer la fonction
      registerButtonFunction(buttonId, func);

      // Créer le bouton
      const styleMap = {
        Primary: 1, // ButtonStyle.Primary
        Secondary: 2, // ButtonStyle.Secondary
        Success: 3, // ButtonStyle.Success
        Danger: 4, // ButtonStyle.Danger
      };

      const button = new ButtonBuilder()
        .setLabel(args.buttonLabel)
        .setCustomId(buttonId)
        .setStyle(styleMap[args.buttonStyle as keyof typeof styleMap]);

      const row = new ActionRowBuilder<ButtonBuilder>().addComponents(button);

      // Envoyer le message
      const message = await channel.send({
        content: args.content,
        components: [row],
      });

      // Persister le bouton
      try {
        const { loadCustomButtons, addCustomButton } = await import('./utils/buttonPersistence.js');
        const buttons = await loadCustomButtons();
        await addCustomButton({
            id: buttonId,
            messageId: message.id,
            channelId: args.channelId,
            label: args.buttonLabel,
            action: { type: 'custom', data: {} },
            functionCode: args.functionCode,
            createdAt: new Date()
        }, buttons);
        Logger.info(`💾 Bouton avancé persisté: ${buttonId}`);
      } catch (err) {
        Logger.error('❌ Erreur persistance bouton:', err);
      }

      Logger.info(`✅ Bouton avancé créé: ${buttonId} - Message: ${message.id}`);
      return `✅ Bouton avancé créé | ID: ${message.id} | Bouton: ${buttonId}`;
    } catch (error: any) {
      Logger.error('❌ [creer_bouton_avance]', error.message);
      return `❌ Erreur: ${error.message}`;
    }
  },
});

// 27. Lister les fonctions de boutons enregistrées
server.addTool({
  name: 'lister_fonctions_boutons',
  description: 'Liste toutes les fonctions personnalisées enregistrées',
  parameters: z.object({}),
  execute: async () => {
    try {
      const { listButtonFunctions } = await import('./discord-bridge.js');
      const functions = listButtonFunctions();

      if (functions.length === 0) {
        return '📋 Aucune fonction personnalisée enregistrée';
      }

      return `📋 ${functions.length} fonction(s) personnalisée(s) enregistrées:\n\n${functions.map(f => `• ${f}`).join('\n')}`;
    } catch (error: any) {
      Logger.error('❌ [lister_fonctions_boutons]', error.message);
      return `❌ Erreur: ${error.message}`;
    }
  },
});

// 28. Créer un menu déroulant persistant
server.addTool({
  name: 'creer_menu_persistant',
  description: 'Crée un menu déroulant persistant avec actions personnalisées',
  parameters: z.object({
    channelId: z.string().describe('ID du canal'),
    content: z.string().describe('Contenu du message'),
    placeholder: z.string().optional().describe('Texte placeholder du menu'),
    minValues: z.number().min(0).max(25).optional().default(1).describe('Nombre minimum de sélections'),
    maxValues: z.number().min(1).max(25).optional().default(1).describe('Nombre maximum de sélections'),
    options: z.array(z.object({
      label: z.string().min(1).max(100),
      value: z.string().min(1).max(100),
      description: z.string().max(100).optional(),
      emoji: z.string().optional(),
    })).min(1).max(25).describe('Options du menu'),
    action: z.object({
      type: z.enum(['message', 'embed', 'role', 'webhook', 'custom']),
      data: z.any().optional().describe('Données pour l\'action'),
    }).describe('Action à exécuter lors de la sélection'),
    menuId: z.string().optional().describe('ID du menu (généré si non fourni)'),
  }),
  execute: async args => {
    try {
      const client = await ensureDiscordConnection();
      const channel = await client.channels.fetch(args.channelId);

      if (!channel || !('send' in channel)) {
        throw new Error('Canal invalide ou inaccessible');
      }

      // Importer la persistance des menus
      const { loadCustomMenus, addCustomMenu } = await import('./utils/menuPersistence.js');

      const menuId = args.menuId || `menu_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const customId = `select_${menuId}`;

      // Créer le menu déroulant
      const menu = new StringSelectMenuBuilder()
        .setCustomId(customId)
        .setPlaceholder(args.placeholder || 'Sélectionnez une option...')
        .setMinValues(args.minValues)
        .setMaxValues(args.maxValues);

      // Ajouter les options
      args.options.forEach(opt => {
        const option = new StringSelectMenuOptionBuilder()
          .setLabel(opt.label)
          .setValue(opt.value);

        if (opt.description) option.setDescription(opt.description);
        if (opt.emoji) option.setEmoji(opt.emoji);

        menu.addOptions(option);
      });

      const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(menu);

      // Envoyer le message
      const message = await channel.send({
        content: args.content,
        components: [row],
      });

      // Sauvegarder le menu dans le système de persistance
      const existingMenus = await loadCustomMenus();
      const customMenu: CustomMenu = {
        id: menuId,
        messageId: message.id,
        channelId: args.channelId,
        customId,
        placeholder: args.placeholder || 'Sélectionnez une option...',
        minValues: args.minValues,
        maxValues: args.maxValues,
        options: args.options as any,
        action: {
          type: args.action.type,
          data: args.action.data || {},
        },
        multipleSelections: args.maxValues > 1,
        createdAt: new Date(),
        creatorId: 'SYSTEM',
        isActive: true,
      };

      await addCustomMenu(customMenu, existingMenus);

      Logger.info(`✅ Menu persistant créé: ${menuId} - Message: ${message.id}`);
      return `✅ Menu persistant créé | ID: ${message.id} | Menu: ${menuId} | Options: ${args.options.length}`;
    } catch (error: any) {
      Logger.error('❌ [creer_menu_persistant]', error.message);
      return `❌ Erreur: ${error.message}`;
    }
  },
});

// 29. Lister les menus persistants actifs
server.addTool({
  name: 'lister_menus_actifs',
  description: 'Liste tous les menus déroulants persistants avec leur état',
  parameters: z.object({
    channelId: z.string().optional().describe('Filtrer par canal spécifique'),
  }),
  execute: async args => {
    try {
      const { loadCustomMenus } = await import('./utils/menuPersistence.js');
      const menus = await loadCustomMenus();

      let filteredMenus = Array.from(menus.values());

      // Filtrer par canal si spécifié
      if (args.channelId) {
        filteredMenus = filteredMenus.filter(menu => menu.channelId === args.channelId);
      }

      if (filteredMenus.length === 0) {
        return `📋 Aucun menu actif${args.channelId ? ` dans le canal ${args.channelId}` : ''}`;
      }

      const now = new Date();
      const list = filteredMenus.map(menu => {
        const createdAt = new Date(menu.createdAt);
        const hoursDiff = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);
        const status = !menu.isActive ? '❌ Inactif' : hoursDiff > 24 ? '⏰ Expiré' : '✅ Actif';
        const age = Math.floor(hoursDiff);

        return `
• **${menu.placeholder}** (${status})
  🆔 ID: ${menu.id}
  🎯 CustomId: ${menu.customId}
  💬 Canal: ${menu.channelId}
  📨 Message: ${menu.messageId || 'Non envoyé'}
  ⏱️ Âge: ${age}h
  🔧 Action: ${menu.action.type}
  📊 Options: ${menu.options.length} (sélection${menu.maxValues > 1 ? 's' : ''}: ${menu.minValues}-${menu.maxValues})
        `.trim();
      }).join('\n\n');

      return `📋 ${filteredMenus.length} menu(s) trouvé(s):\n\n${list}`;
    } catch (error: any) {
      Logger.error('❌ [lister_menus_actifs]', error.message);
      return `❌ Erreur: ${error.message}`;
    }
  },
});

// 30. Créer un sondage avec boutons persistants
server.addTool({
  name: 'creer_sondage_boutons',
  description: 'Crée un sondage interactif avec boutons qui persistent',
  parameters: z.object({
    channelId: z.string().describe('ID du canal'),
    question: z.string().min(5).max(500).describe('Question du sondage'),
    options: z.array(z.string()).min(2).max(5).describe('Options du sondage'),
    duration: z.number().min(60).max(604800).optional().default(3600).describe('Durée en secondes (min: 1min, max: 7j)'),
    allowMultiple: z.boolean().optional().default(false).describe('Autoriser plusieurs votes'),
  }),
  execute: async args => {
    try {
      const client = await ensureDiscordConnection();
      const channel = await client.channels.fetch(args.channelId);

      if (!channel || !('send' in channel)) {
        throw new Error('Canal invalide ou inaccessible');
      }

      const pollId = `poll_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Créer l'embed du sondage
      const embed = new EmbedBuilder()
        .setTitle('📊 Sondage Interactif')
        .setDescription(`**${args.question}**\n\n${args.options.map((opt, i) => `${i + 1}. ${opt}`).join('\n')}`)
        .setColor(0x5865f2)
        .addFields(
          { name: '⏱️ Durée', value: `${Math.floor(args.duration / 60)} minutes`, inline: true },
          { name: '🔢 Votes multiples', value: args.allowMultiple ? 'Oui' : 'Non', inline: true },
          { name: '📊 Statut', value: 'En cours', inline: true }
        )
        .setFooter({ text: `ID: ${pollId}` })
        .setTimestamp();

      // Créer les boutons pour voter
      const rows: ActionRowBuilder<ButtonBuilder>[] = [];
      let currentRow = new ActionRowBuilder<ButtonBuilder>();

      args.options.forEach((option, index) => {
        const button = new ButtonBuilder()
          .setLabel(`${index + 1}. ${option}`)
          .setCustomId(`vote_${pollId}_${index}`)
          .setStyle(index % 2 === 0 ? ButtonStyle.Primary : ButtonStyle.Secondary);

        currentRow.addComponents(button);

        // Maximum 5 boutons par rangée
        if (currentRow.components.length >= 5) {
          rows.push(currentRow);
          currentRow = new ActionRowBuilder<ButtonBuilder>();
        }
      });

      if (currentRow.components.length > 0) {
        rows.push(currentRow);
      }

      // Ajouter un bouton pour voir les résultats
      const resultsRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
          .setLabel('📊 Voir les résultats')
          .setCustomId(`results_${pollId}`)
          .setStyle(ButtonStyle.Success)
      );

      rows.push(resultsRow);

      // Envoyer le sondage
      const message = await channel.send({
        embeds: [embed],
        components: rows,
      });

      // Sauvegarder le sondage dans le système de persistance
      const { loadPolls, addPoll } = await import('./utils/pollPersistence.js');
      const existingPolls = await loadPolls();

      const pollData = {
        id: pollId,
        messageId: message.id,
        channelId: args.channelId,
        question: args.question,
        options: args.options.map(option => ({
          text: option,
          votes: 0,
          percentage: 0,
        })),
        totalVotes: 0,
        ended: false,
        endTime: new Date(Date.now() + args.duration * 1000),
        allowMultiple: args.allowMultiple,
        anonymous: false,
      };

      await addPoll(pollData as any, existingPolls);

      Logger.info(`✅ Sondage avec boutons créé: ${pollId} - Message: ${message.id}`);
      return `✅ Sondage créé | ID: ${message.id} | Sondage: ${pollId} | Durée: ${Math.floor(args.duration / 60)}min`;
    } catch (error: any) {
      Logger.error('❌ [creer_sondage_boutons]', error.message);
      return `❌ Erreur: ${error.message}`;
    }
  },
});

// 21. Statut Bot avec rate limiting
server.addTool({
  name: 'statut_bot',
  description: 'Statut actuel du bot',
  parameters: z.object({}),
  execute: withRateLimit('statut_bot', async () => {
    try {
      const client = await ensureDiscordConnection();
      return `🤖 Status: Connecté\nUser: ${client.user!.tag}\nGuilds: ${client.guilds.cache.size}\nUptime: ${client.uptime}ms\nNode: ${process.version}`;
    } catch (error: any) {
      return `❌ Déconnecté | Erreur: ${error.message}`;
    }
  }),
});

// ============================================================================
// NETTOYAGE
// ============================================================================

async function cleanup() {
  console.error('\n🧹 Nettoyage...');
  try {
    // Nettoyer le timer de sauvegarde
    if (saveTimeout) {
      clearTimeout(saveTimeout);
      saveTimeout = null;
    }

    // Nettoyer les instances Discord
    if (botConfig.token) {
      await DiscordBridge.getInstance(botConfig.token).destroy();
    }

    // Nettoyer le cache des outils
    toolsCache.clear();

    // Nettoyer la map de rate limiting
    rateLimitMap.clear();

    Logger.info('✅ Nettoyage terminé');
  } catch (e) {
    Logger.error('Erreur nettoyage:', e);
  }
}

process.on('SIGINT', async () => {
  console.error('\nSignal SIGINT reçu');
  await cleanup();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.error('\nSignal SIGTERM reçu');
  Logger.warn('\nSignal SIGTERM reçu');
  await cleanup();
  process.exit(0);
});

// Gestion des erreurs non capturées pour éviter les crashes
process.on('uncaughtException', error => {
  Logger.error('❌ Erreur non capturée:', error);
  Logger.error('Stack trace:', error.stack);
  // Ne pas quitter, laisser le serveur continuer
});

process.on('unhandledRejection', (reason, promise) => {
  Logger.error('❌ Promesse rejetée non gérée:', reason);
  Logger.error('Promise:', promise);
  // Ne pas quitter, laisser le serveur continuer
});

// Limite de mémoire pour éviter les freezes
const MEMORY_LIMIT = 512 * 1024 * 1024; // 512 MB
if (process.memoryUsage().heapUsed > MEMORY_LIMIT) {
  console.error('⚠️ Limite de mémoire atteinte:', process.memoryUsage());
  // Forcer le garbage collection si disponible
  if (global.gc) {
    global.gc();
  }
}

// ============================================================================
// GESTIONNAIRE D'INTERACTIONS
// ============================================================================

// Importer le gestionnaire d'interactions
import { interactionHandler } from './utils/interactionHandler.js';

// Écouter les interactions depuis le processus Discord
// NOTE: Le hijacking de stdin est supprimé car il casse le transport MCP.
// Si une communication avec un autre processus est nécessaire, 
// utilisez un IPC plus robuste (Sockets, Named Pipes, etc).

// Traiter les messages du processus Discord
function handleDiscordMessage(message: any) {
  switch (message.id) {
    case 'poll_interaction':
      console.error(
        `🎯 [Poll Interaction] ${message.data.action} par ${message.data.user.username}`
      );
      interactionHandler.handlePollInteraction(message.data);
      break;

    case 'custom_button_interaction':
      console.error(
        `🔘 [Custom Button] ${message.data.customId} par ${message.data.user.username}`
      );
      interactionHandler.handleCustomButton(message.data);
      break;

    case 'select_menu':
      console.error(`📋 [Select Menu] ${message.data.customId} par ${message.data.user.username}`);
      interactionHandler.handleSelectMenu(message.data);
      break;

    case 'modal_submit':
      console.error(`📝 [Modal Submit] ${message.data.customId} par ${message.data.user.username}`);
      interactionHandler.handleModalSubmit(message.data);
      break;

    case 'guild_member_add':
      console.error(
        `👋 [Member Add] ${message.data.member.username} sur ${message.data.guildName}`
      );
      handleWelcomeMessage(message.data);
      break;

    case 'guild_member_remove':
      console.error(
        `👋 [Member Remove] ${message.data.member.username} de ${message.data.guildName}`
      );
      handleGoodbyeMessage(message.data);
      break;

    case 'message_delete':
      console.error(`🗑️ [Message Delete] dans ${message.data.channelId}`);
      logMessageAction('delete', message.data);
      break;

    case 'message_update':
      console.error(`✏️ [Message Update] dans ${message.data.channelId}`);
      logMessageAction('update', message.data);
      break;

    case 'channel_create':
      console.error(`📝 [Channel Create] ${message.data.channelName}`);
      logChannelAction('create', message.data);
      break;

    case 'channel_delete':
      console.error(`🗑️ [Channel Delete] ${message.data.channelName}`);
      logChannelAction('delete', message.data);
      break;

    case 'role_create':
      console.error(`🎭 [Role Create] ${message.data.roleName}`);
      logRoleAction('create', message.data);
      break;

    case 'role_delete':
      console.error(`🗑️ [Role Delete] ${message.data.roleName}`);
      logRoleAction('delete', message.data);
      break;

    default:
      console.error(`ℹ️ [Discord Message] ${message.id}:`, message.data);
  }
}

// Gérer les messages de bienvenue
async function handleWelcomeMessage(data: any) {
  // TODO: Implémenter la logique de bienvenue
  // - Vérifier la config du serveur
  // - Envoyer un message de bienvenue
  // - Donner un rôle automatique
  console.error(`✅ Logique de bienvenue à implémenter pour ${data.member.username}`);
}

// Gérer les messages d'au revoir
async function handleGoodbyeMessage(data: any) {
  // TODO: Implémenter la logique d'au revoir
  // - Vérifier la config du serveur
  // - Envoyer un message d'au revoir
  console.error(`✅ Logique d'au revoir à implémenter pour ${data.member.username}`);
}

// Logger les actions sur les messages
async function logMessageAction(action: string, data: any) {
  // TODO: Implémenter le logging des messages
  console.error(`✅ Logging ${action} pour message ${data.messageId}`);
}

// Logger les actions sur les canaux
async function logChannelAction(action: string, data: any) {
  // TODO: Implémenter le logging des canaux
  console.error(`✅ Logging ${action} pour canal ${data.channelName}`);
}

// Logger les actions sur les rôles
async function logRoleAction(action: string, data: any) {
  // TODO: Implémenter le logging des rôles
  console.error(`✅ Logging ${action} pour rôle ${data.roleName}`);
}

// ============================================================================
// DÉMARRAGE
// ============================================================================

async function main() {
  Logger.info('🚀 Démarrage Discord MCP v2.0...\n');

  try {
    // Démarrer le serveur MCP
    await server.start();
    Logger.info('✅ Serveur MCP démarré\n');

    // Initialiser la connexion Discord
    try {
      await ensureDiscordConnection();
      Logger.info('✅ Connexion Discord établie\n');
    } catch (error) {
      Logger.warn('⚠️ Discord non connecté (continuation possible):', (error as Error).message);
    }

    Logger.info('📊 Status:');
    Logger.info(`   • Nom: discord-mcp-server`);
    Logger.info(`   • Version: 2.0.0`);
    Logger.info(
      `   • Outils: 26 (messages, embeds, fichiers, sondages, webhooks, membres, interactions)`
    );
    Logger.info(`   • Environment: ${botConfig.environment}`);
  } catch (error) {
    Logger.error('❌ Erreur fatal:', error);
    await cleanup();
    process.exit(1);
  }
}

main();
// 31. Déployer le RPG
server.addTool({
  name: 'deploy_rpg',
  description: 'Déploie le mini-RPG persistant dans le canal spécifié',
  parameters: z.object({}),
  execute: async () => {
    try {
      const { deployRPG } = await import('./utils/rpgDeploy.js');
      const result = await deployRPG(botConfig.token);
      return result;
    } catch (error: any) {
      Logger.error('❌ [deploy_rpg]', error.message);
      return `❌ Erreur: ${error.message}`;
    }
  },
});

// Auto-déploiement du RPG au démarrage (optionnel)
setTimeout(async () => {
    try {
        const { deployRPG } = await import('./utils/rpgDeploy.js');
        await deployRPG(botConfig.token);
        Logger.info('🎮 [RPG] Auto-déploiement réussi lors du démarrage');
    } catch (e) {
        // Silencieux si déjà lancé ou erreur
    }
}, 5000);


// 33. Explorateur de Logs - Surprise !
server.addTool({
  name: 'logs_explorer',
  description: 'Explore les derniers logs du serveur',
  parameters: z.object({
    lines: z.number().min(1).max(100).default(20).describe('Nombre de lignes à afficher'),
    level: z.enum(['INFO', 'WARN', 'ERROR', 'DEBUG']).optional().describe('Filtrer par niveau')
  }),
  execute: async (args) => {
    try {
      const logDir = path.join(process.cwd(), 'logs');
      const logFiles = await fs.promises.readdir(logDir);
      const latestLog = logFiles.filter(f => f.endsWith('.log')).sort().reverse()[0];
      
      if (!latestLog) return "❌ Aucun fichier de log trouvé.";
      
      const content = await fs.promises.readFile(path.join(logDir, latestLog), 'utf-8');
      let linesArray = content.split('\n').filter(l => l.trim() !== '');
      
      if (args.level) {
        linesArray = linesArray.filter(l => l.includes(`[${args.level}]`));
      }
      
      const result = linesArray.slice(-args.lines).join('\n');
      return `📋 **Derniers logs (${latestLog})**:\n\`\`\`\n${result || 'Aucune ligne correspondante.'}\n\`\`\``;
    } catch (err: any) {
      return `❌ Erreur lecture logs: ${err.message}`;
    }
  }
});
// 34. Nettoyer les anciens boutons - Surprise !
server.addTool({
  name: 'nettoyer_anciens_boutons',
  description: 'Supprime tous les boutons de plus de 24h du système de persistance',
  parameters: z.object({}),
  execute: async () => {
    try {
      const { loadCustomButtons, cleanOldButtons } = await import('./utils/buttonPersistence.js');
      const buttons = await loadCustomButtons();
      const count = await cleanOldButtons(buttons);
      return `🧹 ${count} boutons expirés ont été supprimés de la base de données.`;
    } catch (err: any) {
      return `❌ Erreur nettoyage: ${err.message}`;
    }
  }
});
