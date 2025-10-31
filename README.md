# FidesDigital - Sistema de Inventario de Patrimonio Parroquial

Sistema de catalogación inteligente para el inventario de bienes muebles del patrimonio eclesiástico, con asistencia de IA para análisis de imágenes.

## 🎯 Características Principales

- **Catalogación Asistida por IA**: Análisis automático de fotografías usando GPT-4o Mini con visión
- **Gestión Multi-parroquia**: Sistema multi-tenant con Row Level Security
- **Catálogo Público**: Visualización filtrable del patrimonio catalogado
- **Exportación PDF**: Generación de fichas de inventario imprimibles
- **Responsive**: Diseño adaptativo para móvil, tablet y desktop
- **Testing Completo**: Cobertura con tests unitarios, de componentes y E2E

## 🛠️ Stack Tecnológico

### Frontend
- **Next.js 15** (App Router)
- **React 19**
- **TypeScript 5**
- **Tailwind CSS 4**
- **Lucide React** (iconos)

### Backend & Servicios
- **Supabase** (Database, Auth, Storage)
- **Dify.ai** (AI/ML para análisis de imágenes)
- **PostgreSQL** (Base de datos)

### Testing
- **Vitest** (Tests unitarios)
- **Testing Library** (Tests de componentes)
- **Playwright** (Tests E2E)

## 📦 Instalación

### Prerrequisitos

- Node.js 20+
- npm o yarn
- Cuenta de Supabase
- API Key de Dify.ai

### Pasos de Instalación

1. **Clonar el repositorio**

```bash
git clone <url-del-repositorio>
cd inventarios_parroquias-main
```

2. **Instalar dependencias**

```bash
npm install
```

3. **Configurar variables de entorno**

Crear archivo `.env.local` en la raíz:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key
SUPABASE_SERVICE_ROLE_KEY=tu-service-role-key

# Dify AI
NEXT_PUBLIC_DIFY_API_URL=https://api.dify.ai/v1
NEXT_PUBLIC_DIFY_API_KEY=tu-dify-api-key
```

4. **Configurar base de datos**

Ejecutar los scripts SQL en Supabase:

```bash
# Desde la interfaz de Supabase SQL Editor:
# 1. supabase/schema/items_v2.sql
# 2. supabase/policies/items_policies.sql
```

5. **Ejecutar en desarrollo**

```bash
npm run dev
```

La aplicación estará disponible en `http://localhost:3000`

## 🧪 Testing

El proyecto incluye una suite completa de tests. Ver [TESTING.md](./TESTING.md) para documentación detallada.

### Comandos Rápidos

```bash
# Tests unitarios (modo watch)
npm test

# Tests unitarios (una vez)
npm run test:run

# Tests con cobertura
npm run test:coverage

# Tests E2E
npm run test:e2e

# Todos los tests
npm run test:all
```

### Estructura de Tests

```
src/__tests__/
  ├── lib/
  │   ├── auth.test.ts           # Tests de autenticación
  │   ├── supabase.test.ts       # Tests de base de datos
  │   └── dify.test.ts           # Tests de integración IA
  └── components/
      └── ChatInterface.test.tsx # Tests de UI

e2e/
  └── inventario-flow.spec.ts    # Tests end-to-end
```

## 📁 Estructura del Proyecto

```
inventarios_parroquias-main/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── api/               # API routes
│   │   ├── auth/              # Autenticación
│   │   ├── catalogo/          # Catálogo público
│   │   ├── inventario/        # Interfaz de catalogación
│   │   └── auditoria/         # Auditoría
│   ├── components/            # Componentes React
│   ├── lib/                   # Librerías core
│   │   ├── auth.ts
│   │   ├── supabase.ts
│   │   └── dify.ts
│   ├── data/                  # Datos estáticos
│   └── __tests__/             # Tests unitarios
├── e2e/                       # Tests E2E
├── supabase/                  # Esquemas y políticas DB
├── scripts/                   # Scripts de utilidad
└── public/                    # Assets estáticos
```

## 🚀 Scripts Disponibles

```bash
# Desarrollo
npm run dev              # Servidor de desarrollo con Turbopack
npm run build            # Build de producción
npm run start            # Servidor de producción
npm run lint             # Linter

# Testing
npm test                 # Tests unitarios (watch)
npm run test:run         # Tests unitarios (una vez)
npm run test:coverage    # Tests con cobertura
npm run test:e2e         # Tests E2E
npm run test:all         # Todos los tests

# Utilidades
npm run migrate:items    # Migración de datos legacy
```

## 🔐 Seguridad

### Autenticación
- Sistema de autenticación basado en Supabase Auth
- Sesiones persistentes con cookies
- Auto-refresh de tokens

### Autorización
- Row Level Security (RLS) en PostgreSQL
- Políticas basadas en roles (admin, user, viewer)
- Aislamiento por parroquia (multi-tenant)

### Validación
- Validación de tipos con TypeScript
- Sanitización de inputs
- Límites de tamaño de archivo (10MB)
- Validación de tipos MIME

## 📊 Base de Datos

### Tablas Principales

#### `parishes`
Entidades parroquiales

```sql
- id (UUID)
- name (TEXT)
- diocese (TEXT)
- location (TEXT)
```

#### `profiles`
Perfiles de usuario

```sql
- id (UUID, FK → auth.users)
- full_name (TEXT)
- email (TEXT)
- role (TEXT)
- parish_id (UUID, FK → parishes)
```

#### `items`
Items de inventario

```sql
- id (UUID)
- user_id (UUID, FK → profiles)
- parish_id (UUID, FK → parishes)
- inventory_number (TEXT)
- status (draft|published|approved)
- image_url (TEXT)
- data (JSONB)
```

## 🤖 Integración con IA

El sistema utiliza Dify.ai con GPT-4o Mini para análisis de imágenes:

1. Usuario sube fotografía del objeto
2. Imagen se envía a Dify para análisis
3. IA genera catalogación estructurada
4. Usuario revisa y edita sugerencias
5. Aprobación guarda en base de datos

### Campos Analizados

- Tipo de objeto
- Categoría
- Descripción (breve y detallada)
- Materiales y técnicas
- Estilo artístico
- Datación aproximada
- Iconografía
- Estado de conservación
- Valor artístico

## 📝 Flujo de Trabajo

### 1. Registro/Login
```
/auth → Registro con email/password → Asignación a parroquia
```

### 2. Catalogación
```
/inventario → Subir foto → Análisis IA → Edición manual → Aprobar → Guardado
```

### 3. Consulta Pública
```
/catalogo → Filtros (tipo, categoría, parroquia) → Vista de detalle
```

## 🎨 Características de UI/UX

- **Diseño Responsivo**: Mobile-first con breakpoints para tablet y desktop
- **Safe Areas**: Soporte para notch en móviles
- **Dark Mode Ready**: Preparado para modo oscuro (implementación futura)
- **Accesibilidad**: Controles keyboard-friendly, ARIA labels
- **Loading States**: Indicadores de carga en operaciones asíncronas
- **Error Handling**: Mensajes de error claros y accionables

## 🔄 Migración de Datos

Para migrar datos de la tabla legacy `conversaciones` a `items`:

```bash
npm run migrate:items
```

Este script:
- Lee datos de `conversaciones`
- Normaliza estructura
- Genera números de inventario
- Inserta en tabla `items`

## 🐛 Debugging

### Logs de Desarrollo

Los logs incluyen trace IDs para facilitar debugging:

```
[abc123] 📤 Subiendo imagen a Dify...
[abc123] ✅ Imagen subida correctamente
```

### Herramientas

- **React DevTools**: Inspección de componentes
- **Supabase Dashboard**: Queries y logs de DB
- **Playwright Inspector**: Debug de tests E2E

## 📈 Mejoras Futuras (Roadmap)

### Prioridad Alta
- [ ] Sistema de notificaciones toast
- [ ] Progress bars para uploads
- [ ] Paginación en catálogo
- [ ] Sistema de roles completo en UI

### Prioridad Media
- [ ] Exportación bulk a Excel/CSV
- [ ] Sistema de versiones para items
- [ ] Búsqueda full-text avanzada
- [ ] Dashboard de analytics

### Prioridad Baja
- [ ] PWA (Progressive Web App)
- [ ] Internacionalización (i18n)
- [ ] Dark mode
- [ ] Integración con más proveedores de IA

## 🤝 Contribuir

### Proceso

1. Fork del repositorio
2. Crear rama feature (`git checkout -b feature/nueva-funcionalidad`)
3. Hacer cambios con tests
4. Ejecutar suite de tests (`npm run test:all`)
5. Commit con mensaje descriptivo
6. Push a la rama (`git push origin feature/nueva-funcionalidad`)
7. Crear Pull Request

### Estándares de Código

- **TypeScript**: Tipado estricto, sin `any`
- **ESLint**: Seguir configuración del proyecto
- **Testing**: Cobertura >80% para código nuevo
- **Commits**: Mensajes descriptivos en español

## 📄 Licencia

Este proyecto está licenciado bajo los términos especificados por la Diócesis de Guadix.

## 👤 Autor

**Manuel Carrasco García**
Diócesis de Guadix, España

## 📞 Soporte

Para reportar bugs o solicitar features:
- Crear issue en el repositorio
- Email: [contacto]

---

**Nota**: Este README está en constante evolución. Última actualización: 2025-01-30
