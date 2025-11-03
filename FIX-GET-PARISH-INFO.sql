-- ============================================================================
-- FIX: Actualizar función get_parish_info con columnas correctas
-- ============================================================================
--
-- Problema: La función intentaba seleccionar columnas que no existen:
-- - municipality (no existe)
-- - province (no existe)
--
-- Solución: Recrear la función solo con las columnas que existen en parishes:
-- - id, name, location, diocese
-- ============================================================================

-- Eliminar la función anterior (si existe)
DROP FUNCTION IF EXISTS public.get_parish_info(UUID);

-- Recrear la función con las columnas correctas
CREATE OR REPLACE FUNCTION public.get_parish_info(parish_uuid UUID)
RETURNS TABLE (
  id UUID,
  name TEXT,
  location TEXT,
  diocese TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.name,
    p.location,
    p.diocese
  FROM public.parishes p
  WHERE p.id = parish_uuid
  LIMIT 1;
END;
$$;

-- Dar permisos de ejecución
GRANT EXECUTE ON FUNCTION public.get_parish_info(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_parish_info(UUID) TO anon;
GRANT EXECUTE ON FUNCTION public.get_parish_info(UUID) TO public;

-- Comentario explicativo
COMMENT ON FUNCTION public.get_parish_info IS
'Función segura para obtener información de parroquia sin problemas de RLS.
Columnas: id, name, location, diocese (solo las que existen en la tabla parishes)';

-- ============================================================================
-- VERIFICACIÓN
-- ============================================================================
-- Prueba la función con un UUID real de tu tabla parishes:
-- SELECT * FROM get_parish_info('81a66003-fd37-4f89-bacf-87e3f6197c8a');
-- ============================================================================
