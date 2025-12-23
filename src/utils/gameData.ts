// ============================================================================
// DONNÉES POUR LES MINI-JEUX
// ============================================================================

// Séparateurs visuels pour le design
export const VISUAL_SEPARATORS = {
  line: '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
  dots: '• • • • • • • • • • • • • • •',
  stars: '★ ☆ ★ ☆ ★ ☆ ★ ☆ ★ ☆ ★ ☆ ★ ☆ ★',
  arrows: '➤ ➤ ➤ ➤ ➤ ➤ ➤ ➤ ➤ ➤ ➤ ➤ ➤ ➤ ➤',
  wave: '〰️〰️〰️〰️〰️〰️〰️〰️〰️〰️〰️〰️〰️〰️〰️',
  sparkles: '✨ ✨ ✨ ✨ ✨ ✨ ✨ ✨ ✨ ✨',
  fire: '🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥',
  diamonds: '💎 💎 💎 💎 💎 💎 💎 💎 💎 💎',
};

// Badges visuels
export const VISUAL_BADGES = {
  hot: '🔥 HOT',
  new: '✨ NEW',
  trending: '📈 TRENDING',
  vip: '👑 VIP',
  verified: '✅ VERIFIED',
  premium: '💎 PREMIUM',
  live: '🔴 LIVE',
  beta: '🧪 BETA',
};

// Animations de réussite
export const SUCCESS_ANIMATIONS = {
  confetti: '🎉🎊✨🌟💫⭐🎉🎊✨🌟💫⭐',
  fireworks: '🎆🎇✨💥🎆🎇✨💥🎆🎇✨💥',
  trophy: '🏆🥇🎖️🏅👑🏆🥇🎖️🏅👑',
  party: '🥳🎉🎈🎁🪅🎊🥳🎉🎈🎁',
  stars: '⭐🌟✨💫⭐🌟✨💫⭐🌟✨💫',
  hearts: '💚💙💜❤️🧡💛💚💙💜❤️',
  money: '💰💵💎🤑💰💵💎🤑💰💵',
  rocket: '🚀✨🌟💫🚀✨🌟💫🚀✨',
};

// Animations d'échec
export const FAILURE_ANIMATIONS = {
  sad: '😢😭💔😿😞😢😭💔😿😞',
  explosion: '💥💢❌🚫💥💢❌🚫💥💢',
  skull: '💀☠️👻😵💀☠️👻😵💀☠️',
  rain: '🌧️💧😢🌧️💧😢🌧️💧😢🌧️',
  broken: '💔🔴❌⛔💔🔴❌⛔💔🔴',
  warning: '⚠️🚨❗❌⚠️🚨❗❌⚠️🚨',
};

// Messages de confirmation
export const CONFIRMATION_MESSAGES = {
  success: {
    fr: [
      '✅ **Bravo !** Vous avez réussi !',
      '🎉 **Excellent !** C\'est la bonne réponse !',
      '🏆 **Félicitations !** Vous êtes un champion !',
      '⭐ **Parfait !** Continuez comme ça !',
      '💪 **Impressionnant !** Quelle performance !',
      '🚀 **Incroyable !** Vous êtes en feu !',
    ],
    en: [
      '✅ **Great job!** You got it right!',
      '🎉 **Excellent!** That\'s correct!',
      '🏆 **Congratulations!** You\'re a champion!',
    ],
  },
  failure: {
    fr: [
      '❌ **Dommage !** Ce n\'était pas la bonne réponse.',
      '😢 **Raté !** Essayez encore !',
      '💪 **Presque !** Vous y étiez presque !',
      '🔄 **Pas grave !** Retentez votre chance !',
      '📚 **Continuez !** L\'apprentissage c\'est la clé !',
    ],
    en: [
      '❌ **Too bad!** That wasn\'t the right answer.',
      '😢 **Missed!** Try again!',
    ],
  },
  retry: {
    fr: '🔄 **Réessayer ?** Cliquez sur le bouton ci-dessous !',
    en: '🔄 **Try again?** Click the button below!',
  },
};
