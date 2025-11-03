-- ============================================================================
-- FIX: Crear función para contar items sin problemas de RLS
-- ============================================================================
--
-- Problema: Al contar items de una parroquia se produce error 500 por RLS
-- La consulta: SELECT COUNT(*) FROM items WHERE parish_id = 'uuid'
-- Causa recursión infinita en las políticas de seguridad
--
-- Solución: Crear función SECURITY DEFINER que evite las políticas RLS
-- ============================================================================

-- Crear función para contar items de una parroquia
CREATE OR REPLACE FUNCTION public.count_parish_items(parish_uuid UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  item_count INTEGER;
BEGIN
  SELECT COUNT(*)::INTEGER INTO item_count
  FROM public.items
  WHERE parish_id = parish_uuid;

  RETURN COALESCE(item_count, 0);
END;
$$;

-- Dar permisos de ejecución
GRANT EXECUTE ON FUNCTION public.count_parish_items(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.count_parish_items(UUID) TO anon;
GRANT EXECUTE ON FUNCTION public.count_parish_items(UUID) TO public;

-- Comentario explicativo
COMMENT ON FUNCTION public.count_parish_items IS
'Función segura para contar items de una parroquia sin problemas de RLS.
Usa SECURITY DEFINER para ejecutarse con permisos del propietario.
Retorna: número entero con la cantidad de items de la parroquia.
Uso: SELECT count_parish_items(''uuid-de-parroquia'')';

-- ============================================================================
-- VERIFICACIÓN
-- ============================================================================
-- Prueba la función con un UUID real:
-- SELECT count_parish_items('81a66003-fd37-4f89-bacf-87e3f6197c8a');
--
-- Debería devolver un número entero (0 si no hay items, >0 si hay items)
-- ============================================================================
