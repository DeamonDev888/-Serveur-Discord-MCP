# 🛠️ Liste Complète des Outils - Discord MCP Server (v2.1.3)

Ce document répertorie les **50 outils** disponibles sur le serveur MCP, classés par catégories fonctionnelles.

## 📝 1. Gestion des Messages & Réactions

Outils pour interagir avec les messages texte et les emojis.

| Outil             | Description                                                      |
| :---------------- | :--------------------------------------------------------------- |
| `envoyer_message` | Envoie un message texte simple dans un canal.                    |
| `read_messages`   | Lit l'historique des messages d'un canal (format texte ou JSON). |
| `edit_message`    | Modifie le contenu d'un message existant envoyé par le bot.      |
| `delete_message`  | Supprime un message spécifique.                                  |
| `add_reaction`    | Ajoute une réaction emoji à un message.                          |

## 🖼️ 2. Système d'Embeds Riches & Édition

Création et modification en temps réel d'embeds complexes.

| Outil                     | Description                                                                     |
| :------------------------ | :------------------------------------------------------------------------------ |
| `creer_embed`             | **Outil Principal** : Création d'embeds avec thèmes, boutons et menus intégrés. |
| `list_embeds`             | Scanne un canal pour lister les messages contenant des embeds (pour édition).   |
| `get_embed_details`       | Récupère la structure JSON complète d'un embed existant.                        |
| `update_embed`            | Modifie dynamiquement un embed (titre, description, images, champs, boutons).   |
| `get_embed_analytics`     | Statisiques d'interaction (clics cumulés sur les boutons).                      |
| `list_auto_update_embeds` | Liste les embeds en cycle de mise à jour automatique.                           |
| `stop_embed_auto_update`  | Arrête le cycle de mise à jour d'un embed.                                      |

## 🔘 3. Interactions, Sondages & Fonctions

Gestion des boutons, menus et scripts personnalisés.

| Outil                            | Description                                                     |
| :------------------------------- | :-------------------------------------------------------------- |
| `create_button`                  | Crée un message avec un bouton interactif simple.               |
| `create_menu`                    | Crée un menu déroulant (String Select).                         |
| `create_poll`                    | Génère un sondage interactif riche avec boutons et persistance. |
| `enregistrer_fonction_bouton`    | Lie un script JavaScript à un `customId` de bouton.             |
| `attacher_fonction_bouton_embed` | Lie un script à un bouton spécifique dans un embed.             |
| `lister_fonctions_boutons`       | Affiche tous les scripts JavaScript enregistrés.                |
| `supprimer_fonction_bouton`      | Supprime le script associé à un bouton.                         |

## 👥 4. Membres & Modération

Outils d'administration des utilisateurs.

| Outil                     | Description                                                     |
| :------------------------ | :-------------------------------------------------------------- |
| `list_members`            | Liste les membres du serveur avec options de filtrage et tri.   |
| `get_user_info`           | Détails complets : ID, avatar, rôles, date de création, etc.    |
| `kick_member`             | Expulse un utilisateur du serveur.                              |
| `ban_member`              | Bannit un utilisateur (avec raison et suppression de messages). |
| `unban_member`            | Retire le bannissement d'un utilisateur.                        |
| `timeout_member`          | Applique une sourdine temporaire (Time-out).                    |
| `remove_timeout`          | Retire prématurément le time-out d'un membre.                   |
| `warn_member`             | Enregistre un avertissement (log interne).                      |
| `move_member`             | Déplace un membre vers un autre salon vocal.                    |
| `add_role_to_member`      | Assigne un rôle spécifique à un membre.                         |
| `remove_role_from_member` | Retire un rôle d'un membre.                                     |

## 🏷️ 5. Rôles & Canaux

Organisation structurelle du serveur Discord.

| Outil                     | Description                                             |
| :------------------------ | :------------------------------------------------------ |
| `list_roles`              | Liste tous les rôles et leurs permissions.              |
| `create_role`             | Crée un nouveau rôle (couleur, affichage, permissions). |
| `edit_role`               | Modifie les paramètres d'un rôle existant.              |
| `delete_role`             | Supprime définitivement un rôle.                        |
| `set_role_permissions`    | Définit massivement les permissions d'un rôle.          |
| `list_channels`           | Liste les salons texte, voix et catégories.             |
| `create_channel`          | Crée un nouveau salon avec paramètres.                  |
| `edit_channel`            | Modifie le nom ou la catégorie d'un salon.              |
| `delete_channel`          | Supprime un salon.                                      |
| `set_channel_permissions` | Configure les accès par rôle sur un salon spécifique.   |

## 📸 6. Images & Fichiers

Recherche et transfert de médias vers Discord.

| Outil                 | Description                                                          |
| :-------------------- | :------------------------------------------------------------------- |
| `list_images`         | Recherche Alpha : Logos (BTC, AAPL) ou Photos HD (Cyberpunk, Anime). |
| `uploader_fichier`    | Envoie un fichier local vers un canal Discord.                       |
| `telecharger_fichier` | Télécharge un fichier Discord vers la machine locale.                |

## 💻 7. Système, Webhooks & Dev

Utilitaires techniques et intégrations tierces.

| Outil             | Description                                                  |
| :---------------- | :----------------------------------------------------------- |
| `get_server_info` | Statistiques globales (membres, rôles, salons de la guilde). |
| `get_channels`    | Alternative pour lister les canaux par type.                 |
| `statut_bot`      | Santé du système : uptime, latence, version Node.js.         |
| `logs_explorer`   | Consultation des fichiers logs du serveur.                   |
| `code_preview`    | Affiche du code formaté avec coloration syntaxique.          |
| `create_webhook`  | Crée un point d'entrée Webhook sur un canal.                 |
| `list_webhooks`   | Liste les Webhooks configurés sur un canal.                  |
| `send_webhook`    | Envoie une notification via un Webhook.                      |

---
