/**
 * Outils MCP unifiés pour la gestion des canaux
 * Fusionne: channelManager, channelAdmin, registerChannels
 */

import { z } from 'zod';
import type { FastMCP } from 'fastmcp';
import { ChannelType, PermissionFlagsBits } from 'discord.js';
import Logger from '../utils/logger.js';
import { ensureDiscordConnection } from './common.js';

// ============================================================================
// ENREGISTREMENT DES OUTILS
// ============================================================================

export function registerChannelTools(server: FastMCP) {

  // ========================================================================
  // 1. LISTE DES CANAUX
  // ========================================================================

  server.addTool({
    name: 'list_channels',
    description: 'Liste tous les canaux du serveur',
    parameters: z.object({
      type: z.enum(['all', 'text', 'voice', 'category']).optional().default('all').describe('Type de canal'),
    }),
    execute: async (args) => {
      try {
        const client = await ensureDiscordConnection();
        const guild = client.guilds.cache.first();

        if (!guild) {
          return '❌ Aucun serveur disponible';
        }

        await guild.channels.fetch();

        let channels = Array.from(guild.channels.cache.values());

        // Filtrer par type
        if (args.type !== 'all') {
          const typeMap: Record<string, number> = {
            text: ChannelType.GuildText,
            voice: ChannelType.GuildVoice,
            category: ChannelType.GuildCategory,
          };
          channels = channels.filter(c => c.type === typeMap[args.type]);
        }

        // Trier par nom (position n'est pas disponible sur tous les types de canaux)
        channels.sort((a, b) => a.name.localeCompare(b.name));

        const typeEmoji: Record<number, string> = {
          [ChannelType.GuildText]: '💬',
          [ChannelType.GuildVoice]: '🔊',
          [ChannelType.GuildCategory]: '📁',
        };

        const list = channels.map(c => {
          const emoji = typeEmoji[c.type] || '📌';
          const category = c.parent ? ` (${c.parent.name})` : '';
          return `${emoji} **${c.name}**${category} [${c.id}]`;
        }).join('\n');

        return `📋 **${channels.length} canaux** (${args.type}):\n\n${list}`;
      } catch (error: any) {
        Logger.error('❌ [list_channels]', error.message);
        return `❌ Erreur: ${error.message}`;
      }
    },
  });

  // ========================================================================
  // 2. CRÉER UN CANAL
  // ========================================================================

  server.addTool({
    name: 'create_channel',
    description: 'Crée un nouveau canal',
    parameters: z.object({
      name: z.string().describe('Nom du canal'),
      type: z.enum(['text', 'voice']).default('text').describe('Type de canal'),
      categoryId: z.string().optional().describe('ID de la catégorie parente'),
      reason: z.string().optional().describe('Raison de la création'),
    }),
    execute: async (args) => {
      try {
        const client = await ensureDiscordConnection();
        const guild = client.guilds.cache.first();

        if (!guild) {
          return '❌ Aucun serveur disponible';
        }

        const typeMap: Record<string, number> = {
          text: ChannelType.GuildText,
          voice: ChannelType.GuildVoice,
        };

        const channelData: any = {
          name: args.name,
          type: typeMap[args.type],
          reason: args.reason,
        };

        if (args.categoryId) {
          channelData.parent = args.categoryId;
        }

        const channel = await guild.channels.create(channelData);

        Logger.info(`✅ Canal ${channel.name} créé`);

        return `✅ Canal **${channel.name}** créé (ID: ${channel.id})`;
      } catch (error: any) {
        Logger.error('❌ [create_channel]', error.message);
        return `❌ Erreur: ${error.message}`;
      }
    },
  });

  // ========================================================================
  // 3. MODIFIER UN CANAL
  // ========================================================================

  server.addTool({
    name: 'edit_channel',
    description: 'Modifie un canal existant',
    parameters: z.object({
      channelId: z.string().describe('ID du canal'),
      name: z.string().optional().describe('Nouveau nom'),
      categoryId: z.string().optional().describe('Nouvelle catégorie parente'),
      reason: z.string().optional().describe('Raison de la modification'),
    }),
    execute: async (args) => {
      try {
        const client = await ensureDiscordConnection();
        const guild = client.guilds.cache.first();

        if (!guild) {
          return '❌ Aucun serveur disponible';
        }

        const channel = await guild.channels.fetch(args.channelId).catch(() => null);
        if (!channel) {
          return `❌ Canal ${args.channelId} introuvable`;
        }

        const updateData: any = {};
        if (args.name !== undefined) updateData.name = args.name;
        if (args.categoryId !== undefined) updateData.parent = args.categoryId;

        await channel.edit(updateData, { reason: args.reason });

        Logger.info(`✅ Canal ${channel.name} modifié`);

        return `✅ Canal **${channel.name}** modifié`;
      } catch (error: any) {
        Logger.error('❌ [edit_channel]', error.message);
        return `❌ Erreur: ${error.message}`;
      }
    },
  });

  // ========================================================================
  // 4. SUPPRIMER UN CANAL
  // ========================================================================

  server.addTool({
    name: 'delete_channel',
    description: 'Supprime un canal',
    parameters: z.object({
      channelId: z.string().describe('ID du canal à supprimer'),
      reason: z.string().optional().describe('Raison de la suppression'),
    }),
    execute: async (args) => {
      try {
        const client = await ensureDiscordConnection();
        const guild = client.guilds.cache.first();

        if (!guild) {
          return '❌ Aucun serveur disponible';
        }

        const channel = await guild.channels.fetch(args.channelId).catch(() => null);
        if (!channel) {
          return `❌ Canal ${args.channelId} introuvable`;
        }

        await channel.delete(args.reason);

        Logger.info(`✅ Canal ${channel.name} supprimé`);

        return `✅ Canal **${channel.name}** supprimé`;
      } catch (error: any) {
        Logger.error('❌ [delete_channel]', error.message);
        return `❌ Erreur: ${error.message}`;
      }
    },
  });

  // ========================================================================
  // 5. DÉFINIR LES PERMISSIONS D'UN CANAL
  // ========================================================================

  server.addTool({
    name: 'set_channel_permissions',
    description: 'Définit les permissions d\'un canal pour un rôle',
    parameters: z.object({
      channelId: z.string().describe('ID du canal'),
      roleId: z.string().describe('ID du rôle'),
      allow: z.array(z.string()).optional().describe('Permissions à accorder'),
      deny: z.array(z.string()).optional().describe('Permissions à refuser'),
    }),
    execute: async (args) => {
      try {
        const client = await ensureDiscordConnection();
        const guild = client.guilds.cache.first();

        if (!guild) {
          return '❌ Aucun serveur disponible';
        }

        const channel = await guild.channels.fetch(args.channelId).catch(() => null);
        if (!channel) {
          return `❌ Canal ${args.channelId} introuvable`;
        }

        const role = await guild.roles.fetch(args.roleId).catch(() => null);
        if (!role) {
          return `❌ Rôle ${args.roleId} introuvable`;
        }

        const permissionOverwrites: any = {};

        if (args.allow && args.allow.length > 0) {
          permissionOverwrites.Allow = args.allow.reduce((acc, perm) => {
            const permFlag = PermissionFlagsBits[perm as keyof typeof PermissionFlagsBits];
            return acc | (typeof permFlag === 'bigint' ? permFlag : BigInt(permFlag || 0));
          }, 0n);
        }

        if (args.deny && args.deny.length > 0) {
          permissionOverwrites.Deny = args.deny.reduce((acc, perm) => {
            const permFlag = PermissionFlagsBits[perm as keyof typeof PermissionFlagsBits];
            return acc | (typeof permFlag === 'bigint' ? permFlag : BigInt(permFlag || 0));
          }, 0n);
        }

        await channel.permissionOverwrites.edit(role, permissionOverwrites);

        Logger.info(`✅ Permissions du canal ${channel.name} modifiées pour ${role.name}`);

        return `✅ Permissions du canal **${channel.name}** modifiées pour le rôle **${role.name}**`;
      } catch (error: any) {
        Logger.error('❌ [set_channel_permissions]', error.message);
        return `❌ Erreur: ${error.message}`;
      }
    },
  });

  Logger.info('✅ Outils channels enregistrés (5 outils)');
}
