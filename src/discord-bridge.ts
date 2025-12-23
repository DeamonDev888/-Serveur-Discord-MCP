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
      DiscordBridge.instance = new DiscordBridge(token);
    }
    return DiscordBridge.instance;
  }

  async getClient(): Promise<Client> {
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

      this.client!.once('clientReady', () => {
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

    Logger.info(`🔘 [Bridge] Bouton cliqué: ${customId} par ${user.username}`);

    // Si c'est un bouton RPG, on court-circuite le gestionnaire classique pour plus de rapidité
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

    // Sinon, comportement classique : d'abord le gestionnaire d'interactions existant
    const wasHandledByHandler = await interactionHandler.handleCustomButton({
      customId,
      user: { id: user.id, username: user.username },
      channelId,
      messageId,
    });

    if (wasHandledByHandler) {
      wasHandled = true;
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
    if (AUTO_HANDLER_ENABLED && !wasHandled && !interaction.replied && !interaction.deferred) {
      try {
        await interaction.reply({
          content: AUTO_RESPONSES.button(customId, user.username),
          ephemeral: true
        });
        Logger.info(`🤖 [Auto-Handler] Réponse automatique envoyée pour le bouton: ${customId}`);
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