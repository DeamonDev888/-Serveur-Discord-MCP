import { z } from 'zod';
import {
  ButtonStyle,
  TextInputStyle,
  ActionRowBuilder,
  ButtonBuilder,
  StringSelectMenuBuilder,
  UserSelectMenuBuilder,
  RoleSelectMenuBuilder,
  ChannelSelectMenuBuilder,
  MentionableSelectMenuBuilder,
  ModalBuilder,
  TextInputBuilder,
} from 'discord.js';

// Types de composants supportés
export const COMPONENT_TYPES = {
  BUTTON: 'button',
  STRING_SELECT: 'string_select',
  USER_SELECT: 'user_select',
  ROLE_SELECT: 'role_select',
  CHANNEL_SELECT: 'channel_select',
  MENTIONABLE_SELECT: 'mentionable_select',
} as const;

// Styles de boutons
export const BUTTON_STYLES = {
  PRIMARY: ButtonStyle.Primary, // Bleu
  SECONDARY: ButtonStyle.Secondary, // Gris
  SUCCESS: ButtonStyle.Success, // Vert
  DANGER: ButtonStyle.Danger, // Rouge
  LINK: ButtonStyle.Link, // Lien (gris, icône de lien)
} as const;

// Styles de champs de texte
export const INPUT_STYLES = {
  SHORT: TextInputStyle.Short, // Ligne simple
  PARAGRAPH: TextInputStyle.Paragraph, // Zone de texte multiligne
} as const;

// Schéma pour les boutons
export const ButtonSchema = z
  .object({
    type: z.literal(COMPONENT_TYPES.BUTTON),
    label: z.string().min(1).max(80).describe('Texte du bouton'),
    style: z.nativeEnum(BUTTON_STYLES).default(BUTTON_STYLES.PRIMARY).describe('Style du bouton'),
    emoji: z.string().optional().describe('Emoji du bouton'),
    customId: z.string().optional().describe('ID personnalisé (requis sauf pour les liens)'),
    url: z.string().url().optional().describe('URL (requis pour les boutons de type lien)'),
    disabled: z.boolean().optional().default(false).describe('Désactiver le bouton'),
  })
  .refine(
    data => {
      if (data.style === BUTTON_STYLES.LINK) {
        return !!data.url && !data.customId;
      } else {
        return !!data.customId && !data.url;
      }
    },
    {
      message: 'Les boutons de type lien nécessitent une URL, les autres nécessitent un customId',
    }
  );

// Schéma pour les menus de sélection de chaînes
export const StringSelectSchema = z.object({
  type: z.literal(COMPONENT_TYPES.STRING_SELECT),
  customId: z.string().describe('ID personnalisé du menu'),
  placeholder: z.string().max(150).optional().describe('Texte placeholder'),
  minValues: z
    .number()
    .min(0)
    .max(25)
    .optional()
    .default(1)
    .describe('Nombre minimum de sélections'),
  maxValues: z
    .number()
    .min(1)
    .max(25)
    .optional()
    .default(1)
    .describe('Nombre maximum de sélections'),
  disabled: z.boolean().optional().default(false).describe('Désactiver le menu'),
  options: z
    .array(
      z.object({
        label: z.string().min(1).max(100).describe("Texte de l'option"),
        value: z.string().max(100).describe("Valeur de l'option"),
        description: z.string().max(100).optional().describe("Description de l'option"),
        emoji: z.string().optional().describe("Emoji de l'option"),
        default: z.boolean().optional().default(false).describe('Sélectionnée par défaut'),
      })
    )
    .min(1)
    .max(25)
    .describe('Options du menu (1-25)'),
});

// Schéma pour les sélecteurs d'utilisateurs
export const UserSelectSchema = z.object({
  type: z.literal(COMPONENT_TYPES.USER_SELECT),
  customId: z.string().describe('ID personnalisé du menu'),
  placeholder: z.string().max(150).optional().describe('Texte placeholder'),
  minValues: z
    .number()
    .min(0)
    .max(25)
    .optional()
    .default(1)
    .describe('Nombre minimum de sélections'),
  maxValues: z
    .number()
    .min(1)
    .max(25)
    .optional()
    .default(1)
    .describe('Nombre maximum de sélections'),
  disabled: z.boolean().optional().default(false).describe('Désactiver le menu'),
  defaultUsers: z.array(z.string()).optional().describe('Utilisateurs sélectionnés par défaut'),
});

// Schéma pour les sélecteurs de rôles
export const RoleSelectSchema = z.object({
  type: z.literal(COMPONENT_TYPES.ROLE_SELECT),
  customId: z.string().describe('ID personnalisé du menu'),
  placeholder: z.string().max(150).optional().describe('Texte placeholder'),
  minValues: z
    .number()
    .min(0)
    .max(25)
    .optional()
    .default(1)
    .describe('Nombre minimum de sélections'),
  maxValues: z
    .number()
    .min(1)
    .max(25)
    .optional()
    .default(1)
    .describe('Nombre maximum de sélections'),
  disabled: z.boolean().optional().default(false).describe('Désactiver le menu'),
  defaultRoles: z.array(z.string()).optional().describe('Rôles sélectionnés par défaut'),
});

// Schéma pour les sélecteurs de salons
export const ChannelSelectSchema = z.object({
  type: z.literal(COMPONENT_TYPES.CHANNEL_SELECT),
  customId: z.string().describe('ID personnalisé du menu'),
  placeholder: z.string().max(150).optional().describe('Texte placeholder'),
  minValues: z
    .number()
    .min(0)
    .max(25)
    .optional()
    .default(1)
    .describe('Nombre minimum de sélections'),
  maxValues: z
    .number()
    .min(1)
    .max(25)
    .optional()
    .default(1)
    .describe('Nombre maximum de sélections'),
  disabled: z.boolean().optional().default(false).describe('Désactiver le menu'),
  channelTypes: z.array(z.number()).optional().describe('Types de canaux autorisés'),
  defaultChannels: z.array(z.string()).optional().describe('Canaux sélectionnés par défaut'),
});

// Schéma pour les sélecteurs mentionnables
export const MentionableSelectSchema = z.object({
  type: z.literal(COMPONENT_TYPES.MENTIONABLE_SELECT),
  customId: z.string().describe('ID personnalisé du menu'),
  placeholder: z.string().max(150).optional().describe('Texte placeholder'),
  minValues: z
    .number()
    .min(0)
    .max(25)
    .optional()
    .default(1)
    .describe('Nombre minimum de sélections'),
  maxValues: z
    .number()
    .min(1)
    .max(25)
    .optional()
    .default(1)
    .describe('Nombre maximum de sélections'),
  disabled: z.boolean().optional().default(false).describe('Désactiver le menu'),
  defaultValues: z
    .array(
      z.object({
        id: z.string(),
        type: z.enum(['user', 'role']),
      })
    )
    .optional()
    .describe('Valeurs sélectionnées par défaut'),
});

// Schéma pour les modals (fenêtres de saisie)
export const ModalSchema = z.object({
  title: z.string().min(1).max(45).describe('Titre de la modal'),
  customId: z.string().describe('ID personnalisé de la modal'),
  components: z
    .array(
      z.object({
        type: z.literal('text_input'),
        customId: z.string().describe('ID du champ'),
        label: z.string().min(1).max(45).describe('Étiquette du champ'),
        placeholder: z.string().max(4000).optional().describe('Texte placeholder'),
        style: z.nativeEnum(INPUT_STYLES).default(INPUT_STYLES.SHORT).describe('Style du champ'),
        minLength: z.number().min(0).max(4000).optional().describe('Longueur minimale'),
        maxLength: z
          .number()
          .min(1)
          .max(4000)
          .optional()
          .default(4000)
          .describe('Longueur maximale'),
        required: z.boolean().optional().default(true).describe('Champ requis'),
        value: z.string().optional().describe('Valeur par défaut'),
      })
    )
    .min(1)
    .max(5)
    .describe('Champs de la modal (1-5)'),
});

// Schéma principal pour les composants interactifs
export const InteractionSchema = z.object({
  channelId: z.string().describe('ID du canal où envoyer les composants'),
  content: z.string().optional().describe('Message de texte'),
  embeds: z.array(z.any()).optional().describe('Embeds à inclure'),
  components: z
    .array(
      z.union([
        ButtonSchema,
        StringSelectSchema,
        UserSelectSchema,
        RoleSelectSchema,
        ChannelSelectSchema,
        MentionableSelectSchema,
      ])
    )
    .max(5)
    .describe('Composants (max 5 rangées de 5 composants)'),
});

// Construire un bouton
export const buildButton = (data: z.infer<typeof ButtonSchema>): ButtonBuilder => {
  const button = new ButtonBuilder()
    .setLabel(data.label)
    .setStyle(data.style)
    .setDisabled(data.disabled);

  if (data.emoji) {
    button.setEmoji(data.emoji);
  }

  if (data.customId) {
    button.setCustomId(data.customId);
  }

  if (data.url) {
    button.setURL(data.url);
  }

  return button;
};

// Construire un menu de sélection de chaînes
export const buildStringSelect = (
  data: z.infer<typeof StringSelectSchema>
): StringSelectMenuBuilder => {
  const menu = new StringSelectMenuBuilder()
    .setCustomId(data.customId)
    .setPlaceholder(data.placeholder || '')
    .setMinValues(data.minValues)
    .setMaxValues(data.maxValues)
    .setDisabled(data.disabled);

  data.options.forEach(option => {
    menu.addOptions({
      label: option.label,
      value: option.value,
      description: option.description,
      emoji: option.emoji,
      default: option.default,
    });
  });

  return menu;
};

// Construire un sélecteur d'utilisateurs
export const buildUserSelect = (data: z.infer<typeof UserSelectSchema>): UserSelectMenuBuilder => {
  return new UserSelectMenuBuilder()
    .setCustomId(data.customId)
    .setPlaceholder(data.placeholder || '')
    .setMinValues(data.minValues)
    .setMaxValues(data.maxValues)
    .setDisabled(data.disabled)
    .setDefaultUsers(data.defaultUsers || []);
};

// Construire un sélecteur de rôles
export const buildRoleSelect = (data: z.infer<typeof RoleSelectSchema>): RoleSelectMenuBuilder => {
  return new RoleSelectMenuBuilder()
    .setCustomId(data.customId)
    .setPlaceholder(data.placeholder || '')
    .setMinValues(data.minValues)
    .setMaxValues(data.maxValues)
    .setDisabled(data.disabled)
    .setDefaultRoles(data.defaultRoles || []);
};

// Construire un sélecteur de salons
export const buildChannelSelect = (
  data: z.infer<typeof ChannelSelectSchema>
): ChannelSelectMenuBuilder => {
  return new ChannelSelectMenuBuilder()
    .setCustomId(data.customId)
    .setPlaceholder(data.placeholder || '')
    .setMinValues(data.minValues)
    .setMaxValues(data.maxValues)
    .setDisabled(data.disabled)
    .setChannelTypes(data.channelTypes || [])
    .setDefaultChannels(data.defaultChannels || []);
};

// Construire un sélecteur mentionnable
export const buildMentionableSelect = (
  data: z.infer<typeof MentionableSelectSchema>
): MentionableSelectMenuBuilder => {
  return new MentionableSelectMenuBuilder()
    .setCustomId(data.customId)
    .setPlaceholder(data.placeholder || '')
    .setMinValues(data.minValues)
    .setMaxValues(data.maxValues)
    .setDisabled(data.disabled)
    .setDefaultValues((data.defaultValues as any) || []);
};

// Construire une modal
export const buildModal = (data: z.infer<typeof ModalSchema>): ModalBuilder => {
  const modal = new ModalBuilder().setTitle(data.title).setCustomId(data.customId);

  data.components.forEach(component => {
    const textInput = new TextInputBuilder()
      .setCustomId(component.customId)
      .setLabel(component.label)
      .setStyle(component.style)
      .setPlaceholder(component.placeholder || '')
      .setMinLength(component.minLength || 0)
      .setMaxLength(component.maxLength || 4000)
      .setRequired(component.required)
      .setValue(component.value || '');

    const row = new ActionRowBuilder<TextInputBuilder>().addComponents(textInput);
    modal.addComponents(row);
  });

  return modal;
};

// Construire les rangées de composants
export const buildActionRows = (components: any[]): any[] => {
  const rows: any[] = [];
  let currentButtons: ButtonBuilder[] = [];

  components.forEach(component => {
    switch (component.type) {
      case COMPONENT_TYPES.BUTTON:
        currentButtons.push(buildButton(component));
        if (currentButtons.length >= 5) {
          rows.push(new ActionRowBuilder<ButtonBuilder>().addComponents(currentButtons));
          currentButtons = [];
        }
        break;
      default: {
        if (currentButtons.length > 0) {
          rows.push(new ActionRowBuilder<ButtonBuilder>().addComponents(currentButtons));
          currentButtons = [];
        }

        const builder =
          component.type === COMPONENT_TYPES.STRING_SELECT
            ? buildStringSelect(component)
            : component.type === COMPONENT_TYPES.USER_SELECT
              ? buildUserSelect(component)
              : component.type === COMPONENT_TYPES.ROLE_SELECT
                ? buildRoleSelect(component)
                : component.type === COMPONENT_TYPES.CHANNEL_SELECT
                  ? buildChannelSelect(component)
                  : component.type === COMPONENT_TYPES.MENTIONABLE_SELECT
                    ? buildMentionableSelect(component)
                    : null;

        if (builder) {
          rows.push(new ActionRowBuilder<any>().addComponents(builder));
        }
        break;
      }
    }
  });

  if (currentButtons.length > 0) {
    rows.push(new ActionRowBuilder<ButtonBuilder>().addComponents(currentButtons));
  }

  return rows;
};

// Valider les composants
export const validateComponents = (components: any[]): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (components.length > 5) {
    errors.push('Un message ne peut pas avoir plus de 5 rangées de composants');
  }

  // Vérifier chaque rangée
  components.forEach(row => {
    if (row.type === COMPONENT_TYPES.BUTTON) {
      // Les rangées de boutons ne peuvent pas dépasser 5 éléments
      // (c'est géré automatiquement par buildActionRows)
    } else {
      // Les autres composants doivent être seuls dans leur rangée
      if (components.filter(c => c.type !== COMPONENT_TYPES.BUTTON).length > 1) {
        errors.push(`Les composants de type sélection doivent être dans des rangées séparées`);
      }
    }
  });

  return {
    valid: errors.length === 0,
    errors,
  };
};

// ============================================================================
// ENREGISTREMENT DES OUTILS MCP
// ============================================================================

import type { FastMCP } from 'fastmcp';
import { EmbedBuilder } from 'discord.js';
import Logger from '../utils/logger.js';
import { ensureDiscordConnection } from './common.js';

export function registerInteractionTools(server: FastMCP) {

  // ========================================================================
  // 1. CRÉER UN BOUTON
  // ========================================================================

  server.addTool({
    name: 'create_button',
    description: 'Crée un message avec un bouton interactif',
    parameters: z.object({
      channelId: z.string().describe('ID du canal'),
      message: z.string().optional().describe('Message à envoyer'),
      label: z.string().describe('Texte du bouton'),
      style: z.enum(['Primary', 'Secondary', 'Success', 'Danger']).default('Primary'),
      customId: z.string().describe('ID unique du bouton'),
      emoji: z.string().optional().describe('Emoji du bouton'),
    }),
    execute: async (args) => {
      try {
        const client = await ensureDiscordConnection();
        const channel = await client.channels.fetch(args.channelId);

        if (!channel || !('send' in channel)) {
          throw new Error('Canal invalide');
        }

        const row = new ActionRowBuilder<ButtonBuilder>();
        const button = new ButtonBuilder()
          .setCustomId(args.customId)
          .setLabel(args.label)
          .setStyle(BUTTON_STYLES[args.style.toUpperCase() as keyof typeof BUTTON_STYLES]);

        if (args.emoji) {
          button.setEmoji(args.emoji);
        }

        row.addComponents(button);

        const msg = await channel.send({
          content: args.message || '',
          components: [row],
        });

        return `✅ Bouton créé | ID: ${msg.id} | customId: ${args.customId}`;
      } catch (error: any) {
        Logger.error('❌ [create_button]', error.message);
        return `❌ Erreur: ${error.message}`;
      }
    },
  });

  // ========================================================================
  // 2. CRÉER UN MENU DÉROULANT
  // ========================================================================

  server.addTool({
    name: 'create_menu',
    description: 'Crée un message avec un menu déroulant',
    parameters: z.object({
      channelId: z.string().describe('ID du canal'),
      message: z.string().optional().describe('Message à envoyer'),
      customId: z.string().describe('ID unique du menu'),
      placeholder: z.string().optional().describe('Texte d\'attente'),
      options: z.array(z.object({
        label: z.string(),
        value: z.string(),
        description: z.string().optional(),
        emoji: z.string().optional(),
      })).min(1).max(25).describe('Options du menu'),
      minValues: z.number().optional().default(1).describe('Nombre minimum de sélections'),
      maxValues: z.number().optional().default(1).describe('Nombre maximum de sélections'),
    }),
    execute: async (args) => {
      try {
        const client = await ensureDiscordConnection();
        const channel = await client.channels.fetch(args.channelId);

        if (!channel || !('send' in channel)) {
          throw new Error('Canal invalide');
        }

        const menuData = {
          type: COMPONENT_TYPES.STRING_SELECT,
          customId: args.customId,
          placeholder: args.placeholder,
          minValues: args.minValues,
          maxValues: args.maxValues,
          options: args.options,
        };

        const menu = buildStringSelect(menuData);
        const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(menu);

        const msg = await channel.send({
          content: args.message || '',
          components: [row],
        });

        return `✅ Menu créé | ID: ${msg.id} | customId: ${args.customId}`;
      } catch (error: any) {
        Logger.error('❌ [create_menu]', error.message);
        return `❌ Erreur: ${error.message}`;
      }
    },
  });

  // ========================================================================
  // 3. CRÉER UN SONDAGE
  // ========================================================================

  server.addTool({
    name: 'create_poll',
    description: 'Crée un sondage interactif avec boutons',
    parameters: z.object({
      channelId: z.string().describe('ID du canal'),
      question: z.string().describe('Question du sondage'),
      options: z.array(z.string()).min(2).max(10).describe('Options de réponse'),
      duration: z.number().optional().describe('Durée en minutes (optionnel)'),
      allowMultiple: z.boolean().optional().default(false).describe('Autoriser plusieurs choix'),
    }),
    execute: async (args) => {
      try {
        const client = await ensureDiscordConnection();
        const channel = await client.channels.fetch(args.channelId);

        if (!channel || !('send' in channel)) {
          throw new Error('Canal invalide');
        }

        const pollId = `poll_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;

        const embed = new EmbedBuilder()
          .setTitle('📊 Sondage')
          .setDescription(`**${args.question}**\n\n${args.options.map((opt, i) => `${i + 1}. ${opt}`).join('\n')}`)
          .setColor(0x5865f2)
          .setFooter({ text: args.duration ? `Durée: ${args.duration} min` : 'Votez en cliquant sur les boutons' })
          .setTimestamp();

        const row = new ActionRowBuilder<ButtonBuilder>();
        const buttonStyles = [BUTTON_STYLES.PRIMARY, BUTTON_STYLES.SUCCESS, BUTTON_STYLES.SECONDARY, BUTTON_STYLES.DANGER];

        args.options.slice(0, 5).forEach((opt, index) => {
          const button = new ButtonBuilder()
            .setCustomId(`${pollId}_option_${index}`)
            .setLabel(`${index + 1}`)
            .setStyle(Object.values(BUTTON_STYLES)[index % 4]);
          row.addComponents(button);
        });

        const msg = await channel.send({
          embeds: [embed],
          components: [row],
        });

        return `✅ Sondage créé | ID: ${msg.id} | pollId: ${pollId}`;
      } catch (error: any) {
        Logger.error('❌ [create_poll]', error.message);
        return `❌ Erreur: ${error.message}`;
      }
    },
  });

  Logger.info('✅ Outils interactions enregistrés (3 outils: create_button, create_menu, create_poll)');
}
