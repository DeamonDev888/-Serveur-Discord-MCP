
import { Client, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { config } from 'dotenv';
import { join } from 'path';

// Charger .env
config({ path: join(process.cwd(), '.env') });

const TOKEN = process.env.DISCORD_BOT_TOKEN || process.env.DISCORD_TOKEN;
const CHANNEL_ID = '1453196450849620019';

if (!TOKEN) {
    console.error('❌ Token manquant dans .env');
    process.exit(1);
}

const client = new Client({
    intents: [GatewayIntentBits.Guilds]
});

client.once('ready', async () => {
    console.log(`✅ Connecté en tant que ${client.user?.tag}`);

    try {
        const channel = await client.channels.fetch(CHANNEL_ID);
        if (!channel || !('send' in channel)) {
            throw new Error(`Canal ${CHANNEL_ID} introuvable ou non textuel`);
        }

        console.log(`📢 Envoi dans #${('name' in channel ? channel.name : channel.id)}...`);

        const embed = new EmbedBuilder()
            .setTitle('🚀 Bienvenue sur le Serveur !')
            .setDescription(
                "Nous sommes ravis de t'accueillir.\n\n" +
                "Pour accéder à l'intégralité du serveur et obtenir ton rôle de membre, " +
                "merci de compléter ce court questionnaire d'introduction (30 secondes).\n\n" +
                "Clique sur le bouton ci-dessous pour commencer !"
            )
            .setColor('#5865F2')
            .setImage('https://media.discordapp.net/attachments/1443768838587154563/120000000000000000/banner.png?ex=65a00000&is=65800000&hm=... (placeholder)') // Placeholder ou on enlève
            .setFooter({ text: "Introduction obligatoire" });

        const row = new ActionRowBuilder<ButtonBuilder>()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('intro_start')
                    .setLabel('Commencer l\'introduction')
                    .setStyle(ButtonStyle.Primary)
                    .setEmoji('🚀')
            );

        await channel.send({
            embeds: [embed],
            components: [row]
        });

        console.log('✅ Message d\'intro envoyé avec succès !');

    } catch (error) {
        console.error('❌ Erreur:', error);
    } finally {
        client.destroy();
        process.exit(0);
    }
});

client.login(TOKEN);
