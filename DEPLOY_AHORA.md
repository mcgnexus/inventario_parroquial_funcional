# 🚀 Desplegar a Vercel AHORA - Guía de 10 minutos

## ✅ Ya hecho:
- ✅ Código pushed a GitHub
- ✅ Commit creado con todos los cambios
- ✅ Documentación completa

## ⚠️ PASO CRÍTICO #1: Ejecutar SQL (3 minutos)

**DEBES hacer esto ANTES de desplegar a Vercel o la app NO funcionará.**

1. Abre https://supabase.com/dashboard
2. Selecciona tu proyecto
3. Click en **SQL Editor** (en el menú izquierdo)
4. Click en **"New query"**
5. Copia **TODO** el archivo `FIX_RECURSION.sql` (las 135 líneas)
6. Pégalo en el editor
7. Click en **RUN** (o Ctrl+Enter)
8. **Verifica**: Debes ver "Success. No rows returned" (sin errores)

## 📋 PASO #2: Desplegar en Vercel (5 minutos)

### Opción A: Desde la web (más fácil)

1. **Ve a**: https://vercel.com
2. **Login** con tu cuenta (GitHub, GitLab, o Email)
3. Click en **"Add New..."** → **"Project"**
4. **Importa** tu repositorio:
   - Busca: `inventario_parroquial_funcional`
   - Click en **"Import"**
5. **Configurar proyecto**:
   - Framework Preset: **Next.js** (detectado automáticamente)
   - Root Directory: `./` (por defecto)
   - Build Command: `npm run build` (por defecto)
   - Output Directory: `.next` (por defecto)
6. **Variables de Entorno** - Click en "Environment Variables":

   Agrega estas 4 variables (copia y pega exactamente):

   **Variable 1:**
   ```
   Name: NEXT_PUBLIC_SUPABASE_URL
   Value: https://wcmzsaihdpfpfdzhruqt.supabase.co
   ```

   **Variable 2:**
   ```
   Name: NEXT_PUBLIC_SUPABASE_ANON_KEY
   Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndjbXpzYWloZHBmcGZkemhydXF0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA5OTg2NzgsImV4cCI6MjA3NjU3NDY3OH0.QWG593Rkg8JyYhgfrPf1XJbZWcCuvtCe0mQbnnNmmR4
   ```

   **Variable 3:**
   ```
   Name: NEXT_PUBLIC_DIFY_API_URL
   Value: https://api.dify.ai/v1
   ```

   **Variable 4:**
   ```
   Name: NEXT_PUBLIC_DIFY_API_KEY
   Value: app-dQa6qm0H05XpI0MlRpOxwPWR
   ```

   **Variable 5 (Opcional pero recomendada):**
   ```
   Name: SUPABASE_SERVICE_ROLE_KEY
   Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndjbXpzYWloZHBmcGZkemhydXF0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDk5ODY3OCwiZXhwIjoyMDc2NTc0Njc4fQ.Fx6WpNk1j-3bbXQ-lAEgLC6RI7iIbRQsL-d-tGkavew
   ```

   Para cada variable:
   - Marca **Production** ✅
   - Marca **Preview** ✅
   - Marca **Development** ✅

7. Click en **"Deploy"**

8. **Espera** 2-3 minutos mientras Vercel hace el build y deploy

9. **¡Listo!** Verás una pantalla de éxito con confeti 🎉

### Opción B: Con Vercel CLI (alternativa)

```bash
# Instalar Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy (te pedirá confirmaciones)
vercel

# Configurar variables de entorno interactivamente
vercel env add NEXT_PUBLIC_SUPABASE_URL
# (pegar el valor cuando pida)
# Repetir para cada variable
```

## 🧪 PASO #3: Verificar que funciona (2 minutos)

Vercel te dará una URL tipo: `https://tu-proyecto-xxxx.vercel.app`

1. **Abre la URL** en tu navegador
2. **Verifica**:
   - ✅ La página carga (no errores 500)
   - ✅ Ves el logo "FidesDigital"
   - ✅ Ves las tarjetas: Catálogo, Nueva Catalogación, etc.
3. **Inicia sesión**:
   - Email: `mcgnexus@gmail.com`
   - Contraseña: `Avemaria_1977`
4. **Verifica que ves**:
   - ✅ Botón "Panel de Administración" (tarjeta con borde azul)
   - ✅ Tu email en la parte superior
5. **Click** en "Panel de Administración"
6. **Verifica**:
   - ✅ Ves pestañas: Pendientes, Sin pago, Activos, Todos
   - ✅ Ves estadísticas arriba (aunque estén en 0)
   - ✅ NO hay errores en consola (presiona F12 para ver)

## ✨ PASO #4: Probar registro de usuario (3 minutos)

1. **Abre ventana de incógnito** (Ctrl+Shift+N en Chrome)
2. Ve a tu URL de Vercel
3. Click en "Registrarse"
4. Completa con datos de prueba:
   ```
   Nombre: Usuario Prueba
   Email: test@ejemplo.com
   Contraseña: Test123456
   Parroquia: Iglesia de Prueba
   ```
5. Click en "Registrarse"
6. **Verifica**:
   - ✅ Ves mensaje verde "Registro exitoso"
   - ✅ Te redirige a login automáticamente

7. **Vuelve a tu ventana normal** (como admin)
8. Refresca el panel de admin
9. **Verifica**:
   - ✅ Ves a "Usuario Prueba" en pestaña "Pendientes"
   - ✅ Hay un botón "Aprobar"

10. **Click en "Aprobar"**
11. **Verifica**:
    - ✅ Usuario desaparece de "Pendientes"
    - ✅ Usuario aparece en pestaña "Sin pago"

12. **Vuelve a ventana de incógnito**
13. Inicia sesión con `test@ejemplo.com`
14. **Verifica**:
    - ✅ Ves banner GIGANTE azul: "¡Cuenta aprobada!"
    - ✅ Ves número de Bizum en verde: **614 242 716**
    - ✅ Instrucciones claras de cómo pagar

## 🎯 ¡YA ESTÁ EN PRODUCCIÓN!

Tu aplicación ya está funcionando en internet. Cualquier persona puede acceder a tu URL de Vercel.

## 📝 Tareas pendientes (opcionales)

### Dominio personalizado (opcional)

Si quieres usar tu propio dominio (ej: `inventario.diocesisdeguadix.es`):

1. En Vercel → Settings → Domains
2. Agrega tu dominio
3. Sigue instrucciones de DNS
4. Espera propagación (hasta 48h)

### Reemplazar IBAN placeholder

En el archivo `src/components/SubscriptionStatus.tsx` línea 149, hay un IBAN placeholder:

```typescript
// Línea 149
<p className="font-mono font-semibold">ES12 3456 7890 1234 5678 9012</p>
<p className="text-xs text-red-600">← Reemplaza con tu IBAN real</p>
```

Reemplázalo con tu IBAN real de la Diócesis.

### Emails de notificación (próximamente)

Considera implementar:
- Email al admin cuando nuevo usuario se registra
- Email al usuario cuando es aprobado
- Email al usuario recordatorio de renovación

Puedes usar:
- Supabase Auth Email Templates
- SendGrid
- Resend
- Mailgun

### Analytics (opcional)

Vercel incluye analytics básicos gratis. Para ver:
1. Ve a tu proyecto en Vercel
2. Click en pestaña "Analytics"
3. Verás visitas, países, dispositivos, etc.

## 🆘 Si algo falla

### Error: "infinite recursion detected"

**Causa**: No ejecutaste `FIX_RECURSION.sql` en Supabase.

**Solución**:
1. Ve a Supabase SQL Editor
2. Ejecuta `FIX_RECURSION.sql`
3. En Vercel: Deployments → click en "..." → "Redeploy"

### Error: Build falla

**Solución**:
1. Ve a Vercel → Deployments
2. Click en el deployment fallido
3. Lee los logs (scroll hasta ver el error)
4. Si es error de TypeScript, arréglalo localmente y haz push
5. Vercel re-deployará automáticamente

### Error: Variables de entorno no funcionan

**Solución**:
1. Ve a Settings → Environment Variables
2. Verifica que todas tienen las 3 checkboxes marcadas
3. Borra caché: Deployments → "..." → "Redeploy"

### Error: No puedo iniciar sesión como admin

**Solución**:
Ve a Supabase SQL Editor y ejecuta:

```sql
UPDATE profiles
SET role = 'admin', user_status = 'active'
WHERE id = (SELECT id FROM auth.users WHERE email = 'mcgnexus@gmail.com');
```

## 📊 URLs importantes

- **Tu app en producción**: [Se asignará después del deploy]
- **GitHub**: https://github.com/mcgnexus/inventario_parroquial_funcional
- **Vercel Dashboard**: https://vercel.com/dashboard
- **Supabase Dashboard**: https://supabase.com/dashboard

## 📚 Documentación adicional

- [DEPLOYMENT_VERCEL.md](DEPLOYMENT_VERCEL.md) - Guía completa de deployment
- [GUIA_SISTEMA_SUSCRIPCION.md](GUIA_SISTEMA_SUSCRIPCION.md) - Cómo funciona el sistema
- [CONSULTAS_SQL_UTILES.md](CONSULTAS_SQL_UTILES.md) - Queries útiles para gestión
- [PLANTILLAS_COMUNICACION.md](PLANTILLAS_COMUNICACION.md) - Emails para usuarios

---

**Tiempo total estimado**: 10-15 minutos

**¡Éxito con tu deployment! 🎉**
