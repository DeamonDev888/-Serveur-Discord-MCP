/**
 * SYSTÈME DE VALIDATION D'URLS PRÉ-EXÉCUTION AVEC HEALTH CHECKS
 * Valide et teste les URLs avant utilisation dans les embeds
 */

import Logger from './logger.js';
import { imageCache } from './imageCache.js';

export interface UrlValidationResult {
  url: string;
  isValid: boolean;
  status: 'valid' | 'invalid' | 'timeout' | 'error';
  responseTime: number;
  statusCode?: number;
  contentType?: string;
  contentLength?: number;
  error?: string;
  suggestions?: string[];
  isCached: boolean;
  lastChecked: number;
}

export interface ValidationConfig {
  timeout: number; // Timeout en ms (5000 par défaut)
  maxConcurrent: number; // Nombre max de validations concurrentes (10 par défaut)
  retryAttempts: number; // Nombre de tentatives (2 par défaut)
  retryDelay: number; // Délai entre tentatives en ms (1000 par défaut)
  checkContentType: boolean; // Vérifier le type de contenu
  checkContentLength: boolean; // Vérifier la taille du contenu
  requireImageType: boolean; // Exiger un type d'image
  cacheResults: boolean; // Mettre en cache les résultats
  cacheTtl: number; // TTL du cache de validation en ms (1h par défaut)
}

export interface HealthCheckConfig {
  enabled: boolean;
  interval: number; // Intervalle de vérification en ms (1h par défaut)
  failureThreshold: number; // Seuil d'échecs pour marquer comme définitivement cassé (3 par défaut)
  recoveryThreshold: number; // Seuil de succès pour marquer comme réparé (2 par défaut)
}

export class UrlValidator {
  private config: ValidationConfig;
  private healthCheckConfig: HealthCheckConfig;
  private validationCache = new Map<string, {
    result: UrlValidationResult;
    expiresAt: number;
  }>();
  private healthStatus = new Map<string, {
    failures: number;
    successes: number;
    isHealthy: boolean;
    lastChecked: number;
  }>();
  private healthCheckTimer?: NodeJS.Timeout;

  constructor(
    validationConfig: Partial<ValidationConfig> = {},
    healthCheckConfig: Partial<HealthCheckConfig> = {}
  ) {
    this.config = {
      timeout: 5000,
      maxConcurrent: 10,
      retryAttempts: 2,
      retryDelay: 1000,
      checkContentType: true,
      checkContentLength: true,
      requireImageType: true,
      cacheResults: true,
      cacheTtl: 60 * 60 * 1000, // 1h
      ...validationConfig
    };

    this.healthCheckConfig = {
      enabled: true,
      interval: 60 * 60 * 1000, // 1h
      failureThreshold: 3,
      recoveryThreshold: 2,
      ...healthCheckConfig
    };

    if (this.healthCheckConfig.enabled) {
      this.startHealthCheckTimer();
    }
  }

  /**
   * Démarre le timer de health check
   */
  private startHealthCheckTimer(): void {
    this.healthCheckTimer = setInterval(() => {
      this.performHealthCheck();
    }, this.healthCheckConfig.interval);

    Logger.info('[UrlValidator] Timer de health check démarré');
  }

  /**
   * Arrête le timer de health check
   */
  stopHealthCheckTimer(): void {
    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer);
      this.healthCheckTimer = undefined;
      Logger.info('[UrlValidator] Timer de health check arrêté');
    }
  }

  /**
   * Valide une seule URL
   */
  async validateUrl(url: string): Promise<UrlValidationResult> {
    const startTime = Date.now();

    // Vérifier le cache
    if (this.config.cacheResults) {
      const cached = this.getCachedResult(url);
      if (cached) {
        return { ...cached, isCached: true };
      }
    }

    try {
      // Vérifier le format de l'URL
      const urlObj = new URL(url);

      // Health check
      const health = this.healthStatus.get(url);
      if (health && !health.isHealthy) {
        const result: UrlValidationResult = {
          url,
          isValid: false,
          status: 'error',
          responseTime: Date.now() - startTime,
          error: 'URL marquée comme non-healthy',
          isCached: false,
          lastChecked: Date.now()
        };
        this.cacheResult(url, result);
        return result;
      }

      // Effectuer la validation avec retry
      const result = await this.validateWithRetry(url);
      const finalResult: UrlValidationResult = {
        ...result,
        responseTime: Date.now() - startTime,
        isCached: false,
        lastChecked: Date.now()
      };

      // Mettre à jour le health status
      this.updateHealthStatus(url, finalResult.isValid);

      // Mettre en cache
      if (this.config.cacheResults) {
        this.cacheResult(url, finalResult);
      }

      return finalResult;

    } catch (error: any) {
      const result: UrlValidationResult = {
        url,
        isValid: false,
        status: 'error',
        responseTime: Date.now() - startTime,
        error: error.message,
        isCached: false,
        lastChecked: Date.now()
      };

      this.updateHealthStatus(url, false);
      this.cacheResult(url, result);

      return result;
    }
  }

  /**
   * Valide plusieurs URLs en parallèle avec limitation de concurrence
   */
  async validateUrls(urls: string[]): Promise<UrlValidationResult[]> {
    const chunks = this.chunkArray(urls, this.config.maxConcurrent);
    const allResults: UrlValidationResult[] = [];

    for (const chunk of chunks) {
      const chunkResults = await Promise.all(
        chunk.map(url => this.validateUrl(url))
      );
      allResults.push(...chunkResults);
    }

    return allResults;
  }

  /**
   * Valide avec retry automatique
   */
  private async validateWithRetry(url: string): Promise<UrlValidationResult> {
    let lastError: string = '';

    for (let attempt = 0; attempt <= this.config.retryAttempts; attempt++) {
      try {
        const result = await this.performValidation(url);
        if (result.isValid) {
          return result;
        }
        lastError = result.error || 'Validation échouée';
      } catch (error: any) {
        lastError = error.message;
      }

      // Attendre avant la prochaine tentative
      if (attempt < this.config.retryAttempts) {
        await this.sleep(this.config.retryDelay * (attempt + 1));
      }
    }

    return {
      url,
      isValid: false,
      status: 'error',
      responseTime: 0,
      error: `Toutes les tentatives ont échoué: ${lastError}`,
      isCached: false,
      lastChecked: Date.now()
    };
  }

  /**
   * Effectue la validation réelle d'une URL
   */
  private async performValidation(url: string): Promise<UrlValidationResult> {
    const startTime = Date.now();
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

    try {
      const response = await fetch(url, {
        signal: controller.signal,
        method: 'HEAD', // Plus rapide que GET
        headers: {
          'User-Agent': 'Discord-Embed-Validator/1.0',
          'Accept': 'image/*,*/*;q=0.8'
        }
      });

      clearTimeout(timeoutId);

      const contentType = response.headers.get('content-type') || '';
      const contentLength = response.headers.get('content-length');
      const responseTime = Date.now() - startTime;

      // Vérifier le code de statut
      if (!response.ok) {
        return {
          url,
          isValid: false,
          status: 'invalid',
          statusCode: response.status,
          contentType,
          contentLength: contentLength ? parseInt(contentLength) : undefined,
          error: `HTTP ${response.status}: ${response.statusText}`,
          isCached: false,
          lastChecked: Date.now(),
          responseTime
        };
      }

      // Vérifier le type de contenu si demandé
      if (this.config.checkContentType) {
        if (!contentType.startsWith('image/')) {
          return {
            url,
            isValid: false,
            status: 'invalid',
            statusCode: response.status,
            contentType,
            contentLength: contentLength ? parseInt(contentLength) : undefined,
            error: `Type de contenu non supporté: ${contentType}`,
            isCached: false,
            lastChecked: Date.now(),
            responseTime
          };
        }
      }

      // Vérifier la taille si demandée
      if (this.config.checkContentLength && contentLength) {
        const size = parseInt(contentLength);
        if (size > 8 * 1024 * 1024) { // 8MB max
          return {
            url,
            isValid: false,
            status: 'invalid',
            statusCode: response.status,
            contentType,
            contentLength: size,
            error: `Image trop grande: ${size} bytes (max: 8MB)`,
            isCached: false,
            lastChecked: Date.now(),
            responseTime
          };
        }
      }

      return {
        url,
        isValid: true,
        status: 'valid',
        statusCode: response.status,
        contentType,
        contentLength: contentLength ? parseInt(contentLength) : undefined,
        isCached: false,
        lastChecked: Date.now(),
        responseTime
      };

    } catch (error: any) {
      clearTimeout(timeoutId);
      const responseTime = Date.now() - startTime;

      // Déterminer le type d'erreur
      if (error.name === 'AbortError') {
        return {
          url,
          isValid: false,
          status: 'timeout',
          error: `Timeout après ${this.config.timeout}ms`,
          isCached: false,
          lastChecked: Date.now(),
          responseTime
        };
      }

      return {
        url,
        isValid: false,
        status: 'error',
        error: error.message,
        isCached: false,
        lastChecked: Date.now(),
        responseTime
      };
    }
  }

  /**
   * Met à jour le statut de santé d'une URL
   */
  private updateHealthStatus(url: string, isValid: boolean): void {
    const current = this.healthStatus.get(url) || {
      failures: 0,
      successes: 0,
      isHealthy: true,
      lastChecked: Date.now()
    };

    if (isValid) {
      current.successes++;
      current.failures = 0;

      // Marquer comme saine après recoveryThreshold succès
      if (!current.isHealthy && current.successes >= this.healthCheckConfig.recoveryThreshold) {
        current.isHealthy = true;
        Logger.info(`[UrlValidator] URL réparée: ${url}`);
      }
    } else {
      current.failures++;
      current.successes = 0;

      // Marquer comme non-saine après failureThreshold échecs
      if (current.isHealthy && current.failures >= this.healthCheckConfig.failureThreshold) {
        current.isHealthy = false;
        Logger.warn(`[UrlValidator] URL marquée comme cassée: ${url}`);
      }
    }

    current.lastChecked = Date.now();
    this.healthStatus.set(url, current);
  }

  /**
   * Effectue un health check sur toutes les URLs connues
   */
  private async performHealthCheck(): Promise<void> {
    const urls = Array.from(this.validationCache.keys());
    if (urls.length === 0) {
      return;
    }

    Logger.info(`[UrlValidator] Health check sur ${urls.length} URLs...`);

    // Vérifier un échantillon aléatoire (20%)
    const sampleSize = Math.max(1, Math.floor(urls.length * 0.2));
    const sampledUrls = this.getRandomSample(urls, sampleSize);

    const results = await Promise.allSettled(
      sampledUrls.map(url => this.validateUrl(url))
    );

    const success = results.filter(r => r.status === 'fulfilled').length;
    Logger.info(`[UrlValidator] Health check terminé: ${success}/${sampledUrls.length} URLs OK`);
  }

  /**
   * Obtient un résultat depuis le cache
   */
  private getCachedResult(url: string): UrlValidationResult | null {
    const cached = this.validationCache.get(url);
    if (!cached) {
      return null;
    }

    if (Date.now() > cached.expiresAt) {
      this.validationCache.delete(url);
      return null;
    }

    return cached.result;
  }

  /**
   * Met en cache un résultat
   */
  private cacheResult(url: string, result: UrlValidationResult): void {
    this.validationCache.set(url, {
      result,
      expiresAt: Date.now() + this.config.cacheTtl
    });
  }

  /**
   * Divise un array en chunks
   */
  private chunkArray<T>(array: T[], chunkSize: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize));
    }
    return chunks;
  }

  /**
   * Échantillonnage aléatoire
   */
  private getRandomSample<T>(array: T[], sampleSize: number): T[] {
    const shuffled = [...array].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, sampleSize);
  }

  /**
   * Utilitaire sleep
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Obtient les statistiques du validateur
   */
  getStats(): {
    cachedEntries: number;
    healthyUrls: number;
    unhealthyUrls: number;
    totalChecks: number;
  } {
    const healthy = Array.from(this.healthStatus.values())
      .filter(h => h.isHealthy).length;

    const unhealthy = Array.from(this.healthStatus.values())
      .filter(h => !h.isHealthy).length;

    return {
      cachedEntries: this.validationCache.size,
      healthyUrls: healthy,
      unhealthyUrls: unhealthy,
      totalChecks: healthy + unhealthy
    };
  }

  /**
   * Nettoie le cache de validation
   */
  cleanup(): void {
    const now = Date.now();
    let removedCount = 0;

    for (const [url, cached] of this.validationCache.entries()) {
      if (now > cached.expiresAt) {
        this.validationCache.delete(url);
        removedCount++;
      }
    }

    Logger.info(`[UrlValidator] ${removedCount} entrées de cache supprimées`);
  }

  /**
   * Génère des suggestions pour une URL invalide
   */
  generateSuggestions(invalidUrl: string): string[] {
    const suggestions: string[] = [];

    // Essayer HTTPS si HTTP
    if (invalidUrl.startsWith('http://')) {
      suggestions.push(invalidUrl.replace('http://', 'https://'));
    }

    // Essayer sans www si avec www
    if (invalidUrl.includes('www.')) {
      suggestions.push(invalidUrl.replace('www.', ''));
    } else {
      suggestions.push(invalidUrl.replace('://', '://www.'));
    }

    // Variantes communes d'extensions
    const urlObj = new URL(invalidUrl);
    const pathname = urlObj.pathname;
    const basePath = pathname.replace(/\.[a-zA-Z0-9]+$/, '');

    if (!pathname.match(/\.[a-zA-Z0-9]+$/)) {
      suggestions.push(`${urlObj.origin}${basePath}.png`);
      suggestions.push(`${urlObj.origin}${basePath}.jpg`);
      suggestions.push(`${urlObj.origin}${basePath}.jpeg`);
    }

    return suggestions.slice(0, 3); // Limiter à 3 suggestions
  }

  /**
   * Obtient les URLs problématiques
   */
  getProblematicUrls(): Array<{
    url: string;
    failures: number;
    lastChecked: number;
    error: string;
  }> {
    return Array.from(this.healthStatus.entries())
      .filter(([_, status]) => !status.isHealthy)
      .map(([url, status]) => ({
        url,
        failures: status.failures,
        lastChecked: status.lastChecked,
        error: `Échec ${status.failures} fois`
      }));
  }
}

// Instance globale du validateur
export const urlValidator = new UrlValidator({
  timeout: 5000,
  maxConcurrent: 10,
  retryAttempts: 2,
  retryDelay: 1000,
  cacheResults: true,
  cacheTtl: 60 * 60 * 1000 // 1h
});
