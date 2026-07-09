#!/usr/bin/env node
// ============================================================================
// discord-mcp-pro — Post-install helper
// ============================================================================
// Runs automatically after `npm install -g discord-mcp-pro` or local install.
// Prints next-step guidance so the user knows what to do.
// ============================================================================

const path = require('path');
const fs = require('fs');

// Resolve paths (works whether invoked from package dir or via npm postinstall)
const PKG_ROOT = path.resolve(__dirname, '..');
const BIN_DIR = path.join(PKG_ROOT, 'bin');
const DIST_ENTRY = path.join(PKG_ROOT, 'dist', 'index.js');

const hasDist = fs.existsSync(DIST_ENTRY);
const isGlobal = process.env.npm_config_global === 'true' ||
                 __dirname.includes('node_modules') && !process.cwd().includes('node_modules');

// Color helpers (respect NO_COLOR env var)
const useColor = !process.env.NO_COLOR && process.stdout.isTTY;
const c = (code, s) => useColor ? `\x1b[${code}m${s}\x1b[0m` : s;
const green = s => c('32', s);
const cyan = s => c('36', s);
const yellow = s => c('33', s);
const dim = s => c('2', s);
const bold = s => c('1', s);

const lines = [];

lines.push('');
lines.push(green('✓ discord-mcp-pro installed successfully') + (isGlobal ? ' (global)' : ' (local)'));
lines.push('');

// Version + binary info
try {
  const pkg = JSON.parse(fs.readFileSync(path.join(PKG_ROOT, 'package.json'), 'utf8'));
  lines.push('  ' + dim('version:    ') + bold(pkg.version));
  if (pkg.bin) {
    const binNames = Object.keys(pkg.bin);
    lines.push('  ' + dim('binaries:   ') + binNames.map(b => cyan(b)).join(', '));
  }
} catch (_) { /* ignore */ }

lines.push('  ' + dim('entry:      ') + (hasDist ? green('dist/index.js OK') : yellow('dist/index.js MISSING — run `npm run build`')));
lines.push('');

// Next steps
lines.push(bold('📋 Next steps:'));
lines.push('');

if (isGlobal) {
  // Global install: user usually wants to use the CLI
  lines.push('  1. ' + bold('Create a Discord bot') + ' at https://discord.com/developers/applications');
  lines.push('     Enable intents: ' + dim('Server Members') + ' + ' + dim('Message Content'));
  lines.push('');
  lines.push('  2. ' + bold('Configure your .env') + ' (any of these locations are picked up):');
  lines.push('       - ' + cyan('./.env') + '  (current directory)');
  lines.push('       - ' + cyan('$HOME/.env') + '  (home directory, cross-platform)');
  lines.push('       - ' + cyan(process.env.HOME || process.env.USERPROFILE || '<home>') + '/.discord-mcp/.env');
  lines.push('');
  lines.push('     Minimum required content:');
  lines.push('       ' + dim('DISCORD_TOKEN=your-bot-token-here'));
  lines.push('       ' + dim('DISCORD_GUILD_ID=your-server-id       # optional'));
  lines.push('');
  lines.push('  3. ' + bold('Run the server:'));
  lines.push('       ' + cyan('discord-mcp') + '           # starts the MCP server (default port 3141)');
  lines.push('       ' + cyan('discord-mcp --help') + '   # show CLI options (reserved for future)');
  lines.push('');
  lines.push('  4. ' + bold('Wire it to your MCP client') + ' (Claude Desktop, Hermes, Cursor, Cline…):');
  lines.push('');
  lines.push('       ' + dim('~/.config/Claude/claude_desktop_config.json  (macOS/Linux)'));
  lines.push('       ' + dim('%APPDATA%\\Claude\\claude_desktop_config.json     (Windows)'));
  lines.push('');
  lines.push('       {');
  lines.push('         "mcpServers": {');
  lines.push('           "discord": {');
  lines.push('             "command": "discord-mcp",');
  lines.push('             "args": []');
  lines.push('           }');
  lines.push('         }');
  lines.push('       }');
  lines.push('');
} else {
  // Local install: user probably wants to develop
  lines.push('  1. ' + bold('Build the project:') + '  ' + cyan('npm run build'));
  lines.push('  2. ' + bold('Run dev mode:') + '       ' + cyan('npm run dev'));
  lines.push('  3. ' + bold('Run server:') + '        ' + cyan('npm start') + '  ' + dim('or') + '  ' + cyan('node bin/discord-mcp.js'));
  lines.push('');
}

lines.push(bold('📚 Documentation:') + ' ' + cyan('https://github.com/DeamonDev888/-Serveur-Discord-MCP'));
lines.push(bold('🐛 Issues:') + '         ' + cyan('https://github.com/DeamonDev888/-Serveur-Discord-MCP/issues'));
lines.push('');

// Helpful warning if dist/ is missing
if (!hasDist) {
  lines.push(yellow('⚠️  WARNING: dist/index.js not found in the installed package.'));
  lines.push(yellow('   This usually means npm published the package before the build ran.'));
  lines.push(yellow('   Workaround for end users: reinstall with --force, or build from source.'));
  lines.push('');
}

console.log(lines.join('\n'));