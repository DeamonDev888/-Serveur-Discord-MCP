import { promises as fs } from 'fs';
import { join } from 'path';
import { PollResult } from '../tools/polls.js';
import Logger from './logger.js';

// Configuration
const DATA_DIR = join(process.cwd(), 'data');
const POLLS_FILE = join(DATA_DIR, 'polls.json');

// Assurer que le dossier data existe
async function ensureDataDir(): Promise<void> {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
  } catch (error) {
    Logger.error('Erreur lors de la création du dossier data:', error);
  }
}

// Charger tous les sondages depuis le fichier
export async function loadPolls(): Promise<Map<string, PollResult>> {
  await ensureDataDir();

  try {
    const data = await fs.readFile(POLLS_FILE, 'utf-8');
    const pollsArray: PollResult[] = JSON.parse(data);

    // Convertir le tableau en Map
    const pollsMap = new Map<string, PollResult>();
    pollsArray.forEach(poll => {
      // Convertir la date string en Date object
      poll.endTime = new Date(poll.endTime);
      pollsMap.set(poll.id, poll);
      // Stocker aussi avec messageId si disponible
      if (poll.messageId) {
        pollsMap.set(poll.messageId, poll);
      }
    });

    Logger.info(`✅ ${pollsMap.size} sondages chargés depuis le fichier`);
    return pollsMap;
  } catch (error) {
    // Si le fichier n'existe pas, créer un fichier vide
    if (error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT') {
      Logger.info('📄 Aucun fichier de sondages existant, création du fichier...');
      await fs.writeFile(POLLS_FILE, JSON.stringify([], null, 2), 'utf-8');
      Logger.info('📄 Fichier de sondages créé, démarrage avec une Map vide');
      return new Map<string, PollResult>();
    }

    Logger.error('❌ Erreur lors du chargement des sondages:', error);
    return new Map<string, PollResult>();
  }
}

// Sauvegarder tous les sondages dans le fichier
export async function savePolls(polls: Map<string, PollResult>): Promise<void> {
  await ensureDataDir();

  try {
    // Convertir la Map en tableau
    const pollsArray = Array.from(polls.values());

    // Convertir les dates en strings pour la sérialisation JSON
    const pollsToSave = pollsArray.map(poll => ({
      ...poll,
      endTime: poll.endTime.toISOString(),
    }));

    await fs.writeFile(POLLS_FILE, JSON.stringify(pollsToSave, null, 2), 'utf-8');
    Logger.info(`💾 ${polls.size} sondages sauvegardés dans le fichier`);
  } catch (error) {
    Logger.error('❌ Erreur lors de la sauvegarde des sondages:', error);
    throw error;
  }
}

// Ajouter un nouveau sondage
export async function addPoll(poll: PollResult, polls: Map<string, PollResult>): Promise<void> {
  polls.set(poll.id, poll);
  await savePolls(polls);
}

// Mettre à jour un sondage existant
export async function updatePoll(
  pollId: string,
  updates: Partial<PollResult>,
  polls: Map<string, PollResult>
): Promise<void> {
  const poll = polls.get(pollId);
  if (poll) {
    Object.assign(poll, updates);
    await savePolls(polls);
  }
}

// Supprimer un sondage
export async function deletePoll(pollId: string, polls: Map<string, PollResult>): Promise<void> {
  polls.delete(pollId);
  await savePolls(polls);
}

// Obtenir un sondage par ID
export function getPoll(pollId: string, polls: Map<string, PollResult>): PollResult | undefined {
  // Chercher par ID direct
  let poll = polls.get(pollId);
  if (poll) return poll;

  // Chercher avec le préfixe poll_
  poll = polls.get(`poll_${pollId}`);
  if (poll) return poll;

  // Chercher sans le préfixe poll_
  if (pollId.startsWith('poll_')) {
    poll = polls.get(pollId.substring(5));
    if (poll) return poll;
  }

  return undefined;
}

// Nettoyer les sondages expirés
export async function cleanExpiredPolls(polls: Map<string, PollResult>): Promise<number> {
  const now = new Date();
  let expiredCount = 0;

  for (const [, poll] of polls.entries()) {
    if (poll.endTime <= now && !poll.ended) {
      poll.ended = true;
      expiredCount++;
    }
  }

  if (expiredCount > 0) {
    await savePolls(polls);
    Logger.info(`🧹 ${expiredCount} sondages expirés marqués comme terminés`);
  }

  return expiredCount;
}
