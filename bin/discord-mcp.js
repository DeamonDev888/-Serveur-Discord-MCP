#!/usr/bin/env node
// ============================================================================
// discord-mcp — CLI launcher for discord-mcp-pro
// ============================================================================
// Install globally: npm install -g discord-mcp-pro
// Then run:       discord-mcp                  (start the MCP server)
//
// This wrapper:
//   1. Resolves dist/index.js relative to this file (works whether installed
//      globally or as a dep)
//   2. Auto-loads the nearest .env file (cwd -> $HOME -> package dir)
//   3. Spawns node with the server and forwards signals
// ============================================================================

const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');

// Resolve the package root (works for both npm global and local installs)
const PKG_ROOT = path.resolve(__dirname, '..');
const ENTRY = path.join(PKG_ROOT, 'dist', 'index.js');

// Sanity check: dist/index.js must exist
if (!fs.existsSync(ENTRY)) {
  console.error('discord-mcp: cannot find dist/index.js');
  console.error('  Expected at:', ENTRY);
  console.error('');
  console.error('  This usually means the package was installed without prebuilt dist/.');
  console.error('  Try one of:');
  console.error('    - Reinstall: npm install -g discord-mcp-pro --force');
  console.error('    - Build from source: cd <repo> && npm run build');
  console.error('    - Report an issue: https://github.com/DeamonDev888/-Serveur-Discord-MCP/issues');
  process.exit(1);
}

// Auto-load .env: cwd first, then $HOME, then package dir
function loadDotenv() {
  const candidates = [
    process.cwd(),
    process.env.HOME || process.env.USERPROFILE || '',
    PKG_ROOT,
  ];
  for (const dir of candidates) {
    if (!dir) continue;
    const envPath = path.join(dir, '.env');
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf8');
      for (const line of content.split(/\r?\n/)) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;
        const eq = trimmed.indexOf('=');
        if (eq === -1) continue;
        const key = trimmed.slice(0, eq).trim();
        let val = trimmed.slice(eq + 1).trim();
        // Strip surrounding quotes
        if ((val.startsWith('"') && val.endsWith('"')) ||
            (val.startsWith("'") && val.endsWith("'"))) {
          val = val.slice(1, -1);
        }
        // Only set if not already in env (don't override user)
        if (!(key in process.env)) {
          process.env[key] = val;
        }
      }
      return envPath;
    }
  }
  return null;
}

const envFile = loadDotenv();

// Pass through any extra args
const args = process.argv.slice(2);

// Spawn the server
const child = spawn(process.execPath, [ENTRY, ...args], {
  stdio: 'inherit',
  env: process.env,
});

let exited = false;

child.on('exit', (code, signal) => {
  exited = true;
  if (signal) {
    process.kill(process.pid, signal);
  } else {
    process.exit(code ?? 0);
  }
});

// Forward signals to child
for (const sig of ['SIGINT', 'SIGTERM', 'SIGHUP']) {
  process.on(sig, () => {
    if (!exited && child.pid) {
      try { child.kill(sig); } catch (_) { /* ignore */ }
    }
  });
}

// Helpful first-run message
if (process.env.DISCORD_MCP_QUIET !== '1' && !envFile) {
  console.error('');
  console.error('⚠️  discord-mcp: no .env file found.');
  console.error('   The server will start but probably crash without DISCORD_TOKEN.');
  console.error('   Create a .env in your cwd, $HOME, or the package directory:');
  console.error('');
  console.error('     DISCORD_TOKEN=your-bot-token');
  console.error('     DISCORD_GUILD_ID=your-server-id   # optional');
  console.error('');
  console.error('   See: https://github.com/DeamonDev888/-Serveur-Discord-MCP#configuration');
  console.error('');
}