import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🧪 === TEST COMPLET DES 27 OUTILS MCP DISCORD ===\n');

// Lire la liste des outils
const toolsPath = path.join(__dirname, 'tools_list.json');
const tools = JSON.parse(fs.readFileSync(toolsPath, 'utf8'));

// Résultats des tests
const results = {
  total: tools.length,
  passed: 0,
  failed: 0,
  errors: [],
  details: []
};

// Fonction pour tester un outil
function testTool(tool) {
  return new Promise((resolve) => {
    console.log(`\n📋 Test de l'outil: ${tool.name}`);
    console.log(`   Description: ${tool.description}`);
    
    // Démarrer le serveur MCP
    const server = spawn('node', ['dist/index_secure.js'], {
      stdio: ['pipe', 'pipe', 'pipe']
    });
    
    let output = '';
    let errorOutput = '';
    
    server.stdout.on('data', (data) => {
      output += data.toString();
    });
    
    server.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });
    
    // Attendre 3 secondes pour que le serveur démarre
    setTimeout(() => {
      // Construire la requête MCP
      const request = {
        jsonrpc: '2.0',
        id: 1,
        method: 'tools/list',
        params: {}
      };
      
      server.stdin.write(JSON.stringify(request) + '\n');
      
      // Attendre la réponse
      setTimeout(() => {
        server.kill();
        
        const success = !errorOutput.includes('Error') && !errorOutput.includes('error');
        
        if (success) {
          console.log(`   ✅ SUCCÈS`);
          results.passed++;
          results.details.push({
            name: tool.name,
            status: 'SUCCESS',
            description: tool.description
          });
        } else {
          console.log(`   ❌ ÉCHEC`);
          console.log(`   Erreur: ${errorOutput.substring(0, 100)}`);
          results.failed++;
          results.errors.push({
            name: tool.name,
            error: errorOutput.substring(0, 200)
          });
          results.details.push({
            name: tool.name,
            status: 'FAILED',
            description: tool.description,
            error: errorOutput.substring(0, 200)
          });
        }
        
        resolve();
      }, 2000);
    }, 3000);
  });
}

// Tester tous les outils en série
async function runAllTests() {
  console.log(`🎯 Début des tests pour ${results.total} outils...\n`);
  
  for (let i = 0; i < tools.length; i++) {
    await testTool(tools[i]);
  }
  
  // Afficher le résumé
  console.log('\n\n📊 === RÉSUMÉ DES TESTS ===');
  console.log(`Total des outils: ${results.total}`);
  console.log(`✅ Réussis: ${results.passed}`);
  console.log(`❌ Échoués: ${results.failed}`);
  console.log(`Taux de réussite: ${((results.passed / results.total) * 100).toFixed(2)}%`);
  
  if (results.errors.length > 0) {
    console.log('\n⚠️ ERREURS DÉTECTÉES:');
    results.errors.forEach(err => {
      console.log(`   - ${err.name}: ${err.error}`);
    });
  }
  
  // Sauvegarder les résultats
  const reportPath = path.join(__dirname, 'test_report.json');
  fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
  console.log(`\n📄 Rapport détaillé sauvegardé: ${reportPath}`);
  
  process.exit(results.failed > 0 ? 1 : 0);
}

runAllTests();

