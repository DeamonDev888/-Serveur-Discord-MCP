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

    if (args.url) embed.setURL(args.url);

    // Author (avec fix invisible char si icon sans name — bug Discord connu)
    if (args.authorName || args.authorIcon) {
      embed.setAuthor({
        name: args.authorName ?? '\u200b',
        url: args.authorUrl,
        iconURL: args.authorIcon,
      });
    }

    // Footer (idem fix invisible char)
    if (args.footerText || args.footerIcon) {
      embed.setFooter({
        text: args.footerText ?? '\u200b',
        iconURL: args.footerIcon,
      });
    }

    // Images
    if (args.thumbnail) embed.setThumbnail(args.thumbnail);
    if (args.image) embed.setImage(args.image);

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
