/**
 * Fonctions et constantes communes pour les outils MCP Discord
 */

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
import Logger from '../utils/logger.js';
import { DiscordBridge } from '../discord-bridge.js';
import config from '../config.js';

// Import local pour utilisation dans le module
const botConfig = config;

// ============================================================================
// TYPES
// ============================================================================

export type { CustomButton } from '../utils/buttonPersistence.js';
export type { CustomMenu } from '../utils/menuPersistence.js';

// ============================================================================
// CONFIGURATION
// ============================================================================

export interface BotConfig {
  token: string;
  clientId: string;
  guildId: string;
  activity: string;
  adminUserId: string;
  environment: string;
}

// Importer botConfig depuis config.ts qui charge maintenant le .env
export { default as botConfig } from '../config.js';

// ============================================================================
// SYSTÈME DE THÈMES 🎨
// ============================================================================

export const EMBED_THEMES = {
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
export function applyTheme(themeName: string, customizations: any = {}): any {
  const theme = EMBED_THEMES[themeName as keyof typeof EMBED_THEMES];
  if (!theme) return customizations;

  return {
    ...customizations,
    color: customizations.color || theme.color,
    // ⚠️ Ne pas assigner d'emojis à authorIcon/footerIcon - Discord exige des URLs d'images valides
    // Les emojis sont utilisés uniquement pour les titres et descriptions
  };
}

// ============================================================================
// SYSTÈME D'AUTO-UPDATE POUR EMBEDS 🚀
// ============================================================================

export const autoUpdateEmbeds = new Map<string, {
  messageId: string;
  channelId: string;
  embedData: any;
  interval: number;
  lastUpdate: number;
  source?: string;
  updateCount: number;
}>();

export const embedAnalytics = new Map<string, {
  views: number;
  clicks: number;
  lastInteraction: number;
  reactions: Map<string, number>;
}>();

// Fonction pour track une vue d'embed
export function trackEmbedView(embedId: string): void {
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
export function trackEmbedClick(embedId: string, buttonId?: string): void {
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
export function getEmbedAnalytics(embedId: string): any {
  return embedAnalytics.get(embedId) || {
    views: 0,
    clicks: 0,
    lastInteraction: 0,
    reactions: {},
  };
}

// Fonction pour générer un rapport d'analytics
export function generateAnalyticsReport(embedId: string): string {
  const analytics = getEmbedAnalytics(embedId);
  const reactions = Array.from(analytics.reactions.entries())
    .map((entry: any) => {
      const [btn, count] = entry;
      return `  • ${btn}: ${count} clics`;
    })
    .join('\n');

  return `📊 **Analytics Embed ${embedId}**
👀 Vues: ${analytics.views}
🖱️ Clics: ${analytics.clicks}
📈 Taux d'engagement: ${analytics.views > 0 ? ((analytics.clicks / analytics.views) * 100).toFixed(1) : 0}%
⏰ Dernière interaction: ${analytics.lastInteraction ? new Date(analytics.lastInteraction).toLocaleString('fr-FR') : 'Jamais'}
${reactions ? `🎯 **Boutons:**\n${reactions}` : ''}`;
}

// ============================================================================
// RATE LIMITING
// ============================================================================

const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 60000; // 1 minute
const RATE_LIMIT_MAX = 30; // Max 30 requêtes par minute par outil

export function checkRateLimit(toolName: string): boolean {
  const now = Date.now();
  const toolLimit = rateLimitMap.get(toolName);

  if (!toolLimit || now > toolLimit.resetTime) {
    rateLimitMap.set(toolName, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return true;
  }

  if (toolLimit.count >= RATE_LIMIT_MAX) {
    return false;
  }

  toolLimit.count++;
  return true;
}

export function withRateLimit<T extends any[], R>(toolName: string, fn: (...args: T) => Promise<R>) {
  return async (...args: T): Promise<R> => {
    if (!checkRateLimit(toolName)) {
      throw new Error(`Rate limit atteint pour ${toolName}. Réessayez dans 1 minute.`);
    }
    return fn(...args);
  };
}

// ============================================================================
// CONNEXION DISCORD
// ============================================================================

export async function ensureDiscordConnection(): Promise<Client> {
  if (!botConfig.token || botConfig.token === 'YOUR_BOT_TOKEN') {
    throw new Error('Token Discord non configuré ou invalide');
  }

  const bridge = DiscordBridge.getInstance(botConfig.token);
  const client = await bridge.getClient();

  return client;
}

// ============================================================================
// FONCTIONS UTILITAIRES
// ============================================================================

export function formatDuration(seconds: number): string {
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

// Imports des données et utilitaires
import { CRYPTO_LOGOS, COMPANY_LOGOS, MISC_LOGOS } from '../data/logos.js';
import { VISUAL_SEPARATORS, VISUAL_BADGES } from '../utils/gameData.js';

export { CRYPTO_LOGOS, COMPANY_LOGOS, MISC_LOGOS, VISUAL_SEPARATORS, VISUAL_BADGES };
