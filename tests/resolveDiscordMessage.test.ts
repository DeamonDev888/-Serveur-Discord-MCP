/**
 * Tests unitaires — resolveDiscordMessage
 *
 * Couvre les tests d'acceptation 1-9 du rapport de bug:
 *   1. Lecture par ID dans le même canal → objet unique
 *   2. Réponse standard → reference + resolvedTarget
 *   3. Référence vers autre canal accessible → résout l'embed cible
 *   4. URL Discord brute → résout la cible
 *   5. Canal inaccessible → MISSING_ACCESS
 *   6. Message supprimé → MESSAGE_NOT_FOUND
 *   7. Cycle A→B→A → REFERENCE_CYCLE
 *   8. Chaîne A→B→C respecte maxDepth
 *   9. IDs comme strings
 *  + canaux non-textuels, URL invalide, résolution sans followReferences
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { resolveDiscordMessage } from '../src/tools/resolveMessage.js';
import {
  createMockClient,
  createMockMessage,
  createMockEmbed,
} from './mocks/discord.js';

describe('resolveDiscordMessage', () => {
  describe('Test 1: Lecture par ID dans le même canal', () => {
    it('retourne un objet unique quand channelId + messageId sont fournis', async () => {
      const { client, registerMessage } = createMockClient();
      registerMessage(
        'chan-001',
        createMockMessage({ id: 'msg-001', content: 'Hello' })
      );

      const result = await resolveDiscordMessage(client as any, {
        channelId: 'chan-001',
        messageId: 'msg-001',
        followReferences: false,
      });

      expect('ok' in result).toBe(false);
      if ('ok' in result) return;
      expect(result.id).toBe('msg-001');
      expect(result.content).toBe('Hello');
      expect(result.channelId).toBe('chan-001');
    });
  });

  describe('Test 2: Réponse standard → reference + resolvedTarget', () => {
    it('suit message_reference vers un autre canal et résout la cible', async () => {
      const { client, registerMessage } = createMockClient();

      // Message cible (avec embed) dans un AUTRE canal
      registerMessage(
        'chan-target',
        createMockMessage({
          id: 'msg-target',
          channelId: 'chan-target',
          content: 'Message original avec embed',
          embeds: [createMockEmbed({ title: 'Étude de marché', description: '5 gaps' })],
        })
      );

      // Message de réponse (dans chan-source) qui référence msg-target
      registerMessage(
        'chan-source',
        createMockMessage({
          id: 'msg-reply',
          channelId: 'chan-source',
          content: '',
          reference: { channelId: 'chan-target', messageId: 'msg-target' },
        })
      );

      const result = await resolveDiscordMessage(client as any, {
        channelId: 'chan-source',
        messageId: 'msg-reply',
        followReferences: true,
      });

      expect('ok' in result).toBe(false);
      if ('ok' in result) return;

      expect(result.id).toBe('msg-reply');
      expect(result.reference).toEqual({
        channelId: 'chan-target',
        messageId: 'msg-target',
      });
      // resolvedTarget doit contenir le message cross-canal
      expect(result.resolvedTarget).toBeDefined();
      expect(result.resolvedTarget!.id).toBe('msg-target');
      expect(result.resolvedTarget!.channelId).toBe('chan-target');
      expect(result.resolvedTarget!.embedCount).toBe(1);
    });
  });

  describe('Test 3: Référence cross-canal résout l\'embed cible', () => {
    it('l\'embed cible est accessible dans resolvedTarget', async () => {
      const { client, registerMessage } = createMockClient();

      registerMessage(
        'chan-other',
        createMockMessage({
          id: 'msg-embed',
          channelId: 'chan-other',
          embeds: [
            createMockEmbed({
              title: 'Analyse concurrentielle',
              fields: [
                { name: 'Gap 1', value: 'SSL manquant' },
                { name: 'Gap 2', value: 'Pas de mobile' },
              ],
            }),
          ],
        })
      );

      registerMessage(
        'chan-001',
        createMockMessage({
          id: 'msg-001',
          channelId: 'chan-001',
          content: '',
          reference: { channelId: 'chan-other', messageId: 'msg-embed' },
        })
      );

      const result = await resolveDiscordMessage(client as any, {
        channelId: 'chan-001',
        messageId: 'msg-001',
        followReferences: true,
      });

      if ('ok' in result) {
        expect.fail('Ne devrait pas être une erreur');
        return;
      }
      expect(result.resolvedTarget).toBeDefined();
      expect(result.resolvedTarget!.embeds).toHaveLength(1);
      expect(result.resolvedTarget!.embeds[0].title).toBe('Analyse concurrentielle');
      expect(result.resolvedTarget!.embeds[0].fields).toHaveLength(2);
    });
  });

  describe('Test 4: URL Discord brute dans le contenu', () => {
    it('suit une URL Discord trouvée dans le contenu', async () => {
      const { client, registerMessage } = createMockClient();

      registerMessage(
        '2000000000000000002',
        createMockMessage({
          id: '3000000000000000002',
          channelId: '2000000000000000002',
          content: 'Message cible via URL',
          embeds: [createMockEmbed({ title: 'Via URL' })],
        })
      );

      // Le message source contient une URL Discord brute (pas de reference)
      registerMessage(
        '2000000000000000001',
        createMockMessage({
          id: '3000000000000000001',
          channelId: '2000000000000000001',
          content: 'Voir https://discord.com/channels/1000000000000000001/2000000000000000002/3000000000000000002',
        })
      );

      const result = await resolveDiscordMessage(client as any, {
        channelId: '2000000000000000001',
        messageId: '3000000000000000001',
        followReferences: true,
      });

      if ('ok' in result) {
        expect.fail('Ne devrait pas être une erreur: ' + result.message);
        return;
      }
      expect(result.id).toBe('3000000000000000001');
      expect(result.resolvedTarget).toBeDefined();
      expect(result.resolvedTarget!.id).toBe('3000000000000000002');
      expect(result.resolvedTarget!.channelId).toBe('2000000000000000002');
    });
  });

  describe('Test 5: Canal inaccessible → MISSING_ACCESS', () => {
    it('retourne MISSING_ACCESS (pas NO_EMBED) quand le bot n\'a pas accès', async () => {
      const { client, registerChannelError } = createMockClient();
      registerChannelError('chan-forbidden', { code: 50001, message: 'Missing Access' });

      const result = await resolveDiscordMessage(client as any, {
        channelId: 'chan-forbidden',
        messageId: 'msg-001',
        followReferences: false,
      });

      expect('ok' in result).toBe(true);
      if (!('ok' in result)) return;
      expect(result.code).toBe('MISSING_ACCESS');
      expect(result.code).not.toBe('NO_EMBED');
    });
  });

  describe('Test 6: Message supprimé → MESSAGE_NOT_FOUND', () => {
    it('retourne MESSAGE_NOT_FOUND quand le message n\'existe pas', async () => {
      const { client, registerMessage } = createMockClient();
      // Enregistrer un canal existant (avec un autre message) pour que
      // channels.fetch réussisse, mais le message ciblé n'existe pas → 10008
      registerMessage(
        '1000000000000000001',
        createMockMessage({ id: '1000000000000000099', channelId: '1000000000000000001' })
      );

      const result = await resolveDiscordMessage(client as any, {
        channelId: '1000000000000000001',
        messageId: '1000000000000000002',
        followReferences: false,
      });

      expect('ok' in result).toBe(true);
      if (!('ok' in result)) return;
      expect(result.code).toBe('MESSAGE_NOT_FOUND');
    });

    it('retourne MESSAGE_NOT_FOUND avec erreur explicite 10008', async () => {
      const { client, registerMessageError } = createMockClient();
      registerMessageError('chan-001', 'msg-explicit-404', {
        code: 10008,
        message: 'Unknown Message',
      });

      const result = await resolveDiscordMessage(client as any, {
        channelId: 'chan-001',
        messageId: 'msg-explicit-404',
        followReferences: false,
      });

      expect('ok' in result).toBe(true);
      if (!('ok' in result)) return;
      expect(result.code).toBe('MESSAGE_NOT_FOUND');
    });
  });

  describe('Test 7: Canal inexistant → CHANNEL_NOT_FOUND', () => {
    it('retourne CHANNEL_NOT_FOUND pour un canal qui n\'existe pas', async () => {
      const { client, registerChannelError } = createMockClient();
      registerChannelError('chan-ghost', { code: 10003, message: 'Unknown Channel' });

      const result = await resolveDiscordMessage(client as any, {
        channelId: 'chan-ghost',
        messageId: 'msg-001',
        followReferences: false,
      });

      expect('ok' in result).toBe(true);
      if (!('ok' in result)) return;
      expect(result.code).toBe('CHANNEL_NOT_FOUND');
    });
  });

  describe('Test 8: Cycle A→B→A → REFERENCE_CYCLE', () => {
    it('détecte un cycle de référence et retourne REFERENCE_CYCLE', async () => {
      const { client, registerMessage } = createMockClient();

      // msg-A référence msg-B, msg-B référence msg-A → cycle
      registerMessage(
        'chan-1',
        createMockMessage({
          id: 'msg-A',
          channelId: 'chan-1',
          reference: { channelId: 'chan-2', messageId: 'msg-B' },
        })
      );
      registerMessage(
        'chan-2',
        createMockMessage({
          id: 'msg-B',
          channelId: 'chan-2',
          reference: { channelId: 'chan-1', messageId: 'msg-A' },
        })
      );

      const result = await resolveDiscordMessage(client as any, {
        channelId: 'chan-1',
        messageId: 'msg-A',
        followReferences: true,
        maxDepth: 10,
      });

      // Le résultat doit être une erreur (le cycle est détecté au 2e niveau)
      expect('ok' in result).toBe(true);
      if (!('ok' in result)) return;
      expect(result.code).toBe('REFERENCE_CYCLE');
    });
  });

  describe('Test 9: maxDepth respecté', () => {
    it('retourne MAX_DEPTH quand la chaîne dépasse maxDepth', async () => {
      const { client, registerMessage } = createMockClient();

      // Chaîne: msg-1 → msg-2 → msg-3 → msg-4
      registerMessage(
        'c1',
        createMockMessage({
          id: 'msg-1',
          channelId: 'c1',
          reference: { channelId: 'c2', messageId: 'msg-2' },
        })
      );
      registerMessage(
        'c2',
        createMockMessage({
          id: 'msg-2',
          channelId: 'c2',
          reference: { channelId: 'c3', messageId: 'msg-3' },
        })
      );
      registerMessage(
        'c3',
        createMockMessage({
          id: 'msg-3',
          channelId: 'c3',
          reference: { channelId: 'c4', messageId: 'msg-4' },
        })
      );
      registerMessage(
        'c4',
        createMockMessage({
          id: 'msg-4',
          channelId: 'c4',
          embeds: [createMockEmbed({ title: 'Final' })],
        })
      );

      // maxDepth=2 → on dépasse à msg-3
      const result = await resolveDiscordMessage(client as any, {
        channelId: 'c1',
        messageId: 'msg-1',
        followReferences: true,
        maxDepth: 2,
      });

      expect('ok' in result).toBe(true);
      if (!('ok' in result)) return;
      expect(result.code).toBe('MAX_DEPTH');
    });
  });

  describe('Test 10: IDs Discord comme strings', () => {
    it('les IDs longs sont préservés comme strings, pas arrondis', async () => {
      const bigId = '1531785695394529302';
      const { client, registerMessage } = createMockClient();
      registerMessage(
        'chan-001',
        createMockMessage({ id: bigId })
      );

      const result = await resolveDiscordMessage(client as any, {
        channelId: 'chan-001',
        messageId: bigId,
        followReferences: false,
      });

      if ('ok' in result) {
        expect.fail('Ne devrait pas être une erreur');
        return;
      }
      expect(result.id).toBe(bigId);
      expect(typeof result.id).toBe('string');
    });
  });

  describe('Test 11: followReferences=false ne suit pas les références', () => {
    it('retourne seulement le message sans resolvedTarget', async () => {
      const { client, registerMessage } = createMockClient();

      registerMessage(
        'chan-target',
        createMockMessage({
          id: 'msg-target',
          channelId: 'chan-target',
          embeds: [createMockEmbed({ title: 'Target' })],
        })
      );
      registerMessage(
        'chan-source',
        createMockMessage({
          id: 'msg-source',
          channelId: 'chan-source',
          reference: { channelId: 'chan-target', messageId: 'msg-target' },
        })
      );

      const result = await resolveDiscordMessage(client as any, {
        channelId: 'chan-source',
        messageId: 'msg-source',
        followReferences: false,
      });

      if ('ok' in result) {
        expect.fail('Ne devrait pas être une erreur');
        return;
      }
      expect(result.id).toBe('msg-source');
      expect(result.reference).toBeDefined();
      expect(result.resolvedTarget).toBeUndefined();
    });
  });

  describe('Test 12: Résolution par messageUrl', () => {
    it('résout un message via messageUrl seul (sans channelId/messageId)', async () => {
      const { client, registerMessage } = createMockClient();

      registerMessage(
        '2000000000000000012',
        createMockMessage({
          id: '3000000000000000012',
          channelId: '2000000000000000012',
          content: 'Via URL directe',
        })
      );

      const result = await resolveDiscordMessage(client as any, {
        messageUrl: 'https://discord.com/channels/1000000000000000001/2000000000000000012/3000000000000000012',
        followReferences: false,
      });

      if ('ok' in result) {
        expect.fail('Ne devrait pas être une erreur: ' + result.message);
        return;
      }
      expect(result.id).toBe('3000000000000000012');
      expect(result.channelId).toBe('2000000000000000012');
    });
  });

  describe('Test 13: URL invalide', () => {
    it('retourne INVALID_MESSAGE_URL pour une URL non-Discord', async () => {
      const { client } = createMockClient();

      const result = await resolveDiscordMessage(client as any, {
        messageUrl: 'https://google.com',
        followReferences: false,
      });

      expect('ok' in result).toBe(true);
      if (!('ok' in result)) return;
      expect(result.code).toBe('INVALID_MESSAGE_URL');
    });

    it('retourne INVALID_MESSAGE_URL si ni messageUrl ni channelId+messageId', async () => {
      const { client } = createMockClient();

      const result = await resolveDiscordMessage(client as any, {
        followReferences: false,
      });

      expect('ok' in result).toBe(true);
      if (!('ok' in result)) return;
      expect(result.code).toBe('INVALID_MESSAGE_URL');
    });
  });

  describe('Test 14: resolutionChain', () => {
    it('retourne la chaîne de résolution (source + target)', async () => {
      const { client, registerMessage } = createMockClient();

      registerMessage(
        'chan-target',
        createMockMessage({
          id: 'msg-target',
          channelId: 'chan-target',
          embeds: [createMockEmbed({ title: 'Target' })],
        })
      );
      registerMessage(
        'chan-source',
        createMockMessage({
          id: 'msg-source',
          channelId: 'chan-source',
          reference: { channelId: 'chan-target', messageId: 'msg-target' },
        })
      );

      const result = await resolveDiscordMessage(client as any, {
        channelId: 'chan-source',
        messageId: 'msg-source',
        followReferences: true,
      });

      if ('ok' in result) {
        expect.fail('Ne devrait pas être une erreur');
        return;
      }
      expect(result.resolutionChain).toBeDefined();
      expect(result.resolutionChain).toHaveLength(2);
      expect(result.resolutionChain![0]).toEqual({
        channelId: 'chan-source',
        messageId: 'msg-source',
      });
      expect(result.resolutionChain![1]).toEqual({
        channelId: 'chan-target',
        messageId: 'msg-target',
      });
    });
  });
});
