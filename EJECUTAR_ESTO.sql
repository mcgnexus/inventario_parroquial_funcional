-- ============================================
-- SCRIPT SIMPLIFICADO - EJECUTAR ESTO PRIMERO
-- ============================================
-- Copia y pega esto en Supabase SQL Editor
-- ============================================

-- 1. Agregar columnas necesarias a profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS user_status TEXT DEFAULT 'pending';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS subscription_start TIMESTAMPTZ;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS subscription_end TIMESTAMPTZ;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_payment_date TIMESTAMPTZ;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS payment_method TEXT;

-- 2. Crear tabla user_approvals
CREATE TABLE IF NOT EXISTS user_approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  approved_by UUID REFERENCES profiles(id),
  previous_status TEXT,
  new_status TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_approvals_user_id ON user_approvals(user_id);
CREATE INDEX IF NOT EXISTS idx_user_approvals_approved_by ON user_approvals(approved_by);
CREATE INDEX IF NOT EXISTS idx_user_approvals_created_at ON user_approvals(created_at DESC);

-- 3. Crear tabla payment_history
CREATE TABLE IF NOT EXISTS payment_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL,
  payment_method TEXT NOT NULL,
  payment_reference TEXT,
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,
  verified_by UUID REFERENCES profiles(id),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payment_history_user_id ON payment_history(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_history_created_at ON payment_history(created_at DESC);

-- 4. Configurarte como admin
UPDATE profiles
SET role = 'admin', user_status = 'active'
WHERE id = (SELECT id FROM auth.users WHERE email = 'mcgnexus@gmail.com');

INSERT INTO profiles (id, email, full_name, role, user_status)
SELECT id, email, 'Manuel Carrasco García', 'admin', 'active'
FROM auth.users
WHERE email = 'mcgnexus@gmail.com'
ON CONFLICT (id) DO UPDATE SET role = 'admin', user_status = 'active';

-- 5. Eliminar políticas antiguas de items
DROP POLICY IF EXISTS "admin_read_all_items" ON items;
DROP POLICY IF EXISTS "users_insert_own_items" ON items;
DROP POLICY IF EXISTS "admin_update_all_items" ON items;
DROP POLICY IF EXISTS "admin_delete_items" ON items;
DROP POLICY IF EXISTS "items_select_policy" ON items;
DROP POLICY IF EXISTS "items_insert_policy" ON items;
DROP POLICY IF EXISTS "items_update_policy" ON items;
DROP POLICY IF EXISTS "items_delete_policy" ON items;
DROP POLICY IF EXISTS "public read published/approved items" ON items;
DROP POLICY IF EXISTS "users read own items" ON items;
DROP POLICY IF EXISTS "users update own items" ON items;

-- 6. Crear nuevas políticas de items
CREATE POLICY "items_select_policy" ON items FOR SELECT TO authenticated
USING (
  (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  OR (auth.uid() = user_id AND (SELECT user_status FROM profiles WHERE id = auth.uid()) = 'active')
);

CREATE POLICY "items_insert_policy" ON items FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() = user_id AND (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
    OR (SELECT user_status FROM profiles WHERE id = auth.uid()) = 'active'
  )
);

CREATE POLICY "items_update_policy" ON items FOR UPDATE TO authenticated
USING (
  (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  OR (auth.uid() = user_id AND (SELECT user_status FROM profiles WHERE id = auth.uid()) = 'active')
)
WITH CHECK (
  (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  OR (auth.uid() = user_id AND (SELECT user_status FROM profiles WHERE id = auth.uid()) = 'active')
);

CREATE POLICY "items_delete_policy" ON items FOR DELETE TO authenticated
USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');

-- 7. Eliminar políticas antiguas de profiles
DROP POLICY IF EXISTS "profiles_select_policy" ON profiles;
DROP POLICY IF EXISTS "profiles_insert_policy" ON profiles;
DROP POLICY IF EXISTS "profiles_update_policy" ON profiles;
DROP POLICY IF EXISTS "select_own_profile" ON profiles;
DROP POLICY IF EXISTS "insert_own_profile" ON profiles;
DROP POLICY IF EXISTS "update_own_profile" ON profiles;

-- 8. Crear nuevas políticas de profiles
CREATE POLICY "profiles_select_policy" ON profiles FOR SELECT TO authenticated
USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin' OR auth.uid() = id);

CREATE POLICY "profiles_insert_policy" ON profiles FOR INSERT TO authenticated
WITH CHECK (auth.uid() = id AND role = 'user' AND user_status = 'pending');

CREATE POLICY "profiles_update_policy" ON profiles FOR UPDATE TO authenticated
USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin' OR auth.uid() = id)
WITH CHECK (
  (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  OR (
    auth.uid() = id
    AND role = (SELECT role FROM profiles WHERE id = auth.uid())
    AND user_status = (SELECT user_status FROM profiles WHERE id = auth.uid())
  )
);

-- 9. Habilitar RLS en nuevas tablas
ALTER TABLE user_approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_manage_approvals" ON user_approvals;
DROP POLICY IF EXISTS "payment_history_select_policy" ON payment_history;
DROP POLICY IF EXISTS "admin_manage_payments" ON payment_history;

CREATE POLICY "admin_manage_approvals" ON user_approvals FOR ALL TO authenticated
USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin')
WITH CHECK ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');

CREATE POLICY "payment_history_select_policy" ON payment_history FOR SELECT TO authenticated
USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin' OR auth.uid() = user_id);

CREATE POLICY "admin_manage_payments" ON payment_history FOR INSERT TO authenticated
WITH CHECK ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');

-- 10. Crear funciones
CREATE OR REPLACE FUNCTION approve_user(target_user_id UUID, admin_notes TEXT DEFAULT NULL)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  current_status TEXT;
  is_admin BOOLEAN;
BEGIN
  SELECT role = 'admin' INTO is_admin FROM profiles WHERE id = auth.uid();
  IF NOT is_admin THEN RAISE EXCEPTION 'Solo administradores pueden aprobar usuarios'; END IF;
  SELECT user_status INTO current_status FROM profiles WHERE id = target_user_id;
  UPDATE profiles SET user_status = 'approved_unpaid' WHERE id = target_user_id;
  INSERT INTO user_approvals (user_id, approved_by, previous_status, new_status, notes)
  VALUES (target_user_id, auth.uid(), current_status, 'approved_unpaid', admin_notes);
END; $$;

CREATE OR REPLACE FUNCTION activate_subscription(
  target_user_id UUID, payment_amount DECIMAL, payment_ref TEXT DEFAULT NULL,
  method TEXT DEFAULT 'manual', admin_notes TEXT DEFAULT NULL
)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  is_admin BOOLEAN;
  start_date TIMESTAMPTZ;
  end_date TIMESTAMPTZ;
BEGIN
  SELECT role = 'admin' INTO is_admin FROM profiles WHERE id = auth.uid();
  IF NOT is_admin THEN RAISE EXCEPTION 'Solo administradores pueden activar suscripciones'; END IF;
  start_date := NOW();
  end_date := NOW() + INTERVAL '1 month';
  UPDATE profiles SET user_status = 'active', subscription_start = start_date,
    subscription_end = end_date, last_payment_date = start_date, payment_method = method
  WHERE id = target_user_id;
  INSERT INTO payment_history (user_id, amount, payment_method, payment_reference, period_start, period_end, verified_by, notes)
  VALUES (target_user_id, payment_amount, method, payment_ref, start_date, end_date, auth.uid(), admin_notes);
END; $$;

CREATE OR REPLACE FUNCTION renew_subscription(
  target_user_id UUID, payment_amount DECIMAL, payment_ref TEXT DEFAULT NULL, admin_notes TEXT DEFAULT NULL
)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  is_admin BOOLEAN;
  current_end TIMESTAMPTZ;
  new_end TIMESTAMPTZ;
BEGIN
  SELECT role = 'admin' INTO is_admin FROM profiles WHERE id = auth.uid();
  IF NOT is_admin THEN RAISE EXCEPTION 'Solo administradores pueden renovar suscripciones'; END IF;
  SELECT subscription_end INTO current_end FROM profiles WHERE id = target_user_id;
  IF current_end > NOW() THEN new_end := current_end + INTERVAL '1 month';
  ELSE new_end := NOW() + INTERVAL '1 month'; END IF;
  UPDATE profiles SET subscription_end = new_end, last_payment_date = NOW(), user_status = 'active'
  WHERE id = target_user_id;
  INSERT INTO payment_history (user_id, amount, payment_method, payment_reference, period_start, period_end, verified_by, notes)
  VALUES (target_user_id, payment_amount, (SELECT payment_method FROM profiles WHERE id = target_user_id),
    payment_ref, NOW(), new_end, auth.uid(), admin_notes);
END; $$;

CREATE OR REPLACE FUNCTION suspend_user(target_user_id UUID, reason TEXT DEFAULT NULL)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  is_admin BOOLEAN;
  current_status TEXT;
BEGIN
  SELECT role = 'admin' INTO is_admin FROM profiles WHERE id = auth.uid();
  IF NOT is_admin THEN RAISE EXCEPTION 'Solo administradores pueden suspender usuarios'; END IF;
  SELECT user_status INTO current_status FROM profiles WHERE id = target_user_id;
  UPDATE profiles SET user_status = 'suspended' WHERE id = target_user_id;
  INSERT INTO user_approvals (user_id, approved_by, previous_status, new_status, notes)
  VALUES (target_user_id, auth.uid(), current_status, 'suspended', reason);
END; $$;

-- 11. Crear vista
DROP VIEW IF EXISTS admin_users_dashboard;
CREATE OR REPLACE VIEW admin_users_dashboard AS
SELECT
  p.id, p.email, p.full_name, p.role, p.user_status, p.parish_id,
  par.name as parish_name, p.subscription_start, p.subscription_end,
  p.last_payment_date, p.payment_method,
  CASE
    WHEN p.subscription_end IS NULL THEN 'Sin suscripción'
    WHEN p.subscription_end < NOW() THEN 'Expirado'
    WHEN p.subscription_end < NOW() + INTERVAL '7 days' THEN 'Por expirar'
    ELSE 'Activo'
  END as subscription_status,
  p.created_at as registered_at,
  (SELECT COUNT(*) FROM items i WHERE i.user_id = p.id) as items_count
FROM profiles p
LEFT JOIN parishes par ON par.id = p.parish_id
WHERE p.role != 'admin'
ORDER BY p.created_at DESC;

-- ============================================
-- ✅ LISTO - Ahora ejecuta esto para verificar:
-- ============================================
-- SELECT u.email, p.role, p.user_status
-- FROM auth.users u
-- JOIN profiles p ON p.id = u.id
-- WHERE u.email = 'mcgnexus@gmail.com';
