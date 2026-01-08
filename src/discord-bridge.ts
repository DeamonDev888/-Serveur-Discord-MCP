import { Client, GatewayIntentBits, InteractionType, ButtonStyle, EmbedBuilder, ActionRowBuilder, ButtonBuilder } from 'discord.js';
import Logger from './utils/logger.js';
import { interactionHandler } from './utils/interactionHandler.js';

// ============================================================================
// MODE AUTO-HANDLER - Répond automatiquement aux boutons/menus sans handler
// ============================================================================

// Activer/désactiver le mode auto-handler (répond automatiquement aux interactions orphelines)
export let AUTO_HANDLER_ENABLED = true;

// Messages de réponse automatique
const AUTO_RESPONSES = {
  button: (customId: string, username: string) =>
    `✅ **Bouton cliqué !**\n\n🔘 ID: \`${customId}\`\n👤 Par: **${username}**\n\n> Pour ajouter une action personnalisée, utilisez \`enregistrer_fonction_bouton\``,

  menu: (customId: string, username: string, values: string[]) =>
    `✅ **Menu sélectionné !**\n\n📋 ID: \`${customId}\`\n👤 Par: **${username}**\n🎯 Choix: ${values.map(v => `\`${v}\``).join(', ')}\n\n> Pour ajouter une action personnalisée, utilisez \`enregistrer_fonction_bouton\``,
};

// ============================================================================

// Types d'actions personnalisées pour les boutons
export type ButtonAction = {
  type: 'message' | 'embed' | 'role' | 'react' | 'command' | 'url' | 'delete' | 'edit' | 'modal' | 'custom';
  data?: any;
};

export type ButtonFunction = (interaction: any, buttonData: any) => Promise<void>;

// Registre des fonctions personnalisées
const buttonFunctions = new Map<string, ButtonFunction>();

// Pool de connexions Discord pour éviter les timeouts MCP
export class DiscordBridge {
  private static instance: DiscordBridge;
  private client: Client | null = null;
  private connectionPromise: Promise<Client> | null = null;
  private isConnected = false;
  private readonly token: string;

  private constructor(token: string) {
    this.token = token;
  }

  static getInstance(token: string): DiscordBridge {
    if (!DiscordBridge.instance) {
      Logger.debug('🔍 [TRACE] Creating new DiscordBridge instance');
      DiscordBridge.instance = new DiscordBridge(token);
    }
    return DiscordBridge.instance;
  }

  async getClient(): Promise<Client> {
    Logger.debug('🔍 [TRACE] getClient called');
    if (this.client && this.client.isReady()) {
      Logger.debug('🚀 [Bridge] Client déjà prêt - utilisation immédiate');
      return this.client;
    }

    if (this.connectionPromise) {
      Logger.debug('⏳ [Bridge] Connexion en cours - attente...');
      return this.connectionPromise;
    }

    this.connectionPromise = this.createConnection();
    return this.connectionPromise;
  }

  private async createConnection(): Promise<Client> {
    Logger.info('🔗 [Bridge] Création nouvelle connexion Discord...');

    this.client = new Client({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMessageReactions,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildEmojisAndStickers,
        GatewayIntentBits.GuildWebhooks,
      ],
      // Configuration par défaut (stable)
    });

    // Ajouter le gestionnaire d'interactions
    this.setupInteractionHandlers();

    // Recharger les fonctions de boutons persistantes
    await this.rehydrateButtonFunctions().catch(err => Logger.error('❌ [Bridge] Erreur rehydration:', err));

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        Logger.error('❌ [Bridge] Timeout connexion 20s');
        this.connectionPromise = null;
        reject(new Error('Timeout de connexion Discord (20s)'));
      }, 20000);

      this.client!.once('ready', () => {
        clearTimeout(timeout);
        this.isConnected = true;
        Logger.info(`✅ [Bridge] Connecté: ${this.client!.user!.tag}`);
        resolve(this.client!);
      });

      this.client!.once('error', error => {
        clearTimeout(timeout);
        this.connectionPromise = null;
        Logger.error('❌ [Bridge] Erreur Discord:', error.message);
        reject(error);
      });

      this.client!.once('warn', warning => {
        Logger.warn('⚠️ [Bridge] Avertissement Discord:', warning);
      });

      this.client!.login(this.token).catch(error => {
        clearTimeout(timeout);
        this.connectionPromise = null;
        Logger.error('❌ [Bridge] Erreur login:', error.message);
        reject(error);
      });
    });
  }

  /**
   * Recharger les fonctions personnalisées depuis la persistance
   */
  private async rehydrateButtonFunctions(): Promise<void> {
    try {
        const { loadCustomButtons } = await import('./utils/buttonPersistence.js');
        const buttons = await loadCustomButtons();
        let count = 0;

        for (const [id, button] of buttons.entries()) {
            if (button.functionCode) {
                const func = async (interaction: any, buttonData: any) => {
                    const { EmbedBuilder, ButtonStyle, ActionRowBuilder, ButtonBuilder } = await import('discord.js');
                    // Recréer le contexte pour eval
                    const executionContext = `(async () => { ${button.functionCode} })()`;
                    try {
                        await eval(executionContext);
                    } catch (e) {
                        Logger.error(`❌ Erreur dans la fonction persistée ${id}:`, e);
                    }
                };
                buttonFunctions.set(id, func);
                count++;
            }
        }
        if (count > 0) Logger.info(`♻️ [Bridge] ${count} fonctions de boutons rechargées depuis la persistance`);
    } catch (err) {
        Logger.error('❌ [Bridge] Erreur lors de la rehydration des fonctions:', err);
    }
  }

  /**
   * Configurer les gestionnaires d'interactions
   */
  private setupInteractionHandlers(): void {
    if (!this.client) return;

    // Gestionnaire principal des interactions
    this.client.on('interactionCreate', async (interaction) => {
      try {
        // Boutons
        if (interaction.isButton()) {
          await this.handleButtonInteraction(interaction);
        }
        // Menus déroulants
        else if (interaction.isStringSelectMenu()) {
          await this.handleSelectMenuInteraction(interaction);
        }
        // Modals
        else if (interaction.isModalSubmit()) {
          await this.handleModalSubmit(interaction);
        }
        // Commandes slash (si activées)
        else if (interaction.isChatInputCommand()) {
          await this.handleSlashCommand(interaction);
        }
      } catch (error: any) {
        Logger.error('❌ [Bridge] Erreur interaction:', error.message);

        // Répondre à l'utilisateur si possible
        if (!interaction.isAutocomplete()) {
          const int = interaction as any;
          if (!int.replied && !int.deferred) {
            await int.reply({
              content: '❌ Une erreur est survenue lors du traitement de votre interaction.',
              ephemeral: true
            }).catch(() => {});
          }
        }
      }
    });

    Logger.info('✅ [Bridge] Gestionnaire d\'interactions configuré');
  }

  /**
   * Gérer les interactions de boutons
   */
  private async handleButtonInteraction(interaction: any): Promise<void> {
    const customId = interaction.customId;
    const user = interaction.user;
    const channelId = interaction.channelId;
    const messageId = interaction.message.id;
    let wasHandled = false;
    let deferred = false; // 🔥 Suivre si on a déjà fait deferReply

    // 🔥 VÉRIFIER L'ÉTAT DE L'INTERACTION dès le début
    Logger.debug(`🔍 [Bridge] État interaction - replied: ${interaction.replied}, deferred: ${interaction.deferred}`);

    // Si l'interaction est déjà acquittée, ne rien faire
    if (interaction.replied || interaction.deferred) {
      Logger.debug(`🔄 [Bridge] Interaction déjà acquittée, ignorée`);
      return;
    }

    Logger.info(`🔘 [Bridge] Bouton cliqué: ${customId} par ${user.username}`);

    // 🔥 ACQUITTER immédiatement pour éviter l'expiration de l'interaction
    // deferUpdate() est fait pour les boutons (update du message au lieu de nouvelle réponse)
    try {
      await interaction.deferUpdate();
      Logger.debug(`⏱️ [Bridge] deferUpdate() effectué`);
    } catch (e) {
      Logger.error(`❌ [Bridge] Erreur deferUpdate:`, e);
      return; // Interaction expirée, on ne peut rien faire
    }

    // 1. GESTION DIRECTE des boutons custom avec embed/message (priorité MAXIMALE)
    // On traite TOUS les boutons connus (embedv2_, pb_, et custom_id personnalisés)
    Logger.debug(`🔍 [Bridge] Chargement des boutons custom depuis la persistance...`);

    // Charger les boutons depuis la persistance pour TOUS les custom_id
    const { loadCustomButtons } = await import('./utils/buttonPersistence.js');
    const buttons = await loadCustomButtons();
    Logger.debug(`🔍 [Bridge] Boutons chargés: ${buttons.size} boutons`);
    Logger.debug(`🔍 [Bridge] IDs disponibles:`, Array.from(buttons.keys()).slice(0, 10).join(', '));

    const button = buttons.get(customId);
    Logger.debug(`🔍 [Bridge] Bouton ${customId} trouvé:`, button ? 'OUI' : 'NON');

    if (button) {
        Logger.debug(`🔍 [Bridge] Structure du bouton:`, JSON.stringify(button, null, 2).substring(0, 500));

        // 🔥 CORRECTION: Détecter les actions custom avec différentes structures
        let actionData = null;
        let isActionEmbed = false;

        Logger.debug(`🔍 [Bridge] Type d'action: ${button.action?.type}`);

        // Structure 1: Boutons standards (embedv2_) avec action.data
        if (button.action?.type === 'custom' && button.action?.data) {
            actionData = button.action.data;
            Logger.debug(`🔍 [Bridge] Structure 1 détectée (action.data)`);
            Logger.debug(`🔍 [Bridge] Données:`, JSON.stringify(actionData, null, 2).substring(0, 300));
        }
        // Structure 2: Boutons persistants (pb_) avec action.embed/action.message
        else if (button.action?.type === 'embed' || button.action?.type === 'message') {
            actionData = button.action;
            isActionEmbed = button.action.type === 'embed';
            Logger.debug(`🔍 [Bridge] Structure 2 détectée (action directe)`);
            Logger.debug(`🔍 [Bridge] Type: ${button.action.type}`);
        }

        if (actionData) {
            Logger.debug(`🔍 [Bridge] Action custom détectée avec données!`);
            wasHandled = true; // 🔥 MARQUER comme géré pour éviter l'auto-handler

            // Envoyer embed si disponible
            if (isActionEmbed || actionData.embed) {
                Logger.debug(`🔍 [Bridge] Envoi embed custom...`);
                const embedData = isActionEmbed ? actionData.embed : actionData.embed;
                if (embedData) {
                    const embedBuilder = new EmbedBuilder()
                        .setTitle(embedData.title || 'Réponse')
                        .setDescription(embedData.description || '')
                        .setColor(embedData.color || 0x00FF00);

                    if (embedData.timestamp !== false) {
                        embedBuilder.setTimestamp();
                    }

                    try {
                        // 🔥 RÉPONSE avec editReply() ou followUp()
                        const isEphemeral = (isActionEmbed ? actionData.ephemeral : actionData.ephemeral) !== false;
                        const visibility = actionData.visibility || (isEphemeral ? 'author' : 'all');
                        const finalEphemeral = visibility === 'author';

                        let response;
                        if (finalEphemeral) {
                            // Réponse éphémère : utiliser followUp()
                            response = await interaction.followUp({
                                embeds: [embedBuilder],
                                ephemeral: true
                            });
                            Logger.info(`✅ [Bridge] Réponse embed éphémère envoyée pour ${customId}`);
                        } else {
                            // Réponse publique : utiliser followUp() aussi
                            response = await interaction.followUp({
                                embeds: [embedBuilder]
                            });
                            Logger.info(`✅ [Bridge] Réponse embed publique envoyée pour ${customId}`);
                        }

                        // 🕐 AUTO-SUPPRESSION après délai si configuré
                        const autoDelete = actionData.autoDelete;
                        const autoDeleteReply = actionData.autoDeleteReply !== false;
                        if (autoDelete && autoDelete > 0) {
                            setTimeout(async () => {
                                try {
                                    if (autoDeleteReply && !finalEphemeral && response) {
                                        // Supprimer la réponse publique
                                        await response.delete();
                                        Logger.debug(`🗑️ [Bridge] Réponse auto-supprimée après ${autoDelete}s`);
                                    } else if (!autoDeleteReply) {
                                        // Supprimer le message original
                                        const originalMessage = interaction.message;
                                        if (originalMessage) {
                                            await originalMessage.delete();
                                            Logger.debug(`🗑️ [Bridge] Message original auto-supprimé après ${autoDelete}s`);
                                        }
                                    }
                                } catch (e) {
                                    Logger.debug(`⚠️ [Bridge] Impossible de supprimer:`, e);
                                }
                            }, autoDelete * 1000);
                            Logger.debug(`⏰ [Bridge] Auto-suppression programmée dans ${autoDelete}s`);
                        }

                        // 🔥 DÉSACTIVER LE BOUTON uniquement si réponse ÉPHÉMÈRE
                        if (finalEphemeral) {
                            try {
                              const originalMessage = interaction.message;
                              if (originalMessage && originalMessage.components) {
                                const newRows = originalMessage.components.map((row: any) => {
                                  const actionRow = new ActionRowBuilder();
                                  row.components.forEach((btn: any) => {
                                    const newBtn = new ButtonBuilder()
                                      .setCustomId(btn.customId)
                                      .setLabel(btn.label)
                                      .setStyle(btn.style)
                                      .setDisabled(true);
                                    if (btn.emoji) newBtn.setEmoji(btn.emoji);
                                    actionRow.addComponents(newBtn);
                                  });
                                  return actionRow;
                                });
                                await originalMessage.edit({ components: newRows });
                                Logger.debug(`🔒 [Bridge] Bouton désactivé (réponse éphémère)`);
                              }
                            } catch (e) {
                              Logger.debug(`⚠️ [Bridge] Impossible de désactiver le bouton:`, e);
                            }
                        } else {
                            Logger.debug(`🔄 [Bridge] Bouton laissé actif (réponse publique - multi-click)`);
                        }

                        return; // Terminé - on a répondu
                    } catch (e: any) {
                        Logger.error(`❌ [Bridge] Erreur réponse embed:`, e.message);
                    }
                }
            }
            // Envoyer message si disponible
            else if (actionData.message || actionData.content) {
                Logger.debug(`🔍 [Bridge] Envoi message custom...`);
                try {
                    // 🔥 RÉPONSE avec followUp()
                    const message = (actionData.message || actionData.content || '').replace('{user}', user.username);
                    const isEphemeral = (isActionEmbed ? actionData.ephemeral : actionData.ephemeral) !== false;
                    const visibility = actionData.visibility || (isEphemeral ? 'author' : 'all');
                    const finalEphemeral = visibility === 'author';

                    let response;
                    if (finalEphemeral) {
                        response = await interaction.followUp({
                            content: message,
                            ephemeral: true
                        });
                        Logger.info(`✅ [Bridge] Réponse message éphémère envoyée pour ${customId}`);
                    } else {
                        response = await interaction.followUp({
                            content: message
                        });
                        Logger.info(`✅ [Bridge] Réponse message publique envoyée pour ${customId}`);
                    }

                    // 🕐 AUTO-SUPPRESSION après délai si configuré
                    const autoDelete = actionData.autoDelete;
                    const autoDeleteReply = actionData.autoDeleteReply !== false;
                    if (autoDelete && autoDelete > 0) {
                        setTimeout(async () => {
                            try {
                                if (autoDeleteReply && !finalEphemeral && response) {
                                    await response.delete();
                                    Logger.debug(`🗑️ [Bridge] Réponse auto-supprimée après ${autoDelete}s`);
                                } else if (!autoDeleteReply) {
                                    const originalMessage = interaction.message;
                                    if (originalMessage) {
                                        await originalMessage.delete();
                                        Logger.debug(`🗑️ [Bridge] Message original auto-supprimé après ${autoDelete}s`);
                                    }
                                }
                            } catch (e) {
                                Logger.debug(`⚠️ [Bridge] Impossible de supprimer:`, e);
                            }
                        }, autoDelete * 1000);
                        Logger.debug(`⏰ [Bridge] Auto-suppression programmée dans ${autoDelete}s`);
                    }

                    // 🔥 DÉSACTIVER LE BOUTON uniquement si réponse ÉPHÉMÈRE
                    if (finalEphemeral) {
                        try {
                          const originalMessage = interaction.message;
                          if (originalMessage && originalMessage.components) {
                            const newRows = originalMessage.components.map((row: any) => {
                              const actionRow = new ActionRowBuilder();
                              row.components.forEach((btn: any) => {
                                const newBtn = new ButtonBuilder()
                                  .setCustomId(btn.customId)
                                  .setLabel(btn.label)
                                  .setStyle(btn.style)
                                  .setDisabled(true);
                                if (btn.emoji) newBtn.setEmoji(btn.emoji);
                                actionRow.addComponents(newBtn);
                              });
                              return actionRow;
                            });
                            await originalMessage.edit({ components: newRows });
                            Logger.debug(`🔒 [Bridge] Bouton désactivé (réponse éphémère)`);
                          }
                        } catch (e) {
                          Logger.debug(`⚠️ [Bridge] Impossible de désactiver le bouton:`, e);
                        }
                    } else {
                        Logger.debug(`🔄 [Bridge] Bouton laissé actif (réponse publique - multi-click)`);
                    }

                    return; // Terminé - on a répondu
                } catch (e: any) {
                    Logger.error(`❌ [Bridge] Erreur réponse message:`, e.message);
                }
            }
        } else {
            Logger.debug(`🔍 [Bridge] Pas d'action custom détectée pour ce bouton`);
        }
    }

    // 2. Boutons RPG (court-circuit pour performance)
    if (customId.startsWith('rpg_')) {
        const customFunction = buttonFunctions.get(customId);
        if (customFunction) {
            try {
                await customFunction(interaction, { customId, user, channelId, messageId });
                wasHandled = true;
            } catch (error: any) {
                Logger.error(`❌ [Bridge] Erreur RPG ${customId}:`, error.message);
            }
            return; // Terminé pour le RPG
        }
    }

    // Note: Tous les boutons connus (y compris custom_id personnalisés) sont déjà gérés ci-dessus
    // dans interactionHandler.handleCustomButton

    // 3. Comportement classique : d'abord le gestionnaire d'interactions existant
    // 🔥 SAUTER interactionHandler pour les boutons déjà gérés ci-dessus (ceux trouvés dans buttonPersistence)
    if (!wasHandled) {
      const wasHandledByHandler = await interactionHandler.handleCustomButton({
        customId,
        user: { id: user.id, username: user.username },
        channelId,
        messageId,
      });

      if (wasHandledByHandler) {
        wasHandled = true;
      }
    } else {
      Logger.debug(`🔄 [Bridge] interactionHandler sauté pour bouton embedv2_/pb_`);
    }

    // Puis les fonctions personnalisées génériques
    const customFunction = buttonFunctions.get(customId);
    if (customFunction) {
      try {
        await customFunction(interaction, { customId, user, channelId, messageId });
        wasHandled = true;
      } catch (error: any) {
        Logger.error(`❌ [Bridge] Erreur fonction bouton ${customId}:`, error.message);
      }
    }

    // AUTO-HANDLER: Répondre automatiquement si aucun handler n'a répondu
    // 🔥 NOUVEAU: Activer l'auto-handler pour TOUS les boutons, y compris embedv2_/pb_
    // pour éviter les "Unknown interaction"
    if (AUTO_HANDLER_ENABLED && !wasHandled && !interaction.replied && !interaction.deferred) {
      try {
        // Message de réponse intelligent selon le type de bouton
        let responseContent = AUTO_RESPONSES.button(customId, user.username);

        // Personnaliser la réponse pour les boutons embedv2_
        if (customId.startsWith('embedv2_')) {
          responseContent = `✅ **Bouton embed cliqué !**\n\n🔘 ID: \`${customId}\`\n👤 Par: **${user.username}**\n\n💡 Ce bouton fait partie d'un embed créé avec l'outil \`creer_embed\`. Pour ajouter une action personnalisée, utilisez \`enregistrer_fonction_bouton\`.`;
        } else if (customId.startsWith('pb_')) {
          responseContent = `✅ **Bouton persistant cliqué !**\n\n🔘 ID: \`${customId}\`\n👤 Par: **${user.username}**\n\n💾 Ce bouton est persistant et sauvegardé.`;
        }

        await interaction.reply({
          content: responseContent,
          ephemeral: true
        });
        Logger.info(`🤖 [Auto-Handler] Réponse automatique envoyée pour le bouton: ${customId}`);
        wasHandled = true;
      } catch (error: any) {
        Logger.error(`❌ [Auto-Handler] Erreur réponse automatique:`, error.message);

        // Fallback: deferUpdate en cas d'erreur de reply
        if (!interaction.replied && !interaction.deferred) {
          await interaction.deferUpdate().catch(() => {});
        }
      }
    }

    // FALLBACK ABSOLU: Répondre à l'interaction pour éviter le timeout (si rien n'a été fait)
    if (!wasHandled && !interaction.replied && !interaction.deferred) {
      Logger.warn(`⚠️ [Bridge] Aucune réponse envoyé pour ${customId}, utilisation du fallback deferUpdate`);
      await interaction.deferUpdate().catch(() => {});
    }
  }

  /**
   * Gérer les interactions de menus déroulants
   */
  private async handleSelectMenuInteraction(interaction: any): Promise<void> {
    const customId = interaction.customId;
    const values = interaction.values;
    const user = interaction.user;
    let wasHandled = false;

    Logger.info(`📋 [Bridge] Menu sélectionné: ${customId} par ${user.username}`);

    const wasHandledByHandler = await interactionHandler.handleSelectMenu({
      customId,
      values,
      user: {
        id: user.id,
        username: user.username,
      },
      channelId: interaction.channelId,
      messageId: interaction.message.id,
    });

    if (wasHandledByHandler) {
      wasHandled = true;
    }

    // AUTO-HANDLER: Répondre automatiquement si aucun handler n'a répondu
    if (AUTO_HANDLER_ENABLED && !wasHandled && !interaction.replied && !interaction.deferred) {
      try {
        await interaction.reply({
          content: AUTO_RESPONSES.menu(customId, user.username, values),
          ephemeral: true
        });
        Logger.info(`🤖 [Auto-Handler] Réponse automatique envoyée pour le menu: ${customId}`);
        wasHandled = true;
      } catch (error: any) {
        Logger.error(`❌ [Auto-Handler] Erreur réponse automatique:`, error.message);
      }
    }

    // Répondre à l'interaction pour éviter le timeout (si rien n'a été fait)
    if (!wasHandled && !interaction.replied && !interaction.deferred) {
      await interaction.deferUpdate().catch(() => {});
    }
  }

  /**
   * Gérer les soumissions de modals
   */
  private async handleModalSubmit(interaction: any): Promise<void> {
    const customId = interaction.customId;
    const fields = interaction.fields;
    const user = interaction.user;

    Logger.info(`📝 [Bridge] Modal soumis: ${customId} par ${user.username}`);

    await interactionHandler.handleModalSubmit({
      customId,
      fields: Object.fromEntries(fields.fields.map((field: any) => [field.customId, field.value])),
      user: {
        id: user.id,
        username: user.username,
      },
      channelId: interaction.channelId,
      messageId: interaction.message?.id,
    });

    if (!interaction.replied && !interaction.deferred) {
      await interaction.deferUpdate().catch(() => {});
    }
  }

  /**
   * Gérer les commandes slash
   */
  private async handleSlashCommand(interaction: any): Promise<void> {
    const commandName = interaction.commandName;
    Logger.info(`⚡ [Bridge] Commande slash: ${commandName} par ${interaction.user.username}`);
    // TODO: Implémenter les commandes slash si nécessaire
  }

  async destroy(): Promise<void> {
    if (this.client && this.isConnected) {
      this.client.destroy();
      this.isConnected = false;
      this.connectionPromise = null;
      Logger.info('🧹 [Bridge] Client détruit');
    }
  }
}

/**
 * Enregistrer une fonction personnalisée pour un bouton
 */
export function registerButtonFunction(customId: string, func: ButtonFunction): void {
  buttonFunctions.set(customId, func);
  Logger.info(`📝 [Bridge] Fonction enregistrée pour le bouton: ${customId}`);
}

/**
 * Supprimer une fonction personnalisée
 */
export function unregisterButtonFunction(customId: string): boolean {
  const deleted = buttonFunctions.delete(customId);
  if (deleted) {
    Logger.info(`🗑️ [Bridge] Fonction supprimée pour le bouton: ${customId}`);
  }
  return deleted;
}

/**
 * Lister toutes les fonctions enregistrées
 */
export function listButtonFunctions(): string[] {
  return Array.from(buttonFunctions.keys());
}
