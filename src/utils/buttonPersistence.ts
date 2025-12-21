import { promises as fs } from 'fs';
import { join } from 'path';
import Logger from './logger.js';

// Configuration
const DATA_DIR = join(process.cwd(), 'data');
const BUTTONS_FILE = join(DATA_DIR, 'buttons.json');

// Interface pour les boutons personnalisés
export interface CustomButton {
  id: string;
  messageId: string;
  channelId: string;
  label: string;
  action: {
    type: string;
    data: any;
  };
  functionCode?: string;
  createdAt: Date;
}

import { PersistenceManager } from './persistenceManager.js';

const BUTTON_PERSISTENCE = new PersistenceManager<CustomButton[]>(BUTTONS_FILE, 1000);

// Charger tous les boutons depuis le fichier
export async function loadCustomButtons(): Promise<Map<string, CustomButton>> {
  const buttonsArray = await BUTTON_PERSISTENCE.load([]);
  
  const buttonsMap = new Map<string, CustomButton>();
  buttonsArray.forEach(button => {
    button.createdAt = new Date(button.createdAt);
    buttonsMap.set(button.id, button);
  });

  Logger.info(`✅ ${buttonsMap.size} boutons personnalisés chargés avec robustesse`);
  return buttonsMap;
}

// Sauvegarder tous les boutons dans le fichier
export async function saveCustomButtons(buttons: Map<string, CustomButton>): Promise<void> {
  const buttonsArray = Array.from(buttons.values());
  
  // Convertir les dates en strings pour la sérialisation JSON
  const buttonsToSave = buttonsArray.map(button => ({
    ...button,
    createdAt: (button.createdAt instanceof Date) ? button.createdAt.toISOString() : button.createdAt,
  }));

  await BUTTON_PERSISTENCE.saveImmediate(buttonsToSave as any);
}

// Ajouter un nouveau bouton
export async function addCustomButton(
  button: CustomButton,
  buttons: Map<string, CustomButton>
): Promise<void> {
  buttons.set(button.id, button);
  await saveCustomButtons(buttons);
}

// Supprimer un bouton
export async function deleteCustomButton(
  buttonId: string,
  buttons: Map<string, CustomButton>
): Promise<void> {
  buttons.delete(buttonId);
  await saveCustomButtons(buttons);
}

// Obtenir un bouton par ID
export function getCustomButton(
  buttonId: string,
  buttons: Map<string, CustomButton>
): CustomButton | undefined {
  return buttons.get(buttonId);
}

// Nettoyer les anciens boutons (plus de 24h)
export async function cleanOldButtons(buttons: Map<string, CustomButton>): Promise<number> {
  const now = new Date();
  const maxAge = 24 * 60 * 60 * 1000;
  let deletedCount = 0;

  for (const [buttonId, button] of buttons.entries()) {
    if (now.getTime() - button.createdAt.getTime() > maxAge) {
      buttons.delete(buttonId);
      deletedCount++;
    }
  }

  if (deletedCount > 0) {
    await saveCustomButtons(buttons);
    Logger.info(`🧹 ${deletedCount} anciens boutons personnalisés supprimés`);
  }

  return deletedCount;
}
