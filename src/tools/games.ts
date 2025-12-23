/**
 * Outils MCP pour les jeux Discord
 */

import { z } from 'zod';
import type { FastMCP } from 'fastmcp';
import {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} from 'discord.js';
import {
  ensureDiscordConnection,
  EMBED_THEMES,
} from './common.js';
import {
  generateGameResult,
} from '../utils/gameUtils.js';
import { VISUAL_SEPARATORS } from '../utils/gameData.js';

// ============================================================================
// ENREGISTREMENT DES OUTILS
// ============================================================================

export function registerGameTools(server: FastMCP) {
  // 1. Show Game Result
  server.addTool({
    name: 'show_game_result',
    description: 'Afficher un résultat de jeu avec animation de réussite/échec et option de recommencer',
    parameters: z.object({
      channelId: z.string().describe('ID du canal'),
      isSuccess: z.boolean().describe('true = réussite, false = échec'),
      points: z.number().optional().describe('Points gagnés'),
      badge: z.string().optional().describe('Badge obtenu'),
      correctAnswer: z.string().optional().describe('Bonne réponse (si échec)'),
      userAnswer: z.string().optional().describe('Réponse de l\'utilisateur'),
      animationStyle: z.enum(['confetti', 'fireworks', 'trophy', 'party', 'stars', 'hearts', 'money', 'rocket', 'sad', 'explosion', 'skull', 'rain', 'broken', 'warning']).optional().describe('Style d\'animation'),
      showRetry: z.boolean().optional().default(true).describe('Afficher bouton recommencer'),
      retryGameId: z.string().optional().describe('ID du jeu pour recommencer'),
      theme: z.enum(['cyberpunk', 'minimal', 'gaming', 'corporate', 'sunset', 'ocean']).optional().describe('Thème de l\'embed'),
    }),
    execute: async (args) => {
      try {
        const client = await ensureDiscordConnection();
        const channel = await client.channels.fetch(args.channelId);

        if (!channel || !('send' in channel)) {
          throw new Error('Canal invalide');
        }

        // Générer le résultat
        const resultText = generateGameResult(args.isSuccess, {
          points: args.points,
          badge: args.badge,
          correctAnswer: args.correctAnswer,
          userAnswer: args.userAnswer,
          animationStyle: args.animationStyle,
          showRetry: args.showRetry,
          lang: 'fr',
        });

        // Créer l'embed
        const embed = new EmbedBuilder()
          .setTitle(args.isSuccess ? '🎉 VICTOIRE !' : '😢 DOMMAGE...')
          .setDescription(resultText)
          .setColor(args.isSuccess ? 0x00FF00 : 0xFF0000)
          .setTimestamp();

        // Appliquer le thème si spécifié
        if (args.theme) {
          const themeData = EMBED_THEMES[args.theme];
          if (themeData) {
            embed.setColor(themeData.color as any);
          }
        }

        // Ajouter bouton recommencer si demandé
        const components: any[] = [];
        if (args.showRetry) {
          const row = new ActionRowBuilder<ButtonBuilder>();

          const retryButton = new ButtonBuilder()
            .setCustomId(`retry_game_${args.retryGameId || Date.now()}`)
            .setLabel('🔄 Recommencer')
            .setStyle(ButtonStyle.Primary);

          const closeButton = new ButtonBuilder()
            .setCustomId(`close_result_${Date.now()}`)
            .setLabel('❌ Fermer')
            .setStyle(ButtonStyle.Secondary);

          row.addComponents(retryButton, closeButton);

          if (args.isSuccess) {
            const nextButton = new ButtonBuilder()
              .setCustomId(`next_game_${Date.now()}`)
              .setLabel('➡️ Niveau suivant')
              .setStyle(ButtonStyle.Success);
            row.addComponents(nextButton);
          }

          components.push(row);
        }

        const message = await channel.send({
          embeds: [embed],
          components: components.length > 0 ? components : undefined,
        });

        return `✅ Résultat affiché | ID: ${message.id}`;
      } catch (error: any) {
        return `❌ Erreur: ${error.message}`;
      }
    },
  });

  // 2. Create Interactive Quiz
  server.addTool({
    name: 'create_interactive_quiz',
    description: 'Créer un quiz interactif avec validation automatique et animations',
    parameters: z.object({
      channelId: z.string().describe('ID du canal'),
      question: z.string().describe('Question du quiz'),
      options: z.array(z.string()).min(2).max(4).describe('Options de réponse (2-4)'),
      correctIndex: z.number().min(0).max(3).describe('Index de la bonne réponse (0-3)'),
      points: z.number().optional().default(10).describe('Points à gagner'),
      badge: z.string().optional().describe('Badge à obtenir'),
      timeLimit: z.number().optional().describe('Limite de temps en secondes'),
      difficulty: z.enum(['easy', 'medium', 'hard', 'expert']).optional().default('medium').describe('Difficulté'),
      category: z.string().optional().describe('Catégorie du quiz'),
      theme: z.enum(['cyberpunk', 'minimal', 'gaming', 'corporate', 'sunset', 'ocean']).optional().default('gaming').describe('Thème'),
      animationStyle: z.enum(['confetti', 'fireworks', 'trophy', 'party', 'stars']).optional().default('confetti').describe('Animation de réussite'),
    }),
    execute: async (args) => {
      try {
        const client = await ensureDiscordConnection();
        const channel = await client.channels.fetch(args.channelId);

        if (!channel || !('send' in channel)) {
          throw new Error('Canal invalide');
        }

        const quizId = `quiz_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;

        // Difficulté avec emojis
        const difficultyEmojis: Record<string, string> = {
          easy: '🟢 Facile',
          medium: '🟡 Moyen',
          hard: '🔴 Difficile',
          expert: '💀 Expert',
        };

        // Créer l'embed du quiz
        const embed = new EmbedBuilder()
          .setTitle(`🎮 QUIZ ${args.category ? `| ${args.category}` : ''}`)
          .setDescription(`${VISUAL_SEPARATORS.sparkles}

❓ **${args.question}**

${args.options.map((opt, i) => {
  const letters = ['🅰️', '🅱️', '©️', '🇩'];
  return `${letters[i]} ${opt}`;
}).join('\n')}

${VISUAL_SEPARATORS.line}
📊 **Difficulté:** ${difficultyEmojis[args.difficulty || 'medium']}
💰 **Récompense:** ${args.points} points${args.badge ? ` + 🏅 ${args.badge}` : ''}
${args.timeLimit ? `⏱️ **Temps:** ${args.timeLimit}s` : ''}
${VISUAL_SEPARATORS.sparkles}`)
          .setColor(EMBED_THEMES[args.theme || 'gaming'].color as any)
          .setFooter({ text: '💡 Cliquez sur un bouton pour répondre !' })
          .setTimestamp();

        // Créer les boutons de réponse
        const row = new ActionRowBuilder<ButtonBuilder>();
        const buttonStyles = [ButtonStyle.Primary, ButtonStyle.Success, ButtonStyle.Secondary, ButtonStyle.Danger];

        args.options.forEach((opt, index) => {
          const letter = String.fromCharCode(65 + index);
          const button = new ButtonBuilder()
            .setCustomId(`${quizId}_answer_${index}`)
            .setLabel(letter)
            .setStyle(buttonStyles[index % buttonStyles.length]);
          row.addComponents(button);
        });

        // Stocker la bonne réponse pour validation ultérieure
        const quizData = {
          quizId,
          correctIndex: args.correctIndex,
          points: args.points,
          badge: args.badge,
          animationStyle: args.animationStyle,
          options: args.options,
        };

        const message = await channel.send({
          embeds: [embed],
          components: [row],
        });

        return `✅ Quiz créé | ID: ${quizId} | Message: ${message.id}\n📝 Bonne réponse: Option ${args.correctIndex + 1} (${args.options[args.correctIndex]})`;
      } catch (error: any) {
        return `❌ Erreur: ${error.message}`;
      }
    },
  });
}
