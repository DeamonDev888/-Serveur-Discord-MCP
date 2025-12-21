import { loadPolls, savePolls } from './pollPersistence.js';
import { loadCustomButtons, saveCustomButtons } from './buttonPersistence.js';
import { loadCustomMenus, saveCustomMenus, saveMenuSelection } from './menuPersistence.js';
import Logger from './logger.js';

/**
 * Gestionnaire principal des interactions Discord
 */
export class InteractionHandler {
  private polls: Map<string, any> = new Map();
  private buttons: Map<string, any> = new Map();
  private menus: Map<string, any> = new Map();

  constructor() {
    this.initialize();
  }

  private async initialize() {
    // Charger les données persistées
    this.polls = await loadPolls();
    this.buttons = await loadCustomButtons();
    this.menus = await loadCustomMenus();
    Logger.info("✅ Gestionnaire d'interactions initialisé");
    Logger.info(`   • ${this.polls.size} sondages chargés`);
    Logger.info(`   • ${this.buttons.size} boutons chargés`);
    Logger.info(`   • ${this.menus.size} menus chargés`);
  }

  /**
   * Traiter une interaction de sondage
   */
  async handlePollInteraction(data: any): Promise<void> {
    const { pollId, action, user, channelId, messageId } = data;

    Logger.info(`🎯 Traitement interaction sondage: ${action} par ${user.username}`);

    // Récupérer le sondage
    let poll = this.polls.get(pollId) || this.polls.get(`poll_${pollId}`);
    if (!poll) {
      Logger.warn(`❌ Sondage non trouvé: ${pollId}`);
      return;
    }

    // Vérifier si le sondage est terminé
    if (poll.ended) {
      Logger.debug('❌ Sondage déjà terminé');
      return;
    }

    // Vérifier si le sondage a expiré
    if (new Date() > new Date(poll.endTime)) {
      poll.ended = true;
      await savePolls(this.polls);
      Logger.info('⏰ Sondage expiré');
      return;
    }

    switch (action) {
      case 'end':
        await this.endPoll(poll, channelId, messageId);
        break;

      case 'results':
        await this.showPollResults(poll, channelId);
        break;

      default:
        // C'est un vote (action = index de l'option)
        const optionIndex = parseInt(action);
        if (isNaN(optionIndex) || optionIndex < 0 || optionIndex >= poll.options.length) {
          Logger.warn(`❌ Index d'option invalide: ${action}`);
          return;
        }
        await this.handleVote(poll, optionIndex, user, channelId, messageId);
        break;
    }

    // Sauvegarder les changements
    await savePolls(this.polls);
  }

  /**
   * Gérer un vote
   */
  private async handleVote(
    poll: any,
    optionIndex: number,
    user: any,
    channelId: string,
    messageId: string
  ): Promise<void> {
    Logger.debug(`🗳️ Vote de ${user.username} pour l'option ${optionIndex}`);

    // TODO: Implémenter la vérification des votes multiples
    // Pour l'instant, on incrémente simplement le compteur

    poll.options[optionIndex].votes += 1;
    poll.totalVotes += 1;

    // Recalculer les pourcentages
    poll.options.forEach((option: any) => {
      option.percentage = poll.totalVotes > 0 ? (option.votes / poll.totalVotes) * 100 : 0;
    });

    Logger.info(`✅ Vote enregistré. Total: ${poll.totalVotes}`);

    // Envoyer confirmation à Discord
    this.sendToDiscord({
      action: 'update_poll_message',
      channelId,
      messageId,
      poll: {
        id: poll.id,
        question: poll.question,
        options: poll.options,
        totalVotes: poll.totalVotes,
        endTime: poll.endTime,
        ended: poll.ended,
        allowMultiple: poll.allowMultiple,
        anonymous: poll.anonymous,
      },
    });
  }

  /**
   * Terminer un sondage
   */
  private async endPoll(poll: any, channelId: string, messageId: string): Promise<void> {
    Logger.info('🏁 Terminaison du sondage');

    poll.ended = true;

    // Trouver le gagnant
    const winner = poll.options.reduce((prev: any, current: any) =>
      prev.votes > current.votes ? prev : current
    );

    Logger.info(`🏆 Gagnant: ${winner.text} avec ${winner.votes} votes`);

    // Envoyer message de fin à Discord
    this.sendToDiscord({
      action: 'end_poll',
      channelId,
      messageId,
      poll: {
        id: poll.id,
        question: poll.question,
        options: poll.options,
        totalVotes: poll.totalVotes,
        endTime: poll.endTime,
        ended: poll.ended,
        allowMultiple: poll.allowMultiple,
        anonymous: poll.anonymous,
      },
      winner: winner.text,
    });
  }

  /**
   * Afficher les résultats d'un sondage
   */
  private async showPollResults(poll: any, channelId: string): Promise<void> {
    Logger.info('📊 Affichage des résultats');

    // Envoyer les résultats à Discord
    this.sendToDiscord({
      action: 'show_poll_results',
      channelId,
      poll: {
        id: poll.id,
        question: poll.question,
        options: poll.options,
        totalVotes: poll.totalVotes,
        endTime: poll.endTime,
        ended: poll.ended,
        allowMultiple: poll.allowMultiple,
        anonymous: poll.anonymous,
      },
    });
  }

  /**
   * Traiter un clic sur un bouton personnalisé
   */
  async handleCustomButton(data: any): Promise<void> {
    const { customId, user, channelId, messageId } = data;

    Logger.info(`🔘 Bouton personnalisé cliqué: ${customId} par ${user.username}`);

    // Récupérer la configuration du bouton
    const button = this.buttons.get(customId);
    if (!button) {
      Logger.warn(`❌ Bouton non trouvé: ${customId}`);
      this.sendToDiscord({
        action: 'button_error',
        channelId,
        messageId,
        error: 'Bouton non trouvé dans la base de données',
        customId,
      });
      return;
    }

    // Vérifier si le bouton a expiré
    const createdAt = new Date(button.createdAt);
    const now = new Date();
    const hoursDiff = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);

    if (hoursDiff > 24) {
      Logger.info('⏰ Bouton expiré (TTL 24h)');
      this.buttons.delete(customId);
      await saveCustomButtons(this.buttons);

      this.sendToDiscord({
        action: 'button_expired',
        channelId,
        messageId,
        customId,
        label: button.label,
      });
      return;
    }

    // Exécuter l'action du bouton
    Logger.info(`✅ Exécution de l'action: ${button.action.type}`);

    try {
      await this.executeButtonAction(button.action, {
        button,
        user,
        channelId,
        messageId,
      });

      // Envoyer une confirmation à Discord
      this.sendToDiscord({
        action: 'button_success',
        channelId,
        messageId,
        customId,
        label: button.label,
        actionType: button.action.type,
        user: {
          id: user.id,
          username: user.username,
        },
      });
    } catch (error: any) {
      Logger.error(`❌ Erreur lors de l'exécution du bouton: ${error.message}`);

      this.sendToDiscord({
        action: 'button_error',
        channelId,
        messageId,
        error: error.message,
        customId,
        label: button.label,
      });
    }
  }

  /**
   * Exécuter une action de bouton
   */
  private async executeButtonAction(action: any, context: any): Promise<void> {
    const { button, user, channelId, messageId } = context;

    switch (action.type) {
      case 'message':
        // Envoyer un message prédéfini
        if (action.data?.message) {
          this.sendToDiscord({
            action: 'send_message',
            channelId,
            content: action.data.message.replace('{user}', user.username),
          });
        }
        break;

      case 'embed':
        // Envoyer un embed
        if (action.data?.embed) {
          this.sendToDiscord({
            action: 'send_embed',
            channelId,
            embed: {
              ...action.data.embed,
              // Remplacer les placeholders
              title: action.data.embed.title?.replace('{user}', user.username),
              description: action.data.embed.description?.replace('{user}', user.username),
            },
          });
        }
        break;

      case 'role':
        // Donner/retirer un rôle (nécessite des permissions admin)
        if (action.data?.roleId) {
          this.sendToDiscord({
            action: 'toggle_role',
            channelId,
            userId: user.id,
            roleId: action.data.roleId,
            roleAction: action.data.action || 'add', // 'add', 'remove', 'toggle'
          });
        }
        break;

      case 'react':
        // Ajouter une réaction au message
        if (action.data?.emoji) {
          this.sendToDiscord({
            action: 'add_reaction',
            channelId,
            messageId,
            emoji: action.data.emoji,
          });
        }
        break;

      case 'command':
        // Exécuter une commande personnalisée
        if (action.data?.command) {
          Logger.info(`🔧 Commande personnalisée: ${action.data.command}`);
          // TODO: Implémenter un système de commandes personnalisées
        }
        break;

      case 'url':
        // Ouvrir une URL (via embed ou message)
        if (action.data?.url) {
          this.sendToDiscord({
            action: 'send_message',
            channelId,
            content: `🔗 ${action.data.text || 'Lien'}: ${action.data.url}`,
          });
        }
        break;

      case 'delete':
        // Supprimer le message du bouton
        this.sendToDiscord({
          action: 'delete_message',
          channelId,
          messageId,
        });
        break;

      case 'edit':
        // Modifier le message du bouton
        if (action.data?.newContent || action.data?.newEmbed) {
          this.sendToDiscord({
            action: 'edit_message',
            channelId,
            messageId,
            newContent: action.data.newContent,
            newEmbed: action.data.newEmbed,
          });
        }
        break;

      default:
        Logger.warn(`⚠️ Type d'action de bouton inconnu: ${action.type}`);
        throw new Error(`Type d'action non supporté: ${action.type}`);
    }
  }

  /**
   * Traiter une sélection de menu
   */
  async handleSelectMenu(data: any): Promise<void> {
    const { customId, values, user, channelId, messageId } = data;

    Logger.info(`📋 Menu sélectionné: ${customId} par ${user.username}`);
    Logger.debug('Valeurs sélectionnées:', values);

    // Récupérer la configuration du menu
    const menu = this.menus.get(customId) || this.getMenuByCustomId(customId);
    if (!menu) {
      Logger.warn(`❌ Menu non trouvé: ${customId}`);
      this.sendToDiscord({
        action: 'menu_error',
        channelId,
        messageId,
        error: 'Menu non trouvé dans la base de données',
        customId,
      });
      return;
    }

    // Vérifier si le menu est actif
    if (!menu.isActive) {
      Logger.info('⚠️ Menu désactivé');
      return;
    }

    // Sauvegarder la sélection
    await saveMenuSelection(menu.id, user.id, values, this.menus);

    Logger.info(`✅ Sélection sauvegardée pour ${user.username}: ${values.join(', ')}`);

    // Exécuter l'action du menu
    try {
      await this.executeMenuAction(menu.action, {
        menu,
        user,
        values,
        channelId,
        messageId,
      });

      // Envoyer une confirmation à Discord
      this.sendToDiscord({
        action: 'menu_success',
        channelId,
        messageId,
        customId,
        values,
        actionType: menu.action.type,
        user: {
          id: user.id,
          username: user.username,
        },
      });
    } catch (error: any) {
      Logger.error(`❌ Erreur lors de l'exécution du menu: ${error.message}`);

      this.sendToDiscord({
        action: 'menu_error',
        channelId,
        messageId,
        error: error.message,
        customId,
      });
    }
  }

  /**
   * Obtenir un menu par customId
   */
  private getMenuByCustomId(customId: string): any {
    for (const menu of this.menus.values()) {
      if (menu.customId === customId) {
        return menu;
      }
    }
    return undefined;
  }

  /**
   * Exécuter une action de menu
   */
  private async executeMenuAction(action: any, context: any): Promise<void> {
    const { menu, user, values, channelId } = context;

    switch (action.type) {
      case 'message':
        // Envoyer un message basé sur les sélections
        if (action.data?.template) {
          let content = action.data.template;
          values.forEach((value: string, index: number) => {
            content = content.replace(`{selection${index + 1}}`, value);
          });
          content = content.replace('{user}', user.username);
          content = content.replace('{all}', values.join(', '));

          this.sendToDiscord({
            action: 'send_message',
            channelId,
            content,
          });
        }
        break;

      case 'embed':
        // Envoyer un embed basé sur les sélections
        if (action.data?.embed) {
          const embed = {
            ...action.data.embed,
            // Remplacer les placeholders
            title: action.data.embed.title?.replace('{user}', user.username),
            description: action.data.embed.description?.replace('{user}', user.username),
          };

          values.forEach((value: string, index: number) => {
            if (embed.title) embed.title = embed.title.replace(`{selection${index + 1}}`, value);
            if (embed.description) embed.description = embed.description.replace(`{selection${index + 1}}`, value);
          });
          if (embed.description) embed.description = embed.description.replace('{all}', values.join(', '));

          this.sendToDiscord({
            action: 'send_embed',
            channelId,
            embed,
          });
        }
        break;

      case 'role':
        // Donner/retirer des rôles basés sur les sélections
        if (action.data?.roleMapping) {
          const rolesToAdd: string[] = [];
          const rolesToRemove: string[] = [];

          values.forEach((value: string) => {
            const mapping = action.data.roleMapping[value];
            if (mapping) {
              if (mapping.action === 'add') {
                rolesToAdd.push(mapping.roleId);
              } else if (mapping.action === 'remove') {
                rolesToRemove.push(mapping.roleId);
              }
            }
          });

          if (rolesToAdd.length > 0 || rolesToRemove.length > 0) {
            this.sendToDiscord({
              action: 'manage_roles',
              channelId,
              userId: user.id,
              rolesToAdd,
              rolesToRemove,
            });
          }
        }
        break;

      case 'webhook':
        // Envoyer les données vers un webhook
        if (action.data?.webhookUrl) {
          this.sendToDiscord({
            action: 'send_webhook_data',
            channelId,
            webhookUrl: action.data.webhookUrl,
            data: {
              user: {
                id: user.id,
                username: user.username,
              },
              menuId: menu.id,
              selections: values,
              timestamp: new Date().toISOString(),
            },
          });
        }
        break;

      case 'custom':
        // Exécuter une commande personnalisée
        if (action.data?.command) {
          Logger.info(`🔧 Commande personnalisée de menu: ${action.data.command}`);
          // TODO: Implémenter un système de commandes personnalisées
        }
        break;

      default:
        Logger.warn(`⚠️ Type d'action de menu inconnu: ${action.type}`);
        throw new Error(`Type d'action non supporté: ${action.type}`);
    }
  }

  /**
   * Traiter une soumission de modal
   */
  async handleModalSubmit(data: any): Promise<void> {
    const { customId, fields, user, channelId, messageId } = data;

    Logger.info(`📝 Modal soumis: ${customId} par ${user.username}`);
    Logger.debug('Champs:', fields);

    // TODO: Traiter les données du modal
  }

  /**
   * Obtenir un sondage par ID
   */
  getPoll(pollId: string): any {
    return this.polls.get(pollId) || this.polls.get(`poll_${pollId}`);
  }

  /**
   * Obtenir tous les sondages
   */
  getAllPolls(): Map<string, any> {
    return this.polls;
  }

  /**
   * Ajouter un nouveau sondage
   */
  addPoll(poll: any): void {
    this.polls.set(poll.id, poll);
  }

  /**
   * Mettre à jour un sondage
   */
  updatePoll(pollId: string, updates: any): void {
    const poll = this.polls.get(pollId);
    if (poll) {
      Object.assign(poll, updates);
    }
  }

  /**
   * Supprimer un sondage
   */
  deletePoll(pollId: string): void {
    this.polls.delete(pollId);
    this.polls.delete(`poll_${pollId}`);
  }

  /**
   * Envoyer une commande au processus Discord
   */
  private sendToDiscord(data: any): void {
    try {
      const message = {
        type: 'mcp_to_discord',
        id: `cmd_${Date.now()}`,
        data,
        timestamp: Date.now(),
      };
      process.stdout.write(JSON.stringify(message) + '\n');
      Logger.debug(`📤 Commande envoyée à Discord: ${data.action}`);
    } catch (error) {
      Logger.error('❌ Erreur envoi commande Discord:', error);
    }
  }
}

// Instance globale du gestionnaire
export const interactionHandler = new InteractionHandler();
