# Solución Rápida - No veo el panel de admin ni Bizum

## El problema

Has reportado que:
- ❌ No ves las opciones de Bizum
- ❌ No ves cómo aprobar usuarios
- ❌ No ves el panel de administración

## La causa más probable

**NO has ejecutado la migración SQL** que crea las tablas y permisos necesarios.

---

## ✅ Solución en 3 pasos (10 minutos)

### PASO 1: Ejecutar la migración SQL (5 min)

1. Ve a [Supabase Dashboard](https://supabase.com/dashboard)
2. Selecciona tu proyecto
3. Ve a **SQL Editor** (icono de base de datos en la izquierda)
4. Click en **New Query**
5. Abre el archivo: `supabase/migrations/001_user_approval_system.sql`
6. Copia **TODO** el contenido (Ctrl+A, Ctrl+C)
7. Pégalo en el SQL Editor de Supabase
8. Click en **RUN** (o Ctrl+Enter)
9. Espera a que termine (verás "Success" en verde)

**Importante:** Este paso crea:
- Tabla `user_approvals` (historial de aprobaciones)
- Tabla `payment_history` (historial de pagos)
- Columnas `user_status`, `subscription_end`, etc. en `profiles`
- Funciones `approve_user()`, `activate_subscription()`, etc.
- Políticas RLS actualizadas
- Vista `admin_users_dashboard`

### PASO 2: Configurarte como administrador (2 min)

1. En el mismo SQL Editor de Supabase
2. Ejecuta el script: `scripts/VERIFICAR_Y_CONFIGURAR_ADMIN.sql`
3. O simplemente ejecuta esta query:

```sql
-- Configurarte como admin
UPDATE profiles
SET role = 'admin', user_status = 'active'
WHERE id = (SELECT id FROM auth.users WHERE email = 'mcgnexus@gmail.com');

-- Si no existe tu perfil, créalo
INSERT INTO profiles (id, email, full_name, role, user_status)
SELECT
  id,
  email,
  'Manuel Carrasco García',
  'admin',
  'active'
FROM auth.users
WHERE email = 'mcgnexus@gmail.com'
ON CONFLICT (id) DO UPDATE SET
  role = 'admin',
  user_status = 'active';

-- Verificar
SELECT email, role, user_status
FROM profiles p
JOIN auth.users u ON u.id = p.id
WHERE u.email = 'mcgnexus@gmail.com';
```

Deberías ver:
```
email              | role  | user_status
-------------------|-------|-------------
mcgnexus@gmail.com | admin | active
```

### PASO 3: Reiniciar la aplicación y sesión (3 min)

1. **En tu terminal:**
   ```bash
   # Ctrl+C para detener el servidor
   npm run dev
   ```

2. **En el navegador:**
   - Cierra sesión (si estás logueado)
   - Limpia la caché (Ctrl+Shift+Delete → Últimas 24 horas)
   - Vuelve a iniciar sesión con `mcgnexus@gmail.com`

3. **Ahora deberías ver:**
   - 🏠 En la página principal (`/`):
     - Una tarjeta "Panel de Administración" con borde verde
   - 📊 Al hacer click, te lleva a `/admin`:
     - Dashboard con estadísticas
     - Pestañas: Pendientes, Sin pago, Activos, Todos
     - Tablas con usuarios
     - Botones de acción

---

## 🔍 Verificación rápida

### ¿Cómo saber si funcionó?

Ejecuta en Supabase SQL Editor:

```sql
-- DIAGNÓSTICO COMPLETO
SELECT
  '¿Eres admin?' as pregunta,
  CASE
    WHEN EXISTS (
      SELECT 1 FROM profiles p
      JOIN auth.users u ON u.id = p.id
      WHERE u.email = 'mcgnexus@gmail.com'
        AND p.role = 'admin'
        AND p.user_status = 'active'
    ) THEN '✅ SÍ'
    ELSE '❌ NO'
  END as respuesta

UNION ALL

SELECT
  '¿Existe tabla user_approvals?',
  CASE
    WHEN EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_name = 'user_approvals'
    ) THEN '✅ SÍ'
    ELSE '❌ NO'
  END

UNION ALL

SELECT
  '¿Existe columna user_status?',
  CASE
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'profiles'
        AND column_name = 'user_status'
    ) THEN '✅ SÍ'
    ELSE '❌ NO'
  END;
```

**Resultado esperado:** Todo ✅

---

## 🎯 Qué verás después de arreglarlo

### En la página principal (`http://localhost:3000/`)

Después de iniciar sesión con `mcgnexus@gmail.com`:

```
┌─────────────────────────────────────┐
│  📊 Panel de Administración    [Admin] │
│                                       │
│  Gestiona usuarios, aprobaciones     │
│  y suscripciones                     │
└─────────────────────────────────────┘
```

### En `/admin`

```
Panel de Administración

┌──────────────────┬──────────────────┬──────────────┬──────────────┐
│ Pendientes: 0    │ Sin pago: 0      │ Activos: 0   │ Por expirar: 0│
└──────────────────┴──────────────────┴──────────────┴──────────────┘

[Pendientes (0)] [Sin pago (0)] [Activos (0)] [Todos (0)]

(Tabla con usuarios)
```

### Cuando apruebes a un usuario

El usuario verá en su pantalla principal:

```
┌────────────────────────────────────────────────────────┐
│ ✅ ¡Cuenta aprobada! Último paso: Realizar el pago     │
│                                                         │
│ Tu cuenta ha sido aprobada. Para activar el acceso,   │
│ realiza la colaboración de 10€/mes.                   │
└────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────┐
│ 💳 Instrucciones de pago                               │
│                                                         │
│ 📱 Opción 1 - Bizum (Recomendado)                     │
│                                                         │
│ Enviar Bizum a:                                        │
│ 614 242 716                                           │
│                                                         │
│ Concepto:                                              │
│ Inventarios Diocesano                                  │
│                                                         │
│ Importe:                                               │
│ 10,00 €                                                │
└────────────────────────────────────────────────────────┘
```

---

## 🐛 Problemas comunes

### Problema 1: "La tabla user_approvals no existe"

**Causa:** No ejecutaste el PASO 1 (migración SQL)

**Solución:**
1. Ve a `supabase/migrations/001_user_approval_system.sql`
2. Copia TODO
3. Ejecuta en Supabase SQL Editor

### Problema 2: "No veo el botón de Panel de Administración"

**Causa:** Tu email no es exactamente `mcgnexus@gmail.com` o no eres admin

**Solución:**
```sql
-- Ver qué email tienes registrado
SELECT email FROM auth.users;

-- Si tu email es diferente, cámbialo en el código
-- O actualiza la query para usar tu email real
UPDATE profiles
SET role = 'admin', user_status = 'active'
WHERE id = (SELECT id FROM auth.users WHERE email = 'TU_EMAIL_REAL@gmail.com');
```

### Problema 3: "El panel de admin está vacío"

**Causa:** Nadie se ha registrado aún, o la migración no se ejecutó completamente

**Solución:**
1. Crea un usuario de prueba desde `/auth?mode=register`
2. Deberías verlo en `/admin` → Pestaña "Pendientes"
3. Si NO aparece, ejecuta:

```sql
-- Ver usuarios existentes
SELECT
  u.email,
  p.user_status,
  p.role
FROM auth.users u
LEFT JOIN profiles p ON p.id = u.id;

-- Si user_status es NULL, ejecuta la migración de nuevo
```

### Problema 4: "Error al aprobar usuario"

**Causa:** La función `approve_user()` no existe

**Solución:** Ejecuta la migración `001_user_approval_system.sql` completa

---

## 📋 Checklist final

Antes de reportar otro problema, verifica:

- [ ] ¿Ejecutaste `supabase/migrations/001_user_approval_system.sql` en Supabase?
- [ ] ¿Ejecutaste `scripts/VERIFICAR_Y_CONFIGURAR_ADMIN.sql`?
- [ ] ¿Ves "✅ SÍ" en el diagnóstico SQL?
- [ ] ¿Reiniciaste el servidor (`npm run dev`)?
- [ ] ¿Cerraste sesión y volviste a entrar?
- [ ] ¿Limpiaste la caché del navegador?

Si TODO está ✅ y aún no funciona:

1. Abre la consola del navegador (F12)
2. Ve a la pestaña "Console"
3. Copia los errores (si hay)
4. Reporta el problema con los errores

---

## 🚀 Siguiente paso

Una vez que veas el panel de admin:

1. Crea un usuario de prueba
2. Apruébalo desde `/admin`
3. Verifica que vea las instrucciones de Bizum
4. Registra un pago ficticio
5. Verifica que tenga acceso

**Si todo funciona:** ¡Ya puedes empezar a recibir usuarios reales! 🎉

---

## 📞 Ayuda adicional

Si después de seguir TODOS los pasos aún no funciona:

1. Ejecuta el diagnóstico completo:
   ```sql
   -- En Supabase SQL Editor
   \i scripts/VERIFICAR_Y_CONFIGURAR_ADMIN.sql
   ```

2. Copia TODOS los resultados

3. Contacta con:
   - Los errores de la consola del navegador (F12)
   - Los resultados del diagnóstico SQL
   - Capturas de pantalla de lo que ves vs. lo que esperabas

---

**IMPORTANTE:** El 90% de los problemas se resuelven ejecutando la migración SQL. Si no la ejecutaste, **hazlo ahora** antes de intentar cualquier otra cosa.
