import { z } from 'zod';
import {
  GuildMember,
  PermissionFlagsBits,
  PresenceStatus
} from 'discord.js';

// Schéma pour lister les membres
export const ListMembersSchema = z.object({
  guildId: z.string().optional().describe('ID du serveur (optionnel)'),
  limit: z.number().min(1).max(1000).optional().default(100).describe('Nombre maximum de membres (1-1000)'),
  filter: z.enum(['all', 'online', 'offline', 'bots', 'humans', 'verified', 'unverified']).optional().default('all').describe('Filtrer les membres'),
  searchRole: z.string().optional().describe('Nom ou ID du rôle pour filtrer'),
  sortBy: z.enum(['joined', 'username', 'id']).optional().default('joined').describe('Tri des membres'),
  order: z.enum(['asc', 'desc']).optional().default('desc').describe('Ordre de tri')
});

// Types pour les résultats
export interface MemberInfo {
  id: string;
  user: {
    id: string;
    username: string;
    discriminator: string;
    displayName: string;
    avatar?: string;
    banner?: string;
    accentColor?: string;
    bot: boolean;
    system?: boolean;
    verified?: boolean;
    mfaEnabled?: boolean;
    locale?: string;
  };
  joinedAt: string;
  premiumSince?: string;
  nickname?: string;
  roles: Array<{
    id: string;
    name: string;
    color: string;
    position: number;
    hoist: boolean;
    mentionable: boolean;
    permissions: string[];
  }>;
  permissions: string[];
  highestRole: string;
  presence?: {
    status: 'online' | 'idle' | 'dnd' | 'invisible' | 'offline';
    activities: Array<{
      name: string;
      type: number;
      details?: string;
      state?: string;
      emoji?: {
        name: string;
        id?: string;
        animated: boolean;
      };
      timestamps?: {
        start?: number;
        end?: number;
      };
    }>;
  };
  isOwner: boolean;
  isAdmin: boolean;
  isModerator: boolean;
  isBoosting: boolean;
  voiceState?: {
    channelId?: string;
    mute: boolean;
    deaf: boolean;
    selfMute: boolean;
    selfDeaf: boolean;
    streaming: boolean;
    suppress: boolean;
  };
}

// Fonction pour lister les membres
export async function listMembers(
  client: any,
  params: z.infer<typeof ListMembersSchema>
): Promise<MemberInfo[]> {
  const guild = params.guildId
    ? await client.guilds.fetch(params.guildId)
    : client.guilds.cache.first();

  if (!guild) {
    throw new Error('Serveur non trouvé');
  }

  await guild.fetch({ withPresences: true });

  // Récupérer les membres
  let members = await guild.members.fetch({ limit: params.limit });

  // Filtrer par statut
  if (params.filter !== 'all') {
    switch (params.filter) {
      case 'online':
        members = members.filter((m: any) => m.presence && m.presence.status !== 'offline');
        break;
      case 'offline':
        members = members.filter((m: any) => !m.presence || m.presence.status === 'offline');
        break;
      case 'bots':
        members = members.filter((m: any) => m.user.bot);
        break;
      case 'humans':
        members = members.filter((m: any) => !m.user.bot);
        break;
      case 'verified':
        members = members.filter((m: any) => (m.user as any).verified === true);
        break;
      case 'unverified':
        members = members.filter((m: any) => (m.user as any).verified !== true);
        break;
    }
  }

  // Filtrer par rôle
  if (params.searchRole) {
    const role = guild.roles.cache.find((r: any) =>
      r.name === params.searchRole || r.id === params.searchRole
    );
    if (role) {
      members = members.filter((m: any) => m.roles.cache.has(role.id));
    }
  }

  // Trier
  members = members.sort((a: any, b: any) => {
    switch (params.sortBy) {
      case 'joined':
        return params.order === 'desc'
          ? b.joinedTimestamp! - a.joinedTimestamp!
          : a.joinedTimestamp! - b.joinedTimestamp!;
      case 'username':
        return params.order === 'desc'
          ? b.user.username.localeCompare(a.user.username)
          : a.user.username.localeCompare(b.user.username);
      case 'id':
        return params.order === 'desc'
          ? b.user.id.localeCompare(a.user.id)
          : a.user.id.localeCompare(b.user.id);
      default:
        return 0;
    }
  });

  // Formater les résultats
  return (members as any).map((member: any) => ({
    id: member.id,
    user: {
      id: member.user.id,
      username: member.user.username,
      discriminator: member.user.discriminator,
      displayName: member.displayName,
      avatar: member.user.displayAvatarURL() || undefined,
      banner: member.user.bannerURL() || undefined,
      accentColor: member.user.hexAccentColor || undefined,
      bot: member.user.bot,
      system: member.user.system || false,
      verified: (member.user as any).verified ?? false,
      mfaEnabled: (member.user as any).mfaEnabled ?? false,
      locale: (member.user as any).locale ?? 'fr'
    },
    joinedAt: member.joinedAt?.toISOString() || '',
    premiumSince: member.premiumSince?.toISOString(),
    nickname: member.nickname || undefined,
    roles: member.roles.cache.map((role: any) => ({
      id: role.id,
      name: role.name,
      color: role.hexColor,
      position: role.position,
      hoist: role.hoist,
      mentionable: role.mentionable,
      permissions: Object.keys(PermissionFlagsBits).filter(
        (perm: any) => role.permissions.has(PermissionFlagsBits[perm as keyof typeof PermissionFlagsBits])
      )
    })),
    permissions: Object.keys(PermissionFlagsBits).filter(
      (perm: any) => member.permissions.has(PermissionFlagsBits[perm as keyof typeof PermissionFlagsBits])
    ),
    highestRole: member.roles.highest.name,
    presence: member.presence ? {
      status: member.presence.status as PresenceStatus,
      activities: member.presence.activities.map((activity: any) => ({
        name: activity.name,
        type: activity.type,
        details: activity.details || undefined,
        state: activity.state || undefined,
        emoji: activity.emoji ? {
          name: activity.emoji.name!,
          id: activity.emoji.id || undefined,
          animated: activity.emoji.animated || false
        } : undefined,
        timestamps: activity.timestamps ? {
          start: activity.timestamps.start?.getTime(),
          end: activity.timestamps.end?.getTime()
        } : undefined
      }))
    } : undefined,
    isOwner: member.id === guild.ownerId,
    isAdmin: member.permissions.has(PermissionFlagsBits.Administrator),
    isModerator: member.permissions.has(PermissionFlagsBits.KickMembers) ||
                  member.permissions.has(PermissionFlagsBits.BanMembers),
    isBoosting: !!member.premiumSince,
    voiceState: member.voice ? {
      channelId: member.voice.channelId || undefined,
      mute: member.voice.mute,
      deaf: member.voice.deaf,
      selfMute: member.voice.selfMute,
      selfDeaf: member.voice.selfDeaf,
      streaming: member.voice.streaming,
      suppress: member.voice.suppress
    } : undefined
  }));
}

// Fonction pour formater la liste des membres en Markdown
export function formatMembersMarkdown(members: MemberInfo[]): string {
  let output = `# 👥 Liste des Membres (${members.length})\n\n`;

  // Statistiques
  const bots = members.filter(m => m.user.bot).length;
  const humans = members.filter(m => !m.user.bot).length;
  const online = members.filter(m =>
    m.presence?.status !== 'offline' && !m.user.bot
  ).length;

  output += `## 📊 Statistiques\n`;
  output += `- **Humains:** ${humans}\n`;
  output += `- **Bots:** ${bots}\n`;
  output += `- **En ligne:** ${online}\n\n`;

  // Liste des membres
  members.forEach((member, index) => {
    const statusIcon = member.presence?.status === 'online' ? '🟢' :
                      member.presence?.status === 'idle' ? '🟡' :
                      member.presence?.status === 'dnd' ? '🔴' : '⚫';

    const badges = [];
    if (member.user.bot) badges.push('🤖');
    if (member.user.verified) badges.push('✅');
    if (member.isOwner) badges.push('👑');
    if (member.isAdmin) badges.push('🛡️');
    if (member.isBoosting) badges.push('💎');

    output += `${index + 1}. ${statusIcon} **${member.user.displayName}** ${badges.join(' ')}\n`;
    output += `   - **@${member.user.username}#${member.user.discriminator}** (ID: \`${member.user.id}\`)\n`;
    output += `   - **Rejoint:** <t:${Math.floor(new Date(member.joinedAt).getTime() / 1000)}:R>\n`;

    if (member.roles.length > 0) {
      output += `   - **Rôles:** ${member.roles.slice(0, 5).map(r => r.name).join(', ')}${member.roles.length > 5 ? '...' : ''}\n`;
    }

    if (member.presence?.activities && member.presence.activities.length > 0) {
      const activities = member.presence.activities.map(a =>
        `**${a.name}**${a.state ? ` - ${a.state}` : ''}`
      ).join(', ');
      output += `   - **Activité:** ${activities}\n`;
    }

    output += '\n';
  });

  return output;
}