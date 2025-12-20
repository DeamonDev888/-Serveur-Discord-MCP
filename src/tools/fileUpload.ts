import { z } from 'zod';
import { AttachmentBuilder, ChannelType } from 'discord.js';
import { readFile, stat } from 'fs/promises';
import { extname } from 'path';

// Schéma pour l'upload de fichiers
export const FileUploadSchema = z.object({
  channelId: z.string().describe('ID du canal où uploader le fichier'),
  filePath: z.string().describe('Chemin local du fichier à uploader'),
  fileName: z.string().optional().describe('Nom personnalisé pour le fichier'),
  message: z.string().optional().describe('Message accompagnant le fichier'),
  spoiler: z.boolean().optional().default(false).describe('Marquer comme spoiler (SPOILER)'),
  description: z.string().optional().describe('Description du fichier')
});


// Types de fichiers supportés avec limites de taille
export const FILE_LIMITS = {
  'image': 25 * 1024 * 1024, // 25MB
  'video': 100 * 1024 * 1024, // 100MB (pour les serveurs boostés)
  'audio': 100 * 1024 * 1024, // 100MB (pour les serveurs boostés)
  'document': 25 * 1024 * 1024, // 25MB
  'default': 8 * 1024 * 1024 // 8MB (limite standard)
};

// Types MIME supportés
export const SUPPORTED_MIME_TYPES = {
  image: [
    'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'
  ],
  video: [
    'video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo'
  ],
  audio: [
    'audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp4'
  ],
  document: [
    'application/pdf', 'text/plain', 'application/json',
    'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
  ]
};

// Vérifier le type de fichier
export const getFileType = (mimeType: string): string => {
  for (const [type, mimes] of Object.entries(SUPPORTED_MIME_TYPES)) {
    if (mimes.includes(mimeType)) {
      return type;
    }
  }
  return 'document'; // Par défaut
};

// Obtenir le type MIME depuis l'extension
export const getMimeTypeFromExtension = (extension: string): string => {
  const mimeMap: { [key: string]: string } = {
    '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png',
    '.gif': 'image/gif', '.webp': 'image/webp', '.svg': 'image/svg+xml',
    '.mp4': 'video/mp4', '.webm': 'video/webm', '.mov': 'video/quicktime',
    '.mp3': 'audio/mpeg', '.wav': 'audio/wav', '.ogg': 'audio/ogg',
    '.pdf': 'application/pdf', '.txt': 'text/plain', '.json': 'application/json',
    '.doc': 'application/msword', '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    '.xls': 'application/vnd.ms-excel', '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    '.ppt': 'application/vnd.ms-powerpoint', '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
  };
  return mimeMap[extension.toLowerCase()] || 'application/octet-stream';
};

// Vérifier la taille du fichier
export const checkFileSize = async (filePath: string): Promise<{ valid: boolean; size: number; error?: string }> => {
  try {
    const stats = await stat(filePath);
    const size = stats.size;
    const extension = extname(filePath);
    const mimeType = getMimeTypeFromExtension(extension);
    const fileType = getFileType(mimeType);
    const limit = FILE_LIMITS[fileType as keyof typeof FILE_LIMITS] || FILE_LIMITS.default;

    if (size > limit) {
      return {
        valid: false,
        size,
        error: `Fichier trop volumineux. Limite: ${(limit / 1024 / 1024).toFixed(1)}MB pour ce type de fichier`
      };
    }

    return { valid: true, size };
  } catch (error) {
    return {
      valid: false,
      size: 0,
      error: `Impossible de lire le fichier: ${error}`
    };
  }
};

// Créer un attachment depuis un fichier local
export const createAttachmentFromFile = async (
  filePath: string,
  fileName?: string,
  spoiler: boolean = false
): Promise<{ success: boolean; attachment?: AttachmentBuilder; error?: string; size?: number }> => {
  try {
    // Vérifier la taille du fichier
    const sizeCheck = await checkFileSize(filePath);
    if (!sizeCheck.valid) {
      return { success: false, error: sizeCheck.error };
    }

    // Lire le fichier
    const fileBuffer = await readFile(filePath);
    const originalFileName = fileName || filePath.split(/[\\\/]/).pop() || 'fichier';
    const finalFileName = spoiler ? `SPOILER_${originalFileName}` : originalFileName;

    // Créer l'attachment
    const attachment = new AttachmentBuilder(fileBuffer, {
      name: finalFileName
    });

    return { success: true, attachment, size: sizeCheck.size };
  } catch (error) {
    return { success: false, error: `Erreur lors de la création de l'attachment: ${error}` };
  }
};

// Créer un embed pour l'upload
export const createFileUploadEmbed = (
  fileName: string,
  fileSize: number,
  description?: string,
  spoiler: boolean = false
) => {
  const sizeMB = (fileSize / 1024 / 1024).toFixed(2);
  const extension = extname(fileName).toLowerCase();
  const mimeType = getMimeTypeFromExtension(extension);
  const fileType = getFileType(mimeType);

  const iconMap: { [key: string]: string } = {
    image: '🖼️',
    video: '🎥',
    audio: '🎵',
    document: '📄'
  };

  return {
    title: `${spoiler ? '🚫' : iconMap[fileType] || '📎'} Fichier Uploadé`,
    color: 0x00FF00,
    description: description || `Fichier **${fileName}** uploadé avec succès`,
    fields: [
      {
        name: 'Informations',
        value: `**Nom:** ${fileName}\n**Taille:** ${sizeMB} MB\n**Type:** ${fileType}`,
        inline: true
      }
    ],
    timestamp: new Date().toISOString()
  };
};

