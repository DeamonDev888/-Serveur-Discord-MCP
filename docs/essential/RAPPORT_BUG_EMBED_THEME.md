# 🚨 RAPPORT D'INCIDENT : Anomalies `creer_embed` (Thèmes & Images)

Ce rapport détaille les dysfonctionnements observés lors de la tentative de personnalisation du **Macro Dashboard** et explique pourquoi le système persistait à afficher des "images débiles" (logos Bitcoin, banques d'images génériques) malgré les modifications du code.

## 1. Le Problème Observé

L'utilisateur souhaitait un design **premium mais sobre** (pas de logo Bitcoin, pas d'images de fond aléatoires "corporate").
Cependant, à plusieurs reprises :

- Le logo Bitcoin revenait même après avoir été supprimé du code.
- Des images de bureaux/gratte-ciels (assets par défaut) apparaissaient spontanément.
- Le footer persistait à afficher une image même quand la ligne était commentée.

## 2. Analyse Technique & Root Cause

### A. La Logique "Opinionated" des Thèmes MCP

L'outil `discord-server` (fonction `creer_embed`) n'est pas "neutre". Il applique une logique agressive selon le `theme` choisi :

- **Comportement Caché :** Si `theme: 'corporate'` est activé, l'outil semble avoir des **valeurs par défaut hardcodées**. Si vous ne fournissez pas d'image, il en injecte une pour "respecter le thème".
- **Conséquence :** Supprimer la ligne `image: [...]` dans le code ne suffit pas. L'outil détecte l'absence de propriété et remplit le vide avec ses propres assets (le logo Bitcoin par défaut ou des images Unsplash génériques).

### B. Le Piège de `update_embed` (Persistance)

L'API Discord fonctionne par "patch".

- Si vous envoyez un `update` sans mentionner la propriété `thumbnail`, Discord **conserve l'ancienne valeur**.
- **L'erreur :** Commenter la ligne `// thumbnail: ...` en TypeScript envoie `undefined` à l'outil. L'outil (ou Discord) ignore donc ce champ et garde l'ancien logo en mémoire sur le message existant.
- **La solution :** Il est impératif d'envoyer explicitement une chaîne vide `""` ou `null` pour forcer l'effacement.

### C. Conflit de Cache State

Le système Sentinel garde en mémoire l'ID du message (`macroMessageId`).

- Tant que cet ID existe, le Sentinel essaie de le _mettre à jour_.
- Comme le message initial a été créé avec le thème "pollué", il traînait ces métadonnées invisibles. Seule la création d'un **nouveau message** (via `macroMessageId: null`) permet de repartir sur une base saine.

## 3. Feedback Critique sur l'outil `creer_embed/mcp-discord`

Voici les points de friction identifiés qui rendent l'outil frustrant pour un usage précis :

1.  **Injection Silencieuse d'Assets :** Un outil de développement ne devrait JAMAIS injecter de contenu (images, logos) sans que l'utilisateur ne le demande explicitement. Le thème devrait gérer les couleurs et les polices, pas le contenu.
2.  **Manque de "Reset" Explicite :** Il manque une option simple `clearImages: true` ou `reset: true` pour nettoyer un embed existant sans devoir envoyer des chaînes vides partout.
3.  **Documentation du Comportement par Défaut :** Il n'est nulle part explicitier que `theme: 'corporate'` force l'affichage d'un logo Bitcoin ou d'images de bureau si l'utilisateur ne fournit rien.

## 4. La Solution Finale Appliquée

Pour garantir la stabilité actuelle :

1.  **Thème Neutre :** Passage à `theme: 'minimal'` (qui n'a pas d'assets par défaut envahissants).
2.  **Nettoyage Explicite :**
    ```typescript
    thumbnail: "", // Force la suppression
    image: "",     // Force la suppression
    ```
3.  **Hard Reset :** Suppression de l'ID du message dans la base de données (`sentinel_state.json`) pour forcer une récréation propre.
