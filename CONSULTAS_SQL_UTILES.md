# Consultas SQL Útiles

Colección de consultas SQL para gestionar tu sistema desde Supabase SQL Editor.

---

## 📊 CONSULTAS DE MONITOREO

### Ver resumen general del sistema

```sql
SELECT
  COUNT(*) FILTER (WHERE user_status = 'pending') as pendientes,
  COUNT(*) FILTER (WHERE user_status = 'approved_unpaid') as aprobados_sin_pago,
  COUNT(*) FILTER (WHERE user_status = 'active') as activos,
  COUNT(*) FILTER (WHERE user_status = 'suspended') as suspendidos,
  COUNT(*) FILTER (WHERE user_status = 'rejected') as rechazados,
  COUNT(*) as total
FROM profiles
WHERE role != 'admin';
```

### Ver ingresos mensuales esperados

```sql
SELECT
  COUNT(*) FILTER (WHERE user_status = 'active') * 10 as ingresos_mensuales_euros,
  COUNT(*) FILTER (WHERE user_status = 'active') as usuarios_activos
FROM profiles
WHERE role != 'admin';
```

### Ver usuarios que expiran en los próximos 7 días

```sql
SELECT
  u.email,
  p.full_name,
  p.subscription_end,
  DATE_PART('day', p.subscription_end - NOW()) as dias_restantes
FROM profiles p
JOIN auth.users u ON u.id = p.id
WHERE p.user_status = 'active'
  AND p.subscription_end < NOW() + INTERVAL '7 days'
  AND p.subscription_end > NOW()
ORDER BY p.subscription_end ASC;
```

### Ver usuarios que ya expiraron

```sql
SELECT
  u.email,
  p.full_name,
  p.subscription_end,
  DATE_PART('day', NOW() - p.subscription_end) as dias_vencido
FROM profiles p
JOIN auth.users u ON u.id = p.id
WHERE p.user_status = 'active'
  AND p.subscription_end < NOW()
ORDER BY p.subscription_end DESC;
```

---

## 👥 CONSULTAS DE USUARIOS

### Ver todos los usuarios con información completa

```sql
SELECT
  u.email,
  p.full_name,
  p.role,
  p.user_status,
  par.name as parroquia,
  p.subscription_start,
  p.subscription_end,
  p.payment_method,
  CASE
    WHEN p.subscription_end IS NULL THEN 'Sin suscripción'
    WHEN p.subscription_end < NOW() THEN 'Expirado'
    WHEN p.subscription_end < NOW() + INTERVAL '7 days' THEN 'Por expirar'
    ELSE 'Activo'
  END as estado_suscripcion,
  (SELECT COUNT(*) FROM items WHERE user_id = p.id) as total_items,
  p.created_at
FROM auth.users u
LEFT JOIN profiles p ON p.id = u.id
LEFT JOIN parishes par ON par.id = p.parish_id
WHERE p.role != 'admin'
ORDER BY p.created_at DESC;
```

### Ver usuario específico por email

```sql
SELECT
  u.id,
  u.email,
  u.created_at as fecha_registro,
  p.full_name,
  p.role,
  p.user_status,
  p.parish_id,
  par.name as parroquia,
  p.subscription_start,
  p.subscription_end,
  p.last_payment_date,
  p.payment_method
FROM auth.users u
LEFT JOIN profiles p ON p.id = u.id
LEFT JOIN parishes par ON par.id = p.parish_id
WHERE u.email = 'usuario@ejemplo.com';  -- Cambia por el email que necesites
```

### Ver usuarios por parroquia

```sql
SELECT
  par.name as parroquia,
  COUNT(*) as total_usuarios,
  COUNT(*) FILTER (WHERE p.user_status = 'active') as usuarios_activos
FROM profiles p
JOIN parishes par ON par.id = p.parish_id
WHERE p.role != 'admin'
GROUP BY par.name
ORDER BY total_usuarios DESC;
```

---

## 💰 CONSULTAS DE PAGOS

### Ver historial de pagos de un usuario

```sql
SELECT
  ph.amount as monto,
  ph.payment_method as metodo,
  ph.payment_reference as referencia,
  ph.period_start as periodo_inicio,
  ph.period_end as periodo_fin,
  ph.created_at as fecha_pago,
  admin.full_name as verificado_por,
  ph.notes as notas
FROM payment_history ph
LEFT JOIN profiles admin ON admin.id = ph.verified_by
WHERE ph.user_id = (
  SELECT id FROM auth.users WHERE email = 'usuario@ejemplo.com'  -- Cambia por el email
)
ORDER BY ph.created_at DESC;
```

### Ver todos los pagos del mes actual

```sql
SELECT
  u.email,
  p.full_name,
  ph.amount,
  ph.payment_method,
  ph.payment_reference,
  ph.created_at
FROM payment_history ph
JOIN profiles p ON p.id = ph.user_id
JOIN auth.users u ON u.id = p.id
WHERE DATE_TRUNC('month', ph.created_at) = DATE_TRUNC('month', NOW())
ORDER BY ph.created_at DESC;
```

### Ver total recaudado por mes

```sql
SELECT
  TO_CHAR(created_at, 'YYYY-MM') as mes,
  COUNT(*) as total_pagos,
  SUM(amount) as total_recaudado
FROM payment_history
GROUP BY TO_CHAR(created_at, 'YYYY-MM')
ORDER BY mes DESC;
```

### Ver pagos pendientes de verificación (usuarios aprobados sin pago)

```sql
SELECT
  u.email,
  p.full_name,
  par.name as parroquia,
  p.created_at as fecha_registro,
  DATE_PART('day', NOW() - p.created_at) as dias_esperando
FROM profiles p
JOIN auth.users u ON u.id = p.id
LEFT JOIN parishes par ON par.id = p.parish_id
WHERE p.user_status = 'approved_unpaid'
ORDER BY p.created_at ASC;
```

---

## 🔍 CONSULTAS DE AUDITORÍA

### Ver historial de aprobaciones/cambios de estado

```sql
SELECT
  u.email as usuario,
  ua.previous_status as estado_anterior,
  ua.new_status as estado_nuevo,
  admin.email as admin,
  ua.notes as notas,
  ua.created_at as fecha
FROM user_approvals ua
JOIN auth.users u ON u.id = ua.user_id
LEFT JOIN auth.users admin ON admin.id = ua.approved_by
ORDER BY ua.created_at DESC
LIMIT 50;
```

### Ver historial de un usuario específico

```sql
SELECT
  ua.previous_status,
  ua.new_status,
  admin.email as admin,
  ua.notes,
  ua.created_at
FROM user_approvals ua
LEFT JOIN auth.users admin ON admin.id = ua.approved_by
WHERE ua.user_id = (
  SELECT id FROM auth.users WHERE email = 'usuario@ejemplo.com'
)
ORDER BY ua.created_at DESC;
```

### Ver últimas acciones del administrador

```sql
SELECT
  'Aprobación' as tipo,
  u.email as usuario_afectado,
  ua.new_status as accion,
  ua.notes,
  ua.created_at as fecha
FROM user_approvals ua
JOIN auth.users u ON u.id = ua.user_id
WHERE ua.approved_by = (SELECT id FROM auth.users WHERE email = 'mcgnexus@gmail.com')

UNION ALL

SELECT
  'Pago' as tipo,
  u.email as usuario_afectado,
  ph.amount::text || '€' as accion,
  ph.notes,
  ph.created_at as fecha
FROM payment_history ph
JOIN auth.users u ON u.id = ph.user_id
WHERE ph.verified_by = (SELECT id FROM auth.users WHERE email = 'mcgnexus@gmail.com')

ORDER BY fecha DESC
LIMIT 20;
```

---

## 🛠️ CONSULTAS DE MANTENIMIENTO

### Activar manualmente un usuario (SOLO EMERGENCIAS)

```sql
-- SOLO USA ESTO SI EL PANEL DE ADMIN NO FUNCIONA
UPDATE profiles
SET
  user_status = 'active',
  subscription_start = NOW(),
  subscription_end = NOW() + INTERVAL '1 month',
  last_payment_date = NOW(),
  payment_method = 'manual'
WHERE id = (SELECT id FROM auth.users WHERE email = 'usuario@ejemplo.com');

-- Registrar en historial
INSERT INTO payment_history (user_id, amount, payment_method, period_start, period_end, verified_by, notes)
SELECT
  id,
  10.00,
  'manual',
  NOW(),
  NOW() + INTERVAL '1 month',
  (SELECT id FROM auth.users WHERE email = 'mcgnexus@gmail.com'),
  'Activación manual de emergencia'
FROM auth.users
WHERE email = 'usuario@ejemplo.com';
```

### Extender suscripción de un usuario

```sql
-- Añadir 1 mes más a la suscripción actual
UPDATE profiles
SET subscription_end = subscription_end + INTERVAL '1 month'
WHERE id = (SELECT id FROM auth.users WHERE email = 'usuario@ejemplo.com');
```

### Cambiar a suscripción anual

```sql
-- Cambiar de mensual a anual
UPDATE profiles
SET
  subscription_end = NOW() + INTERVAL '1 year',
  last_payment_date = NOW()
WHERE id = (SELECT id FROM auth.users WHERE email = 'usuario@ejemplo.com');

-- Registrar pago anual
INSERT INTO payment_history (user_id, amount, payment_method, period_start, period_end, verified_by, notes)
SELECT
  id,
  100.00,  -- Precio anual
  'bizum',
  NOW(),
  NOW() + INTERVAL '1 year',
  (SELECT id FROM auth.users WHERE email = 'mcgnexus@gmail.com'),
  'Pago anual con descuento'
FROM auth.users
WHERE email = 'usuario@ejemplo.com';
```

### Resetear contraseña de un usuario

```sql
-- NO PUEDES cambiar contraseñas desde SQL por seguridad
-- DEBES usar el panel de Supabase:
-- 1. Ve a Authentication → Users
-- 2. Busca el usuario
-- 3. Click en los 3 puntos → Send password recovery email
```

### Eliminar un usuario completamente (CUIDADO)

```sql
-- ESTO ELIMINARÁ TODOS LOS DATOS DEL USUARIO
-- Solo usa si el usuario lo solicita explícitamente

-- Primero, ver qué se va a eliminar
SELECT
  u.email,
  (SELECT COUNT(*) FROM items WHERE user_id = u.id) as total_items,
  (SELECT COUNT(*) FROM payment_history WHERE user_id = u.id) as total_pagos
FROM auth.users u
WHERE u.email = 'usuario@ejemplo.com';

-- Si estás seguro, eliminar:
-- DELETE FROM auth.users WHERE email = 'usuario@ejemplo.com';
-- (Las tablas relacionadas se eliminarán por CASCADE)
```

---

## 📈 CONSULTAS DE ESTADÍSTICAS

### Crecimiento de usuarios por mes

```sql
SELECT
  TO_CHAR(created_at, 'YYYY-MM') as mes,
  COUNT(*) as nuevos_usuarios
FROM profiles
WHERE role != 'admin'
GROUP BY TO_CHAR(created_at, 'YYYY-MM')
ORDER BY mes DESC;
```

### Tasa de conversión (aprobados vs activos)

```sql
SELECT
  COUNT(*) FILTER (WHERE user_status = 'approved_unpaid') as aprobados_sin_pago,
  COUNT(*) FILTER (WHERE user_status = 'active') as activos,
  ROUND(
    100.0 * COUNT(*) FILTER (WHERE user_status = 'active') /
    NULLIF(COUNT(*), 0), 2
  ) as tasa_conversion_porcentaje
FROM profiles
WHERE role != 'admin';
```

### Items creados por usuario

```sql
SELECT
  u.email,
  p.full_name,
  COUNT(i.id) as total_items,
  MIN(i.created_at) as primer_item,
  MAX(i.created_at) as ultimo_item
FROM profiles p
JOIN auth.users u ON u.id = p.id
LEFT JOIN items i ON i.user_id = p.id
WHERE p.role != 'admin'
GROUP BY u.email, p.full_name
HAVING COUNT(i.id) > 0
ORDER BY total_items DESC;
```

### Usuarios más activos (por items)

```sql
SELECT
  u.email,
  p.full_name,
  COUNT(i.id) as total_items,
  par.name as parroquia
FROM profiles p
JOIN auth.users u ON u.id = p.id
LEFT JOIN items i ON i.user_id = p.id
LEFT JOIN parishes par ON par.id = p.parish_id
WHERE p.role != 'admin'
GROUP BY u.email, p.full_name, par.name
ORDER BY total_items DESC
LIMIT 10;
```

---

## 🔐 CONSULTAS DE SEGURIDAD

### Ver todas las políticas RLS activas

```sql
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  CASE
    WHEN cmd = 'SELECT' THEN 'Lectura'
    WHEN cmd = 'INSERT' THEN 'Inserción'
    WHEN cmd = 'UPDATE' THEN 'Actualización'
    WHEN cmd = 'DELETE' THEN 'Eliminación'
    ELSE cmd
  END as tipo_operacion
FROM pg_policies
WHERE tablename IN ('items', 'profiles', 'user_approvals', 'payment_history', 'parishes')
ORDER BY tablename, policyname;
```

### Verificar que RLS está habilitado

```sql
SELECT
  schemaname,
  tablename,
  rowsecurity as rls_habilitado
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('items', 'profiles', 'user_approvals', 'payment_history')
ORDER BY tablename;
```

### Ver administradores del sistema

```sql
SELECT
  u.email,
  u.created_at as fecha_creacion,
  p.full_name,
  p.user_status,
  u.last_sign_in_at as ultimo_acceso
FROM auth.users u
JOIN profiles p ON p.id = u.id
WHERE p.role = 'admin';
```

---

## 🚨 CONSULTAS DE DIAGNÓSTICO

### Detectar inconsistencias (usuarios en auth pero no en profiles)

```sql
SELECT
  u.id,
  u.email,
  u.created_at,
  CASE
    WHEN p.id IS NULL THEN '❌ Falta perfil'
    ELSE '✅ OK'
  END as estado
FROM auth.users u
LEFT JOIN profiles p ON p.id = u.id
WHERE p.id IS NULL;
```

### Detectar usuarios activos pero con suscripción expirada

```sql
SELECT
  u.email,
  p.full_name,
  p.user_status,
  p.subscription_end,
  DATE_PART('day', NOW() - p.subscription_end) as dias_vencido
FROM profiles p
JOIN auth.users u ON u.id = p.id
WHERE p.user_status = 'active'
  AND p.subscription_end < NOW();

-- Si encuentras usuarios así, corregir con:
-- UPDATE profiles
-- SET user_status = 'suspended'
-- WHERE user_status = 'active' AND subscription_end < NOW();
```

### Ver usuarios sin parroquia asignada

```sql
SELECT
  u.email,
  p.full_name,
  p.user_status
FROM profiles p
JOIN auth.users u ON u.id = p.id
WHERE p.parish_id IS NULL
  AND p.role != 'admin';
```

---

## 💡 CONSULTAS AVANZADAS

### Ver valor de vida del cliente (LTV - Lifetime Value)

```sql
SELECT
  u.email,
  p.full_name,
  COUNT(ph.id) as total_pagos,
  SUM(ph.amount) as total_pagado,
  MIN(ph.created_at) as primer_pago,
  MAX(ph.created_at) as ultimo_pago,
  DATE_PART('month', AGE(MAX(ph.created_at), MIN(ph.created_at))) as meses_activo
FROM profiles p
JOIN auth.users u ON u.id = p.id
LEFT JOIN payment_history ph ON ph.user_id = p.id
WHERE p.role != 'admin'
GROUP BY u.email, p.full_name
HAVING COUNT(ph.id) > 0
ORDER BY total_pagado DESC;
```

### Proyección de ingresos (próximos 3 meses)

```sql
SELECT
  COUNT(*) FILTER (WHERE subscription_end > NOW() + INTERVAL '3 months') as usuarios_seguros_3m,
  COUNT(*) FILTER (WHERE subscription_end > NOW()) as usuarios_actuales,
  COUNT(*) FILTER (WHERE subscription_end > NOW() + INTERVAL '3 months') * 10 * 3 as ingresos_proyectados_3m
FROM profiles
WHERE user_status = 'active';
```

---

## 📋 PLANTILLAS PARA COPIAR Y PEGAR

### Crear nuevo admin (otro obispo o colaborador)

```sql
UPDATE profiles
SET role = 'admin', user_status = 'active'
WHERE id = (SELECT id FROM auth.users WHERE email = 'nuevo-admin@ejemplo.com');
```

### Dar acceso gratuito permanente a un usuario

```sql
UPDATE profiles
SET
  user_status = 'active',
  subscription_start = NOW(),
  subscription_end = NOW() + INTERVAL '100 years',  -- Prácticamente permanente
  payment_method = 'gratis',
  last_payment_date = NOW()
WHERE id = (SELECT id FROM auth.users WHERE email = 'usuario-especial@ejemplo.com');
```

### Ver usuarios que nunca han pagado

```sql
SELECT
  u.email,
  p.full_name,
  p.user_status,
  p.created_at,
  DATE_PART('day', NOW() - p.created_at) as dias_desde_registro
FROM profiles p
JOIN auth.users u ON u.id = p.id
WHERE p.role != 'admin'
  AND NOT EXISTS (
    SELECT 1 FROM payment_history ph WHERE ph.user_id = p.id
  )
ORDER BY p.created_at DESC;
```

---

## 🎯 CONSULTAS PARA TOMA DE DECISIONES

### ¿Vale la pena seguir con el sistema? (KPIs clave)

```sql
SELECT
  -- Usuarios
  COUNT(*) FILTER (WHERE user_status = 'active') as usuarios_activos,
  COUNT(*) FILTER (WHERE user_status = 'pending') as usuarios_pendientes,

  -- Ingresos
  COUNT(*) FILTER (WHERE user_status = 'active') * 10 as ingresos_mensuales,

  -- Engagement
  (SELECT COUNT(*) FROM items) as total_items_creados,
  (SELECT COUNT(*) FROM items) / NULLIF(COUNT(*) FILTER (WHERE user_status = 'active'), 0) as items_por_usuario,

  -- Retención
  ROUND(
    100.0 * COUNT(*) FILTER (WHERE user_status = 'active' AND last_payment_date > NOW() - INTERVAL '30 days') /
    NULLIF(COUNT(*) FILTER (WHERE user_status = 'active'), 0), 2
  ) as tasa_retencion_porcentaje

FROM profiles
WHERE role != 'admin';
```

---

## 🔄 BACKUP Y RESTAURACIÓN

### Exportar todos los datos de un usuario (para backup)

```sql
-- Ejecuta cada query y guarda los resultados

-- 1. Perfil
SELECT * FROM profiles WHERE id = (SELECT id FROM auth.users WHERE email = 'usuario@ejemplo.com');

-- 2. Items
SELECT * FROM items WHERE user_id = (SELECT id FROM auth.users WHERE email = 'usuario@ejemplo.com');

-- 3. Pagos
SELECT * FROM payment_history WHERE user_id = (SELECT id FROM auth.users WHERE email = 'usuario@ejemplo.com');

-- 4. Historial
SELECT * FROM user_approvals WHERE user_id = (SELECT id FROM auth.users WHERE email = 'usuario@ejemplo.com');
```

---

## 📞 SOPORTE

Si necesitas ayuda con alguna consulta SQL:

1. Copia el error exacto que recibes
2. Copia la consulta que intentaste ejecutar
3. Contacta al desarrollador

**IMPORTANTE:** Nunca ejecutes queries de UPDATE o DELETE sin antes hacer un SELECT para verificar qué datos se van a modificar.

---

¡Guarda este archivo como referencia! 📌
