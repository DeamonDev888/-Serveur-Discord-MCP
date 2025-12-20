import { z } from 'zod';
import {
  TextChannel,
  VoiceChannel,
  CategoryChannel,
  NewsChannel,
  StageChannel,
  ForumChannel,
  ThreadChannel,
  ChannelType
} from 'discord.js';

// Schéma pour lister les canaux
export const GetChannelsSchema = z.object({
  guildId: z.string().optional().describe('ID du serveur (optionnel)'),
  channelType: z.enum(['all', 'text', 'voice', 'category', 'news', 'stage', 'forum']).optional().default('all').describe('Type de canaux à lister'),
  includeThreads: z.boolean().optional().default(false).describe('Inclure les threads'),
  sortBy: z.enum(['name', 'type', 'position']).optional().default('name').describe('Tri des canaux')
});

// Types pour les résultats
export interface ChannelInfo {
  id: string;
  name: string;
  type: string;
  position: number;
  parentId?: string;
  topic?: string;
  nsfw: boolean;
  permissionsLocked: boolean;
  memberCount?: number;
  userLimit?: number;
  bitrate?: number;
  rateLimitPerUser?: number;
  lastMessageId?: string;
  createdAt: string;
  createdAtTimestamp: number;
  category?: string;
  threadMetadata?: {
    messageCount: number;
    memberCount: number;
    totalMessageSent: number;
    archiveDate?: string;
    autoArchiveDuration: number;
    locked: boolean;
    invitable: boolean;
  };
}

// Fonction pour lister les canaux
export async function getChannels(
  client: any,
  params: z.infer<typeof GetChannelsSchema>
): Promise<ChannelInfo[]> {
  const guild = params.guildId
    ? await client.guilds.fetch(params.guildId)
    : client.guilds.cache.first();

  if (!guild) {
    throw new Error('Serveur non trouvé');
  }

  await guild.fetch();

  let channels = guild.channels.cache;

  // Filtrer par type
  if (params.channelType !== 'all') {
    const typeMap: Record<string, ChannelType[]> = {
      'text': [ChannelType.GuildText],
      'voice': [ChannelType.GuildVoice],
      'category': [ChannelType.GuildCategory],
      'news': [ChannelType.GuildNews],
      'stage': [ChannelType.GuildStageVoice],
      'forum': [ChannelType.GuildForum]
    };

    const targetTypes = typeMap[params.channelType as string] || [];
    channels = channels.filter((c: any) =>
      targetTypes.includes(c.type)
    );
  }

  // Inclure ou exclure les threads
  if (!params.includeThreads) {
    channels = channels.filter((c: any) =>
      ![
        ChannelType.PublicThread,
        ChannelType.PrivateThread,
        ChannelType.AnnouncementThread
      ].includes(c.type)
    );
  }

  // Trier
  channels = channels.sort((a: any, b: any) => {
    switch (params.sortBy) {
      case 'name':
        return (a.name || '').localeCompare(b.name || '');
      case 'type':
        return (a.type as number) - (b.type as number);
      case 'position':
        return (a.position || 0) - (b.position || 0);
      default:
        return 0;
    }
  });

  // Formater les résultats
  const channelInfos: ChannelInfo[] = [];

  for (const channel of channels.values()) {
    const channelInfo: ChannelInfo = {
      id: channel.id,
      name: channel.name || 'Unknown',
      type: [
        'Text', 'DM', 'Voice', 'Group', 'Category', 'News',
        'Store', 'NewsThread', 'PublicThread', 'PrivateThread',
        'Stage', 'Directory', 'Forum'
      ][channel.type] || 'Unknown',
      position: channel.position || 0,
      parentId: channel.parentId || undefined,
      nsfw: (channel as TextChannel | NewsChannel).nsfw || false,
      permissionsLocked: (channel as TextChannel | VoiceChannel).permissionsLocked || false,
      createdAt: channel.createdAt.toISOString(),
      createdAtTimestamp: channel.createdTimestamp
    };

    // Ajouter des infos spécifiques selon le type
    if (channel.isTextBased()) {
      const textChannel = channel as TextChannel | NewsChannel;
      channelInfo.topic = textChannel.topic || undefined;
      channelInfo.rateLimitPerUser = textChannel.rateLimitPerUser || undefined;
      channelInfo.lastMessageId = textChannel.lastMessageId || undefined;
    }

    if (channel.type === ChannelType.GuildVoice) {
      const voiceChannel = channel as VoiceChannel;
      channelInfo.bitrate = voiceChannel.bitrate || undefined;
      channelInfo.userLimit = voiceChannel.userLimit || undefined;
    }

    // Ajouter la catégorie si parent
    if (channel.parent) {
      channelInfo.category = channel.parent.name;
    }

    // Métadonnées des threads
    if (channel.isThread()) {
      const thread = channel as ThreadChannel;
      channelInfo.threadMetadata = {
        messageCount: thread.messageCount || 0,
        memberCount: thread.memberCount || 0,
        totalMessageSent: thread.totalMessageSent || 0,
        archiveDate: thread.archivedAt?.toISOString() || undefined,
        autoArchiveDuration: thread.autoArchiveDuration || 0,
        locked: thread.locked || false,
        invitable: thread.invitable || false
      };
    }

    channelInfos.push(channelInfo);
  }

  return channelInfos;
}

// Fonction pour formater la liste des canaux en Markdown
export function formatChannelsMarkdown(channels: ChannelInfo[]): string {
  let output = `# 📚 Liste des Canaux (${channels.length})\n\n`;

  // Regrouper par catégorie
  const categories: { [key: string]: ChannelInfo[] } = {};
  const uncategorized: ChannelInfo[] = [];

  channels.forEach(channel => {
    if (channel.category) {
      if (!categories[channel.category]) {
        categories[channel.category] = [];
      }
      categories[channel.category].push(channel);
    } else {
      uncategorized.push(channel);
    }
  });

  // Afficher par catégorie
  Object.keys(categories).sort().forEach(categoryName => {
    output += `## 📁 ${categoryName}\n`;
    categories[categoryName].forEach(channel => {
      output += `### ${getChannelIcon(channel.type)} **${channel.name}**\n`;
      output += `- **Type:** ${channel.type}\n`;
      output += `- **ID:** \`${channel.id}\`\n`;
      output += `- **Position:** ${channel.position}\n`;

      if (channel.topic) {
        output += `- **Sujet:** ${channel.topic}\n`;
      }

      if (channel.rateLimitPerUser && channel.rateLimitPerUser > 0) {
        output += `- **Slowmode:** ${channel.rateLimitPerUser}s\n`;
      }

      if (channel.nsfw) {
        output += `- **NSFW:** ✅\n`;
      }

      output += '\n';
    });
  });

  // Canaux sans catégorie
  if (uncategorized.length > 0) {
    output += `## 🔸 Sans catégorie\n`;
    uncategorized.forEach(channel => {
      output += `### ${getChannelIcon(channel.type)} **${channel.name}**\n`;
      output += `- **Type:** ${channel.type}\n`;
      output += `- **ID:** \`${channel.id}\`\n`;
      output += '\n';
    });
  }

  return output;
}

// Fonction utilitaire pour obtenir l'icône du type de canal
function getChannelIcon(type: string): string {
  const icons: { [key: string]: string } = {
    'Text': '💬',
    'Voice': '🔊',
    'Category': '📁',
    'News': '📢',
    'Stage': '🎭',
    'Forum': '💭',
    'PublicThread': '🧵',
    'PrivateThread': '🔒',
    'AnnouncementThread': '📌'
  };
  return icons[type] || '📄';
}