import { loadPolls, savePolls, getPoll } from './pollPersistence.js';
import { loadButtons, saveButtons } from './buttonPersistence.js';
import { EmbedBuilder } from 'discord.js';
import { createResultsEmbed } from '../tools/polls.js';

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
    this.buttons = await loadButtons();
    console.log('✅ Gestionnaire d\'interactions initialisé');
  }

  /**
   * Traiter une interaction de sondage
   */
  async handlePollInteraction(data: any): Promise<void> {
    const { pollId, action, user, channelId, messageId } = data;

    console.log(`🎯 Traitement interaction sondage: ${action} par ${user.username}`);

    // Récupérer le sondage
    let poll = this.polls.get(pollId) || this.polls.get(`poll_${pollId}`);
    if (!poll) {
      console.log(`❌ Sondage non trouvé: ${pollId}`);
      return;
    }

    // Vérifier si le sondage est terminé
    if (poll.ended) {
      console.log('❌ Sondage déjà terminé');
      return;
    }

    // Vérifier si le sondage a expiré
    if (new Date() > new Date(poll.endTime)) {
      poll.ended = true;
      await savePolls(this.polls);
      console.log('⏰ Sondage expiré');
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
          console.log(`❌ Index d'option invalide: ${action}`);
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
  private async handleVote(poll: any, optionIndex: number, user: any, channelId: string, messageId: string): Promise<void> {
    console.log(`🗳️ Vote de ${user.username} pour l'option ${optionIndex}`);

    // TODO: Implémenter la vérification des votes multiples
    // Pour l'instant, on incrémente simplement le compteur

    poll.options[optionIndex].votes += 1;
    poll.totalVotes += 1;

    // Recalculer les pourcentages
    poll.options.forEach((option: any) => {
      option.percentage = poll.totalVotes > 0
        ? (option.votes / poll.totalVotes) * 100
        : 0;
    });

    console.log(`✅ Vote enregistré. Total: ${poll.totalVotes}`);

    // TODO: Mettre à jour le message Discord
    // Cela nécessite d'envoyer une commande au processus Discord
  }

  /**
   * Terminer un sondage
   */
  private async endPoll(poll: any, channelId: string, messageId: string): Promise<void> {
    console.log('🏁 Terminaison du sondage');

    poll.ended = true;

    // Trouver le gagnant
    const winner = poll.options.reduce((prev: any, current: any) =>
      prev.votes > current.votes ? prev : current
    );

    console.log(`🏆 Gagnant: ${winner.text} avec ${winner.votes} votes`);

    // TODO: Envoyer un message de fin dans Discord
  }

  /**
   * Afficher les résultats d'un sondage
   */
  private async showPollResults(poll: any, channelId: string): Promise<void> {
    console.log('📊 Affichage des résultats');

    const resultsEmbed = createResultsEmbed(poll);

    // TODO: Envoyer l'embed des résultats dans Discord
  }

  /**
   * Traiter un clic sur un bouton personnalisé
   */
  async handleCustomButton(data: any): Promise<void> {
    const { customId, user, channelId, messageId } = data;

    console.log(`🔘 Bouton personnalisé cliqué: ${customId} par ${user.username}`);

    // Récupérer la configuration du bouton
    const button = this.buttons.get(customId);
    if (!button) {
      console.log(`❌ Bouton non trouvé: ${customId}`);
      return;
    }

    // Vérifier si le bouton a expiré
    const createdAt = new Date(button.createdAt);
    const now = new Date();
    const hoursDiff = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);

    if (hoursDiff > 24) {
      console.log('⏰ Bouton expiré (TTL 24h)');
      this.buttons.delete(customId);
      await saveButtons(this.buttons);
      return;
    }

    // TODO: Exécuter l'action du bouton
    console.log(`✅ Action à exécuter:`, button.action);

    // TODO: Envoyer une réponse à l'utilisateur
  }

  /**
   * Traiter une sélection de menu
   */
  async handleSelectMenu(data: any): Promise<void> {
    const { customId, values, user, channelId, messageId } = data;

    console.log(`📋 Menu sélectionné: ${customId} par ${user.username}`);
    console.log('Valeurs sélectionnées:', values);

    // TODO: Traiter la sélection
  }

  /**
   * Traiter une soumission de modal
   */
  async handleModalSubmit(data: any): Promise<void> {
    const { customId, fields, user, channelId, messageId } = data;

    console.log(`📝 Modal soumis: ${customId} par ${user.username}`);
    console.log('Champs:', fields);

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
}

// Instance globale du gestionnaire
export const interactionHandler = new InteractionHandler();
