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

- ✅ **Claude Code** (l'outil que vous utilisez maintenant !)
- ✅ **Google AI Studio** (Gemini)
- ✅ **Antigravity**
- ✅ **Gemini CLI**
- ✅ **Cursor AI**
- ✅ **Kilo Code**
- ✅ **Cline**
- ✅ Et tous les autres assistants supportant MCP !

**En résumé :** Parlez à votre IA, et votre bot Discord exécute. C'est aussi simple que ça ! 🚀

Avec **50 outils puissants**, vous pouvez faire absolument tout sur Discord :

- Envoyer des messages
- Créer des sondages interactifs, menus et boutons
- Gérer votre serveur (Membres, Rôles, Canaux)
- Et bien plus encore !

👉 **[Consulter la liste complète des 50 outils ici](./docs/LISTE_OUTILS.md)**

---

## 🛠️ Fonctionnalités (50 Outils)

<details>
<summary>💬 Gestion des Messages & Réactions (5 outils)</summary>

| Outil               | Description                          |
| ------------------- | ------------------------------------ |
| **envoyer_message** | Envoie un message texte simple       |
| **read_messages**   | Lit l'historique d'un canal          |
| **edit_message**    | Modifie un message envoyé par le bot |
| **delete_message**  | Supprime un message spécifique       |
| **add_reaction**    | Ajoute une réaction emoji            |

</details>

<details>
<summary>🖼️ Embeds Riches & Édition (7 outils)</summary>

| Outil                       | Description                                |
| --------------------------- | ------------------------------------------ |
| **creer_embed**             | Création d'embeds avec thèmes et boutons   |
| **list_embeds**             | Scanne un canal pour lister les embeds     |
| **get_embed_details**       | Récupère la structure JSON pour édition    |
| **update_embed**            | Modification dynamique d'un embed existant |
| **get_embed_analytics**     | Statistiques d'interaction                 |
| **list_auto_update_embeds** | Liste les embeds à mise à jour auto        |
| **stop_embed_auto_update**  | Arrête le cycle de mise à jour             |

</details>

<details>
<summary>🔘 Interactions & Sondages (7 outils)</summary>

| Outil                           | Description                                   |
| ------------------------------- | --------------------------------------------- |
| **create_button**               | Crée un bouton interactif simple              |
| **create_menu**                 | Crée un menu déroulant                        |
| **create_poll**                 | Génère un sondage interactif avec persistance |
| **enregistrer_fonction_bouton** | Lie un script JS à un bouton                  |
| **attacher_fonction_embed**     | Lie un script à un bouton d'embed             |
| **lister_fonctions_boutons**    | Affiche tous les scripts enregistrés          |
| **supprimer_fonction_bouton**   | Supprime le script d'un bouton                |

</details>

<details>
<summary>👥 Membres & Modération (11 outils)</summary>

| Outil                       | Description                            |
| --------------------------- | -------------------------------------- |
| **list_members**            | Liste les membres avec filtres         |
| **get_user_info**           | Détails complets du profil utilisateur |
| **kick_member**             | Expulse un membre                      |
| **ban_member**              | Bannit un membre (avec raison)         |
| **unban_member**            | Débannit un utilisateur                |
| **timeout_member**          | Applique une sourdine temporaire       |
| **remove_timeout**          | Retire le time-out d'un membre         |
| **warn_member**             | Enregistre un avertissement            |
| **move_member**             | Déplace un membre vers un salon vocal  |
| **add_role_to_member**      | Assigne un rôle à un utilisateur       |
| **remove_role_from_member** | Retire un rôle d'un utilisateur        |

</details>

<details>
<summary>🏷️ Rôles & Canaux (10 outils)</summary>

| Outil                       | Description                         |
| --------------------------- | ----------------------------------- |
| **list_roles**              | Liste tous les rôles et permissions |
| **create_role**             | Crée un nouveau rôle                |
| **edit_role**               | Modifie un rôle existant            |
| **delete_role**             | Supprime un rôle                    |
| **set_role_permissions**    | Définit massivement les permissions |
| **list_channels**           | Liste les salons et catégories      |
| **create_channel**          | Crée un nouveau salon               |
| **edit_channel**            | Modifie un salon existant           |
| **delete_channel**          | Supprime un salon                   |
| **set_channel_permissions** | Configure les accès par rôle        |

</details>

<details>
<summary>📸 Images & Fichiers (3 outils)</summary>

| Outil                   | Description                                |
| ----------------------- | ------------------------------------------ |
| **list_images**         | Recherche de logos et photos HD (Unsplash) |
| **uploader_fichier**    | Envoie un fichier local vers Discord       |
| **telecharger_fichier** | Télécharge un fichier Discord en local     |

</details>

<details>
<summary>💻 Système & Webhooks (7 outils)</summary>

| Outil               | Description                                |
| ------------------- | ------------------------------------------ |
| **get_server_info** | Statistiques globales de la guilde         |
| **statut_bot**      | Santé, uptime et latence du bot            |
| **logs_explorer**   | Consultation des logs du serveur           |
| **code_preview**    | Affiche du code avec coloration syntaxique |
| **create_webhook**  | Crée un webhook sur un canal               |
| **list_webhooks**   | Liste les webhooks d'un canal              |
| **send_webhook**    | Envoie un message via webhook              |

</details>

---

## 🚀 Démarrage Rapide

### Prérequis

- [Node.js](https://nodejs.org/) (v16 ou plus)
- [npm](https://www.npmjs.com/) (v8 ou plus)
- Un bot Discord ([créer ici](https://discord.com/developers/applications))

### Installation

```bash
# Cloner le projet

git clone https://github.com/DeamonDev888/-Serveur-Discord-MCP.git
cd -Serveur-Discord-MCP

# Installer les dépendances
npm install

# Configurer le bot
cp .env.example .env
# Éditer .env avec votre token Discord

# Compiler le projet TypeScript
npm run build

# Démarrer le serveur
npm start
```

---

## ⚙️ Configuration

### Variables d'environnement

Créez un fichier `.env` :

```env
# Token Discord du bot (obligatoire)
DISCORD_TOKEN=votre_token_ici
```

### Configuration .mcp.json

Ajoutez à votre configuration MCP :

```json
{
  "mcpServers": {
    "discord-server": {
      "command": "node",
      "args": ["CHEMIN_VERS_VOTRE_PROJET\\serveur_discord\\dist\\index.js"]
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
