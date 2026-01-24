/**
 * Outils système pour le serveur Discord MCP
 * Enregistre les outils système (3 outils)
 */

import { z } from 'zod';
import type { FastMCP } from 'fastmcp';
import * as fs from 'fs';
import * as path from 'path';
import Logger from '../utils/logger.js';
import { ensureDiscordConnection, botConfig } from './common.js';

// ============================================================================
// RATE LIMITING
// ============================================================================

const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 60000;
const RATE_LIMIT_MAX = 30;

function checkRateLimit(toolName: string): boolean {
  const now = Date.now();
  const toolLimit = rateLimitMap.get(toolName);

  if (!toolLimit || now > toolLimit.resetTime) {
    rateLimitMap.set(toolName, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return true;
  }

  if (toolLimit.count >= RATE_LIMIT_MAX) {
    return false;
  }

  toolLimit.count++;
  return true;
}

function withRateLimit<T extends any[], R>(toolName: string, fn: (...args: T) => Promise<R>) {
  return async (...args: T): Promise<R> => {
    if (!checkRateLimit(toolName)) {
      throw new Error(`Rate limit atteint pour ${toolName}. Réessayez dans 1 minute.`);
    }
    return fn(...args);
  };
}

// ============================================================================
// SCHÉMAS ZOD
// ============================================================================

const StatutBotSchema = z.object({});



const LogsExplorerSchema = z.object({
  lines: z.number().min(1).max(100).default(20).describe('Nombre de lignes à afficher'),
  level: z.enum(['INFO', 'WARN', 'ERROR', 'DEBUG']).optional().describe('Filtrer par niveau'),
});

// ============================================================================
// ENREGISTREMENT DES OUTILS
// ============================================================================

export function registerSystemTools(server: FastMCP): void {
  server.addTool({
    name: 'statut_bot',
    description: 'Statut actuel du bot',
    parameters: StatutBotSchema,
    execute: withRateLimit('statut_bot', async () => {
      try {
        const client = await ensureDiscordConnection();
        return `🤖 Status: Connecté\nUser: ${client.user!.tag}\nGuilds: ${client.guilds.cache.size}\nUptime: ${client.uptime}ms\nNode: ${process.version}`;
      } catch (error: any) {
        return `❌ Déconnecté | Erreur: ${error.message}`;
      }
    }),
  });



  server.addTool({
    name: 'logs_explorer',
    description: 'Explore les derniers logs du serveur',
    parameters: LogsExplorerSchema,
    execute: async (args) => {
      try {
        const logDir = path.join(process.cwd(), 'logs');
        const logFiles = await fs.promises.readdir(logDir);
        const latestLog = logFiles.filter(f => f.endsWith('.log')).sort().reverse()[0];

        if (!latestLog) return "❌ Aucun fichier de log trouvé.";

        const content = await fs.promises.readFile(path.join(logDir, latestLog), 'utf-8');
        let linesArray = content.split('\n').filter(l => l.trim() !== '');

        if (args.level) {
          linesArray = linesArray.filter(l => l.includes(`[${args.level}]`));
        }

        const result = linesArray.slice(-args.lines).join('\n');
        return `📋 **Derniers logs (${latestLog}):**\n\`\`\`\n${result || 'Aucune ligne correspondante.'}\n\`\`\``;
      } catch (err: any) {
        return `❌ Erreur lecture logs: ${err.message}`;
      }
    },
  });
}
