/**
 * Fonctions et constantes communes pour les outils MCP Discord
 */

// import { z } from 'zod';
import { Client } from 'discord.js';

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
// SYSTÈME D'AUTO-UPDATE POUR EMBEDS 🚀
// ============================================================================

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
