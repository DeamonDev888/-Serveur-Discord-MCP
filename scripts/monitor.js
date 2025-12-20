#!/usr/bin/env node

/**
 * Script de monitoring pour détecter les problèmes de performance
 * Utilisation: node scripts/monitor.js
 */

import fs from 'fs';
import path from 'path';

const STATUS_FILE = path.resolve(__dirname, '../discord-status.json');
const LOG_FILE = path.resolve(__dirname, '../discord-mcp.log');

console.log('🔍 Monitoring Discord MCP Server...\n');

// Fonction pour afficher les statistiques mémoire
function showMemoryStats() {
  const memUsage = process.memoryUsage();
  const memMB = (bytes) => (bytes / 1024 / 1024).toFixed(2);

  console.log('📊 MEMORY STATS:');
  console.log(`   RSS: ${memMB(memUsage.rss)} MB`);
  console.log(`   Heap Total: ${memMB(memUsage.heapTotal)} MB`);
  console.log(`   Heap Used: ${memMB(memUsage.heapUsed)} MB`);
  console.log(`   External: ${memMB(memUsage.external)} MB`);
  console.log(`   Array Buffers: ${memMB(memUsage.arrayBuffers || 0)} MB`);

  // Alerte si mémoire élevée
  if (memUsage.heapUsed > 400 * 1024 * 1024) {
    console.log('   ⚠️  ATTENTION: Mémoire élevée détectée!');
  }
  console.log('');
}

// Fonction pour afficher les stats du fichier de statut
function showStatusFile() {
  try {
    if (fs.existsSync(STATUS_FILE)) {
      const stats = fs.statSync(STATUS_FILE);
      const content = JSON.parse(fs.readFileSync(STATUS_FILE, 'utf8'));

      console.log('📁 STATUS FILE:');
      console.log(`   Path: ${STATUS_FILE}`);
      console.log(`   Last Modified: ${new Date(stats.mtime).toLocaleString()}`);
      console.log(`   Size: ${(stats.size / 1024).toFixed(2)} KB`);
      console.log(`   Connected: ${content.isConnected ? '✅' : '❌'}`);
      console.log(`   Client Ready: ${content.clientReady ? '✅' : '❌'}`);
      console.log(`   Username: ${content.username || 'N/A'}`);
      console.log(`   Guilds: ${content.guilds || 0}`);
      console.log(`   Uptime: ${content.uptime || 0}ms`);
      console.log(`   Last Update: ${new Date(content.lastUpdate).toLocaleString()}`);
      console.log('');
    } else {
      console.log('❌ STATUS FILE: Non trouvé\n');
    }
  } catch (error) {
    console.log('❌ STATUS FILE: Erreur de lecture -', error.message, '\n');
  }
}

// Fonction pour afficher les logs récents
function showRecentLogs() {
  try {
    if (fs.existsSync(LOG_FILE)) {
      const content = fs.readFileSync(LOG_FILE, 'utf8');
      const lines = content.split('\n').filter(line => line.trim());

      console.log('📜 RECENT LOGS (last 10 lines):');
      lines.slice(-10).forEach(line => {
        // Colorer les logs d'erreur
        if (line.includes('ERROR') || line.includes('❌')) {
          console.log('   ❌', line);
        } else if (line.includes('WARN') || line.includes('⚠️')) {
          console.log('   ⚠️', line);
        } else if (line.includes('SUCCESS') || line.includes('✅')) {
          console.log('   ✅', line);
        } else {
          console.log('   ', line);
        }
      });
      console.log('');
    } else {
      console.log('📜 RECENT LOGS: Fichier de log non trouvé\n');
    }
  } catch (error) {
    console.log('❌ LOGS: Erreur de lecture -', error.message, '\n');
  }
}

// Fonction principale
async function main() {
  console.log('═'.repeat(60));
  console.log('🔍 DISCORD MCP SERVER - MONITORING');
  console.log('═'.repeat(60));
  console.log('');

  showMemoryStats();
  showStatusFile();
  showRecentLogs();

  console.log('═'.repeat(60));
  console.log('💡 CONSEILS:');
  console.log('   • Surveillez la mémoire (ne devrait pas dépasser 300MB)');
  console.log('   • Vérifiez que le serveur reste connecté');
  console.log('   • Regardez les erreurs dans les logs');
  console.log('   • Redémarrez si la mémoire dépasse 500MB');
  console.log('═'.repeat(60));
}

// Lancer le monitoring
main().catch(error => {
  console.error('❌ Erreur lors du monitoring:', error);
  process.exit(1);
});
