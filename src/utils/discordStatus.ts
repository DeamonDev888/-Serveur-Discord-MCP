import fs from 'fs';
import path from 'path';
import Logger from './logger.js';

// Chemin absolu vers le fichier de statut
const STATUS_FILE =
  'C:\\Users\\Deamon\\Desktop\\Backup\\Serveur MCP\\serveur_discord\\discord-status.json';

export interface DiscordStatus {
  connected: boolean;
  username?: string;
  guilds?: number;
  uptime?: number;
  lastUpdate: number;
  error?: string;
}

export function saveDiscordStatus(status: Partial<DiscordStatus>): void {
  try {
    const current: DiscordStatus = {
      connected: false,
      lastUpdate: Date.now(),
      ...status,
    };

    // S'assurer que le répertoire existe
    const dir = path.dirname(STATUS_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(STATUS_FILE, JSON.stringify(current, null, 2));
  } catch (error) {
    Logger.error('Erreur lors de la sauvegarde du statut:', error);
  }
}

export function loadDiscordStatus(): DiscordStatus | null {
  try {
    if (fs.existsSync(STATUS_FILE)) {
      const data = fs.readFileSync(STATUS_FILE, 'utf-8');
      const status = JSON.parse(data);

      // Vérifier si le statut n'est pas trop ancien (plus de 30 secondes)
      const age = Date.now() - status.lastUpdate;
      if (age > 30000) {
        return null;
      }

      return status;
    }
  } catch (error) {
    Logger.error('Erreur lors de la lecture du statut:', error);
  }

  return null;
}

export function clearDiscordStatus(): void {
  try {
    if (fs.existsSync(STATUS_FILE)) {
      fs.unlinkSync(STATUS_FILE);
    }
  } catch (error) {
    Logger.error('Erreur lors de la suppression du statut:', error);
  }
}
