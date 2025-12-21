import { promises as fs } from 'fs';
import { join } from 'path';
import Logger from './logger.js';

const DATA_DIR = join(process.cwd(), 'data');
const RPG_FILE = join(DATA_DIR, 'rpg_state.json');

export interface PlayerStats {
  hp: number;
  maxHp: number;
  xp: number;
  level: number;
  gold: number;
  class: string;
  inventory: string[];
  lastAction: Date;
}

export interface DungeonState {
  floor: number;
  room: number;
  enemy?: {
    name: string;
    hp: number;
    maxHp: number;
    level: number;
  };
  log: string[];
  records: {
    maxFloor: number;
    topPlayer: string;
  };
}

export interface RPGState {
  players: Record<string, PlayerStats>;
  dungeon: DungeonState;
}

async function ensureDataDir(): Promise<void> {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
  } catch (error) {
    Logger.error('[RPG_PERSISTENCE] Error creating data dir:', error);
  }
}

export async function loadRPGState(): Promise<RPGState> {
  await ensureDataDir();
  try {
    const data = await fs.readFile(RPG_FILE, 'utf-8');
    const state = JSON.parse(data);
    
    // Restore dates
    for (const userId in state.players) {
      state.players[userId].lastAction = new Date(state.players[userId].lastAction);
    }
    
    return state;
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT') {
      const initialState: RPGState = {
        players: {},
        dungeon: {
          floor: 1,
          room: 1,
          log: ['Bienvenue dans le Donjon de l\'Antigravité...'],
          records: {
            maxFloor: 1,
            topPlayer: 'Aucun'
          }
        }
      };
      await saveRPGState(initialState);
      return initialState;
    }
    Logger.error('[RPG_PERSISTENCE] Error loading state:', error);
    throw error;
  }
}

export async function saveRPGState(state: RPGState): Promise<void> {
  await ensureDataDir();
  try {
    await fs.writeFile(RPG_FILE, JSON.stringify(state, null, 2), 'utf-8');
  } catch (error) {
    Logger.error('[RPG_PERSISTENCE] Error saving state:', error);
    throw error;
  }
}

export function getOrCreatePlayer(state: RPGState, userId: string, username: string): PlayerStats {
  if (!state.players[userId]) {
    state.players[userId] = {
      hp: 20,
      maxHp: 20,
      xp: 0,
      level: 1,
      gold: 10,
      class: 'Aventurier',
      inventory: ['Épée rouillée', 'Potion de soin'],
      lastAction: new Date()
    };
    state.dungeon.log.push(`✨ ${username} a rejoint l'aventure !`);
  }
  return state.players[userId];
}
