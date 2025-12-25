// ============================================================================
// UTILITAIRES POUR LES LOGOS (CRYPTO, ENTREPRISES, SERVICES)
// ============================================================================
//
// NOUVELLES CATÉGORIES SUPPORTÉES:
// - POKEMON_LOGOS: Types, sprites, Pokéballs, services Pokémon
// - ANIME_LOGOS: Services anime, streaming, studios, genres
// - STEAM_LOGOS: Plateforme Steam, jeux populaires
// - DEVOPS_LOGOS: Cloud, containers, IaC, CI/CD, monitoring
// - ESPORT_LOGOS: Plateformes, jeux, équipes légendaires
// ============================================================================

import {
  CRYPTO_LOGOS,
  COMPANY_LOGOS,
  MISC_LOGOS,
  POKEMON_LOGOS,
  ANIME_LOGOS,
  STEAM_LOGOS,
  DEVOPS_LOGOS,
  ESPORT_LOGOS,
  VIDEOGAME_LOGOS,
  PARTY_LOGOS,
  SIMPLEICONS_LOGOS,
  THEME_IMAGES,
} from '../data/logos.js';

// Fonction universelle pour obtenir un logo ou une photo
export function getUniversalLogo(symbol: string, mode: 'logo' | 'photo' = 'logo'): { name: string; url: string; type: string; mode: string } | null {
  const upperSymbol = symbol.toUpperCase().replace(/[-_\s]/g, '');

  // Chercher dans les cryptos
  if (CRYPTO_LOGOS[upperSymbol]) {
    const crypto = CRYPTO_LOGOS[upperSymbol];
    // Pour les photos, on utilisera l'Unsplash API au lieu d'un URL statique
    const url = mode === 'photo' ? '' : crypto.logo;
    return { name: crypto.name, url, type: 'crypto', mode };
  }

  // Chercher dans les entreprises
  if (COMPANY_LOGOS[upperSymbol]) {
    const company = COMPANY_LOGOS[upperSymbol];
    const url = mode === 'photo' ? '' : company.logo;
    return { name: company.name, url, type: 'company', mode };
  }

  // Chercher dans les logos divers
  if (MISC_LOGOS[upperSymbol]) {
    const misc = MISC_LOGOS[upperSymbol];
    const url = mode === 'photo' ? '' : misc.logo;
    return { name: misc.name, url, type: misc.category.toLowerCase(), mode };
  }

  // === NOUVELLES CATÉGORIES ===

  // Chercher dans les Pokémon
  if (POKEMON_LOGOS[upperSymbol]) {
    const pokemon = POKEMON_LOGOS[upperSymbol];
    const url = mode === 'photo' ? '' : pokemon.logo;
    return { name: pokemon.name, url, type: 'pokemon', mode };
  }

  // Chercher dans les Animes
  if (ANIME_LOGOS[upperSymbol]) {
    const anime = ANIME_LOGOS[upperSymbol];
    const url = mode === 'photo' ? '' : anime.logo;
    return { name: anime.name, url, type: 'anime', mode };
  }

  // Chercher dans Steam
  if (STEAM_LOGOS[upperSymbol]) {
    const steam = STEAM_LOGOS[upperSymbol];
    const url = mode === 'photo' ? '' : steam.logo;
    return { name: steam.name, url, type: 'steam', mode };
  }

  // Chercher dans DevOps
  if (DEVOPS_LOGOS[upperSymbol]) {
    const devops = DEVOPS_LOGOS[upperSymbol];
    const url = mode === 'photo' ? '' : devops.logo;
    return { name: devops.name, url, type: 'devops', mode };
  }

  // Chercher dans ESport
  if (ESPORT_LOGOS[upperSymbol]) {
    const esport = ESPORT_LOGOS[upperSymbol];
    const url = mode === 'photo' ? '' : esport.logo;
    return { name: esport.name, url, type: 'esport', mode };
  }

  // Chercher dans les jeux vidéo
  if (VIDEOGAME_LOGOS[upperSymbol]) {
    const videogame = VIDEOGAME_LOGOS[upperSymbol];
    const url = mode === 'photo' ? '' : videogame.logo;
    return { name: videogame.name, url, type: 'videogame', mode };
  }

  // Chercher dans les fêtes/célébrations
  if (PARTY_LOGOS[upperSymbol]) {
    const party = PARTY_LOGOS[upperSymbol];
    const url = mode === 'photo' ? '' : party.logo;
    return { name: party.name, url, type: 'party', mode };
  }

  // Chercher dans SimpleIcons
  if (SIMPLEICONS_LOGOS[upperSymbol]) {
    const simpleicon = SIMPLEICONS_LOGOS[upperSymbol];
    const url = mode === 'photo' ? '' : simpleicon.logo;
    return { name: simpleicon.name, url, type: 'simpleicons', mode };
  }

  // Chercher dans les thèmes
  if (THEME_IMAGES[upperSymbol]) {
    const theme = THEME_IMAGES[upperSymbol];
    const url = mode === 'photo' ? '' : theme.logo;
    return { name: theme.name, url, type: 'theme', mode };
  }

  return null;
}

// Fonction pour obtenir uniquement l'URL (compatibilité)
export function getUniversalLogoUrl(symbol: string, mode: 'logo' | 'photo' = 'logo'): string | null {
  const result = getUniversalLogo(symbol, mode);
  return result ? result.url : null;
}

// Fonction pour construire une URL de logo Clearbit dynamique
export function buildClearbitLogoUrl(domain: string, size: number = 128): string {
  return `https://logo.clearbit.com/${domain}?size=${size}`;
}

// Fonction pour obtenir le logo d'une crypto
export function getCryptoLogo(symbol: string): string | null {
  const upperSymbol = symbol.toUpperCase().replace('-', '').replace('USDT', '').replace('USD', '').replace('PERP', '').replace('BMEX', '').replace('CME', '');
  const crypto = CRYPTO_LOGOS[upperSymbol];
  return crypto ? crypto.logo : null;
}

// Fonction pour obtenir toutes les infos d'une crypto
export function getCryptoInfo(symbol: string): { name: string; symbol: string; logo: string; category?: string } | null {
  const upperSymbol = symbol.toUpperCase().replace('-', '').replace('USDT', '').replace('USD', '').replace('PERP', '').replace('BMEX', '').replace('CME', '');
  return CRYPTO_LOGOS[upperSymbol] || null;
}

// Fonction pour construire une URL de logo personnalisée
export function buildCryptoLogoUrl(name: string, symbol: string, format: 'png' | 'svg' = 'png'): string {
  return `https://cryptologos.cc/logos/${name.toLowerCase()}-${symbol.toLowerCase()}-logo.${format}`;
}

// Fonction spécialisée pour Discord embeds (4ème position)
// Retourne automatiquement la photo immersive (Unsplash) si mode=photo, sinon le logo
export function getDiscordEmbedImage(symbol: string, mode: 'logo' | 'photo' = 'photo'): { url: string; mode: 'photo' | 'logo'; name: string } | null {
  const upperSymbol = symbol.toUpperCase().replace(/[-_\s]/g, '');

  // Si mode=photo, retourner null pour indiquer qu'il faut utiliser Unsplash
  if (mode === 'photo') {
    return null;
  }

  // MODE LOGO: utiliser la base de données statique
  // Chercher dans les cryptos
  if (CRYPTO_LOGOS[upperSymbol]) {
    const crypto = CRYPTO_LOGOS[upperSymbol];
    return {
      url: crypto.logo,
      mode: 'logo',
      name: crypto.name
    };
  }

  // Chercher dans les entreprises
  if (COMPANY_LOGOS[upperSymbol]) {
    const company = COMPANY_LOGOS[upperSymbol];
    return {
      url: company.logo,
      mode: 'logo',
      name: company.name
    };
  }

  // Chercher dans les logos divers
  if (MISC_LOGOS[upperSymbol]) {
    const misc = MISC_LOGOS[upperSymbol];
    return {
      url: misc.logo,
      mode: 'logo',
      name: misc.name
    };
  }

  return null;
}
