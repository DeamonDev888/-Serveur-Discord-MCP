import * as fs from 'fs';
import * as path from 'path';

// ============================================================================
// FONCTIONS UTILITAIRES RESTAUREES
// ============================================================================

/**
 * Type d'erreur de mention
 */
type MentionErrorType = 'user' | 'channel' | 'role' | 'unknown';

/**
 * Analyse une mention invalide et retourne son type probable
 */
function analyzeInvalidMention(mention: string): MentionErrorType {
  if (mention.startsWith('<@') || mention.startsWith('<@!')) {
    return 'user';
  } else if (mention.startsWith('<#')) {
    return 'channel';
  } else if (mention.startsWith('<@&')) {
    return 'role';
  }
  return 'unknown';
}

/**
 * Valide que les mentions Discord respectent les formats valides
 */
export function validateDiscordMentions(text: string): {
  valid: boolean;
  errors: {
    user: string[];
    channel: string[];
    role: string[];
    other: string[];
  };
  allInvalid: string[];
} {
  const mentionPattern = /<[@!&][^>]+>/g;
  const mentions = text.match(mentionPattern) || [];

  const errors = {
    user: [] as string[],
    channel: [] as string[],
    role: [] as string[],
    other: [] as string[],
  };

  const validFormats = [
    { pattern: /^<@\d+>$/, type: 'user' as const, name: '<@USER_ID>' },
    { pattern: /^<@!\d+>$/, type: 'user' as const, name: '<@!USER_ID>' },
    { pattern: /^<#\d+>$/, type: 'channel' as const, name: '<#CHANNEL_ID>' },
    { pattern: /^<@&\d+>$/, type: 'role' as const, name: '<@&ROLE_ID>' },
  ];

  for (const mention of mentions) {
    let isValid = false;
    for (const format of validFormats) {
      if (format.pattern.test(mention)) {
        isValid = true;
        break;
      }
    }

    if (!isValid) {
      const errorType = analyzeInvalidMention(mention);
      if (errorType === 'user') {
        errors.user.push(mention);
      } else if (errorType === 'channel') {
        errors.channel.push(mention);
      } else if (errorType === 'role') {
        errors.role.push(mention);
      } else {
        errors.other.push(mention);
      }
    }
  }

  const allInvalid = [...errors.user, ...errors.channel, ...errors.role, ...errors.other];

  return {
    valid: allInvalid.length === 0,
    errors,
    allInvalid,
  };
}

/**
 * Génère le message d'erreur pour les mentions invalides
 */
export function generateMentionErrorMessage(
  validation: ReturnType<typeof validateDiscordMentions>,
  fieldName: string
): string {
  const message = `❌ **Format de mention invalide détecté dans ${fieldName} !**\n\n`;
  const parts: string[] = [];

  if (validation.errors.user.length > 0) {
    parts.push(`**Mentions utilisateur invalides :** ${validation.errors.user.join(', ')}`);
    parts.push(`  ✅ Format correct : \`<@293572859941617674>\` ou \`<@!293572859941617674>\``);
  }
  if (validation.errors.channel.length > 0) {
    parts.push(`**Mentions de canal invalides :** ${validation.errors.channel.join(', ')}`);
    parts.push(`  ✅ Format correct : \`<#1442317829998383235>\``);
  }
  if (validation.errors.role.length > 0) {
    parts.push(`**Mentions de rôle invalides :** ${validation.errors.role.join(', ')}`);
    parts.push(`  ✅ Format correct : \`<@&ROLE_ID>\``);
  }
  if (validation.errors.other.length > 0) {
    parts.push(`**Autres mentions invalides :** ${validation.errors.other.join(', ')}`);
  }

  return message + parts.join('\n\n');
}

export function replaceVariables(text: string, variables: Record<string, string> = {}): string {
  if (!text) return '';
  let result = String(text);
  const now = new Date();
  const autoVars: Record<string, string> = {
    '{timestamp}': now.toLocaleString('fr-FR'),
    '{date}': now.toLocaleDateString('fr-FR'),
    '{time}': now.toLocaleTimeString('fr-FR'),
    '{year}': now.getFullYear().toString(),
    '{month}': (now.getMonth() + 1).toString(),
    '{day}': now.getDate().toString(),
    '{weekday}': now.toLocaleDateString('fr-FR', { weekday: 'long' }),
  };

  for (const [key, value] of Object.entries(autoVars)) {
    result = result.split(key).join(value);
  }

  if (variables && typeof variables === 'object') {
    for (const [key, value] of Object.entries(variables)) {
      if (key && value !== undefined) {
        result = result.split(`{${key}}`).join(String(value));
      }
    }
  }

  result = result.split('\\n').join('\n');
  result = result.replace(/{spoiler:([^}]+)}/g, '|| $1 ||');
  return result;
}

export function createProgressBar(value: number, max: number, length: number = 10): string {
  const percentage = Math.min((value / max) * 100, 100);
  const filled = Math.round((percentage / 100) * length);
  const empty = length - filled;
  return '█'.repeat(filled) + '░'.repeat(empty);
}

export async function saveTemplate(name: string, embedData: any): Promise<void> {
  const templatesPath = path.join(process.cwd(), 'embed-templates.json');
  let templates: Record<string, any> = {};
  try {
    const content = await fs.promises.readFile(templatesPath, 'utf-8');
    templates = JSON.parse(content);
  } catch (e) {}
  templates[name] = embedData;
  await fs.promises.writeFile(templatesPath, JSON.stringify(templates, null, 2));
}

export async function loadTemplate(name: string): Promise<any | null> {
  const templatesPath = path.join(process.cwd(), 'embed-templates.json');
  try {
    const content = await fs.promises.readFile(templatesPath, 'utf-8');
    const templates = JSON.parse(content);
    return templates[name] || null;
  } catch (e) {
    return null;
  }
}

export function validateFieldLength(
  fields: any[],
  title?: string,
  description?: string,
  footerText?: string
): { valid: boolean; warnings: string[]; totalLength: number } {
  const warnings: string[] = [];
  let totalLength = (title?.length || 0) + (description?.length || 0) + (footerText?.length || 0);

  fields?.forEach((field, index) => {
    const nameLen = field.name?.length || 0;
    const valLen = field.value?.length || 0;
    totalLength += nameLen + valLen;

    if (nameLen > 256)
      warnings.push(`Champ #${index + 1}: Le nom dépasse 256 caractères (${nameLen})`);
    if (valLen > 1024)
      warnings.push(`Champ #${index + 1}: La valeur dépasse 1024 caractères (${valLen}) ⚠️`);
  });

  if (totalLength > 6000)
    warnings.push(
      `⚠️ TOTAL: L'embed dépasse la limite globale de 6000 caractères (${totalLength}/6000) ! 🛑`
    );

  return {
    valid: warnings.filter(w => w.includes('⚠️') || w.includes('🛑')).length === 0,
    warnings,
    totalLength,
  };
}

export function generateAsciiChart(
  type: string,
  data: number[],
  labels?: string[],
  options: any = {}
): string {
  const maxValue = Math.max(...data);
  const minValue = Math.min(...data);
  const range = maxValue - minValue;
  const height = options.height || 10;
  let chart = '';

  switch (type) {
    case 'sparkline':
      const points = data.map(value => {
        const position = Math.round(((value - minValue) / range) * 4);
        return '▁▂▃▄▅▆▇█'[Math.min(position, 7)];
      });
      chart = `\`\`\`\n${points.join('')}\n\`\`\``;
      break;
    default:
      chart = 'Graphique non supporté';
  }
  return chart;
}

export function adaptLinkForUser(link: any, userId: string): string {
  let adaptedUrl = link.url;
  if (link.userSpecific) adaptedUrl += `?user=${userId}&ref=discord`;
  return `[${link.label}](${adaptedUrl})`;
}

export function applyLayout(fields: any[], layout: any): any[] {
  if (!layout || layout.type === 'stack') return fields;
  return fields; // Simplifié pour compilation
}

export function generateVisualEffectsDescription(effects: any): string {
  return '';
}

export function parseTable(tableText: string): string {
  return tableText; // Simplifié
}

export function generateGuidanceMessage(urlType: string, providedUrl: string): string {
  return `❌ URL externe détectée pour ${urlType}: ${providedUrl}`;
}

export function generateSvgFooterMessage(providedUrl: string): string {
  return `❌ URL SVG détectée pour footerIcon: ${providedUrl}`;
}

export function generateSvgAuthorMessage(providedUrl: string): string {
  return `❌ URL SVG détectée pour authorIcon: ${providedUrl}`;
}

/**
 * THÈMES PÉDAGOGIQUES
 */
export function applyTheme(theme: string | undefined, args: any): any {
  if (!theme) return args;

  const themedArgs = { ...args };

  switch (theme) {
    case 'basic': {
      themedArgs.color = 0x5865f2;
      if (!args.title) themedArgs.title = '📝 Titre de votre embed';
      if (!args.description) {
        themedArgs.description = `
📌 **Description personnalisée ici**

• Point 1
• Point 2
• Point 3

💡 Modifiez ce contenu selon vos besoins !`.trim();
      }
      if (!args.fields) {
        themedArgs.fields = [
          { name: '📊 Champ 1', value: 'Valeur ou information', inline: true },
          { name: '📈 Champ 2', value: 'Autre donnée', inline: true },
          { name: '📋 Champ 3', value: 'Détails supplémentaires', inline: false },
        ];
      }
      break;
    }

    case 'data_report': {
      themedArgs.color = 0x00ff00;
      if (!args.title) themedArgs.title = '📊 Rapport de Données';
      if (!args.description) {
        themedArgs.description = `
📈 **Résultats et analyses**

Ce rapport présente les données principales :
• Métrique 1: Valeur actuelle
• Métrique 2: Évolution
• Métrique 3: Comparaison

💡 Adaptez ce contenu selon vos données !`.trim();
      }
      if (!args.fields) {
        themedArgs.fields = [
          { name: '📊 Indicateur 1', value: '1,234 (↑ 12%)', inline: true },
          { name: '📈 Indicateur 2', value: '567 (↓ 3%)', inline: true },
          { name: '📉 Indicateur 3', value: '890 (→ stable)', inline: true },
          { name: '📋 Analyse', value: "Détails de l'analyse ici...", inline: false },
        ];
      }
      break;
    }

    case 'status_update': {
      themedArgs.color = 0xffa500;
      if (!args.title) themedArgs.title = '🔄 Mise à jour de Statut';
      if (!args.description) {
        themedArgs.description = `
🟢 **État actuel du système**

Dernière vérification : {timestamp}
Tous les services fonctionnent normalement.

💡 Adaptez ce statut selon votre contexte !`.trim();
      }
      if (!args.fields) {
        themedArgs.fields = [
          { name: '🟢 Service A', value: 'OPÉRATIONNEL\nTemps de réponse: 45ms', inline: true },
          { name: '🟢 Service B', value: 'OPÉRATIONNEL\nUptime: 99.9%', inline: true },
          { name: '🟢 Service C', value: 'OPÉRATIONNEL\nVersion: v2.1.0', inline: true },
          { name: '📝 Notes', value: 'Prochaine maintenance: {date}', inline: false },
        ];
      }
      break;
    }

    case 'product_showcase': {
      themedArgs.color = 0x9b59b6;
      if (!args.title) themedArgs.title = '🚀 Nouveau Produit';
      if (!args.description) {
        themedArgs.description = `
✨ **Présentation de votre produit/service**

Découvrez les caractéristiques principales :
• Fonctionnalité clé 1
• Fonctionnalité clé 2
• Fonctionnalité clé 3

💡 Adaptez cette description selon votre produit !`.trim();
      }
      if (!args.fields) {
        themedArgs.fields = [
          { name: '⭐ Fonctionnalité 1', value: 'Description détaillée...', inline: true },
          { name: '⭐ Fonctionnalité 2', value: 'Description détaillée...', inline: true },
          { name: '⭐ Fonctionnalité 3', value: 'Description détaillée...', inline: true },
          { name: '💰 Prix', value: 'XX.XX€', inline: true },
          { name: '📦 Disponibilité', value: 'En stock / Disponible', inline: true },
          { name: "📋 Plus d'infos", value: 'Contactez-nous pour plus de détails', inline: false },
        ];
      }
      break;
    }

    case 'leaderboard': {
      themedArgs.color = 0xe74c3c;
      if (!args.title) themedArgs.title = '🏆 Classement';
      if (!args.description) {
        themedArgs.description = `
📊 **Top performers**

Classement mis à jour : {timestamp}

💡 Adaptez ce classement selon votre contexte !`.trim();
      }
      if (!args.fields) {
        themedArgs.fields = [
          { name: '🥇 #1', value: 'Nom - Score', inline: true },
          { name: '🥈 #2', value: 'Nom - Score', inline: true },
          { name: '🥉 #3', value: 'Nom - Score', inline: true },
          {
            name: '📊 Détails',
            value: '• Participants: XX\n• Moyenne: XX\n• Évolution: +X%',
            inline: false,
          },
        ];
      }
      break;
    }

    case 'tech_announcement': {
      themedArgs.color = 0x3498db;
      if (!args.title) themedArgs.title = '⚡ Nouvelle Fonctionnalité';
      if (!args.description) {
        themedArgs.description = `
🚀 **Mise à jour disponible**

Découvrez les nouveautés de cette version :

💡 Adaptez cette annonce selon vos features !`.trim();
      }
      if (!args.fields) {
        themedArgs.fields = [
          { name: '✨ Amélioration 1', value: "Description de l'amélioration...", inline: true },
          { name: '🔧 Amélioration 2', value: "Description de l'amélioration...", inline: true },
          { name: '📅 Date', value: '{date}', inline: true },
          {
            name: '📝 Détails',
            value: '• Correction bug #123\n• Nouvelle API\n• Amélioration perf',
            inline: false,
          },
        ];
      }
      break;
    }

    case 'social_feed': {
      themedArgs.color = 0xe91e63;
      if (!args.title) themedArgs.title = '💬 Dernières Actualités';
      if (!args.description) {
        themedArgs.description = `
📱 **Ce qui se passe maintenant**

Dernière mise à jour : {timestamp}

💡 Adaptez ce contenu social selon votre contexte !`.trim();
      }
      if (!args.fields) {
        themedArgs.fields = [
          { name: '👍 Réactions', value: '1,234', inline: true },
          { name: '💬 Comments', value: '89', inline: true },
          { name: '🔄 Shares', value: '45', inline: true },
          { name: '📅 Posté le', value: '{date} à {time}', inline: false },
        ];
      }
      break;
    }

    case 'noel': {
      themedArgs.color = 0xc41e3a;
      if (!args.title) themedArgs.title = '🎄 Joyeuses Fêtes ! 🎅';
      if (!args.description) {
        themedArgs.description = `
✨ **spirit de Noël**

Que cette période soit remplie de joie et de magie !

🎁🎅❄️🔔🕯️

💡 Adaptez ce message selon votre contexte festif !`.trim();
      }
      if (!args.footerText)
        themedArgs.footerText = "🎄 Joyeuses fêtes de la part de toute l'équipe ! 🎄";
      break;
    }

    case 'dashboard': {
      themedArgs.color = 0x1abc9c;
      if (!args.title) themedArgs.title = '📊 Tableau de Bord';
      if (!args.description) {
        themedArgs.description = `
📈 **Métriques en temps réel**

Dernière mise à jour : {timestamp}

💡 Adaptez ce dashboard selon vos métriques !`.trim();
      }
      if (!args.fields) {
        themedArgs.fields = [
          { name: '👥 Utilisateurs', value: '1,234', inline: true },
          { name: '📈 Croissance', value: '+12%', inline: true },
          { name: '💰 Revenus', value: '4,567€', inline: true },
          { name: '⏱️ Latence', value: '45ms', inline: true },
          { name: '📊 Performance', value: '▓▓▓▓▓▓▓▓▓░ 90%', inline: false },
        ];
      }
      break;
    }

    case 'minimal': {
      themedArgs.color = 0x2c2c2c;
      if (!args.title) themedArgs.title = 'Titre Minimal';
      if (!args.description) {
        themedArgs.description = `
Design épuré et moderne.

**Points clés :**
• Simplicité
• Clarté
• Efficacité

💡 Adaptez ce style selon vos besoins !`.trim();
      }
      if (!args.fields) {
        themedArgs.fields = [
          { name: 'Element 1', value: 'Information concise', inline: true },
          { name: 'Element 2', value: 'Donnée précise', inline: true },
          { name: 'Element 3', value: 'Détails supplémentaires', inline: false },
        ];
      }
      break;
    }

    case 'cyberpunk': {
      themedArgs.color = 0xff00ff;
      if (!args.title) themedArgs.title = '🌆 Terminal Cyberpunk';
      if (!args.authorName) themedArgs.authorName = 'SYSTEM_CORE_v.7';
      if (!args.description) {
        themedArgs.description = `
\`\`\`[SYS] Connexion d'urgence établie...
[SYS] Initialisation du protocole ALPHA-1...
[SYS] Analyse de la Matrice en cours.\`\`\`

🔮 **Alpha Signals Detectés**
• Puissance du Signal: ████████░░
• Latence Neuronale: 12ms

💡 *Le futur est déjà écrit dans le code.*`.trim();
      }
      break;
    }

    case 'gaming': {
      themedArgs.color = 0x7289da;
      if (!args.title) themedArgs.title = '🎮 Session de Jeu';
      if (!args.authorName) themedArgs.authorName = 'PRO_GAMER_HUD';
      if (!args.description) {
        themedArgs.description = `
🎯 **Objectif de Mission**
Éliminez les anomalies système et sécurisez le périmètre.

**Stats du Match :**
• Score: 13,337
• Division: ELITE`.trim();
      }
      break;
    }

    case 'corporate': {
      themedArgs.color = 0x0066cc;
      if (!args.title) themedArgs.title = '📊 Rapport Trimestriel';
      if (!args.authorName) themedArgs.authorName = 'Département Analytique';
      if (!args.description) {
        themedArgs.description = `
💼 **Résumé Exécutif**
Les indicateurs clés de performance (KPI) montrent une croissance stable.

• ROI: +15.4%
• Pénétration Marché: 12%`.trim();
      }
      break;
    }

    case 'sunset': {
      themedArgs.color = 0xff6b6b;
      if (!args.title) themedArgs.title = '🌅 Lumière du Jour';
      if (!args.description) {
        themedArgs.description = `
🌇 **Fin de Journée**
Le calme après la tempête. Profitez de ce moment de sérénité.

✨ *Demain est un autre jour.*`.trim();
      }
      break;
    }

    case 'ocean': {
      themedArgs.color = 0x00ced1;
      if (!args.title) themedArgs.title = "🌊 Profondeurs de l'Océan";
      if (!args.description) {
        themedArgs.description = `
🐋 **Exploration Marine**
Plongez dans les eaux cristallines et découvrez des secrets oubliés.

💧 *L'eau est la force motrice de toute la nature.*`.trim();
      }
      break;
    }
  }

  return themedArgs;
}
