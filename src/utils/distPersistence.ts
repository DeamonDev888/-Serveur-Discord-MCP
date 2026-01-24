/**
 * 💾 GESTIONNAIRE DE PERSISTANCE UNIFIÉ (data/)
 * =============================================
 * Toute la persistance va dans data/ qui est gitignore
 *
 * Avantages:
 * - Données runtime ignorées par git
 * - Clean git repo
 * - Données SURVIVENT au build (contrairement à dist/data/)
 */

import { promises as fs } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

// ============================================================================
// CONFIGURATION
// ============================================================================

// Point de racine - chemin absolu basé sur le fichier source (indépendant de process.cwd())
// Utilise data/ à la racine du projet serveur_discord (pas dist/data/)
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DATA_DIR = join(__dirname, '../../data');

// ============================================================================
// INITIALISATION DU RÉPERTOIRE
// ============================================================================

export async function ensureDataDir(): Promise<void> {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
  } catch {
    // Le répertoire existe déjà ou erreur non critique
  }
}

// ============================================================================
// FONCTIONS GÉNÉRIQUES DE PERSISTANCE
// ============================================================================

/**
 * Charge des données depuis un fichier JSON
 */
export async function loadFromFile<T>(filename: string, defaultValue: T): Promise<T> {
  await ensureDataDir();
  const filepath = join(DATA_DIR, filename);

  try {
    const content = await fs.readFile(filepath, 'utf-8');
    return JSON.parse(content) as T;
  } catch {
    // Fichier n'existe pas ou erreur de parsing
    return defaultValue;
  }
}

/**
 * Sauvegarde des données dans un fichier JSON
 */
export async function saveToFile<T>(filename: string, data: T): Promise<void> {
  await ensureDataDir();
  const filepath = join(DATA_DIR, filename);

  await fs.writeFile(filepath, JSON.stringify(data, null, 2), 'utf-8');
}

/**
 * Supprime un fichier de données
 */
export async function deleteFile(filename: string): Promise<void> {
  const filepath = join(DATA_DIR, filename);

  try {
    await fs.unlink(filepath);
  } catch {
    // Fichier n'existe pas - pas grave
  }
}

/**
 * Liste tous les fichiers de données
 */
export async function listDataFiles(): Promise<string[]> {
  await ensureDataDir();

  try {
    const files = await fs.readdir(DATA_DIR);
    return files.filter(f => f.endsWith('.json'));
  } catch {
    return [];
  }
}

// ============================================================================
// TYPES D'ACTIONS POUR LES COMPOSANTS PERSISTANTS
// ============================================================================

export type ButtonAction =
  | { type: 'message'; content: string; ephemeral?: boolean }
  | { type: 'embed'; embed: { title?: string; description?: string; color?: number }; ephemeral?: boolean }
  | { type: 'link'; url: string }
  | { type: 'role'; roleId: string }
  | { type: 'delete' }
  | { type: 'refresh' }
  | { type: 'edit'; newEmbed: any }
  | { type: 'custom'; handler: string };

export type MenuAction =
  | { type: 'message'; content: string; ephemeral?: boolean; template?: string }
  | { type: 'embed'; embed: { title?: string; description?: string; color?: number }; ephemeral?: boolean }
  | { type: 'role'; roleId: string; mode?: 'add' | 'remove' | 'toggle' }
  | { type: 'delete' }
  | { type: 'refresh' }
  | { type: 'link'; url: string; template?: string }
  | { type: 'edit'; newEmbed: any }
  | { type: 'custom'; handler: string }
  | { type: 'modal'; modalId: string };

// ============================================================================
// GESTIONNAIRE SPÉCIALISÉ POUR LES BOUTONS PERSISTANTS
// ============================================================================

export interface PersistentButton {
  id: string;                    // ID unique du bouton
  messageId: string;             // ID du message contenant le bouton
  channelId: string;             // ID du channel
  embedIndex?: number;           // Index de l'embed si plusieurs
  label: string;                 // Label du bouton
  style: string;                 // Primary, Secondary, Success, Danger
  emoji?: string;                // Emoji optionnel
  action: ButtonAction;          // Action configurée
  createdAt: string;             // Date de création (ISO)
  updatedAt?: string;            // Dernière mise à jour (ISO)
}

const BUTTONS_FILE = 'persistent-buttons.json';
const buttonsCache = new Map<string, PersistentButton>();

/**
 * Charge tous les boutons persistants
 */
export async function loadPersistentButtons(): Promise<Map<string, PersistentButton>> {
  const buttonsArray = await loadFromFile<PersistentButton[]>(BUTTONS_FILE, []);

  buttonsCache.clear();
  buttonsArray.forEach(btn => {
    buttonsCache.set(btn.id, btn);
  });

  return buttonsCache;
}

/**
 * Sauvegarde tous les boutons persistants
 */
export async function savePersistentButtons(): Promise<void> {
  const buttonsArray = Array.from(buttonsCache.values());
  await saveToFile(BUTTONS_FILE, buttonsArray);
}

/**
 * Ajoute ou met à jour un bouton persistant
 */
export async function upsertPersistentButton(button: PersistentButton): Promise<void> {
  button.updatedAt = new Date().toISOString();
  buttonsCache.set(button.id, button);
  await savePersistentButtons();
}

/**
 * Supprime un bouton persistant
 */
export async function deletePersistentButton(buttonId: string): Promise<void> {
  if (buttonsCache.delete(buttonId)) {
    await savePersistentButtons();
  }
}

/**
 * Récupère un bouton par son ID
 */
export function getPersistentButton(buttonId: string): PersistentButton | undefined {
  return buttonsCache.get(buttonId);
}

/**
 * Récupère tous les boutons d'un message
 */
export function getButtonsForMessage(messageId: string): PersistentButton[] {
  return Array.from(buttonsCache.values()).filter(b => b.messageId === messageId);
}

/**
 * Nettoie les boutons obsolètes (plus de 30 jours)
 */
export async function cleanupOldButtons(): Promise<number> {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  let deleted = 0;

  for (const [id, btn] of buttonsCache.entries()) {
    if (btn.createdAt < thirtyDaysAgo) {
      buttonsCache.delete(id);
      deleted++;
    }
  }

  if (deleted > 0) {
    await savePersistentButtons();
  }

  return deleted;
}

// ============================================================================
// GESTIONNAIRE SPÉCIALISÉ POUR LES MENUS PERSISTANTS
// ============================================================================

export interface PersistentMenuOption {
  label: string;
  value: string;
  description?: string;
  emoji?: string;
  default?: boolean;
}

export interface PersistentSelectMenu {
  id: string;                    // ID unique du menu
  messageId: string;             // ID du message contenant le menu
  channelId: string;             // ID du channel
  embedIndex?: number;           // Index de l'embed si plusieurs
  type: 'string' | 'user' | 'role' | 'channel' | 'mentionable';
  placeholder?: string;
  minValues?: number;
  maxValues?: number;
  options?: PersistentMenuOption[];  // Pour string select
  action: MenuAction;            // Action configurée
  createdAt: string;             // Date de création (ISO)
  updatedAt?: string;            // Dernière mise à jour (ISO)
}

const MENUS_FILE = 'persistent-menus.json';
const menusCache = new Map<string, PersistentSelectMenu>();

/**
 * Charge tous les menus persistants
 */
export async function loadPersistentMenus(): Promise<Map<string, PersistentSelectMenu>> {
  const menusArray = await loadFromFile<PersistentSelectMenu[]>(MENUS_FILE, []);

  menusCache.clear();
  menusArray.forEach(menu => {
    menusCache.set(menu.id, menu);
  });

  return menusCache;
}

/**
 * Sauvegarde tous les menus persistants
 */
export async function savePersistentMenus(): Promise<void> {
  const menusArray = Array.from(menusCache.values());
  await saveToFile(MENUS_FILE, menusArray);
}

/**
 * Ajoute ou met à jour un menu persistant
 */
export async function upsertPersistentMenu(menu: PersistentSelectMenu): Promise<void> {
  menu.updatedAt = new Date().toISOString();
  menusCache.set(menu.id, menu);
  await savePersistentMenus();
}

/**
 * Supprime un menu persistant
 */
export async function deletePersistentMenu(menuId: string): Promise<void> {
  if (menusCache.delete(menuId)) {
    await savePersistentMenus();
  }
}

/**
 * Récupère un menu par son ID
 */
export function getPersistentMenu(menuId: string): PersistentSelectMenu | undefined {
  return menusCache.get(menuId);
}

/**
 * Récupère tous les menus d'un message
 */
export function getMenusForMessage(messageId: string): PersistentSelectMenu[] {
  return Array.from(menusCache.values()).filter(m => m.messageId === messageId);
}

/**
 * Nettoie les menus obsolètes (plus de 30 jours)
 */
export async function cleanupOldMenus(): Promise<number> {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  let deleted = 0;

  for (const [id, menu] of menusCache.entries()) {
    if (menu.createdAt < thirtyDaysAgo) {
      menusCache.delete(id);
      deleted++;
    }
  }

  if (deleted > 0) {
    await savePersistentMenus();
  }

  return deleted;
}

// ============================================================================
// INITIALISATION AU DÉMARRAGE
// ============================================================================

export async function initPersistence(): Promise<void> {
  await ensureDataDir();
  await loadPersistentButtons();
  await loadPersistentMenus();
}
