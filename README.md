<p align="center">
  <img src="https://readme-typing-svg.herokuapp.com?font=JetBrains+Mono&size=30&duration=3000&color=5865F2&center=true&vCenter=true&multiline=true&height=50&lines=%F0%9F%A4%96+Discord+MCP+Server;%E2%9C%A8+28+outils+pour+automatiser+Discord" alt="Discord MCP Server">
</p>

<br>

<p align="center">
  <a href="https://www.typescriptlang.org/"><img src="https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript"></a>
  <a href="https://nodejs.org/"><img src="https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" alt="Node.js"></a>
  <a href="#"><img src="https://img.shields.io/badge/FastMCP-5865F2?style=for-the-badge&logoColor=white" alt="FastMCP"></a>
</p>

---

## 📖 À propos

**Imaginez pouvoir contrôler Discord avec votre IA préférée** ! 💬

Discord MCP Server est un **pont** entre votre intelligence artificielle et Discord. Il transforme votre bot Discord en un assistant intelligent capable de comprendre et d'exécuter vos commandes.

### 🤖 Comment ça marche ?

1. **Votre IA** (Claude, Gemini, Grok, etc.) envoie une commande
2. **Discord MCP Server** traduit cette commande pour Discord
3. **Votre bot** exécute l'action sur votre serveur

### 🌟 Compatible avec TOUS les assistants IA :

- ✅ **Claude Code** (l'outil que vous utilisez maintenant !)
- ✅ **Google AI Studio** (Gemini)
- ✅ **Antigravity**
- ✅ **Gemini CLI**
- ✅ **Cursor AI**
- ✅ Et tous les autres assistants supportant MCP !

**En résumé :** Parlez à votre IA, et votre bot Discord exécute. C'est aussi simple que ça ! 🚀

Avec **27 outils puissants**, vous pouvez faire absolument tout sur Discord :

- Envoyer des messages
- Créer des sondages interactifs, menu et boutons
- Gérer votre serveur
- Et bien plus encore !

---

## 🛠️ Fonctionnalités

<details>
<summary>💬 Gestion des Messages (8 outils)</summary>

• `discord_status` - Vérifie le statut de connexion du bot
• `send_message` - Envoie un message avec options avancées
• `envoyer_message` - Envoie un message texte simple
• `edit_message` - Modifie un message existant
• `delete_message` - Supprime un message
• `read_messages` - Lit l'historique des messages
• `add_reaction` - Ajoute une réaction emoji
• `modifier_message` - Modifie tout type de message

</details>

<details>
<summary>📎 Fichiers et Médias (1 outil)</summary>

• `uploader_fichier` - Upload un fichier local vers Discord

</details>

<details>
<summary>🎨 Embeds (3 outils)</summary>

• `creer_embed` - Crée un embed enrichi
• `creer_embed_template` - Crée un embed depuis un template
• `lister_templates` - Liste tous les templates disponibles

</details>

<details>
<summary>💻 Code (1 outil)</summary>

• `code_preview` - Affiche du code avec coloration syntaxique

</details>

<details>
<summary>🔗 Webhooks (3 outils)</summary>

• `create_webhook` - Crée un webhook
• `list_webhooks` - Liste les webhooks d'un channel
• `send_webhook` - Envoie un message via webhook

</details>

<details>
<summary>🏢 Serveur et Membres (5 outils)</summary>

• `get_server_info` - Informations détaillées du serveur
• `get_channels` - Liste tous les canaux
• `list_members` - Liste les membres et leurs rôles
• `get_user_info` - Informations sur un utilisateur
• `statut_bot` - Statut actuel du bot

</details>

<details>
<summary>🎮 Interactions (6 outils)</summary>

• `create_custom_buttons` - Crée des boutons personnalisés
• `create_custom_menu` - Crée un menu déroulant
• `creer_sondage` - Crée un sondage interactif
• `vote_sondage` - Vote dans un sondage
• `appuyer_bouton` - Appuie sur un bouton
• `selectionner_menu` - Sélectionne dans un menu

</details>

---

## 🚀 Démarrage Rapide

### Prérequis

- [Node.js](https://nodejs.org/) (v16 ou plus)
- [pnpm](https://pnpm.io/)
- Un bot Discord ([créer ici](https://discord.com/developers/applications))

### Installation

```bash
# Cloner le projet
git clone <url-repo>
cd serveur_discord

# Installer les dépendances
pnpm install

# Configurer le bot
cp .env.example .env
# Éditer .env avec votre token Discord

# Démarrer le serveur
pnpm start
```

---

## ⚙️ Configuration

### Variables d'environnement

Créez un fichier `.env` :

```env
# Token Discord du bot (obligatoire)
DISCORD_TOKEN=votre_token_ici

# ID utilisateur admin (optionnel)
ADMIN_USER_ID=votre_id_discord

# Configuration du bot
BOT_PREFIX=!
BOT_ACTIVITY=Playing with MCP
```

### Configuration Claude Code

Ajoutez à votre configuration MCP :

**Windows :**

```json
{
  "mcpServers": {
    "discord-server": {
      "command": "cmd",
      "args": [
        "/c",
        "npx",
        "tsx",
        "CHEMIN_VERS_VOTRE_PROJET\\serveur_discord\\src\\index_secure.ts"
      ]
    }
  }
}
```

**Linux / macOS :**

```json
{
  "mcpServers": {
    "discord-server": {
      "command": "npx",
      "args": [
        "tsx",
        "CHEMIN_VERS_VOTRE_PROJET/serveur_discord/src/index_secure.ts"
      ]
    }
  }
}
```

> ⚠️ **Important**: Remplacez `CHEMIN_VERS_VOTRE_PROJET` par le chemin absolu vers votre installation

---

## 🤖 Configuration du Bot Discord

1. **Créez un bot** sur le [Portail Développeur](https://discord.com/developers/applications)

2. **Activez les intents** :

   - ✅ Server Members Intent
   - ✅ Message Content Intent

3. **Invitez le bot** avec les permissions :
   - Gérer les messages
   - Envoyer des messages
   - Intégrer des liens
   - Ajouter des réactions
   - Utiliser les emojis externes

---

## 💡 Cas d'usage

Avec Discord MCP Server, vous pouvez :

- 💬 **Automatiser les messages** de bienvenue
- 📊 **Créer des sondages** interactifs
- 🎨 **Générer des embeds** magnifiques
- 📋 **Modérer** votre serveur
- 🔔 **Configurer des webhooks** pour les notifications
- 🎮 **Créer des boutons** pour les commandes rapides
- 📈 **Surveiller** l'activité du serveur
- 🤖 **Créer un bot IA qui répond à TOUT** - Le bot ultime qui peut :
  - Répondre aux questions des membres
  - Aider à la modération automatiquement
  - Animer le serveur avec des jeux et quiz
  - Donner des informations en temps réel
  - Apprendre et s'adapter à votre communauté
  - Interagir avec tous les services externes (API, bases de données, etc.)

---

## 📚 Documentation

- [🎮 Serveur Discord](https://discord.gg/4AR82phtBz)
- [📘 Documentation Discord.js](https://discord.js.org/)
- [🔌 Model Context Protocol](https://modelcontextprotocol.io/)
- [📚 Guide Discord Developers](https://discord.com/developers/docs/intro)

---

## 🤝 Contribuer

Les contributions sont les bienvenues ! N'hésitez pas à :

- ⭐ Mettre une étoile au projet
- 🐛 Signaler des issues
- 💡 Proposer des améliorations
- 🔧 Envoyer des pull requests

---

<div align="center">

**Made with ❤️ by DeaMoN888**

[![GitHub stars](https://img.shields.io/github/stars/yourusername/discord-mcp-server?style=social)](https://github.com/yourusername/discord-mcp-server)
[![GitHub forks](https://img.shields.io/github/forks/yourusername/discord-mcp-server?style=social)](https://github.com/yourusername/discord-mcp-server)
[![GitHub license](https://img.shields.io/github/license/yourusername/discord-mcp-server)](https://github.com/yourusername/discord-mcp-server)

</div>
