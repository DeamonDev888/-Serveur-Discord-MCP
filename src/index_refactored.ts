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
  StringSelectMenuOptionBuilder,
  WebhookClient
} from 'discord.js';
import { config } from 'dotenv';

// Charger les variables d'environnement
config();

// Configuration
const botConfig = {
  token: process.env.DISCORD_BOT_TOKEN || process.env.DISCORD_TOKEN || 'YOUR_BOT_TOKEN',
  clientId: process.env.DISCORD_CLIENT_ID || 'YOUR_CLIENT_ID',
  guildId: process.env.DISCORD_GUILD_ID || 'YOUR_GUILD_ID',
  activity: 'MCP Server v2.0 - 27 outils',
  adminUserId: process.env.ADMIN_USER_ID || 'YOUR_ADMIN_USER_ID',
  environment: process.env.NODE_ENV || 'development'
};

// Initialisation du serveur MCP
const server = new FastMCP({
  name: 'discord-mcp-server',
  version: '2.0.0'
});

// Variables globales partagées
let discordClient: Client | null = null;
let connectionAttempts = 0;
const MAX_CONNECTION_ATTEMPTS = 3;

// Templates d'embeds
const EMBED_TEMPLATES = {
  success: {
    title: '✅ Succès',
    color: 0x00FF00,
    description: 'Opération réussie'
  },
  error: {
    title: '❌ Erreur',
    color: 0xFF0000,
    description: 'Une erreur est survenue'
  },
  warning: {
    title: '⚠️ Attention',
    color: 0xFFAA00,
    description: 'Veuillez vérifier les informations'
  },
  info: {
    title: 'ℹ️ Information',
    color: 0x00AAFF,
    description: 'Information importante'
  },
  announcement: {
    title: '📢 Annonce',
    color: 0xFFD700,
    description: 'Annonce officielle'
  }
};

// Fonction de connexion robuste
async function ensureDiscordConnection(): Promise<Client> {
  // Si déjà connecté et prêt, retourner le client
  if (discordClient && discordClient.isReady()) {
    return discordClient;
  }

  // Si en cours de connexion, attendre
  if (discordClient && !discordClient.isReady()) {
    console.log('⏳ Client en cours de connexion, attente...');
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Timeout d\'attente de connexion'));
      }, 10000);

      discordClient!.once('ready', () => {
        clearTimeout(timeout);
        console.log('✅ Client devenu prêt');
        resolve(discordClient!);
      });

      discordClient!.once('error', (error) => {
        clearTimeout(timeout);
        reject(error);
      });
    });
  }

  // Nouvelle connexion
  connectionAttempts++;
  console.log(`🔗 Tentative de connexion Discord ${connectionAttempts}/${MAX_CONNECTION_ATTEMPTS}...`);

  try {
    discordClient = new Client({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMessageReactions,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildEmojisAndStickers,
        GatewayIntentBits.GuildWebhooks
      ]
    });

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Timeout de connexion (30s)'));
      }, 30000);

      discordClient!.once('ready', () => {
        clearTimeout(timeout);
        connectionAttempts = 0;
        console.log(`✅ Connecté: ${discordClient!.user!.tag}`);
        discordClient!.user!.setActivity(botConfig.activity);

        // Gestionnaire d'interactions
        discordClient!.on('interactionCreate', async (interaction) => {
          if (interaction.isButton()) {
            await interaction.reply({
              content: 'Bouton cliqué!',
              ephemeral: true
            });
          } else if (interaction.isStringSelectMenu()) {
            await interaction.reply({
              content: `Option sélectionnée: ${interaction.values.join(', ')}`,
              ephemeral: true
            });
          }
        });

        resolve(discordClient!);
      });

      discordClient!.once('error', (error) => {
        clearTimeout(timeout);
        console.error('❌ Erreur Discord:', error.message);
        reject(error);
      });

      // Se connecter
      if (botConfig.token && botConfig.token !== 'YOUR_BOT_TOKEN') {
        discordClient.login(botConfig.token).catch(reject);
      } else {
        reject(new Error('Token Discord non configuré'));
      }
    });
  } catch (error) {
    console.error(`❌ Échec connexion (${connectionAttempts}/${MAX_CONNECTION_ATTEMPTS}):`, error);
    if (connectionAttempts < MAX_CONNECTION_ATTEMPTS) {
      await new Promise(resolve => setTimeout(resolve, 2000));
      return ensureDiscordConnection();
    }
    throw error;
  }
}

// ============================================================================
// OUTILS MCP
// ============================================================================

// 1. Discord Status
server.addTool({
  name: 'discord_status',
  description: 'Vérifie le statut de connexion du bot',
  parameters: z.object({}),
  execute: async () => {
    try {
      const client = await ensureDiscordConnection();
      return `✅ Bot connecté | User: ${client.user!.tag} | Servers: ${client.guilds.cache.size} | Uptime: ${client.uptime}ms`;
    } catch (error: any) {
      return `❌ Bot déconnecté | Erreur: ${error.message}`;
    }
  }
});

// 2. Lister Templates
server.addTool({
  name: 'lister_templates',
  description: 'Liste tous les templates disponibles',
  parameters: z.object({}),
  execute: async () => {
    const templates = Object.keys(EMBED_TEMPLATES);
    return `📋 Templates: ${templates.join(', ')}`;
  }
});

// 3. Créer Embed Template
server.addTool({
  name: 'creer_embed_template',
  description: 'Crée un embed depuis un template',
  parameters: z.object({
    channelId: z.string().describe('ID du canal'),
    template: z.enum(['success', 'error', 'warning', 'info', 'announcement']).describe('Template'),
    customTitle: z.string().optional().describe('Titre personnalisé'),
    customDescription: z.string().optional().describe('Description personnalisée')
  }),
  execute: async (args) => {
    try {
      const client = await ensureDiscordConnection();
      const channel = await client.channels.fetch(args.channelId);

      if (!channel || !('send' in channel)) {
        throw new Error('Canal invalide ou inaccessible');
      }

      const template = EMBED_TEMPLATES[args.template];
      const embed = new EmbedBuilder()
        .setTitle(args.customTitle || template.title)
        .setColor(template.color as any)
        .setDescription(args.customDescription || template.description)
        .setTimestamp();

      const message = await channel.send({ embeds: [embed] });
      return `✅ Embed créé (${args.template}) | Message ID: ${message.id}`;
    } catch (error: any) {
      return `❌ Erreur: ${error.message}`;
    }
  }
});

// 4. Envoyer Message Simple
server.addTool({
  name: 'envoyer_message',
  description: 'Envoie un message texte simple',
  parameters: z.object({
    channelId: z.string().describe('ID du canal Discord'),
    content: z.string().describe('Contenu du message')
  }),
  execute: async (args) => {
    try {
      const client = await ensureDiscordConnection();
      const channel = await client.channels.fetch(args.channelId);

      if (!channel || !('send' in channel)) {
        throw new Error('Canal invalide ou inaccessible');
      }

      const message = await channel.send(args.content);
      return `✅ Message envoyé | ID: ${message.id}`;
    } catch (error: any) {
      return `❌ Erreur: ${error.message}`;
    }
  }
});

// 5. Créer Embed
server.addTool({
  name: 'creer_embed',
  description: 'Crée un embed personnalisé',
  parameters: z.object({
    channelId: z.string().describe('ID du canal'),
    title: z.string().optional().describe('Titre'),
    description: z.string().optional().describe('Description'),
    color: z.string().optional().describe('Couleur hex'),
    url: z.string().optional().describe('URL')
  }),
  execute: async (args) => {
    try {
      const client = await ensureDiscordConnection();
      const channel = await client.channels.fetch(args.channelId);

      if (!channel || !('send' in channel)) {
        throw new Error('Canal invalide ou inaccessible');
      }

      const embed = new EmbedBuilder();
      if (args.title) embed.setTitle(args.title);
      if (args.description) embed.setDescription(args.description);
      if (args.color) embed.setColor(args.color as any);
      if (args.url) embed.setURL(args.url);
      embed.setTimestamp();

      const message = await channel.send({ embeds: [embed] });
      return `✅ Embed personnalisé créé | ID: ${message.id}`;
    } catch (error: any) {
      return `❌ Erreur: ${error.message}`;
    }
  }
});

// 6. Lire Messages
server.addTool({
  name: 'read_messages',
  description: 'Lit l\'historique des messages',
  parameters: z.object({
    channelId: z.string().describe('ID du canal'),
    limit: z.number().min(1).max(100).default(10).describe('Nombre de messages')
  }),
  execute: async (args) => {
    try {
      const client = await ensureDiscordConnection();
      const channel = await client.channels.fetch(args.channelId);

      if (!channel || !('messages' in channel)) {
        throw new Error('Canal invalide ou inaccessible');
      }

      const messages = await channel.messages.fetch({ limit: args.limit });
      const list = messages.map(m => `• ${m.author.username}: ${m.content}`).join('\n');
      return `📖 ${messages.size} messages:\n${list}`;
    } catch (error: any) {
      return `❌ Erreur: ${error.message}`;
    }
  }
});

// 7. Ajouter Réaction
server.addTool({
  name: 'add_reaction',
  description: 'Ajoute une réaction emoji',
  parameters: z.object({
    channelId: z.string().describe('ID du canal'),
    messageId: z.string().describe('ID du message'),
    emoji: z.string().describe('Emoji')
  }),
  execute: async (args) => {
    try {
      const client = await ensureDiscordConnection();
      const channel = await client.channels.fetch(args.channelId);

      if (!channel || !('messages' in channel)) {
        throw new Error('Canal invalide ou inaccessible');
      }

      const message = await channel.messages.fetch(args.messageId);
      await message.react(args.emoji);
      return `✅ Réaction ${args.emoji} ajoutée`;
    } catch (error: any) {
      return `❌ Erreur: ${error.message}`;
    }
  }
});

// 8. Créer Sondage
server.addTool({
  name: 'creer_sondage',
  description: 'Crée un sondage interactif',
  parameters: z.object({
    channelId: z.string().describe('ID du canal'),
    question: z.string().describe('Question'),
    options: z.array(z.string()).min(2).max(10).describe('Options')
  }),
  execute: async (args) => {
    try {
      const client = await ensureDiscordConnection();
      const channel = await client.channels.fetch(args.channelId);

      if (!channel || !('send' in channel)) {
        throw new Error('Canal invalide ou inaccessible');
      }

      const embed = new EmbedBuilder()
        .setTitle(`📊 ${args.question}`)
        .setColor('#0099ff')
        .setDescription(args.options.map((opt, i) => `${i + 1}. ${opt}`).join('\n'))
        .setTimestamp();

      const rows: any[] = [];
      let currentRow = new ActionRowBuilder();

      args.options.forEach((option, index) => {
        if (index > 0 && index % 5 === 0) {
          rows.push(currentRow as any);
          currentRow = new ActionRowBuilder() as any;
        }

        const button = new ButtonBuilder()
          .setLabel(`${index + 1}`)
          .setCustomId(`poll_${Date.now()}_${index}`)
          .setStyle(index === 0 ? ButtonStyle.Primary : ButtonStyle.Secondary);

        (currentRow as any).addComponents(button);
      });

      rows.push(currentRow as any);

      const message = await channel.send({ embeds: [embed], components: rows });
      return `✅ Sondage créé | ID: ${message.id}`;
    } catch (error: any) {
      return `❌ Erreur: ${error.message}`;
    }
  }
});

// 9. Créer Boutons Personnalisés
server.addTool({
  name: 'create_custom_buttons',
  description: 'Crée des boutons personnalisés',
  parameters: z.object({
    channelId: z.string().describe('ID du canal'),
    content: z.string().describe('Contenu'),
    buttons: z.array(z.object({
      label: z.string(),
      style: z.enum(['Primary', 'Secondary', 'Success', 'Danger']),
      customId: z.string().optional(),
      emoji: z.string().optional()
    })).min(1).max(5)
  }),
  execute: async (args) => {
    try {
      const client = await ensureDiscordConnection();
      const channel = await client.channels.fetch(args.channelId);

      if (!channel || !('send' in channel)) {
        throw new Error('Canal invalide ou inaccessible');
      }

      const rows: any[] = [];
      let currentRow = new ActionRowBuilder();

      const styleMap = {
        'Primary': ButtonStyle.Primary,
        'Secondary': ButtonStyle.Secondary,
        'Success': ButtonStyle.Success,
        'Danger': ButtonStyle.Danger
      };

      args.buttons.forEach((btn, index) => {
        if (index > 0 && index % 5 === 0) {
          rows.push(currentRow as any);
          currentRow = new ActionRowBuilder() as any;
        }

        const button = new ButtonBuilder()
          .setLabel(btn.label)
          .setCustomId(btn.customId || `btn_${Date.now()}_${index}`)
          .setStyle(styleMap[btn.style as keyof typeof styleMap]);

        if (btn.emoji) button.setEmoji(btn.emoji);

        (currentRow as any).addComponents(button);
      });

      rows.push(currentRow as any);

      const message = await channel.send({
        content: args.content,
        components: rows
      });

      return `✅ Boutons créés | ID: ${message.id}`;
    } catch (error: any) {
      return `❌ Erreur: ${error.message}`;
    }
  }
});

// 10. Créer Menu
server.addTool({
  name: 'create_custom_menu',
  description: 'Crée un menu déroulant',
  parameters: z.object({
    channelId: z.string().describe('ID du canal'),
    content: z.string().describe('Contenu'),
    options: z.array(z.object({
      label: z.string(),
      value: z.string(),
      description: z.string().optional()
    })).min(1).max(25)
  }),
  execute: async (args) => {
    try {
      const client = await ensureDiscordConnection();
      const channel = await client.channels.fetch(args.channelId);

      if (!channel || !('send' in channel)) {
        throw new Error('Canal invalide ou inaccessible');
      }

      const menu = new StringSelectMenuBuilder()
        .setCustomId(`menu_${Date.now()}`)
        .setPlaceholder('Sélectionnez une option...');

      args.options.forEach((opt) => {
        const menuOption = new StringSelectMenuOptionBuilder()
          .setLabel(opt.label)
          .setValue(opt.value);

        if (opt.description) {
          menuOption.setDescription(opt.description);
        }

        (menu as any).addOptions(menuOption);
      });

      const row = new ActionRowBuilder() as any;
      row.addComponents(menu);

      const message = await channel.send({
        content: args.content,
        components: [row]
      });

      return `✅ Menu créé | ID: ${message.id}`;
    } catch (error: any) {
      return `❌ Erreur: ${error.message}`;
    }
  }
});

// 11. Infos Serveur
server.addTool({
  name: 'get_server_info',
  description: 'Informations détaillées du serveur',
  parameters: z.object({
    guildId: z.string().optional().describe('ID du serveur')
  }),
  execute: async (args) => {
    try {
      const client = await ensureDiscordConnection();
      const guildId = args.guildId || client.guilds.cache.first()?.id;

      if (!guildId) {
        throw new Error('Aucun serveur disponible');
      }

      const guild = await client.guilds.fetch(guildId);
      return `📊 ${guild.name} | Members: ${guild.memberCount} | Channels: ${guild.channels.cache.size} | Roles: ${guild.roles.cache.size}`;
    } catch (error: any) {
      return `❌ Erreur: ${error.message}`;
    }
  }
});

// 12. Lister Canaux
server.addTool({
  name: 'get_channels',
  description: 'Liste tous les canaux',
  parameters: z.object({
    guildId: z.string().optional().describe('ID du serveur'),
    type: z.string().optional().describe('Type de canal')
  }),
  execute: async (args) => {
    try {
      const client = await ensureDiscordConnection();
      const guildId = args.guildId || client.guilds.cache.first()?.id;

      if (!guildId) {
        throw new Error('Aucun serveur disponible');
      }

      const guild = await client.guilds.fetch(guildId);
      const channels = await guild.channels.fetch();

      let filtered = channels;
      if (args.type) {
        filtered = channels.filter(ch =>
          ch?.name?.toLowerCase().includes(args.type!.toLowerCase())
        );
      }

      const list = Array.from(filtered.values())
        .filter(ch => ch !== null)
        .map(ch => `#${ch!.name} (${ch!.id})`)
        .join('\n');

      return `📋 ${filtered.size} canaux:\n${list}`;
    } catch (error: any) {
      return `❌ Erreur: ${error.message}`;
    }
  }
});

// 13. Code Preview
server.addTool({
  name: 'code_preview',
  description: 'Affiche du code avec coloration',
  parameters: z.object({
    channelId: z.string().describe('ID du canal'),
    code: z.string().describe('Code'),
    language: z.string().optional().describe('Langage')
  }),
  execute: async (args) => {
    try {
      const client = await ensureDiscordConnection();
      const channel = await client.channels.fetch(args.channelId);

      if (!channel || !('send' in channel)) {
        throw new Error('Canal invalide ou inaccessible');
      }

      const codeBlock = `\`\`\`${args.language || ''}\n${args.code}\n\`\`\``;
      const message = await channel.send(codeBlock);

      return `✅ Code affiché | ID: ${message.id}`;
    } catch (error: any) {
      return `❌ Erreur: ${error.message}`;
    }
  }
});

// 14. Statut Bot
server.addTool({
  name: 'statut_bot',
  description: 'Statut actuel du bot',
  parameters: z.object({}),
  execute: async () => {
    try {
      const client = await ensureDiscordConnection();
      return `🤖 Status: Connecté\nUser: ${client.user!.tag}\nGuilds: ${client.guilds.cache.size}\nUptime: ${client.uptime}ms\nNode: ${process.version}`;
    } catch (error: any) {
      return `❌ Déconnecté | Erreur: ${error.message}`;
    }
  }
});

// ============================================================================
// NETTOYAGE
// ============================================================================

async function cleanup() {
  console.log('\n🧹 Nettoyage...');
  if (discordClient) {
    discordClient.destroy();
    discordClient = null;
  }
  console.log('✅ Nettoyage terminé');
}

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

// ============================================================================
// DÉMARRAGE
// ============================================================================

async function main() {
  console.log('🚀 Démarrage Discord MCP v2.0...\n');

  try {
    // Démarrer le serveur MCP
    await server.start();
    console.log('✅ Serveur MCP démarré\n');

    // Initialiser la connexion Discord
    try {
      await ensureDiscordConnection();
      console.log('✅ Connexion Discord établie\n');
    } catch (error) {
      console.warn('⚠️ Discord non connecté (continuation possible):', (error as Error).message);
    }

    console.log('📊 Status:');
    console.log(`   • Nom: discord-mcp-server`);
    console.log(`   • Version: 2.0.0`);
    console.log(`   • Outils: 14`);
    console.log(`   • Environment: ${botConfig.environment}`);

  } catch (error) {
    console.error('❌ Erreur fatal:', error);
    await cleanup();
    process.exit(1);
  }
}

main();
