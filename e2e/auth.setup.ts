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

    await page.waitForLoadState('domcontentloaded')
    // Verificar que no haya errores de runtime en la página
    const hasRuntimeError = await page.getByText(/runtime error/i).isVisible().catch(() => false)
    if (hasRuntimeError) {
      const errorText = await page.textContent('body')
      await setup.info().attach('page-snapshot', { body: errorText || 'No content', contentType: 'text/plain' })
      throw new Error('La página /auth tiene un Runtime Error. Reconstruye .next con: rm -rf .next && npm run dev')
    }
    
    // Esperar a que se estabilice en uno de los dos estados: formulario de login o sesión visible
    const authFormVisible = await page.getByPlaceholder(/usuario@parroquia\.org/i).isVisible({ timeout: 8000 }).catch(() => false)
    const sessionVisible = await page.getByRole('button', { name: /salir/i }).isVisible({ timeout: 8000 }).catch(() => false)

    if (sessionVisible && !authFormVisible) {
      // Ya autenticado, guardar estado y salir
      await page.context().storageState({ path: authFile })
      return
    }
    if (!authFormVisible) {
      // Intentar forzar modo login si no aparece el formulario
      await page.goto('/auth?mode=login', { waitUntil: 'domcontentloaded' })
      const forcedFormVisible = await page.getByPlaceholder(/usuario@parroquia\.org/i).isVisible({ timeout: 8000 }).catch(() => false)
      const nowSessionVisible = await page.getByRole('button', { name: /salir/i }).isVisible({ timeout: 8000 }).catch(() => false)
      if (nowSessionVisible && !forcedFormVisible) {
        await page.context().storageState({ path: authFile })
        return
      }
      if (!forcedFormVisible) {
        await setup.info().attach('current-url', { body: page.url(), contentType: 'text/plain' })
        throw new Error('No se pudo mostrar el formulario de login en /auth')
      }
    }
    // Si no había sesión, esperar explícitamente los elementos del formulario
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

  // 3. Hacer click en el botón de login y esperar a señales de éxito
  const endpointMatcher = (response: import('@playwright/test').APIResponse) => {
    const url = response.url()
    const ok = /\/api\/auth\/login(\?.*)?$/i.test(url) || url.includes('/api/auth/login')
    return ok
  }

  // Click en el botón de envío del formulario de login (evitar el tab selector)
  let clicked = false
  try {
    const formButton = page.locator('form').getByRole('button', { name: /iniciar sesión/i })
    await formButton.click({ timeout: 5000 })
    clicked = true
  } catch {}
  if (!clicked) {
    // Fallback: segundo botón "Iniciar sesión" suele ser el de enviar
    await page.getByRole('button', { name: /iniciar sesión/i }).nth(1).click()
  }

  // Esperar una de las siguientes condiciones:
  // - Respuesta de la API de login
  // - La URL cambia al inventario
  // - Aparece un mensaje de error visible
  const responsePromise = page.waitForResponse(endpointMatcher, { timeout: 25000 }).catch(() => null)
  const urlInventarioPromise = page.waitForURL(/\/inventario/, { timeout: 30000 }).catch(() => null)
  const homeSessionPromise = page.getByText(/sesión:\s*playwright-user@example\.com/i).isVisible({ timeout: 30000 }).catch(() => false)
  const logoutVisiblePromise = page.getByRole('button', { name: /salir/i }).isVisible({ timeout: 30000 }).catch(() => false)
  const errorPromise = page.getByText(/(email|contraseña|servidor|supabase|incorrectos|comunicación)/i).isVisible({ timeout: 30000 }).catch(() => false)

  const [resp, urlChangedInventario, homeSessionVisible, logoutVisible, errorVisible] = await Promise.all([responsePromise, urlInventarioPromise, homeSessionPromise, logoutVisiblePromise, errorPromise])

  if (resp) {
    console.log(`Login API response: ${resp.status()}`)
    if (resp.status() !== 200) {
      const errorText = await resp.text()
      console.error(`Login failed with status ${resp.status()}: ${errorText}`)
      await setup.info().attach('console-log', { body: consoleLogs.join('\n'), contentType: 'text/plain' })
      await setup.info().attach('page-errors', { body: pageErrors.join('\n'), contentType: 'text/plain' })
      throw new Error(`Login API failed: ${resp.status()} - ${errorText}`)
    }
  }
  const loginSuccess = Boolean(urlChangedInventario || homeSessionVisible || logoutVisible)
  if (!resp && !loginSuccess && !errorVisible) {
    await setup.info().attach('console-log', { body: consoleLogs.join('\n'), contentType: 'text/plain' })
    await setup.info().attach('page-errors', { body: pageErrors.join('\n'), contentType: 'text/plain' })
    throw new Error('No se detectó respuesta de login, redirección ni mensaje de error en el tiempo esperado')
  }
  
  // Esperar a la redirección a inventario (puede tardar un poco por la sincronización de sesión)
    if (!loginSuccess) {
      const msg = errorVisible
        ? 'Login fallido: mensaje de error visible en la página'
        : 'Login no completado: no hubo redirección a /inventario'
      await setup.info().attach('current-url', { body: page.url(), contentType: 'text/plain' })
      await setup.info().attach('console-log', { body: consoleLogs.join('\n'), contentType: 'text/plain' })
      await setup.info().attach('page-errors', { body: pageErrors.join('\n'), contentType: 'text/plain' })
      throw new Error(msg)
    }

    // 4. Guardar el estado de la sesión en el fichero de autenticación
    await page.context().storageState({ path: authFile })
  } finally {
    await setup.info().attach('console-log', { body: consoleLogs.join('\n'), contentType: 'text/plain' })
    await setup.info().attach('page-errors', { body: pageErrors.join('\n'), contentType: 'text/plain' })
  }
})