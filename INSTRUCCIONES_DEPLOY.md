# Instrucciones para Verificar Deploy de Nuevas Funcionalidades

## Problema Reportado
Las nuevas páginas (Footer y /acerca-de) no aparecen en Vercel después del deploy.

## Pasos de Verificación y Solución

### 1. ✅ Verificar que el código está en GitHub
```bash
git log --oneline -3
```

**Esperado**: Deberías ver estos commits:
- `feat(branding): añadir footer, página Acerca de y lista de espera`
- `docs: estrategia completa Fides Sacristía`

**Status**: ✅ Confirmado - Los commits están en origin/main

### 2. 🔍 Verificar Build en Vercel

**Acciones**:
1. Ve a tu dashboard de Vercel: https://vercel.com/dashboard
2. Selecciona el proyecto de inventario parroquial
3. Ve a la pestaña "Deployments"
4. Revisa el último deployment:
   - ¿Estado? (Success/Failed/Building)
   - ¿Hora del último deploy?
   - ¿Hay errores en los logs?

**Posibles problemas**:

#### A) Build falló silenciosamente
- **Síntoma**: Vercel muestra "Success" pero usa un build anterior
- **Solución**: Forzar redeploy desde Vercel UI
  - Botón "..." en el deployment → "Redeploy"

#### B) Error en build de Next.js
- **Síntoma**: Error durante "Generating static pages"
- **Posible causa**: Problema con imports de server components
- **Solución**: Ver logs completos del build en Vercel

#### C) Caché de Vercel
- **Síntoma**: Código nuevo no se refleja en producción
- **Solución**:
  - Settings → Clear Cache
  - Luego redeploy

### 3. 📝 Ejecutar SQL en Supabase (REQUERIDO)

**IMPORTANTE**: La página `/acerca-de` necesita la tabla `waitlist` en Supabase para funcionar.

**Pasos**:
1. Ve a tu dashboard de Supabase: https://supabase.com/dashboard
2. Selecciona tu proyecto
3. Ve a "SQL Editor" en el menú lateral
4. Click en "New query"
5. Copia TODO el contenido de `CREAR_TABLA_WAITLIST.sql`
6. Pega en el editor
7. Click en "Run" (botón verde inferior derecho)

**Verificación**:
```sql
-- Ejecuta esto para verificar que la tabla se creó:
SELECT * FROM waitlist;

-- Debe devolver una tabla vacía (sin error)
```

**Si hay error** tipo "relation already exists":
- Está bien, significa que ya estaba creada
- Continúa con los siguientes pasos

### 4. 🧪 Probar en Local Primero

Antes de investigar Vercel, verifica que todo funciona en local:

```bash
# Desde la carpeta del proyecto
npm run build
npm run start
```

Luego abre en navegador:
- http://localhost:3000 → ¿Ves el footer?
- http://localhost:3000/acerca-de → ¿Carga la página?

**Si funciona en local pero no en Vercel** → Problema de deploy de Vercel

### 5. 🔧 Soluciones según el problema

#### Solución 1: Forzar Redeploy desde Vercel UI
1. Ve a Vercel Dashboard
2. Deployments → Último deployment
3. Click en "..." → "Redeploy"
4. Espera 2-3 minutos
5. Visita tu URL de producción

#### Solución 2: Redeploy desde Git (commit vacío)
```bash
git commit --allow-empty -m "chore(vercel): force redeploy"
git push origin main
```

#### Solución 3: Limpiar Caché de Vercel
1. Vercel Dashboard → Settings
2. "Clear Build Cache"
3. Luego hacer redeploy

#### Solución 4: Verificar Variables de Entorno
Si `/acerca-de` carga pero el formulario no funciona:

1. Vercel Dashboard → Settings → Environment Variables
2. Verificar que existan:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. Si faltan, añadirlas y redeploy

### 6. 🧐 Diagnóstico Detallado

**Ejecuta estos checks uno por uno**:

#### Check 1: ¿Los archivos están en el repo?
```bash
git ls-files | grep -E "(Footer|acerca-de)"
```

**Esperado**:
```
src/components/Footer.tsx
src/app/acerca-de/page.tsx
```

#### Check 2: ¿El layout importa el Footer?
```bash
grep -n "Footer" src/app/layout.tsx
```

**Esperado**:
```
5:import Footer from '@/components/Footer'
52:          <Footer />
```

#### Check 3: ¿La página acerca-de tiene el import correcto?
```bash
head -20 src/app/acerca-de/page.tsx | grep "getSupabaseBrowser"
```

**Esperado**:
```
import { getSupabaseBrowser } from '@/lib/auth'
```

### 7. 📱 Verificación Final en Producción

Una vez que Vercel muestre "Deployment Successful":

1. **Limpiar caché del navegador**:
   - Chrome/Edge: Ctrl + Shift + R
   - Firefox: Ctrl + F5
   - Safari: Cmd + Option + R

2. **Verificar URLs**:
   - `https://tuapp.vercel.app` → ¿Ves footer abajo?
   - `https://tuapp.vercel.app/acerca-de` → ¿Carga página completa?

3. **Probar formulario**:
   - Completa nombre + email
   - Click en "Únete a la lista de espera"
   - ¿Muestra mensaje de éxito?

### 8. 🆘 Si Nada Funciona

**Última opción - Deploy manual desde CLI**:

```bash
# Instalar Vercel CLI si no lo tienes
npm i -g vercel

# Login
vercel login

# Deploy forzado
vercel --prod --force

# Esto ignora caché y hace deploy completo
```

---

## Checklist de Verificación Rápida

- [ ] Commits están en GitHub (git log)
- [ ] SQL ejecutado en Supabase (tabla waitlist existe)
- [ ] Build local funciona (npm run build)
- [ ] Footer visible en local (http://localhost:3000)
- [ ] Página /acerca-de carga en local
- [ ] Último deploy en Vercel tiene status "Success"
- [ ] Caché del navegador limpiado
- [ ] Footer visible en producción
- [ ] Página /acerca-de carga en producción
- [ ] Formulario de lista de espera funciona

---

## Información para Debugging

**Archivos clave creados**:
```
src/components/Footer.tsx           → Footer con branding
src/app/acerca-de/page.tsx         → Página completa "Acerca de"
src/app/layout.tsx                 → Modificado para incluir Footer
CREAR_TABLA_WAITLIST.sql           → SQL para tabla waitlist
```

**Cambios en archivos existentes**:
```diff
src/app/layout.tsx:
+ import Footer from '@/components/Footer'
+ <main className="flex-1">
+   {children}
+ </main>
+ <Footer />
```

**Commits relevantes**:
- `c8a2885` - feat(branding): añadir footer, página Acerca de y lista de espera

---

## Contacto si Necesitas Ayuda

Si después de seguir estos pasos sigue sin funcionar:

1. Comparte el enlace al deployment en Vercel
2. Copia los logs del build (si hay errores)
3. Indica qué ves exactamente en producción vs. lo esperado

**URL de producción esperada**: https://[tu-app].vercel.app/acerca-de
