-- Habilitar inicio de sesión por email en Supabase Auth
-- Este script debe ejecutarse en el panel SQL de Supabase Dashboard

-- Verificar configuración actual de providers
SELECT 
  name,
  enabled,
  config
FROM auth.providers 
WHERE name = 'email';

-- Si email está deshabilitado, habilitarlo
UPDATE auth.providers 
SET enabled = true 
WHERE name = 'email';

-- Verificar que se haya activado
SELECT 
  name,
  enabled,
  config
FROM auth.providers 
WHERE name = 'email';