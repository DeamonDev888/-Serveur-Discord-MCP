/**
 * 📚 EXEMPLES PRATIQUES - Outils MCP Discord
 * =============================================
 *
 * Ce fichier contient des exemples prêts à l'emploi pour une utilisation one-shot
 * des outils MCP Discord. Copiez-collez et adaptez selon vos besoins.
 *
 * Tous les exemples utilisent des schémas Zod validés automatiquement.
 */

import { z } from 'zod';

// ============================================================================
// 1. GESTION DES MESSAGES
// ============================================================================

/**
 * Exemple 1.1: Envoi d'un message simple
 */
export const exampleSendSimpleMessage = {
  tool: 'mcp__discord-server__envoyer_message',
  params: {
    channelId: 'VOTRE_CHANNEL_ID',
    message: '🎉 Message de test envoyé avec succès !',
  },
};

/**
 * Exemple 1.2: Envoi d'un message avec réponse à un autre message
 */
export const exampleSendReplyMessage = {
  tool: 'mcp__discord-server__send_message',
  params: {
    channelId: 'VOTRE_CHANNEL_ID',
    content: 'Réponse à votre message !',
    replyTo: 'ID_DU_MESSAGE_ORIGINAL',
    mentionRepliedUser: true,
  },
};

/**
 * Exemple 1.3: Modification d'un message existant
 */
export const exampleEditMessage = {
  tool: 'mcp__discord-server__edit_message',
  params: {
    channelId: 'VOTRE_CHANNEL_ID',
    messageId: 'ID_DU_MESSAGE_A_MODIFIER',
    content: '✨ Message modifié avec succès !',
    embeds: [],
    components: [],
  },
};

// ============================================================================
// 2. EMBEDS ULTRA-AMÉLIORÉS 🚀
// ============================================================================

/**
 * Exemple 2.1: Embed simple avec couleur et champs (VERSION AMÉLIORÉE)
 */
export const exampleEmbedSimple = {
  tool: 'mcp__discord-server__creer_embed',
  params: {
    channelId: 'VOTRE_CHANNEL_ID',
    title: '🚀 Nouvelle Fonctionnalité !',
    description: 'Nous venons de déployer une nouvelle fonctionnalité amazing.',
    color: 'GREEN',
    fields: [
      { name: '✅ Statut', value: 'Déployé', inline: true },
      { name: '📅 Date', value: '{date} à {time}', inline: true },
    ],
    timestamp: true,
  },
};

/**
 * Exemple 2.2: 🎯 RÊVE EXAUCÉ - Rapport Trading avec tableaux auto-stylés
 */
export const exampleDreamTradingReport = {
  tool: 'mcp__discord-server__creer_embed',
  params: {
    channelId: 'VOTRE_CHANNEL_ID',
    title: '📊 Rapport Trading - ETHUSD',
    description: `Mise à jour: {timestamp}

**Performance du jour**`,
    color: '#00FF00',
    authorName: '🤖 Bot Trading',
    authorIcon: 'https://i.imgur.com/trading-icon.png',
    footerText: 'Données en temps réel',

    // 🎯 TABLEAUX AUTOMATIQUES
    fields: [
      {
        name: '📈 Prix Actuel',
        value: `| Symbole | Prix    | Variation |
| ETHUSD  | $3,245  | +2.34%   |
| BTCUSD  | $42,150 | -1.12%   |
| Total   | $45,395 | +1.22%   |`,
        inline: false,
      },
      {
        name: '📊 Positions Ouvertes',
        value: `| Position | P&L     | Risk   |
| Long    | +$125   | 2.5%   |
| Short   | -$45    | 1.2%   |
| Hedge   | +$30    | 0.8%   |`,
        inline: false,
      },
    ],

    // 🎯 VARIABLES DYNAMIQUES
    variables: {
      symbol: 'ETHUSD',
      price: '$3,245',
      change: '+2.34%',
    },

    // 🎯 PAGINATION (pour contenus longs)
    pagination: {
      enabled: true,
      maxLength: 800,
      showPageNumber: true,
    },

    // 🎯 BOUTONS INTERACTIFS
    buttons: [
      {
        label: '🔄 Actualiser',
        style: 'Primary',
        emoji: '🔄',
        action: 'refresh',
      },
      {
        label: '📈 Détails',
        style: 'Success',
        emoji: '📊',
        action: 'link',
        value: 'https://trading.example.com/details',
      },
    ],

    // 🎯 BARRES DE PROGRESSION
    progressBars: [
      {
        fieldIndex: 0,
        label: 'Objectif Journalier',
        value: 78,
        max: 100,
        length: 15,
      },
      {
        fieldIndex: 0,
        label: 'Risk Management',
        value: 65,
        max: 100,
        length: 15,
      },
    ],

    // 🎯 VALIDATION STRICTE
    strictValidation: true,
    autoTable: true,
  },
};

/**
 * Exemple 2.3: ✨ Embed avec Templates Sauvegardables
 */
export const exampleEmbedWithTemplate = {
  tool: 'mcp__discord-server__creer_embed',
  params: {
    channelId: 'VOTRE_CHANNEL_ID',
    title: '📋 Rapport Hebdomadaire',
    description: 'Analyse de la semaine {weekday} {date}',

    // Utiliser un template existant
    templateName: 'weekly-report',

    // Ou sauvegarder comme nouveau template
    saveAsTemplate: 'my-favorite-design',

    // Variables personnalisées
    variables: {
      weekNumber: '52',
      year: '{year}',
      revenue: '$125,430',
      growth: '+12.5%',
    },

    // Auto-update toutes les 5 minutes
    autoUpdate: {
      enabled: true,
      interval: 300,
      source: 'api://weekly-stats',
    },

    // Boutons pour interaction
    buttons: [
      {
        label: '📥 Télécharger PDF',
        style: 'Primary',
        emoji: '📄',
        action: 'link',
        value: 'https://reports.example.com/weekly.pdf',
      },
      {
        label: '📧 Envoyer par Email',
        style: 'Secondary',
        emoji: '✉️',
        action: 'custom',
      },
    ],

    timestamp: true,
  },
};

/**
 * Exemple 2.4: 🎮 Embed avec Progress Bars et Spoilers
 */
export const exampleEmbedWithProgress = {
  tool: 'mcp__discord-server__creer_embed',
  params: {
    channelId: 'VOTRE_CHANNEL_ID',
    title: '🎮 Progression Quête Épique',
    description: `Quête: {spoiler: Le Secret des Dragons Anciens}
Progression mise à jour: {timestamp}`,

    color: 'PURPLE',
    fields: [
      {
        name: '👤 Niveau du Joueur',
        value: 'Niveau 24 / 50',
        inline: true,
      },
      {
        name: '⚔️ XP Actuel',
        value: '8,450 / 12,000 XP',
        inline: true,
      },
    ],

    // Barres de progression automatiques
    progressBars: [
      {
        fieldIndex: 0,
        label: '🎯 Quête Principale',
        value: 65,
        max: 100,
        length: 20,
      },
      {
        fieldIndex: 1,
        label: '📚 Compétences',
        value: 42,
        max: 60,
        length: 20,
      },
      {
        fieldIndex: 1,
        label: '🏆 Succès',
        value: 18,
        max: 25,
        length: 20,
      },
    ],

    timestamp: true,
  },
};

/**
 * Exemple 2.5: 📊 Embed avec Variables Dynamiques Complètes
 */
export const exampleEmbedWithVariables = {
  tool: 'mcp__discord-server__creer_embed',
  params: {
    channelId: 'VOTRE_CHANNEL_ID',
    title: '📈 Dashboard Automatique - {symbol}',
    description: `
**Rapport généré le {timestamp}**

Bienvenue {username} ! Aujourd'hui nous sommes {weekday}, {date}.

{spoiler: Les données confidentielles sont masquées par défaut}
    `,

    color: 'BLUE',
    fields: [
      {
        name: '📅 Informations Temporelles',
        value: `• Année: {year}
• Mois: {month}
• Jour: {day}
• Heure: {time}`,
        inline: true,
      },
      {
        name: '💰 Données Personnalisées',
        value: `• Prix: {price}
• Variation: {change}
• Volume: {volume}
• Market Cap: {marketCap}`,
        inline: true,
      },
    ],

    // Variables personnalisées (seront remplies par l'API ou l'utilisateur)
    variables: {
      username: 'TraderPro',
      symbol: 'BTCUSD',
      price: '$42,150',
      change: '+2.34%',
      volume: '1.2M',
      marketCap: '$825B',
    },

    timestamp: true,
  },
};

/**
 * Exemple 2.6: 🎨 Embed v2 avec GRADIENTS
 */
export const exampleEmbedV2WithGradient = {
  tool: 'mcp__discord-server__creer_embed_v2',
  params: {
    channelId: 'VOTRE_CHANNEL_ID',
    title: '🌈 Rapport avec Dégradé',
    description: 'Ce rapport utilise un magnifique dégradé de couleurs !',

    // ✨ NOUVEAU: Gradients
    gradient: {
      start: '#FF6B6B',
      end: '#4ECDC4',
    },

    color: '#FF6B6B', // Couleur de base (début du gradient)

    fields: [
      {
        name: '🎨 Type de Gradient',
        value: 'Sunset → Ocean',
        inline: true,
      },
      {
        name: '🌈 Couleur Début',
        value: '#FF6B6B (Rouge corail)',
        inline: true,
      },
      {
        name: '🌊 Couleur Fin',
        value: '#4ECDC4 (Turquoise)',
        inline: true,
      },
    ],

    footerText: 'Gradient généré automatiquement',

    timestamp: true,
  },
};

/**
 * Exemple 2.7: 🎭 Embed v2 avec THÈMES
 */
export const exampleEmbedV2WithTheme = {
  tool: 'mcp__discord-server__creer_embed_v2',
  params: {
    channelId: 'VOTRE_CHANNEL_ID',
    title: '🤖 Dashboard Gaming',
    description: 'Interface gaming avec thème automatique',

    // ✨ NOUVEAU: Thème Gaming
    theme: 'gaming',

    fields: [
      {
        name: '🎮 Statut Serveur',
        value: 'En ligne',
        inline: true,
      },
      {
        name: '👥 Joueurs Connectés',
        value: '1,234',
        inline: true,
      },
      {
        name: '🏆 Matchs Actifs',
        value: '42',
        inline: true,
      },
    ],

    timestamp: true,
  },
};

/**
 * Exemple 2.8: 📊 Embed v2 avec AUTO-UPDATE
 */
export const exampleEmbedV2WithAutoUpdate = {
  tool: 'mcp__discord-server__creer_embed_v2',
  params: {
    channelId: 'VOTRE_CHANNEL_ID',
    title: '💹 Prix Crypto en Temps Réel',
    description: 'Mise à jour automatique toutes les 30 secondes',

    color: '#F7931A',

    fields: [
      {
        name: '₿ Bitcoin (BTC)',
        value: 'Prix: $42,150\n24h: +2.34%',
        inline: true,
      },
      {
        name: 'Ξ Ethereum (ETH)',
        value: 'Prix: $3,245\n24h: -1.12%',
        inline: true,
      },
      {
        name: '📈 Market Cap',
        value: '$1.65T',
        inline: true,
      },
    ],

    // ✨ NOUVEAU: Auto-update RÉEL
    autoUpdate: {
      enabled: true,
      interval: 30,
      source: 'api://crypto-prices',
    },

    // ✨ NOUVEAU: Analytics
    enableAnalytics: true,

    buttons: [
      {
        label: '🔄 Actualiser',
        style: 'Primary',
        emoji: '🔄',
        action: 'refresh',
      },
      {
        label: '📊 Graphique',
        style: 'Success',
        emoji: '📈',
        action: 'link',
        value: 'https://charts.example.com/btc',
      },
    ],

    timestamp: true,
  },
};

/**
 * Exemple 2.9: 🌃 Embed v2 Thème CYBERPUNK
 */
export const exampleEmbedV2Cyberpunk = {
  tool: 'mcp__discord-server__creer_embed_v2',
  params: {
    channelId: 'VOTRE_CHANNEL_ID',
    title: '⚡ Système Cyberpunk 2077',
    description: `Connexion au réseau: {timestamp}
Statut: {spoiler: EN LIGNE}`,

    // ✨ NOUVEAU: Thème Cyberpunk
    theme: 'cyberpunk',

    gradient: {
      start: '#FF00FF',
      end: '#00FFFF',
    },

    fields: [
      {
        name: '🔮 Accès Réseau',
        value: '| Niveau | Statut     |\n| Admin  | Autorisé   |\n| User   | Autorisé   |',
        inline: false,
      },
      {
        name: '⚡ Power',
        value: '████████░░ 85%',
        inline: true,
      },
      {
        name: '🛡️ Shield',
        value: '██████░░░░ 60%',
        inline: true,
      },
    ],

    variables: {
      userLevel: 'Admin',
      location: 'Night City',
    },

    timestamp: true,
  },
};

/**
 * Exemple 2.10: 🏢 Embed v2 Thème CORPORATE
 */
export const exampleEmbedV2Corporate = {
  tool: 'mcp__discord-server__creer_embed_v2',
  params: {
    channelId: 'VOTRE_CHANNEL_ID',
    title: '💼 Rapport Financier Q4',
    description: 'Présentation des résultats trimestriels',

    // ✨ NOUVEAU: Thème Corporate
    theme: 'corporate',

    fields: [
      {
        name: '📊 Chiffre d\'Affaires',
        value: '$12.5M (+15%)',
        inline: true,
      },
      {
        name: '💰 Bénéfice Net',
        value: '$2.1M (+22%)',
        inline: true,
      },
      {
        name: '📈 Croissance',
        value: '+18%',
        inline: true,
      },
      {
        name: '👥 Effectif',
        value: '245 employés',
        inline: true,
      },
    ],

    progressBars: [
      {
        fieldIndex: 0,
        label: 'Objectif CA',
        value: 87,
        max: 100,
        length: 20,
      },
      {
        fieldIndex: 1,
        label: 'Satisfaction Client',
        value: 92,
        max: 100,
        length: 20,
      },
    ],

    timestamp: true,
  },
};

/**
 * Exemple 2.11: 🌊 Embed v2 Thème OCEAN
 */
export const exampleEmbedV2Ocean = {
  tool: 'mcp__discord-server__creer_embed_v2',
  params: {
    channelId: 'VOTRE_CHANNEL_ID',
    title: '🌊 Données Océanographiques',
    description: `Station: Pacific Buoy #42
Mesure: {timestamp ✨ NOUV}`,

    //EAU: Thème Ocean
    theme: 'ocean',

    gradient: {
      start: '#00CED1',
      end: '#4169E1',
    },

    fields: [
      {
        name: '🌡️ Température Eau',
        value: '18.5°C',
        inline: true,
      },
      {
        name: '🌊 Hauteur Vague',
        value: '2.3m',
        inline: true,
      },
      {
        name: '💨 Vent',
        value: '25 km/h NE',
        inline: true,
      },
      {
        name: '🐋 Activité Faune',
        value: 'Haute',
        inline: true,
      },
    ],

    timestamp: true,
  },
};

/**
 * Exemple 2.12: 🌅 Embed v2 Thème SUNSET
 */
export const exampleEmbedV2Sunset = {
  tool: 'mcp__discord-server__creer_embed_v2',
  params: {
    channelId: 'VOTRE_CHANNEL_ID',
    title: '🌅 Coucher de Soleil Report',
    description: 'Photos et données du coucher de soleil',

    // ✨ NOUVEAU: Thème Sunset
    theme: 'sunset',

    gradient: {
      start: '#FF6B6B',
      end: '#FFA07A',
    },

    fields: [
      {
        name: '📸 Photos Prises',
        value: '| Heure     | Qualité |\n| 18:45    | ★★★★★ |\n| 19:15    | ★★★★☆ |',
        inline: false,
      },
      {
        name: '🎨 Couleurs Dominantes',
        value: 'Rouge: 65%\nOrange: 25%\nJaune: 10%',
        inline: true,
      },
      {
        name: '⏰ Durée',
        value: '23 minutes',
        inline: true,
      },
    ],

    variables: {
      location: 'Plage de Malibu',
      photographer: 'SunsetHunter',
    },

    timestamp: true,
  },
};

/**
 * Exemple 2.13: 📊 Analytics en Action
 */
export const exampleEmbedV2WithFullAnalytics = {
  tool: 'mcp__discord-server__creer_embed_v2',
  params: {
    channelId: 'VOTRE_CHANNEL_ID',
    title: '📊 Dashboard Analytics',
    description: 'Cet embed track toutes les interactions !',

    theme: 'minimal',

    fields: [
      {
        name: '📈 Métriques en Temps Réel',
        value: 'Les statistiques sont mises à jour automatiquement',
        inline: false,
      },
    ],

    // Analytics activées
    enableAnalytics: true,

    buttons: [
      {
        label: '📊 Voir Stats',
        style: 'Primary',
        emoji: '📊',
        action: 'custom',
      },
      {
        label: '📥 Exporter',
        style: 'Success',
        emoji: '📥',
        action: 'link',
        value: 'https://analytics.example.com/export',
      },
      {
        label: '⚙️ Config',
        style: 'Secondary',
        emoji: '⚙️',
        action: 'custom',
      },
    ],

    timestamp: true,
  },
};

// ============================================================================
// 3. SONDAGES INTERACTIFS
// ============================================================================

/**
 * Exemple 3.1: Sondage simple
 */
export const examplePollSimple = {
  tool: 'mcp__discord-server__creer_sondage',
  params: {
    channelId: 'VOTRE_CHANNEL_ID',
    question: 'Quelle couleur préférez-vous pour le nouveau design ?',
    options: ['Rouge', 'Bleu', 'Vert', 'Jaune'],
    duration: 3600,
    allowMultiple: false,
    anonymous: false,
  },
};

/**
 * Exemple 3.2: Sondage anonyme avec choix multiples
 */
export const examplePollAnonymous = {
  tool: 'mcp__discord-server__creer_sondage',
  params: {
    channelId: 'VOTRE_CHANNEL_ID',
    question: 'Sélectionnez toutes les fonctionnalités souhaitées :',
    options: [
      'Mode sombre',
      'Notifications push',
      'API REST',
      'Interface mobile',
      'Intégration GitHub',
    ],
    duration: 86400,
    allowMultiple: true,
    anonymous: true,
  },
};

/**
 * Exemple 3.3: Sondage court (5 secondes) pour test
 */
export const examplePollTest = {
  tool: 'mcp__discord-server__creer_sondage',
  params: {
    channelId: 'VOTRE_CHANNEL_ID',
    question: 'Test rapide - Êtes-vous là ?',
    options: ['Oui', 'Non'],
    duration: 5,
    allowMultiple: false,
    anonymous: false,
  },
};

// ============================================================================
// 4. BOUTONS PERSONNALISÉS
// ============================================================================

/**
 * Exemple 4.1: Boutons avec actions simples
 */
export const exampleButtonsSimple = {
  tool: 'mcp__discord-server__create_custom_buttons',
  params: {
    channelId: 'VOTRE_CHANNEL_ID',
    title: '🎮 Action Requise',
    description: 'Cliquez sur un bouton pour continuer',
    buttons: [
      {
        label: '✅ Confirmer',
        style: 'success',
        emoji: '✅',
        action: {
          type: 'message',
          data: { content: 'Action confirmée !' },
        },
      },
      {
        label: '❌ Annuler',
        style: 'danger',
        emoji: '❌',
        action: {
          type: 'message',
          data: { content: 'Action annulée.' },
        },
      },
    ],
  },
};

/**
 * Exemple 4.2: Bouton avec embed en action
 */
export const exampleButtonsWithEmbed = {
  tool: 'mcp__discord-server__create_custom_buttons',
  params: {
    channelId: 'VOTRE_CHANNEL_ID',
    title: '📋 Menu Principal',
    description: 'Choisissez une action dans le menu :',
    buttons: [
      {
        label: '📊 Voir les Statistiques',
        style: 'primary',
        emoji: '📊',
        action: {
          type: 'embed',
          data: {
            title: '📊 Statistiques du Serveur',
            description: 'Voici les statistiques en temps réel.',
            color: 'info',
            fields: [
              { name: '👥 Membres', value: '1,234', inline: true },
              { name: '💬 Messages', value: '56,789', inline: true },
              { name: '🕒 Uptime', value: '99.9%', inline: true },
            ],
            timestamp: true,
          },
        },
      },
    ],
  },
};

// ============================================================================
// 5. UPLOAD DE FICHIERS
// ============================================================================

/**
 * Exemple 5.1: Upload simple
 */
export const exampleFileUpload = {
  tool: 'mcp__discord-server__uploader_fichier',
  params: {
    channelId: 'VOTRE_CHANNEL_ID',
    filePath: '/chemin/vers/fichier.pdf',
    message: '📎 Nouveau document disponible',
    description: 'Documentation technique mise à jour',
    spoiler: false,
  },
};

/**
 * Exemple 5.2: Upload avec spoiler
 */
export const exampleFileUploadSpoiler = {
  tool: 'mcp__discord-server__uploader_fichier',
  params: {
    channelId: 'VOTRE_CHANNEL_ID',
    filePath: '/chemin/vers/image-spoiler.png',
    message: '🖼️ Image avec spoiler',
    description: 'Cliquez pour révéler (SPOILER)',
    spoiler: true,
  },
};

/**
 * Exemple 5.3: Upload avec nom personnalisé
 */
export const exampleFileUploadCustomName = {
  tool: 'mcp__discord-server__uploader_fichier',
  params: {
    channelId: 'VOTRE_CHANNEL_ID',
    filePath: '/chemin/vers/data.json',
    fileName: 'export-2025-12-19.json',
    message: '💾 Export des données',
    description: 'Sauvegarde quotidienne',
    spoiler: false,
  },
};

// ============================================================================
// 6. AFFICHAGE DE CODE
// ============================================================================

/**
 * Exemple 6.1: Code JavaScript
 */
export const exampleCodeJavaScript = {
  tool: 'mcp__discord-server__code_preview',
  params: {
    channelId: 'VOTRE_CHANNEL_ID',
    language: 'javascript',
    code: `// Fonction utilitaire pour formater les dates
function formatDate(date) {
  const options = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  };
  return new Intl.DateTimeFormat('fr-FR', options).format(date);
}

// Utilisation
console.log(formatDate(new Date()));`,
  },
};

/**
 * Exemple 6.2: Code Python
 */
export const exampleCodePython = {
  tool: 'mcp__discord-server__code_preview',
  params: {
    channelId: 'VOTRE_CHANNEL_ID',
    language: 'python',
    code: `# Classe pour gérer les utilisateurs
class UserManager:
    def __init__(self):
        self.users = []

    def add_user(self, user):
        """Ajouter un utilisateur"""
        if user not in self.users:
            self.users.append(user)
            return True
        return False

    def get_user_count(self):
        """Obtenir le nombre d'utilisateurs"""
        return len(self.users)

# Utilisation
manager = UserManager()
manager.add_user("Alice")
manager.add_user("Bob")
print(f"Nombre d'utilisateurs: {manager.get_user_count()}")`,
  },
};

/**
 * Exemple 6.3: Code Rust
 */
export const exampleCodeRust = {
  tool: 'mcp__discord-server__code_preview',
  params: {
    channelId: 'VOTRE_CHANNEL_ID',
    language: 'rust',
    code: `// Structure pour représentant un message
#[derive(Debug, Clone)]
pub struct Message {
    pub id: u64,
    pub content: String,
    pub author: String,
    pub timestamp: chrono::DateTime<chrono::Utc>,
}

impl Message {
    // Créer un nouveau message
    pub fn new(id: u64, content: String, author: String) -> Self {
        Self {
            id,
            content,
            author,
            timestamp: chrono::Utc::now(),
        }
    }

    // Obtenir un extrait du contenu
    pub fn snippet(&self, max_len: usize) -> &str {
        if self.content.len() <= max_len {
            &self.content
        } else {
            &self.content[..max_len]
        }
    }
}`,
  },
};

// ============================================================================
// 7. INFORMATIONS SERVEUR
// ============================================================================

/**
 * Exemple 7.1: Informations complètes du serveur
 */
export const exampleServerInfo = {
  tool: 'mcp__discord-server__get_server_info',
  params: {
    includeStats: true,
    includeFeatures: true,
  },
};

/**
 * Exemple 7.2: Liste des membres avec filtres
 */
export const exampleListMembers = {
  tool: 'mcp__discord-server__list_members',
  params: {
    limit: 50,
    sortBy: 'joined',
    order: 'desc',
    filter: 'online',
    searchRole: 'Admin',
  },
};

/**
 * Exemple 7.3: Informations détaillées d'un utilisateur
 */
export const exampleUserInfo = {
  tool: 'mcp__discord-server__get_user_info',
  params: {
    userId: 'ID_UTILISATEUR',
    guildId: 'ID_SERVEUR',
    includeActivity: true,
    includePermissions: true,
  },
};

// ============================================================================
// 9. TABLEAU DE BORD MCP
// ============================================================================

/**
 * Exemple 9.1: Création du tableau de bord MCP
 */
export const exampleMCPDashboard = {
  tool: 'mcp__discord-server__create_mcp_dashboard',
  params: {
    channelId: 'VOTRE_CHANNEL_ID',
  },
};

// ============================================================================
// 10. EXEMPLES AVANCÉS
// ============================================================================

/**
 * Exemple 10.1: Message avec embeds et boutons combinés
 */
export const exampleComplexMessage = {
  tool: 'mcp__discord-server__send_message',
  params: {
    channelId: 'VOTRE_CHANNEL_ID',
    content: '🎯 Nouvelle fonctionnalité disponible !',
    embeds: [
      {
        title: '🚀 Fonctionnalité X',
        description: 'Description détaillée de la fonctionnalité.',
        color: '#7289DA',
        fields: [{ name: '✨ Avantages', value: 'Point 1\nPoint 2\nPoint 3', inline: false }],
        timestamp: true,
      },
    ],
    components: [
      {
        type: 1,
        components: [
          {
            type: 2,
            style: 1,
            label: 'En savoir plus',
            custom_id: 'more_info',
          },
          {
            type: 2,
            style: 3,
            label: 'Activer',
            custom_id: 'enable_feature',
          },
        ],
      },
    ],
  },
};

/**
 * Exemple 10.2: Sondage avec embed personnalisé
 */
export const examplePollWithEmbed = {
  tool: 'mcp__discord-server__creer_sondage',
  params: {
    channelId: 'VOTRE_CHANNEL_ID',
    question: 'Quelle priorité pour le prochain sprint ?',
    options: [
      '🔴 Critique - À faire immédiatement',
      '🟡 Important - À planifier',
      '🟢 Normal - À intégrer dans le planning',
      '⚪ Faible - Si temps disponible',
    ],
    duration: 172800,
    allowMultiple: false,
    anonymous: true,
  },
};

// ============================================================================
// SCHÉMAS DE VALIDATION (pour référence)
// ============================================================================

export const EXAMPLE_SCHEMAS = {
  // Schéma pour message simple
  SendMessageSchema: z.object({
    channelId: z.string(),
    content: z.string(),
  }),

  // Schéma pour embed
  CreateEmbedSchema: z.object({
    channelId: z.string(),
    title: z.string().optional(),
    description: z.string().optional(),
    color: z.union([z.string(), z.number()]).optional(),
    fields: z
      .array(
        z.object({
          name: z.string(),
          value: z.string(),
          inline: z.boolean().optional(),
        })
      )
      .optional(),
    timestamp: z.boolean().optional(),
  }),

  // Schéma pour sondage
  CreatePollSchema: z.object({
    channelId: z.string(),
    question: z.string(),
    options: z.array(z.string()).min(2).max(10),
    duration: z.number().min(5).max(604800).optional(),
    allowMultiple: z.boolean().optional(),
    anonymous: z.boolean().optional(),
  }),

  // Schéma pour boutons
  CreateButtonsSchema: z.object({
    channelId: z.string(),
    title: z.string(),
    description: z.string().optional(),
    buttons: z.array(
      z.object({
        label: z.string(),
        style: z.enum(['primary', 'secondary', 'success', 'danger']),
        emoji: z.string().optional(),
        action: z.object({
          type: z.enum(['message', 'embed', 'poll']),
          data: z.record(z.any()),
        }),
      })
    ),
  }),
};

// ============================================================================
// NOTES D'UTILISATION
// ============================================================================

/**
 * 📝 NOTES IMPORTANTES :
 *
 * 1. Remplacez toujours 'VOTRE_CHANNEL_ID' par l'ID réel du canal
 * 2. Les IDs de messages, utilisateurs, etc. doivent être des chaînes valides
 * 3. Les durées de sondages sont en secondes (max: 604800 = 7 jours)
 * 4. Les couleurs peuvent être:
 *    - Noms: 'success', 'error', 'info', 'warning', etc.
 *    - Hex: '#3498DB', '#FF0000', etc.
 *    - Décimal: 0x3498DB, 0xFF0000, etc.
 * 5. Les champs inline dans les embeds s'affichent en ligne (max 3 par ligne)
 * 6. Les messages Discord sont limités à 2000 caractères
 * 7. Les embeds sont limités à 25 champs et 6000 caractères total
 *
 * 🔧 VALIDATION AUTOMATIQUE :
 * Tous les paramètres sont validés avec Zod avant l'envoi.
 * En cas d'erreur, vous recevrez un message détaillé avec la cause.
 *
 * 🚀 UTILISATION ONE-SHOT :
 * Copiez simplement l'exemple souhaité, adaptez les paramètres,
 * et utilisez-le avec votre client MCP Discord.
 */
