-- ============================================
-- SISTEMA DE PERMISOS: ADMINISTRADOR vs USUARIOS
-- ============================================

-- OBJETIVOS:
-- 1. mcgnexus@gmail.com = ADMINISTRADOR (acceso total)
-- 2. Otros usuarios = Solo ven/editan SUS propios items
-- 3. Usuarios NO pueden ver items de otros usuarios

-- ============================================
-- PASO 1: Verificar que la tabla profiles tiene columna 'role'
-- ============================================

-- Si no existe, crearla:
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'role'
  ) THEN
    ALTER TABLE profiles ADD COLUMN role TEXT DEFAULT 'user';
  END IF;
END $$;

-- ============================================
-- PASO 2: Actualizar mcgnexus@gmail.com como admin
-- ============================================

-- Primero, encontrar el UUID del usuario
-- (Ejecuta esta query y copia el UUID que aparezca)
SELECT id, email, raw_user_meta_data->>'full_name' as nombre
FROM auth.users
WHERE email = 'mcgnexus@gmail.com';

-- Una vez tengas el UUID, actualiza el perfil:
-- (Reemplaza 'UUID_AQUI' con el UUID real del query anterior)

-- OPCIÓN A: Si sabes el UUID del usuario
UPDATE profiles
SET role = 'admin'
WHERE id = (
  SELECT id FROM auth.users WHERE email = 'mcgnexus@gmail.com'
);

-- OPCIÓN B: Si el perfil no existe aún, créalo
INSERT INTO profiles (id, email, full_name, role)
SELECT
  id,
  email,
  raw_user_meta_data->>'full_name' as full_name,
  'admin' as role
FROM auth.users
WHERE email = 'mcgnexus@gmail.com'
ON CONFLICT (id) DO UPDATE
SET role = 'admin';

-- Verificar que se actualizó:
SELECT p.id, p.email, p.full_name, p.role
FROM profiles p
JOIN auth.users u ON u.id = p.id
WHERE u.email = 'mcgnexus@gmail.com';

-- ============================================
-- PASO 3: Eliminar políticas antiguas de items
-- ============================================

-- Primero, ver qué políticas existen:
SELECT policyname, cmd, roles
FROM pg_policies
WHERE tablename = 'items';

-- Eliminar las políticas antiguas:
DROP POLICY IF EXISTS "public read published/approved items" ON items;
DROP POLICY IF EXISTS "users read own items" ON items;
DROP POLICY IF EXISTS "users insert own items" ON items;
DROP POLICY IF EXISTS "users update own items" ON items;

-- ============================================
-- PASO 4: Crear nuevas políticas con permisos de admin
-- ============================================

-- 4.1 LECTURA (SELECT):
-- Administradores ven TODO, usuarios solo sus items
CREATE POLICY "admin_read_all_items"
ON items
FOR SELECT
TO authenticated
USING (
  -- Administrador ve todo
  (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  OR
  -- Usuario normal solo ve sus propios items
  auth.uid() = user_id
);

-- 4.2 INSERCIÓN (INSERT):
-- Todos pueden insertar, pero solo con su propio user_id
CREATE POLICY "users_insert_own_items"
ON items
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id
);

-- 4.3 ACTUALIZACIÓN (UPDATE):
-- Administradores pueden actualizar TODO, usuarios solo sus items
CREATE POLICY "admin_update_all_items"
ON items
FOR UPDATE
TO authenticated
USING (
  -- Administrador puede actualizar todo
  (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  OR
  -- Usuario normal solo sus propios items
  auth.uid() = user_id
)
WITH CHECK (
  -- Administrador puede cambiar a cualquier user_id
  (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  OR
  -- Usuario normal no puede cambiar el user_id
  auth.uid() = user_id
);

-- 4.4 ELIMINACIÓN (DELETE):
-- Solo administradores pueden eliminar
CREATE POLICY "admin_delete_items"
ON items
FOR DELETE
TO authenticated
USING (
  (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
);

-- ============================================
-- PASO 5: Actualizar políticas de profiles
-- ============================================

-- Los usuarios normales solo ven su propio perfil
-- Los administradores ven todos los perfiles

-- Eliminar políticas antiguas
DROP POLICY IF EXISTS "select_own_profile" ON profiles;
DROP POLICY IF EXISTS "update_own_profile" ON profiles;
DROP POLICY IF EXISTS "insert_own_profile" ON profiles;

-- Crear nuevas políticas

-- LECTURA: Admin ve todo, usuarios solo su perfil
CREATE POLICY "profiles_select_policy"
ON profiles
FOR SELECT
TO authenticated
USING (
  (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  OR
  auth.uid() = id
);

-- INSERCIÓN: Cada usuario puede crear su propio perfil
CREATE POLICY "profiles_insert_policy"
ON profiles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

-- ACTUALIZACIÓN: Admin actualiza todo, usuarios solo su perfil
-- IMPORTANTE: Usuarios normales NO pueden cambiar su rol
CREATE POLICY "profiles_update_policy"
ON profiles
FOR UPDATE
TO authenticated
USING (
  (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  OR
  auth.uid() = id
)
WITH CHECK (
  -- Admin puede cambiar cualquier cosa
  (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  OR
  -- Usuario normal solo puede actualizar su perfil pero NO su rol
  (auth.uid() = id AND role = (SELECT role FROM profiles WHERE id = auth.uid()))
);

-- ============================================
-- PASO 6: Verificación del sistema
-- ============================================

-- Ver todas las políticas de items:
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename IN ('items', 'profiles')
ORDER BY tablename, policyname;

-- Ver el rol de mcgnexus@gmail.com:
SELECT
  u.email,
  p.full_name,
  p.role,
  CASE
    WHEN p.role = 'admin' THEN '✅ ADMINISTRADOR - Acceso total'
    ELSE '👤 Usuario normal - Solo sus items'
  END as permisos
FROM auth.users u
LEFT JOIN profiles p ON p.id = u.id
WHERE u.email = 'mcgnexus@gmail.com';

-- ============================================
-- PASO 7: Probar el sistema (OPCIONAL)
-- ============================================

-- Crear un usuario de prueba para verificar que NO ve items de otros:
-- (NO ejecutes esto si no quieres un usuario de prueba)

/*
-- Primero crea el usuario desde la UI de autenticación de Supabase
-- Email: test@example.com
-- Password: Test1234!

-- Luego ejecuta:
INSERT INTO profiles (id, email, full_name, role)
SELECT id, email, 'Usuario Prueba', 'user'
FROM auth.users
WHERE email = 'test@example.com'
ON CONFLICT (id) DO UPDATE SET role = 'user';
*/

-- ============================================
-- NOTAS IMPORTANTES
-- ============================================

/*
1. ROLES:
   - 'admin' = Acceso total (ver, crear, editar, eliminar todo)
   - 'user' = Solo ve/edita sus propios items

2. SEGURIDAD:
   - Los usuarios normales NO pueden cambiar su rol a 'admin'
   - Solo administradores pueden eliminar items
   - Cada usuario solo puede crear items con su propio user_id

3. VERIFICACIÓN:
   - Inicia sesión con mcgnexus@gmail.com → Debes ver TODOS los items
   - Inicia sesión con otro usuario → Solo verás tus propios items

4. SI ALGO SALE MAL:
   - Puedes eliminar todas las políticas y volver a crearlas
   - NO elimines datos, solo políticas (DROP POLICY)
   - Las políticas se pueden recrear sin pérdida de datos
*/
