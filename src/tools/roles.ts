/**
 * Outils MCP unifiés pour la gestion des rôles
 * Fusionne: roleManager, registerRoles
 */

import { z } from 'zod';
import type { FastMCP } from 'fastmcp';
import { Role } from 'discord.js';
import Logger from '../utils/logger.js';
import { ensureDiscordConnection } from './common.js';

// ============================================================================
// ENREGISTREMENT DES OUTILS
// ============================================================================

export function registerRoleTools(server: FastMCP) {
  // ========================================================================
  // 1. LISTE DES RÔLES
  // ========================================================================

  server.addTool({
    name: 'list_roles',
    description: 'Liste tous les rôles du serveur',
    parameters: z.object({
      includePermissions: z.boolean().optional().default(false).describe('Inclure les permissions'),
    }),
    execute: async args => {
      try {
        const client = await ensureDiscordConnection();
        const guild = client.guilds.cache.first();

        if (!guild) {
          return '❌ Aucun serveur disponible';
        }

        await guild.roles.fetch();

        const roles = Array.from(guild.roles.cache.values())
          .sort((a, b) => b.position - a.position)
          .filter(r => r.name !== '@everyone');

        const list = roles
          .map(r => {
            const permissions = args.includePermissions
              ? `\n   Permissions: ${r.permissions.toArray().join(', ')}`
              : '';
            return `• **${r.name}** (${r.id})${r.color ? ` 🎨 ${r.hexColor}` : ''}${permissions}`;
          })
          .join('\n');

        return `📋 **${roles.length} rôles**:\n\n${list}`;
      } catch (error: any) {
        Logger.error('❌ [list_roles]', error.message);
        return `❌ Erreur: ${error.message}`;
      }
    },
  });

  // ========================================================================
  // 2. CRÉER UN RÔLE
  // ========================================================================

  server.addTool({
    name: 'create_role',
    description: 'Crée un nouveau rôle',
    parameters: z.object({
      name: z.string().describe('Nom du rôle'),
      color: z.string().optional().describe('Couleur en hex (#RRGGBB)'),
      hoist: z.boolean().optional().default(false).describe('Afficher séparément'),
      mentionable: z.boolean().optional().default(false).describe('Mentionnable'),
      permissions: z.array(z.string()).optional().describe('Liste des permissions'),
    }),
    execute: async args => {
      try {
        const client = await ensureDiscordConnection();
        const guild = client.guilds.cache.first();

        if (!guild) {
          return '❌ Aucun serveur disponible';
        }

        const roleData: any = {
          name: args.name,
          hoist: args.hoist,
          mentionable: args.mentionable,
        };

        if (args.color) {
          roleData.color = parseInt(args.color.replace('#', ''), 16);
        }

        if (args.permissions) {
          roleData.permissions = args.permissions;
        }

        const role = await guild.roles.create(roleData);

        Logger.info(`✅ Rôle ${role.name} créé`);

        return `✅ Rôle **${role.name}** créé (ID: ${role.id})`;
      } catch (error: any) {
        Logger.error('❌ [create_role]', error.message);
        return `❌ Erreur: ${error.message}`;
      }
    },
  });

  // ========================================================================
  // 3. MODIFIER UN RÔLE
  // ========================================================================

  server.addTool({
    name: 'edit_role',
    description: 'Modifie un rôle existant',
    parameters: z.object({
      roleId: z.string().describe('ID du rôle'),
      name: z.string().optional().describe('Nouveau nom'),
      color: z.string().optional().describe('Nouvelle couleur en hex (#RRGGBB)'),
      hoist: z.boolean().optional().describe('Afficher séparément'),
      mentionable: z.boolean().optional().describe('Mentionnable'),
    }),
    execute: async args => {
      try {
        const client = await ensureDiscordConnection();
        const guild = client.guilds.cache.first();

        if (!guild) {
          return '❌ Aucun serveur disponible';
        }

        const role = await guild.roles.fetch(args.roleId).catch(() => null);
        if (!role) {
          return `❌ Rôle ${args.roleId} introuvable`;
        }

        const updateData: any = {};
        if (args.name !== undefined) updateData.name = args.name;
        if (args.color !== undefined) updateData.color = parseInt(args.color.replace('#', ''), 16);
        if (args.hoist !== undefined) updateData.hoist = args.hoist;
        if (args.mentionable !== undefined) updateData.mentionable = args.mentionable;

        await role.edit(updateData);

        Logger.info(`✅ Rôle ${role.name} modifié`);

        return `✅ Rôle **${role.name}** modifié`;
      } catch (error: any) {
        Logger.error('❌ [edit_role]', error.message);
        return `❌ Erreur: ${error.message}`;
      }
    },
  });

  // ========================================================================
  // 4. SUPPRIMER UN RÔLE
  // ========================================================================

  server.addTool({
    name: 'delete_role',
    description: 'Supprime un rôle',
    parameters: z.object({
      roleId: z.string().describe('ID du rôle à supprimer'),
    }),
    execute: async args => {
      try {
        const client = await ensureDiscordConnection();
        const guild = client.guilds.cache.first();

        if (!guild) {
          return '❌ Aucun serveur disponible';
        }

        const role = await guild.roles.fetch(args.roleId).catch(() => null);
        if (!role) {
          return `❌ Rôle ${args.roleId} introuvable`;
        }

        if (role.name === '@everyone') {
          return '❌ Impossible de supprimer le rôle @everyone';
        }

        await role.delete();

        Logger.info(`✅ Rôle ${role.name} supprimé`);

        return `✅ Rôle **${role.name}** supprimé`;
      } catch (error: any) {
        Logger.error('❌ [delete_role]', error.message);
        return `❌ Erreur: ${error.message}`;
      }
    },
  });

  // ========================================================================
  // 5. DÉFINIR LES PERMISSIONS D'UN RÔLE
  // ========================================================================

  server.addTool({
    name: 'set_role_permissions',
    description: "Définit les permissions d'un rôle",
    parameters: z.object({
      roleId: z.string().describe('ID du rôle'),
      permissions: z.array(z.string()).describe('Liste des permissions à accorder'),
      reset: z.boolean().optional().default(false).describe('Reset les permissions existantes'),
    }),
    execute: async args => {
      try {
        const client = await ensureDiscordConnection();
        const guild = client.guilds.cache.first();

        if (!guild) {
          return '❌ Aucun serveur disponible';
        }

        const role = await guild.roles.fetch(args.roleId).catch(() => null);
        if (!role) {
          return `❌ Rôle ${args.roleId} introuvable`;
        }

        if (args.reset) {
          await role.setPermissions(args.permissions);
        } else {
          await role.permissions.add(args.permissions);
        }

        Logger.info(`✅ Permissions du rôle ${role.name} modifiées`);

        return `✅ Permissions du rôle **${role.name}** modifiées`;
      } catch (error: any) {
        Logger.error('❌ [set_role_permissions]', error.message);
        return `❌ Erreur: ${error.message}`;
      }
    },
  });

  Logger.info('✅ Outils roles enregistrés (5 outils)');
}
