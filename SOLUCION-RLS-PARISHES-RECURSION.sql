-- ============================================================================
-- SOLUCIÓN PARA RECURSIÓN INFINITA EN POLÍTICAS RLS DE PARISHES Y PROFILES
-- ============================================================================
--
-- Problema: Al intentar leer de la tabla parishes, se produce un error:
-- "infinite recursion detected in policy for relation profiles"
--
-- Solución: Crear una función SECURITY DEFINER que evite el problema de RLS
-- ============================================================================

-- Paso 1: Crear función segura para obtener información de parroquia
CREATE OR REPLACE FUNCTION public.get_parish_info(parish_uuid UUID)
RETURNS TABLE (
  id UUID,
  name TEXT,
  location TEXT,
  diocese TEXT,
  municipality TEXT,
  province TEXT
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
    p.diocese,
    p.municipality,
    p.province
  FROM public.parishes p
  WHERE p.id = parish_uuid
  LIMIT 1;
END;
$$;

-- Paso 2: Dar permisos de ejecución a todos los usuarios
GRANT EXECUTE ON FUNCTION public.get_parish_info(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_parish_info(UUID) TO anon;
GRANT EXECUTE ON FUNCTION public.get_parish_info(UUID) TO public;

-- Paso 3: Agregar comentario explicativo
COMMENT ON FUNCTION public.get_parish_info IS
'Función segura para obtener información de parroquia sin problemas de RLS.
Usa SECURITY DEFINER para ejecutarse con permisos del propietario y evitar recursión infinita en políticas.
Uso: SELECT * FROM get_parish_info(''uuid-de-parroquia'')';

-- Paso 4 (OPCIONAL): Si el problema persiste, eliminar y recrear las políticas de parishes
-- ADVERTENCIA: Solo ejecutar si el problema continúa después de crear la función

-- Eliminar políticas existentes de parishes
-- DROP POLICY IF EXISTS "read_all_parishes" ON parishes;
-- DROP POLICY IF EXISTS "read_parishes_authenticated" ON parishes;

-- Recrear política de lectura pública para parishes
-- CREATE POLICY "read_all_parishes_v2"
-- ON parishes
-- FOR SELECT
-- USING (true);

-- Paso 5 (OPCIONAL): Verificar que la función funciona correctamente
-- Ejecuta esta query para probar:
-- SELECT * FROM get_parish_info('81a66003-fd37-4f89-bacf-87e3f6197c8a');
-- (reemplaza el UUID con uno real de tu tabla parishes)

-- ============================================================================
-- NOTAS IMPORTANTES:
-- ============================================================================
--
-- 1. La función SECURITY DEFINER se ejecuta con los permisos del propietario
--    de la función (generalmente el rol postgres), por lo que evita las
--    políticas RLS que están causando la recursión.
--
-- 2. Después de ejecutar este script en Supabase, el código TypeScript en
--    src/lib/supabase.ts debe actualizarse para usar:
--
--    supabase.rpc('get_parish_info', { parish_uuid: parishId })
--
--    en lugar de:
--
--    supabase.from('parishes').select('name, location').eq('id', parishId)
--
-- 3. Esta solución es segura porque:
--    - Solo permite lectura (SELECT)
--    - Solo devuelve información básica de parroquias
--    - Las parroquias son datos públicos de solo lectura
--
-- ============================================================================
