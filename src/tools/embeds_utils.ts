import * as fs from 'fs';
import * as path from 'path';

// ============================================================================
// FONCTIONS UTILITAIRES
// ============================================================================

type MentionErrorType = 'user' | 'channel' | 'role' | 'unknown';

function analyzeInvalidMention(mention: string): MentionErrorType {
  if (mention.startsWith('<@') || mention.startsWith('<@!')) return 'user';
  if (mention.startsWith('<#')) return 'channel';
  if (mention.startsWith('<@&')) return 'role';
  return 'unknown';
}

export function validateDiscordMentions(text: string): {
  valid: boolean;
  errors: { user: string[]; channel: string[]; role: string[]; other: string[] };
  allInvalid: string[];
} {
  const mentionPattern = /<[@!&][^>]+>/g;
  const mentions = text.match(mentionPattern) || [];
  const errors = {
    user: [] as string[],
    channel: [] as string[],
    role: [] as string[],
    other: [] as string[],
  };

  const validFormats = [
    { pattern: /^<@\d+>$/, type: 'user' },
    { pattern: /^<@!\d+>$/, type: 'user' },
    { pattern: /^<#\d+>$/, type: 'channel' },
    { pattern: /^<@&\d+>$/, type: 'role' },
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
      if (errorType === 'user') errors.user.push(mention);
      else if (errorType === 'channel') errors.channel.push(mention);
      else if (errorType === 'role') errors.role.push(mention);
      else errors.other.push(mention);
    }
  }

  const allInvalid = [...errors.user, ...errors.channel, ...errors.role, ...errors.other];
  return { valid: allInvalid.length === 0, errors, allInvalid };
}

export function generateMentionErrorMessage(validation: any, fieldName: string): string {
  const message = `❌ **Format de mention invalide détecté dans ${fieldName} !**\n\n`;
  const parts: string[] = [];
  if (validation.errors.user.length > 0)
    parts.push(`**Utilisateurs:** ${validation.errors.user.join(', ')}`);
  if (validation.errors.channel.length > 0)
    parts.push(`**Canaux:** ${validation.errors.channel.join(', ')}`);
  if (validation.errors.role.length > 0)
    parts.push(`**Rôles:** ${validation.errors.role.join(', ')}`);
  if (validation.errors.other.length > 0)
    parts.push(`**Inconnus:** ${validation.errors.other.join(', ')}`);
  return message + parts.join('\n') + `\n\n💡 Utilisez les IDs réels de Discord !`;
}

export function replaceVariables(text: string, variables: Record<string, string> = {}): string {
  if (!text) return '';
  let result = String(text);
  const now = new Date();
  const autoVars: Record<string, string> = {
    '{timestamp}': now.toLocaleString('fr-FR'),
    '{date}': now.toLocaleDateString('fr-FR'),
    '{time}': now.toLocaleTimeString('fr-FR'),
    '{year}': now.getFullYear().toString(),
  };

  for (const [key, value] of Object.entries(autoVars)) {
    result = result.split(key).join(value);
  }

  if (variables) {
    for (const [key, value] of Object.entries(variables)) {
      result = result.split(`{${key}}`).join(String(value));
    }
  }

  return result
    .split('\\n')
    .join('\n')
    .replace(/{spoiler:([^}]+)}/g, '|| $1 ||');
}

function generateProgressBar(percent: number, length: number = 10): string {
  const filled = Math.round((length * percent) / 100);
  return `\`${'█'.repeat(filled)}${'░'.repeat(length - filled)}\` **${percent}%**`;
}

function formatTags(tags: string[] | undefined): string {
  if (!tags || tags.length === 0) return '';
  return tags.map(t => `\`[${t.toUpperCase()}]\``).join(' ');
}

// ============================================================================
// SYSTEME DE THEMES ARTISTIQUES
// ============================================================================

export function applyTheme(theme: string | undefined, args: any): any {
  if (!theme) return args;

  const themedArgs = { ...args };
  const opts = args.themeOptions || {};
  const isCompact = opts.compact === true;
  if (!themedArgs.fields) themedArgs.fields = [];

  switch (theme) {
    case 'cyber_code':
      themedArgs.color = 0x00ff00;
      themedArgs.title = themedArgs.title || '⚡ CYBER_CORE_V3';
      themedArgs.authorName = '⚡ NEURAL_LINK_ESTABLISHED';
      themedArgs.footerText = '💾 [KERNEL_V3.1] -- SECURE_SYNC';
      let cyberDesc =
        opts.terminal && !isCompact
          ? '```ansi\n [1;32m[0.00s] [0m Booting... OK\n [1;32m[0.05s] [0m Sync... [1;34m' +
            (opts.progress || 100) +
            '% [0m\n```\n'
          : '';
      if (opts.code) {
        const lang = opts.language || 'typescript';
        cyberDesc += `**💻 SOURCE:**\n\`\`\`${opts.diff ? 'diff\n' : lang + '\n'}${opts.code}\`\`\``;
      }
      if (opts.progress !== undefined)
        cyberDesc += `\n**LOAD:** ${generateProgressBar(opts.progress)}`;
      themedArgs.description =
        `${formatTags(opts.tags)}\n${cyberDesc}\n${themedArgs.description || ''}`.trim();
      break;

    case 'sentinel_alpha':
      themedArgs.color = 0xffd700;
      themedArgs.title = themedArgs.title || '🚨 SENTINEL_ALPHA_SIGNAL';
      themedArgs.authorName = '🚨 PREDICTIVE_ENGINE';
      themedArgs.footerText = '⚠️ FINANCIAL_ALPHA -- RATIO: 1:3.5';
      const symbol = opts.symbol || 'GLOBAL';
      themedArgs.description = `
${formatTags(opts.tags)}
# 📉 SIGNAL: ${symbol}
\`\`\`ansi
 [1;33m[ALPHA] High conviction detected [0m
 [1;35m[VOLATILITY] ${opts.priority === 'critical' ? '🚨 EXTREME' : '✅ STABLE'} [0m
\`\`\`
**ANALYSE:** ${themedArgs.description || 'Breakout imminent.'}
${opts.progress !== undefined ? `**CONVICTION:** ${generateProgressBar(opts.progress)}` : ''}
`.trim();
      break;

    case 'deep_logic':
      themedArgs.color = 0x2c3e50;
      themedArgs.title = themedArgs.title || '🧠 NEURAL_LOGIC_CHAIN';
      themedArgs.authorName = '🧠 COGNITIVE_ENGINE';
      themedArgs.footerText = '⚙️ LOGIC_STRICT -- VERIFIED';
      const logicBlock = opts.code
        ? `**THOUGHTS:**\n\`\`\`ansi\n [1;34m<thinking> [0m\n${opts.code}\n [1;34m</thinking> [0m\n\`\`\`\n`
        : '';
      themedArgs.description =
        `${formatTags(opts.tags)}\n${logicBlock}\n**CONCLUSION:** ${themedArgs.description || 'Logic solved.'}\n${opts.progress !== undefined ? generateProgressBar(opts.progress, 15) : ''}`.trim();
      break;

    case 'matrix_rain':
      themedArgs.color = 0x00ff41;
      themedArgs.title = themedArgs.title || '🕶️ AGENT_TERMINAL';
      themedArgs.authorName = '🕶️ SYSTEM_ARCHITECT';
      themedArgs.footerText = '🐇 FOLLOW_THE_WHITE_RABBIT';
      const m = '日한㐗01アイウエオカキクケコサシスセソタチツテト';
      const r = () =>
        Array(isCompact ? 10 : 20)
          .fill(0)
          .map(() => m[Math.floor(Math.random() * m.length)])
          .join(' ');
      themedArgs.description =
        `${formatTags(opts.tags)}\n\`\`\`ansi\n [1;32m${r()} [0m\n [1;32m> ${themedArgs.description || 'Wake up...'} [0m\n [1;32m${r()} [0m\n\`\`\`\n${opts.code ? `\`\`\`${opts.language || 'text'}\n${opts.code}\n\`\`\`` : ''}`.trim();
      break;

    case 'trading_master':
      themedArgs.color = 0x00ffa3;
      themedArgs.title = themedArgs.title || '📊 QUANT_TRADING_HUB';
      themedArgs.authorName = '💰 LIQUIDITY_SCANNER';
      themedArgs.footerText = `📊 ${opts.symbol || 'MARKET'} -- BULLISH`;
      themedArgs.description = `
${formatTags(opts.tags)}
# 💰 OPPORTUNITY: ${opts.symbol || 'ASSET'}
**MOMENTUM:** ${themedArgs.description || 'Bullish flow detected.'}
${opts.progress !== undefined ? `**PRESSURE:** ${generateProgressBar(opts.progress)}` : ''}
`.trim();
      if (!isCompact && themedArgs.fields.length === 0) {
        themedArgs.fields = [
          { name: '🚀 Entry', value: 'Market', inline: true },
          { name: '🎯 Target', value: '$XXX', inline: true },
          { name: '🛡️ Stop', value: '$YYY', inline: true },
        ];
      }
      break;

    case 'mcp':
      themedArgs.color = 0x0ea5e9;
      themedArgs.title = themedArgs.title || '🔌 MCP_STATION_ACTIVE';
      themedArgs.footerText = '🛠️ HANDSHAKE_OK -- 12ms';
      const mcpLog = opts.code
        ? `**STREAM:**\n\`\`\`json\n${opts.code}\n\`\`\``
        : '```ansi\n [1;34m[BRIDGE] Connected [0m\n```';
      themedArgs.description =
        `${formatTags(opts.tags)}\n${mcpLog}\n**RAG:** 🟢 Online (${opts.progress || 100}%)`.trim();
      break;

    case 'claude_code':
      themedArgs.color = 0xd97757;
      themedArgs.authorName = '🤖 Claude v3.5 Sonnet';
      themedArgs.footerText = '💻 High performance Engineering';
      const codeContent = opts.code
        ? `I have implemented it:\n\`\`\`${opts.language || 'typescript'}\n${opts.code}\n\`\`\``
        : themedArgs.description || 'Ready.';
      themedArgs.description = `${formatTags(opts.tags)}\n${codeContent}`.trim();
      break;

    case 'nebula_vision':
      themedArgs.color = 0x8e44ad;
      themedArgs.authorName = '🌌 COSMIC_AI';
      themedArgs.footerText = '✨ BEYOND_THE_VOID';
      themedArgs.description =
        `## ✨ Exploration Nebula\n${themedArgs.description || 'Latent structures emerging.'}\n${opts.progress !== undefined ? generateProgressBar(opts.progress) : ''}`.trim();
      break;

    case 'data_report':
      themedArgs.color = 0x27ae60;
      themedArgs.authorName = '📊 DATA_SERVER';
      themedArgs.footerText = '📈 SYNC_COMPLETE';
      themedArgs.description =
        `## 📈 Report\n${themedArgs.description || 'Metrics analysis.'}\n${opts.progress !== undefined ? generateProgressBar(opts.progress) : ''}`.trim();
      if (!isCompact && themedArgs.fields.length === 0)
        themedArgs.fields = [
          { name: 'Status', value: 'Stable', inline: true },
          { name: 'Load', value: '45%', inline: true },
        ];
      break;

    case 'status_update':
      const colors: any = { online: 0x2ecc71, offline: 0xe74c3c, maintenance: 0xf1c40f };
      themedArgs.color = colors[opts.status] || 0x3498db;
      themedArgs.authorName = '🔄 HEALTH_MONITOR';
      themedArgs.footerText = '📍 NODE_ALPHA_01';
      themedArgs.description =
        `### ${opts.status === 'online' ? '🟢' : '🔴'} System Status\n${opts.code ? `\`\`\`bash\n${opts.code}\n\`\`\`` : '✅ Operational.'}`.trim();
      break;

    case 'halloween':
      themedArgs.color = 0xd35400;
      themedArgs.authorName = '🎃 SPIRIT_GATE';
      themedArgs.footerText = '⚰️ THE_GRAVE_OPENTS';
      themedArgs.description =
        `\`\`\`ansi\n [1;31m[BLOOD] Corruption: ${opts.progress || 66}% [0m\n [1;33m[ENTITY] 🧛 💀 ⚰️ [0m\n\`\`\`\n${themedArgs.description || 'Shadows rising.'}`.trim();
      break;

    case 'minimal':
      themedArgs.color = 0x2c3e50;
      themedArgs.authorName = '▫️ MINIMAL';
      if (opts.code)
        themedArgs.description = `\`\`\`${opts.language || 'text'}\n${opts.code}\n\`\`\``;
      break;
  }

  return themedArgs;
}

export function validateFieldLength(
  fields: any[],
  title?: string,
  description?: string,
  footerText?: string
): { valid: boolean; warnings: string[]; totalLength: number } {
  let total = (title?.length || 0) + (description?.length || 0) + (footerText?.length || 0);
  const warnings: string[] = [];
  fields?.forEach((f, i) => {
    total += (f.name?.length || 0) + (f.value?.length || 0);
    if ((f.name?.length || 0) > 256) warnings.push(`⚠️ Champ #${i + 1}: Nom trop long`);
    if ((f.value?.length || 0) > 1024) warnings.push(`⚠️ Champ #${i + 1}: Valeur trop long`);
  });
  if (total > 6000) warnings.push('🛑 TOTAL: > 6000 caractères');
  return { valid: warnings.length === 0, warnings, totalLength: total };
}

export function generateAsciiChart(
  type: string,
  data: number[],
  labels?: string[],
  options: any = {}
): string {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min;
  if (type === 'sparkline') {
    const points = data.map(v => '▁▂▃▄▅▆▇█'[Math.min(Math.round(((v - min) / range) * 7), 7)]);
    return `\`\`\`\n${points.join('')}\n\`\`\``;
  }
  return 'Graphique non supporté';
}

export function createProgressBar(value: number, max: number, length: number = 10): string {
  const percentage = Math.min((value / max) * 100, 100);
  const filled = Math.round((percentage / 100) * length);
  const empty = length - filled;
  return '█'.repeat(filled) + '░'.repeat(empty);
}

export async function saveTemplate(name: string, embedData: any): Promise<void> {
  const templatesPath = path.join(process.cwd(), 'embed-templates.json');
  let templates: Record<string, any> = {};
  try {
    const content = await fs.promises.readFile(templatesPath, 'utf-8');
    templates = JSON.parse(content);
  } catch (e) {}
  templates[name] = embedData;
  await fs.promises.writeFile(templatesPath, JSON.stringify(templates, null, 2));
}

export async function loadTemplate(name: string): Promise<any | null> {
  const templatesPath = path.join(process.cwd(), 'embed-templates.json');
  try {
    const content = await fs.promises.readFile(templatesPath, 'utf-8');
    const templates = JSON.parse(content);
    return templates[name] || null;
  } catch (e) {
    return null;
  }
}

export function adaptLinkForUser(link: any, userId: string): string {
  let adaptedUrl = link.url;
  if (link.userSpecific) adaptedUrl += `?user=${userId}&ref=discord`;
  return `[${link.label}](${adaptedUrl})`;
}

export function applyLayout(fields: any[], layout: any): any[] {
  return fields;
}

export function generateVisualEffectsDescription(effects: any): string {
  return '';
}

export function parseTable(tableText: string): string {
  return tableText;
}

// ============================================================================
// GUIDANCE MESSAGES - Images dans les embeds Discord
// ============================================================================

// Les 4 positions d'images dans un embed Discord:
// ┌──────────────────────────────────────────────┐
// │ [authorIcon 16x16]  authorName                │ ← authorIcon (haut-gauche, minuscule)
// │                                              │
// │  description                                 │
// │                                              │
// │  ┌─────────┐                                 │
// │  │thumbnail│  field: value                  │ ← thumbnail (haut-droite, ~80x80)
// │  │ 80x80   │                                 │
// │  └─────────┘                                 │
// │                                              │
// │  field: value                                │
// │                                              │
// │  [footerIcon 16x16] footerText               │ ← footerIcon (bas-gauche, minuscule)
// │                    ┌────────────────────┐   │
// │                    │      image          │   │ ← image (bas, grande, ~400x250)
// │                    │    400x250 max      │   │
// │                    └────────────────────┘   │
// └──────────────────────────────────────────────┘
//
// ⚠️  authorIcon et footerIcon = TRÈS PETIT (16x16 Discord) - icônes uniquement
// ⚠️  thumbnail = PETIT (80x80) - logos, avatars
// ⚠️  image = GRAND (400x250) - illustrations, screenshots

/**
 * Position          | Taille Discord    | Usage idéal
 * ------------------|------------------|---------------------------
 * authorIcon         | 16x16px (TRÈS petit) | Logos tiny, avatars mini
 * thumbnail          | 80x80px (petit)      | Logos, avatars, badges
 * image              | 400x250px (GRAND)    | Illustrations, photos
 * footerIcon         | 16x16px (TRÈS petit) | Icônes tiny, status dots
 */

/**
 * Génère un message d'erreur détaillé avec solution pour les URLs d'images
 */
export function generateGuidanceMessage(urlType: string, providedUrl: string): string {
  const position = {
    thumbnail: { size: '80x80px (petit)', ideal: 'logos, avatars, badges', position: 'haut-droite' },
    image: { size: '400x250px (GRAND)', ideal: 'illustrations, screenshots, photos', position: 'bas' },
    authorIcon: { size: '16x16px (TRÈS petit)', ideal: 'logos tiny, avatars mini', position: 'haut-gauche' },
    footerIcon: { size: '16x16px (TRÈS petit)', ideal: 'icônes tiny', position: 'bas-gauche' },
  };

  const info = position[urlType as keyof typeof position] || {
    size: 'inconnue',
    ideal: 'logos ou illustrations',
    position: 'dans l\'embed'
  };

  return `❌ **URL externe non autorisée pour \`${urlType}\`**

📍 Position: ${info.position} | Taille Discord: ${info.size}
💡 Usage idéal: ${info.ideal}

🔗 URL fournie: \`${providedUrl}\`

✅ **SOLUTIONS:**

1. **Utilisez list_images()** pour obtenir une URL valide:
   \`\`\`
   list_images({symbols: ['BTC', 'ETH']})  // Crypto
   list_images({symbols: 'AAPL'})           // Actions
   list_images({symbols: 'DISCORD'})        // Services
   list_images({symbols: 'VERCEL'})         // Tech
   \`\`\`

2. **Domaines autorisés** (automatique si vous utilisez list_images):
   • cdn.simpleicons.org, simpleicons.org (icônes)
   • cdn.discordapp.com, media.discordapp.net
   • images.unsplash.com (photos)
   • assets.coingecko.com (crypto logos)
   • Et 500+ logos dans la base locale

3. **Pour authorIcon/footerIcon**: utilisez une image très petite (16x16)
   ListImages retourne des images optimisées pour cette taille.`;
}

export function generateSvgFooterMessage(providedUrl: string): string {
  return `❌ URL SVG détectée pour footerIcon: ${providedUrl}`;
}

export function generateSvgAuthorMessage(providedUrl: string): string {
  return `❌ URL SVG détectée pour authorIcon: ${providedUrl}`;
}

// ============================================================================
// CONSTANTES ET FONCTIONS DE LIMITES DISCORD (OFFICIELLES)
// ============================================================================

// Limites Discord pour les embeds (officielles)
// ⚠️ 2000 chars total par embed (title+description+fields+footer+author)
export const DISCORD_EMBED_LIMITS = {
  TITLE_MAX: 256,
  DESCRIPTION_MAX: 4096,
  FIELD_NAME_MAX: 256,
  FIELD_VALUE_MAX: 1024,
  FOOTER_TEXT_MAX: 2048,
  AUTHOR_NAME_MAX: 256,
  TOTAL_EMBED_CHARS: 2000, // ⚠️ Limite stricte Discord
  FIELDS_MAX: 25,
  FIELDS_INLINE_MAX: 3,
};

/**
 * Tronque une chaîne à maxLength avec suffixe "..." si coupée
 */
function truncateString(str: string, maxLength: number): string {
  if (!str || str.length <= maxLength) return str;
  return str.substring(0, maxLength - 3) + '...';
}

/**
 * Tronque un texte d'embed avec message de fallback pour l'agent
 */
function smartTruncateEmbedField(
  content: string,
  maxLength: number,
  fieldName: string
): { content: string; truncated: boolean; originalLength: number; warning: string | null } {
  if (!content) return { content, truncated: false, originalLength: 0, warning: null };

  const originalLength = content.length;
  if (originalLength <= maxLength) {
    return { content, truncated: false, originalLength, warning: null };
  }

  const truncated = truncateString(content, maxLength);
  const warning = `⚠️ [${fieldName}] Tronqué: ${originalLength} → ${maxLength} chars. Conseil: Utilisez pagination ou réduisez le contenu pour la prochaine tentative.`;

  return { content: truncated, truncated: true, originalLength, warning };
}

/**
 * Valide ET tronque tous les champs d'un embed pour respecter les limites Discord
 * Retourne un rapport détaillé pour l'agent avec instructions de fallback
 * 
 * 💡 Cette fonction PREVIENT les crashs silencieux en tronquant AVANT l'envoi
 * et en informant l'agent des corrections nécessaires.
 */
export function validateAndTruncateEmbed(args: {
  title?: string;
  description?: string;
  authorName?: string;
  footerText?: string;
  fields?: Array<{ name: string; value: string; inline?: boolean }>;
}): {
  args: any;
  truncated: boolean;
  warnings: string[];
  totalChars: number;
  report: string;
} {
  const warnings: string[] = [];
  const truncatedFields: string[] = [];

  // Clone args pour éviter mutation
  const safeArgs = JSON.parse(JSON.stringify(args));

  // Tronquer title
  if (safeArgs.title) {
    const result = smartTruncateEmbedField(safeArgs.title, DISCORD_EMBED_LIMITS.TITLE_MAX, 'title');
    safeArgs.title = result.content;
    if (result.truncated && result.warning) {
      warnings.push(result.warning);
      truncatedFields.push(`title`);
    }
  }

  // Tronquer description (la plus fréquente à dépasser)
  if (safeArgs.description) {
    const result = smartTruncateEmbedField(safeArgs.description, DISCORD_EMBED_LIMITS.DESCRIPTION_MAX, 'description');
    safeArgs.description = result.content;
    if (result.truncated && result.warning) {
      warnings.push(result.warning);
      truncatedFields.push(`description`);
    }
  }

  // Tronquer authorName
  if (safeArgs.authorName) {
    const result = smartTruncateEmbedField(safeArgs.authorName, DISCORD_EMBED_LIMITS.AUTHOR_NAME_MAX, 'authorName');
    safeArgs.authorName = result.content;
    if (result.truncated && result.warning) {
      warnings.push(result.warning);
      truncatedFields.push(`authorName`);
    }
  }

  // Tronquer footerText
  if (safeArgs.footerText) {
    const result = smartTruncateEmbedField(safeArgs.footerText, DISCORD_EMBED_LIMITS.FOOTER_TEXT_MAX, 'footerText');
    safeArgs.footerText = result.content;
    if (result.truncated && result.warning) {
      warnings.push(result.warning);
      truncatedFields.push(`footerText`);
    }
  }

  // Tronquer fields
  if (safeArgs.fields && safeArgs.fields.length > 0) {
    safeArgs.fields = safeArgs.fields.map((field: any, index: number) => {
      const truncatedName = smartTruncateEmbedField(field.name, DISCORD_EMBED_LIMITS.FIELD_NAME_MAX, `fields[${index}].name`);
      const truncatedValue = smartTruncateEmbedField(field.value, DISCORD_EMBED_LIMITS.FIELD_VALUE_MAX, `fields[${index}].value`);

      if (truncatedName.truncated || truncatedValue.truncated) {
        truncatedFields.push(`field[${index}]`);
      }

      return {
        ...field,
        name: truncatedName.content,
        value: truncatedValue.content,
      };
    });
  }

  // =====================================================
  // VALIDATION TOTALE 2000 CHARS (limite stricte Discord)
  // =====================================================
  const TOTAL_EMBED_LIMIT = 2000;
  
  // Calculer total AVANT validation
  const totalChars =
    (safeArgs.title?.length || 0) +
    (safeArgs.description?.length || 0) +
    (safeArgs.authorName?.length || 0) +
    (safeArgs.footerText?.length || 0) +
    (safeArgs.fields || []).reduce((sum: number, f: any) => sum + (f.name?.length || 0) + (f.value?.length || 0), 0);
  
  if (totalChars > TOTAL_EMBED_LIMIT) {
    const excess = totalChars - TOTAL_EMBED_LIMIT;
    warnings.push(
      `⚠️ [TOTAL] Dépassement limite Discord: ${totalChars}/${TOTAL_EMBED_LIMIT} chars (+${excess}). ` +
      `Réduisez le contenu total ou utilisez pagination.`
    );
    truncatedFields.push('TOTAL');
  }

  // Build report
  let report = '';
  if (truncatedFields.length > 0) {
    report = `📝 **CONTENU TRONQUÉ** (limites Discord: ${totalChars}/${TOTAL_EMBED_LIMIT} chars total/embed)\n`;
    report += `Champs affectés: ${truncatedFields.join(', ')}\n`;
    report += `\n💡 **INSTRUCTIONS POUR L'AGENT (Fallback):**\n`;
    report += `1. Pour la prochaine tentative: réduisez la description ou utilisez pagination\n`;
    report += `2. Pour du contenu long: splittez en plusieurs embeds successifs\n`;
    report += `3. Ou envoyez le surplus via le paramètre 'content' (hors embed)\n`;
  }

  return {
    args: safeArgs,
    truncated: truncatedFields.length > 0,
    warnings,
    totalChars,
    report,
  };
}
