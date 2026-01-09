import fs from 'fs';
import path from 'path';
import Logger from './logger.js';

export const VoteManager = {
    /**
     * Sauvegarde un vote dans le fichier CSV
     */
    saveVote: async (voteType: string, user: { username: string, id: string }, channelId: string, details: string = '') => {
        try {
            // Utilise le dossier racine du serveur MCP pour le stockage
            // Cela permet de centraliser les votes même si le CWD change légèrement
            const rootDir = process.cwd();
            const voteFile = path.join(rootDir, 'votes_sentinel.csv');
            
            // Ensure file exists with header
            if (!fs.existsSync(voteFile)) {
                fs.writeFileSync(voteFile, 'timestamp,vote_type,user,user_id,channel_id,details\n');
            }
            
            const line = `${new Date().toISOString()},${voteType},${user.username},${user.id},${channelId},"${details}"\n`;
            fs.appendFileSync(voteFile, line);
            Logger.info(`🗳️ Vote enregistré: ${voteType} par ${user.username}`);
        } catch (err: any) {
            Logger.error('Echec sauvegarde vote:', err);
            throw err;
        }
    },

    /**
     * Récupère les compteurs de votes (VALIDATION vs REJECTION)
     */
    getVoteCounts: async () => {
        try {
            const rootDir = process.cwd();
            // Le chemin doit être cohérent. On peut utiliser une variable d'environnement ou un chemin relatif fixe
            // Pour l'instant on garde process.cwd() ou le chemin absolu connu si besoin
            
            // Backup path logic if process.cwd() is inside dist or src
            let voteFile = path.join(rootDir, 'votes_sentinel.csv');
            
            // Si on est dans sous-dossier, on remonte (heuristique simple)
            if (!fs.existsSync(voteFile) && fs.existsSync(path.join(rootDir, '..', 'votes_sentinel.csv'))) {
                voteFile = path.join(rootDir, '..', 'votes_sentinel.csv');
            }

            // Fallback hardcodé pour l'environnement User spécifique si besoin (pour robustesse)
            if (!fs.existsSync(voteFile)) {
                 const hardcodedPath = 'C:\\Users\\Deamon\\Desktop\\Backup\\Serveur MCP\\votes_sentinel.csv';
                 if (fs.existsSync(hardcodedPath)) voteFile = hardcodedPath;
                 else return { valid: 0, invalid: 0 };
            }

            const content = fs.readFileSync(voteFile, 'utf-8');
            const lines = content.split('\n').filter(l => l.trim().length > 0).slice(1);
            
            let valid = 0;
            let invalid = 0;
            
            for (const line of lines) {
                if (line.includes('"VALIDATION"') || line.includes(',VALIDATION,')) valid++; // Check quotes or csv raw
                if (line.includes('"REJECTION"') || line.includes(',REJECTION,')) invalid++;
            }
            
            return { valid, invalid };
        } catch (e) {
            return { valid: 0, invalid: 0 };
        }
    }
};
