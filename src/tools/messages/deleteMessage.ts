/**
 * 🗑️ SUPPRIMER MESSAGE
 * =====================
 * Supprime un message d'un canal Discord.
 */

import { z } from 'zod';
import type { Client } from 'discord.js';

// ============================================================================
// SCHÉMA ZOD
// ============================================================================

export const DeleteMessageSchema = z.object({
  channelId: z.string().describe('ID du canal'),
  messageId: z.string().describe('ID du message à supprimer'),
  reason: z.string().optional().describe('Raison de la suppression'),
});

export type DeleteMessageParams = z.infer<typeof DeleteMessageSchema>;

// ============================================================================
// FONCTION D'EXÉCUTION
// ============================================================================

export async function deleteMessage(client: Client, args: DeleteMessageParams): Promise<string> {
  const channel = await client.channels.fetch(args.channelId);

  if (!channel || !('messages' in channel)) {
    throw new Error('Canal invalide ou inaccessible');
  }

  const message = await channel.messages.fetch(args.messageId);
  await message.delete();

  return `✅ Message supprimé | ID: ${args.messageId}${args.reason ? ` | Raison: ${args.reason}` : ''}`;
}

// ============================================================================
// CONFIGURATION OUTIL MCP
// ============================================================================

export const deleteMessageToolConfig = {
  name: 'delete_message',
  description: 'Supprime un message',
  parameters: DeleteMessageSchema,
};
