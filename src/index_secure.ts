#!/usr/bin/env node

import { z } from 'zod';

import {
  Client,
  GatewayIntentBits,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
  EmbedBuilder,
  AttachmentBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActivityType,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder
} from 'discord.js';

// Import des configurations et utils
import { botConfig } from './config.js';
import { logger } from './utils/logger.js';
import {
  loadPolls,
  savePolls,
  addPoll,
  updatePoll,
  deletePoll,
  getPoll,
  cleanExpiredPolls
} from './utils/pollPersistence.js';
import {
  loadCustomButtons,
  saveCustomButtons,
  addCustomButton,
  deleteCustomButton,
  getCustomButton,
  cleanOldButtons,
  CustomButton
} from './utils/buttonPersistence.js';

// Import des outils
import {
  CreatePollSchema,
  createPollEmbed,
  createResultsEmbed,
  PollResult,
  getPollButtons
} from './tools/polls';

import {
  FileUploadSchema,
  createAttachmentFromFile,
  createFileUploadEmbed
} from './tools/fileUpload';

import {
  CreateEmbedSchema,
  EMBED_TEMPLATES,
  createEmbedFromTemplate,
  validateEmbed
} from './tools/embedBuilder';

import {
  CodePreviewSchema,
  createCodePreviewMessages,
  validateLanguage
} from './tools/codePreview';

import {
  InteractionSchema,
  buildActionRows,
  validateComponents
} from './tools/interactions';

import {
  SendMessageSchema,
  EditMessageSchema,
  DeleteMessageSchema,
  ReadMessagesSchema,
  AddReactionSchema,
  sendMessage,
  editMessage,
  deleteMessage,
  readMessages,
  addReaction,
  formatHistoryAsMarkdown
} from './tools/messageManager';

// Import des outils serveur fragmentés
import {
  GetServerInfoSchema,
  getServerInfo,
  formatServerInfoMarkdown
} from './tools/serverInfo';

import {
  GetChannelsSchema,
  getChannels,
  formatChannelsMarkdown
} from './tools/channelManager';

import {
  ListMembersSchema,
  listMembers,
  formatMembersMarkdown
} from './tools/memberManager';

import {
  GetUserInfoSchema,
  getUserInfo,
  formatUserInfoMarkdown
} from './tools/userManager';

console.log = (...args) => console.error(...args);

// Client Discord
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildPresences
  ]
});

// Stockage des données avec persistance en fichier JSON
let polls: Map<string, PollResult> = new Map();

// Stockage des actions personnalisées pour les boutons (Map: customId -> CustomButton)
let customButtons: Map<string, CustomButton> = new Map();

// Déclaration du serveur FastMCP
let server: any;

// Fonction utilitaire pour exécuter une action de bouton
async function executeButtonAction(
  action: any,
  channel: any,
  interaction: any
): Promise<void> {
  try {
    if (action.type === 'message') {
      // Envoyer un message public dans le canal
      if ('send' in channel) {
        await channel.send({
          content: action.data.content || 'Message par défaut'
        });
      }
      if (interaction) {
        await interaction.reply({
          content: '✅ Action exécutée !'
        });
      }
    } else if (action.type === 'embed') {
      const embed = new EmbedBuilder()
        .setTitle(action.data.title || 'Information')
        .setDescription(action.data.description || 'Description')
        .setColor(action.data.color || '#0099ff')
        .setTimestamp();

      // Envoyer un embed public dans le canal
      if ('send' in channel) {
        await channel.send({
          embeds: [embed]
        });
      }
      if (interaction) {
        await interaction.reply({
          content: '✅ Action exécutée !'
        });
      }
    } else if (action.type === 'code') {
      const codeContent = `\`\`\`${action.data.language || ''}\n${action.data.code || ''}\n\`\`\``;
      if ('send' in channel) {
        await channel.send({
          content: codeContent
        });
      }
      if (interaction) {
        await interaction.reply({
          content: '✅ Code affiché !'
        });
      }
    } else if (action.type === 'poll') {
      const pollEmbed = new EmbedBuilder()
        .setTitle('📊 ' + action.data.question)
        .setColor('#0099ff')
        .setDescription(action.data.options.map((opt: any, i: number) => `${i + 1}. ${opt}`).join('\n'))
        .setTimestamp();

      if ('send' in channel) {
        await channel.send({
          embeds: [pollEmbed]
        });
      }
      if (interaction) {
        await interaction.reply({
          content: '✅ Sondage créé !'
        });
      }
    } else if (action.type === 'webhook') {
      if ('send' in channel) {
        await channel.send({
          content: 'Action webhook exécutée'
        });
      }
      if (interaction) {
        await interaction.reply({
          content: '✅ Action exécutée !'
        });
      }
    } else {
      if (interaction) {
        await interaction.reply({
          content: '❌ Type d\'action non supporté'
        });
      }
    }
  } catch (error) {
    logger.error('Erreur lors de l\'exécution de l\'action:', error);
    if (interaction) {
      await interaction.reply({
        content: '❌ Erreur lors de l\'exécution de l\'action'
      });
    }
  }
}

// Initialisation du serveur FastMCP
async function initializeServer() {
  const { FastMCP } = await import('fastmcp');
  const { z } = await import('zod');

  server = new FastMCP({
    name: 'discord-server',
    version: '1.0.0'
  });

  console.log('[MCP_SERVER] Serveur FastMCP créé');

  // Ajout des outils MCP ici

}

// Vérification de la configuration au démarrage
function validateConfig(): void {
  if (!botConfig.token) {
    logger.error('DISCORD_TOKEN manquant dans le fichier .env');
    process.exit(1);
  }
  logger.info('Configuration validée avec succès');
}

// Gestion du démarrage du bot
async function startBot(): Promise<void> {
  try {
    validateConfig();

    // Charger les sondages depuis le fichier
    logger.info('Chargement des sondages depuis le fichier...');
    polls = await loadPolls();

    // Charger les boutons personnalisés depuis le fichier
    logger.info('Chargement des boutons personnalisés depuis le fichier...');
    customButtons = await loadCustomButtons();

    // Nettoyer les sondages expirés
    await cleanExpiredPolls(polls);

    // Nettoyer les anciens boutons
    await cleanOldButtons(customButtons);

    logger.info('Connexion du bot à Discord...');
    await client.login(botConfig.token);

    // Définir l'activité du bot
    client.user?.setActivity(botConfig.activity, { type: ActivityType.Playing });

    logger.info(`Bot connecté en tant que ${client.user?.tag}`);
  } catch (error) {
    logger.error('Erreur lors de la connexion du bot:', error);
    process.exit(1);
  }
}

// Outil: Connexion à Discord (maintenant automatique)
console.log('[MCP_TOOL] Enregistrement de l\'outil: discord_status');
server.addTool({
  name: 'discord_status',
  description: 'Vérifie le statut de connexion du bot Discord',
  parameters: z.object({}),
  execute: async () => {
    const status = client.isReady() ? {
      connected: true,
      user: client.user?.tag,
      guilds: client.guilds.cache.size,
      channels: client.channels.cache.size
    } : {
      connected: false,
      error: 'Bot non connecté'
    };

    return JSON.stringify(status, null, 2);
  }
});

// Outil: Envoyer un message (amélioré)
server.addTool({
  name: 'send_message',
  description: 'Envoie un message à un canal spécifique avec options avancées',
  parameters: SendMessageSchema,
  execute: async (args: any) => {
    try {
      const result = await sendMessage(client, args);

      if (result.success) {
        logger.info(`Message envoyé dans le canal ${args.channelId} (ID: ${result.messageId})`);
        return `${result.message} (ID: ${result.messageId})`;
      } else {
        logger.error('Échec envoi message:', result.error);
        return result.error;
      }
    } catch (error) {
      logger.error('Erreur lors de l\'envoi du message:', error);
      return `❌ Erreur critique: ${error}`;
    }
  }
});

// Outil: Ancien envoi message (compatibilité)
server.addTool({
  name: 'envoyer_message',
  description: 'Envoie un message texte simple à un channel Discord',
  parameters: z.object({
    channelId: z.string().describe('ID du channel Discord'),
    message: z.string().describe('Message à envoyer')
  }),
  execute: async (args: any) => {
    try {
      const { channelId, message } = args;

      // Vérifier si le bot est admin
      if (!botConfig.adminUserId) {
        return '❌ Aucun administrateur configuré';
      }

      const channel = await client.channels.fetch(channelId);
      if (!channel || !('send' in channel)) {
        return '❌ Channel invalide ou permissions insuffisantes';
      }

      await channel.send(message);
      logger.info(`Message envoyé dans le channel ${channelId}`);
      return '✅ Message envoyé avec succès';
    } catch (error) {
      logger.error('Erreur lors de l\'envoi du message:', error);
      return `❌ Erreur lors de l'envoi: ${error}`;
    }
  }
});

// Outil: Créer un sondage
server.addTool({
  name: 'creer_sondage',
  description: 'Crée un sondage interactif avec boutons',
  parameters: CreatePollSchema,
  execute: async (args: any) => {
    try {
      const params = args;
      logger.info(`📊 Paramètres reçus pour le sondage: duration=${params.duration}, question=${params.question}`);
      const channel = await client.channels.fetch(params.channelId);
      if (!channel || !('send' in channel)) {
        return '❌ Channel invalide ou permissions insuffisantes';
      }

      // Générer un ID unique pour le sondage
      const pollId = `poll_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Créer l'embed du sondage
      const embed = createPollEmbed(
        params.question,
        params.options,
        params.duration,
        params.anonymous,
        params.allowMultiple
      );

      // Créer les boutons avec interface améliorée
      const buttons: ButtonBuilder[] = [];

      // Bouton principal pour voter (ouvre la modal)
      buttons.push(
        new ButtonBuilder()
          .setCustomId(`${pollId}_vote`)
          .setLabel('🗳️ Voter')
          .setEmoji('🗳️')
          .setStyle(ButtonStyle.Primary)
      );

      // Boutons de contrôle sur la même rangée
      buttons.push(
        new ButtonBuilder()
          .setCustomId(`${pollId}_results`)
          .setLabel('📊 Résultats')
          .setEmoji('📊')
          .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
          .setCustomId(`${pollId}_end`)
          .setLabel('🏁 Terminer')
          .setEmoji('🏁')
          .setStyle(ButtonStyle.Success)
      );

      // Créer les lignes de composants (max 5 par rangée)
      const rows: ActionRowBuilder<ButtonBuilder>[] = [];
      for (let i = 0; i < buttons.length; i += 5) {
        const rowButtons = buttons.slice(i, i + 5);
        rows.push(new ActionRowBuilder<ButtonBuilder>().addComponents(rowButtons));
      }

      // Envoyer le sondage
      const message = await channel.send({
        embeds: [embed],
        components: rows
      });

      // Créer l'objet sondage
      const pollData: PollResult = {
        id: pollId,
        messageId: message.id,  // Stocker l'ID du message Discord
        channelId: params.channelId,  // Stocker l'ID du canal
        question: params.question,
        options: params.options.map((opt: any) => ({ text: opt, votes: 0, percentage: 0 })),
        totalVotes: 0,
        ended: false,
        endTime: new Date(Date.now() + params.duration * 1000),
        allowMultiple: params.allowMultiple,
        anonymous: params.anonymous
      };

      // Sauvegarder le sondage avec persistance (avec l'ID du message comme clé)
      polls.set(message.id, pollData);  // Utiliser l'ID du message comme clé primaire
      polls.set(pollId, pollData);  // Garder aussi l'ID custom pour compatibilité

      logger.info(`📊 Stockage du sondage: messageId=${message.id}, pollId=${pollId}`);
      logger.info(`📊 Total de sondages en mémoire: ${polls.size}`);

      await savePolls(polls);

      logger.info(`✅ Sondage créé et sauvegardé: ${params.question} (ID: ${pollId})`);
      return `✅ Sondage créé avec succès (ID: ${pollId})`;
    } catch (error) {
      logger.error('Erreur lors de la création du sondage:', error);
      return `❌ Erreur lors de la création: ${error}`;
    }
  }
});

// Outil: Modifier un message
server.addTool({
  name: 'edit_message',
  description: 'Modifie un message existant dans un canal',
  parameters: EditMessageSchema,
  execute: async (args: any) => {
    try {
      const result = await editMessage(client, args);

      if (result.success) {
        logger.info(`Message modifié: ${args.messageId} dans le canal ${args.channelId}`);
        return result.message;
      } else {
        logger.error('Échec modification message:', result.error);
        return result.error;
      }
    } catch (error) {
      logger.error('Erreur lors de la modification du message:', error);
      return `❌ Erreur critique: ${error}`;
    }
  }
});

// Outil: Supprimer un message
server.addTool({
  name: 'delete_message',
  description: 'Supprime un message d\'un canal spécifique',
  parameters: DeleteMessageSchema,
  execute: async (args: any) => {
    try {
      const result = await deleteMessage(client, args);

      if (result.success) {
        logger.info(`Message supprimé: ${args.messageId} dans le canal ${args.channelId}${args.reason ? ` (raison: ${args.reason})` : ''}`);
        return result.message;
      } else {
        logger.error('Échec suppression message:', result.error);
        return result.error;
      }
    } catch (error) {
      logger.error('Erreur lors de la suppression du message:', error);
      return `❌ Erreur critique: ${error}`;
    }
  }
});

// Outil: Lire les messages d'un canal
server.addTool({
  name: 'read_messages',
  description: 'Lit l\'historique récent des messages d\'un canal',
  parameters: ReadMessagesSchema,
  execute: async (args: any) => {
    try {
      const history = await readMessages(client, args);

      // Formater en markdown pour une meilleure lisibilité
      const formatted = formatHistoryAsMarkdown(history);

      logger.info(`Historique lu: ${history.messageCount} messages du canal ${args.channelId}`);
      return formatted;
    } catch (error) {
      logger.error('Erreur lors de la lecture des messages:', error);
      return `❌ Erreur: ${error}`;
    }
  }
});

// Outil: Ajouter une réaction
server.addTool({
  name: 'add_reaction',
  description: 'Ajoute une réaction (emoji) à un message spécifique',
  parameters: AddReactionSchema,
  execute: async (args: any) => {
    try {
      const result = await addReaction(client, args);

      if (result.success) {
        logger.info(`Réaction ajoutée: ${args.emoji} au message ${args.messageId}`);
        return result.message;
      } else {
        logger.error('Échec ajout réaction:', result.error);
        return result.error;
      }
    } catch (error) {
      logger.error('Erreur lors de l\'ajout de la réaction:', error);
      return `❌ Erreur critique: ${error}`;
    }
  }
});

// Outil: Uploader un fichier
server.addTool({
  name: 'uploader_fichier',
  description: 'Upload un fichier local vers Discord',
  parameters: FileUploadSchema,
  execute: async (args: any) => {
    try {
      const params = args;
      const channel = await client.channels.fetch(params.channelId);
      if (!channel || !('send' in channel)) {
        return '❌ Channel invalide ou permissions insuffisantes';
      }

      // Créer l'attachment
      const attachmentResult = await createAttachmentFromFile(
        params.filePath,
        params.fileName,
        params.spoiler
      );

      if (!attachmentResult.success) {
        return `❌ ${attachmentResult.error}`;
      }

      // Créer l'embed si nécessaire
      const embed = params.message || params.description ? createFileUploadEmbed(
        params.fileName || params.filePath.split(/[\\\/]/).pop() || 'fichier',
        attachmentResult.size || 0,
        params.description,
        params.spoiler
      ) : null;

      // Envoyer le fichier
      await channel.send({
        content: params.message,
        embeds: embed ? [embed] : undefined,
        files: [attachmentResult.attachment!]
      });

      logger.info(`Fichier uploadé: ${params.fileName || params.filePath}`);
      return '✅ Fichier uploadé avec succès';
    } catch (error) {
      logger.error('Erreur lors de l\'upload du fichier:', error);
      return `❌ Erreur lors de l'upload: ${error}`;
    }
  }
});

// Outil: Créer un embed
server.addTool({
  name: 'creer_embed',
  description: 'Crée un message avec embed enrichi',
  parameters: CreateEmbedSchema,
  execute: async (args: any) => {
    try {
      const params = args;
      const channel = await client.channels.fetch(params.channelId);
      if (!channel || !('send' in channel)) {
        return '❌ Channel invalide ou permissions insuffisantes';
      }

      // Valider l'embed
      const embedData = { ...params };
      delete embedData.channelId;
      delete embedData.content;

      const validation = validateEmbed(embedData);
      if (!validation.valid) {
        return `❌ Embed invalide: ${validation.errors.join(', ')}`;
      }

      // Créer l'embed
      const embed = new EmbedBuilder()
        .setColor(embedData.color || 0x000000);

      if (embedData.title) embed.setTitle(embedData.title);
      if (embedData.description) embed.setDescription(embedData.description);
      if (embedData.url) embed.setURL(embedData.url);
      if (embedData.author) embed.setAuthor(embedData.author);
      if (embedData.footer) embed.setFooter(embedData.footer);
      if (embedData.thumbnail) embed.setThumbnail(embedData.thumbnail.url);
      if (embedData.image) embed.setImage(embedData.image.url);
      if (embedData.timestamp) embed.setTimestamp();

      if (embedData.fields) {
        embedData.fields.forEach((field: any) => embed.addFields(field));
      }

      // Envoyer le message
      await channel.send({
        content: params.content,
        embeds: [embed]
      });

      logger.info(`Embed créé: ${embedData.title || 'Sans titre'}`);
      return '✅ Embed créé avec succès';
    } catch (error) {
      logger.error('Erreur lors de la création de l\'embed:', error);
      return `❌ Erreur lors de la création: ${error}`;
    }
  }
});

// Outil: Créer un embed depuis un template
server.addTool({
  name: 'creer_embed_template',
  description: 'Crée un embed à partir d\'un template prédéfini',
  parameters: z.object({
    channelId: z.string().describe('ID du channel'),
    template: z.enum(Object.keys(EMBED_TEMPLATES) as [string]).describe('Nom du template'),
    customizations: z.object({
      title: z.string().optional(),
      description: z.string().optional(),
      content: z.string().optional()
    }).optional().describe('Personnalisations')
  }),
  execute: async (args: any) => {
    try {
      const { channelId, template, customizations } = args;
      const channel = await client.channels.fetch(channelId);
      if (!channel || !('send' in channel)) {
        return '❌ Channel invalide ou permissions insuffisantes';
      }

      // Créer l'embed depuis le template
      const embedData = createEmbedFromTemplate(template, customizations);
      if (!embedData) {
        return `❌ Template "${template}" introuvable`;
      }

      // Construire l'embed
      const embed = new EmbedBuilder()
        .setColor(embedData.color || 0x000000);

      if (embedData.title) embed.setTitle(embedData.title);
      if (embedData.description) embed.setDescription(embedData.description);
      if (embedData.author) embed.setAuthor(embedData.author);
      if (embedData.footer) embed.setFooter(embedData.footer);
      if (embedData.thumbnail) embed.setThumbnail(embedData.thumbnail.url);
      if (embedData.image) embed.setImage(embedData.image.url);
      if (embedData.timestamp) embed.setTimestamp();

      if (embedData.fields) {
        embedData.fields.forEach((field: any) => embed.addFields(field));
      }

      // Envoyer
      await channel.send({
        content: customizations?.content,
        embeds: [embed]
      });

      logger.info(`Embed créé avec template: ${template}`);
      return `✅ Embed créé avec le template "${template}"`;
    } catch (error) {
      logger.error('Erreur lors de la création de l\'embed avec template:', error);
      return `❌ Erreur lors de la création: ${error}`;
    }
  }
});

// Outil: Lister les templates disponibles
server.addTool({
  name: 'lister_templates',
  description: 'Liste tous les templates d\'embed disponibles',
  parameters: z.object({}),
  execute: async () => {
    const templates = Object.keys(EMBED_TEMPLATES).map((name: string) => {
      const template = EMBED_TEMPLATES[name as keyof typeof EMBED_TEMPLATES];
      return `**${name}**: ${template?.title || template?.description || 'Template sans titre'}`;
    }).join('\n');

    return `📋 Templates disponibles:\n\n${templates}`;
  }
});

// Outil: Aperçu de code avec coloration syntaxique (simplifié)
server.addTool({
  name: 'code_preview',
  description: 'Affiche du code avec coloration syntaxique dans Discord',
  parameters: CodePreviewSchema,
  execute: async (args: any) => {
    try {
      const params = args;
      const channel = await client.channels.fetch(params.channelId);
      if (!channel || !('send' in channel)) {
        return '❌ Channel invalide ou permissions insuffisantes';
      }

      // Valider le langage
      if (!validateLanguage(params.language)) {
        return `❌ Langage non supporté: ${params.language}`;
      }

      // Créer le(s) message(s) avec blocs de code (division automatique si trop long)
      const messages = createCodePreviewMessages(
        params.code,
        params.language
      );

      logger.info(`[CODE_PREVIEW_TOOL] ${messages.length} message(s) à envoyer pour ${params.code.length} caractères`);

      // Envoyer tous les messages
      for (let i = 0; i < messages.length; i++) {
        logger.info(`[CODE_PREVIEW_TOOL] Envoi message ${i + 1}/${messages.length}`);
        await channel.send(messages[i]);
      }

      logger.info(`Code preview affiché: ${params.language} dans le canal ${params.channelId} (${messages.length} message(s))`);
      return `✅ Code ${params.language.toUpperCase()} affiché avec succès (${messages.length} message${messages.length > 1 ? 's' : ''})`;
    } catch (error) {
      logger.error('Erreur lors de l\'affichage du code:', error);
      return `❌ Erreur lors de l'affichage: ${error}`;
    }
  }
});

// Outil: Créer un webhook Discord
server.addTool({
  name: 'create_webhook',
  description: 'Crée un webhook Discord pour un channel',
  parameters: z.object({
    channelId: z.string().describe('ID du channel'),
    name: z.string().default('MCP Webhook').describe('Nom du webhook'),
    avatarUrl: z.string().url().optional().describe('URL de l\'avatar du webhook')
  }),
  execute: async (args: any) => {
    try {
      const { channelId, name, avatarUrl } = args;

      const webhook = await client.channels.fetch(channelId).then(channel =>
        (channel as any).createWebhook({
          name,
          avatar: avatarUrl
        })
      );

      logger.info(`Webhook créé pour le channel ${channelId}`);
      return `✅ Webhook créé !\n\n**URL:** ${webhook.url}\n**Nom:** ${webhook.name}\n**ID:** ${webhook.id}`;
    } catch (error) {
      logger.error('Erreur lors de la création du webhook:', error);
      return `❌ Erreur webhook: ${error}`;
    }
  }
});

// Outil: Lister les webhooks d'un channel
server.addTool({
  name: 'list_webhooks',
  description: 'Liste tous les webhooks d\'un channel',
  parameters: z.object({
    channelId: z.string().describe('ID du channel')
  }),
  execute: async (args: any) => {
    try {
      const { channelId } = args;

      const channel = await client.channels.fetch(channelId);
      if (!channel || !('fetchWebhooks' in channel)) {
        return '❌ Channel invalide ou permissions insuffisantes';
      }

      const webhooks = await (channel as any).fetchWebhooks();

      if (webhooks.size === 0) {
        return `📝 Aucun webhook pour ce channel`;
      }

      const list = Array.from(webhooks.values()).map((hook: any) =>
        `• **${hook.name}**\n  ID: ${hook.id}\n  URL: ${hook.url}\n`
      ).join('\n');

      return `📋 **Webhooks du channel:**\n\n${list}`;
    } catch (error) {
      logger.error('Erreur lors de la liste des webhooks:', error);
      return `❌ Erreur: ${error}`;
    }
  }
});

// Outil: Envoyer un webhook Discord
server.addTool({
  name: 'send_webhook',
  description: 'Envoie un message via webhook Discord',
  parameters: z.object({
    webhookUrl: z.string().url().describe('URL du webhook Discord'),
    content: z.string().optional().describe('Contenu du message'),
    username: z.string().optional().describe('Nom d\'utilisateur personnalisé'),
    avatarUrl: z.string().url().optional().describe('URL de l\'avatar personnalisé'),
    embeds: z.array(z.any()).optional().describe('Embeds Discord (JSON)')
  }),
  execute: async (args: any) => {
    try {
      const { webhookUrl, content, username, avatarUrl, embeds } = args;

      // Préparer le payload
      const payload: any = {};

      if (content) payload.content = content;
      if (username) payload.username = username;
      if (avatarUrl) payload.avatar_url = avatarUrl;
      if (embeds) payload.embeds = embeds;

      // Envoyer la requête au webhook
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Webhook échoué (${response.status}): ${errorText}`);
      }

      logger.info(`Webhook envoyé avec succès à ${webhookUrl}`);
      return `✅ Webhook envoyé avec succès !`;
    } catch (error) {
      logger.error('Erreur lors de l\'envoi du webhook:', error);
      return `❌ Erreur webhook: ${error}`;
    }
  }
});


// Outil: Informations détaillées sur le serveur
server.addTool({
  name: 'get_server_info',
  description: 'Obtient des informations détaillées sur un serveur Discord',
  parameters: GetServerInfoSchema,
  execute: async (args: any) => {
    try {
      const serverInfo = await getServerInfo(client, args);
      const formatted = formatServerInfoMarkdown(serverInfo);

      logger.info(`Informations du serveur récupérées: ${serverInfo.name}`);
      return formatted;
    } catch (error) {
      logger.error('Erreur lors de la récupération des informations du serveur:', error);
      return `❌ Erreur: ${error}`;
    }
  }
});

// Outil: Lister les canaux d'un serveur
server.addTool({
  name: 'get_channels',
  description: 'Liste tous les canaux d\'un serveur Discord',
  parameters: GetChannelsSchema,
  execute: async (args: any) => {
    try {
      const channels = await getChannels(client, args);
      const formatted = formatChannelsMarkdown(channels);

      logger.info(`Canaux listés: ${channels.length} canaux récupérés`);
      return formatted;
    } catch (error) {
      logger.error('Erreur lors du listing des canaux:', error);
      return `❌ Erreur: ${error}`;
    }
  }
});

// Outil: Lister les membres d'un serveur
server.addTool({
  name: 'list_members',
  description: 'Liste les membres d\'un serveur et leurs rôles',
  parameters: ListMembersSchema,
  execute: async (args: any) => {
    try {
      const members = await listMembers(client, args);
      const formatted = formatMembersMarkdown(members);

      logger.info(`Membres listés: ${members.length} membres récupérés`);
      return formatted;
    } catch (error) {
      logger.error('Erreur lors du listing des membres:', error);
      return `❌ Erreur: ${error}`;
    }
  }
});

// Outil: Informations détaillées sur un utilisateur
server.addTool({
  name: 'get_user_info',
  description: 'Obtient des informations détaillées sur un utilisateur Discord',
  parameters: GetUserInfoSchema,
  execute: async (args: any) => {
    try {
      const userInfo = await getUserInfo(client, args);
      const formatted = formatUserInfoMarkdown(userInfo);

      logger.info(`Informations utilisateur récupérées: ${userInfo.displayName} (${userInfo.id})`);
      return formatted;
    } catch (error) {
      logger.error('Erreur lors de la récupération des informations utilisateur:', error);
      return `❌ Erreur: ${error}`;
    }
  }
});


// Outil: Créer des boutons personnalisés avec actions
console.log('[MCP_TOOL] Enregistrement de l\'outil: create_custom_buttons');
server.addTool({
  name: 'create_custom_buttons',
  description: 'Crée des boutons personnalisés avec actions définies',
  parameters: z.object({
    channelId: z.string().describe('ID du canal où envoyer les boutons'),
    title: z.string().describe('Titre du message'),
    description: z.string().optional().describe('Description du message'),
    buttons: z.array(z.object({
      label: z.string().describe('Texte du bouton'),
      style: z.enum(['primary', 'secondary', 'success', 'danger']).describe('Style du bouton'),
      emoji: z.string().optional().describe('Emoji du bouton'),
      action: z.object({
        type: z.enum(['message', 'embed', 'poll', 'code', 'webhook']).describe('Type d\'action'),
        data: z.any().describe('Données de l\'action')
      }).describe('Action à exécuter')
    })).min(1).max(8).describe('Boutons à créer (1-8)')
  }),
  execute: async (args: any) => {
    console.log('[MCP_TOOL] create_custom_buttons appelé avec:', JSON.stringify(args, null, 2));
    try {
      const { channelId, title, description, buttons } = args;
      const channel = await client.channels.fetch(channelId);
      if (!channel || !('send' in channel)) {
        return '❌ Channel invalide ou permissions insuffisantes';
      }

      // Créer l'embed
      const embed = new EmbedBuilder()
        .setTitle(title)
        .setDescription(description || '')
        .setColor(0x5865F2)
        .setTimestamp();

      // Créer les boutons et stocker leurs actions
      const buttonBuilders: ButtonBuilder[] = buttons.map((btn: any, index: number) => {
        const styleMap: { [key: string]: ButtonStyle } = {
          primary: ButtonStyle.Primary,
          secondary: ButtonStyle.Secondary,
          success: ButtonStyle.Success,
          danger: ButtonStyle.Danger
        };

        const customId = `custom_${Date.now()}_${index}`;
        logger.info(`[CREATE_BUTTON] Création du bouton: ${btn.label} avec ID: ${customId}`);

        // Stocker l'action pour ce bouton avec persistance
        const customButton: CustomButton = {
          id: customId,
          messageId: '', // Sera rempli après l'envoi du message
          channelId: channelId,
          label: btn.label,
          action: btn.action,
          createdAt: new Date()
        };

        customButtons.set(customId, customButton);
        logger.info(`[CREATE_BUTTON] Bouton stocké dans la Map. Total boutons: ${customButtons.size}`);
        logger.info(`[CREATE_BUTTON] Boutons dans la Map:`, Array.from(customButtons.keys()));
        logger.info(`[CREATE_BUTTON] Action pour ${customId}:`, JSON.stringify(btn.action));

        const button = new ButtonBuilder()
          .setLabel(btn.label)
          .setStyle(styleMap[btn.style])
          .setCustomId(customId);

        if (btn.emoji) {
          button.setEmoji(btn.emoji);
        }

        return button;
      });

      // Organiser en rangées
      const rows: ActionRowBuilder<ButtonBuilder>[] = [];
      for (let i = 0; i < buttonBuilders.length; i += 4) {
        const rowButtons = buttonBuilders.slice(i, i + 4);
        rows.push(new ActionRowBuilder<ButtonBuilder>().addComponents(rowButtons));
      }

      // Envoyer
      const message = await channel.send({
        embeds: [embed],
        components: rows
      });

      // Mettre à jour les messageIds des boutons
      const customIds = buttons.map((btn: any, index: number) => `custom_${Date.now()}_${index}`);
      for (let i = 0; i < customIds.length; i++) {
        const customId = customIds[i];
        const buttonData = customButtons.get(customId);
        if (buttonData) {
          buttonData.messageId = message.id;
          customButtons.set(customId, buttonData);
        }
      }

      // Sauvegarder les boutons
      try {
        logger.info(`[CREATE_BUTTON] Sauvegarde en cours de ${customButtons.size} boutons...`);
        await saveCustomButtons(customButtons);
        logger.info(`[CREATE_BUTTON] ✅ ${buttons.length} bouton(s) personnalisé(s) créé(s) et sauvegardé(s) avec succès !`);
      } catch (saveError) {
        logger.error('[CREATE_BUTTON] Erreur lors de la sauvegarde des boutons:', saveError);
        // Continue anyway, the buttons are in memory
      }

      return `✅ ${buttons.length} bouton(s) personnalisé(s) créé(s) avec succès !`;
    } catch (error) {
      logger.error('Erreur lors de la création des boutons:', error);
      return `❌ Erreur: ${error}`;
    }
  }
});

// Outil: Créer un menu de sélection personnalisé
server.addTool({
  name: 'create_custom_menu',
  description: 'Créer un menu de sélection personnalisé',
  parameters: z.object({
    channelId: z.string().describe('ID du canal où envoyer le menu'),
    title: z.string().describe('Titre du message'),
    description: z.string().optional().describe('Description du message'),
    options: z.array(z.object({
      label: z.string().describe('Label de l\'option'),
      value: z.string().describe('Valeur de l\'option'),
      description: z.string().optional().describe('Description de l\'option'),
      emoji: z.string().optional().describe('Emoji de l\'option'),
      default: z.boolean().optional().default(false).describe('Option par défaut')
    })).min(1).max(25).describe('Options du menu (1-25)'),
    placeholder: z.string().optional().describe('Texte affiché quand aucune option n\'est sélectionnée'),
    minValues: z.number().optional().default(1).describe('Nombre minimum de valeurs sélectionnables'),
    maxValues: z.number().optional().default(1).describe('Nombre maximum de valeurs sélectionnables')
  }),
  execute: async (args: any) => {
    try {
      const { channelId, title, description, options, placeholder, minValues, maxValues } = args;
      const channel = await client.channels.fetch(channelId);
      if (!channel || !('send' in channel)) {
        return '❌ Channel invalide ou permissions insuffisantes';
      }

      // Créer l'embed
      const embed = new EmbedBuilder()
        .setTitle(title)
        .setDescription(description || '')
        .setColor(0x00FF00)
        .setTimestamp();

      // Créer le menu de sélection
      const selectMenu = new StringSelectMenuBuilder()
        .setCustomId(`menu_${Date.now()}`)
        .setPlaceholder(placeholder || 'Sélectionnez une option...')
        .setMinValues(minValues)
        .setMaxValues(maxValues);

      // Ajouter les options au menu
      options.forEach((option: any) => {
        const menuOption = new StringSelectMenuOptionBuilder()
          .setLabel(option.label)
          .setValue(option.value);

        if (option.description) {
          menuOption.setDescription(option.description);
        }

        if (option.emoji) {
          menuOption.setEmoji(option.emoji);
        }

        if (option.default) {
          menuOption.setDefault(true);
        }

        selectMenu.addOptions(menuOption);
      });

      // Créer la ligne d'action
      const actionRow = new ActionRowBuilder<StringSelectMenuBuilder>()
        .addComponents(selectMenu);

      // Envoyer
      await channel.send({
        embeds: [embed],
        components: [actionRow]
      });

      return `✅ Menu de sélection avec ${options.length} option(s) créé avec succès !`;
    } catch (error) {
      logger.error('Erreur lors de la création du menu:', error);
      return `❌ Erreur: ${error}`;
    }
  }
});

// Outil: Voter sur un sondage
server.addTool({
  name: 'vote_sondage',
  description: 'Voter sur un sondage Discord',
  parameters: z.object({
    messageId: z.string().describe('ID du message du sondage'),
    channelId: z.string().describe('ID du canal du sondage'),
    option: z.union([z.string(), z.number()]).describe('Option à voter (numéro ou texte)')
  }),
  execute: async (args: any) => {
    try {
      const { messageId, channelId, option } = args;
      const channel = await client.channels.fetch(channelId);
      if (!channel || !('messages' in channel)) {
        return '❌ Canal invalide';
      }

      const message = await channel.messages.fetch(messageId);
      if (!message) {
        return '❌ Message non trouvé';
      }

      // Vérifier si c'est un sondage du nouveau système (avec boutons)
      let poll = null;

      logger.info(`[VOTE_SONDAGE] Recherche du sondage: messageId=${messageId}`);
      logger.info(`[VOTE_SONDAGE] Sondages disponibles: ${polls.size}`);

      // Essayer de récupérer directement par clé (messageId)
      poll = polls.get(messageId);
      logger.info(`[VOTE_SONDAGE] Trouvé par clé directe: ${poll ? 'OUI' : 'NON'}`);

      // Si pas trouvé, chercher par propriété messageId dans tous les sondages
      if (!poll) {
        logger.info(`[VOTE_SONDAGE] Recherche par propriété messageId...`);
        for (const [key, p] of polls.entries()) {
          logger.info(`[VOTE_SONDAGE] Vérification clé=${key}, messageId=${p?.messageId}`);
          if (p && p.messageId === messageId) {
            poll = p;
            logger.info(`[VOTE_SONDAGE] Sondage trouvé avec clé=${key}`);
            break;
          }
        }
      }

      if (poll) {
        // Nouveau système de sondage avec persistance
        let selectedIndex = -1;

        if (typeof option === 'number') {
          selectedIndex = option - 1;
        } else {
          // Chercher l'index par texte
          selectedIndex = poll.options.findIndex(opt =>
            opt.text.toLowerCase() === option.toLowerCase() ||
            opt.text.toLowerCase().includes(option.toLowerCase())
          );
        }

        if (selectedIndex >= 0 && selectedIndex < poll.options.length) {
          // Enregistrer le vote
          poll.options[selectedIndex].votes++;
          poll.totalVotes++;

          // Recalculer les pourcentages
          poll.options.forEach(opt => {
            opt.percentage = poll.totalVotes > 0 ? (opt.votes / poll.totalVotes) * 100 : 0;
          });

          // Sauvegarder
          await updatePoll(poll.id, poll, polls);

          logger.info(`Vote enregistré via outil: ${poll.question} -> ${poll.options[selectedIndex].text}`);
          return `✅ Vote enregistré pour l'option: **${poll.options[selectedIndex].text}** (Total votes: ${poll.totalVotes})`;
        } else {
          return `❌ Option invalide. Options disponibles: ${poll.options.map((opt, i) => `${i + 1}. ${opt.text}`).join(', ')}`;
        }
      }

      // Ancien système : chercher les réactions du message
      const reactions = message.reactions.cache;

      let targetReaction = null;
      if (typeof option === 'number') {
        const emojiNumbers = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'];
        targetReaction = reactions.find(r => r.emoji.name === emojiNumbers[option - 1]);
      } else {
        targetReaction = reactions.find(r => r.emoji.name === option);
      }

      if (targetReaction) {
        await targetReaction.users.fetch();
        return `✅ Vote enregistré ! Réactions: ${targetReaction.count}`;
      } else {
        return '❌ Option non trouvée. Le sondage doit avoir des réactions emoji ou être un sondage du nouveau système.';
      }
    } catch (error) {
      logger.error('Erreur lors du vote:', error);
      return `❌ Erreur: ${error}`;
    }
  }
});

// Outil: Interagir avec un bouton
console.log('[MCP_TOOL] Enregistrement de l\'outil: appuyer_bouton');
server.addTool({
  name: 'appuyer_bouton',
  description: 'Appuyer sur un bouton Discord et exécuter son action',
  parameters: z.object({
    messageId: z.string().describe('ID du message contenant le bouton'),
    channelId: z.string().describe('ID du canal'),
    buttonLabel: z.string().optional().describe('Label du bouton à presser'),
    buttonId: z.string().optional().describe('ID personnalisé du bouton')
  }),
  execute: async (args: any) => {
    console.log('[MCP_TOOL] appuyer_bouton appelé avec:', JSON.stringify(args, null, 2));
    try {
      const { messageId, channelId, buttonLabel, buttonId } = args;
      const channel = await client.channels.fetch(channelId);
      if (!channel || !('messages' in channel)) {
        return '❌ Canal invalide';
      }

      const message = await channel.messages.fetch(messageId);
      if (!message || !message.components.length) {
        return '❌ Message ou composants non trouvés';
      }

      // Trouver le bouton dans les composants
      let foundButtonId = buttonId;
      let buttonCustomId = null;

      if (!foundButtonId && buttonLabel) {
        // Chercher le bouton par son label
        const rows = message.components as any[];
        for (const row of rows) {
          if (row.components && Array.isArray(row.components)) {
            for (const component of row.components) {
              if (component.type === 1 && component.label === buttonLabel) { // 1 = Button type
                buttonCustomId = component.customId;
                foundButtonId = component.customId;
                break;
              }
            }
          }
          if (foundButtonId) break;
        }
      }

      if (!foundButtonId) {
        return '❌ Bouton non trouvé. Vérifiez le label ou l\'ID du bouton.';
      }

      logger.info(`Interaction avec bouton: ${foundButtonId}`);

      // Exécuter l'action associée au bouton
      if (foundButtonId.startsWith('custom_')) {
        const buttonData = customButtons.get(foundButtonId);

        logger.info(`Bouton récupéré pour ${foundButtonId}: ${JSON.stringify(buttonData)}`);

        if (!buttonData) {
          logger.error(`Boutons disponibles: ${Array.from(customButtons.keys()).join(', ')}`);
          return `❌ Aucune action trouvée pour ce bouton (ID: ${foundButtonId}). Boutons disponibles: ${Array.from(customButtons.keys()).join(', ')}`;
        }

        try {
          // Exécuter l'action directement
          await executeButtonAction(buttonData.action, channel, null);

          logger.info(`Action exécutée avec succès: ${buttonData.action.type}`);
          return `✅ Bouton pressé et action "${buttonData.action.type}" exécutée avec succès ! (Label: ${buttonLabel || 'N/A'}, ID: ${foundButtonId})`;
        } catch (actionError) {
          logger.error('Erreur lors de l\'exécution de l\'action personnalisée:', actionError);
          return `❌ Erreur lors de l'exécution de l'action: ${actionError}`;
        }
      }
      // Gestion des boutons de sondage
      else if (foundButtonId.startsWith('poll_')) {
        return `ℹ️ Ce bouton fait partie d'un système de sondage. Utilisez les outils de sondage pour interagir avec lui.`;
      }
      // Autres types de boutons
      else {
        return `✅ Bouton pressé avec succès ! (Label: ${buttonLabel || 'N/A'}, ID: ${foundButtonId})`;
      }
    } catch (error) {
      logger.error('Erreur lors de l\'interaction avec le bouton:', error);
      return `❌ Erreur: ${error}`;
    }
  }
});

// Outil: Sélectionner une option dans un menu
server.addTool({
  name: 'selectionner_menu',
  description: 'Sélectionner une option dans un menu déroulant',
  parameters: z.object({
    messageId: z.string().describe('ID du message contenant le menu'),
    channelId: z.string().describe('ID du canal'),
    value: z.string().describe('Valeur de l\'option à sélectionner')
  }),
  execute: async (args: any) => {
    try {
      const { messageId, channelId, value } = args;
      const channel = await client.channels.fetch(channelId);
      if (!channel || !('messages' in channel)) {
        return '❌ Canal invalide';
      }

      const message = await channel.messages.fetch(messageId);
      if (!message || !message.components.length) {
        return '❌ Message ou composants non trouvés';
      }

      // Simuler la sélection en envoyant un message dans le canal
      if ('send' in channel) {
        await (channel as any).send({
          content: `✅ Option sélectionnée : **${value}**`
        });
      }

      return `✅ Option sélectionnée avec succès ! (Valeur: ${value})`;
    } catch (error) {
      logger.error('Erreur lors de la sélection:', error);
      return `❌ Erreur: ${error}`;
    }
  }
});


// Outil: Modifier un message (généraliste)
server.addTool({
  name: 'modifier_message',
  description: 'Modifier n\'importe quel type de message Discord (texte, embed, composants, etc.)',
  parameters: z.object({
    messageId: z.string().describe('ID du message à modifier'),
    channelId: z.string().describe('ID du canal du message'),
    content: z.string().optional().describe('Nouveau contenu du message'),
    embeds: z.array(z.any()).optional().describe('Nouveaux embeds'),
    components: z.array(z.any()).optional().describe('Nouveaux composants'),
    attachments: z.array(z.any()).optional().describe('Nouveaux attachements')
  }),
  execute: async (args: any) => {
    try {
      const { messageId, channelId, content, embeds, components, attachments } = args;
      const channel = await client.channels.fetch(channelId);
      if (!channel || !('messages' in channel)) {
        return '❌ Canal invalide';
      }

      const message = await channel.messages.fetch(messageId);
      if (!message) {
        return '❌ Message non trouvé';
      }

      // Vérifier les permissions du bot
      if ((channel as any).guild) {
        // Uniquement sur les serveurs (pas en DM)
        const botMember = await (channel as any).guild.members.fetch(client.user?.id);
        if (botMember && !botMember.permissions.has('MANAGE_MESSAGES')) {
          // Si le bot n'a pas les permissions, il ne peut modifier que ses propres messages
          if (message.author.id !== client.user?.id) {
            return '❌ Permissions insuffisantes pour modifier les messages des autres. Le bot a besoin de la permission "Gérer les messages".';
          }
        }
      } else {
        // En DM, le bot ne peut modifier que ses propres messages
        if (message.author.id !== client.user?.id) {
          return '❌ En message privé, le bot ne peut modifier que ses propres messages.';
        }
      }

      // Le bot peut maintenant modifier n'importe quel message
      // Note: Discord autorise la modification des messages d'autres utilisateurs uniquement si le bot a les permissions nécessaires

      // Préparer les modifications
      const editOptions: any = {};

      if (content !== undefined) {
        editOptions.content = content;
      }

      if (embeds) {
        editOptions.embeds = embeds;
      }

      if (components) {
        editOptions.components = components;
      }

      if (attachments) {
        editOptions.attachments = attachments;
      }

      // Si aucune modification n'est spécifiée, retourner une erreur
      if (Object.keys(editOptions).length === 0) {
        return '❌ Aucune modification spécifiée';
      }

      // Modifier le message
      await message.edit(editOptions);

      logger.info(`Message modifié avec succès: ${messageId}`);
      return `✅ Message modifié avec succès !`;
    } catch (error) {
      logger.error('Erreur lors de la modification:', error);
      return `❌ Erreur: ${error}`;
    }
  }
});



// Outil: Obtenir le statut du bot
server.addTool({
  name: 'statut_bot',
  description: 'Obtenir le statut actuel du bot Discord',
  parameters: z.object({}),
  execute: async (args: any) => {
    try {
      const guilds = client.guilds.cache.size;
      const channels = client.channels.cache.size;
      const users = client.users.cache.size;
      const uptime = process.uptime();
      const ping = client.ws.ping;

      const status = `📊 **Statut du Bot Discord**

🖥️ **Serveurs:** ${guilds}
📝 **Canaux:** ${channels}
👥 **Utilisateurs:** ${users}
⏱️ **Uptime:** ${Math.floor(uptime / 60)} minutes
🔗 **Latence API:** ${ping}ms
📦 **Version:** 1.0.0

✅ **Status:** Opérationnel`;

      return status;
    } catch (error) {
      logger.error('Erreur lors de la récupération du statut:', error);
      return `❌ Erreur: ${error}`;
    }
  }
});

// Gestion des interactions Discord
client.on('interactionCreate', async (interaction) => {
  if (!interaction.isButton() && !interaction.isStringSelectMenu() && !interaction.isModalSubmit()) return;

  try {
    logger.logDiscordEvent('interactionCreate', interaction.user.id);

    // Gestion des interactions modals (en premier)
    if (interaction.isModalSubmit()) {
      // Gestion des votes de sondage via modal
      if (interaction.customId.startsWith('poll_') && interaction.customId.endsWith('_submit')) {
        const parts = interaction.customId.split('_');
        if (parts.length < 4) return;

        const pollId = `${parts[0]}_${parts[1]}_${parts[2]}`;
        const poll = getPoll(pollId, polls);

        if (!poll) {
          await interaction.reply({ content: '❌ Sondage introuvable', ephemeral: true });
          return;
        }

        // Répondre avec un message de confirmation
        await interaction.reply({
          content: `✅ Merci d'avoir voté pour le sondage: **${poll.question}**`,
          ephemeral: true
        });

        logger.info(`Vote confirmé via modal pour le sondage ${pollId} par ${interaction.user.tag}`);
      }
    }
    // Gestion des boutons et menus de sondage
    else if (interaction.customId.startsWith('poll_')) {
      const parts = interaction.customId.split('_');
      // ID format: poll_{timestamp}_{random}_{action}
      if (parts.length < 4) return;

      const pollId = `${parts[0]}_${parts[1]}_${parts[2]}`;
      const action = parts[3];

      // Chercher le sondage avec plusieurs méthodes
      let poll = getPoll(pollId, polls);
      if (!poll) {
        // Essayer avec l'ID du message
        poll = polls.get(interaction.message.id);
      }
      if (!poll) {
        logger.info(`❌ Sondage non trouvé - pollId: ${pollId}, messageId: ${interaction.message.id}`);
        logger.info(`📊 Sondages disponibles: ${Array.from(polls.keys()).slice(0, 10).join(', ')}...`);
        await interaction.reply({ content: '❌ Sondage introuvable ou expiré.', ephemeral: true });
        return;
      }

      // Action: Ouvrir le menu de vote
      if (action === 'vote') {
        const selectMenu = new StringSelectMenuBuilder()
          .setCustomId(`poll_${pollId}_select`)
          .setPlaceholder('Sélectionnez votre choix...')
          .setMinValues(1)
          .setMaxValues(poll.allowMultiple ? poll.options.length : 1);

        poll.options.forEach((option, index) => {
          selectMenu.addOptions(
            new StringSelectMenuOptionBuilder()
              .setLabel(option.text.substring(0, 100))
              .setValue(index.toString())
              .setEmoji(['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'][index] || '📍')
          );
        });

        const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(selectMenu);

        await interaction.reply({
          content: `🗳️ **Votez pour :** ${poll.question}`,
          components: [row],
          ephemeral: true
        });
      }
      // Action: Enregistrer le vote (depuis le menu)
      else if (action === 'select' && interaction.isStringSelectMenu()) {
        const selectedIndices = interaction.values.map(v => parseInt(v));
        
        // Simuler un vote "unique" par utilisateur pour simplifier (pas de tracking user dans cette version simple)
        // Idéalement, il faudrait vérifier interaction.user.id dans une map 'voters' du sondage.
        
        // Incrémenter les votes
        selectedIndices.forEach(index => {
            if (poll.options[index]) {
                poll.options[index].votes++;
                poll.totalVotes++;
            }
        });

        // Recalculer les pourcentages
        poll.options.forEach(opt => {
          opt.percentage = poll.totalVotes > 0 ? (opt.votes / poll.totalVotes) * 100 : 0;
        });

        // Sauvegarder
        await updatePoll(pollId, poll, polls);

        await interaction.update({ 
            content: `✅ Vote enregistré ! Vous avez choisi : ${selectedIndices.map(i => `**${poll.options[i].text}**`).join(', ')}`, 
            components: [] 
        });
        
        logger.info(`Vote enregistré pour le sondage ${pollId} par ${interaction.user.tag}`);
      } 
      // Action: Voir les résultats
      else if (action === 'results') {
        const resultsEmbed = createResultsEmbed(poll);
        await interaction.reply({ embeds: [resultsEmbed], ephemeral: true });
      } 
      // Action: Terminer le sondage
      else if (action === 'end') {
        // Vérifier les permissions (idéalement)
        await updatePoll(pollId, { ended: true }, polls);
        const updatedPoll = getPoll(pollId, polls)!;
        const resultsEmbed = createResultsEmbed(updatedPoll);
        
        // Désactiver les boutons du message original si possible, ou juste envoyer les résultats
        // On essaie de mettre à jour le message original si l'interaction vient du message
        if (interaction.message) {
             // Reconstruire les boutons désactivés
             const rows = interaction.message.components;
             // Note: Modifier components existants est complexe, on envoie juste le résultat final ici
             await interaction.update({ embeds: [resultsEmbed], components: [] });
        } else {
             await interaction.reply({ embeds: [resultsEmbed] });
        }
      }
    }
    // Gestion des autres interactions
    else {
      // Gérer les boutons personnalisés
      // Gérer les boutons personnalisés (tous les IDs commençant par custom_ ou test_)
      if (interaction.customId.startsWith('custom_') || interaction.customId.startsWith('test_')) {
        logger.info(`Bouton personnalisé détecté: ${interaction.customId}`);
        logger.info(`Boutons stockés: ${Array.from(customButtons.keys()).join(', ')}`);

        const buttonData = customButtons.get(interaction.customId);

        if (!buttonData) {
          logger.error(`Bouton non trouvé pour l'ID: ${interaction.customId}`);
          // Essayer de recharger les boutons depuis la base
          try {
            customButtons = await loadCustomButtons();
            logger.info(`Rechargé ${customButtons.size} boutons depuis la base`);
            const retryButton = customButtons.get(interaction.customId);
            if (retryButton) {
              logger.info(`Bouton trouvé après rechargement: ${retryButton.label}`);
              await executeButtonAction(retryButton.action, interaction.channel, interaction);
              return;
            }
          } catch (reloadError) {
            logger.error('Erreur lors du rechargement des boutons:', reloadError);
          }

          await interaction.reply({
            content: '❌ Action inconnue'
          });
          return;
        }

        // Exécuter l'action selon le type
        try {
          await executeButtonAction(buttonData.action, interaction.channel, interaction);
        } catch (error) {
          logger.error('Erreur lors de l\'exécution de l\'action personnalisée:', error);
          await interaction.reply({
            content: '❌ Erreur lors de l\'exécution de l\'action'
          });
        }
      }
      // Gérer les menus de sélection personnalisés
      else if (interaction.customId.startsWith('menu_') && interaction.isStringSelectMenu()) {
        const selectedValues = interaction.values;
        await interaction.reply({
          content: `✅ Option sélectionnée : ${selectedValues.join(', ')}`
        });
      }
      // Gérer les boutons du tableau de bord MCP
      else if (interaction.customId.startsWith('mcp_')) {
        const action = interaction.customId.replace('mcp_', '');

        // Répondre avec des instructions pour chaque action
        const responses: { [key: string]: string } = {
          'send_message': '📨 **Envoyer un Message**\n\nUtilisez l\'outil `envoyer_message` avec:\n- channelId: ID du canal\n- message: Contenu du message',
          'create_embed': '📢 **Créer un Embed**\n\nUtilisez l\'outil `creer_embed` avec:\n- channelId: ID du canal\n- title: Titre de l\'embed\n- description: Description\n- color: Couleur (ex: "BLUE", "GREEN")',
          'create_poll': '📊 **Créer un Sondage**\n\nUtilisez l\'outil `creer_sondage` avec:\n- channelId: ID du canal\n- question: Question du sondage\n- options: Array d\'options\n- duration: Durée en secondes',
          'code_preview': '💻 **Code Preview**\n\nUtilisez l\'outil `code_preview` avec:\n- channelId: ID du canal\n- code: Code à afficher\n- language: Langage (js, ts, py, etc.)',
          'upload_file': '📎 **Upload de Fichier**\n\nUtilisez l\'outil `uploader_fichier` avec:\n- channelId: ID du canal\n- filePath: Chemin du fichier\n- fileName: Nom du fichier',
          'create_webhook': '🔗 **Créer Webhook**\n\nUtilisez l\'outil `create_webhook` avec:\n- channelId: ID du canal\n- name: Nom du webhook\n- avatarUrl: URL de l\'avatar (optionnel)',
          'server_info': '👥 **Infos Serveur**\n\nUtilisez l\'outil `get_server_info` pour obtenir les informations du serveur',
          'read_messages': '📜 **Lire Messages**\n\nUtilisez l\'outil `read_messages` avec:\n- channelId: ID du canal\n- limit: Nombre de messages (1-100)'
        };

        const response = responses[action] || '❌ Action inconnue';
        await interaction.reply({ content: response });
      } else {
        await interaction.reply({
          content: '❌ Action inconnue'
        });
      }
    }
  } catch (error) {
    logger.logDiscordError('interactionCreate', error, interaction.user?.id);
  }
});

// Gestion des erreurs
client.on('error', (error) => {
  logger.error('Erreur client Discord:', error);
});

process.on('unhandledRejection', (error) => {
  logger.error('Uncaught Promise Rejection:', error);
});

process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

// Gestion de l'arrêt propre
process.on('SIGINT', () => {
  logger.info('Arrêt du bot...');
  client.destroy();
  process.exit(0);
});

process.on('SIGTERM', () => {
  logger.info('Arrêt du bot...');
  client.destroy();
  process.exit(0);
});

// Démarrage du serveur et du bot
async function main() {
  logger.info('Demarrage du serveur Discord MCP...');

  // Démarrer le bot Discord
  await startBot();

  // Démarrer le serveur MCP
  console.log('[MCP_SERVER] Démarrage du serveur MCP avec transport stdio...');
  server.start({
    transportType: 'stdio'
  }).then(() => {
    console.log('[MCP_SERVER] ✅ Serveur MCP démarré avec succès');
  }).catch((error: Error) => {
    logger.error('[MCP_SERVER] Erreur lors du démarrage du serveur MCP:', error);
    process.exit(1);
  });

  console.log('[MCP_SERVER] Serveur Discord MCP démarré avec succès');
}

// Lancement
main().catch((error) => {
  logger.error('Erreur critique au démarrage:', error);
  process.exit(1);
});

// Initialisation du serveur
initializeServer().catch((error) => {
  logger.error('Erreur lors de l\'initialisation du serveur:', error);
  process.exit(1);
});
