
import { config } from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function findEnvPath() {
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

const envPath = findEnvPath();
console.log('Env Path:', envPath);
config({ path: envPath });

console.log('DISCORD_TOKEN length:', process.env.DISCORD_TOKEN ? process.env.DISCORD_TOKEN.length : 'MISSING');
console.log('DISCORD_BOT_TOKEN length:', process.env.DISCORD_BOT_TOKEN ? process.env.DISCORD_BOT_TOKEN.length : 'MISSING');
console.log('Token to be used length:', (process.env.DISCORD_BOT_TOKEN || process.env.DISCORD_TOKEN || '').length);

if (process.env.DISCORD_TOKEN) {
    console.log('Token starts with:', process.env.DISCORD_TOKEN.substring(0, 10));
}
