/**
 * Outils MCP pour enregistrer des fonctions personnalisées sur les boutons
 */

import { z } from 'zod';
import type { FastMCP } from 'fastmcp';
import Logger from '../utils/logger.js';
import { registerButtonFunction } from '../discord-bridge.js';
import { addCustomButton, loadCustomButtons } from '../utils/buttonPersistence.js';
import * as fs from 'fs';
import * as path from 'path';

// ============================================================================
// ENREGISTREMENT DES OUTILS
// ============================================================================
export function registerButtonFunctionTools(server: FastMCP) {
  // Outils de fonctions de boutons personnalisées désactivés pour simplifier l'interface
}
