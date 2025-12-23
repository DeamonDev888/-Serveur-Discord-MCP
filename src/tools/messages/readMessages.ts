/**
 * 📖 LIRE MESSAGES
 * ================
 * Lit l'historique des messages d'un canal Discord.
 */

import { z } from 'zod';
import type { Client } from 'discord.js';

// ============================================================================
// SCHÉMA ZOD
// ============================================================================

export const ReadMessagesSchema = z.object({
  channelId: z.string().describe('ID du canal'),
  limit: z.number().min(1).max(100).default(10).describe('Nombre de messages'),
});

export type ReadMessagesParams = z.infer<typeof ReadMessagesSchema>;

// ============================================================================
// FONCTION D'EXÉCUTION
// ============================================================================

export async function readMessages(client: Client, args: ReadMessagesParams): Promise<string> {
  const channel = await client.channels.fetch(args.channelId);

  if (!channel || !('messages' in channel)) {
    throw new Error('Canal invalide ou inaccessible');
  }

  const messages = await channel.messages.fetch({ limit: args.limit });
  const list = messages.map(m => `• ${m.author.username}: ${m.content}`).join('\n');

  return `📖 ${messages.size} messages:\n${list}`;
}

// ============================================================================
// CONFIGURATION OUTIL MCP
// ============================================================================

export const readMessagesToolConfig = {
  name: 'read_messages',
  description: "Lit l'historique des messages",
  parameters: ReadMessagesSchema,
};
