import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig, devices } from '@playwright/test';

const e2eDir = path.dirname(fileURLToPath(import.meta.url));
const clientRoot = path.resolve(e2eDir, '..');
const repoRoot = path.resolve(clientRoot, '..');

/** UI e2e (браузер). Поднимает API + Vite, если ещё не запущены. */
export default defineConfig({
  testDir: '.',
  testMatch: '**/*.spec.ts',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: 'list',
  use: {
    baseURL: process.env.UI_BASE_URL ?? 'http://localhost:5173',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: [
    {
      command: 'npm run start -w server',
      cwd: repoRoot,
      url: 'http://localhost:3000/',
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
    },
    {
      command: 'npm run dev',
      cwd: clientRoot,
      url: 'http://localhost:5173/',
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
    },
  ],
});
