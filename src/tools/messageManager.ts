import { z } from 'zod';
import {
  Message,
  TextChannel,
  DMChannel,
  NewsChannel,
  MessageReaction,
  User,
  GuildMember,
  Collection
} from 'discord.js';

// Schémas pour les opérations sur les messages
export const SendMessageSchema = z.object({
  channelId: z.string().describe('ID du canal où envoyer le message'),
  content: z.string().describe('Contenu du message'),
  embeds: z.array(z.any()).optional().describe('Embeds à inclure (optionnel)'),
  components: z.array(z.any()).optional().describe('Composants à inclure (optionnel)'),
  files: z.array(z.string()).optional().describe('Chemins des fichiers à attacher (optionnel)'),
  replyTo: z.string().optional().describe('ID du message auquel répondre (optionnel)'),
  mentionRepliedUser: z.boolean().optional().default(true).describe('Mentionner l\'utilisateur répondu')
});

export const EditMessageSchema = z.object({
  channelId: z.string().describe('ID du canal du message'),
  messageId: z.string().describe('ID du message à modifier'),
  content: z.string().optional().describe('Nouveau contenu du message'),
  embeds: z.array(z.any()).optional().describe('Nouveaux embeds'),
  components: z.array(z.any()).optional().describe('Nouveaux composants'),
  attachments: z.array(z.any()).optional().describe('Nouveaux attachements')
});

export const DeleteMessageSchema = z.object({
  channelId: z.string().describe('ID du canal du message'),
  messageId: z.string().describe('ID du message à supprimer'),
  reason: z.string().optional().describe('Raison de la suppression (pour les logs)')
});

export const ReadMessagesSchema = z.object({
  channelId: z.string().describe('ID du canal à lire'),
  limit: z.number().min(1).max(100).optional().default(50).describe('Nombre de messages à récupérer (1-100)'),
  before: z.string().optional().describe('ID du message avant lequel récupérer'),
  after: z.string().optional().describe('ID du message après lequel récupérer'),
  around: z.string().optional().describe('ID du message autour duquel récupérer'),
  includeBots: z.boolean().optional().default(true).describe('Inclure les messages de bots'),
  onlyPinned: z.boolean().optional().default(false).describe('Seulement les messages épinglés')
});

export const AddReactionSchema = z.object({
  channelId: z.string().describe('ID du canal du message'),
  messageId: z.string().describe('ID du message à réagir'),
  emoji: z.string().describe('Emoji à ajouter (ex: 😊, :custom_emoji:, <:name:id>)'),
  removeAfter: z.number().optional().describe('Retirer la réaction après X secondes (optionnel)')
});

// Types pour les résultats
export interface MessageInfo {
  id: string;
  content: string;
  author: {
    id: string;
    username: string;
    discriminator: string;
    bot: boolean;
  };
  timestamp: string;
  editedTimestamp?: string;
  attachments: string[];
  embeds: number;
  reactions: {
    emoji: string;
    count: number;
    me: boolean;
  }[];
  pinned: boolean;
  channelType: string;
  replyTo?: {
    id: string;
    author: string;
    content: string;
  };
}

export interface MessageHistoryResult {
  channelId: string;
  channelName?: string;
  messageCount: number;
  messages: MessageInfo[];
  hasMore: boolean;
}

// Fonctions utilitaires
export async function sendMessage(
  client: any,
  params: z.infer<typeof SendMessageSchema>
): Promise<{ success: boolean; message?: string; messageId?: string; error?: string }> {
  try {
    const channel = await client.channels.fetch(params.channelId);
    if (!channel || !('send' in channel)) {
      return { success: false, error: '❌ Canal invalide ou permissions insuffisantes' };
    }

    // Préparer les options
    const options: any = {
      content: params.content,
      allowedMentions: {
        repliedUser: params.mentionRepliedUser
      }
    };

    // Ajouter les embeds si présents
    if (params.embeds && params.embeds.length > 0) {
      options.embeds = params.embeds;
    }

    // Ajouter les composants si présents
    if (params.components && params.components.length > 0) {
      options.components = params.components;
    }

    // Répondre à un message si spécifié
    if (params.replyTo) {
      const replyToMessage = await (channel as TextChannel | DMChannel | NewsChannel)
        .messages.fetch(params.replyTo)
        .catch(() => null);

      if (replyToMessage) {
        options.reply = { messageReference: replyToMessage };
      }
    }

    // Envoyer le message
    const message = await (channel as TextChannel | DMChannel | NewsChannel).send(options);

    return {
      success: true,
      message: '✅ Message envoyé avec succès',
      messageId: message.id
    };
  } catch (error) {
    return {
      success: false,
      error: `❌ Erreur lors de l'envoi: ${error}`
    };
  }
}

export async function editMessage(
  client: any,
  params: z.infer<typeof EditMessageSchema>
): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    const channel = await client.channels.fetch(params.channelId);
    if (!channel || !('messages' in channel)) {
      return { success: false, error: '❌ Canal invalide' };
    }

    // Récupérer le message
    const message = await (channel as TextChannel | DMChannel | NewsChannel)
      .messages.fetch(params.messageId);

    // Vérifier si le message peut être modifié
    if (message.author.id !== client.user?.id) {
      return { success: false, error: '❌ Vous ne pouvez modifier que vos propres messages' };
    }

    // Préparer les modifications
    const editOptions: any = {};

    if (params.content !== undefined) {
      editOptions.content = params.content;
    }

    if (params.embeds) {
      editOptions.embeds = params.embeds;
    }

    if (params.components) {
      editOptions.components = params.components;
    }

    if (params.attachments) {
      editOptions.attachments = params.attachments;
    }

    // Modifier le message
    await message.edit(editOptions);

    return { success: true, message: '✅ Message modifié avec succès' };
  } catch (error) {
    return {
      success: false,
      error: `❌ Erreur lors de la modification: ${error}`
    };
  }
}

export async function deleteMessage(
  client: any,
  params: z.infer<typeof DeleteMessageSchema>
): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    const channel = await client.channels.fetch(params.channelId);
    if (!channel || !('messages' in channel)) {
      return { success: false, error: '❌ Canal invalide' };
    }

    // Récupérer le message
    const message = await (channel as TextChannel | DMChannel | NewsChannel)
      .messages.fetch(params.messageId);

    // Vérifier si le message peut être supprimé
    if (message.author.id !== client.user?.id && !message.deletable) {
      return { success: false, error: '❌ Permissions insuffisantes pour supprimer ce message' };
    }

    // Supprimer le message
    await message.delete();

    return {
      success: true,
      message: `✅ Message supprimé${params.reason ? ` (raison: ${params.reason})` : ''}`
    };
  } catch (error) {
    return {
      success: false,
      error: `❌ Erreur lors de la suppression: ${error}`
    };
  }
}

export async function readMessages(
  client: any,
  params: z.infer<typeof ReadMessagesSchema>
): Promise<MessageHistoryResult> {
  try {
    const channel = await client.channels.fetch(params.channelId);
    if (!channel || !('messages' in channel)) {
      throw new Error('Canal invalide ou permissions insuffisantes');
    }

    // Préparer les options de récupération
    const fetchOptions: any = {
      limit: params.limit
    };

    if (params.before) fetchOptions.before = params.before;
    if (params.after) fetchOptions.after = params.after;
    if (params.around) fetchOptions.around = params.around;

    // Récupérer les messages
    const fetchedMessages = await (channel as TextChannel | DMChannel | NewsChannel)
      .messages.fetch(fetchOptions);
    
    // Type checking for collection vs single message
    const messagesArray = Array.isArray(fetchedMessages)
      ? fetchedMessages
      : Array.from((fetchedMessages as any).values());

    // Filtrer les messages si nécessaire
    let filteredMessages = messagesArray;

    if (!params.includeBots) {
      filteredMessages = messagesArray.filter((m: any) => !m.author.bot);
    }

    if (params.onlyPinned) {
      filteredMessages = filteredMessages.filter((m: any) => m.pinned);
    }

    // Formater les messages
    const formattedMessages: MessageInfo[] = filteredMessages.map((msg: any): MessageInfo => ({
      id: msg.id,
      content: msg.content,
      author: {
        id: msg.author.id,
        username: msg.author.username,
        discriminator: msg.author.discriminator,
        bot: msg.author.bot
      },
      timestamp: msg.createdAt.toISOString(),
      editedTimestamp: msg.editedAt?.toISOString(),
      attachments: msg.attachments.map((a: any) => a.url),
      embeds: msg.embeds.length,
      reactions: msg.reactions.cache.map((r: any): MessageInfo['reactions'][0] => ({
        emoji: r.emoji.toString(),
        count: r.count,
        me: r.me
      })),
      pinned: msg.pinned,
      channelType: (channel.type as any).toString(),
      replyTo: msg.reference ? {
        id: msg.reference.messageId!,
        author: msg.author?.username || 'Unknown',
        content: msg.content?.substring(0, 100) || ''
      } : undefined
    }));

    return {
      channelId: params.channelId,
      channelName: (channel as any).name || undefined,
      messageCount: formattedMessages.length,
      messages: formattedMessages,
      hasMore: filteredMessages.length >= params.limit
    };
  } catch (error) {
    throw new Error(`Erreur lors de la lecture: ${error}`);
  }
}

export async function addReaction(
  client: any,
  params: z.infer<typeof AddReactionSchema>
): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    const channel = await client.channels.fetch(params.channelId);
    if (!channel || !('messages' in channel)) {
      return { success: false, error: '❌ Canal invalide' };
    }

    // Récupérer le message
    const message = await (channel as TextChannel | DMChannel | NewsChannel)
      .messages.fetch(params.messageId);

    // Ajouter la réaction
    await message.react(params.emoji);

    // Programmer le retrait de la réaction si demandé
    if (params.removeAfter && params.removeAfter > 0) {
      setTimeout(async () => {
        try {
          await message.reactions.cache
            .filter((r: any) => r.emoji.toString() === params.emoji)
            .first()
            ?.remove();
        } catch (error) {
          // Ignorer les erreurs de suppression
        }
      }, params.removeAfter * 1000);
    }

    return {
      success: true,
      message: `✅ Réaction ${params.emoji} ajoutée${params.removeAfter ? ` (retirée après ${params.removeAfter}s)` : ''}`
    };
  } catch (error) {
    return {
      success: false,
      error: `❌ Erreur lors de l'ajout de la réaction: ${error}`
    };
  }
}

// Fonction utilitaire pour parser les emojis
export function parseEmoji(emoji: string): { name?: string; id?: string; animated?: boolean } {
  // Emoji personnalisé Discord : <:name:id> ou <a:name:id>
  const customMatch = emoji.match(/^<(a?):([^:]+):(\d+)>$/);
  if (customMatch) {
    return {
      animated: customMatch[1] === 'a',
      name: customMatch[2],
      id: customMatch[3]
    };
  }

  // Emoji Unicode
  return { name: emoji };
}

// Fonction pour formater l'historique des messages en markdown
export function formatHistoryAsMarkdown(history: MessageHistoryResult): string {
  let output = `# 📜 Historique du canal${history.channelName ? ` **#${history.channelName}**` : ''}\n\n`;
  output += `**Messages récupérés:** ${history.messageCount}/${(history as any).limit || ''}\n`;
  output += `**ID du canal:** \`${history.channelId}\`\n\n`;

  history.messages.forEach((msg, index) => {
    output += `## ${index + 1}. Message de **${msg.author.username}**#${msg.author.discriminator}\n`;
    output += `- **ID:** \`${msg.id}\`\n`;
    output += `- **Date:** <t:${Math.floor(new Date(msg.timestamp).getTime() / 1000)}:R>\n`;
    if (msg.editedTimestamp) {
      output += `- **Modifié:** <t:${Math.floor(new Date(msg.editedTimestamp).getTime() / 1000)}:R>\n`;
    }
    output += `- **Bot:** ${msg.author.bot ? 'Oui' : 'Non'}\n`;
    output += `- **Épinglé:** ${msg.pinned ? 'Oui' : 'Non'}\n`;

    if (msg.replyTo) {
      output += `- **Réponse à:** ${msg.replyTo.author} (${msg.replyTo.content.substring(0, 50)}...)\n`;
    }

    if (msg.content) {
      output += `\n**Contenu:**\n\`\`\`\n${msg.content}\`\`\`\n`;
    }

    if (msg.attachments.length > 0) {
      output += `\n**Pièces jointes:**\n`;
      msg.attachments.forEach(url => {
        output += `- 📎 ${url}\n`;
      });
    }

    if (msg.embeds > 0) {
      output += `- **Embeds:** ${msg.embeds}\n`;
    }

    if (msg.reactions.length > 0) {
      output += `\n**Réactions:**\n`;
      msg.reactions.forEach(r => {
        output += `- ${r.emoji} ${r.count}${r.me ? ' *(vous)*' : ''}\n`;
      });
    }

    output += '\n---\n\n';
  });

  if (history.hasMore) {
    output += `\n*Il y a plus de messages dans ce canal...*\n`;
  }

  return output;
}