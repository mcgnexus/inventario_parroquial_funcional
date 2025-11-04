-- Desactivar confirmación por email en Supabase Auth
-- Este script debe ejecutarse en el panel SQL de Supabase Dashboard

-- Verificar configuración actual
SELECT 
  name,
  value,
  description
FROM auth.config 
WHERE name IN ('email_confirm_enabled', 'autoconfirm');

-- Desactivar confirmación por email y activar autoconfirmación
UPDATE auth.config 
SET value = 'false' 
WHERE name = 'email_confirm_enabled';

UPDATE auth.config 
SET value = 'true' 
WHERE name = 'autoconfirm';

-- Verificar que los cambios se aplicaron
SELECT 
  name,
  value,
  description
FROM auth.config 
WHERE name IN ('email_confirm_enabled', 'autoconfirm');