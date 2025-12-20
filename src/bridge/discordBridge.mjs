import { EventEmitter } from 'events';
import { spawn, ChildProcess } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Types pour la communication
export class DiscordBridge extends EventEmitter {
  constructor() {
    super();
    this.setupEventHandlers();
  }

  // Configurer les gestionnaires d'événements
  setupEventHandlers() {
    process.on('SIGINT', () => {
      console.log('\n🛑 Arrêt du pont Discord-MCP...');
      this.stop();
    });

    process.on('SIGTERM', () => {
      console.log('\n🛑 Arrêt du pont Discord-MCP...');
      this.stop();
    });
  }

  // Arrêter tous les processus
  stop() {
    process.exit(0);
  }
}

// Exporter une instance singleton
export const discordBridge = new DiscordBridge();