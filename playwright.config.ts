import { defineConfig, devices } from '@playwright/test'
import path from 'path'

export const STORAGE_STATE = path.join(__dirname, 'playwright/.auth/user.json')

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    // Proyecto de setup: se ejecuta primero para autenticar
    { name: 'setup', testMatch: /.*\.setup\.ts/ },

    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        // Usar el estado de storage guardado para estar autenticado
        storageState: STORAGE_STATE,
      },
      // Depende del proyecto 'setup' para asegurar que el login se hace antes
      dependencies: ['setup'],
    },
    // Opcional: Proyecto para tests que NO requieren autenticación
    // {
    //   name: 'chromium-unauthenticated',
    //   use: { ...devices['Desktop Chrome'] },
    //   testIgnore: '**/inventario-flow.spec.ts', // Ignora tests que sí requieren auth
    // },
  ],

  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    stdout: 'ignore',
    stderr: 'pipe',
    timeout: 120 * 1000,
  },
})
