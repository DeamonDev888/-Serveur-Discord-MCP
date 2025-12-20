import { Client } from 'discord.js';
import { config } from 'dotenv';

// Charger les variables d'environnement
config({ path: './.env' });

// État du processus
let isConnected = false;

// Client Discord avec configuration minimale
const client = new Client({
  intents: ['Guilds', 'GuildMessages', 'MessageContent']
});

// Gestionnaire de communication
const handleCommand = async (command) => {
  try {
    switch (command.action) {
      case 'connect':
        await client.login(command.token);
        isConnected = true;
        console.log('✅ Bot Discord connecté avec succès');
        break;

      case 'send_message':
        await sendMessage(command.args.channelId, command.args.content);
        break;

      default:
        console.log(`⚠️ Commande non reconnue: ${command.action}`);
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
    console.error('❌ Erreur lors de l\'exécution de la commande:', error.message);

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