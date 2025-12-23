/**
 * 🖥️ SERVER INFO
 * ==============
 * Informations détaillées du serveur Discord.
 */

import { z } from 'zod';
import type { Client } from 'discord.js';
import { ChannelType } from 'discord.js';

// ============================================================================
// SCHÉMA ZOD
// ============================================================================

export const GetServerInfoSchema = z.object({
  guildId: z.string().describe('ID du serveur'),
});

export type GetServerInfoParams = z.infer<typeof GetServerInfoSchema>;

// ============================================================================
// FONCTION D'EXÉCUTION
// ============================================================================

export async function getServerInfo(client: Client, args: GetServerInfoParams): Promise<string> {
  const guild = await client.guilds.fetch(args.guildId);

  if (!guild) {
    throw new Error('Serveur non trouvé');
  }

  const owner = await guild.fetchOwner();

  const channels = guild.channels.cache;
  const textChannels = channels.filter(c => c.isTextBased()).size;
  const voiceChannels = channels.filter(c => c.isVoiceBased()).size;
  const categoryChannels = channels.filter(c => c.type === ChannelType.GuildCategory).size;

  return `🖥️ **${guild.name}**
🆔 ID: ${guild.id}
👑 Propriétaire: ${owner.user.tag}
👥 Membres: ${guild.memberCount}
📝 Salons: ${channels.size} (Texte: ${textChannels}, Vocal: ${voiceChannels}, Catégorie: ${categoryChannels})
🚀 Niveau de boost: ${guild.premiumSubscriptionCount || 0} boosts
🎨 Rôles: ${guild.roles.cache.size}
📅 Créé: <t:${Math.floor(guild.createdTimestamp / 1000)}:D>
${guild.description ? `📝 ${guild.description}` : ''}`;
}

// ============================================================================
// CONFIGURATION OUTIL MCP
// ============================================================================

export const getServerInfoToolConfig = {
  name: 'get_server_info',
  description: 'Informations détaillées du serveur',
  parameters: GetServerInfoSchema,
};
