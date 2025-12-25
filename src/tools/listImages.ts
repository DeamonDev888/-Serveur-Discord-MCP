/**
 * Outil unifié pour lister/récupérer les logos (crypto, entreprises, services)
 * Fusionne get_thumbnail + emoji_theme_crypto + emoji_theme_companies + emoji_theme_services
 *
 * NOUVELLES CATÉGORIES SUPPORTÉES:
 * - POKEMON_LOGOS: Types, sprites, Pokéballs, services Pokémon
 * - ANIME_LOGOS: Services anime, streaming, studios, genres
 * - STEAM_LOGOS: Plateforme Steam, jeux populaires
 * - DEVOPS_LOGOS: Cloud, containers, IaC, CI/CD, monitoring
 * - ESPORT_LOGOS: Plateformes, jeux, équipes légendaires
 */

import { z } from 'zod';
import type { FastMCP } from 'fastmcp';
import {
  CRYPTO_LOGOS,
  COMPANY_LOGOS,
  MISC_LOGOS,
  VIDEOGAME_LOGOS,
  PARTY_LOGOS,
  SIMPLEICONS_LOGOS,
  THEME_IMAGES,
  POKEMON_LOGOS,
  ANIME_LOGOS,
  STEAM_LOGOS,
  DEVOPS_LOGOS,
  ESPORT_LOGOS,
  // Vraies images Unsplash
  ANIME_IMAGES,
  CYBERPUNK_IMAGES,
  DEVOPS_IMAGES,
  NATURE_IMAGES,
  ESPORT_IMAGES,
  REAL_IMAGES,
} from '../data/logos.js';

// ============================================================================
// CONFIGURATION PICSUM PHOTOS (Gratuit, sans clé API)
// ============================================================================

// Picsum Photos - Service gratuit d'images aléatoires haute qualité
// Pas de clé API nécessaire - https://picsum.photos
const PICSUM_BASE_URL = 'https://picsum.photos';

// ============================================================================
// MAPPING INTELLIGENT SYMBOLE → QUERY PICSUM
// ============================================================================

const SYMBOL_TO_QUERY: Record<string, { width: number; height: number; blur?: number; grayscale?: boolean }> = {
  // Cryptos populaires - Images abstraites technologiques
  BTC: { width: 800, height: 400 },
  ETH: { width: 800, height: 400, grayscale: true },
  XRP: { width: 800, height: 400 },
  USDT: { width: 800, height: 400, blur: 2 },
  BNB: { width: 800, height: 400 },
  SOL: { width: 800, height: 400, grayscale: true },
  USDC: { width: 800, height: 400 },
  ADA: { width: 800, height: 400 },
  DOGE: { width: 800, height: 400, blur: 1 },
  TRX: { width: 800, height: 400 },
  TON: { width: 800, height: 400 },
  LINK: { width: 800, height: 600 },
  MATIC: { width: 800, height: 400 },
  DOT: { width: 800, height: 400 },
  SHIB: { width: 800, height: 400 },
  AVAX: { width: 800, height: 400 },
  LTC: { width: 800, height: 400 },
  BCH: { width: 800, height: 400 },
  UNI: { width: 800, height: 400 },
  ATOM: { width: 800, height: 400 },
  RNDR: { width: 800, height: 400 },
  GRT: { width: 800, height: 400 },

  // Actions & Tech - Images business/tech
  AAPL: { width: 800, height: 400 },
  TSLA: { width: 800, height: 400 },
  MSFT: { width: 800, height: 400 },
  GOOGL: { width: 800, height: 400 },
  AMZN: { width: 800, height: 400 },
  META: { width: 800, height: 400 },
  NVDA: { width: 800, height: 400 },
  NFLX: { width: 800, height: 400 },
  PYPL: { width: 800, height: 400 },
  JPM: { width: 800, height: 400 },
  VISA: { width: 800, height: 400 },
  MA: { width: 800, height: 400 },

  // Services
  DISCORD: { width: 800, height: 400, blur: 1 },
  TELEGRAM: { width: 800, height: 400, grayscale: true },
  YOUTUBE: { width: 800, height: 400 },
  TWITTER: { width: 800, height: 400 },
  REDDIT: { width: 800, height: 400 },
  GITHUB: { width: 800, height: 400 },
};

const CATEGORY_TO_QUERY: Record<string, { width: number; height: number; blur?: number; grayscale?: boolean }> = {
  crypto: { width: 800, height: 400, grayscale: true },
  companies: { width: 800, height: 600 },
  services: { width: 800, height: 400 },
  ai: { width: 800, height: 400, blur: 2 },
  dev: { width: 800, height: 400, grayscale: true },
  finance: { width: 800, height: 400 },
  technology: { width: 800, height: 400 },
  gaming: { width: 800, height: 400 },
};

// ============================================================================
// MAPPING PICSUM (GIFs - simulation avec effets)
// ============================================================================

const GIF_TO_QUERY: Record<string, { width: number; height: number; blur: number }> = {
  // Cryptos - GIFs simulés avec blur
  BTC: { width: 600, height: 300, blur: 3 },
  ETH: { width: 600, height: 300, blur: 2 },
  XRP: { width: 600, height: 300, blur: 2 },
  USDT: { width: 600, height: 300, blur: 1 },
  BNB: { width: 600, height: 300, blur: 2 },
  SOL: { width: 600, height: 300, blur: 3 },
  USDC: { width: 600, height: 300, blur: 1 },
  DOGE: { width: 600, height: 300, blur: 2 },
  SHIB: { width: 600, height: 300, blur: 3 },

  // Tech
  AAPL: { width: 600, height: 300, blur: 1 },
  TSLA: { width: 600, height: 300, blur: 2 },
  MSFT: { width: 600, height: 300, blur: 1 },
  NVDA: { width: 600, height: 300, blur: 2 },
};

const CATEGORY_TO_GIF: Record<string, { width: number; height: number; blur: number }> = {
  crypto: { width: 600, height: 300, blur: 2 },
  companies: { width: 600, height: 300, blur: 1 },
  services: { width: 600, height: 300, blur: 2 },
  gaming: { width: 600, height: 300, blur: 3 },
};

// ============================================================================
// SCHÉMAS ZOD
// ============================================================================

const ListImagesSchema = z.object({
  symbols: z.union([
    z.string(),  // Un seul symbole
    z.array(z.string())  // Plusieurs symboles
  ]).optional().describe('Symbole(s) à rechercher (ex: "BTC" ou ["BTC", "ETH", "AAPL"]). Si vide, liste tous les logos de la catégorie.'),
  category: z.enum([
    'all', 'crypto', 'companies', 'services', 'ai', 'dev', 'finance',
    // NOUVELLES CATÉGORIES
    'pokemon', 'anime', 'steam', 'devops', 'esport', 'videogame', 'party', 'simpleicons', 'themes',
    // VRAIES IMAGES UNSPLASH (photos HD, wallpapers)
    'anime_images', 'cyberpunk', 'devops_images', 'nature', 'esport_images', 'real_images'
  ]).optional().default('all').describe('Catégorie de logos ou images'),
  sector: z.enum(['all', 'technology', 'finance', 'healthcare', 'consumer', 'energy', 'automotive', 'aerospace', 'telecom', 'retail', 'entertainment']).optional().default('all').describe('Secteur (pour companies uniquement)'),
  subcategory: z.enum([
    'all', 'top20', 'defi', 'meme', 'stablecoins', 'exchanges', 'social', 'cloud', 'broker', 'index', 'bank', 'payment', 'news', 'ai', 'dev',
    // NOUVELLES SOUS-CATÉGORIES
    'type', 'pokemon', 'item', // Pokemon: types, pokemons, items
    'service', 'streaming', 'studio', 'genre', // Anime
    'platform', 'game', 'team', // Steam/ESport
    'cloud', 'container', 'iac', 'cicd', 'monitoring', 'logging', // DevOps
    'organizer', // ESport
  ]).optional().default('all').describe('Sous-catégorie (pour crypto et services)'),
  search: z.string().optional().describe('Recherche personnalisée pour photos (ex: "cybertruck desert")'),
  format: z.enum(['list', 'compact', 'urls', 'json', 'discord']).optional().default('discord').describe('Format de sortie'),
  limit: z.number().optional().default(20).describe('Nombre maximum d\'images à retourner (Picsum = illimité)'),
  // NOUVEAU : choix entre logo, photo réelle, ou image stylisée
  mode: z.enum(['logo', 'photo', 'gif']).optional().default('photo').describe('logo = logos classiques (base locale), photo = images HD (Picsum), gif = images stylisées avec blur (Picsum)')
});

// ============================================================================
// FONCTIONS UTILITAIRES
// ============================================================================

function getImageUrl(symbol: string, mode: 'logo' | 'photo' = 'logo'): { name: string; url: string; type: string; mode: string } | null {
  const upperSymbol = symbol.toUpperCase().replace(/[-_\s]/g, '');

  // Chercher dans les cryptos
  if (CRYPTO_LOGOS[upperSymbol]) {
    const crypto = CRYPTO_LOGOS[upperSymbol];
    return { name: crypto.name, url: crypto.logo, type: 'crypto', mode };
  }

  // Chercher dans les entreprises
  if (COMPANY_LOGOS[upperSymbol]) {
    const company = COMPANY_LOGOS[upperSymbol];
    return { name: company.name, url: company.logo, type: 'company', mode };
  }

  // Chercher dans les services
  if (MISC_LOGOS[upperSymbol]) {
    const misc = MISC_LOGOS[upperSymbol];
    return { name: misc.name, url: misc.logo, type: misc.category.toLowerCase(), mode };
  }

  // Chercher dans les Pokémon (NOUVEAU)
  if (POKEMON_LOGOS[upperSymbol]) {
    const pokemon = POKEMON_LOGOS[upperSymbol];
    return { name: pokemon.name, url: pokemon.logo, type: 'pokemon', mode };
  }

  // Chercher dans les Animes (NOUVEAU)
  if (ANIME_LOGOS[upperSymbol]) {
    const anime = ANIME_LOGOS[upperSymbol];
    return { name: anime.name, url: anime.logo, type: 'anime', mode };
  }

  // Chercher dans Steam (NOUVEAU)
  if (STEAM_LOGOS[upperSymbol]) {
    const steam = STEAM_LOGOS[upperSymbol];
    return { name: steam.name, url: steam.logo, type: 'steam', mode };
  }

  // Chercher dans DevOps (NOUVEAU)
  if (DEVOPS_LOGOS[upperSymbol]) {
    const devops = DEVOPS_LOGOS[upperSymbol];
    return { name: devops.name, url: devops.logo, type: 'devops', mode };
  }

  // Chercher dans ESport (NOUVEAU)
  if (ESPORT_LOGOS[upperSymbol]) {
    const esport = ESPORT_LOGOS[upperSymbol];
    return { name: esport.name, url: esport.logo, type: 'esport', mode };
  }

  // Chercher dans les jeux vidéo (NOUVEAU)
  if (VIDEOGAME_LOGOS[upperSymbol]) {
    const videogame = VIDEOGAME_LOGOS[upperSymbol];
    return { name: videogame.name, url: videogame.logo, type: 'videogame', mode };
  }

  // Chercher dans les fêtes/célébrations (NOUVEAU)
  if (PARTY_LOGOS[upperSymbol]) {
    const party = PARTY_LOGOS[upperSymbol];
    return { name: party.name, url: party.logo, type: 'party', mode };
  }

  // Chercher dans SimpleIcons (NOUVEAU)
  if (SIMPLEICONS_LOGOS[upperSymbol]) {
    const simpleicon = SIMPLEICONS_LOGOS[upperSymbol];
    return { name: simpleicon.name, url: simpleicon.logo, type: 'simpleicons', mode };
  }

  // Chercher dans les thèmes (NOUVEAU)
  if (THEME_IMAGES[upperSymbol]) {
    const theme = THEME_IMAGES[upperSymbol];
    return { name: theme.name, url: theme.logo, type: 'theme', mode };
  }

  return null;
}

function getAllImages(category: string = 'all', sector: string = 'all', subcategory: string = 'all', search: string = '', limit: number = 50, mode: 'logo' | 'photo' = 'logo') {
  let results: Array<{ symbol: string; name: string; url: string; type: string; mode: string; sector?: string }> = [];

  // Cryptos
  if (category === 'all' || category === 'crypto') {
    let cryptos = Object.entries(CRYPTO_LOGOS);

    // Filtrer par sous-catégorie
    if (subcategory !== 'all') {
      const subcategories: Record<string, string[]> = {
        top20: ['BTC', 'ETH', 'XRP', 'USDT', 'BNB', 'SOL', 'USDC', 'ADA', 'DOGE', 'TRX', 'TON', 'LINK', 'MATIC', 'DOT', 'SHIB', 'AVAX', 'LTC', 'BCH', 'UNI', 'ATOM'],
        defi: ['UNI', 'AAVE', 'MKR', 'COMP', 'SNX', 'CRV', 'SUSHI', 'YFI', 'INCH', 'LDO', 'RPL'],
        meme: ['DOGE', 'SHIB', 'PEPE', 'FLOKI', 'BONK'],
        stablecoins: ['USDT', 'USDC', 'DAI', 'BUSD', 'TUSD', 'FRAX'],
        exchanges: ['BNB', 'CRO', 'OKB', 'LEO'],
        ai: ['RNDR', 'GRT'],
      };
      const categorySymbols = subcategories[subcategory] || [];
      cryptos = cryptos.filter(([symbol]) => categorySymbols.includes(symbol));
    }

    // Recherche
    if (search) {
      const searchLower = search.toLowerCase();
      cryptos = cryptos.filter(([symbol, info]) =>
        symbol.toLowerCase().includes(searchLower) ||
        info.name.toLowerCase().includes(searchLower)
      );
    }

    results.push(...cryptos.map(([symbol, info]) => ({
      symbol,
      name: info.name,
      url: info.logo,
      type: 'crypto',
      mode,
    })));
  }

  // Entreprises
  if (category === 'all' || category === 'companies') {
    let companies = Object.entries(COMPANY_LOGOS);

    // Filtrer par secteur
    if (sector !== 'all') {
      const sectorMap: Record<string, string> = {
        technology: 'Technology',
        finance: 'Finance',
        healthcare: 'Healthcare',
        consumer: 'Consumer',
        energy: 'Energy',
        automotive: 'Automotive',
        aerospace: 'Aerospace',
        telecom: 'Telecom',
        retail: 'Retail',
        entertainment: 'Entertainment',
      };
      const targetSector = sectorMap[sector];
      companies = companies.filter(([_, info]) => info.sector === targetSector);
    }

    // Recherche
    if (search) {
      const searchLower = search.toLowerCase();
      companies = companies.filter(([symbol, info]) =>
        symbol.toLowerCase().includes(searchLower) ||
        info.name.toLowerCase().includes(searchLower)
      );
    }

    results.push(...companies.map(([symbol, info]) => ({
      symbol,
      name: info.name,
      url: info.logo,
      type: 'company',
      mode,
      sector: info.sector,
    })));
  }

  // Services
  if (category === 'all' || category === 'services') {
    let services = Object.entries(MISC_LOGOS);

    // Filtrer par sous-catégorie
    if (subcategory !== 'all') {
      const categoryMap: Record<string, string> = {
        social: 'Social',
        cloud: 'Cloud',
        exchange: 'Exchange',
        broker: 'Broker',
        index: 'Index',
        bank: 'Bank',
        payment: 'Payment',
        news: 'News',
        ai: 'AI',
        dev: 'Dev',
      };
      const targetCategory = categoryMap[subcategory];
      services = services.filter(([_, info]) => info.category === targetCategory);
    }

    // Recherche
    if (search) {
      const searchLower = search.toLowerCase();
      services = services.filter(([key, info]) =>
        key.toLowerCase().includes(searchLower) ||
        info.name.toLowerCase().includes(searchLower)
      );
    }

    results.push(...services.map(([symbol, info]) => ({
      symbol,
      name: info.name,
      url: info.logo,
      type: info.category.toLowerCase(),
      mode,
    })));
  }

  // === NOUVELLES CATÉGORIES ===

  // Pokémon (NOUVEAU)
  if (category === 'all' || category === 'pokemon') {
    let pokemons = Object.entries(POKEMON_LOGOS);

    // Filtrer par sous-catégorie
    if (subcategory !== 'all') {
      const categoryMap: Record<string, string> = {
        type: 'Type',
        pokemon: 'Pokemon',
        item: 'Item',
        service: 'Service',
      };
      const targetCategory = categoryMap[subcategory];
      if (targetCategory) {
        pokemons = pokemons.filter(([_, info]) => info.category === targetCategory);
      }
    }

    // Recherche
    if (search) {
      const searchLower = search.toLowerCase();
      pokemons = pokemons.filter(([key, info]) =>
        key.toLowerCase().includes(searchLower) ||
        info.name.toLowerCase().includes(searchLower)
      );
    }

    results.push(...pokemons.map(([symbol, info]) => ({
      symbol,
      name: info.name,
      url: info.logo,
      type: 'pokemon',
      mode,
    })));
  }

  // Anime (NOUVEAU)
  if (category === 'all' || category === 'anime') {
    let animes = Object.entries(ANIME_LOGOS);

    // Filtrer par sous-catégorie
    if (subcategory !== 'all') {
      const categoryMap: Record<string, string> = {
        service: 'Service',
        streaming: 'Streaming',
        studio: 'Studio',
        genre: 'Genre',
      };
      const targetCategory = categoryMap[subcategory];
      if (targetCategory) {
        animes = animes.filter(([_, info]) => info.category === targetCategory);
      }
    }

    // Recherche
    if (search) {
      const searchLower = search.toLowerCase();
      animes = animes.filter(([key, info]) =>
        key.toLowerCase().includes(searchLower) ||
        info.name.toLowerCase().includes(searchLower)
      );
    }

    results.push(...animes.map(([symbol, info]) => ({
      symbol,
      name: info.name,
      url: info.logo,
      type: 'anime',
      mode,
    })));
  }

  // Steam (NOUVEAU)
  if (category === 'all' || category === 'steam') {
    let steamItems = Object.entries(STEAM_LOGOS);

    // Filtrer par sous-catégorie
    if (subcategory !== 'all') {
      const categoryMap: Record<string, string> = {
        platform: 'Platform',
        game: 'Game',
        hardware: 'Hardware',
        company: 'Company',
        event: 'Event',
        feature: 'Feature',
      };
      const targetCategory = categoryMap[subcategory];
      if (targetCategory) {
        steamItems = steamItems.filter(([_, info]) => info.category === targetCategory);
      }
    }

    // Recherche
    if (search) {
      const searchLower = search.toLowerCase();
      steamItems = steamItems.filter(([key, info]) =>
        key.toLowerCase().includes(searchLower) ||
        info.name.toLowerCase().includes(searchLower)
      );
    }

    results.push(...steamItems.map(([symbol, info]) => ({
      symbol,
      name: info.name,
      url: info.logo,
      type: 'steam',
      mode,
    })));
  }

  // DevOps (NOUVEAU)
  if (category === 'all' || category === 'devops') {
    let devopsItems = Object.entries(DEVOPS_LOGOS);

    // Filtrer par sous-catégorie
    if (subcategory !== 'all') {
      const categoryMap: Record<string, string> = {
        cloud: 'Cloud',
        container: 'Container',
        iac: 'IaC',
        cicd: 'CI/CD',
        monitoring: 'Monitoring',
        logging: 'Logging',
      };
      const targetCategory = categoryMap[subcategory];
      if (targetCategory) {
        devopsItems = devopsItems.filter(([_, info]) => info.category === targetCategory);
      }
    }

    // Recherche
    if (search) {
      const searchLower = search.toLowerCase();
      devopsItems = devopsItems.filter(([key, info]) =>
        key.toLowerCase().includes(searchLower) ||
        info.name.toLowerCase().includes(searchLower)
      );
    }

    results.push(...devopsItems.map(([symbol, info]) => ({
      symbol,
      name: info.name,
      url: info.logo,
      type: 'devops',
      mode,
    })));
  }

  // ESport (NOUVEAU)
  if (category === 'all' || category === 'esport') {
    let esportItems = Object.entries(ESPORT_LOGOS);

    // Filtrer par sous-catégorie
    if (subcategory !== 'all') {
      const categoryMap: Record<string, string> = {
        organizer: 'Organizer',
        platform: 'Platform',
        game: 'Game',
        team: 'Team',
        streaming: 'Streaming',
      };
      const targetCategory = categoryMap[subcategory];
      if (targetCategory) {
        esportItems = esportItems.filter(([_, info]) => info.category === targetCategory);
      }
    }

    // Recherche
    if (search) {
      const searchLower = search.toLowerCase();
      esportItems = esportItems.filter(([key, info]) =>
        key.toLowerCase().includes(searchLower) ||
        info.name.toLowerCase().includes(searchLower)
      );
    }

    results.push(...esportItems.map(([symbol, info]) => ({
      symbol,
      name: info.name,
      url: info.logo,
      type: 'esport',
      mode,
    })));
  }

  // Video Games (NOUVEAU)
  if (category === 'all' || category === 'videogame') {
    let games = Object.entries(VIDEOGAME_LOGOS);

    // Recherche
    if (search) {
      const searchLower = search.toLowerCase();
      games = games.filter(([key, info]) =>
        key.toLowerCase().includes(searchLower) ||
        info.name.toLowerCase().includes(searchLower)
      );
    }

    results.push(...games.map(([symbol, info]) => ({
      symbol,
      name: info.name,
      url: info.logo,
      type: 'videogame',
      mode,
    })));
  }

  // Party/Célébrations (NOUVEAU)
  if (category === 'all' || category === 'party') {
    let parties = Object.entries(PARTY_LOGOS);

    // Recherche
    if (search) {
      const searchLower = search.toLowerCase();
      parties = parties.filter(([key, info]) =>
        key.toLowerCase().includes(searchLower) ||
        info.name.toLowerCase().includes(searchLower)
      );
    }

    results.push(...parties.map(([symbol, info]) => ({
      symbol,
      name: info.name,
      url: info.logo,
      type: 'party',
      mode,
    })));
  }

  // SimpleIcons (NOUVEAU)
  if (category === 'all' || category === 'simpleicons') {
    let icons = Object.entries(SIMPLEICONS_LOGOS);

    // Recherche
    if (search) {
      const searchLower = search.toLowerCase();
      icons = icons.filter(([key, info]) =>
        key.toLowerCase().includes(searchLower) ||
        info.name.toLowerCase().includes(searchLower)
      );
    }

    results.push(...icons.map(([symbol, info]) => ({
      symbol,
      name: info.name,
      url: info.logo,
      type: 'simpleicons',
      mode,
    })));
  }

  // Thèmes (NOUVEAU)
  if (category === 'all' || category === 'themes') {
    let themes = Object.entries(THEME_IMAGES);

    // Recherche
    if (search) {
      const searchLower = search.toLowerCase();
      themes = themes.filter(([key, info]) =>
        key.toLowerCase().includes(searchLower) ||
        info.name.toLowerCase().includes(searchLower)
      );
    }

    results.push(...themes.map(([symbol, info]) => ({
      symbol,
      name: info.name,
      url: info.logo,
      type: 'theme',
      mode,
    })));
  }

  // === VRAIES IMAGES UNSPLASH ===
  // Anime Images - Style japonais, cyberpunk, action
  if (category === 'all' || category === 'anime_images') {
    let animeImages = Object.entries(ANIME_IMAGES);

    // Recherche
    if (search) {
      const searchLower = search.toLowerCase();
      animeImages = animeImages.filter(([key, info]) =>
        key.toLowerCase().includes(searchLower) ||
        info.name.toLowerCase().includes(searchLower) ||
        info.anime?.toLowerCase().includes(searchLower)
      );
    }

    results.push(...animeImages.map(([symbol, info]) => ({
      symbol,
      name: info.name,
      url: info.image,
      type: 'anime_image',
      mode: 'photo',
      source: 'Unsplash',
    })));
  }

  // Cyberpunk Images - Cities, Characters, Abstract
  if (category === 'all' || category === 'cyberpunk') {
    let cyberpunkImages = Object.entries(CYBERPUNK_IMAGES);

    // Recherche
    if (search) {
      const searchLower = search.toLowerCase();
      cyberpunkImages = cyberpunkImages.filter(([key, info]) =>
        key.toLowerCase().includes(searchLower) ||
        info.name.toLowerCase().includes(searchLower) ||
        info.category?.toLowerCase().includes(searchLower)
      );
    }

    results.push(...cyberpunkImages.map(([symbol, info]) => ({
      symbol,
      name: info.name,
      url: info.image,
      type: 'cyberpunk_image',
      mode: 'photo',
      source: 'Unsplash',
    })));
  }

  // DevOps Images - Infrastructure, Cloud, Coding
  if (category === 'all' || category === 'devops_images') {
    let devopsImages = Object.entries(DEVOPS_IMAGES);

    // Recherche
    if (search) {
      const searchLower = search.toLowerCase();
      devopsImages = devopsImages.filter(([key, info]) =>
        key.toLowerCase().includes(searchLower) ||
        info.name.toLowerCase().includes(searchLower) ||
        info.category?.toLowerCase().includes(searchLower)
      );
    }

    results.push(...devopsImages.map(([symbol, info]) => ({
      symbol,
      name: info.name,
      url: info.image,
      type: 'devops_image',
      mode: 'photo',
      source: 'Unsplash',
    })));
  }

  // Nature Images - Landscapes
  if (category === 'all' || category === 'nature') {
    let natureImages = Object.entries(NATURE_IMAGES);

    // Recherche
    if (search) {
      const searchLower = search.toLowerCase();
      natureImages = natureImages.filter(([key, info]) =>
        key.toLowerCase().includes(searchLower) ||
        info.name.toLowerCase().includes(searchLower)
      );
    }

    results.push(...natureImages.map(([symbol, info]) => ({
      symbol,
      name: info.name,
      url: info.image,
      type: 'nature_image',
      mode: 'photo',
      source: 'Unsplash',
    })));
  }

  // ESport Images - Arena, Setup, Gaming
  if (category === 'all' || category === 'esport_images') {
    let esportImages = Object.entries(ESPORT_IMAGES);

    // Recherche
    if (search) {
      const searchLower = search.toLowerCase();
      esportImages = esportImages.filter(([key, info]) =>
        key.toLowerCase().includes(searchLower) ||
        info.name.toLowerCase().includes(searchLower) ||
        info.category?.toLowerCase().includes(searchLower)
      );
    }

    results.push(...esportImages.map(([symbol, info]) => ({
      symbol,
      name: info.name,
      url: info.image,
      type: 'esport_image',
      mode: 'photo',
      source: 'Unsplash',
    })));
  }

  // Real Images - All Unsplash images combined
  if (category === 'real_images') {
    let realImages = Object.entries(REAL_IMAGES);

    // Recherche
    if (search) {
      const searchLower = search.toLowerCase();
      realImages = realImages.filter(([key, info]) =>
        key.toLowerCase().includes(searchLower) ||
        info.name.toLowerCase().includes(searchLower)
      );
    }

    results.push(...realImages.map(([symbol, info]) => ({
      symbol,
      name: info.name,
      url: info.image,
      type: 'real_image',
      mode: 'photo',
      source: 'Unsplash',
    })));
  }

  return results.slice(0, limit);
}

function formatResults(results: Array<{ symbol: string; name: string; url: string; type: string; mode: string; sector?: string }>, format: string, singleSymbol: string | null, imageType: 'logo' | 'photo' | 'gif' = 'logo'): string {
  // Si un seul symbole demandé et trouvé, retourner uniquement l'URL
  if (singleSymbol && results.length === 1) {
    return results[0].url;
  }

  switch (format) {
    case 'urls':
      return results.map(r => r.url).join('\n');

    case 'compact':
      return results.map(r => `${r.symbol}: ${r.url}`).join('\n');

    case 'json':
      return JSON.stringify(results, null, 2);

    case 'discord':
      return results.map(r => `${r.symbol}: ${r.url}`).join('\n');

    case 'list':
    default:
      const lines = results.map(r => {
        const sector = r.sector ? ` (${r.sector})` : '';
        return `• **${r.symbol}** - ${r.name}${sector}\n  ${r.url}`;
      });
      let typeLabel: string;
      if (imageType === 'photo') {
        typeLabel = 'photo(s) immersive(s)';
      } else if (imageType === 'gif') {
        typeLabel = 'GIF(s) animé(s)';
      } else {
        typeLabel = 'logo(s)';
      }
      return `🖼️ **${results.length} ${typeLabel} trouvé(s):**\n\n${lines.join('\n\n')}`;
  }
}

// ============================================================================
// ENREGISTREMENT DE L'OUTIL
// ============================================================================

export function registerListImagesTools(server: FastMCP): void {
  server.addTool({
    name: 'list_images',
    description: `🖼️ Liste/Récupère les URLs d'images (logos, photos HD, ou images stylisées) pour crypto, entreprises, services.
    SOURCES GRATUITES (sans API key):
    • Logos: Coingecko (crypto), SimpleIcons (entreprises), base locale (services)
    • Photos: Picsum Photos (images HD aléatoires avec seed)
    • GIFs: Picsum avec blur (effets stylisés)

    USAGE:
    • Un symbole: list_images({symbols: "BTC"}) → retourne le logo
    • Photo HD: list_images({symbols: "AAPL", mode: "photo"}) → grande photo Picsum
    • Image stylisée: list_images({symbols: "BTC", mode: "gif"}) → image avec blur
    • Liste photos: list_images({category: "crypto", mode: "photo", limit: 10}) → 10 photos
    • Format Discord: list_images({symbols: "BTC", format: "discord"}) → optimisé pour Discord
    • Recherche: list_images({search: "bitcoin"}) → recherche par nom`,
    parameters: ListImagesSchema,
    execute: async (args) => {
      try {
        // Récupérer les paramètres
        const mode = args.mode || 'photo';
        const limit = args.limit || 20;

        // Normaliser symbols en tableau
        let symbols: string[] = [];
        if (args.symbols) {
          if (typeof args.symbols === 'string') {
            symbols = [args.symbols];
          } else {
            symbols = args.symbols;
          }
        }

        // ============================================================================
        // MODE LOGO: Utilise la base de données statique
        // ============================================================================
        if (mode === 'logo') {
          // Si des symboles spécifiques sont demandés
          if (symbols.length > 0) {
            const results = symbols.map(symbol => {
              const result = getImageUrl(symbol, 'logo');
              if (result) {
                return {
                  symbol: symbol.toUpperCase(),
                  name: result.name,
                  url: result.url,
                  type: result.type,
                  mode: 'logo',
                };
              }
              return null;
            }).filter(r => r !== null);

            if (results.length === 0) {
              return `❌ Aucun logo trouvé pour: ${symbols.join(', ')}`;
            }

            const singleSymbol = symbols.length === 1 ? symbols[0] : null;
            return formatResults(results as any, args.format || 'list', singleSymbol, 'logo');
          }

          // Lister tous les logos selon les filtres
          const results = getAllImages(
            args.category || 'all',
            args.sector || 'all',
            args.subcategory || 'all',
            args.search || '',
            args.limit || 50,
            'logo'
          );

          if (results.length === 0) {
            return `❌ Aucun logo trouvé avec ces critères`;
          }

          return formatResults(results, args.format || 'list', null, 'logo');
        }

        // ============================================================================
        // MODE PHOTO: Picsum Photos (gratuit, sans API key)
        // ============================================================================
        if (mode === 'photo') {
          let results: Array<{ symbol: string; name: string; url: string; type: string; mode: string }> = [];
          const seedBase = Date.now(); // Seed pour variation

          // Si des symboles spécifiques sont demandés
          if (symbols.length > 0) {
            for (let i = 0; i < symbols.length; i++) {
              const symbol = symbols[i];
              const upperSymbol = symbol.toUpperCase();

              // Chercher dans le mapping intelligent
              const config = SYMBOL_TO_QUERY[upperSymbol];
              const width = config?.width || 800;
              const height = config?.height || 400;
              const blur = config?.blur;
              const grayscale = config?.grayscale;

              // Construire l'URL Picsum
              let picsumUrl = `${PICSUM_BASE_URL}/seed/${upperSymbol}${seedBase}/${width}/${height}`;
              const params: string[] = [];
              if (grayscale) params.push('grayscale');
              if (blur) params.push(`blur=${blur}`);
              if (params.length > 0) picsumUrl += '?' + params.join('&');

              results.push({
                symbol: upperSymbol,
                name: `${symbol} photo`,
                url: picsumUrl,
                type: 'photo',
                mode: 'photo',
              });
            }

            const singleSymbol = symbols.length === 1 ? symbols[0] : null;
            return formatResults(results, args.format || 'list', singleSymbol, 'photo');
          }

          // Si pas de symboles spécifiques, utiliser catégorie
          type PicsumConfig = { width: number; height: number; blur?: number; grayscale?: boolean };
          const defaultConfig: PicsumConfig = { width: 800, height: 400 };
          let config: PicsumConfig = defaultConfig;
          if (args.category && args.category !== 'all') {
            config = CATEGORY_TO_QUERY[args.category] || defaultConfig;
          }

          // Générer plusieurs photos avec des seeds différents
          for (let i = 0; i < limit; i++) {
            const seed = `${args.category || 'all'}_${seedBase + i}`;
            let picsumUrl = `${PICSUM_BASE_URL}/seed/${seed}/${config.width}/${config.height}`;
            const params: string[] = [];
            if (config.grayscale) params.push('grayscale');
            if (config.blur) params.push(`blur=${config.blur}`);
            if (params.length > 0) picsumUrl += '?' + params.join('&');

            results.push({
              symbol: `PHOTO_${i + 1}`,
              name: `Photo ${i + 1}`,
              url: picsumUrl,
              type: 'photo',
              mode: 'photo',
            });
          }

          return formatResults(results, args.format || 'list', null, 'photo');
        }

        // ============================================================================
        // MODE GIF: Picsum avec blur (simulation d'effets animés)
        // ============================================================================
        if (mode === 'gif') {
          let gifResults: Array<{ symbol: string; name: string; url: string; type: string; mode: string }> = [];
          const seedBase = Date.now(); // Seed pour variation

          // Si des symboles spécifiques sont demandés
          if (symbols.length > 0) {
            for (let i = 0; i < symbols.length; i++) {
              const symbol = symbols[i];
              const upperSymbol = symbol.toUpperCase();

              // Chercher dans le mapping GIF intelligent
              const config = GIF_TO_QUERY[upperSymbol] || { width: 600, height: 300, blur: 2 };
              const seed = `${upperSymbol}_gif_${seedBase}`;

              // Construire l'URL Picsum avec blur (simulation d'effet GIF)
              const picsumUrl = `${PICSUM_BASE_URL}/seed/${seed}/${config.width}/${config.height}?blur=${config.blur}`;

              gifResults.push({
                symbol: upperSymbol,
                name: `${symbol} image`,
                url: picsumUrl,
                type: 'gif',
                mode: 'gif',
              });
            }

            const singleSymbol = symbols.length === 1 ? symbols[0] : null;
            return formatResults(gifResults, args.format || 'list', singleSymbol, 'gif');
          }

          // Si pas de symboles spécifiques, utiliser catégorie
          let config = { width: 600, height: 300, blur: 2 };
          if (args.category && args.category !== 'all') {
            config = CATEGORY_TO_GIF[args.category] || config;
          }

          // Générer plusieurs images avec des seeds différents
          for (let i = 0; i < limit; i++) {
            const seed = `${args.category || 'gif'}_${seedBase + i}`;
            const picsumUrl = `${PICSUM_BASE_URL}/seed/${seed}/${config.width}/${config.height}?blur=${config.blur}`;

            gifResults.push({
              symbol: `GIF_${i + 1}`,
              name: `Image ${i + 1}`,
              url: picsumUrl,
              type: 'gif',
              mode: 'gif',
            });
          }

          return formatResults(gifResults, args.format || 'list', null, 'gif');
        }

        // Mode inconnu
        return `❌ Mode inconnu: ${mode}. Utilisez 'logo', 'photo' ou 'gif'.`;

      } catch (error: any) {
        return `❌ Erreur: ${error.message}`;
      }
    },
  });
}
