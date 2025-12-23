/**
 * 📁 FILE UPLOAD
 * ==============
 * Upload un fichier local vers un canal Discord avec validation.
 */

import { z } from 'zod';
import { AttachmentBuilder } from 'discord.js';
import type { Client } from 'discord.js';
import { promises as fs } from 'fs';
import path from 'path';

// ============================================================================
// SCHÉMA ZOD
// ============================================================================

export const FileUploadSchema = z.object({
  channelId: z.string().describe('ID du canal'),
  filePath: z.string().describe('Chemin du fichier local'),
  fileName: z.string().optional().describe('Nom du fichier (optionnel)'),
  content: z.string().optional().describe('Message d\'accompagnement'),
});

export type FileUploadParams = z.infer<typeof FileUploadSchema>;

// ============================================================================
// FONCTION D'EXÉCUTION
// ============================================================================

const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25 MB

export async function uploadFile(client: Client, args: FileUploadParams): Promise<string> {
  const channel = await client.channels.fetch(args.channelId);

  if (!channel || !('send' in channel)) {
    throw new Error('Canal invalide ou inaccessible');
  }

  // Vérifier que le fichier existe
  const stats = await fs.stat(args.filePath);

  if (!stats.isFile()) {
    throw new Error('Le chemin ne pointe pas vers un fichier');
  }

  // Vérifier la taille
  if (stats.size > MAX_FILE_SIZE) {
    throw new Error(`Fichier trop volumineux (${(stats.size / 1024 / 1024).toFixed(2)} MB > 25 MB)`);
  }

  // Lire le fichier
  const fileBuffer = await fs.readFile(args.filePath);

  // Créer l'attachment
  const attachment = new AttachmentBuilder(fileBuffer, {
    name: args.fileName || path.basename(args.filePath),
  });

  // Envoyer
  const message = await channel.send({
    content: args.content,
    files: [attachment],
  });

  return `✅ Fichier uploadé | ID: ${message.id} | Taille: ${(stats.size / 1024).toFixed(2)} KB`;
}

// ============================================================================
// CONFIGURATION OUTIL MCP
// ============================================================================

export const uploadFileToolConfig = {
  name: 'uploader_fichier',
  description: 'Upload un fichier local vers un canal Discord avec validation',
  parameters: FileUploadSchema,
};
