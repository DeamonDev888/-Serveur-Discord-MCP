/**
 * CONVERSION AUTOMATIQUE SVG → POUR DISCORD
 * ===========================================
 * Convertit les SVG en PNG car Discord ne supporte pas les SVG
 * pour authorIcon et footerIcon.
 */

import sharp from 'sharp';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import Logger from './logger.js';

// Cache local pour les PNG convertis
const CACHE_DIR = path.join(process.cwd(), 'dist', 'cache', 'svg-png');

// S'assurer que le dossier cache existe
if (!fs.existsSync(CACHE_DIR)) {
  fs.mkdirSync(CACHE_DIR, { recursive: true });
}

/**
 * Génère un nom de fichier unique pour le PNG converti
 */
function getCacheFilename(svgUrl: string): string {
  const hash = crypto.createHash('md5').update(svgUrl).digest('hex');
  return `${hash}.png`;
}

/**
 * Télécharge une image depuis une URL
 */
async function downloadImage(url: string): Promise<Buffer> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download: ${response.status} ${response.statusText}`);
  }
  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

/**
 * Convertit un SVG en PNG
 */
async function convertSvgToPng(svgBuffer: Buffer, size: number = 64): Promise<Buffer> {
  // Sharp ne gère pas le SVG directement, on utilise une méthode alternative
  // On crée un SVG avec un viewBox fixe et on le convertit

  // Pour l'instant, on utilise une méthode simple:
  // Créer un SVG avec les dimensions fixées
  const svgString = svgBuffer.toString('utf-8');

  // Parser la taille demandée
  const png = await sharp(Buffer.from(`
    <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
      <image href="data:image/svg+xml;base64,${Buffer.from(svgString).toString('base64')}" width="${size}" height="${size}"/>
    </svg>
  `))
    .png()
    .toBuffer();

  return png;
}

/**
 * Convertit une URL SVG en PNG local
 *
 * @param svgUrl - URL du SVG à convertir
 * @param size - Taille du PNG (défaut: 64)
 * @returns Objet avec chemin et nom pour attachment Discord
 */
export async function convertSvgUrlToPng(svgUrl: string, size: number = 64): Promise<{ path: string; attachmentName: string; attachmentUrl: string }> {
  try {
    // Vérifier si déjà en cache
    const cacheFilename = getCacheFilename(svgUrl);
    const cachePath = path.join(CACHE_DIR, cacheFilename);

    if (fs.existsSync(cachePath)) {
      Logger.debug(`[SVG Converter] Cache hit for ${svgUrl}`);
      return {
        path: cachePath,
        attachmentName: cacheFilename,
        attachmentUrl: `attachment://${cacheFilename}`
      };
    }

    Logger.info(`[SVG Converter] Converting ${svgUrl} to PNG...`);

    // Télécharger le SVG
    const svgBuffer = await downloadImage(svgUrl);

    // Convertir en PNG
    const pngBuffer = await convertSvgToPng(svgBuffer, size);

    // Sauvegarder en cache
    fs.writeFileSync(cachePath, pngBuffer);

    Logger.info(`[SVG Converter] Converted to ${cachePath}`);

    return {
      path: cachePath,
      attachmentName: cacheFilename,
      attachmentUrl: `attachment://${cacheFilename}`
    };

  } catch (error: any) {
    Logger.error(`[SVG Converter] Error converting ${svgUrl}:`, error.message);
    throw error;
  }
}

/**
 * Vérifie si une URL est un SVG
 */
export function isSvgUrl(url: string): boolean {
  const lowerUrl = url.toLowerCase();
  return lowerUrl.endsWith('.svg') ||
         lowerUrl.includes('.svg?') ||
         lowerUrl.includes('simpleicons.org') ||
         lowerUrl.includes('cdn.jsdelivr.net/gh/devicons/devicon');
}

/**
 * Nettoie le cache des PNG convertis
 */
export function clearSvgCache(): void {
  try {
    const files = fs.readdirSync(CACHE_DIR);
    files.forEach(file => {
      const filePath = path.join(CACHE_DIR, file);
      fs.unlinkSync(filePath);
    });
    Logger.info(`[SVG Converter] Cache cleared: ${files.length} files deleted`);
  } catch (error) {
    Logger.error('[SVG Converter] Error clearing cache:', error);
  }
}

/**
 * Obtient les statistiques du cache
 */
export function getCacheStats(): { count: number; size: number } {
  try {
    const files = fs.readdirSync(CACHE_DIR);
    let totalSize = 0;
    files.forEach(file => {
      const filePath = path.join(CACHE_DIR, file);
      const stats = fs.statSync(filePath);
      totalSize += stats.size;
    });
    return { count: files.length, size: totalSize };
  } catch (error) {
    return { count: 0, size: 0 };
  }
}
