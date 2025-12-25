# 🎯 GUIDE ULTRA-INTUITIF - creer_embed()

> **Pour agents avec perte de mémoire** - Tout est documenté, expliqué et auto-guidé !

---

## 🚀 UTILISATION SIMPLE EN 3 ÉTAPES

### **Étape 1: Choisir un thème de base**
```typescript
// 10 thèmes disponibles - Copiez-collez et modifiez !
creer_embed({
  channelId: 'VOTRE_ID',
  theme: 'basic',  // ← Choisir parmi: basic, data_report, status_update, product_showcase, leaderboard, tech_announcement, social_feed, dashboard, noel, minimal
```

### **Étape 2: Remplir les informations**
```typescript
  title: 'Mon titre ici',           // ← OBLIGATOIRE - Titre de l'embed
  description: 'Ma description',    // ← OBLIGATOIRE - Texte principal
  fields: [                         // ← OPTIONNEL - Champs de données
    { name: 'Info 1', value: 'Donnée 1', inline: true },
    { name: 'Info 2', value: 'Donnée 2', inline: true }
  ]
});
```

### **Étape 3: Ajouter des améliorations (optionnel)**
```typescript
  image: 'URL_IMAGE',               // ← OPTIONNEL - Grande image en bas
  thumbnail: 'URL_THUMBNAIL',       // ← OPTIONNEL - Petite image en haut-droite
  buttons: [                        // ← OPTIONNEL - Boutons interactifs
    { label: 'Cliquer', style: 'Primary', action: 'none' }
  ]
});
```

---

## 📋 TEMPLATES PRÊTS À UTILISER

### **1. RAPPORT SIMPLE**
```typescript
creer_embed({
  channelId: 'VOTRE_ID',
  theme: 'basic',
  title: '📊 Mon Rapport',
  description: 'Voici les informations principales :',
  fields: [
    { name: '📈 Indicateur 1', value: '1,234', inline: true },
    { name: '📉 Indicateur 2', value: '567', inline: true }
  ]
});
```

### **2. STATUS/ÉTAT**
```typescript
creer_embed({
  channelId: 'VOTRE_ID',
  theme: 'status_update',
  title: '🟢 État du Système',
  description: 'Tout fonctionne normalement',
  fields: [
    { name: '🟢 Service A', value: 'OPÉRATIONNEL', inline: true },
    { name: '🟢 Service B', value: 'OPÉRATIONNEL', inline: true }
  ]
});
```

### **3. PRODUIT/ANNONCE**
```typescript
creer_embed({
  channelId: 'VOTRE_ID',
  theme: 'product_showcase',
  title: '🚀 Nouveau Produit',
  description: 'Découvrez notre innovation',
  fields: [
    { name: '⭐ Fonctionnalité', value: 'Description...', inline: true },
    { name: '💰 Prix', value: 'XX€', inline: true }
  ]
});
```

### **4. CLASSEMENT**
```typescript
creer_embed({
  channelId: 'VOTRE_ID',
  theme: 'leaderboard',
  title: '🏆 Classement',
  description: 'Top 3 des meilleurs :',
  fields: [
    { name: '🥇 #1', value: 'Nom - Score', inline: true },
    { name: '🥈 #2', value: 'Nom - Score', inline: true },
    { name: '🥉 #3', value: 'Nom - Score', inline: true }
  ]
});
```

---

## 💡 CONSEILS POUR NE PAS OUBLIER

### **⚠️ ERREURS FRÉQUENTES À ÉVITER**
1. **channelId manquant** → ERREUR: "channelId requis"
2. **title manquant** → ERREUR: "title requis"
3. **description manquante** → ERREUR: "description requise"
4. **URL image invalide** → Auto-correction avec emoji fallback
5. **fields mal formatés** → Auto-correction

### **✅ BONNES PRATIQUES**
1. **Toujours préciser channelId**
2. **Toujours avoir un title et une description**
3. **Utiliser les thèmes comme base**
4. **Limiter à 3-5 fields pour la lisibilité**
5. **Utiliser les émojis pour rendre plus visuel**

---

## 🎨 PERSONNALISATION RAPIDE

### **Changer la couleur**
```typescript
color: '#FF0000',  // Rouge
// OU
color: 'RED',      // Nom de couleur prédéfini
// OU
color: 0xFF0000,   // Code hexa
```

### **Ajouter une image**
```typescript
image: 'URL',           // Grande image (bas de l'embed)
thumbnail: 'URL',       // Petite image (haut-droite)
authorIcon: 'URL',      // Icône auteur (haut-gauche)
footerIcon: 'URL',      // Icône footer (bas-gauche)
```

### **Ajouter des boutons**
```typescript
buttons: [
  {
    label: 'Texte du bouton',    // ← Texte affiché
    style: 'Primary',             // ← Style: Primary, Secondary, Success, Danger
    action: 'none',               // ← Action: none, refresh, link, custom
    value: 'URL ou donnée'        // ← Pour action: link ou custom
  }
]
```

---

## 🔧 FONCTIONNALITÉS AUTOMATIQUES

### **Variables automatiques**
Utilisez ces variables dans title, description, fields, footerText :
- `{timestamp}` → Date/heure actuelle
- `{date}` → Date uniquement
- `{time}` → Heure uniquement
- `{year}` → Année
- `{month}` → Mois
- `{day}` → Jour
- `{weekday}` → Jour de la semaine

**Exemple :**
```typescript
footerText: 'Généré le {timestamp}'
// Résultat: "Généré le 25/12/2025, 14:30:00"
```

### **Phase 1 Enhancement (Automatique)**
- ✅ **Cache d'images** → Télécharge et stocke automatiquement
- ✅ **Fallback intelligent** → Si URL invalide → Emoji automatique
- ✅ **Validation** → Vérifie les URLs avant envoi
- ✅ **Optimisation** → Redimensionne selon Discord

---

## 📖 EXEMPLES COMPLETS PAR CAS D'USAGE

### **1. ANNONCE DE NOUVELLE FONCTIONNALITÉ**
```typescript
creer_embed({
  channelId: 'VOTRE_ID',
  theme: 'tech_announcement',
  title: '⚡ Nouvelle Fonctionnalité',
  description: 'Un update majeur est disponible !',
  fields: [
    { name: '✨ Amélioration 1', value: 'Description...', inline: true },
    { name: '🔧 Amélioration 2', value: 'Description...', inline: true },
    { name: '📅 Date', value: '{date}', inline: true }
  ],
  buttons: [
    { label: '📖 Documentation', style: 'Primary', action: 'link', value: 'https://docs.example.com' },
    { label: '🎮 Tester', style: 'Success', action: 'custom', customData: { message: 'Tapez /feature pour commencer !' } }
  ]
});
```

### **2. RAPPORT DE VENTES**
```typescript
creer_embed({
  channelId: 'VOTRE_ID',
  theme: 'data_report',
  title: '📈 Ventes Décembre 2025',
  description: 'Résultats du mois :',
  fields: [
    { name: '💰 Chiffre d\'affaires', value: '45,678€', inline: true },
    { name: '📦 Commandes', value: '234', inline: true },
    { name: '👥 Clients', value: '189', inline: true },
    { name: '📊 Top produit', value: 'Produit X - 45 ventes', inline: false }
  ],
  buttons: [
    { label: '📊 Détails', style: 'Primary', action: 'link', value: 'https://analytics.example.com' }
  ]
});
```

### **3. DASHBOARD TEMPS RÉEL**
```typescript
creer_embed({
  channelId: 'VOTRE_ID',
  theme: 'dashboard',
  title: '📊 Tableau de Bord',
  description: 'Métriques en temps réel',
  fields: [
    { name: '👥 Utilisateurs', value: '1,247', inline: true },
    { name: '📈 Croissance', value: '+12%', inline: true },
    { name: '💰 Revenus', value: '4,567€', inline: true },
    { name: '⏱️ Latence', value: '45ms', inline: true }
  ],
  autoUpdate: { enabled: true, interval: 60 },
  buttons: [
    { label: '🔄 Actualiser', style: 'Primary', action: 'refresh' }
  ]
});
```

---

## 🆘 DÉPANNAGE RAPIDE

### **Erreur: "channelId manquant"**
**Solution :**
```typescript
creer_embed({
  channelId: '1442317829998383235',  // ← AJOUTEZ CETTE LIGNE
  title: 'Mon titre',
  description: 'Ma description'
});
```

### **Erreur: "URL image invalide"**
**Solution :** Pas besoin de corriger ! Le système applique automatiquement un emoji de fallback.

### **Erreur: "Trop de fields"**
**Solution :**
```typescript
// Maximum 10 fields recommandés
fields: [
  { name: 'Field 1', value: '...', inline: true },
  { name: 'Field 2', value: '...', inline: true },
  // Limitez à 5-10 fields maximum
]
```

---

## 🎯 CHECKLIST RAPIDE

**Avant d'appeler creer_embed(), vérifiez :**
- [ ] channelId défini ?
- [ ] title défini ?
- [ ] description définie ?
- [ ] theme choisi (optionnel mais recommandé) ?
- [ ] fields limités à 10 max ?
- [ ] URLs d'images valides (ou laissez le fallback faire) ?

---

## 💎 RÉSUMÉ EXPRESS

```typescript
// STRUCTURE MINIMALE
creer_embed({
  channelId: 'ID',           // OBLIGATOIRE
  title: 'Titre',            // OBLIGATOIRE
  description: 'Texte',      // OBLIGATOIRE
  theme: 'basic'             // RECOMMANDÉ
});

// AVEC IMAGES
creer_embed({
  channelId: 'ID',
  title: 'Titre',
  description: 'Texte',
  image: 'URL',              // Grande image
  thumbnail: 'URL'           // Petite image
});

// AVEC BOUTONS
creer_embed({
  channelId: 'ID',
  title: 'Titre',
  description: 'Texte',
  buttons: [
    { label: 'Bouton', style: 'Primary', action: 'none' }
  ]
});

// COMPLET
creer_embed({
  channelId: 'ID',
  theme: 'basic',
  title: 'Titre',
  description: 'Texte',
  fields: [...],
  image: 'URL',
  buttons: [...],
  autoUpdate: { enabled: true }
});
```

---

**🎉 C'est tout ! Avec ce guide, vous ne pouvez plus vous tromper !** ✨
