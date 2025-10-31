import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import { STORAGE_STATE } from '../playwright.config'

/**
 * Test E2E del flujo completo de inventario
 *
 * NOTA: Este test requiere:
 * 1. Que la aplicación esté corriendo (npm run dev)
 * 2. Que Supabase esté configurado y accesible
 * 3. Que Dify API esté disponible (puede mockarse en desarrollo)
 *
 * Para ejecutar: npm run test:e2e
 */

test.describe('Flujo Completo de Inventario', () => {
  // Este grupo de tests requiere autenticación
  test.describe('Con autenticación', () => {
    // Usar el estado de sesión guardado para todos los tests de este bloque
    test.use({ storageState: STORAGE_STATE })

    test.beforeEach(async ({ page }) => {
      // Todos los tests en este describe comenzarán en la página de inventario
      await page.goto('/inventario')
    })

    test('debe cargar la interfaz de catalogación', async ({ page }) => {
      // Verificar elementos principales
      await expect(page.getByText(/Autenticado como/i)).toBeVisible()
      await expect(page.getByText(/Asistente de Catalogación/i)).toBeVisible()
      await expect(page.getByText(/Suba una fotografía/i)).toBeVisible()
    })

    test('debe permitir subir una imagen y mostrar su preview', async ({ page }) => {
      // Preparar un archivo de prueba
      const filePath = 'e2e/fixtures/test-image.jpg'

      const fileInput = page.locator('input[type="file"]')
      await expect(fileInput).toBeAttached()

      // Subir el archivo
      await fileInput.setInputFiles(filePath)

      // Verificar que la preview de la imagen aparece
      await expect(page.getByText('test-image.jpg')).toBeVisible()
      await expect(page.getByAltText('Preview de imagen seleccionada')).toBeVisible()
    })

    test('debe poder enviar una imagen para análisis', async ({ page }) => {
      // Subir imagen
      const filePath = 'e2e/fixtures/test-image.jpg'
      await page.locator('input[type="file"]').setInputFiles(filePath)

      // Hacer click en analizar
      await page.getByRole('button', { name: 'Analizar' }).click()

      // Esperar la respuesta de la IA (puede tardar)
      // Aquí mockearíamos la API de Dify en un entorno de CI/CD
      // para un test local, esperamos la respuesta real.
      await expect(page.getByText(/Ficha de Inventario/i)).toBeVisible({ timeout: 30000 })
      await expect(page.getByText(/Datos de Identificación/i)).toBeVisible()
    })
  })

  test.describe('Página de Catálogo', () => {
    test('debe mostrar filtros de búsqueda', async ({ page }) => {
      await page.goto('/catalogo')

      // Esperar a que cargue el encabezado de la página
      await expect(page.getByRole('heading', { name: /Catálogo/i })).toBeVisible()

      // Verificar filtros
      await expect(page.getByLabel(/Tipo/i)).toBeVisible()
      await expect(page.getByLabel(/Categoría/i)).toBeVisible()
      await expect(page.getByLabel(/Parroquia/i)).toBeVisible()
      await expect(page.getByPlaceholder(/Palabras clave/i)).toBeVisible()
    })

    test('debe permitir filtrar por categoría', async ({ page }) => {
      await page.goto('/catalogo')

      // Seleccionar una categoría
      await page.getByLabel(/Categoría/i).selectOption('orfebreria')

      // Click en filtrar
      await page.getByRole('button', { name: /Filtrar/i }).click()

      // Verificar que la URL contiene el filtro
      await expect(page).toHaveURL(/categoria=orfebreria/)
    })

    test('debe permitir buscar por texto', async ({ page }) => {
      await page.goto('/catalogo')

      // Escribir en el buscador
      await page.getByPlaceholder(/Palabras clave/i).fill('cáliz')

      // Click en filtrar
      await page.getByRole('button', { name: /Filtrar/i }).click()

      // Verificar que la URL contiene la búsqueda
      await expect(page).toHaveURL(/q=c%C3%A1liz/)
    })

    test('debe limpiar filtros al hacer click en Limpiar', async ({ page }) => {
      await page.goto('/catalogo?categoria=orfebreria&q=test')

      // Click en limpiar
      await page.getByRole('link', { name: /Limpiar/i }).click()

      // Verificar que la URL no tiene parámetros
      await expect(page).toHaveURL(/^[^?]*$/)
    })
  })

  test.describe('Detalle de Catálogo', () => {
    test('debe mostrar mensaje si no hay items', async ({ page }) => {
      await page.goto('/catalogo')

      // Si no hay items, debería mostrar mensaje
      const noItems = page.getByText(/No hay elementos/i)

      // Este test es condicional: si hay items, no aparece
      // En un test real, necesitarías datos de prueba garantizados
    })
  })

  test.describe('Responsive Design', () => {
    test('debe funcionar correctamente en móvil', async ({ page }) => {
      // Establecer viewport móvil
      await page.setViewportSize({ width: 375, height: 667 })

      await page.goto('/')

      // Verificar que los elementos principales están visibles
      await expect(page.getByText(/FidesDigital/i)).toBeVisible()
      await expect(page.getByText(/Inventario patrimonial asistido por IA/i)).toBeVisible()
    })

    test('debe funcionar correctamente en tablet', async ({ page }) => {
      // Establecer viewport tablet
      await page.setViewportSize({ width: 768, height: 1024 })

      await page.goto('/catalogo')

      // Verificar grid de catálogo
      await expect(page.getByRole('heading', { name: /Catálogo/i })).toBeVisible()
    })
  })

  test.describe('Accesibilidad', () => {
    // Importa Axe en la parte superior del fichero
    // import AxeBuilder from '@axe-core/playwright';

    test('la página principal no debe tener violaciones de accesibilidad graves', async ({ page }) => {
      await page.goto('/')

      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']) // Estándares a verificar
        .analyze()

      expect(accessibilityScanResults.violations).toEqual([])
    })
  })

  test.describe('Performance', () => {
    test('la página principal debe cargar rápido', async ({ page }) => {
      const startTime = Date.now()

      await page.goto('/')

      const loadTime = Date.now() - startTime

      // La página debería cargar en menos de 3 segundos
      expect(loadTime).toBeLessThan(3000)
    })
  })
})
