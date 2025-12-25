/**
 * Outils MCP unifiés pour la gestion des membres et la modération
 * Fusionne: userManager, memberManager, moderation, registerMembers, registerModeration
 */

import { z } from 'zod';
import type { FastMCP } from 'fastmcp';
import {
  EmbedBuilder,
  GuildMember,
  User,
} from 'discord.js';
import Logger from '../utils/logger.js';
import { ensureDiscordConnection, formatDuration } from './common.js';

// ============================================================================
// ENREGISTREMENT DES OUTILS
// ============================================================================

export function registerMemberTools(server: FastMCP) {

  // ========================================================================
  // 1. LISTE DES MEMBRES
  // ========================================================================

  server.addTool({
    name: 'list_members',
    description: 'Liste tous les membres du serveur avec filtrage',
    parameters: z.object({
      limit: z.number().min(1).max(100).default(20).describe('Nombre max de membres'),
      search: z.string().optional().describe('Filtrer par nom/pseudo'),
      sortBy: z.enum(['joined', 'name', 'id']).optional().default('joined').describe('Tri'),
      includeBots: z.boolean().optional().default(false).describe('Inclure les bots'),
    }),
    execute: async (args) => {
      try {
        const client = await ensureDiscordConnection();
        const guild = client.guilds.cache.first();

        if (!guild) {
          return '❌ Aucun serveur disponible';
        }

        await guild.members.fetch();

        let members = Array.from(guild.members.cache.values());

        // Filtrer les bots si demandé
        if (!args.includeBots) {
          members = members.filter(m => !m.user.bot);
        }

        // Recherche
        if (args.search) {
          const searchLower = args.search.toLowerCase();
          members = members.filter(m =>
            m.user.username.toLowerCase().includes(searchLower) ||
            m.displayName.toLowerCase().includes(searchLower)
          );
        }

        // Tri
        members.sort((a, b) => {
          switch (args.sortBy) {
            case 'name':
              return a.displayName.localeCompare(b.displayName);
            case 'id':
              return a.user.id.localeCompare(b.user.id);
            case 'joined':
            default:
              return a.joinedAt ? a.joinedAt.getTime() - (b.joinedAt?.getTime() || 0) : 0;
          }
        });

        // Limiter
        members = members.slice(0, args.limit);

        const list = members.map(m => {
          const botStatus = m.user.bot ? ' [🤖]' : '';
          const status = m.presence?.status || 'offline';
          const statusEmoji = { online: '🟢', idle: '🌙', dnd: '🔴', offline: '⚫' }[status] || '⚫';
          return `${statusEmoji} **${m.displayName}**${botStatus} (${m.user.username})`;
        }).join('\n');

        return `📋 **${members.length} membres** (tri par ${args.sortBy}):\n\n${list}`;
      } catch (error: any) {
        Logger.error('❌ [list_members]', error.message);
        return `❌ Erreur: ${error.message}`;
      }
    },
  });

  // ========================================================================
  // 2. INFO UTILISATEUR
  // ========================================================================

  server.addTool({
    name: 'get_user_info',
    description: 'Obtient les informations détaillées d\'un utilisateur',
    parameters: z.object({
      userId: z.string().describe('ID de l\'utilisateur'),
    }),
    execute: async (args) => {
      try {
        const client = await ensureDiscordConnection();
        const guild = client.guilds.cache.first();

        if (!guild) {
          return '❌ Aucun serveur disponible';
        }

        const member = await guild.members.fetch(args.userId).catch(() => null);
        const user = member?.user || await client.users.fetch(args.userId).catch(() => null);

        if (!user) {
          return `❌ Utilisateur ${args.userId} introuvable`;
        }

        const embed = new EmbedBuilder()
          .setTitle(`👤 ${user.tag}`)
          .setThumbnail(user.displayAvatarURL())
          .setColor(0x5865f2)
          .addFields(
            { name: '🆔 ID', value: user.id, inline: true },
            { name: '🤖 Bot', value: user.bot ? 'Oui' : 'Non', inline: true },
            { name: '📅 Compte créé', value: `<t:${Math.floor(user.createdTimestamp() / 1000)}:R>`, inline: true },
          );

        if (member) {
          embed.addFields(
            { name: '🏷️ Pseudo serveur', value: member.displayName, inline: true },
            { name: '📅 Rejoint', value: member.joinedAt ? `<t:${Math.floor(member.joinedAtTimestamp() / 1000)}:R>` : 'N/A', inline: true },
            { name: '🎭 Rôles', value: member.roles.cache.size > 1 ? member.roles.cache.map(r => r.name).join(', ') : 'Aucun', inline: false },
          );
        }

        return `📋 **Informations utilisateur:**

${embed.toJSON().fields?.map(f => `**${f.name}**: ${f.value}`).join('\n')}`;
      } catch (error: any) {
        Logger.error('❌ [get_user_info]', error.message);
        return `❌ Erreur: ${error.message}`;
      }
    },
  });

  // ========================================================================
  // 3. KICK (Expulser)
  // ========================================================================

  server.addTool({
    name: 'kick_member',
    description: 'Expulse un membre du serveur',
    parameters: z.object({
      userId: z.string().describe('ID du membre à expulser'),
      reason: z.string().optional().describe('Raison du kick'),
    }),
    execute: async (args) => {
      try {
        const client = await ensureDiscordConnection();
        const guild = client.guilds.cache.first();

        if (!guild) {
          return '❌ Aucun serveur disponible';
        }

        const member = await guild.members.fetch(args.userId).catch(() => null);
        if (!member) {
          return `❌ Membre ${args.userId} introuvable`;
        }

        await member.kick(args.reason);
        Logger.info(`✅ ${member.user.tag} kické (${args.reason || 'pas de raison'})`);

        return `✅ **${member.user.tag}** a été expulsé${args.reason ? ` (raison: ${args.reason})` : ''}`;
      } catch (error: any) {
        Logger.error('❌ [kick_member]', error.message);
        return `❌ Erreur: ${error.message}`;
      }
    },
  });

  // ========================================================================
  // 4. BAN (Bannir)
  // ========================================================================

  server.addTool({
    name: 'ban_member',
    description: 'Bannit un membre du serveur',
    parameters: z.object({
      userId: z.string().describe('ID du membre à bannir'),
      reason: z.string().optional().describe('Raison du ban'),
      deleteMessageSeconds: z.number().optional().default(0).describe('Supprimer les messages (secondes)'),
    }),
    execute: async (args) => {
      try {
        const client = await ensureDiscordConnection();
        const guild = client.guilds.cache.first();

        if (!guild) {
          return '❌ Aucun serveur disponible';
        }

        await guild.bans.create(args.userId, {
          reason: args.reason,
          deleteMessageSeconds: args.deleteMessageSeconds,
        });

        const user = await client.users.fetch(args.userId).catch(() => null);
        Logger.info(`✅ ${user?.tag || args.userId} banni (${args.reason || 'pas de raison'})`);

        return `✅ **${user?.tag || args.userId}** a été banni${args.reason ? ` (raison: ${args.reason})` : ''}`;
      } catch (error: any) {
        Logger.error('❌ [ban_member]', error.message);
        return `❌ Erreur: ${error.message}`;
      }
    },
  });

  // ========================================================================
  // 5. UNBAN (Débannir)
  // ========================================================================

  server.addTool({
    name: 'unban_member',
    description: 'Débannit un utilisateur',
    parameters: z.object({
      userId: z.string().describe('ID de l\'utilisateur à débannir'),
      reason: z.string().optional().describe('Raison du unban'),
    }),
    execute: async (args) => {
      try {
        const client = await ensureDiscordConnection();
        const guild = client.guilds.cache.first();

        if (!guild) {
          return '❌ Aucun serveur disponible';
        }

        await guild.bans.remove(args.userId, args.reason);

        const user = await client.users.fetch(args.userId).catch(() => null);
        Logger.info(`✅ ${user?.tag || args.userId} débanni`);

        return `✅ **${user?.tag || args.userId}** a été débanni`;
      } catch (error: any) {
        Logger.error('❌ [unban_member]', error.message);
        return `❌ Erreur: ${error.message}`;
      }
    },
  });

  // ========================================================================
  // 6. TIMEOUT (Mute temporaire)
  // ========================================================================

  server.addTool({
    name: 'timeout_member',
    description: 'Applique un timeout à un membre (mute temporaire)',
    parameters: z.object({
      userId: z.string().describe('ID du membre'),
      duration: z.number().describe('Durée en minutes'),
      reason: z.string().optional().describe('Raison'),
    }),
    execute: async (args) => {
      try {
        const client = await ensureDiscordConnection();
        const guild = client.guilds.cache.first();

        if (!guild) {
          return '❌ Aucun serveur disponible';
        }

        const member = await guild.members.fetch(args.userId).catch(() => null);
        if (!member) {
          return `❌ Membre ${args.userId} introuvable`;
        }

        const durationMs = args.duration * 60 * 1000;
        await member.timeout(durationMs, args.reason);

        Logger.info(`✅ ${member.user.tag} timeout ${args.duration}min`);

        return `✅ **${member.user.tag}** a été timeout pour **${args.duration} minutes**${args.reason ? ` (${args.reason})` : ''}`;
      } catch (error: any) {
        Logger.error('❌ [timeout_member]', error.message);
        return `❌ Erreur: ${error.message}`;
      }
    },
  });

  // ========================================================================
  // 7. REMOVE TIMEOUT (Enlever timeout)
  // ========================================================================

  server.addTool({
    name: 'remove_timeout',
    description: 'Retire le timeout d\'un membre',
    parameters: z.object({
      userId: z.string().describe('ID du membre'),
      reason: z.string().optional().describe('Raison'),
    }),
    execute: async (args) => {
      try {
        const client = await ensureDiscordConnection();
        const guild = client.guilds.cache.first();

        if (!guild) {
          return '❌ Aucun serveur disponible';
        }

        const member = await guild.members.fetch(args.userId).catch(() => null);
        if (!member) {
          return `❌ Membre ${args.userId} introuvable`;
        }

        await member.timeout(null, args.reason);

        Logger.info(`✅ Timeout retiré pour ${member.user.tag}`);

        return `✅ Timeout retiré pour **${member.user.tag}**`;
      } catch (error: any) {
        Logger.error('❌ [remove_timeout]', error.message);
        return `❌ Erreur: ${error.message}`;
      }
    },
  });

  // ========================================================================
  // 8. WARN (Avertir)
  // ========================================================================

  server.addTool({
    name: 'warn_member',
    description: 'Ajoute un avertissement à un membre',
    parameters: z.object({
      userId: z.string().describe('ID du membre'),
      reason: z.string().describe('Raison de l\'avertissement'),
    }),
    execute: async (args) => {
      try {
        const client = await ensureDiscordConnection();
        const guild = client.guilds.cache.first();

        if (!guild) {
          return '❌ Aucun serveur disponible';
        }

        const member = await guild.members.fetch(args.userId).catch(() => null);
        if (!member) {
          return `❌ Membre ${args.userId} introuvable`;
        }

        Logger.info(`⚠️ ${member.user.tag} averti: ${args.reason}`);

        return `⚠️ **${member.user.tag}** a été averti: *${args.reason}*`;
      } catch (error: any) {
        Logger.error('❌ [warn_member]', error.message);
        return `❌ Erreur: ${error.message}`;
      }
    },
  });

  // ========================================================================
  // 9. MOVE MEMBER (Déplacer vers un salon vocal)
  // ========================================================================

  server.addTool({
    name: 'move_member',
    description: 'Déplace un membre vers un salon vocal',
    parameters: z.object({
      userId: z.string().describe('ID du membre'),
      channelId: z.string().describe('ID du salon vocal de destination'),
    }),
    execute: async (args) => {
      try {
        const client = await ensureDiscordConnection();
        const guild = client.guilds.cache.first();

        if (!guild) {
          return '❌ Aucun serveur disponible';
        }

        const member = await guild.members.fetch(args.userId).catch(() => null);
        if (!member) {
          return `❌ Membre ${args.userId} introuvable`;
        }

        const channel = await guild.channels.fetch(args.channelId).catch(() => null);
        if (!channel || channel.type !== 2) { // 2 = GuildVoice
          return `❌ Salon vocal ${args.channelId} introuvable`;
        }

        await member.voice.setChannel(channel);

        Logger.info(`✅ ${member.user.tag} déplacé vers ${channel.name}`);

        return `✅ **${member.user.tag}** a été déplacé vers **${channel.name}**`;
      } catch (error: any) {
        Logger.error('❌ [move_member]', error.message);
        return `❌ Erreur: ${error.message}`;
      }
    },
  });

  // ========================================================================
  // 10. ADD ROLE TO MEMBER
  // ========================================================================

  server.addTool({
    name: 'add_role_to_member',
    description: 'Ajoute un rôle à un membre',
    parameters: z.object({
      userId: z.string().describe('ID du membre'),
      roleId: z.string().describe('ID du rôle à ajouter'),
    }),
    execute: async (args) => {
      try {
        const client = await ensureDiscordConnection();
        const guild = client.guilds.cache.first();

        if (!guild) {
          return '❌ Aucun serveur disponible';
        }

        const member = await guild.members.fetch(args.userId).catch(() => null);
        if (!member) {
          return `❌ Membre ${args.userId} introuvable`;
        }

        const role = await guild.roles.fetch(args.roleId).catch(() => null);
        if (!role) {
          return `❌ Rôle ${args.roleId} introuvable`;
        }

        await member.roles.add(role);

        Logger.info(`✅ Rôle ${role.name} ajouté à ${member.user.tag}`);

        return `✅ Rôle **${role.name}** ajouté à **${member.user.tag}**`;
      } catch (error: any) {
        Logger.error('❌ [add_role_to_member]', error.message);
        return `❌ Erreur: ${error.message}`;
      }
    },
  });

  // ========================================================================
  // 11. REMOVE ROLE FROM MEMBER
  // ========================================================================

  server.addTool({
    name: 'remove_role_from_member',
    description: 'Retire un rôle d\'un membre',
    parameters: z.object({
      userId: z.string().describe('ID du membre'),
      roleId: z.string().describe('ID du rôle à retirer'),
    }),
    execute: async (args) => {
      try {
        const client = await ensureDiscordConnection();
        const guild = client.guilds.cache.first();

        if (!guild) {
          return '❌ Aucun serveur disponible';
        }

        const member = await guild.members.fetch(args.userId).catch(() => null);
        if (!member) {
          return `❌ Membre ${args.userId} introuvable`;
        }

        const role = await guild.roles.fetch(args.roleId).catch(() => null);
        if (!role) {
          return `❌ Rôle ${args.roleId} introuvable`;
        }

        await member.roles.remove(role);

        Logger.info(`✅ Rôle ${role.name} retiré de ${member.user.tag}`);

        return `✅ Rôle **${role.name}** retiré de **${member.user.tag}**`;
      } catch (error: any) {
        Logger.error('❌ [remove_role_from_member]', error.message);
        return `❌ Erreur: ${error.message}`;
      }
    },
  });

  Logger.info('✅ Outils members enregistrés (11 outils)');
}
