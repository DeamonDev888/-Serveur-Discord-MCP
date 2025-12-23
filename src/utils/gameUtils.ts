// ============================================================================
// FONCTIONS UTILITAIRES POUR LES MINI-JEUX
// ============================================================================

import {
  SUCCESS_ANIMATIONS,
  FAILURE_ANIMATIONS,
  CONFIRMATION_MESSAGES,
  VISUAL_SEPARATORS,
  VISUAL_BADGES
} from './gameData.js';

// Fonction pour générer un message de confirmation
export function generateConfirmationMessage(type: 'success' | 'failure', lang: 'fr' | 'en' = 'fr'): string {
  const messages = CONFIRMATION_MESSAGES[type][lang];
  return messages[Math.floor(Math.random() * messages.length)];
}

// Fonction pour générer une animation
export function generateAnimation(type: 'success' | 'failure', style?: string): string {
  if (type === 'success') {
    const animations = SUCCESS_ANIMATIONS;
    const key = style && style in animations ? style as keyof typeof animations : 'confetti';
    return animations[key];
  } else {
    const animations = FAILURE_ANIMATIONS;
    const key = style && style in animations ? style as keyof typeof animations : 'sad';
    return animations[key];
  }
}

// Fonction pour générer un résultat de jeu complet
export function generateGameResult(
  isSuccess: boolean,
  options: {
    points?: number;
    badge?: string;
    correctAnswer?: string;
    userAnswer?: string;
    animationStyle?: string;
    showRetry?: boolean;
    lang?: 'fr' | 'en';
  } = {}
): string {
  const lang = options.lang || 'fr';
  const animation = generateAnimation(isSuccess ? 'success' : 'failure', options.animationStyle);
  const message = generateConfirmationMessage(isSuccess ? 'success' : 'failure', lang);

  let result = `${animation}\n\n${message}\n\n`;

  if (isSuccess) {
    if (options.points) {
      result += `💰 **+${options.points} points** gagnés !\n`;
    }
    if (options.badge) {
      result += `🏅 **Nouveau badge:** ${options.badge}\n`;
    }
  } else {
    if (options.correctAnswer) {
      result += `📝 **Bonne réponse:** ${options.correctAnswer}\n`;
    }
    if (options.userAnswer) {
      result += `❌ **Votre réponse:** ${options.userAnswer}\n`;
    }
  }

  if (options.showRetry) {
    result += `\n${CONFIRMATION_MESSAGES.retry[lang]}`;
  }

  result += `\n${animation}`;

  return result;
}

// Fonction pour générer un mini-jeu avec design amélioré
export function generateMinigame(game: any, gameId: string): string {
  let gameText = '';
  const separator = VISUAL_SEPARATORS.line;

  switch (game.type) {
    case 'quiz':
      gameText = `${separator}
╔══════════════════════════════╗
║  🎮 **QUIZ #${gameId}**  ${VISUAL_BADGES.hot}
╚══════════════════════════════╝

❓ ${game.question}

${game.options?.map((opt: string, i: number) => {
  const letters = ['🅰️', '🅱️', '©️', '🇩'];
  return `${letters[i] || `${String.fromCharCode(65 + i)}.`} ${opt}`;
}).join('\n') || ''}

${game.emoji ? `\n${game.emoji}` : ''}
💡 *Cliquez sur un bouton pour répondre !*
${game.rewards ? `\n🏆 **Récompense:** ${game.rewards.points} pts${game.rewards.badge ? ` + 🏅 ${game.rewards.badge}` : ''}` : ''}
${separator}`;
      break;

    case 'emoji_reaction':
      gameText = `${VISUAL_SEPARATORS.sparkles}
🎯 **JEU D'EMOJIS #${gameId}**

${game.question}

${game.emoji ? `👉 Cliquez: ${game.emoji}` : '👆 Réagissez !'}

${game.rewards ? `🎁 **+${game.rewards.points || 10} points**` : ''}
${VISUAL_SEPARATORS.sparkles}`;
      break;

    case 'trivia':
      gameText = `${VISUAL_SEPARATORS.stars}
🧠 **TRIVIA #${gameId}** ${VISUAL_BADGES.trending}

❓ ${game.question}

💡 *Utilisez les boutons pour répondre*

${game.rewards ? `🏆 **Récompense:** ${game.rewards.points} pts${game.rewards.badge ? `\n🏅 **Badge:** ${game.rewards.badge}` : ''}` : ''}
${VISUAL_SEPARATORS.stars}`;
      break;

    case 'riddle':
      gameText = `${VISUAL_SEPARATORS.diamonds}
🔮 **ÉNIGME #${gameId}** ${VISUAL_BADGES.premium}

🤔 *${game.question}*

💭 Réfléchissez bien...
⏱️ Prenez votre temps !

🎁 **Bonne réponse = ${game.rewards?.points || 10} points**
${VISUAL_SEPARATORS.diamonds}`;
      break;

    case 'puzzle':
      gameText = `${VISUAL_SEPARATORS.fire}
🧩 **PUZZLE #${gameId}** ${VISUAL_BADGES.new}

${game.question}

${game.emoji || '🎯'} *Résolvez le puzzle !*

⚡ *Interagissez avec les boutons*
${VISUAL_SEPARATORS.fire}`;
      break;

    default:
      gameText = `🎮 Mini-jeu #${gameId}`;
  }

  return gameText;
}

// Export des séparateurs visuels pour usage externe
export { VISUAL_SEPARATORS };
