/**
 * SYSTÈME DE FALLBACK AUTOMATIQUE POUR EMBEDS DISCORD
 * Remplace automatiquement les URLs bloquées par des alternatives fiables
 */

import { isLocalLogoUrl } from '../tools/embeds.js';

export type FallbackType = 'emoji' | 'default' | 'gradient' | 'text';

export interface FallbackConfig {
  type: FallbackType;
  value: string;
  priority: number;
}

/**
 * Mappage des fallbacks par position d'image
 */
export const IMAGE_POSITION_FALLBACKS: Record<string, FallbackConfig> = {
  authorIcon: {
    type: 'emoji',
    value: '👤',
    priority: 1
  },
  thumbnail: {
    type: 'emoji',
    value: '🖼️',
    priority: 1
  },
  image: {
    type: 'emoji',
    value: '🎨',
    priority: 1
  },
  footerIcon: {
    type: 'emoji',
    value: '📌',
    priority: 1
  }
};

/**
 * Mappage des fallbacks par catégorie de contenu
 */
export const CATEGORY_FALLBACKS: Record<string, FallbackConfig> = {
  crypto: { type: 'emoji', value: '₿', priority: 2 },
  gaming: { type: 'emoji', value: '🎮', priority: 2 },
  corporate: { type: 'emoji', value: '💼', priority: 2 },
  tech: { type: 'emoji', value: '💻', priority: 2 },
  finance: { type: 'emoji', value: '💰', priority: 2 },
  social: { type: 'emoji', value: '💬', priority: 2 },
  default: { type: 'emoji', value: '✨', priority: 3 }
};

/**
 * Détecte la catégorie d'une URL ou d'un nom
 */
function detectCategory(urlOrName: string): string {
  const lower = urlOrName.toLowerCase();

  if (lower.includes('crypto') || lower.includes('btc') || lower.includes('eth')) {
    return 'crypto';
  }
  if (lower.includes('game') || lower.includes('play') || lower.includes('steam')) {
    return 'gaming';
  }
  if (lower.includes('corp') || lower.includes('business') || lower.includes('company')) {
    return 'corporate';
  }
  if (lower.includes('tech') || lower.includes('dev') || lower.includes('code')) {
    return 'tech';
  }
  if (lower.includes('money') || lower.includes('dollar') || lower.includes('finance')) {
    return 'finance';
  }
  if (lower.includes('chat') || lower.includes('social') || lower.includes('discord')) {
    return 'social';
  }

  return 'default';
}

/**
 * Applique un fallback intelligent selon le contexte
 */
export function applyFallback(
  position: string,
  originalUrl: string,
  context?: {
    category?: string;
    theme?: string;
    customFallback?: string;
  }
): string {
  // Si l'URL est valide, la retourner
  if (isLocalLogoUrl(originalUrl)) {
    return originalUrl;
  }

  // 1. Fallback personnalisé (priorité最高)
  if (context?.customFallback) {
    return context.customFallback;
  }

  // 2. Fallback par position
  const positionFallback = IMAGE_POSITION_FALLBACKS[position];
  if (positionFallback) {
    return positionFallback.value;
  }

  // 3. Fallback par catégorie
  const category = context?.category || detectCategory(originalUrl);
  const categoryFallback = CATEGORY_FALLBACKS[category] || CATEGORY_FALLBACKS.default;

  return categoryFallback.value;
}

/**
 * Applique un fallback avec plusieurs niveaux de fallback
 */
export function applyMultiLevelFallback(
  position: string,
  url: string,
  fallbacks: string[]
): string {
  // Si l'URL principale fonctionne, l'utiliser
  if (isLocalLogoUrl(url)) {
    return url;
  }

  // Essayer chaque fallback en ordre de priorité
  for (const fallback of fallbacks) {
    if (isLocalLogoUrl(fallback)) {
      return fallback;
    }
  }

  // Si aucun fallback ne fonctionne, utiliser le fallback par défaut
  return applyFallback(position, url);
}

/**
 * Génère un fallback dégradé si aucune image n'est disponible
 */
export function generateGradientFallback(theme?: string): string {
  const gradients: Record<string, string> = {
    cyberpunk: '#FF10F0',
    gaming: '#7289DA',
    corporate: '#0066CC',
    sunset: '#FF6B6B',
    ocean: '#00CED1',
    minimal: '#2C2C2C',
    noel: '#C41E3A',
    default: '#5865F2'
  };

  return gradients[theme || 'default'] || gradients.default;
}

/**
 * Système de fallback intelligent avec retry automatique
 */
export class SmartFallback {
  private cache = new Map<string, string>();

  /**
   * Obtient la meilleure URL avec fallback automatique
   */
  async getBestUrl(
    position: string,
    primaryUrl: string,
    alternatives: string[] = [],
    context?: any
  ): Promise<string> {
    const cacheKey = `${position}_${primaryUrl}_${alternatives.join(',')}`;

    // Vérifier le cache
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    // 1. Essayer l'URL primaire
    if (isLocalLogoUrl(primaryUrl)) {
      this.cache.set(cacheKey, primaryUrl);
      return primaryUrl;
    }

    // 2. Essayer les alternatives
    for (const alt of alternatives) {
      if (isLocalLogoUrl(alt)) {
        this.cache.set(cacheKey, alt);
        return alt;
      }
    }

    // 3. Appliquer le fallback intelligent
    const fallback = applyFallback(position, primaryUrl, context);
    this.cache.set(cacheKey, fallback);
    return fallback;
  }

  /**
   * Invalide le cache (utile après des mises à jour)
   */
  invalidateCache(pattern?: string): void {
    if (pattern) {
      for (const key of this.cache.keys()) {
        if (key.includes(pattern)) {
          this.cache.delete(key);
        }
      }
    } else {
      this.cache.clear();
    }
  }

  /**
   * Statistiques du cache
   */
  getCacheStats(): { size: number; entries: string[] } {
    return {
      size: this.cache.size,
      entries: Array.from(this.cache.keys())
    };
  }
}

// Instance globale du fallback intelligent
export const smartFallback = new SmartFallback();

/**
 * Helper pour appliquer un fallback sur tous les types d'images d'un embed
 */
export function applyEmbedFallbacks(
  embedData: any,
  context?: any
): any {
  const processedData = { ...embedData };

  // Fallback pour authorIcon
  if (processedData.authorIcon) {
    processedData.authorIcon = applyFallback(
      'authorIcon',
      processedData.authorIcon,
      context
    );
  }

  // Fallback pour thumbnail
  if (processedData.thumbnail) {
    processedData.thumbnail = applyFallback(
      'thumbnail',
      processedData.thumbnail,
      context
    );
  }

  // Fallback pour image
  if (processedData.image) {
    processedData.image = applyFallback(
      'image',
      processedData.image,
      context
    );
  }

  // Fallback pour footerIcon
  if (processedData.footerIcon) {
    processedData.footerIcon = applyFallback(
      'footerIcon',
      processedData.footerIcon,
      context
    );
  }

  return processedData;
}
