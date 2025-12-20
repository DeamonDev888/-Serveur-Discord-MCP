import { z } from 'zod';
import { ButtonStyle, ComponentType, ButtonBuilder } from 'discord.js';

// Schema pour la création d'un sondage
export const CreatePollSchema = z.object({
  channelId: z.string().describe('ID du canal où créer le sondage'),
  question: z.string().describe('Question du sondage'),
  options: z.array(z.string()).min(2).max(10).describe('Options du sondage (2-10 options)'),
  duration: z.number().min(5).max(604800).optional().default(300).describe('Durée en secondes (min: 5s, max: 7j, défaut: 5m pour tests)'),
  allowMultiple: z.boolean().optional().default(false).describe('Autoriser plusieurs réponses'),
  anonymous: z.boolean().optional().default(false).describe('Sondage anonyme')
});

// Type pour les résultats du sondage
export interface PollResult {
  id: string;
  messageId?: string;  // ID du message Discord
  channelId?: string;  // ID du canal Discord
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

// Configuration des boutons pour les sondages
export const getPollButtons = (pollId: string, options: string[]) => {
  const buttons = options.map((option, index) => {
    return new ButtonBuilder()
      .setCustomId(`poll_${pollId}_${index}`)
      .setLabel(option)
      .setEmoji(getEmojiForIndex(index))
      .setStyle(ButtonStyle.Secondary);
  });

  // Ajouter les boutons de contrôle
  buttons.push(
    new ButtonBuilder()
      .setCustomId(`poll_${pollId}_end`)
      .setLabel('Terminer le sondage')
      .setEmoji('🏁')
      .setStyle(ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId(`poll_${pollId}_results`)
      .setLabel('Voir les résultats')
      .setEmoji('📊')
      .setStyle(ButtonStyle.Primary)
  );

  return buttons;
};

// Obtenir un emoji pour chaque option
const getEmojiForIndex = (index: number): string => {
  const emojis = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'];
  return emojis[index] || '📍';
};

// Créer l'embed du sondage avec interface améliorée
export const createPollEmbed = (question: string, options: string[], duration: number, anonymous: boolean, allowMultiple: boolean) => {
  // Créer la liste des options avec emojis et espaces pour une meilleure lisibilité
  const optionsList = options.map((opt, i) => {
    const emoji = getEmojiForIndex(i);
    return `> ${emoji} **${opt}**`;
  }).join('\n');

  return {
    title: '🗳️ Nouveau Sondage',
    description: `**${question}**\n\nCliquez sur le bouton **🗳️ Voter** ci-dessous pour sélectionner votre choix !`,
    color: 0x5865F2, // Couleur Discord blurple
    fields: [
      {
        name: '📋 Options disponibles',
        value: optionsList || 'Aucune option',
        inline: false
      },
      {
        name: '⚙️ Paramètres',
        value: `⏱️ **Durée:** ${formatDuration(duration)}\n${anonymous ? '👤 **Mode:** Anonyme' : '👁️ **Mode:** Public'}\n${allowMultiple ? '✅ **Choix multiples autorisés**' : '⚪ **Un seul choix possible**'}`,
        inline: false
      }
    ],
    thumbnail: {
      // Pour changer l'image (marteau/logo), modifiez l'URL ci-dessous
      url: 'https://i.imgur.com/4M34hi2.png'
    },
    timestamp: new Date().toISOString(),
    footer: {
      text: '💡 Cliquez sur "Voter" pour participer au sondage'
    }
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
    }).join('\n\n');

  return {
    title: pollResult.ended ? '🏁 Sondage Terminé' : '📊 Résultats en Direct',
    description: `**${pollResult.question}**\n\n${pollResult.ended ? '✅ Le sondage est maintenant fermé.' : '⏳ Le sondage est toujours en cours...'}`,
    color: pollResult.ended ? 0x00FF00 : 0x5865F2,
    fields: [
      {
        name: '📊 Résultats détaillés',
        value: resultsWithBars || 'Aucun vote pour le moment',
        inline: false
      },
      {
        name: '📈 Statistiques',
        value: `**Total des votes:** ${pollResult.totalVotes}\n**Statut:** ${pollResult.ended ? '✅ Terminé' : '⏳ En cours'}\n**Fin:** <t:${Math.floor(pollResult.endTime.getTime() / 1000)}:R>`,
        inline: false
      }
    ],
    thumbnail: {
      // Pour changer l'image des résultats, modifiez l'URL ci-dessous
      url: 'https://i.imgur.com/4M34hi2.png'
    },
    timestamp: new Date().toISOString(),
    footer: {
      text: pollResult.ended ? '🏁 Sondage terminé - Merci pour votre participation !' : '⏳ Votez maintenant pour influencer le résultat !'
    }
  };
};

// Créer une barre de progression
const createProgressBar = (percentage: number): string => {
  const totalBars = 10;
  const filledBars = Math.round((percentage / 100) * totalBars);
  const emptyBars = totalBars - filledBars;
  return '█'.repeat(filledBars) + '░'.repeat(emptyBars);
};