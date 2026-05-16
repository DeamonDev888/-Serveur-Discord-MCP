import {
  Client,
  GatewayIntentBits,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
} from 'discord.js';
import { bridgeLogger, logger } from './logger.js';
import { interactionHandler } from './utils/interactionHandler.js';

// ============================================================================
// MODE AUTO-HANDLER - Répond automatiquement aux boutons/menus sans handler
// ============================================================================

// Activer/désactiver le mode auto-handler (répond automatiquement aux interactions orphelines)
export const AUTO_HANDLER_ENABLED = true;

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
  type:
    | 'message'
    | 'embed'
    | 'role'
    | 'react'
    | 'command'
    | 'url'
    | 'delete'
    | 'edit'
    | 'modal'
    | 'custom';
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
  private tokenInvalid = false;

  // Anti rate-limit. Without backoff, successive failed logins hammer Discord
  // gateway and trigger a Cloudflare 1015 ban on this IP. Each failure doubles
  // the wait (1s → 2s → 4s → ... cap 5min). Reset to 0 on first successful
  // ready event.
  private failedAttempts = 0;
  private retryAfter = 0; // epoch ms — earliest next attempt
  private static readonly LOGIN_TIMEOUT_MS = 60_000;
  private static readonly BACKOFF_BASE_MS = 5_000;  // 5s minimum (was 1s)
  private static readonly BACKOFF_MAX_MS = 30 * 60_000; // 30min max (was 5min)
  private static readonly CIRCUIT_BREAK_FILE = './data/circuit-breaker.json';
  private static readonly MAX_FAILURES_BEFORE_CIRCUIT = 10;
  private circuitBreakerTripped = false;

  private constructor(token: string) {
    this.token = token;
  }

  static getInstance(token: string): DiscordBridge {
    if (!DiscordBridge.instance) {
      bridgeLogger.debug('🔍 [TRACE] Creating new DiscordBridge instance');
      DiscordBridge.instance = new DiscordBridge(token);
    } else if (DiscordBridge.instance.token !== token) {
      bridgeLogger.warn('⚠️ [Bridge] Token changed, updating instance');
      DiscordBridge.instance.destroy();
      DiscordBridge.instance = new DiscordBridge(token);
    }
    return DiscordBridge.instance;
  }

  /**
   * Reset the tokenInvalid flag and allow new connection attempts.
   * Useful if the .env was updated or if the error was transient.
   */
  public resetTokenInvalid(): void {
    bridgeLogger.info('🔄 [Bridge] Resetting tokenInvalid circuit-breaker');
    this.tokenInvalid = false;
    this.connectionPromise = null;
    this.failedAttempts = 0;
    this.retryAfter = 0;
  }

  /**
   * Reset circuit breaker - call after user manually fixes the issue
   */
  public resetCircuitBreaker(): void {
    this.circuitBreakerTripped = false;
    this.failedAttempts = 0;
    this.retryAfter = 0;
    this.clearCircuitBreakerFile();
    bridgeLogger.info('🔄 [Bridge] Circuit breaker reset - normal operation resumed');
  }

  private persistCircuitBreaker(): void {
    try {
      const fs = require('fs');
      const path = require('path');
      const filePath = path.join(process.cwd(), 'data', 'circuit-breaker.json');
      const dir = path.dirname(filePath);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(filePath, JSON.stringify({
        tripped: true,
        timestamp: Date.now(),
        failures: this.failedAttempts,
      }));
    } catch (err) {
      bridgeLogger.error({ err }, '❌ [Bridge] Failed to persist circuit breaker');
    }
  }

  private loadCircuitBreaker(): void {
    try {
      const fs = require('fs');
      const path = require('path');
      const filePath = path.join(process.cwd(), 'data', 'circuit-breaker.json');
      if (fs.existsSync(filePath)) {
        const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        this.circuitBreakerTripped = data.tripped || false;
        if (this.circuitBreakerTripped) {
          bridgeLogger.warn('⚠️ [Bridge] Circuit breaker was tripped previously. Connection blocked until reset.');
        }
      }
    } catch (err) {
      // File doesn't exist or is corrupted - no circuit breaker active
    }
  }

  private clearCircuitBreakerFile(): void {
    try {
      const fs = require('fs');
      const path = require('path');
      const filePath = path.join(process.cwd(), 'data', 'circuit-breaker.json');
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (err) {
      // Ignore errors
    }
  }

  async getClient(): Promise<Client> {
    bridgeLogger.debug('🔍 [TRACE] getClient called');
    if (this.tokenInvalid) {
      throw new Error('TokenInvalid: Discord token is flagged as invalid. Use reset_discord_connection tool to retry.');
    }
    if (this.circuitBreakerTripped) {
      throw new Error('CircuitBreakerTripped: Discord connection blocked due to repeated failures. Restart required.');
    }
    if (this.client && this.client.isReady()) {
      bridgeLogger.debug('🚀 [Bridge] Client already ready - immediate use');
      return this.client;
    }

    if (this.connectionPromise) {
      bridgeLogger.debug('⏳ [Bridge] Connection in progress - waiting...');
      return this.connectionPromise;
    }

    // Anti rate-limit: refuse fast if we're still in backoff window.
    const now = Date.now();
    if (now < this.retryAfter) {
      const waitSec = Math.ceil((this.retryAfter - now) / 1000);
      throw new Error(
        `RateLimitBackoff: Discord login backoff active for ${waitSec}s more (failed attempts: ${this.failedAttempts}).`,
      );
    }

    this.connectionPromise = this.createConnection();
    return this.connectionPromise;
  }

  private async createConnection(): Promise<Client> {
    bridgeLogger.info('🔗 [Bridge] Creating new Discord connection...');

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
    await this.rehydrateButtonFunctions().catch(err =>
      bridgeLogger.error({ err }, '❌ [Bridge] Rehydration error')
    );

    const onFailure = (err: any, label: string) => {
      this.connectionPromise = null;
      this.failedAttempts++;
      const waitMs = Math.min(
        DiscordBridge.BACKOFF_BASE_MS * Math.pow(2, Math.max(0, this.failedAttempts - 1)),
        DiscordBridge.BACKOFF_MAX_MS,
      );
      this.retryAfter = Date.now() + waitMs;

      // Circuit breaker: after MAX_FAILURES, stop all attempts permanently
      if (this.failedAttempts >= DiscordBridge.MAX_FAILURES_BEFORE_CIRCUIT) {
        this.circuitBreakerTripped = true;
        this.persistCircuitBreaker();
        bridgeLogger.fatal(
          { attempts: this.failedAttempts },
          `🔴 [Bridge] CIRCUIT BREAKER TRIPPED after ${this.failedAttempts} failures. Discord connection BLOCKED. Restart required to reset.`,
        );
        return; // Don't even try to reconnect anymore
      }

      bridgeLogger.error(
        { err, attempts: this.failedAttempts, nextRetryInSec: Math.ceil(waitMs / 1000), circuitBreaker: `${this.failedAttempts}/${DiscordBridge.MAX_FAILURES_BEFORE_CIRCUIT}` },
        `❌ [Bridge] ${label} — backoff ${Math.ceil(waitMs / 1000)}s before next attempt`,
      );
    };

    // Load persisted circuit breaker state on startup
    this.loadCircuitBreaker();

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        onFailure(null, `Timeout connexion ${DiscordBridge.LOGIN_TIMEOUT_MS / 1000}s`);
        reject(new Error(`Timeout de connexion Discord (${DiscordBridge.LOGIN_TIMEOUT_MS / 1000}s)`));
      }, DiscordBridge.LOGIN_TIMEOUT_MS);

      this.client!.once('clientReady', () => {
        clearTimeout(timeout);
        this.isConnected = true;
        this.failedAttempts = 0;
        this.retryAfter = 0;
        bridgeLogger.info({ user: this.client!.user!.tag }, '✅ [Bridge] Connected');
        resolve(this.client!);
      });

      this.client!.once('error', (err) => {
        clearTimeout(timeout);
        onFailure(err, 'Discord error');
        reject(err);
      });

      this.client!.once('warn', (warning) => {
        bridgeLogger.warn({ warning }, '⚠️ [Bridge] Discord warning');
      });

      this.client!.login(this.token).catch((err) => {
        clearTimeout(timeout);
        if (err.code === 'TokenInvalid' || (err.message && err.message.includes('invalid token'))) {
          this.tokenInvalid = true;
          this.connectionPromise = null;
          bridgeLogger.fatal('🔴 [Bridge] INVALID TOKEN — circuit-breaker activated. No new connection attempts.');
        } else {
          onFailure(err, 'Login error');
        }
        reject(err);
      });
    });
  }

  // Recharger les fonctions personnalisées depuis la persistance
  private async rehydrateButtonFunctions(): Promise<void> {
    try {
      const { loadCustomButtons } = await import('./utils/buttonPersistence.js');
      const buttons = await loadCustomButtons();
      let count = 0;

      for (const [id, button] of buttons.entries()) {
        if (button.functionCode) {
          const func = async (interaction: any) => {
            try {
              // Reconstruire le contexte (ctx) identique à celui de registerButtonFunctions
              const context = {
                channelId: interaction.channelId,
                messageId: interaction.message.id,
                user: interaction.user,
                customId: interaction.customId,
              };

              const ctx = {
                interaction,
                channelId: context.channelId,
                messageId: context.messageId,
                user: context.user,
                buttonId: context.customId,
                client: interaction.client,
                // Fonctions utilitaires
                reply: async (content: string, ephemeral: boolean = true) => {
                  if (!interaction.replied && !interaction.deferred) {
                    await interaction.reply({ content, ephemeral });
                  }
                },
                update: async (data: any) => {
                  if (!interaction.replied && !interaction.deferred) {
                    await interaction.update(data);
                  }
                },
                deferReply: async (ephemeral: boolean = true) => {
                  if (!interaction.deferred) {
                    await interaction.deferReply({ ephemeral });
                  }
                },
                followUp: async (content: string, ephemeral: boolean = true) => {
                  await interaction.followUp({ content, ephemeral });
                },
                editReply: async (data: any) => {
                  return await interaction.editReply(data);
                },
                updateEmbed: async (data: any) => {
                  return await interaction.editReply(data);
                },
                sendEmbed: async (embed: any, ephemeral: boolean = false) => {
                  if (interaction.deferred || interaction.replied) {
                    await interaction.followUp({ embeds: [embed], ephemeral });
                  } else {
                    await interaction.reply({ embeds: [embed], ephemeral });
                  }
                },

                sendMessage: async (content: string) => {
                  const channel = await interaction.client.channels.fetch(context.channelId);
                  if (channel && 'send' in channel) {
                    await channel.send(content);
                  }
                },
                getMessage: async () => {
                  const channel = await interaction.client.channels.fetch(context.channelId);
                  if (channel && 'messages' in channel) {
                    return await channel.messages.fetch(context.messageId);
                  }
                },
                // SAUVEGARDE DE VOTE/DONNÉES
                saveVote: async (voteType: string, details: string = '') => {
                  const { VoteManager } = await import('./utils/voteManager.js');
                  await VoteManager.saveVote(voteType, context.user, context.channelId, details);
                },
                getVoteCounts: async () => {
                  const { VoteManager } = await import('./utils/voteManager.js');
                  return await VoteManager.getVoteCounts();
                },
              };

              // Exécuter le code avec le contexte
              const asyncFunction = new Function(
                'ctx',
                `
                        return (async () => {
                            try {
                                ${button.functionCode}
                            } catch (e) {
                                throw e;
                            }
                        })();
                    `
              );

              await asyncFunction(ctx);
            } catch (err: any) {
              bridgeLogger.error({ err, id }, `❌ Error in persisted function`);
              if (!interaction.replied && !interaction.deferred) {
                await interaction
                  .reply({ content: `❌ Error: ${err.message}`, ephemeral: true })
                  .catch(() => {});
              } else {
                await interaction
                  .followUp({ content: `❌ Error: ${err.message}`, ephemeral: true })
                  .catch(() => {});
              }
            }
          };
          buttonFunctions.set(id, func);
          count++;
        }
      }
      if (count > 0)
        bridgeLogger.info({ count }, '♻️ [Bridge] Rehydrated button functions from persistence');
    } catch (err) {
      bridgeLogger.error({ err }, '❌ [Bridge] Rehydration failed');
    }
  }

  /**
   * Configurer les gestionnaires d'interactions
   */
  private setupInteractionHandlers(): void {
    if (!this.client) return;

    // Gestionnaire principal des interactions
    this.client.on('interactionCreate', async interaction => {
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
      } catch (err: any) {
        bridgeLogger.error({ err }, '❌ [Bridge] Interaction error');

        // Répondre à l'utilisateur si possible
        if (!interaction.isAutocomplete()) {
          const int = interaction as any;
          if (!int.replied && !int.deferred) {
            await int
              .reply({
                content: '❌ Une erreur est survenue lors du traitement de votre interaction.',
                ephemeral: true,
              })
              .catch(() => {});
          }
        }
      }
    });

    bridgeLogger.info('✅ [Bridge] Interaction handlers configured');
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

    // 🔥 VÉRIFIER L'ÉTAT DE L'INTERACTION dès le début
    bridgeLogger.debug({
      replied: interaction.replied,
      deferred: interaction.deferred
    }, '🔍 [Bridge] Interaction state');

    // Si l'interaction est déjà acquittée, ne rien faire
    if (interaction.replied || interaction.deferred) {
      bridgeLogger.debug('🔄 [Bridge] Interaction already acknowledged, ignoring');
      return;
    }

    bridgeLogger.info({ customId, user: user.username }, '🔘 [Bridge] Button clicked');

    // 🔥 ACQUITTER immédiatement pour éviter l'expiration de l'interaction
    // deferUpdate() est fait pour les boutons (update du message au lieu de nouvelle réponse)
    if (!interaction.replied && !interaction.deferred) {
      try {
        await interaction.deferUpdate();
        bridgeLogger.debug('⏱️ [Bridge] deferUpdate() successful');
      } catch (err) {
        bridgeLogger.error({ err }, '❌ [Bridge] deferUpdate failed');
        // Continue execution even if defer fails (could be already handled in edge cases)
      }
    }

    // 1. GESTION DIRECTE des boutons custom avec embed/message (priorité MAXIMALE)
    // On traite TOUS les boutons connus (embedv2_, pb_, et custom_id personnalisés)
    bridgeLogger.debug('🔍 [Bridge] Loading custom buttons from persistence...');

    // Charger les boutons customs (buttons.json)
    const { loadCustomButtons } = await import('./utils/buttonPersistence.js');
    const buttons = await loadCustomButtons();

    // Charger les boutons persistants (dist/data/persistent-buttons.json)
    const { getPersistentButton } = await import('./utils/distPersistence.js');
    const persistentBtn = await getPersistentButton(customId); // C'est ici que la MAGIE opère (lecture disque fraîche)

    bridgeLogger.debug({ count: buttons.size }, '🔍 [Bridge] Custom buttons loaded');
    bridgeLogger.debug({ customId, found: !!persistentBtn }, '🔍 [Bridge] Persistent button search');

    // Fusionner la logique : on prend soit le custom, soit le persistant
    let button: any = buttons.get(customId);
    if (!button && persistentBtn) {
      // Adapter le format pour qu'il ressemble à un bouton custom pour la suite du code
      button = {
        id: persistentBtn.id,
        action: persistentBtn.action, // Action est déjà objet complet {type: 'message', content: ...}
        label: persistentBtn.label,
        channelId: persistentBtn.channelId,
      };
      bridgeLogger.debug({ customId }, '🔍 [Bridge] Using persistent configuration');
    }

    bridgeLogger.debug({ customId, result: button ? 'FOUND' : 'NOT_FOUND' }, '🔍 [Bridge] Final button search result');

    if (button) {
      bridgeLogger.debug({ button: JSON.stringify(button).substring(0, 500) }, '🔍 [Bridge] Button structure');

      // 🔥 CORRECTION: Détecter les actions custom avec différentes structures
      let actionData = null;
      let isActionEmbed = false;

      bridgeLogger.debug({ type: button.action?.type }, `🔍 [Bridge] Action type`);

      // Structure 1: Boutons standards (embedv2_) avec action.data
      if (button.action?.type === 'custom' && button.action?.data) {
        actionData = button.action.data;
        bridgeLogger.debug('🔍 [Bridge] Structure 1 detected (action.data)');
      }
      // Structure 2: Boutons persistants (pb_) avec action.embed/action.message
      else if (button.action?.type === 'embed' || button.action?.type === 'message') {
        actionData = button.action;
        isActionEmbed = button.action.type === 'embed';
        bridgeLogger.debug('🔍 [Bridge] Structure 2 detected (direct action)');
      }

      if (actionData) {
        bridgeLogger.debug('🔍 [Bridge] Custom action detected with data!');
        wasHandled = true; // 🔥 MARQUER comme géré pour éviter l'auto-handler

        // Envoyer embed si disponible
        if (isActionEmbed || actionData.embed) {
          bridgeLogger.debug(`🔍 [Bridge] Envoi embed custom...`);
          const embedData = isActionEmbed ? actionData.embed : actionData.embed;
          if (embedData) {
            const embedBuilder = new EmbedBuilder()
              .setTitle(embedData.title || 'Réponse')
              .setDescription(embedData.description || '')
              .setColor(embedData.color || 0x00ff00);

            if (embedData.timestamp !== false) {
              embedBuilder.setTimestamp();
            }

            try {
              // 🔥 RÉPONSE avec editReply() ou followUp()
              const isEphemeral =
                (isActionEmbed ? actionData.ephemeral : actionData.ephemeral) !== false;
              const visibility = actionData.visibility || (isEphemeral ? 'author' : 'all');
              const finalEphemeral = visibility === 'author';

              let response;
              if (finalEphemeral) {
                // Réponse éphémère : utiliser followUp()
                response = await interaction.followUp({
                  embeds: [embedBuilder],
                  ephemeral: true,
                });
                bridgeLogger.info({ customId }, '✅ [Bridge] Ephemeral embed response sent');
              } else {
                // Réponse publique : utiliser followUp() aussi
                response = await interaction.followUp({
                  embeds: [embedBuilder],
                });
                bridgeLogger.info({ customId }, '✅ [Bridge] Public embed response sent');
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
                      bridgeLogger.debug({ customId }, '🗑️ [Bridge] Response auto-deleted');
                    } else if (!autoDeleteReply) {
                      // Supprimer le message original
                      const originalMessage = interaction.message;
                      if (originalMessage) {
                        await originalMessage.delete();
                        bridgeLogger.debug({ customId }, '🗑️ [Bridge] Original message auto-deleted');
                      }
                    }
                  } catch (err) {
                    bridgeLogger.debug({ err }, '⚠️ [Bridge] Could not delete');
                  }
                }, autoDelete * 1000);
                bridgeLogger.debug({ autoDelete }, '⏰ [Bridge] Auto-delete scheduled');
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
                    bridgeLogger.debug(`🔒 [Bridge] Bouton désactivé (réponse éphémère)`);
                  }
                } catch (e) {
                  bridgeLogger.debug({ err: e }, `⚠️ [Bridge] Impossible de désactiver le bouton:`);
                }
              } else {
                bridgeLogger.debug(`🔄 [Bridge] Bouton laissé actif (réponse publique - multi-click)`);
              }

              return; // Terminé - on a répondu
            } catch (err: any) {
              bridgeLogger.error({ err }, '❌ [Bridge] Embed response error');
            }
          }
        }
        // Envoyer message si disponible
        else if (actionData.message || actionData.content) {
          bridgeLogger.debug(`🔍 [Bridge] Envoi message custom...`);
          try {
            // 🔥 RÉPONSE avec followUp()
            const message = (actionData.message || actionData.content || '').replace(
              '{user}',
              user.username
            );
            const isEphemeral =
              (isActionEmbed ? actionData.ephemeral : actionData.ephemeral) !== false;
            const visibility = actionData.visibility || (isEphemeral ? 'author' : 'all');
            const finalEphemeral = visibility === 'author';

            let response;
            if (finalEphemeral) {
              response = await interaction.followUp({
                content: message,
                ephemeral: true,
              });
              bridgeLogger.info({ customId }, '✅ [Bridge] Ephemeral message response sent');
            } else {
              response = await interaction.followUp({
                content: message,
              });
              bridgeLogger.info({ customId }, '✅ [Bridge] Public message response sent');
            }

            // 🕐 AUTO-SUPPRESSION après délai si configuré
            const autoDelete = actionData.autoDelete;
            const autoDeleteReply = actionData.autoDeleteReply !== false;
            if (autoDelete && autoDelete > 0) {
              setTimeout(async () => {
                try {
                  if (autoDeleteReply && !finalEphemeral && response) {
                    await response.delete();
                    bridgeLogger.debug({ customId }, '🗑️ [Bridge] Response auto-deleted');
                  } else if (!autoDeleteReply) {
                    const originalMessage = interaction.message;
                    if (originalMessage) {
                      await originalMessage.delete();
                      bridgeLogger.debug({ customId }, '🗑️ [Bridge] Original message auto-deleted');
                    }
                  }
                } catch (err) {
                  bridgeLogger.debug({ err }, '⚠️ [Bridge] Could not delete');
                }
              }, autoDelete * 1000);
              bridgeLogger.debug({ autoDelete }, '⏰ [Bridge] Auto-delete scheduled');
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
                  bridgeLogger.debug(`🔒 [Bridge] Bouton désactivé (réponse éphémère)`);
                }
              } catch (e) {
                bridgeLogger.debug({ err: e }, `⚠️ [Bridge] Impossible de désactiver le bouton`);
              }
            } else {
              bridgeLogger.debug(`🔄 [Bridge] Bouton laissé actif (réponse publique - multi-click)`);
            }

            return; // Terminé - on a répondu
          } catch (err: any) {
            bridgeLogger.error({ err }, '❌ [Bridge] Message response error');
          }
        }
      } else {
        bridgeLogger.debug({ customId }, `🔍 [Bridge] No custom action detected for this button`);
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
      bridgeLogger.debug({ customId }, '🔄 [Bridge] interactionHandler skipped for embedv2_/pb_ button');
    }

    // 🔥 HOT RELOAD: Exécution dynamique du code depuis le disque (Priorité sur le cache mémoire)
    // N'exécuter que si pas encore géré par une action automatique (message/embed)
    if (button && button.functionCode && !wasHandled) {
      bridgeLogger.info({ customId }, '⚡ [Hot-Reload] Executing fresh code');
      try {
        // Reconstruire le contexte (ctx) identique à celui de registerButtonFunctions
        const ctx = {
          interaction,
          channelId: interaction.channelId,
          messageId: interaction.message.id,
          user: interaction.user,
          client: interaction.client, // Ensure client is passed
          buttonId: interaction.customId,
          // Fonctions utilitaires
          reply: async (content: string, ephemeral: boolean = true) => {
            if (interaction.deferred || interaction.replied) {
              await interaction.followUp({ content, ephemeral });
            } else {
              try {
                await interaction.reply({ content, ephemeral });
              } catch (e: any) {
                if (e.code === 40060) await interaction.followUp({ content, ephemeral });
                else throw e;
              }
            }
          },
          update: async (data: any) => {
            if (interaction.deferred || interaction.replied) {
              await interaction.editReply(data);
            } else {
              try {
                await interaction.update(data);
              } catch (e: any) {
                if (e.code === 40060) await interaction.editReply(data);
                else throw e;
              }
            }
          },
          deferReply: async (ephemeral: boolean = true) => {
            if (!interaction.deferred && !interaction.replied) {
              try {
                await interaction.deferReply({ ephemeral });
              } catch (e: any) {
                if (e.code !== 40060) throw e;
              }
            }
          },
          followUp: async (content: string, ephemeral: boolean = true) => {
            if (interaction.deferred || interaction.replied) {
              await interaction.followUp({ content, ephemeral });
            } else {
              // Fallback to reply if not acknowledged
              try {
                await interaction.reply({ content, ephemeral });
              } catch (e: any) {
                if (e.code === 40060) await interaction.followUp({ content, ephemeral });
                else throw e;
              }
            }
          },
          editReply: async (data: any) => {
            return await interaction.editReply(data);
          },
          updateEmbed: async (data: any) => {
            return await interaction.editReply(data);
          },
          sendEmbed: async (embed: any, ephemeral: boolean = false) => {
            if (interaction.deferred || interaction.replied) {
              await interaction.followUp({ embeds: [embed], ephemeral });
            } else {
              await interaction.reply({ embeds: [embed], ephemeral });
            }
          },
          sendMessage: async (content: string) => {
            const channel = await interaction.client.channels.fetch(interaction.channelId);
            if (channel && 'send' in channel) {
              await channel.send(content);
            }
          },
          getMessage: async () => {
            const channel = await interaction.client.channels.fetch(interaction.channelId);
            if (channel && 'messages' in channel) {
              return await channel.messages.fetch(interaction.message.id);
            }
          },
          saveVote: async (voteType: string, details: string = '') => {
            const { VoteManager } = await import('./utils/voteManager.js');
            await VoteManager.saveVote(voteType, interaction.user, interaction.channelId, details);
          },
          getVoteCounts: async () => {
            const { VoteManager } = await import('./utils/voteManager.js');
            return await VoteManager.getVoteCounts();
          },
        };

        // Exécuter le code avec le contexte
        const asyncFunction = new Function(
          'ctx',
          `
                return (async () => {
                    try {
                        ${button.functionCode}
                    } catch (e) {
                        throw e;
                    }
                })();
             `
        );

        await asyncFunction(ctx);
        wasHandled = true;
      } catch (err: any) {
        bridgeLogger.error({ err, customId }, '❌ [Hot-Reload] Execution error');
        if (!interaction.replied && !interaction.deferred) {
          await interaction
            .reply({ content: `❌ Error: ${err.message}`, ephemeral: true })
            .catch(() => {});
        }
      }
    }
    // Fallback sur mémoire si pas de bouton disque (peu probable si customFunction existe)
    else {
      const customFunction = buttonFunctions.get(customId);
      if (customFunction) {
        try {
          await customFunction(interaction, { customId, user, channelId, messageId });
          wasHandled = true;
        } catch (err: any) {
          bridgeLogger.error({ err, customId }, '❌ [Bridge] Button function error');
        }
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
          ephemeral: true,
        });
        bridgeLogger.info({ customId }, '🤖 [Auto-Handler] Auto-response sent');
        wasHandled = true;
      } catch (err: any) {
        bridgeLogger.error({ err }, '❌ [Auto-Handler] Auto-response error');

        // Fallback: deferUpdate en cas d'erreur de reply
        if (!interaction.replied && !interaction.deferred) {
          await interaction.deferUpdate().catch(() => {});
        }
      }
    }

    // FALLBACK ABSOLU: Répondre à l'interaction pour éviter le timeout (si rien n'a été fait)
    if (!wasHandled && !interaction.replied && !interaction.deferred) {
      bridgeLogger.warn(
        `⚠️ [Bridge] Aucune réponse envoyé pour ${customId}, utilisation du fallback deferUpdate`
      );
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

    bridgeLogger.info(`📋 [Bridge] Menu sélectionné: ${customId} par ${user.username}`);

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
          ephemeral: true,
        });
        bridgeLogger.info(`🤖 [Auto-Handler] Réponse automatique envoyée pour le menu: ${customId}`);
        wasHandled = true;
      } catch (error: any) {
        bridgeLogger.error({ err: error }, `❌ [Auto-Handler] Erreur réponse automatique`);
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

    bridgeLogger.info(`📝 [Bridge] Modal soumis: ${customId} par ${user.username}`);

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
    bridgeLogger.info(`⚡ [Bridge] Commande slash: ${commandName} par ${interaction.user.username}`);
    // TODO: Implémenter les commandes slash si nécessaire
  }

  async destroy(): Promise<void> {
    if (this.client && this.isConnected) {
      this.client.destroy();
      this.isConnected = false;
      this.connectionPromise = null;
      bridgeLogger.info('🧹 [Bridge] Client détruit');
    }
  }
}

/**
 * Enregistrer une fonction personnalisée pour un bouton
 */
export function registerButtonFunction(customId: string, func: ButtonFunction): void {
  buttonFunctions.set(customId, func);
  bridgeLogger.info(`📝 [Bridge] Fonction enregistrée pour le bouton: ${customId}`);
}

/**
 * Supprimer une fonction personnalisée
 */
export function unregisterButtonFunction(customId: string): boolean {
  const deleted = buttonFunctions.delete(customId);
  if (deleted) {
    bridgeLogger.info(`🗑️ [Bridge] Fonction supprimée pour le bouton: ${customId}`);
  }
  return deleted;
}

/**
 * Lister toutes les fonctions enregistrées
 */
export function listButtonFunctions(): string[] {
  return Array.from(buttonFunctions.keys());
}
