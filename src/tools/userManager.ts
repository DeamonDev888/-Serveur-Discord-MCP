import { z } from 'zod';
import { User, Guild, PermissionFlagsBits, PresenceStatus } from 'discord.js';

// Schéma pour obtenir les informations d'un utilisateur
export const GetUserInfoSchema = z.object({
  userId: z.string().describe("ID de l'utilisateur à récupérer"),
  _: z.string().optional().describe('ID du serveur pour les informations de membre'),
  includeActivity: z
    .boolean()
    .optional()
    .default(true)
    .describe("Inclure l'activité de l'utilisateur"),
  includePermissions: z
    .boolean()
    .optional()
    .default(true)
    .describe('Inclure les permissions si membre du serveur'),
});

// Types pour les résultats
export interface UserInfo {
  id: string;
  username: string;
  discriminator: string;
  displayName: string;
  avatar?: string;
  banner?: string;
  accentColor?: string;
  bot: boolean;
  system?: boolean;
  createdAt: string;
  verified?: boolean;
  mfaEnabled?: boolean;
  locale?: string;
  flags?: number;
  email?: string;
  nitro?: {
    type?: string;
    boostedServers?: number;
    boostLevel?: number;
    boostCooldown?: boolean;
  };
  memberInfo?: {
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
  };
  mutualGuilds?: Array<{
    id: string;
    name: string;
    memberSince?: string;
    roles: string[];
  }>;
}

// Fonction pour obtenir les informations d'un utilisateur
export async function getUserInfo(
  client: any,
  params: z.infer<typeof GetUserInfoSchema>
): Promise<UserInfo> {
  let user: User;
  let guild: Guild | undefined;

  // Récupérer l'utilisateur
  try {
    user = await client.users.fetch(params.userId);
  } catch (error) {
    throw new Error('Utilisateur non trouvé');
  }

  // Récupérer le serveur si spécifié
  if (params._) {
    guild = await client.guilds.fetch(params._);
    await guild?.fetch();
  }

  const userInfo: UserInfo = {
    id: user.id,
    username: user.username,
    discriminator: user.discriminator,
    displayName: user.displayName,
    avatar: user.displayAvatarURL() || undefined,
    banner: user.bannerURL() || undefined,
    accentColor: user.hexAccentColor || undefined,
    bot: user.bot,
    system: user.system || false,
    createdAt: user.createdAt.toISOString(),
    verified: (user as any).verified ?? false,
    mfaEnabled: (user as any).mfaEnabled ?? false,
    locale: (user as any).locale ?? 'fr',
  };

  // Ajouter les flags
  if (user.flags) {
    userInfo.flags = user.flags.bitfield;
  }

  // Si membre d'un serveur, ajouter les infos de membre
  if (guild) {
    try {
      const member = await guild.members.fetch(params.userId);

      userInfo.memberInfo = {
        id: member.id,
        user: {
          id: userInfo.id,
          username: userInfo.username,
          discriminator: userInfo.discriminator,
          displayName: member.displayName,
          avatar: member.user.displayAvatarURL() || undefined,
          banner: member.user.bannerURL() || undefined,
          accentColor: member.user.hexAccentColor || undefined,
          bot: member.user.bot,
          system: member.user.system || false,
          verified: (member.user as any).verified ?? false,
          mfaEnabled: (member.user as any).mfaEnabled ?? false,
          locale: (member.user as any).locale ?? 'fr',
        },
        joinedAt: member.joinedAt?.toISOString() || '',
        premiumSince: member.premiumSince?.toISOString(),
        nickname: member.nickname || undefined,
        roles: member.roles.cache.map(role => ({
          id: role.id,
          name: role.name,
          color: role.hexColor,
          position: role.position,
          hoist: role.hoist,
          mentionable: role.mentionable,
          permissions: params.includePermissions
            ? Object.keys(PermissionFlagsBits).filter((perm: any) =>
                role.permissions.has(PermissionFlagsBits[perm as keyof typeof PermissionFlagsBits])
              )
            : [],
        })),
        permissions: params.includePermissions
          ? Object.keys(PermissionFlagsBits).filter((perm: any) =>
              member.permissions.has(PermissionFlagsBits[perm as keyof typeof PermissionFlagsBits])
            )
          : [],
        highestRole: member.roles.highest.name,
        presence:
          params.includeActivity && member.presence
            ? {
                status: member.presence.status as PresenceStatus,
                activities: member.presence.activities.map((activity: any) => ({
                  name: activity.name,
                  type: activity.type,
                  details: activity.details || undefined,
                  state: activity.state || undefined,
                  emoji: activity.emoji
                    ? {
                        name: activity.emoji.name!,
                        id: activity.emoji.id || undefined,
                        animated: activity.emoji.animated || false,
                      }
                    : undefined,
                  timestamps: activity.timestamps
                    ? {
                        start: activity.timestamps.start?.getTime(),
                        end: activity.timestamps.end?.getTime(),
                      }
                    : undefined,
                })),
              }
            : undefined,
        isOwner: member.id === guild.ownerId,
        isAdmin: member.permissions.has(PermissionFlagsBits.Administrator),
        isModerator:
          member.permissions.has(PermissionFlagsBits.KickMembers) ||
          member.permissions.has(PermissionFlagsBits.BanMembers),
        isBoosting: !!member.premiumSince,
        voiceState: member.voice
          ? {
              channelId: member.voice.channelId || undefined,
              mute: member.voice.mute || false,
              deaf: member.voice.deaf || false,
              selfMute: member.voice.selfMute || false,
              selfDeaf: member.voice.selfDeaf || false,
              streaming: member.voice.streaming || false,
              suppress: member.voice.suppress || false,
            }
          : undefined,
      };
    } catch (error) {
      // L'utilisateur n'est pas membre de ce serveur
    }
  }

  // Trouver les serveurs mutuels
  const mutualGuilds: Array<{
    id: string;
    name: string;
    memberSince?: string;
    roles: string[];
  }> = [];

  for (const [, guild] of client.guilds.cache) {
    try {
      const member = await guild.members.fetch(params.userId).catch(() => null);
      if (member) {
        mutualGuilds.push({
          id: guild.id,
          name: guild.name,
          memberSince: member.joinedAt?.toISOString(),
          roles: member.roles.cache.map((r: any) => r.name),
        });
      }
    } catch (error) {
      // Ignorer les erreurs
    }
  }

  if (mutualGuilds.length > 0) {
    userInfo.mutualGuilds = mutualGuilds;
  }

  return userInfo;
}

// Fonction pour formater les informations de l'utilisateur en Markdown
export function formatUserInfoMarkdown(info: UserInfo): string {
  let output = `# 👤 Informations Utilisateur: **${info.displayName}**\n\n`;

  output += `## 📋 Informations de base\n`;
  output += `- **Tag:** @${info.username}#${info.discriminator}\n`;
  output += `- **ID:** \`${info.id}\`\n`;
  output += `- **Bot:** ${info.bot ? 'Oui' : 'Non'}\n`;
  output += `- **Vérifié:** ${info.verified ? 'Oui' : 'Non'}\n`;
  output += `- **MFA:** ${info.mfaEnabled ? 'Activé' : 'Non activé'}\n`;
  output += `- **Créé le:** <t:${Math.floor(new Date(info.createdAt).getTime() / 1000)}:F>\n\n`;

  if (info.banner) {
    output += `![Banner](${info.banner})\n\n`;
  }

  // Informations de membre si disponibles
  if (info.memberInfo) {
    const member = info.memberInfo;
    output += `## 🏆 Informations du serveur\n`;
    output += `- **Surnom:** ${member.nickname || 'Aucun'}\n`;
    output += `- **Rejoint:** <t:${Math.floor(new Date(member.joinedAt).getTime() / 1000)}:R>\n`;

    if (member.premiumSince) {
      output += `- **Boost depuis:** <t:${Math.floor(new Date(member.premiumSince).getTime() / 1000)}:R>\n`;
    }

    output += `- **Statut:** ${getStatusIcon(member.presence?.status || 'offline')} ${member.presence?.status || 'offline'}\n`;
    output += `- **Rôle le plus haut:** ${member.highestRole}\n`;

    if (member.roles.length > 0) {
      output += `- **Rôles (${member.roles.length}):** ${member.roles
        .map(r => r.name)
        .slice(0, 5)
        .join(', ')}${member.roles.length > 5 ? '...' : ''}\n`;
    }

    output += '\n';

    // Activités
    if (member.presence?.activities && member.presence.activities.length > 0) {
      output += `## 🎮 Activités\n`;
      member.presence.activities.forEach(activity => {
        output += `- **${activity.name}**${activity.state ? `: ${activity.state}` : ''}\n`;
        if (activity.details) {
          output += `  - *${activity.details}*\n`;
        }
      });
      output += '\n';
    }

    // État vocal
    if (member.voiceState?.channelId) {
      output += `## 🎙️ Canal vocal\n`;
      output += `- **Connecté:** Oui\n`;
      output += `- **Muet:** ${member.voiceState.mute ? 'Oui' : 'Non'}\n`;
      output += `- **Sourdine:** ${member.voiceState.deaf ? 'Oui' : 'Non'}\n`;
      output += '\n';
    }
  }

  // Serveurs mutuels
  if (info.mutualGuilds && info.mutualGuilds.length > 0) {
    output += `## 🌐 Serveurs mutuels (${info.mutualGuilds.length})\n`;
    info.mutualGuilds.forEach(guild => {
      output += `- **${guild.name}** - Rejoint <t:${Math.floor(new Date(guild.memberSince!).getTime() / 1000)}:R>\n`;
    });
    output += '\n';
  }

  return output;
}

// Fonction utilitaire pour obtenir l'icône de statut
function getStatusIcon(status: string): string {
  const icons: { [key: string]: string } = {
    online: '🟢',
    idle: '🟡',
    dnd: '🔴',
    invisible: '⚪',
    offline: '⚫',
  };
  return icons[status] || '⚫';
}
