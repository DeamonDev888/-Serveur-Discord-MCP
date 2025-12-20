#!/usr/bin/env node

import { FastMCP } from 'fastmcp';
import { z } from 'zod';
import {
  Client,
  GatewayIntentBits,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder
} from 'discord.js';
import { config } from 'dotenv';

// Charger les variables d'environnement
config({ path: './.env' });

const server = new FastMCP({
  name: 'discord-server',
  version: '1.0.0'
});

// Client Discord
let discordClient = null;
let isConnected = false;

// Stockage des actions personnalisées (Map: customId -> action)
const customActions = new Map();

// Connexion à Discord
async function connectToDiscord() {
  if (isConnected) return true;

  try {
    discordClient = new Client({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
      ]
    });

    // Gestionnaire d'événements pour les interactions
    discordClient.on('interactionCreate', async (interaction) => {
      try {
        // Gérer les clics sur les boutons
        if (interaction.isButton()) {
          const customId = interaction.customId;
          const action = customActions.get(customId);

          if (!action) {
            await interaction.reply({
              content: '❌ Action inconnue',
              ephemeral: true
            });
            return;
          }

          // Exécuter l'action selon le type
          if (action.type === 'message') {
            await interaction.reply({
              content: action.data.content || 'Message par défaut',
              ephemeral: true
            });
          } else if (action.type === 'embed') {
            const embed = new EmbedBuilder()
              .setTitle(action.data.title || 'Information')
              .setDescription(action.data.description || 'Description')
              .setColor(action.data.color || '#0099ff');

            await interaction.reply({
              embeds: [embed],
              ephemeral: true
            });
          } else if (action.type === 'code') {
            const codeContent = `\`\`\`${action.data.language || ''}\n${action.data.code || ''}\n\`\`\``;
            await interaction.reply({
              content: codeContent,
              ephemeral: true
            });
          } else if (action.type === 'poll') {
            const pollEmbed = new EmbedBuilder()
              .setTitle('📊 ' + action.data.question)
              .setColor('#0099ff')
              .setDescription(action.data.options.map((opt, i) => `${i + 1}. ${opt}`).join('\n'));

            await interaction.reply({
              embeds: [pollEmbed],
              ephemeral: true
            });
          }
        }
        // Gérer les sélections de menu
        else if (interaction.isStringSelectMenu()) {
          const customId = interaction.customId;
          const selectedValues = interaction.values;

          await interaction.reply({
            content: `✅ Option sélectionnée : ${selectedValues.join(', ')}`,
            ephemeral: true
          });
        }
      } catch (error) {
        console.error('Erreur lors du traitement de l\'interaction:', error);
        if (!interaction.replied) {
          await interaction.reply({
            content: '❌ Erreur lors du traitement de l\'action',
            ephemeral: true
          });
        }
      }
    });

    await new Promise((resolve, reject) => {
      discordClient.once('ready', resolve);
      discordClient.once('error', reject);
      discordClient.login(process.env.DISCORD_TOKEN);
    });

    isConnected = true;
    console.log('✅ Connecté à Discord');
    return true;
  } catch (error) {
    console.error('❌ Erreur de connexion Discord:', error);
    throw error;
  }
}

// Outil pour envoyer un message
server.addTool({
  name: 'envoyer_message',
  description: 'Envoyer un message à un canal Discord',
  parameters: z.object({
    channelId: z.string().describe('ID du canal Discord'),
    content: z.string().describe('Contenu du message à envoyer')
  }),
  execute: async (args) => {
    try {
      await connectToDiscord();

      const channel = await discordClient.channels.fetch(args.channelId);
      if (!channel || !('send' in channel)) {
        throw new Error('Canal invalide ou permissions insuffisantes');
      }

      const message = await channel.send(args.content);
      return {
        success: true,
        messageId: message.id,
        content: `Message envoyé avec succès dans le canal ${args.channelId}`
      };
    } catch (error) {
      throw new Error(`Erreur lors de l'envoi du message: ${error.message}`);
    }
  }
});

// Outil pour créer un embed
server.addTool({
  name: 'creer_embed',
  description: 'Créer un message embed enrichi',
  parameters: z.object({
    channelId: z.string().describe('ID du canal Discord'),
    title: z.string().optional().describe('Titre de l\'embed'),
    description: z.string().optional().describe('Description de l\'embed'),
    color: z.string().optional().describe('Couleur de l\'embed (hex)')
  }),
  execute: async (args) => {
    try {
      await connectToDiscord();

      const channel = await discordClient.channels.fetch(args.channelId);
      if (!channel || !('send' in channel)) {
        throw new Error('Canal invalide ou permissions insuffisantes');
      }

      const embed = new EmbedBuilder();
      if (args.title) embed.setTitle(args.title);
      if (args.description) embed.setDescription(args.description);
      if (args.color) embed.setColor(args.color);

      const message = await channel.send({ embeds: [embed] });
      return {
        success: true,
        messageId: message.id,
        content: `Embed créé avec succès dans le canal ${args.channelId}`
      };
    } catch (error) {
      throw new Error(`Erreur lors de la création de l'embed: ${error.message}`);
    }
  }
});

// Outil pour lire les messages
server.addTool({
  name: 'lire_messages',
  description: 'Lire les messages récents d\'un canal',
  parameters: z.object({
    channelId: z.string().describe('ID du canal Discord'),
    limit: z.number().optional().default(10).describe('Nombre de messages à lire')
  }),
  execute: async (args) => {
    try {
      await connectToDiscord();

      const channel = await discordClient.channels.fetch(args.channelId);
      if (!channel || !('messages' in channel)) {
        throw new Error('Canal invalide ou permissions insuffisantes');
      }

      const messages = await channel.messages.fetch({ limit: args.limit });
      const messageList = messages.map(msg => ({
        id: msg.id,
        author: msg.author.username,
        content: msg.content,
        timestamp: msg.createdTimestamp
      }));

      return {
        success: true,
        messages: messageList,
        content: `${messageList.length} messages lus du canal ${args.channelId}`
      };
    } catch (error) {
      throw new Error(`Erreur lors de la lecture des messages: ${error.message}`);
    }
  }
});

// Outil pour lister les canaux
server.addTool({
  name: 'lister_canaux',
  description: 'Lister tous les canaux d\'un serveur',
  parameters: z.object({
    guildId: z.string().optional().describe('ID du serveur Discord (optionnel)'),
    type: z.string().optional().describe('Type de canal (text/voice/category)')
  }),
  execute: async (args) => {
    try {
      await connectToDiscord();

      const guild = await discordClient.guilds.fetch(args.guildId || discordClient.guilds.cache.first?.id);
      if (!guild) {
        throw new Error('Serveur non trouvé');
      }

      const channels = await guild.channels.fetch();
      let filteredChannels = channels;

      if (args.type) {
        filteredChannels = channels.filter(ch => ch.type.toLowerCase().includes(args.type.toLowerCase()));
      }

      const channelList = filteredChannels.map(ch => ({
        id: ch.id,
        name: ch.name,
        type: ch.type,
        position: ch.position || 0
      }));

      return {
        success: true,
        channels: channelList,
        content: `${channelList.length} canaux trouvés dans le serveur ${guild.name}`
      };
    } catch (error) {
      throw new Error(`Erreur lors de la liste des canaux: ${error.message}`);
    }
  }
});

// Outil pour lister les membres
server.addTool({
  name: 'lister_membres',
  description: 'Lister les membres d\'un serveur',
  parameters: z.object({
    guildId: z.string().optional().describe('ID du serveur Discord (optionnel)'),
    limit: z.number().optional().default(20).describe('Nombre maximum de membres à lister')
  }),
  execute: async (args) => {
    try {
      await connectToDiscord();

      const guild = await discordClient.guilds.fetch(args.guildId || discordClient.guilds.cache.first?.id);
      if (!guild) {
        throw new Error('Serveur non trouvé');
      }

      const members = await guild.members.fetch({ limit: args.limit });
      const memberList = members.map(member => ({
        id: member.user.id,
        username: member.user.username,
        displayName: member.displayName,
        status: member.presence?.status || 'offline',
        roles: member.roles.cache.map(role => role.name)
      }));

      return {
        success: true,
        members: memberList,
        content: `${memberList.length} membres listés dans le serveur ${guild.name}`
      };
    } catch (error) {
      throw new Error(`Erreur lors de la liste des membres: ${error.message}`);
    }
  }
});

// Outil pour obtenir les informations du serveur
server.addTool({
  name: 'infos_serveur',
  description: 'Obtenir des informations détaillées sur un serveur',
  parameters: z.object({
    guildId: z.string().optional().describe('ID du serveur Discord (optionnel)')
  }),
  execute: async (args) => {
    try {
      await connectToDiscord();

      const guild = await discordClient.guilds.fetch(args.guildId || discordClient.guilds.cache.first?.id);
      if (!guild) {
        throw new Error('Serveur non trouvé');
      }

      const serverInfo = {
        id: guild.id,
        name: guild.name,
        memberCount: guild.memberCount,
        createdAt: guild.createdTimestamp,
        ownerId: guild.ownerId,
        description: guild.description,
        features: guild.features,
        roles: guild.roles.cache.size,
        channels: guild.channels.cache.size,
        emojis: guild.emojis.cache.size
      };

      return {
        success: true,
        server: serverInfo,
        content: `Informations récupérées pour le serveur ${guild.name}`
      };
    } catch (error) {
      throw new Error(`Erreur lors de la récupération des infos du serveur: ${error.message}`);
    }
  }
});

// Outil pour créer un sondage
server.addTool({
  name: 'creer_sondage',
  description: 'Créer un sondage interactif avec des réactions',
  parameters: z.object({
    channelId: z.string().describe('ID du canal Discord'),
    question: z.string().describe('Question du sondage'),
    options: z.array(z.string()).min(2).max(10).describe('Options de réponse (2-10)'),
    duration: z.number().optional().default(60).describe('Durée en minutes')
  }),
  execute: async (args) => {
    try {
      await connectToDiscord();

      const channel = await discordClient.channels.fetch(args.channelId);
      if (!channel || !('send' in channel)) {
        throw new Error('Canal invalide ou permissions insuffisantes');
      }

      const pollEmbed = new EmbedBuilder()
        .setTitle('📊 ' + args.question)
        .setColor('#0099ff')
        .setDescription(args.options.map((opt, i) => `${i + 1}. ${opt}`).join('\n'))
        .setFooter({ text: `Durée: ${args.duration} minutes` });

      const message = await channel.send({ embeds: [pollEmbed] });

      // Ajouter les réactions
      const reactions = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'];
      for (let i = 0; i < args.options.length && i < reactions.length; i++) {
        await message.react(reactions[i]);
      }

      return {
        success: true,
        messageId: message.id,
        content: `Sondage créé avec succès dans ${channel.name}`
      };
    } catch (error) {
      throw new Error(`Erreur lors de la création du sondage: ${error.message}`);
    }
  }
});

// Fonction pour convertir le style du bouton en ButtonStyle
function getButtonStyle(style) {
  const styleMap = {
    'primary': ButtonStyle.Primary,
    'secondary': ButtonStyle.Secondary,
    'success': ButtonStyle.Success,
    'danger': ButtonStyle.Danger
  };
  return styleMap[style.toLowerCase()] || ButtonStyle.Primary;
}

// Outil pour créer des boutons personnalisés
server.addTool({
  name: 'create_custom_buttons',
  description: 'Créer des boutons personnalisés avec actions définies',
  parameters: z.object({
    channelId: z.string().describe('ID du canal Discord'),
    title: z.string().describe('Titre du message'),
    description: z.string().optional().describe('Description du message'),
    buttons: z.array(z.object({
      label: z.string().describe('Texte du bouton'),
      style: z.enum(['primary', 'secondary', 'success', 'danger']).describe('Style du bouton'),
      emoji: z.string().optional().describe('Emoji du bouton'),
      action: z.object({
        type: z.enum(['message', 'embed', 'code', 'poll']).describe('Type d\'action'),
        data: z.any().describe('Données de l\'action')
      }).describe('Action à exécuter')
    })).min(1).max(8).describe('Liste des boutons (1-8)')
  }),
  execute: async (args) => {
    try {
      await connectToDiscord();

      const channel = await discordClient.channels.fetch(args.channelId);
      if (!channel || !('send' in channel)) {
        throw new Error('Canal invalide ou permissions insuffisantes');
      }

      // Créer l'embed principal
      const embed = new EmbedBuilder()
        .setTitle(args.title)
        .setDescription(args.description || '')
        .setColor('#5865F2');

      // Créer les boutons et stocker leurs actions
      const actionRow = new ActionRowBuilder();

      args.buttons.forEach((btn, index) => {
        const customId = `custom_btn_${Date.now()}_${index}`;
        const button = new ButtonBuilder()
          .setCustomId(customId)
          .setLabel(btn.label)
          .setStyle(getButtonStyle(btn.style));

        if (btn.emoji) {
          button.setEmoji(btn.emoji);
        }

        // Stocker l'action pour ce bouton
        customActions.set(customId, btn.action);

        actionRow.addComponents(button);
      });

      // Envoyer le message avec les boutons
      const message = await channel.send({
        embeds: [embed],
        components: [actionRow]
      });

      return {
        success: true,
        messageId: message.id,
        content: `Message avec ${args.buttons.length} bouton(s) personnalisé(s) créé avec succès`
      };
    } catch (error) {
      throw new Error(`Erreur lors de la création des boutons personnalisés: ${error.message}`);
    }
  }
});

// Outil pour créer un menu de sélection personnalisé
server.addTool({
  name: 'create_custom_menu',
  description: 'Créer un menu de sélection personnalisé',
  parameters: z.object({
    channelId: z.string().describe('ID du canal Discord'),
    title: z.string().describe('Titre du menu'),
    description: z.string().optional().describe('Description du menu'),
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
  execute: async (args) => {
    try {
      await connectToDiscord();

      const channel = await discordClient.channels.fetch(args.channelId);
      if (!channel || !('send' in channel)) {
        throw new Error('Canal invalide ou permissions insuffisantes');

      }

      // Créer l'embed principal
      const embed = new EmbedBuilder()
        .setTitle(args.title)
        .setDescription(args.description || '')
        .setColor('#00FF00');

      // Créer le menu de sélection
      const selectMenu = new StringSelectMenuBuilder()
        .setCustomId(`custom_menu_${Date.now()}`)
        .setPlaceholder(args.placeholder || 'Sélectionnez une option...')
        .setMinValues(args.minValues)
        .setMaxValues(args.maxValues);

      // Ajouter les options au menu
      args.options.forEach(option => {
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
      const actionRow = new ActionRowBuilder()
        .addComponents(selectMenu);

      // Envoyer le message avec le menu
      const message = await channel.send({
        embeds: [embed],
        components: [actionRow]
      });

      return {
        success: true,
        messageId: message.id,
        content: `Menu de sélection avec ${args.options.length} option(s) créé avec succès`
      };
    } catch (error) {
      throw new Error(`Erreur lors de la création du menu personnalisé: ${error.message}`);
    }
  }
});

// Outil pour créer des boutons interactifs (version simplifiée)
server.addTool({
  name: 'creer_boutons',
  description: 'Créer un message avec des boutons interactifs (version simplifiée)',
  parameters: z.object({
    channelId: z.string().describe('ID du canal Discord'),
    content: z.string().describe('Contenu du message'),
    buttons: z.array(z.object({
      label: z.string().describe('Texte du bouton'),
      style: z.enum(['Primary', 'Secondary', 'Success', 'Danger']).describe('Style du bouton'),
      customId: z.string().describe('ID personnalisé du bouton')
    })).describe('Liste des boutons')
  }),
  execute: async (args) => {
    try {
      await connectToDiscord();

      const channel = await discordClient.channels.fetch(args.channelId);
      if (!channel || !('send' in channel)) {
        throw new Error('Canal invalide ou permissions insuffisantes');
      }

      // Créer les vrais boutons Discord
      const actionRow = new ActionRowBuilder();

      args.buttons.forEach(btn => {
        const button = new ButtonBuilder()
          .setCustomId(btn.customId || `btn_${Date.now()}_${Math.random()}`)
          .setLabel(btn.label)
          .setStyle(getButtonStyle(btn.style));

        actionRow.addComponents(button);
      });

      const message = await channel.send({
        content: args.content,
        components: [actionRow]
      });

      return {
        success: true,
        messageId: message.id,
        content: `Message avec ${args.buttons.length} bouton(s) créé avec succès`
      };
    } catch (error) {
      throw new Error(`Erreur lors de la création des boutons: ${error.message}`);
    }
  }
});

// Démarrer le serveur
async function main() {
  console.log('🚀 Démarrage du serveur Discord MCP...');

  try {
    await server.start();
    console.log('✅ Serveur Discord MCP démarré avec succès');
  } catch (error) {
    console.error('❌ Erreur lors du démarrage:', error);
    process.exit(1);
  }
}

main();