import { promises as fs } from 'fs';
import { join } from 'path';

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
  createdAt: Date;
}

// Assurer que le dossier data existe
async function ensureDataDir(): Promise<void> {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
  } catch (error) {
    console.error('Erreur lors de la création du dossier data:', error);
  }
}

// Charger tous les boutons depuis le fichier
export async function loadCustomButtons(): Promise<Map<string, CustomButton>> {
  await ensureDataDir();

  try {
    const data = await fs.readFile(BUTTONS_FILE, 'utf-8');
    const buttonsArray: any[] = JSON.parse(data);

    // Convertir le tableau en Map
    const buttonsMap = new Map<string, CustomButton>();
    buttonsArray.forEach(button => {
      // Convertir la date string en Date object
      button.createdAt = new Date(button.createdAt);
      buttonsMap.set(button.id, button);
    });

    console.log(`✅ ${buttonsMap.size} boutons personnalisés chargés depuis le fichier`);
    return buttonsMap;
  } catch (error) {
    // Si le fichier n'existe pas, créer un fichier vide
    if (error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT') {
      console.log('📄 Aucun fichier de boutons existant, création du fichier...');
      await fs.writeFile(BUTTONS_FILE, JSON.stringify([], null, 2), 'utf-8');
      console.log('📄 Fichier de boutons créé, démarrage avec une Map vide');
      return new Map<string, CustomButton>();
    }

    console.error('❌ Erreur lors du chargement des boutons:', error);
    return new Map<string, CustomButton>();
  }
}

// Sauvegarder tous les boutons dans le fichier
export async function saveCustomButtons(buttons: Map<string, CustomButton>): Promise<void> {
  await ensureDataDir();

  try {
    // Convertir la Map en tableau
    const buttonsArray = Array.from(buttons.values());
    console.log(`[BUTTON_PERSISTENCE] Tentative de sauvegarde de ${buttonsArray.length} boutons`);

    // Convertir les dates en strings pour la sérialisation JSON
    const buttonsToSave = buttonsArray.map(button => ({
      ...button,
      createdAt: button.createdAt.toISOString(),
    }));

    console.log(
      `[BUTTON_PERSISTENCE] Données à sauvegarder:`,
      JSON.stringify(buttonsToSave, null, 2)
    );

    await fs.writeFile(BUTTONS_FILE, JSON.stringify(buttonsToSave, null, 2), 'utf-8');
    console.log(
      `[BUTTON_PERSISTENCE] ✅ ${buttons.size} boutons personnalisés sauvegardés dans le fichier`
    );

    // Vérifier que le fichier a été écrit
    const verifyData = await fs.readFile(BUTTONS_FILE, 'utf-8');
    console.log(
      `[BUTTON_PERSISTENCE] Vérification - Taille du fichier: ${verifyData.length} caractères`
    );
  } catch (error) {
    console.error('[BUTTON_PERSISTENCE] ❌ Erreur lors de la sauvegarde des boutons:', error);
    throw error;
  }
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
  const maxAge = 24 * 60 * 60 * 1000; // 24 heures en ms
  let deletedCount = 0;

  for (const [buttonId, button] of buttons.entries()) {
    if (now.getTime() - button.createdAt.getTime() > maxAge) {
      buttons.delete(buttonId);
      deletedCount++;
    }
  }

  if (deletedCount > 0) {
    await saveCustomButtons(buttons);
    console.log(`🧹 ${deletedCount} anciens boutons personnalisés supprimés`);
  }

  return deletedCount;
}
