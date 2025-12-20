import { z } from 'zod';
import { PermissionFlagsBits, ChannelType } from 'discord.js';

// Schéma pour les informations du serveur
export const GetServerInfoSchema = z.object({
  guildId: z
    .string()
    .optional()
    .describe('ID du serveur (optionnel, utilise le serveur par défaut)'),
  includeFeatures: z
    .boolean()
    .optional()
    .default(true)
    .describe('Inclure les fonctionnalités du serveur'),
  includeStats: z.boolean().optional().default(true).describe('Inclure les statistiques'),
});

// Types pour les résultats
export interface ServerInfo {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  banner?: string;
  splash?: string;
  ownerId: string;
  createdAt: string;
  memberCount: number;
  boostCount: number;
  boostLevel: number;
  verificationLevel: string;
  preferredLocale: string;
  features: string[];
  roles: Array<{
    id: string;
    name: string;
    color: string;
    position: number;
    memberCount?: number;
    permissions: string[];
  }>;
  emojis: Array<{
    name: string;
    id?: string;
    animated: boolean;
    available: boolean;
  }>;
  stickers: Array<{
    name: string;
    id: string;
    description?: string;
    tags: string[];
  }>;
  channels: {
    total: number;
    categories: number;
    text: number;
    voice: number;
    news: number;
    stage: number;
    forum: number;
    threads: number;
  };
  stats?: {
    onlineMembers: number;
    totalMessages24h?: number;
    activeChannels24h?: number;
  };
}

// Fonction pour obtenir les informations du serveur
export async function getServerInfo(
  client: any,
  params: z.infer<typeof GetServerInfoSchema>
): Promise<ServerInfo> {
  const guild = params.guildId
    ? await client.guilds.fetch(params.guildId)
    : client.guilds.cache.first();

  if (!guild) {
    throw new Error('Serveur non trouvé');
  }

  await guild.fetch(); // Récupérer les données complètes

  const features: string[] = guild.features;
  const boostCount = guild.premiumSubscriptionCount || 0;
  const boostLevel = guild.premiumTier;

  // Récupérer les rôles
  const roles = guild.roles.cache
    .map((role: any) => ({
      id: role.id,
      name: role.name,
      color: role.hexColor,
      position: role.position,
      permissions: Object.keys(PermissionFlagsBits).filter((perm: any) =>
        role.permissions.has(PermissionFlagsBits[perm as keyof typeof PermissionFlagsBits])
      ),
    }))
    .sort((a: any, b: any) => b.position - a.position);

  // Récupérer les emojis
  const emojis = guild.emojis.cache.map((emoji: any) => ({
    name: emoji.name!,
    id: emoji.id,
    animated: emoji.animated,
    available: emoji.available,
  }));

  // Récupérer les stickers
  const stickers = guild.stickers.cache.map((sticker: any) => ({
    name: sticker.name,
    id: sticker.id,
    description: sticker.description,
    tags: sticker.tags,
  }));

  // Compter les canaux par type
  const channels = guild.channels.cache;
  const channelCounts = {
    total: channels.size,
    categories: channels.filter((c: any) => c.type === ChannelType.GuildCategory).size,
    text: channels.filter((c: any) => c.type === ChannelType.GuildText).size,
    voice: channels.filter((c: any) => c.type === ChannelType.GuildVoice).size,
    news: channels.filter((c: any) => c.type === ChannelType.GuildNews).size,
    stage: channels.filter((c: any) => c.type === ChannelType.GuildStageVoice).size,
    forum: channels.filter((c: any) => c.type === ChannelType.GuildForum).size,
    threads: channels.filter(
      (c: any) =>
        c.type === ChannelType.PublicThread ||
        c.type === ChannelType.PrivateThread ||
        c.type === ChannelType.AnnouncementThread
    ).size,
  };

  const serverInfo: ServerInfo = {
    id: guild.id,
    name: guild.name,
    description: guild.description || undefined,
    icon: guild.iconURL() || undefined,
    banner: guild.bannerURL() || undefined,
    splash: guild.splashURL() || undefined,
    ownerId: guild.ownerId,
    createdAt: guild.createdAt.toISOString(),
    memberCount: guild.memberCount,
    boostCount,
    boostLevel,
    verificationLevel: ['None', 'Low', 'Medium', 'High', 'Very High'][guild.verificationLevel],
    preferredLocale: guild.preferredLocale,
    features: params.includeFeatures ? features : [],
    roles,
    emojis,
    stickers,
    channels: channelCounts,
  };

  // Ajouter les statistiques si demandées
  if (params.includeStats) {
    const onlineMembers = guild.members.cache.filter(
      (m: any) => m.presence?.status !== 'offline' && !m.user.bot
    ).size;

    serverInfo.stats = {
      onlineMembers,
    };
  }

  return serverInfo;
}

// Fonction pour formater les informations du serveur en Markdown
export function formatServerInfoMarkdown(info: ServerInfo): string {
  let output = `# 🏰 Informations du Serveur: **${info.name}**\n\n`;

  output += `**ID:** \`${info.id}\`\n`;
  output += `**Propriétaire:** <@${info.ownerId}>\n`;
  output += `**Créé le:** <t:${Math.floor(new Date(info.createdAt).getTime() / 1000)}:F>\n`;
  output += `**Membres:** ${info.memberCount}\n`;
  output += `**Boosts:** ${info.boostCount} (Niveau ${info.boostLevel})\n`;
  output += `**Vérification:** ${info.verificationLevel}\n`;
  output += `**Langue:** ${info.preferredLocale}\n\n`;

  if (info.description) {
    output += `**Description:** ${info.description}\n\n`;
  }

  // Fonctionnalités
  if (info.features.length > 0) {
    output += `## ✨ Fonctionnalités\n`;
    info.features.forEach(feature => {
      output += `- ${feature}\n`;
    });
    output += '\n';
  }

  // Statistiques
  if (info.stats) {
    output += `## 📊 Statistiques\n`;
    output += `- **Membres en ligne:** ${info.stats.onlineMembers}\n\n`;
  }

  // Canaux
  output += `## 📋 Canaux (${info.channels.total})\n`;
  output += `- Catégories: ${info.channels.categories}\n`;
  output += `- Textuels: ${info.channels.text}\n`;
  output += `- Vocaux: ${info.channels.voice}\n`;
  output += `- Annonces: ${info.channels.news}\n`;
  output += `- Stage: ${info.channels.stage}\n`;
  output += `- Forum: ${info.channels.forum}\n`;
  output += `- Threads: ${info.channels.threads}\n\n`;

  // Rôles principaux (limité à 10)
  output += `## 🎭 Rôles principaux\n`;
  info.roles.slice(0, 10).forEach((role, index) => {
    output += `${index + 1}. **${role.name}** - ${role.permissions.slice(0, 3).join(', ')}${role.permissions.length > 3 ? '...' : ''}\n`;
  });

  if (info.roles.length > 10) {
    output += `... et ${info.roles.length - 10} autres rôles\n`;
  }

  // Emojis
  if (info.emojis.length > 0) {
    output += `\n## 😀 Emojis (${info.emojis.length})\n`;
    output += info.emojis
      .slice(0, 20)
      .map(e => (e.id ? `<${e.animated ? 'a' : ''}:${e.name}:${e.id}>` : e.name))
      .join(' ');

    if (info.emojis.length > 20) {
      output += ` ... et ${info.emojis.length - 20} autres`;
    }
    output += '\n';
  }

  return output;
}
