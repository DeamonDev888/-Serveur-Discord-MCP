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
// 2. EMBEDS ENRICHIS
// ============================================================================

/**
 * Exemple 2.1: Embed simple avec couleur et champs
 */
export const exampleEmbedSimple = {
  tool: 'mcp__discord-server__creer_embed',
  params: {
    channelId: 'VOTRE_CHANNEL_ID',
    title: '🚀 Nouvelle Fonctionnalité !',
    description: 'Nous venons de déployer une nouvelle fonctionnalité amazing.',
    color: 'success',
    fields: [
      { name: '✅ Statut', value: 'Déployé', inline: true },
      { name: '📅 Date', value: new Date().toISOString(), inline: true },
    ],
    timestamp: true,
  },
};

/**
 * Exemple 2.2: Embed complexe avec auteur, image et footer
 */
export const exampleEmbedComplex = {
  tool: 'mcp__discord-server__creer_embed',
  params: {
    channelId: 'VOTRE_CHANNEL_ID',
    title: '📊 Rapport de Performance',
    description: 'Voici le rapport détaillé de cette semaine.',
    color: '#3498DB',
    url: 'https://example.com',
    author: {
      name: 'Claude Code',
      icon_url: 'https://i.imgur.com/avatar.png',
      url: 'https://claude.ai',
    },
    thumbnail: {
      url: 'https://i.imgur.com/thumbnail.png',
    },
    image: {
      url: 'https://i.imgur.com/full-image.png',
    },
    fields: [
      {
        name: '📈 Métrique 1',
        value: 'Valeur: 85%',
        inline: true,
      },
      {
        name: '📉 Métrique 2',
        value: 'Valeur: 1200',
        inline: true,
      },
      {
        name: '💡 Analyse',
        value: 'Les résultats montrent une amélioration significative.',
        inline: false,
      },
    ],
    footer: {
      text: 'Rapport généré automatiquement',
      icon_url: 'https://i.imgur.com/footer-icon.png',
    },
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
// 8. TEMPLATES D'EMBEDS
// ============================================================================

/**
 * Exemple 8.1: Template d'annonce
 */
export const exampleTemplateAnnouncement = {
  tool: 'mcp__discord-server__creer_embed_template',
  params: {
    channelId: 'VOTRE_CHANNEL_ID',
    template: 'announcement',
    customizations: {
      title: '📢 Nouvelle Mise à Jour !',
      description: 'Version 2.0 déployée avec de nouvelles fonctionnalités',
      color: '#00FF00',
    },
  },
};

/**
 * Exemple 8.2: Template de bienvenue personnalisé
 */
export const exampleTemplateWelcome = {
  tool: 'mcp__discord-server__creer_embed_template',
  params: {
    channelId: 'VOTRE_CHANNEL_ID',
    template: 'welcome',
    customizations: {
      description: 'Bienvenue **{{username}}** sur notre serveur ! 🎉',
      fields: [
        {
          name: '📚 Ressources',
          value:
            '[Documentation](https://docs.example.com)\n[Support](https://support.example.com)',
          inline: false,
        },
      ],
    },
  },
};

/**
 * Exemple 8.3: Template d'erreur avec instructions
 */
export const exampleTemplateError = {
  tool: 'mcp__discord-server__creer_embed_template',
  params: {
    channelId: 'VOTRE_CHANNEL_ID',
    template: 'error',
    customizations: {
      description: 'Une erreur est survenue lors du traitement de votre requête.',
      fields: [
        {
          name: '🔧 Solution',
          value: 'Veuillez réessayer dans quelques instants ou contacter le support.',
          inline: false,
        },
      ],
    },
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
