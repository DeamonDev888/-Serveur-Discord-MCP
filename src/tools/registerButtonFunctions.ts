/**
 * Outils MCP pour enregistrer des fonctions personnalisées sur les boutons
 */

import { z } from 'zod';
import type { FastMCP } from 'fastmcp';
import Logger from '../utils/logger.js';
import { registerButtonFunction } from '../discord-bridge.js';
import { addCustomButton, loadCustomButtons } from '../utils/buttonPersistence.js';
import * as fs from 'fs';
import * as path from 'path';

// ============================================================================
// ENREGISTREMENT DES OUTILS
// ============================================================================

export function registerButtonFunctionTools(server: FastMCP) {
  /**
   * Enregistrer une fonction pour un bouton existant
   */
  server.addTool({
    name: 'enregistrer_fonction_bouton',
    description: 'Enregistre une fonction personnalisée pour un bouton existant (par ID de bouton)',
    parameters: z.object({
      buttonId: z.string().describe("ID du bouton (customId)"),
      functionCode: z.string().describe("Code JavaScript à exécuter quand le bouton est cliqué"),
      functionName: z.string().optional().describe("Nom de la fonction (pour référence)"),
    }),
    execute: async (args) => {
      try {
        const { buttonId, functionCode, functionName } = args;

        Logger.info(`📝 Enregistrement fonction pour bouton: ${buttonId}`);

        // Créer la fonction personnalisée
        const customFunction = async (interaction: any, context: any) => {
          try {
            // Contexte disponible pour le code personnalisé
            const ctx = {
              interaction,
              channelId: context.channelId,
              messageId: context.messageId,
              user: context.user,
              buttonId: context.customId,
              client: interaction.client,
              // Fonctions utilitaires
              reply: async (content: string, ephemeral: boolean = true) => {
                if (!interaction.replied && !interaction.deferred) {
                  await interaction.reply({ content, ephemeral });
                }
              },
              update: async (data: any) => {
                if (!interaction.replied && !interaction.deferred) {
                  await interaction.update(data);
                }
              },
              deferReply: async (ephemeral: boolean = true) => {
                if (!interaction.deferred) {
                  await interaction.deferReply({ ephemeral });
                }
              },
              followUp: async (content: string, ephemeral: boolean = true) => {
                await interaction.followUp({ content, ephemeral });
              },
              // Envoyer un message dans le canal
              sendMessage: async (content: string) => {
                const channel = await interaction.client.channels.fetch(context.channelId);
                if (channel && 'send' in channel) {
                  await channel.send(content);
                }
              },
              // Récupérer le message original
              getMessage: async () => {
                const channel = await interaction.client.channels.fetch(context.channelId);
                if (channel && 'messages' in channel) {
                  return await channel.messages.fetch(context.messageId);
                }
              },
              // SAUVEGARDE DE VOTE/DONNÉES
              saveVote: async (voteType: string, details: string = '') => {
                 const { VoteManager } = await import('../utils/voteManager.js');
                 await VoteManager.saveVote(voteType, context.user, context.channelId, details);
              },
               getVoteCounts: async () => {
                   const { VoteManager } = await import('../utils/voteManager.js');
                   return await VoteManager.getVoteCounts();
               }

            };

            // Exécuter le code personnalisé avec accès au contexte
            const asyncFunction = new Function('ctx', `
              return (async () => {
                try {
                  ${functionCode}
                } catch (e) {
                  Logger.error('Erreur dans fonction bouton:', e);
                  await ctx.reply('❌ Erreur: ' + e.message, true);
                }
              })();
            `);

            await asyncFunction(ctx);
          } catch (error: any) {
            Logger.error(`❌ Erreur exécution fonction bouton ${buttonId}:`, error.message);
            if (!interaction.replied && !interaction.deferred) {
              await interaction.reply({
                content: `❌ Erreur: ${error.message}`,
                ephemeral: true
              });
            }
          }
        };

        // Enregistrer la fonction
        registerButtonFunction(buttonId, customFunction);

        // Mettre à jour la persistance
        const buttons = await loadCustomButtons();
        const existingButton = buttons.get(buttonId);
        if (existingButton) {
          existingButton.functionCode = functionCode;
          await addCustomButton(existingButton, buttons);
        } else {
          // Créer une nouvelle entrée
          await addCustomButton({
            id: buttonId,
            messageId: 'unknown',
            channelId: 'unknown',
            label: functionName || 'Custom Function',
            action: { type: 'custom', data: {} },
            functionCode,
            createdAt: new Date(),
          }, buttons);
        }

        return `✅ Fonction enregistrée pour le bouton \`${buttonId}\`
${functionName ? `📝 Nom: ${functionName}` : ''}

🔧 Variables disponibles dans le code:
- \`ctx.interaction\`: L'interaction Discord
- \`ctx.user\`: Utilisateur qui a cliqué
- \`ctx.channelId\`: ID du canal
- \`ctx.reply(content, ephemeral)\`: Répondre
- \`ctx.update(data)\`: Modifier le message
- \`ctx.sendMessage(content)\`: Envoyer un message
- \`ctx.getMessage()\`: Récupérer le message original
- \`ctx.saveVote(type, details)\`: Sauvegarder un vote dans votes_sentinel.csv

Exemple de code:
\`\`\`javascript
await ctx.saveVote('VALID', 'User comment');
await ctx.reply('Vote enregistré !');
\`\`\``;

      } catch (error: any) {
        Logger.error(`❌ [enregistrer_fonction_bouton]`, error.message);
        return `❌ Erreur: ${error.message}`;
      }
    },
  });

  /**
   * Lister toutes les fonctions de boutons enregistrées
   */
  server.addTool({
    name: 'lister_fonctions_boutons',
    description: 'Liste toutes les fonctions personnalisées enregistrées pour les boutons',
    parameters: z.object({}),
    execute: async () => {
      try {
        const { listButtonFunctions } = await import('../discord-bridge.js');
        const functions = listButtonFunctions();

        if (functions.length === 0) {
          return 'ℹ️ Aucune fonction de bouton enregistrée.';
        }

        return `📋 **${functions.length} fonction(s) de bouton enregistrée(s):**\n\n` +
          functions.map((fn, i) => `${i + 1}. \`${fn}\``).join('\n');

      } catch (error: any) {
        Logger.error(`❌ [lister_fonctions_boutons]`, error.message);
        return `❌ Erreur: ${error.message}`;
      }
    },
  });

  /**
   * Supprimer une fonction de bouton
   */
  server.addTool({
    name: 'supprimer_fonction_bouton',
    description: 'Supprime la fonction personnalisée d\'un bouton',
    parameters: z.object({
      buttonId: z.string().describe("ID du bouton"),
    }),
    execute: async (args) => {
      try {
        const { unregisterButtonFunction } = await import('../discord-bridge.js');
        const deleted = unregisterButtonFunction(args.buttonId);

        if (deleted) {
          return `✅ Fonction supprimée pour le bouton \`${args.buttonId}\``;
        } else {
          return `ℹ️ Aucune fonction trouvée pour le bouton \`${args.buttonId}\``;
        }

      } catch (error: any) {
        Logger.error(`❌ [supprimer_fonction_bouton]`, error.message);
        return `❌ Erreur: ${error.message}`;
      }
    },
  });

  /**
   * Attacher une fonction à un bouton embed existant
   */
  server.addTool({
    name: 'attacher_fonction_bouton_embed',
    description: 'Attache une fonction personnalisée à un bouton d\'embed existant',
    parameters: z.object({
      embedId: z.string().describe("ID de l'embed (retourné par creer_embed)"),
      buttonLabel: z.string().describe("Label du bouton cible"),
      functionCode: z.string().describe("Code JavaScript à exécuter"),
      functionName: z.string().optional().describe("Nom de la fonction"),
    }),
    execute: async (args) => {
      try {
        const { embedId, buttonLabel, functionCode, functionName } = args;

        Logger.info(`📝 Attachement fonction embed ${embedId} -> bouton "${buttonLabel}"`);

        // Le bouton doit avoir été créé avec creer_embed
        // On génère l'ID attendu pour ce bouton
        const possibleButtonId = `embedv2_${embedId}`;

        // Créer la fonction (même code que enregistrer_fonction_bouton)
        const customFunction = async (interaction: any, context: any) => {
          try {
            const ctx = {
              interaction,
              channelId: context.channelId,
              messageId: context.messageId,
              user: context.user,
              buttonId: context.customId,
              client: interaction.client,
              reply: async (content: string, ephemeral: boolean = true) => {
                if (!interaction.replied && !interaction.deferred) {
                  await interaction.reply({ content, ephemeral });
                }
              },
              update: async (data: any) => {
                if (!interaction.replied && !interaction.deferred) {
                  await interaction.update(data);
                }
              },
              deferReply: async (ephemeral: boolean = true) => {
                if (!interaction.deferred) {
                  await interaction.deferReply({ ephemeral });
                }
              },
              followUp: async (content: string, ephemeral: boolean = true) => {
                await interaction.followUp({ content, ephemeral });
              },
              sendMessage: async (content: string) => {
                const channel = await interaction.client.channels.fetch(context.channelId);
                if (channel && 'send' in channel) {
                  await channel.send(content);
                }
              },
              getMessage: async () => {
                const channel = await interaction.client.channels.fetch(context.channelId);
                if (channel && 'messages' in channel) {
                  return await channel.messages.fetch(context.messageId);
                }
              },
              // SAUVEGARDE DE VOTE/DONNÉES
              saveVote: async (voteType: string, details: string = '') => {
                 try {
                    const voteFile = path.join(process.cwd(), 'votes_sentinel.csv');
                    // Ensure file exists with header
                    if (!fs.existsSync(voteFile)) {
                        fs.writeFileSync(voteFile, 'timestamp,vote_type,user,user_id,channel_id,details\n');
                    }
                    const line = `${new Date().toISOString()},${voteType},${context.user.username},${context.user.id},${context.channelId},"${details}"\n`;
                    fs.appendFileSync(voteFile, line);
                    Logger.info(`🗳️ Vote enregistré: ${voteType} par ${context.user.username}`);
                 } catch (err: any) {
                    Logger.error('Echec sauvegarde vote:', err);
                 }
              }
            };

            const asyncFunction = new Function('ctx', `
              return (async () => {
                try {
                  ${functionCode}
                } catch (e) {
                  Logger.error('Erreur dans fonction bouton:', e);
                  await ctx.reply('❌ Erreur: ' + e.message, true);
                }
              })();
            `);

            await asyncFunction(ctx);
          } catch (error: any) {
            Logger.error(`❌ Erreur exécution fonction:`, error.message);
            if (!interaction.replied && !interaction.deferred) {
              await interaction.reply({
                content: `❌ Erreur: ${error.message}`,
                ephemeral: true
              });
            }
          }
        };

        // Enregistrer avec un pattern qui matchera tous les boutons embedv2_ de cet embed
        registerButtonFunction(possibleButtonId, customFunction);

        return `✅ Fonction attachée aux boutons de l'embed \`${embedId}\`
📝 Nom: ${functionName || 'Non défini'}
🎯 Bouton cible: "${buttonLabel}"

La fonction sera exécutée pour tous les boutons de cet embed.`;

      } catch (error: any) {
        Logger.error(`❌ [attacher_fonction_bouton_embed]`, error.message);
        return `❌ Erreur: ${error.message}`;
      }
    },
  });

  Logger.info('✅ Outils de fonctions de boutons enregistrés');
}
