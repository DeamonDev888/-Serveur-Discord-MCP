/**
 * Outils MCP pour la création et gestion des Embeds Discord
 */

import { z } from 'zod';
import type { FastMCP } from 'fastmcp';
import {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} from 'discord.js';
import * as fs from 'fs';
import * as path from 'path';
import Logger from '../utils/logger.js';
import {
  ensureDiscordConnection,
  autoUpdateEmbeds,
  embedAnalytics,
  generateAnalyticsReport,
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
  generateMinigame,
} from '../utils/gameUtils.js';
import { CRYPTO_LOGOS } from '../data/logos.js';

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
// ENREGISTREMENT DES OUTILS
// ============================================================================

export function registerEmbedTools(server: FastMCP) {
  // 1. Créer Embed
  server.addTool({
    name: 'creer_embed',
    description: 'Créer un embed Discord ultra-complet avec tableaux, pagination, boutons, thèmes, graphiques, mini-jeux, et liens adaptatifs',
    parameters: z.object({
      channelId: z.string().describe('ID du canal Discord'),
      title: z.string().optional().describe('Titre de l\'embed'),
      description: z.string().optional().describe('Description principale'),
      color: z.string().optional().describe('Couleur en hex (#RRGGBB)'),
      url: z.string().optional().describe('URL cliquable'),
      thumbnail: z.string().optional().describe('URL miniature'),
      image: z.string().optional().describe('URL image'),
      authorName: z.string().optional().describe("Nom de l'auteur"),
      authorUrl: z.string().optional().describe("URL de l'auteur"),
      authorIcon: z.string().optional().describe("URL icône auteur"),
      footerText: z.string().optional().describe('Texte footer'),
      footerIcon: z.string().optional().describe('URL icône footer'),
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
        action: z.enum(['none', 'refresh', 'link', 'custom']).default('none'),
        value: z.string().optional(),
      })).max(5).optional().describe('Boutons intégrés dans l\'embed'),
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
      theme: z.enum(['cyberpunk', 'minimal', 'gaming', 'corporate', 'sunset', 'ocean']).optional().describe('Thème prédéfini'),
      enableAnalytics: z.boolean().optional().default(true).describe('Activer le tracking analytics'),
      charts: z.array(z.object({
        type: z.enum(['line', 'bar', 'pie', 'sparkline', 'area']).describe('Type de graphique'),
        title: z.string().describe('Titre du graphique'),
        data: z.array(z.number()).describe('Données du graphique'),
        labels: z.array(z.string()).optional().describe('Labels des données'),
        colors: z.array(z.string()).optional().describe('Couleurs du graphique'),
        size: z.enum(['small', 'medium', 'large']).optional().default('medium').describe('Taille du graphique'),
      })).optional().describe('Graphiques intégrés (ASCII art)'),
      minigames: z.array(z.object({
        type: z.enum(['quiz', 'puzzle', 'emoji_reaction', 'trivia', 'riddle']).describe('Type de mini-jeu'),
        question: z.string().describe('Question du jeu'),
        options: z.array(z.string()).optional().describe('Options de réponse'),
        correctAnswer: z.string().optional().describe('Réponse correcte'),
        emoji: z.string().optional().describe('Emoji associé'),
        rewards: z.object({
          points: z.number().optional().default(10).describe('Points gagnés'),
          badge: z.string().optional().describe('Badge obtenu'),
        }).optional().describe('Récompenses'),
      })).optional().describe('Mini-jeux intégrés'),
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
        symbol: z.string().describe('Symbole crypto (BTC, ETH, SOL, etc.)'),
        position: z.enum(['thumbnail', 'author', 'footer', 'image']).optional().default('thumbnail').describe('Position du logo'),
        size: z.enum(['small', 'medium', 'large']).optional().default('medium').describe('Taille du logo'),
        format: z.enum(['png', 'svg']).optional().default('png').describe('Format de l\'image'),
      }).optional().describe('Logo crypto automatique depuis cryptologos.cc'),
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
    }),
    execute: async (args) => {
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
          embedData = applyTheme(args.theme, embedData);
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
        if (dataToUse.thumbnail) embed.setThumbnail(dataToUse.thumbnail);
        if (dataToUse.image) embed.setImage(dataToUse.image);

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
            iconURL: args.footerIcon,
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

        if (args.minigames && args.minigames.length > 0) {
          args.minigames.forEach((game, index) => {
            const gameText = generateMinigame(game, (index + 1).toString());
            processedFields.push({
              name: `🎮 ${game.type.toUpperCase()}`,
              value: gameText,
              inline: false,
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
        if (args.buttons && args.buttons.length > 0) {
          const styleMap: Record<string, any> = {
            Primary: ButtonStyle.Primary,
            Secondary: ButtonStyle.Secondary,
            Success: ButtonStyle.Success,
            Danger: ButtonStyle.Danger,
          };

          const row = new ActionRowBuilder<ButtonBuilder>();

          for (const btn of args.buttons) {
            const buttonId = `embedv2_${embedId}_${btn.action}_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
            const button = new ButtonBuilder()
              .setCustomId(buttonId)
              .setLabel(btn.label)
              .setStyle(styleMap[btn.style] || ButtonStyle.Primary);

            if (btn.emoji) {
              button.setEmoji(btn.emoji);
            }

            row.addComponents(button);
          }

          components.push(row);
        }

        if (args.minigames && args.minigames.length > 0) {
          const gameRow = new ActionRowBuilder<ButtonBuilder>();

          args.minigames.forEach((game, index) => {
            if (game.type === 'quiz' && game.options) {
              game.options.slice(0, 4).forEach((opt, optIndex) => {
                const optionLetter = String.fromCharCode(65 + optIndex);
                const button = new ButtonBuilder()
                  .setCustomId(`game_${embedId}_quiz_${index}_${optIndex}`)
                  .setLabel(optionLetter)
                  .setStyle(ButtonStyle.Secondary);
                gameRow.addComponents(button);
              });
            } else if (game.type === 'emoji_reaction' && game.emoji) {
              const button = new ButtonBuilder()
                .setCustomId(`game_${embedId}_emoji_${index}`)
                .setLabel('Réagir')
                .setEmoji(game.emoji)
                .setStyle(ButtonStyle.Primary);
              gameRow.addComponents(button);
            }
          });

          if (gameRow.components.length > 0) {
            components.push(gameRow);
          }
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

        const message = await channel.send({
          content: args.content,
          embeds: [embed],
          components: components.length > 0 ? components : undefined,
        });

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
}
