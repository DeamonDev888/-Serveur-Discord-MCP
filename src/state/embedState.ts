/**
 * État global pour les embeds (auto-update, analytics, etc.)
 * Centralisé pour être partagé entre index.ts et tools/embeds.ts
 */

import { EmbedBuilder } from 'discord.js';

// Map pour stocker les embeds auto-updatables
export const autoUpdateEmbeds = new Map<string, {
  messageId: string;
  channelId: string;
  embedData: any;
  interval: number;
  lastUpdate: number;
  source?: string;
  updateCount: number;
}>();

// Map pour stocker les analytics des embeds
export const embedAnalytics = new Map<string, {
  views: number;
  clicks: number;
  lastInteraction: number;
  reactions: Map<string, number>;
}>();

// ============================================================================
// SYSTÈME D'AUTO-UPDATE
// ============================================================================

import * as fs from 'fs';
import * as path from 'path';
import Logger from '../utils/logger.js';

// Fonctions utilitaires
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

  return result;
}

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

// Fonction pour mettre à jour un embed automatiquement
export async function updateEmbed(embedId: string, getClient: () => any): Promise<void> {
  const embedInfo = autoUpdateEmbeds.get(embedId);
  if (!embedInfo) return;

  try {
    console.log(`🔄 [Auto-Update] Mise à jour embed ${embedId} (${embedInfo.updateCount + 1})`);

    const client = await getClient();
    const channel = await client.channels.fetch(embedInfo.channelId);

    if (!channel || !('messages' in channel)) {
      console.error(`❌ [Auto-Update] Canal ${embedInfo.channelId} invalide`);
      autoUpdateEmbeds.delete(embedId);
      return;
    }

    const message = await channel.messages.fetch(embedInfo.messageId);

    if (!message) {
      console.error(`❌ [Auto-Update] Message ${embedInfo.messageId} introuvable`);
      autoUpdateEmbeds.delete(embedId);
      return;
    }

    let updatedEmbedData = { ...embedInfo.embedData };

    if (updatedEmbedData.title) {
      updatedEmbedData.title = replaceVariables(updatedEmbedData.title, updatedEmbedData.variables);
    }
    if (updatedEmbedData.description) {
      updatedEmbedData.description = replaceVariables(updatedEmbedData.description, updatedEmbedData.variables);
    }
    if (updatedEmbedData.fields) {
      updatedEmbedData.fields = updatedEmbedData.fields.map((field: any) => ({
        ...field,
        name: replaceVariables(field.name, updatedEmbedData.variables),
        value: updatedEmbedData.autoTable && field.value.includes('|')
          ? parseTable(field.value)
          : replaceVariables(field.value, updatedEmbedData.variables),
      }));
    }

    const embed = new EmbedBuilder();

    if (updatedEmbedData.title) embed.setTitle(updatedEmbedData.title);
    if (updatedEmbedData.description) embed.setDescription(updatedEmbedData.description);

    if (updatedEmbedData.color) {
      if (typeof updatedEmbedData.color === 'number') {
        embed.setColor(updatedEmbedData.color);
      } else if (typeof updatedEmbedData.color === 'string' && updatedEmbedData.color.startsWith('#')) {
        embed.setColor(updatedEmbedData.color as any);
      }
    }

    if (updatedEmbedData.url) embed.setURL(updatedEmbedData.url);
    if (updatedEmbedData.thumbnail) embed.setThumbnail(updatedEmbedData.thumbnail);
    if (updatedEmbedData.image) embed.setImage(updatedEmbedData.image);

    if (updatedEmbedData.authorName) {
      embed.setAuthor({
        name: updatedEmbedData.authorName,
        url: updatedEmbedData.authorUrl,
        iconURL: updatedEmbedData.authorIcon,
      });
    }

    if (updatedEmbedData.footerText) {
      embed.setFooter({
        text: replaceVariables(updatedEmbedData.footerText, updatedEmbedData.variables),
        iconURL: updatedEmbedData.footerIcon,
      });
    }

    if (updatedEmbedData.fields) {
      updatedEmbedData.fields.forEach((field: any) => {
        embed.addFields({
          name: field.name,
          value: field.value,
          inline: field.inline || false,
        });
      });
    }

    embed.setTimestamp();

    await message.edit({
      content: updatedEmbedData.content || '',
      embeds: [embed],
      components: message.components,
    });

    embedInfo.embedData = updatedEmbedData;
    embedInfo.lastUpdate = Date.now();
    embedInfo.updateCount++;

    console.log(`✅ [Auto-Update] Embed ${embedId} mis à jour (${embedInfo.updateCount} fois)`);

  } catch (error) {
    console.error(`❌ [Auto-Update] Erreur pour ${embedId}:`, error);
  }
}

// Démarrer l'auto-update
export function startAutoUpdate(getClient: () => any): void {
  setInterval(() => {
    const now = Date.now();
    autoUpdateEmbeds.forEach((embedInfo, embedId) => {
      if (now - embedInfo.lastUpdate >= embedInfo.interval * 1000) {
        updateEmbed(embedId, getClient);
      }
    });
  }, 5000);
}

// ============================================================================
// SYSTÈME D'ANALYTICS
// ============================================================================

export function trackEmbedView(embedId: string): void {
  const analytics = embedAnalytics.get(embedId) || {
    views: 0,
    clicks: 0,
    lastInteraction: 0,
    reactions: new Map(),
  };
  analytics.views++;
  analytics.lastInteraction = Date.now();
  embedAnalytics.set(embedId, analytics);
}

export function trackEmbedClick(embedId: string, buttonId?: string): void {
  const analytics = embedAnalytics.get(embedId) || {
    views: 0,
    clicks: 0,
    lastInteraction: 0,
    reactions: new Map(),
  };
  analytics.clicks++;
  analytics.lastInteraction = Date.now();
  if (buttonId) {
    analytics.reactions.set(buttonId, (analytics.reactions.get(buttonId) || 0) + 1);
  }
  embedAnalytics.set(embedId, analytics);
}

export function getEmbedAnalytics(embedId: string): any {
  return embedAnalytics.get(embedId) || {
    views: 0,
    clicks: 0,
    lastInteraction: 0,
    reactions: {},
  };
}

export function generateAnalyticsReport(embedId: string): string {
  const analytics = getEmbedAnalytics(embedId);
  const reactions = Array.from(analytics.reactions.entries())
    .map(([btn, count]) => `  • ${btn}: ${count} clics`)
    .join('\n');

  return `📊 **Analytics Embed ${embedId}**
👀 Vues: ${analytics.views}
🖱️ Clics: ${analytics.clicks}
📈 Taux d'engagement: ${analytics.views > 0 ? ((analytics.clicks / analytics.views) * 100).toFixed(1) : 0}%
⏰ Dernière interaction: ${analytics.lastInteraction ? new Date(analytics.lastInteraction).toLocaleString('fr-FR') : 'Jamais'}
${reactions ? `🎯 **Boutons:**\n${reactions}` : ''}`;
}

export async function saveAnalytics(): Promise<void> {
  const analyticsData = Object.fromEntries(
    Array.from(embedAnalytics.entries()).map(([id, data]) => [
      id,
      {
        ...data,
        reactions: Object.fromEntries(data.reactions),
      },
    ])
  );

  const analyticsPath = path.join(process.cwd(), 'embed-analytics.json');
  await fs.promises.writeFile(analyticsPath, JSON.stringify(analyticsData, null, 2));
}

export async function loadAnalytics(): Promise<void> {
  const analyticsPath = path.join(process.cwd(), 'embed-analytics.json');

  try {
    const content = await fs.promises.readFile(analyticsPath, 'utf-8');
    const data = JSON.parse(content);

    Object.entries(data).forEach(([id, analytics]: [string, any]) => {
      embedAnalytics.set(id, {
        ...analytics,
        reactions: new Map(Object.entries(analytics.reactions || {})),
      });
    });

    console.log(`📊 Analytics chargées: ${Object.keys(data).length} embeds`);
  } catch (e) {
    console.log('📊 Aucune analytics sauvegardée trouvée');
  }
}

// Sauvegarder les analytics toutes les 5 minutes
setInterval(saveAnalytics, 5 * 60 * 1000);

// Charger les analytics au démarrage
setTimeout(() => loadAnalytics().catch(console.error), 500);
