import { loadPolls, savePolls } from './pollPersistence.js';
import { loadCustomButtons, saveCustomButtons } from './buttonPersistence.js';
import Logger from './logger.js';

/**
 * Gestionnaire principal des interactions Discord
 */
export class InteractionHandler {
  private polls: Map<string, any> = new Map();
  private buttons: Map<string, any> = new Map();

  constructor() {
    this.initialize();
  }

  private async initialize() {
    // Charger les données persistées
    this.polls = await loadPolls();
    this.buttons = await loadCustomButtons();
    Logger.info("✅ Gestionnaire d'interactions initialisé");
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
      return;
    }

    // TODO: Exécuter l'action du bouton
    Logger.debug(`✅ Action à exécuter:`, button.action);

    // TODO: Envoyer une réponse à l'utilisateur
  }

  /**
   * Traiter une sélection de menu
   */
  async handleSelectMenu(data: any): Promise<void> {
    const { customId, values, user, channelId, messageId } = data;

    Logger.info(`📋 Menu sélectionné: ${customId} par ${user.username}`);
    Logger.debug('Valeurs sélectionnées:', values);

    // TODO: Traiter la sélection
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
