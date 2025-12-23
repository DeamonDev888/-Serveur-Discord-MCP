import { config } from 'dotenv';
config({ path: '.env' });

const token = process.env.DISCORD_TOKEN || process.env.DISCORD_BOT_TOKEN;
const clientId = process.env.DISCORD_CLIENT_ID;
const guildId = process.env.DISCORD_GUILD_ID;
const adminUserId = process.env.ADMIN_USER_ID;

console.log('🔍 Test de configuration:');
console.log('─'.repeat(50));
console.log(`Token Discord: ${token ? '✅ Configuré (' + token.substring(0, 10) + '...)' : '❌ Non configuré'}`);
console.log(`Client ID: ${clientId ? '✅ Configuré' : '⚠️ Non configuré (optionnel)'}`);
console.log(`Guild ID: ${guildId ? '✅ Configuré' : '⚠️ Non configuré (optionnel)'}`);
console.log(`Admin User ID: ${adminUserId ? '✅ Configuré' : '⚠️ Non configuré (optionnel)'}`);
console.log('─'.repeat(50));

if (!token) {
  console.log('\n❌ ERREUR: Token Discord non trouvé!');
  console.log('Vérifiez que la variable DISCORD_TOKEN ou DISCORD_BOT_TOKEN est définie dans .env');
  process.exit(1);
} else {
  console.log('\n✅ Configuration OK - Token Discord détecté!');
  process.exit(0);
}
