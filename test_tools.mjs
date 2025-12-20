import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔍 === TEST DES OUTILS MCP DISCORD ===\n');

// Lire le fichier index_secure.ts pour extraire les outils
const indexPath = path.join(__dirname, 'src', 'index_secure.ts');
const content = fs.readFileSync(indexPath, 'utf8');

// Extraire tous les outils
const toolMatches = content.match(/server\.addTool\(\{[\s\S]*?name:\s*'([^']+)'[\s\S]*?description:\s*'([^']+)'/g);

if (!toolMatches) {
  console.log('❌ Aucun outil trouvé dans le code');
  process.exit(1);
}

const tools = [];

toolMatches.forEach(match => {
  const nameMatch = match.match(/name:\s*'([^']+)'/);
  const descMatch = match.match(/description:\s*'([^']+)'/);
  
  if (nameMatch && descMatch) {
    tools.push({
      name: nameMatch[1],
      description: descMatch[1]
    });
  }
});

console.log(`📊 Nombre total d'outils trouvés: ${tools.length}\n`);

// Afficher tous les outils
tools.forEach((tool, index) => {
  console.log(`${index + 1}. ${tool.name}`);
  console.log(`   📝 ${tool.description}`);
  console.log('');
});

console.log('✅ Analyse terminée\n');

// Sauvegarder la liste des outils dans un fichier
const outputPath = path.join(__dirname, 'tools_list.json');
fs.writeFileSync(outputPath, JSON.stringify(tools, null, 2));
console.log(`📄 Liste sauvegardée dans: ${outputPath}\n`);

