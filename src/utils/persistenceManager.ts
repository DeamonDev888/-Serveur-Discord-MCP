import { promises as fs } from 'fs';
import { join, dirname } from 'path';
import Logger from './logger.js';

/**
 * Gestionnaire de persistance JSON robuste
 * Fournit des écritures atomiques, des sauvegardes automatiques et une gestion des erreurs.
 */
export class PersistenceManager<T> {
  private filePath: string;
  private backupPath: string;
  private tempPath: string;
  private saveTimeout: ReturnType<typeof setTimeout> | null = null;
  private readonly debounceMs: number;

  constructor(filePath: string, debounceMs: number = 1000) {
    this.filePath = filePath;
    this.backupPath = `${filePath}.bak`;
    this.tempPath = `${filePath}.tmp`;
    this.tempPath = `${filePath}.tmp`;
    this.debounceMs = debounceMs;
    Logger.debug(`🔧 PersistenceManager initialisé sur: ${this.filePath}`);
  }

  /**
   * Assure que le répertoire parent existe
   */
  private async ensureDir(): Promise<void> {
    const dir = dirname(this.filePath);
    await fs.mkdir(dir, { recursive: true });
  }

  /**
   * Charge les données avec récupération en cas de corruption
   */
  async load(defaultValue: T): Promise<T> {
    await this.ensureDir();

    try {
      if (await this.exists(this.filePath)) {
        const data = await fs.readFile(this.filePath, 'utf-8');
        return JSON.parse(data) as T;
      }
    } catch {
      Logger.error(
        `⚠️ Corruption détectée dans ${this.filePath}, tentative de récupération via backup...`
      );

      try {
        if (await this.exists(this.backupPath)) {
          const data = await fs.readFile(this.backupPath, 'utf-8');
          const backupData = JSON.parse(data) as T;
          Logger.info(`✅ Récupération réussie depuis ${this.backupPath}`);
          return backupData;
        }
      } catch (backupError) {
        Logger.error(`❌ Échec de la récupération depuis le backup:`, backupError);
      }
    }

    return defaultValue;
  }

  /**
   * Sauvegarde atomique avec backup (version immédiate)
   */
  async saveImmediate(data: T): Promise<void> {
    await this.ensureDir();

    try {
      const jsonData = JSON.stringify(data, null, 2);

      // 1. Créer un backup de l'ancien fichier s'il existe
      if (await this.exists(this.filePath)) {
        await fs.copyFile(this.filePath, this.backupPath);
      }

      // 2. Écrire dans un fichier temporaire
      await fs.writeFile(this.tempPath, jsonData, 'utf-8');

      // 3. Renommer le fichier temporaire (opération atomique sur la plupart des OS)
      await fs.rename(this.tempPath, this.filePath);

      Logger.debug(`💾 Sauvegarde atomique réussie: ${this.filePath}`);
    } catch (error) {
      Logger.error(`❌ Échec de la sauvegarde atomique dans ${this.filePath}:`, error);
      throw error;
    }
  }

  /**
   * Sauvegarde avec debouncing pour éviter de saturer le disque
   */
  saveDebounced(data: T): void {
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
    }

    this.saveTimeout = setTimeout(() => {
      this.saveImmediate(data).catch(err => {
        Logger.error(`[DebouncedSave] Erreur lors de la sauvegarde de ${this.filePath}:`, err);
      });
    }, this.debounceMs);
  }

  private async exists(path: string): Promise<boolean> {
    try {
      await fs.access(path);
      return true;
    } catch {
      return false;
    }
  }
}
