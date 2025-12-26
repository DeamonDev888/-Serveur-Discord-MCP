/**
 * Système d'actions prédéfinies pour les boutons d'embeds
 * Gère les actions par défaut: refresh, link, custom, none, etc.
 */

import { ButtonStyle, ActionRowBuilder, ButtonBuilder, EmbedBuilder } from 'discord.js';
import Logger from './logger.js';
import { addCustomButton } from './buttonPersistence.js';

// Types d'actions supportées
export type EmbedButtonAction = 'none' | 'refresh' | 'link' | 'custom' | 'delete' | 'edit' | 'modal' | 'react' | 'role';

// Interface pour la configuration d'un bouton embed
export interface EmbedButtonConfig {
  label: string;
  style: 'Primary' | 'Secondary' | 'Success' | 'Danger';
  emoji?: string;
  action: EmbedButtonAction;
  value?: string;
  roleId?: string;  // Pour action 'role'
  reaction?: string; // Pour action 'react'
  customData?: any;  // Données personnalisées pour action 'custom'
}

// Interface pour le contexte d'exécution
export interface ButtonContext {
  interaction: any;
  channelId: string;
  messageId: string;
  user: any;
  originalEmbed?: any;
}

// ============================================================================
// ACTIONS PRÉDÉFINIES
// ============================================================================

/**
 * Handler pour l'action 'none' - Affiche un message simple de confirmation
 */
async function handleNoneAction(context: ButtonContext): Promise<void> {
  const { interaction } = context;

  await interaction.reply({
    content: '✅ Bouton cliqué (action configurée)',
    ephemeral: true
  });
}

/**
 * Handler pour l'action 'refresh' - Rafraîchit l'embed avec un timestamp
 */
async function handleRefreshAction(context: ButtonContext): Promise<void> {
  const { interaction, originalEmbed } = context;

  if (!originalEmbed) {
    await interaction.reply({
      content: '❌ Impossible de rafraîchir: embed non trouvé',
      ephemeral: true
    });
    return;
  }

  const refreshedEmbed = EmbedBuilder.from(originalEmbed);
  refreshedEmbed.setTimestamp(new Date());

  await interaction.update({
    embeds: [refreshedEmbed]
  });
}

/**
 * Handler pour l'action 'link' - Ouvre un lien (message avec l'URL)
 */
async function handleLinkAction(context: ButtonContext, value?: string): Promise<void> {
  const { interaction } = context;

  if (!value) {
    await interaction.reply({
      content: '❌ Lien non configuré',
      ephemeral: true
    });
    return;
  }

  await interaction.reply({
    content: `🔗 ${value}`,
    ephemeral: false
  });
}

/**
 * Handler pour l'action 'delete' - Supprime le message original
 */
async function handleDeleteAction(context: ButtonContext): Promise<void> {
  const { interaction } = context;

  await interaction.update({
    content: '🗑️ Message supprimé',
    embeds: [],
    components: []
  });

  // Supprimer après un court délai
  setTimeout(async () => {
    try {
      await interaction.deleteReply();
    } catch (e) {
      // Message déjà supprimé
    }
  }, 2000);
}

/**
 * Handler pour l'action 'edit' - Modifie l'embed
 */
async function handleEditAction(context: ButtonContext, customData?: any): Promise<void> {
  const { interaction } = context;

  if (!customData) {
    await interaction.reply({
      content: '❌ Données de modification non fournies',
      ephemeral: true
    });
    return;
  }

  const newEmbed = new EmbedBuilder()
    .setTitle(customData.title || 'Embed Modifié')
    .setDescription(customData.description || 'Cet embed a été modifié via un bouton.')
    .setColor(customData.color || 0x5865f2);

  if (customData.timestamp) {
    newEmbed.setTimestamp();
  }

  await interaction.update({
    embeds: [newEmbed]
  });
}

/**
 * Handler pour l'action 'react' - Ajoute une réaction au message
 */
async function handleReactAction(context: ButtonContext, reaction?: string): Promise<void> {
  const { interaction } = context;

  if (!reaction) {
    await interaction.reply({
      content: '❌ Réaction non configurée',
      ephemeral: true
    });
    return;
  }

  try {
    await interaction.message.react(reaction);
    await interaction.reply({
      content: `✅ Réaction ${reaction} ajoutée`,
      ephemeral: true
    });
  } catch (error: any) {
    await interaction.reply({
      content: `❌ Erreur: ${error.message}`,
      ephemeral: true
    });
  }
}

/**
 * Handler pour l'action 'role' - Gère les rôles (à implémenter selon permissions)
 */
async function handleRoleAction(context: ButtonContext, roleId?: string): Promise<void> {
  const { interaction } = context;

  if (!roleId) {
    await interaction.reply({
      content: '❌ Rôle non configuré',
      ephemeral: true
    });
    return;
  }

  // Cette action nécessite des permissions spéciales
  // Pour l'instant, on renvoie un message informatif
  await interaction.reply({
    content: `🔐 Gestion de rôle: ${roleId}\n\nCette fonctionnalité nécessite des permissions supplémentaires.`,
    ephemeral: true
  });
}

/**
 * Handler pour l'action 'modal' - Affiche un modal (placeholder)
 */
async function handleModalAction(context: ButtonContext, customData?: any): Promise<void> {
  const { interaction } = context;

  await interaction.reply({
    content: '📝 Fonctionnalité Modal à implémenter',
    ephemeral: true
  });
}

/**
 * Handler pour l'action 'custom' - Action personnalisée avec données
 */
async function handleCustomAction(context: ButtonContext, customData?: any): Promise<void> {
  const { interaction } = context;

  if (!customData) {
    await interaction.reply({
      content: '⚙️ Action personnalisée (aucune donnée fournie)',
      ephemeral: true
    });
    return;
  }

  // Générer une réponse basée sur les données custom
  let response = '⚙️ **Action Personnalisée**\n\n';

  if (customData.message) {
    response += `💬 ${customData.message}\n\n`;
  }

  if (customData.embed) {
    // Si un embed est fourni, l'envoyer
    const customEmbed = new EmbedBuilder()
      .setTitle(customData.embed.title || 'Action Custom')
      .setDescription(customData.embed.description || '')
      .setColor(customData.embed.color || 0x5865f2);

    await interaction.reply({
      embeds: [customEmbed],
      ephemeral: customData.ephemeral || true
    });
    return;
  }

  await interaction.reply({
    content: response,
    ephemeral: true
  });
}

// ============================================================================
// MAP DES ACTIONS
// ============================================================================

const ACTION_HANDLERS: Record<EmbedButtonAction, (context: ButtonContext, value?: any) => Promise<void>> = {
  none: handleNoneAction,
  refresh: handleRefreshAction,
  link: handleLinkAction,
  delete: handleDeleteAction,
  edit: handleEditAction,
  react: handleReactAction,
  role: handleRoleAction,
  modal: handleModalAction,
  custom: handleCustomAction,
};

// ============================================================================
// FONCTIONS PUBLIQUES
// ============================================================================

/**
 * Enregistre les boutons d'un embed dans la persistance
 */
export async function registerEmbedButtons(
  embedId: string,
  buttons: EmbedButtonConfig[],
  channelId: string,
  messageId: string,
  buttonsMap: Map<string, any>
): Promise<string[]> {
  const registeredIds: string[] = [];

  for (const btn of buttons) {
    const buttonId = `embedv2_${embedId}_${btn.action}_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;

    // Préparer les données de l'action
    const actionData: any = {
      type: btn.action,
      data: {},
    };

    // Ajouter les données spécifiques selon le type d'action
    switch (btn.action) {
      case 'link':
        actionData.data.url = btn.value;
        break;
      case 'edit':
        actionData.data.newEmbed = btn.customData;
        break;
      case 'react':
        actionData.data.emoji = btn.reaction;
        break;
      case 'role':
        actionData.data.roleId = btn.roleId;
        actionData.data.action = 'toggle';
        break;
      case 'custom':
        actionData.data = btn.customData || {};
        break;
    }

    // Créer l'objet bouton pour la persistance
    const buttonToSave = {
      id: buttonId,
      messageId,
      channelId,
      label: btn.label,
      action: actionData,
      createdAt: new Date(),
    };

    // Enregistrer dans le map et la persistance
    buttonsMap.set(buttonId, buttonToSave);
    await addCustomButton(buttonToSave, buttonsMap);

    registeredIds.push(buttonId);
    Logger.info(`✅ Bouton enregistré: ${buttonId} (${btn.action})`);
  }

  return registeredIds;
}

/**
 * Exécute une action de bouton embed
 */
export async function executeEmbedButtonAction(
  customId: string,
  context: ButtonContext
): Promise<boolean> {
  // Extraire l'action depuis le customId
  const parts = customId.split('_');
  if (parts[0] !== 'embedv2' || parts.length < 3) {
    return false;
  }

  const actionType = parts[2] as EmbedButtonAction;
  const handler = ACTION_HANDLERS[actionType];

  if (!handler) {
    Logger.warn(`⚠️ Action de bouton inconnue: ${actionType}`);
    return false;
  }

  try {
    Logger.info(`🎯 Exécution action embed: ${actionType}`);
    await handler(context, context.originalEmbed?.data);
    return true;
  } catch (error: any) {
    Logger.error(`❌ Erreur exécution action ${actionType}:`, error.message);
    return false;
  }
}

/**
 * Vérifie si un customId est un bouton embed
 */
export function isEmbedButton(customId: string): boolean {
  return customId.startsWith('embedv2_');
}

/**
 * Crée les composants Discord pour les boutons
 */
export function createEmbedButtonComponents(
  embedId: string,
  buttons: EmbedButtonConfig[]
): ActionRowBuilder<ButtonBuilder>[] {
  const styleMap: Record<string, ButtonStyle> = {
    Primary: ButtonStyle.Primary,
    Secondary: ButtonStyle.Secondary,
    Success: ButtonStyle.Success,
    Danger: ButtonStyle.Danger,
  };

  const row = new ActionRowBuilder<ButtonBuilder>();

  for (const btn of buttons) {
    const buttonId = `embedv2_${embedId}_${btn.action}_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    const button = new ButtonBuilder()
      .setCustomId(buttonId)
      .setLabel(btn.label)
      .setStyle(styleMap[btn.style] || ButtonStyle.Primary);

    if (btn.emoji) {
      button.setEmoji(btn.emoji);
    }

    row.addComponents(button);
  }

  return [row];
}

/**
 * Templates de boutons prédéfinis
 */
export const EMBED_BUTTON_TEMPLATES = {
  // Boutons de confirmation
  confirmOk: {
    label: '✅ Confirmer',
    style: 'Success' as const,
    action: 'none' as const,
  },

  confirmCancel: {
    label: '❌ Annuler',
    style: 'Danger' as const,
    action: 'delete' as const,
  },

  // Boutons de navigation
  refresh: {
    label: '🔄 Rafraîchir',
    style: 'Secondary' as const,
    action: 'refresh' as const,
  },

  // Boutons de lien
  visitLink: (label: string, url: string) => ({
    label,
    style: 'Primary' as const,
    action: 'link' as const,
    value: url,
  }),

  // Boutons de réaction
  like: {
    label: '👍 J\'aime',
    style: 'Success' as const,
    action: 'react' as const,
    reaction: '👍',
  },

  // Boutons utilitaires
  delete: {
    label: '🗑️ Supprimer',
    style: 'Danger' as const,
    action: 'delete' as const,
  },

  edit: {
    label: '✏️ Modifier',
    style: 'Primary' as const,
    action: 'edit' as const,
    customData: {
      title: 'Embed Modifié',
      description: 'Cet embed a été modifié',
    },
  },
};
