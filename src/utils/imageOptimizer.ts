/**
 * OPTIMISEUR D'IMAGES POUR DISCORD
 * Gère les tailles optimales selon les positions Discord et améliore les performances
 */

export interface ImagePositionConfig {
  name: string;
  maxWidth: number;
  maxHeight: number;
  recommendedWidth: number;
  recommendedHeight: number;
  discordSize: 'small' | 'medium' | 'large';
  description: string;
}

export const DISCORD_IMAGE_POSITIONS: Record<string, ImagePositionConfig> = {
  authorIcon: {
    name: 'Author Icon',
    maxWidth: 1024,
    maxHeight: 1024,
    recommendedWidth: 64,
    recommendedHeight: 64,
    discordSize: 'small',
    description: 'Petite icône en haut-gauche (16x16 affiché)',
  },
  thumbnail: {
    name: 'Thumbnail',
    maxWidth: 1024,
    maxHeight: 1024,
    recommendedWidth: 128,
    recommendedHeight: 128,
    discordSize: 'medium',
    description: 'Image moyenne en haut-droite (80x80 affiché)',
  },
  image: {
    name: 'Image',
    maxWidth: 4096,
    maxHeight: 4096,
    recommendedWidth: 1024,
    recommendedHeight: 512,
    discordSize: 'large',
    description: 'Grande image en bas (400x250 affiché, pleine largeur)',
  },
  footerIcon: {
    name: 'Footer Icon',
    maxWidth: 1024,
    maxHeight: 1024,
    recommendedWidth: 64,
    recommendedHeight: 64,
    discordSize: 'small',
    description: 'Petite icône en bas-gauche (16x16 affiché)',
  },
};

export interface OptimizationResult {
  originalUrl: string;
  optimizedUrl: string;
  position: string;
  isOptimized: boolean;
  compressionRatio?: number;
  sizeReduction?: number;
  warnings: string[];
  suggestions: string[];
}

export class ImageOptimizer {
  private cache = new Map<string, OptimizationResult>();

  /**
   * Optimise une URL d'image selon sa position
   */
  optimizeUrl(url: string, position: string): OptimizationResult {
    const cacheKey = `${position}_${url}`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    const config = DISCORD_IMAGE_POSITIONS[position];
    if (!config) {
      const result: OptimizationResult = {
        originalUrl: url,
        optimizedUrl: url,
        position,
        isOptimized: false,
        warnings: [`Position inconnue: ${position}`],
        suggestions: [],
      };
      this.cache.set(cacheKey, result);
      return result;
    }

    const warnings: string[] = [];
    const suggestions: string[] = [];

    // Vérifier si l'URL semble optimisée
    const isOptimized = this.isImageOptimized(url, config);

    // Générer des suggestions d'optimisation
    if (!isOptimized) {
      suggestions.push(...this.generateOptimizationSuggestions(url, config));
    }

    // Ajouter des avertissements selon la position
    warnings.push(...this.getPositionWarnings(position, config));

    const result: OptimizationResult = {
      originalUrl: url,
      optimizedUrl: url, // Dans une vraie implémentation, on retournerait une URL optimisée
      position,
      isOptimized,
      warnings,
      suggestions,
    };

    this.cache.set(cacheKey, result);
    return result;
  }

  /**
   * Vérifie si une image semble optimisée
   */
  private isImageOptimized(url: string, config: ImagePositionConfig): boolean {
    // Dans une vraie implémentation, on analyserait l'URL pour détecter:
    // - Taille dans l'URL (ex: .../64x64/...)
    // - Format optimisé (WebP au lieu de PNG)
    // - Qualité compressée

    // Pour la démo, on fait une détection simple
    const urlLower = url.toLowerCase();

    // Vérifier si c'est un CDN avec redimensionnement
    if (urlLower.includes('resize') || urlLower.includes('w=') || urlLower.includes('width=')) {
      return true;
    }

    // Vérifier le format
    if (urlLower.endsWith('.webp') || urlLower.includes('format=webp')) {
      return true;
    }

    // Si l'URL contient la taille dans le path
    const sizeMatch = urlLower.match(/(\d+)x(\d+)/);
    if (sizeMatch) {
      const width = parseInt(sizeMatch[1]);
      const height = parseInt(sizeMatch[2]);

      if (width <= config.recommendedWidth && height <= config.recommendedHeight) {
        return true;
      }
    }

    // Par défaut, considérer comme non optimisé
    return false;
  }

  /**
   * Génère des suggestions d'optimisation
   */
  private generateOptimizationSuggestions(url: string, config: ImagePositionConfig): string[] {
    const suggestions: string[] = [];

    // Suggestion de format
    if (!url.toLowerCase().includes('webp')) {
      suggestions.push(`Utiliser le format WebP pour réduire la taille de ~30%`);
    }

    // Suggestion de dimension
    suggestions.push(
      `Redimensionner à ${config.recommendedWidth}x${config.recommendedHeight}px pour optimiser l'affichage Discord`
    );

    // Suggestion de CDN avec redimensionnement
    suggestions.push(
      `Utiliser un CDN avec redimensionnement automatique (ex: Cloudinary, ImageKit)`
    );

    // Suggestion de compression
    suggestions.push(`Compresser l'image (qualité 80-85% pour PNG, 75-80% pour JPEG)`);

    return suggestions;
  }

  /**
   * Obtient des avertissements spécifiques à la position
   */
  private getPositionWarnings(position: string, config: ImagePositionConfig): string[] {
    const warnings: string[] = [];

    switch (position) {
      case 'authorIcon':
      case 'footerIcon':
        warnings.push('Les icônes petites sont redimensionnées à 16x16px par Discord');
        warnings.push('Privilégier les images contrastées et simples pour cette taille');
        break;

      case 'thumbnail':
        warnings.push('Le thumbnail est redimensionné à 80x80px par Discord');
        warnings.push('Éviter les détails trop fins qui seront illisibles');
        break;

      case 'image':
        warnings.push("L'image principale est limitée à ~400x250px par Discord");
        warnings.push('Utiliser des images en paysage pour un meilleur rendu');
        break;
    }

    return warnings;
  }

  /**
   * Génère une URL optimisée (prototype)
   */
  generateOptimizedUrl(
    originalUrl: string,
    position: string,
    options?: {
      width?: number;
      height?: number;
      format?: 'webp' | 'jpg' | 'png';
      quality?: number;
    }
  ): string {
    const config = DISCORD_IMAGE_POSITIONS[position];
    if (!config) {
      return originalUrl;
    }

    const { width, height, format, quality } = {
      width: config.recommendedWidth,
      height: config.recommendedHeight,
      format: 'webp' as const,
      quality: 80,
      ...options,
    };

    // Dans une vraie implémentation, on utiliserait un service comme:
    // - Cloudinary: https://res.cloudinary.com/demo/image/upload/w_${width},h_${height},c_fill,q_${quality},f_webp/${originalUrl}
    // - ImageKit: https://ik.imagekit.io/your_imagekit_id/tr:w-${width},h-${height},f-${format},q-${quality}/${originalUrl}
    // - Unsplash: https://images.unsplash.com/photo-id?w=${width}&h=${height}&fit=crop&q=${quality}&fm=${format}

    // Prototype: ajouter des paramètres à l'URL
    const urlObj = new URL(originalUrl);
    urlObj.searchParams.set('w', width.toString());
    urlObj.searchParams.set('h', height.toString());
    urlObj.searchParams.set('q', quality.toString());
    urlObj.searchParams.set('f', format);

    return urlObj.toString();
  }

  /**
   * Obtient les tailles optimales pour une position
   */
  getOptimalSizes(position: string): ImagePositionConfig | null {
    return DISCORD_IMAGE_POSITIONS[position] || null;
  }

  /**
   * Liste toutes les positions supportées
   */
  getSupportedPositions(): string[] {
    return Object.keys(DISCORD_IMAGE_POSITIONS);
  }

  /**
   * Vérifie si une image respecte les limites Discord
   */
  validateDiscordLimits(
    position: string,
    imageInfo: {
      width?: number;
      height?: number;
      size?: number; // taille en bytes
    }
  ): { isValid: boolean; warnings: string[] } {
    const config = DISCORD_IMAGE_POSITIONS[position];
    if (!config) {
      return {
        isValid: false,
        warnings: [`Position inconnue: ${position}`],
      };
    }

    const warnings: string[] = [];

    if (imageInfo.width && imageInfo.width > config.maxWidth) {
      warnings.push(
        `Largeur ${imageInfo.width}px dépasse la limite Discord (${config.maxWidth}px)`
      );
    }

    if (imageInfo.height && imageInfo.height > config.maxHeight) {
      warnings.push(
        `Hauteur ${imageInfo.height}px dépasse la limite Discord (${config.maxHeight}px)`
      );
    }

    if (imageInfo.size && imageInfo.size > 8 * 1024 * 1024) {
      // 8MB
      warnings.push(
        `Taille ${(imageInfo.size / 1024 / 1024).toFixed(2)}MB dépasse la limite Discord (8MB)`
      );
    }

    return {
      isValid: warnings.length === 0,
      warnings,
    };
  }

  /**
   * Calcule le ratio de compression recommandé
   */
  calculateCompressionRatio(originalSize: number, position: string): number {
    const config = DISCORD_IMAGE_POSITIONS[position];
    if (!config) {
      return 1;
    }

    // Tailles recommandées selon la position (estimation)
    const recommendedSizes: Record<string, number> = {
      authorIcon: 2 * 1024, // 2KB
      footerIcon: 2 * 1024, // 2KB
      thumbnail: 10 * 1024, // 10KB
      image: 50 * 1024, // 50KB
    };

    const recommendedSize = recommendedSizes[position] || 50 * 1024;
    return Math.min(1, recommendedSize / originalSize);
  }

  /**
   * Génère un guide d'optimisation pour une position
   */
  generateOptimizationGuide(position: string): string {
    const config = DISCORD_IMAGE_POSITIONS[position];
    if (!config) {
      return `Position inconnue: ${position}`;
    }

    return `
**Guide d'optimisation pour ${config.name} (${position})**

📏 **Dimensions recommandées:**
   • Largeur: ${config.recommendedWidth}px
   • Hauteur: ${config.recommendedHeight}px
   • Taille max: ${config.maxWidth}x${config.maxHeight}px

🎨 **Format optimal:**
   • Format: WebP (meilleur ratio qualité/taille)
   • Alternative: PNG pour les logos (transparence)
   • Éviter: BMP, GIF animés (trop volumineux)

📦 **Compression:**
   • Qualité WebP: 80-85%
   • Qualité PNG: Niveau 6-8 (compression)
   • Taille cible: < 10KB pour ${position}

✨ **Conseils spécifiques:**
   ${this.getPositionTips(position)}

🔧 **CDNs recommandés:**
   • Cloudinary (redimensionnement automatique)
   • ImageKit (optimisation en temps réel)
   • Unsplash (images HD gratuites)

⚡ **Optimisations automatiques:**
   • Utiliser l'outil d'optimisation intégré
   • Activer le cache local d'images
   • Précharger les images critiques
`.trim();
  }

  /**
   * Obtient des tips spécifiques à la position
   */
  private getPositionTips(position: string): string {
    switch (position) {
      case 'authorIcon':
        return `• Utiliser des logos simples et contrastés
• Éviter les textes dans l'icône
• Préférer les fonds transparents`;

      case 'thumbnail':
        return `• Design impactant même en petit format
• Éviter les détails trop fins
• Couleurs vives pour attirer l'attention`;

      case 'image':
        return `• Images en paysage (16:9 ou 4:3)
• Composition centrée
• Contrastes élevés pour la lisibilité`;

      case 'footerIcon':
        return `• Icônes minimalistes
• Éviter les textes
• Style cohérent avec le footer`;

      default:
        return `• Suivre les bonnes pratiques d'optimisation d'images`;
    }
  }

  /**
   * Statistiques du cache d'optimisation
   */
  getCacheStats(): { size: number; hitRate: number } {
    return {
      size: this.cache.size,
      hitRate: 0, // Dans une vraie implém, on trackerait les hits
    };
  }
}

// Instance globale de l'optimiseur
export const imageOptimizer = new ImageOptimizer();
