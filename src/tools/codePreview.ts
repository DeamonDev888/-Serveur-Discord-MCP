import { z } from 'zod';

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

  // En-tête et pied de message de base
  const baseHeader = `📝 **Code Preview**
Langage: ${displayLang}
Lignes: ${lineCount}

**Code (${displayLang})**
\`\`\`${langTag}
`;
  const footer = `\n\`\`\``;

  // Calculer la longueur disponible (max 2000 - marge de sécurité)
  const maxTotalLength = 1950;
  const baseAvailableCodeLength = maxTotalLength - baseHeader.length - footer.length;

  // DEBUG: Afficher les informations de calcul
  console.log('[CODE_PREVIEW] DEBUG - Longueur du code:', code.length);
  console.log('[CODE_PREVIEW] DEBUG - maxTotalLength:', maxTotalLength);
  console.log('[CODE_PREVIEW] DEBUG - baseHeader.length:', baseHeader.length);
  console.log('[CODE_PREVIEW] DEBUG - footer.length:', footer.length);
  console.log('[CODE_PREVIEW] DEBUG - baseAvailableCodeLength:', baseAvailableCodeLength);
  console.log(
    '[CODE_PREVIEW] DEBUG - code.length <= baseAvailableCodeLength?',
    code.length <= baseAvailableCodeLength
  );

  // Si le code est assez petit, envoyer un seul message
  if (code.length <= baseAvailableCodeLength) {
    return [`${baseHeader}${code}${footer}`];
  }

  // Diviser le code en plusieurs parties
  const messages: string[] = [];
  const totalLength = code.length;
  let currentPosition = 0;
  let partNumber = 1;

  while (currentPosition < totalLength) {
    // Construire l'en-tête avec le numéro de partie
    const partHeader = `📝 **Code Preview**
Langage: ${displayLang}
Lignes: ${lineCount}

**Partie ${partNumber}**
**Code (${displayLang})**
\`\`\`${langTag}
`;

    // Calculer la longueur disponible pour cette partie
    const availableLength = maxTotalLength - partHeader.length - footer.length;

    // Extraire une partie du code
    const remainingCode = code.substring(currentPosition);
    const codeChunk = remainingCode.substring(0, availableLength);

    // Construire le message de la partie
    const partMessage = `${partHeader}${codeChunk}${footer}`;
    messages.push(partMessage);

    // Mettre à jour la position pour la prochaine itération
    // Important: utiliser la longueur réelle du chunk, pas availableLength
    currentPosition += codeChunk.length;
    partNumber++;

    // Protection contre les boucles infinies
    if (codeChunk.length === 0 && currentPosition < totalLength) {
      console.error('[CODE_PREVIEW] Erreur: chunk vide détecté, arrêt de la division');
      break;
    }
  }

  console.log(
    `[CODE_PREVIEW] Division: ${messages.length} message(s) créé(s) pour ${totalLength} caractères`
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
