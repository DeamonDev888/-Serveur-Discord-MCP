import { RPGManager } from './rpgManager.js';
import { loadRPGState, saveRPGState } from './rpgPersistence.js';
import { DiscordBridge, registerButtonFunction } from '../discord-bridge.js';
import Logger from './logger.js';
import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';

/**
 * Script de déploiement du RPG
 * Canal cible: 1443768838587154563
 */
export async function deployRPG(token: string) {
    Logger.info('🚀 Déploiement du RPG "Le Donjon de l\'Antigravité"...');
    
    const bridge = DiscordBridge.getInstance(token);
    const client = await bridge.getClient();
    const channelId = '1443768838587154563';
    
    const channel = await client.channels.fetch(channelId) as any;
    if (!channel || !channel.send) {
        throw new Error('Canal RPG introuvable ou inaccessible.');
    }

    const manager = RPGManager.getInstance();
    const state = await manager.getGameState();
    
    // 1. Créer l'interface initiale
    const embed = manager.createMainEmbed(state);
    const components = manager.createActionButtons(state);
    
    const message = await channel.send({
        content: '🎭 **Le Jeu de Rôle commence...**',
        embeds: [embed],
        components: components
    });
    
    Logger.info(`✅ Message RPG envoyé: ${message.id}`);

    // 2. Enregistrer les fonctions de boutons (le Bridge les appellera lors du clic)
    const buttonIds = ['rpg_explore', 'rpg_rest', 'rpg_stats', 'rpg_attack', 'rpg_skill', 'rpg_flee', 'rpg_leaderboard'];
    
    const gameLogic = async (interaction: any) => {
        try {
            const manager = RPGManager.getInstance();
            const state = await manager.getGameState();
            
            const success = await manager.handleAction(interaction, state);
            
            if (success) {
                const nextEmbed = manager.createMainEmbed(state);
                const nextButtons = manager.createActionButtons(state);
                await interaction.update({ embeds: [nextEmbed], components: nextButtons });
            }
        } catch (e) {
            Logger.error('RPG Error runtime:', e);
        }
    };

    buttonIds.forEach(id => registerButtonFunction(id, gameLogic));
    
    return `RPG Déployé avec succès ! Message ID: ${message.id}`;
}
