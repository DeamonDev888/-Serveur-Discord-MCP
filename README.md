<p align="center">
  <img src="https://readme-typing-svg.herokuapp.com?font=JetBrains+Mono&size=30&duration=3000&color=5865F2&center=true&vCenter=true&multiline=true&height=50&lines=%F0%9F%A4%96+Discord+MCP+Server;%E2%9C%A8+50+outils+pour+automatiser+Discord" alt="Discord MCP Server">
</p>

<br>

<p align="center">
  <a href="https://www.typescriptlang.org/"><img src="https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript"></a>
  <a href="https://nodejs.org/"><img src="https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" alt="Node.js"></a>
  <a href="https://discord.js.org/"><img src="https://img.shields.io/badge/Discord.js-5865F2?style=for-the-badge&logo=discord&logoColor=white" alt="Discord.js"></a>
  <a href="https://zod.dev/"><img src="https://img.shields.io/badge/Zod-F97316?style=for-the-badge&logo=zod&logoColor=white" alt="Zod"></a>
  <a href="#"><img src="https://img.shields.io/badge/FastMCP-000000?style=for-the-badge&logoColor=white" alt="FastMCP"></a>
</p>

---

## 📖 À propos

**Imaginez pouvoir contrôler Discord avec votre IA préférée** ! 💬

Discord MCP Server est un **pont** entre votre intelligence artificielle et Discord. Il transforme votre bot Discord en un assistant intelligent capable de comprendre et d'exécuter vos commandes.

### 🤖 Comment ça marche ?

1. **Votre IA** envoie une commande
2. **Discord MCP Server** traduit cette commande pour Discord
3. **Votre bot** exécute l'action sur votre serveur

### 🌟 Compatible avec TOUS les assistants IA :

- ✅ **Claude Code** / **Claude Desktop**
- ✅ **Hermes Agent** (Nous Research)
- ✅ **OpenClaw** / **Kilo Code**
- ✅ **Cursor AI**
- ✅ **Cline**
- ✅ **Gemini CLI** / **Google AI Studio**
- ✅ **Antigravity**
- ✅ Et tous les autres assistants supportant MCP !

**En résumé :** Parlez à votre IA, et votre bot Discord exécute. C'est aussi simple que ça ! 🚀

Avec **10 outils unifiés** avec actions Enum, vous pouvez faire absolument tout sur Discord :

- Envoyer des messages
- Créer des sondages interactifs, menus et boutons
- Gérer votre serveur (Membres, Rôles, Canaux)
- Et bien plus encore !

👉 **[Consulter la documentation des 10 outils ici](#-fonctionnalités-10-outils-unifiés)**

---

## 🛠️ Fonctionnalités (10 Outils Unifiés)

Le serveur Discord MCP offre **10 outils unifiés** avec actions Enum pour une meilleure organisation :

<details>
<summary>📁 file — Upload / Download de fichiers</summary>

| Action | Description |
|--------|-------------|
| **upload** | Upload un fichier vers Discord (retourne URL CDN) |
| **download** | Télécharge un fichier Discord en local |

</details>

<details>
<summary>💬 message — Gestion des messages</summary>

| Action | Description |
|--------|-------------|
| **send** | Envoie un message texte |
| **edit** | Modifie un message existant |
| **delete** | Supprime un message |
| **read** | Lit l'historique d'un canal |
| **react** | Ajoute une réaction emoji |

</details>

<details>
<summary>🖼️ embed — Embeds Riches</summary>

| Action | Description |
|--------|-------------|
| **create** | Crée un embed avec thèmes, boutons, menus |
| **list** | Liste les embeds d'un canal |
| **get** | Récupère les détails d'un embed |
| **update** | Met à jour un embed existant |

</details>

<details>
<summary>📝 channel — Canaux</summary>

| Action | Description |
|--------|-------------|
| **list** | Liste les canaux |
| **create** | Crée un canal |
| **edit** | Modifie un canal |
| **delete** | Supprime un canal |
| **permissions** | Gère les permissions |

</details>

<details>
<summary>🏷️ role — Rôles</summary>

| Action | Description |
|--------|-------------|
| **list** | Liste les rôles |
| **create** | Crée un rôle |
| **edit** | Modifie un rôle |
| **delete** | Supprime un rôle |
| **permissions** | Gère les permissions |

</details>

<details>
<summary>👥 member — Membres</summary>

| Action | Description |
|--------|-------------|
| **list** | Liste les membres |
| **get** | Info utilisateur |
| **kick** | Expulse un membre |
| **ban** | Ban un membre |
| **unban** | Débannit |
| **timeout** | Timeout temporaire |
| **warn** | Avertissement |
| **move** | Déplace en vocal |
| **role** | Ajoute/retire rôle |

</details>

<details>
<summary>📊 poll — Sondages</summary>

| Action | Description |
|--------|-------------|
| **create** | Crée un sondage interactif |
| **list** | Liste les sondages |
| **get** | Détails d'un sondage |
| **stop** | Arrête un sondage |

</details>

<details>
<summary>🔘 button — Boutons</summary>

| Action | Description |
|--------|-------------|
| **create** | Crée un bouton |
| **register** | Lie une fonction JS |
| **list** | Liste les fonctions |
| **delete** | Supprime une fonction |

</details>

<details>
<summary>📋 menu — Menus déroulants</summary>

| Action | Description |
|--------|-------------|
| **create** | Crée un menu |
| **delete** | Supprime un menu |

</details>

<details>
<summary>🖥️ server — Serveur</summary>

| Action | Description |
|--------|-------------|
| **info** | Info serveur |
| **webhook** | Gère les webhooks |

</details>

> 💡 Chaque outil accepte une action `action: 'list' | 'create' | 'edit' | 'delete' | 'get'` etc. selon l'outil.

---

## 🚀 Démarrage Rapide

### Option 1: Installation npm globale (recommandé)

```bash
# Installation globale
npm install -g discord-mcp-server

# Build
npm run build

# Démarrer
npm start
```

### Option 2: Installation depuis les sources

```bash
# Cloner le projet
git clone https://github.com/DeamonDev888/-Serveur-Discord-MCP.git
cd -Serveur-Discord-MCP

# Installer les dépendances
npm install

# Compiler le projet TypeScript
npm run build

# Démarrer le serveur
npm start
```

---

## ⚙️ Configuration

### Option 1: Installation npm globale (recommandé)

```bash
npm install -g discord-mcp-server
```

Après installation, le serveur est disponible globalement et vous n'avez plus besoin de cloner le repo.

### Option 2: Installation depuis les sources

```bash
git clone https://github.com/DeamonDev888/-Serveur-Discord-MCP.git
cd -Serveur-Discord-MCP
npm install
npm run build
```

---

### Variables d'environnement

Créez un fichier `.env` :

```env
# Token Discord du bot (obligatoire)
DISCORD_TOKEN=votre_token_ici

# Client ID Discord (optionnel)
DISCORD_CLIENT_ID=votre_client_id_ici

# Guild ID pour les opérations de serveur (optionnel)
DISCORD_GUILD_ID=votre_guild_id_ici
```

### Configuration MCP (.mcp.json)

Ajoutez à votre configuration MCP (globale ou par projet) :

**Windows:**
```json
{
  "mcpServers": {
    "discord": {
      "command": "node",
      "args": ["C:\\Users\\VOTRE_USER\\AppData\\Roaming\\npm\\node_modules\\discord-mcp-server\\dist\\index.js"]
    }
  }
}
```

**macOS/Linux:**
```json
{
  "mcpServers": {
    "discord": {
      "command": "node",
      "args": ["/usr/local/lib/node_modules/discord-mcp-server/dist/index.js"]
    }
  }
}
```

> 💡 Avec l'installation npm globale, le chemin reste le même après chaque mise à jour !

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

## 🤖 Prompt System Optimisé

Pour exploiter pleinement les **50 outils** de Discord MCP Server, utilisez le **prompt système dédié** :

👉 **[Accéder au prompt ou skill système ici](https://hackmd.io/@1-f9TrSqR0iVfHGkGYO3zw/rk8_YHVQZl)**

### Qu'est-ce que c'est ?

Un prompt système spécialement conçu pour permettre à votre IA de :

- 🎯 **Utiliser automatiquement** les bons outils Discord selon vos demandes
- 🔧 **Comprendre** les interactions complexes (boutons, menus, sondages)
- 📋 **Générer** des réponses adaptées à chaque contexte Discord
- 🚀 **Optimiser** l'utilisation des 50 outils disponibles

### Comment l'utiliser ?

1. **Copiez** le prompt système depuis le lien ci-dessus
2. **Collez-le** dans votre système de prompt (Claude, ChatGPT, etc.)
3. **Discutez** normalement - l'IA choisira automatiquement les bons outils Discord

Exemple : _"Envoie un message de bienvenue avec des boutons interactifs dans le channel #général"_

L'IA utilisera automatiquement les outils :

- `get_channels` pour trouver le channel
- `envoyer_message` pour le message
- `create_custom_buttons` pour les boutons

---

## 📚 Documentation

- [🎮 Serveur Discord](https://discord.gg/4AR82phtBz)
- [📘 Documentation Discord.js](https://discord.js.org/)
- [🔌 Model Context Protocol](https://modelcontextprotocol.io/)
- [📚 Guide Discord Developers](https://discord.com/developers/docs/intro)
- [🤖 Prompt System/Skill pour Discord MCP](https://hackmd.io/@1-f9TrSqR0iVfHGkGYO3zw/rk8_YHVQZl) - _Prompt système optimisé pour exploiter tous les outils Discord MCP_

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

---

## 📸 Galerie

Voici quelques exemples d'utilisation de Discord MCP Server :

### 🔐 Crypto

![Crypto](assets/crypto.png)

### 🎭 Feux de rôle

![Feux de rôle](assets/feux%20de%20role.png)

### 💻 Aperçu du code

![Code Preview](assets/cod%20preview.png)

### 🍌 Nano Banana

![Nano Banana](assets/nano%20banana.png)

### 📈 Ethereum Price

![Ethereum Price](assets/eth_price.png)
