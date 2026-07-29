#!/usr/bin/env node
// prebuild.mjs — Cross-platform prebuild step
// Was: `npm run clean && copy /Y bin\\launch.js dist\\bin\\launch.js` (cmd.exe only)
//
// Steps:
//   1. Clean dist/ + .log files
//   2. Copy bin/launch.js -> dist/bin/launch.js (so dist/ is self-contained)
//   3. Create logs/ dir

import { existsSync, mkdirSync, copyFileSync, readdirSync, rmSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));

// 1. clean dist + *.log
if (existsSync(join(ROOT, 'dist'))) {
  rmSync(join(ROOT, 'dist'), { recursive: true, force: true });
}
for (const f of readdirSync(ROOT)) {
  if (f.endsWith('.log') && statSync(f).isFile()) {
    rmSync(join(ROOT, f));
  }
}
console.log('[prebuild] cleaned dist/ + *.log');

// 2. copy bin/ -> dist/bin/ (supports .js or .cjs)
const dstDir = join(ROOT, 'dist', 'bin');
const launchJs = join(ROOT, 'bin', 'launch.js');
const launchCjs = join(ROOT, 'bin', 'launch.cjs');
let srcBin = null;
let binName = '';
if (existsSync(launchJs)) {
  srcBin = launchJs;
  binName = 'launch.js';
} else if (existsSync(launchCjs)) {
  srcBin = launchCjs;
  binName = 'launch.cjs';
}
if (srcBin) {
  mkdirSync(dstDir, { recursive: true });
  copyFileSync(srcBin, join(dstDir, binName));
  console.log(`[prebuild] copied bin/${binName} -> dist/bin/${binName}`);
} else {
  console.log('[prebuild] no bin/launch.{js,cjs} to copy (skipping)');
}

// 3. ensure logs/
const logsDir = join(ROOT, 'logs');
if (!existsSync(logsDir)) {
  mkdirSync(logsDir, { recursive: true });
}
console.log('[prebuild] done');
