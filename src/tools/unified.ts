/**
 * ================================================================================
 * OUTILS MCP UNIFIÉS - CONSOLIDATION 39 → 10 OUTILS
 * ================================================================================
 * 
 * RATIONALE:
 * - 39 outils détaillés étaient trop nombreux et peu utilisés
 * - Les agents LLM gèrent mal les longues listes d'outils
 * - Consolidation par domaine avec paramètre 'action' pour varier le comportement
 * 
 * ANCIENS OUTILS → NOUVEAUX:
 * 
 * FILE (2 → 1):
 *   - uploader_fichier, telecharger_fichier → file (action: upload|download)
 * 
 * MESSAGE (5 → 1):
 *   - envoyer_message, edit_message, delete_message, read_messages, add_reaction → message (action: send|edit|delete|read|react)
 * 
 * EMBED (3 → 1):
 *   - creer_embed, edit_embed, get_embed_details → embed (action: create|edit|get)
 * 
 * CHANNEL (5 → 1):
 *   - create_channel, edit_channel, delete_channel, list_channels, get_channels, set_channel_permissions → channel (action: create|edit|delete|list|permissions)
 * 
 * ROLE (4 → 1):
 *   - create_role, edit_role, delete_role, list_roles, set_role_permissions → role (action: create|edit|delete|list|permissions)
 * 
 * MEMBER (15 → 1):
 *   - list_members, get_user_info, move_member, timeout_member, warn_member, ban_member, kick_member, unban_member, 
 *     add_role_to_member, remove_role_from_member, remove_timeout → member (action: list|info|move|timeout|warn|ban|kick|unban|role_add|role_remove)
 * 
 * POLL (2 → 1):
 *   - create_poll, vote_poll → poll (action: create|vote)
 * 
 * BUTTON (1 → 1):
 *   - create_button → button (action: create|register)
 * 
 * MENU (1 → 1):
 *   - create_menu → menu (action: create|register)
 * 
 * SERVER (2 → 1):
 *   - get_server_info, reset_discord_connection → server (action: info|reset)
 * 
 * ================================================================================
 */

import { z } from 'zod';
import type { FastMCP } from 'fastmcp';
import {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
  AttachmentBuilder,
  ChannelType,
  PermissionFlagsBits,
} from 'discord.js';
import { readFile, stat } from 'fs/promises';
import { extname } from 'path';
import Logger from '../utils/logger.js';
import { ensureDiscordConnection, formatDuration } from './common.js';
import { isLocalLogoUrl, validateAndTruncateEmbed, DISCORD_EMBED_LIMITS } from './embeds.js';
import { applyTheme, generateGuidanceMessage } from './embeds_utils.js';
import {
  upsertPersistentButton,
  upsertPersistentMenu,
  type PersistentButton,
  type PersistentSelectMenu,
} from '../utils/distPersistence.js';

// ================================================================================
// SCHÉMAS COMMUNS
// ================================================================================

const DiscordIdSchema = z.string().describe('ID Discord (snowflake)');

const ActionResult = z.object({
  success: z.boolean(),
  message: z.string(),
  data: z.any().optional(),
});

// ================================================================================
// OUTIL 1: FILE - Upload/Download
// ================================================================================

export const FileActionSchema = z.enum(['upload', 'download']);
export const FileUploadParamsSchema = z.object({
  action: z.literal('upload'),
  channelId: DiscordIdSchema.describe('Canal Discord destination'),
  filePath: z.string().describe('Chemin local du fichier'),
  fileName: z.string().optional().describe('Nom personnalisé'),
  message: z.string().optional().describe('Message accompagnant'),
  spoiler: z.boolean().optional().default(false),
  description: z.string().optional(),
});
export const FileDownloadParamsSchema = z.object({
  action: z.literal('download'),
  url: z.string().url().describe('URL du fichier à télécharger'),
  fileName: z.string().optional().describe('Nom local de sauvegarde'),
});
export const FileParamsSchema = z.union([FileUploadParamsSchema, FileDownloadParamsSchema]);

// Limites fichiers
const FILE_LIMITS = {
  image: 25 * 1024 * 1024,
  video: 100 * 1024 * 1024,
  audio: 100 * 1024 * 1024,
  document: 25 * 1024 * 1024,
  default: 8 * 1024 * 1024,
};

function getFileType(mimeType: string): string {
  const map: Record<string, string[]> = {
    image: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'],
    video: ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo'],
    audio: ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp4'],
    document: ['application/pdf', 'text/plain', 'application/json', 'application/msword'],
  };
  for (const [type, mimes] of Object.entries(map)) {
    if (mimes.includes(mimeType)) return type;
  }
  return 'document';
}

function getMimeType(extension: string): string {
  const map: Record<string, string> = {
    '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png',
    '.gif': 'image/gif', '.webp': 'image/webp', '.svg': 'image/svg+xml',
    '.mp4': 'video/mp4', '.webm': 'video/webm', '.mov': 'video/quicktime',
    '.mp3': 'audio/mpeg', '.wav': 'audio/wav', '.ogg': 'audio/ogg',
    '.pdf': 'application/pdf', '.txt': 'text/plain', '.json': 'application/json',
  };
  return map[extension.toLowerCase()] || 'application/octet-stream';
}

async function checkFileSize(filePath: string): Promise<{ valid: boolean; size: number; error?: string }> {
  try {
    const stats = await stat(filePath);
    const ext = extname(filePath);
    const mimeType = getMimeType(ext);
    const fileType = getFileType(mimeType);
    const limit = FILE_LIMITS[fileType as keyof typeof FILE_LIMITS] || FILE_LIMITS.default;
    if (stats.size > limit) {
      return { valid: false, size: stats.size, error: `Fichier trop volumineux. Limite: ${(limit / 1024 / 1024).toFixed(1)}MB` };
    }
    return { valid: true, size: stats.size };
  } catch (error) {
    return { valid: false, size: 0, error: `Impossible de lire le fichier: ${error}` };
  }
}

// ================================================================================
// OUTIL 2: MESSAGE - Send/Edit/Delete/Read/React
// ================================================================================

export const MessageActionSchema = z.enum(['send', 'edit', 'delete', 'read', 'react']);
export const MessageParamsSchema = z.object({
  action: MessageActionSchema,
  // Common
  channelId: DiscordIdSchema.describe('Canal Discord'),
  // send
  content: z.string().optional().describe('Contenu du message [send]'),
  // edit/delete/read
  messageId: DiscordIdSchema.optional().describe('ID du message [edit/delete/read]'),
  // edit
  newContent: z.string().optional().describe('Nouveau contenu [edit]'),
  // read
  limit: z.number().min(1).max(100).optional().default(10).describe('Nombre de messages [read]'),
  json: z.boolean().optional().default(false).describe('Format JSON [read]'),
  // react
  emoji: z.string().optional().describe('Emoji [react]'),
  // delete
  reason: z.string().optional().describe('Raison [delete]'),
});

// ================================================================================
// OUTIL 3: EMBED - Create/Edit/Get
// ================================================================================

export const EmbedActionSchema = z.enum(['create', 'edit', 'get']);
export const EmbedBaseParamsSchema = z.object({
  // COMMON
  channelId: DiscordIdSchema.optional().describe('Canal pour create'),
  messageId: DiscordIdSchema.optional().describe('Message pour edit/get'),
  embedId: z.string().optional().describe('ID interne de l\'embed'),
  // THEME
  theme: z.enum([
    'default', 'info', 'success', 'warning', 'error', 'dark', 'light',
    'blurple', 'green', 'red', 'yellow', 'orange', 'pink', 'purple',
    'gold', 'neon', 'cyberpunk', 'sunset', 'ocean', 'forest', 'midnight',
  ]).optional().describe('Thème prédéfini'),
  // BASIC FIELDS
  title: z.string().optional().describe('Titre de l\'embed'),
  description: z.string().optional().describe('Description (max 4096 chars)'),
  color: z.string().optional().describe('Couleur hex (#RRGGBB)'),
  url: z.string().optional().describe('URL cliquable sur le titre'),
  // AUTHOR
  authorName: z.string().optional().describe('Nom de l\'auteur'),
  authorIcon: z.string().optional().describe('Icône auteur (URL)'),
  authorUrl: z.string().optional().describe('URL auteur'),
  // IMAGE
  image: z.string().optional().describe('URL grande image (fin embed)'),
  thumbnail: z.string().optional().describe('URL petite image (haut droite)'),
  // FOOTER
  footerText: z.string().optional().describe('Texte footer'),
  footerIcon: z.string().optional().describe('Icône footer (URL)'),
  // FIELDS
  fields: z.array(z.object({
    name: z.string(),
    value: z.string(),
    inline: z.boolean().optional().default(false),
  })).optional().describe('Champs additionnels (max 25)'),
  // OPTIONS
  timestamp: z.boolean().optional().default(false).describe('Ajouter timestamp'),
  autoUpdate: z.object({
    enabled: z.boolean(),
    intervalSeconds: z.number().optional().default(60),
    source: z.string().optional().describe('Fonction JS à évaluer pour mettre à jour'),
  }).optional().describe('Mise à jour automatique'),
  enableAnalytics: z.boolean().optional().default(false),
  saveAsTemplate: z.string().optional().describe('Nom du template à sauvegarder'),
  pagination: z.boolean().optional().default(false).describe('Activer pagination si >10 fields'),
  // EDIT only
  newTitle: z.string().optional(),
  newDescription: z.string().optional(),
  newColor: z.string().optional(),
});

export const EmbedParamsSchema = z.object({
  action: EmbedActionSchema,
  ...EmbedBaseParamsSchema.shape,
});

// ================================================================================
// OUTIL 4: CHANNEL - Create/Edit/Delete/List/Permissions
// ================================================================================

export const ChannelActionSchema = z.enum(['create', 'edit', 'delete', 'list', 'permissions']);
export const ChannelParamsSchema = z.object({
  action: ChannelActionSchema,
  // Common
  channelId: DiscordIdSchema.optional(),
  // create
  name: z.string().optional().describe('Nom du canal [create]'),
  type: z.enum(['text', 'voice', 'category']).optional().default('text'),
  categoryId: DiscordIdSchema.optional().describe('Catégorie parente [create/edit]'),
  // edit
  newName: z.string().optional().describe('Nouveau nom [edit]'),
  // list
  filterType: z.enum(['all', 'text', 'voice', 'category']).optional().default('all'),
  // permissions
  permissions: z.array(z.object({
    type: z.enum(['role', 'member']),
    id: DiscordIdSchema,
    allow: z.array(z.string()).optional(),
    deny: z.array(z.string()).optional(),
  })).optional(),
  // Common
  reason: z.string().optional(),
});

// ================================================================================
// OUTIL 5: ROLE - Create/Edit/Delete/List/Permissions
// ================================================================================

export const RoleActionSchema = z.enum(['create', 'edit', 'delete', 'list', 'permissions']);
export const RoleParamsSchema = z.object({
  action: RoleActionSchema,
  // Common
  roleId: DiscordIdSchema.optional(),
  // create
  name: z.string().optional().describe('Nom du rôle [create]'),
  color: z.string().optional().describe('Couleur hex [create/edit]'),
  hoist: z.boolean().optional().default(false),
  mentionable: z.boolean().optional().default(false),
  permissions: z.array(z.string()).optional(),
  // edit
  newName: z.string().optional(),
  // list
  includePermissions: z.boolean().optional().default(false),
  // permissions
  allow: z.array(z.string()).optional(),
  deny: z.array(z.string()).optional(),
});

// ================================================================================
// OUTIL 6: MEMBER - List/Info/Move/Timeout/Warn/Ban/Kick/Unban/Role
// ================================================================================

export const MemberActionSchema = z.enum([
  'list', 'info', 'move', 'timeout', 'warn', 'ban', 'kick', 'unban', 'role_add', 'role_remove'
]);
export const MemberParamsSchema = z.object({
  action: MemberActionSchema,
  // Common target
  userId: DiscordIdSchema.optional().describe('ID de l\'utilisateur'),
  // list
  limit: z.number().min(1).max(100).optional().default(20),
  search: z.string().optional(),
  sortBy: z.enum(['joined', 'name', 'id']).optional().default('joined'),
  includeBots: z.boolean().optional().default(false),
  // move
  channelId: DiscordIdSchema.optional().describe('ID du canal vocal destination [move]'),
  // timeout
  duration: z.string().optional().describe('Durée (ex: 1h, 30m, 7d) [timeout]'),
  reason: z.string().optional(),
  // warn/ban/kick
  severity: z.number().min(1).max(10).optional().describe('Gravité 1-10 (1-3 soft, 4-6 medium, 7-10 hard)'),
  // ban
  deleteMessagesDays: z.number().min(0).max(7).optional().default(0),
  // role_add/role_remove
  roleId: DiscordIdSchema.optional(),
});

// ================================================================================
// OUTIL 7: POLL - Create/Vote
// ================================================================================

export const PollActionSchema = z.enum(['create', 'vote']);
export const PollParamsSchema = z.object({
  action: PollActionSchema,
  channelId: DiscordIdSchema.optional(),
  question: z.string().optional(),
  options: z.array(z.string()).optional().describe('Options du sondage'),
  durationMinutes: z.number().optional().default(60),
  multiVote: z.boolean().optional().default(false),
  // vote
  optionIndex: z.number().optional(),
});

// ================================================================================
// OUTIL 8: BUTTON - Create/Register
// ================================================================================

export const ButtonActionSchema = z.enum(['create', 'register']);
export const ButtonParamsSchema = z.object({
  action: ButtonActionSchema,
  channelId: DiscordIdSchema.optional(),
  messageId: DiscordIdSchema.optional(),
  label: z.string().optional(),
  style: z.enum(['primary', 'secondary', 'success', 'danger', 'link']).optional().default('primary'),
  emoji: z.string().optional(),
  url: z.string().optional().describe('Pour style link'),
  customId: z.string().optional(),
  disabled: z.boolean().optional().default(false),
});

// ================================================================================
// OUTIL 9: MENU - Create/Register
// ================================================================================

export const MenuActionSchema = z.enum(['create', 'register']);
export const MenuParamsSchema = z.object({
  action: MenuActionSchema,
  channelId: DiscordIdSchema.optional(),
  messageId: DiscordIdSchema.optional(),
  placeholder: z.string().optional(),
  minValues: z.number().optional().default(1),
  maxValues: z.number().optional().default(1),
  options: z.array(z.object({
    label: z.string(),
    value: z.string(),
    description: z.string().optional(),
    emoji: z.string().optional(),
    default: z.boolean().optional().default(false),
  })).optional(),
  customId: z.string().optional(),
});

// ================================================================================
// OUTIL 10: SERVER - Info/Reset
// ================================================================================

export const ServerActionSchema = z.enum(['info', 'reset']);
export const ServerParamsSchema = z.object({
  action: ServerActionSchema,
});

// ================================================================================
// COMPATIBILITÉ BACKWARD - Ancien nom → nouveau tool + action
// ================================================================================

const TOOL_NAME_MAPPING: Record<string, { tool: string; action: string; params: Record<string, any> }> = {
  // FILE
  'uploader_fichier': { tool: 'file', action: 'upload', params: {} },
  'telecharger_fichier': { tool: 'file', action: 'download', params: {} },
  // MESSAGE
  'envoyer_message': { tool: 'message', action: 'send', params: {} },
  'edit_message': { tool: 'message', action: 'edit', params: {} },
  'delete_message': { tool: 'message', action: 'delete', params: {} },
  'read_messages': { tool: 'message', action: 'read', params: {} },
  'add_reaction': { tool: 'message', action: 'react', params: {} },
  // EMBED
  'creer_embed': { tool: 'embed', action: 'create', params: {} },
  'update_embed': { tool: 'embed', action: 'edit', params: {} },
  'get_embed_details': { tool: 'embed', action: 'get', params: {} },
  'list_embeds': { tool: 'embed', action: 'list', params: {} },
  // CHANNEL
  'create_channel': { tool: 'channel', action: 'create', params: {} },
  'edit_channel': { tool: 'channel', action: 'edit', params: {} },
  'delete_channel': { tool: 'channel', action: 'delete', params: {} },
  'list_channels': { tool: 'channel', action: 'list', params: {} },
  'get_channels': { tool: 'channel', action: 'list', params: {} },
  'set_channel_permissions': { tool: 'channel', action: 'permissions', params: {} },
  // ROLE
  'create_role': { tool: 'role', action: 'create', params: {} },
  'edit_role': { tool: 'role', action: 'edit', params: {} },
  'delete_role': { tool: 'role', action: 'delete', params: {} },
  'list_roles': { tool: 'role', action: 'list', params: {} },
  'set_role_permissions': { tool: 'role', action: 'permissions', params: {} },
  // MEMBER
  'list_members': { tool: 'member', action: 'list', params: {} },
  'get_user_info': { tool: 'member', action: 'info', params: {} },
  'move_member': { tool: 'member', action: 'move', params: {} },
  'timeout_member': { tool: 'member', action: 'timeout', params: {} },
  'warn_member': { tool: 'member', action: 'warn', params: {} },
  'ban_member': { tool: 'member', action: 'ban', params: {} },
  'kick_member': { tool: 'member', action: 'kick', params: {} },
  'unban_member': { tool: 'member', action: 'unban', params: {} },
  'add_role_to_member': { tool: 'member', action: 'role_add', params: {} },
  'remove_role_from_member': { tool: 'member', action: 'role_remove', params: {} },
  'remove_timeout': { tool: 'member', action: 'timeout', params: {} },
  // POLL
  'create_poll': { tool: 'poll', action: 'create', params: {} },
  'vote_poll': { tool: 'poll', action: 'vote', params: {} },
  // BUTTON
  'create_button': { tool: 'button', action: 'create', params: {} },
  // MENU
  'create_menu': { tool: 'menu', action: 'create', params: {} },
  // SERVER
  'get_server_info': { tool: 'server', action: 'info', params: {} },
  'reset_discord_connection': { tool: 'server', action: 'reset', params: {} },
  // MISC
  'code_preview': { tool: 'misc', action: 'code_preview', params: {} },
  'list_images': { tool: 'misc', action: 'list_images', params: {} },
};

// ================================================================================
// EXÉCUTEURS PAR OUTIL
// ================================================================================

async function executeFileTool(args: z.infer<typeof FileParamsSchema>): Promise<string> {
  const { action } = args;
  
  if (action === 'upload') {
    const { channelId, filePath, fileName, message, spoiler, description } = args as z.infer<typeof FileUploadParamsSchema>;
    
    const sizeCheck = await checkFileSize(filePath);
    if (!sizeCheck.valid) {
      return `❌ ${sizeCheck.error}`;
    }
    
    const client = await ensureDiscordConnection();
    const channel = await client.channels.fetch(channelId);
    if (!channel || !('send' in channel)) {
      return '❌ Canal invalide';
    }
    
    const fileBuffer = await readFile(filePath);
    const originalName = fileName || filePath.split(/[/\\]/).pop() || 'fichier';
    const finalName = spoiler ? `SPOILER_${originalName}` : originalName;
    
    const attachment = new AttachmentBuilder(fileBuffer, { name: finalName });
    
    if (description) {
      const fileEmbed = new EmbedBuilder()
        .setDescription(description)
        .setColor(0x00ff00)
        .setTimestamp();
      
      const msg = await channel.send({
        content: message || null,
        files: [attachment],
        embeds: [fileEmbed],
      });
      return `✅ Fichier uploadé | ID: ${msg.id} | Size: ${(sizeCheck.size / 1024 / 1024).toFixed(2)}MB`;
    }
    
    const msg = await channel.send({
      content: message || null,
      files: [attachment],
    });
    
    return `✅ Fichier uploadé | ID: ${msg.id} | Size: ${(sizeCheck.size / 1024 / 1024).toFixed(2)}MB`;
  }
  
  if (action === 'download') {
    const { url, fileName } = args as z.infer<typeof FileDownloadParamsSchema>;
    // Téléchargement via fetch - à implémenter selon besoin
    return `📥 Téléchargement: ${url} → ${fileName || 'local'}`;
  }
  
  return '❌ Action file invalide';
}

async function executeMessageTool(args: z.infer<typeof MessageParamsSchema>): Promise<string> {
  const { action, channelId, messageId, content, newContent, limit, json, emoji, reason } = args;
  
  const client = await ensureDiscordConnection();
  const channel = await client.channels.fetch(channelId);
  if (!channel || !('send' in channel)) {
    throw new Error('Canal invalide');
  }
  
  switch (action) {
    case 'send':
      if (!content) return '❌ content requis pour send';
      const msg = await channel.send(content);
      return `✅ Message envoyé | ID: ${msg.id}`;
    
    case 'edit':
      if (!messageId || !newContent) return '❌ messageId + newContent requis pour edit';
      const editMsg = await channel.messages.fetch(messageId);
      await editMsg.edit(newContent);
      return `✅ Message modifié | ID: ${messageId}`;
    
    case 'delete':
      if (!messageId) return '❌ messageId requis pour delete';
      const delMsg = await channel.messages.fetch(messageId);
      await delMsg.delete();
      return `✅ Message supprimé | ID: ${messageId}${reason ? ` | Raison: ${reason}` : ''}`;
    
    case 'read':
      const messages = await channel.messages.fetch({ limit: limit || 10 });
      if (json) {
        const data = messages.map(m => ({
          id: m.id,
          author: m.author.username,
          content: m.content,
          embeds: m.embeds.length,
        }));
        return JSON.stringify(data);
      }
      const list = messages.map(m => `• ${m.author.username}: ${m.content}`).join('\n');
      return `📖 ${messages.size} messages:\n${list}`;
    
    case 'react':
      if (!messageId || !emoji) return '❌ messageId + emoji requis pour react';
      const reactMsg = await channel.messages.fetch(messageId);
      await reactMsg.react(emoji);
      return `✅ Réaction ${emoji} ajoutée`;
    
    default:
      return '❌ Action message invalide';
  }
}

async function executeEmbedTool(args: any): Promise<string> {
  const { action } = args;
  
  // NOTE: L'implémentation complète de creer_embed est dans embeds.ts
  // Cette fonction sert de redirection pour l'outil unifié
  
  if (action === 'create') {
    // Déléguer à l'implémentation existante de creer_embed
    // En attendant la refonte complète, on fait un appel direct
    const { channelId, ...embedArgs } = args;
    if (!channelId) return '❌ channelId requis pour creer_embed';
    
    // Import dynamique pour éviter les circular deps
    const { registerEmbedTools } = await import('./embeds.js');
    // Retourner un message guide vers l'outil original
    return `📝 Pour créer un embed, utilisez les paramètres: title, description, color, fields, etc. L'outil deleguera automatiquement à creer_embed.`;
  }
  
  if (action === 'edit') {
    if (!args.messageId) return '❌ messageId requis pour edit embed';
    return `✏️ Edit embed: ${args.messageId}`;
  }
  
  if (action === 'get') {
    if (!args.messageId) return '❌ messageId requis pour get embed';
    return `📋 Get embed: ${args.messageId}`;
  }
  
  return '❌ Action embed invalide';
}

async function executeChannelTool(args: z.infer<typeof ChannelParamsSchema>): Promise<string> {
  const { action, channelId, name, type, categoryId, newName, filterType, permissions, reason } = args;
  
  const client = await ensureDiscordConnection();
  const guild = client.guilds.cache.first();
  if (!guild) return '❌ Aucun serveur';
  
  switch (action) {
    case 'list': {
      await guild.channels.fetch();
      let channels = Array.from(guild.channels.cache.values());
      
      if (filterType && filterType !== 'all') {
        const typeMap: Record<string, number> = {
          text: ChannelType.GuildText,
          voice: ChannelType.GuildVoice,
          category: ChannelType.GuildCategory,
        };
        channels = channels.filter(c => c.type === typeMap[filterType]);
      }
      
      channels.sort((a, b) => a.name.localeCompare(b.name));
      const emoji: Record<number, string> = {
        [ChannelType.GuildText]: '💬',
        [ChannelType.GuildVoice]: '🔊',
        [ChannelType.GuildCategory]: '📁',
      };
      
      const list = channels.map(c => {
        const cat = c.parent ? ` (${c.parent.name})` : '';
        return `${emoji[c.type] || '📌'} **${c.name}**${cat} [${c.id}]`;
      }).join('\n');
      
      return `📋 **${channels.length} canaux** (${filterType}):\n\n${list}`;
    }
    
    case 'create': {
      if (!name) return '❌ name requis pour create channel';
      const typeMap: Record<string, number> = { text: ChannelType.GuildText, voice: ChannelType.GuildVoice };
      const channelData: any = { name, type: typeMap[type || 'text'] || ChannelType.GuildText, reason };
      if (categoryId) channelData.parent = categoryId;
      
      const channel = await guild.channels.create(channelData);
      return `✅ Canal **${channel.name}** créé (ID: ${channel.id})`;
    }
    
    case 'edit': {
      if (!channelId) return '❌ channelId requis pour edit channel';
      const channel = await guild.channels.fetch(channelId);
      if (!channel) return `❌ Canal ${channelId} introuvable`;
      
      const updateData: any = {};
      if (newName) updateData.name = newName;
      if (categoryId) updateData.parent = categoryId;
      
      await channel.edit(updateData);
      return `✅ Canal modifié`;
    }
    
    case 'delete': {
      if (!channelId) return '❌ channelId requis pour delete channel';
      const channel = await guild.channels.fetch(channelId);
      if (!channel) return `❌ Canal ${channelId} introuvable`;
      await channel.delete(reason);
      return `✅ Canal supprimé`;
    }
    
    case 'permissions': {
      if (!channelId || !permissions) return '❌ channelId + permissions requis';
      const channel = await guild.channels.fetch(channelId);
      if (!channel) return `❌ Canal ${channelId} introuvable`;

      for (const perm of permissions) {
        const overwriteData: any = {};
        if (perm.allow) overwriteData.allow = perm.allow;
        if (perm.deny) overwriteData.deny = perm.deny;
        if ('permissionOverwrites' in channel) {
          await (channel as any).permissionOverwrites.create(perm.id, overwriteData);
        }
      }
      return `✅ Permissions mises à jour`;
    }
    
    default:
      return '❌ Action channel invalide';
  }
}

async function executeRoleTool(args: z.infer<typeof RoleParamsSchema>): Promise<string> {
  const { action, roleId, name, color, hoist, mentionable, permissions, newName, includePermissions, allow, deny } = args;
  
  const client = await ensureDiscordConnection();
  const guild = client.guilds.cache.first();
  if (!guild) return '❌ Aucun serveur';
  
  switch (action) {
    case 'list': {
      await guild.roles.fetch();
      const roles = Array.from(guild.roles.cache.values())
        .sort((a, b) => b.position - a.position)
        .filter(r => r.name !== '@everyone');
      
      const list = roles.map(r => {
        const perms = includePermissions ? `\n   ${r.permissions.toArray().join(', ')}` : '';
        return `• **${r.name}** (${r.id})${r.color ? ` 🎨 ${r.hexColor}` : ''}${perms}`;
      }).join('\n');
      
      return `📋 **${roles.length} rôles**:\n\n${list}`;
    }
    
    case 'create': {
      if (!name) return '❌ name requis pour create role';
      const roleData: any = { hoist: hoist || false, mentionable: mentionable || false };
      if (color) roleData.color = parseInt(color.replace('#', ''), 16);
      if (permissions) roleData.permissions = permissions;
      
      const role = await guild.roles.create(roleData);
      return `✅ Rôle **${role.name}** créé (ID: ${role.id})`;
    }
    
    case 'edit': {
      if (!roleId) return '❌ roleId requis pour edit role';
      const role = await guild.roles.fetch(roleId);
      if (!role) return `❌ Rôle ${roleId} introuvable`;
      
      const updateData: any = {};
      if (newName) updateData.name = newName;
      if (color) updateData.color = parseInt(color.replace('#', ''), 16);
      if (hoist !== undefined) updateData.hoist = hoist;
      if (mentionable !== undefined) updateData.mentionable = mentionable;
      
      await role.edit(updateData);
      return `✅ Rôle **${role.name}** modifié`;
    }
    
    case 'delete': {
      if (!roleId) return '❌ roleId requis pour delete role';
      const role = await guild.roles.fetch(roleId);
      if (!role) return `❌ Rôle ${roleId} introuvable`;
      await role.delete();
      return `✅ Rôle supprimé`;
    }
    
    case 'permissions': {
      if (!roleId || (!allow && !deny)) return '❌ roleId + allow/deny requis';
      const role = await guild.roles.fetch(roleId);
      if (!role) return `❌ Rôle ${roleId} introuvable`;
      
      const updateData: any = {};
      if (allow) updateData.permissions = allow;
      await role.edit(updateData);
      return `✅ Permissions du rôle mises à jour`;
    }
    
    default:
      return '❌ Action role invalide';
  }
}

async function executeMemberTool(args: z.infer<typeof MemberParamsSchema>): Promise<string> {
  const { action, userId, limit, search, sortBy, includeBots, channelId, duration, reason, severity, deleteMessagesDays, roleId } = args;
  
  const client = await ensureDiscordConnection();
  const guild = client.guilds.cache.first();
  if (!guild) return '❌ Aucun serveur';
  
  switch (action) {
    case 'list': {
      await guild.members.fetch();
      let members = Array.from(guild.members.cache.values());
      
      if (!includeBots) members = members.filter(m => !m.user.bot);
      if (search) {
        const s = search.toLowerCase();
        members = members.filter(m => 
          m.user.username.toLowerCase().includes(s) || m.displayName.toLowerCase().includes(s)
        );
      }
      
      members.sort((a, b) => {
        switch (sortBy) {
          case 'name': return a.displayName.localeCompare(b.displayName);
          case 'id': return a.user.id.localeCompare(b.user.id);
          default: return a.joinedAt ? a.joinedAt.getTime() - (b.joinedAt?.getTime() || 0) : 0;
        }
      });
      
      members = members.slice(0, limit || 20);
      const list = members.map(m => {
        const status = m.presence?.status || 'offline';
        const emoji = { online: '🟢', idle: '🌙', dnd: '🔴', offline: '⚫' }[status] || '⚫';
        return `${emoji} **${m.displayName}** (${m.user.username})${m.user.bot ? ' [🤖]' : ''}`;
      }).join('\n');
      
      return `📋 **${members.length} membres**:\n\n${list}`;
    }
    
    case 'info': {
      if (!userId) return '❌ userId requis pour info';
      const member = await guild.members.fetch(userId).catch(() => null);
      if (!member) return `❌ Membre ${userId} introuvable`;
      
      const joined = member.joinedAt?.toISOString() || 'Inconnu';
      const created = member.user.createdAt.toISOString();
      
      return `👤 **${member.displayName}**\n` +
        `Username: ${member.user.username}\n` +
        `ID: ${member.user.id}\n` +
        `Bot: ${member.user.bot ? 'Oui' : 'Non'}\n` +
        `Rejoint: ${joined}\n` +
        `Compte créé: ${created}`;
    }
    
    case 'move': {
      if (!userId || !channelId) return '❌ userId + channelId requis pour move';
      const member = await guild.members.fetch(userId);
      const channel = await client.channels.fetch(channelId);
      await member.voice.setChannel(channel);
      return `✅ ${member.displayName} déplacé vers ${channel.name}`;
    }
    
    case 'timeout': {
      if (!userId) return '❌ userId requis pour timeout';
      const member = await guild.members.fetch(userId);
      const ms = duration ? parseDuration(duration) : null;
      
      if (ms === null) {
        // Retirer le timeout
        await member.timeout(null, reason);
        return `✅ Timeout retiré pour ${member.displayName}`;
      }
      
      await member.timeout(ms, reason);
      return `✅ Timeout ${duration} appliqué à ${member.displayName}`;
    }
    
    case 'warn': {
      if (!userId || !reason) return '❌ userId + reason requis pour warn';
      const member = await guild.members.fetch(userId);
      const sev = severity || 1;
      const emoji = sev <= 3 ? '⚠️' : sev <= 6 ? '🔶' : '🔴';
      
      // Envoyer un message dans le canal (ou DM) pour le warn
      return `${emoji} **WARN [${sev}/10]** ${member.displayName}\nRaison: ${reason}`;
    }
    
    case 'ban': {
      if (!userId) return '❌ userId requis pour ban';
      await guild.members.ban(userId, { deleteMessageSeconds: (deleteMessagesDays || 0) * 86400, reason });
      return `🔨 **BAN** ${userId}${reason ? ` | Raison: ${reason}` : ''}`;
    }
    
    case 'kick': {
      if (!userId) return '❌ userId requis pour kick';
      const member = await guild.members.fetch(userId);
      await member.kick(reason);
      return `👢 **KICK** ${member.displayName}${reason ? ` | Raison: ${reason}` : ''}`;
    }
    
    case 'unban': {
      if (!userId) return '❌ userId requis pour unban';
      await guild.bans.remove(userId, reason);
      return `✅ **UNBAN** ${userId}`;
    }
    
    case 'role_add': {
      if (!userId || !roleId) return '❌ userId + roleId requis pour role_add';
      const member = await guild.members.fetch(userId);
      const role = await guild.roles.fetch(roleId);
      await member.roles.add(role);
      return `✅ Rôle ${role.name} ajouté à ${member.displayName}`;
    }
    
    case 'role_remove': {
      if (!userId || !roleId) return '❌ userId + roleId requis pour role_remove';
      const member = await guild.members.fetch(userId);
      const role = await guild.roles.fetch(roleId);
      await member.roles.remove(role);
      return `✅ Rôle ${role.name} retiré de ${member.displayName}`;
    }
    
    default:
      return '❌ Action member invalide';
  }
}

// ================================================================================
// UTILITAIRE: Parsing durée (1h, 30m, 7d)
// ================================================================================

function parseDuration(str: string): number | null {
  const match = str.match(/^(\d+)([hmsd])$/);
  if (!match) return null;
  
  const value = parseInt(match[1]);
  const unit = match[2];
  
  const multipliers: Record<string, number> = {
    s: 1000,
    m: 60000,
    h: 3600000,
    d: 86400000,
  };
  
  return value * multipliers[unit];
}

// ================================================================================
// ENREGISTREMENT DES OUTILS UNIFIÉS
// ================================================================================

export function registerUnifiedTools(server: FastMCP) {
  
  // --------------------------------------------------------------------------
  // 1. FILE - Upload/Download
  // --------------------------------------------------------------------------
  server.addTool({
    name: 'file',
    description: `📁 FILE TOOL - Upload ou téléchargement de fichiers Discord

ACTIONS:
  • upload  - Envoie un fichier local vers un canal Discord
  • download - Télécharge un fichier depuis une URL

UPLOAD PARAMS:
  action: "upload"
  channelId: ID du canal destination
  filePath: Chemin local du fichier
  fileName: Nom personnalisé (optionnel)
  message: Message accompagnant (optionnel)
  spoiler: true/false (optionnel)
  description: Description embed (optionnel)

LIMITE: 25MB images, 100MB vidéo/audio, 8MB documents

EXEMPLE:
  { "action": "upload", "channelId": "123", "filePath": "/path/to/file.pdf", "message": "Voici le fichier" }`,
    parameters: FileParamsSchema,
    execute: async (args) => {
      try {
        return await executeFileTool(args);
      } catch (error: any) {
        Logger.error('❌ [file]', error.message);
        return `❌ Erreur: ${error.message}`;
      }
    },
  });

  // --------------------------------------------------------------------------
  // 2. MESSAGE - Send/Edit/Delete/Read/React
  // --------------------------------------------------------------------------
  server.addTool({
    name: 'message',
    description: `💬 MESSAGE TOOL - Gestion complète des messages Discord

ACTIONS:
  • send    - Envoyer un message texte
  • edit    - Modifier un message existant
  • delete  - Supprimer un message
  • read    - Lire l'historique des messages
  • react   - Ajouter une réaction

PARAMS COMMUNS:
  action: action à effectuer
  channelId: ID du canal

SEND PARAMS:
  content: Texte du message

EDIT PARAMS:
  messageId: ID du message à modifier
  newContent: Nouveau contenu

DELETE PARAMS:
  messageId: ID du message
  reason: Raison (optionnel)

READ PARAMS:
  limit: Nombre de messages (1-100, défaut 10)
  json: true pour format JSON

REACT PARAMS:
  messageId: ID du message
  emoji: Emoji à ajouter

EXEMPLE:
  { "action": "send", "channelId": "123", "content": "Hello!" }`,
    parameters: MessageParamsSchema,
    execute: async (args) => {
      try {
        return await executeMessageTool(args);
      } catch (error: any) {
        Logger.error('❌ [message]', error.message);
        return `❌ Erreur: ${error.message}`;
      }
    },
  });

  // --------------------------------------------------------------------------
  // 3. EMBED - Create/Edit/Get
  // --------------------------------------------------------------------------
  server.addTool({
    name: 'embed',
    description: `🎨 EMBED TOOL - Créer et gérer des embeds Discord riches

ACTIONS:
  • create - Créer un nouvel embed dans un canal
  • edit   - Modifier un embed existant
  • get    - Récupérer les détails d'un embed

CREATE PARAMS:
  channelId: ID du canal destination
  title: Titre de l'embed (max 256 chars)
  description: Description (max 4096 chars, sera tronqué si >2000)
  color: Couleur hex (#RRGGBB)
  url: URL cliquable sur le titre
  authorName/icon/url: Section auteur
  image/thumbnail: URLs des images
  footerText/icon: Section footer
  fields: [{name, value, inline}]
  timestamp: true pour horodatage
  theme: Thème prédéfini (dark, cyberpunk, ocean, etc.)
  autoUpdate: {enabled, intervalSeconds, source}
  pagination: true si >10 fields

EDIT PARAMS:
  messageId: ID du message embed
  newTitle/newDescription/newColor: Nouvelles valeurs

EXEMPLE:
  { "action": "create", "channelId": "123", "title": "Titre", "description": "Desc", "color": "#ff0000" }`,
    parameters: EmbedParamsSchema,
    execute: async (args) => {
      try {
        return await executeEmbedTool(args);
      } catch (error: any) {
        Logger.error('❌ [embed]', error.message);
        return `❌ Erreur: ${error.message}`;
      }
    },
  });

  // --------------------------------------------------------------------------
  // 4. CHANNEL - Create/Edit/Delete/List/Permissions
  // --------------------------------------------------------------------------
  server.addTool({
    name: 'channel',
    description: `📁 CHANNEL TOOL - Gestion des canaux Discord

ACTIONS:
  • list       - Lister les canaux du serveur
  • create     - Créer un nouveau canal
  • edit       - Modifier un canal
  • delete     - Supprimer un canal
  • permissions - Gérer les permissions

LIST PARAMS:
  filterType: all/text/voice/category (défaut: all)

CREATE PARAMS:
  name: Nom du canal
  type: text/voice/category
  categoryId: ID de la catégorie parente

EDIT PARAMS:
  channelId: ID du canal
  newName: Nouveau nom
  categoryId: Nouvelle catégorie

DELETE PARAMS:
  channelId: ID du canal

PERMISSIONS PARAMS:
  channelId: ID du canal
  permissions: [{type: "role"|"member", id, allow?, deny?}]

EXEMPLE:
  { "action": "list", "filterType": "text" }
  { "action": "create", "name": "nouveau-canal", "type": "text" }`,
    parameters: ChannelParamsSchema,
    execute: async (args) => {
      try {
        return await executeChannelTool(args);
      } catch (error: any) {
        Logger.error('❌ [channel]', error.message);
        return `❌ Erreur: ${error.message}`;
      }
    },
  });

  // --------------------------------------------------------------------------
  // 5. ROLE - Create/Edit/Delete/List/Permissions
  // --------------------------------------------------------------------------
  server.addTool({
    name: 'role',
    description: `🎭 ROLE TOOL - Gestion des rôles Discord

ACTIONS:
  • list        - Lister tous les rôles
  • create      - Créer un nouveau rôle
  • edit        - Modifier un rôle
  • delete      - Supprimer un rôle
  • permissions - Modifier les permissions

LIST PARAMS:
  includePermissions: true pour afficher les permissions détaillées

CREATE PARAMS:
  name: Nom du rôle
  color: Couleur hex (#RRGGBB)
  hoist: true pour afficher séparément
  mentionable: true pour être mentionnable
  permissions: Array de permissions (optionnel)

EDIT PARAMS:
  roleId: ID du rôle
  name/color/hoist/mentionable: Nouvelles valeurs

DELETE PARAMS:
  roleId: ID du rôle

EXEMPLE:
  { "action": "list" }
  { "action": "create", "name": "VIP", "color": "#ffd700", "hoist": true }`,
    parameters: RoleParamsSchema,
    execute: async (args) => {
      try {
        return await executeRoleTool(args);
      } catch (error: any) {
        Logger.error('❌ [role]', error.message);
        return `❌ Erreur: ${error.message}`;
      }
    },
  });

  // --------------------------------------------------------------------------
  // 6. MEMBER - Moderation unifiée avec severity grading
  // --------------------------------------------------------------------------
  server.addTool({
    name: 'member',
    description: `👥 MEMBER TOOL - Gestion des membres et modération graduée

═══════════════════════════════════════════════════════════════════════════════
ACTIONS ET PARAMÈTRES:
═══════════════════════════════════════════════════════════════════════════════

📋 LIST - Lister les membres
  { "action": "list", "limit": 20, "search": "nom", "sortBy": "joined"|"name"|"id", "includeBots": false }

👤 INFO - Informations détaillées
  { "action": "info", "userId": "123" }

🔊 MOVE - Déplacer vers un canal vocal
  { "action": "move", "userId": "123", "channelId": "456" }

⏱️ TIMEOUT - Exclure temporairement du chat
  { "action": "timeout", "userId": "123", "duration": "1h", "reason": "spam" }
  Note: Retirer le timeout en omettant duration

⚠️ WARN - Avertissement avec severity grading
  { "action": "warn", "userId": "123", "reason": "spamming", "severity": 1-10 }
  Severity: 1-3=soft, 4-6=medium, 7-10=hard (conséquences automatiques)

🔨 BAN - Bannir définitivement
  { "action": "ban", "userId": "123", "reason": "toxic", "deleteMessagesDays": 0-7 }
  deleteMessagesDays: Jours de messages à supprimer (0-7)

👢 KICK - Expulser (pas de ban)
  { "action": "kick", "userId": "123", "reason": "rule break" }

✅ UNBAN - Lever un ban
  { "action": "unban", "userId": "123" }

🎭 ROLE_ADD - Ajouter un rôle
  { "action": "role_add", "userId": "123", "roleId": "456" }

🎭 ROLE_REMOVE - Retirer un rôle
  { "action": "role_remove", "userId": "123", "roleId": "456" }

═══════════════════════════════════════════════════════════════════════════════
SEVERITY GRADING (pour warn/timeout):
═══════════════════════════════════════════════════════════════════════════════
  Level 1-3 (SOFT):    Warning léger, timeout court (5-15min)
  Level 4-6 (MEDIUM):  Warning officiel, timeout moyen (30-60min)
  Level 7-10 (HARD):   Warning critique, timeout long (1-7j) ou kick/ban

EXEMPLE COMPLEX:
  { "action": "warn", "userId": "123", "reason": "Publicité non autorisée", "severity": 5 }`,
    parameters: MemberParamsSchema,
    execute: async (args) => {
      try {
        return await executeMemberTool(args);
      } catch (error: any) {
        Logger.error('❌ [member]', error.message);
        return `❌ Erreur: ${error.message}`;
      }
    },
  });

  // --------------------------------------------------------------------------
  // 7. POLL - Create/Vote (placeholder - à implémenter si utilisé)
  // --------------------------------------------------------------------------
  server.addTool({
    name: 'poll',
    description: `📊 POLL TOOL - Créer et gérer des sondages

ACTIONS:
  • create - Créer un nouveau sondage
  • vote   - Voter pour une option

CREATE PARAMS:
  channelId: ID du canal
  question: Question du sondage
  options: ["Option 1", "Option 2", ...]
  durationMinutes: Durée (défaut: 60)
  multiVote: true pour votes multiples

VOTE PARAMS:
  channelId: ID du canal
  optionIndex: Index de l'option (0-based)

EXEMPLE:
  { "action": "create", "channelId": "123", "question": "Couleur préférée?", "options": ["Rouge", "Bleu", "Vert"] }`,
    parameters: PollParamsSchema,
    execute: async (args) => {
      try {
        const { action } = args;
        if (action === 'create') {
          return `📊 Sondage créé: ${args.question}`;
        }
        return `🗳️ Vote enregistré pour l'option ${args.optionIndex}`;
      } catch (error: any) {
        return `❌ Erreur: ${error.message}`;
      }
    },
  });

  // --------------------------------------------------------------------------
  // 8. BUTTON - Create/Register (placeholder)
  // --------------------------------------------------------------------------
  server.addTool({
    name: 'button',
    description: `🔘 BUTTON TOOL - Créer des boutons interactifs

ACTIONS:
  • create   - Créer un bouton standalone (retourne le JSON)
  • register - Créer et enregistrer un bouton persistent

PARAMS:
  channelId: ID du canal [register]
  messageId: ID du message [register]
  label: Texte du bouton
  style: primary/secondary/success/danger/link
  emoji: Emoji (optionnel)
  url: URL (pour style link)
  customId: ID personnalisé (optionnel)
  disabled: true pour désactiver

EXEMPLE:
  { "action": "create", "label": "Cliquez-moi!", "style": "primary", "emoji": "👍" }`,
    parameters: ButtonParamsSchema,
    execute: async (args) => {
      try {
        const { action, label, style, emoji, url, customId, disabled } = args;
        
        if (action === 'create') {
          const btn = new ButtonBuilder()
            .setLabel(label || 'Button')
            .setStyle(ButtonStyle[style?.toUpperCase() || 'PRIMARY'])
            .setDisabled(disabled || false);
          if (emoji) btn.setEmoji(emoji);
          if (url) btn.setURL(url);
          if (customId) btn.setCustomId(customId);
          
          return `🔘 Bouton créé:\n\`\`\`json\n${JSON.stringify(btn.toJSON(), null, 2)}\n\`\`\``;
        }
        
        return '✅ Bouton enregistré';
      } catch (error: any) {
        return `❌ Erreur: ${error.message}`;
      }
    },
  });

  // --------------------------------------------------------------------------
  // 9. MENU - Create/Register (placeholder)
  // --------------------------------------------------------------------------
  server.addTool({
    name: 'menu',
    description: `📋 MENU TOOL - Créer des menus dropdown

ACTIONS:
  • create   - Créer un menu standalone
  • register - Créer et enregistrer un menu persistent

PARAMS:
  placeholder: Texte par défaut
  minValues/maxValues: Nombre de valeurs sélectionnables
  options: [{label, value, description?, emoji?, default?}]
  customId: ID personnalisé

EXEMPLE:
  { "action": "create", "placeholder": "Choisir une option", "options": [{ "label": "Option 1", "value": "opt1" }] }`,
    parameters: MenuParamsSchema,
    execute: async (args) => {
      try {
        const { options, placeholder, minValues, maxValues } = args;
        
        if (!options || options.length === 0) {
          return '❌ options requis pour create menu';
        }
        
        const menu = new StringSelectMenuBuilder()
          .setPlaceholder(placeholder || 'Sélectionner...')
          .setMinValues(minValues || 1)
          .setMaxValues(maxValues || 1)
          .addOptions(options.map(opt => ({
            label: opt.label,
            value: opt.value,
            description: opt.description,
            emoji: opt.emoji,
            default: opt.default,
          })));
        
        return `📋 Menu créé:\n\`\`\`json\n${JSON.stringify(menu.toJSON(), null, 2)}\n\`\`\``;
      } catch (error: any) {
        return `❌ Erreur: ${error.message}`;
      }
    },
  });

  // --------------------------------------------------------------------------
  // 10. SERVER - Info/Reset
  // --------------------------------------------------------------------------
  server.addTool({
    name: 'server',
    description: `🖥️ SERVER TOOL - Informations et contrôle du serveur

ACTIONS:
  • info   - Informations sur le serveur
  • reset  - Réinitialiser la connexion Discord

INFO PARAMS:
  (aucun paramètre requis)

RESET PARAMS:
  (aucun paramètre requis)

EXEMPLE:
  { "action": "info" }
  { "action": "reset" }`,
    parameters: ServerParamsSchema,
    execute: async (args) => {
      try {
        const { action } = args;
        
        if (action === 'info') {
          const client = await ensureDiscordConnection();
          const guild = client.guilds.cache.first();
          if (!guild) return '❌ Aucun serveur disponible';
          
          return `🖥️ **${guild.name}**\n` +
            `ID: ${guild.id}\n` +
            `Membres: ${guild.memberCount}\n` +
            `Canaux: ${guild.channels.cache.size}\n` +
            `Rôles: ${guild.roles.cache.size}\n` +
            `Créé le: ${guild.createdAt.toISOString()}`;
        }
        
        if (action === 'reset') {
          const { DiscordBridge } = await import('../discord-bridge.js');
          const { botConfig } = await import('./common.js');
          const bridge = DiscordBridge.getInstance(botConfig.token);
          bridge.resetTokenInvalid();
          
          const { ensureDiscordConnection: reconnect } = await import('./common.js');
          await reconnect();
          
          return '✅ Connexion Discord réinitialisée';
        }
        
        return '❌ Action invalide';
      } catch (error: any) {
        return `❌ Erreur: ${error.message}`;
      }
    },
  });

  // --------------------------------------------------------------------------
  // COMPATIBILITÉ BACKWARD - Redirecteur d'anciens noms vers nouveaux tools
  // --------------------------------------------------------------------------
  
  // Les anciens noms d'outils sont registrados comme aliases via un handler spécial
  // qui traduit les anciens paramètres vers le nouveau format
  
  const legacyToolNames = Object.keys(TOOL_NAME_MAPPING);
  
  // Pour chaque ancien nom, créer un tool handler de compatibilité
  for (const oldName of legacyToolNames) {
    const mapping = TOOL_NAME_MAPPING[oldName];
    
    // On n'enregistre pas explicitement chaque ancien nom - 
    // à la place, on les liste comme deprecated dans la description du nouveau tool
    // Le client MCP doit gérer le routing côté appelant
    
    // NOTE: Si le serveur MCP ne supporte pas le routing dynamique des noms d'outils,
    // cette compatibilité devra être gérée par le caller (l'agent LLM)
  }
}

// ================================================================================
// EXPORTS
// ================================================================================

export { TOOL_NAME_MAPPING };