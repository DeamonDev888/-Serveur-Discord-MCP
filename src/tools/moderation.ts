import { z } from 'zod';
import { PermissionFlagsBits } from 'discord.js';
import {
  loadModerationActions,
  addModerationAction,
  loadWarnings,
  addWarning,
  getUserWarnings,
  deleteWarning,
  loadMutes,
  addMute,
  getActiveMute,
  deactivateMute,
  generateId,
  ModerationAction,
  Warning,
  Mute,
} from '../utils/moderationPersistence.js';
import { createLog } from '../utils/logPersistence.js';
import Logger from '../utils/logger.js';

// Schémas de validation
export const KickMemberSchema = z.object({
  guildId: z.string().describe('ID du serveur'),
  userId: z.string().describe('ID du membre à expulser'),
  reason: z.string().optional().describe("Raison de l'expulsion"),
});

export const BanMemberSchema = z.object({
  guildId: z.string().describe('ID du serveur'),
  userId: z.string().describe('ID du membre à bannir'),
  reason: z.string().optional().describe('Raison du bannissement'),
  deleteMessageDays: z
    .number()
    .min(0)
    .max(7)
    .optional()
    .default(0)
    .describe('Supprimer les messages des derniers jours (0-7)'),
});

export const UnbanMemberSchema = z.object({
  guildId: z.string().describe('ID du serveur'),
  userId: z.string().describe('ID du membre à débannir'),
  reason: z.string().optional().describe('Raison du débannissement'),
});

export const MuteMemberSchema = z.object({
  guildId: z.string().describe('ID du serveur'),
  userId: z.string().describe('ID du membre à mute'),
  duration: z.number().min(1).max(604800).describe('Durée en secondes (max 7 jours)'),
  reason: z.string().optional().describe('Raison du mute'),
});

export const UnmuteMemberSchema = z.object({
  guildId: z.string().describe('ID du serveur'),
  userId: z.string().describe('ID du membre à démute'),
  reason: z.string().optional().describe('Raison du démute'),
});

export const WarnMemberSchema = z.object({
  guildId: z.string().describe('ID du serveur'),
  userId: z.string().describe('ID du membre à avertir'),
  reason: z.string().describe("Raison de l'avertissement"),
});

export const ClearWarningsSchema = z.object({
  guildId: z.string().describe('ID du serveur'),
  userId: z.string().describe('ID du membre'),
});

export const GetWarningsSchema = z.object({
  guildId: z.string().describe('ID du serveur'),
  userId: z.string().describe('ID du membre'),
});

// Variables globales pour la persistance
let moderationActions: Map<string, ModerationAction> = new Map();
let warnings: Map<string, Warning> = new Map();
let mutes: Map<string, Mute> = new Map();

// Initialiser les données
export async function initializeModeration() {
  moderationActions = await loadModerationActions();
  warnings = await loadWarnings();
  mutes = await loadMutes();
  Logger.info('✅ Système de modération initialisé');
}

// ===============================
// OUTILS MCP
// ===============================

// 1. Expulser un membre
export async function kickMember(client: any, args: any): Promise<string> {
  try {
    const validation = KickMemberSchema.safeParse(args);
    if (!validation.success) {
      return `❌ Paramètres invalides: ${validation.error.message}`;
    }

    const { guildId, userId, reason } = validation.data;

    const guild = await client.guilds.fetch(guildId);
    const member = await guild.members.fetch(userId);

    // Vérifier les permissions
    if (!guild.members.me?.permissions.has(PermissionFlagsBits.KickMembers)) {
      return "❌ Le bot n'a pas la permission d'expulser des membres";
    }

    // Expulser le membre
    await member.kick(reason || 'Aucune raison spécifiée');

    // Créer l'action de modération
    const action: ModerationAction = {
      id: generateId(),
      timestamp: new Date(),
      guildId,
      guildName: guild.name,
      moderatorId: client.user!.id,
      moderatorUsername: client.user!.username,
      targetId: userId,
      targetUsername: member.user.username,
      action: 'kick',
      reason,
    };

    await addModerationAction(action, moderationActions);

    return `✅ Membre expulsé: ${member.user.username}#${member.user.discriminator}${reason ? ` | Raison: ${reason}` : ''}`;
  } catch (error: any) {
    return `❌ Erreur: ${error.message}`;
  }
}

// 2. Bannir un membre
export async function banMember(client: any, args: any): Promise<string> {
  try {
    const validation = BanMemberSchema.safeParse(args);
    if (!validation.success) {
      return `❌ Paramètres invalides: ${validation.error.message}`;
    }

    const { guildId, userId, reason, deleteMessageDays } = validation.data;

    const guild = await client.guilds.fetch(guildId);

    // Vérifier les permissions
    if (!guild.members.me?.permissions.has(PermissionFlagsBits.BanMembers)) {
      return "❌ Le bot n'a pas la permission de bannir des membres";
    }

    // Bannir le membre
    await guild.bans.create({
      user: userId,
      reason: reason || 'Aucune raison spécifiée',
      deleteMessageDays: deleteMessageDays || 0,
    });

    // Récupérer les infos de l'utilisateur
    const user = await client.users.fetch(userId);

    // Créer l'action de modération
    const action: ModerationAction = {
      id: generateId(),
      timestamp: new Date(),
      guildId,
      guildName: guild.name,
      moderatorId: client.user!.id,
      moderatorUsername: client.user!.username,
      targetId: userId,
      targetUsername: user.username,
      action: 'ban',
      reason,
      data: { deleteMessageDays },
    };

    await addModerationAction(action, moderationActions);

    return `✅ Membre banni: ${user.username}#${user.discriminator}${reason ? ` | Raison: ${reason}` : ''}`;
  } catch (error: any) {
    return `❌ Erreur: ${error.message}`;
  }
}

// 3. Débannir un membre
export async function unbanMember(client: any, args: any): Promise<string> {
  try {
    const validation = UnbanMemberSchema.safeParse(args);
    if (!validation.success) {
      return `❌ Paramètres invalides: ${validation.error.message}`;
    }

    const { guildId, userId, reason } = validation.data;

    const guild = await client.guilds.fetch(guildId);

    // Vérifier les permissions
    if (!guild.members.me?.permissions.has(PermissionFlagsBits.BanMembers)) {
      return "❌ Le bot n'a pas la permission de débannir des membres";
    }

    // Débannir le membre
    await guild.bans.remove(userId, reason || 'Aucune raison spécifiée');

    // Récupérer les infos de l'utilisateur
    const user = await client.users.fetch(userId);

    // Créer l'action de modération
    const action: ModerationAction = {
      id: generateId(),
      timestamp: new Date(),
      guildId,
      guildName: guild.name,
      moderatorId: client.user!.id,
      moderatorUsername: client.user!.username,
      targetId: userId,
      targetUsername: user.username,
      action: 'unban',
      reason,
    };

    await addModerationAction(action, moderationActions);

    return `✅ Membre débanni: ${user.username}#${user.discriminator}${reason ? ` | Raison: ${reason}` : ''}`;
  } catch (error: any) {
    return `❌ Erreur: ${error.message}`;
  }
}

// 4. Mute un membre
export async function muteMember(client: any, args: any): Promise<string> {
  try {
    const validation = MuteMemberSchema.safeParse(args);
    if (!validation.success) {
      return `❌ Paramètres invalides: ${validation.error.message}`;
    }

    const { guildId, userId, duration, reason } = validation.data;

    const guild = await client.guilds.fetch(guildId);
    const member = await guild.members.fetch(userId);

    // Vérifier les permissions
    if (!guild.members.me?.permissions.has(PermissionFlagsBits.ModerateMembers)) {
      return "❌ Le bot n'a pas la permission de mute des membres";
    }

    // Vérifier s'il y a déjà un mute actif
    const existingMute = getActiveMute(userId, guildId, mutes);
    if (existingMute) {
      return `❌ L'utilisateur est déjà mute (expire: ${existingMute.expiresAt.toLocaleString()})`;
    }

    // Calculer la date d'expiration
    const expiresAt = new Date(Date.now() + duration * 1000);

    // Mute le membre
    await member.timeout(duration * 1000, reason || 'Aucune raison spécifiée');

    // Créer l'entrée mute
    const mute: Mute = {
      id: generateId(),
      timestamp: new Date(),
      guildId,
      guildName: guild.name,
      userId,
      username: member.user.username,
      moderatorId: client.user!.id,
      moderatorUsername: client.user!.username,
      reason,
      expiresAt,
      active: true,
    };

    await addMute(mute, mutes);

    // Créer l'action de modération
    const action: ModerationAction = {
      id: generateId(),
      timestamp: new Date(),
      guildId,
      guildName: guild.name,
      moderatorId: client.user!.id,
      moderatorUsername: client.user!.username,
      targetId: userId,
      targetUsername: member.user.username,
      action: 'mute',
      reason,
      duration,
    };

    await addModerationAction(action, moderationActions);

    return `✅ Membre mute: ${member.user.username} pour ${duration}s${reason ? ` | Raison: ${reason}` : ''}`;
  } catch (error: any) {
    return `❌ Erreur: ${error.message}`;
  }
}

// 5. Démute un membre
export async function unmuteMember(client: any, args: any): Promise<string> {
  try {
    const validation = UnmuteMemberSchema.safeParse(args);
    if (!validation.success) {
      return `❌ Paramètres invalides: ${validation.error.message}`;
    }

    const { guildId, userId, reason } = validation.data;

    const guild = await client.guilds.fetch(guildId);
    const member = await guild.members.fetch(userId);

    // Vérifier les permissions
    if (!guild.members.me?.permissions.has(PermissionFlagsBits.ModerateMembers)) {
      return "❌ Le bot n'a pas la permission de démute des membres";
    }

    // Démute le membre
    await member.timeout(0, reason || 'Démute');

    // Désactiver le mute
    const activeMute = getActiveMute(userId, guildId, mutes);
    if (activeMute) {
      await deactivateMute(activeMute.id, mutes);
    }

    // Créer l'action de modération
    const action: ModerationAction = {
      id: generateId(),
      timestamp: new Date(),
      guildId,
      guildName: guild.name,
      moderatorId: client.user!.id,
      moderatorUsername: client.user!.username,
      targetId: userId,
      targetUsername: member.user.username,
      action: 'unmute',
      reason,
    };

    await addModerationAction(action, moderationActions);

    return `✅ Membre démute: ${member.user.username}${reason ? ` | Raison: ${reason}` : ''}`;
  } catch (error: any) {
    return `❌ Erreur: ${error.message}`;
  }
}

// 6. Avertir un membre
export async function warnMember(client: any, args: any): Promise<string> {
  try {
    const validation = WarnMemberSchema.safeParse(args);
    if (!validation.success) {
      return `❌ Paramètres invalides: ${validation.error.message}`;
    }

    const { guildId, userId, reason } = validation.data;

    const guild = await client.guilds.fetch(guildId);
    const member = await guild.members.fetch(userId);

    // Créer l'avertissement
    const warning: Warning = {
      id: generateId(),
      timestamp: new Date(),
      guildId,
      guildName: guild.name,
      userId,
      username: member.user.username,
      moderatorId: client.user!.id,
      moderatorUsername: client.user!.username,
      reason,
    };

    await addWarning(warning, warnings);

    // Obtenir tous les warns de l'utilisateur
    const userWarnings = getUserWarnings(userId, warnings);
    const warningCount = userWarnings.length;

    // Créer l'action de modération
    const action: ModerationAction = {
      id: generateId(),
      timestamp: new Date(),
      guildId,
      guildName: guild.name,
      moderatorId: client.user!.id,
      moderatorUsername: client.user!.username,
      targetId: userId,
      targetUsername: member.user.username,
      action: 'warn',
      reason,
      data: { warningCount },
    };

    await addModerationAction(action, moderationActions);

    return `⚠️ Membre averti: ${member.user.username} | Total: ${warningCount} warn(s)${reason ? ` | Raison: ${reason}` : ''}`;
  } catch (error: any) {
    return `❌ Erreur: ${error.message}`;
  }
}

// 7. Voir les warns d'un membre
export async function getWarnings(client: any, args: any): Promise<string> {
  try {
    const validation = GetWarningsSchema.safeParse(args);
    if (!validation.success) {
      return `❌ Paramètres invalides: ${validation.error.message}`;
    }

    const { guildId, userId } = validation.data;

    const userWarnings = getUserWarnings(userId, warnings);

    if (userWarnings.length === 0) {
      return `✅ Aucun avertissement pour cet utilisateur`;
    }

    const list = userWarnings
      .slice(0, 10) // Limiter à 10 warns
      .map(w => `• ${w.timestamp.toLocaleDateString()}: ${w.reason} (par ${w.moderatorUsername})`)
      .join('\n');

    return `⚠️ ${userWarnings.length} avertissement(s):\n${list}`;
  } catch (error: any) {
    return `❌ Erreur: ${error.message}`;
  }
}

// 8. Effacer les warns d'un membre
export async function clearWarnings(client: any, args: any): Promise<string> {
  try {
    const validation = ClearWarningsSchema.safeParse(args);
    if (!validation.success) {
      return `❌ Paramètres invalides: ${validation.error.message}`;
    }

    const { guildId, userId } = validation.data;

    const userWarnings = getUserWarnings(userId, warnings);
    const clearedCount = userWarnings.length;

    // Supprimer tous les warns
    for (const warning of userWarnings) {
      await deleteWarning(warning.id, warnings);
    }

    return `✅ ${clearedCount} avertissement(s) effacé(s) pour cet utilisateur`;
  } catch (error: any) {
    return `❌ Erreur: ${error.message}`;
  }
}

// Les schémas sont déjà exportés avec export const ci-dessus
