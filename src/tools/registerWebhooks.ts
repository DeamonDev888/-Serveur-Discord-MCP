/**
 * Outils de webhooks pour le serveur Discord MCP
 * Enregistre les outils de webhooks (3 outils)
 */

import { z } from 'zod';
import type { FastMCP } from 'fastmcp';
import Logger from '../utils/logger.js';
import { ensureDiscordConnection } from './common.js';

// ============================================================================
// SCHÉMAS ZOD
// ============================================================================

const CreateWebhookSchema = z.object({
  channelId: z.string().describe('ID du canal où créer le webhook'),
  name: z.string().describe('Nom du webhook'),
  avatarUrl: z.string().optional().describe("URL de l'avatar du webhook"),
});

const ListWebhooksSchema = z.object({
  channelId: z.string().describe('ID du canal'),
});

const SendWebhookSchema = z.object({
  webhookId: z.string().describe('ID du webhook'),
  webhookToken: z.string().describe('Token du webhook'),
  content: z.string().optional().describe('Contenu du message'),
  username: z.string().optional().describe("Nom d'utilisateur personnalisé"),
  avatarUrl: z.string().optional().describe("URL de l'avatar personnalisé"),
});

// ============================================================================
// ENREGISTREMENT DES OUTILS
// ============================================================================

export function registerWebhooksTools(server: FastMCP): void {
  server.addTool({
    name: 'create_webhook',
    description: 'Crée un webhook sur un canal',
    parameters: CreateWebhookSchema,
    execute: async args => {
      try {
        console.error(`🪝 [create_webhook] Canal: ${args.channelId}, Nom: ${args.name}`);
        const client = await ensureDiscordConnection();
        const channel = await client.channels.fetch(args.channelId);

        if (!channel || !('createWebhook' in channel)) {
          throw new Error('Canal invalide ou ne supporte pas les webhooks');
        }

        const webhook = await (channel as any).createWebhook({
          name: args.name,
          avatar: args.avatarUrl,
        });

        return `✅ Webhook créé: ${webhook.name} | ID: ${webhook.id} | URL: ${webhook.url}`;
      } catch (error: any) {
        console.error(`❌ [create_webhook]`, error.message);
        return `❌ Erreur: ${error.message}`;
      }
    },
  });

  server.addTool({
    name: 'list_webhooks',
    description: "Liste tous les webhooks d'un canal",
    parameters: ListWebhooksSchema,
    execute: async args => {
      try {
        console.error(`📋 [list_webhooks] Canal: ${args.channelId}`);
        const client = await ensureDiscordConnection();
        const channel = await client.channels.fetch(args.channelId);

        if (!channel || !('fetchWebhooks' in channel)) {
          throw new Error('Canal invalide');
        }

        const webhooks = await (channel as any).fetchWebhooks();

        if (webhooks.size === 0) {
          return `📋 Aucun webhook trouvé dans ce canal`;
        }

        const list = webhooks.map(w => `• ${w.name} | ID: ${w.id} | Token: ${w.token}`).join('\n');
        return `📋 ${webhooks.size} webhook(s):\n${list}`;
      } catch (error: any) {
        console.error(`❌ [list_webhooks]`, error.message);
        return `❌ Erreur: ${error.message}`;
      }
    },
  });

  server.addTool({
    name: 'send_webhook',
    description: 'Envoie un message via webhook',
    parameters: SendWebhookSchema,
    execute: async args => {
      try {
        console.error(`📤 [send_webhook] Webhook: ${args.webhookId}`);
        const client = await ensureDiscordConnection();

        const webhook = await client.fetchWebhook(args.webhookId, args.webhookToken);

        const message = await webhook.send({
          content: args.content,
          username: args.username,
          avatarURL: args.avatarUrl,
        });

        return `✅ Message envoyé via webhook | ID: ${message.id}`;
      } catch (error: any) {
        console.error(`❌ [send_webhook]`, error.message);
        return `❌ Erreur: ${error.message}`;
      }
    },
  });
}
