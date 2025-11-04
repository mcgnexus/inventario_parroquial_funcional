-- ============================================
-- VERIFICAR Y CONFIGURAR ADMINISTRADOR
-- ============================================
-- Ejecuta este script en Supabase SQL Editor para:
-- 1. Verificar si eres administrador
-- 2. Configurarte como administrador si no lo eres
-- 3. Ver el estado de las tablas del sistema
-- ============================================

-- PASO 1: Ver si tu usuario existe y su estado actual
SELECT
  u.email,
  u.created_at as fecha_registro,
  p.full_name,
  p.role,
  p.user_status,
  CASE
    WHEN p.role = 'admin' AND p.user_status = 'active' THEN '✅ TODO CORRECTO - Eres admin activo'
    WHEN p.role = 'admin' AND p.user_status != 'active' THEN '⚠️ Eres admin pero no estás activo'
    WHEN p.role != 'admin' THEN '❌ NO eres admin - Ejecuta el PASO 2'
    WHEN p.id IS NULL THEN '❌ NO existe perfil - Ejecuta el PASO 2'
    ELSE '❓ Estado desconocido'
  END as diagnostico
FROM auth.users u
LEFT JOIN profiles p ON p.id = u.id
WHERE u.email = 'mcgnexus@gmail.com';

-- Si el resultado dice "NO eres admin" o "NO existe perfil", ejecuta:

-- ============================================
-- PASO 2: Configurarte como administrador
-- ============================================

-- Opción A: Si tu perfil existe pero no es admin
UPDATE profiles
SET
  role = 'admin',
  user_status = 'active'
WHERE id = (SELECT id FROM auth.users WHERE email = 'mcgnexus@gmail.com');

-- Opción B: Si tu perfil NO existe, créalo
INSERT INTO profiles (id, email, full_name, role, user_status)
SELECT
  id,
  email,
  COALESCE(raw_user_meta_data->>'full_name', 'Manuel Carrasco García') as full_name,
  'admin' as role,
  'active' as user_status
FROM auth.users
WHERE email = 'mcgnexus@gmail.com'
ON CONFLICT (id) DO UPDATE SET
  role = 'admin',
  user_status = 'active';

-- ============================================
-- PASO 3: Verificar que el cambio se aplicó
-- ============================================

SELECT
  u.email,
  p.full_name,
  p.role,
  p.user_status,
  CASE
    WHEN p.role = 'admin' AND p.user_status = 'active' THEN '✅ ¡PERFECTO! Ya eres admin'
    ELSE '❌ Algo salió mal, contacta al desarrollador'
  END as resultado
FROM auth.users u
JOIN profiles p ON p.id = u.id
WHERE u.email = 'mcgnexus@gmail.com';

-- ============================================
-- PASO 4: Verificar que las tablas del sistema existen
-- ============================================

-- Ver si existen las tablas necesarias
SELECT
  table_name,
  CASE
    WHEN table_name IN (
      'profiles',
      'user_approvals',
      'payment_history',
      'parishes',
      'items'
    ) THEN '✅ Existe'
    ELSE '❓'
  END as estado
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN (
    'profiles',
    'user_approvals',
    'payment_history',
    'parishes',
    'items'
  )
ORDER BY table_name;

-- Si NO aparecen 'user_approvals' o 'payment_history', significa que:
-- ❌ NO ejecutaste la migración SQL del archivo:
--    supabase/migrations/001_user_approval_system.sql
--
-- SOLUCIÓN: Ve a ese archivo y ejecuta TODO su contenido en el SQL Editor

-- ============================================
-- PASO 5: Ver si hay usuarios pendientes de aprobación
-- ============================================

SELECT
  u.email,
  p.full_name,
  p.user_status,
  p.created_at as fecha_registro,
  CASE
    WHEN p.user_status = 'pending' THEN '⏳ Pendiente de tu aprobación'
    WHEN p.user_status = 'approved_unpaid' THEN '💰 Aprobado, esperando pago'
    WHEN p.user_status = 'active' THEN '✅ Activo'
    ELSE p.user_status
  END as estado_legible
FROM auth.users u
JOIN profiles p ON p.id = u.id
WHERE p.role != 'admin'
ORDER BY p.created_at DESC
LIMIT 10;

-- Si NO ves ningún usuario aquí, es porque:
-- 1. Nadie se ha registrado aún, o
-- 2. No hay tabla 'profiles' con el campo 'user_status'

-- ============================================
-- PASO 6: Ver las políticas RLS activas
-- ============================================

SELECT
  tablename,
  policyname,
  cmd as operacion
FROM pg_policies
WHERE tablename IN ('items', 'profiles', 'user_approvals', 'payment_history')
ORDER BY tablename, policyname;

-- Deberías ver políticas como:
-- - items_select_policy
-- - items_insert_policy
-- - items_update_policy
-- - items_delete_policy
-- - profiles_select_policy
-- - admin_manage_approvals
-- - etc.

-- Si NO ves estas políticas, significa que NO ejecutaste la migración SQL

-- ============================================
-- PASO 7: Verificar vista de administración
-- ============================================

-- Intenta leer la vista del dashboard de admin
SELECT * FROM admin_users_dashboard
LIMIT 5;

-- Si da error "relation does not exist", significa que NO ejecutaste la migración SQL

-- ============================================
-- DIAGNÓSTICO COMPLETO
-- ============================================

-- Ejecuta esto para ver un resumen completo:
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
    ELSE '❌ NO - Ejecuta PASO 2'
  END as respuesta

UNION ALL

SELECT
  '¿Existe tabla user_approvals?' as pregunta,
  CASE
    WHEN EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_name = 'user_approvals'
    ) THEN '✅ SÍ'
    ELSE '❌ NO - Ejecuta migración 001_user_approval_system.sql'
  END as respuesta

UNION ALL

SELECT
  '¿Existe tabla payment_history?' as pregunta,
  CASE
    WHEN EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_name = 'payment_history'
    ) THEN '✅ SÍ'
    ELSE '❌ NO - Ejecuta migración 001_user_approval_system.sql'
  END as respuesta

UNION ALL

SELECT
  '¿Existe vista admin_users_dashboard?' as pregunta,
  CASE
    WHEN EXISTS (
      SELECT 1 FROM information_schema.views
      WHERE table_schema = 'public'
        AND table_name = 'admin_users_dashboard'
    ) THEN '✅ SÍ'
    ELSE '❌ NO - Ejecuta migración 001_user_approval_system.sql'
  END as respuesta

UNION ALL

SELECT
  '¿Existe columna user_status en profiles?' as pregunta,
  CASE
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'profiles'
        AND column_name = 'user_status'
    ) THEN '✅ SÍ'
    ELSE '❌ NO - Ejecuta migración 001_user_approval_system.sql'
  END as respuesta;

-- ============================================
-- RESUMEN
-- ============================================

/*
Si ves ❌ en alguno de los diagnósticos:

1. ❌ "NO eres admin" o "NO existe perfil"
   → Ejecuta el PASO 2 de este script

2. ❌ "NO - Ejecuta migración..."
   → Ve a: supabase/migrations/001_user_approval_system.sql
   → Copia TODO el contenido
   → Pégalo en Supabase SQL Editor
   → Click en RUN
   → Vuelve a ejecutar este script para verificar

3. Si TODO está ✅:
   → Cierra sesión en tu app
   → Vuelve a iniciar sesión con mcgnexus@gmail.com
   → Deberías ver:
     - El componente SubscriptionStatus (si no eres admin activo)
     - Un botón "Panel de Administración" en la página principal
     - Acceso a /admin
*/
