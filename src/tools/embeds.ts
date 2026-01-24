/**
 * Outils MCP pour la création et gestion des Embeds Discord
 *
 * 🎯 GUIDE ULTRA-INTUITIF POUR AGENTS AVEC PERTE DE MÉMOIRE
 *
 * 💡 UTILISATION SIMPLE EN 3 ÉTAPES:
 * 1. channelId + title + description (OBLIGATOIRE)
 * 2. Choisir un thème (basic, data_report, status_update, etc.)
 * 3. Personnaliser (images, boutons, champs)
 *
 * 📚 EXEMPLES PRÊTS À UTILISER dans GUIDE_CREER_EMBED_INTUITIF.md
 */

import { z } from 'zod';
import type { FastMCP } from 'fastmcp';
import {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
} from 'discord.js';
import * as fs from 'fs';
import * as path from 'path';
import Logger from '../utils/logger.js';
import embedHelper from '../utils/embedHelper.js'; // 🎯 SYSTÈME D'AIDE INTUITIF
import { isSvgUrl as checkIsSvgUrl, convertSvgUrlToPng } from '../utils/svgConverter.js';
import {
  ensureDiscordConnection,
  formatDuration,
} from './common.js';
import {
  validateDiscordMentions,
  generateMentionErrorMessage,
  replaceVariables,
  createProgressBar,
  saveTemplate,
  loadTemplate,
  validateFieldLength,
  generateAsciiChart,
  adaptLinkForUser,
  applyLayout,
  generateVisualEffectsDescription,
  parseTable,
  generateGuidanceMessage,
  generateSvgFooterMessage,
  generateSvgAuthorMessage,
  applyTheme,
} from './embeds_utils.js';
import { getUniversalLogo, getCryptoInfo } from '../utils/logoUtils.js';
import {
  upsertPersistentButton,
  upsertPersistentMenu,
  type PersistentButton,
  type PersistentSelectMenu,
} from '../utils/distPersistence.js';
import {
  CRYPTO_LOGOS,
  COMPANY_LOGOS,
  MISC_LOGOS,
  THEME_IMAGES,
  POKEMON_LOGOS,
  ANIME_LOGOS,
  STEAM_LOGOS,
  DEVOPS_LOGOS,
  ESPORT_LOGOS,
  VIDEOGAME_LOGOS,
  PARTY_LOGOS,
  SIMPLEICONS_LOGOS,
} from '../data/logos.js';
import {
  autoUpdateEmbeds,
  embedAnalytics,
  trackEmbedView,
  generateAnalyticsReport,
  startAutoUpdate,
  updateEmbed,
} from '../state/embedState.js';
import { loadCustomButtons, saveCustomButtons } from '../utils/buttonPersistence.js';
import { interactionHandler } from '../utils/interactionHandler.js';

// ============================================================================
// CONSTANTES POUR LES THÈMES - URLs D'IMAGES VALIDES
// ⚠️ IMPORTANT: Utiliser uniquement des URLs d'images valides, jamais d'emojis
// Utilise le pipeline serveur_discord/src/data/logos.ts
// ============================================================================

// ============================================================================
// FONCTIONS UTILITAIRES
// ============================================================================

// ============================================================================
// VÉRIFICATION DES URLs D'IMAGES - SYSTÈME DE LISTE LOCALE
// ============================================================================

/**
 * Vérifie si une URL est valide pour Discord (CDN fiables ou base locale)
 * Accepte: URLs de la base locale OU URLs de CDN fiables avec extensions image valides
 */
export function isLocalLogoUrl(url: string | undefined): boolean {
  if (!url) return false;

  // Liste des domaines CDN fiables autorisés
  const TRUSTED_DOMAINS = [
    'cdn.simpleicons.org',
    'simpleicons.org',
    'images.unsplash.com',
    'unsplash.com',
    'cdn.discordapp.com',
    'media.discordapp.net',
    'picsum.photos',
    'assets.coingecko.com',
    'cryptologos.cc',
    'raw.githubusercontent.com',
    'github.com',
    'avatars.githubusercontent.com',
    'upload.wikimedia.org',
    'pbs.twimg.com',
    'abs.twimg.com',
    'i.imgur.com',
    'imgur.com',
    'assets.coingecko.com', // Added for crypto logos
  ];

  // Vérifier si l'URL provient d'un CDN fiable
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.toLowerCase();

    // Accepter les URLs de CDN fiables
    if (TRUSTED_DOMAINS.some(domain => hostname === domain || hostname.endsWith('.' + domain))) {
      return true;
    }
  } catch {
    // URL invalide
    return false;
  }

  // Chercher dans toutes les bases de données locales
  const inCrypto = Object.values(CRYPTO_LOGOS).some(crypto => crypto.logo === url);
  if (inCrypto) return true;

  const inCompany = Object.values(COMPANY_LOGOS).some(company => company.logo === url);
  if (inCompany) return true;

  const inMisc = Object.values(MISC_LOGOS).some(misc => misc.logo === url);
  if (inMisc) return true;

  const inThemeImages = Object.values(THEME_IMAGES).some(theme => theme.logo === url);
  if (inThemeImages) return true;

  // === NOUVELLES CATÉGORIES ===
  const inPokemon = Object.values(POKEMON_LOGOS).some(pokemon => pokemon.logo === url);
  if (inPokemon) return true;

  const inAnime = Object.values(ANIME_LOGOS).some(anime => anime.logo === url);
  if (inAnime) return true;

  const inSteam = Object.values(STEAM_LOGOS).some(steam => steam.logo === url);
  if (inSteam) return true;

  const inDevops = Object.values(DEVOPS_LOGOS).some(devops => devops.logo === url);
  if (inDevops) return true;

  const inEsport = Object.values(ESPORT_LOGOS).some(esport => esport.logo === url);
  if (inEsport) return true;

  const inVideogame = Object.values(VIDEOGAME_LOGOS).some(videogame => videogame.logo === url);
  if (inVideogame) return true;

  const inParty = Object.values(PARTY_LOGOS).some(party => party.logo === url);
  if (inParty) return true;

  const inSimpleicons = Object.values(SIMPLEICONS_LOGOS).some(icon => icon.logo === url);
  if (inSimpleicons) return true;

  return false;
}

/**
 * Détecte si une URL est un SVG
 */
export function isSvgUrl(url: string): boolean {
  const lowerUrl = url.toLowerCase();
  return (
    lowerUrl.endsWith('.svg') || lowerUrl.includes('.svg?') || lowerUrl.includes('simpleicons.org')
  ); // SimpleIcons renvoie du SVG
}

// ============================================================================
// GÉNÉRATEUR DE CODE TYPESCRIPT
// ============================================================================

/**
 * Convertit les paramètres du bouton en action persistante (pour creer_embed)
 */
function buildButtonActionFromCreerEmbed(btn: any): any {
  switch (btn.action) {
    case 'link':
      if (btn.value) {
        return { type: 'link', url: btn.value };
      }
      return { type: 'message', content: 'Lien non configuré', ephemeral: true };

    case 'delete':
      return { type: 'delete' };

    case 'edit':
      return { type: 'edit', newEmbed: btn.customData?.embed };

    case 'refresh':
      return { type: 'refresh' };

    case 'role':
      if (btn.roleId) {
        return { type: 'role', roleId: btn.roleId };
      }
      return { type: 'message', content: 'Rôle non configuré', ephemeral: true };

    case 'message':
      return {
        type: 'message',
        content: btn.customData?.message || btn.value || `${btn.label} cliqué !`,
        ephemeral: btn.customData?.ephemeral !== false,
      };

    case 'embed':
      return {
        type: 'embed',
        embed: btn.customData?.embed,
        ephemeral: btn.customData?.ephemeral !== false,
      };

    case 'custom':
      if (btn.customData?.embed) {
        return {
          type: 'embed',
          embed: btn.customData.embed,
          ephemeral: btn.customData.ephemeral !== false,
        };
      }
      return {
        type: 'message',
        content: btn.customData?.message || btn.value || `${btn.label} cliqué !`,
        ephemeral: btn.customData?.ephemeral !== false,
      };

    default:
      return {
        type: 'message',
        content: `${btn.label} cliqué !`,
        ephemeral: true,
      };
  }
}

/**
 * Convertit les paramètres du menu en action persistante (pour creer_embed)
 */
function buildMenuActionFromCreerEmbed(menu: any): any {
  switch (menu.action) {
    case 'link':
      if (menu.url) {
        return { type: 'link', url: menu.url, template: menu.template };
      }
      return { type: 'message', content: 'Lien non configuré', ephemeral: true };

    case 'delete':
      return { type: 'delete' };

    case 'edit':
      return { type: 'edit', newEmbed: menu.customData?.embed };

    case 'refresh':
      return { type: 'refresh' };

    case 'role':
      if (menu.roleId) {
        return { type: 'role', roleId: menu.roleId };
      }
      return { type: 'message', content: 'Rôle non configuré', ephemeral: true };

    case 'embed':
      if (menu.customData?.embed) {
        return {
          type: 'embed',
          embed: menu.customData.embed,
          ephemeral: true,
        };
      }
      return { type: 'message', content: 'Embed non configuré', ephemeral: true };

    case 'modal':
      if (menu.customData?.modalId) {
        return { type: 'modal', modalId: menu.customData.modalId };
      }
      return { type: 'message', content: 'Modal non configuré', ephemeral: true };

    case 'custom':
      return {
        type: 'custom',
        handler: menu.customData?.handler || 'customHandler',
      };

    default:
      return {
        type: 'message',
        content: menu.content || `Sélection: ${menu.action}`,
        template: menu.template,
        ephemeral: true,
      };
  }
}

/**
 * THÈMES PÉDAGOGIQUES - Exemples de configurations pour creer_embed()
 *
 * ⚠️  IMPORTANT: Ces thèmes sont des EXEMPLES à personnaliser !
 * Chaque thème montre une structure possible d'embed.
 * ADAPTEZ toujours selon votre contexte spécifique.
 *
 * 💡 VARIABLES DISPONIBLES:
 * {timestamp} - Date/heure actuelle
 * {date} - Date uniquement
 * {time} - Heure actuelle
 * {year} - Année
 * {month} - Mois
 * {day} - Jour
 * {weekday} - Jour de la semaine
 */

/**
 * Génère le code TypeScript complet pour créer un embed avec ses boutons
 * Fonction GENERALISTE - fonctionne avec n'importe quelle configuration
 */
function generateTypeScriptCode(args: any): string {
  const code: string[] = [];

  // Appliquer le thème si spécifié
  const params = applyTheme(args.theme, args);

  // Préparer les boutons (avant la génération du code pour les imports)
  let buttons = params.buttons || [];
  if (args.theme === 'noel' && buttons.length === 0) {
    buttons = [
      {
        label: '🎁 Cadeau',
        style: 'Success',
        emoji: '🎁',
        action: 'custom',
        customData: {
          embed: {
            title: '🎁 Votre Cadeau de Noël !',
            description:
              '✨ Voici votre récompense spéciale !\\n\\n🎄 Image de Noël 4K : [Cliquez ici](https://unsplash.com/s/photos/christmas-4k)\\n\\n🌟 Joyeuses fêtes !',
            color: 0x00ff00,
          },
        },
      },
    ];
  }

  // En-tête du code généré
  code.push(`// ============================================================================
// EMBED DISCORD - CODE GÉNÉRÉ AUTOMATIQUEMENT
// ============================================================================`);
  code.push(`// Date de génération: ${new Date().toLocaleString('fr-FR')}`);
  code.push(`// Thème: ${args.theme || 'custom'}`);
  code.push(`//`);
  code.push(`// Utilisation: Copiez ce code dans votre fichier TypeScript`);
  code.push(`// Imports nécessaires:`);

  // Imports de base
  code.push(
    `// import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';`
  );
  code.push(`// import { Client } from 'discord.js';`);

  // Imports conditionnels selon les actions
  const hasModal = buttons.some((b: any) => b.action === 'modal');
  if (hasModal) {
    code.push(`// import { ModalBuilder, TextInputBuilder, TextInputStyle } from 'discord.js';`);
  }

  code.push(``);
  code.push(`// ============================================================================`);
  code.push(``);

  // Variables communes
  const channelId = params.channelId || 'YOUR_CHANNEL_ID';
  const embedId = `embed_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  // Commentaire de thème si appliqué
  if (args.theme) {
    code.push(`// 🎨 Thème appliqué: ${args.theme}`);
    code.push(``);
  }

  // ============================================================================
  // FONCTION DE CRÉATION DE L'EMBED
  // ============================================================================
  code.push(`// ============================================================================
// FONCTION DE CRÉATION DE L'EMBED
// ============================================================================`);
  code.push(``);
  code.push(`async function createEmbed(channelId: string, client: Client) {`);
  code.push(`  const embed = new EmbedBuilder();`);
  code.push(`  `);

  // Title
  if (params.title) {
    code.push(`  // Titre de l'embed`);
    code.push(`  embed.setTitle('${params.title}');`);
    code.push(`  `);
  }

  // Description
  if (params.description) {
    code.push(`  // Description principale`);
    const desc = params.description.replace(/`/g, '\\`').replace(/\n/g, '\\n');
    code.push(`  embed.setDescription(\`${desc}\`);`);
    code.push(`  `);
  }

  // Color
  if (params.color) {
    code.push(`  // Couleur de l'embed`);
    code.push(`  embed.setColor('${params.color}');`);
    code.push(`  `);
  }

  // Author
  if (params.authorName) {
    code.push(`  // Auteur (haut-gauche avec icône PETITE)`);
    code.push(`  embed.setAuthor({`);
    code.push(`    name: '${params.authorName}',`);
    if (params.authorUrl) code.push(`    url: '${params.authorUrl}',`);
    if (params.authorIcon) code.push(`    iconURL: '${params.authorIcon}',`);
    code.push(`  });`);
    code.push(`  `);
  }

  // Thumbnail (haut-droite MOYENNE)
  if (params.thumbnail) {
    code.push(`  // Thumbnail (haut-droite - image MOYENNE)`);
    code.push(`  embed.setThumbnail('${params.thumbnail}');`);
    code.push(`  `);
  }

  // Image (bas GRANDE)
  if (params.image) {
    code.push(`  // Image principale (bas - image GRANDE)`);
    code.push(`  embed.setImage('${params.image}');`);
    code.push(`  `);
  }

  // Footer
  if (params.footerText) {
    code.push(`  // Footer (bas-gauche avec icône PETITE)`);
    code.push(`  embed.setFooter({`);
    code.push(`    text: '${params.footerText}',`);
    if (params.footerIcon) code.push(`    iconURL: '${params.footerIcon}',`);
    code.push(`  });`);
    code.push(`  `);
  }

  // Timestamp
  if (params.timestamp !== false) {
    code.push(`  // Timestamp actuel`);
    code.push(`  embed.setTimestamp();`);
    code.push(`  `);
  }

  // URL
  if (params.url) {
    code.push(`  // URL cliquable`);
    code.push(`  embed.setURL('${params.url}');`);
    code.push(`  `);
  }

  // Fields
  if (params.fields && params.fields.length > 0) {
    code.push(`  // Champs additionnels`);
    code.push(`  embed.addFields(`);
    params.fields.forEach((field: any) => {
      const inline = field.inline ? ', inline: true' : '';
      const val = field.value.replace(/`/g, '\\`').replace(/\n/g, '\\n');
      code.push(`    { name: '${field.name}', value: \`${val}\`${inline} },`);
    });
    code.push(`  );`);
    code.push(`  `);
  }

  // Charts (NEW)
  if (params.charts && params.charts.length > 0) {
    code.push(`  // Graphiques ASCII (NEW)`);
    params.charts.forEach((chart: any) => {
      code.push(
        `  const asciiChart${params.charts.indexOf(chart)} = generateAsciiChart('${chart.type}', ${JSON.stringify(chart.data)}, ${JSON.stringify(chart.labels)}, { height: ${chart.size === 'small' ? 5 : chart.size === 'large' ? 15 : 10} });`
      );
      code.push(
        `  embed.addFields({ name: '📊 ${chart.title}', value: asciiChart${params.charts.indexOf(chart)}, inline: ${chart.size === 'small'} });`
      );
    });
    code.push(`  `);
  }

  // Adaptive Links (NEW)
  if (params.adaptiveLinks && params.adaptiveLinks.length > 0) {
    code.push(`  // Liens adaptatifs (NEW)`);
    code.push(
      `  const linksText = ${JSON.stringify(params.adaptiveLinks)}.map(link => adaptLinkForUser(link, 'USER_ID')).join('\\n');`
    );
    code.push(`  embed.addFields({ name: '🔗 Liens', value: linksText, inline: false });`);
    code.push(`  `);
  }

  // Progress Bars (NEW)
  if (params.progressBars && params.progressBars.length > 0) {
    code.push(`  // Barres de progression (NEW)`);
    params.progressBars.forEach((progress: any) => {
      code.push(
        `  const bar${params.progressBars.indexOf(progress)} = createProgressBar(${progress.value}, ${progress.max}, ${progress.length || 10});`
      );
      code.push(
        `  const pct${params.progressBars.indexOf(progress)} = Math.round((${progress.value} / ${progress.max}) * 100);`
      );
      code.push(
        `  embed.addFields({ name: '${progress.label}', value: \`\${bar${params.progressBars.indexOf(progress)}} \${pct${params.progressBars.indexOf(progress)}}% (\${${progress.value}}/\${${progress.max}})\`, inline: false });`
      );
    });
    code.push(`  `);
  }

  // Crypto List (NEW)
  if (params.cryptoList && params.cryptoList.length > 0) {
    code.push(`  // Liste de cryptos (NEW)`);
    code.push(
      `  const cryptoLines = ${JSON.stringify(params.cryptoList)}.map((crypto, index) => {`
    );
    code.push(`    const displayName = crypto.name || crypto.symbol;`);
    code.push(`    const value = crypto.value ? ' - ' + crypto.value : '';`);
    code.push(
      `    return \`\${index + 1}. **\${displayName.toUpperCase()}** (\${crypto.symbol.toUpperCase()})\${value}\`;`
    );
    code.push(`  });`);
    code.push(
      `  embed.addFields({ name: '🪙 Crypto-monnaies', value: cryptoLines.join('\\n'), inline: false });`
    );
    code.push(`  `);
  }

  // ============================================================================
  // COMPOSANTS (BOUTONS)
  // ============================================================================
  if (buttons.length > 0) {
    code.push(`  // ============================================================================`);
    code.push(`  // BOUTONS`);
    code.push(`  // ============================================================================`);
    code.push(`  `);
    code.push(`  const components: ActionRowBuilder<ButtonBuilder>[] = [];`);
    code.push(`  const row = new ActionRowBuilder<ButtonBuilder>();`);
    code.push(`  `);
    code.push(`  const buttonId = '${embedId}';`);
    code.push(`  `);

    buttons.forEach((btn: any, index: number) => {
      const styleMap: Record<string, string> = {
        Primary: 'ButtonStyle.Primary',
        Secondary: 'ButtonStyle.Secondary',
        Success: 'ButtonStyle.Success',
        Danger: 'ButtonStyle.Danger',
      };

      const btnStyle = styleMap[btn.style] || 'ButtonStyle.Primary';
      const btnEmoji = btn.emoji ? `.setEmoji('${btn.emoji}')` : '';

      code.push(`  // Bouton ${index + 1}: ${btn.label}`);
      code.push(`  const button${index + 1} = new ButtonBuilder()`);
      code.push(`    .setCustomId(buttonId + '_${index}')`);
      code.push(`    .setLabel('${btn.label}')`);
      code.push(`    .setStyle(${btnStyle})${btnEmoji});`);
      code.push(`  row.addComponents(button${index + 1});`);
      code.push(`  `);
    });

    code.push(`  components.push(row);`);
    code.push(`  `);
  }

  code.push(`  // Envoi de l'embed`);
  code.push(`  const channel = await client.channels.fetch(channelId);`);
  code.push(`  if (!channel || !('send' in channel)) {`);
  code.push(`    throw new Error('Canal invalide');`);
  code.push(`  }`);
  code.push(`  `);
  code.push(`  const message = await channel.send({`);
  code.push(`    content: ${params.content ? `'${params.content}'` : 'undefined'},`);
  code.push(`    embeds: [embed],`);
  code.push(`    components: ${buttons.length > 0 ? 'components' : 'undefined'},`);
  code.push(`  });`);
  code.push(`  `);
  code.push(`  Logger.info(\`✅ Embed créé | ID: \${message.id}\`);`);
  code.push(`  return message;`);
  code.push(`}`);
  code.push(``);

  // ============================================================================
  // HANDLER POUR LES BOUTONS
  // ============================================================================
  if (buttons.length > 0 && params.includeHandler !== false) {
    code.push(`// ============================================================================
// GESTIONNAIRE D'INTÉRACTION POUR LES BOUTONS
// ============================================================================`);
    code.push(``);
    code.push(`client.on('interactionCreate', async (interaction) => {`);
    code.push(`  if (!interaction.isButton()) return;`);
    code.push(`  `);

    buttons.forEach((btn: any, index: number) => {
      const btnAction = btn.action || 'none';

      code.push(`  // Bouton ${index + 1}: ${btn.label} (action: ${btnAction})`);
      code.push(`  if (interaction.customId === '${embedId}_${index}') {`);

      // Générer le code selon le type d'action
      switch (btnAction) {
        case 'link':
          if (btn.value) {
            code.push(`    // Action: lien vers ${btn.value}`);
            code.push(`    await interaction.reply({`);
            code.push(`      content: '🔗 ${btn.value}',`);
            code.push(`      ephemeral: false,`);
            code.push(`    });`);
          } else {
            code.push(`    // Erreur: lien non configuré`);
            code.push(
              `    await interaction.reply({ content: '❌ Lien non configuré', ephemeral: true });`
            );
          }
          break;

        case 'delete':
          code.push(`    // Action: supprimer le message`);
          code.push(`    await interaction.update({`);
          code.push(`      content: '🗑️ Message supprimé',`);
          code.push(`      embeds: [],`);
          code.push(`      components: [],`);
          code.push(`    });`);
          code.push(`    // Supprimer après 2 secondes`);
          code.push(`    setTimeout(() => interaction.deleteReply().catch(() => {}), 2000);`);
          break;

        case 'edit':
          if (btn.customData?.embed) {
            const editEmbed = btn.customData.embed;
            const editDesc = (editEmbed.description || '').replace(/`/g, '\\`');
            code.push(`    // Action: modifier l'embed`);
            code.push(`    const editedEmbed = new EmbedBuilder()`);
            code.push(`      .setTitle('${editEmbed.title || 'Embed Modifié'}')`);
            code.push(`      .setDescription(\`${editDesc}\`)`);
            code.push(`      .setColor(${editEmbed.color || 0x5865f2})`);
            code.push(`      .setTimestamp();`);
            code.push(`    await interaction.update({ embeds: [editedEmbed] });`);
          } else {
            code.push(
              `    await interaction.reply({ content: '❌ Données de modification non fournies', ephemeral: true });`
            );
          }
          break;

        case 'refresh':
          code.push(`    // Action: rafraîchir l'embed avec nouveau timestamp`);
          code.push(`    const refreshedEmbed = EmbedBuilder.from(interaction.message.embeds[0]);`);
          code.push(`    refreshedEmbed.setTimestamp(new Date());`);
          code.push(`    await interaction.update({ embeds: [refreshedEmbed] });`);
          break;

        case 'role':
          if (btn.roleId) {
            code.push(`    // Action: gérer le rôle ${btn.roleId}`);
            code.push(
              `    const member = await interaction.guild.members.fetch(interaction.user.id);`
            );
            code.push(`    const role = await interaction.guild.roles.fetch('${btn.roleId}');`);
            code.push(`    if (!role) {`);
            code.push(
              `      await interaction.reply({ content: '❌ Rôle introuvable', ephemeral: true });`
            );
            code.push(`      return;`);
            code.push(`    }`);
            code.push(`    // Toggle le rôle (l'ajouter si absent, le retirer si présent)`);
            code.push(`    if (member.roles.cache.has('${btn.roleId}')) {`);
            code.push(`      await member.roles.remove('${btn.roleId}');`);
            code.push(
              `      await interaction.reply({ content: '❌ Rôle retiré: ' + role.name, ephemeral: true });`
            );
            code.push(`    } else {`);
            code.push(`      await member.roles.add('${btn.roleId}');`);
            code.push(
              `      await interaction.reply({ content: '✅ Rôle ajouté: ' + role.name, ephemeral: true });`
            );
            code.push(`    }`);
          } else {
            code.push(
              `    await interaction.reply({ content: '❌ Rôle non configuré', ephemeral: true });`
            );
          }
          break;

        case 'modal':
          code.push(`    // Action: afficher un modal`);
          code.push(`    const modal = new ModalBuilder()`);
          code.push(`      .setCustomId('modal_${embedId}_${index}')`);
          code.push(`      .setTitle('${btn.customData?.modalTitle || 'Formulaire'}');`);
          code.push(`    `);
          code.push(`    const firstInput = new TextInputBuilder()`);
          code.push(`      .setCustomId('modal_input')`);
          code.push(`      .setLabel('${btn.customData?.inputLabel || 'Votre réponse'}')`);
          code.push(`      .setStyle(TextInputStyle.Short)`);
          code.push(`      .setRequired(true);`);
          code.push(`    `);
          code.push(
            `    const firstActionRow = new ActionRowBuilder<TextInputBuilder>().addComponents(firstInput);`
          );
          code.push(`    modal.addComponents(firstActionRow);`);
          code.push(`    `);
          code.push(`    await interaction.showModal(modal);`);
          break;

        case 'custom':
        default:
          if (btn.action === 'custom' && btn.customData?.embed) {
            const rewardEmbed = btn.customData.embed;
            const desc = (rewardEmbed.description || '').replace(/`/g, '\\`');
            code.push(`    // Action: embed de récompense personnalisé`);
            code.push(`    const rewardEmbed = new EmbedBuilder()`);
            code.push(`      .setTitle('${rewardEmbed.title || 'Réponse'}')`);
            code.push(`      .setDescription(\`${desc}\`)`);
            code.push(`      .setColor(${rewardEmbed.color || 0x5865f2})`);
            code.push(`      .setTimestamp();`);
            code.push(`    await interaction.reply({ embeds: [rewardEmbed], ephemeral: true });`);
          } else if (btn.customData?.message) {
            code.push(`    // Action: message personnalisé`);
            code.push(`    await interaction.reply({`);
            code.push(`      content: '${btn.customData.message}',`);
            code.push(`      ephemeral: ${btn.customData.ephemeral !== false},`);
            code.push(`    });`);
          } else {
            code.push(`    // Action: réponse simple par défaut`);
            code.push(`    await interaction.reply({`);
            code.push(`      content: '✅ ${btn.label} cliqué !',`);
            code.push(`      ephemeral: true,`);
            code.push(`    });`);
          }
          break;
      }

      code.push(`  }`);
      if (index < buttons.length - 1) code.push(`  `);
    });

    code.push(`});`);
    code.push(``);
  }

  // ============================================================================
  // APPEL DE LA FONCTION
  // ============================================================================
  code.push(`// ============================================================================`);
  code.push(`// APPEL DE LA FONCTION`);
  code.push(`// ============================================================================`);
  code.push(``);
  code.push(`// Pour utiliser: await createEmbed('${channelId}', client);`);
  code.push(``);

  return code.join('\n');
}
// ============================================================================
// ENREGISTREMENT DES OUTILS
// ============================================================================

export function registerEmbedTools(server: FastMCP) {
  Logger.info('[EMBEDS] === DÉBUT ENREGISTREMENT DES OUTILS EMBEDS ===');

  // 1. Créer Embed
  Logger.info("[EMBEDS] Ajout de l'outil creer_embed...");
  server.addTool({
    name: 'creer_embed',
    description: `🎯 ULTRA-INTUITIF - Créer un embed Discord en 3 étapes SIMPLES !

📋 ÉTAPE 1 (OBLIGATOIRE):
   • channelId: ID du canal Discord
   • title: Titre de l'embed
   • description: Texte principal

📚 ÉTAPE 2 (RECOMMANDÉ):
   • theme: basic | data_report | status_update | product_showcase | leaderboard | tech_announcement | social_feed | dashboard | noel | minimal

🎨 ÉTAPE 3 (OPTIONNEL):
   • image: Grande image (bas)
   • thumbnail: Petite image (haut-droite)
   • buttons: Boutons interactifs (max 5)
   • fields: Champs de données (max 10)

🖼️ IMAGES: 4 positions disponibles
   • authorIcon (haut-gauche) - PETITE (16x16px Discord)
   • thumbnail (haut-droite) - MOYENNE (80x80px Discord)
   • image (bas) - GRANDE (400x250px Discord)
   • footerIcon (bas-gauche) - PETITE (16x16px Discord)

💡 CONSEIL: Utilisez help=true pour afficher le guide interactif !

🚀 PHASE 1 ENHANCEMENT (automatique):
   • Cache local d'images
   • Fallback intelligent (URL invalide → Emoji)
   • Validation pré-exécution
   • Optimisation Discord

⚡ MENTIONS DISCORD - IMPORTANT:
   ❌ authorName/footerText NE supportent PAS les mentions
   ✅ description SUPPORTE les mentions (<@ID>, <@!ID>, <#ID>, <@&ID>)
   • Discord n'interprète PAS les mentions dans authorName/footerText
   • Utilisez description pour les mentions interactives (bleu, cliquable)`,
    parameters: z.object({
      help: z
        .boolean()
        .optional()
        .describe('🎯 Affiche le guide interactif complet avec exemples et conseils'),
      channelId: z.string().describe('ID du canal Discord'),
      title: z
        .string()
        .optional()
        .describe("Titre de l'embed (NE supporte PAS les mentions Discord)"),
      description: z
        .string()
        .optional()
        .describe(
          'Description principale (SUPPORTE les mentions Discord: <@USER_ID>, <@!USER_ID>, <#CHANNEL_ID>, <@&ROLE_ID>)'
        ),
      color: z.string().optional().describe('Couleur en hex (#RRGGBB)'),
      url: z.string().optional().describe('URL cliquable'),
      thumbnail: z
        .string()
        .optional()
        .describe(
          "URL thumbnail (MOYENNE - en haut à droite de l'embed). Utilisez list_images({symbols: 'BTC'}) pour un logo crypto."
        ),
      image: z
        .string()
        .optional()
        .describe(
          "URL image (GRANDE - en bas de l'embed, pleine largeur). Utilisez list_images({symbols: ['BTC', 'ETH']}) pour plusieurs logos."
        ),
      authorName: z
        .string()
        .optional()
        .describe(
          "⚠️ NE supporte PAS les mentions Discord. Utilisez un simple texte comme 'Bot Name' ou 'System'. Pour mentionner un utilisateur, mettez la mention dans la DESCRIPTION."
        ),
      authorUrl: z.string().optional().describe("URL cliquable du nom de l'auteur"),
      authorIcon: z
        .string()
        .optional()
        .describe(
          "URL icône auteur (PETITE - en haut à gauche, à côté du nom). Utilisez list_images({symbols: 'AAPL'}) pour un logo d'entreprise."
        ),
      footerText: z
        .string()
        .optional()
        .describe(
          '⚠️ NE supporte PAS les mentions Discord. Utilisez un simple texte. Pour mentionner un utilisateur, mettez la mention dans la DESCRIPTION.'
        ),
      footerIcon: z
        .string()
        .optional()
        .describe(
          "URL icône footer (PETITE - en bas à gauche, à côté du texte). Utilisez list_images({symbols: 'DISCORD'}) pour un logo de service."
        ),
      fields: z
        .array(
          z.object({
            name: z.string(),
            value: z.string(),
            inline: z.boolean().optional().default(false),
          })
        )
        .optional()
        .describe('Champs (supporte | Col1 | Col2 |)'),
      timestamp: z.boolean().optional().default(true).describe('Ajouter timestamp'),
      content: z.string().optional().describe('Message texte supplémentaire'),
      autoTable: z.boolean().optional().default(true).describe('Auto-formater les tableaux'),
      pagination: z
        .object({
          enabled: z.boolean().optional().default(false),
          maxLength: z.number().optional().default(1000),
          showPageNumber: z.boolean().optional().default(true),
        })
        .optional()
        .describe('Pagination pour longs contenus'),
      variables: z.record(z.string()).optional().describe('Variables personnalisées {var}'),
      templateName: z.string().optional().describe('Nom du template à utiliser'),
      saveAsTemplate: z.string().optional().describe('Sauvegarder comme template'),
      autoUpdate: z
        .object({
          enabled: z.boolean().optional().default(false),
          interval: z.number().optional().describe('Intervalle en secondes'),
          source: z.string().optional().describe('Source de données (URL ou fonction)'),
        })
        .optional()
        .describe('Mise à jour automatique'),
      buttons: z
        .array(
          z.object({
            label: z.string(),
            style: z.enum(['Primary', 'Secondary', 'Success', 'Danger']).default('Primary'),
            emoji: z.string().optional(),
            action: z
              .enum([
                'none',
                'refresh',
                'link',
                'custom',
                'delete',
                'edit',
                'role',
                'modal',
                'message',
                'embed',
              ])
              .default('none'),
            value: z.string().optional().describe('URL pour action link'),
            roleId: z.string().optional().describe('ID du rôle pour action role (toggle)'),
            custom_id: z
              .string()
              .describe(
                '🔒 OBLIGATOIRE - ID personnalisé unique pour le bouton (ex: "noel_2024_surprise", "btn_refresh_1"). Cet ID fixe garantit que le bouton fonctionnera toujours même après modification de l\'embed.'
              ),
            persistent: z
              .boolean()
              .optional()
              .default(false)
              .describe(
                'Si true, le bouton est sauvegardé dans dist/data/ et hooké aux handlers persistants'
              ),
            customData: z
              .object({
                message: z.string().optional(),
                ephemeral: z.boolean().optional(),
                embed: z
                  .object({
                    title: z.string().optional(),
                    description: z.string().optional(),
                    color: z.number().optional(),
                  })
                  .optional(),
                modalTitle: z.string().optional().describe('Titre du modal pour action modal'),
                inputLabel: z.string().optional().describe('Label du champ de saisie modal'),
              })
              .optional(),
          })
        )
        .max(5)
        .optional()
        .describe("Boutons intégrés dans l'embed avec actions configurables"),
      selectMenus: z
        .array(
          z.object({
            custom_id: z
              .string()
              .describe(
                '🔒 OBLIGATOIRE - ID personnalisé unique pour le menu (ex: "menu_select_crypto", "menu_choose_role"). Cet ID fixe garantit que le menu fonctionnera toujours même après modification de l\'embed.'
              ),
            type: z.enum(['string', 'user', 'role', 'channel', 'mentionable']).default('string'),
            placeholder: z.string().optional(),
            minValues: z.number().optional().default(1),
            maxValues: z.number().optional().default(1),
            options: z
              .array(
                z.object({
                  label: z.string(),
                  value: z.string(),
                  description: z.string().optional(),
                  emoji: z.string().optional(),
                })
              )
              .optional()
              .describe('Options pour type=string'),
            action: z
              .enum([
                'message',
                'embed',
                'role',
                'delete',
                'refresh',
                'link',
                'edit',
                'custom',
                'modal',
              ])
              .default('message'),
            roleId: z.string().optional().describe('ID du rôle pour action role'),
            url: z.string().optional().describe('URL pour action link'),
            content: z.string().optional().describe('Contenu du message pour action message'),
            template: z
              .string()
              .optional()
              .describe('Template avec {values} et {user} pour actions message/link'),
            persistent: z
              .boolean()
              .optional()
              .default(false)
              .describe('Si true, le menu est sauvegardé dans dist/data/'),
            customData: z
              .object({
                embed: z
                  .object({
                    title: z.string().optional(),
                    description: z.string().optional(),
                    color: z.number().optional(),
                  })
                  .optional(),
                handler: z.string().optional().describe('Nom du handler pour action custom'),
                modalId: z.string().optional().describe('ID du modal pour action modal'),
              })
              .optional(),
          })
        )
        .max(5)
        .optional()
        .describe("Menus de sélection intégrés dans l'embed avec actions configurables"),
      progressBars: z
        .array(
          z.object({
            fieldIndex: z.number(),
            label: z.string(),
            value: z.number(),
            max: z.number(),
            length: z.number().optional().default(10),
          })
        )
        .optional()
        .describe('Barres de progression automatiques'),
      gradient: z
        .object({
          start: z.string().describe('Couleur de début (#RRGGBB)'),
          end: z.string().describe('Couleur de fin (#RRGGBB)'),
        })
        .optional()
        .describe('Dégradé de couleurs'),
      theme: z
        .enum([
          'basic',
          'data_report',
          'status_update',
          'product_showcase',
          'leaderboard',
          'tech_announcement',
          'social_feed',
          'dashboard',
          'noel',
          'minimal',
          'cyberpunk',
          'gaming',
          'corporate',
          'sunset',
          'ocean',
        ])
        .optional()
        .describe(
          'Thème visuel (Couleurs & template texte). NOTE: Les images/icones ne sont PLUS automatiques. CONSEIL: Utilisez list_images({category: "nom_du_theme"}) pour trouver les assets visuels appropriés (ex: cyberpunk, gaming, minimal, etc.)'
        ),
      enableAnalytics: z
        .boolean()
        .optional()
        .default(true)
        .describe('Activer le tracking analytics'),
      charts: z
        .array(
          z.object({
            type: z.enum(['line', 'bar', 'pie', 'sparkline', 'area']).describe('Type de graphique'),
            title: z.string().describe('Titre du graphique'),
            data: z.array(z.number()).describe('Données du graphique'),
            labels: z.array(z.string()).optional().describe('Labels des données'),
            colors: z.array(z.string()).optional().describe('Couleurs du graphique'),
            size: z
              .enum(['small', 'medium', 'large'])
              .optional()
              .default('medium')
              .describe('Taille du graphique'),
          })
        )
        .optional()
        .describe('Graphiques intégrés (ASCII art)'),
      adaptiveLinks: z
        .array(
          z.object({
            label: z.string().describe('Texte du lien'),
            url: z.string().describe('URL de base'),
            userSpecific: z
              .boolean()
              .optional()
              .default(false)
              .describe("Adapter selon l'utilisateur"),
            webhook: z.string().optional().describe('Webhook à appeler'),
            conditions: z.record(z.string()).optional().describe("Conditions d'affichage"),
          })
        )
        .optional()
        .describe("Liens qui s'adaptent selon l'utilisateur"),
      layout: z
        .object({
          type: z
            .enum(['grid', 'stack', 'sidebar', 'centered', 'masonry'])
            .optional()
            .default('stack')
            .describe('Type de mise en page'),
          columns: z.number().optional().default(2).describe('Nombre de colonnes'),
          spacing: z
            .enum(['compact', 'normal', 'spacious'])
            .optional()
            .default('normal')
            .describe('Espacement'),
          alignment: z
            .enum(['left', 'center', 'right'])
            .optional()
            .default('left')
            .describe('Alignement'),
        })
        .optional()
        .describe('Système de mise en page'),
      cryptoLogo: z
        .object({
          symbol: z
            .string()
            .describe('Symbole crypto (BTC, ETH, SOL, etc.) - utilise list_images() en interne'),
          position: z
            .enum(['thumbnail', 'author', 'footer', 'image'])
            .optional()
            .default('thumbnail')
            .describe(
              'Position: thumbnail (haut-droite), author (haut-gauche), image (bas), footer (bas-gauche)'
            ),
          size: z
            .enum(['small', 'medium', 'large'])
            .optional()
            .default('medium')
            .describe(
              'Taille du logo (note: Discord redimensionne automatiquement selon la position)'
            ),
          format: z.enum(['png', 'svg']).optional().default('png').describe("Format de l'image"),
        })
        .optional()
        .describe(
          "RACCOURCI AUTO: Logo crypto depuis cryptologos.cc (évite d'utiliser list_images séparément). Remplace le paramètre d'image correspondant à la position."
        ),
      cryptoList: z
        .array(
          z.object({
            symbol: z.string().describe('Symbole crypto'),
            name: z.string().optional().describe('Nom affiché'),
            value: z.string().optional().describe('Valeur/Prix'),
            showLogo: z.boolean().optional().default(true).describe('Afficher le logo'),
          })
        )
        .optional()
        .describe('Liste de cryptos avec logos'),
      strictValidation: z
        .boolean()
        .optional()
        .default(true)
        .describe('Validation stricte 1024 chars'),
      generateCode: z
        .boolean()
        .optional()
        .default(false)
        .describe("Génère le code TypeScript complet au lieu d'envoyer l'embed sur Discord"),
      includeHandler: z
        .boolean()
        .optional()
        .default(true)
        .describe(
          'Inclut le code de gestion des boutons dans la génération (si generateCode=true)'
        ),
    }),
    execute: async args => {
      Logger.info(`📡 [DEBUG] creer_embed execute called for channel ${args.channelId}`);
      Logger.debug(`🔍 [TRACE] args keys: ${Object.keys(args).join(', ')}`);

      // ============================================================================
      // 🎯 SYSTÈME D'AIDE INTUITIF POUR AGENTS AVEC PERTE DE MÉMOIRE
      // ============================================================================

      // Si help=true, afficher le guide interactif complet
      if (args.help) {
        const guide = embedHelper.INTERACTIVE_GUIDE.generateGuide(args);
        const example = embedHelper.INTERACTIVE_GUIDE.generateExample(args);

        return `${guide.join('\n')}\n\n💻 **EXEMPLE DE CODE:**\n\`\`\`typescript\n${example}\n\`\`\`\n\n📚 **DOCUMENTATION COMPLÈTE:**\nVoir GUIDE_CREER_EMBED_INTUITIF.md pour tous les exemples !`;
      }

      // Validation intelligente avec conseils
      const validation = embedHelper.INTELLIGENT_VALIDATION.validate(args);
      embedHelper.INTELLIGENT_VALIDATION.displayResults(validation);

      // Afficher le guide interactif si demandé (mode debug)
      if (process.env.EMBED_DEBUG === 'true') {
        const guide = embedHelper.INTERACTIVE_GUIDE.generateGuide(args);
        Logger.info('\n' + guide.join('\n'));
      }

      // Si erreurs critiques, afficher l'aide et arrêter
      if (!validation.isValid) {
        return `❌ **ERREURS À CORRIGER:**\n\n${validation.errors.join('\n')}\n\n💡 **AIDE:** Utilisez help=true pour voir le guide interactif !`;
      }

      // Afficher les conseils même si valide
      if (validation.warnings.length > 0 || validation.tips.length > 0) {
        Logger.info('\n📝 Conseils pour améliorer votre embed:');
        validation.warnings.forEach((w: string) => Logger.info(`   ⚠️ ${w}`));
        validation.tips.forEach((t: string) => Logger.info(`   💡 ${t}`));
      }

      // ============================================================================
      // GÉNÉRATION DE CODE (MODE GÉNÉRATEUR)
      // ============================================================================
      if (args.generateCode) {
        return generateTypeScriptCode(args);
      }

      // ============================================================================
      // MODE NORMAL (ENVOI SUR DISCORD)
      // ============================================================================
      Logger.info('[EMBEDS] 🚀 DÉBUT EXECUTION creer_embed');
      Logger.info('[EMBEDS] Args reçus:', JSON.stringify(args, null, 2));
      try {
        Logger.info(`🚀 [creer_embed] Titre: ${args.title || 'N/A'}`);
        const client = await ensureDiscordConnection();
        // ============================================================================
        // 🚨 OVERRIDE SENTINEL POLLS
        // Utilisation directe du canal dédié 1421701551080345710 pour Sentinel
        // ============================================================================
        let finalChannelId = args.channelId;

        // 1. Détection par l'auteur (Si le message vient du système Sentinel)
        if (
          args.authorName &&
          typeof args.authorName === 'string' &&
          args.authorName.toUpperCase().includes('SENTINEL')
        ) {
          Logger.info(
            '🚨 [SENTINEL] Détection Sentinel (Author) - Force Canal: 1460428956518846466'
          );
          finalChannelId = '1460428956518846466';
        }

        // 2. Détection par contenu (Backup)
        else if (
          args.title &&
          typeof args.title === 'string' &&
          args.title.includes('ALERTE DE CAPITULATION')
        ) {
          Logger.info(
            '🚨 [SENTINEL] Détection Sentinel (Titre) - Force Canal: 1460428956518846466'
          );
          finalChannelId = '1460428956518846466';
        }

        const channel = await client.channels.fetch(finalChannelId);

        if (!channel || !('send' in channel)) {
          throw new Error('Canal invalide ou inaccessible');
        }

        let embedData = {};
        if (args.templateName) {
          const template = await loadTemplate(args.templateName);
          if (!template) {
            return `❌ Template '${args.templateName}' non trouvé`;
          }
          embedData = template;
        }

        if (args.theme) {
          // Utilise applyTheme qui contient tous les nouveaux contenus riches
          embedData = applyTheme(args.theme, embedData);
        }

        const embed = new EmbedBuilder();
        const dataToUse = { ...embedData, ...args };

        // ============================================================================
        // 🔒 SÉCURITÉ CONTENU (CONTENT SAFETY)
        // Empêcher l'injection d'images via le texte (Markdown)
        // ============================================================================
        const markdownImageRegex = /!\[.*?\]\(.*?\)|\[Image:.*?\]/i;
        const imageExtensionRegex = /\.(jpg|jpeg|png|gif|webp)/i;

        const validateNoImagesInText = (text: string | undefined, fieldName: string) => {
          if (!text) return;
          // On vérifie si ça ressemble à une image markdown OU si ça contient une URL d'image entre crochets
          if (markdownImageRegex.test(text) && imageExtensionRegex.test(text)) {
            throw new Error(
              `⛔ SÉCURITÉ: Vous essayez d'insérer une image via le texte dans '${fieldName}'.\nDISCORD NE RENDERISE PAS LES IMAGES MARKDOWN DANS LES EMBEDS.\n❌ INTERDIT: ![img](url) ou [Image: url]\n✅ SOLUTION: Utilisez les paramètres 'image' (grande image bas) ou 'thumbnail' (petite image haut-droite).`
            );
          }
        };

        validateNoImagesInText(dataToUse.title, 'title');
        validateNoImagesInText(dataToUse.description, 'description');
        validateNoImagesInText(dataToUse.authorName, 'authorName');
        validateNoImagesInText(dataToUse.footerText, 'footerText');

        if (dataToUse.fields) {
          dataToUse.fields.forEach((f: any, i: number) => {
            validateNoImagesInText(f.name, `fields[${i}].name`);
            validateNoImagesInText(f.value, `fields[${i}].value`);
          });
        }

        const titlePrefix = '';
        const descriptionPrefix = '';
        const descriptionSuffix = '';
        const warnings: string[] = []; // Collection des avertissements non-bloquants

        // ============================================================================
        // VALIDATION DES MENTIONS DISCORD
        // ============================================================================
        // Valider les mentions dans title et description
        if (dataToUse.title) {
          const validation = validateDiscordMentions(dataToUse.title);
          if (!validation.valid) {
            return generateMentionErrorMessage(validation, 'le titre');
          }
        }

        if (dataToUse.description) {
          const validation = validateDiscordMentions(dataToUse.description);
          if (!validation.valid) {
            return generateMentionErrorMessage(validation, 'la description');
          }
        }

        if (dataToUse.title)
          embed.setTitle(titlePrefix + replaceVariables(dataToUse.title, args.variables));
        if (dataToUse.description) {
          let description = dataToUse.description;
          if (args.autoTable && description.includes('|')) {
            description = parseTable(description);
          }
          description =
            descriptionPrefix + replaceVariables(description, args.variables) + descriptionSuffix;
          embed.setDescription(description);
        }

        if (dataToUse.color) {
          if (args.gradient) {
            embed.setColor(args.gradient.start as any);
          } else if (typeof dataToUse.color === 'number') {
            embed.setColor(dataToUse.color);
          } else if (typeof dataToUse.color === 'string') {
            if (dataToUse.color.startsWith('#')) {
              embed.setColor(dataToUse.color as any);
            } else {
              const colorMap: { [key: string]: number } = {
                RED: 0xe74c3c,
                GREEN: 0x2ecc71,
                BLUE: 0x3498db,
                YELLOW: 0xf1c40f,
                PURPLE: 0x9b59b6,
                ORANGE: 0xe67e22,
                AQUA: 0x1abc9c,
                WHITE: 0xffffff,
                BLACK: 0x000000,
                BLURPLE: 0x5865f2,
              };
              const upperColor = dataToUse.color.toUpperCase().replace(/ /g, '_');
              embed.setColor(colorMap[upperColor] || 0x000000);
            }
          }
        }

        if (dataToUse.url) embed.setURL(dataToUse.url);

        // ============================================================================
        // VÉRIFICATION DES URLs D'IMAGES - REDIRECTION SI EXTERNES
        // ============================================================================

        // Vérifier thumbnail
        if (dataToUse.thumbnail) {
          if (!isLocalLogoUrl(dataToUse.thumbnail)) {
            return generateGuidanceMessage('thumbnail', dataToUse.thumbnail);
          }
          embed.setThumbnail(dataToUse.thumbnail);
        }

        // Vérifier image
        if (dataToUse.image) {
          if (!isLocalLogoUrl(dataToUse.image)) {
            return generateGuidanceMessage('image', dataToUse.image);
          }
          embed.setImage(dataToUse.image);
        }

        if (args.cryptoLogo) {
          const cryptoInfo = getCryptoInfo(args.cryptoLogo.symbol);
          if (cryptoInfo) {
            const logoUrl =
              args.cryptoLogo.format === 'svg'
                ? cryptoInfo.logo.replace('.png', '.svg')
                : cryptoInfo.logo;

            switch (args.cryptoLogo.position) {
              case 'thumbnail':
                embed.setThumbnail(logoUrl);
                break;
              case 'image':
                embed.setImage(logoUrl);
                break;
              case 'author':
                if (!dataToUse.authorName) {
                  embed.setAuthor({
                    name: `${cryptoInfo.symbol.toUpperCase()} - ${cryptoInfo.name}`,
                    iconURL: logoUrl,
                  });
                } else {
                  embed.setAuthor({
                    name: replaceVariables(dataToUse.authorName, args.variables),
                    url: dataToUse.authorUrl,
                    iconURL: logoUrl,
                  });
                }
                break;
              case 'footer':
                if (!dataToUse.footerText) {
                  embed.setFooter({
                    text: `${cryptoInfo.symbol.toUpperCase()} | cryptologos.cc`,
                    iconURL: logoUrl,
                  });
                }
                break;
            }
          }
        }

        // ============================================================================
        // CONVERSION AUTOMATIQUE SVG → PNG
        // Discord ne supporte pas les SVG, on les convertit automatiquement
        // ============================================================================

        // Collection des fichiers à attacher (PNG convertis depuis SVG)
        const attachmentsToUpload: Map<string, string> = new Map(); // attachmentName -> filePath

        // Convertir authorIcon SVG → PNG (SKIP on failure for stability)
        if (dataToUse.authorIcon && checkIsSvgUrl(dataToUse.authorIcon)) {
          Logger.info(`[EMBED] Converting authorIcon SVG to PNG: ${dataToUse.authorIcon}`);
          try {
            const pngData = await convertSvgUrlToPng(dataToUse.authorIcon, 64);
            dataToUse.authorIcon = pngData.attachmentUrl; // attachment://filename.png
            attachmentsToUpload.set(pngData.attachmentName, pngData.path);
            Logger.info(`[EMBED] authorIcon converted to: ${pngData.attachmentUrl}`);
          } catch (error) {
            Logger.error(`[EMBED] Failed to convert authorIcon, SKIPPING:`, error);
            delete dataToUse.authorIcon; // 🛡️ SKIP: On supprime l'icône au lieu de crasher
          }
        }

        // Convertir footerIcon SVG → PNG (SKIP on failure for stability)
        if (dataToUse.footerIcon && checkIsSvgUrl(dataToUse.footerIcon)) {
          Logger.info(`[EMBED] Converting footerIcon SVG to PNG: ${dataToUse.footerIcon}`);
          try {
            const pngData = await convertSvgUrlToPng(dataToUse.footerIcon, 64);
            dataToUse.footerIcon = pngData.attachmentUrl; // attachment://filename.png
            attachmentsToUpload.set(pngData.attachmentName, pngData.path);
            Logger.info(`[EMBED] footerIcon converted to: ${pngData.attachmentUrl}`);
          } catch (error) {
            Logger.error(`[EMBED] Failed to convert footerIcon, SKIPPING:`, error);
            delete dataToUse.footerIcon; // 🛡️ SKIP: On supprime l'icône au lieu de crasher
          }
        }

        // Convertir thumbnail SVG → PNG (optionnel, Discord supporte SVG pour thumbnail)
        // if (dataToUse.thumbnail && checkIsSvgUrl(dataToUse.thumbnail)) {
        //   Logger.info(`[EMBED] Converting thumbnail SVG to PNG: ${dataToUse.thumbnail}`);
        //   try {
        //     const pngData = await convertSvgUrlToPng(dataToUse.thumbnail, 256);
        //     dataToUse.thumbnail = pngData.attachmentUrl;
        //     attachmentsToUpload.set(pngData.attachmentName, pngData.path);
        //     Logger.info(`[EMBED] thumbnail converted to: ${pngData.attachmentUrl}`);
        //   } catch (error) {
        //     Logger.error(`[EMBED] Failed to convert thumbnail:`, error);
        //   }
        // }

        // ============================================================================
        // VALIDATION DES DOMAINES DE CONFIANCE (après conversion SVG)
        // ============================================================================

        // Vérifier authorIcon (domaine de confiance)
        if (dataToUse.authorIcon) {
          if (
            !isLocalLogoUrl(dataToUse.authorIcon) &&
            !dataToUse.authorIcon.startsWith('attachment://')
          ) {
            // ⚠️ WARNING SEULEMENT: On accepte l'URL, mais on prévient l'agent
            const msg = generateGuidanceMessage('authorIcon', dataToUse.authorIcon);
            warnings.push(msg);
            Logger.warn(
              `[EMBED] URL non fiable pour authorIcon: ${dataToUse.authorIcon}. Acceptée avec avertissement.`
            );
          }
        }

        // Vérifier footerIcon (domaine de confiance)
        if (dataToUse.footerIcon) {
          if (
            !isLocalLogoUrl(dataToUse.footerIcon) &&
            !dataToUse.footerIcon.startsWith('attachment://')
          ) {
            // ⚠️ WARNING SEULEMENT: On accepte l'URL, mais on prévient l'agent
            const msg = generateGuidanceMessage('footerIcon', dataToUse.footerIcon);
            warnings.push(msg);
            Logger.warn(
              `[EMBED] URL non fiable pour footerIcon: ${dataToUse.footerIcon}. Acceptée avec avertissement.`
            );
          }
        }

        if (dataToUse.authorIcon && !dataToUse.authorName) {
          // 🛡️ FIX BUG: Si authorIcon est présent mais pas authorName, Discord ignore l'icône.
          // On force un nom invisible pour afficher l'icône DANS l'embed (et pas en attachment externe).
          dataToUse.authorName = '\u200b';
        }

        if (dataToUse.authorName) {
          embed.setAuthor({
            name: replaceVariables(dataToUse.authorName, args.variables),
            url: dataToUse.authorUrl,
            iconURL: dataToUse.authorIcon,
          });
        }

        if (dataToUse.footerIcon && !dataToUse.footerText) {
          // 🛡️ FIX BUG: Si footerIcon est présent mais pas footerText, Discord ignore l'icône.
          // On force un texte invisible pour afficher l'icône DANS l'embed.
          dataToUse.footerText = '\u200b';
        }

        if (dataToUse.footerText) {
          let footerText = replaceVariables(dataToUse.footerText, args.variables);
          if (args.gradient) {
            footerText += ` | Gradient: ${args.gradient.start} → ${args.gradient.end}`;
          }
          embed.setFooter({
            text: footerText,
            iconURL: dataToUse.footerIcon,
          });
        }

        let processedFields = dataToUse.fields || [];

        if (args.charts && args.charts.length > 0) {
          args.charts.forEach((chart, index) => {
            const asciiChart = generateAsciiChart(chart.type, chart.data, chart.labels, {
              height: chart.size === 'small' ? 5 : chart.size === 'large' ? 15 : 10,
            });
            processedFields.push({
              name: `📊 ${chart.title}`,
              value: asciiChart,
              inline: chart.size === 'small',
            });
          });
        }

        if (args.adaptiveLinks && args.adaptiveLinks.length > 0) {
          const linksText = args.adaptiveLinks
            .map(link => adaptLinkForUser(link, 'USER_ID'))
            .join('\n');
          processedFields.push({
            name: '🔗 Liens',
            value: linksText,
            inline: false,
          });
        }

        if (args.progressBars && args.progressBars.length > 0) {
          args.progressBars.forEach(progress => {
            const bar = createProgressBar(progress.value, progress.max, progress.length);
            const percentage = Math.round((progress.value / progress.max) * 100);
            processedFields.push({
              name: `${progress.label}`,
              value: `${bar} ${percentage}% (${progress.value}/${progress.max})`,
              inline: false,
            });
          });
        }

        if (args.layout) {
          processedFields = applyLayout(processedFields, args.layout);
        }

        processedFields = processedFields.map(field => ({
          ...field,
          name: replaceVariables(field.name, args.variables),
          value:
            args.autoTable && field.value.includes('|')
              ? parseTable(field.value)
              : replaceVariables(field.value, args.variables),
        }));

        if (args.cryptoList && args.cryptoList.length > 0) {
          const cryptoLines = args.cryptoList.map((crypto, index) => {
            const cryptoInfo = getCryptoInfo(crypto.symbol);
            const displayName = crypto.name || cryptoInfo?.name || crypto.symbol;
            const logoLink = cryptoInfo ? `[Logo](${cryptoInfo.logo})` : '';
            const value = crypto.value ? ` - ${crypto.value}` : '';

            return `${index + 1}. **${displayName.charAt(0).toUpperCase() + displayName.slice(1)}** (${crypto.symbol.toUpperCase()})${value}\n${crypto.showLogo !== false ? `   ${logoLink}` : ''}`;
          });

          processedFields.push({
            name: '🪙 Crypto-monnaies',
            value: cryptoLines.join('\n'),
            inline: false,
          });
        }

        if (processedFields.length > 0) {
          processedFields.forEach(field => {
            embed.addFields({
              name: field.name,
              value: field.value,
              inline: field.inline || false,
            });
          });
        }

        if (dataToUse.timestamp !== false) {
          embed.setTimestamp();
        }

        if (args.strictValidation) {
          const validation = validateFieldLength(
            processedFields,
            dataToUse.title,
            dataToUse.description,
            dataToUse.footerText
          );
          if (validation.warnings.length > 0) {
            console.warn('⚠️ Avertissements:', validation.warnings);
          }
        }

        if (args.saveAsTemplate) {
          await saveTemplate(args.saveAsTemplate, embed.data);
          Logger.info(`💾 Template '${args.saveAsTemplate}' sauvegardé`);
        }

        const embedId = `embed_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        const components: any[] = [];
        const buttonIds: string[] = [];

        if (args.buttons && args.buttons.length > 0) {
          const styleMap: Record<string, any> = {
            Primary: ButtonStyle.Primary,
            Secondary: ButtonStyle.Secondary,
            Success: ButtonStyle.Success,
            Danger: ButtonStyle.Danger,
          };

          const row = new ActionRowBuilder<ButtonBuilder>();

          // Charger les boutons existants pour y ajouter les nouveaux
          const buttonsMap = await loadCustomButtons();

          for (let index = 0; index < args.buttons.length; index++) {
            const btn = args.buttons[index];

            // ==================================================================================
            // 🛡️ GARDE-FOUS (SAFETY CHECKS) - DEMANDE UTILISATEUR
            // ==================================================================================

            // 1. Validation du format custom_id (Crucial pour le routing interne)
            if (btn.custom_id) {
              const safeIdRegex = /^[a-zA-Z0-9_-]+$/;
              if (!safeIdRegex.test(btn.custom_id)) {
                throw new Error(
                  `🛡️ GARDE-FOU: L'ID '${btn.custom_id}' est invalide. Utilisez uniquement lettres, chiffres, tirets (-) et underscores (_).`
                );
              }
              // Vérifier la longueur (Discord limite à 100, mais restons prudents à 50)
              if (btn.custom_id.length > 50) {
                throw new Error(
                  `🛡️ GARDE-FOU: L'ID '${btn.custom_id}' est trop long (max 50 caractères).`
                );
              }
            }

            // 2. Validation de l'action LINK
            if (btn.action === 'link') {
              if (
                !btn.value ||
                (!btn.value.startsWith('http') && !btn.value.startsWith('discord://'))
              ) {
                throw new Error(
                  `🛡️ GARDE-FOU: Le bouton '${btn.label}' (link) nécessite une URL valide dans 'value' (http... ou discord://...).`
                );
              }
            }

            // 3. Validation de l'action ROLE
            if (btn.action === 'role') {
              if (!btn.roleId) {
                throw new Error(
                  `🛡️ GARDE-FOU: Le bouton '${btn.label}' (role) nécessite un 'roleId' valide.`
                );
              }
            }

            // 4. Validation de l'action MESSAGE/CUSTOM (Pour éviter les interactions vides)
            if (btn.action === 'message' || btn.action === 'custom') {
              const hasContent = btn.customData?.message || btn.value || btn.customData?.embed;
              if (!hasContent) {
                // On injecte un contenu par défaut pour éviter le crash "Empty Message"
                Logger.warn(
                  `[GARDE-FOU] Le bouton '${btn.label}' n'avait pas de contenu. Ajout d'un contenu par défaut.`
                );
                if (!btn.customData) btn.customData = {};
                btn.customData.message = `Action ${btn.label} effectuée ✅`;
              }
            }

            // ==================================================================================

            // Créer un ID unique pour le bouton
            // 1. Si custom_id fourni → utilise l'ID fixe personnalisé
            // 2. Si persistant: pb_<messageId>_<index>
            // 3. Si standard: embedv2_<embedId>_<action>_<timestamp>_<random>
            const buttonId = btn.custom_id
              ? btn.custom_id // ID personnalisé fixe
              : btn.persistent
                ? `pb_TEMP_${index}_${Date.now()}` // TEMP sera remplacé par le vrai messageId après envoi
                : `embedv2_${embedId}_${btn.action}_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;

            const button = new ButtonBuilder().setLabel(btn.label);

            if (btn.action === 'link' && btn.value) {
              button.setStyle(ButtonStyle.Link);
              button.setURL(btn.value);
            } else {
              button.setCustomId(buttonId);
              button.setStyle(styleMap[btn.style] || ButtonStyle.Primary);
            }

            if (btn.emoji) {
              button.setEmoji(btn.emoji);
            }

            row.addComponents(button);
            buttonIds.push(buttonId);

            // 🔒 Bouton PERSISTANT → Sauvegarder dans dist/data/
            if (btn.persistent) {
              const persistentBtn: PersistentButton = {
                id: buttonId,
                messageId: '', // Sera mis à jour après l'envoi
                channelId: args.channelId,
                label: btn.label,
                style: btn.style,
                emoji: btn.emoji,
                action: buildButtonActionFromCreerEmbed(btn),
                createdAt: new Date().toISOString(),
              };
              await upsertPersistentButton(persistentBtn);

              // ==================================================================================
              // 🕵️‍♂️ AUTO-VALIDATION (READ-AFTER-WRITE) - DEMANDE UTILISATEUR
              // ==================================================================================
              // On vérifie immédiatement si le bouton est bien inscrit sur le disque
              const { getPersistentButton } = await import('../utils/distPersistence.js');
              const checkParams = await getPersistentButton(buttonId);

              if (!checkParams) {
                throw new Error(
                  `⛔ CRITIQUE: Le bouton '${btn.label}' a été créé mais la persistance a échoué lors de la vérification. Le fichier JSON est peut-être verrouillé.`
                );
              }
              Logger.info(`[EMBEDS] ✅ Persistance vérifiée et validée pour ${buttonId}`);
              // ==================================================================================

              Logger.info(`[EMBEDS] 🔒 Bouton persistant créé: ${buttonId} → ${btn.label}`);
            }

            // Bouton STANDARD → Sauvegarder dans l'ancien système (compatibilité)
            if (!btn.persistent) {
              const buttonToSave = {
                id: buttonId,
                messageId: '', // Sera mis à jour après l'envoi du message
                channelId: args.channelId,
                label: btn.label,
                action: {
                  type: btn.action,
                  data: {
                    value: btn.value,
                    emoji: btn.emoji,
                    // Inclure customData pour les boutons custom
                    ...btn.customData,
                  },
                },
                createdAt: new Date(),
              };
              buttonsMap.set(buttonId, buttonToSave);
            }
          }

          // Sauvegarder les boutons standards dans l'ancien système
          if (buttonsMap.size > 0) {
            await saveCustomButtons(buttonsMap);
          }

          // Rafraîchir le cache du gestionnaire d'interactions
          await interactionHandler.refreshButtons();

          const persistentCount = args.buttons.filter(b => b.persistent).length;
          const standardCount = args.buttons.length - persistentCount;
          Logger.info(
            `[EMBEDS] ${args.buttons.length} bouton(s) créé(s): ${persistentCount} persistant(s), ${standardCount} standard(s)`
          );

          components.push(row);
        }

        // GESTION DES SELECT MENUS (y compris persistants)
        if (args.selectMenus && args.selectMenus.length > 0) {
          for (let menuIndex = 0; menuIndex < args.selectMenus.length; menuIndex++) {
            const menu = args.selectMenus[menuIndex];
            // 1. Si custom_id fourni → utilise l'ID fixe personnalisé (OBLIGATOIRE)
            // 2. Si persistant: pm_<messageId>_<index>
            // 3. Si standard: embedv2_menu_<embedId>_<action>_<timestamp>_<random>
            const menuId = menu.custom_id
              ? menu.custom_id // ID personnalisé fixe (OBLIGATOIRE)
              : menu.persistent
                ? `pm_TEMP_${menuIndex}_${Date.now()}`
                : `embedv2_menu_${embedId}_${menu.action}_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;

            // Créer le menu selon le type
            let selectMenu: any;

            if (menu.type === 'string') {
              selectMenu = new StringSelectMenuBuilder()
                .setCustomId(menuId)
                .setPlaceholder(menu.placeholder || 'Sélectionnez une option')
                .setMinValues(menu.minValues ?? 1)
                .setMaxValues(menu.maxValues ?? 1);

              // Ajouter les options si fournies
              if (menu.options && menu.options.length > 0) {
                menu.options.forEach(opt => {
                  const option = new StringSelectMenuOptionBuilder()
                    .setLabel(opt.label)
                    .setValue(opt.value);

                  if (opt.description) option.setDescription(opt.description);
                  if (opt.emoji) option.setEmoji(opt.emoji);

                  (selectMenu as StringSelectMenuBuilder).addOptions(option);
                });
              }
            } else {
              // Pour les autres types (user, role, channel, mentionable)
              // Note: nécessiterait des imports supplémentaires et builders spécifiques
              selectMenu = new StringSelectMenuBuilder()
                .setCustomId(menuId)
                .setPlaceholder(menu.placeholder || 'Sélectionnez')
                .setMinValues(menu.minValues ?? 1)
                .setMaxValues(menu.maxValues ?? 1);
            }

            const menuRow = new ActionRowBuilder<any>().addComponents(selectMenu);
            components.push(menuRow);

            // 🔒 MENU PERSISTANT → Sauvegarder dans dist/data/
            if (menu.persistent) {
              const persistentMenu: PersistentSelectMenu = {
                id: menuId,
                messageId: '', // Sera mis à jour après l'envoi
                channelId: args.channelId,
                type: menu.type,
                placeholder: menu.placeholder,
                minValues: menu.minValues,
                maxValues: menu.maxValues,
                options: menu.options as any,
                action: buildMenuActionFromCreerEmbed(menu),
                createdAt: new Date().toISOString(),
              };
              await upsertPersistentMenu(persistentMenu);
              Logger.info(`[EMBEDS] 🔒 Menu persistant créé: ${menuId} → ${menu.action}`);
            }
          }

          const menuPersistentCount = args.selectMenus.filter(m => m.persistent).length;
          const menuStandardCount = args.selectMenus.length - menuPersistentCount;
          Logger.info(
            `[EMBEDS] ${args.selectMenus.length} menu(s) créé(s): ${menuPersistentCount} persistant(s), ${menuStandardCount} standard(s)`
          );
        }

        if (args.adaptiveLinks && args.adaptiveLinks.length > 0) {
          const linkRow = new ActionRowBuilder<ButtonBuilder>();

          args.adaptiveLinks.slice(0, 5).forEach(link => {
            const button = new ButtonBuilder()
              .setLabel(link.label)
              .setStyle(ButtonStyle.Link)
              .setURL(link.url);

            if (link.userSpecific) {
              button.setURL(link.url + '?user=USER_ID');
            }

            linkRow.addComponents(button);
          });

          if (linkRow.components.length > 0) {
            components.push(linkRow);
          }
        }

        // Préparer les fichiers attachment si des SVG ont été convertis
        const attachmentFiles =
          attachmentsToUpload.size > 0
            ? Array.from(attachmentsToUpload.entries()).map(([name, path]) => ({
                attachment: path,
                name: name,
              }))
            : undefined;

        const message = await channel.send({
          content: args.content,
          embeds: [embed],
          components: components.length > 0 ? components : undefined,
          files: attachmentFiles,
        });

        Logger.info(`[EMBEDS] Message envoyé avec ID: ${message.id}`);

        // Mettre à jour les messageId des boutons embed
        if (args.buttons && args.buttons.length > 0) {
          Logger.info(`[EMBEDS] Mise à jour des messageId pour ${args.buttons.length} bouton(s)`);

          // Charger les boutons depuis la persistance
          const buttonsMap = await loadCustomButtons();

          // Mettre à jour le messageId pour chaque bouton créé
          for (const btn of args.buttons) {
            // Récupérer l'ID du bouton (soit custom_id, soit l'ID généré)
            const buttonId = btn.custom_id || buttonIds[args.buttons.indexOf(btn)];
            if (buttonId) {
              const buttonData = buttonsMap.get(buttonId);
              if (buttonData) {
                buttonData.messageId = message.id;
                buttonsMap.set(buttonId, buttonData);
                Logger.info(`[EMBEDS] messageId mis à jour pour ${buttonId} -> ${message.id}`);
              } else {
                Logger.error(`[EMBEDS] ERREUR: Bouton ${buttonId} non trouvé dans la persistance!`);
              }
            }
          }

          // Sauvegarder les modifications
          await saveCustomButtons(buttonsMap);
          await interactionHandler.refreshButtons();
          Logger.info(`[EMBEDS] Sauvegarde finalisée`);
        }

        // Mettre à jour les messageId des menus persistants
        if (args.selectMenus && args.selectMenus.length > 0) {
          Logger.info(
            `[EMBEDS] Mise à jour des messageId pour ${args.selectMenus.length} menu(s) persistant(s)`
          );

          const { loadPersistentMenus, savePersistentMenus, upsertPersistentMenu } =
            await import('../utils/distPersistence.js');

          // Charger tous les menus persistants
          const allMenus = await loadPersistentMenus();

          // Trouver et mettre à jour les menus avec TEMP dans leur ID
          for (const [menuId, menuData] of allMenus.entries()) {
            if (menuId.includes('TEMP_') && menuData.channelId === args.channelId) {
              const newMenuId = menuId.replace('TEMP_', message.id + '_');
              menuData.id = newMenuId;
              menuData.messageId = message.id;
              await upsertPersistentMenu(menuData);

              // Supprimer l'ancienne entrée avec TEMP
              allMenus.delete(menuId);

              Logger.info(`[EMBEDS] Menu persistant mis à jour: ${menuId} → ${newMenuId}`);
            }
          }
        }

        if (args.autoUpdate?.enabled) {
          autoUpdateEmbeds.set(embedId, {
            messageId: message.id,
            channelId: args.channelId,
            embedData: args,
            interval: args.autoUpdate.interval || 60,
            lastUpdate: Date.now(),
            source: args.autoUpdate.source,
            updateCount: 0,
          });
        }

        if (args.enableAnalytics) {
          embedAnalytics.set(embedId, {
            views: 0,
            clicks: 0,
            lastInteraction: Date.now(),
            reactions: new Map(),
          });
        }

        let finalMessage = `✅ Embed créé | ID: ${message.id} | EmbedId: ${embedId}`;
        if (args.autoUpdate?.enabled) finalMessage += ' | Auto-update: ON';
        if (args.saveAsTemplate) finalMessage += ` | Template: ${args.saveAsTemplate}`;

        // Ajouter les warnings s'il y en a
        if (warnings.length > 0) {
          finalMessage += `\n\n⚠️ AVERTISSEMENTS:\n${warnings.join('\n\n')}`;
        }

        return finalMessage;
      } catch (error: any) {
        // 🔍 DEBUG: Log full error details for troubleshooting
        Logger.error(`❌ [creer_embed]`, error.message);
        if (error.code) Logger.error(`[creer_embed] Discord API Code:`, error.code);
        if (error.rawError)
          Logger.error(`[creer_embed] Raw Error:`, JSON.stringify(error.rawError));
        if (error.errors) Logger.error(`[creer_embed] Errors:`, JSON.stringify(error.errors));
        return `❌ Erreur: ${error.message}${error.code ? ` (Code: ${error.code})` : ''}`;
      }
    },
  });

  // 2. Get Embed Analytics
  server.addTool({
    name: 'get_embed_analytics',
    description: "Obtenir les analytics d'un embed spécifique",
    parameters: z.object({
      embedId: z.string().describe('ID du message embed'),
    }),
    execute: async args => {
      try {
        const report = generateAnalyticsReport(args.embedId);
        return report;
      } catch (error: any) {
        return `❌ Erreur: ${error.message}`;
      }
    },
  });

  // 3. List Auto Update Embeds
  server.addTool({
    name: 'list_auto_update_embeds',
    description: 'Lister tous les embeds avec auto-update actif',
    parameters: z.object({}),
    execute: async () => {
      try {
        const embeds = Array.from(autoUpdateEmbeds.entries()).map(([id, info]) => {
          const timeSinceUpdate = Date.now() - info.lastUpdate;
          const nextUpdateIn = Math.max(0, info.interval * 1000 - timeSinceUpdate);
          return `• ${id}
  📅 Créé: ${new Date(info.lastUpdate).toLocaleString('fr-FR')}
  🔄 Intervalle: ${info.interval}s
  ⏭️ Prochaine MAJ: ${Math.ceil(nextUpdateIn / 1000)}s
  📊 MAJ effectuées: ${info.updateCount}
  💬 Canal: ${info.channelId}`;
        });

        if (embeds.length === 0) {
          return 'ℹ️ Aucun embed avec auto-update actif';
        }

        return `🔄 **${embeds.length} embed(s) avec auto-update:**\n\n${embeds.join('\n\n')}`;
      } catch (error: any) {
        return `❌ Erreur: ${error.message}`;
      }
    },
  });

  // 4. Stop Embed Auto Update
  server.addTool({
    name: 'stop_embed_auto_update',
    description: "Arrêter l'auto-update d'un embed",
    parameters: z.object({
      embedId: z.string().describe('ID du message embed'),
    }),
    execute: async args => {
      try {
        if (autoUpdateEmbeds.has(args.embedId)) {
          autoUpdateEmbeds.delete(args.embedId);
          return `✅ Auto-update désactivé pour l'embed ${args.embedId}`;
        } else {
          return `ℹ️ Aucun auto-update trouvé pour l'embed ${args.embedId}`;
        }
      } catch (error: any) {
        return `❌ Erreur: ${error.message}`;
      }
    },
  });

  Logger.info('[EMBEDS] === FIN ENREGISTREMENT DES OUTILS EMBEDS ===');
}
