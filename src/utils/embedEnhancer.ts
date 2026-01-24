/**
 * ENHANCEUR D'EMBEDS - INTÉGRATION PHASE 1
 * Combine fallback + cache + validation + optimisation pour les embeds Discord
 */

import { smartFallback } from './embedFallbacks.js';
import { imageCache } from './imageCache.js';
import { urlValidator, UrlValidationResult } from './urlValidator.js';
import { imageOptimizer, OptimizationResult } from './imageOptimizer.js';
import Logger from './logger.js';

export interface EmbedEnhancementConfig {
  enableFallback: boolean;
  enableCache: boolean;
  enableValidation: boolean;
  enableOptimization: boolean;
  preValidate: boolean; // Valider avant envoi
  autoFix: boolean; // Auto-corriger les problèmes
  reportIssues: boolean; // Générer un rapport des problèmes
}

export interface EnhancementResult {
  isEnhanced: boolean;
  issues: string[];
  warnings: string[];
  suggestions: string[];
  appliedEnhancements: string[];
  urls: {
    original: string;
    optimized?: string;
    cached?: string;
    status: UrlValidationResult;
    optimization?: OptimizationResult;
  }[];
}

export class EmbedEnhancer {
  private config: EmbedEnhancementConfig;

  constructor(config: Partial<EmbedEnhancementConfig> = {}) {
    this.config = {
      enableFallback: true,
      enableCache: true,
      enableValidation: true,
      enableOptimization: true,
      preValidate: true,
      autoFix: true,
      reportIssues: true,
      ...config,
    };
  }

  /**
   * Améliore un embed en appliquant tous les systèmes Phase 1
   */
  async enhance(embedData: any): Promise<{ enhanced: any; result: EnhancementResult }> {
    const result: EnhancementResult = {
      isEnhanced: false,
      issues: [],
      warnings: [],
      suggestions: [],
      appliedEnhancements: [],
      urls: [],
    };

    try {
      // 1. Valider et optimiser toutes les URLs d'images
      const imagePositions = ['authorIcon', 'thumbnail', 'image', 'footerIcon'];
      const urlsToProcess: { position: string; url: string }[] = [];

      for (const position of imagePositions) {
        const url = embedData[position];
        if (url) {
          urlsToProcess.push({ position, url });
        }
      }

      // Traiter chaque URL
      for (const { position, url } of urlsToProcess) {
        await this.processImageUrl(position, url, embedData, result);
      }

      // 2. Appliquer les fallbacks si nécessaire
      if (this.config.enableFallback) {
        this.applyFallbacks(embedData, result);
      }

      // 3. Optimiser les URLs
      if (this.config.enableOptimization) {
        this.optimizeUrls(embedData, result);
      }

      // 4. Générer un rapport final
      if (this.config.reportIssues) {
        this.generateReport(result);
      }

      result.isEnhanced = result.appliedEnhancements.length > 0;

      Logger.info(
        `[EmbedEnhancer] Amélioration terminée: ${result.appliedEnhancements.length} enhancements appliqués`
      );

      return {
        enhanced: embedData,
        result,
      };
    } catch (error: any) {
      Logger.error('[EmbedEnhancer] Erreur:', error.message);
      result.issues.push(`Erreur d'amélioration: ${error.message}`);
      return { enhanced: embedData, result };
    }
  }

  /**
   * Traite une URL d'image avec tous les systèmes
   */
  private async processImageUrl(
    position: string,
    url: string,
    embedData: any,
    result: EnhancementResult
  ): Promise<void> {
    const urlEntry = {
      original: url,
      status: {} as UrlValidationResult,
      optimization: {} as OptimizationResult,
      cached: undefined as string | undefined,
    };

    try {
      // 1. Validation
      if (this.config.enableValidation) {
        const validationResult = await urlValidator.validateUrl(url);
        urlEntry.status = validationResult;

        if (!validationResult.isValid) {
          result.warnings.push(`${position}: URL invalide - ${validationResult.error}`);

          // Auto-correction si activée
          if (this.config.autoFix && validationResult.suggestions) {
            // Dans une vraie implém, on essayerait les suggestions
            result.suggestions.push(`${position}: Essayer les alternatives suggérées`);
          }
        }
      }

      // 2. Cache
      if (this.config.enableCache && urlEntry.status.isValid) {
        try {
          const cachedPath = await imageCache.getOrDownload(url);
          if (cachedPath !== url) {
            urlEntry.cached = cachedPath;
            result.appliedEnhancements.push(`Cache activé pour ${position}`);
            result.isEnhanced = true;
          }
        } catch (error) {
          Logger.warn(`[EmbedEnhancer] Erreur cache pour ${position}:`, error);
        }
      }

      // 3. Optimisation
      if (this.config.enableOptimization) {
        const optimizationResult = imageOptimizer.optimizeUrl(url, position);
        urlEntry.optimization = optimizationResult;

        if (optimizationResult.suggestions.length > 0) {
          result.suggestions.push(`${position}: ${optimizationResult.suggestions.join(', ')}`);
        }

        if (optimizationResult.isOptimized) {
          result.appliedEnhancements.push(`Optimisation détectée pour ${position}`);
        } else {
          result.warnings.push(`${position}: Image non optimisée pour Discord`);
        }
      }

      result.urls.push(urlEntry);
    } catch (error: any) {
      Logger.error(`[EmbedEnhancer] Erreur traitement ${position}:`, error.message);
      result.issues.push(`${position}: ${error.message}`);
    }
  }

  /**
   * Applique les fallbacks automatiques
   */
  private applyFallbacks(embedData: any, result: EnhancementResult): void {
    const imagePositions = ['authorIcon', 'thumbnail', 'image', 'footerIcon'];
    let fallbacksApplied = 0;

    for (const position of imagePositions) {
      const url = embedData[position];
      if (url && !url.startsWith('http')) {
        // L'URL n'est pas une URL externe, probablement déjà un fallback (emoji, etc.)
        continue;
      }

      // Utiliser le système de fallback intelligent
      const fallbackUrl = smartFallback.getBestUrl(
        position,
        url,
        [], // Pas d'alternatives pour l'instant
        {
          category: this.detectCategoryFromEmbed(embedData),
          theme: embedData.theme,
        }
      );

      if (fallbackUrl !== url) {
        embedData[position] = fallbackUrl;
        fallbacksApplied++;
        result.appliedEnhancements.push(`Fallback appliqué pour ${position}: ${fallbackUrl}`);
      }
    }

    if (fallbacksApplied > 0) {
      result.isEnhanced = true;
      Logger.info(`[EmbedEnhancer] ${fallbacksApplied} fallbacks appliqués`);
    }
  }

  /**
   * Optimise les URLs d'images
   */
  private optimizeUrls(embedData: any, result: EnhancementResult): void {
    const imagePositions = ['authorIcon', 'thumbnail', 'image', 'footerIcon'];
    let optimizationsApplied = 0;

    for (const position of imagePositions) {
      const url = embedData[position];
      if (!url) continue;

      // Générer une URL optimisée
      const optimizedUrl = imageOptimizer.generateOptimizedUrl(url, position);

      if (optimizedUrl !== url) {
        embedData[position] = optimizedUrl;
        optimizationsApplied++;
        result.appliedEnhancements.push(`URL optimisée pour ${position}`);
      }
    }

    if (optimizationsApplied > 0) {
      result.isEnhanced = true;
      Logger.info(`[EmbedEnhancer] ${optimizationsApplied} URLs optimisées`);
    }
  }

  /**
   * Détecte la catégorie depuis l'embed
   */
  private detectCategoryFromEmbed(embedData: any): string {
    const title = embedData.title?.toLowerCase() || '';
    const description = embedData.description?.toLowerCase() || '';

    if (title.includes('crypto') || title.includes('btc') || title.includes('eth')) {
      return 'crypto';
    }
    if (title.includes('game') || title.includes('play') || description.includes('gaming')) {
      return 'gaming';
    }
    if (title.includes('corp') || title.includes('business')) {
      return 'corporate';
    }

    return 'default';
  }

  /**
   * Génère un rapport d'amélioration
   */
  private generateReport(result: EnhancementResult): void {
    if (result.appliedEnhancements.length === 0 && result.issues.length === 0) {
      return;
    }

    Logger.info("=== RAPPORT D'AMÉLIORATION EMBED ===");

    if (result.appliedEnhancements.length > 0) {
      Logger.info('✅ Améliorations appliquées:');
      result.appliedEnhancements.forEach(enhancement => {
        Logger.info(`   • ${enhancement}`);
      });
    }

    if (result.warnings.length > 0) {
      Logger.warn('⚠️ Avertissements:');
      result.warnings.forEach(warning => {
        Logger.warn(`   • ${warning}`);
      });
    }

    if (result.suggestions.length > 0) {
      Logger.info('💡 Suggestions:');
      result.suggestions.forEach(suggestion => {
        Logger.info(`   • ${suggestion}`);
      });
    }

    if (result.issues.length > 0) {
      Logger.error('❌ Problèmes:');
      result.issues.forEach(issue => {
        Logger.error(`   • ${issue}`);
      });
    }

    Logger.info('==================================');
  }

  /**
   * Pré-valide un embed avant envoi
   */
  async preValidate(
    embedData: any
  ): Promise<{ isValid: boolean; errors: string[]; warnings: string[] }> {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      const { result } = await this.enhance({ ...embedData });

      // Collecter les erreurs critiques
      for (const urlEntry of result.urls) {
        if (!urlEntry.status.isValid) {
          errors.push(`${urlEntry.status.url}: ${urlEntry.status.error}`);
        }
      }

      // Collecter les avertissements
      warnings.push(...result.warnings);

      return {
        isValid: errors.length === 0,
        errors,
        warnings,
      };
    } catch (error: any) {
      errors.push(`Erreur de validation: ${error.message}`);
      return { isValid: false, errors, warnings };
    }
  }

  /**
   * Obtient les statistiques des améliorations
   */
  getStats(): {
    cache: ReturnType<typeof imageCache.getStats>;
    validator: ReturnType<typeof urlValidator.getStats>;
    optimizer: ReturnType<typeof imageOptimizer.getCacheStats>;
  } {
    return {
      cache: imageCache.getStats(),
      validator: urlValidator.getStats(),
      optimizer: imageOptimizer.getCacheStats(),
    };
  }

  /**
   * Nettoie les caches et données temporaires
   */
  async cleanup(): Promise<void> {
    Logger.info('[EmbedEnhancer] Nettoyage...');

    imageCache.cleanup();
    urlValidator.cleanup();

    Logger.info('[EmbedEnhancer] Nettoyage terminé');
  }

  /**
   * Précharge les images d'un embed
   */
  async preloadEmbedImages(embedData: any): Promise<void> {
    const imagePositions = ['authorIcon', 'thumbnail', 'image', 'footerIcon'];
    const urls: string[] = [];

    for (const position of imagePositions) {
      const url = embedData[position];
      if (url && url.startsWith('http')) {
        urls.push(url);
      }
    }

    if (urls.length > 0) {
      await imageCache.preload(urls);
    }
  }
}

// Instance globale de l'enhancer
export const embedEnhancer = new EmbedEnhancer({
  enableFallback: true,
  enableCache: true,
  enableValidation: true,
  enableOptimization: true,
  preValidate: true,
  autoFix: true,
  reportIssues: true,
});
