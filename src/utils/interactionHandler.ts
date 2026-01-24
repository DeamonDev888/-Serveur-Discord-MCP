import { loadPolls, savePolls } from './pollPersistence.js';
import { loadCustomButtons, saveCustomButtons } from './buttonPersistence.js';
import { loadCustomMenus } from './menuPersistence.js';
import {
  loadPersistentButtons,
  loadPersistentMenus,
  getPersistentButton,
  getPersistentMenu,
  type ButtonAction,
  type MenuAction
} from './distPersistence.js';
import Logger from './logger.js';
import { introManager } from './introManager.js';

/**
 * Gestionnaire principal des interactions Discord
 */
export class InteractionHandler {
  private polls: Map<string, any> = new Map();
  private buttons: Map<string, any> = new Map();
  private persistentButtons: Map<string, { action: ButtonAction; label: string; channelId: string }> = new Map();
  private menus: Map<string, any> = new Map();
  private persistentMenus: Map<string, { action: MenuAction; placeholder?: string; channelId: string }> = new Map();

  constructor() {
    this.initialize();
  }

  private async initialize() {
    // Charger les données persistées
    this.polls = await loadPolls();
    this.buttons = await loadCustomButtons();
    this.menus = await loadCustomMenus();
    const persistentBtns = await loadPersistentButtons();
    const persistentMenus = await loadPersistentMenus();

    // Indexer les boutons persistants pour un accès rapide
    this.persistentButtons.clear();
    persistentBtns.forEach(btn => {
      this.persistentButtons.set(btn.id, {
        action: btn.action,
        label: btn.label,
        channelId: btn.channelId,
      });
    });

    // Indexer les menus persistants pour un accès rapide
    this.persistentMenus.clear();
    persistentMenus.forEach(menu => {
      this.persistentMenus.set(menu.id, {
        action: menu.action,
        placeholder: menu.placeholder,
        channelId: menu.channelId,
      });
    });

    Logger.info("✅ Gestionnaire d'interactions initialisé");
    Logger.info(`   • ${this.polls.size} sondages chargés`);
    Logger.info(`   • ${this.buttons.size} boutons chargés`);
    Logger.info(`   • ${this.persistentButtons.size} boutons persistants chargés (dist/data/)`);
    Logger.info(`   • ${this.menus.size} menus chargés`);
    Logger.info(`   • ${this.persistentMenus.size} menus persistants chargés (dist/data/)`);
  }

  /**
   * Rafraîchir la liste des boutons depuis la persistance
   */
  async refreshButtons(): Promise<void> {
    this.buttons = await loadCustomButtons();
    const persistentBtns = await loadPersistentButtons();

    this.persistentButtons.clear();
    persistentBtns.forEach(btn => {
      this.persistentButtons.set(btn.id, {
        action: btn.action,
        label: btn.label,
        channelId: btn.channelId,
      });
    });

    Logger.info(`🔄 Boutons rechargés dans le gestionnaire:`);
    Logger.info(`   • ${this.buttons.size} boutons standards`);
    Logger.info(`   • ${this.persistentButtons.size} boutons persistants`);
  }

  /**
   * Rafraîchir la liste des menus depuis la persistance
   */
  async refreshMenus(): Promise<void> {
    this.menus = await loadCustomMenus();
    const persistentMenusData = await loadPersistentMenus();

    this.persistentMenus.clear();
    persistentMenusData.forEach(menu => {
      this.persistentMenus.set(menu.id, {
        action: menu.action,
        placeholder: menu.placeholder,
        channelId: menu.channelId,
      });
    });

    Logger.info(`🔄 Menus rechargés dans le gestionnaire:`);
    Logger.info(`   • ${this.menus.size} menus standards`);
    Logger.info(`   • ${this.persistentMenus.size} menus persistants`);
  }

  /**
   * Traiter une interaction de sondage
   */
  async handlePollInteraction(data: any): Promise<void> {
    const { pollId, action, user, channelId, messageId } = data;

    Logger.info(`🎯 Traitement interaction sondage: ${action} par ${user.username}`);

    // Récupérer le sondage
    const poll = this.polls.get(pollId) || this.polls.get(`poll_${pollId}`);
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
   * @returns true si le bouton a été géré, false sinon
   */
  async handleCustomButton(data: any): Promise<boolean> {
    const { customId, user, channelId, messageId } = data;

    Logger.info(`🔘 Bouton personnalisé cliqué: ${customId} par ${user.username}`);

    // Gestion du questionnaire d'intro
    if (customId.startsWith('intro_')) {
      await introManager.handleInteraction({
        customId,
        user,
        channelId,
        messageId
      });
      return true;
    }

    // Gestion des sondages (poll_ID_option_INDEX)
    if (customId.includes('_option_') || customId.startsWith('poll_')) {
      const parts = customId.split('_option_');
      
      // Cas standard: poll_ID_option_INDEX
      if (parts.length === 2) {
        const pollId = parts[0];
        const action = parts[1];
        
        await this.handlePollInteraction({
          pollId,
          action,
          user,
          channelId,
          messageId
        });
        return true;
      }
      
      // Cas spéciaux (end, results) si implémentés plus tard
      // Exemple: poll_ID_end
      // On vérifie juste le préfixe poll_ pour être sûr
      if (customId.startsWith('poll_')) {
        // Tentative d'extraction d'action simple
        // Format: poll_ID_ACTION
        const lastUnderscore = customId.lastIndexOf('_');
        if (lastUnderscore > 4) { // poll_ est au début
            const pollId = customId.substring(0, lastUnderscore);
            const action = customId.substring(lastUnderscore + 1);
            
            await this.handlePollInteraction({
                pollId,
                action,
                user,
                channelId,
                messageId
            });
            return true;
        }
      }
    }

    // 🔒 GESTION DES BOUTONS PERSISTANTS (dist/data/)
    if (customId.startsWith('pb_')) {
      Logger.info(`🔒 Bouton persistant détecté: ${customId}`);

      let persistentButton = this.persistentButtons.get(customId);

      // Fallback: recharger si pas trouvé
      if (!persistentButton) {
        Logger.info(`⚠️ Bouton persistant non trouvé, rechargement...`);
        await this.refreshButtons();
        persistentButton = this.persistentButtons.get(customId);
      }

      if (persistentButton) {
        try {
          await this.executePersistentButtonAction(persistentButton.action, {
            user,
            channelId,
            messageId,
            customId,
          });
          return true;
        } catch (error: any) {
          Logger.error(`❌ Erreur bouton persistant: ${error.message}`);
          return true; // Marquer comme géré même en erreur
        }
      }

      Logger.warn(`❌ Bouton persistant non trouvé: ${customId}`);
      return false;
    }

    Logger.info(`🔍 Nombre total de boutons en mémoire: ${this.buttons.size}`);

    // Récupérer la configuration du bouton standard
    let button = this.buttons.get(customId);
    
    // Fallback: Tentative de rechargement si le bouton n'est pas trouvé
    if (!button) {
      Logger.info(`⚠️ Bouton ${customId} non trouvé en mémoire, tentative de rechargement...`);
      await this.refreshButtons();
      button = this.buttons.get(customId);
    }
    
    if (!button) {
      Logger.warn(`❌ Bouton non trouvé dans la persistance après reload: ${customId}`);
      Logger.debug(`Boutons disponibles: ${Array.from(this.buttons.keys()).join(', ')}`);
      return false;
    }

    // Vérifier si le bouton a expiré
    // 🔥 Les boutons avec custom_id personnalisé (qui ne commencent pas par embedv2_) n'expirent jamais
    const isCustomIdButton = !customId.startsWith('embedv2_') && !customId.startsWith('pb_');

    if (!isCustomIdButton) {
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
        return true;
      }
    } else {
      Logger.debug(`🔒 Bouton avec custom_id personnalisé (${customId}) - pas d'expiration`);
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

      // 🔥 NE PAS envoyer button_success pour les boutons embedv2_ avec action custom
      // car ils sont gérés directement par discord-bridge.ts pour éviter les doublons
      const isEmbedV2CustomButton = customId.startsWith('embedv2_') && button.action.type === 'custom';

      if (!isEmbedV2CustomButton) {
        // Envoyer une confirmation à Discord uniquement pour les autres boutons
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
      } else {
        Logger.debug(`🔄 [Handler] Bouton embedv2_ custom géré par discord-bridge - pas de button_success`);
      }

      return true;
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
      return true;
    }
  }

  /**
   * Exécuter une action de bouton persistant
   */
  private async executePersistentButtonAction(action: ButtonAction, context: any): Promise<void> {
    const { user, channelId, messageId, customId } = context;

    Logger.info(`🔒 Exécution action bouton persistant: ${action.type}`);

    switch (action.type) {
      case 'message':
        // Envoyer un message éphéméral
        this.sendToDiscord({
          action: 'button_message_response',
          channelId,
          messageId,
          content: action.content,
          ephemeral: action.ephemeral !== false,
          user: { id: user.id, username: user.username },
        });
        break;

      case 'embed':
        // Envoyer un embed en réponse
        this.sendToDiscord({
          action: 'button_embed_response',
          channelId,
          messageId,
          embed: action.embed,
          ephemeral: action.ephemeral !== false,
          user: { id: user.id, username: user.username },
        });
        break;

      case 'link':
        // Ouvrir un lien
        this.sendToDiscord({
          action: 'button_link_response',
          channelId,
          messageId,
          url: action.url,
          user: { id: user.id, username: user.username },
        });
        break;

      case 'role':
        // Gérer un rôle (toggle)
        this.sendToDiscord({
          action: 'button_role_toggle',
          channelId,
          messageId,
          roleId: action.roleId,
          userId: user.id,
        });
        break;

      case 'delete':
        // Supprimer le message
        this.sendToDiscord({
          action: 'button_delete_message',
          channelId,
          messageId,
        });
        break;

      case 'refresh':
        // Rafraîchir l'embed
        this.sendToDiscord({
          action: 'button_refresh_embed',
          channelId,
          messageId,
        });
        break;

      case 'edit':
        // Modifier l'embed
        this.sendToDiscord({
          action: 'button_edit_embed',
          channelId,
          messageId,
          newEmbed: action.newEmbed,
        });
        break;

      default:
        Logger.warn(`⚠️ Type d'action bouton persistant inconnu: ${action.type}`);
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
          const embedWithPlaceholders = {
            ...action.data.embed,
            // Remplacer les placeholders
            title: action.data.embed.title?.replace('{user}', user.username),
            description: action.data.embed.description?.replace('{user}', user.username),
          };

          // Utiliser ephemeral si spécifié dans customData
          const ephemeral = action.data.ephemeral !== false;

          this.sendToDiscord({
            action: 'button_embed_response',
            channelId,
            messageId,
            embed: embedWithPlaceholders,
            ephemeral,
            user: { id: user.id, username: user.username },
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

      // ============================================================================
      // ACTIONS SPÉCIFIQUES AUX BOUTONS EMBED
      // ============================================================================

      case 'none':
        // Afficher un message simple de confirmation
        this.sendToDiscord({
          action: 'send_message',
          channelId,
          content: `✅ Bouton cliqué (action: ${button.label})`,
          ephemeral: true,
        });
        break;

      case 'refresh':
        // Rafraîchir l'embed avec un timestamp
        this.sendToDiscord({
          action: 'edit_message',
          channelId,
          messageId,
          refreshEmbed: true,
        });
        break;

      case 'link':
        // Ouvrir un lien
        if (action.data?.value) {
          this.sendToDiscord({
            action: 'send_message',
            channelId,
            content: `🔗 ${action.data.value}`,
            ephemeral: false,
          });
        } else {
          this.sendToDiscord({
            action: 'send_message',
            channelId,
            content: '❌ Lien non configuré',
            ephemeral: true,
          });
        }
        break;

      case 'custom':
        // Action personnalisée avec customData
        // Gérer les boutons custom créés par creer_embed
        if (action.data?.embed) {
          // Cas 1: Custom avec embed
          this.sendToDiscord({
            action: 'button_embed_response',
            channelId,
            messageId,
            embed: action.data.embed,
            ephemeral: action.data.ephemeral !== false,
            user: { id: user.id, username: user.username },
          });
        } else if (action.data?.message) {
          // Cas 2: Custom avec message
          this.sendToDiscord({
            action: 'button_message_response',
            channelId,
            messageId,
            content: action.data.message.replace('{user}', user.username),
            ephemeral: action.data.ephemeral !== false,
            user: { id: user.id, username: user.username },
          });
        } else {
          // Cas 3: Custom basique
          this.sendToDiscord({
            action: 'send_message',
            channelId,
            content: `⚙️ Action personnalisée: ${button.label}`,
            ephemeral: true,
          });
        }
        break;

      case 'modal':
        // Afficher un modal (placeholder)
        this.sendToDiscord({
          action: 'send_message',
          channelId,
          content: '📝 Fonctionnalité Modal à implémenter',
          ephemeral: true,
        });
        break;

      default:
        Logger.warn(`⚠️ Type d'action de bouton inconnu: ${action.type}`);
        throw new Error(`Type d'action non supporté: ${action.type}`);
    }
  }

  /**
   * Exécuter l'action d'un menu persistant
   */
  private async executePersistentMenuAction(action: MenuAction, context: {
    user: { id: string; username: string };
    values: string[];
    channelId: string;
    messageId: string;
    customId: string;
  }): Promise<void> {
    const { user, values, channelId, messageId, customId } = context;

    Logger.info(`🔒 Exécution action menu persistant: ${action.type}`);

    switch (action.type) {
      case 'message':
        // Envoyer un message avec template
        const content = action.template
          ? action.template.replace('{values}', values.join(', ')).replace('{user}', user.username)
          : action.content;
        this.sendToDiscord({
          action: 'button_message_response',
          channelId,
          messageId,
          content,
          ephemeral: action.ephemeral !== false,
          user: { id: user.id, username: user.username },
        });
        break;

      case 'embed':
        // Envoyer un embed
        this.sendToDiscord({
          action: 'button_embed_response',
          channelId,
          messageId,
          embed: action.embed,
          ephemeral: action.ephemeral !== false,
          user: { id: user.id, username: user.username },
        });
        break;

      case 'role':
        // Gérer un rôle
        const mode = action.mode || 'add';
        this.sendToDiscord({
          action: 'button_role_response',
          channelId,
          messageId,
          roleId: action.roleId,
          mode,
          user: { id: user.id, username: user.username },
        });
        break;

      case 'delete':
        // Supprimer le message
        this.sendToDiscord({
          action: 'button_delete_response',
          channelId,
          messageId,
        });
        break;

      case 'refresh':
        // Rafraîchir l'embed
        this.sendToDiscord({
          action: 'edit_message',
          channelId,
          messageId,
          refreshEmbed: true,
        });
        break;

      case 'link':
        // Ouvrir un lien avec template
        const url = action.template
          ? action.template.replace('{values}', values.join(','))
          : action.url;
        this.sendToDiscord({
          action: 'send_message',
          channelId,
          content: `🔗 ${url}`,
          ephemeral: false,
        });
        break;

      case 'edit':
        // Modifier l'embed
        this.sendToDiscord({
          action: 'edit_message',
          channelId,
          messageId,
          newEmbed: action.newEmbed,
        });
        break;

      case 'custom':
        // Action personnalisée
        this.sendToDiscord({
          action: 'send_message',
          channelId,
          content: `⚙️ Action personnalisée: ${action.handler} - Valeurs: ${values.join(', ')}`,
          ephemeral: true,
        });
        break;

      case 'modal':
        // Afficher un modal
        this.sendToDiscord({
          action: 'show_modal',
          channelId,
          messageId,
          modalId: action.modalId,
          user: { id: user.id, username: user.username },
        });
        break;

      default:
        const _never: never = action;
        Logger.warn(`⚠️ Type d'action inconnu: ${JSON.stringify(_never)}`);
        throw new Error(`Type d'action non supporté: ${JSON.stringify(_never)}`);
    }
  }

  /**
   * Traiter une sélection de menu
   * @returns true si le menu a été géré, false sinon
   */
  async handleSelectMenu(data: any): Promise<boolean> {
    const { customId, values, user, channelId, messageId } = data;

    Logger.info(`📋 Menu sélectionné: ${customId} par ${user.username}`);
    Logger.debug('Valeurs sélectionnées:', values);

    // Gestion du questionnaire d'intro
    if (customId.startsWith('intro_')) {
      await introManager.handleInteraction({
        customId,
        user,
        channelId,
        messageId,
        values
      });
      return true;
    }

    // 🔒 GESTION DES MENUS PERSISTANTS (dist/data/)
    if (customId.startsWith('pm_')) {
      Logger.info(`🔒 Menu persistant détecté: ${customId}`);
      let persistentMenu = this.persistentMenus.get(customId);

      if (!persistentMenu) {
        await this.refreshMenus();
        persistentMenu = this.persistentMenus.get(customId);
      }

      if (persistentMenu) {
        await this.executePersistentMenuAction(persistentMenu.action, {
          user,
          values,
          channelId,
          messageId,
          customId,
        });
        return true;
      }
    }

    // Récupérer la configuration du menu standard
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
      return false;
    }

    // Vérifier si le menu est actif
    if (!menu.isActive) {
      Logger.info('⚠️ Menu désactivé');
      return false;
    }

    // Sauvegarder la sélection (OPTIONNEL - désactivé pour éviter l'import inutilisé)
    // await saveMenuSelection(menu.id, user.id, values, this.menus);

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
      return true;
    } catch (error: any) {
      Logger.error(`❌ Erreur lors de l'exécution du menu: ${error.message}`);

      this.sendToDiscord({
        action: 'menu_error',
        channelId,
        messageId,
        error: error.message,
        customId,
      });
      return true;
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
        Logger.warn(`⚠️ Type d'action de menu inconnu: ${(action as any).type}`);
        throw new Error(`Type d'action non supporté: ${(action as any).type}`);
    }
  }

  /**
   * Traiter une soumission de modal
   */
  async handleModalSubmit(data: any): Promise<void> {
    const { customId, fields, user } = data;

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
      /*
      const message = {
        type: 'mcp_to_discord',
        id: `cmd_${Date.now()}`,
        data,
        timestamp: Date.now(),
      };
      
      // ⚠️ DÉSACTIVÉ pour éviter de polluer stdout dans le mode MCP
      // process.stdout.write(JSON.stringify(message) + '\n');
      */
      
      Logger.debug(`📤 Commande INTERNE (désactivée sur stdout): ${data.action}`);
    } catch (error) {
      Logger.error('❌ Erreur envoi commande Discord:', error);
    }
  }
}

// Instance globale du gestionnaire
export const interactionHandler = new InteractionHandler();
