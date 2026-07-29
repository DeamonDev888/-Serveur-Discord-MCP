/**
 * 🔧 HELPER executeCreerEmbedLite — Version simplifiée pour gestion_embeds
 * ============================================================================
 *
 * But : Permettre au dispatcher unifié gestion_embeds (unified.ts) d'appeler
 *       une logique de création d'embed SANS dépendre de tout le baggage
 *       du handler creer_embed (theme, persistence buttons, analytics,
 *       autoUpdate, SVG conversion, etc.).
 *
 * Pourquoi : creer_embed fait ~1300 lignes dans embeds.ts et ne peut pas
 *            être réimporté directement depuis unified.ts sans casser
 *            l'architecture. Cette version lite couvre 90% des cas
 *            d'usage de gestion_embeds(action: 'creer').
 *
 * Limites assumées vs creer_embed :
 *   - Pas de theme (utiliser color hex ou nom CSS standard directement)
 *   - Pas de buttons (utiliser update_embed après pour ajouter)
 *   - Pas de menus déroulants
 *   - Pas de crypto logos automatiques
 *   - Pas de SVG → PNG auto-conversion
 *   - Pas d'analytics tracking
 *   - Pas d'auto-update
 *   - Pas de validation pré-exécution INTELLIGENTE (juste les limites Discord)
 *
 * Pour les features avancées, utiliser creer_embed directement.
 */

import { z } from 'zod';
import type { FastMCP } from 'fastmcp';
import { EmbedBuilder } from 'discord.js';
import type { EmbedAuthorOptions, EmbedFooterOptions } from 'discord.js';
import { ensureDiscordConnection } from './common.js';
import Logger from '../utils/logger.js';
import { validateAndTruncateEmbed, DISCORD_EMBED_LIMITS } from './embeds.js';

export async function executeCreerEmbedLite(args: {
  channelId: string;
  title?: string;
  description?: string;
  color?: string;
  url?: string;
  authorName?: string;
  authorUrl?: string;
  authorIcon?: string;
  thumbnail?: string;
  image?: string;
  footerText?: string;
  footerIcon?: string;
  fields?: Array<{ name: string; value: string; inline?: boolean }>;
  timestamp?: boolean;
  content?: string;
}): Promise<string> {
  try {
    // Validation: channelId + title + description obligatoires (cf. Discord limits)
    if (!args.channelId) return '❌ channelId requis pour creer un embed';
    if (!args.title) return '❌ title requis pour creer un embed';
    if (!args.description) return '❌ description requise pour creer un embed';

    Logger.info(`[EMBEDS_LITE] 🚀 Titre: ${args.title}`);

    const client = await ensureDiscordConnection();
    const channel = await client.channels.fetch(args.channelId);

    if (!channel || !('send' in channel)) {
      throw new Error('Canal invalide ou inaccessible');
    }

    // Troncation intelligente des limites Discord
    const {
      args: truncatedArgs,
      truncated,
      warnings: truncationWarnings,
      report: truncationReport,
    } = validateAndTruncateEmbed({
      title: args.title,
      description: args.description,
      authorName: args.authorName,
      footerText: args.footerText,
      fields: args.fields as any,
    });

    const data = {
      title: truncatedArgs.title,
      description: truncatedArgs.description,
      authorName: truncatedArgs.authorName,
      footerText: truncatedArgs.footerText,
      fields: truncatedArgs.fields,
    };

    if (truncated) {
      Logger.info(`[EMBEDS_LITE] 📏 Contenu tronqué: ${truncationWarnings.join(', ')}`);
    }

    // Construction de l'embed
    const embed = new EmbedBuilder().setTitle(data.title).setDescription(data.description);

    // Color
    if (args.color) {
      if (args.color.startsWith('#')) {
        embed.setColor(args.color as any);
      } else {
        // Color name → hex
        const colorMap: { [key: string]: number } = {
          RED: 0xe74c3c,
          GREEN: 0x2ecc71,
          BLUE: 0x3498db,
          YELLOW: 0xf1c40f,
          PURPLE: 0x9b59b6,
          ORANGE: 0xe67e22,
          AQUA: 0x1abc9c,
          WHITE: 0xffffff,
          BLACK: 0x000000,
          BLURPLE: 0x5865f2,
        };
        embed.setColor(colorMap[args.color.toUpperCase()] || 0x5865f2);
      }
    } else {
      embed.setColor(0x5865f2); // Default Discord blurple
    }

    // FIX: Filter empty strings — Discord.js rejects url="" and iconURL="" with "Received one or more errors"
    if (typeof args.url === 'string' && args.url.trim()) embed.setURL(args.url.trim());

    // Author (avec fix invisible char si icon sans name — bug Discord connu)
    const _authorName = typeof args.authorName === 'string' && args.authorName.trim() ? args.authorName : null;
    const _authorIcon = typeof args.authorIcon === 'string' && args.authorIcon.trim() ? args.authorIcon.trim() : null;
    const _authorUrl = typeof args.authorUrl === 'string' && args.authorUrl.trim() ? args.authorUrl.trim() : null;
    if (_authorName || _authorIcon) {
      const _authorOpts: EmbedAuthorOptions = { name: _authorName ?? '\u200b' };
      if (_authorUrl) _authorOpts.url = _authorUrl;
      if (_authorIcon) _authorOpts.iconURL = _authorIcon;
      embed.setAuthor(_authorOpts);
    }

    // Footer (idem fix invisible char)
    const _footerText = typeof args.footerText === 'string' && args.footerText.trim() ? args.footerText : null;
    const _footerIcon = typeof args.footerIcon === 'string' && args.footerIcon.trim() ? args.footerIcon.trim() : null;
    if (_footerText || _footerIcon) {
      const _footerOpts: EmbedFooterOptions = { text: _footerText ?? '\u200b' };
      if (_footerIcon) _footerOpts.iconURL = _footerIcon;
      embed.setFooter(_footerOpts);
    }

    // Images
    if (typeof args.thumbnail === 'string' && args.thumbnail.trim()) embed.setThumbnail(args.thumbnail.trim());
    if (typeof args.image === 'string' && args.image.trim()) embed.setImage(args.image.trim());

    // Fields (avec mapping inline bool)
    if (data.fields && data.fields.length > 0) {
      data.fields.forEach((f: any) => {
        embed.addFields({ name: f.name, value: f.value, inline: f.inline || false });
      });
    }

    if (args.timestamp !== false) {
      embed.setTimestamp();
    }

    // Envoi
    const message = await channel.send({
      content: args.content,
      embeds: [embed],
    });

    let response = `✅ Embed créé | ID: ${message.id}`;
    if (truncationReport) {
      response += `\n\n${truncationReport}`;
    }
    return response;
  } catch (error: any) {
    Logger.error(`❌ [EMBEDS_LITE]`, error.message);
    return `❌ Erreur: ${error.message}${error.code ? ` (Code: ${error.code})` : ''}`;
  }
}
