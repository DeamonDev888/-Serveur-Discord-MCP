/**
 * Tests unitaires — extractDiscordMessageUrls
 *
 * Valide:
 *   - Extraction depuis le contenu textuel
 *   - Extraction depuis les embeds (description, url, fields)
 *   - Extraction depuis les components (boutons avec URL)
 *   - URLs multiples → toutes extraites
 *   - Déduplication
 *   - Contenu vide / sans URL → []
 */

import { describe, it, expect } from 'vitest';
import { extractDiscordMessageUrls } from '../src/tools/resolveMessage.js';

describe('extractDiscordMessageUrls', () => {
  it('extrait une URL unique du contenu', () => {
    const urls = extractDiscordMessageUrls(
      'Voir https://discord.com/channels/111/222/333'
    );
    expect(urls).toHaveLength(1);
    expect(urls[0]).toBe('https://discord.com/channels/111/222/333');
  });

  it('extrait plusieurs URLs du contenu', () => {
    const urls = extractDiscordMessageUrls(
      'Voir https://discord.com/channels/111/222/333 et aussi https://canary.discord.com/channels/@me/444/555'
    );
    expect(urls).toHaveLength(2);
    expect(urls).toContain('https://discord.com/channels/111/222/333');
    expect(urls).toContain('https://canary.discord.com/channels/@me/444/555');
  });

  it('déduplique les URLs identiques', () => {
    const url = 'https://discord.com/channels/111/222/333';
    const urls = extractDiscordMessageUrls(`${url} ${url} ${url}`);
    expect(urls).toHaveLength(1);
  });

  it('retourne [] pour un contenu sans URL Discord', () => {
    expect(extractDiscordMessageUrls('Bonjour tout le monde')).toEqual([]);
  });

  it('retourne [] pour un contenu vide', () => {
    expect(extractDiscordMessageUrls('')).toEqual([]);
  });

  it('retourne [] pour undefined', () => {
    expect(extractDiscordMessageUrls(undefined)).toEqual([]);
  });

  it('extrait une URL depuis la description d\'un embed', () => {
    const embeds = [
      {
        description: 'Lien: https://discord.com/channels/111/222/333',
      },
    ];
    const urls = extractDiscordMessageUrls('', embeds);
    expect(urls).toHaveLength(1);
    expect(urls[0]).toBe('https://discord.com/channels/111/222/333');
  });

  it('extrait une URL depuis l\'url d\'un embed', () => {
    const embeds = [
      {
        url: 'https://discord.com/channels/111/222/333',
      },
    ];
    const urls = extractDiscordMessageUrls('', embeds);
    expect(urls).toHaveLength(1);
  });

  it('extrait une URL depuis un field d\'embed (value)', () => {
    const embeds = [
      {
        fields: [
          { name: 'Lien', value: 'https://discord.com/channels/111/222/333' },
        ],
      },
    ];
    const urls = extractDiscordMessageUrls('', embeds);
    expect(urls).toHaveLength(1);
  });

  it('extrait une URL depuis un field d\'embed (name)', () => {
    const embeds = [
      {
        fields: [
          {
            name: 'https://discord.com/channels/555/666/777',
            value: 'Clique',
          },
        ],
      },
    ];
    const urls = extractDiscordMessageUrls('', embeds);
    expect(urls).toHaveLength(1);
    expect(urls[0]).toContain('555');
  });

  it('extrait une URL depuis un bouton (components)', () => {
    const components = [
      {
        type: 1,
        components: [
          {
            type: 5, // Link button
            label: 'Ouvrir',
            url: 'https://discord.com/channels/111/222/333',
          },
        ],
      },
    ];
    const urls = extractDiscordMessageUrls('', [], components);
    expect(urls).toHaveLength(1);
    expect(urls[0]).toBe('https://discord.com/channels/111/222/333');
  });

  it('combine les URLs du contenu + embeds + components (dédupliquées)', () => {
    const url = 'https://discord.com/channels/111/222/333';
    const content = `Référence: ${url}`;
    const embeds = [{ description: `Voir ${url}` }];
    const components = [
      {
        type: 1,
        components: [{ type: 5, url }],
      },
    ];
    const urls = extractDiscordMessageUrls(content, embeds, components);
    expect(urls).toHaveLength(1); // tous identiques → déduplication
  });

  it('extrait des URLs différentes de contenu + embeds + components', () => {
    const content = 'https://discord.com/channels/111/222/333';
    const embeds = [
      { description: 'https://discord.com/channels/444/555/666' },
    ];
    const components = [
      {
        type: 1,
        components: [
          { url: 'https://discord.com/channels/777/888/999' },
        ],
      },
    ];
    const urls = extractDiscordMessageUrls(content, embeds, components);
    expect(urls).toHaveLength(3);
  });
});
