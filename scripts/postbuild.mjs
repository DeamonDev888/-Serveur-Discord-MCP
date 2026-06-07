#!/usr/bin/env node
// postbuild.mjs — Cross-platform postbuild verification
// Verifies the dist/ artifact is self-contained and ready to run.

import { existsSync, statSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const DIST = join(ROOT, 'dist');

if (!existsSync(DIST)) {
  console.error('[postbuild] FAIL: dist/ does not exist after build');
  process.exit(1);
}

const required = [
  'index.js',
  'discord-bridge.js',
  'config.js',
  'logger.js',
];
const missing = required.filter((f) => !existsSync(join(DIST, f)));
if (missing.length > 0) {
  console.error(`[postbuild] FAIL: dist/ is missing: ${missing.join(', ')}`);
  process.exit(1);
}

const launchBin = join(DIST, 'bin', 'launch.js');
if (!existsSync(launchBin)) {
  console.error('[postbuild] FAIL: dist/bin/launch.js not found (prebuild did not copy it)');
  process.exit(1);
}

let jsCount = 0;
function walkJs(dir) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) {
      walkJs(p);
    } else if (name.endsWith('.js')) {
      jsCount++;
    }
  }
}
walkJs(DIST);
console.log(`[postbuild] OK: dist/ contains ${jsCount} .js files (recursive)`);
console.log(`[postbuild] OK: dist/bin/launch.js present`);
console.log('[postbuild] Build completed successfully');
