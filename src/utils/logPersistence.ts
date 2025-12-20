import { promises as fs } from 'fs';
import { join } from 'path';
import Logger from './logger.js';

// Configuration
const DATA_DIR = join(process.cwd(), 'data');
const LOGS_FILE = join(DATA_DIR, 'logs.json');

// Types
export interface LogEntry {
  id: string;
  timestamp: Date;
  guildId: string;
  guildName: string;
  event: string;
  channelId?: string;
  channelName?: string;
  userId?: string;
  username?: string;
  targetId?: string;
  targetUsername?: string;
  action?: string;
  reason?: string;
  data?: any;
}

// Assurer que le dossier data existe
async function ensureDataDir(): Promise<void> {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
  } catch (error) {
    Logger.error('Erreur lors de la création du dossier data:', error);
  }
}

// Charger tous les logs depuis le fichier
export async function loadLogs(): Promise<Map<string, LogEntry>> {
  await ensureDataDir();

  try {
    const data = await fs.readFile(LOGS_FILE, 'utf-8');
    const logsArray: LogEntry[] = JSON.parse(data);

    // Convertir le tableau en Map
    const logsMap = new Map<string, LogEntry>();
    logsArray.forEach(log => {
      // Convertir la date string en Date object
      log.timestamp = new Date(log.timestamp);
      logsMap.set(log.id, log);
    });

    Logger.info(`✅ ${logsMap.size} logs chargés depuis le fichier`);
    return logsMap;
  } catch (error) {
    // Si le fichier n'existe pas, créer un fichier vide
    if (error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT') {
      Logger.info('📄 Aucun fichier de logs existant, création du fichier...');
      await fs.writeFile(LOGS_FILE, JSON.stringify([], null, 2), 'utf-8');
      Logger.info('📄 Fichier de logs créé, démarrage avec une Map vide');
      return new Map<string, LogEntry>();
    }

    Logger.error('❌ Erreur lors du chargement des logs:', error);
    return new Map<string, LogEntry>();
  }
}

// Sauvegarder tous les logs dans le fichier
export async function saveLogs(logs: Map<string, LogEntry>): Promise<void> {
  await ensureDataDir();

  try {
    // Convertir la Map en tableau
    const logsArray = Array.from(logs.values());

    // Convertir les dates en strings pour la sérialisation JSON
    const logsToSave = logsArray.map(log => ({
      ...log,
      timestamp: log.timestamp.toISOString(),
    }));

    await fs.writeFile(LOGS_FILE, JSON.stringify(logsToSave, null, 2), 'utf-8');
    Logger.info(`💾 ${logs.size} logs sauvegardés dans le fichier`);
  } catch (error) {
    Logger.error('❌ Erreur lors de la sauvegarde des logs:', error);
    throw error;
  }
}

// Ajouter un nouveau log
export async function addLog(log: LogEntry, logs: Map<string, LogEntry>): Promise<void> {
  logs.set(log.id, log);
  await saveLogs(logs);
}

// Créer une entrée de log
export function createLog(
  guildId: string,
  guildName: string,
  event: string,
  data: Partial<LogEntry> = {}
): LogEntry {
  return {
    id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    timestamp: new Date(),
    guildId,
    guildName,
    event,
    ...data,
  };
}

// Filtrer les logs par critère
export function filterLogs(
  logs: Map<string, LogEntry>,
  filters: {
    guildId?: string;
    event?: string;
    userId?: string;
    startDate?: Date;
    endDate?: Date;
  }
): LogEntry[] {
  return Array.from(logs.values()).filter(log => {
    if (filters.guildId && log.guildId !== filters.guildId) return false;
    if (filters.event && log.event !== filters.event) return false;
    if (filters.userId && log.userId !== filters.userId) return false;
    if (filters.startDate && log.timestamp < filters.startDate) return false;
    if (filters.endDate && log.timestamp > filters.endDate) return false;
    return true;
  });
}

// Nettoyer les logs anciens (plus de 30 jours)
export async function cleanOldLogs(logs: Map<string, LogEntry>): Promise<number> {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  let removedCount = 0;

  for (const [id, log] of logs.entries()) {
    if (log.timestamp < thirtyDaysAgo) {
      logs.delete(id);
      removedCount++;
    }
  }

  if (removedCount > 0) {
    await saveLogs(logs);
    Logger.info(`🧹 ${removedCount} logs anciens supprimés`);
  }

  return removedCount;
}
