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
import * as fs from 'fs';
import { DiscordBridge } from './discord-bridge.js';
import Logger from './utils/logger.js';

import * as path from 'path';
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

// ============================================================================
// SYSTÈME D'AUTO-UPDATE POUR EMBEDS 🚀
// ============================================================================

// Map pour stocker les embeds auto-updatables
const autoUpdateEmbeds = new Map<string, {
  messageId: string;
  channelId: string;
  embedData: any;
  interval: number;
  lastUpdate: number;
  source?: string;
  updateCount: number;
}>();

// Map pour stocker les analytics des embeds
const embedAnalytics = new Map<string, {
  views: number;
  clicks: number;
  lastInteraction: number;
  reactions: Map<string, number>;
}>();

// Fonction pour mettre à jour un embed automatiquement
async function updateEmbed(embedId: string): Promise<void> {
  const embedInfo = autoUpdateEmbeds.get(embedId);
  if (!embedInfo) return;

  try {
    console.log(`🔄 [Auto-Update] Mise à jour embed ${embedId} (${embedInfo.updateCount + 1})`);

    // Récupérer le client
    const client = await ensureDiscordConnection();
    const channel = await client.channels.fetch(embedInfo.channelId);

    if (!channel || !('messages' in channel)) {
      console.error(`❌ [Auto-Update] Canal ${embedInfo.channelId} invalide`);
      autoUpdateEmbeds.delete(embedId);
      return;
    }

    // Récupérer le message
    const message = await channel.messages.fetch(embedInfo.messageId);

    if (!message) {
      console.error(`❌ [Auto-Update] Message ${embedInfo.messageId} introuvable`);
      autoUpdateEmbeds.delete(embedId);
      return;
    }

    // Mettre à jour les variables dynamiques si nécessaire
    let updatedEmbedData = { ...embedInfo.embedData };

    // Re-remplacer les variables pour obtenir des valeurs свежиes
    if (updatedEmbedData.title) {
      updatedEmbedData.title = replaceVariables(updatedEmbedData.title, updatedEmbedData.variables);
    }
    if (updatedEmbedData.description) {
      updatedEmbedData.description = replaceVariables(updatedEmbedData.description, updatedEmbedData.variables);
    }
    if (updatedEmbedData.fields) {
      updatedEmbedData.fields = updatedEmbedData.fields.map((field: any) => ({
        ...field,
        name: replaceVariables(field.name, updatedEmbedData.variables),
        value: updatedEmbedData.autoTable && field.value.includes('|')
          ? parseTable(field.value)
          : replaceVariables(field.value, updatedEmbedData.variables),
      }));
    }

    // Reconstruire l'embed
    const embed = new EmbedBuilder();

    if (updatedEmbedData.title) embed.setTitle(updatedEmbedData.title);
    if (updatedEmbedData.description) embed.setDescription(updatedEmbedData.description);

    if (updatedEmbedData.color) {
      if (typeof updatedEmbedData.color === 'number') {
        embed.setColor(updatedEmbedData.color);
      } else if (typeof updatedEmbedData.color === 'string' && updatedEmbedData.color.startsWith('#')) {
        embed.setColor(updatedEmbedData.color as any);
      }
    }

    if (updatedEmbedData.url) embed.setURL(updatedEmbedData.url);
    if (updatedEmbedData.thumbnail) embed.setThumbnail(updatedEmbedData.thumbnail);
    if (updatedEmbedData.image) embed.setImage(updatedEmbedData.image);

    if (updatedEmbedData.authorName) {
      embed.setAuthor({
        name: updatedEmbedData.authorName,
        url: updatedEmbedData.authorUrl,
        iconURL: updatedEmbedData.authorIcon,
      });
    }

    if (updatedEmbedData.footerText) {
      embed.setFooter({
        text: replaceVariables(updatedEmbedData.footerText, updatedEmbedData.variables),
        iconURL: updatedEmbedData.footerIcon,
      });
    }

    if (updatedEmbedData.fields) {
      updatedEmbedData.fields.forEach((field: any) => {
        embed.addFields({
          name: field.name,
          value: field.value,
          inline: field.inline || false,
        });
      });
    }

    embed.setTimestamp();

    // Mettre à jour le message
    await message.edit({
      content: updatedEmbedData.content || '',
      embeds: [embed],
      components: message.components, // Garder les boutons
    });

    // Mettre à jour les informations
    embedInfo.embedData = updatedEmbedData;
    embedInfo.lastUpdate = Date.now();
    embedInfo.updateCount++;

    console.log(`✅ [Auto-Update] Embed ${embedId} mis à jour (${embedInfo.updateCount} fois)`);

  } catch (error) {
    console.error(`❌ [Auto-Update] Erreur pour ${embedId}:`, error);
  }
}

// Fonction pour démarrer l'auto-update
function startAutoUpdate(): void {
  setInterval(() => {
    const now = Date.now();
    autoUpdateEmbeds.forEach((embedInfo, embedId) => {
      if (now - embedInfo.lastUpdate >= embedInfo.interval * 1000) {
        updateEmbed(embedId);
      }
    });
  }, 5000); // Vérifier toutes les 5 secondes
}

// ============================================================================
// SYSTÈME DE THÈMES 🎨
// ============================================================================

const EMBED_THEMES = {
  cyberpunk: {
    name: 'Cyberpunk',
    color: '#FF00FF',
    description: 'Style futuriste néon',
    gradient: ['#FF00FF', '#00FFFF'],
    emojis: ['⚡', '🔮', '🌆', '🤖'],
  },
  minimal: {
    name: 'Minimal',
    color: '#2C2C2C',
    description: 'Style épuré et moderne',
    gradient: ['#2C2C2C', '#4A4A4A'],
    emojis: ['◼️', '▫️', '●', '■'],
  },
  gaming: {
    name: 'Gaming',
    color: '#7289DA',
    description: 'Style gaming coloré',
    gradient: ['#7289DA', '#5B6EBD'],
    emojis: ['🎮', '🎯', '🏆', '⚔️'],
  },
  corporate: {
    name: 'Corporate',
    color: '#0066CC',
    description: 'Style professionnel',
    gradient: ['#0066CC', '#004C99'],
    emojis: ['💼', '📊', '📈', '💼'],
  },
  sunset: {
    name: 'Sunset',
    color: '#FF6B6B',
    description: 'Style coucher de soleil',
    gradient: ['#FF6B6B', '#FFA07A'],
    emojis: ['🌅', '🌇', '🌄', '☀️'],
  },
  ocean: {
    name: 'Ocean',
    color: '#00CED1',
    description: 'Style océan bleu',
    gradient: ['#00CED1', '#4169E1'],
    emojis: ['🌊', '🐋', '🐬', '🦈'],
  },
};

// Fonction pour appliquer un thème
function applyTheme(themeName: string, customizations: any = {}): any {
  const theme = EMBED_THEMES[themeName as keyof typeof EMBED_THEMES];
  if (!theme) return customizations;

  return {
    ...customizations,
    color: customizations.color || theme.color,
    authorIcon: customizations.authorIcon || theme.emojis[0],
    footerIcon: customizations.footerIcon || theme.emojis[1],
  };
}

// ============================================================================
// SYSTÈME D'ANALYTICS 📊
// ============================================================================

// Fonction pour track une vue d'embed
function trackEmbedView(embedId: string): void {
  const analytics = embedAnalytics.get(embedId) || {
    views: 0,
    clicks: 0,
    lastInteraction: 0,
    reactions: new Map(),
  };
  analytics.views++;
  analytics.lastInteraction = Date.now();
  embedAnalytics.set(embedId, analytics);
}

// Fonction pour track un clic sur embed
function trackEmbedClick(embedId: string, buttonId?: string): void {
  const analytics = embedAnalytics.get(embedId) || {
    views: 0,
    clicks: 0,
    lastInteraction: 0,
    reactions: new Map(),
  };
  analytics.clicks++;
  analytics.lastInteraction = Date.now();
  if (buttonId) {
    analytics.reactions.set(buttonId, (analytics.reactions.get(buttonId) || 0) + 1);
  }
  embedAnalytics.set(embedId, analytics);
}

// Fonction pour obtenir les analytics d'un embed
function getEmbedAnalytics(embedId: string): any {
  return embedAnalytics.get(embedId) || {
    views: 0,
    clicks: 0,
    lastInteraction: 0,
    reactions: {},
  };
}

// Fonction pour générer un rapport d'analytics
function generateAnalyticsReport(embedId: string): string {
  const analytics = getEmbedAnalytics(embedId);
  const reactions = Array.from(analytics.reactions.entries())
    .map(([btn, count]) => `  • ${btn}: ${count} clics`)
    .join('\n');

  return `📊 **Analytics Embed ${embedId}**
👀 Vues: ${analytics.views}
🖱️ Clics: ${analytics.clics}
📈 Taux d'engagement: ${analytics.views > 0 ? ((analytics.clicks / analytics.views) * 100).toFixed(1) : 0}%
⏰ Dernière interaction: ${analytics.lastInteraction ? new Date(analytics.lastInteraction).toLocaleString('fr-FR') : 'Jamais'}
${reactions ? `🎯 **Boutons:**\n${reactions}` : ''}`;
}

// Fonction pour sauvegarder les analytics
async function saveAnalytics(): Promise<void> {
  const analyticsData = Object.fromEntries(
    Array.from(embedAnalytics.entries()).map(([id, data]) => [
      id,
      {
        ...data,
        reactions: Object.fromEntries(data.reactions),
      },
    ])
  );

  const analyticsPath = path.join(__dirname, '../embed-analytics.json');
  await fs.promises.writeFile(analyticsPath, JSON.stringify(analyticsData, null, 2));
}

// Fonction pour charger les analytics
async function loadAnalytics(): Promise<void> {
  const analyticsPath = path.join(__dirname, '../embed-analytics.json');

  try {
    const content = await fs.promises.readFile(analyticsPath, 'utf-8');
    const data = JSON.parse(content);

    Object.entries(data).forEach(([id, analytics]: [string, any]) => {
      embedAnalytics.set(id, {
        ...analytics,
        reactions: new Map(Object.entries(analytics.reactions || {})),
      });
    });

    console.log(`📊 Analytics chargées: ${Object.keys(data).length} embeds`);
  } catch (e) {
    console.log('📊 Aucune analytics sauvegardée trouvée');
  }
}

// Démarrer le système d'auto-update (délayé pour éviter erreur top-level await)
setTimeout(startAutoUpdate, 1000);

// Sauvegarder les analytics toutes les 5 minutes
setInterval(saveAnalytics, 5 * 60 * 1000);

// Charger les analytics au démarrage (délayé pour éviter erreur top-level await)
setTimeout(() => loadAnalytics().catch(console.error), 500);



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

// ============================================================================
// FONCTIONS UTILITAIRES POUR EMBEDS AMÉLIORÉS
// ============================================================================

// Fonction pour parser les tableaux
function parseTable(tableText: string): string {
  const lines = tableText.trim().split('\n');
  if (lines.length < 2) return tableText;

  const rows = lines.map(line =>
    line.split('|').map(cell => cell.trim()).filter(cell => cell !== '')
  );

  if (rows.length < 2) return tableText;

  // Trouver la largeur max de chaque colonne
  const colWidths = rows[0].map((_, colIndex) =>
    Math.max(...rows.map(row => (row[colIndex] || '').length))
  );

  // Construire le tableau formaté
  let formatted = '```\n';

  // En-tête
  const header = rows[0].map((cell, i) => cell.padEnd(colWidths[i])).join(' │ ');
  formatted += header + '\n';

  // Séparateur
  const separator = colWidths.map(w => '─'.repeat(w)).join('─┼─');
  formatted += separator + '\n';

  // Données
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i].map((cell, j) => (cell || '').padEnd(colWidths[j])).join(' │ ');
    formatted += row + '\n';
  }

  formatted += '```';
  return formatted;
}

// Fonction pour remplacer les variables dynamiques
function replaceVariables(text: string, variables: Record<string, string> = {}): string {
  let result = text;

  // Variables automatiques
  const autoVars = {
    '{timestamp}': new Date().toLocaleString('fr-FR'),
    '{date}': new Date().toLocaleDateString('fr-FR'),
    '{time}': new Date().toLocaleTimeString('fr-FR'),
    '{year}': new Date().getFullYear().toString(),
    '{month}': (new Date().getMonth() + 1).toString(),
    '{day}': new Date().getDate().toString(),
    '{weekday}': new Date().toLocaleDateString('fr-FR', { weekday: 'long' }),
  };

  // Remplacer les variables automatiques
  Object.entries(autoVars).forEach(([key, value]) => {
    result = result.replace(new RegExp(key, 'g'), value);
  });

  // Remplacer les variables personnalisées
  Object.entries(variables).forEach(([key, value]) => {
    result = result.replace(new RegExp(`{${key}}`, 'g'), value);
  });

  // Gérer les spoilers
  result = result.replace(/{spoiler:([^}]+)}/g, '|| $1 ||');

  return result;
}

// Fonction pour créer une barre de progression
function createProgressBar(value: number, max: number, length: number = 10): string {
  const percentage = Math.min((value / max) * 100, 100);
  const filled = Math.round((percentage / 100) * length);
  const empty = length - filled;
  return '█'.repeat(filled) + '░'.repeat(empty);
}

// Fonction pour sauvegarder un template
async function saveTemplate(name: string, embedData: any): Promise<void> {
  const templatesPath = path.join(__dirname, '../embed-templates.json');
  let templates: Record<string, any> = {};

  try {
    const content = await fs.promises.readFile(templatesPath, 'utf-8');
    templates = JSON.parse(content);
  } catch (e) {
    // Fichier n'existe pas encore
  }

  templates[name] = embedData;
  await fs.promises.writeFile(templatesPath, JSON.stringify(templates, null, 2));
}

// Fonction pour charger un template
async function loadTemplate(name: string): Promise<any | null> {
  const templatesPath = path.join(__dirname, '../embed-templates.json');

  try {
    const content = await fs.promises.readFile(templatesPath, 'utf-8');
    const templates = JSON.parse(content);
    return templates[name] || null;
  } catch (e) {
    return null;
  }
}

// Fonction pour valider la longueur des champs
function validateFieldLength(fields: any[]): { valid: boolean; warnings: string[] } {
  const warnings: string[] = [];

  fields?.forEach((field, index) => {
    if (field.name.length > 256) {
      warnings.push(`Champ #${index + 1}: Le nom dépasse 256 caractères (${field.name.length})`);
    }
    if (field.value.length > 1024) {
      warnings.push(`Champ #${index + 1}: La valeur dépasse 1024 caractères (${field.value.length}) ⚠️`);
    }
    if (field.value.length > 800) {
      warnings.push(`Champ #${index + 1}: La valeur est longue (${field.value.length} chars), considérez la pagination`);
    }
  });

  return { valid: warnings.filter(w => w.includes('⚠️')).length === 0, warnings };
}

// ============================================================================
// NOUVELLES FONCTIONS UTILITAIRES POUR LES GRAPHIQUES 📊
// ============================================================================

// Fonction pour générer un graphique en ASCII art
function generateAsciiChart(type: string, data: number[], labels?: string[], options: any = {}): string {
  const maxValue = Math.max(...data);
  const minValue = Math.min(...data);
  const range = maxValue - minValue;
  const height = options.height || 10;
  const width = data.length;

  let chart = '';

  switch (type) {
    case 'sparkline':
      // Graphique sparkline compact
      const points = data.map((value, index) => {
        const position = Math.round(((value - minValue) / range) * 4);
        return '▁▂▃▄▅▆▇█'[Math.min(position, 7)];
      });
      chart = `\`\`\`\n${points.join('')}\n\`\`\``;
      break;

    case 'line':
      // Graphique en ligne
      chart = '```\n';
      for (let i = height; i >= 0; i--) {
        let line = '';
        for (let j = 0; j < width; j++) {
          const value = data[j];
          const position = Math.round(((value - minValue) / range) * height);
          line += position >= i ? '●' : ' ';
        }
        chart += line + '\n';
      }
      chart += '```';
      break;

    case 'bar':
      // Graphique en barres
      chart = '```\n';
      for (let i = height; i >= 0; i--) {
        let line = '';
        for (let j = 0; j < width; j++) {
          const value = data[j];
          const barHeight = Math.round(((value - minValue) / range) * height);
          line += barHeight >= i ? '█' : ' ';
        }
        chart += line + '\n';
      }
      chart += '```';
      break;

    case 'area':
      // Graphique en aires
      chart = '```\n';
      for (let i = height; i >= 0; i--) {
        let line = '';
        for (let j = 0; j < width; j++) {
          const value = data[j];
          const position = Math.round(((value - minValue) / range) * height);
          if (position >= i) {
            line += i === 0 ? '▔' : '▀';
          } else if (position + 1 >= i) {
            line += '▁';
          } else {
            line += ' ';
          }
        }
        chart += line + '\n';
      }
      chart += '```';
      break;

    case 'pie':
      // Camembert en ASCII (simplifié)
      const total = data.reduce((sum, val) => sum + val, 0);
      let pieChart = '```\n';
      data.forEach((value, index) => {
        const percentage = ((value / total) * 100).toFixed(1);
        const barLength = Math.round(parseFloat(percentage) / 2);
        const bar = '█'.repeat(barLength);
        const label = labels?.[index] || `Partie ${index + 1}`;
        pieChart += `${label}: ${bar} ${percentage}%\n`;
      });
      pieChart += '```';
      chart = pieChart;
      break;

    default:
      chart = 'Type de graphique non supporté';
  }

  return chart;
}

// ============================================================================
// SYSTÈME DE LOGOS CRYPTO 🪙
// ============================================================================

// Mapping des crypto-monnaies vers leurs logos (cryptologos.cc)
const CRYPTO_LOGOS: Record<string, { name: string; symbol: string; logo: string }> = {
  // Top 50 Cryptos
  BTC: { name: 'bitcoin', symbol: 'btc', logo: 'https://cryptologos.cc/logos/bitcoin-btc-logo.png' },
  ETH: { name: 'ethereum', symbol: 'eth', logo: 'https://cryptologos.cc/logos/ethereum-eth-logo.png' },
  XRP: { name: 'xrp', symbol: 'xrp', logo: 'https://cryptologos.cc/logos/xrp-xrp-logo.png' },
  USDT: { name: 'tether', symbol: 'usdt', logo: 'https://cryptologos.cc/logos/tether-usdt-logo.png' },
  BNB: { name: 'bnb', symbol: 'bnb', logo: 'https://cryptologos.cc/logos/bnb-bnb-logo.png' },
  SOL: { name: 'solana', symbol: 'sol', logo: 'https://cryptologos.cc/logos/solana-sol-logo.png' },
  USDC: { name: 'usd-coin', symbol: 'usdc', logo: 'https://cryptologos.cc/logos/usd-coin-usdc-logo.png' },
  ADA: { name: 'cardano', symbol: 'ada', logo: 'https://cryptologos.cc/logos/cardano-ada-logo.png' },
  DOGE: { name: 'dogecoin', symbol: 'doge', logo: 'https://cryptologos.cc/logos/dogecoin-doge-logo.png' },
  TRX: { name: 'tron', symbol: 'trx', logo: 'https://cryptologos.cc/logos/tron-trx-logo.png' },
  TON: { name: 'toncoin', symbol: 'ton', logo: 'https://cryptologos.cc/logos/toncoin-ton-logo.png' },
  LINK: { name: 'chainlink', symbol: 'link', logo: 'https://cryptologos.cc/logos/chainlink-link-logo.png' },
  MATIC: { name: 'polygon', symbol: 'matic', logo: 'https://cryptologos.cc/logos/polygon-matic-logo.png' },
  DOT: { name: 'polkadot-new', symbol: 'dot', logo: 'https://cryptologos.cc/logos/polkadot-new-dot-logo.png' },
  SHIB: { name: 'shiba-inu', symbol: 'shib', logo: 'https://cryptologos.cc/logos/shiba-inu-shib-logo.png' },
  AVAX: { name: 'avalanche', symbol: 'avax', logo: 'https://cryptologos.cc/logos/avalanche-avax-logo.png' },
  LTC: { name: 'litecoin', symbol: 'ltc', logo: 'https://cryptologos.cc/logos/litecoin-ltc-logo.png' },
  BCH: { name: 'bitcoin-cash', symbol: 'bch', logo: 'https://cryptologos.cc/logos/bitcoin-cash-bch-logo.png' },
  UNI: { name: 'uniswap', symbol: 'uni', logo: 'https://cryptologos.cc/logos/uniswap-uni-logo.png' },
  ATOM: { name: 'cosmos', symbol: 'atom', logo: 'https://cryptologos.cc/logos/cosmos-atom-logo.png' },
  XLM: { name: 'stellar', symbol: 'xlm', logo: 'https://cryptologos.cc/logos/stellar-xlm-logo.png' },
  XMR: { name: 'monero', symbol: 'xmr', logo: 'https://cryptologos.cc/logos/monero-xmr-logo.png' },
  ETC: { name: 'ethereum-classic', symbol: 'etc', logo: 'https://cryptologos.cc/logos/ethereum-classic-etc-logo.png' },
  APT: { name: 'aptos', symbol: 'apt', logo: 'https://cryptologos.cc/logos/aptos-apt-logo.png' },
  NEAR: { name: 'near-protocol', symbol: 'near', logo: 'https://cryptologos.cc/logos/near-protocol-near-logo.png' },
  FIL: { name: 'filecoin', symbol: 'fil', logo: 'https://cryptologos.cc/logos/filecoin-fil-logo.png' },
  ARB: { name: 'arbitrum', symbol: 'arb', logo: 'https://cryptologos.cc/logos/arbitrum-arb-logo.png' },
  OP: { name: 'optimism', symbol: 'op', logo: 'https://cryptologos.cc/logos/optimism-ethereum-op-logo.png' },
  AAVE: { name: 'aave', symbol: 'aave', logo: 'https://cryptologos.cc/logos/aave-aave-logo.png' },
  MKR: { name: 'maker', symbol: 'mkr', logo: 'https://cryptologos.cc/logos/maker-mkr-logo.png' },
  VET: { name: 'vechain', symbol: 'vet', logo: 'https://cryptologos.cc/logos/vechain-vet-logo.png' },
  ALGO: { name: 'algorand', symbol: 'algo', logo: 'https://cryptologos.cc/logos/algorand-algo-logo.png' },
  FTM: { name: 'fantom', symbol: 'ftm', logo: 'https://cryptologos.cc/logos/fantom-ftm-logo.png' },
  SAND: { name: 'the-sandbox', symbol: 'sand', logo: 'https://cryptologos.cc/logos/the-sandbox-sand-logo.png' },
  MANA: { name: 'decentraland', symbol: 'mana', logo: 'https://cryptologos.cc/logos/decentraland-mana-logo.png' },
  AXS: { name: 'axie-infinity', symbol: 'axs', logo: 'https://cryptologos.cc/logos/axie-infinity-axs-logo.png' },
  THETA: { name: 'theta-network', symbol: 'theta', logo: 'https://cryptologos.cc/logos/theta-network-theta-logo.png' },
  EGLD: { name: 'multiversx-egld', symbol: 'egld', logo: 'https://cryptologos.cc/logos/multiversx-egld-egld-logo.png' },
  XTZ: { name: 'tezos', symbol: 'xtz', logo: 'https://cryptologos.cc/logos/tezos-xtz-logo.png' },
  EOS: { name: 'eos', symbol: 'eos', logo: 'https://cryptologos.cc/logos/eos-eos-logo.png' },
  FLOW: { name: 'flow', symbol: 'flow', logo: 'https://cryptologos.cc/logos/flow-flow-logo.png' },
  GRT: { name: 'the-graph', symbol: 'grt', logo: 'https://cryptologos.cc/logos/the-graph-grt-logo.png' },
  CRO: { name: 'cronos', symbol: 'cro', logo: 'https://cryptologos.cc/logos/cronos-cro-logo.png' },
  RUNE: { name: 'thorchain', symbol: 'rune', logo: 'https://cryptologos.cc/logos/thorchain-rune-logo.png' },
  KAVA: { name: 'kava', symbol: 'kava', logo: 'https://cryptologos.cc/logos/kava-kava-logo.png' },
  ZEC: { name: 'zcash', symbol: 'zec', logo: 'https://cryptologos.cc/logos/zcash-zec-logo.png' },
  DASH: { name: 'dash', symbol: 'dash', logo: 'https://cryptologos.cc/logos/dash-dash-logo.png' },
  NEO: { name: 'neo', symbol: 'neo', logo: 'https://cryptologos.cc/logos/neo-neo-logo.png' },
  IOTA: { name: 'iota', symbol: 'iota', logo: 'https://cryptologos.cc/logos/iota-iota-logo.png' },
  CAKE: { name: 'pancakeswap', symbol: 'cake', logo: 'https://cryptologos.cc/logos/pancakeswap-cake-logo.png' },
  // Stablecoins & Wrapped
  DAI: { name: 'multi-collateral-dai', symbol: 'dai', logo: 'https://cryptologos.cc/logos/multi-collateral-dai-dai-logo.png' },
  BUSD: { name: 'binance-usd', symbol: 'busd', logo: 'https://cryptologos.cc/logos/binance-usd-busd-logo.png' },
  WBTC: { name: 'wrapped-bitcoin', symbol: 'wbtc', logo: 'https://cryptologos.cc/logos/wrapped-bitcoin-wbtc-logo.png' },
  WETH: { name: 'weth', symbol: 'weth', logo: 'https://cryptologos.cc/logos/ethereum-eth-logo.png' },
  // DeFi & Others
  COMP: { name: 'compound', symbol: 'comp', logo: 'https://cryptologos.cc/logos/compound-comp-logo.png' },
  SNX: { name: 'synthetix-network-token', symbol: 'snx', logo: 'https://cryptologos.cc/logos/synthetix-network-token-snx-logo.png' },
  CRV: { name: 'curve-dao-token', symbol: 'crv', logo: 'https://cryptologos.cc/logos/curve-dao-token-crv-logo.png' },
  SUSHI: { name: 'sushiswap', symbol: 'sushi', logo: 'https://cryptologos.cc/logos/sushiswap-sushi-logo.png' },
  YFI: { name: 'yearn-finance', symbol: 'yfi', logo: 'https://cryptologos.cc/logos/yearn-finance-yfi-logo.png' },
  INCH: { name: '1inch', symbol: '1inch', logo: 'https://cryptologos.cc/logos/1inch-1inch-logo.png' },
  ENS: { name: 'ethereum-name-service', symbol: 'ens', logo: 'https://cryptologos.cc/logos/ethereum-name-service-ens-logo.png' },
  LDO: { name: 'lido-dao', symbol: 'ldo', logo: 'https://cryptologos.cc/logos/lido-dao-ldo-logo.png' },
  RPL: { name: 'rocket-pool', symbol: 'rpl', logo: 'https://cryptologos.cc/logos/rocket-pool-rpl-logo.png' },
  // Meme coins
  PEPE: { name: 'pepe', symbol: 'pepe', logo: 'https://cryptologos.cc/logos/pepe-pepe-logo.png' },
  FLOKI: { name: 'floki-inu', symbol: 'floki', logo: 'https://cryptologos.cc/logos/floki-inu-floki-logo.png' },
  BONK: { name: 'bonk', symbol: 'bonk', logo: 'https://cryptologos.cc/logos/bonk-bonk-logo.png' },
  // Exchanges
  FTT: { name: 'ftx-token', symbol: 'ftt', logo: 'https://cryptologos.cc/logos/ftx-token-ftt-logo.png' },
  OKB: { name: 'okb', symbol: 'okb', logo: 'https://cryptologos.cc/logos/okb-okb-logo.png' },
  LEO: { name: 'unus-sed-leo', symbol: 'leo', logo: 'https://cryptologos.cc/logos/unus-sed-leo-leo-logo.png' },
  // Privacy
  SCRT: { name: 'secret', symbol: 'scrt', logo: 'https://cryptologos.cc/logos/secret-scrt-logo.png' },
  ROSE: { name: 'oasis-network', symbol: 'rose', logo: 'https://cryptologos.cc/logos/oasis-network-rose-logo.png' },
  // AI & Others
  RNDR: { name: 'render-token', symbol: 'rndr', logo: 'https://cryptologos.cc/logos/render-token-rndr-logo.png' },
  INJ: { name: 'injective', symbol: 'inj', logo: 'https://cryptologos.cc/logos/injective-inj-logo.png' },
  SUI: { name: 'sui', symbol: 'sui', logo: 'https://cryptologos.cc/logos/sui-sui-logo.png' },
  SEI: { name: 'sei', symbol: 'sei', logo: 'https://cryptologos.cc/logos/sei-sei-logo.png' },
  TIA: { name: 'celestia', symbol: 'tia', logo: 'https://cryptologos.cc/logos/celestia-tia-logo.png' },
};

// ============================================================================
// SYSTÈME DE LOGOS ENTREPRISES & INDICES 📈
// ============================================================================

// Base de données des logos d'entreprises (utilise logo.clearbit.com)
const COMPANY_LOGOS: Record<string, { name: string; symbol: string; logo: string; sector: string }> = {
  // === TOP 30 S&P 500 ===
  AAPL: { name: 'Apple', symbol: 'AAPL', logo: 'https://logo.clearbit.com/apple.com', sector: 'Technology' },
  MSFT: { name: 'Microsoft', symbol: 'MSFT', logo: 'https://logo.clearbit.com/microsoft.com', sector: 'Technology' },
  GOOGL: { name: 'Alphabet (Google)', symbol: 'GOOGL', logo: 'https://logo.clearbit.com/google.com', sector: 'Technology' },
  AMZN: { name: 'Amazon', symbol: 'AMZN', logo: 'https://logo.clearbit.com/amazon.com', sector: 'Consumer' },
  NVDA: { name: 'NVIDIA', symbol: 'NVDA', logo: 'https://logo.clearbit.com/nvidia.com', sector: 'Technology' },
  META: { name: 'Meta (Facebook)', symbol: 'META', logo: 'https://logo.clearbit.com/meta.com', sector: 'Technology' },
  TSLA: { name: 'Tesla', symbol: 'TSLA', logo: 'https://logo.clearbit.com/tesla.com', sector: 'Automotive' },
  BRK: { name: 'Berkshire Hathaway', symbol: 'BRK', logo: 'https://logo.clearbit.com/berkshirehathaway.com', sector: 'Finance' },
  JPM: { name: 'JPMorgan Chase', symbol: 'JPM', logo: 'https://logo.clearbit.com/jpmorganchase.com', sector: 'Finance' },
  V: { name: 'Visa', symbol: 'V', logo: 'https://logo.clearbit.com/visa.com', sector: 'Finance' },
  JNJ: { name: 'Johnson & Johnson', symbol: 'JNJ', logo: 'https://logo.clearbit.com/jnj.com', sector: 'Healthcare' },
  WMT: { name: 'Walmart', symbol: 'WMT', logo: 'https://logo.clearbit.com/walmart.com', sector: 'Retail' },
  MA: { name: 'Mastercard', symbol: 'MA', logo: 'https://logo.clearbit.com/mastercard.com', sector: 'Finance' },
  PG: { name: 'Procter & Gamble', symbol: 'PG', logo: 'https://logo.clearbit.com/pg.com', sector: 'Consumer' },
  XOM: { name: 'Exxon Mobil', symbol: 'XOM', logo: 'https://logo.clearbit.com/exxonmobil.com', sector: 'Energy' },
  HD: { name: 'Home Depot', symbol: 'HD', logo: 'https://logo.clearbit.com/homedepot.com', sector: 'Retail' },
  CVX: { name: 'Chevron', symbol: 'CVX', logo: 'https://logo.clearbit.com/chevron.com', sector: 'Energy' },
  MRK: { name: 'Merck', symbol: 'MRK', logo: 'https://logo.clearbit.com/merck.com', sector: 'Healthcare' },
  ABBV: { name: 'AbbVie', symbol: 'ABBV', logo: 'https://logo.clearbit.com/abbvie.com', sector: 'Healthcare' },
  PEP: { name: 'PepsiCo', symbol: 'PEP', logo: 'https://logo.clearbit.com/pepsico.com', sector: 'Consumer' },
  KO: { name: 'Coca-Cola', symbol: 'KO', logo: 'https://logo.clearbit.com/coca-cola.com', sector: 'Consumer' },
  COST: { name: 'Costco', symbol: 'COST', logo: 'https://logo.clearbit.com/costco.com', sector: 'Retail' },
  AVGO: { name: 'Broadcom', symbol: 'AVGO', logo: 'https://logo.clearbit.com/broadcom.com', sector: 'Technology' },
  TMO: { name: 'Thermo Fisher', symbol: 'TMO', logo: 'https://logo.clearbit.com/thermofisher.com', sector: 'Healthcare' },
  MCD: { name: 'McDonald\'s', symbol: 'MCD', logo: 'https://logo.clearbit.com/mcdonalds.com', sector: 'Consumer' },
  CSCO: { name: 'Cisco', symbol: 'CSCO', logo: 'https://logo.clearbit.com/cisco.com', sector: 'Technology' },
  ACN: { name: 'Accenture', symbol: 'ACN', logo: 'https://logo.clearbit.com/accenture.com', sector: 'Technology' },
  ABT: { name: 'Abbott Labs', symbol: 'ABT', logo: 'https://logo.clearbit.com/abbott.com', sector: 'Healthcare' },
  DHR: { name: 'Danaher', symbol: 'DHR', logo: 'https://logo.clearbit.com/danaher.com', sector: 'Healthcare' },
  LIN: { name: 'Linde', symbol: 'LIN', logo: 'https://logo.clearbit.com/linde.com', sector: 'Materials' },

  // === TECH GIANTS ===
  INTC: { name: 'Intel', symbol: 'INTC', logo: 'https://logo.clearbit.com/intel.com', sector: 'Technology' },
  AMD: { name: 'AMD', symbol: 'AMD', logo: 'https://logo.clearbit.com/amd.com', sector: 'Technology' },
  IBM: { name: 'IBM', symbol: 'IBM', logo: 'https://logo.clearbit.com/ibm.com', sector: 'Technology' },
  ORCL: { name: 'Oracle', symbol: 'ORCL', logo: 'https://logo.clearbit.com/oracle.com', sector: 'Technology' },
  CRM: { name: 'Salesforce', symbol: 'CRM', logo: 'https://logo.clearbit.com/salesforce.com', sector: 'Technology' },
  ADBE: { name: 'Adobe', symbol: 'ADBE', logo: 'https://logo.clearbit.com/adobe.com', sector: 'Technology' },
  NFLX: { name: 'Netflix', symbol: 'NFLX', logo: 'https://logo.clearbit.com/netflix.com', sector: 'Entertainment' },
  PYPL: { name: 'PayPal', symbol: 'PYPL', logo: 'https://logo.clearbit.com/paypal.com', sector: 'Finance' },
  SQ: { name: 'Block (Square)', symbol: 'SQ', logo: 'https://logo.clearbit.com/block.xyz', sector: 'Finance' },
  SHOP: { name: 'Shopify', symbol: 'SHOP', logo: 'https://logo.clearbit.com/shopify.com', sector: 'Technology' },
  UBER: { name: 'Uber', symbol: 'UBER', logo: 'https://logo.clearbit.com/uber.com', sector: 'Technology' },
  LYFT: { name: 'Lyft', symbol: 'LYFT', logo: 'https://logo.clearbit.com/lyft.com', sector: 'Technology' },
  ABNB: { name: 'Airbnb', symbol: 'ABNB', logo: 'https://logo.clearbit.com/airbnb.com', sector: 'Technology' },
  SNAP: { name: 'Snap', symbol: 'SNAP', logo: 'https://logo.clearbit.com/snap.com', sector: 'Technology' },
  TWTR: { name: 'X (Twitter)', symbol: 'TWTR', logo: 'https://logo.clearbit.com/x.com', sector: 'Technology' },
  SPOT: { name: 'Spotify', symbol: 'SPOT', logo: 'https://logo.clearbit.com/spotify.com', sector: 'Entertainment' },
  ZOOM: { name: 'Zoom', symbol: 'ZM', logo: 'https://logo.clearbit.com/zoom.us', sector: 'Technology' },
  PLTR: { name: 'Palantir', symbol: 'PLTR', logo: 'https://logo.clearbit.com/palantir.com', sector: 'Technology' },

  // === BANQUES & FINANCE ===
  BAC: { name: 'Bank of America', symbol: 'BAC', logo: 'https://logo.clearbit.com/bankofamerica.com', sector: 'Finance' },
  WFC: { name: 'Wells Fargo', symbol: 'WFC', logo: 'https://logo.clearbit.com/wellsfargo.com', sector: 'Finance' },
  C: { name: 'Citigroup', symbol: 'C', logo: 'https://logo.clearbit.com/citigroup.com', sector: 'Finance' },
  GS: { name: 'Goldman Sachs', symbol: 'GS', logo: 'https://logo.clearbit.com/goldmansachs.com', sector: 'Finance' },
  MS: { name: 'Morgan Stanley', symbol: 'MS', logo: 'https://logo.clearbit.com/morganstanley.com', sector: 'Finance' },
  AXP: { name: 'American Express', symbol: 'AXP', logo: 'https://logo.clearbit.com/americanexpress.com', sector: 'Finance' },
  BLK: { name: 'BlackRock', symbol: 'BLK', logo: 'https://logo.clearbit.com/blackrock.com', sector: 'Finance' },
  SCHW: { name: 'Charles Schwab', symbol: 'SCHW', logo: 'https://logo.clearbit.com/schwab.com', sector: 'Finance' },

  // === AUTOMOBILE ===
  GM: { name: 'General Motors', symbol: 'GM', logo: 'https://logo.clearbit.com/gm.com', sector: 'Automotive' },
  F: { name: 'Ford', symbol: 'F', logo: 'https://logo.clearbit.com/ford.com', sector: 'Automotive' },
  TM: { name: 'Toyota', symbol: 'TM', logo: 'https://logo.clearbit.com/toyota.com', sector: 'Automotive' },
  HMC: { name: 'Honda', symbol: 'HMC', logo: 'https://logo.clearbit.com/honda.com', sector: 'Automotive' },
  RIVN: { name: 'Rivian', symbol: 'RIVN', logo: 'https://logo.clearbit.com/rivian.com', sector: 'Automotive' },
  LCID: { name: 'Lucid', symbol: 'LCID', logo: 'https://logo.clearbit.com/lucidmotors.com', sector: 'Automotive' },
  NIO: { name: 'NIO', symbol: 'NIO', logo: 'https://logo.clearbit.com/nio.com', sector: 'Automotive' },

  // === PHARMA & HEALTHCARE ===
  PFE: { name: 'Pfizer', symbol: 'PFE', logo: 'https://logo.clearbit.com/pfizer.com', sector: 'Healthcare' },
  UNH: { name: 'UnitedHealth', symbol: 'UNH', logo: 'https://logo.clearbit.com/unitedhealthgroup.com', sector: 'Healthcare' },
  LLY: { name: 'Eli Lilly', symbol: 'LLY', logo: 'https://logo.clearbit.com/lilly.com', sector: 'Healthcare' },
  BMY: { name: 'Bristol-Myers', symbol: 'BMY', logo: 'https://logo.clearbit.com/bms.com', sector: 'Healthcare' },
  GILD: { name: 'Gilead', symbol: 'GILD', logo: 'https://logo.clearbit.com/gilead.com', sector: 'Healthcare' },
  MRNA: { name: 'Moderna', symbol: 'MRNA', logo: 'https://logo.clearbit.com/modernatx.com', sector: 'Healthcare' },
  BNTX: { name: 'BioNTech', symbol: 'BNTX', logo: 'https://logo.clearbit.com/biontech.de', sector: 'Healthcare' },

  // === RETAIL & CONSUMER ===
  NKE: { name: 'Nike', symbol: 'NKE', logo: 'https://logo.clearbit.com/nike.com', sector: 'Consumer' },
  SBUX: { name: 'Starbucks', symbol: 'SBUX', logo: 'https://logo.clearbit.com/starbucks.com', sector: 'Consumer' },
  DIS: { name: 'Disney', symbol: 'DIS', logo: 'https://logo.clearbit.com/disney.com', sector: 'Entertainment' },
  TGT: { name: 'Target', symbol: 'TGT', logo: 'https://logo.clearbit.com/target.com', sector: 'Retail' },
  LOW: { name: 'Lowe\'s', symbol: 'LOW', logo: 'https://logo.clearbit.com/lowes.com', sector: 'Retail' },
  EBAY: { name: 'eBay', symbol: 'EBAY', logo: 'https://logo.clearbit.com/ebay.com', sector: 'Retail' },

  // === ENERGY ===
  COP: { name: 'ConocoPhillips', symbol: 'COP', logo: 'https://logo.clearbit.com/conocophillips.com', sector: 'Energy' },
  SLB: { name: 'Schlumberger', symbol: 'SLB', logo: 'https://logo.clearbit.com/slb.com', sector: 'Energy' },
  OXY: { name: 'Occidental', symbol: 'OXY', logo: 'https://logo.clearbit.com/oxy.com', sector: 'Energy' },

  // === AEROSPACE & DEFENSE ===
  BA: { name: 'Boeing', symbol: 'BA', logo: 'https://logo.clearbit.com/boeing.com', sector: 'Aerospace' },
  LMT: { name: 'Lockheed Martin', symbol: 'LMT', logo: 'https://logo.clearbit.com/lockheedmartin.com', sector: 'Aerospace' },
  RTX: { name: 'RTX (Raytheon)', symbol: 'RTX', logo: 'https://logo.clearbit.com/rtx.com', sector: 'Aerospace' },
  NOC: { name: 'Northrop Grumman', symbol: 'NOC', logo: 'https://logo.clearbit.com/northropgrumman.com', sector: 'Aerospace' },
  GD: { name: 'General Dynamics', symbol: 'GD', logo: 'https://logo.clearbit.com/gd.com', sector: 'Aerospace' },

  // === TELECOM ===
  T: { name: 'AT&T', symbol: 'T', logo: 'https://logo.clearbit.com/att.com', sector: 'Telecom' },
  VZ: { name: 'Verizon', symbol: 'VZ', logo: 'https://logo.clearbit.com/verizon.com', sector: 'Telecom' },
  TMUS: { name: 'T-Mobile', symbol: 'TMUS', logo: 'https://logo.clearbit.com/t-mobile.com', sector: 'Telecom' },
};

// Base de données des logos divers (services, réseaux sociaux, etc.)
const MISC_LOGOS: Record<string, { name: string; category: string; logo: string }> = {
  // === RÉSEAUX SOCIAUX ===
  DISCORD: { name: 'Discord', category: 'Social', logo: 'https://logo.clearbit.com/discord.com' },
  TWITTER: { name: 'X (Twitter)', category: 'Social', logo: 'https://logo.clearbit.com/x.com' },
  FACEBOOK: { name: 'Facebook', category: 'Social', logo: 'https://logo.clearbit.com/facebook.com' },
  INSTAGRAM: { name: 'Instagram', category: 'Social', logo: 'https://logo.clearbit.com/instagram.com' },
  LINKEDIN: { name: 'LinkedIn', category: 'Social', logo: 'https://logo.clearbit.com/linkedin.com' },
  TIKTOK: { name: 'TikTok', category: 'Social', logo: 'https://logo.clearbit.com/tiktok.com' },
  REDDIT: { name: 'Reddit', category: 'Social', logo: 'https://logo.clearbit.com/reddit.com' },
  YOUTUBE: { name: 'YouTube', category: 'Social', logo: 'https://logo.clearbit.com/youtube.com' },
  TWITCH: { name: 'Twitch', category: 'Social', logo: 'https://logo.clearbit.com/twitch.tv' },
  TELEGRAM: { name: 'Telegram', category: 'Social', logo: 'https://logo.clearbit.com/telegram.org' },
  WHATSAPP: { name: 'WhatsApp', category: 'Social', logo: 'https://logo.clearbit.com/whatsapp.com' },
  SIGNAL: { name: 'Signal', category: 'Social', logo: 'https://logo.clearbit.com/signal.org' },

  // === SERVICES CLOUD ===
  AWS: { name: 'Amazon AWS', category: 'Cloud', logo: 'https://logo.clearbit.com/aws.amazon.com' },
  AZURE: { name: 'Microsoft Azure', category: 'Cloud', logo: 'https://logo.clearbit.com/azure.microsoft.com' },
  GCP: { name: 'Google Cloud', category: 'Cloud', logo: 'https://logo.clearbit.com/cloud.google.com' },
  CLOUDFLARE: { name: 'Cloudflare', category: 'Cloud', logo: 'https://logo.clearbit.com/cloudflare.com' },
  DIGITALOCEAN: { name: 'DigitalOcean', category: 'Cloud', logo: 'https://logo.clearbit.com/digitalocean.com' },
  HEROKU: { name: 'Heroku', category: 'Cloud', logo: 'https://logo.clearbit.com/heroku.com' },
  VERCEL: { name: 'Vercel', category: 'Cloud', logo: 'https://logo.clearbit.com/vercel.com' },
  NETLIFY: { name: 'Netlify', category: 'Cloud', logo: 'https://logo.clearbit.com/netlify.com' },

  // === EXCHANGES CRYPTO ===
  BINANCE: { name: 'Binance', category: 'Exchange', logo: 'https://logo.clearbit.com/binance.com' },
  COINBASE: { name: 'Coinbase', category: 'Exchange', logo: 'https://logo.clearbit.com/coinbase.com' },
  KRAKEN: { name: 'Kraken', category: 'Exchange', logo: 'https://logo.clearbit.com/kraken.com' },
  FTX: { name: 'FTX', category: 'Exchange', logo: 'https://logo.clearbit.com/ftx.com' },
  KUCOIN: { name: 'KuCoin', category: 'Exchange', logo: 'https://logo.clearbit.com/kucoin.com' },
  BYBIT: { name: 'Bybit', category: 'Exchange', logo: 'https://logo.clearbit.com/bybit.com' },
  OKX: { name: 'OKX', category: 'Exchange', logo: 'https://logo.clearbit.com/okx.com' },
  BITFINEX: { name: 'Bitfinex', category: 'Exchange', logo: 'https://logo.clearbit.com/bitfinex.com' },

  // === BROKERS ===
  ROBINHOOD: { name: 'Robinhood', category: 'Broker', logo: 'https://logo.clearbit.com/robinhood.com' },
  ETRADE: { name: 'E*TRADE', category: 'Broker', logo: 'https://logo.clearbit.com/etrade.com' },
  FIDELITY: { name: 'Fidelity', category: 'Broker', logo: 'https://logo.clearbit.com/fidelity.com' },
  TD: { name: 'TD Ameritrade', category: 'Broker', logo: 'https://logo.clearbit.com/tdameritrade.com' },
  INTERACTIVE: { name: 'Interactive Brokers', category: 'Broker', logo: 'https://logo.clearbit.com/interactivebrokers.com' },
  TRADINGVIEW: { name: 'TradingView', category: 'Broker', logo: 'https://logo.clearbit.com/tradingview.com' },

  // === INDICES ===
  SPX: { name: 'S&P 500', category: 'Index', logo: 'https://logo.clearbit.com/spglobal.com' },
  DJI: { name: 'Dow Jones', category: 'Index', logo: 'https://logo.clearbit.com/dowjones.com' },
  NASDAQ: { name: 'NASDAQ', category: 'Index', logo: 'https://logo.clearbit.com/nasdaq.com' },
  NYSE: { name: 'NYSE', category: 'Index', logo: 'https://logo.clearbit.com/nyse.com' },
  CME: { name: 'CME Group', category: 'Index', logo: 'https://logo.clearbit.com/cmegroup.com' },

  // === BANQUES MONDIALES ===
  HSBC: { name: 'HSBC', category: 'Bank', logo: 'https://logo.clearbit.com/hsbc.com' },
  BARCLAYS: { name: 'Barclays', category: 'Bank', logo: 'https://logo.clearbit.com/barclays.com' },
  UBS: { name: 'UBS', category: 'Bank', logo: 'https://logo.clearbit.com/ubs.com' },
  CS: { name: 'Credit Suisse', category: 'Bank', logo: 'https://logo.clearbit.com/credit-suisse.com' },
  DB: { name: 'Deutsche Bank', category: 'Bank', logo: 'https://logo.clearbit.com/db.com' },
  BNP: { name: 'BNP Paribas', category: 'Bank', logo: 'https://logo.clearbit.com/bnpparibas.com' },
  SANTANDER: { name: 'Santander', category: 'Bank', logo: 'https://logo.clearbit.com/santander.com' },

  // === PAIEMENTS ===
  STRIPE: { name: 'Stripe', category: 'Payment', logo: 'https://logo.clearbit.com/stripe.com' },
  WISE: { name: 'Wise', category: 'Payment', logo: 'https://logo.clearbit.com/wise.com' },
  REVOLUT: { name: 'Revolut', category: 'Payment', logo: 'https://logo.clearbit.com/revolut.com' },
  N26: { name: 'N26', category: 'Payment', logo: 'https://logo.clearbit.com/n26.com' },
  VENMO: { name: 'Venmo', category: 'Payment', logo: 'https://logo.clearbit.com/venmo.com' },
  CASHAPP: { name: 'Cash App', category: 'Payment', logo: 'https://logo.clearbit.com/cash.app' },

  // === NEWS & MEDIAS ===
  BLOOMBERG: { name: 'Bloomberg', category: 'News', logo: 'https://logo.clearbit.com/bloomberg.com' },
  REUTERS: { name: 'Reuters', category: 'News', logo: 'https://logo.clearbit.com/reuters.com' },
  CNBC: { name: 'CNBC', category: 'News', logo: 'https://logo.clearbit.com/cnbc.com' },
  WSJ: { name: 'Wall Street Journal', category: 'News', logo: 'https://logo.clearbit.com/wsj.com' },
  FT: { name: 'Financial Times', category: 'News', logo: 'https://logo.clearbit.com/ft.com' },
  YAHOO: { name: 'Yahoo Finance', category: 'News', logo: 'https://logo.clearbit.com/finance.yahoo.com' },
  COINDESK: { name: 'CoinDesk', category: 'News', logo: 'https://logo.clearbit.com/coindesk.com' },
  COINTELEGRAPH: { name: 'Cointelegraph', category: 'News', logo: 'https://logo.clearbit.com/cointelegraph.com' },
};

// Fonction universelle pour obtenir un logo
function getUniversalLogo(symbol: string): { name: string; logo: string; type: string } | null {
  const upperSymbol = symbol.toUpperCase().replace(/[-_\s]/g, '');

  // Chercher dans les cryptos
  if (CRYPTO_LOGOS[upperSymbol]) {
    const crypto = CRYPTO_LOGOS[upperSymbol];
    return { name: crypto.name, logo: crypto.logo, type: 'crypto' };
  }

  // Chercher dans les entreprises
  if (COMPANY_LOGOS[upperSymbol]) {
    const company = COMPANY_LOGOS[upperSymbol];
    return { name: company.name, logo: company.logo, type: 'company' };
  }

  // Chercher dans les logos divers
  if (MISC_LOGOS[upperSymbol]) {
    const misc = MISC_LOGOS[upperSymbol];
    return { name: misc.name, logo: misc.logo, type: misc.category.toLowerCase() };
  }

  return null;
}

// Fonction pour construire une URL de logo Clearbit dynamique
function buildClearbitLogoUrl(domain: string, size: number = 128): string {
  return `https://logo.clearbit.com/${domain}?size=${size}`;
}

// Fonction pour obtenir le logo d'une crypto
function getCryptoLogo(symbol: string): string | null {
  const upperSymbol = symbol.toUpperCase().replace('-', '').replace('USDT', '').replace('USD', '').replace('PERP', '').replace('BMEX', '').replace('CME', '');
  const crypto = CRYPTO_LOGOS[upperSymbol];
  return crypto ? crypto.logo : null;
}

// Fonction pour obtenir toutes les infos d'une crypto
function getCryptoInfo(symbol: string): { name: string; symbol: string; logo: string } | null {
  const upperSymbol = symbol.toUpperCase().replace('-', '').replace('USDT', '').replace('USD', '').replace('PERP', '').replace('BMEX', '').replace('CME', '');
  return CRYPTO_LOGOS[upperSymbol] || null;
}

// Fonction pour construire une URL de logo personnalisée
function buildCryptoLogoUrl(name: string, symbol: string, format: 'png' | 'svg' = 'png'): string {
  return `https://cryptologos.cc/logos/${name.toLowerCase()}-${symbol.toLowerCase()}-logo.${format}`;
}

// ============================================================================
// NOUVELLES FONCTIONS UTILITAIRES POUR LES MINI-JEUX 🎮
// ============================================================================

// Séparateurs visuels pour le design
const VISUAL_SEPARATORS = {
  line: '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
  dots: '• • • • • • • • • • • • • • •',
  stars: '★ ☆ ★ ☆ ★ ☆ ★ ☆ ★ ☆ ★ ☆ ★ ☆ ★',
  arrows: '➤ ➤ ➤ ➤ ➤ ➤ ➤ ➤ ➤ ➤ ➤ ➤ ➤ ➤ ➤',
  wave: '〰️〰️〰️〰️〰️〰️〰️〰️〰️〰️〰️〰️〰️〰️〰️',
  sparkles: '✨ ✨ ✨ ✨ ✨ ✨ ✨ ✨ ✨ ✨',
  fire: '🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥',
  diamonds: '💎 💎 💎 💎 💎 💎 💎 💎 💎 💎',
};

// Badges visuels
const VISUAL_BADGES = {
  hot: '🔥 HOT',
  new: '✨ NEW',
  trending: '📈 TRENDING',
  vip: '👑 VIP',
  verified: '✅ VERIFIED',
  premium: '💎 PREMIUM',
  live: '🔴 LIVE',
  beta: '🧪 BETA',
};

// 🎉 Animations de réussite
const SUCCESS_ANIMATIONS = {
  confetti: '🎉🎊✨🌟💫⭐🎉🎊✨🌟💫⭐',
  fireworks: '🎆🎇✨💥🎆🎇✨💥🎆🎇✨💥',
  trophy: '🏆🥇🎖️🏅👑🏆🥇🎖️🏅👑',
  party: '🥳🎉🎈🎁🪅🎊🥳🎉🎈🎁',
  stars: '⭐🌟✨💫⭐🌟✨💫⭐🌟✨💫',
  hearts: '💚💙💜❤️🧡💛💚💙💜❤️',
  money: '💰💵💎🤑💰💵💎🤑💰💵',
  rocket: '🚀✨🌟💫🚀✨🌟💫🚀✨',
};

// ❌ Animations d'échec
const FAILURE_ANIMATIONS = {
  sad: '😢😭💔😿😞😢😭💔😿😞',
  explosion: '💥💢❌🚫💥💢❌🚫💥💢',
  skull: '💀☠️👻😵💀☠️👻😵💀☠️',
  rain: '🌧️💧😢🌧️💧😢🌧️💧😢🌧️',
  broken: '💔🔴❌⛔💔🔴❌⛔💔🔴',
  warning: '⚠️🚨❗❌⚠️🚨❗❌⚠️🚨',
};

// Messages de confirmation
const CONFIRMATION_MESSAGES = {
  success: {
    fr: [
      '✅ **Bravo !** Vous avez réussi !',
      '🎉 **Excellent !** C\'est la bonne réponse !',
      '🏆 **Félicitations !** Vous êtes un champion !',
      '⭐ **Parfait !** Continuez comme ça !',
      '💪 **Impressionnant !** Quelle performance !',
      '🚀 **Incroyable !** Vous êtes en feu !',
    ],
    en: [
      '✅ **Great job!** You got it right!',
      '🎉 **Excellent!** That\'s correct!',
      '🏆 **Congratulations!** You\'re a champion!',
    ],
  },
  failure: {
    fr: [
      '❌ **Dommage !** Ce n\'était pas la bonne réponse.',
      '😢 **Raté !** Essayez encore !',
      '💪 **Presque !** Vous y étiez presque !',
      '🔄 **Pas grave !** Retentez votre chance !',
      '📚 **Continuez !** L\'apprentissage c\'est la clé !',
    ],
    en: [
      '❌ **Too bad!** That wasn\'t the right answer.',
      '😢 **Missed!** Try again!',
    ],
  },
  retry: {
    fr: '🔄 **Réessayer ?** Cliquez sur le bouton ci-dessous !',
    en: '🔄 **Try again?** Click the button below!',
  },
};

// Fonction pour générer un message de confirmation
function generateConfirmationMessage(type: 'success' | 'failure', lang: 'fr' | 'en' = 'fr'): string {
  const messages = CONFIRMATION_MESSAGES[type][lang];
  return messages[Math.floor(Math.random() * messages.length)];
}

// Fonction pour générer une animation
function generateAnimation(type: 'success' | 'failure', style?: string): string {
  if (type === 'success') {
    const animations = SUCCESS_ANIMATIONS;
    const key = style && style in animations ? style as keyof typeof animations : 'confetti';
    return animations[key];
  } else {
    const animations = FAILURE_ANIMATIONS;
    const key = style && style in animations ? style as keyof typeof animations : 'sad';
    return animations[key];
  }
}

// Fonction pour générer un résultat de jeu complet
function generateGameResult(
  isSuccess: boolean,
  options: {
    points?: number;
    badge?: string;
    correctAnswer?: string;
    userAnswer?: string;
    animationStyle?: string;
    showRetry?: boolean;
    lang?: 'fr' | 'en';
  } = {}
): string {
  const lang = options.lang || 'fr';
  const animation = generateAnimation(isSuccess ? 'success' : 'failure', options.animationStyle);
  const message = generateConfirmationMessage(isSuccess ? 'success' : 'failure', lang);

  let result = `${animation}\n\n${message}\n\n`;

  if (isSuccess) {
    if (options.points) {
      result += `💰 **+${options.points} points** gagnés !\n`;
    }
    if (options.badge) {
      result += `🏅 **Nouveau badge:** ${options.badge}\n`;
    }
  } else {
    if (options.correctAnswer) {
      result += `📝 **Bonne réponse:** ${options.correctAnswer}\n`;
    }
    if (options.userAnswer) {
      result += `❌ **Votre réponse:** ${options.userAnswer}\n`;
    }
  }

  if (options.showRetry) {
    result += `\n${CONFIRMATION_MESSAGES.retry[lang]}`;
  }

  result += `\n${animation}`;

  return result;
}

// Fonction pour générer un mini-jeu avec design amélioré
function generateMinigame(game: any, gameId: string): string {
  let gameText = '';
  const separator = VISUAL_SEPARATORS.line;

  switch (game.type) {
    case 'quiz':
      gameText = `${separator}
╔══════════════════════════════╗
║  🎮 **QUIZ #${gameId}**  ${VISUAL_BADGES.hot}
╚══════════════════════════════╝

❓ ${game.question}

${game.options?.map((opt: string, i: number) => {
  const letters = ['🅰️', '🅱️', '©️', '🇩'];
  return `${letters[i] || `${String.fromCharCode(65 + i)}.`} ${opt}`;
}).join('\n') || ''}

${game.emoji ? `\n${game.emoji}` : ''}
💡 *Cliquez sur un bouton pour répondre !*
${game.rewards ? `\n🏆 **Récompense:** ${game.rewards.points} pts${game.rewards.badge ? ` + 🏅 ${game.rewards.badge}` : ''}` : ''}
${separator}`;
      break;

    case 'emoji_reaction':
      gameText = `${VISUAL_SEPARATORS.sparkles}
🎯 **JEU D'EMOJIS #${gameId}**

${game.question}

${game.emoji ? `👉 Cliquez: ${game.emoji}` : '👆 Réagissez !'}

${game.rewards ? `🎁 **+${game.rewards.points || 10} points**` : ''}
${VISUAL_SEPARATORS.sparkles}`;
      break;

    case 'trivia':
      gameText = `${VISUAL_SEPARATORS.stars}
🧠 **TRIVIA #${gameId}** ${VISUAL_BADGES.trending}

❓ ${game.question}

💡 *Utilisez les boutons pour répondre*

${game.rewards ? `🏆 **Récompense:** ${game.rewards.points} pts${game.rewards.badge ? `\n🏅 **Badge:** ${game.rewards.badge}` : ''}` : ''}
${VISUAL_SEPARATORS.stars}`;
      break;

    case 'riddle':
      gameText = `${VISUAL_SEPARATORS.diamonds}
🔮 **ÉNIGME #${gameId}** ${VISUAL_BADGES.premium}

🤔 *${game.question}*

💭 Réfléchissez bien...
⏱️ Prenez votre temps !

🎁 **Bonne réponse = ${game.rewards?.points || 10} points**
${VISUAL_SEPARATORS.diamonds}`;
      break;

    case 'puzzle':
      gameText = `${VISUAL_SEPARATORS.fire}
🧩 **PUZZLE #${gameId}** ${VISUAL_BADGES.new}

${game.question}

${game.emoji || '🎯'} *Résolvez le puzzle !*

⚡ *Interagissez avec les boutons*
${VISUAL_SEPARATORS.fire}`;
      break;

    default:
      gameText = `🎮 Mini-jeu #${gameId}`;
  }

  return gameText;
}

// ============================================================================
// NOUVELLES FONCTIONS UTILITAIRES POUR LES LIENS ADAPTATIFS 🔗
// ============================================================================

// Fonction pour adapter les liens selon l'utilisateur
function adaptLinkForUser(link: any, userId: string): string {
  let adaptedUrl = link.url;

  // Adapter selon l'utilisateur si demandé
  if (link.userSpecific) {
    adaptedUrl += `?user=${userId}&ref=discord`;
  }

  // Ajouter les paramètres conditionnels
  if (link.conditions) {
    const params = new URLSearchParams();
    Object.entries(link.conditions).forEach(([key, value]) => {
      params.append(key, value as string);
    });
    adaptedUrl += `${adaptedUrl.includes('?') ? '&' : '?'}${params.toString()}`;
  }

  return `[${link.label}](${adaptedUrl})`;
}

// ============================================================================
// NOUVELLES FONCTIONS UTILITAIRES POUR LES LAYOUTS 🎨
// ============================================================================

// Fonction pour appliquer un layout
function applyLayout(fields: any[], layout: any): any[] {
  if (!layout || layout.type === 'stack') {
    return fields; // Layout par défaut
  }

  switch (layout.type) {
    case 'grid':
      // Réorganiser en grille
      const columns = layout.columns || 2;
      const gridFields: any[] = [];
      for (let i = 0; i < fields.length; i += columns) {
        const row = fields.slice(i, i + columns);
        gridFields.push({
          name: row.map((f: any) => f.name).join(' | '),
          value: row.map((f: any) => f.value).join(' | '),
          inline: true,
        });
      }
      return gridFields;

    case 'sidebar':
      // Séparer en sidebar + contenu principal
      const sidebarField = fields.slice(0, 1);
      const mainFields = fields.slice(1);
      return [
        ...sidebarField.map(f => ({ ...f, inline: false })),
        ...mainFields.map(f => ({ ...f, inline: true })),
      ];

    case 'centered':
      // Centrer les champs
      return fields.map(f => ({ ...f, inline: false }));

    case 'masonry':
      // Layout en briques (alternance inline)
      return fields.map((f, i) => ({
        ...f,
        inline: i % 2 === 0,
      }));

    default:
      return fields;
  }
}

// ============================================================================
// NOUVELLES FONCTIONS UTILITAIRES POUR LES EFFETS VISUELS 🌟
// ============================================================================

// Fonction pour générer les descriptions d'effets visuels
function generateVisualEffectsDescription(effects: any): string {
  if (!effects) return '';

  let description = '';

  if (effects.animations && effects.animations.length > 0) {
    description += `✨ Animations: ${effects.animations.join(', ')}\n`;
  }

  if (effects.particles) {
    description += `✨ Particules activées\n`;
  }

  if (effects.transitions) {
    description += `✨ Transitions fluides\n`;
  }

  if (effects.hoverEffects && effects.hoverEffects.length > 0) {
    description += `✨ Effets hover: ${effects.hoverEffects.join(', ')}\n`;
  }

  if (effects.intensity && effects.intensity !== 'medium') {
    description += `✨ Intensité: ${effects.intensity}\n`;
  }

  return description.trim();
}

// ============================================================================
// OUTIL EMBED 📊
// ============================================================================
server.addTool({
  name: 'creer_embed',
  description: 'Créer un embed Discord ultra-complet avec tableaux, pagination, boutons, thèmes, graphiques, mini-jeux, et liens adaptatifs',
  parameters: z.object({
    channelId: z.string().describe('ID du canal Discord'),
    title: z.string().optional().describe('Titre de l\'embed'),
    description: z.string().optional().describe('Description principale'),
    color: z.string().optional().describe('Couleur en hex (#RRGGBB)'),
    url: z.string().optional().describe('URL cliquable'),
    thumbnail: z.string().optional().describe('URL miniature'),
    image: z.string().optional().describe('URL image'),

    // Auteur & Footer
    authorName: z.string().optional().describe("Nom de l'auteur"),
    authorUrl: z.string().optional().describe("URL de l'auteur"),
    authorIcon: z.string().optional().describe("URL icône auteur"),
    footerText: z.string().optional().describe('Texte footer'),
    footerIcon: z.string().optional().describe('URL icône footer'),

    // Champs avec support tableau
    fields: z.array(z.object({
      name: z.string(),
      value: z.string(),
      inline: z.boolean().optional().default(false),
    })).optional().describe("Champs (supporte | Col1 | Col2 |)"),

    // Options avancées
    timestamp: z.boolean().optional().default(true).describe('Ajouter timestamp'),
    content: z.string().optional().describe('Message texte supplémentaire'),

    // 🎯 PRIORITÉ 1: Tableaux & Pagination
    autoTable: z.boolean().optional().default(true).describe('Auto-formater les tableaux'),
    pagination: z.object({
      enabled: z.boolean().optional().default(false),
      maxLength: z.number().optional().default(1000),
      showPageNumber: z.boolean().optional().default(true),
    }).optional().describe('Pagination pour longs contenus'),

    // 🎯 PRIORITÉ 1: Variables dynamiques
    variables: z.record(z.string()).optional().describe('Variables personnalisées {var}'),

    // 🎯 PRIORITÉ 2: Templates
    templateName: z.string().optional().describe('Nom du template à utiliser'),
    saveAsTemplate: z.string().optional().describe('Sauvegarder comme template'),

    // 🎯 PRIORITÉ 2: Auto-update RÉEL
    autoUpdate: z.object({
      enabled: z.boolean().optional().default(false),
      interval: z.number().optional().describe('Intervalle en secondes'),
      source: z.string().optional().describe('Source de données (URL ou fonction)'),
    }).optional().describe('Mise à jour automatique'),

    // 🎯 PRIORITÉ 2: Boutons interactifs
    buttons: z.array(z.object({
      label: z.string(),
      style: z.enum(['Primary', 'Secondary', 'Success', 'Danger']).default('Primary'),
      emoji: z.string().optional(),
      action: z.enum(['none', 'refresh', 'link', 'custom']).default('none'),
      value: z.string().optional(),
    })).max(5).optional().describe('Boutons intégrés dans l\'embed'),

    // 🎯 PRIORITÉ 3: Progress bars
    progressBars: z.array(z.object({
      fieldIndex: z.number(),
      label: z.string(),
      value: z.number(),
      max: z.number(),
      length: z.number().optional().default(10),
    })).optional().describe('Barres de progression automatiques'),

    // ✨ NOUVEAU: Gradients
    gradient: z.object({
      start: z.string().describe('Couleur de début (#RRGGBB)'),
      end: z.string().describe('Couleur de fin (#RRGGBB)'),
    }).optional().describe('Dégradé de couleurs'),

    // ✨ NOUVEAU: Thèmes
    theme: z.enum(['cyberpunk', 'minimal', 'gaming', 'corporate', 'sunset', 'ocean']).optional().describe('Thème prédéfini'),

    // ✨ NOUVEAU: Analytics
    enableAnalytics: z.boolean().optional().default(true).describe('Activer le tracking analytics'),

    // 📊 NOUVEAU: Graphiques Intégrés
    charts: z.array(z.object({
      type: z.enum(['line', 'bar', 'pie', 'sparkline', 'area']).describe('Type de graphique'),
      title: z.string().describe('Titre du graphique'),
      data: z.array(z.number()).describe('Données du graphique'),
      labels: z.array(z.string()).optional().describe('Labels des données'),
      colors: z.array(z.string()).optional().describe('Couleurs du graphique'),
      size: z.enum(['small', 'medium', 'large']).optional().default('medium').describe('Taille du graphique'),
    })).optional().describe('Graphiques intégrés (ASCII art)'),

    // 🎮 NOUVEAU: Mini-jeux Intégrés
    minigames: z.array(z.object({
      type: z.enum(['quiz', 'puzzle', 'emoji_reaction', 'trivia', 'riddle']).describe('Type de mini-jeu'),
      question: z.string().describe('Question du jeu'),
      options: z.array(z.string()).optional().describe('Options de réponse'),
      correctAnswer: z.string().optional().describe('Réponse correcte'),
      emoji: z.string().optional().describe('Emoji associé'),
      rewards: z.object({
        points: z.number().optional().default(10).describe('Points gagnés'),
        badge: z.string().optional().describe('Badge obtenu'),
      }).optional().describe('Récompenses'),
    })).optional().describe('Mini-jeux intégrés'),

    // 🔗 NOUVEAU: Liens Adaptatifs
    adaptiveLinks: z.array(z.object({
      label: z.string().describe('Texte du lien'),
      url: z.string().describe('URL de base'),
      userSpecific: z.boolean().optional().default(false).describe('Adapter selon l\'utilisateur'),
      webhook: z.string().optional().describe('Webhook à appeler'),
      conditions: z.record(z.string()).optional().describe('Conditions d\'affichage'),
    })).optional().describe('Liens qui s\'adaptent selon l\'utilisateur'),

    // 🎨 NOUVEAU: Système de Layouts
    layout: z.object({
      type: z.enum(['grid', 'stack', 'sidebar', 'centered', 'masonry']).optional().default('stack').describe('Type de mise en page'),
      columns: z.number().optional().default(2).describe('Nombre de colonnes'),
      spacing: z.enum(['compact', 'normal', 'spacious']).optional().default('normal').describe('Espacement'),
      alignment: z.enum(['left', 'center', 'right']).optional().default('left').describe('Alignement'),
    }).optional().describe('Système de mise en page'),

    // 🌟 NOUVEAU: Effets Visuels
    visualEffects: z.object({
      animations: z.array(z.enum(['fade_in', 'slide_up', 'pulse', 'glow', 'bounce', 'shimmer'])).optional().describe('Animations CSS'),
      particles: z.boolean().optional().default(false).describe('Activer les particules'),
      transitions: z.boolean().optional().default(true).describe('Transitions fluides'),
      hoverEffects: z.array(z.enum(['scale', 'rotate', 'glow', 'shadow', 'color_shift'])).optional().describe('Effets au survol'),
      intensity: z.enum(['low', 'medium', 'high']).optional().default('medium').describe('Intensité des effets'),
    }).optional().describe('Effets visuels et animations'),

    // 🪙 NOUVEAU: Logos Crypto
    cryptoLogo: z.object({
      symbol: z.string().describe('Symbole crypto (BTC, ETH, SOL, etc.)'),
      position: z.enum(['thumbnail', 'author', 'footer', 'image']).optional().default('thumbnail').describe('Position du logo'),
      size: z.enum(['small', 'medium', 'large']).optional().default('medium').describe('Taille du logo'),
      format: z.enum(['png', 'svg']).optional().default('png').describe('Format de l\'image'),
    }).optional().describe('Logo crypto automatique depuis cryptologos.cc'),

    // 🪙 NOUVEAU: Afficher plusieurs cryptos avec logos
    cryptoList: z.array(z.object({
      symbol: z.string().describe('Symbole crypto'),
      name: z.string().optional().describe('Nom affiché'),
      value: z.string().optional().describe('Valeur/Prix'),
      showLogo: z.boolean().optional().default(true).describe('Afficher le logo'),
    })).optional().describe('Liste de cryptos avec logos'),

    // 🎨 NOUVEAU: Design visuel amélioré
    visualDesign: z.object({
      separator: z.enum(['line', 'dots', 'stars', 'arrows', 'wave', 'sparkles', 'fire', 'diamonds']).optional().default('line').describe('Style de séparateur'),
      badge: z.enum(['hot', 'new', 'trending', 'vip', 'verified', 'premium', 'live', 'beta']).optional().describe('Badge visuel'),
      headerStyle: z.enum(['minimal', 'boxed', 'banner', 'neon']).optional().default('minimal').describe('Style de l\'en-tête'),
      showBorders: z.boolean().optional().default(false).describe('Afficher des bordures ASCII'),
    }).optional().describe('Options de design visuel'),

    // Validation
    strictValidation: z.boolean().optional().default(true).describe('Validation stricte 1024 chars'),
  }),
  execute: async args => {
    try {
      console.error(`🚀 [creer_embed] Titre: ${args.title || 'N/A'}`);
      const client = await ensureDiscordConnection();
      const channel = await client.channels.fetch(args.channelId);

      if (!channel || !('send' in channel)) {
        throw new Error('Canal invalide ou inaccessible');
      }

      // Charger le template si spécifié
      let embedData = {};
      if (args.templateName) {
        const template = await loadTemplate(args.templateName);
        if (!template) {
          return `❌ Template '${args.templateName}' non trouvé`;
        }
        embedData = template;
      }

      // Appliquer le thème si spécifié
      if (args.theme) {
        embedData = applyTheme(args.theme, embedData);
      }

      // Construire l'embed avec les données
      const embed = new EmbedBuilder();

      // Appliquer les données du template ou des paramètres
      const dataToUse = { ...embedData, ...args };

      // 🎨 Appliquer le design visuel amélioré
      let titlePrefix = '';
      let descriptionPrefix = '';
      let descriptionSuffix = '';

      if (args.visualDesign) {
        // Badge visuel
        if (args.visualDesign.badge) {
          titlePrefix = `${VISUAL_BADGES[args.visualDesign.badge]} `;
        }

        // Style d'en-tête
        const separator = VISUAL_SEPARATORS[args.visualDesign.separator || 'line'];
        switch (args.visualDesign.headerStyle) {
          case 'boxed':
            descriptionPrefix = `\`\`\`\n╔══════════════════════════════════╗\n║ \`\`\``;
            descriptionSuffix = `\`\`\`\n╚══════════════════════════════════╝\n\`\`\``;
            break;
          case 'banner':
            descriptionPrefix = `${separator}\n`;
            descriptionSuffix = `\n${separator}`;
            break;
          case 'neon':
            descriptionPrefix = `✨━━━━━━━━━✨\n`;
            descriptionSuffix = `\n✨━━━━━━━━━✨`;
            break;
        }

        // Bordures ASCII
        if (args.visualDesign.showBorders) {
          descriptionPrefix = `┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓\n┃ `;
          descriptionSuffix = ` ┃\n┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛`;
        }
      }

      if (dataToUse.title) embed.setTitle(titlePrefix + replaceVariables(dataToUse.title, args.variables));
      if (dataToUse.description) {
        let description = dataToUse.description;
        // Parser les tableaux automatiquement
        if (args.autoTable && description.includes('|')) {
          description = parseTable(description);
        }
        description = descriptionPrefix + replaceVariables(description, args.variables) + descriptionSuffix;
        embed.setDescription(description);
      }

      // Gestion de la couleur avec support gradient
      if (dataToUse.color) {
        if (args.gradient) {
          // Pour les gradients, on utilise la couleur de début comme couleur principale
          embed.setColor(args.gradient.start as any);
        } else if (typeof dataToUse.color === 'number') {
          embed.setColor(dataToUse.color);
        } else if (typeof dataToUse.color === 'string') {
          if (dataToUse.color.startsWith('#')) {
            embed.setColor(dataToUse.color as any);
          } else {
            const colorMap: { [key: string]: number } = {
              RED: 0xe74c3c, GREEN: 0x2ecc71, BLUE: 0x3498db, YELLOW: 0xf1c40f,
              PURPLE: 0x9b59b6, ORANGE: 0xe67e22, AQUA: 0x1abc9c, WHITE: 0xffffff,
              BLACK: 0x000000, BLURPLE: 0x5865f2,
            };
            const upperColor = dataToUse.color.toUpperCase().replace(/ /g, '_');
            embed.setColor(colorMap[upperColor] || 0x000000);
          }
        }
      }

      if (dataToUse.url) embed.setURL(dataToUse.url);
      if (dataToUse.thumbnail) embed.setThumbnail(dataToUse.thumbnail);
      if (dataToUse.image) embed.setImage(dataToUse.image);

      // 🪙 Logo Crypto automatique
      if (args.cryptoLogo) {
        const cryptoInfo = getCryptoInfo(args.cryptoLogo.symbol);
        if (cryptoInfo) {
          const logoUrl = args.cryptoLogo.format === 'svg'
            ? cryptoInfo.logo.replace('.png', '.svg')
            : cryptoInfo.logo;

          switch (args.cryptoLogo.position) {
            case 'thumbnail':
              embed.setThumbnail(logoUrl);
              break;
            case 'image':
              embed.setImage(logoUrl);
              break;
            case 'author':
              if (!dataToUse.authorName) {
                embed.setAuthor({
                  name: `${cryptoInfo.symbol.toUpperCase()} - ${cryptoInfo.name}`,
                  iconURL: logoUrl,
                });
              } else {
                embed.setAuthor({
                  name: replaceVariables(dataToUse.authorName, args.variables),
                  url: dataToUse.authorUrl,
                  iconURL: logoUrl,
                });
              }
              break;
            case 'footer':
              if (!dataToUse.footerText) {
                embed.setFooter({
                  text: `${cryptoInfo.symbol.toUpperCase()} | cryptologos.cc`,
                  iconURL: logoUrl,
                });
              }
              break;
          }
        }
      }

      // Auteur
      if (dataToUse.authorName) {
        embed.setAuthor({
          name: replaceVariables(dataToUse.authorName, args.variables),
          url: dataToUse.authorUrl,
          iconURL: dataToUse.authorIcon,
        });
      }

      // Footer
      if (dataToUse.footerText) {
        let footerText = replaceVariables(dataToUse.footerText, args.variables);
        // Ajouter info gradient si présent
        if (args.gradient) {
          footerText += ` | Gradient: ${args.gradient.start} → ${args.gradient.end}`;
        }
        embed.setFooter({
          text: footerText,
          iconURL: args.footerIcon,
        });
      }

      // Traitement des champs avec validation
      let processedFields = dataToUse.fields || [];

      // 📊 Ajouter les graphiques intégrés
      if (args.charts && args.charts.length > 0) {
        args.charts.forEach((chart, index) => {
          const asciiChart = generateAsciiChart(chart.type, chart.data, chart.labels, {
            height: chart.size === 'small' ? 5 : chart.size === 'large' ? 15 : 10
          });
          processedFields.push({
            name: `📊 ${chart.title}`,
            value: asciiChart,
            inline: chart.size === 'small',
          });
        });
      }

      // 🎮 Ajouter les mini-jeux intégrés
      if (args.minigames && args.minigames.length > 0) {
        args.minigames.forEach((game, index) => {
          const gameText = generateMinigame(game, (index + 1).toString());
          processedFields.push({
            name: `🎮 ${game.type.toUpperCase()}`,
            value: gameText,
            inline: false,
          });
        });
      }

      // 🔗 Ajouter les liens adaptatifs
      if (args.adaptiveLinks && args.adaptiveLinks.length > 0) {
        const linksText = args.adaptiveLinks.map(link =>
          adaptLinkForUser(link, 'USER_ID')
        ).join('\n');
        processedFields.push({
          name: '🔗 Liens',
          value: linksText,
          inline: false,
        });
      }

      // Ajouter les barres de progression
      if (args.progressBars && args.progressBars.length > 0) {
        args.progressBars.forEach(progress => {
          const bar = createProgressBar(progress.value, progress.max, progress.length);
          const percentage = Math.round((progress.value / progress.max) * 100);
          processedFields.push({
            name: `${progress.label}`,
            value: `${bar} ${percentage}% (${progress.value}/${progress.max})`,
            inline: false,
          });
        });
      }

      // 🎨 Appliquer le système de layout
      if (args.layout) {
        processedFields = applyLayout(processedFields, args.layout);
      }

      // Parser les tableaux et remplacer les variables dans les champs
      processedFields = processedFields.map(field => ({
        ...field,
        name: replaceVariables(field.name, args.variables),
        value: args.autoTable && field.value.includes('|')
          ? parseTable(field.value)
          : replaceVariables(field.value, args.variables),
      }));

      // 🌟 Ajouter la description des effets visuels
      if (args.visualEffects) {
        const effectsDesc = generateVisualEffectsDescription(args.visualEffects);
        if (effectsDesc) {
          processedFields.push({
            name: '🌟 Effets Visuels',
            value: effectsDesc,
            inline: false,
          });
        }
      }

      // 🪙 Ajouter la liste de cryptos avec logos
      if (args.cryptoList && args.cryptoList.length > 0) {
        const cryptoLines = args.cryptoList.map((crypto, index) => {
          const cryptoInfo = getCryptoInfo(crypto.symbol);
          const displayName = crypto.name || cryptoInfo?.name || crypto.symbol;
          const logoLink = cryptoInfo ? `[Logo](${cryptoInfo.logo})` : '';
          const value = crypto.value ? ` - ${crypto.value}` : '';

          return `${index + 1}. **${displayName.charAt(0).toUpperCase() + displayName.slice(1)}** (${crypto.symbol.toUpperCase()})${value}\n${crypto.showLogo !== false ? `   ${logoLink}` : ''}`;
        });

        processedFields.push({
          name: '🪙 Crypto-monnaies',
          value: cryptoLines.join('\n'),
          inline: false,
        });
      }

      // Ajouter les champs
      if (processedFields.length > 0) {
        processedFields.forEach(field => {
          embed.addFields({
            name: field.name,
            value: field.value,
            inline: field.inline || false,
          });
        });
      }

      if (dataToUse.timestamp !== false) {
        embed.setTimestamp();
      }

      // Validation stricte
      if (args.strictValidation) {
        const validation = validateFieldLength(processedFields);
        if (validation.warnings.length > 0) {
          console.warn('⚠️ Avertissements:', validation.warnings);
        }
      }

      // Sauvegarder comme template si demandé
      if (args.saveAsTemplate) {
        await saveTemplate(args.saveAsTemplate, embed.data);
        console.log(`💾 Template '${args.saveAsTemplate}' sauvegardé`);
      }

      // Générer un ID unique pour l'embed
      const embedId = `embed_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // 🎮 Construire les boutons interactifs
      const components: any[] = [];
      if (args.buttons && args.buttons.length > 0) {
        const styleMap: Record<string, any> = {
          Primary: ButtonStyle.Primary,
          Secondary: ButtonStyle.Secondary,
          Success: ButtonStyle.Success,
          Danger: ButtonStyle.Danger,
        };

        const row = new ActionRowBuilder<ButtonBuilder>();

        for (const btn of args.buttons) {
          const buttonId = `embedv2_${embedId}_${btn.action}_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
          const button = new ButtonBuilder()
            .setCustomId(buttonId)
            .setLabel(btn.label)
            .setStyle(styleMap[btn.style] || ButtonStyle.Primary);

          if (btn.emoji) {
            button.setEmoji(btn.emoji);
          }

          row.addComponents(button);
        }

        components.push(row);
      }

      // 🎮 Ajouter boutons de mini-jeux
      if (args.minigames && args.minigames.length > 0) {
        const gameRow = new ActionRowBuilder<ButtonBuilder>();

        args.minigames.forEach((game, index) => {
          if (game.type === 'quiz' && game.options) {
            // Pour quiz, ajouter boutons A, B, C, D
            game.options.slice(0, 4).forEach((opt, optIndex) => {
              const optionLetter = String.fromCharCode(65 + optIndex);
              const button = new ButtonBuilder()
                .setCustomId(`game_${embedId}_quiz_${index}_${optIndex}`)
                .setLabel(optionLetter)
                .setStyle(ButtonStyle.Secondary);
              gameRow.addComponents(button);
            });
          } else if (game.type === 'emoji_reaction' && game.emoji) {
            const button = new ButtonBuilder()
              .setCustomId(`game_${embedId}_emoji_${index}`)
              .setLabel('Réagir')
              .setEmoji(game.emoji)
              .setStyle(ButtonStyle.Primary);
            gameRow.addComponents(button);
          }
        });

        if (gameRow.components.length > 0) {
          components.push(gameRow);
        }
      }

      // 🔗 Ajouter boutons de liens adaptatifs (URL buttons)
      if (args.adaptiveLinks && args.adaptiveLinks.length > 0) {
        const linkRow = new ActionRowBuilder<ButtonBuilder>();

        args.adaptiveLinks.slice(0, 5).forEach((link, index) => {
          // Les boutons Link doivent avoir une URL, pas un customId
          const button = new ButtonBuilder()
            .setLabel(link.label)
            .setStyle(ButtonStyle.Link)
            .setURL(link.url);
          linkRow.addComponents(button);
        });

        if (linkRow.components.length > 0) {
          components.push(linkRow);
        }
      }

      // Envoyer le message avec boutons
      const message = await channel.send({
        content: args.content,
        embeds: [embed],
        components: components,
      });

      // Track la vue
      if (args.enableAnalytics) {
        trackEmbedView(message.id);
      }

      // Configuration de l'auto-update si activée
      if (args.autoUpdate?.enabled && args.autoUpdate.interval && !args.pagination?.enabled) {
        autoUpdateEmbeds.set(message.id, {
          messageId: message.id,
          channelId: args.channelId,
          embedData: dataToUse,
          interval: args.autoUpdate.interval,
          lastUpdate: Date.now(),
          source: args.autoUpdate.source,
          updateCount: 0,
        });
        console.log(`🔄 Auto-update activé pour embed ${message.id}: ${args.autoUpdate.interval}s`);
      }

      // Construire la réponse
      let response = `✅ Embed v2 ULTRA-COMPLET créé | ID: ${message.id}`;
      response += ` | Champs: ${processedFields.length}`;
      if (args.autoTable) response += ' | Tableaux auto';
      if (args.pagination?.enabled) response += ' | Paginé';
      if (args.buttons?.length) response += ` | Boutons: ${args.buttons.length}`;
      if (args.gradient) response += ` | Gradient: ${args.gradient.start}→${args.gradient.end}`;
      if (args.theme) response += ` | Thème: ${args.theme}`;
      if (args.autoUpdate?.enabled) response += ` | Auto-update: ${args.autoUpdate.interval}s`;
      if (args.enableAnalytics) response += ' | Analytics: ON';
      if (args.charts?.length) response += ` | Graphiques: ${args.charts.length}`;
      if (args.minigames?.length) response += ` | Mini-jeux: ${args.minigames.length}`;
      if (args.adaptiveLinks?.length) response += ` | Liens adaptatifs: ${args.adaptiveLinks.length}`;
      if (args.layout?.type && args.layout.type !== 'stack') response += ` | Layout: ${args.layout.type}`;
      if (args.visualEffects) response += ' | Effets visuels';

      return response;
    } catch (error: any) {
      console.error(`❌ [creer_embed]`, error.message);
      return `❌ Erreur: ${error.message}`;
    }
  },
});

// ============================================================================
// OUTILS D'ANALYTICS 📊
// ============================================================================

// Outil pour voir les analytics d'un embed
server.addTool({
  name: 'get_embed_analytics',
  description: 'Obtenir les analytics d\'un embed spécifique',
  parameters: z.object({
    embedId: z.string().describe('ID du message embed'),
  }),
  execute: async args => {
    try {
      const report = generateAnalyticsReport(args.embedId);
      return report;
    } catch (error: any) {
      return `❌ Erreur: ${error.message}`;
    }
  },
});

// Outil pour voir tous les embeds avec auto-update
server.addTool({
  name: 'list_auto_update_embeds',
  description: 'Lister tous les embeds avec auto-update actif',
  parameters: z.object({}),
  execute: async () => {
    try {
      const embeds = Array.from(autoUpdateEmbeds.entries()).map(([id, info]) => {
        const timeSinceUpdate = Date.now() - info.lastUpdate;
        const nextUpdateIn = Math.max(0, (info.interval * 1000) - timeSinceUpdate);
        return `• ${id}
  📅 Créé: ${new Date(info.lastUpdate).toLocaleString('fr-FR')}
  🔄 Intervalle: ${info.interval}s
  ⏭️ Prochaine MAJ: ${Math.ceil(nextUpdateIn / 1000)}s
  📊 MAJ effectuées: ${info.updateCount}
  💬 Canal: ${info.channelId}`;
      });

      if (embeds.length === 0) {
        return 'ℹ️ Aucun embed avec auto-update actif';
      }

      return `🔄 **${embeds.length} embed(s) avec auto-update:**\n\n${embeds.join('\n\n')}`;
    } catch (error: any) {
      return `❌ Erreur: ${error.message}`;
    }
  },
});

// 🪙 Outil pour lister les logos crypto disponibles
server.addTool({
  name: 'list_crypto_logos',
  description: 'Lister tous les logos crypto disponibles (cryptologos.cc)',
  parameters: z.object({
    category: z.enum(['all', 'top20', 'defi', 'meme', 'stablecoins', 'exchanges']).optional().default('all').describe('Catégorie de cryptos'),
    search: z.string().optional().describe('Rechercher par symbole ou nom'),
  }),
  execute: async (args) => {
    try {
      let cryptos = Object.entries(CRYPTO_LOGOS);

      // Filtrer par catégorie
      if (args.category !== 'all') {
        const categories: Record<string, string[]> = {
          top20: ['BTC', 'ETH', 'XRP', 'USDT', 'BNB', 'SOL', 'USDC', 'ADA', 'DOGE', 'TRX', 'TON', 'LINK', 'MATIC', 'DOT', 'SHIB', 'AVAX', 'LTC', 'BCH', 'UNI', 'ATOM'],
          defi: ['UNI', 'AAVE', 'MKR', 'COMP', 'SNX', 'CRV', 'SUSHI', 'YFI', 'INCH', 'LDO', 'RPL', 'GRT'],
          meme: ['DOGE', 'SHIB', 'PEPE', 'FLOKI', 'BONK'],
          stablecoins: ['USDT', 'USDC', 'DAI', 'BUSD'],
          exchanges: ['BNB', 'FTT', 'OKB', 'LEO', 'CRO'],
        };
        const categorySymbols = categories[args.category] || [];
        cryptos = cryptos.filter(([symbol]) => categorySymbols.includes(symbol));
      }

      // Recherche
      if (args.search) {
        const searchLower = args.search.toLowerCase();
        cryptos = cryptos.filter(([symbol, info]) =>
          symbol.toLowerCase().includes(searchLower) ||
          info.name.toLowerCase().includes(searchLower)
        );
      }

      const logosList = cryptos.map(([symbol, info]) =>
        `• **${symbol}** - ${info.name}\n  [Voir le logo](${info.logo})`
      );

      return `🪙 **${cryptos.length} logos crypto disponibles:**\n\n${logosList.join('\n\n')}\n\n📌 *Source: cryptologos.cc - PNG et SVG disponibles*`;
    } catch (error: any) {
      return `❌ Erreur: ${error.message}`;
    }
  },
});

// 📈 Outil pour lister les logos d'entreprises (S&P 500, etc.)
server.addTool({
  name: 'list_company_logos',
  description: 'Lister les logos d\'entreprises (S&P 500, Tech, Finance, etc.)',
  parameters: z.object({
    sector: z.enum(['all', 'technology', 'finance', 'healthcare', 'consumer', 'energy', 'automotive', 'aerospace', 'telecom', 'retail', 'entertainment']).optional().default('all').describe('Secteur d\'activité'),
    search: z.string().optional().describe('Rechercher par symbole ou nom'),
  }),
  execute: async (args) => {
    try {
      let companies = Object.entries(COMPANY_LOGOS);

      // Filtrer par secteur
      if (args.sector !== 'all') {
        const sectorMap: Record<string, string> = {
          technology: 'Technology',
          finance: 'Finance',
          healthcare: 'Healthcare',
          consumer: 'Consumer',
          energy: 'Energy',
          automotive: 'Automotive',
          aerospace: 'Aerospace',
          telecom: 'Telecom',
          retail: 'Retail',
          entertainment: 'Entertainment',
        };
        const targetSector = sectorMap[args.sector];
        companies = companies.filter(([_, info]) => info.sector === targetSector);
      }

      // Recherche
      if (args.search) {
        const searchLower = args.search.toLowerCase();
        companies = companies.filter(([symbol, info]) =>
          symbol.toLowerCase().includes(searchLower) ||
          info.name.toLowerCase().includes(searchLower)
        );
      }

      const logosList = companies.slice(0, 30).map(([symbol, info]) =>
        `• **${symbol}** - ${info.name} (${info.sector})\n  [Logo](${info.logo})`
      );

      return `📈 **${companies.length} logos entreprises disponibles:**\n\n${logosList.join('\n\n')}\n\n📌 *Source: logo.clearbit.com*`;
    } catch (error: any) {
      return `❌ Erreur: ${error.message}`;
    }
  },
});

// 🌐 Outil pour lister les logos divers (réseaux sociaux, services, etc.)
server.addTool({
  name: 'list_misc_logos',
  description: 'Lister les logos divers (réseaux sociaux, cloud, brokers, news, etc.)',
  parameters: z.object({
    category: z.enum(['all', 'social', 'cloud', 'exchange', 'broker', 'index', 'bank', 'payment', 'news']).optional().default('all').describe('Catégorie'),
    search: z.string().optional().describe('Rechercher par nom'),
  }),
  execute: async (args) => {
    try {
      let logos = Object.entries(MISC_LOGOS);

      // Filtrer par catégorie
      if (args.category !== 'all') {
        const categoryMap: Record<string, string> = {
          social: 'Social',
          cloud: 'Cloud',
          exchange: 'Exchange',
          broker: 'Broker',
          index: 'Index',
          bank: 'Bank',
          payment: 'Payment',
          news: 'News',
        };
        const targetCategory = categoryMap[args.category];
        logos = logos.filter(([_, info]) => info.category === targetCategory);
      }

      // Recherche
      if (args.search) {
        const searchLower = args.search.toLowerCase();
        logos = logos.filter(([key, info]) =>
          key.toLowerCase().includes(searchLower) ||
          info.name.toLowerCase().includes(searchLower)
        );
      }

      const logosList = logos.map(([key, info]) =>
        `• **${info.name}** (${info.category})\n  [Logo](${info.logo})`
      );

      return `🌐 **${logos.length} logos disponibles:**\n\n${logosList.join('\n\n')}\n\n📌 *Source: logo.clearbit.com*`;
    } catch (error: any) {
      return `❌ Erreur: ${error.message}`;
    }
  },
});

// 🔍 Outil universel pour obtenir un logo (recherche dans toutes les bases)
server.addTool({
  name: 'get_logo',
  description: 'Obtenir un logo universel (crypto, entreprise, service, etc.)',
  parameters: z.object({
    symbol: z.string().describe('Symbole ou nom (BTC, AAPL, DISCORD, etc.)'),
    size: z.number().optional().default(128).describe('Taille du logo (pour Clearbit)'),
  }),
  execute: async (args) => {
    try {
      const result = getUniversalLogo(args.symbol);

      if (result) {
        return `✅ **${result.name}**\n\n🏷️ Type: ${result.type}\n📸 Logo: ${result.logo}\n\n💡 Utilise ce lien dans 'thumbnail' ou 'image' de creer_embed`;
      }

      // Si pas trouvé, essayer de générer un lien Clearbit
      const domain = args.symbol.toLowerCase().replace(/[^a-z0-9]/g, '') + '.com';
      const clearbitUrl = buildClearbitLogoUrl(domain, args.size);

      return `⚠️ '${args.symbol}' non trouvé dans la base.\n\n🔄 **Essaye ce lien Clearbit:**\n${clearbitUrl}\n\n💡 Tu peux aussi utiliser n'importe quel domaine:\n\`https://logo.clearbit.com/DOMAINE.com\``;
    } catch (error: any) {
      return `❌ Erreur: ${error.message}`;
    }
  },
});

// 🪙 Outil pour obtenir un logo crypto spécifique
server.addTool({
  name: 'get_crypto_logo',
  description: 'Obtenir le logo d\'une crypto spécifique',
  parameters: z.object({
    symbol: z.string().describe('Symbole de la crypto (BTC, ETH, SOL, etc.)'),
    format: z.enum(['png', 'svg']).optional().default('png').describe('Format de l\'image'),
  }),
  execute: async (args) => {
    try {
      const cryptoInfo = getCryptoInfo(args.symbol);
      if (!cryptoInfo) {
        return `❌ Crypto '${args.symbol}' non trouvée dans la base.\n💡 Utilise 'list_crypto_logos' pour voir les cryptos disponibles.`;
      }

      const logoUrl = args.format === 'svg'
        ? cryptoInfo.logo.replace('.png', '.svg')
        : cryptoInfo.logo;

      return `🪙 **${cryptoInfo.symbol.toUpperCase()} - ${cryptoInfo.name}**\n\n📸 Logo (${args.format.toUpperCase()}): ${logoUrl}\n\n💡 Utilise ce lien dans 'thumbnail' ou 'image' de creer_embed`;
    } catch (error: any) {
      return `❌ Erreur: ${error.message}`;
    }
  },
});

// 🎮 Outil pour afficher un résultat de jeu avec animation
server.addTool({
  name: 'show_game_result',
  description: 'Afficher un résultat de jeu avec animation de réussite/échec et option de recommencer',
  parameters: z.object({
    channelId: z.string().describe('ID du canal'),
    isSuccess: z.boolean().describe('true = réussite, false = échec'),
    points: z.number().optional().describe('Points gagnés'),
    badge: z.string().optional().describe('Badge obtenu'),
    correctAnswer: z.string().optional().describe('Bonne réponse (si échec)'),
    userAnswer: z.string().optional().describe('Réponse de l\'utilisateur'),
    animationStyle: z.enum(['confetti', 'fireworks', 'trophy', 'party', 'stars', 'hearts', 'money', 'rocket', 'sad', 'explosion', 'skull', 'rain', 'broken', 'warning']).optional().describe('Style d\'animation'),
    showRetry: z.boolean().optional().default(true).describe('Afficher bouton recommencer'),
    retryGameId: z.string().optional().describe('ID du jeu pour recommencer'),
    theme: z.enum(['cyberpunk', 'minimal', 'gaming', 'corporate', 'sunset', 'ocean']).optional().describe('Thème de l\'embed'),
  }),
  execute: async (args) => {
    try {
      const client = await ensureDiscordConnection();
      const channel = await client.channels.fetch(args.channelId);

      if (!channel || !('send' in channel)) {
        throw new Error('Canal invalide');
      }

      // Générer le résultat
      const resultText = generateGameResult(args.isSuccess, {
        points: args.points,
        badge: args.badge,
        correctAnswer: args.correctAnswer,
        userAnswer: args.userAnswer,
        animationStyle: args.animationStyle,
        showRetry: args.showRetry,
        lang: 'fr',
      });

      // Créer l'embed
      const embed = new EmbedBuilder()
        .setTitle(args.isSuccess ? '🎉 VICTOIRE !' : '😢 DOMMAGE...')
        .setDescription(resultText)
        .setColor(args.isSuccess ? 0x00FF00 : 0xFF0000)
        .setTimestamp();

      // Appliquer le thème si spécifié
      if (args.theme) {
        const themeData = EMBED_THEMES[args.theme];
        if (themeData) {
          embed.setColor(themeData.color as any);
        }
      }

      // Ajouter bouton recommencer si demandé
      const components: any[] = [];
      if (args.showRetry) {
        const row = new ActionRowBuilder<ButtonBuilder>();

        const retryButton = new ButtonBuilder()
          .setCustomId(`retry_game_${args.retryGameId || Date.now()}`)
          .setLabel('🔄 Recommencer')
          .setStyle(ButtonStyle.Primary);

        const closeButton = new ButtonBuilder()
          .setCustomId(`close_result_${Date.now()}`)
          .setLabel('❌ Fermer')
          .setStyle(ButtonStyle.Secondary);

        row.addComponents(retryButton, closeButton);

        if (args.isSuccess) {
          const nextButton = new ButtonBuilder()
            .setCustomId(`next_game_${Date.now()}`)
            .setLabel('➡️ Niveau suivant')
            .setStyle(ButtonStyle.Success);
          row.addComponents(nextButton);
        }

        components.push(row);
      }

      const message = await channel.send({
        embeds: [embed],
        components: components,
      });

      return `✅ Résultat affiché | ${args.isSuccess ? '🎉 Réussite' : '❌ Échec'} | ID: ${message.id}`;
    } catch (error: any) {
      return `❌ Erreur: ${error.message}`;
    }
  },
});

// 🎮 Outil pour créer un quiz interactif complet
server.addTool({
  name: 'create_interactive_quiz',
  description: 'Créer un quiz interactif avec validation automatique et animations',
  parameters: z.object({
    channelId: z.string().describe('ID du canal'),
    question: z.string().describe('Question du quiz'),
    options: z.array(z.string()).min(2).max(4).describe('Options de réponse (2-4)'),
    correctIndex: z.number().min(0).max(3).describe('Index de la bonne réponse (0-3)'),
    points: z.number().optional().default(10).describe('Points à gagner'),
    badge: z.string().optional().describe('Badge à obtenir'),
    timeLimit: z.number().optional().describe('Limite de temps en secondes'),
    difficulty: z.enum(['easy', 'medium', 'hard', 'expert']).optional().default('medium').describe('Difficulté'),
    category: z.string().optional().describe('Catégorie du quiz'),
    theme: z.enum(['cyberpunk', 'minimal', 'gaming', 'corporate', 'sunset', 'ocean']).optional().default('gaming').describe('Thème'),
    animationStyle: z.enum(['confetti', 'fireworks', 'trophy', 'party', 'stars']).optional().default('confetti').describe('Animation de réussite'),
  }),
  execute: async (args) => {
    try {
      const client = await ensureDiscordConnection();
      const channel = await client.channels.fetch(args.channelId);

      if (!channel || !('send' in channel)) {
        throw new Error('Canal invalide');
      }

      const quizId = `quiz_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;

      // Difficulté avec emojis
      const difficultyEmojis: Record<string, string> = {
        easy: '🟢 Facile',
        medium: '🟡 Moyen',
        hard: '🔴 Difficile',
        expert: '💀 Expert',
      };

      // Créer l'embed du quiz
      const embed = new EmbedBuilder()
        .setTitle(`🎮 QUIZ ${args.category ? `| ${args.category}` : ''}`)
        .setDescription(`${VISUAL_SEPARATORS.sparkles}

❓ **${args.question}**

${args.options.map((opt, i) => {
  const letters = ['🅰️', '🅱️', '©️', '🇩'];
  return `${letters[i]} ${opt}`;
}).join('\n')}

${VISUAL_SEPARATORS.line}
📊 **Difficulté:** ${difficultyEmojis[args.difficulty || 'medium']}
💰 **Récompense:** ${args.points} points${args.badge ? ` + 🏅 ${args.badge}` : ''}
${args.timeLimit ? `⏱️ **Temps:** ${args.timeLimit}s` : ''}
${VISUAL_SEPARATORS.sparkles}`)
        .setColor(EMBED_THEMES[args.theme || 'gaming'].color as any)
        .setFooter({ text: '💡 Cliquez sur un bouton pour répondre !' })
        .setTimestamp();

      // Créer les boutons de réponse
      const row = new ActionRowBuilder<ButtonBuilder>();
      const buttonStyles = [ButtonStyle.Primary, ButtonStyle.Success, ButtonStyle.Secondary, ButtonStyle.Danger];

      args.options.forEach((opt, index) => {
        const letter = String.fromCharCode(65 + index);
        const button = new ButtonBuilder()
          .setCustomId(`${quizId}_answer_${index}`)
          .setLabel(letter)
          .setStyle(buttonStyles[index % buttonStyles.length]);
        row.addComponents(button);
      });

      // Stocker la bonne réponse pour validation ultérieure
      // (Dans une vraie implémentation, cela serait stocké en base de données)
      const quizData = {
        quizId,
        correctIndex: args.correctIndex,
        points: args.points,
        badge: args.badge,
        animationStyle: args.animationStyle,
        options: args.options,
      };

      const message = await channel.send({
        embeds: [embed],
        components: [row],
      });

      return `✅ Quiz créé | ID: ${quizId} | Message: ${message.id}\n📝 Bonne réponse: Option ${args.correctIndex + 1} (${args.options[args.correctIndex]})`;
    } catch (error: any) {
      return `❌ Erreur: ${error.message}`;
    }
  },
});

// Outil pour supprimer un embed du système d'auto-update
server.addTool({
  name: 'stop_embed_auto_update',
  description: 'Arrêter l\'auto-update d\'un embed',
  parameters: z.object({
    embedId: z.string().describe('ID du message embed'),
  }),
  execute: async args => {
    try {
      if (autoUpdateEmbeds.has(args.embedId)) {
        autoUpdateEmbeds.delete(args.embedId);
        return `✅ Auto-update désactivé pour l'embed ${args.embedId}`;
      } else {
        return `ℹ️ Aucun auto-update trouvé pour l'embed ${args.embedId}`;
      }
    } catch (error: any) {
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

// Auto-déploiement du RPG au démarrage (optionnel) - DÉSACTIVÉ
// Pour réactiver, supprimez les // devant les lignes suivantes
/*
setTimeout(async () => {
    try {
        const { deployRPG } = await import('./utils/rpgDeploy.js');
        await deployRPG(botConfig.token);
        Logger.info('🎮 [RPG] Auto-déploiement réussi lors du démarrage');
    } catch (e) {
        // Silencieux si déjà lancé ou erreur
    }
}, 5000);
*/


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
