/**
 * Outils MCP pour la gestion des messages Discord
 */

import { z } from 'zod';
import type { FastMCP } from 'fastmcp';
import { DiscordBridge } from '../discord-bridge.js';
import { botConfig, ensureDiscordConnection, formatDuration } from './common.js';
import Logger from '../utils/logger.js';

// ============================================================================
// ENREGISTREMENT DES OUTILS
// ============================================================================

export function registerMessageTools(server: FastMCP) {
  // 1. Envoyer Message Simple
  server.addTool({
    name: 'envoyer_message',
    description: 'Envoie un message texte simple',
    parameters: z.object({
      channelId: z.string().describe('ID du canal Discord'),
      content: z.string().describe('Contenu du message'),
    }),
    execute: async args => {
      // 🐛 DEBUG MODE ACTIVE
      // Note: Le Wrapper withRateLimit a été retiré temporairement pour isoler les causes de crash.
      // Les logs ci-dessous sont immédiats et critiques pour tracer l'exécution avant tout crash potentiel.
      Logger.error(`🔥 [DEBUG] envoyer_message execute called for channel ${args.channelId}`);

      try {
        if (!botConfig.token || botConfig.token === 'YOUR_BOT_TOKEN') {
          return '❌ Token Discord non configuré';
        }

        const bridge = DiscordBridge.getInstance(botConfig.token);
        const client = await bridge.getClient();

        Logger.error('🔥 [DEBUG] Client retrieved');

        const channel = await client.channels.fetch(args.channelId);
        if (!channel || !('send' in channel)) {
          throw new Error('Canal invalide ou inaccessible');
        }

        Logger.error('🔥 [DEBUG] Channel fetched, sending...');

        const message = await channel.send(args.content);
        const result = `✅ Message envoyé | ID: ${message.id}`;
        Logger.info('✅ [envoyer_message]', result);
        return result;
      } catch (error: any) {
        Logger.error('❌ [envoyer_message]', error.message);
        return `❌ Erreur: ${error.message}`;
      }
    },
  });

  // 2. Lire Messages
  server.addTool({
    name: 'read_messages',
    description: "Lit l'historique des messages",
    parameters: z.object({
      channelId: z.string().describe('ID du canal'),
      limit: z.number().min(1).max(100).default(10).describe('Nombre de messages'),
      json: z.boolean().optional().default(false).describe('Retourner au format JSON'),
    }),
    execute: async args => {
      try {
        const client = await ensureDiscordConnection();
        const channel = await client.channels.fetch(args.channelId);

        if (!channel || !('messages' in channel)) {
          throw new Error('Canal invalide ou inaccessible');
        }

        const messages = await channel.messages.fetch({ limit: args.limit });

        if (args.json) {
          const data = messages.map(m => ({
            id: m.id,
            author: m.author.username,
            content: m.content,
            embeds: m.embeds.length,
          }));
          return JSON.stringify(data);
        }

        const list = messages
          .map(m => `• ${m.author.username} (ID: ${m.id}): ${m.content}`)
          .join('\n');
        return `📖 ${messages.size} messages:\n${list}`;
      } catch (error: any) {
        return `❌ Erreur: ${error.message}`;
      }
    },
  });

  // 3. Éditer Message
  server.addTool({
    name: 'edit_message',
    description: 'Modifie un message existant',
    parameters: z.object({
      channelId: z.string().describe('ID du canal'),
      messageId: z.string().describe('ID du message à modifier'),
      newContent: z.string().describe('Nouveau contenu du message'),
    }),
    execute: async args => {
      try {
        Logger.error(`✏️ [edit_message] Message: ${args.messageId}`);
        const client = await ensureDiscordConnection();
        const channel = await client.channels.fetch(args.channelId);

        if (!channel || !('messages' in channel)) {
          throw new Error('Canal invalide ou inaccessible');
        }

        const message = await channel.messages.fetch(args.messageId);
        await message.edit(args.newContent);

        return `✅ Message modifié | ID: ${args.messageId}`;
      } catch (error: any) {
        Logger.error(`❌ [edit_message]`, error.message);
        return `❌ Erreur: ${error.message}`;
      }
    },
  });

  // 4. Supprimer Message
  server.addTool({
    name: 'delete_message',
    description: 'Supprime un message',
    parameters: z.object({
      channelId: z.string().describe('ID du canal'),
      messageId: z.string().describe('ID du message à supprimer'),
      reason: z.string().optional().describe('Raison de la suppression'),
    }),
    execute: async args => {
      try {
        Logger.error(`🗑️ [delete_message] Message: ${args.messageId}`);
        const client = await ensureDiscordConnection();
        const channel = await client.channels.fetch(args.channelId);

        if (!channel || !('messages' in channel)) {
          throw new Error('Canal invalide ou inaccessible');
        }

        const message = await channel.messages.fetch(args.messageId);
        await message.delete();

        return `✅ Message supprimé | ID: ${args.messageId}${args.reason ? ` | Raison: ${args.reason}` : ''}`;
      } catch (error: any) {
        Logger.error(`❌ [delete_message]`, error.message);
        return `❌ Erreur: ${error.message}`;
      }
    },
  });

  // 5. Ajouter Réaction
  server.addTool({
    name: 'add_reaction',
    description: 'Ajoute une réaction emoji',
    parameters: z.object({
      channelId: z.string().describe('ID du canal'),
      messageId: z.string().describe('ID du message'),
      emoji: z.string().describe('Emoji'),
    }),
    execute: async args => {
      try {
        const client = await ensureDiscordConnection();
        const channel = await client.channels.fetch(args.channelId);

        if (!channel || !('messages' in channel)) {
          throw new Error('Canal invalide ou inaccessible');
        }

        const message = await channel.messages.fetch(args.messageId);
        await message.react(args.emoji);
        return `✅ Réaction ${args.emoji} ajoutée`;
      } catch (error: any) {
        return `❌ Erreur: ${error.message}`;
      }
    },
  });
}
