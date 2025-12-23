/**
 * Outils MCP pour les thèmes emoji (crypto, entreprises, services)
 */

import { z } from 'zod';
import type { FastMCP } from 'fastmcp';
import { CRYPTO_LOGOS, COMPANY_LOGOS, MISC_LOGOS } from '../data/logos.js';

// ============================================================================
// ENREGISTREMENT DES OUTILS
// ============================================================================

export function registerEmojiThemeTools(server: FastMCP) {
  // 1. Emoji Theme Crypto
  server.addTool({
    name: 'emoji_theme_crypto',
    description: '🎨 Afficher un THEME EMOJI des cryptomonnaies (collection décorative avec emojis). Utilise SEULEMENT pour l\'affichage décoratif. Pour afficher une miniature de logo dans un embed, utilise get_thumbnail.',
    parameters: z.object({
      category: z.enum(['all', 'top20', 'defi', 'meme', 'stablecoins', 'exchanges']).optional().default('all').describe('Catégorie de cryptos'),
      search: z.string().optional().describe('Rechercher par symbole ou nom'),
    }),
    execute: async (args) => {
      try {
        let cryptos = Object.entries(CRYPTO_LOGOS);

        // Filtrer par catégorie
        if (args.category !== 'all') {
          const categories: Record<string, string[]> = {
            top20: ['BTC', 'ETH', 'XRP', 'USDT', 'BNB', 'SOL', 'USDC', 'ADA', 'DOGE', 'TRX', 'TON', 'LINK', 'MATIC', 'DOT', 'SHIB', 'AVAX', 'LTC', 'BCH', 'UNI', 'ATOM'],
            defi: ['UNI', 'AAVE', 'MKR', 'COMP', 'SNX', 'CRV', 'SUSHI', 'YFI', 'INCH', 'LDO', 'RPL', 'GRT'],
            meme: ['DOGE', 'SHIB', 'PEPE', 'FLOKI', 'BONK'],
            stablecoins: ['USDT', 'USDC', 'DAI', 'BUSD'],
            exchanges: ['BNB', 'FTT', 'OKB', 'LEO', 'CRO'],
          };
          const categorySymbols = categories[args.category] || [];
          cryptos = cryptos.filter(([symbol]) => categorySymbols.includes(symbol));
        }

        // Recherche
        if (args.search) {
          const searchLower = args.search.toLowerCase();
          cryptos = cryptos.filter(([symbol, info]) =>
            symbol.toLowerCase().includes(searchLower) ||
            info.name.toLowerCase().includes(searchLower)
          );
        }

        const logosList = cryptos.map(([symbol, info]) =>
          `• **${symbol}** - ${info.name}\n  [Voir le logo](${info.logo})`
        );

        return `🪙 **${cryptos.length} logos crypto disponibles:**\n\n${logosList.join('\n\n')}\n\n📌 *Source: cryptologos.cc - PNG et SVG disponibles*`;
      } catch (error: any) {
        return `❌ Erreur: ${error.message}`;
      }
    },
  });

  // 2. Emoji Theme Companies
  server.addTool({
    name: 'emoji_theme_companies',
    description: '🎨 Afficher un THEME EMOJI des entreprises (collection décorative avec emojis). Utilise SEULEMENT pour l\'affichage décoratif. Pour afficher une miniature de logo dans un embed, utilise get_thumbnail.',
    parameters: z.object({
      sector: z.enum(['all', 'technology', 'finance', 'healthcare', 'consumer', 'energy', 'automotive', 'aerospace', 'telecom', 'retail', 'entertainment']).optional().default('all').describe('Secteur d\'activité'),
      search: z.string().optional().describe('Rechercher par symbole ou nom'),
    }),
    execute: async (args) => {
      try {
        let companies = Object.entries(COMPANY_LOGOS);

        // Filtrer par secteur
        if (args.sector !== 'all') {
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
          const targetSector = sectorMap[args.sector];
          companies = companies.filter(([_, info]) => info.sector === targetSector);
        }

        // Recherche
        if (args.search) {
          const searchLower = args.search.toLowerCase();
          companies = companies.filter(([symbol, info]) =>
            symbol.toLowerCase().includes(searchLower) ||
            info.name.toLowerCase().includes(searchLower)
          );
        }

        const logosList = companies.slice(0, 30).map(([symbol, info]) =>
          `• **${symbol}** - ${info.name} (${info.sector})\n  [Logo](${info.logo})`
        );

        return `📈 **${companies.length} logos entreprises disponibles:**\n\n${logosList.join('\n\n')}\n\n📌 *Source: logo.clearbit.com*`;
      } catch (error: any) {
        return `❌ Erreur: ${error.message}`;
      }
    },
  });

  // 3. Emoji Theme Services
  server.addTool({
    name: 'emoji_theme_services',
    description: '🎨 Afficher un THEME EMOJI des services (réseaux sociaux, cloud, brokers, etc.). Utilise SEULEMENT pour l\'affichage décoratif. Pour afficher une miniature de logo dans un embed, utilise get_thumbnail.',
    parameters: z.object({
      category: z.enum(['all', 'social', 'cloud', 'exchange', 'broker', 'index', 'bank', 'payment', 'news']).optional().default('all').describe('Catégorie'),
      search: z.string().optional().describe('Rechercher par nom'),
    }),
    execute: async (args) => {
      try {
        let logos = Object.entries(MISC_LOGOS);

        // Filtrer par catégorie
        if (args.category !== 'all') {
          const categoryMap: Record<string, string> = {
            social: 'Social',
            cloud: 'Cloud',
            exchange: 'Exchange',
            broker: 'Broker',
            index: 'Index',
            bank: 'Bank',
            payment: 'Payment',
            news: 'News',
          };
          const targetCategory = categoryMap[args.category];
          logos = logos.filter(([_, info]) => info.category === targetCategory);
        }

        // Recherche
        if (args.search) {
          const searchLower = args.search.toLowerCase();
          logos = logos.filter(([key, info]) =>
            key.toLowerCase().includes(searchLower) ||
            info.name.toLowerCase().includes(searchLower)
          );
        }

        const logosList = logos.map(([key, info]) =>
          `• **${info.name}** (${info.category})\n  [Logo](${info.logo})`
        );

        return `🌐 **${logos.length} logos disponibles:**\n\n${logosList.join('\n\n')}\n\n📌 *Source: logo.clearbit.com*`;
      } catch (error: any) {
        return `❌ Erreur: ${error.message}`;
      }
    },
  });
}
