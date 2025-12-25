# 📚 GUIDE COMPLET - EXEMPLES DE THEMES POUR creer_embed

> **Objectif** : Montrer les possibilités infinies de `creer_embed()` avec des exemples concrets et modifiables
>
> **Utilisation** : Chaque thème est un **template exemple** - **ADAPTEZ selon votre contexte !**

---

## 🎯 THÈMES EXEMPLES DISPONIBLES

### 1. **BASIC** - Structure d'embed simple
```typescript
// Thème minimal pour débuter - À PERSONNALISER
{
  color: '#5865F2',                    // Couleur Discord par défaut
  title: 'Titre de votre embed',       // ← MODIFIEZ selon votre contenu
  description: 'Description...',       // ← Ajoutez votre texte
  authorName: 'Auteur',                // ← Nom de l'auteur
  fields: [                            // ← Champs optionnels
    { name: 'Champ 1', value: 'Valeur 1', inline: true },
    { name: 'Champ 2', value: 'Valeur 2', inline: true }
  ]
}

// UTILISATION :
creer_embed({
  channelId: 'VOTRE_ID',
  theme: 'basic',
  title: 'Mon titre personnalisé',     // ← Remplace le titre du thème
  description: 'Ma description',       // ← Remplace la description
  fields: [                            // ← Remplace les fields
    { name: 'Info', value: 'Données' }
  ]
});
```

---

### 2. **DATA_REPORT** - Rapport avec données
```typescript
// Template pour afficher des données structurées
{
  color: '#00FF00',                    // Vert pour succès
  title: '📊 Rapport de Données',
  description: 'Voici les résultats de l\'analyse :',
  fields: [
    { name: '📈 Métrique 1', value: 'Valeur: 123', inline: true },
    { name: '📉 Métrique 2', value: 'Valeur: 456', inline: true },
    { name: '📊 Métrique 3', value: 'Valeur: 789', inline: true },
    { name: '📋 Détails', value: 'Informations supplémentaires...', inline: false }
  ],
  footerText: 'Généré le {timestamp}'  // ← Variables automatiques
}

// VARIABLES DISPONIBLES :
// {timestamp} - Date/heure actuelle
// {date} - Date uniquement
// {time} - Heure uniquement
// {year} - Année
// {month} - Mois
// {day} - Jour
// {weekday} - Jour de la semaine
```

---

### 3. **STATUS_UPDATE** - Mise à jour de statut
```typescript
// Template pour notifications/updates
{
  color: '#FFA500',                    // Orange pour attention
  title: '🔄 Mise à jour de Statut',
  description: 'État actuel du système :',
  fields: [
    { name: '🟢 Statut', value: 'OPÉRATIONNEL', inline: true },
    { name: '⚡ Performance', value: '97%', inline: true },
    { name: '📊 Uptime', value: '99.9%', inline: true },
    { name: '📝 Notes', value: 'Dernière maintenance: 2025-12-24', inline: false }
  ],
  thumbnail: 'ICON_URL',               // ← Remplacez par votre icône
  timestamp: true
}

// BOUTONS INTERACTIFS :
creer_embed({
  theme: 'status_update',
  buttons: [
    {
      label: '🔄 Rafraîchir',
      style: 'Primary',
      action: 'refresh'                // Actualise l'embed
    },
    {
      label: '📊 Détails',
      style: 'Secondary',
      action: 'custom',
      customData: {                    // Affiche un sous-embed
        embed: {
          title: 'Détails Techniques',
          description: 'Informations avancées...'
        }
      }
    }
  ]
});
```

---

### 4. **PRODUCT_SHOWCASE** - Présentation produit
```typescript
// Template pour présenter un produit/service
{
  color: '#9B59B6',                    // Violet pour premium
  title: '🚀 Nouveau Produit',
  description: 'Découvrez notre dernière innovation :',
  image: 'PRODUCT_IMAGE_URL',          // ← Image principale (grande)
  authorName: 'Équipe Produit',
  authorIcon: 'LOGO_URL',              // ← Icône auteur (petite)
  fields: [
    { name: '✨ Fonctionnalités', value: '• Feature 1\n• Feature 2\n• Feature 3', inline: true },
    { name: '💰 Prix', value: '29.99€', inline: true },
    { name: '⭐ Note', value: '4.8/5 ⭐⭐⭐⭐⭐', inline: true },
    { name: '📦 Disponibilité', value: 'En stock', inline: false }
  ],
  footerText: 'Propulsé par notre équipe'
}

// LIENS ADAPTATIFS :
creer_embed({
  theme: 'product_showcase',
  adaptiveLinks: [
    {
      label: '🛒 Acheter',
      url: 'https://shop.example.com/product',
      userSpecific: true                // Ajoute ?user=ID à l'URL
    },
    {
      label: '📖 Documentation',
      url: 'https://docs.example.com',
      conditions: {                     // Conditionne l'affichage
        'role': 'premium'
      }
    }
  ]
});
```

---

### 5. **GAMING_LEADERBOARD** - Classement gaming
```typescript
// Template pour classements/scores
{
  color: '#E74C3C',                    // Rouge pour compétition
  title: '🏆 Classement Joueurs',
  description: 'Top 10 des meilleurs joueurs :',
  thumbnail: 'TROPHY_ICON',            // ← Icône trophée
  fields: [
    { name: '🥇 #1', value: 'Player1 - 1500 pts', inline: true },
    { name: '🥈 #2', value: 'Player2 - 1420 pts', inline: true },
    { name: '🥉 #3', value: 'Player3 - 1380 pts', inline: true },
    { name: '📊 Statistiques', value: '▓▓▓▓▓▓▓░░░ 70%\n• Matchs joués: 247\n• Victoires: 173\n• Taux win: 70%', inline: false }
  ],
  footerText: 'Mise à jour temps réel'
}

// CHAMPS AVEC TABLEAUX :
creer_embed({
  theme: 'gaming_leaderboard',
  fields: [
    {
      name: '📋 Classement Détaillé',
      value: '| Rang | Joueur | Score | Winrate |\n|------|--------|-------|---------|\n| 1 | Player1 | 1500 | 75% |\n| 2 | Player2 | 1420 | 68% |\n| 3 | Player3 | 1380 | 71% |',
      autoTable: true                  // ← Formate automatiquement le tableau
    }
  ]
});
```

---

### 6. **TECH_ANNOUNCEMENT** - Annonce technique
```typescript
// Template pour annonces de fonctionnalités
{
  color: '#3498DB',                    // Bleu tech
  title: '⚡ Nouvelle Fonctionnalité',
  description: 'Une mise à jour majeure est disponible :',
  image: 'FEATURE_SCREENSHOT',         // ← Capture d'écran
  fields: [
    { name: '🚀 Amélioration 1', value: 'Description de l\'amélioration...', inline: true },
    { name: '🔧 Amélioration 2', value: 'Description de l\'amélioration...', inline: true },
    { name: '📅 Date de sortie', value: '2025-12-25', inline: true },
    { name: '📝 Notes de version', value: '• Correction bug #123\n• Nouvelle API\n• Amélioration perf', inline: false }
  ],
  url: 'DOCUMENTATION_URL',            // ← Lien cliquable sur le titre
  timestamp: true
});

// MENUS DE SÉLECTION :
creer_embed({
  theme: 'tech_announcement',
  selectMenus: [
    {
      type: 'string',
      placeholder: 'Choisissez une action',
      options: [
        { label: '📖 Voir docs', value: 'docs' },
        { label: '💬 Donner avis', value: 'feedback' },
        { label: '🔔 S\'abonner', value: 'subscribe' }
      ],
      action: 'custom',
      customData: {
        handler: 'announcementHandler'  // ← Votre fonction personnalisée
      }
    }
  ]
});
```

---

### 7. **DASHBOARD_METRICS** - Tableau de bord
```typescript
// Template pour métriques en temps réel
{
  color: '#1ABC9C',                    // Cyan dashboard
  title: '📊 Tableau de Bord',
  description: 'Métriques en temps réel :',
  fields: [
    { name: '👥 Utilisateurs', value: '1,247', inline: true },
    { name: '📈 Croissance', value: '+12%', inline: true },
    { name: '💰 Revenus', value: '4,567€', inline: true },
    { name: '⏱️ Latence', value: '45ms', inline: true },
    { name: '📊 Performance', value: '▓▓▓▓▓▓▓▓▓░ 90%', inline: false }
  ],
  footerText: 'Actualisé toutes les 5 minutes'
}

// BARRE DE PROGRESSION AUTOMATIQUE :
creer_embed({
  theme: 'dashboard_metrics',
  progressBars: [
    { fieldIndex: 4, label: 'CPU', value: 67, max: 100, length: 15 },
    { fieldIndex: 4, label: 'RAM', value: 45, max: 100, length: 15 },
    { fieldIndex: 4, label: 'Disk', value: 78, max: 100, length: 15 }
  ]
});
```

---

### 8. **SOCIAL_FEED** - Fil d'actualité
```typescript
// Template pour contenu social/médias
{
  color: '#E91E63',                    // Rose social
  title: '💬 Dernières Actualités',
  description: 'Ce qui se passe en ce moment :',
  image: 'SOCIAL_IMAGE',               // ← Image du post
  authorName: 'Page Officielle',
  authorIcon: 'PAGE_LOGO',
  fields: [
    { name: '👍 Likes', value: '1,234', inline: true },
    { name: '💬 Comments', value: '89', inline: true },
    { name: '🔄 Shares', value: '45', inline: true },
    { name: '📅 Posté le', value: 'Il y a 2h', inline: false }
  ],
  timestamp: true
});

// LAYOUT AVANCÉ :
creer_embed({
  theme: 'social_feed',
  layout: {
    type: 'grid',                      // grid | stack | sidebar | centered | masonry
    columns: 2,                        // Nombre de colonnes (pour grid)
    spacing: 'normal',                 // compact | normal | spacious
    alignment: 'left'                  // left | center | right
  }
});
```

---

## 🎨 PERSONNALISATION AVANCÉE

### **Couleurs par type de contenu**
```typescript
// Succès / Validation
color: '#00FF00'  // Vert

// Erreur / Attention
color: '#FF0000'  // Rouge

// Information / Neutre
color: '#3498DB'  // Bleu

// Warning / Caution
color: '#FFA500'  // Orange

// Premium / VIP
color: '#9B59B6'  // Violet

// Gaming / Fun
color: '#E74C3C'  // Rouge vif

// Tech / Digital
color: '#1ABC9C'  // Cyan

// Finance / Money
color: '#F1C40F'  // Jaune
```

### **Émojis par catégorie**
```typescript
// Données
📊 📈 📉 💹 💰

// Tech
💻 🔧 ⚡ 🚀 📡

// Social
💬 👥 📱 🎯 🔔

// Status
✅ ❌ ⏳ 🔄 📌

// Gaming
🎮 🏆 🎯 👾 ⚔️

// Notification
🔔 📢 📣 ⚠️ ℹ️
```

---

## 💡 CONSEILS POUR L'AGENT IA

### ✅ **À FAIRE**
- Utilisez `theme` comme **point de départ**
- **Modifiez** title, description, fields selon votre contexte
- Ajoutez des **boutons interactifs** si nécessaire
- Utilisez les **variables** {timestamp}, {date}, etc.
- **Testez** avec des données réelles
- Adaptez la **couleur** au type de contenu

### ❌ **À ÉVITER**
- Utiliser un thème sans personnalisation
- Copier-coller le contenu tel quel
- Oublier d'adapter les champs (fields)
- Ne pas vérifier que les URLs d'images sont valides

---

## 🔗 EXEMPLES D'UTILISATION COMPLETS

### **Exemple 1 : Rapport de vente**
```typescript
creer_embed({
  channelId: '1442317829998383235',
  theme: 'data_report',
  title: '📈 Ventes Décembre 2025',
  description: 'Résultats de ventes du mois :',
  fields: [
    { name: '💰 Chiffre d\'affaires', value: '45,678€', inline: true },
    { name: '📦 Commandes', value: '234', inline: true },
    { name: '👥 Clients', value: '189', inline: true },
    { name: '📊 Top produit', value: 'Produit X - 45 ventes', inline: false }
  ],
  buttons: [
    { label: '📊 Détails', style: 'Primary', action: 'link', value: 'https://analytics.example.com' },
    { label: '📧 Rapport PDF', style: 'Secondary', action: 'link', value: 'https://reports.example.com/december.pdf' }
  ]
});
```

### **Exemple 2 : Status système**
```typescript
creer_embed({
  channelId: '1442317829998383235',
  theme: 'status_update',
  title: '🟢 Statut Système',
  description: 'Tous les services sont opérationnels',
  fields: [
    { name: '🟢 API', value: 'OPÉRATIONNEL (响应时间: 45ms)', inline: true },
    { name: '🟢 Base de données', value: 'OPÉRATIONNEL (连接: stable)', inline: true },
    { name: '🟢 CDN', value: 'OPÉRATIONNEL (缓存: 99%)', inline: true },
    { name: '📊 Uptime 30j', value: '99.97%', inline: false }
  ],
  autoUpdate: {
    enabled: true,
    interval: 60  // Mise à jour chaque minute
  }
});
```

### **Exemple 3 : Nouveau feature**
```typescript
creer_embed({
  channelId: '1442317829998383235',
  theme: 'tech_announcement',
  title: '🚀 Nouvelle Fonctionnalité : IA Assistant',
  description: 'Un assistant intelligent est maintenant disponible !',
  image: 'https://example.com/feature-screenshot.png',
  fields: [
    { name: '✨ Fonctionnalités', value: '• Réponses automatiques\n• Analyse de sentiment\n• Suggestions personnalisées', inline: true },
    { name: '🎯 Utilisation', value: 'Tapez /ai suivi de votre question', inline: true },
    { name: '📅 Disponible', value: 'Maintenant pour tous les utilisateurs', inline: false }
  ],
  buttons: [
    { label: '📖 Documentation', style: 'Primary', action: 'link', value: 'https://docs.example.com/ai' },
    { label: '🎮 Tester', style: 'Success', action: 'custom', customData: { message: 'Tapez /ai dans le chat pour commencer !' } }
  ]
});
```

---

## 🎓 CONCLUSION

Ces thèmes sont des **templates exemples** pour vous montrer les possibilités de `creer_embed()`.

**Toujours adapter** le contenu, les champs, les couleurs selon votre contexte spécifique !

**Testez, expérimentez, et créez vos propres variantes !** 🎨
