/**
 * 🎨 EMBED TEMPLATES
 * ==================
 * Templates d'embeds prédéfinis pour Discord.
 */

import { z } from 'zod';

// ============================================================================
// CONSTANTES DE TEMPLATES
// ============================================================================

export const EMBED_TEMPLATES: Record<string, { title: string; color: number; description: string }> = {
  success: {
    title: '✅ Succès',
    color: 0x00ff00,
    description: 'Opération réussie',
  },
  error: {
    title: '❌ Erreur',
    color: 0xff0000,
    description: 'Une erreur est survenue',
  },
  warning: {
    title: '⚠️ Attention',
    color: 0xffaa00,
    description: 'Veuillez vérifier les informations',
  },
  info: {
    title: 'ℹ️ Information',
    color: 0x00aaff,
    description: 'Information importante',
  },
  announcement: {
    title: '📢 Annonce',
    color: 0xffd700,
    description: 'Annonce officielle',
  },
};

// ============================================================================
// SCHÉMA ZOD
// ============================================================================

export const ListTemplatesSchema = z.object({});

export type ListTemplatesParams = z.infer<typeof ListTemplatesSchema>;

// ============================================================================
// FONCTION D'EXÉCUTION
// ============================================================================

export async function listTemplates(): Promise<string> {
  const templates = Object.keys(EMBED_TEMPLATES);
  return `📋 Templates disponibles: ${templates.join(', ')}`;
}

// ============================================================================
// CONFIGURATION OUTIL MCP
// ============================================================================

export const listTemplatesToolConfig = {
  name: 'lister_templates',
  description: 'Liste tous les templates d embeds disponibles',
  parameters: ListTemplatesSchema,
};
