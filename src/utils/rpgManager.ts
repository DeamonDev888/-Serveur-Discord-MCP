import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { loadRPGState, saveRPGState, getOrCreatePlayer, RPGState } from './rpgPersistence.js';
import Logger from './logger.js';

export class RPGManager {
  private static instance: RPGManager;
  private state: RPGState | null = null;

  private constructor() {}

  public static getInstance(): RPGManager {
    if (!RPGManager.instance) {
      RPGManager.instance = new RPGManager();
    }
    return RPGManager.instance;
  }

  public async getGameState(): Promise<RPGState> {
    if (!this.state) {
      this.state = await loadRPGState();
    }
    return this.state;
  }

  public async saveGameState(): Promise<void> {
    if (this.state) {
      await saveRPGState(this.state);
    }
  }

  public createMainEmbed(state: RPGState): any {
    const dungeon = state.dungeon;
    const logEntries = dungeon.log.slice(-6).join('\n');
    
    const embed = new EmbedBuilder()
      .setTitle(`🏰 Le Donjon de l'Antigravité - Étage ${dungeon.floor}`)
      .setColor(0x2f3136)
      .setDescription(`Vous explorez la salle n°**${dungeon.room}**. L'obscurité est profonde ici...`)
      .addFields(
        { name: '📜 Chroniques du Donjon', value: logEntries || 'Rien à signaler...' },
        { 
          name: '⚔️ Menace actuelle', 
          value: dungeon.enemy 
            ? `**${dungeon.enemy.name}** (PV: ${dungeon.enemy.hp}/${dungeon.enemy.maxHp})` 
            : 'Aucun ennemi en vue. Pour l\'instant...' 
        },
        {
          name: '🏆 Record de profondeur',
          value: `Étage **${dungeon.records.maxFloor}** par **${dungeon.records.topPlayer}**`,
          inline: false
        }
      )
      .setTimestamp()
      .setFooter({ text: 'Influencer le destin collectivement !' });

    if (dungeon.enemy) {
        embed.setThumbnail('https://i.imgur.com/k6wMvUn.png'); 
    } else {
        embed.setThumbnail('https://i.imgur.com/M6L5S6Y.png');
    }

    return embed;
  }

  public createActionButtons(state: RPGState): any[] {
    const dungeon = state.dungeon;
    const row = new ActionRowBuilder<ButtonBuilder>();

    if (dungeon.enemy) {
      row.addComponents(
        new ButtonBuilder()
          .setCustomId('rpg_attack')
          .setLabel('⚔️ Attaquer')
          .setStyle(ButtonStyle.Danger),
        new ButtonBuilder()
          .setCustomId('rpg_skill')
          .setLabel('✨ Compétence')
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId('rpg_flee')
          .setLabel('🏃 Fuir')
          .setStyle(ButtonStyle.Secondary)
      );
    } else {
      row.addComponents(
        new ButtonBuilder()
          .setCustomId('rpg_explore')
          .setLabel('🔦 Explorer')
          .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
          .setCustomId('rpg_rest')
          .setLabel('💤 Se reposer')
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId('rpg_stats')
          .setLabel('👤 Profil')
          .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
          .setCustomId('rpg_leaderboard')
          .setLabel('🏆 Top')
          .setStyle(ButtonStyle.Secondary)
      );
    }

    return [row];
  }

  public async handleAction(interaction: any, state: RPGState): Promise<boolean> {
    const player = getOrCreatePlayer(state, interaction.user.id, interaction.user.username);
    const action = interaction.customId;
    let updateEmbed = true;

    try {
      if (action === 'rpg_explore') {
        if (state.dungeon.enemy) {
            await interaction.reply({ content: "Un ennemi vous barre la route !", ephemeral: true });
            return false;
        }
        
        state.dungeon.room++;
        
        // Progression de l'étage
        if (state.dungeon.room > 5) {
            state.dungeon.floor++;
            state.dungeon.room = 1;
            state.dungeon.log.push(`✨ **Vous descendez à l'étage ${state.dungeon.floor} !** L'obscurité se fait plus dense...`);
            
            // Record update
            if (state.dungeon.floor > state.dungeon.records.maxFloor) {
                state.dungeon.records.maxFloor = state.dungeon.floor;
                state.dungeon.records.topPlayer = interaction.user.username;
                state.dungeon.log.push(`👑 **NOUVEAU RECORD PAR ${interaction.user.username.toUpperCase()} !**`);
            }
        }

        if (Math.random() > 0.5) {
          const enemies = ["Gobelin du Code", "Squelette Binaire", "Bug Maître", "Ombre Statique", "Liche de Glace"];
          const enemyName = enemies[Math.floor(Math.random() * enemies.length)];
          state.dungeon.enemy = {
            name: enemyName,
            hp: 15 + (state.dungeon.floor * 5),
            maxHp: 15 + (state.dungeon.floor * 5),
            level: state.dungeon.floor
          };
          state.dungeon.log.push(`⚠️ Un **${enemyName}** surgit des ténèbres !`);
        } else {
          const goldFound = Math.floor(Math.random() * 5) + 2;
          player.gold += goldFound;
          state.dungeon.log.push(`🔦 Salle ${state.dungeon.room} : Vous trouvez **${goldFound} po** dans un vieux coffre.`);
        }
      } 
      else if (action === 'rpg_attack') {
        if (!state.dungeon.enemy) {
            await interaction.reply({ content: "Rien à attaquer ici.", ephemeral: true });
            return false;
        }
        
        const d20 = Math.floor(Math.random() * 20) + 1;
        let damage = Math.floor(Math.random() * 6) + 2 + (player.level);
        
        if (d20 === 20) {
            damage *= 2;
            state.dungeon.log.push(`🎯 **CRITIQUE !** ${interaction.user.username} inflige **${damage}** dégâts !`);
        } else if (d20 === 1) {
            damage = 0;
            state.dungeon.log.push(`💨 **ÉCHEC !** ${interaction.user.username} rate son attaque !`);
        } else {
            state.dungeon.log.push(`⚔️ **${interaction.user.username}** inflige **${damage}** dégâts !`);
        }
        
        state.dungeon.enemy.hp -= damage;
        
        if (state.dungeon.enemy.hp <= 0) {
          const gold = 10 + (state.dungeon.floor * 2);
          const xp = 25;
          state.dungeon.log.push(`💀 Victoire ! Le **${state.dungeon.enemy.name}** est vaincu. (+${gold} po, +${xp} xp)`);
          player.gold += gold;
          player.xp += xp;
          state.dungeon.enemy = undefined;
          
          // Level up
          if (player.xp >= player.level * 50) {
            player.level++;
            player.maxHp += 10;
            player.hp = player.maxHp;
            state.dungeon.log.push(`🎊 **NIVEAU SUPÉRIEUR !** ${interaction.user.username} est maintenant niveau ${player.level} !`);
          }
        } else {
          // Contre-attaque
          const eDmg = Math.floor(Math.random() * 4) + state.dungeon.floor;
          player.hp -= eDmg;
          state.dungeon.log.push(`💥 ${state.dungeon.enemy.name} riposte : -${eDmg} PV.`);
          
          if (player.hp <= 0) {
              player.hp = 5; // Rez automatique pour le mini-game
              player.gold = Math.floor(player.gold / 2);
              state.dungeon.log.push(`📉 **K.O. !** ${interaction.user.username} s'écroule mais survit... (-50% d'or)`);
          }
        }
      }
      else if (action === 'rpg_skill') {
          if (!state.dungeon.enemy) {
              await interaction.reply({ content: "Aucun ennemi à cibler.", ephemeral: true });
              return false;
          }
          
          if (player.hp < 5) {
              await interaction.reply({ content: "Vous êtes trop fatigué pour utiliser une compétence !", ephemeral: true });
              return false;
          }
          
          player.hp -= 3;
          const heal = 8;
          player.hp = Math.min(player.maxHp, player.hp + heal);
          state.dungeon.log.push(`✨ ${interaction.user.username} utilise **Soin Magique** (+${heal} PV, -3 fatigue).`);
      }
      else if (action === 'rpg_flee') {
          if (!state.dungeon.enemy) {
              await interaction.reply({ content: "Rien à fuir...", ephemeral: true });
              return false;
          }
          
          if (Math.random() > 0.4) {
              state.dungeon.log.push(`🏃 ${interaction.user.username} prend la fuite !`);
              state.dungeon.enemy = undefined;
          } else {
              const eDmg = Math.floor(Math.random() * 5) + 2;
              player.hp -= eDmg;
              state.dungeon.log.push(`❌ Échec de la fuite ! ${state.dungeon.enemy.name} vous rattrape (-${eDmg} PV).`);
          }
      }
      else if (action === 'rpg_rest') {
          if (state.dungeon.enemy) {
              await interaction.reply({ content: "Impossible de se reposer au combat !", ephemeral: true });
              return false;
          }
          const heal = Math.floor(player.maxHp * 0.3);
          player.hp = Math.min(player.maxHp, player.hp + heal);
          state.dungeon.log.push(`💤 ${interaction.user.username} se repose et récupère **${heal} PV**.`);
      }
      else if (action === 'rpg_stats') {
         updateEmbed = false;
         const statsEmbed = new EmbedBuilder()
           .setTitle(`👤 Profil de ${interaction.user.username}`)
           .setColor(0x00ff00)
           .setThumbnail(interaction.user.displayAvatarURL())
           .addFields(
             { name: 'Niveau', value: `Lv. ${player.level}`, inline: true },
             { name: 'Classe', value: player.class, inline: true },
             { name: 'Santé', value: `❤️ ${player.hp}/${player.maxHp}`, inline: true },
             { name: 'Fortune', value: `💰 ${player.gold} po`, inline: true },
             { name: 'Expérience', value: `✨ ${player.xp}/${player.level * 50}`, inline: true }
           );
         await interaction.reply({ embeds: [statsEmbed], ephemeral: true });
         return false;
      }
      else if (action === 'rpg_leaderboard') {
          updateEmbed = false;
          const players = Object.entries(state.players)
            .sort((a, b) => b[1].level - a[1].level || b[1].xp - a[1].xp)
            .slice(0, 10);
            
          const lbEmbed = new EmbedBuilder()
            .setTitle('🏆 Panthéon des Aventuriers')
            .setColor(0xFFD700)
            .setDescription(players.length > 0 
                ? players.map((p, i) => `${i + 1}. **${p[1].class}** (Lvl ${p[1].level}) - ${p[1].gold} po`).join('\n')
                : 'Personne n\'a encore osé s\'aventurer ici...')
            .setFooter({ text: `Record actuel: Étage ${state.dungeon.records.maxFloor} (${state.dungeon.records.topPlayer})` });
            
          await interaction.reply({ embeds: [lbEmbed], ephemeral: true });
          return false;
      }

      await saveRPGState(state);
      return true;

    } catch (err) {
      Logger.error("Erreur handleAction RPG:", err);
      return false;
    }
  }
}
