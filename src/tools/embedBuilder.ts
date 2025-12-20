import { z } from 'zod';

// Types pour les couleurs Discord
export const DISCORD_COLORS = {
  DEFAULT: 0x000000,
  WHITE: 0xffffff,
  AQUA: 0x1abc9c,
  GREEN: 0x2ecc71,
  BLUE: 0x3498db,
  YELLOW: 0xf1c40f,
  PURPLE: 0x9b59b6,
  LUMINOUS_VIVID_PINK: 0xe91e63,
  FUCHSIA: 0xeb459e,
  GOLD: 0xf39c12,
  ORANGE: 0xe67e22,
  RED: 0xe74c3c,
  GREY: 0x95a5a6,
  NAVY: 0x34495e,
  DARK_AQUA: 0x11806a,
  DARK_GREEN: 0x1f8b4c,
  DARK_BLUE: 0x206694,
  DARK_PURPLE: 0x71368a,
  DARK_VIVID_PINK: 0xad1457,
  DARK_GOLD: 0xc27c0e,
  DARK_ORANGE: 0xa84300,
  DARK_RED: 0x992d22,
  DARK_GREY: 0x607d8b,
  DARKER_GREY: 0x36393f,
  LIGHT_GREY: 0xbcc0c0,
  DARK_NAVY: 0x2c3e50,
  BLURPLE: 0x5865f2,
  GREYPLE: 0x99aab5,
  DARK_BUT_NOT_BLACK: 0x2c2f33,
  NOT_QUITE_BLACK: 0x23272a,
} as const;

// Schéma pour la création d'embeds
export const CreateEmbedSchema = z.object({
  channelId: z.string().describe("ID du canal où envoyer l'embed"),
  title: z.string().optional().describe("Titre de l'embed"),
  description: z.string().optional().describe("Description principale de l'embed"),
  color: z
    .union([
      z.string().transform(val => {
        // Support des noms de couleurs
        const upperVal = val.toUpperCase().replace(/ /g, '_');
        return DISCORD_COLORS[upperVal as keyof typeof DISCORD_COLORS];
      }),
      z
        .string()
        .regex(/^#[0-9A-Fa-f]{6}$/)
        .transform(val => parseInt(val.slice(1), 16)),
      z.number().int().min(0).max(16777215),
    ])
    .optional()
    .default(0x000000)
    .describe("Couleur de l'embed (nom, hex, ou décimal)"),
  url: z.string().url().optional().describe('URL lorsque le titre est cliquable'),
  thumbnail: z
    .object({
      url: z.string().url(),
      proxy_url: z.string().url().optional(),
    })
    .optional()
    .describe('Image miniature à droite'),
  image: z
    .object({
      url: z.string().url(),
      proxy_url: z.string().url().optional(),
    })
    .optional()
    .describe('Grande image en bas'),
  author: z
    .object({
      name: z.string(),
      url: z.string().url().optional(),
      icon_url: z.string().url().optional(),
      proxy_icon_url: z.string().url().optional(),
    })
    .optional()
    .describe('Auteur en haut'),
  footer: z
    .object({
      text: z.string(),
      icon_url: z.string().url().optional(),
      proxy_icon_url: z.string().url().optional(),
    })
    .optional()
    .describe('Pied de page'),
  fields: z
    .array(
      z.object({
        name: z.string().max(256),
        value: z.string().max(1024),
        inline: z.boolean().optional().default(false),
      })
    )
    .max(25)
    .optional()
    .describe('Champs (max 25)'),
  timestamp: z.boolean().optional().default(false).describe('Ajouter un timestamp'),
  content: z.string().optional().describe("Message de texte supplémentaire à envoyer avec l'embed"),
  // New enhanced features
  graph: z
    .object({
      type: z.enum(['bar', 'line', 'pie']),
      data: z.array(z.object({ label: z.string(), value: z.number() })),
    })
    .optional()
    .describe('Graphique à intégrer dans l\'embed'),
  miniIcon: z.string().optional().describe('Mini icône (emoji ou URL)'),
  imageText: z
    .object({
      text: z.string(),
      color: z.string().optional(),
      position: z.enum(['top', 'bottom', 'center']).optional(),
    })
    .optional()
    .describe('Texte superposé sur l\'image'),
  minigame: z
    .object({
      type: z.enum(['tic-tac-toe', 'hangman', 'quiz']),
      data: z.any(),
    })
    .optional()
    .describe('Mini-jeu interactif'),
});

// Schéma pour les templates d'embeds prédéfinis
export const EmbedTemplateSchema = z.object({
  name: z.string(),
  template: CreateEmbedSchema.omit({ channelId: true }),
});

// Templates d'embeds prédéfinis
export const EMBED_TEMPLATES: Record<
  string,
  Omit<z.infer<typeof CreateEmbedSchema>, 'channelId'>
> = {
  announcement: {
    title: '📢 Annonce',
    color: DISCORD_COLORS.AQUA,
    timestamp: true,
    footer: {
      text: 'Annonce officielle',
    },
  },
  warning: {
    title: '⚠️ Attention',
    color: DISCORD_COLORS.ORANGE,
    timestamp: true,
    footer: {
      text: 'Veuillez noter',
    },
  },
  error: {
    title: '❌ Erreur',
    color: DISCORD_COLORS.RED,
    timestamp: true,
  },
  success: {
    title: '✅ Succès',
    color: DISCORD_COLORS.GREEN,
    timestamp: true,
  },
  info: {
    title: 'ℹ️ Information',
    color: DISCORD_COLORS.BLUE,
    timestamp: true,
  },
  rules: {
    title: '📋 Règles du Serveur',
    color: DISCORD_COLORS.BLURPLE,
    fields: [
      {
        name: 'Règle 1',
        value: 'Soyez respectueux avec tous les membres',
        inline: false,
      },
      {
        name: 'Règle 2',
        value: 'Pas de spam ni de publicité non autorisée',
        inline: false,
      },
      {
        name: 'Règle 3',
        value: 'Respectez les directives de chaque canal',
        inline: false,
      },
    ],
    timestamp: true,
  },
  welcome: {
    title: '👋 Bienvenue !',
    description: 'Nous sommes ravis de vous accueillir sur notre serveur !',
    color: DISCORD_COLORS.GREEN,
    thumbnail: {
      url: 'https://i.imgur.com/axdrI92.png', // Image de bienvenue générique
    },
    fields: [
      {
        name: 'Premiers pas',
        value: '📖 Lisez les règles\n🎮 Découvrez nos salons\n💬 Présentez-vous',
        inline: false,
      },
    ],
    timestamp: true,
  },
  giveaway: {
    title: '🎁 Giveaway !',
    description: 'Participez à notre giveaway exclusif !',
    color: DISCORD_COLORS.GOLD,
    fields: [
      {
        name: 'Prix',
        value: '🏆 Prix à définir',
        inline: true,
      },
      {
        name: 'Durée',
        value: '⏰ 24 heures',
        inline: true,
      },
      {
        name: 'Comment participer ?',
        value: 'Réagissez avec 🎉 pour participer !',
        inline: false,
      },
    ],
    footer: {
      text: 'Bonne chance à tous !',
    },
    timestamp: true,
  },
  graph: {
    title: '📊 Graphique',
    color: DISCORD_COLORS.BLUE,
    description: 'Affichage de données graphiques',
    timestamp: true,
  },
  minigame: {
    title: '🎮 Mini-Jeu',
    color: DISCORD_COLORS.GOLD,
    description: 'Jeu interactif',
    timestamp: true,
  },
};

// Valider un embed Discord
export const validateEmbed = (embed: any): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];

  // Vérifier la longueur du titre
  if (embed.title && embed.title.length > 256) {
    errors.push('Le titre ne peut pas dépasser 256 caractères');
  }

  // Vérifier la longueur de la description
  if (embed.description && embed.description.length > 4096) {
    errors.push('La description ne peut pas dépasser 4096 caractères');
  }

  // Vérifier le nombre de champs
  if (embed.fields && embed.fields.length > 25) {
    errors.push('Un embed ne peut pas avoir plus de 25 champs');
  }

  // Vérifier chaque champ
  if (embed.fields) {
    embed.fields.forEach((field: any, index: number) => {
      if (field.name.length > 256) {
        errors.push(`Le champ #${index + 1} (nom) ne peut pas dépasser 256 caractères`);
      }
      if (field.value.length > 1024) {
        errors.push(`Le champ #${index + 1} (valeur) ne peut pas dépasser 1024 caractères`);
      }
    });
  }

  // Vérifier le footer
  if (embed.footer && embed.footer.text && embed.footer.text.length > 2048) {
    errors.push('Le texte du footer ne peut pas dépasser 2048 caractères');
  }

  // Vérifier l'auteur
  if (embed.author && embed.author.name && embed.author.name.length > 256) {
    errors.push("Le nom de l'auteur ne peut pas dépasser 256 caractères");
  }

  // Vérifier la longueur totale
  const totalLength =
    (embed.title?.length || 0) +
    (embed.description?.length || 0) +
    (embed.fields?.reduce(
      (sum: number, field: any) => sum + field.name.length + field.value.length,
      0
    ) || 0) +
    (embed.footer?.text?.length || 0) +
    (embed.author?.name?.length || 0);

  if (totalLength > 6000) {
    errors.push("La longueur totale de l'embed ne peut pas dépasser 6000 caractères");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
};

// Créer un embed à partir d'un template
export const createEmbedFromTemplate = (
  templateName: string,
  customizations: Partial<Omit<z.infer<typeof CreateEmbedSchema>, 'channelId'>> = {}
): Omit<z.infer<typeof CreateEmbedSchema>, 'channelId'> | null => {
  const template = EMBED_TEMPLATES[templateName];
  if (!template) {
    return null;
  }

  return {
    ...template,
    ...customizations,
    // Fusionner les objets imbriqués
    fields: [...(template.fields || []), ...(customizations.fields || [])],
    author: customizations.author || template.author,
    footer: customizations.footer || template.footer,
    image: customizations.image || template.image,
    thumbnail: customizations.thumbnail || template.thumbnail,
  };
};

// Générer un aperçu textuel de l'embed
export const generateEmbedPreview = (
  embed: Omit<z.infer<typeof CreateEmbedSchema>, 'channelId'>
): string => {
  let preview = '';

  if (embed.author) {
    preview += `👤 ${embed.author.name}\n`;
  }

  if (embed.title) {
    preview += `**${embed.title}**\n`;
  }

  if (embed.description) {
    preview += `${embed.description}\n`;
  }

  if (embed.fields && embed.fields.length > 0) {
    embed.fields.forEach(field => {
      preview += `\n**${field.name}**\n${field.value}`;
    });
  }

  if (embed.footer) {
    preview += `\n\n_${embed.footer.text}_`;
  }

  return preview;
};
