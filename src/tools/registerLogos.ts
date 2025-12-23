/**
 * Outils de logos pour le serveur Discord MCP
 * Enregistre les outils de logos (1 outil)
 */

import { z } from 'zod';
import type { FastMCP } from 'fastmcp';
import { getUniversalLogo } from '../utils/logoUtils.js';

// ============================================================================
// SCHÉMAS ZOD
// ============================================================================

const GetThumbnailSchema = z.object({
  symbol: z.string().describe('Symbole ou nom (BTC, ETH, AAPL, Apple, DISCORD, etc.)'),
});

// ============================================================================
// ENREGISTREMENT DES OUTILS
// ============================================================================

export function registerLogosTools(server: FastMCP): void {
  server.addTool({
    name: 'get_thumbnail',
    description: '🖼️ Récupérer l\'URL de la MINIATURE (thumbnail) pour un embed Discord. Utilise quand tu mentionnes une entreprise/cryptomonnaie pour afficher son logo en haut à droite de l\'embed. Retourne uniquement l\'URL de l\'image.',
    parameters: GetThumbnailSchema,
    execute: async (args) => {
      try {
        const result = getUniversalLogo(args.symbol);

        if (result) {
          return result.logo;
        }

        return '';
      } catch (error: any) {
        return '';
      }
    },
  });
}
