-- Función para obtener información de parroquia sin problemas de RLS
-- Esta función evita la recursión infinita en las políticas de seguridad

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

-- Dar permisos de ejecución a usuarios autenticados
GRANT EXECUTE ON FUNCTION public.get_parish_info(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_parish_info(UUID) TO anon;

-- Comentario explicativo
COMMENT ON FUNCTION public.get_parish_info IS
'Función segura para obtener información de parroquia sin problemas de RLS.
Usa SECURITY DEFINER para ejecutarse con permisos del propietario y evitar recursión infinita en políticas.';
