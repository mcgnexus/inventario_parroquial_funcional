-- ============================================
-- VERIFICACIÓN RÁPIDA - ¿Por qué no veo el panel admin?
-- ============================================
-- Ejecuta este script completo en Supabase SQL Editor
-- Te dirá exactamente qué está mal
-- ============================================

-- 1. Verificar si existe tu usuario en auth
SELECT '1️⃣ Usuario en Auth:' as paso;
SELECT
  id,
  email,
  created_at,
  CASE
    WHEN email = 'mcgnexus@gmail.com' THEN '✅ Email correcto'
    ELSE '❌ Email NO es mcgnexus@gmail.com'
  END as verificacion
FROM auth.users
WHERE email = 'mcgnexus@gmail.com';

-- Si no ves ninguna fila arriba, el problema es que no existe el usuario
-- Solución: Regístrate en la aplicación con mcgnexus@gmail.com

-- ============================================

-- 2. Verificar si existe tu perfil
SELECT '2️⃣ Perfil en Profiles:' as paso;
SELECT
  p.id,
  p.email,
  p.full_name,
  p.role,
  p.user_status,
  CASE
    WHEN p.role = 'admin' THEN '✅ Role es admin'
    ELSE '❌ Role NO es admin: ' || COALESCE(p.role, 'NULL')
  END as verificacion_role,
  CASE
    WHEN p.user_status = 'active' THEN '✅ Status es active'
    ELSE '❌ Status NO es active: ' || COALESCE(p.user_status, 'NULL')
  END as verificacion_status
FROM profiles p
WHERE p.id = (SELECT id FROM auth.users WHERE email = 'mcgnexus@gmail.com');

-- Si no ves ninguna fila arriba, el problema es que no existe el perfil
-- Ejecuta el siguiente bloque para crearlo

-- ============================================

-- 3. SOLUCIÓN AUTOMÁTICA: Crear/actualizar perfil como admin
SELECT '3️⃣ Configurando como admin...' as paso;

UPDATE profiles
SET
  role = 'admin',
  user_status = 'active',
  full_name = COALESCE(full_name, 'Manuel Carrasco García')
WHERE id = (SELECT id FROM auth.users WHERE email = 'mcgnexus@gmail.com');

INSERT INTO profiles (id, email, full_name, role, user_status)
SELECT
  id,
  email,
  'Manuel Carrasco García',
  'admin',
  'active'
FROM auth.users
WHERE email = 'mcgnexus@gmail.com'
ON CONFLICT (id) DO UPDATE
SET
  role = 'admin',
  user_status = 'active';

-- ============================================

-- 4. Verificar que ahora está correcto
SELECT '4️⃣ Verificación final:' as paso;
SELECT
  email,
  role,
  user_status,
  CASE
    WHEN role = 'admin' AND user_status = 'active' THEN '✅✅ TODO CORRECTO - Deberías ver el panel admin'
    WHEN role = 'admin' AND user_status != 'active' THEN '⚠️ Eres admin pero no estás activo'
    WHEN role != 'admin' AND user_status = 'active' THEN '⚠️ Estás activo pero no eres admin'
    ELSE '❌ Algo sigue mal'
  END as resultado
FROM profiles
WHERE id = (SELECT id FROM auth.users WHERE email = 'mcgnexus@gmail.com');

-- ============================================

-- 5. Verificar políticas RLS (para evitar recursión)
SELECT '5️⃣ Verificando políticas RLS:' as paso;
SELECT
  schemaname,
  tablename,
  policyname,
  CASE
    WHEN policyname LIKE '%select%' THEN '✅ Política de lectura'
    WHEN policyname LIKE '%insert%' THEN '✅ Política de inserción'
    WHEN policyname LIKE '%update%' THEN '✅ Política de actualización'
    ELSE '✅ Otra política'
  END as tipo
FROM pg_policies
WHERE tablename IN ('profiles', 'items')
ORDER BY tablename, policyname;

-- Si no ves políticas arriba, ejecuta FIX_RECURSION.sql

-- ============================================

-- 6. Verificar que existe la vista de admin
SELECT '6️⃣ Verificando vista admin_users_dashboard:' as paso;
SELECT
  COUNT(*) as total_usuarios,
  CASE
    WHEN COUNT(*) >= 0 THEN '✅ Vista existe y funciona'
    ELSE '❌ Error'
  END as verificacion
FROM admin_users_dashboard;

-- Si da error arriba, ejecuta EJECUTAR_ESTO.sql primero

-- ============================================

-- 7. RESUMEN FINAL
SELECT '📊 RESUMEN:' as titulo;
SELECT
  (SELECT COUNT(*) FROM auth.users WHERE email = 'mcgnexus@gmail.com') as usuarios_auth,
  (SELECT COUNT(*) FROM profiles WHERE email = 'mcgnexus@gmail.com') as perfiles_creados,
  (SELECT role FROM profiles WHERE email = 'mcgnexus@gmail.com') as tu_rol,
  (SELECT user_status FROM profiles WHERE email = 'mcgnexus@gmail.com') as tu_estado,
  (SELECT COUNT(*) FROM pg_policies WHERE tablename = 'profiles') as politicas_profiles,
  CASE
    WHEN
      (SELECT role FROM profiles WHERE email = 'mcgnexus@gmail.com') = 'admin'
      AND (SELECT user_status FROM profiles WHERE email = 'mcgnexus@gmail.com') = 'active'
      AND (SELECT COUNT(*) FROM pg_policies WHERE tablename = 'profiles') > 0
    THEN '✅✅✅ TODO PERFECTO - Ve a Vercel, cierra sesión, inicia sesión de nuevo'
    ELSE '❌ Revisa los pasos anteriores para ver qué falta'
  END as diagnostico;

-- ============================================
-- INSTRUCCIONES FINALES
-- ============================================

/*

Si el diagnóstico dice "TODO PERFECTO":

1. Ve a tu sitio en Vercel
2. Cierra sesión (botón "Cerrar Sesión")
3. Inicia sesión de nuevo con:
   Email: mcgnexus@gmail.com
   Contraseña: Avemaria_1977
4. Deberías ver una tarjeta "Panel de Administración" con borde azul
5. Click en ella para entrar a /admin

Si todavía NO aparece el panel:

1. Abre la consola del navegador (F12)
2. Ve a la pestaña "Console"
3. Busca errores en rojo
4. Copia el error y búscalo en DIAGNOSTICO_ADMIN_PANEL.md

Si ves error "infinite recursion":

1. Ejecuta FIX_RECURSION.sql en Supabase
2. Ve a Vercel → Deployments → "..." → "Redeploy"
3. Espera a que termine
4. Prueba de nuevo

*/
