import { promises as fs } from 'fs';
import { join } from 'path';
import Logger from './logger.js';

// Configuration
const DATA_DIR = join(process.cwd(), 'data');
const POLLS_FILE = join(DATA_DIR, 'polls.json');

// Interface pour les sondages
export interface PollResult {
  id: string;
  question: string;
  options: Array<{
    text: string;
    votes: number;
    percentage: number;
  }>;
  totalVotes: number;
  endTime: Date;
  ended: boolean;
  allowMultiple: boolean;
  anonymous: boolean;
  messageId?: string;
  channelId: string;
  createdAt: Date;
}

import { PersistenceManager } from './persistenceManager.js';

const POLL_PERSISTENCE = new PersistenceManager<PollResult[]>(POLLS_FILE, 1000);

// Charger tous les sondages depuis le fichier
export async function loadPolls(): Promise<Map<string, PollResult>> {
  const pollsArray = await POLL_PERSISTENCE.load([]);
  
  const pollsMap = new Map<string, PollResult>();
  pollsArray.forEach(poll => {
    poll.endTime = new Date(poll.endTime);
    pollsMap.set(poll.id, poll);
    if (poll.messageId) {
      pollsMap.set(poll.messageId, poll);
    }
  });

  Logger.info(`✅ ${pollsMap.size} sondages chargés avec robustesse`);
  return pollsMap;
}

// Sauvegarder tous les sondages dans le fichier
export async function savePolls(polls: Map<string, PollResult>): Promise<void> {
  const pollsArray = Array.from(polls.values());

  // Convertir les dates en strings pour la sérialisation JSON
  const pollsToSave = pollsArray.map(poll => ({
    ...poll,
    endTime: (poll.endTime instanceof Date) ? poll.endTime.toISOString() : poll.endTime,
  }));

  await POLL_PERSISTENCE.saveImmediate(pollsToSave as any);
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
  let poll = polls.get(pollId);
  if (poll) return poll;

  poll = polls.get(`poll_${pollId}`);
  if (poll) return poll;

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
