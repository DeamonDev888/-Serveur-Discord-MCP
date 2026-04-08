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
  // Outils système désactivés pour simplifier l'interface
}
