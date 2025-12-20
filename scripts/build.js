#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔨 Début du build du serveur Discord MCP...');

try {
  // Vérifier que TypeScript est installé
  try {
    execSync('tsc --version', { stdio: 'pipe' });
  } catch (error) {
    console.error('❌ TypeScript n\'est pas installé. Veuillez installer les dépendances:');
    console.error('   npm install');
    process.exit(1);
  }

  // Nettoyer le dossier dist
  const distPath = path.join(__dirname, '../dist');
  if (fs.existsSync(distPath)) {
    fs.rmSync(distPath, { recursive: true, force: true });
    console.log('🧹 Dossier dist nettoyé');
  }

  // Compiler TypeScript
  console.log('📦 Compilation TypeScript...');
  execSync('tsc', { stdio: 'inherit', cwd: path.join(__dirname, '..') });

  // Vérifier que le fichier de sortie existe
  const mainFile = path.join(distPath, 'index.js');
  if (!fs.existsSync(mainFile)) {
    console.error('❌ Le fichier index.js n\'a pas été généré');
    process.exit(1);
  }

  // Copier les fichiers nécessaires
  const filesToCopy = [
    'package.json',
    '.env.example',
    'README.md'
  ];

  console.log('📋 Copie des fichiers...');
  filesToCopy.forEach(file => {
    const src = path.join(__dirname, '..', file);
    const dest = path.join(distPath, file);
    if (fs.existsSync(src)) {
      fs.copyFileSync(src, dest);
      console.log(`   ✓ ${file}`);
    }
  });

  // Créer le dossier data s'il n'existe pas
  const dataPath = path.join(distPath, 'data');
  if (!fs.existsSync(dataPath)) {
    fs.mkdirSync(dataPath, { recursive: true });

    // Créer les fichiers de données vides
    fs.writeFileSync(path.join(dataPath, 'polls.json'), JSON.stringify({}));
    fs.writeFileSync(path.join(dataPath, 'buttons.json'), JSON.stringify({}));

    console.log('📁 Dossier data créé avec les fichiers de base');
  }

  console.log('✅ Build terminé avec succès!');
  console.log('\n📂 Fichiers générés:');
  console.log(`   - ${mainFile}`);

  // Lister les autres fichiers générés
  const distFiles = fs.readdirSync(distPath, { recursive: true });
  distFiles.forEach(file => {
    if (typeof file === 'string' && file !== 'index.js') {
      console.log(`   - ${path.join('dist', file)}`);
    }
  });

  console.log('\n🚀 Pour démarrer le serveur:');
  console.log('   npm start');
  console.log('   ou');
  console.log('   node dist/index.js');

} catch (error) {
  console.error('❌ Erreur lors du build:', error.message);
  process.exit(1);
}