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
  // Outils de webhooks désactivés pour simplifier l'interface
}
