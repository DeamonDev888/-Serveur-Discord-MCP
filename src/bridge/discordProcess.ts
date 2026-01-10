import Logger from '../utils/logger.js';
import { Client, GatewayIntentBits } from 'discord.js';
import { config } from 'dotenv';

// Charger les variables d'environnement
config({ path: './.env' });

interface BridgeMessage {
  type: 'mcp_to_discord' | 'discord_to_mcp';
  id: string;
  data: any;
  timestamp: number;
}

// Client Discord
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildPresences,
    GatewayIntentBits.GuildMessageReactions,
  ],
});

// Gestionnaire de communication
const handleCommand = async (command: any): Promise<void> => {
  try {
    switch (command.action) {
      case 'connect':
        await client.login(command.token);
        Logger.info('✅ Bot Discord connecté avec succès');

        // Envoyer confirmation au MCP
        process.stdout.write(
          JSON.stringify({
            type: 'discord_to_mcp',
            id: 'connect_response',
            data: { success: true, message: 'Bot connecté' },
            timestamp: Date.now(),
          }) + '\n'
        );
        break;

      case 'send_message':
        await sendMessage(command.args.channelId, command.args.content);
        break;

      case 'create_embed':
        await createEmbed(command.args);
        break;

      case 'read_messages':
        await readMessages(command.args);
        break;

      case 'list_members':
        await listMembers(command.args);
        break;

      case 'get_server_info':
        await getServerInfo(command.args);
        break;

      case 'add_reaction':
        await addReaction(command.args);
        break;

      // Gestion des sondages
      case 'update_poll_message':
        await updatePollMessage(command);
        break;

      case 'end_poll':
        await endPollMessage(command);
        break;

      case 'show_poll_results':
        await showPollResultsMessage(command);
        break;

      default:
        throw new Error(`Commande non reconnue: ${command.action}`);
    }

    // Envoyer confirmation de succès
    if (command.requestId) {
      process.stdout.write(
        JSON.stringify({
          type: 'discord_to_mcp',
          id: 'response',
          data: {
            success: true,
            requestId: command.requestId,
            message: 'Commande exécutée avec succès',
          },
          timestamp: Date.now(),
        }) + '\n'
      );
    }
  } catch (error) {
    Logger.error("❌ Erreur lors de l'exécution de la commande:", error);

    // Envoyer l'erreur au MCP
    if (command.requestId) {
      process.stdout.write(
        JSON.stringify({
          type: 'discord_to_mcp',
          id: 'error',
          data: {
            success: false,
            requestId: command.requestId,
            error: error instanceof Error ? error.message : String(error),
          },
          timestamp: Date.now(),
        }) + '\n'
      );
    }
  }
};

// Fonctions Discord
async function sendMessage(channelId: string, content: string): Promise<void> {
  const channel = await client.channels.fetch(channelId);
  if (!channel || !('send' in channel)) {
    throw new Error('Canal invalide ou permissions insuffisantes');
  }
  await channel.send(content);
}

async function createEmbed(args: any): Promise<void> {
  const { channelId, title, description, color } = args;
  const channel = await client.channels.fetch(channelId);
  if (!channel || !('send' in channel)) {
    throw new Error('Canal invalide ou permissions insuffisantes');
  }

  const { EmbedBuilder } = await import('discord.js');
  const embed = new EmbedBuilder();
  if (title) embed.setTitle(title);
  if (description) embed.setDescription(description);
  if (color) embed.setColor(color);

  await channel.send({ embeds: [embed] });
}

async function readMessages(args: any): Promise<void> {
  const { channelId, limit = 10 } = args;
  const channel = await client.channels.fetch(channelId);
  if (!channel || !('messages' in channel)) {
    throw new Error('Canal invalide ou permissions insuffisantes');
  }

  const messages = await channel.messages.fetch({ limit });

  Logger.info(`# 📜 Messages récents (${messages.size})`);
  messages.forEach((msg, index) => {
    Logger.info(
      `${index + 1}. **${msg.author.username}** - <t:${Math.floor(msg.createdTimestamp / 1000)}:R>`
    );
    Logger.info(`   ${msg.content}\n`);
  });

  Logger.info(`Messages lus du canal ${channelId}: ${messages.size} messages`);
}

async function listMembers(args: any): Promise<void> {
  const { guildId, limit = 20 } = args;
  const guild = await client.guilds.fetch(guildId || client.guilds.cache.first()?.id);
  if (!guild) {
    throw new Error('Serveur non trouvé');
  }

  const members = await guild.members.fetch({ limit });
  Logger.info(`Membres listés pour le serveur ${guild.name}: ${members.size} membres`);
}

async function getServerInfo(args: any): Promise<void> {
  const guild = await client.guilds.fetch(args.guildId || client.guilds.cache.first()?.id);
  if (!guild) {
    throw new Error('Serveur non trouvé');
  }

  Logger.info(`Informations du serveur ${guild.name} - ${guild.memberCount} membres`);
}

async function addReaction(args: any): Promise<void> {
  const { channelId, messageId, emoji } = args;
  const channel = await client.channels.fetch(channelId);
  if (!channel || !('messages' in channel)) {
    throw new Error('Canal invalide ou permissions insuffisantes');
  }

  const message = await channel.messages.fetch(messageId);
  await message.react(emoji);
  Logger.info(`Réaction ${emoji} ajoutée au message ${messageId}`);
}

// ===============================
// GESTION DES SONDAGES
// ===============================

// Mettre à jour le message du sondage après un vote
async function updatePollMessage(command: any): Promise<void> {
  const { channelId, messageId, poll } = command;

  const channel = await client.channels.fetch(channelId);
  if (!channel || !('messages' in channel)) {
    throw new Error('Canal invalide ou permissions insuffisantes');
  }

  const message = await channel.messages.fetch(messageId);

  // Créer l'embed mis à jour
  const { EmbedBuilder } = await import('discord.js');
  const embed = new EmbedBuilder()
    .setTitle('🗳️ Sondage')
    .setDescription(`**${poll.question}**\n\n🗳️ Cliquez sur les boutons pour voter !`)
    .setColor(0x5865f2)
    .addFields(
      {
        name: '📊 Options',
        value: poll.options
          .map(
            (opt: any, i: number) =>
              `${['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'][i] || '📍'} **${opt.text}**\n   └─ ${opt.votes} vote(s) (${opt.percentage.toFixed(1)}%)`
          )
          .join('\n\n'),
        inline: false,
      },
      {
        name: '📈 Statistiques',
        value: `**Total:** ${poll.totalVotes} vote(s)\n**Statut:** ${poll.ended ? '✅ Terminé' : '⏳ En cours'}`,
        inline: false,
      }
    )
    .setTimestamp();

  await message.edit({ embeds: [embed] });
  Logger.info(`✅ Message sondage mis à jour (${poll.totalVotes} votes)`);
}

// Terminer un sondage
async function endPollMessage(command: any): Promise<void> {
  const { channelId, messageId, poll, winner } = command;

  const channel = await client.channels.fetch(channelId);
  if (!channel || !('messages' in channel)) {
    throw new Error('Canal invalide ou permissions insuffisantes');
  }

  const message = await channel.messages.fetch(messageId);

  // Créer l'embed de fin
  const { EmbedBuilder } = await import('discord.js');
  const embed = new EmbedBuilder()
    .setTitle('🏁 Sondage Terminé')
    .setDescription(`**${poll.question}**\n\n✅ Le sondage est maintenant fermé.`)
    .setColor(0x00ff00)
    .addFields(
      {
        name: '🏆 Résultat',
        value: `**Gagnant:** ${winner}`,
        inline: false,
      },
      {
        name: '📊 Résultats détaillés',
        value: poll.options
          .map(
            (opt: any, i: number) =>
              `${['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'][i] || '📍'} **${opt.text}**\n   └─ ${opt.votes} vote(s) (${opt.percentage.toFixed(1)}%)`
          )
          .join('\n\n'),
        inline: false,
      },
      {
        name: '📈 Statistiques finales',
        value: `**Total:** ${poll.totalVotes} vote(s)`,
        inline: false,
      }
    )
    .setTimestamp();

  await message.edit({ embeds: [embed], components: [] });
  Logger.info(`✅ Sondage terminé. Gagnant: ${winner}`);
}

// Afficher les résultats d'un sondage
async function showPollResultsMessage(command: any): Promise<void> {
  const { channelId, poll } = command;

  const channel = await client.channels.fetch(channelId);
  if (!channel || !('send' in channel)) {
    throw new Error('Canal invalide ou permissions insuffisantes');
  }

  // Créer l'embed des résultats
  const { EmbedBuilder } = await import('discord.js');
  const winner = poll.options.reduce((prev: any, current: any) =>
    prev.votes > current.votes ? prev : current
  );

  const embed = new EmbedBuilder()
    .setTitle('📊 Résultats du Sondage')
    .setDescription(`**${poll.question}**`)
    .setColor(0x5865f2)
    .addFields(
      {
        name: '🏆 Leader',
        value: winner.votes > 0 ? winner.text : 'Aucun vote',
        inline: false,
      },
      {
        name: '📊 Résultats',
        value: poll.options
          .map((opt: any, i: number) => {
            const bar =
              '█'.repeat(Math.round(opt.percentage / 10)) +
              '░'.repeat(10 - Math.round(opt.percentage / 10));
            const mark = opt.text === winner.text && opt.votes > 0 ? ' 👑' : '';
            return `${['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'][i] || '📍'} **${opt.text}**${mark}\n   ${bar} ${opt.votes} vote(s) (${opt.percentage.toFixed(1)}%)`;
          })
          .join('\n\n'),
        inline: false,
      },
      {
        name: '📈 Statistiques',
        value: `**Total:** ${poll.totalVotes} vote(s)\n**Statut:** ${poll.ended ? '✅ Terminé' : '⏳ En cours'}`,
        inline: false,
      }
    )
    .setTimestamp();

  await channel.send({ embeds: [embed] });
  Logger.info(`✅ Résultats envoyés pour le sondage ${poll.id}`);
}

// Lecteur stdin pour les commandes du MCP
process.stdin.setEncoding('utf8');
process.stdin.on('data', data => {
  const lines = data.toString().trim().split('\n');
  lines.forEach(line => {
    if (line.trim()) {
      try {
        const message: BridgeMessage = JSON.parse(line);
        if (message.type === 'mcp_to_discord') {
          handleCommand(message.data);
        }
      } catch (error) {
        Logger.error('Erreur de parsing du message MCP:', error);
      }
    }
  });
});

// Gestion du client Discord
client.on('clientReady', () => {
  Logger.info(`Bot Discord prêt: ${client.user?.tag}`);
});

client.on('messageCreate', message => {
  if (message.author.bot) return;

  // Envoyer les messages au MCP pour traitement
  process.stdout.write(
    JSON.stringify({
      type: 'discord_to_mcp',
      id: 'new_message',
      data: {
        channelId: message.channelId,
        messageId: message.id,
        content: message.content,
        author: {
          id: message.author.id,
          username: message.author.username,
          discriminator: message.author.discriminator,
        },
        timestamp: message.createdTimestamp,
      },
    }) + '\n'
  );
});

// ===============================
// EVENT LISTENERS - NOUVELLES FONCTIONNALITÉS
// ===============================

// Gestion des interactions (boutons, menus, modals)
client.on('interactionCreate', async interaction => {
  try {
    if (interaction.isButton()) {
      await handleButtonInteraction(interaction);
    } else if (interaction.isStringSelectMenu()) {
      await handleSelectMenuInteraction(interaction);
    } else if (interaction.isModalSubmit()) {
      await handleModalSubmit(interaction);
    }
  } catch (error) {
    Logger.error("Erreur lors du traitement de l'interaction:", error);

    const replyable = interaction as any;
    if (replyable.replied || replyable.deferred) {
      await replyable.followUp({
        content: '❌ Une erreur est survenue lors du traitement de votre action.',
        ephemeral: true,
      });
    } else {
      await replyable.reply({
        content: '❌ Une erreur est survenue lors du traitement de votre action.',
        ephemeral: true,
      });
    }
  }
});

// Gestionnaire des clics de boutons
async function handleButtonInteraction(interaction: any) {
  const customId = interaction.customId;

  // Sondages
  if (customId.startsWith('poll_')) {
    await handlePollButton(interaction);
    return;
  }

  // Boutons personnalisés
  if (customId.startsWith('custom_button_')) {
    await handleCustomButton(interaction);
    return;
  }

  // Giveaways
  if (customId.startsWith('giveaway_')) {
    await handleGiveawayButton(interaction);
    return;
  }

  Logger.info(`Bouton inconnu cliqué: ${customId}`);
}

// Gestionnaire des sélections de menus
async function handleSelectMenuInteraction(interaction: any) {
  const customId = interaction.customId;
  const values = interaction.values;

  Logger.info(`Menu sélectionné: ${customId} avec valeurs:`, values);

  // Envoyer au MCP pour traitement
  process.stdout.write(
    JSON.stringify({
      type: 'discord_to_mcp',
      id: 'select_menu',
      data: {
        customId,
        values,
        user: {
          id: interaction.user.id,
          username: interaction.user.username,
        },
        channelId: interaction.channelId,
        messageId: interaction.message.id,
      },
    }) + '\n'
  );
}

// Gestionnaire des soumissions de modals
async function handleModalSubmit(interaction: any) {
  const customId = interaction.customId;
  const fields: any = {};

  // Extraire tous les champs du modal
  for (const component of interaction.components) {
    if (component.type === 1) {
      // ActionRow
      for (const field of component.components) {
        if (field.type === 4) {
          // TextInput
          fields[field.customId] = field.value;
        }
      }
    }
  }

  Logger.info(`Modal soumis: ${customId}`, fields);

  // Envoyer au MCP pour traitement
  process.stdout.write(
    JSON.stringify({
      type: 'discord_to_mcp',
      id: 'modal_submit',
      data: {
        customId,
        fields,
        user: {
          id: interaction.user.id,
          username: interaction.user.username,
        },
        channelId: interaction.channelId,
        messageId: interaction.message.id,
      },
    }) + '\n'
  );
}

// Gestionnaire spécifique pour les sondages
async function handlePollButton(interaction: any) {
  const customId = interaction.customId;
  const parts = customId.split('_');
  const pollId = parts[1];
  const action = parts[2];

  Logger.info(`Action sondage: ${action} pour le sondage ${pollId}`);

  // Envoyer au MCP pour traitement
  process.stdout.write(
    JSON.stringify({
      type: 'discord_to_mcp',
      id: 'poll_interaction',
      data: {
        pollId,
        action,
        user: {
          id: interaction.user.id,
          username: interaction.user.username,
        },
        channelId: interaction.channelId,
        messageId: interaction.message.id,
      },
    }) + '\n'
  );
}

// Gestionnaire pour les boutons personnalisés
async function handleCustomButton(interaction: any) {
  const customId = interaction.customId;

  Logger.info(`Bouton personnalisé cliqué: ${customId}`);

  // Envoyer au MCP pour traitement
  process.stdout.write(
    JSON.stringify({
      type: 'discord_to_mcp',
      id: 'custom_button_interaction',
      data: {
        customId,
        user: {
          id: interaction.user.id,
          username: interaction.user.username,
        },
        channelId: interaction.channelId,
        messageId: interaction.message.id,
      },
    }) + '\n'
  );
}

// Gestionnaire pour les giveaways
async function handleGiveawayButton(interaction: any) {
  const customId = interaction.customId;

  Logger.info(`Action giveaway: ${customId}`);

  // Envoyer au MCP pour traitement
  process.stdout.write(
    JSON.stringify({
      type: 'discord_to_mcp',
      id: 'giveaway_interaction',
      data: {
        customId,
        user: {
          id: interaction.user.id,
          username: interaction.user.username,
        },
        channelId: interaction.channelId,
        messageId: interaction.message.id,
      },
    }) + '\n'
  );
}

// ===============================
// EVENT LISTENERS POUR LA MODÉRATION
// ===============================

// Nouveau membre
client.on('guildMemberAdd', async member => {
  Logger.info(`Nouveau membre: ${member.user.username} sur ${member.guild.name}`);

  // Envoyer au MCP
  process.stdout.write(
    JSON.stringify({
      type: 'discord_to_mcp',
      id: 'guild_member_add',
      data: {
        member: {
          id: member.id,
          username: member.user.username,
          discriminator: member.user.discriminator,
        },
        guildId: member.guild.id,
        guildName: member.guild.name,
        joinedAt: member.joinedAt?.toISOString(),
      },
    }) + '\n'
  );
});

// Membre parti
client.on('guildMemberRemove', async member => {
  Logger.info(`Membre parti: ${member.user.username} de ${member.guild.name}`);

  // Envoyer au MCP
  process.stdout.write(
    JSON.stringify({
      type: 'discord_to_mcp',
      id: 'guild_member_remove',
      data: {
        member: {
          id: member.id,
          username: member.user.username,
          discriminator: member.user.discriminator,
        },
        guildId: member.guild.id,
        guildName: member.guild.name,
      },
    }) + '\n'
  );
});

// Message supprimé
client.on('messageDelete', async message => {
  if (message.author?.bot) return;

  Logger.info(`Message supprimé dans ${message.channelId}`);

  // Envoyer au MCP
  process.stdout.write(
    JSON.stringify({
      type: 'discord_to_mcp',
      id: 'message_delete',
      data: {
        messageId: message.id,
        channelId: message.channelId,
        content: message.content,
        author: {
          id: message.author.id,
          username: message.author.username,
        },
        createdAt: message.createdAt.toISOString(),
      },
    }) + '\n'
  );
});

// Message modifié
client.on('messageUpdate', async (oldMessage, newMessage) => {
  if (newMessage.author?.bot) return;
  if (oldMessage.content === newMessage.content) return;

  Logger.info(`Message modifié dans ${newMessage.channelId}`);

  // Envoyer au MCP
  process.stdout.write(
    JSON.stringify({
      type: 'discord_to_mcp',
      id: 'message_update',
      data: {
        messageId: newMessage.id,
        channelId: newMessage.channelId,
        oldContent: oldMessage.content,
        newContent: newMessage.content,
        author: {
          id: newMessage.author.id,
          username: newMessage.author.username,
        },
      },
    }) + '\n'
  );
});

// Canal créé
client.on('channelCreate', async channel => {
  const channelName = (channel as any).name || 'Unknown';
  const guildName = (channel as any).guild?.name || 'Unknown';
  Logger.info(`Canal créé: ${channelName} (${channel.type})`);

  // Envoyer au MCP
  process.stdout.write(
    JSON.stringify({
      type: 'discord_to_mcp',
      id: 'channel_create',
      data: {
        channelId: channel.id,
        channelName: channelName,
        channelType: channel.type,
        guildId: (channel as any).guild?.id,
        guildName: guildName,
      },
    }) + '\n'
  );
});

// Canal supprimé
client.on('channelDelete', async channel => {
  const channelName = (channel as any).name || 'Unknown';
  const guildName = (channel as any).guild?.name || 'Unknown';
  Logger.info(`Canal supprimé: ${channelName} (${channel.type})`);

  // Envoyer au MCP
  process.stdout.write(
    JSON.stringify({
      type: 'discord_to_mcp',
      id: 'channel_delete',
      data: {
        channelId: channel.id,
        channelName: channelName,
        channelType: channel.type,
        guildId: (channel as any).guild?.id,
        guildName: guildName,
      },
    }) + '\n'
  );
});

// Rôle créé
client.on('roleCreate', async role => {
  Logger.info(`Rôle créé: ${role.name}`);

  // Envoyer au MCP
  process.stdout.write(
    JSON.stringify({
      type: 'discord_to_mcp',
      id: 'role_create',
      data: {
        roleId: role.id,
        roleName: role.name,
        guildId: role.guild.id,
        guildName: role.guild.name,
        color: role.color,
        permissions: role.permissions.bitfield,
      },
    }) + '\n'
  );
});

// Rôle supprimé
client.on('roleDelete', async role => {
  Logger.info(`Rôle supprimé: ${role.name}`);

  // Envoyer au MCP
  process.stdout.write(
    JSON.stringify({
      type: 'discord_to_mcp',
      id: 'role_delete',
      data: {
        roleId: role.id,
        roleName: role.name,
        guildId: role.guild.id,
        guildName: role.guild.name,
      },
    }) + '\n'
  );
});

client.on('error', error => {
  Logger.error('Erreur client Discord:', error);
});

process.on('unhandledRejection', error => {
  Logger.error('Uncaught Promise Rejection:', error);
});

process.on('SIGINT', () => {
  Logger.info('\n🛑 Arrêt du processus Discord...');
  client.destroy();
  process.exit(0);
});

// Démarrage automatique
Logger.info('🔗 Processus Discord prêt à recevoir les commandes');

