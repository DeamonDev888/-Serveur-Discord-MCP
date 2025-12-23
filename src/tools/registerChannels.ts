/**
 * Outils de gestion des canaux pour le serveur Discord MCP
 * Enregistre les outils de canaux (4 outils)
 */

import { z } from 'zod';
import type { FastMCP } from 'fastmcp';
import { PermissionFlagsBits, ChannelType } from 'discord.js';
import Logger from '../utils/logger.js';
import { ensureDiscordConnection } from './common.js';

// ============================================================================
// SCHÉMAS ZOD
// ============================================================================

const CreateChannelSchema = z.object({
  guildId: z.string().describe('ID du serveur'),
  name: z.string().describe('Nom du canal'),
  type: z.enum(['text', 'voice', 'category', 'news', 'stage', 'forum']).describe('Type de canal'),
  topic: z.string().optional().describe('Sujet du canal (text/news uniquement)'),
  nsfw: z.boolean().optional().default(false).describe('Canal NSFW'),
  parentId: z.string().optional().describe('ID de la catégorie parent'),
  position: z.number().optional().describe('Position du canal'),
});

const DeleteChannelSchema = z.object({
  guildId: z.string().describe('ID du serveur'),
  channelId: z.string().describe('ID du canal à supprimer'),
  reason: z.string().optional().describe('Raison de la suppression'),
});

const EditChannelSchema = z.object({
  guildId: z.string().describe('ID du serveur'),
  channelId: z.string().describe('ID du canal à modifier'),
  name: z.string().optional().describe('Nouveau nom'),
  topic: z.string().optional().describe('Nouveau sujet'),
  nsfw: z.boolean().optional().describe('Statut NSFW'),
  parentId: z.string().optional().describe('ID de la catégorie parent'),
  position: z.number().optional().describe('Nouvelle position'),
});

const MoveMemberToChannelSchema = z.object({
  guildId: z.string().describe('ID du serveur'),
  userId: z.string().describe('ID du membre'),
  channelId: z.string().describe('ID du canal vocal'),
});

// ============================================================================
// UTILITAIRES
// ============================================================================

function getChannelType(type: string): ChannelType {
  const typeMap: { [key: string]: ChannelType } = {
    text: ChannelType.GuildText,
    voice: ChannelType.GuildVoice,
    category: ChannelType.GuildCategory,
    news: ChannelType.GuildNews,
    stage: ChannelType.GuildStageVoice,
    forum: ChannelType.GuildForum,
  };

  return typeMap[type] || ChannelType.GuildText;
}

// ============================================================================
// FONCTIONS
// ============================================================================

async function createChannel(client: any, args: z.infer<typeof CreateChannelSchema>): Promise<string> {
  const validation = CreateChannelSchema.safeParse(args);
  if (!validation.success) {
    return `❌ Paramètres invalides: ${validation.error.message}`;
  }

  const { guildId, name, type, topic, nsfw, parentId, position } = validation.data;
  const guild = await client.guilds.fetch(guildId);

  if (!guild.members.me?.permissions.has(PermissionFlagsBits.ManageChannels)) {
    return "❌ Le bot n'a pas la permission de gérer les canaux";
  }

  const channelType = getChannelType(type);
  const channel = await guild.channels.create({
    name,
    type: channelType,
    topic: topic || undefined,
    nsfw: nsfw || false,
    parent: parentId || undefined,
    position: position || undefined,
  });

  return `✅ Canal créé: ${channel.name} (${type}) - ID: ${channel.id}`;
}

async function deleteChannel(client: any, args: z.infer<typeof DeleteChannelSchema>): Promise<string> {
  const validation = DeleteChannelSchema.safeParse(args);
  if (!validation.success) {
    return `❌ Paramètres invalides: ${validation.error.message}`;
  }

  const { guildId, channelId, reason } = validation.data;
  const guild = await client.guilds.fetch(guildId);
  const channel = await guild.channels.fetch(channelId);

  if (!guild.members.me?.permissions.has(PermissionFlagsBits.ManageChannels)) {
    return "❌ Le bot n'a pas la permission de gérer les canaux";
  }

  await channel.delete(reason || 'Aucune raison spécifiée');
  return `✅ Canal supprimé: ${channel.name} (${channelId})`;
}

async function editChannel(client: any, args: z.infer<typeof EditChannelSchema>): Promise<string> {
  const validation = EditChannelSchema.safeParse(args);
  if (!validation.success) {
    return `❌ Paramètres invalides: ${validation.error.message}`;
  }

  const { guildId, channelId, name, topic, nsfw, parentId, position } = validation.data;
  const guild = await client.guilds.fetch(guildId);
  const channel = await guild.channels.fetch(channelId);

  if (!guild.members.me?.permissions.has(PermissionFlagsBits.ManageChannels)) {
    return "❌ Le bot n'a pas la permission de gérer les canaux";
  }

  const updates: any = {};
  if (name) updates.name = name;
  if (typeof nsfw === 'boolean') updates.nsfw = nsfw;
  if (parentId) updates.parent = parentId;
  if (position) updates.position = position;

  if (
    topic &&
    (channel.type === ChannelType.GuildText || channel.type === ChannelType.GuildNews)
  ) {
    updates.topic = topic;
  }

  const updatedChannel = await channel.edit(updates);
  return `✅ Canal modifié: ${updatedChannel.name} (${updatedChannel.id})`;
}

async function moveMemberToChannel(client: any, args: z.infer<typeof MoveMemberToChannelSchema>): Promise<string> {
  const validation = MoveMemberToChannelSchema.safeParse(args);
  if (!validation.success) {
    return `❌ Paramètres invalides: ${validation.error.message}`;
  }

  const { guildId, userId, channelId } = validation.data;
  const guild = await client.guilds.fetch(guildId);
  const member = await guild.members.fetch(userId);
  const channel = await guild.channels.fetch(channelId);

  if (channel.type !== ChannelType.GuildVoice && channel.type !== ChannelType.GuildStageVoice) {
    return `❌ Le canal doit être vocal ou stage`;
  }

  if (!guild.members.me?.permissions.has(PermissionFlagsBits.MoveMembers)) {
    return "❌ Le bot n'a pas la permission de déplacer des membres";
  }

  await member.voice.setChannel(channelId);
  return `✅ ${member.user.username} déplacé vers ${channel.name}`;
}

// ============================================================================
// ENREGISTREMENT DES OUTILS
// ============================================================================

export function registerChannelsTools(server: FastMCP): void {
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
}
