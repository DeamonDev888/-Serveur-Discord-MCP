/**
 * Outils MCP pour la création et gestion des Embeds Discord
 *
 * 🎯 GUIDE ULTRA-INTUITIF POUR AGENTS AVEC PERTE DE MÉMOIRE
 *
 * 💡 UTILISATION SIMPLE EN 3 ÉTAPES:
 * 1. channelId + title + description (OBLIGATOIRE)
 * 2. Choisir un thème (basic, data_report, status_update, etc.)
 * 3. Personnaliser (images, boutons, champs)
 *
 * 📚 EXEMPLES PRÊTS À UTILISER dans GUIDE_CREER_EMBED_INTUITIF.md
 */

import { z } from 'zod';
import type { FastMCP } from 'fastmcp';
import {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
} from 'discord.js';
import * as fs from 'fs';
import * as path from 'path';
import Logger from '../utils/logger.js';
import embedHelper from '../utils/embedHelper.js';  // 🎯 SYSTÈME D'AIDE INTUITIF
import {
  isSvgUrl as checkIsSvgUrl,
  convertSvgUrlToPng,
} from '../utils/svgConverter.js';
import {
  ensureDiscordConnection,
  EMBED_THEMES,
  applyTheme,
  VISUAL_SEPARATORS,
  VISUAL_BADGES,
  formatDuration,
} from './common.js';
import {
  getUniversalLogo,
  getCryptoInfo,
} from '../utils/logoUtils.js';
import {
  upsertPersistentButton,
  upsertPersistentMenu,
  type PersistentButton,
  type PersistentSelectMenu,
} from '../utils/distPersistence.js';
import {
  CRYPTO_LOGOS,
  COMPANY_LOGOS,
  MISC_LOGOS,
  THEME_IMAGES,
  POKEMON_LOGOS,
  ANIME_LOGOS,
  STEAM_LOGOS,
  DEVOPS_LOGOS,
  ESPORT_LOGOS,
  VIDEOGAME_LOGOS,
  PARTY_LOGOS,
  SIMPLEICONS_LOGOS,
} from '../data/logos.js';
import {
  autoUpdateEmbeds,
  embedAnalytics,
  trackEmbedView,
  generateAnalyticsReport,
  startAutoUpdate,
  updateEmbed,
} from '../state/embedState.js';
import { loadCustomButtons, saveCustomButtons } from '../utils/buttonPersistence.js';
import { interactionHandler } from '../utils/interactionHandler.js';

// ============================================================================
// CONSTANTES POUR LES THÈMES - URLs D'IMAGES VALIDES
// ⚠️ IMPORTANT: Utiliser uniquement des URLs d'images valides, jamais d'emojis
// Utilise le pipeline serveur_discord/src/data/logos.ts
// ============================================================================

// Mapping des images de thèmes depuis THEME_IMAGES (logos.ts)
const THEME_IMAGE_MAP = {
  CYBERPUNK: {
    author: THEME_IMAGES.CYBERPUNK_AUTHOR.logo,
    thumbnail: THEME_IMAGES.CYBERPUNK_THUMBNAIL.logo,
    image: THEME_IMAGES.CYBERPUNK_IMAGE.logo,
    footer: THEME_IMAGES.CYBERPUNK_FOOTER.logo,
  },
  GAMING: {
    author: THEME_IMAGES.GAMING_AUTHOR.logo,
    thumbnail: THEME_IMAGES.GAMING_THUMBNAIL.logo,
    image: THEME_IMAGES.GAMING_IMAGE.logo,
    footer: THEME_IMAGES.GAMING_FOOTER.logo,
  },
  CORPORATE: {
    author: THEME_IMAGES.CORPORATE_AUTHOR.logo,
    thumbnail: THEME_IMAGES.CORPORATE_THUMBNAIL.logo,
    image: THEME_IMAGES.CORPORATE_IMAGE.logo,
    footer: THEME_IMAGES.CORPORATE_FOOTER.logo,
  },
  SUNSET: {
    author: THEME_IMAGES.SUNSET_AUTHOR.logo,
    thumbnail: THEME_IMAGES.SUNSET_THUMBNAIL.logo,
    image: THEME_IMAGES.SUNSET_IMAGE.logo,
    footer: THEME_IMAGES.SUNSET_FOOTER.logo,
  },
  OCEAN: {
    author: THEME_IMAGES.OCEAN_AUTHOR.logo,
    thumbnail: THEME_IMAGES.OCEAN_THUMBNAIL.logo,
    image: THEME_IMAGES.OCEAN_IMAGE.logo,
    footer: THEME_IMAGES.OCEAN_FOOTER.logo,
  },
  MINIMAL: {
    author: THEME_IMAGES.MINIMAL_AUTHOR.logo,
    thumbnail: THEME_IMAGES.MINIMAL_THUMBNAIL.logo,
    footer: THEME_IMAGES.MINIMAL_FOOTER.logo,
  },
  NOEL: {
    author: THEME_IMAGES.NOEL_AUTHOR.logo,
    thumbnail: THEME_IMAGES.NOEL_THUMBNAIL.logo,
    image: THEME_IMAGES.NOEL_IMAGE.logo,
    footer: THEME_IMAGES.NOEL_FOOTER.logo,
  },
};

// ============================================================================
// FONCTIONS UTILITAIRES
// ============================================================================

function parseTable(tableText: string): string {
  const lines = tableText.trim().split('\n');
  if (lines.length < 2) return tableText;

  const rows = lines.map(line =>
    line.split('|').map(cell => cell.trim()).filter(cell => cell !== '')
  );

  if (rows.length < 2) return tableText;

  const colWidths = rows[0].map((_, colIndex) =>
    Math.max(...rows.map(row => (row[colIndex] || '').length))
  );

  let formatted = '```\n';
  const header = rows[0].map((cell, i) => cell.padEnd(colWidths[i])).join(' │ ');
  formatted += header + '\n';
  const separator = colWidths.map(w => '─'.repeat(w)).join('─┼─');
  formatted += separator + '\n';

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i].map((cell, j) => (cell || '').padEnd(colWidths[j])).join(' │ ');
    formatted += row + '\n';
  }

  formatted += '```';
  return formatted;
}

/**
 * Type d'erreur de mention
 */
type MentionErrorType = 'user' | 'channel' | 'role' | 'unknown';

/**
 * Analyse une mention invalide et retourne son type probable
 */
function analyzeInvalidMention(mention: string): MentionErrorType {
  if (mention.startsWith('<@') || mention.startsWith('<@!')) {
    return 'user';
  } else if (mention.startsWith('<#')) {
    return 'channel';
  } else if (mention.startsWith('<@&')) {
    return 'role';
  }
  return 'unknown';
}

/**
 * Valide que les mentions Discord respectent les formats valides
 * Formats acceptés: <@ID>, <@!ID>, <#ID>, <@&ID>
 * Renvoie un objet détaillé avec les erreurs par type
 */
function validateDiscordMentions(text: string): {
  valid: boolean;
  errors: {
    user: string[];
    channel: string[];
    role: string[];
    other: string[];
  };
  allInvalid: string[];
} {
  // Regex pour détecter les mentions (valides ET invalides)
  const mentionPattern = /<[@!&][^>]+>/g;
  const mentions = text.match(mentionPattern) || [];

  const errors = {
    user: [] as string[],
    channel: [] as string[],
    role: [] as string[],
    other: [] as string[],
  };

  const validFormats = [
    { pattern: /^<@\d+>$/, type: 'user' as const, name: '<@USER_ID>' },
    { pattern: /^<@!\d+>$/, type: 'user' as const, name: '<@!USER_ID>' },
    { pattern: /^<#\d+>$/, type: 'channel' as const, name: '<#CHANNEL_ID>' },
    { pattern: /^<@&\d+>$/, type: 'role' as const, name: '<@&ROLE_ID>' },
  ];

  for (const mention of mentions) {
    let isValid = false;
    for (const format of validFormats) {
      if (format.pattern.test(mention)) {
        isValid = true;
        break;
      }
    }

    if (!isValid) {
      const errorType = analyzeInvalidMention(mention);
      if (errorType === 'user') {
        errors.user.push(mention);
      } else if (errorType === 'channel') {
        errors.channel.push(mention);
      } else if (errorType === 'role') {
        errors.role.push(mention);
      } else {
        errors.other.push(mention);
      }
    }
  }

  const allInvalid = [
    ...errors.user,
    ...errors.channel,
    ...errors.role,
    ...errors.other,
  ];

  return {
    valid: allInvalid.length === 0,
    errors,
    allInvalid,
  };
}

/**
 * Génère le message d'erreur pour les mentions invalides
 */
function generateMentionErrorMessage(validation: ReturnType<typeof validateDiscordMentions>, fieldName: string): string {
  let message = `❌ **Format de mention invalide détecté dans ${fieldName} !**\n\n`;

  const parts: string[] = [];

  if (validation.errors.user.length > 0) {
    parts.push(`**Mentions utilisateur invalides :** ${validation.errors.user.join(', ')}`);
    parts.push(`  ✅ Format correct : \`<@293572859941617674>\` ou \`<@!293572859941617674>\``);
  }

  if (validation.errors.channel.length > 0) {
    parts.push(`**Mentions de canal invalides :** ${validation.errors.channel.join(', ')}`);
    parts.push(`  ✅ Format correct : \`<#1442317829998383235>\``);
  }

  if (validation.errors.role.length > 0) {
    parts.push(`**Mentions de rôle invalides :** ${validation.errors.role.join(', ')}`);
    parts.push(`  ✅ Format correct : \`<@&ROLE_ID>\``);
  }

  if (validation.errors.other.length > 0) {
    parts.push(`**Autres mentions invalides :** ${validation.errors.other.join(', ')}`);
  }

  return message + parts.join('\n\n');
}

function replaceVariables(text: string, variables: Record<string, string> = {}): string {
  let result = text;

  const autoVars = {
    '{timestamp}': new Date().toLocaleString('fr-FR'),
    '{date}': new Date().toLocaleDateString('fr-FR'),
    '{time}': new Date().toLocaleTimeString('fr-FR'),
    '{year}': new Date().getFullYear().toString(),
    '{month}': (new Date().getMonth() + 1).toString(),
    '{day}': new Date().getDate().toString(),
    '{weekday}': new Date().toLocaleDateString('fr-FR', { weekday: 'long' }),
  };

  Object.entries(autoVars).forEach(([key, value]) => {
    result = result.replace(new RegExp(key, 'g'), value);
  });

  Object.entries(variables).forEach(([key, value]) => {
    result = result.replace(new RegExp(`{${key}}`, 'g'), value);
  });

  result = result.replace(/{spoiler:([^}]+)}/g, '|| $1 ||');

  return result;
}

function createProgressBar(value: number, max: number, length: number = 10): string {
  const percentage = Math.min((value / max) * 100, 100);
  const filled = Math.round((percentage / 100) * length);
  const empty = length - filled;
  return '█'.repeat(filled) + '░'.repeat(empty);
}

async function saveTemplate(name: string, embedData: any): Promise<void> {
  const templatesPath = path.join(process.cwd(), 'embed-templates.json');
  let templates: Record<string, any> = {};

  try {
    const content = await fs.promises.readFile(templatesPath, 'utf-8');
    templates = JSON.parse(content);
  } catch (e) {
    // Fichier n'existe pas encore
  }

  templates[name] = embedData;
  await fs.promises.writeFile(templatesPath, JSON.stringify(templates, null, 2));
}

async function loadTemplate(name: string): Promise<any | null> {
  const templatesPath = path.join(process.cwd(), 'embed-templates.json');

  try {
    const content = await fs.promises.readFile(templatesPath, 'utf-8');
    const templates = JSON.parse(content);
    return templates[name] || null;
  } catch (e) {
    return null;
  }
}

function validateFieldLength(fields: any[]): { valid: boolean; warnings: string[] } {
  const warnings: string[] = [];

  fields?.forEach((field, index) => {
    if (field.name.length > 256) {
      warnings.push(`Champ #${index + 1}: Le nom dépasse 256 caractères (${field.name.length})`);
    }
    if (field.value.length > 1024) {
      warnings.push(`Champ #${index + 1}: La valeur dépasse 1024 caractères (${field.value.length}) ⚠️`);
    }
    if (field.value.length > 800) {
      warnings.push(`Champ #${index + 1}: La valeur est longue (${field.value.length} chars), considérez la pagination`);
    }
  });

  return { valid: warnings.filter(w => w.includes('⚠️')).length === 0, warnings };
}

function generateAsciiChart(type: string, data: number[], labels?: string[], options: any = {}): string {
  const maxValue = Math.max(...data);
  const minValue = Math.min(...data);
  const range = maxValue - minValue;
  const height = options.height || 10;

  let chart = '';

  switch (type) {
    case 'sparkline':
      const points = data.map((value, index) => {
        const position = Math.round(((value - minValue) / range) * 4);
        return '▁▂▃▄▅▆▇█'[Math.min(position, 7)];
      });
      chart = `\`\`\`\n${points.join('')}\n\`\`\``;
      break;

    case 'line':
      chart = '```\n';
      for (let i = height; i >= 0; i--) {
        let line = '';
        for (let j = 0; j < data.length; j++) {
          const value = data[j];
          const position = Math.round(((value - minValue) / range) * height);
          line += position >= i ? '●' : ' ';
        }
        chart += line + '\n';
      }
      chart += '```';
      break;

    case 'bar':
      chart = '```\n';
      for (let i = height; i >= 0; i--) {
        let line = '';
        for (let j = 0; j < data.length; j++) {
          const value = data[j];
          const barHeight = Math.round(((value - minValue) / range) * height);
          line += barHeight >= i ? '█' : ' ';
        }
        chart += line + '\n';
      }
      chart += '```';
      break;

    case 'pie':
      const total = data.reduce((sum, val) => sum + val, 0);
      let pieChart = '```\n';
      data.forEach((value, index) => {
        const percentage = ((value / total) * 100).toFixed(1);
        const barLength = Math.round(parseFloat(percentage) / 2);
        const bar = '█'.repeat(barLength);
        const label = labels?.[index] || `Partie ${index + 1}`;
        pieChart += `${label}: ${bar} ${percentage}%\n`;
      });
      pieChart += '```';
      chart = pieChart;
      break;

    default:
      chart = 'Type de graphique non supporté';
  }

  return chart;
}

function adaptLinkForUser(link: any, userId: string): string {
  let adaptedUrl = link.url;

  if (link.userSpecific) {
    adaptedUrl += `?user=${userId}&ref=discord`;
  }

  if (link.conditions) {
    const params = new URLSearchParams();
    Object.entries(link.conditions).forEach(([key, value]) => {
      params.append(key, value as string);
    });
    adaptedUrl += `${adaptedUrl.includes('?') ? '&' : '?'}${params.toString()}`;
  }

  return `[${link.label}](${adaptedUrl})`;
}

function applyLayout(fields: any[], layout: any): any[] {
  if (!layout || layout.type === 'stack') {
    return fields;
  }

  switch (layout.type) {
    case 'grid':
      const columns = layout.columns || 2;
      const gridFields: any[] = [];
      for (let i = 0; i < fields.length; i += columns) {
        const row = fields.slice(i, i + columns);
        gridFields.push({
          name: row.map((f: any) => f.name).join(' | '),
          value: row.map((f: any) => f.value).join(' | '),
          inline: true,
        });
      }
      return gridFields;

    case 'sidebar':
      const sidebarField = fields.slice(0, 1);
      const mainFields = fields.slice(1);
      return [
        ...sidebarField.map(f => ({ ...f, inline: false })),
        ...mainFields.map(f => ({ ...f, inline: true })),
      ];

    case 'centered':
      return fields.map(f => ({ ...f, inline: false }));

    case 'masonry':
      return fields.map((f, i) => ({
        ...f,
        inline: i % 2 === 0,
      }));

    default:
      return fields;
  }
}

function generateVisualEffectsDescription(effects: any): string {
  if (!effects) return '';

  let description = '';

  if (effects.animations && effects.animations.length > 0) {
    description += `✨ Animations: ${effects.animations.join(', ')}\n`;
  }

  if (effects.particles) {
    description += `✨ Particules activées\n`;
  }

  if (effects.transitions) {
    description += `✨ Transitions fluides\n`;
  }

  if (effects.hoverEffects && effects.hoverEffects.length > 0) {
    description += `✨ Effets hover: ${effects.hoverEffects.join(', ')}\n`;
  }

  if (effects.intensity && effects.intensity !== 'medium') {
    description += `✨ Intensité: ${effects.intensity}\n`;
  }

  return description.trim();
}

// ============================================================================
// VÉRIFICATION DES URLs D'IMAGES - SYSTÈME DE LISTE LOCALE
// ============================================================================

/**
 * Vérifie si une URL est valide pour Discord (CDN fiables ou base locale)
 * Accepte: URLs de la base locale OU URLs de CDN fiables avec extensions image valides
 */
export function isLocalLogoUrl(url: string | undefined): boolean {
  if (!url) return false;

  // Liste des domaines CDN fiables autorisés
  const TRUSTED_DOMAINS = [
    'cdn.simpleicons.org',
    'simpleicons.org',
    'images.unsplash.com',
    'unsplash.com',
    'cdn.discordapp.com',
    'media.discordapp.net',
    'picsum.photos',
    'assets.coingecko.com',
    'cryptologos.cc',
    'raw.githubusercontent.com',
    'github.com',
    'avatars.githubusercontent.com',
    'upload.wikimedia.org',
    'pbs.twimg.com',
    'abs.twimg.com',
  ];

  // Vérifier si l'URL provient d'un CDN fiable
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.toLowerCase();

    // Accepter les URLs de CDN fiables
    if (TRUSTED_DOMAINS.some(domain => hostname === domain || hostname.endsWith('.' + domain))) {
      return true;
    }
  } catch {
    // URL invalide
    return false;
  }

  // Chercher dans toutes les bases de données locales
  const inCrypto = Object.values(CRYPTO_LOGOS).some(crypto => crypto.logo === url);
  if (inCrypto) return true;

  const inCompany = Object.values(COMPANY_LOGOS).some(company => company.logo === url);
  if (inCompany) return true;

  const inMisc = Object.values(MISC_LOGOS).some(misc => misc.logo === url);
  if (inMisc) return true;

  const inThemeImages = Object.values(THEME_IMAGES).some(theme => theme.logo === url);
  if (inThemeImages) return true;

  // === NOUVELLES CATÉGORIES ===
  const inPokemon = Object.values(POKEMON_LOGOS).some(pokemon => pokemon.logo === url);
  if (inPokemon) return true;

  const inAnime = Object.values(ANIME_LOGOS).some(anime => anime.logo === url);
  if (inAnime) return true;

  const inSteam = Object.values(STEAM_LOGOS).some(steam => steam.logo === url);
  if (inSteam) return true;

  const inDevops = Object.values(DEVOPS_LOGOS).some(devops => devops.logo === url);
  if (inDevops) return true;

  const inEsport = Object.values(ESPORT_LOGOS).some(esport => esport.logo === url);
  if (inEsport) return true;

  const inVideogame = Object.values(VIDEOGAME_LOGOS).some(videogame => videogame.logo === url);
  if (inVideogame) return true;

  const inParty = Object.values(PARTY_LOGOS).some(party => party.logo === url);
  if (inParty) return true;

  const inSimpleicons = Object.values(SIMPLEICONS_LOGOS).some(icon => icon.logo === url);
  if (inSimpleicons) return true;

  return false;
}

/**
 * Génère un message d'erreur qui guide l'agent IA vers list_images()
 */
export function generateGuidanceMessage(urlType: string, providedUrl: string): string {
  return `❌ URL externe détectée pour ${urlType}: ${providedUrl}

🤖 **GUIDE POUR L'AGENT IA:**

⚠️ Les URLs externes directes ne sont pas autorisées. Utilisez l'outil **list_images** pour obtenir des URLs valides depuis la base de données locale.

✅ **UTILISEZ list_images() AVANT creer_embed():**

1. **Logos crypto/entreprises (mode par défaut):**
   list_images({symbols: "BTC"}) → Retourne l'URL locale du logo Bitcoin

2. **Photos HD immersives (mode="photo"):**
   list_images({symbols: "AAPL", mode: "photo"}) → Photo HD Apple pour embeds Discord

3. **GIFs animés (mode="gif"):**
   list_images({symbols: "BTC", mode: "gif"}) → GIF animé Bitcoin

4. **Lister toutes les cryptos:**
   list_images({category: "crypto", limit: 50}) → Liste des 50 premières cryptos

5. **Recherche par nom:**
   list_images({search: "bitcoin"}) → Recherche dans la base locale

📝 **EXEMPLE D'USAGE CORRECT:**

// ÉTAPE 1: Obtenir l'URL via list_images
const btcLogoUrl = list_images({symbols: "BTC"});  // → "https://assets.coingecko.com/coins/images/1/small/bitcoin.png"

// ÉTAPE 2: Utiliser l'URL retournée dans creer_embed
creer_embed({
  channelId: "1442317829998383235",
  title: "Bitcoin Price",
  thumbnail: btcLogoUrl,  // ✅ URL locale valide
  description: "Le prix du Bitcoin..."
})

🗂️ **SYMBOLS DISPONIBLES:**
• Cryptos: BTC, ETH, SOL, ADA, AVAX, DOT, MATIC, UNI, LINK, DOGE, SHIB, etc.
• Entreprises: AAPL, TSLA, MSFT, GOOGL, AMZN, META, NVDA, etc.
• Services: DISCORD, TELEGRAM, YOUTUBE, OPENAI, etc.

💡 Pour voir tous les symbols disponibles, utilisez:
list_images({category: "all", limit: 100})`;
}

/**
 * Détecte si une URL est un SVG
 */
export function isSvgUrl(url: string): boolean {
  const lowerUrl = url.toLowerCase();
  return lowerUrl.endsWith('.svg') ||
         lowerUrl.includes('.svg?') ||
         lowerUrl.includes('simpleicons.org'); // SimpleIcons renvoie du SVG
}

/**
 * Génère un message d'erreur spécifique pour les SVG dans le footer
 */
export function generateSvgFooterMessage(providedUrl: string): string {
  return `❌ URL SVG détectée pour footerIcon: ${providedUrl}

🚫 **PROBLÈME: Discord ne supporte pas les SVG pour footerIcon !**

Le format SVG n'est pas supporté par Discord dans les footers. L'icône ne s'affichera pas.

✅ **SOLUTIONS:**

1. **Utilisez CoinGecko (PNG garanti):**
   list_images({symbols: "BTC"}) → URL PNG valide pour footer

2. **Utilisez la base locale (thèmes):**
   theme: "cyberpunk" | "noel" | "gaming" → Images PNG intégrées

3. **Pour SimpleIcons, utilisez thumbnail à la place:**
   // SimpleIcons fonctionne pour thumbnail (mais pas footer/author)
   thumbnail: "https://cdn.simpleicons.org/discord"  // ❌ SVG ne s'affiche pas
   footerIcon: "https://cdn.simpleicons.org/discord"   // ❌ SVG ne s'affiche pas

📋 **FOOTER ICON DOIT ÊTRE:**
• Format: PNG, JPG, ou WebP
• Source: CoinGecko, base locale, ou autres domaines PNG
• SimpleIcons: ❌ SVG non supporté dans footer

💡 Utilisez list_images() pour obtenir des URLs PNG garanties.`;
}

/**
 * Génère un message d'erreur spécifique pour les SVG dans l'author
 */
export function generateSvgAuthorMessage(providedUrl: string): string {
  return `❌ URL SVG détectée pour authorIcon: ${providedUrl}

🚫 **PROBLÈME: Discord ne supporte pas les SVG pour authorIcon !**

Le format SVG n'est pas supporté par Discord dans les authors. L'icône ne s'affichera pas.

✅ **SOLUTIONS:**

1. **Utilisez CoinGecko (PNG garanti):**
   list_images({symbols: "BTC"}) → URL PNG valide pour author

2. **Utilisez la base locale (thèmes):**
   theme: "cyberpunk" | "noel" | "gaming" → Images PNG intégrées

3. **Pour SimpleIcons, utilisez uniquement PNG:**
   // SimpleIcons SVG ne fonctionne PAS pour authorIcon
   authorIcon: "https://cdn.simpleicons.org/discord"  // ❌ SVG ne s'affiche pas

📋 **AUTHOR ICON DOIT ÊTRE:**
• Format: PNG, JPG, ou WebP
• Source: CoinGecko, base locale, ou autres domaines PNG
• SimpleIcons: ❌ SVG non supporté dans author

💡 Utilisez list_images() pour obtenir des URLs PNG garanties.`;
}

// ============================================================================
// GÉNÉRATEUR DE CODE TYPESCRIPT
// ============================================================================

/**
 * Convertit les paramètres du bouton en action persistante (pour creer_embed)
 */
function buildButtonActionFromCreerEmbed(btn: any): any {
  switch (btn.action) {
    case 'link':
      if (btn.value) {
        return { type: 'link', url: btn.value };
      }
      return { type: 'message', content: 'Lien non configuré', ephemeral: true };

    case 'delete':
      return { type: 'delete' };

    case 'edit':
      return { type: 'edit', newEmbed: btn.customData?.embed };

    case 'refresh':
      return { type: 'refresh' };

    case 'role':
      if (btn.roleId) {
        return { type: 'role', roleId: btn.roleId };
      }
      return { type: 'message', content: 'Rôle non configuré', ephemeral: true };

    case 'custom':
      if (btn.customData?.embed) {
        return {
          type: 'embed',
          embed: btn.customData.embed,
          ephemeral: btn.customData.ephemeral !== false,
        };
      }
      return {
        type: 'message',
        content: btn.customData?.message || `${btn.label} cliqué !`,
        ephemeral: btn.customData?.ephemeral !== false,
      };

    default:
      return {
        type: 'message',
        content: `${btn.label} cliqué !`,
        ephemeral: true,
      };
  }
}

/**
 * Convertit les paramètres du menu en action persistante (pour creer_embed)
 */
function buildMenuActionFromCreerEmbed(menu: any): any {
  switch (menu.action) {
    case 'link':
      if (menu.url) {
        return { type: 'link', url: menu.url, template: menu.template };
      }
      return { type: 'message', content: 'Lien non configuré', ephemeral: true };

    case 'delete':
      return { type: 'delete' };

    case 'edit':
      return { type: 'edit', newEmbed: menu.customData?.embed };

    case 'refresh':
      return { type: 'refresh' };

    case 'role':
      if (menu.roleId) {
        return { type: 'role', roleId: menu.roleId };
      }
      return { type: 'message', content: 'Rôle non configuré', ephemeral: true };

    case 'embed':
      if (menu.customData?.embed) {
        return {
          type: 'embed',
          embed: menu.customData.embed,
          ephemeral: true,
        };
      }
      return { type: 'message', content: 'Embed non configuré', ephemeral: true };

    case 'modal':
      if (menu.customData?.modalId) {
        return { type: 'modal', modalId: menu.customData.modalId };
      }
      return { type: 'message', content: 'Modal non configuré', ephemeral: true };

    case 'custom':
      return {
        type: 'custom',
        handler: menu.customData?.handler || 'customHandler',
      };

    default:
      return {
        type: 'message',
        content: menu.content || `Sélection: ${menu.action}`,
        template: menu.template,
        ephemeral: true,
      };
  }
}

/**
 * THÈMES PÉDAGOGIQUES - Exemples de configurations pour creer_embed()
 *
 * ⚠️  IMPORTANT: Ces thèmes sont des EXEMPLES à personnaliser !
 * Chaque thème montre une structure possible d'embed.
 * ADAPTEZ toujours selon votre contexte spécifique.
 *
 * 💡 VARIABLES DISPONIBLES:
 * {timestamp} - Date/heure actuelle
 * {date} - Date uniquement
 * {time} - Heure actuelle
 * {year} - Année
 * {month} - Mois
 * {day} - Jour
 * {weekday} - Jour de la semaine
 */
function applyThemeToParams(theme: string | undefined, args: any): any {
  if (!theme) return args;

  const themedArgs = { ...args };

  switch (theme) {
    // ========================================================================
    // 📚 THÈME BASIC - Structure d'embed simple (à personnaliser)
    // ========================================================================
    case 'basic': {
      themedArgs.color = 0x5865F2; // Bleu Discord par défaut
      if (!args.title) themedArgs.title = '📝 Titre de votre embed';
      if (!args.description) {
        themedArgs.description = `
📌 **Description personnalisée ici**

• Point 1
• Point 2
• Point 3

💡 Modifiez ce contenu selon vos besoins !
        `.trim();
      }
      if (!args.fields) {
        themedArgs.fields = [
          { name: '📊 Champ 1', value: 'Valeur ou information', inline: true },
          { name: '📈 Champ 2', value: 'Autre donnée', inline: true },
          { name: '📋 Champ 3', value: 'Détails supplémentaires', inline: false }
        ];
      }
      break;
    }

    // ========================================================================
    // 📊 THÈME DATA_REPORT - Rapport avec données (à personnaliser)
    // ========================================================================
    case 'data_report': {
      themedArgs.color = 0x00FF00; // Vert pour données/succès
      if (!args.title) themedArgs.title = '📊 Rapport de Données';
      if (!args.description) {
        themedArgs.description = `
📈 **Résultats et analyses**

Ce rapport présente les données principales :
• Métrique 1: Valeur actuelle
• Métrique 2: Évolution
• Métrique 3: Comparaison

💡 Adaptez ce contenu selon vos données !
        `.trim();
      }
      if (!args.fields) {
        themedArgs.fields = [
          { name: '📊 Indicateur 1', value: '1,234 (↑ 12%)', inline: true },
          { name: '📈 Indicateur 2', value: '567 (↓ 3%)', inline: true },
          { name: '📉 Indicateur 3', value: '890 (→ stable)', inline: true },
          { name: '📋 Analyse', value: 'Détails de l\'analyse ici...', inline: false }
        ];
      }
      break;
    }

    // ========================================================================
    // 🔄 THÈME STATUS_UPDATE - Mise à jour de statut (à personnaliser)
    // ========================================================================
    case 'status_update': {
      themedArgs.color = 0xFFA500; // Orange pour attention/status
      if (!args.title) themedArgs.title = '🔄 Mise à jour de Statut';
      if (!args.description) {
        themedArgs.description = `
🟢 **État actuel du système**

Dernière vérification : {timestamp}
Tous les services fonctionnent normalement.

💡 Adaptez ce statut selon votre contexte !
        `.trim();
      }
      if (!args.fields) {
        themedArgs.fields = [
          { name: '🟢 Service A', value: 'OPÉRATIONNEL\nTemps de réponse: 45ms', inline: true },
          { name: '🟢 Service B', value: 'OPÉRATIONNEL\nUptime: 99.9%', inline: true },
          { name: '🟢 Service C', value: 'OPÉRATIONNEL\nVersion: v2.1.0', inline: true },
          { name: '📝 Notes', value: 'Prochaine maintenance: {date}', inline: false }
        ];
      }
      break;
    }

    // ========================================================================
    // 🚀 THÈME PRODUCT_SHOWCASE - Présentation produit (à personnaliser)
    // ========================================================================
    case 'product_showcase': {
      themedArgs.color = 0x9B59B6; // Violet pour premium/nouveau
      if (!args.title) themedArgs.title = '🚀 Nouveau Produit';
      if (!args.description) {
        themedArgs.description = `
✨ **Présentation de votre produit/service**

Découvrez les caractéristiques principales :
• Fonctionnalité clé 1
• Fonctionnalité clé 2
• Fonctionnalité clé 3

💡 Adaptez cette description selon votre produit !
        `.trim();
      }
      if (!args.fields) {
        themedArgs.fields = [
          { name: '⭐ Fonctionnalité 1', value: 'Description détaillée...', inline: true },
          { name: '⭐ Fonctionnalité 2', value: 'Description détaillée...', inline: true },
          { name: '⭐ Fonctionnalité 3', value: 'Description détaillée...', inline: true },
          { name: '💰 Prix', value: 'XX.XX€', inline: true },
          { name: '📦 Disponibilité', value: 'En stock / Disponible', inline: true },
          { name: '📋 Plus d\'infos', value: 'Contactez-nous pour plus de détails', inline: false }
        ];
      }
      break;
    }

    // ========================================================================
    // 🏆 THÈME LEADERBOARD - Classement/scores (à personnaliser)
    // ========================================================================
    case 'leaderboard': {
      themedArgs.color = 0xE74C3C; // Rouge pour compétition
      if (!args.title) themedArgs.title = '🏆 Classement';
      if (!args.description) {
        themedArgs.description = `
📊 **Top performers**

Classement mis à jour : {timestamp}

💡 Adaptez ce classement selon votre contexte !
        `.trim();
      }
      if (!args.fields) {
        themedArgs.fields = [
          { name: '🥇 #1', value: 'Nom - Score', inline: true },
          { name: '🥈 #2', value: 'Nom - Score', inline: true },
          { name: '🥉 #3', value: 'Nom - Score', inline: true },
          { name: '📊 Détails', value: '• Participants: XX\n• Moyenne: XX\n• Évolution: +X%', inline: false }
        ];
      }
      break;
    }

    // ========================================================================
    // ⚡ THÈME TECH_ANNOUNCEMENT - Annonce technique (à personnaliser)
    // ========================================================================
    case 'tech_announcement': {
      themedArgs.color = 0x3498DB; // Bleu tech
      if (!args.title) themedArgs.title = '⚡ Nouvelle Fonctionnalité';
      if (!args.description) {
        themedArgs.description = `
🚀 **Mise à jour disponible**

Découvrez les nouveautés de cette version :

💡 Adaptez cette annonce selon vos features !
        `.trim();
      }
      if (!args.fields) {
        themedArgs.fields = [
          { name: '✨ Amélioration 1', value: 'Description de l\'amélioration...', inline: true },
          { name: '🔧 Amélioration 2', value: 'Description de l\'amélioration...', inline: true },
          { name: '📅 Date', value: '{date}', inline: true },
          { name: '📝 Détails', value: '• Correction bug #123\n• Nouvelle API\n• Amélioration perf', inline: false }
        ];
      }
      break;
    }

    // ========================================================================
    // 📱 THÈME SOCIAL_FEED - Contenu social/média (à personnaliser)
    // ========================================================================
    case 'social_feed': {
      themedArgs.color = 0xE91E63; // Rose social
      if (!args.title) themedArgs.title = '💬 Dernières Actualités';
      if (!args.description) {
        themedArgs.description = `
📱 **Ce qui se passe maintenant**

Dernière mise à jour : {timestamp}

💡 Adaptez ce contenu social selon votre contexte !
        `.trim();
      }
      if (!args.fields) {
        themedArgs.fields = [
          { name: '👍 Réactions', value: '1,234', inline: true },
          { name: '💬 Comments', value: '89', inline: true },
          { name: '🔄 Shares', value: '45', inline: true },
          { name: '📅 Posté le', value: '{date} à {time}', inline: false }
        ];
      }
      break;
    }

    // ========================================================================
    // 🎄 THÈME NOËL - Thème saisonnier (à personnaliser)
    // ========================================================================
    case 'noel': {
      themedArgs.color = 0xC41E3A; // Rouge Noël
      if (!args.title) themedArgs.title = '🎄 Joyeuses Fêtes ! 🎅';
      if (!args.description) {
        themedArgs.description = `
✨ **spirit de Noël**

Que cette période soit remplie de joie et de magie !

🎁🎅❄️🔔🕯️

💡 Adaptez ce message selon votre contexte festif !
        `.trim();
      }
      if (!args.footerText) themedArgs.footerText = '🎄 Joyeuses fêtes de la part de toute l\'équipe ! 🎄';
      break;
    }

    // ========================================================================
    // 🌊 THÈME DASHBOARD - Tableau de bord (à personnaliser)
    // ========================================================================
    case 'dashboard': {
      themedArgs.color = 0x1ABC9C; // Cyan dashboard
      if (!args.title) themedArgs.title = '📊 Tableau de Bord';
      if (!args.description) {
        themedArgs.description = `
📈 **Métriques en temps réel**

Dernière mise à jour : {timestamp}

💡 Adaptez ce dashboard selon vos métriques !
        `.trim();
      }
      if (!args.fields) {
        themedArgs.fields = [
          { name: '👥 Utilisateurs', value: '1,234', inline: true },
          { name: '📈 Croissance', value: '+12%', inline: true },
          { name: '💰 Revenus', value: '4,567€', inline: true },
          { name: '⏱️ Latence', value: '45ms', inline: true },
          { name: '📊 Performance', value: '▓▓▓▓▓▓▓▓▓░ 90%', inline: false }
        ];
      }
      break;
    }

    // ========================================================================
    // ⬛ THÈME MINIMAL - Design épuré (à personnaliser)
    // ========================================================================
    case 'minimal': {
      themedArgs.color = 0x2C2C2C; // Gris foncé
      if (!args.title) themedArgs.title = 'Titre Minimal';
      if (!args.description) {
        themedArgs.description = `
Design épuré et moderne.

**Points clés :**
• Simplicité
• Clarté
• Efficacité

💡 Adaptez ce style selon vos besoins !
        `.trim();
      }
      if (!args.fields) {
        themedArgs.fields = [
          { name: 'Element 1', value: 'Information concise', inline: true },
          { name: 'Element 2', value: 'Donnée précise', inline: true },
          { name: 'Element 3', value: 'Détails supplémentaires', inline: false }
        ];
      }
      break;
    }
  }

  return themedArgs;
}

/**
 * Génère le code TypeScript complet pour créer un embed avec ses boutons
 * Fonction GENERALISTE - fonctionne avec n'importe quelle configuration
 */
function generateTypeScriptCode(args: any): string {
  const code: string[] = [];

  // Appliquer le thème si spécifié
  const params = applyThemeToParams(args.theme, args);

  // Préparer les boutons (avant la génération du code pour les imports)
  let buttons = params.buttons || [];
  if (args.theme === 'noel' && buttons.length === 0) {
    buttons = [{
      label: '🎁 Cadeau',
      style: 'Success',
      emoji: '🎁',
      action: 'custom',
      customData: {
        embed: {
          title: '🎁 Votre Cadeau de Noël !',
          description: '✨ Voici votre récompense spéciale !\\n\\n🎄 Image de Noël 4K : [Cliquez ici](https://unsplash.com/s/photos/christmas-4k)\\n\\n🌟 Joyeuses fêtes !',
          color: 0x00FF00,
        },
      },
    }];
  }

  // En-tête du code généré
  code.push(`// ============================================================================
// EMBED DISCORD - CODE GÉNÉRÉ AUTOMATIQUEMENT
// ============================================================================`);
  code.push(`// Date de génération: ${new Date().toLocaleString('fr-FR')}`);
  code.push(`// Thème: ${args.theme || 'custom'}`);
  code.push(`//`);
  code.push(`// Utilisation: Copiez ce code dans votre fichier TypeScript`);
  code.push(`// Imports nécessaires:`);

  // Imports de base
  code.push(`// import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';`);
  code.push(`// import { Client } from 'discord.js';`);

  // Imports conditionnels selon les actions
  const hasModal = buttons.some((b: any) => b.action === 'modal');
  if (hasModal) {
    code.push(`// import { ModalBuilder, TextInputBuilder, TextInputStyle } from 'discord.js';`);
  }

  code.push(``);
  code.push(`// ============================================================================`);
  code.push(``);

  // Variables communes
  const channelId = params.channelId || 'YOUR_CHANNEL_ID';
  const embedId = `embed_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  // Commentaire de thème si appliqué
  if (args.theme) {
    code.push(`// 🎨 Thème appliqué: ${args.theme}`);
    code.push(``);
  }

  // ============================================================================
  // FONCTION DE CRÉATION DE L'EMBED
  // ============================================================================
  code.push(`// ============================================================================
// FONCTION DE CRÉATION DE L'EMBED
// ============================================================================`);
  code.push(``);
  code.push(`async function createEmbed(channelId: string, client: Client) {`);
  code.push(`  const embed = new EmbedBuilder();`);
  code.push(`  `);

  // Title
  if (params.title) {
    code.push(`  // Titre de l'embed`);
    code.push(`  embed.setTitle('${params.title}');`);
    code.push(`  `);
  }

  // Description
  if (params.description) {
    code.push(`  // Description principale`);
    const desc = params.description.replace(/`/g, '\\`').replace(/\n/g, '\\n');
    code.push(`  embed.setDescription(\`${desc}\`);`);
    code.push(`  `);
  }

  // Color
  if (params.color) {
    code.push(`  // Couleur de l'embed`);
    code.push(`  embed.setColor('${params.color}');`);
    code.push(`  `);
  }

  // Author
  if (params.authorName) {
    code.push(`  // Auteur (haut-gauche avec icône PETITE)`);
    code.push(`  embed.setAuthor({`);
    code.push(`    name: '${params.authorName}',`);
    if (params.authorUrl) code.push(`    url: '${params.authorUrl}',`);
    if (params.authorIcon) code.push(`    iconURL: '${params.authorIcon}',`);
    code.push(`  });`);
    code.push(`  `);
  }

  // Thumbnail (haut-droite MOYENNE)
  if (params.thumbnail) {
    code.push(`  // Thumbnail (haut-droite - image MOYENNE)`);
    code.push(`  embed.setThumbnail('${params.thumbnail}');`);
    code.push(`  `);
  }

  // Image (bas GRANDE)
  if (params.image) {
    code.push(`  // Image principale (bas - image GRANDE)`);
    code.push(`  embed.setImage('${params.image}');`);
    code.push(`  `);
  }

  // Footer
  if (params.footerText) {
    code.push(`  // Footer (bas-gauche avec icône PETITE)`);
    code.push(`  embed.setFooter({`);
    code.push(`    text: '${params.footerText}',`);
    if (params.footerIcon) code.push(`    iconURL: '${params.footerIcon}',`);
    code.push(`  });`);
    code.push(`  `);
  }

  // Timestamp
  if (params.timestamp !== false) {
    code.push(`  // Timestamp actuel`);
    code.push(`  embed.setTimestamp();`);
    code.push(`  `);
  }

  // URL
  if (params.url) {
    code.push(`  // URL cliquable`);
    code.push(`  embed.setURL('${params.url}');`);
    code.push(`  `);
  }

  // Fields
  if (params.fields && params.fields.length > 0) {
    code.push(`  // Champs additionnels`);
    code.push(`  embed.addFields(`);
    params.fields.forEach((field: any) => {
      const inline = field.inline ? ', inline: true' : '';
      const val = field.value.replace(/`/g, '\\`').replace(/\n/g, '\\n');
      code.push(`    { name: '${field.name}', value: \`${val}\`${inline} },`);
    });
    code.push(`  );`);
    code.push(`  `);
  }

  // ============================================================================
  // COMPOSANTS (BOUTONS)
  // ============================================================================
  if (buttons.length > 0) {
    code.push(`  // ============================================================================`);
    code.push(`  // BOUTONS`);
    code.push(`  // ============================================================================`);
    code.push(`  `);
    code.push(`  const components: ActionRowBuilder<ButtonBuilder>[] = [];`);
    code.push(`  const row = new ActionRowBuilder<ButtonBuilder>();`);
    code.push(`  `);
    code.push(`  const buttonId = '${embedId}';`);
    code.push(`  `);

    buttons.forEach((btn: any, index: number) => {
      const styleMap: Record<string, string> = {
        Primary: 'ButtonStyle.Primary',
        Secondary: 'ButtonStyle.Secondary',
        Success: 'ButtonStyle.Success',
        Danger: 'ButtonStyle.Danger',
      };

      const btnStyle = styleMap[btn.style] || 'ButtonStyle.Primary';
      const btnEmoji = btn.emoji ? `.setEmoji('${btn.emoji}')` : '';

      code.push(`  // Bouton ${index + 1}: ${btn.label}`);
      code.push(`  const button${index + 1} = new ButtonBuilder()`);
      code.push(`    .setCustomId(buttonId + '_${index}')`);
      code.push(`    .setLabel('${btn.label}')`);
      code.push(`    .setStyle(${btnStyle})${btnEmoji});`);
      code.push(`  row.addComponents(button${index + 1});`);
      code.push(`  `);
    });

    code.push(`  components.push(row);`);
    code.push(`  `);
  }

  code.push(`  // Envoi de l'embed`);
  code.push(`  const channel = await client.channels.fetch(channelId);`);
  code.push(`  if (!channel || !('send' in channel)) {`);
  code.push(`    throw new Error('Canal invalide');`);
  code.push(`  }`);
  code.push(`  `);
  code.push(`  const message = await channel.send({`);
  code.push(`    content: ${params.content ? `'${params.content}'` : 'undefined'},`);
  code.push(`    embeds: [embed],`);
  code.push(`    components: ${buttons.length > 0 ? 'components' : 'undefined'},`);
  code.push(`  });`);
  code.push(`  `);
  code.push(`  console.log(\`✅ Embed créé | ID: \${message.id}\`);`);
  code.push(`  return message;`);
  code.push(`}`);
  code.push(``);

  // ============================================================================
  // HANDLER POUR LES BOUTONS
  // ============================================================================
  if (buttons.length > 0 && params.includeHandler !== false) {
    code.push(`// ============================================================================
// GESTIONNAIRE D'INTÉRACTION POUR LES BOUTONS
// ============================================================================`);
    code.push(``);
    code.push(`client.on('interactionCreate', async (interaction) => {`);
    code.push(`  if (!interaction.isButton()) return;`);
    code.push(`  `);

    buttons.forEach((btn: any, index: number) => {
      const btnAction = btn.action || 'none';

      code.push(`  // Bouton ${index + 1}: ${btn.label} (action: ${btnAction})`);
      code.push(`  if (interaction.customId === '${embedId}_${index}') {`);

      // Générer le code selon le type d'action
      switch (btnAction) {
        case 'link':
          if (btn.value) {
            code.push(`    // Action: lien vers ${btn.value}`);
            code.push(`    await interaction.reply({`);
            code.push(`      content: '🔗 ${btn.value}',`);
            code.push(`      ephemeral: false,`);
            code.push(`    });`);
          } else {
            code.push(`    // Erreur: lien non configuré`);
            code.push(`    await interaction.reply({ content: '❌ Lien non configuré', ephemeral: true });`);
          }
          break;

        case 'delete':
          code.push(`    // Action: supprimer le message`);
          code.push(`    await interaction.update({`);
          code.push(`      content: '🗑️ Message supprimé',`);
          code.push(`      embeds: [],`);
          code.push(`      components: [],`);
          code.push(`    });`);
          code.push(`    // Supprimer après 2 secondes`);
          code.push(`    setTimeout(() => interaction.deleteReply().catch(() => {}), 2000);`);
          break;

        case 'edit':
          if (btn.customData?.embed) {
            const editEmbed = btn.customData.embed;
            const editDesc = (editEmbed.description || '').replace(/`/g, '\\`');
            code.push(`    // Action: modifier l'embed`);
            code.push(`    const editedEmbed = new EmbedBuilder()`);
            code.push(`      .setTitle('${editEmbed.title || 'Embed Modifié'}')`);
            code.push(`      .setDescription(\`${editDesc}\`)`);
            code.push(`      .setColor(${editEmbed.color || 0x5865F2})`);
            code.push(`      .setTimestamp();`);
            code.push(`    await interaction.update({ embeds: [editedEmbed] });`);
          } else {
            code.push(`    await interaction.reply({ content: '❌ Données de modification non fournies', ephemeral: true });`);
          }
          break;

        case 'refresh':
          code.push(`    // Action: rafraîchir l'embed avec nouveau timestamp`);
          code.push(`    const refreshedEmbed = EmbedBuilder.from(interaction.message.embeds[0]);`);
          code.push(`    refreshedEmbed.setTimestamp(new Date());`);
          code.push(`    await interaction.update({ embeds: [refreshedEmbed] });`);
          break;

        case 'role':
          if (btn.roleId) {
            code.push(`    // Action: gérer le rôle ${btn.roleId}`);
            code.push(`    const member = await interaction.guild.members.fetch(interaction.user.id);`);
            code.push(`    const role = await interaction.guild.roles.fetch('${btn.roleId}');`);
            code.push(`    if (!role) {`);
            code.push(`      await interaction.reply({ content: '❌ Rôle introuvable', ephemeral: true });`);
            code.push(`      return;`);
            code.push(`    }`);
            code.push(`    // Toggle le rôle (l'ajouter si absent, le retirer si présent)`);
            code.push(`    if (member.roles.cache.has('${btn.roleId}')) {`);
            code.push(`      await member.roles.remove('${btn.roleId}');`);
            code.push(`      await interaction.reply({ content: '❌ Rôle retiré: ' + role.name, ephemeral: true });`);
            code.push(`    } else {`);
            code.push(`      await member.roles.add('${btn.roleId}');`);
            code.push(`      await interaction.reply({ content: '✅ Rôle ajouté: ' + role.name, ephemeral: true });`);
            code.push(`    }`);
          } else {
            code.push(`    await interaction.reply({ content: '❌ Rôle non configuré', ephemeral: true });`);
          }
          break;

        case 'modal':
          code.push(`    // Action: afficher un modal`);
          code.push(`    const modal = new ModalBuilder()`);
          code.push(`      .setCustomId('modal_${embedId}_${index}')`);
          code.push(`      .setTitle('${btn.customData?.modalTitle || 'Formulaire'}');`);
          code.push(`    `);
          code.push(`    const firstInput = new TextInputBuilder()`);
          code.push(`      .setCustomId('modal_input')`);
          code.push(`      .setLabel('${btn.customData?.inputLabel || 'Votre réponse'}')`);
          code.push(`      .setStyle(TextInputStyle.Short)`);
          code.push(`      .setRequired(true);`);
          code.push(`    `);
          code.push(`    const firstActionRow = new ActionRowBuilder<TextInputBuilder>().addComponents(firstInput);`);
          code.push(`    modal.addComponents(firstActionRow);`);
          code.push(`    `);
          code.push(`    await interaction.showModal(modal);`);
          break;

        case 'custom':
        default:
          if (btn.action === 'custom' && btn.customData?.embed) {
            const rewardEmbed = btn.customData.embed;
            const desc = (rewardEmbed.description || '').replace(/`/g, '\\`');
            code.push(`    // Action: embed de récompense personnalisé`);
            code.push(`    const rewardEmbed = new EmbedBuilder()`);
            code.push(`      .setTitle('${rewardEmbed.title || 'Réponse'}')`);
            code.push(`      .setDescription(\`${desc}\`)`);
            code.push(`      .setColor(${rewardEmbed.color || 0x5865F2})`);
            code.push(`      .setTimestamp();`);
            code.push(`    await interaction.reply({ embeds: [rewardEmbed], ephemeral: true });`);
          } else if (btn.customData?.message) {
            code.push(`    // Action: message personnalisé`);
            code.push(`    await interaction.reply({`);
            code.push(`      content: '${btn.customData.message}',`);
            code.push(`      ephemeral: ${btn.customData.ephemeral !== false},`);
            code.push(`    });`);
          } else {
            code.push(`    // Action: réponse simple par défaut`);
            code.push(`    await interaction.reply({`);
            code.push(`      content: '✅ ${btn.label} cliqué !',`);
            code.push(`      ephemeral: true,`);
            code.push(`    });`);
          }
          break;
      }

      code.push(`  }`);
      if (index < buttons.length - 1) code.push(`  `);
    });

    code.push(`});`);
    code.push(``);
  }

  // ============================================================================
  // APPEL DE LA FONCTION
  // ============================================================================
  code.push(`// ============================================================================`);
  code.push(`// APPEL DE LA FONCTION`);
  code.push(`// ============================================================================`);
  code.push(``);
  code.push(`// Pour utiliser: await createEmbed('${channelId}', client);`);
  code.push(``);

  return code.join('\n');
}
// ============================================================================
// ENREGISTREMENT DES OUTILS
// ============================================================================

export function registerEmbedTools(server: FastMCP) {
  console.log('[EMBEDS] === DÉBUT ENREGISTREMENT DES OUTILS EMBEDS ===');

  // 1. Créer Embed
  console.log('[EMBEDS] Ajout de l\'outil creer_embed...');
  server.addTool({
    name: 'creer_embed',
    description: `🎯 ULTRA-INTUITIF - Créer un embed Discord en 3 étapes SIMPLES !

📋 ÉTAPE 1 (OBLIGATOIRE):
   • channelId: ID du canal Discord
   • title: Titre de l'embed
   • description: Texte principal

📚 ÉTAPE 2 (RECOMMANDÉ):
   • theme: basic | data_report | status_update | product_showcase | leaderboard | tech_announcement | social_feed | dashboard | noel | minimal

🎨 ÉTAPE 3 (OPTIONNEL):
   • image: Grande image (bas)
   • thumbnail: Petite image (haut-droite)
   • buttons: Boutons interactifs (max 5)
   • fields: Champs de données (max 10)

🖼️ IMAGES: 4 positions disponibles
   • authorIcon (haut-gauche) - PETITE (16x16px Discord)
   • thumbnail (haut-droite) - MOYENNE (80x80px Discord)
   • image (bas) - GRANDE (400x250px Discord)
   • footerIcon (bas-gauche) - PETITE (16x16px Discord)

💡 CONSEIL: Utilisez help=true pour afficher le guide interactif !

🚀 PHASE 1 ENHANCEMENT (automatique):
   • Cache local d'images
   • Fallback intelligent (URL invalide → Emoji)
   • Validation pré-exécution
   • Optimisation Discord

⚡ MENTIONS DISCORD - IMPORTANT:
   ❌ authorName/footerText NE supportent PAS les mentions
   ✅ description SUPPORTE les mentions (<@ID>, <@!ID>, <#ID>, <@&ID>)
   • Discord n'interprète PAS les mentions dans authorName/footerText
   • Utilisez description pour les mentions interactives (bleu, cliquable)`,
    parameters: z.object({
      help: z.boolean().optional().describe('🎯 Affiche le guide interactif complet avec exemples et conseils'),
      channelId: z.string().describe('ID du canal Discord'),
      title: z.string().optional().describe('Titre de l\'embed (NE supporte PAS les mentions Discord)'),
      description: z.string().optional().describe('Description principale (SUPPORTE les mentions Discord: <@USER_ID>, <@!USER_ID>, <#CHANNEL_ID>, <@&ROLE_ID>)'),
      color: z.string().optional().describe('Couleur en hex (#RRGGBB)'),
      url: z.string().optional().describe('URL cliquable'),
      thumbnail: z.string().optional().describe('URL thumbnail (MOYENNE - en haut à droite de l\'embed). Utilisez list_images({symbols: \'BTC\'}) pour un logo crypto.'),
      image: z.string().optional().describe('URL image (GRANDE - en bas de l\'embed, pleine largeur). Utilisez list_images({symbols: [\'BTC\', \'ETH\']}) pour plusieurs logos.'),
      authorName: z.string().optional().describe("⚠️ NE supporte PAS les mentions Discord. Utilisez un simple texte comme 'Bot Name' ou 'System'. Pour mentionner un utilisateur, mettez la mention dans la DESCRIPTION."),
      authorUrl: z.string().optional().describe("URL cliquable du nom de l'auteur"),
      authorIcon: z.string().optional().describe("URL icône auteur (PETITE - en haut à gauche, à côté du nom). Utilisez list_images({symbols: 'AAPL'}) pour un logo d'entreprise."),
      footerText: z.string().optional().describe('⚠️ NE supporte PAS les mentions Discord. Utilisez un simple texte. Pour mentionner un utilisateur, mettez la mention dans la DESCRIPTION.'),
      footerIcon: z.string().optional().describe('URL icône footer (PETITE - en bas à gauche, à côté du texte). Utilisez list_images({symbols: \'DISCORD\'}) pour un logo de service.'),
      fields: z.array(z.object({
        name: z.string(),
        value: z.string(),
        inline: z.boolean().optional().default(false),
      })).optional().describe("Champs (supporte | Col1 | Col2 |)"),
      timestamp: z.boolean().optional().default(true).describe('Ajouter timestamp'),
      content: z.string().optional().describe('Message texte supplémentaire'),
      autoTable: z.boolean().optional().default(true).describe('Auto-formater les tableaux'),
      pagination: z.object({
        enabled: z.boolean().optional().default(false),
        maxLength: z.number().optional().default(1000),
        showPageNumber: z.boolean().optional().default(true),
      }).optional().describe('Pagination pour longs contenus'),
      variables: z.record(z.string()).optional().describe('Variables personnalisées {var}'),
      templateName: z.string().optional().describe('Nom du template à utiliser'),
      saveAsTemplate: z.string().optional().describe('Sauvegarder comme template'),
      autoUpdate: z.object({
        enabled: z.boolean().optional().default(false),
        interval: z.number().optional().describe('Intervalle en secondes'),
        source: z.string().optional().describe('Source de données (URL ou fonction)'),
      }).optional().describe('Mise à jour automatique'),
      buttons: z.array(z.object({
        label: z.string(),
        style: z.enum(['Primary', 'Secondary', 'Success', 'Danger']).default('Primary'),
        emoji: z.string().optional(),
        action: z.enum(['none', 'refresh', 'link', 'custom', 'delete', 'edit', 'role', 'modal']).default('none'),
        value: z.string().optional().describe('URL pour action link'),
        roleId: z.string().optional().describe('ID du rôle pour action role (toggle)'),
        custom_id: z.string().describe('🔒 OBLIGATOIRE - ID personnalisé unique pour le bouton (ex: "noel_2024_surprise", "btn_refresh_1"). Cet ID fixe garantit que le bouton fonctionnera toujours même après modification de l\'embed.'),
        persistent: z.boolean().optional().default(false).describe('Si true, le bouton est sauvegardé dans dist/data/ et hooké aux handlers persistants'),
        customData: z.object({
          message: z.string().optional(),
          ephemeral: z.boolean().optional(),
          embed: z.object({
            title: z.string().optional(),
            description: z.string().optional(),
            color: z.number().optional(),
          }).optional(),
          modalTitle: z.string().optional().describe('Titre du modal pour action modal'),
          inputLabel: z.string().optional().describe('Label du champ de saisie modal'),
        }).optional(),
      })).max(5).optional().describe('Boutons intégrés dans l\'embed avec actions configurables'),
      selectMenus: z.array(z.object({
        custom_id: z.string().describe('🔒 OBLIGATOIRE - ID personnalisé unique pour le menu (ex: "menu_select_crypto", "menu_choose_role"). Cet ID fixe garantit que le menu fonctionnera toujours même après modification de l\'embed.'),
        type: z.enum(['string', 'user', 'role', 'channel', 'mentionable']).default('string'),
        placeholder: z.string().optional(),
        minValues: z.number().optional().default(1),
        maxValues: z.number().optional().default(1),
        options: z.array(z.object({
          label: z.string(),
          value: z.string(),
          description: z.string().optional(),
          emoji: z.string().optional(),
        })).optional().describe('Options pour type=string'),
        action: z.enum(['message', 'embed', 'role', 'delete', 'refresh', 'link', 'edit', 'custom', 'modal']).default('message'),
        roleId: z.string().optional().describe('ID du rôle pour action role'),
        url: z.string().optional().describe('URL pour action link'),
        content: z.string().optional().describe('Contenu du message pour action message'),
        template: z.string().optional().describe('Template avec {values} et {user} pour actions message/link'),
        persistent: z.boolean().optional().default(false).describe('Si true, le menu est sauvegardé dans dist/data/'),
        customData: z.object({
          embed: z.object({
            title: z.string().optional(),
            description: z.string().optional(),
            color: z.number().optional(),
          }).optional(),
          handler: z.string().optional().describe('Nom du handler pour action custom'),
          modalId: z.string().optional().describe('ID du modal pour action modal'),
        }).optional(),
      })).max(5).optional().describe('Menus de sélection intégrés dans l\'embed avec actions configurables'),
      progressBars: z.array(z.object({
        fieldIndex: z.number(),
        label: z.string(),
        value: z.number(),
        max: z.number(),
        length: z.number().optional().default(10),
      })).optional().describe('Barres de progression automatiques'),
      gradient: z.object({
        start: z.string().describe('Couleur de début (#RRGGBB)'),
        end: z.string().describe('Couleur de fin (#RRGGBB)'),
      }).optional().describe('Dégradé de couleurs'),
      theme: z.enum(['basic', 'data_report', 'status_update', 'product_showcase', 'leaderboard', 'tech_announcement', 'social_feed', 'dashboard', 'noel', 'minimal']).optional().describe('Thème prédéfini (EXEMPLES À PERSONNALISER - voir EXEMPLES_THEMES_EMBED.md)'),
      enableAnalytics: z.boolean().optional().default(true).describe('Activer le tracking analytics'),
      charts: z.array(z.object({
        type: z.enum(['line', 'bar', 'pie', 'sparkline', 'area']).describe('Type de graphique'),
        title: z.string().describe('Titre du graphique'),
        data: z.array(z.number()).describe('Données du graphique'),
        labels: z.array(z.string()).optional().describe('Labels des données'),
        colors: z.array(z.string()).optional().describe('Couleurs du graphique'),
        size: z.enum(['small', 'medium', 'large']).optional().default('medium').describe('Taille du graphique'),
      })).optional().describe('Graphiques intégrés (ASCII art)'),
      adaptiveLinks: z.array(z.object({
        label: z.string().describe('Texte du lien'),
        url: z.string().describe('URL de base'),
        userSpecific: z.boolean().optional().default(false).describe('Adapter selon l\'utilisateur'),
        webhook: z.string().optional().describe('Webhook à appeler'),
        conditions: z.record(z.string()).optional().describe('Conditions d\'affichage'),
      })).optional().describe('Liens qui s\'adaptent selon l\'utilisateur'),
      layout: z.object({
        type: z.enum(['grid', 'stack', 'sidebar', 'centered', 'masonry']).optional().default('stack').describe('Type de mise en page'),
        columns: z.number().optional().default(2).describe('Nombre de colonnes'),
        spacing: z.enum(['compact', 'normal', 'spacious']).optional().default('normal').describe('Espacement'),
        alignment: z.enum(['left', 'center', 'right']).optional().default('left').describe('Alignement'),
      }).optional().describe('Système de mise en page'),
      visualEffects: z.object({
        animations: z.array(z.enum(['fade_in', 'slide_up', 'pulse', 'glow', 'bounce', 'shimmer'])).optional().describe('Animations CSS'),
        particles: z.boolean().optional().default(false).describe('Activer les particules'),
        transitions: z.boolean().optional().default(true).describe('Transitions fluides'),
        hoverEffects: z.array(z.enum(['scale', 'rotate', 'glow', 'shadow', 'color_shift'])).optional().describe('Effets au survol'),
        intensity: z.enum(['low', 'medium', 'high']).optional().default('medium').describe('Intensité des effets'),
      }).optional().describe('Effets visuels et animations'),
      cryptoLogo: z.object({
        symbol: z.string().describe('Symbole crypto (BTC, ETH, SOL, etc.) - utilise list_images() en interne'),
        position: z.enum(['thumbnail', 'author', 'footer', 'image']).optional().default('thumbnail').describe('Position: thumbnail (haut-droite), author (haut-gauche), image (bas), footer (bas-gauche)'),
        size: z.enum(['small', 'medium', 'large']).optional().default('medium').describe('Taille du logo (note: Discord redimensionne automatiquement selon la position)'),
        format: z.enum(['png', 'svg']).optional().default('png').describe('Format de l\'image'),
      }).optional().describe('RACCOURCI AUTO: Logo crypto depuis cryptologos.cc (évite d\'utiliser list_images séparément). Remplace le paramètre d\'image correspondant à la position.'),
      cryptoList: z.array(z.object({
        symbol: z.string().describe('Symbole crypto'),
        name: z.string().optional().describe('Nom affiché'),
        value: z.string().optional().describe('Valeur/Prix'),
        showLogo: z.boolean().optional().default(true).describe('Afficher le logo'),
      })).optional().describe('Liste de cryptos avec logos'),
      visualDesign: z.object({
        separator: z.enum(['line', 'dots', 'stars', 'arrows', 'wave', 'sparkles', 'fire', 'diamonds']).optional().default('line').describe('Style de séparateur'),
        badge: z.enum(['hot', 'new', 'trending', 'vip', 'verified', 'premium', 'live', 'beta']).optional().describe('Badge visuel'),
        headerStyle: z.enum(['minimal', 'boxed', 'banner', 'neon']).optional().default('minimal').describe('Style de l\'en-tête'),
        showBorders: z.boolean().optional().default(false).describe('Afficher des bordures ASCII'),
      }).optional().describe('Options de design visuel'),
      strictValidation: z.boolean().optional().default(true).describe('Validation stricte 1024 chars'),
      generateCode: z.boolean().optional().default(false).describe('Génère le code TypeScript complet au lieu d\'envoyer l\'embed sur Discord'),
      includeHandler: z.boolean().optional().default(true).describe('Inclut le code de gestion des boutons dans la génération (si generateCode=true)'),
    }),
    execute: async (args) => {
      // ============================================================================
      // 🎯 SYSTÈME D'AIDE INTUITIF POUR AGENTS AVEC PERTE DE MÉMOIRE
      // ============================================================================

      // Si help=true, afficher le guide interactif complet
      if (args.help) {
        const guide = embedHelper.INTERACTIVE_GUIDE.generateGuide(args);
        const example = embedHelper.INTERACTIVE_GUIDE.generateExample(args);

        return `${guide.join('\n')}\n\n💻 **EXEMPLE DE CODE:**\n\`\`\`typescript\n${example}\n\`\`\`\n\n📚 **DOCUMENTATION COMPLÈTE:**\nVoir GUIDE_CREER_EMBED_INTUITIF.md pour tous les exemples !`;
      }

      // Validation intelligente avec conseils
      const validation = embedHelper.INTELLIGENT_VALIDATION.validate(args);
      embedHelper.INTELLIGENT_VALIDATION.displayResults(validation);

      // Afficher le guide interactif si demandé (mode debug)
      if (process.env.EMBED_DEBUG === 'true') {
        const guide = embedHelper.INTERACTIVE_GUIDE.generateGuide(args);
        console.log('\n' + guide.join('\n'));
      }

      // Si erreurs critiques, afficher l'aide et arrêter
      if (!validation.isValid) {
        return `❌ **ERREURS À CORRIGER:**\n\n${validation.errors.join('\n')}\n\n💡 **AIDE:** Utilisez help=true pour voir le guide interactif !`;
      }

      // Afficher les conseils même si valide
      if (validation.warnings.length > 0 || validation.tips.length > 0) {
        console.log('\n📝 Conseils pour améliorer votre embed:');
        validation.warnings.forEach(w => console.log(`   ⚠️ ${w}`));
        validation.tips.forEach(t => console.log(`   💡 ${t}`));
      }

      // ============================================================================
      // GÉNÉRATION DE CODE (MODE GÉNÉRATEUR)
      // ============================================================================
      if (args.generateCode) {
        return generateTypeScriptCode(args);
      }

      // ============================================================================
      // MODE NORMAL (ENVOI SUR DISCORD)
      // ============================================================================
      console.log('[EMBEDS] 🚀 DÉBUT EXECUTION creer_embed');
      console.log('[EMBEDS] Args reçus:', JSON.stringify(args, null, 2));
      try {
        console.error(`🚀 [creer_embed] Titre: ${args.title || 'N/A'}`);
        const client = await ensureDiscordConnection();
        const channel = await client.channels.fetch(args.channelId);

        if (!channel || !('send' in channel)) {
          throw new Error('Canal invalide ou inaccessible');
        }

        let embedData = {};
        if (args.templateName) {
          const template = await loadTemplate(args.templateName);
          if (!template) {
            return `❌ Template '${args.templateName}' non trouvé`;
          }
          embedData = template;
        }

        if (args.theme) {
          // Utilise applyThemeToParams qui contient tous les nouveaux contenus riches
          embedData = applyThemeToParams(args.theme, embedData);
        }

        const embed = new EmbedBuilder();
        const dataToUse = { ...embedData, ...args };

        let titlePrefix = '';
        let descriptionPrefix = '';
        let descriptionSuffix = '';

        if (args.visualDesign) {
          if (args.visualDesign.badge) {
            titlePrefix = `${VISUAL_BADGES[args.visualDesign.badge]} `;
          }

          const separator = VISUAL_SEPARATORS[args.visualDesign.separator || 'line'];
          switch (args.visualDesign.headerStyle) {
            case 'boxed':
              descriptionPrefix = `\`\`\`\n╔══════════════════════════════════╗\n║ \`\`\``;
              descriptionSuffix = `\`\`\`\n╚══════════════════════════════════╝\n\`\`\``;
              break;
            case 'banner':
              descriptionPrefix = `${separator}\n`;
              descriptionSuffix = `\n${separator}`;
              break;
            case 'neon':
              descriptionPrefix = `✨━━━━━━━━━✨\n`;
              descriptionSuffix = `\n✨━━━━━━━━━✨`;
              break;
          }

          if (args.visualDesign.showBorders) {
            descriptionPrefix = `┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓\n┃ `;
            descriptionSuffix = ` ┃\n┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛`;
          }
        }

        // ============================================================================
        // VALIDATION DES MENTIONS DISCORD
        // ============================================================================
        // Valider les mentions dans title et description
        if (dataToUse.title) {
          const validation = validateDiscordMentions(dataToUse.title);
          if (!validation.valid) {
            return generateMentionErrorMessage(validation, 'le titre');
          }
        }

        if (dataToUse.description) {
          const validation = validateDiscordMentions(dataToUse.description);
          if (!validation.valid) {
            return generateMentionErrorMessage(validation, 'la description');
          }
        }

        if (dataToUse.title) embed.setTitle(titlePrefix + replaceVariables(dataToUse.title, args.variables));
        if (dataToUse.description) {
          let description = dataToUse.description;
          if (args.autoTable && description.includes('|')) {
            description = parseTable(description);
          }
          description = descriptionPrefix + replaceVariables(description, args.variables) + descriptionSuffix;
          embed.setDescription(description);
        }

        if (dataToUse.color) {
          if (args.gradient) {
            embed.setColor(args.gradient.start as any);
          } else if (typeof dataToUse.color === 'number') {
            embed.setColor(dataToUse.color);
          } else if (typeof dataToUse.color === 'string') {
            if (dataToUse.color.startsWith('#')) {
              embed.setColor(dataToUse.color as any);
            } else {
              const colorMap: { [key: string]: number } = {
                RED: 0xe74c3c, GREEN: 0x2ecc71, BLUE: 0x3498db, YELLOW: 0xf1c40f,
                PURPLE: 0x9b59b6, ORANGE: 0xe67e22, AQUA: 0x1abc9c, WHITE: 0xffffff,
                BLACK: 0x000000, BLURPLE: 0x5865f2,
              };
              const upperColor = dataToUse.color.toUpperCase().replace(/ /g, '_');
              embed.setColor(colorMap[upperColor] || 0x000000);
            }
          }
        }

        if (dataToUse.url) embed.setURL(dataToUse.url);

        // ============================================================================
        // VÉRIFICATION DES URLs D'IMAGES - REDIRECTION SI EXTERNES
        // ============================================================================

        // Vérifier thumbnail
        if (dataToUse.thumbnail) {
          if (!isLocalLogoUrl(dataToUse.thumbnail)) {
            return generateGuidanceMessage('thumbnail', dataToUse.thumbnail);
          }
          embed.setThumbnail(dataToUse.thumbnail);
        }

        // Vérifier image
        if (dataToUse.image) {
          if (!isLocalLogoUrl(dataToUse.image)) {
            return generateGuidanceMessage('image', dataToUse.image);
          }
          embed.setImage(dataToUse.image);
        }

        if (args.cryptoLogo) {
          const cryptoInfo = getCryptoInfo(args.cryptoLogo.symbol);
          if (cryptoInfo) {
            const logoUrl = args.cryptoLogo.format === 'svg'
              ? cryptoInfo.logo.replace('.png', '.svg')
              : cryptoInfo.logo;

            switch (args.cryptoLogo.position) {
              case 'thumbnail':
                embed.setThumbnail(logoUrl);
                break;
              case 'image':
                embed.setImage(logoUrl);
                break;
              case 'author':
                if (!dataToUse.authorName) {
                  embed.setAuthor({
                    name: `${cryptoInfo.symbol.toUpperCase()} - ${cryptoInfo.name}`,
                    iconURL: logoUrl,
                  });
                } else {
                  embed.setAuthor({
                    name: replaceVariables(dataToUse.authorName, args.variables),
                    url: dataToUse.authorUrl,
                    iconURL: logoUrl,
                  });
                }
                break;
              case 'footer':
                if (!dataToUse.footerText) {
                  embed.setFooter({
                    text: `${cryptoInfo.symbol.toUpperCase()} | cryptologos.cc`,
                    iconURL: logoUrl,
                  });
                }
                break;
            }
          }
        }

        // ============================================================================
        // CONVERSION AUTOMATIQUE SVG → PNG
        // Discord ne supporte pas les SVG, on les convertit automatiquement
        // ============================================================================

        // Collection des fichiers à attacher (PNG convertis depuis SVG)
        const attachmentsToUpload: Map<string, string> = new Map(); // attachmentName -> filePath

        // Convertir authorIcon SVG → PNG
        if (dataToUse.authorIcon && checkIsSvgUrl(dataToUse.authorIcon)) {
          Logger.info(`[EMBED] Converting authorIcon SVG to PNG: ${dataToUse.authorIcon}`);
          try {
            const pngData = await convertSvgUrlToPng(dataToUse.authorIcon, 64);
            dataToUse.authorIcon = pngData.attachmentUrl; // attachment://filename.png
            attachmentsToUpload.set(pngData.attachmentName, pngData.path);
            Logger.info(`[EMBED] authorIcon converted to: ${pngData.attachmentUrl}`);
          } catch (error) {
            Logger.error(`[EMBED] Failed to convert authorIcon:`, error);
            return `❌ Erreur lors de la conversion SVG→PNG pour authorIcon: ${error}`;
          }
        }

        // Convertir footerIcon SVG → PNG
        if (dataToUse.footerIcon && checkIsSvgUrl(dataToUse.footerIcon)) {
          Logger.info(`[EMBED] Converting footerIcon SVG to PNG: ${dataToUse.footerIcon}`);
          try {
            const pngData = await convertSvgUrlToPng(dataToUse.footerIcon, 64);
            dataToUse.footerIcon = pngData.attachmentUrl; // attachment://filename.png
            attachmentsToUpload.set(pngData.attachmentName, pngData.path);
            Logger.info(`[EMBED] footerIcon converted to: ${pngData.attachmentUrl}`);
          } catch (error) {
            Logger.error(`[EMBED] Failed to convert footerIcon:`, error);
            return `❌ Erreur lors de la conversion SVG→PNG pour footerIcon: ${error}`;
          }
        }

        // Convertir thumbnail SVG → PNG (optionnel, Discord supporte SVG pour thumbnail)
        // if (dataToUse.thumbnail && checkIsSvgUrl(dataToUse.thumbnail)) {
        //   Logger.info(`[EMBED] Converting thumbnail SVG to PNG: ${dataToUse.thumbnail}`);
        //   try {
        //     const pngData = await convertSvgUrlToPng(dataToUse.thumbnail, 256);
        //     dataToUse.thumbnail = pngData.attachmentUrl;
        //     attachmentsToUpload.set(pngData.attachmentName, pngData.path);
        //     Logger.info(`[EMBED] thumbnail converted to: ${pngData.attachmentUrl}`);
        //   } catch (error) {
        //     Logger.error(`[EMBED] Failed to convert thumbnail:`, error);
        //   }
        // }

        // ============================================================================
        // VALIDATION DES DOMAINES DE CONFIANCE (après conversion SVG)
        // ============================================================================

        // Vérifier authorIcon (domaine de confiance)
        if (dataToUse.authorIcon) {
          if (!isLocalLogoUrl(dataToUse.authorIcon) && !dataToUse.authorIcon.startsWith('attachment://')) {
            return generateGuidanceMessage('authorIcon', dataToUse.authorIcon);
          }
        }

        // Vérifier footerIcon (domaine de confiance)
        if (dataToUse.footerIcon) {
          if (!isLocalLogoUrl(dataToUse.footerIcon) && !dataToUse.footerIcon.startsWith('attachment://')) {
            return generateGuidanceMessage('footerIcon', dataToUse.footerIcon);
          }
        }

        if (dataToUse.authorName) {
          embed.setAuthor({
            name: replaceVariables(dataToUse.authorName, args.variables),
            url: dataToUse.authorUrl,
            iconURL: dataToUse.authorIcon,
          });
        }

        if (dataToUse.footerText) {
          let footerText = replaceVariables(dataToUse.footerText, args.variables);
          if (args.gradient) {
            footerText += ` | Gradient: ${args.gradient.start} → ${args.gradient.end}`;
          }
          embed.setFooter({
            text: footerText,
            iconURL: dataToUse.footerIcon,
          });
        }

        let processedFields = dataToUse.fields || [];

        if (args.charts && args.charts.length > 0) {
          args.charts.forEach((chart, index) => {
            const asciiChart = generateAsciiChart(chart.type, chart.data, chart.labels, {
              height: chart.size === 'small' ? 5 : chart.size === 'large' ? 15 : 10
            });
            processedFields.push({
              name: `📊 ${chart.title}`,
              value: asciiChart,
              inline: chart.size === 'small',
            });
          });
        }

        if (args.adaptiveLinks && args.adaptiveLinks.length > 0) {
          const linksText = args.adaptiveLinks.map(link =>
            adaptLinkForUser(link, 'USER_ID')
          ).join('\n');
          processedFields.push({
            name: '🔗 Liens',
            value: linksText,
            inline: false,
          });
        }

        if (args.progressBars && args.progressBars.length > 0) {
          args.progressBars.forEach(progress => {
            const bar = createProgressBar(progress.value, progress.max, progress.length);
            const percentage = Math.round((progress.value / progress.max) * 100);
            processedFields.push({
              name: `${progress.label}`,
              value: `${bar} ${percentage}% (${progress.value}/${progress.max})`,
              inline: false,
            });
          });
        }

        if (args.layout) {
          processedFields = applyLayout(processedFields, args.layout);
        }

        processedFields = processedFields.map(field => ({
          ...field,
          name: replaceVariables(field.name, args.variables),
          value: args.autoTable && field.value.includes('|')
            ? parseTable(field.value)
            : replaceVariables(field.value, args.variables),
        }));

        if (args.visualEffects) {
          const effectsDesc = generateVisualEffectsDescription(args.visualEffects);
          if (effectsDesc) {
            processedFields.push({
              name: '🌟 Effets Visuels',
              value: effectsDesc,
              inline: false,
            });
          }
        }

        if (args.cryptoList && args.cryptoList.length > 0) {
          const cryptoLines = args.cryptoList.map((crypto, index) => {
            const cryptoInfo = getCryptoInfo(crypto.symbol);
            const displayName = crypto.name || cryptoInfo?.name || crypto.symbol;
            const logoLink = cryptoInfo ? `[Logo](${cryptoInfo.logo})` : '';
            const value = crypto.value ? ` - ${crypto.value}` : '';

            return `${index + 1}. **${displayName.charAt(0).toUpperCase() + displayName.slice(1)}** (${crypto.symbol.toUpperCase()})${value}\n${crypto.showLogo !== false ? `   ${logoLink}` : ''}`;
          });

          processedFields.push({
            name: '🪙 Crypto-monnaies',
            value: cryptoLines.join('\n'),
            inline: false,
          });
        }

        if (processedFields.length > 0) {
          processedFields.forEach(field => {
            embed.addFields({
              name: field.name,
              value: field.value,
              inline: field.inline || false,
            });
          });
        }

        if (dataToUse.timestamp !== false) {
          embed.setTimestamp();
        }

        if (args.strictValidation) {
          const validation = validateFieldLength(processedFields);
          if (validation.warnings.length > 0) {
            console.warn('⚠️ Avertissements:', validation.warnings);
          }
        }

        if (args.saveAsTemplate) {
          await saveTemplate(args.saveAsTemplate, embed.data);
          console.log(`💾 Template '${args.saveAsTemplate}' sauvegardé`);
        }

        const embedId = `embed_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        const components: any[] = [];
        const buttonIds: string[] = [];

        if (args.buttons && args.buttons.length > 0) {
          const styleMap: Record<string, any> = {
            Primary: ButtonStyle.Primary,
            Secondary: ButtonStyle.Secondary,
            Success: ButtonStyle.Success,
            Danger: ButtonStyle.Danger,
          };

          const row = new ActionRowBuilder<ButtonBuilder>();

          // Charger les boutons existants pour y ajouter les nouveaux
          const buttonsMap = await loadCustomButtons();

          for (let index = 0; index < args.buttons.length; index++) {
            const btn = args.buttons[index];
            // Créer un ID unique pour le bouton
            // 1. Si custom_id fourni → utilise l'ID fixe personnalisé
            // 2. Si persistant: pb_<messageId>_<index>
            // 3. Si standard: embedv2_<embedId>_<action>_<timestamp>_<random>
            const buttonId = btn.custom_id
              ? btn.custom_id // ID personnalisé fixe
              : btn.persistent
                ? `pb_TEMP_${index}_${Date.now()}` // TEMP sera remplacé par le vrai messageId après envoi
                : `embedv2_${embedId}_${btn.action}_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;

            const button = new ButtonBuilder()
              .setLabel(btn.label);

            if (btn.action === 'link' && btn.value) {
              button.setStyle(ButtonStyle.Link);
              button.setURL(btn.value);
            } else {
              button.setCustomId(buttonId);
              button.setStyle(styleMap[btn.style] || ButtonStyle.Primary);
            }

            if (btn.emoji) {
              button.setEmoji(btn.emoji);
            }

            row.addComponents(button);
            buttonIds.push(buttonId);

            // 🔒 Bouton PERSISTANT → Sauvegarder dans dist/data/
            if (btn.persistent) {
              const persistentBtn: PersistentButton = {
                id: buttonId,
                messageId: '', // Sera mis à jour après l'envoi
                channelId: args.channelId,
                label: btn.label,
                style: btn.style,
                emoji: btn.emoji,
                action: buildButtonActionFromCreerEmbed(btn),
                createdAt: new Date().toISOString(),
              };
              await upsertPersistentButton(persistentBtn);
              console.log(`[EMBEDS] 🔒 Bouton persistant créé: ${buttonId} → ${btn.label}`);
            }

            // Bouton STANDARD → Sauvegarder dans l'ancien système (compatibilité)
            if (!btn.persistent) {
              const buttonToSave = {
                id: buttonId,
                messageId: '', // Sera mis à jour après l'envoi du message
                channelId: args.channelId,
                label: btn.label,
                action: {
                  type: btn.action,
                  data: {
                    value: btn.value,
                    emoji: btn.emoji,
                    // Inclure customData pour les boutons custom
                    ...btn.customData,
                  },
                },
                createdAt: new Date(),
              };
              buttonsMap.set(buttonId, buttonToSave);
            }
          }

          // Sauvegarder les boutons standards dans l'ancien système
          if (buttonsMap.size > 0) {
            await saveCustomButtons(buttonsMap);
          }

          // Rafraîchir le cache du gestionnaire d'interactions
          await interactionHandler.refreshButtons();

          const persistentCount = args.buttons.filter(b => b.persistent).length;
          const standardCount = args.buttons.length - persistentCount;
          console.log(`[EMBEDS] ${args.buttons.length} bouton(s) créé(s): ${persistentCount} persistant(s), ${standardCount} standard(s)`);

          components.push(row);
        }

        // GESTION DES SELECT MENUS (y compris persistants)
        if (args.selectMenus && args.selectMenus.length > 0) {
          for (let menuIndex = 0; menuIndex < args.selectMenus.length; menuIndex++) {
            const menu = args.selectMenus[menuIndex];
            // 1. Si custom_id fourni → utilise l'ID fixe personnalisé (OBLIGATOIRE)
            // 2. Si persistant: pm_<messageId>_<index>
            // 3. Si standard: embedv2_menu_<embedId>_<action>_<timestamp>_<random>
            const menuId = menu.custom_id
              ? menu.custom_id // ID personnalisé fixe (OBLIGATOIRE)
              : menu.persistent
                ? `pm_TEMP_${menuIndex}_${Date.now()}`
                : `embedv2_menu_${embedId}_${menu.action}_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;

            // Créer le menu selon le type
            let selectMenu: any;

            if (menu.type === 'string') {
              selectMenu = new StringSelectMenuBuilder()
                .setCustomId(menuId)
                .setPlaceholder(menu.placeholder || 'Sélectionnez une option')
                .setMinValues(menu.minValues ?? 1)
                .setMaxValues(menu.maxValues ?? 1);

              // Ajouter les options si fournies
              if (menu.options && menu.options.length > 0) {
                menu.options.forEach(opt => {
                  const option = new StringSelectMenuOptionBuilder()
                    .setLabel(opt.label)
                    .setValue(opt.value);

                  if (opt.description) option.setDescription(opt.description);
                  if (opt.emoji) option.setEmoji(opt.emoji);

                  (selectMenu as StringSelectMenuBuilder).addOptions(option);
                });
              }
            } else {
              // Pour les autres types (user, role, channel, mentionable)
              // Note: nécessiterait des imports supplémentaires et builders spécifiques
              selectMenu = new StringSelectMenuBuilder()
                .setCustomId(menuId)
                .setPlaceholder(menu.placeholder || 'Sélectionnez')
                .setMinValues(menu.minValues ?? 1)
                .setMaxValues(menu.maxValues ?? 1);
            }

            const menuRow = new ActionRowBuilder<any>().addComponents(selectMenu);
            components.push(menuRow);

            // 🔒 MENU PERSISTANT → Sauvegarder dans dist/data/
            if (menu.persistent) {
              const persistentMenu: PersistentSelectMenu = {
                id: menuId,
                messageId: '', // Sera mis à jour après l'envoi
                channelId: args.channelId,
                type: menu.type,
                placeholder: menu.placeholder,
                minValues: menu.minValues,
                maxValues: menu.maxValues,
                options: menu.options as any,
                action: buildMenuActionFromCreerEmbed(menu),
                createdAt: new Date().toISOString(),
              };
              await upsertPersistentMenu(persistentMenu);
              console.log(`[EMBEDS] 🔒 Menu persistant créé: ${menuId} → ${menu.action}`);
            }
          }

          const menuPersistentCount = args.selectMenus.filter(m => m.persistent).length;
          const menuStandardCount = args.selectMenus.length - menuPersistentCount;
          console.log(`[EMBEDS] ${args.selectMenus.length} menu(s) créé(s): ${menuPersistentCount} persistant(s), ${menuStandardCount} standard(s)`);
        }

        if (args.adaptiveLinks && args.adaptiveLinks.length > 0) {
          const linkRow = new ActionRowBuilder<ButtonBuilder>();

          args.adaptiveLinks.slice(0, 5).forEach((link) => {
            const button = new ButtonBuilder()
              .setLabel(link.label)
              .setStyle(ButtonStyle.Link)
              .setURL(link.url);

            if (link.userSpecific) {
              button.setURL(link.url + '?user=USER_ID');
            }

            linkRow.addComponents(button);
          });

          if (linkRow.components.length > 0) {
            components.push(linkRow);
          }
        }

        // Préparer les fichiers attachment si des SVG ont été convertis
        const attachmentFiles = attachmentsToUpload.size > 0
          ? Array.from(attachmentsToUpload.entries()).map(([name, path]) => ({
              attachment: path,
              name: name
            }))
          : undefined;

        const message = await channel.send({
          content: args.content,
          embeds: [embed],
          components: components.length > 0 ? components : undefined,
          files: attachmentFiles,
        });

        console.log(`[EMBEDS] Message envoyé avec ID: ${message.id}`);

        // Mettre à jour les messageId des boutons embed
        if (args.buttons && args.buttons.length > 0) {
          console.log(`[EMBEDS] Mise à jour des messageId pour ${args.buttons.length} bouton(s)`);

          // Charger les boutons depuis la persistance
          const buttonsMap = await loadCustomButtons();

          // Mettre à jour le messageId pour chaque bouton créé
          for (const btn of args.buttons) {
            // Récupérer l'ID du bouton (soit custom_id, soit l'ID généré)
            const buttonId = btn.custom_id || buttonIds[args.buttons.indexOf(btn)];
            if (buttonId) {
              const buttonData = buttonsMap.get(buttonId);
              if (buttonData) {
                buttonData.messageId = message.id;
                buttonsMap.set(buttonId, buttonData);
                console.log(`[EMBEDS] messageId mis à jour pour ${buttonId} -> ${message.id}`);
              } else {
                console.error(`[EMBEDS] ERREUR: Bouton ${buttonId} non trouvé dans la persistance!`);
              }
            }
          }

          // Sauvegarder les modifications
          await saveCustomButtons(buttonsMap);
          await interactionHandler.refreshButtons();
          console.log(`[EMBEDS] Sauvegarde finalisée`);
        }

        // Mettre à jour les messageId des menus persistants
        if (args.selectMenus && args.selectMenus.length > 0) {
          console.log(`[EMBEDS] Mise à jour des messageId pour ${args.selectMenus.length} menu(s) persistant(s)`);

          const { loadPersistentMenus, savePersistentMenus, upsertPersistentMenu } = await import('../utils/distPersistence.js');

          // Charger tous les menus persistants
          const allMenus = await loadPersistentMenus();

          // Trouver et mettre à jour les menus avec TEMP dans leur ID
          for (const [menuId, menuData] of allMenus.entries()) {
            if (menuId.includes('TEMP_') && menuData.channelId === args.channelId) {
              const newMenuId = menuId.replace('TEMP_', message.id + '_');
              menuData.id = newMenuId;
              menuData.messageId = message.id;
              await upsertPersistentMenu(menuData);

              // Supprimer l'ancienne entrée avec TEMP
              allMenus.delete(menuId);

              console.log(`[EMBEDS] Menu persistant mis à jour: ${menuId} → ${newMenuId}`);
            }
          }
        }

        if (args.autoUpdate?.enabled) {
          autoUpdateEmbeds.set(embedId, {
            messageId: message.id,
            channelId: args.channelId,
            embedData: args,
            interval: args.autoUpdate.interval || 60,
            lastUpdate: Date.now(),
            source: args.autoUpdate.source,
            updateCount: 0,
          });
        }

        if (args.enableAnalytics) {
          embedAnalytics.set(embedId, {
            views: 0,
            clicks: 0,
            lastInteraction: Date.now(),
            reactions: new Map(),
          });
        }

        return `✅ Embed créé | ID: ${message.id} | EmbedId: ${embedId}${args.autoUpdate?.enabled ? ' | Auto-update: ON' : ''}${args.saveAsTemplate ? ` | Template: ${args.saveAsTemplate}` : ''}`;
      } catch (error: any) {
        console.error(`❌ [creer_embed]`, error.message);
        return `❌ Erreur: ${error.message}`;
      }
    },
  });

  // 2. Get Embed Analytics
  server.addTool({
    name: 'get_embed_analytics',
    description: 'Obtenir les analytics d\'un embed spécifique',
    parameters: z.object({
      embedId: z.string().describe('ID du message embed'),
    }),
    execute: async (args) => {
      try {
        const report = generateAnalyticsReport(args.embedId);
        return report;
      } catch (error: any) {
        return `❌ Erreur: ${error.message}`;
      }
    },
  });

  // 3. List Auto Update Embeds
  server.addTool({
    name: 'list_auto_update_embeds',
    description: 'Lister tous les embeds avec auto-update actif',
    parameters: z.object({}),
    execute: async () => {
      try {
        const embeds = Array.from(autoUpdateEmbeds.entries()).map(([id, info]) => {
          const timeSinceUpdate = Date.now() - info.lastUpdate;
          const nextUpdateIn = Math.max(0, (info.interval * 1000) - timeSinceUpdate);
          return `• ${id}
  📅 Créé: ${new Date(info.lastUpdate).toLocaleString('fr-FR')}
  🔄 Intervalle: ${info.interval}s
  ⏭️ Prochaine MAJ: ${Math.ceil(nextUpdateIn / 1000)}s
  📊 MAJ effectuées: ${info.updateCount}
  💬 Canal: ${info.channelId}`;
        });

        if (embeds.length === 0) {
          return 'ℹ️ Aucun embed avec auto-update actif';
        }

        return `🔄 **${embeds.length} embed(s) avec auto-update:**\n\n${embeds.join('\n\n')}`;
      } catch (error: any) {
        return `❌ Erreur: ${error.message}`;
      }
    },
  });

  // 4. Stop Embed Auto Update
  server.addTool({
    name: 'stop_embed_auto_update',
    description: 'Arrêter l\'auto-update d\'un embed',
    parameters: z.object({
      embedId: z.string().describe('ID du message embed'),
    }),
    execute: async (args) => {
      try {
        if (autoUpdateEmbeds.has(args.embedId)) {
          autoUpdateEmbeds.delete(args.embedId);
          return `✅ Auto-update désactivé pour l'embed ${args.embedId}`;
        } else {
          return `ℹ️ Aucun auto-update trouvé pour l'embed ${args.embedId}`;
        }
      } catch (error: any) {
        return `❌ Erreur: ${error.message}`;
      }
    },
  });

  console.log('[EMBEDS] === FIN ENREGISTREMENT DES OUTILS EMBEDS ===');
}
