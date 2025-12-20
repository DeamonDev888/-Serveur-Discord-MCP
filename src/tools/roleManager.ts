import { z } from 'zod';
import { PermissionFlagsBits } from 'discord.js';

// Schémas de validation
export const CreateRoleSchema = z.object({
  guildId: z.string().describe('ID du serveur'),
  name: z.string().describe('Nom du rôle'),
  color: z.string().optional().describe('Couleur du rôle (hex ou nom)'),
  permissions: z.array(z.string()).optional().describe('Permissions du rôle'),
  hoist: z.boolean().optional().default(false).describe('Afficher séparément'),
  mentionable: z.boolean().optional().default(false).describe('Mentionnable'),
});

export const DeleteRoleSchema = z.object({
  guildId: z.string().describe('ID du serveur'),
  roleId: z.string().describe('ID du rôle à supprimer'),
});

export const EditRoleSchema = z.object({
  guildId: z.string().describe('ID du serveur'),
  roleId: z.string().describe('ID du rôle à modifier'),
  name: z.string().optional().describe('Nouveau nom'),
  color: z.string().optional().describe('Nouvelle couleur'),
  permissions: z.array(z.string()).optional().describe('Nouvelles permissions'),
  hoist: z.boolean().optional().describe('Afficher séparément'),
  mentionable: z.boolean().optional().describe('Mentionnable'),
});

export const AddRoleToMemberSchema = z.object({
  guildId: z.string().describe('ID du serveur'),
  userId: z.string().describe('ID du membre'),
  roleId: z.string().describe('ID du rôle à donner'),
});

export const RemoveRoleFromMemberSchema = z.object({
  guildId: z.string().describe('ID du serveur'),
  userId: z.string().describe('ID du membre'),
  roleId: z.string().describe('ID du rôle à retirer'),
});

export const GetMemberRolesSchema = z.object({
  guildId: z.string().describe('ID du serveur'),
  userId: z.string().describe('ID du membre'),
});

// ===============================
// OUTILS MCP
// ===============================

// 1. Créer un rôle
export async function createRole(client: any, args: any): Promise<string> {
  try {
    const validation = CreateRoleSchema.safeParse(args);
    if (!validation.success) {
      return `❌ Paramètres invalides: ${validation.error.message}`;
    }

    const { guildId, name, color, permissions, hoist, mentionable } = validation.data;

    const guild = await client.guilds.fetch(guildId);

    // Vérifier les permissions
    if (!guild.members.me?.permissions.has(PermissionFlagsBits.ManageRoles)) {
      return "❌ Le bot n'a pas la permission de gérer les rôles";
    }

    // Créer le rôle
    const role = await guild.roles.create({
      name,
      color: color ? parseColor(color) : 0,
      permissions: permissions ? parsePermissions(permissions) : '0',
      hoist: hoist || false,
      mentionable: mentionable || false,
    });

    return `✅ Rôle créé: ${role.name} (${role.id})`;
  } catch (error: any) {
    return `❌ Erreur: ${error.message}`;
  }
}

// 2. Supprimer un rôle
export async function deleteRole(client: any, args: any): Promise<string> {
  try {
    const validation = DeleteRoleSchema.safeParse(args);
    if (!validation.success) {
      return `❌ Paramètres invalides: ${validation.error.message}`;
    }

    const { guildId, roleId } = validation.data;

    const guild = await client.guilds.fetch(guildId);
    const role = await guild.roles.fetch(roleId);

    // Vérifier les permissions
    if (!guild.members.me?.permissions.has(PermissionFlagsBits.ManageRoles)) {
      return "❌ Le bot n'a pas la permission de gérer les rôles";
    }

    // Supprimer le rôle
    await role.delete();

    return `✅ Rôle supprimé: ${role.name} (${roleId})`;
  } catch (error: any) {
    return `❌ Erreur: ${error.message}`;
  }
}

// 3. Modifier un rôle
export async function editRole(client: any, args: any): Promise<string> {
  try {
    const validation = EditRoleSchema.safeParse(args);
    if (!validation.success) {
      return `❌ Paramètres invalides: ${validation.error.message}`;
    }

    const { guildId, roleId, name, color, permissions, hoist, mentionable } = validation.data;

    const guild = await client.guilds.fetch(guildId);
    const role = await guild.roles.fetch(roleId);

    // Vérifier les permissions
    if (!guild.members.me?.permissions.has(PermissionFlagsBits.ManageRoles)) {
      return "❌ Le bot n'a pas la permission de gérer les rôles";
    }

    // Préparer les modifications
    const updates: any = {};
    if (name) updates.name = name;
    if (color) updates.color = parseColor(color);
    if (permissions) updates.permissions = parsePermissions(permissions);
    if (typeof hoist === 'boolean') updates.hoist = hoist;
    if (typeof mentionable === 'boolean') updates.mentionable = mentionable;

    // Appliquer les modifications
    const updatedRole = await role.edit(updates);

    return `✅ Rôle modifié: ${updatedRole.name} (${updatedRole.id})`;
  } catch (error: any) {
    return `❌ Erreur: ${error.message}`;
  }
}

// 4. Donner un rôle à un membre
export async function addRoleToMember(client: any, args: any): Promise<string> {
  try {
    const validation = AddRoleToMemberSchema.safeParse(args);
    if (!validation.success) {
      return `❌ Paramètres invalides: ${validation.error.message}`;
    }

    const { guildId, userId, roleId } = validation.data;

    const guild = await client.guilds.fetch(guildId);
    const member = await guild.members.fetch(userId);
    const role = await guild.roles.fetch(roleId);

    // Vérifier les permissions
    if (!guild.members.me?.permissions.has(PermissionFlagsBits.ManageRoles)) {
      return "❌ Le bot n'a pas la permission de gérer les rôles";
    }

    // Donner le rôle
    await member.roles.add(roleId);

    return `✅ Rôle donné: ${role.name} à ${member.user.username}`;
  } catch (error: any) {
    return `❌ Erreur: ${error.message}`;
  }
}

// 5. Retirer un rôle d'un membre
export async function removeRoleFromMember(client: any, args: any): Promise<string> {
  try {
    const validation = RemoveRoleFromMemberSchema.safeParse(args);
    if (!validation.success) {
      return `❌ Paramètres invalides: ${validation.error.message}`;
    }

    const { guildId, userId, roleId } = validation.data;

    const guild = await client.guilds.fetch(guildId);
    const member = await guild.members.fetch(userId);
    const role = await guild.roles.fetch(roleId);

    // Vérifier les permissions
    if (!guild.members.me?.permissions.has(PermissionFlagsBits.ManageRoles)) {
      return "❌ Le bot n'a pas la permission de gérer les rôles";
    }

    // Retirer le rôle
    await member.roles.remove(roleId);

    return `✅ Rôle retiré: ${role.name} de ${member.user.username}`;
  } catch (error: any) {
    return `❌ Erreur: ${error.message}`;
  }
}

// 6. Voir les rôles d'un membre
export async function getMemberRoles(client: any, args: any): Promise<string> {
  try {
    const validation = GetMemberRolesSchema.safeParse(args);
    if (!validation.success) {
      return `❌ Paramètres invalides: ${validation.error.message}`;
    }

    const { guildId, userId } = validation.data;

    const guild = await client.guilds.fetch(guildId);
    const member = await guild.members.fetch(userId);

    if (member.roles.cache.size === 0) {
      return `✅ ${member.user.username} n'a aucun rôle`;
    }

    const roles = Array.from(member.roles.cache.values())
      .sort((a: any, b: any) => b.position - a.position)
      .map((role: any) => role.name)
      .join(', ');

    return `📋 Rôles de ${member.user.username} (${member.roles.cache.size}):\n${roles}`;
  } catch (error: any) {
    return `❌ Erreur: ${error.message}`;
  }
}

// ===============================
// UTILITAIRES
// ===============================

// Parser une couleur
function parseColor(color: string): number {
  // Si c'est déjà un nombre décimal
  if (/^\d+$/.test(color)) {
    return parseInt(color);
  }

  // Si c'est un code hex
  if (color.startsWith('#')) {
    return parseInt(color.slice(1), 16);
  }

  // Couleurs nommées communes
  const colorMap: { [key: string]: number } = {
    RED: 0xe74c3c,
    GREEN: 0x2ecc71,
    BLUE: 0x3498db,
    YELLOW: 0xf1c40f,
    PURPLE: 0x9b59b6,
    ORANGE: 0xe67e22,
    AQUA: 0x1abc9c,
    WHITE: 0xffffff,
    BLACK: 0x000000,
    GREY: 0x95a5a6,
    DARK_RED: 0xc0392b,
    DARK_GREEN: 0x27ae60,
    DARK_BLUE: 0x2980b9,
  };

  return colorMap[color.toUpperCase()] || 0x000000;
}

// Parser des permissions
function parsePermissions(permissions: string[]): bigint {
  let result = 0n;
  const permissionMap: { [key: string]: bigint } = {
    ADMINISTRATOR: PermissionFlagsBits.Administrator,
    MANAGE_GUILD: PermissionFlagsBits.ManageGuild,
    MANAGE_ROLES: PermissionFlagsBits.ManageRoles,
    MANAGE_CHANNELS: PermissionFlagsBits.ManageChannels,
    KICK_MEMBERS: PermissionFlagsBits.KickMembers,
    BAN_MEMBERS: PermissionFlagsBits.BanMembers,
    VIEW_AUDIT_LOG: PermissionFlagsBits.ViewAuditLog,
    SEND_MESSAGES: PermissionFlagsBits.SendMessages,
    EMBED_LINKS: PermissionFlagsBits.EmbedLinks,
    ATTACH_FILES: PermissionFlagsBits.AttachFiles,
    READ_MESSAGE_HISTORY: PermissionFlagsBits.ReadMessageHistory,
    USE_EXTERNAL_EMOJIS: PermissionFlagsBits.UseExternalEmojis,
    ADD_REACTIONS: PermissionFlagsBits.AddReactions,
  };

  for (const perm of permissions) {
    const flag = permissionMap[perm.toUpperCase()];
    if (flag) {
      result |= flag;
    }
  }

  return result;
}

// Les schémas sont déjà exportés avec export const ci-dessus
