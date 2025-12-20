/**
 * 📖 DOCUMENTATION CENTRALISÉE - Outils MCP Discord
 * ====================================================
 *
 * Cette documentation centralise toutes les informations importantes
 * sur les outils MCP Discord : schémas, limites, exemples, etc.
 */

// ============================================================================
// TYPES ET INTERFACES
// ============================================================================

/**
 * Configuration des langues supportées pour code_preview
 */
export const SUPPORTED_LANGUAGES = {
  javascript: 'js',
  js: 'js',
  typescript: 'ts',
  ts: 'ts',
  python: 'py',
  py: 'py',
  diff: 'diff',
  markdown: 'md',
  md: 'md',
  json: 'json',
  yaml: 'yaml',
  bash: 'bash',
  shell: 'bash',
  sh: 'bash',
  css: 'css',
  html: 'html',
  xml: 'xml',
  sql: 'sql',
  java: 'java',
  c: 'c',
  cpp: 'cpp',
  csharp: 'cs',
  cs: 'cs',
  php: 'php',
  ruby: 'rb',
  go: 'go',
  rust: 'rs',
  kotlin: 'kt',
  swift: 'swift',
  r: 'r',
  scala: 'scala',
  perl: 'pl',
  lua: 'lua',
  vim: 'vim',
  dockerfile: 'dockerfile',
  makefile: 'makefile',
  ini: 'ini',
  toml: 'toml',
  properties: 'properties'
} as const;

/**
 * Couleurs Discord prédéfinies
 */
export const DISCORD_COLORS = {
  DEFAULT: 0x000000,
  WHITE: 0xFFFFFF,
  AQUA: 0x1ABC9C,
  GREEN: 0x2ECC71,
  BLUE: 0x3498DB,
  YELLOW: 0xF1C40F,
  PURPLE: 0x9B59B6,
  LUMINOUS_VIVID_PINK: 0xE91E63,
  FUCHSIA: 0xEB459E,
  GOLD: 0xF39C12,
  ORANGE: 0xE67E22,
  RED: 0xE74C3C,
  GREY: 0x95A5A6,
  NAVY: 0x34495E,
  DARK_AQUA: 0x11806A,
  DARK_GREEN: 0x1F8B4C,
  DARK_BLUE: 0x206694,
  DARK_PURPLE: 0x71368A,
  DARK_VIVID_PINK: 0xAD1457,
  DARK_GOLD: 0xC27C0E,
  DARK_ORANGE: 0xA84300,
  DARK_RED: 0x992D22,
  DARK_GREY: 0x607D8B,
  DARKER_GREY: 0x36393F,
  LIGHT_GREY: 0xBCC0C0,
  DARK_NAVY: 0x2C3E50,
  BLURPLE: 0x5865F2,
  GREYPLE: 0x99AAB5,
  DARK_BUT_NOT_BLACK: 0x2C2F33,
  NOT_QUITE_BLACK: 0x23272A
} as const;

/**
 * Styles de boutons Discord
 */
export const BUTTON_STYLES = {
  PRIMARY: 1,    // Bleu
  SECONDARY: 2,  // Gris
  SUCCESS: 3,    // Vert
  DANGER: 4,     // Rouge
  LINK: 5        // Lien (gris, icône de lien)
} as const;

/**
 * Limites des types de fichiers pour upload
 */
export const FILE_LIMITS = {
  image: 25 * 1024 * 1024,    // 25MB
  video: 100 * 1024 * 1024,   // 100MB (serveurs boostés)
  audio: 100 * 1024 * 1024,   // 100MB (serveurs boostés)
  document: 25 * 1024 * 1024, // 25MB
  default: 8 * 1024 * 1024    // 8MB (limite standard)
} as const;

// ============================================================================
// LIMITES ET CONTRAINTES
// ============================================================================

export const LIMITS = {
  // Messages Discord
  MESSAGE_MAX_LENGTH: 2000,
  MESSAGE_MAX_EMBEDS: 10,
  MESSAGE_MAX_COMPONENTS: 5,

  // Embeds Discord
  EMBED_MAX_TITLE: 256,
  EMBED_MAX_DESCRIPTION: 4096,
  EMBED_MAX_FIELDS: 25,
  EMBED_FIELD_NAME_MAX: 256,
  EMBED_FIELD_VALUE_MAX: 1024,
  EMBED_FOOTER_TEXT_MAX: 2048,
  EMBED_AUTHOR_NAME_MAX: 256,
  EMBED_TOTAL_MAX_LENGTH: 6000,

  // Boutons et composants
  BUTTON_MAX_PER_ROW: 5,
  BUTTON_LABEL_MAX: 80,
  BUTTON_CUSTOM_ID_MAX: 100,
  SELECT_MENU_PLACEHOLDER_MAX: 150,
  SELECT_MENU_OPTIONS_MAX: 25,
  SELECT_MENU_OPTION_LABEL_MAX: 100,
  SELECT_MENU_OPTION_VALUE_MAX: 100,
  SELECT_MENU_OPTION_DESCRIPTION_MAX: 100,

  // Sondages
  POLL_OPTIONS_MIN: 2,
  POLL_OPTIONS_MAX: 10,
  POLL_DURATION_MIN: 5,
  POLL_DURATION_MAX: 604800, // 7 jours
  POLL_QUESTION_MAX: 512,

  // Upload de fichiers
  FILE_SIZE_DEFAULT: 8 * 1024 * 1024,  // 8MB
  FILE_SIZE_IMAGE: 25 * 1024 * 1024,   // 25MB
  FILE_SIZE_VIDEO: 100 * 1024 * 1024,  // 100MB

  // Autres
  CHANNEL_NAME_MAX: 100,
  USER_DISCRIMINATOR_MAX: 4,
  ROLE_NAME_MAX: 100
} as const;

// ============================================================================
// TEMPLATES D'EMBEDS PRÉDÉFINIS
// ============================================================================

export const EMBED_TEMPLATES = {
  announcement: {
    title: '📢 Annonce',
    color: DISCORD_COLORS.AQUA,
    timestamp: true,
    footer: { text: 'Annonce officielle' }
  },
  warning: {
    title: '⚠️ Attention',
    color: DISCORD_COLORS.ORANGE,
    timestamp: true,
    footer: { text: 'Veuillez noter' }
  },
  error: {
    title: '❌ Erreur',
    color: DISCORD_COLORS.RED,
    timestamp: true
  },
  success: {
    title: '✅ Succès',
    color: DISCORD_COLORS.GREEN,
    timestamp: true
  },
  info: {
    title: 'ℹ️ Information',
    color: DISCORD_COLORS.BLUE,
    timestamp: true
  },
  rules: {
    title: '📋 Règles du Serveur',
    color: DISCORD_COLORS.BLURPLE,
    fields: [
      { name: 'Règle 1', value: 'Soyez respectueux', inline: false },
      { name: 'Règle 2', value: 'Pas de spam', inline: false },
      { name: 'Règle 3', value: 'Respectez les directives', inline: false }
    ],
    timestamp: true
  },
  welcome: {
    title: '👋 Bienvenue !',
    description: 'Nous sommes ravis de vous accueillir !',
    color: DISCORD_COLORS.GREEN,
    fields: [
      { name: 'Premiers pas', value: '📖 Lisez les règles', inline: false }
    ],
    timestamp: true
  },
  giveaway: {
    title: '🎁 Giveaway !',
    description: 'Participez à notre giveaway exclusif !',
    color: DISCORD_COLORS.GOLD,
    fields: [
      { name: 'Prix', value: '🏆 Prix à définir', inline: true },
      { name: 'Durée', value: '⏰ 24 heures', inline: true }
    ],
    timestamp: true
  }
} as const;

// ============================================================================
// CODES D'ERREUR PERSONNALISÉS
// ============================================================================

export const ERROR_CODES = {
  // Erreurs de validation
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVALID_CHANNEL_ID: 'INVALID_CHANNEL_ID',
  INVALID_MESSAGE_ID: 'INVALID_MESSAGE_ID',
  INVALID_USER_ID: 'INVALID_USER_ID',

  // Erreurs de contenu
  CONTENT_TOO_LONG: 'CONTENT_TOO_LONG',
  EMBED_TOO_LARGE: 'EMBED_TOO_LARGE',
  TOO_MANY_FIELDS: 'TOO_MANY_FIELDS',
  INVALID_COLOR_FORMAT: 'INVALID_COLOR_FORMAT',

  // Erreurs de sondages
  POLL_INVALID_OPTIONS: 'POLL_INVALID_OPTIONS',
  POLL_DURATION_TOO_LONG: 'POLL_DURATION_TOO_LONG',
  POLL_DURATION_TOO_SHORT: 'POLL_DURATION_TOO_SHORT',

  // Erreurs de fichiers
  FILE_NOT_FOUND: 'FILE_NOT_FOUND',
  FILE_TOO_LARGE: 'FILE_TOO_LARGE',
  UNSUPPORTED_FILE_TYPE: 'UNSUPPORTED_FILE_TYPE',

  // Erreurs Discord
  DISCORD_API_ERROR: 'DISCORD_API_ERROR',
  MISSING_PERMISSIONS: 'MISSING_PERMISSIONS',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',

  // Erreurs internes
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  UNKNOWN_TOOL: 'UNKNOWN_TOOL',
  NOT_IMPLEMENTED: 'NOT_IMPLEMENTED'
} as const;

// ============================================================================
// MESSAGES D'ERREUR PRÉDÉFINIS
// ============================================================================

export const ERROR_MESSAGES = {
  [ERROR_CODES.VALIDATION_ERROR]: 'Erreur de validation des paramètres',
  [ERROR_CODES.INVALID_CHANNEL_ID]: 'ID de canal invalide ou inaccessible',
  [ERROR_CODES.INVALID_MESSAGE_ID]: 'ID de message invalide',
  [ERROR_CODES.INVALID_USER_ID]: 'ID d\'utilisateur invalide',
  [ERROR_CODES.CONTENT_TOO_LONG]: 'Le contenu dépasse la limite de {limit} caractères',
  [ERROR_CODES.EMBED_TOO_LARGE]: 'L\'embed dépasse les limites Discord',
  [ERROR_CODES.TOO_MANY_FIELDS]: 'Nombre maximum de champs dépassé (max: {max})',
  [ERROR_CODES.INVALID_COLOR_FORMAT]: 'Format de couleur invalide. Utilisez: nom, hex (#RRGGBB) ou décimal',
  [ERROR_CODES.POLL_INVALID_OPTIONS]: 'Les sondages doivent avoir entre {min} et {max} options',
  [ERROR_CODES.POLL_DURATION_TOO_LONG]: 'La durée ne peut pas dépasser {max} secondes (7 jours)',
  [ERROR_CODES.POLL_DURATION_TOO_SHORT]: 'La durée doit être d\'au moins {min} secondes',
  [ERROR_CODES.FILE_NOT_FOUND]: 'Fichier non trouvé: {filePath}',
  [ERROR_CODES.FILE_TOO_LARGE]: 'Fichier trop volumineux. Limite: {limit}MB',
  [ERROR_CODES.UNSUPPORTED_FILE_TYPE]: 'Type de fichier non supporté: {type}',
  [ERROR_CODES.DISCORD_API_ERROR]: 'Erreur API Discord: {error}',
  [ERROR_CODES.MISSING_PERMISSIONS]: 'Permissions insuffisantes pour cette action',
  [ERROR_CODES.RATE_LIMIT_EXCEEDED]: 'Limite de débit dépassée. Réessayez plus tard.',
  [ERROR_CODES.INTERNAL_ERROR]: 'Erreur interne du serveur',
  [ERROR_CODES.UNKNOWN_TOOL]: 'Outil inconnu: {tool}',
  [ERROR_CODES.NOT_IMPLEMENTED]: 'Fonctionnalité non implémentée'
} as const;

// ============================================================================
// FONCTIONS UTILITAIRES
// ============================================================================

/**
 * Formatter une taille de fichier en format lisible
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * Formatter une durée en secondes vers un format lisible
 */
export const formatDuration = (seconds: number): string => {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  const parts: string[] = [];
  if (days > 0) parts.push(`${days}j`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (secs > 0 || parts.length === 0) parts.push(`${secs}s`);

  return parts.join(' ');
};

/**
 * Valider un ID Discord (snowflake)
 */
export const isValidDiscordId = (id: string): boolean => {
  return /^\d{17,20}$/.test(id);
};

/**
 * Convertir une couleur en format décimal
 */
export const parseColor = (color: string | number): number => {
  if (typeof color === 'number') {
    return color;
  }

  // Format hexadécimal (#RRGGBB)
  if (color.startsWith('#')) {
    return parseInt(color.slice(1), 16);
  }

  // Nom de couleur
  const upperColor = color.toUpperCase().replace(/ /g, '_');
  return DISCORD_COLORS[upperColor as keyof typeof DISCORD_COLORS] || 0;
};

/**
 * Vérifier si un embed respecte les limites Discord
 */
export const validateEmbedLimits = (embed: any): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (embed.title && embed.title.length > LIMITS.EMBED_MAX_TITLE) {
    errors.push(`Titre trop long (max: ${LIMITS.EMBED_MAX_TITLE} caractères)`);
  }

  if (embed.description && embed.description.length > LIMITS.EMBED_MAX_DESCRIPTION) {
    errors.push(`Description trop longue (max: ${LIMITS.EMBED_MAX_DESCRIPTION} caractères)`);
  }

  if (embed.fields && embed.fields.length > LIMITS.EMBED_MAX_FIELDS) {
    errors.push(`Trop de champs (max: ${LIMITS.EMBED_MAX_FIELDS})`);
  }

  // Vérifier chaque champ
  if (embed.fields) {
    embed.fields.forEach((field: any, index: number) => {
      if (field.name.length > LIMITS.EMBED_FIELD_NAME_MAX) {
        errors.push(`Champ #${index + 1}: nom trop long (max: ${LIMITS.EMBED_FIELD_NAME_MAX})`);
      }
      if (field.value.length > LIMITS.EMBED_FIELD_VALUE_MAX) {
        errors.push(`Champ #${index + 1}: valeur trop longue (max: ${LIMITS.EMBED_FIELD_VALUE_MAX})`);
      }
    });
  }

  return { valid: errors.length === 0, errors };
};

/**
 * Générer un ID unique pour les sondages
 */
export const generatePollId = (): string => {
  return `poll_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Truncate un texte à une longueur donnée
 */
export const truncate = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + '...';
};

// ============================================================================
// GUIDE D'UTILISATION RAPIDE
// ============================================================================

export const QUICK_START_GUIDE = {
  messages: {
    title: '💬 Envoi de Messages',
    steps: [
      '1. Utilisez l\'outil envoyer_message',
      '2. Spécifiez channelId et content',
      'Optionnel: Ajoutez des embeds, fichiers ou composants'
    ]
  },
  embeds: {
    title: '📋 Création d\'Embeds',
    steps: [
      '1. Utilisez creer_embed avec les paramètres deseés',
      '2. Ajoutez titre, description, couleur',
      '3. Optionnel: Champs, images, auteur, footer',
      'Astuce: Utilisez les templates pour gagner du temps'
    ]
  },
  polls: {
    title: '🗳️ Sondages Interactifs',
    steps: [
      '1. Utilisez creer_sondage',
      '2. Définissez question et options (2-10)',
      '3. Configurez durée (5s à 7j)',
      'Optionnel: Mode anonyme ou choix multiples'
    ]
  },
  buttons: {
    title: '🔘 Boutons Personnalisés',
    steps: [
      '1. Utilisez create_custom_buttons',
      '2. Définissez titre et description',
      '3. Ajoutez boutons (max 8)',
      '4. Configurez actions (message, embed, sondage)'
    ]
  },
  files: {
    title: '📎 Upload de Fichiers',
    steps: [
      '1. Utilisez uploader_fichier',
      '2. Spécifiez filePath et channelId',
      '3. Optionnel: fileName, message, spoiler',
      'Limite: 8MB standard, 25MB images, 100MB vidéos/audios'
    ]
  },
  code: {
    title: '💻 Affichage de Code',
    steps: [
      '1. Utilisez code_preview',
      '2. Spécifiez language et code',
      'Support: 30+ langages (JS, TS, Python, Rust, etc.)',
      'Auto-division si message trop long'
    ]
  }
} as const;

// ============================================================================
// EXPORT COMPLET
// ============================================================================

export const MCP_DOCUMENTATION = {
  SUPPORTED_LANGUAGES,
  DISCORD_COLORS,
  BUTTON_STYLES,
  FILE_LIMITS,
  LIMITS,
  EMBED_TEMPLATES,
  ERROR_CODES,
  ERROR_MESSAGES,
  QUICK_START_GUIDE,
  utilities: {
    formatFileSize,
    formatDuration,
    isValidDiscordId,
    parseColor,
    validateEmbedLimits,
    generatePollId,
    truncate
  }
};

export default MCP_DOCUMENTATION;
