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
} from '../data/logos.js';

// Vraies images Unsplash - Collection complète
import {
  ABSTRACT_IMAGES,
  ANIME_IMAGES,
  ANIMALS_IMAGES,
  ARCHITECTURE_IMAGES,
  ART_IMAGES,
  BUSINESS_IMAGES,
  CYBERPUNK_IMAGES,
  DEVOPS_IMAGES,
  ESPORT_IMAGES,
  FASHION_IMAGES,
  FOOD_IMAGES,
  NATURE_IMAGES,
  NEON_IMAGES,
  NIGHT_IMAGES,
  PEOPLE_IMAGES,
  SPACE_IMAGES,
  SPORTS_IMAGES,
  TECHNOLOGY_IMAGES,
  TRAVEL_IMAGES,
  VINTAGE_IMAGES,
  WALLPAPER_IMAGES,
  TECH_AI_IMAGES,
  DEVELOPMENT_IMAGES,
  SCIENCE_IMAGES,
  FINANCE_IMAGES,
  GAMING_IMAGES,
  LIFESTYLE_IMAGES,
  REAL_IMAGES,
} from '../data/realImages.js';

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
    // NOUVELLES CATÉGORIES LOGOS
    'pokemon', 'anime', 'steam', 'devops', 'esport', 'videogame', 'party', 'simpleicons', 'themes',
    // VRAIES IMAGES UNSPLASH - Collection complète (photos HD, wallpapers)
    // Abstrait & Art
    'abstract', 'art',
    // Culture & Style de vie
    'anime_images', 'animals', 'architecture', 'business', 'fashion', 'people', 'food', 'travel',
    // Tech & Cyberpunk
    'cyberpunk', 'devops_images', 'technology', 'neon', 'night',
    // Nature & Espaces
    'nature', 'space', 'sports',
    // Gaming
    'esport_images', 'gaming',
    // Vintage & Wallpaper
    'vintage', 'wallpaper',
    // NOUVELLES CATÉGORIES (2024)
    // Tech AI & Development
    'tech_ai', 'development',
    // Sciences
    'science',
    // Finance & Business
    'finance_images',
    // Lifestyle
    'lifestyle',
    // Toutes les images
    'real_images'
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
  mode: z.enum(['auto', 'logo', 'photo', 'gif', 'real']).optional().default('auto').describe('auto = détecte automatiquement (recommandé), logo = logos classiques (base locale), photo = images HD (Picsum), gif = images stylisées avec blur (Picsum), real = vraies images Unsplash thématiques (cyberpunk, anime, etc.)')
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

  // === NOUVELLES COLLECTIONS UNSPLASH ===

  // Abstract Images - Forms, Colors, Textures
  if (category === 'all' || category === 'abstract') {
    let abstractImages = Object.entries(ABSTRACT_IMAGES);

    if (search) {
      const searchLower = search.toLowerCase();
      abstractImages = abstractImages.filter(([key, info]) =>
        key.toLowerCase().includes(searchLower) ||
        info.name.toLowerCase().includes(searchLower) ||
        info.category?.toLowerCase().includes(searchLower)
      );
    }

    results.push(...abstractImages.map(([symbol, info]) => ({
      symbol,
      name: info.name,
      url: info.image,
      type: 'abstract_image',
      mode: 'photo',
      source: 'Unsplash',
    })));
  }

  // Animals Images - Wildlife, Pets, Nature
  if (category === 'all' || category === 'animals') {
    let animalsImages = Object.entries(ANIMALS_IMAGES);

    if (search) {
      const searchLower = search.toLowerCase();
      animalsImages = animalsImages.filter(([key, info]) =>
        key.toLowerCase().includes(searchLower) ||
        info.name.toLowerCase().includes(searchLower) ||
        info.category?.toLowerCase().includes(searchLower)
      );
    }

    results.push(...animalsImages.map(([symbol, info]) => ({
      symbol,
      name: info.name,
      url: info.image,
      type: 'animal_image',
      mode: 'photo',
      source: 'Unsplash',
    })));
  }

  // Architecture Images - Buildings, Cities, Structures
  if (category === 'all' || category === 'architecture') {
    let architectureImages = Object.entries(ARCHITECTURE_IMAGES);

    if (search) {
      const searchLower = search.toLowerCase();
      architectureImages = architectureImages.filter(([key, info]) =>
        key.toLowerCase().includes(searchLower) ||
        info.name.toLowerCase().includes(searchLower) ||
        info.category?.toLowerCase().includes(searchLower)
      );
    }

    results.push(...architectureImages.map(([symbol, info]) => ({
      symbol,
      name: info.name,
      url: info.image,
      type: 'architecture_image',
      mode: 'photo',
      source: 'Unsplash',
    })));
  }

  // Art Images - Paintings, Sculptures, Creative
  if (category === 'all' || category === 'art') {
    let artImages = Object.entries(ART_IMAGES);

    if (search) {
      const searchLower = search.toLowerCase();
      artImages = artImages.filter(([key, info]) =>
        key.toLowerCase().includes(searchLower) ||
        info.name.toLowerCase().includes(searchLower) ||
        info.category?.toLowerCase().includes(searchLower)
      );
    }

    results.push(...artImages.map(([symbol, info]) => ({
      symbol,
      name: info.name,
      url: info.image,
      type: 'art_image',
      mode: 'photo',
      source: 'Unsplash',
    })));
  }

  // Business Images - Office, Meeting, Startup
  if (category === 'all' || category === 'business') {
    let businessImages = Object.entries(BUSINESS_IMAGES);

    if (search) {
      const searchLower = search.toLowerCase();
      businessImages = businessImages.filter(([key, info]) =>
        key.toLowerCase().includes(searchLower) ||
        info.name.toLowerCase().includes(searchLower) ||
        info.category?.toLowerCase().includes(searchLower)
      );
    }

    results.push(...businessImages.map(([symbol, info]) => ({
      symbol,
      name: info.name,
      url: info.image,
      type: 'business_image',
      mode: 'photo',
      source: 'Unsplash',
    })));
  }

  // Fashion Images - Style, Clothing, Trends
  if (category === 'all' || category === 'fashion') {
    let fashionImages = Object.entries(FASHION_IMAGES);

    if (search) {
      const searchLower = search.toLowerCase();
      fashionImages = fashionImages.filter(([key, info]) =>
        key.toLowerCase().includes(searchLower) ||
        info.name.toLowerCase().includes(searchLower) ||
        info.category?.toLowerCase().includes(searchLower)
      );
    }

    results.push(...fashionImages.map(([symbol, info]) => ({
      symbol,
      name: info.name,
      url: info.image,
      type: 'fashion_image',
      mode: 'photo',
      source: 'Unsplash',
    })));
  }

  // Food Images - Cuisine, Dishes, Drinks
  if (category === 'all' || category === 'food') {
    let foodImages = Object.entries(FOOD_IMAGES);

    if (search) {
      const searchLower = search.toLowerCase();
      foodImages = foodImages.filter(([key, info]) =>
        key.toLowerCase().includes(searchLower) ||
        info.name.toLowerCase().includes(searchLower) ||
        info.category?.toLowerCase().includes(searchLower)
      );
    }

    results.push(...foodImages.map(([symbol, info]) => ({
      symbol,
      name: info.name,
      url: info.image,
      type: 'food_image',
      mode: 'photo',
      source: 'Unsplash',
    })));
  }

  // Neon Images - Lights, Signs, Night City
  if (category === 'all' || category === 'neon') {
    let neonImages = Object.entries(NEON_IMAGES);

    if (search) {
      const searchLower = search.toLowerCase();
      neonImages = neonImages.filter(([key, info]) =>
        key.toLowerCase().includes(searchLower) ||
        info.name.toLowerCase().includes(searchLower) ||
        info.category?.toLowerCase().includes(searchLower)
      );
    }

    results.push(...neonImages.map(([symbol, info]) => ({
      symbol,
      name: info.name,
      url: info.image,
      type: 'neon_image',
      mode: 'photo',
      source: 'Unsplash',
    })));
  }

  // Night Images - Dark, Evening, Moon
  if (category === 'all' || category === 'night') {
    let nightImages = Object.entries(NIGHT_IMAGES);

    if (search) {
      const searchLower = search.toLowerCase();
      nightImages = nightImages.filter(([key, info]) =>
        key.toLowerCase().includes(searchLower) ||
        info.name.toLowerCase().includes(searchLower) ||
        info.category?.toLowerCase().includes(searchLower)
      );
    }

    results.push(...nightImages.map(([symbol, info]) => ({
      symbol,
      name: info.name,
      url: info.image,
      type: 'night_image',
      mode: 'photo',
      source: 'Unsplash',
    })));
  }

  // People Images - Portrait, Lifestyle, Culture
  if (category === 'all' || category === 'people') {
    let peopleImages = Object.entries(PEOPLE_IMAGES);

    if (search) {
      const searchLower = search.toLowerCase();
      peopleImages = peopleImages.filter(([key, info]) =>
        key.toLowerCase().includes(searchLower) ||
        info.name.toLowerCase().includes(searchLower) ||
        info.category?.toLowerCase().includes(searchLower)
      );
    }

    results.push(...peopleImages.map(([symbol, info]) => ({
      symbol,
      name: info.name,
      url: info.image,
      type: 'people_image',
      mode: 'photo',
      source: 'Unsplash',
    })));
  }

  // Space Images - Universe, Planets, Cosmos
  if (category === 'all' || category === 'space') {
    let spaceImages = Object.entries(SPACE_IMAGES);

    if (search) {
      const searchLower = search.toLowerCase();
      spaceImages = spaceImages.filter(([key, info]) =>
        key.toLowerCase().includes(searchLower) ||
        info.name.toLowerCase().includes(searchLower) ||
        info.category?.toLowerCase().includes(searchLower)
      );
    }

    results.push(...spaceImages.map(([symbol, info]) => ({
      symbol,
      name: info.name,
      url: info.image,
      type: 'space_image',
      mode: 'photo',
      source: 'Unsplash',
    })));
  }

  // Sports Images - Competition, Action, Fitness
  if (category === 'all' || category === 'sports') {
    let sportsImages = Object.entries(SPORTS_IMAGES);

    if (search) {
      const searchLower = search.toLowerCase();
      sportsImages = sportsImages.filter(([key, info]) =>
        key.toLowerCase().includes(searchLower) ||
        info.name.toLowerCase().includes(searchLower) ||
        info.category?.toLowerCase().includes(searchLower)
      );
    }

    results.push(...sportsImages.map(([symbol, info]) => ({
      symbol,
      name: info.name,
      url: info.image,
      type: 'sport_image',
      mode: 'photo',
      source: 'Unsplash',
    })));
  }

  // Technology Images - Innovation, Digital, Modern
  if (category === 'all' || category === 'technology') {
    let techImages = Object.entries(TECHNOLOGY_IMAGES);

    if (search) {
      const searchLower = search.toLowerCase();
      techImages = techImages.filter(([key, info]) =>
        key.toLowerCase().includes(searchLower) ||
        info.name.toLowerCase().includes(searchLower) ||
        info.category?.toLowerCase().includes(searchLower)
      );
    }

    results.push(...techImages.map(([symbol, info]) => ({
      symbol,
      name: info.name,
      url: info.image,
      type: 'technology_image',
      mode: 'photo',
      source: 'Unsplash',
    })));
  }

  // Travel Images - Adventure, Places, Culture
  if (category === 'all' || category === 'travel') {
    let travelImages = Object.entries(TRAVEL_IMAGES);

    if (search) {
      const searchLower = search.toLowerCase();
      travelImages = travelImages.filter(([key, info]) =>
        key.toLowerCase().includes(searchLower) ||
        info.name.toLowerCase().includes(searchLower) ||
        info.category?.toLowerCase().includes(searchLower)
      );
    }

    results.push(...travelImages.map(([symbol, info]) => ({
      symbol,
      name: info.name,
      url: info.image,
      type: 'travel_image',
      mode: 'photo',
      source: 'Unsplash',
    })));
  }

  // Vintage Images - Retro, Classic, Nostalgia
  if (category === 'all' || category === 'vintage') {
    let vintageImages = Object.entries(VINTAGE_IMAGES);

    if (search) {
      const searchLower = search.toLowerCase();
      vintageImages = vintageImages.filter(([key, info]) =>
        key.toLowerCase().includes(searchLower) ||
        info.name.toLowerCase().includes(searchLower) ||
        info.category?.toLowerCase().includes(searchLower)
      );
    }

    results.push(...vintageImages.map(([symbol, info]) => ({
      symbol,
      name: info.name,
      url: info.image,
      type: 'vintage_image',
      mode: 'photo',
      source: 'Unsplash',
    })));
  }

  // Wallpaper Images - Desktop, Mobile, Background
  if (category === 'all' || category === 'wallpaper') {
    let wallpaperImages = Object.entries(WALLPAPER_IMAGES);

    if (search) {
      const searchLower = search.toLowerCase();
      wallpaperImages = wallpaperImages.filter(([key, info]) =>
        key.toLowerCase().includes(searchLower) ||
        info.name.toLowerCase().includes(searchLower) ||
        info.category?.toLowerCase().includes(searchLower)
      );
    }

    results.push(...wallpaperImages.map(([symbol, info]) => ({
      symbol,
      name: info.name,
      url: info.image,
      type: 'wallpaper_image',
      mode: 'photo',
      source: 'Unsplash',
    })));
  }

  // === NOUVELLES COLLECTIONS 2024 ===

  // Tech AI Images - MCP, Claude Code, N8N, Agent, Gemini, Grok
  if (category === 'all' || category === 'tech_ai') {
    let techAiImages = Object.entries(TECH_AI_IMAGES);

    if (search) {
      const searchLower = search.toLowerCase();
      techAiImages = techAiImages.filter(([key, info]) =>
        key.toLowerCase().includes(searchLower) ||
        info.name.toLowerCase().includes(searchLower) ||
        info.category?.toLowerCase().includes(searchLower)
      );
    }

    results.push(...techAiImages.map(([symbol, info]) => ({
      symbol,
      name: info.name,
      url: info.image,
      type: 'tech_ai_image',
      mode: 'photo',
      source: 'Unsplash',
    })));
  }

  // Development Images - JavaScript, Python, Code, Programming
  if (category === 'all' || category === 'development') {
    let devImages = Object.entries(DEVELOPMENT_IMAGES);

    if (search) {
      const searchLower = search.toLowerCase();
      devImages = devImages.filter(([key, info]) =>
        key.toLowerCase().includes(searchLower) ||
        info.name.toLowerCase().includes(searchLower) ||
        info.category?.toLowerCase().includes(searchLower)
      );
    }

    results.push(...devImages.map(([symbol, info]) => ({
      symbol,
      name: info.name,
      url: info.image,
      type: 'development_image',
      mode: 'photo',
      source: 'Unsplash',
    })));
  }

  // Science Images - Math, Physics, Biology, Neuroscience, Archaeology
  if (category === 'all' || category === 'science') {
    let scienceImages = Object.entries(SCIENCE_IMAGES);

    if (search) {
      const searchLower = search.toLowerCase();
      scienceImages = scienceImages.filter(([key, info]) =>
        key.toLowerCase().includes(searchLower) ||
        info.name.toLowerCase().includes(searchLower) ||
        info.category?.toLowerCase().includes(searchLower)
      );
    }

    results.push(...scienceImages.map(([symbol, info]) => ({
      symbol,
      name: info.name,
      url: info.image,
      type: 'science_image',
      mode: 'photo',
      source: 'Unsplash',
    })));
  }

  // Finance Images - Stock Market, Financial Report, Calendar
  if (category === 'all' || category === 'finance_images') {
    let financeImages = Object.entries(FINANCE_IMAGES);

    if (search) {
      const searchLower = search.toLowerCase();
      financeImages = financeImages.filter(([key, info]) =>
        key.toLowerCase().includes(searchLower) ||
        info.name.toLowerCase().includes(searchLower) ||
        info.category?.toLowerCase().includes(searchLower)
      );
    }

    results.push(...financeImages.map(([symbol, info]) => ({
      symbol,
      name: info.name,
      url: info.image,
      type: 'finance_image',
      mode: 'photo',
      source: 'Unsplash',
    })));
  }

  // Gaming Images - GTA 5, Minecraft, Video Games
  if (category === 'all' || category === 'gaming') {
    let gamingImages = Object.entries(GAMING_IMAGES);

    if (search) {
      const searchLower = search.toLowerCase();
      gamingImages = gamingImages.filter(([key, info]) =>
        key.toLowerCase().includes(searchLower) ||
        info.name.toLowerCase().includes(searchLower) ||
        info.category?.toLowerCase().includes(searchLower)
      );
    }

    results.push(...gamingImages.map(([symbol, info]) => ({
      symbol,
      name: info.name,
      url: info.image,
      type: 'gaming_image',
      mode: 'photo',
      source: 'Unsplash',
    })));
  }

  // Lifestyle Images - Party, Humor, Coffee, Bretzel, etc.
  if (category === 'all' || category === 'lifestyle') {
    let lifestyleImages = Object.entries(LIFESTYLE_IMAGES);

    if (search) {
      const searchLower = search.toLowerCase();
      lifestyleImages = lifestyleImages.filter(([key, info]) =>
        key.toLowerCase().includes(searchLower) ||
        info.name.toLowerCase().includes(searchLower) ||
        info.category?.toLowerCase().includes(searchLower)
      );
    }

    results.push(...lifestyleImages.map(([symbol, info]) => ({
      symbol,
      name: info.name,
      url: info.image,
      type: 'lifestyle_image',
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
    description: `🖼️ Liste/Récupère les URLs d'images pour les embeds Discord

    🎯 MODE AUTO (recommandé): Détecte automatiquement la meilleure source
    • Cyberpunk/Anime/Nature → Vraies photos Unsplash HD thématiques
    • Symboles (BTC, AAPL) → Logos de la base locale
    • Categories classiques → Logos statiques

    📚 SOURCES DISPONIBLES:
    • Logos: Coingecko (crypto), SimpleIcons (entreprises), base locale (services)
    • Photos HD: Unsplash (cyberpunk, anime, nature, esport, devops)
    • Photos aléatoires: Picsum Photos (avec seed pour la reproductibilité)
    • GIFs stylisés: Picsum avec blur (effets visuels)

    💡 EXEMPLES D'USAGE:
    • Mode AUTO (recommandé):
      - list_images({category: "cyberpunk"}) → Vraies photos cyberpunk Unsplash
      - list_images({symbols: "BTC"}) → Logo Bitcoin
      - list_images({category: "crypto", limit: 10}) → Top 10 cryptos

    • Mode REAL (vraies photos thématiques):
      - list_images({category: "cyberpunk", mode: "real"}) → Photos cyberpunk HD
      - list_images({category: "anime_images", mode: "real"}) → Photos anime/style japonais
      - list_images({category: "nature", mode: "real"}) → Photos nature/paysages

    • Mode LOGO (logos statiques):
      - list_images({symbols: "BTC", mode: "logo"}) → Logo Bitcoin Coingecko
      - list_images({symbols: "AAPL", mode: "logo"}) → Logo Apple SimpleIcons

    • Mode PHOTO (photos aléatoires Picsum):
      - list_images({symbols: "BTC", mode: "photo"}) → Photo aléatoire avec seed BTC
      - list_images({category: "crypto", mode: "photo", limit: 5}) → 5 photos aléatoires

    • Mode GIF (effets stylisés):
      - list_images({symbols: "BTC", mode: "gif"}) → Image avec blur (effet GIF)

    🏷️ CATÉGORIES THÉMATIQUES (photos Unsplash HD):
    • cyberpunk - Villes futuristes, néon, cyber-culture
    • anime_images - Style japonais, action, fantasy
    • nature - Paysages, montagnes, forêts
    • esport_images - Gaming, compétition, setup
    • devops_images - Infrastructure, cloud, code
    • real_images - Toutes les photos Unsplash

    🔍 RECHERCHE:
    • list_images({search: "bitcoin"}) → Recherche par nom
    • list_images({category: "cyberpunk", search: "neon"}) → Filtre les résultats`,
    parameters: ListImagesSchema,
    execute: async (args) => {
      try {
        // Récupérer les paramètres
        let mode = args.mode || 'auto';
        const limit = args.limit || 20;
        const category = args.category || 'all';

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
        // CATÉGORIES D'IMAGES THÉMATIQUES UNSPLASH (vraies images HD)
        // Ces catégories utilisent TOUJOURS les vraies images Unsplash
        // ============================================================================
        const THEMATIC_CATEGORIES = [
          // Collections existantes
          'anime_images', 'cyberpunk', 'devops_images', 'nature',
          'esport_images', 'real_images',
          // Nouvelles collections
          'abstract', 'animals', 'architecture', 'art', 'business',
          'fashion', 'food', 'neon', 'night', 'people', 'space',
          'sports', 'technology', 'travel', 'vintage', 'wallpaper',
          // NOUVELLES CATÉGORIES 2024
          'tech_ai', 'development', 'science', 'finance_images',
          'gaming', 'lifestyle'
        ];

        // ============================================================================
        // MODE AUTO: Détection automatique de la meilleure source
        // ============================================================================
        if (mode === 'auto') {
          // Si c'est une catégorie thématique, utiliser les vraies images Unsplash
          if (THEMATIC_CATEGORIES.includes(category)) {
            mode = 'real';
          }
          // Si des symboles spécifiques sont demandés, utiliser les logos
          else if (symbols.length > 0) {
            mode = 'logo';
          }
          // Sinon, utiliser les logos pour les catégories classiques
          else {
            mode = 'logo';
          }
        }

        // ============================================================================
        // MODE REAL: Vraies images Unsplash thématiques (cyberpunk, anime, etc.)
        // ============================================================================
        if (mode === 'real') {
          const results = getAllImages(
            category,
            args.sector || 'all',
            args.subcategory || 'all',
            args.search || '',
            limit,
            'photo'  // Utilise les vraies images Unsplash
          );

          if (results.length === 0) {
            const categoryList = THEMATIC_CATEGORIES.join(', ');
            return `❌ Aucune image trouvée pour la catégorie "${category}"\n\n💡 Catégories disponibles: ${categoryList}`;
          }

          return formatResults(results, args.format || 'list', null, 'photo');
        }

        // ============================================================================
        // MODE LOGO: Utilise la base de données statique (logos)
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
              return `❌ Aucun logo trouvé pour: ${symbols.join(', ')}\n\n💡 Astuce: Utilisez mode: "photo" pour des images aléatoires ou mode: "real" pour des images thématiques.`;
            }

            const singleSymbol = symbols.length === 1 ? symbols[0] : null;
            return formatResults(results as any, args.format || 'list', singleSymbol, 'logo');
          }

          // Lister tous les logos selon les filtres
          const results = getAllImages(
            category,
            args.sector || 'all',
            args.subcategory || 'all',
            args.search || '',
            limit,
            'logo'
          );

          if (results.length === 0) {
            return `❌ Aucun logo trouvé avec ces critères`;
          }

          return formatResults(results, args.format || 'list', null, 'logo');
        }

        // ============================================================================
        // MODE PHOTO: Picsum Photos (gratuit, sans API key) - images aléatoires
        // ============================================================================
        if (mode === 'photo') {
          // AVERTISSEMENT si c'est une catégorie thématique
          if (THEMATIC_CATEGORIES.includes(category)) {
            const catName = category.replace('_', ' ');
            return `⚠️ ATTENTION: Vous utilisez mode: "photo" pour la catégorie "${catName}"\n\n💡 Les images seront ALEATOIRES (Picsum), pas thématiques !\n\n✅ Solution: Utilisez mode: "auto" ou mode: "real" pour les vraies images Unsplash thématiques.`;
          }

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
          if (category && category !== 'all' && CATEGORY_TO_QUERY[category]) {
            config = CATEGORY_TO_QUERY[category] || defaultConfig;
          }

          // Générer plusieurs photos avec des seeds différents
          for (let i = 0; i < limit; i++) {
            const seed = `${category || 'all'}_${seedBase + i}`;
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
          if (category && category !== 'all' && CATEGORY_TO_GIF[category]) {
            config = CATEGORY_TO_GIF[category] || config;
          }

          // Générer plusieurs images avec des seeds différents
          for (let i = 0; i < limit; i++) {
            const seed = `${category || 'gif'}_${seedBase + i}`;
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
        return `❌ Mode inconnu: ${mode}. Utilisez 'auto', 'logo', 'photo', 'real' ou 'gif'.`;

      } catch (error: any) {
        return `❌ Erreur: ${error.message}`;
      }
    },
  });
}
