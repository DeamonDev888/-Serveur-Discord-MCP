import { promises as fs } from 'fs';
import { join } from 'path';
import Logger from './logger.js';

// Configuration
const DATA_DIR = join(process.cwd(), 'data');
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

// Assurer que le dossier data existe
async function ensureDataDir(): Promise<void> {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
  } catch (error) {
    Logger.error('Erreur lors de la création du dossier data:', error);
  }
}

// Charger tous les menus depuis le fichier
export async function loadCustomMenus(): Promise<Map<string, CustomMenu>> {
  await ensureDataDir();

  try {
    const data = await fs.readFile(MENUS_FILE, 'utf-8');
    const menusArray: CustomMenu[] = JSON.parse(data);

    // Convertir le tableau en Map
    const menusMap = new Map<string, CustomMenu>();
    menusArray.forEach(menu => {
      // Convertir la date string en Date object
      menu.createdAt = new Date(menu.createdAt);
      menusMap.set(menu.id, menu);
      // Stocker aussi avec messageId si disponible
      if (menu.messageId) {
        menusMap.set(menu.messageId, menu);
      }
    });

    Logger.info(`✅ ${menusMap.size} menus personnalisés chargés depuis le fichier`);
    return menusMap;
  } catch (error) {
    // Si le fichier n'existe pas, créer un fichier vide
    if (error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT') {
      Logger.info('📄 Aucun fichier de menus existant, création du fichier...');
      await fs.writeFile(MENUS_FILE, JSON.stringify([], null, 2), 'utf-8');
      Logger.info('📄 Fichier de menus créé, démarrage avec une Map vide');
      return new Map<string, CustomMenu>();
    }

    Logger.error('❌ Erreur lors du chargement des menus:', error);
    return new Map<string, CustomMenu>();
  }
}

// Sauvegarder tous les menus dans le fichier
export async function saveCustomMenus(menus: Map<string, CustomMenu>): Promise<void> {
  await ensureDataDir();

  try {
    // Convertir la Map en tableau
    const menusArray = Array.from(menus.values());
    Logger.debug(`[MENU_PERSISTENCE] Tentative de sauvegarde de ${menusArray.length} menus`);

    // Convertir les dates en strings pour la sérialisation JSON
    const menusToSave = menusArray.map(menu => ({
      ...menu,
      createdAt: menu.createdAt.toISOString(),
    }));

    await fs.writeFile(MENUS_FILE, JSON.stringify(menusToSave, null, 2), 'utf-8');
    Logger.info(`[MENU_PERSISTENCE] ✅ ${menus.size} menus personnalisés sauvegardés dans le fichier`);
  } catch (error) {
    Logger.error('[MENU_PERSISTENCE] ❌ Erreur lors de la sauvegarde des menus:', error);
    throw error;
  }
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
  const maxAge = 24 * 60 * 60 * 1000; // 24 heures en ms
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
    // Ajouter les sélections à l'action.data si elles n'existent pas
    if (!menu.action.data) {
      menu.action.data = {};
    }
    if (!menu.action.data.selections) {
      menu.action.data.selections = new Map<string, string[]>();
    }

    // Convertir en Map et sauvegarder
    (menu.action.data.selections as Map<string, string[]>).set(userId, selectedValues);
    await saveCustomMenus(menus);
  }
}

// Obtenir les sélections d'un menu
export function getMenuSelections(
  menuId: string,
  menus: Map<string, CustomMenu>
): Map<string, string[]> | undefined {
  const menu = menus.get(menuId);
  if (menu && menu.action.data?.selections) {
    return new Map(menu.action.data.selections);
  }
  return undefined;
}