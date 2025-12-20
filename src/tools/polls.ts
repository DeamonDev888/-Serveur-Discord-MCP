import { z } from 'zod';
import { ButtonStyle, ButtonBuilder, ActionRowBuilder } from 'discord.js';
import { getPollTemplate, PollTemplate } from '../utils/pollTemplates.js';

// ===============================
// FONCTIONS UTILITAIRES
// ===============================

/**
 * Parser une couleur (hex, nom, ou décimal)
 */
function parseColor(color: string): number {
  // Si c'est déjà un nombre décimal
  if (/^\d+$/.test(color)) {
    return parseInt(color);
  }

  // Si c'est un code hex
  if (color.startsWith('#')) {
    return parseInt(color.slice(1), 16);
  }

  // Couleurs nommées communes
  const colorMap: { [key: string]: number } = {
    RED: 0xe74c3c,
    GREEN: 0x2ecc71,
    BLUE: 0x3498db,
    YELLOW: 0xf1c40f,
    PURPLE: 0x9b59b6,
    ORANGE: 0xe67e22,
    AQUA: 0x1abc9c,
    WHITE: 0xffffff,
    BLACK: 0x000000,
    GREY: 0x95a5a6,
    DARK_RED: 0xc0392b,
    DARK_GREEN: 0x27ae60,
    DARK_BLUE: 0x2980b9,
    BLURPLE: 0x5865f2,
  };

  return colorMap[color.toUpperCase()] || 0x5865f2;
}

/**
 * Obtenir les labels des boutons selon le template
 */
function getButtonLabels(template: string, customLabels?: any) {
  const defaultLabels = {
    vote: '🗳️ Voter',
    end: '🏁 Terminer le sondage',
    results: '📊 Voir les résultats',
  };

  const templateLabels: Record<string, any> = {
    mystical: {
      vote: '✨ Faire un Choix',
      end: '🔮 Sceller le Destin',
      results: '✨ Révéler la Vision',
    },
    professional: {
      vote: '✅ Confirmer',
      end: '📋 Clôturer',
      results: '📈 Voir Analyse',
    },
    fun: {
      vote: '🎉 Je Vote !',
      end: "🎯 C'est Terminé !",
      results: '🎊 Résultats !',
    },
    anonymous: {
      vote: '🔒 Voter',
      end: '🔐 Fermer',
      results: '🔍 Consulter',
    },
    quick: {
      vote: '⚡ Vote',
      end: '⏹️ Stop',
      results: '📊 Voir',
    },
    career: {
      vote: '🚀 Choisir',
      end: '✅ Finaliser',
      results: '📈 Analyser',
    },
    gaming: {
      vote: '🎮 Vote !',
      end: '🏆 Fin !',
      results: '🎯 Résultats !',
    },
  };

  const templateSpecific = templateLabels[template] || {};

  return {
    vote: customLabels?.vote || templateSpecific.vote || defaultLabels.vote,
    end: customLabels?.end || templateSpecific.end || defaultLabels.end,
    results: customLabels?.results || templateSpecific.results || defaultLabels.results,
  };
}

// Schema amélioré pour la création d'un sondage avec options avancées
export const CreatePollSchema = z.object({
  // Configuration de base
  channelId: z.string().describe('ID du canal où créer le sondage'),
  question: z.string().min(5).max(500).describe('Question du sondage (5-500 caractères)'),
  options: z.array(z.string()).min(2).max(10).describe('Options du sondage (2-10 options)'),

  // Template et style
  template: z
    .enum(['classic', 'mystical', 'professional', 'fun', 'anonymous', 'quick', 'career', 'gaming'])
    .optional()
    .default('classic')
    .describe('Template visuel du sondage'),

  // Configuration temporelle
  duration: z
    .number()
    .min(5)
    .max(604800)
    .optional()
    .default(300)
    .describe('Durée en secondes (min: 5s, max: 7j)'),

  // Configuration de vote
  allowMultiple: z.boolean().optional().default(false).describe('Autoriser plusieurs réponses'),
  anonymous: z.boolean().optional().default(false).describe('Sondage anonyme'),
  maxVotesPerUser: z
    .number()
    .min(1)
    .max(10)
    .optional()
    .default(1)
    .describe('Nombre max de votes par utilisateur'),

  // Configuration d'affichage
  showProgressBar: z
    .boolean()
    .optional()
    .default(true)
    .describe('Afficher la barre de progression'),
  showPercentages: z.boolean().optional().default(true).describe('Afficher les pourcentages'),
  showTotalVotes: z
    .boolean()
    .optional()
    .default(true)
    .describe('Afficher le nombre total de votes'),
  showResultsBeforeEnd: z
    .boolean()
    .optional()
    .default(false)
    .describe('Afficher les résultats avant la fin'),

  // Configuration des boutons
  customButtonLabels: z
    .object({
      vote: z.string().optional().describe('Label personnalisé pour voter'),
      end: z.string().optional().describe('Label personnalisé pour terminer'),
      results: z.string().optional().describe('Label personnalisé pour voir les résultats'),
    })
    .optional()
    .describe('Labels personnalisés des boutons'),

  // Configuration avancée
  enableComments: z.boolean().optional().default(false).describe('Activer les commentaires'),
  requireConfirmation: z
    .boolean()
    .optional()
    .default(false)
    .describe('Demander confirmation avant vote'),
  allowRevote: z.boolean().optional().default(false).describe('Permettre de changer de vote'),
  autoCloseOnMajority: z
    .boolean()
    .optional()
    .default(false)
    .describe('Fermer automatiquement si 80% de participation'),

  // Personnalisation visuelle
  customColor: z.string().optional().describe('Couleur personnalisée (hex, nom, ou décimal)'),
  customThumbnail: z.string().optional().describe('URL de la miniature personnalisée'),
  customImage: z.string().optional().describe("URL de l'image personnalisée"),
  customFooter: z.string().optional().describe('Texte de footer personnalisé'),

  // Configuration de modération
  allowOwnerOnly: z
    .boolean()
    .optional()
    .default(false)
    .describe('Seul le créateur peut voir les résultats'),
  logVotes: z.boolean().optional().default(true).describe('Enregistrer les votes dans les logs'),

  // Configuration de notification
  notifyOnCreate: z
    .boolean()
    .optional()
    .default(false)
    .describe('Notifier un canal lors de la création'),
  notifyChannelId: z.string().optional().describe('ID du canal de notification'),
  notifyOnEnd: z.boolean().optional().default(true).describe('Notifier à la fin du sondage'),
});

// Interface pour les résultats étendus
export interface PollResultExtended extends PollResult {
  template: string;
  maxVotesPerUser: number;
  showProgressBar: boolean;
  showPercentages: boolean;
  showTotalVotes: boolean;
  showResultsBeforeEnd: boolean;
  enableComments: boolean;
  customColor?: string;
  customThumbnail?: string;
  customImage?: string;
  customFooter?: string;
  votesByUser?: Map<string, number[]>;
  comments?: Array<{
    userId: string;
    username: string;
    timestamp: Date;
    comment: string;
  }>;
}

// Type pour les résultats du sondage
export interface PollResult {
  id: string;
  messageId?: string; // ID du message Discord
  channelId?: string; // ID du canal Discord
  question: string;
  options: Array<{
    text: string;
    votes: number;
    percentage: number;
  }>;
  totalVotes: number;
  ended: boolean;
  endTime: Date;
  allowMultiple?: boolean;
  anonymous?: boolean;
}

// Configuration avancée des boutons pour les sondages
export const getPollButtons = (
  pollId: string,
  options: string[],
  config: {
    template?: string;
    customButtonLabels?: any;
    allowMultiple?: boolean;
    showResultsBeforeEnd?: boolean;
  } = {}
) => {
  const {
    template = 'classic',
    customButtonLabels,
    allowMultiple = false,
    showResultsBeforeEnd = false,
  } = config;

  // Obtenir les labels selon le template
  const labels = getButtonLabels(template, customButtonLabels);

  // Créer les boutons de vote
  const buttons = options.map((option, index) => {
    return new ButtonBuilder()
      .setCustomId(`poll_${pollId}_${index}`)
      .setLabel(option)
      .setEmoji(getEmojiForIndex(index))
      .setStyle(allowMultiple ? ButtonStyle.Primary : ButtonStyle.Secondary);
  });

  // Ajouter les boutons de contrôle si autorisé
  if (showResultsBeforeEnd) {
    buttons.push(
      new ButtonBuilder()
        .setCustomId(`poll_${pollId}_results`)
        .setLabel(labels.results)
        .setEmoji('📊')
        .setStyle(ButtonStyle.Primary)
    );
  }

  // Ajouter le bouton de fin (toujours présent)
  buttons.push(
    new ButtonBuilder()
      .setCustomId(`poll_${pollId}_end`)
      .setLabel(labels.end)
      .setEmoji('🏁')
      .setStyle(ButtonStyle.Success)
  );

  // Diviser en lignes de 5 boutons maximum
  const rows: ActionRowBuilder<any>[] = [];
  let currentRow = new ActionRowBuilder<any>();

  buttons.forEach((button, index) => {
    if (index > 0 && index % 5 === 0) {
      rows.push(currentRow);
      currentRow = new ActionRowBuilder<any>();
    }
    currentRow.addComponents(button);
  });

  rows.push(currentRow);
  return rows;
};

// Obtenir un emoji pour chaque option
const getEmojiForIndex = (index: number): string => {
  const emojis = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'];
  return emojis[index] || '📍';
};

// Créer l'embed du sondage avec interface améliorée
export const createPollEmbed = (
  question: string,
  options: string[],
  duration: number,
  anonymous: boolean,
  allowMultiple: boolean
) => {
  // Créer la liste des options avec emojis et espaces pour une meilleure lisibilité
  const optionsList = options
    .map((opt, i) => {
      const emoji = getEmojiForIndex(i);
      return `> ${emoji} **${opt}**`;
    })
    .join('\n');

  return {
    title: '🗳️ Nouveau Sondage',
    description: `**${question}**\n\nCliquez sur le bouton **🗳️ Voter** ci-dessous pour sélectionner votre choix !`,
    color: 0x5865f2, // Couleur Discord blurple
    fields: [
      {
        name: '📋 Options disponibles',
        value: optionsList || 'Aucune option',
        inline: false,
      },
      {
        name: '⚙️ Paramètres',
        value: `⏱️ **Durée:** ${formatDuration(duration)}\n${anonymous ? '👤 **Mode:** Anonyme' : '👁️ **Mode:** Public'}\n${allowMultiple ? '✅ **Choix multiples autorisés**' : '⚪ **Un seul choix possible**'}`,
        inline: false,
      },
    ],
    thumbnail: {
      // Pour changer l'image (marteau/logo), modifiez l'URL ci-dessous
      url: 'https://i.imgur.com/4M34hi2.png',
    },
    timestamp: new Date().toISOString(),
    footer: {
      text: '💡 Cliquez sur "Voter" pour participer au sondage',
    },
  };
};

// Formatter la durée
const formatDuration = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (hours > 0) {
    return `${hours}h${minutes > 0 ? ` ${minutes}m` : ''}`;
  } else if (minutes > 0) {
    return `${minutes}m`;
  } else {
    return `${seconds}s`;
  }
};

// Créer l'embed des résultats avec interface améliorée
export const createResultsEmbed = (pollResult: PollResult) => {
  const winner = pollResult.options.reduce((prev, current) =>
    prev.votes > current.votes ? prev : current
  );

  // Créer les barres de progression avec emojis
  const resultsWithBars = pollResult.options
    .sort((a, b) => b.votes - a.votes)
    .map((opt, index) => {
      const emoji = getEmojiForIndex(index);
      const bar = createProgressBar(opt.percentage);
      const winnerMark = opt.text === winner.text && opt.votes > 0 ? ' 👑' : '';
      return `${bar} ${emoji} **${opt.text}**${winnerMark}\n   └─ ${opt.votes} vote(s) (${opt.percentage.toFixed(1)}%)`;
    })
    .join('\n\n');

  return {
    title: pollResult.ended ? '🏁 Sondage Terminé' : '📊 Résultats en Direct',
    description: `**${pollResult.question}**\n\n${pollResult.ended ? '✅ Le sondage est maintenant fermé.' : '⏳ Le sondage est toujours en cours...'}`,
    color: pollResult.ended ? 0x00ff00 : 0x5865f2,
    fields: [
      {
        name: '📊 Résultats détaillés',
        value: resultsWithBars || 'Aucun vote pour le moment',
        inline: false,
      },
      {
        name: '📈 Statistiques',
        value: `**Total des votes:** ${pollResult.totalVotes}\n**Statut:** ${pollResult.ended ? '✅ Terminé' : '⏳ En cours'}\n**Fin:** <t:${Math.floor(pollResult.endTime.getTime() / 1000)}:R>`,
        inline: false,
      },
    ],
    thumbnail: {
      // Pour changer l'image des résultats, modifiez l'URL ci-dessous
      url: 'https://i.imgur.com/4M34hi2.png',
    },
    timestamp: new Date().toISOString(),
    footer: {
      text: pollResult.ended
        ? '🏁 Sondage terminé - Merci pour votre participation !'
        : '⏳ Votez maintenant pour influencer le résultat !',
    },
  };
};

// Créer une barre de progression
const createProgressBar = (percentage: number): string => {
  const totalBars = 10;
  const filledBars = Math.round((percentage / 100) * totalBars);
  const emptyBars = totalBars - filledBars;
  return '█'.repeat(filledBars) + '░'.repeat(emptyBars);
};
