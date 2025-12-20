// Index des outils Discord
// Export tous les schémas, fonctions et types pour faciliter les imports

// ============================================================================
// OUTILS PRINCIPAUX
// ============================================================================

// Outils de sondages
export * from './polls';

// Outils d'upload de fichiers
export {
  FileUploadSchema,
  FILE_LIMITS,
  getFileType,
  getMimeTypeFromExtension,
  checkFileSize,
  createAttachmentFromFile,
  createFileUploadEmbed
} from './fileUpload';

// Outils d'embeds
export { createEmbedFromTemplate, EMBED_TEMPLATES } from './embedBuilder';
export { DISCORD_COLORS } from './embedBuilder';

// Outils d'interactions (boutons, menus, modals)
export { buildActionRows, BUTTON_STYLES } from './interactions';

// Outils de gestion de messages
export { sendMessage, editMessage, deleteMessage, readMessages, addReaction } from './messageManager';

// Outils de gestion de serveur
export * from './serverInfo';
export * from './channelManager';
export * from './memberManager';
export * from './userManager';

// Affichage de code avec coloration syntaxique
export { createCodePreviewMessages, CodePreviewSchema, validateLanguage } from './codePreview';
export { SUPPORTED_LANGUAGES } from './codePreview';

// ============================================================================
// DOCUMENTATION ET EXEMPLES
// ============================================================================

// Documentation centralisée avec limites, erreurs, utilitaires
export * from './documentation';

// Exemples pratiques pour utilisation one-shot
export * from './examples';

// ============================================================================
// TYPES ET CONSTANTES EXPORTÉES POUR CONVENIENCE
// ============================================================================

// Re-exporter les types les plus utilisés
export type {
  // Types des sondages
  PollResult,
  CreatePollParams,

  // Types des embeds
  CreateEmbedParams,
  EmbedTemplateName,
  EmbedValidationResult,

  // Types des interactions
  ButtonParams,
  StringSelectParams,
  ModalParams,
  InteractionParams,
  ComponentValidationResult,

  // Types des messages
  SendMessageParams,
  EditMessageParams,
  DeleteMessageParams,

  // Types des fichiers
  FileUploadParams,
  FileCheckResult,

  // Types du code
  CodePreviewParams,

  // Types du serveur
  ServerInfo,
  GuildMember,
  UserInfo,

  // Types utilitaires
  OperationResult,
  DiscordId,
  DiscordColor,
  ErrorCode,
  FormattedError
} from './types';

// ============================================================================
// NOTES D'UTILISATION
// ============================================================================

/**
 * 📚 UTILISATION RECOMMANDÉE :
 *
 * 1. Import sélectif (recommandé) :
 *    ```ts
 *    import { SendMessageSchema, createEmbedFromTemplate } from './tools';
 *    ```
 *
 * 2. Import complet :
 *    ```ts
 *    import * as DiscordTools from './tools';
 *    ```
 *
 * 3. Utilisation des exemples :
 *    ```ts
 *    import { exampleEmbedSimple, examplePollSimple } from './tools/examples';
 *    ```
 *
 * 4. Documentation :
 *    ```ts
 *    import { MCP_DOCUMENTATION, LIMITS, ERROR_CODES } from './tools/documentation';
 *    ```
 *
 * 🔧 SCHÉMAS ZOD :
 * Tous les paramètres sont validés automatiquement avec Zod.
 * En cas d'erreur, vous recevrez un message détaillé.
 *
 * 📖 DOCUMENTATION COMPLÈTE :
 * Voir documentation.ts pour les limites, erreurs, utilitaires.
 *
 * 💡 EXEMPLES PRATIQUES :
 * Voir examples.ts pour des exemples one-shot prêts à l'emploi.
 */