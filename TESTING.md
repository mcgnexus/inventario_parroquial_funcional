# Guía de Testing - FidesDigital

Esta guía explica cómo ejecutar y escribir tests para el proyecto FidesDigital.

## 📋 Tabla de Contenidos

- [Descripción General](#descripción-general)
- [Configuración Inicial](#configuración-inicial)
- [Tests Unitarios con Vitest](#tests-unitarios-con-vitest)
- [Tests de Componentes](#tests-de-componentes)
- [Tests E2E con Playwright](#tests-e2e-con-playwright)
- [Mejores Prácticas](#mejores-prácticas)
- [CI/CD](#cicd)

---

## Descripción General

El proyecto utiliza un stack completo de testing:

- **Vitest**: Tests unitarios y de componentes
- **Testing Library**: Testing de componentes React
- **Playwright**: Tests end-to-end (E2E)
- **Happy DOM**: Entorno de DOM para tests unitarios

### Estructura de Tests

```
proyecto/
├── src/
│   └── __tests__/
│       ├── setup.ts              # Configuración global
│       ├── utils/
│       │   └── test-utils.tsx    # Utilidades compartidas
│       ├── lib/
│       │   ├── auth.test.ts
│       │   ├── supabase.test.ts
│       │   └── dify.test.ts
│       └── components/
│           └── ChatInterface.test.tsx
├── e2e/
│   ├── inventario-flow.spec.ts  # Tests E2E
│   └── fixtures/                # Archivos de prueba
├── vitest.config.ts             # Configuración Vitest
└── playwright.config.ts         # Configuración Playwright
```

---

## Configuración Inicial

### Instalar Dependencias

```bash
npm install
```

Todas las dependencias de testing ya están incluidas en `package.json`.

### Instalar Navegadores de Playwright

```bash
npx playwright install chromium
```

---

## Tests Unitarios con Vitest

### Comandos Disponibles

```bash
# Ejecutar tests en modo watch (desarrollo)
npm test

# Ejecutar tests una vez
npm run test:run

# Ejecutar tests con cobertura
npm run test:coverage

# Abrir UI de Vitest (recomendado para desarrollo)
npm run test:ui
```

### Ejemplo de Test Unitario

```typescript
import { describe, it, expect, vi } from 'vitest'
import { signInWithEmail } from '@/lib/auth'

describe('signInWithEmail', () => {
  it('should sign in user with valid credentials', async () => {
    // Arrange
    const mockUser = { id: '123', email: 'test@example.com' }

    // Act
    const user = await signInWithEmail('test@example.com', 'password')

    // Assert
    expect(user).toEqual(mockUser)
  })
})
```

### Escribir Nuevos Tests

1. Crear archivo con sufijo `.test.ts` o `.test.tsx`
2. Importar utilidades de `vitest`
3. Usar `describe` para agrupar tests relacionados
4. Usar `it` o `test` para casos individuales
5. Usar mocks para dependencias externas

---

## Tests de Componentes

### Ejemplo de Test de Componente

```typescript
import { render, screen, fireEvent } from '../utils/test-utils'
import ChatInterface from '@/components/ChatInterface'

describe('ChatInterface', () => {
  it('should render welcome message', () => {
    render(<ChatInterface />)

    expect(screen.getByText(/Asistente de Catalogación/i)).toBeInTheDocument()
  })

  it('should allow image upload', async () => {
    render(<ChatInterface />)

    const file = new File(['content'], 'test.jpg', { type: 'image/jpeg' })
    const input = screen.getByLabelText(/Subir Foto/i)

    fireEvent.change(input, { target: { files: [file] } })

    expect(screen.getByText('test.jpg')).toBeInTheDocument()
  })
})
```

### Testing Library Queries

- `getBy*`: Lanza error si no encuentra (sincrónico)
- `queryBy*`: Retorna null si no encuentra (sincrónico)
- `findBy*`: Espera y retorna promesa (asincrónico)

**Prioridad recomendada:**
1. `getByRole` (más accesible)
2. `getByLabelText`
3. `getByPlaceholderText`
4. `getByText`
5. `getByTestId` (último recurso)

---

## Tests E2E con Playwright

### Comandos Disponibles

```bash
# Ejecutar todos los tests E2E
npm run test:e2e

# Ejecutar con UI (recomendado para desarrollo)
npm run test:e2e:ui

# Ejecutar con navegador visible
npm run test:e2e:headed

# Ejecutar tests específicos
npx playwright test inventario-flow.spec.ts
```

### Ejemplo de Test E2E

```typescript
import { test, expect } from '@playwright/test'

test('debe completar flujo de catalogación', async ({ page }) => {
  // Navegar a página
  await page.goto('/')

  // Interactuar con elementos
  await page.getByText(/Subir Foto/i).click()

  // Verificar resultados
  await expect(page.getByText(/Ficha de Inventario/i)).toBeVisible()
})
```

### Debugging de Tests E2E

```bash
# Modo debug con Playwright Inspector
npx playwright test --debug

# Generar trace para análisis
npx playwright test --trace on

# Ver trace en navegador
npx playwright show-trace trace.zip
```

### Preparar Fixtures

Para tests que requieren imágenes:

1. Colocar archivos en `e2e/fixtures/`
2. Referenciar en tests:

```typescript
const filePath = 'e2e/fixtures/test-image.jpg'
await page.setInputFiles('input[type="file"]', filePath)
```

---

## Mejores Prácticas

### Principios AAA

Estructura tus tests usando:
- **Arrange**: Preparar datos y estado
- **Act**: Ejecutar la acción a probar
- **Assert**: Verificar el resultado

```typescript
test('example', () => {
  // Arrange
  const input = 'test'

  // Act
  const result = doSomething(input)

  // Assert
  expect(result).toBe('expected')
})
```

### Nomenclatura

- **Archivos**: `ComponentName.test.tsx`, `functionName.test.ts`
- **Describe blocks**: Usa el nombre del componente/función
- **Test cases**: Usa frases descriptivas con "should"

```typescript
describe('ChatInterface', () => {
  it('should render welcome message when no messages exist', () => {
    // ...
  })
})
```

### Mocking

#### Mock de Módulos

```typescript
vi.mock('@/lib/auth', () => ({
  getCurrentUser: vi.fn(() => Promise.resolve(mockUser)),
  signOut: vi.fn(),
}))
```

#### Mock de APIs

```typescript
global.fetch = vi.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({ data: 'test' }),
  })
)
```

#### Mock de Next.js

Ya están configurados en `setup.ts`:
- `next/navigation` (useRouter, usePathname, etc.)
- `next/image`

### Cobertura de Código

Objetivo recomendado:
- **Statements**: >80%
- **Branches**: >75%
- **Functions**: >80%
- **Lines**: >80%

Verificar cobertura:

```bash
npm run test:coverage
```

El reporte HTML se genera en `coverage/index.html`.

### Testing Asíncrono

```typescript
// Usar async/await
test('async operation', async () => {
  const result = await asyncFunction()
  expect(result).toBe('expected')
})

// Esperar por elementos en componentes
test('waiting for element', async () => {
  render(<Component />)
  const element = await screen.findByText(/texto/i)
  expect(element).toBeInTheDocument()
})
```

---

## CI/CD

### GitHub Actions (Ejemplo)

Crear `.github/workflows/test.yml`:

```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run unit tests
        run: npm run test:run

      - name: Run E2E tests
        run: npm run test:e2e
        env:
          CI: true

      - name: Upload coverage
        uses: codecov/codecov-action@v4
        with:
          files: ./coverage/coverage-final.json
```

### Pre-commit Hooks (Opcional)

Instalar Husky:

```bash
npm install --save-dev husky
npx husky init
```

En `.husky/pre-commit`:

```bash
#!/usr/bin/env sh
npm run test:run
npm run lint
```

---

## Troubleshooting

### Tests Fallan con Error de Timeout

Aumentar timeout en `vitest.config.ts`:

```typescript
export default defineConfig({
  test: {
    testTimeout: 10000, // 10 segundos
  },
})
```

### Playwright No Encuentra Elementos

1. Verificar que el servidor está corriendo
2. Usar `await page.waitForSelector('selector')`
3. Verificar con `--headed` para ver el navegador

### Tests de Componentes Fallan

1. Verificar que los mocks están configurados
2. Revisar `setup.ts` para mocks globales
3. Usar `screen.debug()` para ver el DOM

---

## Recursos Adicionales

- [Vitest Docs](https://vitest.dev/)
- [Testing Library](https://testing-library.com/)
- [Playwright Docs](https://playwright.dev/)
- [Kent C. Dodds - Testing Best Practices](https://kentcdodds.com/testing)

---

## Contribuir

Al agregar nuevas funcionalidades:

1. ✅ Escribe tests para código nuevo
2. ✅ Actualiza tests existentes si modificas funcionalidad
3. ✅ Asegúrate de que `npm run test:all` pase
4. ✅ Mantén cobertura >80%
5. ✅ Documenta casos edge en comentarios

---

**Nota**: Los tests son código de producción. Mantenlos limpios, legibles y mantenibles.
