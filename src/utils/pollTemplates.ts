/**
 * Templates prédéfinis pour les sondages avec configurations avancées
 */

export interface PollTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: number;
  thumbnail?: string;
  image?: string;
  fieldNames: {
    options: string;
    parameters: string;
    influence?: string;
  };
  customizations: {
    allowMultiple: boolean;
    anonymous: boolean;
    showProgressBar: boolean;
    showPercentages: boolean;
    showTotalVotes: boolean;
    enableComments: boolean;
  };
}

// Templates prédéfinis
export const POLL_TEMPLATES: Record<string, PollTemplate> = {
  // Template Classique
  classic: {
    id: 'classic',
    name: 'Classique',
    description: 'Sondage simple et efficace',
    icon: '🗳️',
    color: 0x5865f2,
    fieldNames: {
      options: '📋 Options disponibles',
      parameters: '⚙️ Paramètres',
    },
    customizations: {
      allowMultiple: false,
      anonymous: false,
      showProgressBar: true,
      showPercentages: true,
      showTotalVotes: true,
      enableComments: false,
    },
  },

  // Template Mystique (pour Jul 😄)
  mystical: {
    id: 'mystical',
    name: 'Mystique',
    description: 'Consultation mystique et professionnelle',
    icon: '🔮',
    color: 0x6b0f1a,
    thumbnail: 'https://cdn-icons-png.flaticon.com/512/3159/3159446.png',
    image: 'https://i.imgur.com/7kFxrV4.png',
    fieldNames: {
      options: "🌟 Choix Offerts par l'Univers",
      parameters: '⏳ Temporalité du Destin',
      influence: '💫 Influence sur votre Carrière',
    },
    customizations: {
      allowMultiple: true,
      anonymous: true,
      showProgressBar: true,
      showPercentages: true,
      showTotalVotes: true,
      enableComments: true,
    },
  },

  // Template Professionnel
  professional: {
    id: 'professional',
    name: 'Professionnel',
    description: 'Sondage business et corporate',
    icon: '💼',
    color: 0x2c3e50,
    fieldNames: {
      options: '📊 Choix Disponibles',
      parameters: '⚙️ Configuration',
    },
    customizations: {
      allowMultiple: false,
      anonymous: false,
      showProgressBar: true,
      showPercentages: true,
      showTotalVotes: true,
      enableComments: false,
    },
  },

  // Template Fun
  fun: {
    id: 'fun',
    name: 'Divertissement',
    description: 'Sondage ludique et amusant',
    icon: '🎉',
    color: 0xe91e63,
    fieldNames: {
      options: '🎮 Options Fun',
      parameters: '🎯 Réglages',
    },
    customizations: {
      allowMultiple: true,
      anonymous: true,
      showProgressBar: true,
      showPercentages: true,
      showTotalVotes: true,
      enableComments: true,
    },
  },

  // Template Anonymous
  anonymous: {
    id: 'anonymous',
    name: 'Anonyme',
    description: 'Sondage confidentiel et discret',
    icon: '🕵️',
    color: 0x9c27b0,
    fieldNames: {
      options: '🔒 Options',
      parameters: '🔐 Confidentialité',
    },
    customizations: {
      allowMultiple: false,
      anonymous: true,
      showProgressBar: false,
      showPercentages: true,
      showTotalVotes: false,
      enableComments: false,
    },
  },

  // Template Quick (vote rapide)
  quick: {
    id: 'quick',
    name: 'Vote Rapide',
    description: 'Sondage express sans fioritures',
    icon: '⚡',
    color: 0xffc107,
    fieldNames: {
      options: '⚡ Choix',
      parameters: '⏱️ Timing',
    },
    customizations: {
      allowMultiple: false,
      anonymous: false,
      showProgressBar: false,
      showPercentages: false,
      showTotalVotes: true,
      enableComments: false,
    },
  },

  // Template Carrière (pour Jul)
  career: {
    id: 'career',
    name: 'Carrière',
    description: 'Sondage orienté développement professionnel',
    icon: '🚀',
    color: 0x00bcd4,
    fieldNames: {
      options: '💼 Opportunités de Carrière',
      parameters: '📈 Paramètres de Croissance',
      influence: '🎯 Impact sur votre Parcours',
    },
    customizations: {
      allowMultiple: true,
      anonymous: true,
      showProgressBar: true,
      showPercentages: true,
      showTotalVotes: true,
      enableComments: true,
    },
  },

  // Template Gaming
  gaming: {
    id: 'gaming',
    name: 'Gaming',
    description: 'Sondage pour la communauté gamer',
    icon: '🎮',
    color: 0x673ab7,
    fieldNames: {
      options: '🕹️ Choix de Jeu',
      parameters: '🎯 Setup',
    },
    customizations: {
      allowMultiple: true,
      anonymous: false,
      showProgressBar: true,
      showPercentages: true,
      showTotalVotes: true,
      enableComments: true,
    },
  },
};

// Obtenir un template par ID
export function getPollTemplate(templateId: string): PollTemplate {
  return POLL_TEMPLATES[templateId] || POLL_TEMPLATES.classic;
}

// Lister tous les templates
export function listPollTemplates(): Array<{ id: string; name: string; description: string }> {
  return Object.values(POLL_TEMPLATES).map(template => ({
    id: template.id,
    name: template.name,
    description: template.description,
  }));
}
