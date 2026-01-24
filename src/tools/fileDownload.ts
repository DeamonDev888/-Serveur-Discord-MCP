import { z } from 'zod';
import { FastMCP } from 'fastmcp';
import { ensureDiscordConnection } from './common.js';
import Logger from '../utils/logger.js';
import * as fs from 'fs/promises';
import * as path from 'path';
import { createWriteStream } from 'fs';
import { pipeline } from 'stream/promises';
import { Readable } from 'stream';

export const FileDownloadSchema = z.object({
  channelId: z.string().describe('ID du canal contenant le message'),
  messageId: z.string().describe('ID du message contenant le fichier'),
  outputDir: z.string().optional().describe('Dossier de destination LOCAL sur la machine. Le LLM doit choisir intelligemment un dossier selon le contexte (ex: "./evidence" pour des preuves, "./images" pour des images) ou utiliser un chemin absolu. Défaut: "./downloads"'),
  fileName: z.string().optional().describe('Nom du fichier cible (optionnel, sinon nom original)'),
  attachmentIndex: z.number().optional().default(0).describe("Index de l'attachment à télécharger (défaut: 0)"),
});

export function registerFileDownloadTools(server: FastMCP) {
  server.addTool({
    name: 'telecharger_fichier',
    description: "Télécharge un fichier (image, doc, etc.) depuis un message Discord vers le disque local",
    parameters: FileDownloadSchema,
    execute: async (args) => {
      try {
        Logger.info(`📥 [download] Début du téléchargement depuis message ${args.messageId}`);
        const client = await ensureDiscordConnection();
        const channel = await client.channels.fetch(args.channelId);

        if (!channel || !('messages' in channel)) {
          throw new Error('Canal invalide ou inaccessible (doit être un canal textuel)');
        }

        const message = await channel.messages.fetch(args.messageId);
        if (!message) {
           throw new Error('Message introuvable');
        }

        if (message.attachments.size === 0) {
           return "❌ Ce message ne contient aucune pièce jointe.";
        }

        const attachments = Array.from(message.attachments.values());
        if (args.attachmentIndex >= attachments.length) {
          return `❌ Index d'attachment invalide. Le message contient ${attachments.length} fichiers (index 0 à ${attachments.length - 1}).`;
        }

        const attachment = attachments[args.attachmentIndex];
        const url = attachment.url;
        const originalName = attachment.name;
        
        const finalFileName = args.fileName || originalName;
        const outputDir = args.outputDir || path.resolve(process.cwd(), 'downloads');

        // Ensure output dir exists
        await fs.mkdir(outputDir, { recursive: true });

        const finalPath = path.join(outputDir, finalFileName);

        Logger.info(`📥 [download] URL: ${url}`);
        Logger.info(`📥 [download] Cible: ${finalPath}`);

        const response = await fetch(url);
        if (!response.ok || !response.body) {
           throw new Error(`Échec du téléchargement: ${response.statusText}`);
        }
        
        // Write to file
        const fileStream = createWriteStream(finalPath);
        // Conversion du ReadableStream web en Node stream si nécessaire, ou utilisation directe
        // @ts-ignore - Readable.fromWeb est disponible dans Node 18+ mais peut manquer dans les types
        const nodeStream = Readable.fromWeb(response.body as any);
        await pipeline(nodeStream, fileStream);

        return `✅ Fichier téléchargé avec succès !\n📁 Chemin: \`${finalPath}\`\n📏 Taille: ${(attachment.size / 1024 / 1024).toFixed(2)} MB\n🔗 Source: ${url}`;

      } catch (error: any) {
        Logger.error(`❌ [download]`, error.message);
        return `❌ Erreur lors du téléchargement: ${error.message}`;
      }
    }
  });
  
  Logger.info('✅ Outil telecharger_fichier enregistré');
}
