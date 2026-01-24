import { z } from 'zod';
import Logger from '../utils/logger.js';

// Schéma pour la validation de l'outil code_preview
export const CodePreviewSchema = z.object({
  channelId: z.string().describe('ID du canal où afficher le code'),
  code: z.string().describe('Code à afficher avec coloration syntaxique'),
  language: z.string().describe('Langage de programmation (js, ts, py, bash, etc.)'),
});

// Langages supportés avec leurs balises markdown
export const SUPPORTED_LANGUAGES: { [key: string]: string } = {
  javascript: 'js',
  js: 'js',
  typescript: 'ts',
  ts: 'ts',
  python: 'py',
  py: 'py',
  diff: 'diff',
  markdown: 'md',
  md: 'md',
  json: 'json',
  yaml: 'yaml',
  bash: 'bash',
  shell: 'bash',
  sh: 'bash',
  css: 'css',
  html: 'html',
  xml: 'xml',
  sql: 'sql',
  java: 'java',
  c: 'c',
  cpp: 'cpp',
  csharp: 'cs',
  cs: 'cs',
  php: 'php',
  ruby: 'rb',
  go: 'go',
  rust: 'rs',
  kotlin: 'kt',
  swift: 'swift',
  r: 'r',
  scala: 'scala',
  perl: 'pl',
  lua: 'lua',
  vim: 'vim',
  dockerfile: 'dockerfile',
  makefile: 'makefile',
  ini: 'ini',
  toml: 'toml',
  properties: 'properties',
};



// Créer un ou plusieurs messages avec code (division automatique si trop long)
export const createCodePreviewMessages = (code: string, language: string): string[] => {
  // Normaliser le langage
  const normalizedLang = language.toLowerCase();
  const langTag = SUPPORTED_LANGUAGES[normalizedLang] || normalizedLang;
  const lineCount = code.split('\n').length;
  const displayLang = language.toUpperCase();

  // Le code est toujours utilisé tel quel
  const formattedContent = code;

  // En-tête pour le markdown
  const baseHeader = `📝 **Code Preview** [v2.1-HEX]
Langage: ${displayLang}
Lignes: ${lineCount}

`;
  const BACKTICK = '\x60';
  const separator = `

---

`;

  // Calculer la longueur disponible (max 2000 - marge de sécurité)
  const maxTotalLength = 1950;

  // TOUJOURS envelopper dans un bloc de code markdown, quel que soit le langage
  // BACKTICK est déjà déclaré plus haut
  const codeBlockStart = BACKTICK + BACKTICK + BACKTICK + langTag + '\n';
  const codeBlockEnd = '\n' + BACKTICK + BACKTICK + BACKTICK;
  const totalCodeLength = codeBlockStart.length + formattedContent.length + codeBlockEnd.length;
  const totalWithHeader = baseHeader.length + totalCodeLength;

  // DEBUG: Afficher les informations de calcul
  Logger.info('[CODE_PREVIEW] DEBUG - Longueur du code:', code.length);
  Logger.info('[CODE_PREVIEW] DEBUG - Longueur après formatage:', formattedContent.length);
  Logger.info('[CODE_PREVIEW] DEBUG - maxTotalLength:', maxTotalLength);
  Logger.info('[CODE_PREVIEW] DEBUG - baseHeader.length:', baseHeader.length);
  Logger.info('[CODE_PREVIEW] DEBUG - codeBlockStart:', JSON.stringify(codeBlockStart));
  Logger.info('[CODE_PREVIEW] DEBUG - codeBlockEnd:', JSON.stringify(codeBlockEnd));
  Logger.info('[CODE_PREVIEW] DEBUG - totalWithHeader:', totalWithHeader);
  Logger.info('[CODE_PREVIEW] DEBUG - totalWithHeader <= maxTotalLength?', totalWithHeader <= maxTotalLength);
  // DEBUG: Afficher le message complet qui sera envoyé
  const fullMessage = `${baseHeader}${codeBlockStart}${formattedContent}${codeBlockEnd}`;
  Logger.info('[CODE_PREVIEW] DEBUG - Message complet:', JSON.stringify(fullMessage));

  // Si le contenu tient dans un seul message
  if (totalWithHeader <= maxTotalLength) {
    return [`${baseHeader}${codeBlockStart}${formattedContent}${codeBlockEnd}`];
  }

  // Diviser le code en plusieurs parties (par lignes complètes)
  const messages: string[] = [];
  const lines = formattedContent.split('\n');
  const totalLines = lines.length;
  let currentLineIndex = 0;
  let partNumber = 1;

  while (currentLineIndex < totalLines) {
    // Construire l'en-tête avec le numéro de partie
    const partHeader = partNumber === 1
      ? `📝 **Code Preview**
Langage: ${displayLang}
Lignes: ${lineCount}

`
      : `📝 **Code Preview** (Suite ${partNumber})
Langage: ${displayLang}
Lignes: ${lineCount}

`;

    // Calculer la longueur disponible pour cette partie (en comptant les balises de code)
    // TOUJOURS utiliser des blocs de code markdown, quel que soit le langage
    // Utilisation des codes hex pour éviter les problèmes d'encodage
    const BACKTICK = '\x60'; // Code hex U+0060 pour le backtick
    const partCodeBlockStart = BACKTICK + BACKTICK + BACKTICK + langTag + '\n';
    const partCodeBlockEnd = '\n' + BACKTICK + BACKTICK + BACKTICK;
    const availableLength = maxTotalLength - partHeader.length - partCodeBlockStart.length - partCodeBlockEnd.length;

    // Construire un chunk de lignes qui respecte la limite de longueur
    const chunkLines: string[] = [];
    let chunkLength = 0;

    while (currentLineIndex < totalLines) {
      const line = lines[currentLineIndex];
      // +1 pour le caractère '\n' qui sera ajouté entre les lignes
      const lineLength = chunkLines.length > 0 ? line.length + 1 : line.length;

      if (chunkLength + lineLength > availableLength) {
        // Cette ligne ne rentrera pas, on s'arrête
        break;
      }

      chunkLines.push(line);
      chunkLength += lineLength;
      currentLineIndex++;
    }

    // Si aucune ligne n'a été ajoutée (première ligne trop longue), on force au moins une ligne
    if (chunkLines.length === 0 && currentLineIndex < totalLines) {
      chunkLines.push(lines[currentLineIndex]);
      currentLineIndex++;
      Logger.warn('[CODE_PREVIEW] Une ligne dépasse la limite, elle sera coupée');
    }

    // Joindre les lignes du chunk
    const codeChunk = chunkLines.join('\n');

    // Construire le message de la partie avec bloc de code markdown (sauf pour markdown)
    let partMessage = `${partHeader}${partCodeBlockStart}${codeChunk}${partCodeBlockEnd}`;

    // Ajouter un séparateur si ce n'est pas la dernière partie
    if (currentLineIndex < totalLines) {
      partMessage += separator;
      partMessage += `*[Suite dans le message suivant...]*`;
    }

    messages.push(partMessage);

    partNumber++;

    // Protection contre les boucles infinies
    if (chunkLines.length === 0) {
      Logger.error('[CODE_PREVIEW] Erreur: aucune ligne ajoutée, arrêt de la division');
      break;
    }
  }

  Logger.info(
    `[CODE_PREVIEW] Division: ${messages.length} message(s) créé(s) pour ${code.length} caractères`
  );
  return messages;
};

// Fonction de compatibilité (garder l'ancienne pour les appels existants)
export const createCodePreviewMessage = createCodePreviewMessages;

// Valider le langage
export const validateLanguage = (language: string): boolean => {
  const normalizedLang = language.toLowerCase();
  return (
    normalizedLang in SUPPORTED_LANGUAGES ||
    Object.values(SUPPORTED_LANGUAGES).includes(normalizedLang)
  );
};

// ============================================================================
// ENREGISTREMENT DE L'OUTIL MCP
// ============================================================================

import type { FastMCP } from 'fastmcp';
import { ensureDiscordConnection } from './common.js';

export function registerCodePreviewTools(server: FastMCP) {
  server.addTool({
    name: 'code_preview',
    description: 'Affiche du code avec coloration syntaxique et division automatique si trop long',
    parameters: z.object({
      channelId: z.string().describe('ID du canal où afficher le code'),
      code: z.string().describe('Code à afficher avec coloration syntaxique'),
      language: z.string().describe('Langage de programmation (js, ts, py, bash, etc.)'),
    }),
    execute: async (args) => {
      try {
        Logger.error(
          `🔍 [code_preview] Langage: ${args.language}, Taille: ${args.code.length} chars`
        );
        const client = await ensureDiscordConnection();
        const channel = await client.channels.fetch(args.channelId);

        if (!channel || !('send' in channel)) {
          throw new Error('Canal invalide ou inaccessible');
        }

        // Valider le langage
        if (!validateLanguage(args.language)) {
          return `❌ Langage non supporté: ${args.language}`;
        }

        // Créer les messages avec division automatique
        const messages = createCodePreviewMessages(args.code, args.language);
        Logger.error(`📤 [code_preview] ${messages.length} message(s) à envoyer`);

        // Envoyer tous les messages
        const sentMessages = [];
        for (const messageContent of messages) {
          const message = await channel.send(messageContent);
          sentMessages.push(message.id);
        }

        return `✅ Code affiché | ${messages.length} message(s) | IDs: ${sentMessages.join(', ')}`;
      } catch (error: any) {
        Logger.error(`❌ [code_preview]`, error.message);
        return `❌ Erreur: ${error.message}`;
      }
    },
  });

  Logger.info('✅ Outils code_preview enregistrés');
}
