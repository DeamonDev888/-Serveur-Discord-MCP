import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // On importe les tests depuis src/ mais on ne veut pas que vitest essaie
    // de transformer tout le graphe discord.js avec ses types stricts — on
    // compile en mode relâché (comme tsconfig.build.json).
    include: ['tests/**/*.test.ts'],
    environment: 'node',
    globals: false,
    pool: 'forks',
    testTimeout: 15000,
  },
  esbuild: {
    target: 'ES2022',
  },
});
