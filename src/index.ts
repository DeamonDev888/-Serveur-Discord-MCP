#!/usr/bin/env node

import { FastMCP } from 'fastmcp';
import { Client, EmbedBuilder } from 'discord.js';
import { config } from 'dotenv';
import * as fs from 'fs';
import { DiscordBridge } from './discord-bridge.js';
import Logger from './utils/logger.js';

// ============================================================================
// 🛡️ PROTECTION DU PROTOCOLE MCP & GESTION DES ERREURS
// ============================================================================

console.log = (...args) => {
  // Logger.info utilise process.stderr, donc c'est sûr pour le protocole MCP.
  // Le préfixe [STDOUT-REDIRECT] permet d'identifier l'origine du log.
  Logger.info('[STDOUT-REDIRECT]', ...args);
};

console.error = (...args) => {
  Logger.error('[STDERR-REDIRECT]', ...args);
};

// 2. Gestionnaires d'erreurs globaux
// Pour éviter que le processus ne crashe silencieusement sur une exception non gérée,
// ce qui causerait une erreur "EOF" immédiate côté client MCP.
process.on('uncaughtException', error => {
  Logger.error('🔥 CRITIQUE: Exception non gérée (Uncaught Exception):', error);
  // En production, on pourrait vouloir quitter, mais en dev/debug on essaie de survivre
  // pour voir les logs.
});

process.on('unhandledRejection', (reason, _promise) => {
  // Ignorer les erreurs EPIPE (stderr cassé) pour éviter les boucles infinies
  if ((reason as any)?.code === 'EPIPE') return;
  Logger.error('🔥 CRITIQUE: Promesse rejetée non gérée (Unhandled Rejection):', reason);
});

// ============================================================================

// Imports des utilitaires de logos
// Utils logos non utilisés dans index.ts mais fournis par logoUtils.js
// getUniversalLogo, buildClearbitLogoUrl, getCryptoLogo, getCryptoInfo, buildCryptoLogoUrl

// Imports des données de logos
// Données logos non utilisées dans index.ts mais fournies par logos.js
// CRYPTO_LOGOS, COMPANY_LOGOS, MISC_LOGOS

import * as path from 'path';
import { fileURLToPath } from 'url';

// ============================================================================
// IMPORTS DES OUTILS MCP UNIFIÉS (STRUCTURE 40 OUTILS)
// ============================================================================

// Outil unifié pour le serveur
const server = new FastMCP({
  name: 'discord-mcp-server',
  version: '2.0.0',
});

// Outils unifiés principaux
import { registerMemberTools } from './tools/members.js';
import { registerRoleTools } from './tools/roles.js';
import { registerChannelTools } from './tools/channels.js';
import { registerInteractionTools } from './tools/interactions.js';

// Outils existants conservés
import { registerEmbedTools } from './tools/embeds.js';
import { registerMessageTools } from './tools/messages.js';
import { registerListImagesTools } from './tools/listImages.js';

import { registerServerTools } from './tools/registerServer.js';
import { registerWebhooksTools } from './tools/registerWebhooks.js';
import { registerSystemTools } from './tools/registerSystem.js';
import { registerButtonFunctionTools } from './tools/registerButtonFunctions.js';
import { registerCodePreviewTools } from './tools/codePreview.js';
import { registerFileUploadTools } from './tools/fileUpload.js';
import { registerFileDownloadTools } from './tools/fileDownload.js';
import { registerEditEmbedTools } from './tools/editEmbed.js';

// Logger.info est d├⌐j├á s├╗r car il utilise process.stderr.write dans utils/logger.ts

// Charger les variables d'environnement avec chemin robuste
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Chercher le .env à plusieurs endroits possibles
function findEnvPath(): string {
  // Ordre de recherche :
  // 1. Même dossier que le script (pour dist/)
  // 2. Dossier parent (pour src/)
  // 3. 2 niveaux au-dessus (pour structures imbriquées)
  const possiblePaths = [
    path.resolve(__dirname, '.env'),
    path.resolve(__dirname, '../.env'),
    path.resolve(__dirname, '../../.env'),
  ];

  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      return p;
    }
  }

  // Par défaut, utiliser le chemin classique
  return path.resolve(__dirname, '../.env');
}

const envPath = findEnvPath();
Logger.debug(`📂 Chargement .env depuis: ${envPath}`);
config({ path: envPath });

// Configuration
const botConfig = {
  token: process.env.DISCORD_BOT_TOKEN || process.env.DISCORD_TOKEN || 'YOUR_BOT_TOKEN',
  clientId: process.env.DISCORD_CLIENT_ID || 'YOUR_CLIENT_ID',
  guildId: process.env.DISCORD_GUILD_ID || 'YOUR_GUILD_ID',
  activity: 'MCP Server v2.0 - 88 outils complets',
  adminUserId: process.env.ADMIN_USER_ID || 'YOUR_ADMIN_USER_ID',
  environment: process.env.NODE_ENV || 'development',
};

// Debug: Afficher les variables d'environnement au démarrage
// Logger.error('🔍 Debug ENV:');
//   : 'NON DÉFINI/DEFAULT';
// Logger.error(`  Token Status: ${tokenPreview}`);
// Logger.error('  DISCORD_BOT_TOKEN:', process.env.DISCORD_BOT_TOKEN ? '✅ Présent' : '❌ Absent');
// Logger.error('  NODE_ENV:', process.env.NODE_ENV);

// Initialisation du serveur MCP
// (Déjà fait plus haut)

// État global avec persistance fichier
const globalState = {
  isConnected: false,
  clientReady: false,
  lastError: null as string | null,
  username: null as string | null,
  guilds: 0,
  uptime: 0,
};

// Chemin du fichier de statut partagé
const STATUS_FILE =
  'C:\\Users\\Deamon\\Desktop\\Backup\\Serveur MCP\\serveur_discord\\discord-status.json';

// Debounce timer pour éviter les sauvegardes trop fréquentes
let saveTimeout: NodeJS.Timeout | null = null;

// ============================================================================
// SYSTÈME D'AUTO-UPDATE POUR EMBEDS 🚀
// ============================================================================

// Map pour stocker les embeds auto-updatables
const autoUpdateEmbeds = new Map<
  string,
  {
    messageId: string;
    channelId: string;
    embedData: any;
    interval: number;
    lastUpdate: number;
    source?: string;
    updateCount: number;
  }
>();

// Fonction pour mettre à jour un embed automatiquement
async function updateEmbed(embedId: string): Promise<void> {
  const embedInfo = autoUpdateEmbeds.get(embedId);
  if (!embedInfo) return;

  try {
    Logger.info(`🔄 [Auto-Update] Mise à jour embed ${embedId} (${embedInfo.updateCount + 1})`);

    // Récupérer le client
    const client = await ensureDiscordConnection();
    const channel = await client.channels.fetch(embedInfo.channelId);

    if (!channel || !('messages' in channel)) {
      Logger.error(`❌ [Auto-Update] Canal ${embedInfo.channelId} invalide`);
      autoUpdateEmbeds.delete(embedId);
      return;
    }

    // Récupérer le message
    const message = await channel.messages.fetch(embedInfo.messageId);

    if (!message) {
      Logger.error(`❌ [Auto-Update] Message ${embedInfo.messageId} introuvable`);
      autoUpdateEmbeds.delete(embedId);
      return;
    }

    // Mettre à jour les variables dynamiques si nécessaire
    const updatedEmbedData = { ...embedInfo.embedData };

    // Re-remplacer les variables pour obtenir des valeurs свежиes
    if (updatedEmbedData.title) {
      updatedEmbedData.title = replaceVariables(updatedEmbedData.title, updatedEmbedData.variables);
    }
    if (updatedEmbedData.description) {
      updatedEmbedData.description = replaceVariables(
        updatedEmbedData.description,
        updatedEmbedData.variables
      );
    }
    if (updatedEmbedData.fields) {
      updatedEmbedData.fields = updatedEmbedData.fields.map((field: any) => ({
        ...field,
        name: replaceVariables(field.name, updatedEmbedData.variables),
        value:
          updatedEmbedData.autoTable && field.value.includes('|')
            ? parseTable(field.value)
            : replaceVariables(field.value, updatedEmbedData.variables),
      }));
    }

    // Reconstruire l'embed
    const embed = new EmbedBuilder();

    if (updatedEmbedData.title) embed.setTitle(updatedEmbedData.title);
    if (updatedEmbedData.description) embed.setDescription(updatedEmbedData.description);

    if (updatedEmbedData.color) {
      if (typeof updatedEmbedData.color === 'number') {
        embed.setColor(updatedEmbedData.color);
      } else if (
        typeof updatedEmbedData.color === 'string' &&
        updatedEmbedData.color.startsWith('#')
      ) {
        embed.setColor(updatedEmbedData.color as any);
      }
    }

    if (updatedEmbedData.url) embed.setURL(updatedEmbedData.url);
    if (updatedEmbedData.thumbnail) embed.setThumbnail(updatedEmbedData.thumbnail);
    if (updatedEmbedData.image) embed.setImage(updatedEmbedData.image);

    if (updatedEmbedData.authorName) {
      embed.setAuthor({
        name: updatedEmbedData.authorName,
        url: updatedEmbedData.authorUrl,
        iconURL: updatedEmbedData.authorIcon,
      });
    }

    if (updatedEmbedData.footerText) {
      embed.setFooter({
        text: replaceVariables(updatedEmbedData.footerText, updatedEmbedData.variables),
        iconURL: updatedEmbedData.footerIcon,
      });
    }

    if (updatedEmbedData.fields) {
      updatedEmbedData.fields.forEach((field: any) => {
        embed.addFields({
          name: field.name,
          value: field.value,
          inline: field.inline || false,
        });
      });
    }

    embed.setTimestamp();

    // Mettre à jour le message
    await message.edit({
      content: updatedEmbedData.content || '',
      embeds: [embed],
      components: message.components, // Garder les boutons
    });

    // Mettre à jour les informations
    embedInfo.embedData = updatedEmbedData;
    embedInfo.lastUpdate = Date.now();
    embedInfo.updateCount++;

    Logger.info(`✅ [Auto-Update] Embed ${embedId} mis à jour (${embedInfo.updateCount} fois)`);
  } catch (error) {
    Logger.error(`❌ [Auto-Update] Erreur pour ${embedId}:`, error);
  }
}

// Fonction pour démarrer l'auto-update
function startAutoUpdate(): void {
  setInterval(() => {
    const now = Date.now();
    autoUpdateEmbeds.forEach((embedInfo, embedId) => {
      if (now - embedInfo.lastUpdate >= embedInfo.interval * 1000) {
        updateEmbed(embedId);
      }
    });
  }, 5000); // Vérifier toutes les 5 secondes
}

// ============================================================================
// SYSTÈME DE THÈMES 🎨
// ============================================================================

// Démarrer le système d'auto-update (délayé pour éviter erreur top-level await)
setTimeout(startAutoUpdate, 1000);

// Fonction pour sauvegarder l'état dans un fichier (version asynchrone avec debouncing)
function saveStateToFile() {
  // Annuler le timeout précédent si existe
  if (saveTimeout) {
    clearTimeout(saveTimeout);
  }

  // Sauvegarder après 2 secondes d'inactivité
  saveTimeout = setTimeout(async () => {
    try {
      const state = {
        ...globalState,
        lastUpdate: Date.now(),
      };
      await fs.promises.writeFile(STATUS_FILE, JSON.stringify(state, null, 2));
      // Logger.debug('💾 État sauvegardé (async):', state);
    } catch {
      // Logger.error('❌ Erreur sauvegarde async:', error);
    }
  }, 2000);
}

// Fonction pour mettre à jour l'état global
async function updateGlobalState(connected: boolean, error?: string) {
  globalState.isConnected = connected;
  globalState.clientReady = connected;
  globalState.lastError = error || null;

  if (connected && botConfig.token) {
    try {
      const bridge = DiscordBridge.getInstance(botConfig.token);
      const client = await bridge.getClient();
      if (client && client.isReady()) {
        globalState.username = client.user!.tag;
        globalState.guilds = client.guilds.cache.size;
        globalState.uptime = client.uptime || 0;
      }
    } catch {
      // Ignore errors if we can't get client details
    }
  }

  // Logger.debug('🔄 État global mis à jour:', globalState);
  saveStateToFile();
}

// Templates d'embeds (Non utilisés localement dans index.ts)
/*
const EMBED_TEMPLATES: Record<string, { title: string; color: number; description: string }> = {
  success: {
    title: '✅ Succès',
    color: 0x00ff00,
    description: 'Opération réussie',
  },
  error: {
    title: '❌ Erreur',
    color: 0xff0000,
    description: 'Une erreur est survenue',
  },
  warning: {
    title: '⚠️ Attention',
    color: 0xffaa00,
    description: 'Veuillez vérifier les informations',
  },
  info: {
    title: 'ℹ️ Information',
    color: 0x00aaff,
    description: 'Information importante',
  },
  announcement: {
    title: '📢 Annonce',
    color: 0xffd700,
    description: 'Annonce officielle',
  },
};
*/

// Fonction de connexion unifiée via DiscordBridge
async function ensureDiscordConnection(): Promise<Client> {
  // Vérifier le token
  if (!botConfig.token || botConfig.token === 'YOUR_BOT_TOKEN') {
    throw new Error('Token Discord non configuré ou invalide');
  }

  // Utiliser le Bridge pour obtenir le client
  const bridge = DiscordBridge.getInstance(botConfig.token);
  const client = await bridge.getClient();

  // Mettre à jour l'état global
  await updateGlobalState(true);

  return client;
}

// ============================================================================
// SYSTÈME DE RATE LIMITING (Désactivé)
// ============================================================================

// Map pour stocker les compteurs de requêtes par outil
// const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
// const RATE_LIMIT_WINDOW = 60000; // 1 minute
// const RATE_LIMIT_MAX = 30; // Max 30 requêtes par minute par outil

// function checkRateLimit(toolName: string): boolean {
//   const now = Date.now();
//   const toolLimit = rateLimitMap.get(toolName);
//
//   if (!toolLimit || now > toolLimit.resetTime) {
//     // Nouvelle fenêtre ou premier appel
//     rateLimitMap.set(toolName, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
//     return true;
//   }
//
//   if (toolLimit.count >= RATE_LIMIT_MAX) {
//     // Limite atteinte
//     return false;
//   }
//
//   // Incrémenter le compteur
//   toolLimit.count++;
//   return true;
// }

// function withRateLimit<T extends any[], R>(_toolName: string, fn: (...args: T) => Promise<R>) {
//   return async (...args: T): Promise<R> => {
//     if (!checkRateLimit(_toolName)) {
//       throw new Error(`Rate limit atteint pour ${_toolName}. Réessayez dans 1 minute.`);
//     }
//     return fn(...args);
//   };
// }

// ============================================================================
// OUTILS MCP
// ============================================================================
// NOTE: Les outils de modération sont maintenant enregistrés via registerModerationTools()
// voir appel à la ligne ~4000

// ============================================================================
// OUTILS DE GESTION DES RÔLES
// ============================================================================
// NOTE: Les outils de rôles sont maintenant enregistrés via registerRolesTools()
// voir appel à la ligne ~4000

// ============================================================================
// OUTILS DE GESTION DES CANAUX
// ============================================================================
// NOTE: Les outils de canaux sont maintenant enregistrés via registerChannelsTools()
// voir appel à la ligne ~4000

// REMOVED: // envoyer_message
// See registerMessageTools() in tools/messages.ts

// ============================================================================
// FONCTIONS UTILITAIRES POUR EMBEDS AMÉLIORÉS
// ============================================================================

// Fonction pour parser les tableaux
function parseTable(tableText: string): string {
  const lines = tableText.trim().split('\n');
  if (lines.length < 2) return tableText;

  const rows = lines.map(line =>
    line
      .split('|')
      .map(cell => cell.trim())
      .filter(cell => cell !== '')
  );

  if (rows.length < 2) return tableText;

  // Trouver la largeur max de chaque colonne
  const colWidths = rows[0].map((_, colIndex) =>
    Math.max(...rows.map(row => (row[colIndex] || '').length))
  );

  // Construire le tableau formaté
  let formatted = '```\n';

  // En-tête
  const header = rows[0].map((cell, i) => cell.padEnd(colWidths[i])).join(' │ ');
  formatted += header + '\n';

  // Séparateur
  const separator = colWidths.map(w => '─'.repeat(w)).join('─┼─');
  formatted += separator + '\n';

  // Données
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i].map((cell, j) => (cell || '').padEnd(colWidths[j])).join(' │ ');
    formatted += row + '\n';
  }

  formatted += '```';
  return formatted;
}

// Fonction pour remplacer les variables dynamiques
function replaceVariables(text: string, variables: Record<string, string> = {}): string {
  let result = text;

  // Variables automatiques
  const autoVars = {
    '{timestamp}': new Date().toLocaleString('fr-FR'),
    '{date}': new Date().toLocaleDateString('fr-FR'),
    '{time}': new Date().toLocaleTimeString('fr-FR'),
    '{year}': new Date().getFullYear().toString(),
    '{month}': (new Date().getMonth() + 1).toString(),
    '{day}': new Date().getDate().toString(),
    '{weekday}': new Date().toLocaleDateString('fr-FR', { weekday: 'long' }),
  };

  // Remplacer les variables automatiques
  Object.entries(autoVars).forEach(([key, value]) => {
    result = result.replace(new RegExp(key, 'g'), value);
  });

  // Remplacer les variables personnalisées
  Object.entries(variables).forEach(([key, value]) => {
    result = result.replace(new RegExp(`{${key}}`, 'g'), value);
  });

  // Gérer les spoilers
  result = result.replace(/{spoiler:([^}]+)}/g, '|| $1 ||');

  return result;
}

// REMOVED: Unused utilities (createProgressBar, saveTemplate, loadTemplate, validateFieldLength, generateAsciiChart, adaptLinkForUser, applyLayout, generateVisualEffectsDescription)

// creer_embed tool removed. Now registered via registerEmbedTools(server) in tools/embeds.ts

// ============================================================================
// OUTILS D'ANALYTICS 📊
// ============================================================================

// Outil pour voir les analytics d'un embed
// REMOVED: get_embed_analytics -> See registerEmbedTools() in tools/embeds.ts

// Outil pour voir tous les embeds avec auto-update
// REMOVED: list_auto_update_embeds -> See registerEmbedTools() in tools/embeds.ts

// REMOVED: creer_embed -> See registerEmbedTools() in tools/embeds.ts
// REMOVED: get_embed_analytics -> See registerEmbedTools() in tools/embeds.ts
// REMOVED: list_auto_update_embeds -> See registerEmbedTools() in tools/embeds.ts

// REMOVED: emoji_theme_crypto, emoji_theme_companies, emoji_theme_services
// Maintenant remplacé par l'outil unifié list_images() dans registerListImagesTools()

// REMOVED: // 🎮 show_game_result
// See registerGameTools() in tools/games.ts

// REMOVED: // 🎮 create_interactive_quiz
// See registerGameTools() in tools/games.ts

// REMOVED: // stop_embed_auto_update
// See registerEmbedTools() in tools/embeds.ts

// REMOVED: // get_embed_analytics
// See registerEmbedTools() in tools/embeds.ts

// REMOVED: // list_auto_update_embeds
// See registerEmbedTools() in tools/embeds.ts

// REMOVED: // read_messages
// See registerMessageTools() in tools/messages.ts

// REMOVED: // edit_message
// See registerMessageTools() in tools/messages.ts

// REMOVED: // delete_message
// See registerMessageTools() in tools/messages.ts

// REMOVED: // add_reaction
// See registerMessageTools() in tools/messages.ts

// 8. Créer Sondage - maintenant enregistré via registerPollsTools()
// voir appel à la ligne ~4000
// NOTE: formatDuration est maintenant définie dans registerPolls.ts

// REMOVED: // 9. Créer Boutons Personnalisés
// See register*Tools() functions

// REMOVED: // 10. Créer Menu
// See register*Tools() functions

// REMOVED: // 11. Infos Serveur
// See register*Tools() functions

// REMOVED: // 12. Lister Canaux
// See register*Tools() functions

// REMOVED: // 13. Code Preview
// See registerCodePreviewTools() in tools/codePreview.ts

// REMOVED: // 14. Uploader Fichier
// See registerFileUploadTools() in tools/fileUpload.ts

// REMOVED: // 15. Lister Membres
// See register*Tools() functions

// REMOVED: // 16. Obtenir Info Utilisateur
// See register*Tools() functions

// REMOVED: // 17. Créer Webhook
// See register*Tools() functions

// REMOVED: // 16. Lister Webhooks
// See register*Tools() functions

// REMOVED: // 17. Envoyer via Webhook
// See register*Tools() functions

// REMOVED: // 18. Voter Sondage - Version refactorisée
// See register*Tools() functions

// REMOVED: // 19. Appuyer Bouton - Version refactorisée
// See register*Tools() functions

// REMOVED: // 20. Sélectionner Menu - Version refactorisée
// See register*Tools() functions

// REMOVED: // 22. Lister les boutons personnalisés actifs
// See register*Tools() functions

// REMOVED: // 23. Supprimer un bouton personnalisé
// See register*Tools() functions

// REMOVED: // 24. Nettoyer les anciens boutons
// See register*Tools() functions

// REMOVED: // 25. Enregistrer une fonction personnalisée pour un bouton
// See register*Tools() functions

// REMOVED: // 26. Créer un bouton avec fonction personnalisée
// See register*Tools() functions

// REMOVED: // 27. Lister les fonctions de boutons enregistrées
// See register*Tools() functions

// REMOVED: // 28. Créer un menu déroulant persistant
// See register*Tools() functions

// REMOVED: // 29. Lister les menus persistants actifs
// See register*Tools() functions

// REMOVED: // 30. Créer un sondage avec boutons persistants
// See register*Tools() functions

// REMOVED: // 21. Statut Bot avec rate limiting
// See register*Tools() functions

// ============================================================================
// NETTOYAGE
// ============================================================================

async function cleanup() {
  Logger.error('\n🧹 Nettoyage...');
  try {
    // Nettoyer le timer de sauvegarde
    if (saveTimeout) {
      clearTimeout(saveTimeout);
      saveTimeout = null;
    }

    // Nettoyer les instances Discord
    if (botConfig.token) {
      await DiscordBridge.getInstance(botConfig.token).destroy();
    }

    // Nettoyer la map de rate limiting
    // rateLimitMap.clear();

    Logger.info('✅ Nettoyage terminé');
  } catch (e) {
    Logger.error('Erreur nettoyage:', e);
  }
}

process.on('SIGINT', async () => {
  Logger.error('\nSignal SIGINT reçu');
  await cleanup();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  Logger.error('\nSignal SIGTERM reçu');
  Logger.warn('\nSignal SIGTERM reçu');
  await cleanup();
  process.exit(0);
});

// Gestion des erreurs non capturées pour éviter les crashes
process.on('uncaughtException', error => {
  // Ignorer les erreurs EPIPE (stderr cassé) pour éviter les boucles infinies
  if ((error as any)?.code === 'EPIPE') return;
  Logger.error('❌ Erreur non capturée:', error);
  Logger.error('Stack trace:', error.stack);
  // Ne pas quitter, laisser le serveur continuer
});

// Limite de mémoire pour éviter les freezes
const MEMORY_LIMIT = 512 * 1024 * 1024; // 512 MB
if (process.memoryUsage().heapUsed > MEMORY_LIMIT) {
  Logger.error('⚠️ Limite de mémoire atteinte:', process.memoryUsage());
  // Forcer le garbage collection si disponible
  if ((global as any).gc) {
    (global as any).gc();
  }
}

// ============================================================================
// GESTIONNAIRE D'INTERACTIONS
// ============================================================================

// Importer le gestionnaire d'interactions

// ============================================================================
// ENREGISTREMENT DES OUTILS MCP UNIFIÉS (40 OUTILS)
// ============================================================================

// Outils unifiés (remplacent plusieurs anciens fichiers)
registerMemberTools(server); // 11 outils (membres + modération)
registerRoleTools(server); // 5 outils (rôles)
registerChannelTools(server); // 5 outils (canaux)
registerInteractionTools(server); // 3 outils (boutons, menus, sondages)

// Outils existants conservés
registerEmbedTools(server);
registerEditEmbedTools(server); // 🔧 Édition d'embeds (list, get details, update)
registerMessageTools(server);
registerListImagesTools(server); // Nouvel outil unifié (remplace emoji_theme + get_thumbnail)

registerServerTools(server);
// registerWebhooksTools(server);
// registerSystemTools(server);
// registerButtonFunctionTools(server);
registerCodePreviewTools(server);
registerFileUploadTools(server);
registerFileDownloadTools(server);

// ============================================================================
// FONCTION PRINCIPALE
// ============================================================================

async function main() {
  Logger.info('🚀 Préparation Discord MCP v2.1.2...');

  try {
    // 1. Initialiser la connexion Discord AVANT de démarrer le serveur MCP
    // Cela permet aux outils d'avoir un client prêt immédiatement
    try {
      Logger.info('🔗 Connexion à Discord...');
      await ensureDiscordConnection();
      Logger.info('✅ Client Discord prêt');
    } catch (error) {
      Logger.warn(
        '⚠️ Échec connexion Discord initiale (sera réessayé au premier appel):',
        (error as Error).message
      );
    }

    Logger.info('📊 Status:');
    Logger.info(`   • Nom: discord-mcp-server`);
    Logger.info(`   • Version: 2.1.2`);
    Logger.info(`   • Outils: 88 enregistrés`);
    Logger.info(`   • Environment: ${botConfig.environment}`);

    // 2. Démarrer le serveur MCP (Ceci est bloquant en mode STDIO)
    Logger.info('🚀 Démarrage du serveur MCP (STDIO)...');
    await server.start();

    // Si on arrive ici, c'est que le serveur s'est arrêté proprement
    Logger.info('👋 Serveur MCP arrêté');
  } catch (error) {
    Logger.error('❌ Erreur fatale au démarrage:', error);
    await cleanup();
    process.exit(1);
  }
}

main();
// NOTE: Les outils suivants étaient dupliqués après main() et sont maintenant enregistrés via register*Tools():
// - logs_explorer -> registerSystemTools()
// - nettoyer_anciens_boutons -> registerInteractionsTools()
