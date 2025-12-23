/**
 * 📝 ÉDITER MESSAGE
 * =================
 * Modifie un message existant dans un canal Discord.
 */

import { z } from 'zod';
import type { Client } from 'discord.js';

// ============================================================================
// SCHÉMA ZOD
// ============================================================================

export const EditMessageSchema = z.object({
  channelId: z.string().describe('ID du canal'),
  messageId: z.string().describe('ID du message à modifier'),
  newContent: z.string().describe('Nouveau contenu du message'),
});

export type EditMessageParams = z.infer<typeof EditMessageSchema>;

// ============================================================================
// FONCTION D'EXÉCUTION
// ============================================================================

export async function editMessage(client: Client, args: EditMessageParams): Promise<string> {
  const channel = await client.channels.fetch(args.channelId);

  if (!channel || !('messages' in channel)) {
    throw new Error('Canal invalide ou inaccessible');
  }

  const message = await channel.messages.fetch(args.messageId);
  await message.edit(args.newContent);

  return `✅ Message modifié | ID: ${args.messageId}`;
}

// ============================================================================
// CONFIGURATION OUTIL MCP
// ============================================================================

export const editMessageToolConfig = {
  name: 'edit_message',
  description: 'Modifie un message existant',
  parameters: EditMessageSchema,
};
