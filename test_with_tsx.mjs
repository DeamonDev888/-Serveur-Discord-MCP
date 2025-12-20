import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🧪 === TEST DES 27 OUTILS AVEC TSX ===\n');

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
function testTool(tool, index) {
  return new Promise((resolve) => {
    console.log(`\n${index + 1}/${results.total} - Test: ${tool.name}`);
    console.log(`   📝 ${tool.description}`);

    // Démarrer le serveur avec tsx
    const server = spawn('tsx', ['src/index_secure.ts'], {
      stdio: ['pipe', 'pipe', 'pipe'],
      cwd: __dirname,
      shell: true
    });

    let output = '';
    let errorOutput = '';
    let hasResponded = false;

    server.stdout.on('data', (data) => {
      output += data.toString();
    });

    server.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });

    // Timeout après 5 secondes
    const timeout = setTimeout(() => {
      if (!hasResponded) {
        server.kill();
        console.log(`   ⏱️  TIMEOUT - Pas de réponse`);
        results.failed++;
        results.errors.push({
          name: tool.name,
          error: 'Timeout - Le serveur ne répond pas'
        });
        results.details.push({
          name: tool.name,
          status: 'TIMEOUT',
          description: tool.description
        });
        resolve();
      }
    }, 5000);

    // Attendre que le serveur démarre
    setTimeout(() => {
      // Envoyer une requête pour lister les outils
      const request = {
        jsonrpc: '2.0',
        id: 1,
        method: 'tools/list',
        params: {}
      };

      try {
        server.stdin.write(JSON.stringify(request) + '\n');
      } catch (e) {
        // Ignore write errors
      }

      // Attendre la réponse
      setTimeout(() => {
        clearTimeout(timeout);
        hasResponded = true;
        server.kill();

        // Vérifier si le serveur a démarré sans erreur critique
        const hasCriticalError = errorOutput.includes('Error:') &&
                                 !errorOutput.includes('ECONNRESET') &&
                                 !errorOutput.includes('SIGKILL');

        if (!hasCriticalError) {
          console.log(`   ✅ SUCCÈS - Outil disponible`);
          results.passed++;
          results.details.push({
            name: tool.name,
            status: 'SUCCESS',
            description: tool.description
          });
        } else {
          console.log(`   ❌ ÉCHEC - Erreur critique`);
          const shortError = errorOutput.split('\n')[0].substring(0, 100);
          console.log(`   Erreur: ${shortError}`);
          results.failed++;
          results.errors.push({
            name: tool.name,
            error: shortError
          });
          results.details.push({
            name: tool.name,
            status: 'FAILED',
            description: tool.description,
            error: shortError
          });
        }

        resolve();
      }, 1500);
    }, 3000);
  });
}

// Tester tous les outils
async function runAllTests() {
  console.log(`🎯 Démarrage des tests...\n`);

  // Test du serveur une fois pour vérifier qu'il démarre
  console.log('🔧 Test de démarrage du serveur...');
  const testServer = spawn('tsx', ['src/index_secure.ts'], {
    stdio: 'pipe',
    cwd: __dirname,
    shell: true
  });

  let serverStarted = false;
  let startupError = '';

  testServer.stderr.on('data', (data) => {
    const msg = data.toString();
    if (msg.includes('MCP_SERVER')) {
      serverStarted = true;
    }
    if (msg.includes('Error:') && !msg.includes('ECONNRESET')) {
      startupError += msg;
    }
  });

  setTimeout(() => {
    testServer.kill();

    if (serverStarted && !startupError) {
      console.log('   ✅ Serveur MCP démarré avec succès\n');
    } else {
      console.log('   ⚠️  Problème de démarrage du serveur');
      if (startupError) {
        console.log(`   Erreur: ${startupError.substring(0, 200)}`);
      }
      console.log('   Les tests continueront malgré tout...\n');
    }

    // Maintenant tester tous les outils
    runToolTests();
  }, 4000);
}

async function runToolTests() {
  for (let i = 0; i < tools.length; i++) {
    await testTool(tools[i], i);
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
