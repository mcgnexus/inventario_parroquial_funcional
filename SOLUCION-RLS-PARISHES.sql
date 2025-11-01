-- ============================================
-- SOLUCIÓN: Habilitar lectura pública en tabla parishes
-- ============================================

-- PROBLEMA:
-- La función obtenerParroquiaNombre() no puede leer la tabla parishes
-- porque Row Level Security (RLS) está bloqueando las consultas
-- desde el cliente del navegador.

-- CAUSA:
-- - La API /api/parishes/list usa serviceRoleKey (bypasea RLS) ✅
-- - El cliente del navegador usa anonKey (respeta RLS) ❌
-- - La tabla parishes tiene RLS activo pero sin políticas de lectura pública

-- ============================================
-- PASO 1: Verificar el estado actual de RLS
-- ============================================

-- Ver si RLS está habilitado en la tabla parishes
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public' AND tablename = 'parishes';

-- Ver las políticas actuales (si existen)
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'parishes';

-- ============================================
-- PASO 2: Habilitar lectura pública
-- ============================================

-- Opción A: Crear política que permite lectura pública
-- (Recomendado - más seguro, solo lectura)
CREATE POLICY "parishes_public_read"
ON parishes
FOR SELECT
TO public
USING (true);

-- ============================================
-- VERIFICACIÓN: Probar que funciona
-- ============================================

-- Esta consulta debería funcionar incluso sin autenticación
SELECT id, name, location FROM parishes LIMIT 5;

-- ============================================
-- ALTERNATIVA (Solo si la Opción A no funciona)
-- ============================================

-- Opción B: Deshabilitar RLS completamente
-- (NO recomendado - menos seguro)
-- ALTER TABLE parishes DISABLE ROW LEVEL SECURITY;

-- ============================================
-- ROLLBACK (si algo sale mal)
-- ============================================

-- Para eliminar la política creada:
-- DROP POLICY IF EXISTS "parishes_public_read" ON parishes;

-- Para volver a habilitar RLS (si lo deshabilitaste):
-- ALTER TABLE parishes ENABLE ROW LEVEL SECURITY;

-- ============================================
-- NOTAS IMPORTANTES
-- ============================================

/*
1. La tabla parishes solo contiene información pública (nombres de parroquias)
   por lo que es seguro permitir lectura pública.

2. Esta política solo afecta a SELECT (lectura), no a INSERT/UPDATE/DELETE.
   Solo usuarios autorizados podrán modificar datos.

3. Si tienes otras tablas con información sensible, NO copies esta política
   sin analizar las implicaciones de seguridad.

4. Después de ejecutar este script, recarga la página de inventario
   y verifica que ya no aparezca el error de UUID no encontrado.
*/
