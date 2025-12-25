/**
 * SYSTÈME D'AIDE INTUITIF POUR creer_embed()
 * Pour agents avec perte de mémoire - Tout est documenté et guidé !
 */

import Logger from './logger.js';
import { DOCUMENTATION, displayDocumentation } from '../docs.js';  // 📚 Documentation intégrée

// ============================================================================
// MESSAGES D'AIDE ET CONSEILS
// ============================================================================

export const HELP_MESSAGES = {
  // Messages d'erreur avec solutions
  MISSING_CHANNEL_ID: {
    error: '❌ ERREUR: channelId manquant',
    solution: '💡 SOLUTION: Ajoutez channelId avec l\'ID de votre canal Discord',
    example: `Exemple:
creer_embed({
  channelId: '1442317829998383235',  // ← AJOUTEZ CETTE LIGNE
  title: 'Mon titre',
  description: 'Ma description'
});`
  },

  MISSING_TITLE: {
    error: '❌ ERREUR: title manquant',
    solution: '💡 SOLUTION: Ajoutez un title (titre) à votre embed',
    example: `Exemple:
creer_embed({
  channelId: 'VOTRE_ID',
  title: '📊 Mon Rapport',  // ← AJOUTEZ CETTE LIGNE
  description: 'Texte principal'
});`
  },

  MISSING_DESCRIPTION: {
    error: '❌ ERREUR: description manquante',
    solution: '💡 SOLUTION: Ajoutez une description (texte principal)',
    example: `Exemple:
creer_embed({
  channelId: 'VOTRE_ID',
  title: 'Mon titre',
  description: 'Voici le contenu principal de l\'embed...',  // ← AJOUTEZ CETTE LIGNE
  fields: [...]
});`
  },

  TOO_MANY_FIELDS: {
    error: '⚠️ ATTENTION: Trop de fields détectés',
    solution: '💡 CONSEIL: Limitez à 5-10 fields maximum pour la lisibilité',
    example: `Correct:
fields: [
  { name: 'Info 1', value: 'Donnée 1', inline: true },
  { name: 'Info 2', value: 'Donnée 2', inline: true },
  { name: 'Info 3', value: 'Donnée 3', inline: true }
]; // ← Maximum recommandé: 10 fields`
  },

  INVALID_IMAGE_URL: {
    error: '⚠️ URL d\'image détectée comme potentiellement invalide',
    solution: '✅ SOLUTION: Auto-correction appliquée avec emoji de fallback',
    example: `URLs alternatives recommandées:
• https://cdn.simpleicons.org/discord (Logos SimpleIcons)
• https://images.unsplash.com/photo-XXX (Images Unsplash)
• https://cdn.discordapp.com/emojis/ID (Emojis Discord)
• Laissez vide → Emoji automatique appliqué`
  },

  // Messages d'encouragement
  SUCCESS_WITH_THEME: {
    message: '✅ Excellent ! Thème appliqué avec succès',
    tip: '💡 Astuce: Les thèmes sont des templates - personnalisez title, description et fields selon vos besoins'
  },

  SUCCESS_WITHOUT_THEME: {
    message: '✅ Embed créé avec succès',
    tip: '💡 Astuce: Utilisez un thème pour accélérer la création (basic, data_report, status_update, etc.)'
  },

  PHASE1_ENHANCEMENT: {
    message: '🚀 Phase 1 Enhancement activé !',
    features: [
      '✅ Cache local d\'images automatique',
      '✅ Fallback intelligent (URL → Emoji)',
      '✅ Validation pré-exécution',
      '✅ Optimisation selon positions Discord'
    ]
  }
};

// ============================================================================
// SUGGESTIONS AUTOMATIQUES CONTEXTUELLES
// ============================================================================

export const SUGGESTIONS = {
  // Suggestion de thème selon le contexte
  suggestTheme: (params: any): string | null => {
    const title = (params.title || '').toLowerCase();
    const description = (params.description || '').toLowerCase();

    if (title.includes('rapport') || title.includes('stat') || description.includes('données')) {
      return '💡 Suggestion: Utilisez theme: "data_report" pour un rapport avec indicateurs';
    }

    if (title.includes('statut') || title.includes('état') || description.includes('opérationnel')) {
      return '💡 Suggestion: Utilisez theme: "status_update" pour afficher un statut système';
    }

    if (title.includes('produit') || title.includes('nouveau') || description.includes('fonctionnalité')) {
      return '💡 Suggestion: Utilisez theme: "product_showcase" pour présenter un produit';
    }

    if (title.includes('classement') || title.includes('top') || description.includes('score')) {
      return '💡 Suggestion: Utilisez theme: "leaderboard" pour un classement';
    }

    if (title.includes('dashboard') || description.includes('métriques')) {
      return '💡 Suggestion: Utilisez theme: "dashboard" pour un tableau de bord temps réel';
    }

    if (title.includes('tech') || title.includes('fonctionnalité') || description.includes('update')) {
      return '💡 Suggestion: Utilisez theme: "tech_announcement" pour une annonce technique';
    }

    if (title.includes('actualités') || title.includes('news') || description.includes('social')) {
      return '💡 Suggestion: Utilisez theme: "social_feed" pour un contenu social';
    }

    return null;
  },

  // Suggestion d'images selon le contenu
  suggestImages: (params: any): string[] => {
    const suggestions: string[] = [];
    const title = (params.title || '').toLowerCase();

    if (title.includes('rapport') || title.includes('stat')) {
      suggestions.push('💡 Astuce image: Ajoutez thumbnail avec un emoji ou une icône (ex: 📊, 📈)');
    }

    if (title.includes('produit')) {
      suggestions.push('💡 Astuce image: Ajoutez image avec une capture d\'écran du produit');
    }

    if (title.includes('classement')) {
      suggestions.push('💡 Astuce image: Ajoutez thumbnail avec 🏆 ou 🥇');
    }

    if (!params.image && !params.thumbnail) {
      suggestions.push('💡 Astuce: Ajoutez image ou thumbnail pour rendre l\'embed plus visuel');
    }

    return suggestions;
  },

  // Suggestion de boutons selon le contexte
  suggestButtons: (params: any): string[] => {
    const suggestions: string[] = [];
    const title = (params.title || '').toLowerCase();

    if (title.includes('rapport') || title.includes('dashboard')) {
      suggestions.push('💡 Suggestion: Ajoutez un bouton "🔄 Actualiser" pour rafraîchir les données');
    }

    if (title.includes('produit')) {
      suggestions.push('💡 Suggestion: Ajoutez des boutons "🛒 Acheter" et "📖 En savoir plus"');
    }

    if (title.includes('sondage') || title.includes('vote')) {
      suggestions.push('💡 Suggestion: Ajoutez des boutons de vote (Option A, Option B, Option C)');
    }

    if (!params.buttons || params.buttons.length === 0) {
      suggestions.push('💡 Astuce: Ajoutez des boutons pour rendre l\'embed interactif');
    }

    return suggestions;
  }
};

// ============================================================================
// GUIDE INTERACTIF CONTEXTUEL
// ============================================================================

export const INTERACTIVE_GUIDE = {
  // Génère un guide selon les paramètres fournis
  generateGuide: (params: any): string[] => {
    const guide: string[] = [];

    guide.push('📚 **GUIDE RAPIDE - creer_embed()**\n');

    // Étape 1: Paramètres obligatoires
    guide.push('✅ **ÉTAPE 1: Paramètres obligatoires**');
    guide.push(`• channelId: ${params.channelId ? '✅ Configuré' : '❌ Manquant - OBLIGATOIRE'}`);
    guide.push(`• title: ${params.title ? '✅ Configuré' : '❌ Manquant - OBLIGATOIRE'}`);
    guide.push(`• description: ${params.description ? '✅ Configurée' : '❌ Manquante - OBLIGATOIRE'}\n`);

    // Étape 2: Thème
    guide.push('✅ **ÉTAPE 2: Thème (recommandé)**');
    if (params.theme) {
      guide.push(`• theme: ✅ "${params.theme}" appliqué`);
    } else {
      guide.push('• theme: ❌ Non défini');
      guide.push('  💡 Utilisez un thème pour accélérer la création:');
      guide.push('  → basic (simple)');
      guide.push('  → data_report (rapports)');
      guide.push('  → status_update (statuts)');
      guide.push('  → product_showcase (produits)');
      guide.push('  → leaderboard (classements)\n');
    }

    // Étape 3: Images
    guide.push('✅ **ÉTAPE 3: Images (optionnel)**');
    guide.push(`• image: ${params.image ? '✅ Configurée' : '❌ Non définie - Grande image en bas'}`);
    guide.push(`• thumbnail: ${params.thumbnail ? '✅ Configurée' : '❌ Non définie - Petite image haut-droite'}`);
    guide.push(`• authorIcon: ${params.authorIcon ? '✅ Configurée' : '❌ Non définie - Icône auteur haut-gauche'}\n`);

    // Étape 4: Interactivité
    guide.push('✅ **ÉTAPE 4: Interactivité (optionnel)**');
    if (params.buttons && params.buttons.length > 0) {
      guide.push(`• buttons: ✅ ${params.buttons.length} bouton(s) configuré(s)`);
    } else {
      guide.push('• buttons: ❌ Aucun bouton - Embed non interactif');
      guide.push('  💡 Ajoutez des boutons pour l\'engagement');
    }

    if (params.selectMenus && params.selectMenus.length > 0) {
      guide.push(`• selectMenus: ✅ ${params.selectMenus.length} menu(s) configuré(s)`);
    }

    // Étape 5: Fonctionnalités avancées
    guide.push('\n✅ **ÉTAPE 5: Fonctionnalités avancées (optionnel)**');
    if (params.autoUpdate?.enabled) {
      guide.push('• autoUpdate: ✅ Mise à jour automatique activée');
    }
    if (params.progressBars && params.progressBars.length > 0) {
      guide.push(`• progressBars: ✅ ${params.progressBars.length} barre(s) de progression`);
    }
    if (params.charts && params.charts.length > 0) {
      guide.push(`• charts: ✅ ${params.charts.length} graphique(s) ASCII`);
    }

    // Conseils contextuels
    guide.push('\n💡 **CONSEILS CONTEXTUELS:**');

    const themeSuggestion = SUGGESTIONS.suggestTheme(params);
    if (themeSuggestion) {
      guide.push(themeSuggestion);
    }

    const imageSuggestions = SUGGESTIONS.suggestImages(params);
    imageSuggestions.forEach(s => guide.push(s));

    const buttonSuggestions = SUGGESTIONS.suggestButtons(params);
    buttonSuggestions.forEach(s => guide.push(s));

    // Phase 1
    guide.push('\n🚀 **PHASE 1 ENHANCEMENT (automatique):**');
    guide.push('• Cache local d\'images activé');
    guide.push('• Fallback intelligent activé');
    guide.push('• Validation URL activée');
    guide.push('• Optimisation Discord activée');

    return guide;
  },

  // Exemple de code selon le contexte
  generateExample: (params: any): string => {
    const examples: Record<string, string> = {
      basic: `creer_embed({
  channelId: 'VOTRE_ID',
  theme: 'basic',
  title: '📝 Mon Titre',
  description: 'Description principale ici...',
  fields: [
    { name: 'Info 1', value: 'Donnée 1', inline: true },
    { name: 'Info 2', value: 'Donnée 2', inline: true }
  ]
});`,

      data_report: `creer_embed({
  channelId: 'VOTRE_ID',
  theme: 'data_report',
  title: '📊 Rapport de Données',
  description: 'Résultats et analyses:',
  fields: [
    { name: '📈 Indicateur 1', value: '1,234 (↑ 12%)', inline: true },
    { name: '📉 Indicateur 2', value: '567 (↓ 3%)', inline: true },
    { name: '📋 Détails', value: 'Analyse complète...', inline: false }
  ]
});`,

      status_update: `creer_embed({
  channelId: 'VOTRE_ID',
  theme: 'status_update',
  title: '🔄 Mise à jour de Statut',
  description: 'État actuel du système:',
  fields: [
    { name: '🟢 Service A', value: 'OPÉRATIONNEL', inline: true },
    { name: '🟢 Service B', value: 'OPÉRATIONNEL', inline: true },
    { name: '📝 Notes', value: 'Dernière MAJ: {timestamp}', inline: false }
  ],
  buttons: [
    { label: '🔄 Actualiser', style: 'Primary', action: 'refresh' }
  ]
});`
    };

    return examples[params.theme] || examples.basic;
  }
};

// ============================================================================
// VALIDATION INTELLIGENTE AVEC CONSEILS
// ============================================================================

export const INTELLIGENT_VALIDATION = {
  // Valide les paramètres et retourne des conseils
  validate: (params: any): { isValid: boolean; errors: string[]; warnings: string[]; tips: string[] } => {
    const errors: string[] = [];
    const warnings: string[] = [];
    const tips: string[] = [];

    // Vérifications obligatoires
    if (!params.channelId) {
      errors.push(HELP_MESSAGES.MISSING_CHANNEL_ID.error);
      errors.push(HELP_MESSAGES.MISSING_CHANNEL_ID.solution);
    }

    if (!params.title) {
      errors.push(HELP_MESSAGES.MISSING_TITLE.error);
      errors.push(HELP_MESSAGES.MISSING_TITLE.solution);
    }

    if (!params.description) {
      errors.push(HELP_MESSAGES.MISSING_DESCRIPTION.error);
      errors.push(HELP_MESSAGES.MISSING_DESCRIPTION.solution);
    }

    // Vérifications recommandées
    if (!params.theme) {
      warnings.push('⚠️ Thème non défini - Considérez utiliser un thème pour accélérer la création');
      tips.push('💡 Thèmes disponibles: basic, data_report, status_update, product_showcase, leaderboard, tech_announcement, social_feed, dashboard, noel, minimal');
    }

    // Vérifications d'optimisation
    if (params.fields && params.fields.length > 10) {
      warnings.push(HELP_MESSAGES.TOO_MANY_FIELDS.error);
      warnings.push(HELP_MESSAGES.TOO_MANY_FIELDS.solution);
    }

    if (!params.image && !params.thumbnail) {
      warnings.push('⚠️ Aucune image définie - L\'embed sera textuel uniquement');
      tips.push('💡 Astuce: Ajoutez image ou thumbnail pour rendre plus visuel');
    }

    if (!params.buttons || params.buttons.length === 0) {
      tips.push('💡 Astuce: Ajoutez des boutons pour l\'interactivité (max 5)');
    }

    // Conseils contextuels
    const themeSuggestion = SUGGESTIONS.suggestTheme(params);
    if (themeSuggestion) {
      tips.push(themeSuggestion);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      tips
    };
  },

  // Affiche les résultats de validation
  displayResults: (results: ReturnType<typeof INTELLIGENT_VALIDATION.validate>): void => {
    if (results.errors.length > 0) {
      Logger.error('\n❌ ERREURS À CORRIGER:');
      results.errors.forEach(error => Logger.error(`   ${error}`));
    }

    if (results.warnings.length > 0) {
      Logger.warn('\n⚠️ AVERTISSEMENTS:');
      results.warnings.forEach(warning => Logger.warn(`   ${warning}`));
    }

    if (results.tips.length > 0) {
      Logger.info('\n💡 CONSEILS:');
      results.tips.forEach(tip => Logger.info(`   ${tip}`));
    }

    if (results.isValid) {
      Logger.info('\n✅ Validation réussie !');
      Logger.info(HELP_MESSAGES.SUCCESS_WITH_THEME.message);
      Logger.info(HELP_MESSAGES.SUCCESS_WITH_THEME.tip);
      Logger.info('\n🚀 Phase 1 Enhancement activé:');
      HELP_MESSAGES.PHASE1_ENHANCEMENT.features.forEach(feature => Logger.info(`   ${feature}`));
    }
  }
};

// ============================================================================
// RACCOURCIS ET TEMPLATES PRÊTS
// ============================================================================

export const QUICK_TEMPLATES = {
  // Génère un embed simple en une ligne
  quickBasic: (channelId: string, title: string, description: string): any => ({
    channelId,
    theme: 'basic',
    title,
    description,
    fields: [
      { name: 'Info 1', value: 'Donnée 1', inline: true },
      { name: 'Info 2', value: 'Donnée 2', inline: true }
    ]
  }),

  // Génère un rapport en une ligne
  quickReport: (channelId: string, title: string, metrics: Record<string, string>): any => {
    const fields = Object.entries(metrics).map(([key, value]) => ({
      name: key,
      value,
      inline: true
    }));

    return {
      channelId,
      theme: 'data_report',
      title,
      description: 'Rapport automatique:',
      fields
    };
  },

  // Génère un statut en une ligne
  quickStatus: (channelId: string, services: Record<string, string>): any => {
    const fields = Object.entries(services).map(([service, status]) => ({
      name: `🟢 ${service}`,
      value: status,
      inline: true
    }));

    return {
      channelId,
      theme: 'status_update',
      title: '🔄 État des Services',
      description: 'Dernière vérification: {timestamp}',
      fields
    };
  }
};

// ============================================================================
// DOCUMENTATION INTÉGRÉE
// ============================================================================

export const DOCS = {
  // Affiche un résumé de la documentation
  summary: (section?: string): string => {
    return displayDocumentation(section);
  },

  // Accès direct aux contenus
  templates: DOCUMENTATION.templates,
  exemples: DOCUMENTATION.exemples,
  guide: DOCUMENTATION.guide,

  // Affiche la liste des templates disponibles
  listTemplates: (): string => {
    return displayDocumentation('templates');
  },

  // Affiche la liste des thèmes disponibles
  listThemes: (): string => {
    return displayDocumentation('exemples');
  }
};

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  HELP_MESSAGES,
  SUGGESTIONS,
  INTERACTIVE_GUIDE,
  INTELLIGENT_VALIDATION,
  QUICK_TEMPLATES,
  DOCS
};
