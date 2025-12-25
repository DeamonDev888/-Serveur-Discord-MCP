import { IntroState, loadIntroStates, saveIntroState } from './introPersistence.js';
import Logger from './logger.js';
import { DiscordBridge } from '../discord-bridge.js';
import { 
    EmbedBuilder, 
    ActionRowBuilder, 
    ButtonBuilder, 
    StringSelectMenuBuilder, 
    ButtonStyle,
    TextChannel
} from 'discord.js';

interface Question {
  id: string;
  text: string;
  type: 'button' | 'menu';
  options?: { label: string; value: string; emoji?: string; style?: string }[];
  placeholder?: string;
}

const QUESTIONS: Question[] = [
  {
    id: 'source',
    text: "👋 Bienvenue ! Pour commencer, comment as-tu découvert ce serveur ?",
    type: 'menu',
    placeholder: "Sélectionne une option...",
    options: [
      { label: "Twitter / X", value: "twitter", emoji: "🐦" },
      { label: "Invitation d'un ami", value: "friend", emoji: "👥" },
      { label: "Recherche GitHub/Web", value: "search", emoji: "🔍" },
      { label: "Autre", value: "other", emoji: "✨" }
    ]
  },
  {
    id: 'goal',
    text: "Quel est ton objectif principal ici ?",
    type: 'button',
    options: [
      { label: "Apprendre / Code", value: "learn", emoji: "📚", style: "Primary" },
      { label: "Partager mes projets", value: "share", emoji: "🚀", style: "Success" },
      { label: "Discuter / Networking", value: "chat", emoji: "💬", style: "Secondary" }
    ]
  },
  {
    id: 'rules',
    text: "Dernière étape : Accepte-tu la charte de bienveillance et de respect ?",
    type: 'button',
    options: [
      { label: "J'accepte la charte", value: "accept", emoji: "✅", style: "Success" }
    ]
  }
];

export class IntroManager {
  
  private async getClient() {
    // On suppose que le token est déjà setté dans l'instance singleton par le main
    const token = process.env.DISCORD_BOT_TOKEN || process.env.DISCORD_TOKEN || '';
    return await DiscordBridge.getInstance(token).getClient();
  }

  async handleInteraction(data: any): Promise<void> {
    const { customId, user, channelId, messageId, values } = data;
    const userId = user.id;

    Logger.info(`🧩 Interaction Intro: ${customId} par ${user.username}`);

    let state = (await loadIntroStates()).get(userId);
    const client = await this.getClient();
    const channel = client.channels.cache.get(channelId) as TextChannel;
    
    if (!channel) {
        Logger.error(`Channel ${channelId} not found`);
        return;
    }

    if (customId === 'intro_start') {
      // Démarrage
      state = {
        userId,
        username: user.username,
        currentStep: 0,
        answers: {},
        completed: false,
        startedAt: new Date().toISOString()
      };
      await saveIntroState(state);
      await this.sendQuestion(channel, state, userId);
      return;
    }

    if (!state) {
        // Cas où l'utilisateur clique sans session
        try {
            // On essaie de répondre en ephemeral si possible via le channel mais sans l'objet interaction c'est dur
            // Ici on a juste channelId. On envoie un message normal temporaire.
            const msg = await channel.send(`⚠️ <@${userId}> Je ne trouve pas ta session. Clique sur 'Commencer' !`);
            setTimeout(() => msg.delete().catch(() => {}), 5000);
        } catch (e) {}
        return;
    }

    // Traitement de la réponse
    const currentQ = QUESTIONS[state.currentStep];
    const answerValue = values ? values[0] : customId.split('_').pop(); 

    if (answerValue) {
        state.answers[currentQ.id] = answerValue;
        
        // Passer à l'étape suivante
        state.currentStep++;
        await saveIntroState(state);

        // Supprimer le message précédent du bot pour nettoyer (si on a messageId)
        if (messageId) {
             try {
                 const msg = await channel.messages.fetch(messageId);
                 if (msg) await msg.delete();
             } catch (e) { /* ignore */ }
        }

        if (state.currentStep >= QUESTIONS.length) {
            await this.finishIntro(channel, state);
        } else {
            await this.sendQuestion(channel, state, userId);
        }
    }
  }

  private async sendQuestion(channel: TextChannel, state: IntroState, userId: string) {
    const question = QUESTIONS[state.currentStep];
    const progress = Math.round(((state.currentStep) / QUESTIONS.length) * 100);

    const embed = new EmbedBuilder()
        .setTitle(`Questionnaire d'Introduction (${state.currentStep + 1}/${QUESTIONS.length})`)
        .setDescription(question.text + `\n\n*Progression : ${progress}%*`)
        .setColor('#0099ff')
        .setFooter({ text: `Pour: ${state.username}` });

    let components: any[] = [];
    
    if (question.type === 'button') {
        const row = new ActionRowBuilder<ButtonBuilder>();
        question.options?.forEach(opt => {
             const btn = new ButtonBuilder()
                .setCustomId(`intro_ans_${opt.value}`)
                .setLabel(opt.label)
                .setStyle(this.getButtonStyle(opt.style));
             if (opt.emoji) btn.setEmoji(opt.emoji);
             row.addComponents(btn);
        });
        components.push(row);
    } else if (question.type === 'menu') {
        const row = new ActionRowBuilder<StringSelectMenuBuilder>()
            .addComponents(
                new StringSelectMenuBuilder()
                    .setCustomId(`intro_ans_menu`)
                    .setPlaceholder(question.placeholder || 'Choisir...')
                    .addOptions(question.options?.map(opt => ({
                        label: opt.label,
                        value: opt.value,
                        emoji: opt.emoji ? { name: opt.emoji } : undefined
                    })) || [])
            );
        components.push(row);
    }

    // Envoyer avec mention pour attirer l'attention, puis supprimer la mention ? Non, propre embed.
    await channel.send({
        content: `<@${userId}>`,
        embeds: [embed],
        components
    });
  }

  private async finishIntro(channel: TextChannel, state: IntroState) {
      state.completed = true;
      state.completedAt = new Date().toISOString();
      await saveIntroState(state);

      const embed = new EmbedBuilder()
          .setTitle("🎉 Bienvenue parmi nous !")
          .setDescription(`Merci <@${state.userId}> d'avoir complété l'introduction.\nTu as maintenant accès au serveur.`)
          .setColor('#00ff00')
          .addFields(
              { name: "Objectif", value: state.answers['goal'] || 'N/A', inline: true },
              { name: "Source", value: state.answers['source'] || 'N/A', inline: true },
              { name: "Statut", value: "✅ Membre vérifié", inline: false }
          );

      await channel.send({
          content: `<@${state.userId}>`,
          embeds: [embed]
      });
      
      // TODO: Attribuer le rôle ici (via client.guilds...)
  }

  private getButtonStyle(style?: string): ButtonStyle {
      switch(style) {
          case 'Primary': return ButtonStyle.Primary;
          case 'Secondary': return ButtonStyle.Secondary;
          case 'Success': return ButtonStyle.Success;
          case 'Danger': return ButtonStyle.Danger;
          default: return ButtonStyle.Primary;
      }
  }
}

export const introManager = new IntroManager();
