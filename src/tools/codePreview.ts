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

// Fonction pour envelopper automatiquement le code dans des blocs markdown
const formatCodeBlocks = (content: string): string => {
  const lines = content.split('\n');
  const formattedLines: string[] = [];
  let inCodeBlock = false;
  let codeBuffer: string[] = [];
  let currentLang = 'bash';

  const flushCodeBuffer = (lang: string) => {
    if (codeBuffer.length > 0) {
      formattedLines.push(`\`\`\`${lang}`);
      formattedLines.push(...codeBuffer);
      formattedLines.push('```');
      formattedLines.push(''); // Ligne vide après le bloc
      codeBuffer = [];
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Détecter une ligne de commande bash
    // - Commandes shell : chmod, echo, cd, npm, node, bash, sh, etc.
    // - Appels de fonctions : create_channel(...), edit_message(...)
    // - Variables : SESSION_ID=, $(), etc.
    const isCommandLine = /^(\s*)(chmod|echo|cd|npm|node|pnpm|yarn|bash|sh|\$\s*\(|SESSION[_A-Z]*|create_|edit_|delete_|get_|send_|add_|move_|vote_|appuyer_|selectionner_)/.test(line) ||
                         /\w+\([^)]*\)/.test(line) || // Détecte les appels de fonction avec ()
                         /^(\s*)([A-Z_]{2,})(\s*[:=])/.test(line); // Détecte les constantes comme "BASH:"

    // Détecter une ligne de code JS/TS (import, const, let, class, async, etc.)
    const isJSLine = /^(\s*)(import|export|const|let|var|function|class|async|await|interface|type)/.test(line);

    // Si on n'est pas dans un bloc et qu'on trouve une commande ou du code
    if (!inCodeBlock && (isCommandLine || isJSLine)) {
      // Terminer le markdown précédent si nécessaire
      if (formattedLines.length > 0 && formattedLines[formattedLines.length - 1] !== '') {
        formattedLines.push('');
      }

      // Commencer un bloc de code
      inCodeBlock = true;
      currentLang = isJSLine ? 'javascript' : 'bash';
      codeBuffer = [line];
    }
    // Si on est dans un bloc de code et qu'on trouve une ligne qui n'est pas du code
    else if (inCodeBlock && !isCommandLine && !isJSLine && line.trim() !== '' && !/^#{1,6}\s+/.test(line)) {
      // Fin du bloc de code (mais continuer si c'est un header markdown)
      flushCodeBuffer(currentLang);
      inCodeBlock = false;

      // Ajouter la ligne actuelle au markdown
      formattedLines.push(line);
    }
    // Si on est dans un bloc de code, ajouter à la buffer
    else if (inCodeBlock) {
      codeBuffer.push(line);
    }
    // Sinon, ajouter au markdown normal
    else {
      formattedLines.push(line);
    }
  }

  // Flush le dernier bloc de code s'il existe
  if (inCodeBlock) {
    flushCodeBuffer(currentLang);
  }

  return formattedLines.join('\n');
};

// Créer un ou plusieurs messages avec code (division automatique si trop long)
export const createCodePreviewMessages = (code: string, language: string): string[] => {
  // Normaliser le langage
  const normalizedLang = language.toLowerCase();
  const langTag = SUPPORTED_LANGUAGES[normalizedLang] || normalizedLang;
  const lineCount = code.split('\n').length;
  const displayLang = language.toUpperCase();

  // Vérifier si c'est un fichier markdown
  const isMarkdown = normalizedLang === 'markdown' || normalizedLang === 'md';
  const formattedContent = isMarkdown ? formatCodeBlocks(code) : code;

  // En-tête pour le markdown
  const baseHeader = `📝 **Code Preview**
Langage: ${displayLang}
Lignes: ${lineCount}

`;
  const separator = `

---

`;

  // Calculer la longueur disponible (max 2000 - marge de sécurité)
  const maxTotalLength = 1950;

  // Calculer la longueur totale avec le bloc de code (seulement pour les langages non-markdown)
  let totalWithHeader: number;
  if (!isMarkdown) {
    const codeBlockStart = `\`\`\`${langTag}\n`;
    const codeBlockEnd = `\n\`\`\``;
    const totalCodeLength = codeBlockStart.length + formattedContent.length + codeBlockEnd.length;
    totalWithHeader = baseHeader.length + totalCodeLength;
  } else {
    totalWithHeader = baseHeader.length + formattedContent.length;
  }

  // DEBUG: Afficher les informations de calcul
  console.log('[CODE_PREVIEW] DEBUG - Longueur du code:', code.length);
  console.log('[CODE_PREVIEW] DEBUG - Longueur après formatage:', formattedContent.length);
  console.log('[CODE_PREVIEW] DEBUG - isMarkdown:', isMarkdown);
  console.log('[CODE_PREVIEW] DEBUG - maxTotalLength:', maxTotalLength);
  console.log('[CODE_PREVIEW] DEBUG - baseHeader.length:', baseHeader.length);
  console.log('[CODE_PREVIEW] DEBUG - totalWithHeader:', totalWithHeader);
  console.log('[CODE_PREVIEW] DEBUG - totalWithHeader <= maxTotalLength?', totalWithHeader <= maxTotalLength);

  // Si le contenu tient dans un seul message
  if (totalWithHeader <= maxTotalLength) {
    if (!isMarkdown) {
      // Pour les langages non-markdown, envelopper dans un bloc de code
      const codeBlockStart = `\`\`\`${langTag}\n`;
      const codeBlockEnd = `\n\`\`\``;
      return [`${baseHeader}${codeBlockStart}${formattedContent}${codeBlockEnd}`];
    } else {
      // Pour markdown, retourner sans bloc de code (markdown interprétable)
      return [`${baseHeader}${formattedContent}`];
    }
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

    // Calculer la longueur disponible pour cette partie
    const availableLength = maxTotalLength - partHeader.length;

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

    // Construire le message de la partie
    let partMessage = `${partHeader}${codeChunk}`;

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
