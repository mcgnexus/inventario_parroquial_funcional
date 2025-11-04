-- ============================================
-- SISTEMA DE APROBACIÓN Y SUSCRIPCIÓN DE USUARIOS
-- ============================================
-- Fecha: 2025-11-04
-- Descripción: Sistema completo de gestión de usuarios con aprobación y suscripción
-- Administrador único: mcgnexus@gmail.com
-- ============================================

-- ============================================
-- PASO 1: Extender tabla profiles con nuevos estados
-- ============================================

-- Agregar columna de estado de usuario
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'user_status'
  ) THEN
    ALTER TABLE profiles ADD COLUMN user_status TEXT DEFAULT 'pending' CHECK (
      user_status IN ('pending', 'approved_unpaid', 'active', 'suspended', 'rejected')
    );
  END IF;
END $$;

-- Agregar columnas de metadata de suscripción
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'subscription_start'
  ) THEN
    ALTER TABLE profiles ADD COLUMN subscription_start TIMESTAMPTZ;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'subscription_end'
  ) THEN
    ALTER TABLE profiles ADD COLUMN subscription_end TIMESTAMPTZ;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'last_payment_date'
  ) THEN
    ALTER TABLE profiles ADD COLUMN last_payment_date TIMESTAMPTZ;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'payment_method'
  ) THEN
    ALTER TABLE profiles ADD COLUMN payment_method TEXT CHECK (
      payment_method IN ('bizum', 'kofi', 'manual', null)
    );
  END IF;
END $$;

-- ============================================
-- PASO 2: Crear tabla de historial de aprobaciones
-- ============================================

CREATE TABLE IF NOT EXISTS user_approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  approved_by UUID REFERENCES profiles(id),
  previous_status TEXT,
  new_status TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para búsqueda eficiente
CREATE INDEX IF NOT EXISTS idx_user_approvals_user_id ON user_approvals(user_id);
CREATE INDEX IF NOT EXISTS idx_user_approvals_approved_by ON user_approvals(approved_by);
CREATE INDEX IF NOT EXISTS idx_user_approvals_created_at ON user_approvals(created_at DESC);

-- ============================================
-- PASO 3: Crear tabla de historial de pagos
-- ============================================

CREATE TABLE IF NOT EXISTS payment_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL,
  payment_method TEXT NOT NULL,
  payment_reference TEXT, -- Referencia del pago (número Bizum, ID Ko-fi, etc)
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,
  verified_by UUID REFERENCES profiles(id), -- Admin que verificó el pago
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_payment_history_user_id ON payment_history(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_history_created_at ON payment_history(created_at DESC);

-- ============================================
-- PASO 4: Establecer mcgnexus@gmail.com como único admin
-- ============================================

-- Actualizar el perfil del administrador
UPDATE profiles
SET
  role = 'admin',
  user_status = 'active'
WHERE id = (
  SELECT id FROM auth.users WHERE email = 'mcgnexus@gmail.com'
);

-- Si el perfil no existe, crearlo
INSERT INTO profiles (id, email, full_name, role, user_status)
SELECT
  id,
  email,
  COALESCE(raw_user_meta_data->>'full_name', 'Administrador') as full_name,
  'admin' as role,
  'active' as user_status
FROM auth.users
WHERE email = 'mcgnexus@gmail.com'
ON CONFLICT (id) DO UPDATE
SET
  role = 'admin',
  user_status = 'active';

-- ============================================
-- PASO 5: Actualizar políticas RLS para incluir estado de usuario
-- ============================================

-- Eliminar políticas antiguas de items
DROP POLICY IF EXISTS "admin_read_all_items" ON items;
DROP POLICY IF EXISTS "users_insert_own_items" ON items;
DROP POLICY IF EXISTS "admin_update_all_items" ON items;
DROP POLICY IF EXISTS "admin_delete_items" ON items;

-- LECTURA: Solo admin o usuarios activos
CREATE POLICY "items_select_policy"
ON items
FOR SELECT
TO authenticated
USING (
  -- Admin ve todo
  (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  OR
  -- Usuario activo solo ve sus items
  (
    auth.uid() = user_id
    AND (SELECT user_status FROM profiles WHERE id = auth.uid()) = 'active'
  )
);

-- INSERCIÓN: Solo usuarios activos
CREATE POLICY "items_insert_policy"
ON items
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
    OR (SELECT user_status FROM profiles WHERE id = auth.uid()) = 'active'
  )
);

-- ACTUALIZACIÓN: Solo admin o usuarios activos para sus items
CREATE POLICY "items_update_policy"
ON items
FOR UPDATE
TO authenticated
USING (
  (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  OR
  (
    auth.uid() = user_id
    AND (SELECT user_status FROM profiles WHERE id = auth.uid()) = 'active'
  )
)
WITH CHECK (
  (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  OR
  (
    auth.uid() = user_id
    AND (SELECT user_status FROM profiles WHERE id = auth.uid()) = 'active'
  )
);

-- ELIMINACIÓN: Solo admin
CREATE POLICY "items_delete_policy"
ON items
FOR DELETE
TO authenticated
USING (
  (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
);

-- ============================================
-- PASO 6: Políticas RLS para profiles (admin ve todo)
-- ============================================

DROP POLICY IF EXISTS "profiles_select_policy" ON profiles;
DROP POLICY IF EXISTS "profiles_insert_policy" ON profiles;
DROP POLICY IF EXISTS "profiles_update_policy" ON profiles;

-- LECTURA: Admin ve todo, usuarios solo su perfil
CREATE POLICY "profiles_select_policy"
ON profiles
FOR SELECT
TO authenticated
USING (
  (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  OR auth.uid() = id
);

-- INSERCIÓN: Solo puede crear su propio perfil
CREATE POLICY "profiles_insert_policy"
ON profiles
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = id
  AND role = 'user' -- No puede auto-asignarse admin
  AND user_status = 'pending' -- Empieza como pendiente
);

-- ACTUALIZACIÓN: Admin actualiza todo, usuarios solo datos básicos
CREATE POLICY "profiles_update_policy"
ON profiles
FOR UPDATE
TO authenticated
USING (
  (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  OR auth.uid() = id
)
WITH CHECK (
  -- Admin puede cambiar cualquier cosa
  (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  OR
  -- Usuario normal solo puede actualizar full_name, email
  -- NO puede cambiar role ni user_status
  (
    auth.uid() = id
    AND role = (SELECT role FROM profiles WHERE id = auth.uid())
    AND user_status = (SELECT user_status FROM profiles WHERE id = auth.uid())
  )
);

-- ============================================
-- PASO 7: Políticas RLS para tablas de aprobación y pagos
-- ============================================

-- user_approvals: Solo admin puede leer/escribir
ALTER TABLE user_approvals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_manage_approvals"
ON user_approvals
FOR ALL
TO authenticated
USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin')
WITH CHECK ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');

-- payment_history: Admin ve todo, usuarios ven su historial
ALTER TABLE payment_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "payment_history_select_policy"
ON payment_history
FOR SELECT
TO authenticated
USING (
  (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  OR auth.uid() = user_id
);

CREATE POLICY "admin_manage_payments"
ON payment_history
FOR INSERT
TO authenticated
WITH CHECK ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');

-- ============================================
-- PASO 8: Funciones auxiliares para gestión
-- ============================================

-- Función para aprobar usuario
CREATE OR REPLACE FUNCTION approve_user(
  target_user_id UUID,
  admin_notes TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_status TEXT;
  is_admin BOOLEAN;
BEGIN
  -- Verificar que quien ejecuta es admin
  SELECT role = 'admin' INTO is_admin
  FROM profiles
  WHERE id = auth.uid();

  IF NOT is_admin THEN
    RAISE EXCEPTION 'Solo administradores pueden aprobar usuarios';
  END IF;

  -- Obtener estado actual
  SELECT user_status INTO current_status
  FROM profiles
  WHERE id = target_user_id;

  -- Actualizar estado
  UPDATE profiles
  SET user_status = 'approved_unpaid'
  WHERE id = target_user_id;

  -- Registrar en historial
  INSERT INTO user_approvals (user_id, approved_by, previous_status, new_status, notes)
  VALUES (target_user_id, auth.uid(), current_status, 'approved_unpaid', admin_notes);
END;
$$;

-- Función para activar suscripción tras pago
CREATE OR REPLACE FUNCTION activate_subscription(
  target_user_id UUID,
  payment_amount DECIMAL,
  payment_ref TEXT DEFAULT NULL,
  method TEXT DEFAULT 'manual',
  admin_notes TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  is_admin BOOLEAN;
  start_date TIMESTAMPTZ;
  end_date TIMESTAMPTZ;
BEGIN
  -- Verificar que quien ejecuta es admin
  SELECT role = 'admin' INTO is_admin
  FROM profiles
  WHERE id = auth.uid();

  IF NOT is_admin THEN
    RAISE EXCEPTION 'Solo administradores pueden activar suscripciones';
  END IF;

  -- Calcular periodo (1 mes desde ahora)
  start_date := NOW();
  end_date := NOW() + INTERVAL '1 month';

  -- Actualizar perfil
  UPDATE profiles
  SET
    user_status = 'active',
    subscription_start = start_date,
    subscription_end = end_date,
    last_payment_date = start_date,
    payment_method = method
  WHERE id = target_user_id;

  -- Registrar pago
  INSERT INTO payment_history (
    user_id,
    amount,
    payment_method,
    payment_reference,
    period_start,
    period_end,
    verified_by,
    notes
  )
  VALUES (
    target_user_id,
    payment_amount,
    method,
    payment_ref,
    start_date,
    end_date,
    auth.uid(),
    admin_notes
  );
END;
$$;

-- Función para renovar suscripción
CREATE OR REPLACE FUNCTION renew_subscription(
  target_user_id UUID,
  payment_amount DECIMAL,
  payment_ref TEXT DEFAULT NULL,
  admin_notes TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  is_admin BOOLEAN;
  current_end TIMESTAMPTZ;
  new_end TIMESTAMPTZ;
BEGIN
  SELECT role = 'admin' INTO is_admin
  FROM profiles
  WHERE id = auth.uid();

  IF NOT is_admin THEN
    RAISE EXCEPTION 'Solo administradores pueden renovar suscripciones';
  END IF;

  -- Obtener fecha de fin actual
  SELECT subscription_end INTO current_end
  FROM profiles
  WHERE id = target_user_id;

  -- Calcular nueva fecha (1 mes desde la fecha de fin actual o ahora si ya expiró)
  IF current_end > NOW() THEN
    new_end := current_end + INTERVAL '1 month';
  ELSE
    new_end := NOW() + INTERVAL '1 month';
  END IF;

  -- Actualizar perfil
  UPDATE profiles
  SET
    subscription_end = new_end,
    last_payment_date = NOW(),
    user_status = 'active'
  WHERE id = target_user_id;

  -- Registrar pago
  INSERT INTO payment_history (
    user_id,
    amount,
    payment_method,
    payment_reference,
    period_start,
    period_end,
    verified_by,
    notes
  )
  VALUES (
    target_user_id,
    payment_amount,
    (SELECT payment_method FROM profiles WHERE id = target_user_id),
    payment_ref,
    NOW(),
    new_end,
    auth.uid(),
    admin_notes
  );
END;
$$;

-- Función para suspender usuario
CREATE OR REPLACE FUNCTION suspend_user(
  target_user_id UUID,
  reason TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  is_admin BOOLEAN;
  current_status TEXT;
BEGIN
  SELECT role = 'admin' INTO is_admin
  FROM profiles
  WHERE id = auth.uid();

  IF NOT is_admin THEN
    RAISE EXCEPTION 'Solo administradores pueden suspender usuarios';
  END IF;

  SELECT user_status INTO current_status
  FROM profiles
  WHERE id = target_user_id;

  UPDATE profiles
  SET user_status = 'suspended'
  WHERE id = target_user_id;

  INSERT INTO user_approvals (user_id, approved_by, previous_status, new_status, notes)
  VALUES (target_user_id, auth.uid(), current_status, 'suspended', reason);
END;
$$;

-- ============================================
-- PASO 9: Vista para panel de administración
-- ============================================

CREATE OR REPLACE VIEW admin_users_dashboard AS
SELECT
  p.id,
  p.email,
  p.full_name,
  p.role,
  p.user_status,
  p.parish_id,
  par.name as parish_name,
  p.subscription_start,
  p.subscription_end,
  p.last_payment_date,
  p.payment_method,
  CASE
    WHEN p.subscription_end IS NULL THEN 'Sin suscripción'
    WHEN p.subscription_end < NOW() THEN 'Expirado'
    WHEN p.subscription_end < NOW() + INTERVAL '7 days' THEN 'Por expirar'
    ELSE 'Activo'
  END as subscription_status,
  p.created_at as registered_at,
  (
    SELECT COUNT(*)
    FROM items i
    WHERE i.user_id = p.id
  ) as items_count
FROM profiles p
LEFT JOIN parishes par ON par.id = p.parish_id
WHERE p.role != 'admin'
ORDER BY p.created_at DESC;

-- NOTA: Las políticas RLS no se pueden aplicar a vistas.
-- La seguridad de esta vista se controlará mediante la función de consulta en la aplicación.

-- ============================================
-- VERIFICACIÓN FINAL
-- ============================================

-- Ver el administrador
SELECT
  u.email,
  p.full_name,
  p.role,
  p.user_status,
  CASE
    WHEN p.role = 'admin' THEN '✅ ADMINISTRADOR ÚNICO - Control total'
    ELSE '👤 Usuario'
  END as permisos
FROM auth.users u
LEFT JOIN profiles p ON p.id = u.id
WHERE u.email = 'mcgnexus@gmail.com';

-- Ver todas las políticas
SELECT
  tablename,
  policyname,
  cmd
FROM pg_policies
WHERE tablename IN ('items', 'profiles', 'user_approvals', 'payment_history')
ORDER BY tablename, policyname;
