import { Client, GatewayIntentBits, EmbedBuilder } from 'discord.js';
import { config } from 'dotenv';

// Charger les variables d'environnement
config({ path: './.env' });

// Client Discord
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildPresences,
    GatewayIntentBits.MessageReactions,
    GatewayIntentBits.GuildMessageReactions
  ]
});

// État du processus
let isConnected = false;

// Gestionnaire de communication
const handleCommand = async (command) => {
  try {
    switch (command.action) {
      case 'connect':
        await client.login(command.token);
        isConnected = true;
        console.log('✅ Bot Discord connecté avec succès');

        // Envoyer confirmation au MCP
        process.stdout.write(JSON.stringify({
          type: 'discord_to_mcp',
          id: 'connect_response',
          data: { success: true, message: 'Bot connecté' },
          timestamp: Date.now()
        }) + '\n');
        break;

      case 'send_message':
        await sendMessage(command.args.channelId, command.args.content);
        break;

      case 'create_embed':
        await createEmbed(command.args);
        break;

      case 'read_messages':
        await readMessages(command.args);
        break;

      case 'list_members':
        await listMembers(command.args);
        break;

      case 'get_server_info':
        await getServerInfo(command.args);
        break;

      case 'add_reaction':
        await addReaction(command.args);
        break;

      default:
        throw new Error(`Commande non reconnue: ${command.action}`);
    }

    // Envoyer confirmation de succès
    if (command.requestId) {
      process.stdout.write(JSON.stringify({
        type: 'discord_to_mcp',
        id: 'response',
        data: {
          success: true,
          requestId: command.requestId,
          message: 'Commande exécutée avec succès'
        },
        timestamp: Date.now()
      }) + '\n');
    }
  } catch (error) {
    console.error('❌ Erreur lors de l\'exécution de la commande:', error);

    // Envoyer l'erreur au MCP
    if (command.requestId) {
      process.stdout.write(JSON.stringify({
        type: 'discord_to_mcp',
        id: 'error',
        data: {
          success: false,
          requestId: command.requestId,
          error: error.message
        },
        timestamp: Date.now()
      }) + '\n');
    }
  }
};

// Fonctions Discord
async function sendMessage(channelId, content) {
  const channel = await client.channels.fetch(channelId);
  if (!channel || !('send' in channel)) {
    throw new Error('Canal invalide ou permissions insuffisantes');
  }
  await channel.send(content);
}

async function createEmbed(args) {
  const { channelId, title, description, color } = args;
  const channel = await client.channels.fetch(channelId);
  if (!channel || !('send' in channel)) {
    throw new Error('Canal invalide ou permissions insuffisantes');
  }

  const embed = new EmbedBuilder();
  if (title) embed.setTitle(title);
  if (description) embed.setDescription(description);
  if (color) embed.setColor(color);

  await channel.send({ embeds: [embed] });
}

async function readMessages(args) {
  const { channelId, limit = 10 } = args;
  const channel = await client.channels.fetch(channelId);
  if (!channel || !('messages' in channel)) {
    throw new Error('Canal invalide ou permissions insuffisantes');
  }

  const messages = await channel.messages.fetch({ limit });

  let output = `# 📜 Messages récents (${messages.size})\n\n`;
  messages.forEach((msg, index) => {
    output += `${index + 1}. **${msg.author.username}** - <t:${Math.floor(msg.createdTimestamp / 1000)}:R>\n`;
    output += `   ${msg.content}\n\n`;
  });

  console.log(`Messages lus du canal ${channelId}: ${messages.size} messages`);
}

async function listMembers(args) {
  const { guildId, limit = 20 } = args;
  const guild = await client.guilds.fetch(guildId || client.guilds.cache.first?.id);
  if (!guild) {
    throw new Error('Serveur non trouvé');
  }

  const members = await guild.members.fetch({ limit });
  console.log(`Membres listés pour le serveur ${guild.name}: ${members.size} membres`);
}

async function getServerInfo(args) {
  const guild = await client.guilds.fetch(args.guildId || client.guilds.cache.first?.id);
  if (!guild) {
    throw new Error('Serveur non trouvé');
  }

  console.log(`Informations du serveur ${guild.name} - ${guild.memberCount} membres`);
}

async function addReaction(args) {
  const { channelId, messageId, emoji } = args;
  const channel = await client.channels.fetch(channelId);
  if (!channel || !('messages' in channel)) {
    throw new Error('Canal invalide ou permissions insuffisantes');
  }

  const message = await channel.messages.fetch(messageId);
  await message.react(emoji);
  console.log(`Réaction ${emoji} ajoutée au message ${messageId}`);
}

// Lecteur stdin pour les commandes du MCP
process.stdin.setEncoding('utf8');
process.stdin.on('data', (data) => {
  const lines = data.toString().trim().split('\n');
  lines.forEach(line => {
    if (line.trim()) {
      try {
        const message = JSON.parse(line);
        if (message.type === 'mcp_to_discord') {
          handleCommand(message.data);
        }
      } catch (error) {
        console.error('Erreur de parsing du message MCP:', error);
      }
    }
  });
});

// Gestion du client Discord
client.on('ready', () => {
  console.log(`Bot Discord prêt: ${client.user?.tag}`);
  isConnected = true;
});

client.on('messageCreate', (message) => {
  if (message.author.bot) return;

  // Envoyer les messages au MCP pour traitement
  process.stdout.write(JSON.stringify({
    type: 'discord_to_mcp',
    id: 'new_message',
    data: {
      channelId: message.channelId,
      messageId: message.id,
      content: message.content,
      author: {
        id: message.author.id,
        username: message.author.username,
        discriminator: message.author.discriminator
      },
      timestamp: message.createdTimestamp
    }
  }) + '\n');
});

client.on('error', (error) => {
  console.error('Erreur client Discord:', error);
});

process.on('unhandledRejection', error => {
  console.error('Uncaught Promise Rejection:', error);
});

process.on('SIGINT', () => {
  console.log('\n🛑 Arrêt du processus Discord...');
  client.destroy();
  process.exit(0);
});

// Démarrage automatique
console.log('🔗 Processus Discord prêt à recevoir les commandes');