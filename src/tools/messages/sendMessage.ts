/**
 * 📊 ENVOYER MESSAGE
 * ====================
 * Envoie un message texte simple dans un canal Discord.
 */

import { z } from 'zod';
import type { Client } from 'discord.js';

// ============================================================================
// SCHÉMA ZOD
// ============================================================================

export const SendMessageSchema = z.object({
  channelId: z.string().describe('ID du canal Discord'),
  content: z.string().describe('Contenu du message'),
});

export type SendMessageParams = z.infer<typeof SendMessageSchema>;

// ============================================================================
// FONCTION D'EXÉCUTION
// ============================================================================

export async function sendMessage(client: Client, args: SendMessageParams): Promise<string> {
  const channel = await client.channels.fetch(args.channelId);

  if (!channel || !('send' in channel)) {
    throw new Error('Canal invalide ou inaccessible');
  }

  const message = await channel.send(args.content);

  return `✅ Message envoyé | ID: ${message.id}`;
}

// ============================================================================
// CONFIGURATION OUTIL MCP
// ============================================================================

export const sendMessageToolConfig = {
  name: 'envoyer_message',
  description: 'Envoie un message texte simple',
  parameters: SendMessageSchema,
};
