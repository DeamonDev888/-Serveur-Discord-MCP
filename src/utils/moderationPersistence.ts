import { promises as fs } from 'fs';
import { join } from 'path';
import Logger from './logger.js';

// Configuration
const DATA_DIR = join(process.cwd(), 'data');
const MODERATION_FILE = join(DATA_DIR, 'moderation.json');
const WARNINGS_FILE = join(DATA_DIR, 'warnings.json');
const MUTES_FILE = join(DATA_DIR, 'mutes.json');

// Types
export interface ModerationAction {
  id: string;
  timestamp: Date;
  guildId: string;
  guildName: string;
  moderatorId: string;
  moderatorUsername: string;
  targetId: string;
  targetUsername: string;
  action: 'kick' | 'ban' | 'unban' | 'mute' | 'unmute' | 'warn';
  reason?: string;
  duration?: number; // en secondes
  data?: any;
}

export interface Warning {
  id: string;
  timestamp: Date;
  guildId: string;
  guildName: string;
  userId: string;
  username: string;
  moderatorId: string;
  moderatorUsername: string;
  reason: string;
  expiresAt?: Date;
}

export interface Mute {
  id: string;
  timestamp: Date;
  guildId: string;
  guildName: string;
  userId: string;
  username: string;
  moderatorId: string;
  moderatorUsername: string;
  reason?: string;
  expiresAt: Date;
  active: boolean;
}

// ===============================
// MODÉRATION ACTIONS
// ===============================

import { PersistenceManager } from './persistenceManager.js';

const MODERATION_PERSISTENCE = new PersistenceManager<ModerationAction[]>(MODERATION_FILE, 2000);
const WARNING_PERSISTENCE = new PersistenceManager<Warning[]>(WARNINGS_FILE, 1000);
const MUTE_PERSISTENCE = new PersistenceManager<Mute[]>(MUTES_FILE, 1000);

// ===============================
// MODÉRATION ACTIONS
// ===============================

// Charger toutes les actions de modération
export async function loadModerationActions(): Promise<Map<string, ModerationAction>> {
  const actionsArray = await MODERATION_PERSISTENCE.load([]);
  
  const actionsMap = new Map<string, ModerationAction>();
  actionsArray.forEach(action => {
    action.timestamp = new Date(action.timestamp);
    actionsMap.set(action.id, action);
  });

  Logger.info(`✅ ${actionsMap.size} actions de modération chargées avec robustesse`);
  return actionsMap;
}

// Sauvegarder les actions de modération
export async function saveModerationActions(actions: Map<string, ModerationAction>): Promise<void> {
  const actionsArray = Array.from(actions.values()).map(action => ({
    ...action,
    timestamp: (action.timestamp instanceof Date) ? action.timestamp.toISOString() : action.timestamp,
  }));

  await MODERATION_PERSISTENCE.saveImmediate(actionsArray as any);
}

// Ajouter une action de modération
export async function addModerationAction(
  action: ModerationAction,
  actions: Map<string, ModerationAction>
): Promise<void> {
  actions.set(action.id, action);
  await saveModerationActions(actions);
}

// ===============================
// WARNINGS
// ===============================

// Charger tous les warns
export async function loadWarnings(): Promise<Map<string, Warning>> {
  const warningsArray = await WARNING_PERSISTENCE.load([]);
  
  const warningsMap = new Map<string, Warning>();
  warningsArray.forEach(warning => {
    warning.timestamp = new Date(warning.timestamp);
    if (warning.expiresAt) warning.expiresAt = new Date(warning.expiresAt);
    warningsMap.set(warning.id, warning);
  });

  Logger.info(`✅ ${warningsMap.size} warns chargés avec robustesse`);
  return warningsMap;
}

// Sauvegarder les warns
export async function saveWarnings(warnings: Map<string, Warning>): Promise<void> {
  const warningsArray = Array.from(warnings.values()).map(warning => ({
    ...warning,
    timestamp: (warning.timestamp instanceof Date) ? warning.timestamp.toISOString() : warning.timestamp,
    expiresAt: (warning.expiresAt instanceof Date) ? warning.expiresAt.toISOString() : warning.expiresAt,
  }));

  await WARNING_PERSISTENCE.saveImmediate(warningsArray as any);
}

// Ajouter un warn
export async function addWarning(warning: Warning, warnings: Map<string, Warning>): Promise<void> {
  warnings.set(warning.id, warning);
  await saveWarnings(warnings);
}

// Obtenir tous les warns d'un utilisateur
export function getUserWarnings(userId: string, warnings: Map<string, Warning>): Warning[] {
  return Array.from(warnings.values()).filter(w => w.userId === userId);
}

// Supprimer un warn
export async function deleteWarning(
  warningId: string,
  warnings: Map<string, Warning>
): Promise<void> {
  warnings.delete(warningId);
  await saveWarnings(warnings);
}

// ===============================
// MUTES
// ===============================

// Charger tous les mutes
export async function loadMutes(): Promise<Map<string, Mute>> {
  const mutesArray = await MUTE_PERSISTENCE.load([]);
  
  const mutesMap = new Map<string, Mute>();
  mutesArray.forEach(mute => {
    mute.timestamp = new Date(mute.timestamp);
    mute.expiresAt = new Date(mute.expiresAt);
    mutesMap.set(mute.id, mute);
  });

  Logger.info(`✅ ${mutesMap.size} mutes chargés avec robustesse`);
  return mutesMap;
}

// Sauvegarder les mutes
export async function saveMutes(mutes: Map<string, Mute>): Promise<void> {
  const mutesArray = Array.from(mutes.values()).map(mute => ({
    ...mute,
    timestamp: (mute.timestamp instanceof Date) ? mute.timestamp.toISOString() : mute.timestamp,
    expiresAt: (mute.expiresAt instanceof Date) ? mute.expiresAt.toISOString() : mute.expiresAt,
  }));

  await MUTE_PERSISTENCE.saveImmediate(mutesArray as any);
}

// Ajouter un mute
export async function addMute(mute: Mute, mutes: Map<string, Mute>): Promise<void> {
  mutes.set(mute.id, mute);
  await saveMutes(mutes);
}

// Obtenir un mute actif d'un utilisateur
export function getActiveMute(
  userId: string,
  guildId: string,
  mutes: Map<string, Mute>
): Mute | undefined {
  return Array.from(mutes.values()).find(
    m => m.userId === userId && m.guildId === guildId && m.active
  );
}

// Désactiver un mute
export async function deactivateMute(muteId: string, mutes: Map<string, Mute>): Promise<void> {
  const mute = mutes.get(muteId);
  if (mute) {
    mute.active = false;
    await saveMutes(mutes);
  }
}

// Nettoyer les mutes expirés
export async function cleanExpiredMutes(mutes: Map<string, Mute>): Promise<number> {
  const now = new Date();
  let removedCount = 0;

  for (const [id, mute] of mutes.entries()) {
    if (mute.active && mute.expiresAt <= now) {
      mute.active = false;
      removedCount++;
    }
  }

  if (removedCount > 0) {
    await saveMutes(mutes);
    Logger.info(`🧹 ${removedCount} mutes expirés marqués comme inactifs`);
  }

  return removedCount;
}

// ===============================
// UTILITAIRES
// ===============================

// Créer un ID unique
export function generateId(): string {
  return `mod_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
