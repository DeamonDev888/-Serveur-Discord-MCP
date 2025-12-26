import { promises as fs } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import Logger from './logger.js';

// Configuration : chemin absolu vers le dossier data (indépendant de process.cwd())
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const DATA_DIR = join(__dirname, '../../data');
const MENUS_FILE = join(DATA_DIR, 'menus.json');

// Interface pour les menus déroulants personnalisés
export interface CustomMenu {
  id: string;
  messageId: string;
  channelId: string;
  customId: string;
  placeholder: string;
  minValues: number;
  maxValues: number;
  options: Array<{
    label: string;
    value: string;
    description?: string;
    emoji?: string;
    default?: boolean;
  }>;
  action: {
    type: 'message' | 'embed' | 'role' | 'command' | 'custom' | 'webhook';
    data: any;
  };
  multipleSelections: boolean;
  createdAt: Date;
  creatorId: string;
  isActive: boolean;
}

import { PersistenceManager } from './persistenceManager.js';

const MENU_PERSISTENCE = new PersistenceManager<CustomMenu[]>(MENUS_FILE, 1000);

// Charger tous les menus depuis le fichier
export async function loadCustomMenus(): Promise<Map<string, CustomMenu>> {
  const menusArray = await MENU_PERSISTENCE.load([]);
  
  const menusMap = new Map<string, CustomMenu>();
  menusArray.forEach(menu => {
    menu.createdAt = new Date(menu.createdAt);
    menusMap.set(menu.id, menu);
    if (menu.messageId) {
      menusMap.set(menu.messageId, menu);
    }
  });

  Logger.info(`✅ ${menusMap.size} menus personnalisés chargés avec robustesse`);
  return menusMap;
}

// Sauvegarder tous les menus dans le fichier
export async function saveCustomMenus(menus: Map<string, CustomMenu>): Promise<void> {
  const menusArray = Array.from(menus.values());

  // Convertir les dates en strings pour la sérialisation JSON
  const menusToSave = menusArray.map(menu => ({
    ...menu,
    createdAt: (menu.createdAt instanceof Date) ? menu.createdAt.toISOString() : menu.createdAt,
  }));

  await MENU_PERSISTENCE.saveImmediate(menusToSave as any);
}

// Ajouter un nouveau menu
export async function addCustomMenu(
  menu: CustomMenu,
  menus: Map<string, CustomMenu>
): Promise<void> {
  menus.set(menu.id, menu);
  await saveCustomMenus(menus);
}

// Supprimer un menu
export async function deleteCustomMenu(
  menuId: string,
  menus: Map<string, CustomMenu>
): Promise<void> {
  menus.delete(menuId);
  await saveCustomMenus(menus);
}

// Obtenir un menu par ID
export function getCustomMenu(
  menuId: string,
  menus: Map<string, CustomMenu>
): CustomMenu | undefined {
  return menus.get(menuId);
}

// Obtenir un menu par customId
export function getCustomMenuByCustomId(
  customId: string,
  menus: Map<string, CustomMenu>
): CustomMenu | undefined {
  for (const menu of menus.values()) {
    if (menu.customId === customId) {
      return menu;
    }
  }
  return undefined;
}

// Mettre à jour un menu
export async function updateCustomMenu(
  menuId: string,
  updates: Partial<CustomMenu>,
  menus: Map<string, CustomMenu>
): Promise<void> {
  const menu = menus.get(menuId);
  if (menu) {
    Object.assign(menu, updates);
    await saveCustomMenus(menus);
  }
}

// Nettoyer les anciens menus (plus de 24h)
export async function cleanOldMenus(menus: Map<string, CustomMenu>): Promise<number> {
  const now = new Date();
  const maxAge = 24 * 60 * 60 * 1000;
  let deletedCount = 0;

  for (const [menuId, menu] of menus.entries()) {
    if (now.getTime() - menu.createdAt.getTime() > maxAge) {
      menus.delete(menuId);
      deletedCount++;
    }
  }

  if (deletedCount > 0) {
    await saveCustomMenus(menus);
    Logger.info(`🧹 ${deletedCount} anciens menus personnalisés supprimés`);
  }

  return deletedCount;
}

// Activer/Désactiver un menu
export async function toggleCustomMenu(
  menuId: string,
  active: boolean,
  menus: Map<string, CustomMenu>
): Promise<void> {
  await updateCustomMenu(menuId, { isActive: active }, menus);
}

// Sauvegarder une sélection dans un menu
export async function saveMenuSelection(
  menuId: string,
  userId: string,
  selectedValues: string[],
  menus: Map<string, CustomMenu>
): Promise<void> {
  const menu = menus.get(menuId);
  if (menu) {
    if (!menu.action.data) {
      menu.action.data = {};
    }
    if (!menu.action.data.selections) {
      menu.action.data.selections = {};
    }

    menu.action.data.selections[userId] = selectedValues;
    await saveCustomMenus(menus);
  }
}

// Obtenir les sélections d'un menu
export function getMenuSelections(
  menuId: string,
  menus: Map<string, CustomMenu>
): Record<string, string[]> | undefined {
  const menu = menus.get(menuId);
  if (menu && menu.action.data?.selections) {
    return menu.action.data.selections;
  }
  return undefined;
}