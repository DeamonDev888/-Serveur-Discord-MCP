/**
 * SYSTÈME DE CACHE LOCAL D'IMAGES AVEC TTL ET COMPRESSION
 * Télécharge, stocke et sert les images localement pour éviter les dépendances externes
 */

import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import Logger from './logger.js';

export interface CacheEntry {
  url: string;
  localPath: string;
  originalUrl: string;
  size: number;
  createdAt: number;
  expiresAt: number;
  hitCount: number;
  lastAccessed: number;
  mimeType: string;
  checksum: string;
}

export interface CacheConfig {
  maxSize: number; // Taille maximale en bytes (500MB par défaut)
  maxEntries: number; // Nombre maximum d'entrées (1000 par défaut)
  ttl: number; // TTL en ms (24h par défaut)
  compressionEnabled: boolean;
  autoCleanup: boolean;
  cleanupInterval: number; // Intervalle de nettoyage en ms (1h par défaut)
}

export class ImageCache {
  private cache = new Map<string, CacheEntry>();
  private config: CacheConfig;
  private cacheDir: string;
  private cleanupTimer?: NodeJS.Timeout;

  constructor(config: Partial<CacheConfig> = {}) {
    this.config = {
      maxSize: 500 * 1024 * 1024, // 500MB
      maxEntries: 1000,
      ttl: 24 * 60 * 60 * 1000, // 24h
      compressionEnabled: true,
      autoCleanup: true,
      cleanupInterval: 60 * 60 * 1000, // 1h
      ...config
    };

    this.cacheDir = path.join(process.cwd(), 'cache', 'images');
    this.ensureCacheDirectory();

    if (this.config.autoCleanup) {
      this.startCleanupTimer();
    }

    // Charger le cache existant
    this.loadCache();
  }

  /**
   * S'assure que le répertoire de cache existe
   */
  private ensureCacheDirectory(): void {
    if (!fs.existsSync(this.cacheDir)) {
      fs.mkdirSync(this.cacheDir, { recursive: true });
      Logger.info(`[ImageCache] Répertoire créé: ${this.cacheDir}`);
    }
  }

  /**
   * Démarre le timer de nettoyage automatique
   */
  private startCleanupTimer(): void {
    this.cleanupTimer = setInterval(() => {
      this.cleanup();
    }, this.config.cleanupInterval);

    Logger.info('[ImageCache] Timer de nettoyage automatique démarré');
  }

  /**
   * Arrête le timer de nettoyage
   */
  stopCleanupTimer(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = undefined;
      Logger.info('[ImageCache] Timer de nettoyage arrêté');
    }
  }

  /**
   * Calcule le hash d'un contenu
   */
  private calculateChecksum(buffer: Buffer): string {
    return crypto.createHash('sha256').update(buffer).digest('hex');
  }

  /**
   * Génère un nom de fichier local à partir d'une URL
   */
  private generateLocalPath(url: string): string {
    const hash = crypto.createHash('md5').update(url).digest('hex');
    const ext = this.getExtensionFromUrl(url) || '.bin';
    return path.join(this.cacheDir, `${hash}${ext}`);
  }

  /**
   * Extrait l'extension depuis l'URL
   */
  private getExtensionFromUrl(url: string): string | null {
    try {
      const urlObj = new URL(url);
      const pathname = urlObj.pathname;
      const match = pathname.match(/\.([a-zA-Z0-9]+)$/);
      return match ? `.${match[1].toLowerCase()}` : null;
    } catch {
      return null;
    }
  }

  /**
   * Obtient ou télécharge une image
   */
  async getOrDownload(url: string): Promise<string> {
    // Vérifier si l'image est déjà en cache
    const existing = this.get(url);
    if (existing) {
      return existing;
    }

    // Télécharger l'image
    return await this.downloadAndCache(url);
  }

  /**
   * Récupère une image depuis le cache
   */
  get(url: string): string | null {
    const entry = this.cache.get(url);

    if (!entry) {
      return null;
    }

    // Vérifier si l'entrée a expiré
    if (Date.now() > entry.expiresAt) {
      this.delete(url);
      return null;
    }

    // Vérifier si le fichier existe toujours
    if (!fs.existsSync(entry.localPath)) {
      this.delete(url);
      return null;
    }

    // Mettre à jour les stats
    entry.hitCount++;
    entry.lastAccessed = Date.now();

    Logger.debug(`[ImageCache] HIT: ${url} (${entry.hitCount} hits)`);
    return entry.localPath;
  }

  /**
   * Télécharge et met en cache une image
   */
  async downloadAndCache(url: string): Promise<string> {
    try {
      Logger.info(`[ImageCache] Téléchargement: ${url}`);

      // Télécharger avec timeout et gestion d'erreurs
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout

      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'Discord-Embed-Cache/1.0'
        }
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const contentType = response.headers.get('content-type') || 'application/octet-stream';
      const buffer = Buffer.from(await response.arrayBuffer());

      // Vérifier que c'est bien une image
      if (!contentType.startsWith('image/')) {
        throw new Error(`Type de contenu non supporté: ${contentType}`);
      }

      // Calculer le checksum
      const checksum = this.calculateChecksum(buffer);

      // Générer le chemin local
      const localPath = this.generateLocalPath(url);

      // Comprimer si activé
      let finalBuffer = buffer;
      if (this.config.compressionEnabled && contentType === 'image/png') {
        // Note: Pour une compression réelle, on utiliserait une lib comme sharp
        // Ici on garde le buffer original pour la démo
      }

      // Écrire le fichier
      fs.writeFileSync(localPath, finalBuffer);

      // Créer l'entrée de cache
      const entry: CacheEntry = {
        url,
        localPath,
        originalUrl: url,
        size: finalBuffer.length,
        createdAt: Date.now(),
        expiresAt: Date.now() + this.config.ttl,
        hitCount: 1,
        lastAccessed: Date.now(),
        mimeType: contentType,
        checksum
      };

      // Vérifier les limites avant d'ajouter
      this.enforceLimits();

      // Ajouter au cache
      this.cache.set(url, entry);

      // Sauvegarder le cache
      this.saveCache();

      Logger.info(`[ImageCache] Téléchargé et mis en cache: ${url} (${finalBuffer.length} bytes)`);
      return localPath;

    } catch (error: any) {
      Logger.error(`[ImageCache] Erreur téléchargement: ${url}`, error.message);
      throw error;
    }
  }

  /**
   * Supprime une entrée du cache
   */
  delete(url: string): boolean {
    const entry = this.cache.get(url);
    if (!entry) {
      return false;
    }

    // Supprimer le fichier physique
    try {
      if (fs.existsSync(entry.localPath)) {
        fs.unlinkSync(entry.localPath);
      }
    } catch (error) {
      Logger.warn(`[ImageCache] Impossible de supprimer le fichier: ${entry.localPath}`);
    }

    this.cache.delete(url);
    this.saveCache();

    Logger.debug(`[ImageCache] Supprimé: ${url}`);
    return true;
  }

  /**
   * Nettoie le cache (entrées expirées + respect des limites)
   */
  cleanup(): void {
    const now = Date.now();
    let removedCount = 0;
    let freedSpace = 0;

    // Supprimer les entrées expirées
    for (const [url, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.delete(url);
        removedCount++;
        freedSpace += entry.size;
      }
    }

    // Respecter la limite de taille
    this.enforceSizeLimit();

    // Respecter la limite du nombre d'entrées
    this.enforceCountLimit();

    Logger.info(`[ImageCache] Nettoyage terminé: ${removedCount} entrées supprimées, ${freedSpace} bytes libérés`);
  }

  /**
   * Force le respect des limites de taille
   */
  private enforceSizeLimit(): void {
    let totalSize = this.getTotalSize();

    if (totalSize <= this.config.maxSize) {
      return;
    }

    // Trier par dernière utilisation (LRU)
    const entries = Array.from(this.cache.entries())
      .sort((a, b) => a[1].lastAccessed - b[1].lastAccessed);

    // Supprimer les plus anciens jusqu'à être sous la limite
    for (const [url, entry] of entries) {
      this.delete(url);
      totalSize -= entry.size;

      if (totalSize <= this.config.maxSize * 0.9) { // Garder 10% de marge
        break;
      }
    }

    Logger.info(`[ImageCache] Limite de taille respectée`);
  }

  /**
   * Force le respect de la limite du nombre d'entrées
   */
  private enforceCountLimit(): void {
    if (this.cache.size <= this.config.maxEntries) {
      return;
    }

    // Trier par dernière utilisation (LRU)
    const entries = Array.from(this.cache.entries())
      .sort((a, b) => a[1].lastAccessed - b[1].lastAccessed);

    // Supprimer les plus anciens
    const toRemove = this.cache.size - this.config.maxEntries;
    for (let i = 0; i < toRemove; i++) {
      this.delete(entries[i][0]);
    }

    Logger.info(`[ImageCache] Limite du nombre d'entrées respectée`);
  }

  /**
   * Enforce toutes les limites
   */
  private enforceLimits(): void {
    this.enforceSizeLimit();
    this.enforceCountLimit();
  }

  /**
   * Calcule la taille totale du cache
   */
  private getTotalSize(): number {
    return Array.from(this.cache.values())
      .reduce((sum, entry) => sum + entry.size, 0);
  }

  /**
   * Sauvegarde le cache sur disque
   */
  private saveCache(): void {
    const cacheData = {
      config: this.config,
      entries: Object.fromEntries(
        Array.from(this.cache.entries()).map(([url, entry]) => [
          url,
          {
            ...entry,
            // Ne pas sauvegarder les méthodes
          }
        ])
      )
    };

    const cacheFile = path.join(process.cwd(), 'cache', 'cache-meta.json');
    fs.writeFileSync(cacheFile, JSON.stringify(cacheData, null, 2));
  }

  /**
   * Charge le cache depuis le disque
   */
  private loadCache(): void {
    try {
      const cacheFile = path.join(process.cwd(), 'cache', 'cache-meta.json');

      if (!fs.existsSync(cacheFile)) {
        Logger.info('[ImageCache] Aucune sauvegarde de cache trouvée');
        return;
      }

      const cacheData = JSON.parse(fs.readFileSync(cacheFile, 'utf-8'));

      let loadedCount = 0;
      for (const [url, entryData] of Object.entries(cacheData.entries)) {
        const entry = entryData as any;

        // Vérifier que le fichier existe toujours
        if (fs.existsSync(entry.localPath)) {
          this.cache.set(url, entry);
          loadedCount++;
        }
      }

      Logger.info(`[ImageCache] ${loadedCount} entrées chargées depuis la sauvegarde`);

    } catch (error: any) {
      Logger.error('[ImageCache] Erreur chargement cache:', error.message);
    }
  }

  /**
   * Obtient les statistiques du cache
   */
  getStats(): {
    entries: number;
    totalSize: number;
    hitRate: number;
    oldestEntry: number | null;
    newestEntry: number | null;
  } {
    const entries = Array.from(this.cache.values());
    const totalSize = this.getTotalSize();
    const totalHits = entries.reduce((sum, e) => sum + e.hitCount, 0);
    const totalRequests = totalHits + (this.cache.size - totalHits);

    const oldestEntry = entries.length > 0
      ? Math.min(...entries.map(e => e.createdAt))
      : null;

    const newestEntry = entries.length > 0
      ? Math.max(...entries.map(e => e.createdAt))
      : null;

    return {
      entries: this.cache.size,
      totalSize,
      hitRate: totalRequests > 0 ? (totalHits / totalRequests) * 100 : 0,
      oldestEntry,
      newestEntry
    };
  }

  /**
   * Vide complètement le cache
   */
  clear(): void {
    for (const url of this.cache.keys()) {
      this.delete(url);
    }

    Logger.info('[ImageCache] Cache complètement vidé');
  }

  /**
   * Précharge une liste d'URLs
   */
  async preload(urls: string[]): Promise<void> {
    Logger.info(`[ImageCache] Préchargement de ${urls.length} images...`);

    const results = await Promise.allSettled(
      urls.map(url => this.getOrDownload(url))
    );

    const success = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;

    Logger.info(`[ImageCache] Préchargement terminé: ${success} succès, ${failed} échecs`);
  }

  /**
   * Nettoie les fichiers orphelins (fichiers sur disque mais pas dans le cache)
   */
  cleanupOrphanFiles(): void {
    try {
      const files = fs.readdirSync(this.cacheDir);
      const cachedPaths = new Set(
        Array.from(this.cache.values()).map(e => e.localPath)
      );

      let removedCount = 0;
      for (const file of files) {
        const filePath = path.join(this.cacheDir, file);
        if (!cachedPaths.has(filePath)) {
          fs.unlinkSync(filePath);
          removedCount++;
        }
      }

      Logger.info(`[ImageCache] ${removedCount} fichiers orphelins supprimés`);
    } catch (error: any) {
      Logger.error('[ImageCache] Erreur nettoyage fichiers orphelins:', error.message);
    }
  }
}

// Instance globale du cache d'images
export const imageCache = new ImageCache({
  maxSize: 500 * 1024 * 1024, // 500MB
  maxEntries: 1000,
  ttl: 24 * 60 * 60 * 1000, // 24h
  compressionEnabled: true,
  autoCleanup: true
});
