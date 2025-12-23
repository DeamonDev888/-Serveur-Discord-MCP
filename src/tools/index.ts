// ============================================================================
// 🔧 TOOLS MCP DISCORD - Index Principal
// ============================================================================
// Export tous les schémas, fonctions et types pour faciliter les imports
//
// NOUVELLE STRUCTURE ORGANISÉE PAR CATÉGORIES:
// - messages/  : Gestion des messages Discord
// - embeds/    : Messages avancés et embeds
// - polls/     : Sondages et votes
// - interactions/ : Boutons, menus, quiz
// - persistent/   : Fonctions persistantes (boutons, menus avancés)
// - members/     : Gestion des membres et serveurs
// - moderation/  : Outils de modération
// - roles/       : Gestion des rôles
// - channels/    : Gestion des canaux
// - files/       : Fichiers et webhooks
// - system/      : Outils système
// - utils/       : Utilitaires partagés
// ============================================================================

// ============================================================================
// OUTILS PRINCIPAUX (NOUVEAU STRUCTURE)
// ============================================================================

// 📊 Messages
export * from './messages/index.js';

// 🎨 Embeds
export * from './embeds/index.js';

// 📝 Polls
export * from './polls/index.js';

// 👥 Members
export * from './members/index.js';

// 📁 Files
export * from './files/index.js';

// ============================================================================
// OUTILS EXISTANTS (COMPATIBILITÉ)
// ============================================================================

// Outils d'upload de fichiers (existant)
export {
  FILE_LIMITS,
  getFileType,
  getMimeTypeFromExtension,
  checkFileSize,
  createAttachmentFromFile,
  createFileUploadEmbed,
} from './fileUpload';

// Outils d'embeds (existant)
export { createEmbedFromTemplate } from './embedBuilder';
export { DISCORD_COLORS } from './embedBuilder';

// Outils d'interactions (boutons, menus, modals) (existant)
export { buildActionRows, BUTTON_STYLES } from './interactions';

// Outils de gestion de messages (existant - à migrer)
export {
  sendMessage as sendMessageLegacy,
  editMessage as editMessageLegacy,
  deleteMessage as deleteMessageLegacy,
  readMessages as readMessagesLegacy,
  addReaction as addReactionLegacy,
} from './messageManager';

// Outils de gestion de serveur (channelManager n'est pas dans members/)
export * from './channelManager';

// Affichage de code avec coloration syntaxique
export { createCodePreviewMessages, CodePreviewSchema, validateLanguage } from './codePreview';
export { SUPPORTED_LANGUAGES } from './codePreview';

// ============================================================================
// DOCUMENTATION ET EXEMPLES
// ============================================================================

// Documentation centralisée avec limites, erreurs, utilitaires
export { MCP_DOCUMENTATION, ERROR_CODES, ERROR_MESSAGES, LIMITS, QUICK_START_GUIDE } from './documentation';
export { formatFileSize, isValidDiscordId, parseColor, validateEmbedLimits, generatePollId, truncate } from './documentation';

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
  FormattedError,
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
