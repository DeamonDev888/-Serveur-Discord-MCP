/**
 * 👥 LIST MEMBERS
 * ===============
 * Liste les membres et leurs rôles d'un serveur Discord.
 */

import { z } from 'zod';
import type { Client } from 'discord.js';

// ============================================================================
// SCHÉMA ZOD
// ============================================================================

export const ListMembersSchema = z.object({
  guildId: z.string().describe('ID du serveur'),
  limit: z.number().min(1).max(100).optional().default(20).describe('Nombre de membres à afficher'),
});

export type ListMembersParams = z.infer<typeof ListMembersSchema>;

// ============================================================================
// FONCTION D'EXÉCUTION
// ============================================================================

export async function listMembers(client: Client, args: ListMembersParams): Promise<string> {
  const guild = await client.guilds.fetch(args.guildId);

  if (!guild) {
    throw new Error('Serveur non trouvé');
  }

  await guild.members.fetch();
  const members = Array.from(guild.members.cache.values()).slice(0, args.limit);

  const list = members.map(m => {
    const roles = m.roles.cache.map(r => r.name).join(', ');
    return `• **${m.user.tag}**${m.nickname ? ` (${m.nickname})` : ''}\n  Roles: ${roles || 'Aucun'}`;
  }).join('\n\n');

  return `👥 **${guild.name}** - ${members.length} membres:\n\n${list}`;
}

// ============================================================================
// CONFIGURATION OUTIL MCP
// ============================================================================

export const listMembersToolConfig = {
  name: 'list_members',
  description: "Liste les membres et leurs rôles d'un serveur",
  parameters: ListMembersSchema,
};
