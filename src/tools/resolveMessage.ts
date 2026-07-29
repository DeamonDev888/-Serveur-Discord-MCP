/**
 * 🔗 RÉSOLUTION DE MESSAGES DISCORD — RÉFÉRENCES CROSS-CANAL
 * ============================================================
 *
 * Module central pour résoudre un message Discord à partir:
 *   - d'un channelId + messageId
 *   - d'une URL Discord (https://discord.com/channels/GUILD/CHANNEL/MESSAGE)
 *   - d'un message qui RÉPOND à un message d'un autre canal (message_reference)
 *   - d'un message qui CONTIENT une URL Discord pointant vers un autre canal
 *
 * Fonctions exportées:
 *   - parseDiscordMessageUrl(url)            → { guildId, channelId, messageId } | null
 *   - extractDiscordMessageUrls(...)         → string[] (depuis content + embeds + components)
 *   - serializeFullMessage(message)          → objet JSON enrichi complet
 *   - resolveDiscordMessage(input)           → message résolu (+ resolvedTarget + resolutionChain)
 *
 * Codes d'erreur structurés (retournés par resolveDiscordMessage sur échec):
 *   MESSAGE_NOT_FOUND, CHANNEL_NOT_FOUND, CHANNEL_NOT_TEXT_BASED,
 *   MISSING_ACCESS, MISSING_HISTORY_PERMISSION, MAX_DEPTH,
 *   REFERENCE_CYCLE, INVALID_MESSAGE_URL, UNKNOWN_ERROR
 */

import type { Client, Message } from 'discord.js';

// ============================================================================
// TYPES
// ============================================================================

export interface MessageLocation {
  guildId?: string;
  channelId: string;
  messageId: string;
}

export interface ResolveInput {
  messageUrl?: string;
  channelId?: string;
  messageId?: string;
  guildId?: string;
  followReferences?: boolean;
  maxDepth?: number;
}

export interface SerializedMessage {
  id: string;
  guildId?: string;
  channelId: string;
  type: number;
  content: string;
  url: string;
  author: { id: string; username: string; bot?: boolean };
  reference?: { guildId?: string; channelId: string; messageId: string };
  referencedMessage?: SerializedMessage | null;
  messageSnapshots: unknown[];
  embeds: unknown[];
  embedCount: number;
  attachments: unknown[];
  components: unknown[];
  resolvedTarget?: SerializedMessage;
  resolutionChain?: MessageLocation[];
}

export interface ResolveError {
  ok: false;
  code: string;
  message: string;
  source?: { channelId?: string; messageId?: string };
}

export type ResolveResult = SerializedMessage | ResolveError;

// ============================================================================
// PARSE D'URL DISCORD
// ============================================================================

const DISCORD_URL_REGEX =
  /https?:\/\/(?:canary\.|ptb\.)?discord(?:app)?\.com\/channels\/(\d+|@me)\/(\d+)\/(\d+)/gi;

export function parseDiscordMessageUrl(url: string): MessageLocation | null {
  const match = new RegExp(DISCORD_URL_REGEX.source, 'i').exec(url);
  if (!match) return null;
  const guildId = match[1] === '@me' ? undefined : match[1];
  return { guildId, channelId: match[2], messageId: match[3] };
}

export function extractDiscordMessageUrls(
  content: string | undefined,
  embeds?: unknown[],
  components?: unknown[]
): string[] {
  const urls = new Set<string>();
  const search = (text: string) => {
    const re = new RegExp(DISCORD_URL_REGEX.source, 'gi');
    let m;
    while ((m = re.exec(text)) !== null) {
      urls.add(m[0]);
    }
  };
  if (content) search(content);
  // Chercher dans embeds (description, url, fields)
  if (Array.isArray(embeds)) {
    for (const embed of embeds) {
      const e = embed as Record<string, unknown>;
      if (typeof e.url === 'string') search(e.url);
      if (typeof e.description === 'string') search(e.description);
      if (Array.isArray(e.fields)) {
        for (const f of e.fields) {
          const field = f as Record<string, unknown>;
          if (typeof field.value === 'string') search(field.value);
          if (typeof field.name === 'string') search(field.name);
        }
      }
    }
  }
  // Chercher dans components (boutons avec URL)
  if (Array.isArray(components)) {
    for (const row of components) {
      const r = row as Record<string, unknown>;
      if (Array.isArray(r.components)) {
        for (const c of r.components) {
          const comp = c as Record<string, unknown>;
          if (typeof comp.url === 'string') search(comp.url);
        }
      }
    }
  }
  return [...urls];
}

// ============================================================================
// SÉRIALISATION COMPLÈTE D'UN MESSAGE
// ============================================================================

export function serializeFullMessage(message: Message): SerializedMessage {
  const serialized: SerializedMessage = {
    id: message.id,
    channelId: message.channelId,
    type: message.type,
    content: message.content ?? '',
    url: message.url,
    author: {
      id: message.author?.id ?? '',
      username: message.author?.username ?? '',
      bot: message.author?.bot,
    },
    messageSnapshots: [],
    embeds: [],
    embedCount: 0,
    attachments: [],
    components: [],
  };

  if (message.guildId) serialized.guildId = message.guildId;

  // message_reference (la structure brute)
  const ref = message.reference;
  if (ref?.messageId && ref?.channelId) {
    serialized.reference = {
      guildId: ref.guildId ?? undefined,
      channelId: ref.channelId,
      messageId: ref.messageId,
    };
  }

  // referenced_message (le message résolu par Discord.js, si disponible)
  // Note: referencedMessage n'est pas dans les types stricts de discord.js v14
  // mais existe au runtime quand Discord le renvoie.
  const referenced = (message as unknown as Record<string, unknown>)
    .referencedMessage as Message | undefined;
  if (referenced) {
    serialized.referencedMessage = serializeFullMessage(referenced);
  }

  // message_snapshots (messages transférés / forward)
  const snapshots = (message as unknown as Record<string, unknown>)
    .messageSnapshots as
    | Array<Record<string, unknown>>
    | undefined;
  if (Array.isArray(snapshots)) {
    serialized.messageSnapshots = snapshots.map(s => ({
      content: s.content ?? '',
      embeds: (s.embeds as unknown[]) ?? [],
    }));
  }

  // Embeds détaillés
  if (message.embeds && message.embeds.length > 0) {
    serialized.embeds = message.embeds.map(e => ({
      title: e.title,
      description: e.description,
      color: e.color != null ? `#${e.color.toString(16).padStart(6, '0')}` : undefined,
      url: e.url,
      author: e.author
        ? { name: e.author.name, url: e.author.url, iconURL: e.author.iconURL }
        : undefined,
      thumbnail: e.thumbnail ? { url: e.thumbnail.url } : undefined,
      image: e.image ? { url: e.image.url } : undefined,
      footer: e.footer
        ? { text: e.footer.text, iconURL: e.footer.iconURL }
        : undefined,
      timestamp: e.timestamp,
      fields: (e.fields ?? []).map(f => ({ name: f.name, value: f.value, inline: f.inline })),
    }));
    serialized.embedCount = message.embeds.length;
  }

  // Attachments
  if (message.attachments && message.attachments.size > 0) {
    serialized.attachments = [...message.attachments.values()].map(a => ({
      id: a.id,
      name: a.name,
      url: a.url,
      contentType: a.contentType,
      size: a.size,
    }));
  }

  // Components (boutons, menus)
  // Note: discord.js v14 types components as TopLevelComponent[] (an abstraction),
  // but at runtime each entry is an ActionRow with a .components array.
  if (message.components && message.components.length > 0) {
    serialized.components = (message.components as unknown as Array<Record<string, unknown>>).map(
      row => ({
        type: row.type,
        components: Array.isArray(row.components)
          ? (row.components as unknown[]).map((c: unknown) => {
              const comp = c as Record<string, unknown>;
              return {
                type: comp.type,
                label: comp.label,
                style: comp.style,
                url: comp.url,
                customId: comp.customId,
                emoji: comp.emoji
                  ? (comp.emoji as Record<string, unknown>).name
                  : undefined,
                disabled: comp.disabled,
              };
            })
          : [],
      })
    );
  }

  return serialized;
}

// ============================================================================
// RÉSOLUTION RÉCURSIVE AVEC SUIVI DE RÉFÉRENCES
// ============================================================================

async function fetchMessageSafe(
  client: Client,
  channelId: string,
  messageId: string
): Promise<Message | ResolveError> {
  try {
    const channel = await client.channels.fetch(channelId);
    if (!channel) {
      return {
        ok: false,
        code: 'CHANNEL_NOT_FOUND',
        message: `Canal introuvable: ${channelId}`,
        source: { channelId, messageId },
      };
    }
    if (!('messages' in channel) || typeof channel.messages?.fetch !== 'function') {
      return {
        ok: false,
        code: 'CHANNEL_NOT_TEXT_BASED',
        message: `Le canal ${channelId} n'est pas un canal textuel`,
        source: { channelId, messageId },
      };
    }
    const message = await channel.messages.fetch(messageId);
    if (!message) {
      return {
        ok: false,
        code: 'MESSAGE_NOT_FOUND',
        message: `Message introuvable: ${messageId} dans ${channelId}`,
        source: { channelId, messageId },
      };
    }
    return message;
  } catch (error: any) {
    // Discord.js: erreur 10003 = Unknown Channel, 10008 = Unknown Message,
    // 50001 = Missing Access, 50009 = ChannelVerificationLevelTooHigh
    const code = error.code;
    if (code === 10003) {
      return {
        ok: false,
        code: 'CHANNEL_NOT_FOUND',
        message: `Canal introuvable: ${channelId}`,
        source: { channelId, messageId },
      };
    }
    if (code === 10008) {
      return {
        ok: false,
        code: 'MESSAGE_NOT_FOUND',
        message: `Message introuvable: ${messageId} dans ${channelId}`,
        source: { channelId, messageId },
      };
    }
    if (code === 50001 || code === 50009) {
      return {
        ok: false,
        code: 'MISSING_ACCESS',
        message: `Accès refusé au canal ${channelId} (le bot n'a pas la permission ViewChannel)`,
        source: { channelId, messageId },
      };
    }
    if (code === 10009) {
      return {
        ok: false,
        code: 'MISSING_HISTORY_PERMISSION',
        message: `Le bot n'a pas la permission ReadMessageHistory dans ${channelId}`,
        source: { channelId, messageId },
      };
    }
    return {
      ok: false,
      code: 'UNKNOWN_ERROR',
      message: error.message || 'Erreur inconnue',
      source: { channelId, messageId },
    };
  }
}

export async function resolveDiscordMessage(
  client: Client,
  input: ResolveInput,
  depth = 0,
  seen = new Set<string>()
): Promise<ResolveResult> {
  const maxDepth = input.maxDepth ?? 3;

  // 1. Déterminer la localisation du message
  let loc: MessageLocation;

  if (input.messageUrl) {
    const parsed = parseDiscordMessageUrl(input.messageUrl);
    if (!parsed) {
      return {
        ok: false,
        code: 'INVALID_MESSAGE_URL',
        message: `URL Discord invalide: ${input.messageUrl}`,
      };
    }
    loc = parsed;
  } else if (input.channelId && input.messageId) {
    loc = { guildId: input.guildId, channelId: input.channelId, messageId: input.messageId };
  } else {
    return {
      ok: false,
      code: 'INVALID_MESSAGE_URL',
      message: "Il faut soit messageUrl, soit (channelId + messageId)",
    };
  }

  // 2. Vérifier la profondeur max
  if (depth > maxDepth) {
    return {
      ok: false,
      code: 'MAX_DEPTH',
      message: `Profondeur maximale (${maxDepth}) atteinte — trop de références imbriquées`,
      source: { channelId: loc.channelId, messageId: loc.messageId },
    };
  }

  // 3. Vérifier les cycles
  const key = `${loc.channelId}:${loc.messageId}`;
  if (seen.has(key)) {
    return {
      ok: false,
      code: 'REFERENCE_CYCLE',
      message: `Cycle de référence détecté: ${key} a déjà été visité`,
      source: { channelId: loc.channelId, messageId: loc.messageId },
    };
  }
  seen.add(key);

  // 4. Fetch le message
  const result = await fetchMessageSafe(client, loc.channelId, loc.messageId);
  if ('ok' in result) {
    return result; // ResolveError
  }

  const message = result as Message;
  const serialized = serializeFullMessage(message);

  // 5. Si pas de suivi de références, on retourne tel quel
  if (!input.followReferences) {
    return serialized;
  }

  // 6. Suivre message_reference (réponse à un message d'un autre canal)
  if (serialized.reference?.channelId && serialized.reference?.messageId) {
    const target = await resolveDiscordMessage(
      client,
      {
        channelId: serialized.reference.channelId,
        messageId: serialized.reference.messageId,
        followReferences: true,
        maxDepth,
      },
      depth + 1,
      seen
    );
    // Les erreurs critiques (cycle, maxDepth, accès refusé) doivent remonter
    if ('ok' in target) {
      // Pour REFERENCE_CYCLE et MAX_DEPTH, on retourne l'erreur au caller
      // au lieu de l'avaler silencieusement.
      if (target.code === 'REFERENCE_CYCLE' || target.code === 'MAX_DEPTH') {
        return target;
      }
      // Pour les autres erreurs (MESSAGE_NOT_FOUND, MISSING_ACCESS, etc.),
      // on ne remplit pas resolvedTarget mais on ne fait pas échouer non plus —
      // le message initial existe bel et bien, c'est juste sa cible qui est inaccessible.
    } else {
      serialized.resolvedTarget = target;
      serialized.resolutionChain = [
        { channelId: loc.channelId, messageId: loc.messageId },
        {
          channelId: serialized.reference.channelId,
          messageId: serialized.reference.messageId,
        },
      ];
    }
    return serialized;
  }

  // 7. Suivre les URLs Discord trouvées dans le contenu / embeds / components
  const urls = extractDiscordMessageUrls(
    serialized.content,
    serialized.embeds,
    serialized.components
  );
  if (urls.length > 0) {
    const target = await resolveDiscordMessage(
      client,
      {
        messageUrl: urls[0],
        followReferences: true,
        maxDepth,
      },
      depth + 1,
      seen
    );
    if ('ok' in target) {
      if (target.code === 'REFERENCE_CYCLE' || target.code === 'MAX_DEPTH') {
        return target;
      }
    } else {
      serialized.resolvedTarget = target;
      const parsedTarget = parseDiscordMessageUrl(urls[0]);
      serialized.resolutionChain = [
        { channelId: loc.channelId, messageId: loc.messageId },
        ...(parsedTarget ? [parsedTarget] : []),
      ];
    }
  }

  return serialized;
}

// ============================================================================
// HELPER: Vérifier si un objet est une ResolveError
// ============================================================================

export function isResolveError(result: ResolveResult): result is ResolveError {
  return (result as ResolveError).ok === false;
}

// ============================================================================
// HELPER: Formatter une ResolveError en string lisible
// ============================================================================

export function formatResolveError(error: ResolveError): string {
  const sourceStr = error.source
    ? ` (channelId: ${error.source.channelId ?? '?'}, messageId: ${error.source.messageId ?? '?'})`
    : '';
  return `❌ [${error.code}] ${error.message}${sourceStr}`;
}
