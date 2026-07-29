/**
 * Tests unitaires — serializeFullMessage
 *
 * Valide:
 *   - Champs de base (id, channelId, guildId, type, content, url, author)
 *   - reference (message_reference cross-canal)
 *   - referencedMessage (récursif)
 *   - embeds détaillés (titre, description, couleur hex, fields)
 *   - attachments
 *   - components (boutons)
 *   - messageSnapshots (forward)
 *   - Message simple (pas d'embed, pas de référence)
 *   - Message avec embed mais sans reference
 */

import { describe, it, expect } from 'vitest';
import { serializeFullMessage } from '../src/tools/resolveMessage.js';
import {
  createMockMessage,
  createMockEmbed,
} from './mocks/discord.js';

describe('serializeFullMessage', () => {
  it('sérialise un message simple (pas d\'embed, pas de référence)', () => {
    const msg = createMockMessage({
      id: 'msg-001',
      content: 'Bonjour le monde',
      author: { id: 'user-1', username: 'alice' },
    });

    const result = serializeFullMessage(msg as any);

    expect(result.id).toBe('msg-001');
    expect(result.content).toBe('Bonjour le monde');
    expect(result.author.id).toBe('user-1');
    expect(result.author.username).toBe('alice');
    expect(result.embedCount).toBe(0);
    expect(result.embeds).toEqual([]);
    expect(result.attachments).toEqual([]);
    expect(result.components).toEqual([]);
    expect(result.reference).toBeUndefined();
    expect(result.referencedMessage).toBeUndefined();
    expect(result.messageSnapshots).toEqual([]);
  });

  it('sérialise un message avec guildId et channelId', () => {
    const msg = createMockMessage({
      id: 'msg-001',
      channelId: 'chan-42',
      guildId: 'guild-99',
    });

    const result = serializeFullMessage(msg as any);

    expect(result.channelId).toBe('chan-42');
    expect(result.guildId).toBe('guild-99');
  });

  it('préserve les IDs comme strings (pas de conversion en number)', () => {
    const bigId = '1531785695394529302';
    const msg = createMockMessage({ id: bigId });

    const result = serializeFullMessage(msg as any);

    expect(result.id).toBe(bigId);
    expect(typeof result.id).toBe('string');
  });

  it('sérialise un embed avec titre, description, couleur', () => {
    const msg = createMockMessage({
      embeds: [
        createMockEmbed({
          title: 'Mon titre',
          description: 'Ma description',
          color: 0xff0000,
        }),
      ],
    });

    const result = serializeFullMessage(msg as any);

    expect(result.embedCount).toBe(1);
    expect(result.embeds[0]).toMatchObject({
      title: 'Mon titre',
      description: 'Ma description',
      color: '#ff0000',
    });
  });

  it('convertit la couleur numérique en hex avec padding', () => {
    const msg = createMockMessage({
      embeds: [createMockEmbed({ color: 0x00ff00 })],
    });

    const result = serializeFullMessage(msg as any);

    expect(result.embeds[0].color).toBe('#00ff00');
  });

  it('sérialise les fields d\'un embed', () => {
    const msg = createMockMessage({
      embeds: [
        createMockEmbed({
          fields: [
            { name: 'Gap 1', value: 'Manque SSL', inline: true },
            { name: 'Gap 2', value: 'Pas de mobile', inline: false },
          ],
        }),
      ],
    });

    const result = serializeFullMessage(msg as any);

    expect(result.embeds[0].fields).toHaveLength(2);
    expect(result.embeds[0].fields[0]).toMatchObject({
      name: 'Gap 1',
      value: 'Manque SSL',
      inline: true,
    });
  });

  it('sérialise author, thumbnail, image, footer d\'un embed', () => {
    const msg = createMockMessage({
      embeds: [
        createMockEmbed({
          author: { name: 'Bot', url: 'https://example.com', iconURL: 'https://img.com/icon.png' },
          thumbnail: { url: 'https://img.com/thumb.png' },
          image: { url: 'https://img.com/big.png' },
          footer: { text: 'Footer text', iconURL: 'https://img.com/footer.png' },
        }),
      ],
    });

    const result = serializeFullMessage(msg as any);

    expect(result.embeds[0].author).toEqual({
      name: 'Bot',
      url: 'https://example.com',
      iconURL: 'https://img.com/icon.png',
    });
    expect(result.embeds[0].thumbnail).toEqual({ url: 'https://img.com/thumb.png' });
    expect(result.embeds[0].image).toEqual({ url: 'https://img.com/big.png' });
    expect(result.embeds[0].footer).toEqual({
      text: 'Footer text',
      iconURL: 'https://img.com/footer.png',
    });
  });

  it('sérialise message_reference (cross-canal)', () => {
    const msg = createMockMessage({
      reference: {
        guildId: 'guild-2',
        channelId: 'chan-target',
        messageId: 'msg-target',
      },
    });

    const result = serializeFullMessage(msg as any);

    expect(result.reference).toEqual({
      guildId: 'guild-2',
      channelId: 'chan-target',
      messageId: 'msg-target',
    });
  });

  it('sérialise referencedMessage (récursif)', () => {
    const referenced = createMockMessage({
      id: 'msg-ref',
      content: 'Message d\'origine',
    });
    const msg = createMockMessage({
      id: 'msg-reply',
      reference: { channelId: 'chan-1', messageId: 'msg-ref' },
      referencedMessage: referenced,
    });

    const result = serializeFullMessage(msg as any);

    expect(result.referencedMessage).toBeDefined();
    expect(result.referencedMessage!.id).toBe('msg-ref');
    expect(result.referencedMessage!.content).toBe('Message d\'origine');
  });

  it('sérialise les attachments', () => {
    const msg = createMockMessage({
      attachments: new Map([
        ['att-1', { id: 'att-1', name: 'doc.pdf', url: 'https://cdn.com/doc.pdf', contentType: 'application/pdf', size: 1024 }],
      ]),
    });

    const result = serializeFullMessage(msg as any);

    expect(result.attachments).toHaveLength(1);
    expect(result.attachments[0]).toMatchObject({
      id: 'att-1',
      name: 'doc.pdf',
      url: 'https://cdn.com/doc.pdf',
    });
  });

  it('sérialise les components (boutons)', () => {
    const msg = createMockMessage({
      components: [
        {
          type: 1,
          components: [
            { type: 2, label: 'Clique', style: 1, customId: 'btn-1' },
          ],
        },
      ],
    });

    const result = serializeFullMessage(msg as any);

    expect(result.components).toHaveLength(1);
    expect(result.components[0]).toMatchObject({ type: 1 });
    expect(result.components[0].components[0]).toMatchObject({
      type: 2,
      label: 'Clique',
      style: 1,
      customId: 'btn-1',
    });
  });

  it('sérialise messageSnapshots (message forward)', () => {
    const msg = createMockMessage({
      messageSnapshots: [{ content: 'Forwarded', embeds: [] }],
    });

    const result = serializeFullMessage(msg as any);

    expect(result.messageSnapshots).toHaveLength(1);
    expect(result.messageSnapshots[0]).toMatchObject({ content: 'Forwarded' });
  });

  it('le type du message est préservé', () => {
    const msg = createMockMessage({ type: 19 }); // 19 = Reply
    const result = serializeFullMessage(msg as any);
    expect(result.type).toBe(19);
  });

  it('l\'url du message est préservée', () => {
    const url = 'https://discord.com/channels/g/c/m';
    const msg = createMockMessage({ url });
    const result = serializeFullMessage(msg as any);
    expect(result.url).toBe(url);
  });

  it('gère un message avec embedCount multiple', () => {
    const msg = createMockMessage({
      embeds: [
        createMockEmbed({ title: 'Embed 1' }),
        createMockEmbed({ title: 'Embed 2' }),
        createMockEmbed({ title: 'Embed 3' }),
      ],
    });

    const result = serializeFullMessage(msg as any);

    expect(result.embedCount).toBe(3);
    expect(result.embeds).toHaveLength(3);
  });
});
