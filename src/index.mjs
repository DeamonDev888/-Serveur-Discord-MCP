#!/usr/bin/env node

import { FastMCP } from 'fastmcp';
import { z } from 'zod';
import {
  Client,
  GatewayIntentBits,
  EmbedBuilder
} from 'discord.js';
import { config } from 'dotenv';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

// Obtenir le chemin du fichier actuel
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Charger les variables d'environnement
config({ path: join(__dirname, '../.env') });

// Configuration
const botConfig = {
  token: process.env.DISCORD_BOT_TOKEN || process.env.DISCORD_TOKEN || 'YOUR_BOT_TOKEN',
  clientId: process.env.DISCORD_CLIENT_ID || 'YOUR_CLIENT_ID',
  guildId: process.env.DISCORD_GUILD_ID || 'YOUR_GUILD_ID',
  activity: 'MCP Server v2.0',
  adminUserId: process.env.ADMIN_USER_ID || 'YOUR_ADMIN_USER_ID',
  environment: process.env.NODE_ENV || 'development'
};

// Initialisation du serveur MCP
const server = new FastMCP({
  name: 'discord-mcp-server',
  version: '2.0.0'
});

// Client Discord
let discordClient = null;
let isConnected = false;

// Connexion à Discord
async function connectToDiscord() {
  if (isConnected && discordClient?.isReady()) {
    return true;
  }

  try {
    console.log('🔗 Connexion à Discord...');

    discordClient = new Client({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
      ]
    });

    return new Promise((resolve, reject) => {
      discordClient.once('ready', () => {
        isConnected = true;
        console.log(`✅ Connecté en tant que ${discordClient?.user?.tag}`);
        discordClient?.user?.setActivity(botConfig.activity);
        resolve(true);
      });

      discordClient.once('error', (error) => {
        console.error('❌ Erreur de connexion Discord:', error);
        isConnected = false;
        reject(error);
      });

      discordClient.login(botConfig.token).catch(reject);
    });
  } catch (error) {
    console.error('❌ Erreur lors de la connexion à Discord:', error);
    isConnected = false;
    return false;
  }
}

// Outil: Envoyer un message
server.addTool({
  name: 'send_message',
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
      return `Message envoyé avec succès. ID: ${message.id}`;
    } catch (error) {
      throw new Error(`Erreur lors de l'envoi du message: ${error.message}`);
    }
  }
});

// Outil: Créer un embed
server.addTool({
  name: 'create_embed',
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
      return `Embed créé avec succès. ID: ${message.id}`;
    } catch (error) {
      throw new Error(`Erreur lors de la création de l'embed: ${error.message}`);
    }
  }
});

// Outil: Lire les messages
server.addTool({
  name: 'read_messages',
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
        type: 'text',
        text: `${messageList.length} messages lus du canal ${args.channelId}`,
        messages: messageList
      };
    } catch (error) {
      throw new Error(`Erreur lors de la lecture des messages: ${error.message}`);
    }
  }
});

// Outil: Lister les canaux
server.addTool({
  name: 'list_channels',
  description: 'Lister tous les canaux d\'un serveur',
  parameters: z.object({
    guildId: z.string().optional().describe('ID du serveur Discord (optionnel)'),
    type: z.string().optional().describe('Type de canal (text/voice/category)')
  }),
  execute: async (args) => {
    try {
      await connectToDiscord();

      const guild = await discordClient.guilds.fetch(args.guildId || discordClient.guilds.cache.first().id);
      if (!guild) {
        throw new Error('Serveur non trouvé');
      }

      const channels = await guild.channels.fetch();
      let filteredChannels = channels;

      if (args.type) {
        filteredChannels = channels.filter(ch => ch.name.toLowerCase().includes(args.type.toLowerCase()));
      }

      const channelList = filteredChannels.map(ch => ({
        id: ch.id,
        name: ch.name,
        type: ch.type,
        position: ch.position || 0
      }));

      return {
        type: 'text',
        text: `${channelList.length} canaux trouvés dans le serveur ${guild.name}`,
        channels: channelList
      };
    } catch (error) {
      throw new Error(`Erreur lors de la liste des canaux: ${error.message}`);
    }
  }
});

// Outil: Lister les membres
server.addTool({
  name: 'list_members',
  description: 'Lister les membres d\'un serveur',
  parameters: z.object({
    guildId: z.string().optional().describe('ID du serveur Discord (optionnel)'),
    limit: z.number().optional().default(20).describe('Nombre maximum de membres à lister')
  }),
  execute: async (args) => {
    try {
      await connectToDiscord();

      const guild = await discordClient.guilds.fetch(args.guildId || discordClient.guilds.cache.first().id);
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
        type: 'text',
        text: `${memberList.length} membres listés dans le serveur ${guild.name}`,
        members: memberList
      };
    } catch (error) {
      throw new Error(`Erreur lors de la liste des membres: ${error.message}`);
    }
  }
});

// Outil: Informations du serveur
server.addTool({
  name: 'get_server_info',
  description: 'Obtenir des informations détaillées sur un serveur',
  parameters: z.object({
    guildId: z.string().optional().describe('ID du serveur Discord (optionnel)')
  }),
  execute: async (args) => {
    try {
      await connectToDiscord();

      const guild = await discordClient.guilds.fetch(args.guildId || discordClient.guilds.cache.first().id);
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
        type: 'text',
        text: `Informations récupérées pour le serveur ${guild.name}`,
        server: serverInfo
      };
    } catch (error) {
      throw new Error(`Erreur lors de la récupération des infos du serveur: ${error.message}`);
    }
  }
});

// Outil: Statut Discord
server.addTool({
  name: 'discord_status',
  description: 'Vérifier le statut de connexion du bot',
  parameters: z.object({}),
  execute: async () => {
    return {
      type: 'text',
      text: isConnected ?
        `✅ Bot connecté en tant que ${discordClient?.user?.tag} | Serveurs: ${discordClient?.guilds.cache.size || 0}` :
        '❌ Bot non connecté'
    };
  }
});

// Nettoyage
async function cleanup() {
  console.log('Nettoyage en cours...');
  if (discordClient) {
    discordClient.destroy();
    discordClient = null;
  }
  isConnected = false;
  console.log('Nettoyage terminé');
}

// Gestionnaires de signaux
process.on('SIGINT', async () => {
  console.log('\nSignal SIGINT reçu');
  await cleanup();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\nSignal SIGTERM reçu');
  await cleanup();
  process.exit(0);
});

// Démarrage
async function main() {
  console.log('🚀 Démarrage du serveur Discord MCP v2.0...');

  try {
    // Démarrer le serveur MCP
    await server.start();
    console.log('✅ Serveur MCP démarré');

    // Tenter de se connecter à Discord
    if (botConfig.token && botConfig.token !== 'YOUR_BOT_TOKEN') {
      await connectToDiscord();
    } else {
      console.warn('⚠️ Token Discord non configuré. Veuillez configurer DISCORD_TOKEN ou DISCORD_BOT_TOKEN');
    }

    console.log('📊 Informations:');
    console.log(`   - Nom: discord-mcp-server`);
    console.log(`   - Version: 2.0.0`);
    console.log(`   - Outils disponibles: 6`);
    console.log(`   - Connexion Discord: ${isConnected ? '✅' : '❌'}`);

  } catch (error) {
    console.error('❌ Erreur lors du démarrage:', error);
    process.exit(1);
  }
}

main();