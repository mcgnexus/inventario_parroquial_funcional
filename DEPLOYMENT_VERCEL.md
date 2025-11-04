# Guía de Deployment en Vercel

## ⚠️ IMPORTANTE: Ejecutar SQL ANTES de desplegar

**DEBES ejecutar `FIX_RECURSION.sql` en Supabase ANTES de hacer el deployment**, o la aplicación no funcionará en producción.

## Pasos para desplegar

### 1. Preparación local (YA HECHO ✅)

El código ya está listo para deployment. Los archivos necesarios están preparados.

### 2. Ejecutar SQL en Supabase (CRÍTICO ⚠️)

1. Ve a https://supabase.com/dashboard
2. Abre tu proyecto
3. Click en **SQL Editor**
4. Copia **TODO** el contenido de `FIX_RECURSION.sql`
5. Pégalo y presiona **RUN**
6. Verifica que dice: "Success. No rows returned"

**Sin este paso, la app NO funcionará en producción.**

### 3. Commit y Push a GitHub

Los cambios ya están listos para commit. Ejecuta:

```bash
git add .
git commit -m "Implementar sistema de suscripción y aprobación de usuarios

- Sistema de aprobación manual de usuarios
- Integración con Bizum (614 242 716) para pagos
- Panel de administración en /admin
- Solo mcgnexus@gmail.com tiene acceso admin
- Estados de usuario: pending → approved_unpaid → active
- RLS policies sin recursión usando auth.jwt()
- Componente SubscriptionStatus para mostrar estado
- Funciones SQL: approve_user(), activate_subscription(), etc.

🤖 Generated with Claude Code
Co-Authored-By: Claude <noreply@anthropic.com>"

git push origin main
```

### 4. Configurar Vercel

#### Opción A: Deployment automático (Recomendado)

1. Ve a https://vercel.com
2. Inicia sesión con tu cuenta
3. Click en **"Add New Project"**
4. Selecciona tu repositorio: `inventario_parroquial_funcional`
5. Vercel detectará automáticamente que es Next.js
6. **IMPORTANTE**: Configura las variables de entorno (ver sección siguiente)
7. Click en **"Deploy"**

#### Opción B: Usando Vercel CLI

```bash
# Instalar Vercel CLI (si no lo tienes)
npm i -g vercel

# Login
vercel login

# Deploy
vercel
```

### 5. Configurar Variables de Entorno en Vercel

En el dashboard de Vercel, ve a **Settings → Environment Variables** y agrega:

#### Variables Públicas (necesarias):

```
NEXT_PUBLIC_SUPABASE_URL=https://wcmzsaihdpfpfdzhruqt.supabase.co
```

```
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndjbXpzYWloZHBmcGZkemhydXF0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA5OTg2NzgsImV4cCI6MjA3NjU3NDY3OH0.QWG593Rkg8JyYhgfrPf1XJbZWcCuvtCe0mQbnnNmmR4
```

```
NEXT_PUBLIC_DIFY_API_URL=https://api.dify.ai/v1
```

```
NEXT_PUBLIC_DIFY_API_KEY=app-dQa6qm0H05XpI0MlRpOxwPWR
```

#### Variables Privadas (opcionales pero recomendadas):

```
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndjbXpzYWloZHBmcGZkemhydXF0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDk5ODY3OCwiZXhwIjoyMDc2NTc0Njc4fQ.Fx6WpNk1j-3bbXQ-lAEgLC6RI7iIbRQsL-d-tGkavew
```

**Nota**: Las variables que empiezan con `NEXT_PUBLIC_` son públicas y se exponen al navegador. Nunca pongas secretos ahí.

### 6. Verificar el Deployment

Una vez desplegado:

1. Vercel te dará una URL (ej: `https://tu-proyecto.vercel.app`)
2. Abre la URL
3. Verifica que funciona:
   - ✅ Página carga sin errores
   - ✅ Puedes ir al catálogo
   - ✅ Puedes iniciar sesión con mcgnexus@gmail.com
   - ✅ Ves el panel de administración
   - ✅ No hay errores en la consola del navegador (F12)

### 7. Probar el flujo completo

#### Como Admin:
1. Inicia sesión con `mcgnexus@gmail.com`
2. Ve a `/admin`
3. Deberías ver las pestañas: Pendientes, Sin pago, Activos

#### Como Usuario nuevo:
1. Abre ventana de incógnito
2. Ve a la URL de producción
3. Regístrate con un email de prueba
4. Deberías ver mensaje de "Registro exitoso"
5. Te deberían cerrar la sesión automáticamente

#### Aprobar usuario:
1. Vuelve como admin
2. Ve a `/admin` → pestaña "Pendientes"
3. Aprueba el usuario de prueba
4. Verifica que pasa a "Sin pago"

#### Ver instrucciones de Bizum:
1. Vuelve como usuario de prueba
2. Inicia sesión
3. Deberías ver banner GIGANTE con el número: **614 242 716**

## Troubleshooting

### Error: "infinite recursion detected"

**Causa**: No ejecutaste `FIX_RECURSION.sql` en Supabase.

**Solución**:
1. Ve a Supabase SQL Editor
2. Ejecuta `FIX_RECURSION.sql`
3. En Vercel, ve a Deployments → click en los 3 puntos → "Redeploy"

### Error: Variables de entorno no definidas

**Causa**: Olvidaste configurar las variables en Vercel.

**Solución**:
1. Ve a Settings → Environment Variables
2. Agrega todas las variables listadas arriba
3. Redeploy el proyecto

### Error: Build falla en Vercel

**Solución**:
```bash
# Prueba el build localmente primero:
npm run build

# Si falla localmente, arregla los errores
# Si funciona localmente pero falla en Vercel, verifica Node version
```

### Página en blanco o 404

**Causa**: Probablemente problema con variables de entorno.

**Solución**:
1. Abre consola del navegador (F12)
2. Busca errores
3. Verifica que las variables `NEXT_PUBLIC_*` están configuradas en Vercel
4. Redeploy

## Configuración Avanzada (Opcional)

### Dominio Personalizado

1. Ve a Vercel → Settings → Domains
2. Agrega tu dominio (ej: `inventario.diocesisdeguadix.es`)
3. Sigue instrucciones de DNS que te da Vercel
4. Espera propagación (puede tardar hasta 48h)

### Monitoreo

Vercel incluye analytics automáticamente:
- Ve a Analytics tab en Vercel
- Verás visitas, performance, etc.

### Logs en Tiempo Real

Para ver errores en producción:
1. Ve a Vercel → Functions
2. Click en cualquier función
3. Ve logs en tiempo real

## Checklist de Deployment

Antes de marcar como completo, verifica:

- [ ] ✅ Ejecutaste `FIX_RECURSION.sql` en Supabase
- [ ] ✅ Hiciste commit de todos los cambios
- [ ] ✅ Hiciste push a GitHub
- [ ] ✅ Configuraste las 4 variables de entorno públicas en Vercel
- [ ] ✅ Deployment completó sin errores
- [ ] ✅ La página carga correctamente
- [ ] ✅ Puedes iniciar sesión como admin
- [ ] ✅ Ves el panel de administración
- [ ] ✅ Puedes crear usuario de prueba
- [ ] ✅ Puedes aprobar usuario desde admin
- [ ] ✅ Usuario aprobado ve número de Bizum

## URLs Importantes

- **Repositorio GitHub**: https://github.com/mcgnexus/inventario_parroquial_funcional
- **Supabase Dashboard**: https://supabase.com/dashboard
- **Vercel Dashboard**: https://vercel.com/dashboard
- **URL Producción**: Se asignará después del deployment

## Soporte

Si algo no funciona:
1. Revisa [SOLUCION_RAPIDA.md](SOLUCION_RAPIDA.md)
2. Revisa logs en Vercel
3. Verifica que ejecutaste el SQL
4. Verifica variables de entorno

---

**Tiempo estimado total**: 15-20 minutos

**¡Buena suerte con el deployment! 🚀**
