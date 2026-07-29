/**
 * Tests unitaires — parseDiscordMessageUrl
 *
 * Valide:
 *   - URLs Discord standard (discord.com, discordapp.com)
 *   - Variantes canary/ptb
 *   - @me (DMs)
 *   - URLs invalides → null
 *   - IDs préservés comme strings (pas de perte de précision)
 */

import { describe, it, expect } from 'vitest';
import { parseDiscordMessageUrl } from '../src/tools/resolveMessage.js';

describe('parseDiscordMessageUrl', () => {
  it('parse une URL discord.com standard', () => {
    const result = parseDiscordMessageUrl(
      'https://discord.com/channels/1528821324443549806/1528821325206917202/1531785695394529302'
    );
    expect(result).toEqual({
      guildId: '1528821324443549806',
      channelId: '1528821325206917202',
      messageId: '1531785695394529302',
    });
  });

  it('parse une URL canary.discord.com', () => {
    const result = parseDiscordMessageUrl(
      'https://canary.discord.com/channels/111/222/333'
    );
    expect(result).toEqual({
      guildId: '111',
      channelId: '222',
      messageId: '333',
    });
  });

  it('parse une URL ptb.discord.com', () => {
    const result = parseDiscordMessageUrl(
      'https://ptb.discord.com/channels/111/222/333'
    );
    expect(result).toEqual({
      guildId: '111',
      channelId: '222',
      messageId: '333',
    });
  });

  it('parse une URL discordapp.com (ancien domaine)', () => {
    const result = parseDiscordMessageUrl(
      'https://discordapp.com/channels/111/222/333'
    );
    expect(result).toEqual({
      guildId: '111',
      channelId: '222',
      messageId: '333',
    });
  });

  it('parse une URL avec @me (DM)', () => {
    const result = parseDiscordMessageUrl(
      'https://discord.com/channels/@me/444/555'
    );
    expect(result).toEqual({
      guildId: undefined,
      channelId: '444',
      messageId: '555',
    });
  });

  it('parse une URL HTTP (non-HTTPS)', () => {
    const result = parseDiscordMessageUrl(
      'http://discord.com/channels/111/222/333'
    );
    expect(result).toEqual({
      guildId: '111',
      channelId: '222',
      messageId: '333',
    });
  });

  it('retourne null pour une URL Google', () => {
    expect(parseDiscordMessageUrl('https://google.com')).toBeNull();
  });

  it('retourne null pour une URL Discord incomplète (sans messageId)', () => {
    expect(
      parseDiscordMessageUrl('https://discord.com/channels/111/222')
    ).toBeNull();
  });

  it('retourne null pour une chaîne vide', () => {
    expect(parseDiscordMessageUrl('')).toBeNull();
  });

  it('retourne null pour du texte aléatoire', () => {
    expect(parseDiscordMessageUrl('ceci nest pas une url')).toBeNull();
  });

  it('préserve les grands IDs Discord sans perte de précision', () => {
    const bigGuildId = '999999999999999999999';
    const bigChannelId = '888888888888888888888';
    const bigMessageId = '777777777777777777777';
    const result = parseDiscordMessageUrl(
      `https://discord.com/channels/${bigGuildId}/${bigChannelId}/${bigMessageId}`
    );
    expect(result).not.toBeNull();
    expect(result!.guildId).toBe(bigGuildId);
    expect(result!.channelId).toBe(bigChannelId);
    expect(result!.messageId).toBe(bigMessageId);
    // Vérifier que ce ne sont pas des nombres (seraient arrondis)
    expect(typeof result!.messageId).toBe('string');
  });
});
