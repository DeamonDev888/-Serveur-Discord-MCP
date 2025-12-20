// Types Discord pour le serveur MCP

export interface DiscordChannel {
  id: string;
  name: string;
  type: 'text' | 'voice' | 'category';
  guildId: string;
  position?: number;
  topic?: string;
  nsfw?: boolean;
  lastMessageId?: string;
}

export interface DiscordGuild {
  id: string;
  name: string;
  icon?: string;
  ownerId: string;
  memberCount: number;
  channels: DiscordChannel[];
}

export interface DiscordMessage {
  id: string;
  channelId: string;
  content: string;
  authorId: string;
  authorName: string;
  timestamp: Date;
  editedTimestamp?: Date;
  attachments: string[];
  embeds: any[];
}

export interface DiscordUser {
  id: string;
  username: string;
  discriminator: string;
  avatar?: string;
  bot?: boolean;
}

export interface DiscordEmbed {
  title?: string;
  description?: string;
  url?: string;
  color?: number;
  fields?: Array<{
    name: string;
    value: string;
    inline?: boolean;
  }>;
  image?: {
    url: string;
  };
  thumbnail?: {
    url: string;
  };
  timestamp?: Date;
}