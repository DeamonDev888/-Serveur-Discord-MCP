/**
 * 🔗 WEBHOOKS
 * ===========
 * Gestion des webhooks Discord.
 */

import { z } from 'zod';
import { WebhookClient, WebhookType } from 'discord.js';
import type { Client } from 'discord.js';

// ============================================================================
// SCHÉMAS ZOD
// ============================================================================

export const CreateWebhookSchema = z.object({
  channelId: z.string().describe('ID du canal'),
  name: z.string().min(1).max(80).describe('Nom du webhook'),
  avatar: z.string().optional().describe('URL de l\'avatar (optionnel)'),
});

export type CreateWebhookParams = z.infer<typeof CreateWebhookSchema>;

export const ListWebhooksSchema = z.object({
  channelId: z.string().describe('ID du canal'),
});

export type ListWebhooksParams = z.infer<typeof ListWebhooksSchema>;

export const SendWebhookSchema = z.object({
  webhookUrl: z.string().describe('URL du webhook'),
  content: z.string().describe('Contenu du message'),
  username: z.string().optional().describe('Nom d\'utilisateur personnalisé'),
  avatarUrl: z.string().optional().describe('URL de l\'avatar'),
});

export type SendWebhookParams = z.infer<typeof SendWebhookSchema>;

// ============================================================================
// FONCTIONS D'EXÉCUTION
// ============================================================================

export async function createWebhook(client: Client, args: CreateWebhookParams): Promise<string> {
  const channel = await client.channels.fetch(args.channelId);

  if (!channel || !('createWebhook' in channel)) {
    throw new Error('Canal invalide ou inaccessible');
  }

  const webhook = await channel.createWebhook({
    name: args.name,
    avatar: args.avatar,
  });

  return `✅ Webhook créé | ID: ${webhook.id} | URL: ${webhook.url}`;
}

export async function listWebhooks(client: Client, args: ListWebhooksParams): Promise<string> {
  const channel = await client.channels.fetch(args.channelId);

  if (!channel || !('fetchWebhooks' in channel)) {
    throw new Error('Canal invalide ou inaccessible');
  }

  const webhooks = await channel.fetchWebhooks();

  if (webhooks.size === 0) {
    return 'ℹ️ Aucun webhook trouvé sur ce canal';
  }

  const list = webhooks.map(w => `• **${w.name}** (ID: ${w.id})\n  URL: ${w.url}`).join('\n\n');

  return `🔗 **${webhooks.size} webhook(s):**\n\n${list}`;
}

export async function sendWebhook(_client: Client, args: SendWebhookParams): Promise<string> {
  const webhook = new WebhookClient({ url: args.webhookUrl });

  await webhook.send({
    content: args.content,
    username: args.username,
    avatarURL: args.avatarUrl,
  });

  await webhook.destroy();

  return `✅ Message envoyé via webhook`;
}

// ============================================================================
// CONFIGURATION OUTIL MCP
// ============================================================================

export const createWebhookToolConfig = {
  name: 'create_webhook',
  description: 'Crée un webhook sur un canal',
  parameters: CreateWebhookSchema,
};

export const listWebhooksToolConfig = {
  name: 'list_webhooks',
  description: "Liste tous les webhooks d'un canal",
  parameters: ListWebhooksSchema,
};

export const sendWebhookToolConfig = {
  name: 'send_webhook',
  description: 'Envoie un message via webhook',
  parameters: SendWebhookSchema,
};
