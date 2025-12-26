/**
 * DOCUMENTATION EMBEDS DISCORD - COMPILÉE
 * Fichiers de documentation essentiels inclus dans la compilation
 */

import * as fs from 'fs';
import * as path from 'path';

// ============================================================================
// CHEMINS DES FICHIERS DE DOCUMENTATION
// ============================================================================

const DOCS_DIR = path.join(process.cwd(), 'docs', 'essential');
const TEMPLATES_FILE = path.join(DOCS_DIR, 'TEMPLATES_FONCTIONNALITES_AVANCEES.md');
const EXEMPLES_FILE = path.join(DOCS_DIR, 'EXEMPLES_THEMES_EMBED.md');
const GUIDE_FILE = path.join(DOCS_DIR, 'GUIDE_CREER_EMBED_INTUITIF.md');

// ============================================================================
// LECTURE DES FICHIERS DE DOCUMENTATION
// ============================================================================

export const DOCUMENTATION = {
  templates: {
    title: 'Templates Fonctionnalités Avancées',
    description: '15 templates spécialisés démontrant toutes les capacités de creer_embed()',
    content: loadDocFile(TEMPLATES_FILE),
    file: TEMPLATES_FILE
  },

  exemples: {
    title: 'Exemples Thèmes Embed',
    description: '10 thèmes de base avec exemples d\'utilisation',
    content: loadDocFile(EXEMPLES_FILE),
    file: EXEMPLES_FILE
  },

  guide: {
    title: 'Guide Ultra-Intuitif',
    description: 'Guide d\'utilisation simple pour agents avec perte de mémoire',
    content: loadDocFile(GUIDE_FILE),
    file: GUIDE_FILE
  }
};

/**
 * Charge le contenu d'un fichier de documentation
 */
function loadDocFile(filePath: string): string {
  try {
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf-8');
      return content;
    } else {
      console.warn(`[DOCS] Fichier non trouvé: ${filePath}`);
      return `# Documentation non disponible\n\nLe fichier ${filePath} n'a pas été trouvé.`;
    }
  } catch (error: any) {
    console.error(`[DOCS] Erreur lecture ${filePath}:`, error.message);
    return `# Erreur de chargement\n\nImpossible de charger le fichier ${filePath}.`;
  }
}

// ============================================================================
// GÉNÉRATION DES RÉSUMÉS AUTOMATIQUES
// ============================================================================

export function getTemplatesSummary(): string {
  const doc = DOCUMENTATION.templates;

  return `
📚 **TEMPLATES FONCTIONNALITÉS AVANCÉES**

${doc.description}

📂 Fichier: ${doc.file}

💻 **15 Templates Disponibles:**
1. ASCII_ART - Graphiques ASCII et art
2. FULLCOLOR_GRADIENT - Couleurs et effets visuels
3. IMAGES_FULL_DISPLAY - Gestion complète des images
4. INTERACTIVE_SONDAGE - Sondages avec boutons
5. MINI_JEUX - Jeux intégrés dans embeds
6. EVENT_FETE - Événements et célébrations
7. HIGHLIGHT_EXPERT - Mise en valeur experte
8. AUTO_UPDATE_DASHBOARD - Dashboard temps réel
9. LAYOUT_ADVANCED - Mise en page sophistiquée
10. RESPONSIVE_ADAPTIVE - Contenu adaptatif
11. MEDIA_RICH - Multimédia et contenus intégrés
12. SYSTEM_NOTIFICATION - Alertes et notifications système
13. PROGRESS_TRACKER - Suivi de progression détaillé
14. USER_PROFILE_ADVANCED - Profils utilisateur complets
15. MARKETPLACE_SHOP - Boutique et e-commerce

🚀 Chaque template inclut:
• Code TypeScript complet
• Explications détaillées
• Fonctionnalités démontrées
• Cas d'usage pratiques

📖 **Utilisation:** Consultez ${doc.file} pour le contenu complet !
`;
}

export function getExemplesSummary(): string {
  const doc = DOCUMENTATION.exemples;

  return `
📚 **EXEMPLES THÈMES EMBED**

${doc.description}

📂 Fichier: ${doc.file}

🎨 **10 Thèmes Disponibles:**
1. basic - Structure d'embed simple
2. data_report - Rapport avec données
3. status_update - Mise à jour de statut
4. product_showcase - Présentation produit
5. leaderboard - Classement/scores
6. tech_announcement - Annonce technique
7. social_feed - Contenu social/média
8. dashboard - Tableau de bord
9. noel - Thème saisonnier
10. minimal - Design épuré

💡 Chaque thème inclut:
• Configuration par défaut (couleur, structure)
• Exemples d'utilisation
• Variables automatiques ({timestamp}, {date}, etc.)
• Personnalisation facile

🎯 **Utilisation:**
creer_embed({
  theme: 'basic',  // ← Choisir un thème
  title: 'Mon titre personnalisé',  // ← Personnaliser
  description: 'Ma description'  // ← Personnaliser
});

📖 **Utilisation:** Consultez ${doc.file} pour les exemples complets !
`;
}

export function getGuideSummary(): string {
  const doc = DOCUMENTATION.guide;

  return `
📚 **GUIDE ULTRA-INTUITIF**

${doc.description}

📂 Fichier: ${doc.file}

🚀 **UTILISATION EN 3 ÉTAPES:**

✅ **ÉTAPE 1 (OBLIGATOIRE):**
   • channelId: ID du canal Discord
   • title: Titre de l'embed
   • description: Texte principal

📚 **ÉTAPE 2 (RECOMMANDÉ):**
   • theme: basic | data_report | status_update | product_showcase | leaderboard | tech_announcement | social_feed | dashboard | noel | minimal

🎨 **ÉTAPE 3 (OPTIONNEL):**
   • image: Grande image (bas)
   • thumbnail: Petite image (haut-droite)
   • buttons: Boutons interactifs (max 5)
   • fields: Champs de données (max 10)

💡 **EXEMPLES PRÊTS:**
• Rapports simples
• Status système
• Annonces produits
• Classements
• Dashboards temps réel

🆘 **AIDE INTÉGRÉE:**
creer_embed({ help: true });  // → Affiche le guide interactif

📖 **Utilisation:** Consultez ${doc.file} pour le guide complet !
`;
}

// ============================================================================
// OUTIL D'AFFICHAGE DE DOCUMENTATION
// ============================================================================

export function displayDocumentation(section?: string): string {
  switch (section?.toLowerCase()) {
    case 'templates':
      return getTemplatesSummary();

    case 'exemples':
    case 'themes':
      return getExemplesSummary();

    case 'guide':
    case 'help':
      return getGuideSummary();

    case 'all':
    case undefined:
      return `
🎯 **DOCUMENTATION EMBEDS DISCORD - INTÉGRÉE**

${getGuideSummary()}

${getExemplesSummary()}

${getTemplatesSummary()}

📂 **Localisation des fichiers:**
• docs/essential/GUIDE_CREER_EMBED_INTUITIF.md
• docs/essential/EXEMPLES_THEMES_EMBED.md
• docs/essential/TEMPLATES_FONCTIONNALITES_AVANCEES.md

✅ **Documentation compilée et accessible dans le code !**
`;

    default:
      return `
❌ Section inconnue: ${section}

📋 Sections disponibles:
• templates - Templates avancés (15)
• exemples - Thèmes de base (10)
• guide - Guide d'utilisation
• all - Toute la documentation

💡 Utilisation: displayDocumentation('templates')
`;
  }
}

// ============================================================================
// EXPORT PAR DÉFAUT
// ============================================================================

export default DOCUMENTATION;

// ============================================================================
// LOGS AU CHARGEMENT
// ============================================================================

console.log('[DOCS] Documentation intégrée chargée:');
console.log(`   • Templates: ${DOCUMENTATION.templates.title}`);
console.log(`   • Exemples: ${DOCUMENTATION.exemples.title}`);
console.log(`   • Guide: ${DOCUMENTATION.guide.title}`);
console.log(`   📂 Localisation: ${DOCS_DIR}`);
