/**
 * 🎨 EMBEDS - Index
 * ================
 * Export tous les outils d'embeds Discord.
 */

export {
  listTemplates,
  listTemplatesToolConfig,
  ListTemplatesSchema,
  EMBED_TEMPLATES,
} from './templates.js';

// Les outils embeds complexes restent dans index.ts principal
// creer_embed, creer_embed_v2, analytics, themes, logos
// Ils seront migrés ici progressivement

export const embedTools = [
  'creer_embed',
  'creer_embed_v2',
  'lister_templates',
  'get_embed_analytics',
  'list_auto_update_embeds',
  'list_embed_themes',
  'list_crypto_logos',
  'list_company_logos',
  'list_misc_logos',
  'get_logo',
  'get_crypto_logo',
];
