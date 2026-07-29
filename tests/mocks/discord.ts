/**
 * Mocks discord.js pour tests unitaires de resolveMessage.ts
 *
 * Stratégie: on ne mocke PAS le module discord.js (trop lourd). On crée des
 * objets factices qui ont la SHAPE des objets Message/Channel que
 * serializeFullMessage et resolveDiscordMessage consomment réellement.
 *
 * resolveDiscordMessage(client, input) fait:
 *   client.channels.fetch(channelId) → channel
 *   channel.messages.fetch(messageId) → message
 *
 * serializeFullMessage(message) lit:
 *   message.id, channelId, guildId, type, content, url
 *   message.author.{id, username, bot}
 *   message.reference.{guildId, channelId, messageId}
 *   message.referencedMessage (récursif)
 *   message.messageSnapshots
 *   message.embeds[] (champs: title, description, color, url, author, thumbnail, image, footer, timestamp, fields)
 *   message.attachments (Collection-like avec .size, .values())
 *   message.components[] (ActionRow-like avec .type, .components[])
 */

// ============================================================================
// TYPES DE MOCK
// ============================================================================

export interface MockEmbed {
  title?: string;
  description?: string;
  color?: number;
  url?: string;
  author?: { name: string; url?: string; iconURL?: string };
  thumbnail?: { url: string };
  image?: { url: string };
  footer?: { text: string; iconURL?: string };
  timestamp?: Date;
  fields?: Array<{ name: string; value: string; inline?: boolean }>;
}

export interface MockAttachment {
  id: string;
  name: string;
  url: string;
  contentType?: string;
  size?: number;
}

export interface MockComponent {
  type: number;
  components: Array<Record<string, unknown>>;
}

export interface MockMessage {
  id: string;
  channelId: string;
  guildId?: string;
  type: number;
  content: string;
  url: string;
  author: { id: string; username: string; bot?: boolean };
  reference?: { guildId?: string; channelId: string; messageId: string };
  referencedMessage?: MockMessage;
  messageSnapshots?: Array<Record<string, unknown>>;
  embeds: MockEmbed[];
  attachments: Map<string, MockAttachment>;
  components: MockComponent[];
}

// ============================================================================
// FABRIQUE DE MOCKS
// ============================================================================

let msgCounter = 0;

export function createMockMessage(overrides: Partial<MockMessage> = {}): MockMessage {
  msgCounter++;
  const id = overrides.id ?? `${1000 + msgCounter}`;
  const channelId = overrides.channelId ?? 'chan-001';
  return {
    id,
    channelId,
    guildId: overrides.guildId ?? 'guild-001',
    type: overrides.type ?? 0,
    content: overrides.content ?? '',
    url: overrides.url ?? `https://discord.com/channels/guild-001/${channelId}/${id}`,
    author: overrides.author ?? { id: 'user-001', username: 'testuser' },
    embeds: overrides.embeds ?? [],
    attachments: overrides.attachments ?? new Map(),
    components: overrides.components ?? [],
    reference: overrides.reference,
    referencedMessage: overrides.referencedMessage,
    messageSnapshots: overrides.messageSnapshots,
  };
}

export function createMockEmbed(overrides: Partial<MockEmbed> = {}): MockEmbed {
  return {
    title: overrides.title,
    description: overrides.description,
    color: overrides.color,
    url: overrides.url,
    author: overrides.author,
    thumbnail: overrides.thumbnail,
    image: overrides.image,
    footer: overrides.footer,
    timestamp: overrides.timestamp,
    fields: overrides.fields,
  };
}

// ============================================================================
// MOCK CLIENT — simule client.channels.fetch() puis channel.messages.fetch()
// ============================================================================

export interface MockChannel {
  id: string;
  isTextBased(): boolean;
  messages: {
    fetch(messageId: string): Promise<MockMessage>;
  };
}

export interface MockClient {
  channels: {
    fetch(channelId: string): Promise<MockChannel | null>;
  };
}

/**
 * Crée un MockClient avec un registre de canaux et messages.
 *
 * Usage:
 *   const { client, registerMessage } = createMockClient();
 *   registerMessage('chan-001', createMockMessage({ id: 'msg-001', ... }));
 *   // Plus tard: client.channels.fetch('chan-001') → channel
 *   //            channel.messages.fetch('msg-001') → message
 *
 * Pour simuler une erreur Discord (403, 404):
 *   registerChannelError('chan-403', { code: 50001, message: 'Missing Access' });
 *   registerMessageError('chan-001', 'msg-404', { code: 10008, message: 'Unknown Message' });
 */
export function createMockClient(): {
  client: MockClient;
  channels: Map<string, MockChannel>;
  registerMessage: (channelId: string, message: MockMessage) => void;
  registerChannelError: (channelId: string, error: { code: number; message: string }) => void;
  registerMessageError: (
    channelId: string,
    messageId: string,
    error: { code: number; message: string }
  ) => void;
} {
  const channels = new Map<string, MockChannel>();
  const channelErrors = new Map<string, { code: number; message: string }>();
  const messageErrors = new Map<
    string,
    Map<string, { code: number; message: string }>
  >();

  // Registre: channelId → messageId → message
  const messageRegistry = new Map<string, Map<string, MockMessage>>();

  function ensureChannel(channelId: string): MockChannel {
    let channel = channels.get(channelId);
    if (!channel) {
      const msgs = messageRegistry.get(channelId) ?? new Map();
      messageRegistry.set(channelId, msgs);

      channel = {
        id: channelId,
        isTextBased: () => true,
        messages: {
          fetch: async (messageId: string): Promise<MockMessage> => {
            // Vérifier d'abord les erreurs de message enregistrées
            const msgErrMap = messageErrors.get(channelId);
            if (msgErrMap) {
              const err = msgErrMap.get(messageId);
              if (err) {
                const e: any = new Error(err.message);
                e.code = err.code;
                throw e;
              }
            }
            const msg = msgs.get(messageId);
            if (!msg) {
              const e: any = new Error('Unknown Message');
              e.code = 10008;
              throw e;
            }
            return msg;
          },
        },
      };
      channels.set(channelId, channel);
    }
    return channel;
  }

  function registerMessage(channelId: string, message: MockMessage): void {
    const msgs = messageRegistry.get(channelId) ?? new Map();
    msgs.set(message.id, message);
    messageRegistry.set(channelId, msgs);
    ensureChannel(channelId);
  }

  function registerChannelError(
    channelId: string,
    error: { code: number; message: string }
  ): void {
    channelErrors.set(channelId, error);
  }

  function registerMessageError(
    channelId: string,
    messageId: string,
    error: { code: number; message: string }
  ): void {
    if (!messageErrors.has(channelId)) {
      messageErrors.set(channelId, new Map());
    }
    messageErrors.get(channelId)!.set(messageId, error);
    ensureChannel(channelId);
  }

  const client: MockClient = {
    channels: {
      fetch: async (channelId: string): Promise<MockChannel | null> => {
        // Vérifier les erreurs de canal enregistrées
        const chanErr = channelErrors.get(channelId);
        if (chanErr) {
          const e: any = new Error(chanErr.message);
          e.code = chanErr.code;
          throw e;
        }
        const channel = channels.get(channelId);
        if (!channel) {
          const e: any = new Error('Unknown Channel');
          e.code = 10003;
          throw e;
        }
        return channel;
      },
    },
  };

  return { client, channels, registerMessage, registerChannelError, registerMessageError };
}
