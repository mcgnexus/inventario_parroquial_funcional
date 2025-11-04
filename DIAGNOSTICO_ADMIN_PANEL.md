# Diagnóstico: Panel de Administración no aparece en Vercel

## Síntomas

- ✅ Panel admin aparece en local (http://localhost:3000)
- ❌ Panel admin NO aparece en Vercel (producción)

## Causas más probables (en orden)

### 1. ⚠️ NO ejecutaste `FIX_RECURSION.sql` en Supabase (MÁS PROBABLE)

**¿Cómo verificar?**

Ve a Supabase SQL Editor y ejecuta:

```sql
-- Verificar que las políticas existen sin recursión
SELECT schemaname, tablename, policyname
FROM pg_policies
WHERE tablename IN ('profiles', 'items', 'user_approvals', 'payment_history')
ORDER BY tablename, policyname;
```

**¿Qué deberías ver?**

Deberías ver políticas como:
- `profiles_select_policy`
- `profiles_insert_policy`
- `profiles_update_policy`
- etc.

**Si NO ves estas políticas o ves errores**:

1. Ve a Supabase SQL Editor
2. Copia **TODO** el archivo `FIX_RECURSION.sql` (las 135 líneas)
3. Pégalo
4. Ejecuta (RUN)
5. Deberías ver: "Success. No rows returned"

**Después de ejecutar**:
1. Ve a Vercel → Deployments
2. Click en los 3 puntos del último deployment
3. Click en "Redeploy"
4. Espera a que termine
5. Prueba de nuevo

---

### 2. ⚠️ Tu usuario NO tiene `role='admin'` en la base de datos

**¿Cómo verificar?**

Ve a Supabase SQL Editor y ejecuta:

```sql
-- Verificar tu perfil
SELECT id, email, full_name, role, user_status
FROM profiles
WHERE id = (SELECT id FROM auth.users WHERE email = 'mcgnexus@gmail.com');
```

**¿Qué deberías ver?**

```
email: mcgnexus@gmail.com
role: admin
user_status: active
```

**Si NO ves esto**:

Ejecuta en Supabase SQL Editor:

```sql
-- Configurarte como admin
UPDATE profiles
SET role = 'admin', user_status = 'active'
WHERE id = (SELECT id FROM auth.users WHERE email = 'mcgnexus@gmail.com');

-- Si no existe el perfil, créalo
INSERT INTO profiles (id, email, full_name, role, user_status)
SELECT id, email, 'Manuel Carrasco García', 'admin', 'active'
FROM auth.users
WHERE email = 'mcgnexus@gmail.com'
ON CONFLICT (id) DO UPDATE
SET role = 'admin', user_status = 'active';
```

**Después de ejecutar**:
1. Cierra sesión en Vercel
2. Vuelve a iniciar sesión
3. Debería aparecer el panel

---

### 3. ⚠️ Variables de entorno mal configuradas en Vercel

**¿Cómo verificar?**

1. Ve a Vercel → Tu proyecto → Settings → Environment Variables
2. Verifica que tienes:

```
NEXT_PUBLIC_SUPABASE_URL = https://wcmzsaihdpfpfdzhruqt.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

3. Verifica que ambas tienen las 3 checkboxes marcadas:
   - ✅ Production
   - ✅ Preview
   - ✅ Development

**Si faltan o están mal**:

1. Agrégalas/corrígelas
2. Ve a Deployments → "..." → "Redeploy"

---

### 4. ⚠️ Error en la consola del navegador (Vercel)

**¿Cómo verificar?**

1. Abre tu sitio en Vercel
2. Inicia sesión con `mcgnexus@gmail.com`
3. Presiona **F12** (abre DevTools)
4. Ve a pestaña **Console**
5. Busca errores en rojo

**Errores comunes**:

#### Error: "infinite recursion detected"
**Causa**: No ejecutaste `FIX_RECURSION.sql`
**Solución**: Ver punto #1 arriba

#### Error: "Failed to fetch"
**Causa**: Variables de entorno incorrectas
**Solución**: Ver punto #3 arriba

#### Error: "No tienes permisos de administrador"
**Causa**: Tu perfil no tiene role='admin'
**Solución**: Ver punto #2 arriba

---

### 5. ⚠️ La vista `admin_users_dashboard` no existe

**¿Cómo verificar?**

Ve a Supabase SQL Editor y ejecuta:

```sql
-- Verificar que existe la vista
SELECT * FROM admin_users_dashboard LIMIT 1;
```

**Si da error "relation does not exist"**:

Necesitas ejecutar `EJECUTAR_ESTO.sql` primero (antes de `FIX_RECURSION.sql`):

1. Ejecuta `EJECUTAR_ESTO.sql` completo
2. Luego ejecuta `FIX_RECURSION.sql` completo
3. Redeploy en Vercel

---

## Checklist de diagnóstico (hazlo en orden)

### Paso 1: Verificar base de datos

```sql
-- 1. ¿Existe tu usuario?
SELECT id, email FROM auth.users WHERE email = 'mcgnexus@gmail.com';
-- Deberías ver 1 fila

-- 2. ¿Tienes perfil de admin?
SELECT id, email, role, user_status
FROM profiles
WHERE id = (SELECT id FROM auth.users WHERE email = 'mcgnexus@gmail.com');
-- Deberías ver: role='admin', user_status='active'

-- 3. ¿Existen las políticas?
SELECT COUNT(*) FROM pg_policies WHERE tablename = 'profiles';
-- Deberías ver: count > 0 (al menos 3)

-- 4. ¿Existe la vista de admin?
SELECT COUNT(*) FROM admin_users_dashboard;
-- Deberías ver: count >= 0 (sin error)
```

### Paso 2: Verificar Vercel

1. [ ] Variables de entorno configuradas
2. [ ] Último deployment exitoso (sin errores)
3. [ ] Consola del navegador sin errores

### Paso 3: Verificar sesión

1. [ ] Cerraste sesión completamente en Vercel
2. [ ] Iniciaste sesión de nuevo con mcgnexus@gmail.com
3. [ ] Esperaste a que cargue completamente

---

## Solución rápida (prueba esto primero)

Ejecuta esto en Supabase SQL Editor:

```sql
-- Asegurarte de que eres admin
UPDATE profiles
SET role = 'admin', user_status = 'active'
WHERE id = (SELECT id FROM auth.users WHERE email = 'mcgnexus@gmail.com');

-- Si no existe, créalo
INSERT INTO profiles (id, email, full_name, role, user_status)
SELECT id, email, 'Manuel Carrasco García', 'admin', 'active'
FROM auth.users
WHERE email = 'mcgnexus@gmail.com'
ON CONFLICT (id) DO UPDATE
SET role = 'admin', user_status = 'active';

-- Verificar
SELECT email, role, user_status FROM profiles
WHERE email = 'mcgnexus@gmail.com';
```

**Después**:
1. Ve a tu sitio en Vercel
2. Cierra sesión (si estás logueado)
3. Inicia sesión de nuevo
4. Debería aparecer el panel de administración

---

## Si nada funciona

Envíame esta información:

1. **Resultado de esta query en Supabase**:
```sql
SELECT email, role, user_status
FROM profiles
WHERE email = 'mcgnexus@gmail.com';
```

2. **Errores en consola** (F12 en tu sitio de Vercel)

3. **Captura de pantalla** de tu sitio en Vercel después de iniciar sesión

4. **Variables de entorno en Vercel** (Settings → Environment Variables) - solo los nombres, no los valores

---

## Explicación técnica

El panel de admin aparece cuando:

```typescript
// En src/app/page.tsx línea 23-24
if (u?.email === 'mcgnexus@gmail.com') {
  setIsAdmin(true)
}
```

Esto depende de:
1. Que `getCurrentUser()` devuelva tu usuario
2. Que el email sea exactamente 'mcgnexus@gmail.com'
3. Que no haya errores al cargar la página

Si no aparece en Vercel pero sí en local:
- Las variables de entorno son diferentes
- La base de datos tiene datos diferentes
- Hay errores de RLS que bloquean la query

La causa #1 más común es **no haber ejecutado FIX_RECURSION.sql**.
