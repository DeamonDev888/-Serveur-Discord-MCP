import { promises as fs } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { PersistenceManager } from './persistenceManager.js';

// Configuration : chemin absolu vers le dossier data (indépendant de process.cwd())
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const DATA_DIR = join(__dirname, '../../data');
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

const RPG_MANAGER = new PersistenceManager<RPGState>(RPG_FILE, 2000);

export async function loadRPGState(): Promise<RPGState> {
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

  const state = await RPG_MANAGER.load(initialState);
  
  // Restore dates
  for (const userId in state.players) {
    state.players[userId].lastAction = new Date(state.players[userId].lastAction);
  }

  // Migration/Ensure records
  if (!state.dungeon.records) {
    state.dungeon.records = {
      maxFloor: state.dungeon.floor || 1,
      topPlayer: 'Ancien Aventurier'
    };
  }
  
  return state;
}

export async function saveRPGState(state: RPGState): Promise<void> {
  // On utilise la sauvegarde immédiate pour les actions importantes (fin de combat, etc.)
  // rpgManager décide d'utiliser saveDebounced ou saveImmediate via cette fonction si on veut
  await RPG_MANAGER.saveImmediate(state);
}

export function saveRPGStateDebounced(state: RPGState): void {
  RPG_MANAGER.saveDebounced(state);
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
