/**
 * Outils MCP pour la gestion des messages Discord
 */

import { z } from 'zod';
import type { FastMCP } from 'fastmcp';
import { DiscordBridge } from '../discord-bridge.js';
import { botConfig, withRateLimit, ensureDiscordConnection, formatDuration } from './common.js';
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
    execute: withRateLimit('envoyer_message', async (args) => {
      try {
        if (!botConfig.token || botConfig.token === 'YOUR_BOT_TOKEN') {
          return '❌ Token Discord non configuré';
        }

        console.error(`🔍 [envoyer_message] Bridge - envoi vers ${args.channelId}...`);
        const bridge = DiscordBridge.getInstance(botConfig.token);
        const client = await bridge.getClient();

        const channel = await client.channels.fetch(args.channelId);
        if (!channel || !('send' in channel)) {
          throw new Error('Canal invalide ou inaccessible');
        }

        const message = await channel.send(args.content);
        const result = `✅ Message envoyé | ID: ${message.id}`;
        Logger.info('✅ [envoyer_message]', result);
        return result;
      } catch (error: any) {
        Logger.error('❌ [envoyer_message]', error.message);
        return `❌ Erreur: ${error.message}`;
      }
    }),
  });

  // 2. Lire Messages
  server.addTool({
    name: 'read_messages',
    description: "Lit l'historique des messages",
    parameters: z.object({
      channelId: z.string().describe('ID du canal'),
      limit: z.number().min(1).max(100).default(10).describe('Nombre de messages'),
    }),
    execute: async (args) => {
      try {
        const client = await ensureDiscordConnection();
        const channel = await client.channels.fetch(args.channelId);

        if (!channel || !('messages' in channel)) {
          throw new Error('Canal invalide ou inaccessible');
        }

        const messages = await channel.messages.fetch({ limit: args.limit });
        const list = messages.map(m => `• ${m.author.username}: ${m.content}`).join('\n');
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
    execute: async (args) => {
      try {
        console.error(`✏️ [edit_message] Message: ${args.messageId}`);
        const client = await ensureDiscordConnection();
        const channel = await client.channels.fetch(args.channelId);

        if (!channel || !('messages' in channel)) {
          throw new Error('Canal invalide ou inaccessible');
        }

        const message = await channel.messages.fetch(args.messageId);
        await message.edit(args.newContent);

        return `✅ Message modifié | ID: ${args.messageId}`;
      } catch (error: any) {
        console.error(`❌ [edit_message]`, error.message);
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
    execute: async (args) => {
      try {
        console.error(`🗑️ [delete_message] Message: ${args.messageId}`);
        const client = await ensureDiscordConnection();
        const channel = await client.channels.fetch(args.channelId);

        if (!channel || !('messages' in channel)) {
          throw new Error('Canal invalide ou inaccessible');
        }

        const message = await channel.messages.fetch(args.messageId);
        await message.delete();

        return `✅ Message supprimé | ID: ${args.messageId}${args.reason ? ` | Raison: ${args.reason}` : ''}`;
      } catch (error: any) {
        console.error(`❌ [delete_message]`, error.message);
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
    execute: async (args) => {
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
