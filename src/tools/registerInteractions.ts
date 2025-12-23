/**
 * Outils d'interactions (boutons et menus) pour le serveur Discord MCP
 * Enregistre les outils d'interactions (12 outils)
 */

import { z } from 'zod';
import type { FastMCP } from 'fastmcp';
import {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
} from 'discord.js';
import Logger from '../utils/logger.js';
import { ensureDiscordConnection } from './common.js';
import type { CustomButton } from '../utils/buttonPersistence.js';
import type { CustomMenu } from '../utils/menuPersistence.js';

// ============================================================================
// SCHÉMAS ZOD
// ============================================================================

const CreateCustomButtonsSchema = z.object({
  channelId: z.string().describe('ID du canal'),
  content: z.string().describe('Contenu'),
  buttons: z.array(z.object({
    label: z.string(),
    style: z.enum(['Primary', 'Secondary', 'Success', 'Danger']),
    customId: z.string().optional(),
    emoji: z.string().optional(),
    action: z.object({
      type: z.string().describe("Type d'action"),
      data: z.any().optional().describe('Données supplémentaires pour laction'),
    }).optional().describe('Action à exécuter quand le bouton est cliqué'),
  })).min(1).max(5),
});

const AppuyerBoutonSchema = z.object({
  channelId: z.string().describe('ID du canal'),
  messageId: z.string().describe('ID du message'),
  buttonCustomId: z.string().describe('Custom ID du bouton'),
});

const ListerBoutonsActifsSchema = z.object({
  channelId: z.string().optional().describe('Filtrer par canal spécifique'),
});

const SupprimerBoutonPersoSchema = z.object({
  buttonId: z.string().describe('ID du bouton à supprimer'),
});

const NettoyerAnciensBoutonsSchema = z.object({});

const EnregistrerFonctionBoutonSchema = z.object({
  buttonId: z.string().describe('ID du bouton (customId)'),
  code: z.string().describe('Code JavaScript de la fonction (async)'),
  description: z.string().optional().describe('Description de la fonction'),
});

const CreerBoutonAvanceSchema = z.object({
  channelId: z.string().describe('ID du canal'),
  content: z.string().describe('Contenu du message'),
  buttonLabel: z.string().describe('Texte du bouton'),
  buttonStyle: z.enum(['Primary', 'Secondary', 'Success', 'Danger']).default('Primary'),
  buttonId: z.string().optional().describe('ID du bouton (généré si non fourni)'),
  functionCode: z.string().describe('Code JavaScript à exécuter lors du clic'),
  ephemeral: z.boolean().optional().default(false).describe('Réponse éphémère'),
});

const ListerFonctionsBoutonsSchema = z.object({});

const CreateCustomMenuSchema = z.object({
  channelId: z.string().describe('ID du canal'),
  content: z.string().describe('Contenu'),
  options: z.array(z.object({
    label: z.string(),
    value: z.string(),
    description: z.string().optional(),
  })).min(1).max(25),
});

const SelectionnerMenuSchema = z.object({
  channelId: z.string().describe('ID du canal'),
  messageId: z.string().describe('ID du message'),
  menuCustomId: z.string().describe('Custom ID du menu'),
  value: z.string().describe('Valeur à sélectionner'),
});

const CreerMenuPersistantSchema = z.object({
  channelId: z.string().describe('ID du canal'),
  content: z.string().describe('Contenu du message'),
  placeholder: z.string().optional().describe('Texte placeholder du menu'),
  minValues: z.number().min(0).max(25).optional().default(1).describe('Nombre minimum de sélections'),
  maxValues: z.number().min(1).max(25).optional().default(1).describe('Nombre maximum de sélections'),
  options: z.array(z.object({
    label: z.string().min(1).max(100),
    value: z.string().min(1).max(100),
    description: z.string().max(100).optional(),
    emoji: z.string().optional(),
  })).min(1).max(25).describe('Options du menu'),
  action: z.object({
    type: z.enum(['message', 'embed', 'role', 'webhook', 'custom']),
    data: z.any().optional().describe('Données pour laction'),
  }).describe('Action à exécuter lors de la sélection'),
  menuId: z.string().optional().describe('ID du menu (généré si non fourni)'),
});

const ListerMenusActifsSchema = z.object({
  channelId: z.string().optional().describe('Filtrer par canal spécifique'),
});

// ============================================================================
// ENREGISTREMENT DES OUTILS
// ============================================================================

export function registerInteractionsTools(server: FastMCP): void {
  // 1. Créer des boutons personnalisés
  server.addTool({
    name: 'create_custom_buttons',
    description: 'Crée des boutons personnalisés',
    parameters: CreateCustomButtonsSchema,
    execute: async args => {
      try {
        const client = await ensureDiscordConnection();
        const channel = await client.channels.fetch(args.channelId);

        if (!channel || !('send' in channel)) {
          throw new Error('Canal invalide ou inaccessible');
        }

        const { loadCustomButtons, addCustomButton } = await import('../utils/buttonPersistence.js');

        const rows: ActionRowBuilder<any>[] = [];
        let currentRow = new ActionRowBuilder<any>();
        const now = new Date();
        const savedButtons: string[] = [];

        const styleMap = {
          Primary: ButtonStyle.Primary,
          Secondary: ButtonStyle.Secondary,
          Success: ButtonStyle.Success,
          Danger: ButtonStyle.Danger,
        };

        const existingButtons = await loadCustomButtons();

        args.buttons.forEach((btn, index) => {
          if (index > 0 && index % 5 === 0) {
            rows.push(currentRow);
            currentRow = new ActionRowBuilder<any>();
          }

          const customId = btn.customId || `btn_${Date.now()}_${index}_${Math.random().toString(36).substr(2, 9)}`;

          const button = new ButtonBuilder()
            .setLabel(btn.label)
            .setCustomId(customId)
            .setStyle(styleMap[btn.style as keyof typeof styleMap]);

          if (btn.emoji) button.setEmoji(btn.emoji);

          if (btn.action) {
            const customButton: CustomButton = {
              id: customId,
              messageId: '',
              channelId: args.channelId,
              label: btn.label,
              action: {
                type: btn.action.type || 'message',
                data: btn.action.data || {}
              },
              createdAt: now,
            };

            addCustomButton(customButton, existingButtons);
            savedButtons.push(customId);
          }

          currentRow.addComponents(button);
        });

        rows.push(currentRow);

        const message = await channel.send({
          content: args.content,
          components: rows.map(row => row.toJSON()),
        });

        if (savedButtons.length > 0) {
          const { saveCustomButtons } = await import('../utils/buttonPersistence.js');

          for (const buttonId of savedButtons) {
            const button = existingButtons.get(buttonId);
            if (button) {
              button.messageId = message.id;
            }
          }

          await saveCustomButtons(existingButtons);
          Logger.info(`💾 ${savedButtons.length} boutons persistés pour le message ${message.id}`);
        }

        return `✅ Boutons créés | ID: ${message.id} | ${savedButtons.length > 0 ? `${savedButtons.length} persistés` : 'sans persistance'}`;
      } catch (error: any) {
        Logger.error('❌ [create_custom_buttons]', error.message);
        return `❌ Erreur: ${error.message}`;
      }
    },
  });

  // 2. Appuyer sur un bouton
  server.addTool({
    name: 'appuyer_bouton',
    description: 'Appuie sur un bouton personnalisé',
    parameters: AppuyerBoutonSchema,
    execute: async args => {
      try {
        console.error(`🔘 [appuyer_bouton] Message: ${args.messageId}, Button: ${args.buttonCustomId}`);
        const client = await ensureDiscordConnection();
        const channel = await client.channels.fetch(args.channelId);

        if (!channel || !('messages' in channel)) {
          throw new Error('Canal invalide');
        }

        const message = await channel.messages.fetch(args.messageId);

        if (!message.components || !message.components.length) {
          return `❌ Ce message n'a pas de boutons`;
        }

        const buttons = message.components
          .flatMap((row: any) => row.components)
          .filter((c: any) => c.type === 2);

        const button = buttons.find((b: any) => b.customId === args.buttonCustomId);

        if (!button) {
          return `❌ Bouton non trouvé (Custom ID: ${args.buttonCustomId})`;
        }

        const reactionEmoji = button.emoji || '✅';
        await message.react(reactionEmoji);

        if ('send' in channel) {
          await channel.send({
            content: `🔘 Bouton actionné: **${button.label}** (${args.buttonCustomId})`,
            embeds: [],
          });
        }

        return `✅ Bouton actionné: ${args.buttonCustomId} (${button.label})`;
      } catch (error: any) {
        console.error(`❌ [appuyer_bouton]`, error.message);
        return `❌ Erreur: ${error.message}`;
      }
    },
  });

  // 3. Lister les boutons actifs
  server.addTool({
    name: 'lister_boutons_actifs',
    description: 'Liste tous les boutons personnalisés actifs avec leur état',
    parameters: ListerBoutonsActifsSchema,
    execute: async args => {
      try {
        const { loadCustomButtons } = await import('../utils/buttonPersistence.js');
        const buttons = await loadCustomButtons();

        let filteredButtons = Array.from(buttons.values());

        if (args.channelId) {
          filteredButtons = filteredButtons.filter(btn => btn.channelId === args.channelId);
        }

        if (filteredButtons.length === 0) {
          return `📋 Aucun bouton actif${args.channelId ? ` dans le canal ${args.channelId}` : ''}`;
        }

        const now = new Date();
        const list = filteredButtons.map(button => {
          const createdAt = new Date(button.createdAt);
          const hoursDiff = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);
          const status = hoursDiff > 24 ? '⏰ Expiré' : '✅ Actif';
          const age = Math.floor(hoursDiff);

          return `
• **${button.label}** (${status})
  🆔 ID: ${button.id}
  💬 Canal: ${button.channelId}
  📨 Message: ${button.messageId || 'Non envoyé'}
  ⏱️ Âge: ${age}h
  🔧 Action: ${button.action.type}
          `.trim();
        }).join('\n\n');

        return `📋 ${filteredButtons.length} bouton(s) trouvé(s):\n\n${list}`;
      } catch (error: any) {
        Logger.error('❌ [lister_boutons_actifs]', error.message);
        return `❌ Erreur: ${error.message}`;
      }
    },
  });

  // 4. Supprimer un bouton personnalisé
  server.addTool({
    name: 'supprimer_bouton_perso',
    description: 'Supprime un bouton personnalisé du système de persistance',
    parameters: SupprimerBoutonPersoSchema,
    execute: async args => {
      try {
        const { loadCustomButtons, deleteCustomButton } = await import('../utils/buttonPersistence.js');
        const buttons = await loadCustomButtons();

        const button = buttons.get(args.buttonId);
        if (!button) {
          return `❌ Bouton non trouvé: ${args.buttonId}`;
        }

        await deleteCustomButton(args.buttonId, buttons);

        return `✅ Bouton supprimé: ${button.label} (${args.buttonId})`;
      } catch (error: any) {
        Logger.error('❌ [supprimer_bouton_perso]', error.message);
        return `❌ Erreur: ${error.message}`;
      }
    },
  });

  // 5. Nettoyer les anciens boutons
  server.addTool({
    name: 'nettoyer_anciens_boutons',
    description: 'Supprime tous les boutons de plus de 24h',
    parameters: NettoyerAnciensBoutonsSchema,
    execute: async () => {
      try {
        const { loadCustomButtons, cleanOldButtons } = await import('../utils/buttonPersistence.js');
        const buttons = await loadCustomButtons();

        const deletedCount = await cleanOldButtons(buttons);

        return `🧹 Nettoyage terminé. ${deletedCount} ancien(s) bouton(s) supprimé(s)`;
      } catch (error: any) {
        Logger.error('❌ [nettoyer_anciens_boutons]', error.message);
        return `❌ Erreur: ${error.message}`;
      }
    },
  });

  // 6. Enregistrer une fonction de bouton
  server.addTool({
    name: 'enregistrer_fonction_bouton',
    description: 'Enregistre une fonction personnalisée qui sera exécutée quand un bouton est cliqué',
    parameters: EnregistrerFonctionBoutonSchema,
    execute: async args => {
      try {
        const func = async (interaction: any, buttonData: any) => {
          const { EmbedBuilder, ButtonStyle, ActionRowBuilder, ButtonBuilder } = require('discord.js');
          eval(`(async () => { ${args.code} })()`);
        };

        const { registerButtonFunction } = await import('../discord-bridge.js');
        registerButtonFunction(args.buttonId, func);

        Logger.info(`✅ Fonction enregistrée pour le bouton: ${args.buttonId}`);
        return `✅ Fonction enregistrée avec succès pour le bouton ${args.buttonId}${args.description ? `\nDescription: ${args.description}` : ''}`;
      } catch (error: any) {
        Logger.error('❌ [enregistrer_fonction_bouton]', error.message);
        return `❌ Erreur lors de l'enregistrement: ${error.message}`;
      }
    },
  });

  // 7. Créer un bouton avancé
  server.addTool({
    name: 'creer_bouton_avance',
    description: 'Crée un bouton avec une fonction personnalisée complexe',
    parameters: CreerBoutonAvanceSchema,
    execute: async args => {
      try {
        const client = await ensureDiscordConnection();
        const channel = await client.channels.fetch(args.channelId);

        if (!channel || !('send' in channel)) {
          throw new Error('Canal invalide ou inaccessible');
        }

        const buttonId = args.buttonId || `btn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        const func = async (interaction: any, buttonData: any) => {
          const { EmbedBuilder, ButtonStyle, ActionRowBuilder, ButtonBuilder } = require('discord.js');
          eval(`(async () => { ${args.functionCode} })()`);
        };

        const { registerButtonFunction } = await import('../discord-bridge.js');
        registerButtonFunction(buttonId, func);

        const styleMap = {
          Primary: 1,
          Secondary: 2,
          Success: 3,
          Danger: 4,
        };

        const button = new ButtonBuilder()
          .setLabel(args.buttonLabel)
          .setCustomId(buttonId)
          .setStyle(styleMap[args.buttonStyle as keyof typeof styleMap]);

        const row = new ActionRowBuilder<ButtonBuilder>().addComponents(button);

        const message = await channel.send({
          content: args.content,
          components: [row],
        });

        try {
          const { loadCustomButtons, addCustomButton } = await import('../utils/buttonPersistence.js');
          const buttons = await loadCustomButtons();
          await addCustomButton({
              id: buttonId,
              messageId: message.id,
              channelId: args.channelId,
              label: args.buttonLabel,
              action: { type: 'custom', data: {} },
              functionCode: args.functionCode,
              createdAt: new Date()
          }, buttons);
          Logger.info(`💾 Bouton avancé persisté: ${buttonId}`);
        } catch (err) {
          Logger.error('❌ Erreur persistance bouton:', err);
        }

        Logger.info(`✅ Bouton avancé créé: ${buttonId} - Message: ${message.id}`);
        return `✅ Bouton avancé créé | ID: ${message.id} | Bouton: ${buttonId}`;
      } catch (error: any) {
        Logger.error('❌ [creer_bouton_avance]', error.message);
        return `❌ Erreur: ${error.message}`;
      }
    },
  });

  // 8. Lister les fonctions de boutons
  server.addTool({
    name: 'lister_fonctions_boutons',
    description: 'Liste toutes les fonctions personnalisées enregistrées',
    parameters: ListerFonctionsBoutonsSchema,
    execute: async () => {
      try {
        const { listButtonFunctions } = await import('../discord-bridge.js');
        const functions = listButtonFunctions();

        if (functions.length === 0) {
          return '📋 Aucune fonction personnalisée enregistrée';
        }

        return `📋 ${functions.length} fonction(s) personnalisée(s) enregistrées:\n\n${functions.map(f => `• ${f}`).join('\n')}`;
      } catch (error: any) {
        Logger.error('❌ [lister_fonctions_boutons]', error.message);
        return `❌ Erreur: ${error.message}`;
      }
    },
  });

  // 9. Créer un menu déroulant
  server.addTool({
    name: 'create_custom_menu',
    description: 'Crée un menu déroulant',
    parameters: CreateCustomMenuSchema,
    execute: async args => {
      try {
        const client = await ensureDiscordConnection();
        const channel = await client.channels.fetch(args.channelId);

        if (!channel || !('send' in channel)) {
          throw new Error('Canal invalide ou inaccessible');
        }

        const menu = new StringSelectMenuBuilder()
          .setCustomId(`menu_${Date.now()}`)
          .setPlaceholder('Sélectionnez une option...');

        args.options.forEach(opt => {
          const menuOption = new StringSelectMenuOptionBuilder()
            .setLabel(opt.label)
            .setValue(opt.value);

          if (opt.description) {
            menuOption.setDescription(opt.description);
          }

          menu.addOptions(menuOption);
        });

        const row = new ActionRowBuilder();
        row.addComponents(menu);

        const message = await channel.send({
          content: args.content,
          components: [row.toJSON()],
        });

        return `✅ Menu créé | ID: ${message.id}`;
      } catch (error: any) {
        return `❌ Erreur: ${error.message}`;
      }
    },
  });

  // 10. Sélectionner un menu
  server.addTool({
    name: 'selectionner_menu',
    description: 'Sélectionne une option dans un menu déroulant',
    parameters: SelectionnerMenuSchema,
    execute: async args => {
      try {
        console.error(`📋 [selectionner_menu] Message: ${args.messageId}, Menu: ${args.menuCustomId}, Value: ${args.value}`);
        const client = await ensureDiscordConnection();
        const channel = await client.channels.fetch(args.channelId);

        if (!channel || !('messages' in channel)) {
          throw new Error('Canal invalide');
        }

        const message = await channel.messages.fetch(args.messageId);

        if (!message.components || !message.components.length) {
          return `❌ Ce message n'a pas de menu déroulant`;
        }

        const menus = message.components
          .flatMap((row: any) => row.components)
          .filter((c: any) => c.type === 3);

        const menu = menus.find((m: any) => m.customId === args.menuCustomId);

        if (!menu) {
          return `❌ Menu non trouvé (Custom ID: ${args.menuCustomId}). Menus disponibles: ${menus.map((m: any) => m.customId).join(', ')}`;
        }

        const selectedOption = menu.options.find((opt: any) => opt.value === args.value);

        if (!selectedOption) {
          return `❌ Option non trouvée (${args.value}). Options disponibles: ${menu.options.map((opt: any) => opt.value).join(', ')}`;
        }

        await message.react('📋');

        if ('send' in channel) {
          await channel.send({
            content: `📋 Menu sélectionné: **${selectedOption.label}** (valeur: ${args.value})`,
            embeds: [],
          });
        }

        return `✅ Sélection effectuée: ${args.value} (${selectedOption.label})`;
      } catch (error: any) {
        console.error(`❌ [selectionner_menu]`, error.message);
        return `❌ Erreur: ${error.message}`;
      }
    },
  });

  // 11. Créer un menu persistant
  server.addTool({
    name: 'creer_menu_persistant',
    description: 'Crée un menu déroulant persistant avec actions personnalisées',
    parameters: CreerMenuPersistantSchema,
    execute: async args => {
      try {
        const client = await ensureDiscordConnection();
        const channel = await client.channels.fetch(args.channelId);

        if (!channel || !('send' in channel)) {
          throw new Error('Canal invalide ou inaccessible');
        }

        const { loadCustomMenus, addCustomMenu } = await import('../utils/menuPersistence.js');

        const menuId = args.menuId || `menu_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const customId = `select_${menuId}`;

        const menu = new StringSelectMenuBuilder()
          .setCustomId(customId)
          .setPlaceholder(args.placeholder || 'Sélectionnez une option...')
          .setMinValues(args.minValues)
          .setMaxValues(args.maxValues);

        args.options.forEach(opt => {
          const option = new StringSelectMenuOptionBuilder()
            .setLabel(opt.label)
            .setValue(opt.value);

          if (opt.description) option.setDescription(opt.description);
          if (opt.emoji) option.setEmoji(opt.emoji);

          menu.addOptions(option);
        });

        const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(menu);

        const message = await channel.send({
          content: args.content,
          components: [row],
        });

        const existingMenus = await loadCustomMenus();
        const customMenu: CustomMenu = {
          id: menuId,
          messageId: message.id,
          channelId: args.channelId,
          customId,
          placeholder: args.placeholder || 'Sélectionnez une option...',
          minValues: args.minValues,
          maxValues: args.maxValues,
          options: args.options as any,
          action: {
            type: args.action.type,
            data: args.action.data || {},
          },
          multipleSelections: args.maxValues > 1,
          createdAt: new Date(),
          creatorId: 'SYSTEM',
          isActive: true,
        };

        await addCustomMenu(customMenu, existingMenus);

        Logger.info(`✅ Menu persistant créé: ${menuId} - Message: ${message.id}`);
        return `✅ Menu persistant créé | ID: ${message.id} | Menu: ${menuId} | Options: ${args.options.length}`;
      } catch (error: any) {
        Logger.error('❌ [creer_menu_persistant]', error.message);
        return `❌ Erreur: ${error.message}`;
      }
    },
  });

  // 12. Lister les menus actifs
  server.addTool({
    name: 'lister_menus_actifs',
    description: 'Liste tous les menus déroulants persistants avec leur état',
    parameters: ListerMenusActifsSchema,
    execute: async args => {
      try {
        const { loadCustomMenus } = await import('../utils/menuPersistence.js');
        const menus = await loadCustomMenus();

        let filteredMenus = Array.from(menus.values());

        if (args.channelId) {
          filteredMenus = filteredMenus.filter(menu => menu.channelId === args.channelId);
        }

        if (filteredMenus.length === 0) {
          return `📋 Aucun menu actif${args.channelId ? ` dans le canal ${args.channelId}` : ''}`;
        }

        const now = new Date();
        const list = filteredMenus.map(menu => {
          const createdAt = new Date(menu.createdAt);
          const hoursDiff = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);
          const status = !menu.isActive ? '❌ Inactif' : hoursDiff > 24 ? '⏰ Expiré' : '✅ Actif';
          const age = Math.floor(hoursDiff);

          return `
• **${menu.placeholder}** (${status})
  🆔 ID: ${menu.id}
  🎯 CustomId: ${menu.customId}
  💬 Canal: ${menu.channelId}
  📨 Message: ${menu.messageId || 'Non envoyé'}
  ⏱️ Âge: ${age}h
  🔧 Action: ${menu.action.type}
  📊 Options: ${menu.options.length} (sélection${menu.maxValues > 1 ? 's' : ''}: ${menu.minValues}-${menu.maxValues})
          `.trim();
        }).join('\n\n');

        return `📋 ${filteredMenus.length} menu(s) trouvé(s):\n\n${list}`;
      } catch (error: any) {
        Logger.error('❌ [lister_menus_actifs]', error.message);
        return `❌ Erreur: ${error.message}`;
      }
    },
  });
}
