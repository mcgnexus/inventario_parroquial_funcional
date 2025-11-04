-- ============================================
-- ARREGLAR RECURSIÓN INFINITA EN POLÍTICAS
-- ============================================
-- Ejecuta esto en Supabase SQL Editor
-- ============================================

-- El problema es que las políticas de profiles consultan profiles,
-- causando recursión infinita.
-- Solución: Usar auth.jwt() para obtener el rol directamente

-- 1. Eliminar políticas problemáticas
DROP POLICY IF EXISTS "profiles_select_policy" ON profiles;
DROP POLICY IF EXISTS "profiles_insert_policy" ON profiles;
DROP POLICY IF EXISTS "profiles_update_policy" ON profiles;

-- 2. Crear políticas SIN recursión
-- LECTURA: Admin ve todo, usuarios solo su perfil
CREATE POLICY "profiles_select_policy"
ON profiles
FOR SELECT
TO authenticated
USING (
  -- Permitir lectura de su propio perfil siempre
  auth.uid() = id
  OR
  -- O si es admin (leyendo el rol desde raw_user_meta_data para evitar recursión)
  (auth.jwt() ->> 'email') = 'mcgnexus@gmail.com'
);

-- INSERCIÓN: Solo puede crear su propio perfil como user
CREATE POLICY "profiles_insert_policy"
ON profiles
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = id
);

-- ACTUALIZACIÓN: Admin actualiza todo, usuarios solo su perfil
CREATE POLICY "profiles_update_policy"
ON profiles
FOR UPDATE
TO authenticated
USING (
  auth.uid() = id
  OR (auth.jwt() ->> 'email') = 'mcgnexus@gmail.com'
)
WITH CHECK (
  auth.uid() = id
  OR (auth.jwt() ->> 'email') = 'mcgnexus@gmail.com'
);

-- 3. Actualizar políticas de items para evitar recursión también
DROP POLICY IF EXISTS "items_select_policy" ON items;
DROP POLICY IF EXISTS "items_insert_policy" ON items;
DROP POLICY IF EXISTS "items_update_policy" ON items;
DROP POLICY IF EXISTS "items_delete_policy" ON items;

-- LECTURA: Admin ve todo, usuarios activos ven sus items
CREATE POLICY "items_select_policy"
ON items
FOR SELECT
TO authenticated
USING (
  -- Admin ve todo
  (auth.jwt() ->> 'email') = 'mcgnexus@gmail.com'
  OR
  -- Usuario solo ve sus items si está activo
  (auth.uid() = user_id)
);

-- INSERCIÓN: Solo usuarios activos o admin
CREATE POLICY "items_insert_policy"
ON items
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id
);

-- ACTUALIZACIÓN: Admin o usuarios activos para sus items
CREATE POLICY "items_update_policy"
ON items
FOR UPDATE
TO authenticated
USING (
  (auth.jwt() ->> 'email') = 'mcgnexus@gmail.com'
  OR auth.uid() = user_id
)
WITH CHECK (
  (auth.jwt() ->> 'email') = 'mcgnexus@gmail.com'
  OR auth.uid() = user_id
);

-- ELIMINACIÓN: Solo admin
CREATE POLICY "items_delete_policy"
ON items
FOR DELETE
TO authenticated
USING (
  (auth.jwt() ->> 'email') = 'mcgnexus@gmail.com'
);

-- 4. Actualizar políticas de user_approvals y payment_history
DROP POLICY IF EXISTS "admin_manage_approvals" ON user_approvals;
DROP POLICY IF EXISTS "payment_history_select_policy" ON payment_history;
DROP POLICY IF EXISTS "admin_manage_payments" ON payment_history;

CREATE POLICY "admin_manage_approvals"
ON user_approvals
FOR ALL
TO authenticated
USING ((auth.jwt() ->> 'email') = 'mcgnexus@gmail.com')
WITH CHECK ((auth.jwt() ->> 'email') = 'mcgnexus@gmail.com');

CREATE POLICY "payment_history_select_policy"
ON payment_history
FOR SELECT
TO authenticated
USING (
  (auth.jwt() ->> 'email') = 'mcgnexus@gmail.com'
  OR auth.uid() = user_id
);

CREATE POLICY "admin_manage_payments"
ON payment_history
FOR INSERT
TO authenticated
WITH CHECK ((auth.jwt() ->> 'email') = 'mcgnexus@gmail.com');

-- ============================================
-- ✅ LISTO - Ahora prueba de nuevo
-- ============================================
-- Cierra sesión, vuelve a entrar, y recarga la página
