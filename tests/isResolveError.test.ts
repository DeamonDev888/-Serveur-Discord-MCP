/**
 * Tests unitaires — isResolveError + formatResolveError
 *
 * Valide:
 *   - isResolveError détecte correctement les erreurs vs messages réussis
 *   - formatResolveError formate tous les codes d'erreur
 *   - Les codes d'erreur sont cohérents avec le rapport de bug
 */

import { describe, it, expect } from 'vitest';
import {
  isResolveError,
  formatResolveError,
  type ResolveError,
  type SerializedMessage,
} from '../src/tools/resolveMessage.js';

describe('isResolveError', () => {
  it('retourne true pour une ResolveError', () => {
    const error: ResolveError = {
      ok: false,
      code: 'NO_EMBED',
      message: 'test',
      source: { channelId: '123', messageId: '456' },
    };
    expect(isResolveError(error)).toBe(true);
  });

  it('retourne false pour un message sérialisé réussi', () => {
    const success: SerializedMessage = {
      id: '123',
      channelId: 'chan',
      type: 0,
      content: '',
      url: 'https://discord.com',
      author: { id: 'u', username: 'user' },
      messageSnapshots: [],
      embeds: [],
      embedCount: 0,
      attachments: [],
      components: [],
    };
    expect(isResolveError(success)).toBe(false);
  });

  it('retourne false pour un objet sans propriété ok', () => {
    expect(isResolveError({} as any)).toBe(false);
  });
});

describe('formatResolveError — tous les codes d\'erreur', () => {
  const baseSource = { channelId: 'chan-001', messageId: 'msg-001' };

  const testCases: Array<{ code: string; message: string; expectedCode: string }> = [
    { code: 'MESSAGE_NOT_FOUND', message: 'Message introuvable', expectedCode: 'MESSAGE_NOT_FOUND' },
    { code: 'CHANNEL_NOT_FOUND', message: 'Canal introuvable', expectedCode: 'CHANNEL_NOT_FOUND' },
    { code: 'CHANNEL_NOT_TEXT_BASED', message: 'Canal non textuel', expectedCode: 'CHANNEL_NOT_TEXT_BASED' },
    { code: 'MISSING_ACCESS', message: 'Accès refusé', expectedCode: 'MISSING_ACCESS' },
    { code: 'MISSING_HISTORY_PERMISSION', message: 'Pas de ReadMessageHistory', expectedCode: 'MISSING_HISTORY_PERMISSION' },
    { code: 'MAX_DEPTH', message: 'Profondeur max atteinte', expectedCode: 'MAX_DEPTH' },
    { code: 'REFERENCE_CYCLE', message: 'Cycle détecté', expectedCode: 'REFERENCE_CYCLE' },
    { code: 'INVALID_MESSAGE_URL', message: 'URL invalide', expectedCode: 'INVALID_MESSAGE_URL' },
    { code: 'UNKNOWN_ERROR', message: 'Erreur inconnue', expectedCode: 'UNKNOWN_ERROR' },
  ];

  testCases.forEach(({ code, message, expectedCode }) => {
    it(`formate correctement [${code}]`, () => {
      const error: ResolveError = {
        ok: false,
        code,
        message,
        source: baseSource,
      };
      const formatted = formatResolveError(error);
      expect(formatted).toContain(`[${expectedCode}]`);
      expect(formatted).toContain(message);
      expect(formatted).toContain('chan-001');
      expect(formatted).toContain('msg-001');
    });
  });

  it('gère une erreur sans source', () => {
    const error: ResolveError = {
      ok: false,
      code: 'INVALID_MESSAGE_URL',
      message: 'URL invalide',
    };
    const formatted = formatResolveError(error);
    expect(formatted).toContain('[INVALID_MESSAGE_URL]');
    expect(formatted).not.toContain('channelId');
  });

  it('gère une erreur avec source partiel', () => {
    const error: ResolveError = {
      ok: false,
      code: 'CHANNEL_NOT_FOUND',
      message: 'Canal inexistant',
      source: { channelId: 'chan-ghost' },
    };
    const formatted = formatResolveError(error);
    expect(formatted).toContain('chan-ghost');
    expect(formatted).toContain('messageId: ?');
  });
});
