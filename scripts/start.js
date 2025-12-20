#!/usr/bin/env node

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// Vérifier si le build a été fait
const distPath = path.join(__dirname, '../dist/index.js');
if (!fs.existsSync(distPath)) {
  console.log('🔨 Le build n\'existe pas, lancement de la compilation...');

  const buildProcess = spawn('node', [path.join(__dirname, 'build.js')], {
    stdio: 'inherit',
    cwd: path.join(__dirname, '..')
  });

  buildProcess.on('exit', (code) => {
    if (code === 0) {
      startServer();
    } else {
      console.error('❌ Le build a échoué');
      process.exit(1);
    }
  });
} else {
  startServer();
}

function startServer() {
  console.log('🚀 Démarrage du serveur Discord MCP...\n');

  // Vérifier les variables d'environnement
  const envPath = path.join(__dirname, '../.env');
  if (!fs.existsSync(envPath)) {
    console.log('⚠️  Fichier .env non trouvé. Utilisation des valeurs par défaut.\n');
    console.log('   Créez un fichier .env à partir de .env.example pour configurer le bot.\n');
  }

  // Démarrer le serveur
  const serverProcess = spawn('node', [distPath], {
    stdio: 'inherit',
    env: process.env,
    cwd: path.join(__dirname, '..')
  });

  serverProcess.on('error', (error) => {
    console.error('❌ Erreur lors du démarrage du serveur:', error);
    process.exit(1);
  });

  serverProcess.on('exit', (code) => {
    if (code !== 0) {
      console.error(`❌ Le serveur s\'est arrêté avec le code ${code}`);
      process.exit(code);
    }
  });

  // Gérer les signaux d'arrêt
  process.on('SIGINT', () => {
    console.log('\n🛑 Arrêt du serveur...');
    serverProcess.kill('SIGTERM');
  });

  process.on('SIGTERM', () => {
    console.log('\n🛑 Arrêt du serveur...');
    serverProcess.kill('SIGTERM');
  });
}