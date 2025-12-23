/**
 * Outils de gestion des rôles pour le serveur Discord MCP
 * Enregistre les outils de rôles (6 outils)
 */

import { z } from 'zod';
import type { FastMCP } from 'fastmcp';
import { PermissionFlagsBits } from 'discord.js';
import Logger from '../utils/logger.js';
import { ensureDiscordConnection } from './common.js';

// ============================================================================
// SCHÉMAS ZOD
// ============================================================================

const CreateRoleSchema = z.object({
  guildId: z.string().describe('ID du serveur'),
  name: z.string().describe('Nom du rôle'),
  color: z.string().optional().describe('Couleur du rôle (hex ou nom)'),
  permissions: z.array(z.string()).optional().describe('Permissions du rôle'),
  hoist: z.boolean().optional().default(false).describe('Afficher séparément'),
  mentionable: z.boolean().optional().default(false).describe('Mentionnable'),
});

const DeleteRoleSchema = z.object({
  guildId: z.string().describe('ID du serveur'),
  roleId: z.string().describe('ID du rôle à supprimer'),
});

const EditRoleSchema = z.object({
  guildId: z.string().describe('ID du serveur'),
  roleId: z.string().describe('ID du rôle à modifier'),
  name: z.string().optional().describe('Nouveau nom'),
  color: z.string().optional().describe('Nouvelle couleur'),
  permissions: z.array(z.string()).optional().describe('Nouvelles permissions'),
  hoist: z.boolean().optional().describe('Afficher séparément'),
  mentionable: z.boolean().optional().describe('Mentionnable'),
});

const AddRoleToMemberSchema = z.object({
  guildId: z.string().describe('ID du serveur'),
  userId: z.string().describe('ID du membre'),
  roleId: z.string().describe('ID du rôle à donner'),
});

const RemoveRoleFromMemberSchema = z.object({
  guildId: z.string().describe('ID du serveur'),
  userId: z.string().describe('ID du membre'),
  roleId: z.string().describe('ID du rôle à retirer'),
});

const GetMemberRolesSchema = z.object({
  guildId: z.string().describe('ID du serveur'),
  userId: z.string().describe('ID du membre'),
});

// ============================================================================
// UTILITAIRES
// ============================================================================

function parseColor(color: string): number {
  if (/^\d+$/.test(color)) {
    return parseInt(color);
  }

  if (color.startsWith('#')) {
    return parseInt(color.slice(1), 16);
  }

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

// ============================================================================
// FONCTIONS
// ============================================================================

async function createRole(client: any, args: z.infer<typeof CreateRoleSchema>): Promise<string> {
  const validation = CreateRoleSchema.safeParse(args);
  if (!validation.success) {
    return `❌ Paramètres invalides: ${validation.error.message}`;
  }

  const { guildId, name, color, permissions, hoist, mentionable } = validation.data;
  const guild = await client.guilds.fetch(guildId);

  if (!guild.members.me?.permissions.has(PermissionFlagsBits.ManageRoles)) {
    return "❌ Le bot n'a pas la permission de gérer les rôles";
  }

  const role = await guild.roles.create({
    name,
    color: color ? parseColor(color) : 0,
    permissions: permissions ? parsePermissions(permissions) : '0',
    hoist: hoist || false,
    mentionable: mentionable || false,
  });

  return `✅ Rôle créé: ${role.name} (${role.id})`;
}

async function deleteRole(client: any, args: z.infer<typeof DeleteRoleSchema>): Promise<string> {
  const validation = DeleteRoleSchema.safeParse(args);
  if (!validation.success) {
    return `❌ Paramètres invalides: ${validation.error.message}`;
  }

  const { guildId, roleId } = validation.data;
  const guild = await client.guilds.fetch(guildId);
  const role = await guild.roles.fetch(roleId);

  if (!guild.members.me?.permissions.has(PermissionFlagsBits.ManageRoles)) {
    return "❌ Le bot n'a pas la permission de gérer les rôles";
  }

  await role.delete();
  return `✅ Rôle supprimé: ${role.name} (${roleId})`;
}

async function editRole(client: any, args: z.infer<typeof EditRoleSchema>): Promise<string> {
  const validation = EditRoleSchema.safeParse(args);
  if (!validation.success) {
    return `❌ Paramètres invalides: ${validation.error.message}`;
  }

  const { guildId, roleId, name, color, permissions, hoist, mentionable } = validation.data;
  const guild = await client.guilds.fetch(guildId);
  const role = await guild.roles.fetch(roleId);

  if (!guild.members.me?.permissions.has(PermissionFlagsBits.ManageRoles)) {
    return "❌ Le bot n'a pas la permission de gérer les rôles";
  }

  const updates: any = {};
  if (name) updates.name = name;
  if (color) updates.color = parseColor(color);
  if (permissions) updates.permissions = parsePermissions(permissions);
  if (typeof hoist === 'boolean') updates.hoist = hoist;
  if (typeof mentionable === 'boolean') updates.mentionable = mentionable;

  const updatedRole = await role.edit(updates);
  return `✅ Rôle modifié: ${updatedRole.name} (${updatedRole.id})`;
}

async function addRoleToMember(client: any, args: z.infer<typeof AddRoleToMemberSchema>): Promise<string> {
  const validation = AddRoleToMemberSchema.safeParse(args);
  if (!validation.success) {
    return `❌ Paramètres invalides: ${validation.error.message}`;
  }

  const { guildId, userId, roleId } = validation.data;
  const guild = await client.guilds.fetch(guildId);
  const member = await guild.members.fetch(userId);
  const role = await guild.roles.fetch(roleId);

  if (!guild.members.me?.permissions.has(PermissionFlagsBits.ManageRoles)) {
    return "❌ Le bot n'a pas la permission de gérer les rôles";
  }

  await member.roles.add(roleId);
  return `✅ Rôle donné: ${role.name} à ${member.user.username}`;
}

async function removeRoleFromMember(client: any, args: z.infer<typeof RemoveRoleFromMemberSchema>): Promise<string> {
  const validation = RemoveRoleFromMemberSchema.safeParse(args);
  if (!validation.success) {
    return `❌ Paramètres invalides: ${validation.error.message}`;
  }

  const { guildId, userId, roleId } = validation.data;
  const guild = await client.guilds.fetch(guildId);
  const member = await guild.members.fetch(userId);
  const role = await guild.roles.fetch(roleId);

  if (!guild.members.me?.permissions.has(PermissionFlagsBits.ManageRoles)) {
    return "❌ Le bot n'a pas la permission de gérer les rôles";
  }

  await member.roles.remove(roleId);
  return `✅ Rôle retiré: ${role.name} de ${member.user.username}`;
}

async function getMemberRoles(client: any, args: z.infer<typeof GetMemberRolesSchema>): Promise<string> {
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
}

// ============================================================================
// ENREGISTREMENT DES OUTILS
// ============================================================================

export function registerRolesTools(server: FastMCP): void {
  server.addTool({
    name: 'create_role',
    description: 'Crée un nouveau rôle',
    parameters: CreateRoleSchema,
    execute: async args => {
      try {
        Logger.info(`🎭 [create_role] Name: ${args.name}`);
        const client = await ensureDiscordConnection();
        const result = await createRole(client, args);
        return result;
      } catch (error: any) {
        Logger.error(`❌ [create_role]`, error.message);
        return `❌ Erreur: ${error.message}`;
      }
    },
  });

  server.addTool({
    name: 'delete_role',
    description: 'Supprime un rôle',
    parameters: DeleteRoleSchema,
    execute: async args => {
      try {
        Logger.info(`🗑️ [delete_role] Role: ${args.roleId}`);
        const client = await ensureDiscordConnection();
        const result = await deleteRole(client, args);
        return result;
      } catch (error: any) {
        Logger.error(`❌ [delete_role]`, error.message);
        return `❌ Erreur: ${error.message}`;
      }
    },
  });

  server.addTool({
    name: 'edit_role',
    description: 'Modifie un rôle existant',
    parameters: EditRoleSchema,
    execute: async args => {
      try {
        Logger.info(`✏️ [edit_role] Role: ${args.roleId}`);
        const client = await ensureDiscordConnection();
        const result = await editRole(client, args);
        return result;
      } catch (error: any) {
        Logger.error(`❌ [edit_role]`, error.message);
        return `❌ Erreur: ${error.message}`;
      }
    },
  });

  server.addTool({
    name: 'add_role_to_member',
    description: 'Donne un rôle à un membre',
    parameters: AddRoleToMemberSchema,
    execute: async args => {
      try {
        Logger.info(`➕ [add_role_to_member] User: ${args.userId}, Role: ${args.roleId}`);
        const client = await ensureDiscordConnection();
        const result = await addRoleToMember(client, args);
        return result;
      } catch (error: any) {
        Logger.error(`❌ [add_role_to_member]`, error.message);
        return `❌ Erreur: ${error.message}`;
      }
    },
  });

  server.addTool({
    name: 'remove_role_from_member',
    description: "Retire un rôle d'un membre",
    parameters: RemoveRoleFromMemberSchema,
    execute: async args => {
      try {
        console.error(`➖ [remove_role_from_member] User: ${args.userId}, Role: ${args.roleId}`);
        const client = await ensureDiscordConnection();
        const result = await removeRoleFromMember(client, args);
        return result;
      } catch (error: any) {
        console.error(`❌ [remove_role_from_member]`, error.message);
        return `❌ Erreur: ${error.message}`;
      }
    },
  });

  server.addTool({
    name: 'get_member_roles',
    description: "Affiche les rôles d'un membre",
    parameters: GetMemberRolesSchema,
    execute: async args => {
      try {
        console.error(`📋 [get_member_roles] User: ${args.userId}`);
        const client = await ensureDiscordConnection();
        const result = await getMemberRoles(client, args);
        return result;
      } catch (error: any) {
        console.error(`❌ [get_member_roles]`, error.message);
        return `❌ Erreur: ${error.message}`;
      }
    },
  });
}
