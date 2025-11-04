-- ============================================
-- SIMPLIFICAR SISTEMA DE APROBACIÓN
-- ============================================
-- Ejecuta esto en Supabase SQL Editor
--
-- CAMBIOS:
-- 1. Aprobar usuario lo activa DIRECTAMENTE (sin pedir pago)
-- 2. El pago se vuelve completamente OPCIONAL
-- 3. Se muestra mensaje discreto de colaboración voluntaria
-- ============================================

-- Reemplazar la función approve_user para activar directamente
CREATE OR REPLACE FUNCTION approve_user(
  target_user_id UUID,
  admin_notes TEXT DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  admin_id UUID;
BEGIN
  -- Verificar que quien ejecuta es admin
  admin_id := auth.uid();

  IF NOT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = admin_id AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Solo administradores pueden aprobar usuarios';
  END IF;

  -- Actualizar usuario a ACTIVO directamente (sin pedir pago)
  -- La suscripción no expira nunca (o expira en 100 años)
  UPDATE profiles
  SET
    user_status = 'active',
    subscription_start = NOW(),
    subscription_end = NOW() + INTERVAL '100 years',  -- Prácticamente sin expiración
    last_payment_date = NULL  -- Sin pago requerido
  WHERE id = target_user_id;

  -- Registrar la aprobación en el historial
  INSERT INTO user_approvals (
    user_id,
    approved_by,
    status,
    notes
  ) VALUES (
    target_user_id,
    admin_id,
    'approved',
    COALESCE(admin_notes, 'Usuario aprobado - acceso sin restricciones')
  );

END;
$$;

-- ============================================
-- Actualizar usuarios que están en "approved_unpaid" a "active"
-- (para que los que ya aprobaste tengan acceso inmediato)
-- ============================================

UPDATE profiles
SET
  user_status = 'active',
  subscription_start = COALESCE(subscription_start, NOW()),
  subscription_end = COALESCE(subscription_end, NOW() + INTERVAL '100 years')
WHERE user_status = 'approved_unpaid';

-- ============================================
-- Opcional: Función para registrar colaboraciones voluntarias
-- (cuando alguien envíe un Bizum voluntario)
-- ============================================

CREATE OR REPLACE FUNCTION register_voluntary_donation(
  target_user_id UUID,
  donation_amount NUMERIC,
  payment_ref TEXT DEFAULT NULL,
  admin_notes TEXT DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  admin_id UUID;
BEGIN
  -- Verificar que quien ejecuta es admin
  admin_id := auth.uid();

  IF NOT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = admin_id AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Solo administradores pueden registrar donaciones';
  END IF;

  -- Registrar la donación en el historial de pagos
  INSERT INTO payment_history (
    user_id,
    amount,
    payment_date,
    payment_method,
    reference,
    notes
  ) VALUES (
    target_user_id,
    donation_amount,
    NOW(),
    'bizum',
    payment_ref,
    COALESCE(admin_notes, 'Colaboración voluntaria')
  );

  -- Actualizar última fecha de pago (opcional)
  UPDATE profiles
  SET last_payment_date = NOW()
  WHERE id = target_user_id;

END;
$$;

-- ============================================
-- Verificación
-- ============================================

SELECT '✅ Funciones actualizadas correctamente' as resultado;

-- Ver usuarios que ahora están activos
SELECT
  email,
  user_status,
  subscription_start,
  subscription_end,
  'Acceso sin restricciones' as nota
FROM profiles
WHERE user_status = 'active'
  AND role != 'admin'
ORDER BY email;

-- ============================================
-- INSTRUCCIONES DE USO
-- ============================================

/*

FLUJO NUEVO (SIMPLIFICADO):

1. Usuario se registra → Estado: "pending"
2. Tú lo apruebas desde /admin → Estado: "active" (acceso inmediato)
3. Usuario ve mensaje discreto de colaboración OPCIONAL
4. Si envía Bizum voluntario, lo registras con register_voluntary_donation()

APROBAR USUARIO:
- Ve a /admin
- Click en "Aprobar"
- ¡Listo! El usuario ya tiene acceso completo

REGISTRAR DONACIÓN VOLUNTARIA (opcional):
Si alguien te envía un Bizum voluntario, ejecútalo así en SQL Editor:

SELECT register_voluntary_donation(
  (SELECT id FROM auth.users WHERE email = 'usuario@ejemplo.com'),
  10.00,
  'Bizum #12345',
  'Gracias por tu colaboración'
);

VENTAJAS:
✅ Sin presión de pago
✅ Más apropiado para sacerdotes y parroquias
✅ Colaboración verdaderamente voluntaria
✅ Acceso inmediato al aprobar
✅ Menos fricción para los usuarios

*/
