import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from '@playwright/test';

const e2eDir = path.dirname(fileURLToPath(import.meta.url));
const serverRoot = path.resolve(e2eDir, '..');

/** API e2e (HTTP). При отсутствии сервера поднимает Nest через webServer. */
export default defineConfig({
  testDir: '.',
  testMatch: '**/*.spec.ts',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: 'list',
  use: {
    baseURL: process.env.API_BASE_URL ?? 'http://localhost:3000',
    extraHTTPHeaders: {
      Accept: 'application/json',
    },
  },
  webServer: {
    command: 'npx nest start',
    cwd: serverRoot,
    url: 'http://localhost:3000/health',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
