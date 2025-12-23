/**
 * ➕ AJOUTER RÉACTION
 * ===================
 * Ajoute une réaction emoji à un message Discord.
 */

import { z } from 'zod';
import type { Client } from 'discord.js';

// ============================================================================
// SCHÉMA ZOD
// ============================================================================

export const AddReactionSchema = z.object({
  channelId: z.string().describe('ID du canal'),
  messageId: z.string().describe('ID du message'),
  emoji: z.string().describe('Emoji'),
});

export type AddReactionParams = z.infer<typeof AddReactionSchema>;

// ============================================================================
// FONCTION D'EXÉCUTION
// ============================================================================

export async function addReaction(client: Client, args: AddReactionParams): Promise<string> {
  const channel = await client.channels.fetch(args.channelId);

  if (!channel || !('messages' in channel)) {
    throw new Error('Canal invalide ou inaccessible');
  }

  const message = await channel.messages.fetch(args.messageId);
  await message.react(args.emoji);

  return `✅ Réaction ${args.emoji} ajoutée`;
}

// ============================================================================
// CONFIGURATION OUTIL MCP
// ============================================================================

export const addReactionToolConfig = {
  name: 'add_reaction',
  description: 'Ajoute une réaction emoji',
  parameters: AddReactionSchema,
};
