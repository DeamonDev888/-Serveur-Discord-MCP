import Logger from '../utils/logger.js';
import { EventEmitter } from 'events';
import { createInterface } from 'readline';
import { spawn, ChildProcess } from 'child_process';

import { join } from 'path';

// Types pour la communication
interface BridgeMessage {
  type: 'mcp_to_discord' | 'discord_to_mcp';
  id: string;
  data: any;
  timestamp: number;
}

// Pont de communication entre MCP et Discord
export class DiscordBridge extends EventEmitter {
  private discordProcess: ChildProcess | null = null;
  private mcpProcess: ChildProcess | null = null;
  private pendingRequests: Map<string, { resolve: Function; reject: Function }> = new Map();
  private isDiscordConnected = false;

  constructor() {
    super();
    this.setupEventHandlers();
  }

  // Démarrer le processus Discord
  async startDiscordProcess(): Promise<void> {
    return new Promise((resolve, reject) => {
      Logger.info('🔗 Démarrage du processus Discord...');

      // Créer le processus Discord
      this.discordProcess = spawn('node', [join(__dirname, 'discordProcess.js')], {
        stdio: ['pipe', 'pipe', 'pipe'],
        env: process.env,
      });

      this.discordProcess.on('spawn', () => {
        Logger.info('✅ Processus Discord démarré');
        resolve();
      });

      this.discordProcess.on('error', error => {
        Logger.error('❌ Erreur processus Discord:', error);
        reject(error);
      });

      this.discordProcess.on('exit', code => {
        Logger.info(`📡 Processus Discord terminé avec code ${code}`);
        this.isDiscordConnected = false;
      });

      // Communiquer avec le processus Discord
      this.setupDiscordCommunication();

      // Envoyer le token Discord au démarrage
      setTimeout(() => {
        const token = process.env.DISCORD_TOKEN;
        if (token) {
          this.sendToDiscord({
            type: 'mcp_to_discord',
            id: 'connect',
            data: { action: 'connect', token },
            timestamp: Date.now(),
          });
        } else {
          Logger.error('❌ Token Discord non trouvé');
        }
      }, 1000);
    });
  }

  // Démarrer le processus MCP
  async startMCPProcess(): Promise<void> {
    return new Promise((resolve, reject) => {
      Logger.info('🔗 Démarrage du processus MCP...');

      // Créer le processus MCP avec le vrai index_secure
      this.mcpProcess = spawn('node', [join(__dirname, '../index_secure.js')], {
        stdio: ['pipe', 'pipe', 'pipe'],
        env: process.env,
      });

      this.mcpProcess.on('spawn', () => {
        Logger.info('✅ Processus MCP démarré');
        resolve();
      });

      this.mcpProcess.on('error', error => {
        Logger.error('❌ Erreur processus MCP:', error);
        reject(error);
      });

      this.mcpProcess.on('exit', code => {
        Logger.info(`📡 Processus MCP terminé avec code ${code}`);
      });

      // Rediriger stdout/stderr du MCP pour les logs
      if (this.mcpProcess.stdout) {
        this.mcpProcess.stdout.on('data', data => {
          process.stdout.write(data);
        });
      }

      if (this.mcpProcess.stderr) {
        this.mcpProcess.stderr.on('data', data => {
          process.stderr.write(data);
        });
      }
    });
  }

  // Configuration de la communication avec Discord
  private setupDiscordCommunication(): void {
    if (!this.discordProcess) return;

    const rl = createInterface({
      input: this.discordProcess.stdout!,
      output: this.discordProcess.stdin!,
    });

    // Envoyer des messages au processus Discord
    this.sendToDiscord = (message: BridgeMessage) => {
      if (this.discordProcess && this.discordProcess.stdin) {
        this.discordProcess.stdin.write(JSON.stringify(message) + '\n');
      }
    };

    // Recevoir des messages du processus Discord
    rl.on('line', line => {
      try {
        const message: BridgeMessage = JSON.parse(line);
        this.handleDiscordMessage(message);
      } catch (error) {
        Logger.error('Erreur de parsing du message Discord:', error);
      }
    });
  }

  // Gérer les messages du processus Discord
  private handleDiscordMessage(message: BridgeMessage): void {
    if (message.type === 'discord_to_mcp') {
      // Message de Discord vers MCP
      if (message.data.requestId) {
        const pending = this.pendingRequests.get(message.data.requestId);
        if (pending) {
          if (message.data.success) {
            pending.resolve(message.data.result);
          } else {
            pending.reject(new Error(message.data.error));
          }
          this.pendingRequests.delete(message.data.requestId);
        }
      } else {
        // Forward event messages to MCP
        this.sendToMCP(message);
      }
      this.emit('discord_message', message.data);
    }
  }

  // Envoyer une commande au processus Discord
  private sendToDiscord!: (message: BridgeMessage) => void;

  // Envoyer un message au processus MCP
  private sendToMCP(message: BridgeMessage): void {
    if (this.mcpProcess && this.mcpProcess.stdin) {
      this.mcpProcess.stdin.write(JSON.stringify(message) + '\n');
    }
  }

  // Exécuter une commande Discord via le pont
  async executeDiscordCommand(tool: string, args: any): Promise<any> {
    return new Promise((resolve, reject) => {
      const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      this.pendingRequests.set(requestId, { resolve, reject });

      this.sendToDiscord({
        type: 'mcp_to_discord',
        id: requestId,
        data: { tool, args, requestId },
        timestamp: Date.now(),
      });

      // Timeout après 30 secondes
      setTimeout(() => {
        if (this.pendingRequests.has(requestId)) {
          this.pendingRequests.delete(requestId);
          reject(new Error('Timeout de la commande Discord'));
        }
      }, 30000);
    });
  }

  // Configurer les gestionnaires d'événements
  private setupEventHandlers(): void {
    process.on('SIGINT', () => {
      Logger.info('\n🛑 Arrêt du pont Discord-MCP...');
      this.stop();
    });

    process.on('SIGTERM', () => {
      Logger.info('\n🛑 Arrêt du pont Discord-MCP...');
      this.stop();
    });
  }

  // Arrêter tous les processus
  stop(): void {
    if (this.discordProcess) {
      this.discordProcess.kill('SIGTERM');
      this.discordProcess = null;
    }
    if (this.mcpProcess) {
      this.mcpProcess.kill('SIGTERM');
      this.mcpProcess = null;
    }
    this.isDiscordConnected = false;
    process.exit(0);
  }

  // Vérifier si Discord est connecté
  isDiscordReady(): boolean {
    return this.isDiscordConnected;
  }

  // Définir l'état de connexion Discord
  setDiscordConnected(connected: boolean): void {
    this.isDiscordConnected = connected;
    this.emit('discord_status', connected);
  }
}

// Exporter une instance singleton
export const discordBridge = new DiscordBridge();
