// ============================================================================
// UTILITAIRES POUR LES LOGOS (CRYPTO, ENTREPRISES, SERVICES)
// ============================================================================

import { CRYPTO_LOGOS, COMPANY_LOGOS, MISC_LOGOS } from '../data/logos.js';

// Fonction universelle pour obtenir un logo
export function getUniversalLogo(symbol: string): { name: string; logo: string; type: string } | null {
  const upperSymbol = symbol.toUpperCase().replace(/[-_\s]/g, '');

  // Chercher dans les cryptos
  if (CRYPTO_LOGOS[upperSymbol]) {
    const crypto = CRYPTO_LOGOS[upperSymbol];
    return { name: crypto.name, logo: crypto.logo, type: 'crypto' };
  }

  // Chercher dans les entreprises
  if (COMPANY_LOGOS[upperSymbol]) {
    const company = COMPANY_LOGOS[upperSymbol];
    return { name: company.name, logo: company.logo, type: 'company' };
  }

  // Chercher dans les logos divers
  if (MISC_LOGOS[upperSymbol]) {
    const misc = MISC_LOGOS[upperSymbol];
    return { name: misc.name, logo: misc.logo, type: misc.category.toLowerCase() };
  }

  return null;
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
export function getCryptoInfo(symbol: string): { name: string; symbol: string; logo: string } | null {
  const upperSymbol = symbol.toUpperCase().replace('-', '').replace('USDT', '').replace('USD', '').replace('PERP', '').replace('BMEX', '').replace('CME', '');
  return CRYPTO_LOGOS[upperSymbol] || null;
}

// Fonction pour construire une URL de logo personnalisée
export function buildCryptoLogoUrl(name: string, symbol: string, format: 'png' | 'svg' = 'png'): string {
  return `https://cryptologos.cc/logos/${name.toLowerCase()}-${symbol.toLowerCase()}-logo.${format}`;
}
