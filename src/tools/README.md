# 🔧 Outils MCP Discord

Structure organisée des 58 outils MCP Discord pour le serveur.

## 📁 Structure des Dossiers

```
tools/
├── index.ts                 # Export principal de tous les outils
├── types.ts                 # Types TypeScript centralisés
│
├── messages/                # 📊 Gestion des Messages (5 outils)
│   ├── index.ts
│   ├── sendMessage.ts       # envoyer_message
│   ├── editMessage.ts       # edit_message
│   ├── deleteMessage.ts     # delete_message
│   ├── readMessages.ts      # read_messages
│   └── reactions.ts         # add_reaction
│
├── embeds/                  # 🎨 Messages Avancés / Embeds (9 outils)
│   ├── index.ts
│   ├── templates.ts         # lister_templates + EMBED_TEMPLATES
│   └── ...                  # creer_embed, creer_embed_v2, analytics, thèmes, logos
│
├── polls/                   # 📝 Sondages (3 outils)
│   ├── index.ts
│   └── createPoll.ts        # creer_sondage + formatDuration()
│
├── interactions/            # ⚡ Interactions (7 outils)
│   └── index.ts             # create_custom_buttons, create_custom_menu, etc.
│
├── persistent/              # 🎮 Fonctions Persistantes (9 outils)
│   └── index.ts             # enregistrer_fonction_bouton, creer_bouton_avance, etc.
│
├── members/                 # 👥 Gestion des Membres (3 outils)
│   ├── index.ts
│   ├── listMembers.ts       # list_members
│   ├── userInfo.ts          # get_user_info
│   └── serverInfo.ts        # get_server_info
│
├── moderation/              # 🔐 Modération (8 outils)
│   └── moderation.ts        # kick_member, ban_member, mute_member, etc.
│
├── roles/                   # 🎭 Rôles (6 outils)
│   └── roleManager.ts       # create_role, delete_role, edit_role, etc.
│
├── channels/                # 📁 Canaux (4 outils)
│   ├── index.ts
│   ├── channelAdmin.ts      # create_channel, delete_channel, edit_channel
│   └── channelManager.ts    # get_channels, move_member_to_channel
│
├── files/                   # 📁 Fichiers & Webhooks (4 outils)
│   ├── index.ts
│   ├── fileUpload.ts        # uploader_fichier
│   └── webhooks.ts          # create_webhook, list_webhooks, send_webhook
│
├── system/                  # ⚙️ Système (4 outils)
│   └── index.ts             # discord_status, statut_bot, logs_explorer, etc.
│
└── utils/                   # 🛠️ Utilitaires partagés
    └── index.ts             # Constants, helpers, types ré-exportés
```

## 📋 Inventaire Complet des 58 Outils

### 📊 Messages (5)
| Outil | Description |
|-------|-------------|
| `envoyer_message` | Envoie un message texte simple |
| `edit_message` | Modifie un message existant |
| `delete_message` | Supprime un message |
| `read_messages` | Lit l'historique des messages |
| `add_reaction` | Ajoute une réaction emoji |

### 🎨 Embeds (9)
| Outil | Description |
|-------|-------------|
| `creer_embed` | Crée un embed ultra-personnalisable |
| `creer_embed_v2` | Embed ultime (graphiques, mini-jeux, logos) |
| `lister_templates` | Liste tous les templates d'embeds |
| `get_embed_analytics` | Analytics d'un embed spécifique |
| `list_auto_update_embeds` | Liste les embeds avec auto-update |
| `list_embed_themes` | Liste tous les thèmes d'embed |
| `list_crypto_logos` | Logos crypto disponibles |
| `list_company_logos` | Logos entreprises (S&P 500) |
| `list_misc_logos` | Logos divers (réseaux, services) |

### 📝 Sondages (3)
| Outil | Description |
|-------|-------------|
| `creer_sondage` | Sondage simple avec réactions |
| `creer_sondage_boutons` | Sondage interactif avec boutons |
| `vote_sondage` | Vote dans un sondage interactif |

### ⚡ Interactions (7)
| Outil | Description |
|-------|-------------|
| `create_custom_buttons` | Crée des boutons personnalisés |
| `create_custom_menu` | Crée un menu déroulant |
| `appuyer_bouton` | Appuie sur un bouton |
| `selectionner_menu` | Sélectionne une option dans un menu |
| `create_interactive_quiz` | Quiz interactif |
| `show_game_result` | Résultat de jeu avec animation |
| `code_preview` | Affiche du code avec coloration |

### 🎮 Persistent (9)
| Outil | Description |
|-------|-------------|
| `enregistrer_fonction_bouton` | Enregistre une fonction personnalisée |
| `creer_bouton_avance` | Bouton avec fonction personnalisée |
| `lister_fonctions_boutons` | Liste les fonctions enregistrées |
| `creer_menu_persistant` | Menu déroulant persistant |
| `lister_menus_actifs` | Liste les menus persistants |
| `lister_boutons_actifs` | Liste les boutons personnalisés |
| `supprimer_bouton_perso` | Supprime un bouton personnalisé |
| `nettoyer_anciens_boutons` | Supprime les boutons de +24h |
| `deploy_rpg` | Déploie le mini-RPG persistant |

### 👥 Members (3)
| Outil | Description |
|-------|-------------|
| `list_members` | Liste les membres et leurs rôles |
| `get_user_info` | Informations détaillées utilisateur |
| `get_server_info` | Informations détaillées du serveur |

### 🔐 Modération (8)
| Outil | Description |
|-------|-------------|
| `kick_member` | Expulse un membre |
| `ban_member` | Bannit un membre |
| `unban_member` | Débannit un membre |
| `mute_member` | Mute un membre temporairement |
| `unmute_member` | Démute un membre |
| `warn_member` | Avertit un membre |
| `get_warnings` | Affiche les avertissements |
| `clear_warnings` | Efface les avertissements |

### 🎭 Rôles (6)
| Outil | Description |
|-------|-------------|
| `create_role` | Crée un nouveau rôle |
| `delete_role` | Supprime un rôle |
| `edit_role` | Modifie un rôle |
| `add_role_to_member` | Donne un rôle à un membre |
| `remove_role_from_member` | Retire un rôle d'un membre |
| `get_member_roles` | Affiche les rôles d'un membre |

### 📁 Canaux (4)
| Outil | Description |
|-------|-------------|
| `create_channel` | Crée un nouveau canal |
| `delete_channel` | Supprime un canal |
| `edit_channel` | Modifie un canal |
| `get_channels` | Liste tous les canaux |

### 📁 Files (4)
| Outil | Description |
|-------|-------------|
| `uploader_fichier` | Upload un fichier local |
| `create_webhook` | Crée un webhook |
| `list_webhooks` | Liste les webhooks d'un canal |
| `send_webhook` | Envoie un message via webhook |

### 🔍 Logos (2)
| Outil | Description |
|-------|-------------|
| `get_logo` | Logo universel |
| `get_crypto_logo` | Logo crypto spécifique |

### ⚙️ System (4)
| Outil | Description |
|-------|-------------|
| `discord_status` | Vérifie le statut du bot |
| `statut_bot` | Statut actuel du bot |
| `logs_explorer` | Explore les derniers logs |
| `stop_embed_auto_update` | Arrête l'auto-update d'un embed |

## 💡 Utilisation

```typescript
// Importer un outil spécifique
import { sendMessage, SendMessageSchema } from './tools/messages/index.js';

// Importer tous les outils d'une catégorie
import * as Messages from './tools/messages/index.js';

// Importer depuis l'index principal
import {
  sendMessage,
  createPoll,
  listMembers,
  // ... etc
} from './tools/index.js';
```

## 📝 Notes

- Les outils dans `messages/`, `embeds/`, `polls/`, `members/`, et `files/` ont été complètement refactorisés avec une structure propre.
- Les outils existants dans `moderation.ts`, `roleManager.ts`, `channelAdmin.ts`, etc. sont conservés pour la compatibilité.
- Les outils complexes (embeds v2, interactions, persistent) restent dans `index.ts` principal et seront migrés progressivement.
