import { promises as fs } from 'fs';
import { join } from 'path';

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
  reason: string;
  expiresAt: Date;
  active: boolean;
}

// ===============================
// MODÉRATION ACTIONS
// ===============================

// Assurer que le dossier data existe
async function ensureDataDir(): Promise<void> {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
  } catch (error) {
    console.error('Erreur lors de la création du dossier data:', error);
  }
}

// Charger toutes les actions de modération
export async function loadModerationActions(): Promise<Map<string, ModerationAction>> {
  await ensureDataDir();

  try {
    const data = await fs.readFile(MODERATION_FILE, 'utf-8');
    const actionsArray: ModerationAction[] = JSON.parse(data);

    const actionsMap = new Map<string, ModerationAction>();
    actionsArray.forEach(action => {
      action.timestamp = new Date(action.timestamp);
      actionsMap.set(action.id, action);
    });

    console.log(`✅ ${actionsMap.size} actions de modération chargées`);
    return actionsMap;
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT') {
      await fs.writeFile(MODERATION_FILE, JSON.stringify([], null, 2), 'utf-8');
      return new Map<string, ModerationAction>();
    }
    console.error('❌ Erreur lors du chargement des actions de modération:', error);
    return new Map<string, ModerationAction>();
  }
}

// Sauvegarder les actions de modération
export async function saveModerationActions(actions: Map<string, ModerationAction>): Promise<void> {
  await ensureDataDir();

  try {
    const actionsArray = Array.from(actions.values()).map(action => ({
      ...action,
      timestamp: action.timestamp.toISOString(),
    }));

    await fs.writeFile(MODERATION_FILE, JSON.stringify(actionsArray, null, 2), 'utf-8');
  } catch (error) {
    console.error('❌ Erreur lors de la sauvegarde des actions:', error);
    throw error;
  }
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
  await ensureDataDir();

  try {
    const data = await fs.readFile(WARNINGS_FILE, 'utf-8');
    const warningsArray: Warning[] = JSON.parse(data);

    const warningsMap = new Map<string, Warning>();
    warningsArray.forEach(warning => {
      warning.timestamp = new Date(warning.timestamp);
      if (warning.expiresAt) warning.expiresAt = new Date(warning.expiresAt);
      warningsMap.set(warning.id, warning);
    });

    console.log(`✅ ${warningsMap.size} warns chargés`);
    return warningsMap;
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT') {
      await fs.writeFile(WARNINGS_FILE, JSON.stringify([], null, 2), 'utf-8');
      return new Map<string, Warning>();
    }
    console.error('❌ Erreur lors du chargement des warns:', error);
    return new Map<string, Warning>();
  }
}

// Sauvegarder les warns
export async function saveWarnings(warnings: Map<string, Warning>): Promise<void> {
  await ensureDataDir();

  try {
    const warningsArray = Array.from(warnings.values()).map(warning => ({
      ...warning,
      timestamp: warning.timestamp.toISOString(),
      expiresAt: warning.expiresAt?.toISOString(),
    }));

    await fs.writeFile(WARNINGS_FILE, JSON.stringify(warningsArray, null, 2), 'utf-8');
  } catch (error) {
    console.error('❌ Erreur lors de la sauvegarde des warns:', error);
    throw error;
  }
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
export async function deleteWarning(warningId: string, warnings: Map<string, Warning>): Promise<void> {
  warnings.delete(warningId);
  await saveWarnings(warnings);
}

// ===============================
// MUTES
// ===============================

// Charger tous les mutes
export async function loadMutes(): Promise<Map<string, Mute>> {
  await ensureDataDir();

  try {
    const data = await fs.readFile(MUTES_FILE, 'utf-8');
    const mutesArray: Mute[] = JSON.parse(data);

    const mutesMap = new Map<string, Mute>();
    mutesArray.forEach(mute => {
      mute.timestamp = new Date(mute.timestamp);
      mute.expiresAt = new Date(mute.expiresAt);
      mutesMap.set(mute.id, mute);
    });

    console.log(`✅ ${mutesMap.size} mutes chargés`);
    return mutesMap;
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT') {
      await fs.writeFile(MUTES_FILE, JSON.stringify([], null, 2), 'utf-8');
      return new Map<string, Mute>();
    }
    console.error('❌ Erreur lors du chargement des mutes:', error);
    return new Map<string, Mute>();
  }
}

// Sauvegarder les mutes
export async function saveMutes(mutes: Map<string, Mute>): Promise<void> {
  await ensureDataDir();

  try {
    const mutesArray = Array.from(mutes.values()).map(mute => ({
      ...mute,
      timestamp: mute.timestamp.toISOString(),
      expiresAt: mute.expiresAt.toISOString(),
    }));

    await fs.writeFile(MUTES_FILE, JSON.stringify(mutesArray, null, 2), 'utf-8');
  } catch (error) {
    console.error('❌ Erreur lors de la sauvegarde des mutes:', error);
    throw error;
  }
}

// Ajouter un mute
export async function addMute(mute: Mute, mutes: Map<string, Mute>): Promise<void> {
  mutes.set(mute.id, mute);
  await saveMutes(mutes);
}

// Obtenir un mute actif d'un utilisateur
export function getActiveMute(userId: string, guildId: string, mutes: Map<string, Mute>): Mute | undefined {
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
    console.log(`🧹 ${removedCount} mutes expirés marqués comme inactifs`);
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
