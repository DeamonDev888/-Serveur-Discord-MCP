/**
 * 📊 CRÉER SONDAGE
 * ================
 * Crée un sondage simple avec embed et réactions Discord.
 */

import { z } from 'zod';
import { EmbedBuilder } from 'discord.js';
import type { Client } from 'discord.js';

// ============================================================================
// SCHÉMA ZOD
// ============================================================================

export const CreatePollSchema = z.object({
  channelId: z.string().describe('ID du canal où créer le sondage'),
  question: z.string().min(5).max(500).describe('Question du sondage (5-500 caractères)'),
  options: z.array(z.string()).min(2).max(10).describe('Options du sondage (2-10 options)'),
  duration: z.number().min(5).max(604800).optional().default(300).describe('Durée en secondes (min: 5s, max: 7j, défaut: 5m)'),
  anonymous: z.boolean().optional().default(false).describe('Sondage anonyme'),
});

export type CreatePollParams = z.infer<typeof CreatePollSchema>;

// ============================================================================
// FONCTIONS UTILITAIRES
// ============================================================================

function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}h${minutes > 0 ? ` ${minutes}m` : ''}${secs > 0 ? ` ${secs}s` : ''}`;
  } else if (minutes > 0) {
    return `${minutes}m${secs > 0 ? ` ${secs}s` : ''}`;
  } else {
    return `${secs}s`;
  }
}

// ============================================================================
// FONCTION D'EXÉCUTION
// ============================================================================

export async function createPoll(client: Client, args: CreatePollParams): Promise<string> {
  const channel = await client.channels.fetch(args.channelId);

  if (!channel || !('send' in channel)) {
    throw new Error('Canal invalide ou inaccessible');
  }

  // Emojis pour les options
  const emojis = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'];

  // Créer l'embed simple
  const embed = new EmbedBuilder()
    .setTitle('📊 Sondage')
    .setDescription(`**${args.question}**\n\n${args.options.map((opt, i) => `${emojis[i]} ${opt}`).join('\n')}`)
    .setColor(0x5865f2)
    .addFields(
      { name: '⏱️ Durée', value: formatDuration(args.duration), inline: true },
      { name: '👤 Mode', value: args.anonymous ? 'Anonyme' : 'Public', inline: true },
      { name: '🔢 Votes', value: args.options.length + ' options', inline: true }
    )
    .setFooter({ text: 'Réagissez avec les emojis pour voter !' })
    .setTimestamp();

  // Envoyer le message
  const message = await channel.send({ embeds: [embed] });

  // Ajouter les réactions une par une
  await message.react(emojis[0]);
  if (args.options.length > 1) await message.react(emojis[1]);
  if (args.options.length > 2) await message.react(emojis[2]);
  if (args.options.length > 3) await message.react(emojis[3]);
  if (args.options.length > 4) await message.react(emojis[4]);

  const endTime = new Date(Date.now() + args.duration * 1000);
  return `✅ Sondage créé | ID: ${message.id} | ${args.options.length} options | Fin: <t:${Math.floor(endTime.getTime() / 1000)}:R>`;
}

// ============================================================================
// CONFIGURATION OUTIL MCP
// ============================================================================

export const createPollToolConfig = {
  name: 'creer_sondage',
  description: "Crée un sondage simple avec embed et réactions (100% compatible Discord.js)",
  parameters: CreatePollSchema,
};

export { formatDuration };
