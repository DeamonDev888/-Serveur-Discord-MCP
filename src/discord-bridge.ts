import { Client, GatewayIntentBits } from 'discord.js';
import Logger from './utils/logger.js';

// Pool de connexions Discord pour éviter les timeouts MCP
export class DiscordBridge {
  private static instance: DiscordBridge;
  private client: Client | null = null;
  private connectionPromise: Promise<Client> | null = null;
  private isConnected = false;
  private readonly token: string;

  private constructor(token: string) {
    this.token = token;
  }

  static getInstance(token: string): DiscordBridge {
    if (!DiscordBridge.instance) {
      DiscordBridge.instance = new DiscordBridge(token);
    }
    return DiscordBridge.instance;
  }

  async getClient(): Promise<Client> {
    if (this.client && this.client.isReady()) {
      Logger.debug('🚀 [Bridge] Client déjà prêt - utilisation immédiate');
      return this.client;
    }

    if (this.connectionPromise) {
      Logger.debug('⏳ [Bridge] Connexion en cours - attente...');
      return this.connectionPromise;
    }

    this.connectionPromise = this.createConnection();
    return this.connectionPromise;
  }

  private async createConnection(): Promise<Client> {
    Logger.info('🔗 [Bridge] Création nouvelle connexion Discord...');

    this.client = new Client({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMessageReactions,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildEmojisAndStickers,
        GatewayIntentBits.GuildWebhooks,
      ],
      // Configuration par défaut (stable)
    });

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        Logger.error('❌ [Bridge] Timeout connexion 20s');
        this.connectionPromise = null;
        reject(new Error('Timeout de connexion Discord (20s)'));
      }, 20000);

      this.client!.once('ready', () => {
        clearTimeout(timeout);
        this.isConnected = true;
        Logger.info(`✅ [Bridge] Connecté: ${this.client!.user!.tag}`);
        resolve(this.client!);
      });

      this.client!.once('error', error => {
        clearTimeout(timeout);
        this.connectionPromise = null;
        Logger.error('❌ [Bridge] Erreur Discord:', error.message);
        reject(error);
      });

      this.client!.once('warn', warning => {
        Logger.warn('⚠️ [Bridge] Avertissement Discord:', warning);
      });

      this.client!.login(this.token).catch(error => {
        clearTimeout(timeout);
        this.connectionPromise = null;
        Logger.error('❌ [Bridge] Erreur login:', error.message);
        reject(error);
      });
    });
  }

  async destroy(): Promise<void> {
    if (this.client && this.isConnected) {
      this.client.destroy();
      this.isConnected = false;
      this.connectionPromise = null;
      Logger.info('🧹 [Bridge] Client détruit');
    }
  }
}
