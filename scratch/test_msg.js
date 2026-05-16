import { DiscordBridge } from '../dist/discord-bridge.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

async function test() {
    const token = process.env.DISCORD_BOT_TOKEN || process.env.DISCORD_TOKEN;
    if (!token) {
        console.error('❌ No token found in .env');
        process.exit(1);
    }

    try {
        console.log('🔄 Connecting to Discord...');
        const bridge = DiscordBridge.getInstance(token);
        const client = await bridge.getClient();
        
        console.log(`✅ Connected as: ${client.user.tag}`);
        
        // Find a channel named 'x-news-ai' or similar
        const channel = client.channels.cache.find(c => c.name === 'x-news-ai' || c.id === '1459621267010359357');
        
        if (channel && channel.isTextBased()) {
            console.log(`📡 Sending test message to #${channel.name}...`);
            await channel.send(`🛡️ **TEST DE L'AGENT DISCORD**\nStatut: OPÉRATIONNEL 🟢\nDate: ${new Date().toLocaleString()}\nVersion: Sentinel v15.9 Core`);
            console.log('✅ Message sent!');
        } else {
            console.error('❌ Channel not found or not text-based');
        }
        
        await bridge.destroy();
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

test();
