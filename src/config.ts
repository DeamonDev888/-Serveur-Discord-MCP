import { config } from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

// Charger le .env avec recherche de chemin robuste
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function findEnvPath(): string {
  const possiblePaths = [
    path.resolve(__dirname, '.env'),
    path.resolve(__dirname, '../.env'),
    path.resolve(__dirname, '../../.env'),
  ];

  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      return p;
    }
  }

  return path.resolve(__dirname, '../.env');
}

// Charger le .env immédiatement lors de l'import de config.ts
const envPath = findEnvPath();
config({ path: envPath });

export const botConfig = {
  token: process.env.DISCORD_BOT_TOKEN || process.env.DISCORD_TOKEN || 'YOUR_BOT_TOKEN',
  clientId: process.env.DISCORD_CLIENT_ID || 'YOUR_CLIENT_ID',
  guildId: process.env.DISCORD_GUILD_ID || 'YOUR_GUILD_ID',
  activity: 'MCP Server v2.0 - 88 outils complets',
  adminUserId: process.env.ADMIN_USER_ID || 'YOUR_ADMIN_USER_ID',
  environment: process.env.NODE_ENV || 'development',
};

export default botConfig;
