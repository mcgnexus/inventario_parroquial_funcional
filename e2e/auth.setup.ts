import { test as setup, expect } from '@playwright/test'
import { STORAGE_STATE } from '../playwright.config'

/**
 * Fichero de autenticación para Playwright.
 *
 * Este script se ejecuta una sola vez antes de toda la suite de tests.
 * Realiza el login con un usuario de prueba y guarda el estado de la sesión
 * (cookies, localStorage) en un fichero.
 *
 * Los demás tests cargarán este fichero para estar autenticados sin
 * necesidad de repetir el login, haciendo los tests más rápidos y robustos.
 */

const authFile = STORAGE_STATE

setup('autenticar usuario de prueba', async ({ page }) => {
  const consoleLogs: string[] = []
  const pageErrors: string[] = []
  page.on('console', (msg) => {
    consoleLogs.push(`[${msg.type()}] ${msg.text()}`)
  })
  page.on('pageerror', (err) => {
    pageErrors.push(err.message)
  })

  try {
    // 1. Navegar a la página de login
    await page.goto('/auth', { waitUntil: 'networkidle' })
    await setup.info().attach('current-url', { body: page.url(), contentType: 'text/plain' })

    // Verificar que no haya errores de runtime en la página
    const hasRuntimeError = await page.getByText(/runtime error/i).isVisible().catch(() => false)
    if (hasRuntimeError) {
      const errorText = await page.textContent('body')
      await setup.info().attach('page-snapshot', { body: errorText || 'No content', contentType: 'text/plain' })
      throw new Error('La página /auth tiene un Runtime Error. Reconstruye .next con: rm -rf .next && npm run dev')
    }

    // Esperar a que cargue el formulario de login
    await expect(page.getByPlaceholder(/usuario@parroquia\.org/i)).toBeVisible({ timeout: 40000 })

  // 2. Rellenar credenciales
  //    IMPORTANTE: Usa variables de entorno para no exponer credenciales.
  //    Crea un usuario de prueba en tu Supabase y pon sus datos en .env
  const email = process.env.TEST_USER_EMAIL
  const password = process.env.TEST_USER_PASSWORD

  if (!email || !password) {
    throw new Error('Las variables de entorno TEST_USER_EMAIL y TEST_USER_PASSWORD deben estar definidas.')
  }

  await page.getByPlaceholder(/usuario@parroquia\.org/i).fill(email)
  await page.getByPlaceholder(/\u2022{8}/).fill(password)

  // 3. Hacer click en el botón de login y esperar a la redirección
  // Esperar a que se complete la petición de login (exitosa o fallida)
  const loginPromise = page.waitForResponse(response =>
    response.url().includes('/api/auth/login')
  )

  // Click the login button (don't require aria-busy before clicking)
  await page.getByRole('button', { name: /iniciar sesión/i }).first().click()

  // Esperar a que la API de login responda
    const loginResponse = await loginPromise
    console.log(`Login API response: ${loginResponse.status()}`)

    if (loginResponse.status() !== 200) {
      const errorText = await loginResponse.text()
      console.error(`Login failed with status ${loginResponse.status()}: ${errorText}`)
      await setup.info().attach('console-log', { body: consoleLogs.join('\n'), contentType: 'text/plain' })
      await setup.info().attach('page-errors', { body: pageErrors.join('\n'), contentType: 'text/plain' })
      throw new Error(`Login API failed: ${loginResponse.status()} - ${errorText}`)
    }
  
  // Esperar a la redirección a inventario (puede tardar un poco por la sincronización de sesión)
    await expect(page).toHaveURL(/\/inventario/, { timeout: 40000 })

    // 4. Guardar el estado de la sesión en el fichero de autenticación
    await page.context().storageState({ path: authFile })
  } finally {
    await setup.info().attach('console-log', { body: consoleLogs.join('\n'), contentType: 'text/plain' })
    await setup.info().attach('page-errors', { body: pageErrors.join('\n'), contentType: 'text/plain' })
  }
})