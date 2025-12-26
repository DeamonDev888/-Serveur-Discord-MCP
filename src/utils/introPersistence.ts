import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import Logger from './logger.js';
import { PersistenceManager } from './persistenceManager.js';

// Configuration : chemin absolu vers le dossier data (indépendant de process.cwd())
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const DATA_DIR = join(__dirname, '../../data');
const INTRO_FILE = join(DATA_DIR, 'intro_data.json');

export interface IntroState {
  userId: string;
  username: string;
  currentStep: number;
  answers: Record<string, string>;
  completed: boolean;
  startedAt: string; // ISO String
  completedAt?: string;
}

const INTRO_PERSISTENCE = new PersistenceManager<IntroState[]>(INTRO_FILE, 1000);

export async function loadIntroStates(): Promise<Map<string, IntroState>> {
  const statesArray = await INTRO_PERSISTENCE.load([]);
  const statesMap = new Map<string, IntroState>();
  
  statesArray.forEach(state => {
    statesMap.set(state.userId, state);
  });

  Logger.info(`✅ ${statesMap.size} états de questionnaire d'intro chargés`);
  return statesMap;
}

export async function saveIntroStates(states: Map<string, IntroState>): Promise<void> {
  const statesArray = Array.from(states.values());
  await INTRO_PERSISTENCE.saveImmediate(statesArray);
}

export async function getIntroState(userId: string): Promise<IntroState | undefined> {
  const states = await loadIntroStates();
  return states.get(userId);
}

export async function saveIntroState(state: IntroState): Promise<void> {
  const states = await loadIntroStates();
  states.set(state.userId, state);
  await saveIntroStates(states);
}
