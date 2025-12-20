import { z } from 'zod';
import { PermissionFlagsBits, ChannelType } from 'discord.js';

// Schémas de validation
export const CreateChannelSchema = z.object({
  guildId: z.string().describe('ID du serveur'),
  name: z.string().describe('Nom du canal'),
  type: z.enum(['text', 'voice', 'category', 'news', 'stage', 'forum']).describe('Type de canal'),
  topic: z.string().optional().describe('Sujet du canal (text/news uniquement)'),
  nsfw: z.boolean().optional().default(false).describe('Canal NSFW'),
  parentId: z.string().optional().describe('ID de la catégorie parent'),
  position: z.number().optional().describe('Position du canal'),
});

export const DeleteChannelSchema = z.object({
  guildId: z.string().describe('ID du serveur'),
  channelId: z.string().describe('ID du canal à supprimer'),
  reason: z.string().optional().describe('Raison de la suppression'),
});

export const EditChannelSchema = z.object({
  guildId: z.string().describe('ID du serveur'),
  channelId: z.string().describe('ID du canal à modifier'),
  name: z.string().optional().describe('Nouveau nom'),
  topic: z.string().optional().describe('Nouveau sujet'),
  nsfw: z.boolean().optional().describe('Statut NSFW'),
  parentId: z.string().optional().describe('ID de la catégorie parent'),
  position: z.number().optional().describe('Nouvelle position'),
});

export const MoveMemberToChannelSchema = z.object({
  guildId: z.string().describe('ID du serveur'),
  userId: z.string().describe('ID du membre'),
  channelId: z.string().describe('ID du canal vocal'),
});

// ===============================
// OUTILS MCP
// ===============================

// 1. Créer un canal
export async function createChannel(client: any, args: any): Promise<string> {
  try {
    const validation = CreateChannelSchema.safeParse(args);
    if (!validation.success) {
      return `❌ Paramètres invalides: ${validation.error.message}`;
    }

    const { guildId, name, type, topic, nsfw, parentId, position } = validation.data;

    const guild = await client.guilds.fetch(guildId);

    // Vérifier les permissions
    if (!guild.members.me?.permissions.has(PermissionFlagsBits.ManageChannels)) {
      return '❌ Le bot n\'a pas la permission de gérer les canaux';
    }

    // Déterminer le type de canal
    const channelType = getChannelType(type);

    // Créer le canal
    const channel = await guild.channels.create({
      name,
      type: channelType,
      topic: topic || undefined,
      nsfw: nsfw || false,
      parent: parentId || undefined,
      position: position || undefined,
    });

    return `✅ Canal créé: ${channel.name} (${type}) - ID: ${channel.id}`;
  } catch (error: any) {
    return `❌ Erreur: ${error.message}`;
  }
}

// 2. Supprimer un canal
export async function deleteChannel(client: any, args: any): Promise<string> {
  try {
    const validation = DeleteChannelSchema.safeParse(args);
    if (!validation.success) {
      return `❌ Paramètres invalides: ${validation.error.message}`;
    }

    const { guildId, channelId, reason } = validation.data;

    const guild = await client.guilds.fetch(guildId);
    const channel = await guild.channels.fetch(channelId);

    // Vérifier les permissions
    if (!guild.members.me?.permissions.has(PermissionFlagsBits.ManageChannels)) {
      return '❌ Le bot n\'a pas la permission de gérer les canaux';
    }

    // Supprimer le canal
    await channel.delete(reason || 'Aucune raison spécifiée');

    return `✅ Canal supprimé: ${channel.name} (${channelId})`;
  } catch (error: any) {
    return `❌ Erreur: ${error.message}`;
  }
}

// 3. Modifier un canal
export async function editChannel(client: any, args: any): Promise<string> {
  try {
    const validation = EditChannelSchema.safeParse(args);
    if (!validation.success) {
      return `❌ Paramètres invalides: ${validation.error.message}`;
    }

    const { guildId, channelId, name, topic, nsfw, parentId, position } = validation.data;

    const guild = await client.guilds.fetch(guildId);
    const channel = await guild.channels.fetch(channelId);

    // Vérifier les permissions
    if (!guild.members.me?.permissions.has(PermissionFlagsBits.ManageChannels)) {
      return '❌ Le bot n\'a pas la permission de gérer les canaux';
    }

    // Préparer les modifications
    const updates: any = {};
    if (name) updates.name = name;
    if (typeof nsfw === 'boolean') updates.nsfw = nsfw;
    if (parentId) updates.parent = parentId;
    if (position) updates.position = position;

    // Only add topic for text/news channels
    if (topic && (channel.type === ChannelType.GuildText || channel.type === ChannelType.GuildNews)) {
      updates.topic = topic;
    }

    // Appliquer les modifications
    const updatedChannel = await channel.edit(updates);

    return `✅ Canal modifié: ${updatedChannel.name} (${updatedChannel.id})`;
  } catch (error: any) {
    return `❌ Erreur: ${error.message}`;
  }
}

// 4. Déplacer un membre vers un canal vocal
export async function moveMemberToChannel(client: any, args: any): Promise<string> {
  try {
    const validation = MoveMemberToChannelSchema.safeParse(args);
    if (!validation.success) {
      return `❌ Paramètres invalides: ${validation.error.message}`;
    }

    const { guildId, userId, channelId } = validation.data;

    const guild = await client.guilds.fetch(guildId);
    const member = await guild.members.fetch(userId);
    const channel = await guild.channels.fetch(channelId);

    // Vérifier que c'est un canal vocal
    if (channel.type !== ChannelType.GuildVoice && channel.type !== ChannelType.GuildStageVoice) {
      return `❌ Le canal doit être vocal ou stage`;
    }

    // Vérifier les permissions
    if (!guild.members.me?.permissions.has(PermissionFlagsBits.MoveMembers)) {
      return '❌ Le bot n\'a pas la permission de déplacer des membres';
    }

    // Déplacer le membre
    await member.voice.setChannel(channelId);

    return `✅ ${member.user.username} déplacé vers ${channel.name}`;
  } catch (error: any) {
    return `❌ Erreur: ${error.message}`;
  }
}

// ===============================
// UTILITAIRES
// ===============================

// Obtenir le type de canal Discord
function getChannelType(type: string): ChannelType {
  const typeMap: { [key: string]: ChannelType } = {
    'text': ChannelType.GuildText,
    'voice': ChannelType.GuildVoice,
    'category': ChannelType.GuildCategory,
    'news': ChannelType.GuildNews,
    'stage': ChannelType.GuildStageVoice,
    'forum': ChannelType.GuildForum,
  };

  return typeMap[type] || ChannelType.GuildText;
}

// Exporter les schémas
export {
  CreateChannelSchema,
  DeleteChannelSchema,
  EditChannelSchema,
  MoveMemberToChannelSchema,
};
