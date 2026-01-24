/**
 * 📝 TYPES ET INTERFACES - Outils MCP Discord
 * =============================================
 *
 * Ce fichier centralise tous les types TypeScript utilisés
 * dans les outils MCP Discord pour une meilleure IntelliSense.
 */

import { z } from 'zod';

// ============================================================================
// TYPES DE BASE
// ============================================================================

/**
 * ID Discord (snowflake)
 */
export type DiscordId = string;

/**
 * Couleur Discord (entier 32-bit)
 */
export type DiscordColor = number;

/**
 * Timestamp ISO
 */
export type ISOString = string;

/**
 * Résultat d'une opération
 */
export interface OperationResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  errorCode?: string;
}

// ============================================================================
// TYPES DES MESSAGES
// ============================================================================

/**
 * Schéma pour envoi de message
 */
// export type SendMessageParams = z.infer<typeof import('./messageManager').SendSchema>;

/**
 * Schéma pour modification de message
 */
// export type EditMessageParams = z.infer<typeof import('./messageManager').EditMessageSchema>;

/**
 * Schéma pour suppression de message
 */
// export type DeleteMessageParams = z.infer<typeof import('./messageManager').DeleteMessageSchema>;

/**
 * Schéma pour lecture de messages
 */
// export type ReadMessagesParams = z.infer<typeof import('./messageManager').ReadMessagesSchema>;

/**
 * Schéma pour ajout de réaction
 */
// export type AddReactionParams = z.infer<typeof import('./messageManager').AddReactionSchema>;

// ============================================================================
// TYPES DES EMbeds
// ============================================================================

/**
 * Schéma pour création d'embed
 */
// export type CreateEmbedParams = z.infer<typeof import('./embedBuilder').CreateEmbedSchema>;

/**
 * Template d'embed prédéfini
 */
// export type EmbedTemplateName = keyof typeof import('./embedBuilder').EMBED_TEMPLATES;

/**
 * Template d'embed avec customisations
 */
// export type EmbedTemplate = {
//   name: string;
//   template: Omit<CreateEmbedParams, 'channelId'>;
// };

/**
 * Résultat de validation d'embed
 */
export interface EmbedValidationResult {
  valid: boolean;
  errors: string[];
}

// ============================================================================
// TYPES DES SONDAGES
// ============================================================================

/**
 * Résultat d'un sondage
 */
export interface PollResult {
  id: string;
  messageId: string;
  channelId: string;
  question: string;
  options: Array<{
    text: string;
    votes: number;
    percentage: number;
  }>;
  totalVotes: number;
  ended: boolean;
  endTime: Date;
  allowMultiple?: boolean;
  anonymous?: boolean;
}

/**
 * Schéma pour création de sondage
 */
// export type CreatePollParams = z.infer<typeof import('./polls').CreatePollSchema>;

/**
 * Configuration des boutons de sondage
 */
export interface PollButtonConfig {
  customId: string;
  label: string;
  emoji?: string;
  style: import('discord.js').ButtonStyle;
}

// ============================================================================
// TYPES DES INTERACTIONS
// ============================================================================

/**
 * Types de composants supportés
 */
export type ComponentType =
  (typeof import('./interactions.js').COMPONENT_TYPES)[keyof typeof import('./interactions.js').COMPONENT_TYPES];

/**
 * Styles de boutons
 */
export type ButtonStyle =
  (typeof import('./interactions.js').BUTTON_STYLES)[keyof typeof import('./interactions.js').BUTTON_STYLES];

/**
 * Schéma pour bouton
 */
export type ButtonParams = z.infer<typeof import('./interactions.js').ButtonSchema>;

/**
 * Schéma pour menu de sélection
 */
export type StringSelectParams = z.infer<typeof import('./interactions.js').StringSelectSchema>;

/**
 * Schéma pour sélecteur d'utilisateurs
 */
export type UserSelectParams = z.infer<typeof import('./interactions.js').UserSelectSchema>;

/**
 * Schéma pour sélecteur de rôles
 */
export type RoleSelectParams = z.infer<typeof import('./interactions.js').RoleSelectSchema>;

/**
 * Schéma pour sélecteur de canaux
 */
export type ChannelSelectParams = z.infer<typeof import('./interactions.js').ChannelSelectSchema>;

/**
 * Schéma pour sélecteur mentionnable
 */
export type MentionableSelectParams = z.infer<
  typeof import('./interactions.js').MentionableSelectSchema
>;

/**
 * Schéma pour modal
 */
export type ModalParams = z.infer<typeof import('./interactions.js').ModalSchema>;

/**
 * Schéma principal pour interactions
 */
export type InteractionParams = z.infer<typeof import('./interactions.js').InteractionSchema>;

/**
 * Résultat de validation de composants
 */
export interface ComponentValidationResult {
  valid: boolean;
  errors: string[];
}

// ============================================================================
// TYPES DES FICHIERS
// ============================================================================

/**
 * Schéma pour upload de fichier
 */
export type FileUploadParams = z.infer<typeof import('./fileUpload.js').FileUploadSchema>;

/**
 * Types de fichiers supportés
 */
export type FileType = 'image' | 'video' | 'audio' | 'document' | 'default';

/**
 * Résultat de vérification de fichier
 */
export interface FileCheckResult {
  valid: boolean;
  size: number;
  error?: string;
}

/**
 * Résultat de création d'attachment
 */
export interface AttachmentResult {
  success: boolean;
  attachment?: import('discord.js').AttachmentBuilder;
  error?: string;
  size?: number;
}

// ============================================================================
// TYPES DU SERVEUR
// ============================================================================

/**
 * Informations du serveur
 */
export interface ServerInfo {
  id: string;
  name: string;
  icon?: string;
  ownerId: string;
  createdAt: Date;
  memberCount: number;
  boostCount: number;
  verificationLevel: number;
  locale: string;
  features: string[];
  channels: {
    total: number;
    text: number;
    voice: number;
    category: number;
  };
}

/**
 * Membre du serveur
 */
export interface GuildMember {
  id: string;
  username: string;
  discriminator: string;
  avatar?: string;
  joinedAt: Date;
  roles: string[];
  status?: string;
  activity?: {
    name: string;
    type: string;
  };
}

/**
 * Informations utilisateur
 */
export interface UserInfo {
  id: string;
  username: string;
  discriminator: string;
  avatar?: string;
  bot: boolean;
  createdAt: Date;
  memberOf?: {
    guildId: string;
    nickname?: string;
    roles: string[];
    joinedAt: Date;
  };
  activity?: {
    name: string;
    type: string;
    details?: string;
  };
  permissions?: string[];
}

// ============================================================================
// TYPES DU CODE PREVIEW
// ============================================================================

/**
 * Schéma pour affichage de code
 */
export type CodePreviewParams = z.infer<typeof import('./codePreview.js').CodePreviewSchema>;

/**
 * Langage de programmation supporté
 */
export type SupportedLanguage = keyof typeof import('./codePreview.js').SUPPORTED_LANGUAGES;

/**
 * Résultat de création de messages de code
 */
export interface CodePreviewMessages {
  messages: string[];
  totalLength: number;
  lineCount: number;
  parts: number;
}

// ============================================================================
// TYPES DE CONFIGURATION
// ============================================================================

/**
 * Configuration globale des outils
 */
export interface ToolConfig {
  maxRetries: number;
  retryDelay: number;
  rateLimit: {
    requests: number;
    window: number; // en ms
  };
  validation: {
    strict: boolean;
    autoFix: boolean;
  };
  logging: {
    level: 'error' | 'warn' | 'info' | 'debug';
    enabled: boolean;
  };
}

// ============================================================================
// TYPES D'ERREUR
// ============================================================================

/**
 * Code d'erreur
 */
// export type ErrorCode =
//   (typeof import('./documentation').ERROR_CODES)[keyof typeof import('./documentation').ERROR_CODES];

/**
 * Erreur formatée
 */
export interface FormattedError {
  // code: ErrorCode;
  message: string;
  details?: Record<string, any>;
  timestamp: Date;
  stack?: string;
}

/**
 * Résultat d'opération avec erreur
 */
export interface OperationError<T = any> extends OperationResult<T> {
  // code: ErrorCode;
  details?: Record<string, any>;
}

// ============================================================================
// TYPES DE COMPOSANTS DISCORD.JS
// ============================================================================

/**
 * Types de composants Discord.js
 * Note: Certains types peuvent ne pas être disponibles selon la version de discord.js
 */
export type DiscordComponentType =
  | import('discord.js').ComponentType.Button
  | import('discord.js').ComponentType.StringSelect
  // | import('discord.js').ComponentType.UserSelect
  // | import('discord.js').ComponentType.RoleSelect
  // | import('discord.js').ComponentType.ChannelSelect
  // | import('discord.js').ComponentType.MentionableSelect
  | import('discord.js').ComponentType.TextInput;

/**
 * Styles de boutons Discord.js
 */
export type DiscordButtonStyle = import('discord.js').ButtonStyle;

/**
 * Builder de composant Discord
 */
export type ComponentBuilder =
  | import('discord.js').ButtonBuilder
  | import('discord.js').StringSelectMenuBuilder
  // | import('discord.js').UserSelectMenuBuilder
  // | import('discord.js').RoleSelectMenuBuilder
  // | import('discord.js').ChannelSelectMenuBuilder
  // | import('discord.js').MentionableSelectMenuBuilder
  | import('discord.js').TextInputBuilder;

// ============================================================================
// TYPES DE RÉPONSES API
// ============================================================================

/**
 * Réponse de l'API Discord
 */
export interface DiscordApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: number;
    message: string;
    errors?: any;
  };
  rateLimit?: {
    remaining: number;
    reset: number;
    limit: number;
  };
}

// ============================================================================
// TYPES DE WEBHOOKS
// ============================================================================

/**
 * Configuration de webhook
 */
export interface WebhookConfig {
  url: string;
  username?: string;
  avatarUrl?: string;
  content?: string;
  embeds?: any[];
  files?: any[];
  allowedMentions?: {
    parse: string[];
    users?: string[];
    roles?: string[];
  };
}

// ============================================================================
// TYPES UTILITAIRES
// ============================================================================

/**
 * Options de pagination
 */
export interface PaginationOptions {
  page: number;
  limit: number;
  maxPages?: number;
}

/**
 * Filtres de recherche
 */
export interface SearchFilters {
  query?: string;
  type?: string;
  status?: string;
  dateFrom?: Date;
  dateTo?: Date;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/**
 * Métriques d'utilisation
 */
export interface UsageMetrics {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  toolUsage: Record<string, number>;
  // errorCounts: Record<ErrorCode, number>;
}

// ============================================================================
// EXPORT COMPLET DES SCHÉMAS ZOD
// ============================================================================

// Note: Les schémas sont exportés directement depuis leurs modules respectifs
// pour éviter les problèmes d'imports dynamiques avec TypeScript

// ============================================================================
// ALIASES POUR COMPATIBILITÉ
// ============================================================================

// Aliases pour les types courants
// export type Embed = CreateEmbedParams;
// export type Poll = CreatePollParams;
// export type Message = SendMessageParams;
// export type File = FileUploadParams;
// export type Code = CodePreviewParams;
// export type Component = InteractionParams;

// ============================================================================
// NOTES D'UTILISATION
// ============================================================================

/**
 * 💡 UTILISATION DES TYPES :
 *
 * 1. Import direct :
 *    ```ts
 *    import type { CreateEmbedParams, PollResult } from './tools/types';
 *    ```
 *
 * 2. Utilisation avec Zod :
 *    ```ts
 *    const data = CreateEmbedSchema.parse(params);
 *    ```
 *
 * 3. Type guard :
 *    ```ts
 *    function isValidEmbed(data: any): data is CreateEmbedParams {
 *      return CreateEmbedSchema.safeParse(data).success;
 *    }
 *    ```
 *
 * 4. IntelliSense :
 *    Les types TypeScript offrent une autocomplétion complète
 *    dans les IDE compatibles (VS Code, WebStorm, etc.).
 */
