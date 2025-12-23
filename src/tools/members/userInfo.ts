/**
 * 👤 USER INFO
 * ============
 * Obtenir des informations détaillées sur un utilisateur Discord.
 */

import { z } from 'zod';
import type { Client } from 'discord.js';

// ============================================================================
// SCHÉMA ZOD
// ============================================================================

export const GetUserInfoSchema = z.object({
  userId: z.string().describe('ID de l\'utilisateur'),
  guildId: z.string().optional().describe('ID du serveur (optionnel)'),
});

export type GetUserInfoParams = z.infer<typeof GetUserInfoSchema>;

// ============================================================================
// FONCTION D'EXÉCUTION
// ============================================================================

export async function getUserInfo(client: Client, args: GetUserInfoParams): Promise<string> {
  const user = await client.users.fetch(args.userId);

  if (!user) {
    throw new Error('Utilisateur non trouvé');
  }

  let info = `👤 **${user.tag}**
🆔 ID: ${user.id}
🤖 Bot: ${user.bot ? 'Oui' : 'Non'}
📅 Créé: <t:${Math.floor(user.createdTimestamp / 1000)}:D>`;

  if (args.guildId) {
    const guild = await client.guilds.fetch(args.guildId);
    if (guild) {
      const member = await guild.members.fetch(args.userId).catch(() => null);
      if (member) {
        const roles = member.roles.cache.map(r => r.name).join(', ');
        info += `\n\n🏅 **Sur ${guild.name}:**
📛 Surnom: ${member.nickname || 'Aucun'}
🎨 Roles: ${roles || 'Aucun'}
📅 Rejoint: <t:${Math.floor(member.joinedTimestamp! / 1000)}:D>`;
      }
    }
  }

  return info;
}

// ============================================================================
// CONFIGURATION OUTIL MCP
// ============================================================================

export const getUserInfoToolConfig = {
  name: 'get_user_info',
  description: 'Obtenir des informations détaillées sur un utilisateur',
  parameters: GetUserInfoSchema,
};
