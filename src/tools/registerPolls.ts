/**
 * Outils de sondages pour le serveur Discord MCP
 * Enregistre les outils de sondages (2 outils)
 */

import { z } from 'zod';
import type { FastMCP } from 'fastmcp';
import { EmbedBuilder } from 'discord.js';
import Logger from '../utils/logger.js';
import { ensureDiscordConnection } from './common.js';

// ============================================================================
// SCHÉMAS ZOD
// ============================================================================

const CreerSondageSchema = z.object({
  channelId: z.string().describe('ID du canal où créer le sondage'),
  question: z.string().min(5).max(500).describe('Question du sondage (5-500 caractères)'),
  options: z.array(z.string()).min(2).max(10).describe('Options du sondage (2-10 options)'),
  duration: z.number().min(5).max(604800).optional().default(300).describe('Durée en secondes (min: 5s, max: 7j, défaut: 5m)'),
  anonymous: z.boolean().optional().default(false).describe('Sondage anonyme'),
});

const VoteSondageSchema = z.object({
  channelId: z.string().describe('ID du canal où voter'),
  messageId: z.string().describe('ID du message du sondage'),
  optionIndex: z.number().min(0).describe("Index de l'option à voter"),
  userId: z.string().optional().describe("ID de l'utilisateur (défaut: bot)"),
});

// ============================================================================
// UTILITAIRES
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
// ENREGISTREMENT DES OUTILS
// ============================================================================

export function registerPollsTools(server: FastMCP): void {
  server.addTool({
    name: 'creer_sondage',
    description: 'Crée un sondage simple avec embed et réactions (100% compatible Discord.js)',
    parameters: CreerSondageSchema,
    execute: async args => {
      try {
        console.error(`🗳️ [creer_sondage] Question: ${args.question}, Options: ${args.options.length}`);
        const client = await ensureDiscordConnection();
        const channel = await client.channels.fetch(args.channelId);

        if (!channel || !('send' in channel)) {
          throw new Error('Canal invalide ou inaccessible');
        }

        const emojis = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'];

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

        const message = await channel.send({ embeds: [embed] });

        await message.react(emojis[0]);
        if (args.options.length > 1) await message.react(emojis[1]);
        if (args.options.length > 2) await message.react(emojis[2]);
        if (args.options.length > 3) await message.react(emojis[3]);
        if (args.options.length > 4) await message.react(emojis[4]);

        const endTime = new Date(Date.now() + args.duration * 1000);
        return `✅ Sondage créé | ID: ${message.id} | ${args.options.length} options | Fin: <t:${Math.floor(endTime.getTime() / 1000)}:R>`;
      } catch (error: any) {
        console.error(`❌ [creer_sondage]`, error.message);
        return `❌ Erreur: ${error.message}`;
      }
    },
  });

  server.addTool({
    name: 'vote_sondage',
    description: 'Vote dans un sondage interactif',
    parameters: VoteSondageSchema,
    execute: async args => {
      try {
        console.error(`🗳️ [vote_sondage] Message: ${args.messageId}, Option: ${args.optionIndex}`);
        const client = await ensureDiscordConnection();
        const channel = await client.channels.fetch(args.channelId);

        if (!channel || !('messages' in channel)) {
          throw new Error('Canal invalide');
        }

        const message = await channel.messages.fetch(args.messageId);

        if (!message.author.bot || !message.components.length) {
          return `❌ Ce message n'est pas un sondage valide`;
        }

        const buttons = message.components
          .flatMap((row: any) => row.components)
          .filter((c: any) => c.type === 2);

        if (args.optionIndex >= buttons.length) {
          return `❌ Index d'option invalide. Max: ${buttons.length - 1}`;
        }

        const button = buttons[args.optionIndex];
        const emoji = button.emoji || button.label || `Option ${args.optionIndex}`;

        await message.react(emoji);

        const voterMention = args.userId ? `<@${args.userId}>` : 'le bot';
        if ('send' in channel) {
          await channel.send({
            content: `✅ ${voterMention} a voté pour: **${button.label}**`,
            embeds: [],
          });
        }

        return `✅ Vote enregistré pour l'option ${args.optionIndex} (${button.label})`;
      } catch (error: any) {
        console.error(`❌ [vote_sondage]`, error.message);
        return `❌ Erreur: ${error.message}`;
      }
    },
  });
}
