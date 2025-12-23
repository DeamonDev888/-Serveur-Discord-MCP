/**
 * Outils d'information serveur pour le serveur Discord MCP
 * Enregistre les outils d'info serveur (4 outils)
 */

import { z } from 'zod';
import type { FastMCP } from 'fastmcp';
import Logger from '../utils/logger.js';
import { ensureDiscordConnection } from './common.js';

// ============================================================================
// SCHÉMAS ZOD
// ============================================================================

const GetServerInfoSchema = z.object({
  guildId: z.string().optional().describe('ID du serveur'),
});

const GetChannelsSchema = z.object({
  guildId: z.string().optional().describe('ID du serveur'),
  type: z.string().optional().describe('Type de canal'),
});

const ListMembersSchema = z.object({
  guildId: z.string().optional().describe('ID du serveur (défaut: premier serveur)'),
  limit: z.number().min(1).max(100).default(50).describe('Nombre maximum de membres'),
});

const GetUserInfoSchema = z.object({
  userId: z.string().describe("ID de l'utilisateur"),
  guildId: z.string().optional().describe('ID du serveur pour les informations de membre'),
});

// ============================================================================
// ENREGISTREMENT DES OUTILS
// ============================================================================

export function registerServerTools(server: FastMCP): void {
  server.addTool({
    name: 'get_server_info',
    description: 'Informations détaillées du serveur',
    parameters: GetServerInfoSchema,
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

  server.addTool({
    name: 'get_channels',
    description: 'Liste tous les canaux',
    parameters: GetChannelsSchema,
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

  server.addTool({
    name: 'list_members',
    description: "Liste les membres et leurs rôles d'un serveur",
    parameters: ListMembersSchema,
    execute: async args => {
      try {
        console.error(`👥 [list_members] Guild: ${args.guildId || 'auto'}, Limit: ${args.limit}`);
        const client = await ensureDiscordConnection();
        const guildId = args.guildId || client.guilds.cache.first()?.id;

        if (!guildId) {
          throw new Error('Aucun serveur disponible');
        }

        const guild = await client.guilds.fetch(guildId);
        const members = await guild.members.fetch();

        const list = Array.from(members.values())
          .slice(0, args.limit)
          .map(m => `• ${m.user.username}#${m.user.discriminator} | Roles: ${m.roles.cache.map(r => r.name).join(', ')}`)
          .join('\n');

        return `👥 ${Math.min(members.size, args.limit)} membres (sur ${members.size}):\n${list}`;
      } catch (error: any) {
        return `❌ Erreur: ${error.message}`;
      }
    },
  });

  server.addTool({
    name: 'get_user_info',
    description: 'Obtenir des informations détaillées sur un utilisateur',
    parameters: GetUserInfoSchema,
    execute: async args => {
      try {
        console.error(`👤 [get_user_info] User: ${args.userId}`);
        const client = await ensureDiscordConnection();
        const user = await client.users.fetch(args.userId);

        let memberInfo = '';
        if (args.guildId) {
          try {
            const guild = await client.guilds.fetch(args.guildId);
            const member = await guild.members.fetch(args.userId).catch(() => null);

            if (member) {
              memberInfo = `\n📋 Roles: ${member.roles.cache.map(r => r.name).join(', ')}\n📅 Rejoint: ${member.joinedAt?.toLocaleDateString('fr-FR')}`;
            }
          } catch (e) {
            // Ignore errors fetching member info
          }
        }

        return `👤 **${user.username}#${user.discriminator}**
🆔 ID: ${user.id}
📖 Display Name: ${user.displayName}
🎨 Avatar: ${user.avatarURL() || 'N/A'}${memberInfo}`;
      } catch (error: any) {
        console.error(`❌ [get_user_info]`, error.message);
        return `❌ Erreur: ${error.message}`;
      }
    },
  });
}
