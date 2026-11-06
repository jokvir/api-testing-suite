import { defineConfig } from '@playwright/test';
import type { Options } from './src/fixtures';

const localURL = process.env.BASE_URL ?? 'http://localhost:3001';

export default defineConfig<Options>({
  testDir: 'tests',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    extraHTTPHeaders: { Accept: 'application/json' },
    trace: 'retain-on-failure',
  },
  projects: [
    {
      name: 'local',
      use: { baseURL: localURL, responseBudgetMs: 500 },
    },
    {
      name: 'public',
      use: { baseURL: 'https://restful-booker.herokuapp.com', responseBudgetMs: 5000 },
    },
  ],
});
