/**
 * Outils de modération pour le serveur Discord MCP
 * Enregistre les outils de modération (9 outils)
 */

import { z } from 'zod';
import type { FastMCP } from 'fastmcp';
import { Client } from 'discord.js';
import Logger from '../utils/logger.js';
import { DiscordBridge } from '../discord-bridge.js';
import { botConfig, ensureDiscordConnection } from './common.js';

// ============================================================================
// RATE LIMITING
// ============================================================================

const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 60000;
const RATE_LIMIT_MAX = 30;

function checkRateLimit(toolName: string): boolean {
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

function withRateLimit<T extends any[], R>(toolName: string, fn: (...args: T) => Promise<R>) {
  return async (...args: T): Promise<R> => {
    if (!checkRateLimit(toolName)) {
      throw new Error(`Rate limit atteint pour ${toolName}. Réessayez dans 1 minute.`);
    }
    return fn(...args);
  };
}

// ============================================================================
// SCHÉMAS ZOD
// ============================================================================

const KickMemberSchema = z.object({
  userId: z.string().describe("ID de l'utilisateur à expulser"),
  guildId: z.string().optional().describe('ID du serveur'),
  reason: z.string().optional().describe('Raison de lexpulsion'),
});

const BanMemberSchema = z.object({
  userId: z.string().describe("ID de l'utilisateur à bannir"),
  guildId: z.string().optional().describe('ID du serveur'),
  reason: z.string().optional().describe('Raison du bannissement'),
  deleteMessageSeconds: z.number().min(0).max(604800).optional().default(0).describe('Nombre de secondes de messages à supprimer (0-7j)'),
});

const UnbanMemberSchema = z.object({
  userId: z.string().describe("ID de l'utilisateur à débannir"),
  guildId: z.string().optional().describe('ID du serveur'),
  reason: z.string().optional().describe('Raison du débannissement'),
});

const MuteMemberSchema = z.object({
  userId: z.string().describe("ID de l'utilisateur à mute"),
  guildId: z.string().optional().describe('ID du serveur'),
  duration: z.number().min(10).max(604800).optional().default(3600).describe('Durée du mute en secondes (min: 10s, max: 7j, défaut: 1h)'),
  reason: z.string().optional().describe('Raison du mute'),
});

const UnmuteMemberSchema = z.object({
  userId: z.string().describe("ID de l'utilisateur à démutes"),
  guildId: z.string().optional().describe('ID du serveur'),
  reason: z.string().optional().describe('Raison du démutes'),
});

const WarnMemberSchema = z.object({
  userId: z.string().describe("ID de l'utilisateur à avertir"),
  guildId: z.string().optional().describe('ID du serveur'),
  reason: z.string().min(1).max(500).describe('Raison de lavertissement'),
  points: z.number().min(1).max(100).optional().default(1).describe('Nombre de points (1-100)'),
});

const GetWarningsSchema = z.object({
  userId: z.string().describe("ID de l'utilisateur"),
  guildId: z.string().optional().describe('ID du serveur'),
});

const ClearWarningsSchema = z.object({
  userId: z.string().describe("ID de l'utilisateur"),
  guildId: z.string().optional().describe('ID du serveur'),
});

// ============================================================================
// FONCTIONS DE MODÉRATION
// ============================================================================

async function kickMember(client: Client, args: z.infer<typeof KickMemberSchema>): Promise<string> {
  const guildId = args.guildId || client.guilds.cache.first()?.id;
  if (!guildId) {
    throw new Error('Aucun serveur disponible');
  }

  const guild = await client.guilds.fetch(guildId);
  const member = await guild.members.fetch(args.userId);

  await member.kick(args.reason || 'Aucune raison fournie');

  return `✅ Membre ${member.user.tag} expulsé du serveur${args.reason ? ` | Raison: ${args.reason}` : ''}`;
}

async function banMember(client: Client, args: z.infer<typeof BanMemberSchema>): Promise<string> {
  const guildId = args.guildId || client.guilds.cache.first()?.id;
  if (!guildId) {
    throw new Error('Aucun serveur disponible');
  }

  const guild = await client.guilds.fetch(guildId);
  await guild.bans.create(args.userId, {
    reason: args.reason || 'Aucune raison fournie',
    deleteMessageSeconds: args.deleteMessageSeconds || 0,
  });

  return `✅ Utilisateur ${args.userId} banni du serveur${args.reason ? ` | Raison: ${args.reason}` : ''}`;
}

async function unbanMember(client: Client, args: z.infer<typeof UnbanMemberSchema>): Promise<string> {
  const guildId = args.guildId || client.guilds.cache.first()?.id;
  if (!guildId) {
    throw new Error('Aucun serveur disponible');
  }

  const guild = await client.guilds.fetch(guildId);
  await guild.bans.remove(args.userId, args.reason || 'Aucune raison fournie');

  return `✅ Utilisateur ${args.userId} débanni du serveur${args.reason ? ` | Raison: ${args.reason}` : ''}`;
}

async function muteMember(client: Client, args: z.infer<typeof MuteMemberSchema>): Promise<string> {
  const guildId = args.guildId || client.guilds.cache.first()?.id;
  if (!guildId) {
    throw new Error('Aucun serveur disponible');
  }

  const guild = await client.guilds.fetch(guildId);
  const member = await guild.members.fetch(args.userId);

  let mutedRole = guild.roles.cache.find(role => role.name === 'Muted');

  if (!mutedRole) {
    mutedRole = await guild.roles.create({
      name: 'Muted',
      color: 0x808080,
      permissions: [],
      reason: 'Création du rôle Muted pour la modération',
    });

    guild.channels.cache.forEach(async channel => {
      if ('permissionOverwrites' in channel) {
        await (channel as any).permissionOverwrites.create(mutedRole!, {
          SendMessages: false,
          AddReactions: false,
          Speak: false,
        });
      }
    });
  }

  await member.roles.add(mutedRole, args.reason || 'Aucune raison fournie');

  if (args.duration && args.duration > 0) {
    setTimeout(async () => {
      try {
        const memberToUnmute = await guild.members.fetch(args.userId).catch(() => null);
        if (memberToUnmute && memberToUnmute.roles.cache.has(mutedRole.id)) {
          await memberToUnmute.roles.remove(mutedRole, 'Durée du mute expirée');
        }
      } catch (error) {
        Logger.error('Erreur lors du démutes automatique:', error);
      }
    }, args.duration * 1000);
  }

  return `✅ Membre ${member.user.tag} mute${args.reason ? ` | Raison: ${args.reason}` : ''}`;
}

async function unmuteMember(client: Client, args: z.infer<typeof UnmuteMemberSchema>): Promise<string> {
  const guildId = args.guildId || client.guilds.cache.first()?.id;
  if (!guildId) {
    throw new Error('Aucun serveur disponible');
  }

  const guild = await client.guilds.fetch(guildId);
  const member = await guild.members.fetch(args.userId);

  const mutedRole = guild.roles.cache.find(role => role.name === 'Muted');

  if (!mutedRole) {
    return 'ℹ️ Aucun rôle Muted trouvé sur ce serveur';
  }

  if (!member.roles.cache.has(mutedRole.id)) {
    return 'ℹ️ Ce membre nest pas mute';
  }

  await member.roles.remove(mutedRole, args.reason || 'Aucune raison fournie');

  return `✅ Membre ${member.user.tag} démutes${args.reason ? ` | Raison: ${args.reason}` : ''}`;
}

// Gestion des warnings
const WARNINGS_FILE = 'warnings.json';

interface Warning {
  date: string;
  reason: string;
  points: number;
  moderator: string;
}

interface WarningsData {
  [key: string]: Warning[];
}

function loadWarnings(): WarningsData {
  try {
    const fs = require('fs');
    if (fs.existsSync(WARNINGS_FILE)) {
      const data = fs.readFileSync(WARNINGS_FILE, 'utf-8');
      return JSON.parse(data);
    }
  } catch (error) {
    Logger.error('Erreur chargement warnings:', error);
  }
  return {};
}

function saveWarnings(warnings: WarningsData): void {
  try {
    const fs = require('fs');
    fs.writeFileSync(WARNINGS_FILE, JSON.stringify(warnings, null, 2));
  } catch (error) {
    Logger.error('Erreur sauvegarde warnings:', error);
  }
}

async function warnMember(client: Client, args: z.infer<typeof WarnMemberSchema>): Promise<string> {
  const guildId = args.guildId || client.guilds.cache.first()?.id;
  if (!guildId) {
    throw new Error('Aucun serveur disponible');
  }

  const guild = await client.guilds.fetch(guildId);
  const member = await guild.members.fetch(args.userId);

  const warnings = loadWarnings();
  const key = `${guildId}_${args.userId}`;

  if (!warnings[key]) {
    warnings[key] = [];
  }

  warnings[key].push({
    date: new Date().toISOString(),
    reason: args.reason,
    points: args.points || 1,
    moderator: client.user!.id,
  });

  saveWarnings(warnings);

  const totalPoints = warnings[key].reduce((sum, w) => sum + w.points, 0);

  return `⚠️ Avertissement ajouté à ${member.user.tag} | Raison: ${args.reason} | Points: ${args.points} | Total: ${totalPoints}`;
}

async function getWarnings(client: Client, args: z.infer<typeof GetWarningsSchema>): Promise<string> {
  const guildId = args.guildId || client.guilds.cache.first()?.id;
  if (!guildId) {
    throw new Error('Aucun serveur disponible');
  }

  const warnings = loadWarnings();
  const key = `${guildId}_${args.userId}`;

  if (!warnings[key] || warnings[key].length === 0) {
    return `ℹ️ Aucun avertissement pour l'utilisateur ${args.userId}`;
  }

  const totalPoints = warnings[key].reduce((sum, w) => sum + w.points, 0);

  const list = warnings[key].map((w, i) =>
    `${i + 1}. ${new Date(w.date).toLocaleDateString('fr-FR')} - ${w.reason} (${w.points} pts)`
  ).join('\n');

  return `⚠️ Avertissements pour ${args.userId} (${warnings[key].length} warn(s), ${totalPoints} pts):\n${list}`;
}

async function clearWarnings(client: Client, args: z.infer<typeof ClearWarningsSchema>): Promise<string> {
  const guildId = args.guildId || client.guilds.cache.first()?.id;
  if (!guildId) {
    throw new Error('Aucun serveur disponible');
  }

  const warnings = loadWarnings();
  const key = `${guildId}_${args.userId}`;

  if (!warnings[key] || warnings[key].length === 0) {
    return `ℹ️ Aucun avertissement à effacer pour l'utilisateur ${args.userId}`;
  }

  const count = warnings[key].length;
  delete warnings[key];
  saveWarnings(warnings);

  return `🧹 ${count} avertissement(s) effacé(s) pour l'utilisateur ${args.userId}`;
}

// ============================================================================
// ENREGISTREMENT DES OUTILS
// ============================================================================

export function registerModerationTools(server: FastMCP): void {
  // 1. Statut Discord
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

  // 2. Expulser un membre
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

  // 3. Bannir un membre
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

  // 4. Débannir un membre
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

  // 5. Mute un membre
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

  // 6. Démute un membre
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

  // 7. Avertir un membre
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

  // 8. Voir les warns
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

  // 9. Effacer les warns
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
}
