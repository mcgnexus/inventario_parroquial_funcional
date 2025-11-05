-- ============================================
-- RESTRICCIÓN DE ACCESO POR PARROQUIA
-- ============================================
-- Solo admin ve todo
-- Usuarios normales solo ven items de su parroquia
-- ============================================

-- 1. Verificar estructura actual
SELECT 'Verificando estructura de profiles:' as paso;
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'profiles'
  AND column_name IN ('parish_id', 'parish_name')
ORDER BY ordinal_position;

SELECT 'Verificando estructura de items:' as paso;
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'items'
  AND column_name IN ('parish_id', 'parish_name', 'user_id')
ORDER BY ordinal_position;

-- 2. Asegurar que items tiene parish_id
-- (Si no existe, lo creamos)
ALTER TABLE items ADD COLUMN IF NOT EXISTS parish_id UUID REFERENCES parishes(id);

-- 3. Actualizar RLS policies para items
-- Solo admin ve todo, usuarios solo su parroquia

-- Eliminar políticas antiguas
DROP POLICY IF EXISTS "items_select_policy" ON items;
DROP POLICY IF EXISTS "items_insert_policy" ON items;
DROP POLICY IF EXISTS "items_update_policy" ON items;
DROP POLICY IF EXISTS "items_delete_policy" ON items;

-- LECTURA: Admin ve todo, usuarios solo items de su parroquia
CREATE POLICY "items_select_policy"
ON items
FOR SELECT
TO authenticated
USING (
  -- Admin ve todo
  (auth.jwt() ->> 'email') = 'mcgnexus@gmail.com'
  OR
  -- Usuarios ven solo items de su parroquia
  (
    parish_id = (
      SELECT parish_id
      FROM profiles
      WHERE id = auth.uid()
    )
  )
);

-- INSERCIÓN: Admin puede insertar en cualquier parroquia
-- Usuarios solo en su propia parroquia
CREATE POLICY "items_insert_policy"
ON items
FOR INSERT
TO authenticated
WITH CHECK (
  -- Admin puede insertar en cualquier parroquia
  (auth.jwt() ->> 'email') = 'mcgnexus@gmail.com'
  OR
  -- Usuarios solo en su parroquia
  (
    parish_id = (
      SELECT parish_id
      FROM profiles
      WHERE id = auth.uid()
    )
    AND user_id = auth.uid()
  )
);

-- ACTUALIZACIÓN: Admin actualiza todo, usuarios solo sus items de su parroquia
CREATE POLICY "items_update_policy"
ON items
FOR UPDATE
TO authenticated
USING (
  (auth.jwt() ->> 'email') = 'mcgnexus@gmail.com'
  OR
  (
    user_id = auth.uid()
    AND parish_id = (
      SELECT parish_id
      FROM profiles
      WHERE id = auth.uid()
    )
  )
)
WITH CHECK (
  (auth.jwt() ->> 'email') = 'mcgnexus@gmail.com'
  OR
  (
    user_id = auth.uid()
    AND parish_id = (
      SELECT parish_id
      FROM profiles
      WHERE id = auth.uid()
    )
  )
);

-- ELIMINACIÓN: Solo admin
CREATE POLICY "items_delete_policy"
ON items
FOR DELETE
TO authenticated
USING (
  (auth.jwt() ->> 'email') = 'mcgnexus@gmail.com'
);

-- 4. Crear función helper para obtener parish_id del usuario actual
CREATE OR REPLACE FUNCTION get_user_parish_id()
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  user_parish UUID;
BEGIN
  SELECT parish_id INTO user_parish
  FROM profiles
  WHERE id = auth.uid();

  RETURN user_parish;
END;
$$;

-- 5. Asegurar que todos los items existentes tienen parish_id
-- Si un item tiene user_id, copiar su parish_id del perfil del usuario
UPDATE items
SET parish_id = (
  SELECT parish_id
  FROM profiles
  WHERE profiles.id = items.user_id
)
WHERE parish_id IS NULL
  AND user_id IS NOT NULL;

-- 6. Verificación final
SELECT '✅ Verificación de políticas:' as resultado;
SELECT
  schemaname,
  tablename,
  policyname
FROM pg_policies
WHERE tablename = 'items'
ORDER BY policyname;

SELECT '✅ Items sin parish_id (deberían ser 0):' as verificacion;
SELECT COUNT(*) as items_sin_parroquia
FROM items
WHERE parish_id IS NULL;

SELECT '✅ Distribución de items por parroquia:' as resumen;
SELECT
  COALESCE(p.name, 'Sin parroquia') as parroquia,
  COUNT(i.id) as total_items
FROM items i
LEFT JOIN parishes p ON i.parish_id = p.id
GROUP BY p.name
ORDER BY total_items DESC;

-- ============================================
-- INSTRUCCIONES DE USO
-- ============================================

/*

DESPUÉS DE EJECUTAR ESTE SCRIPT:

1. ADMIN (mcgnexus@gmail.com):
   - Ve TODOS los items de TODAS las parroquias
   - Puede crear/editar/eliminar cualquier item
   - Puede insertar items en cualquier parroquia

2. USUARIOS NORMALES:
   - Solo ven items de SU parroquia
   - Solo pueden crear items en SU parroquia
   - Solo pueden editar SUS items de SU parroquia
   - NO pueden eliminar items

3. IMPORTANTE:
   - Al crear un item nuevo, el sistema automáticamente asignará
     el parish_id del usuario que lo crea
   - Si un usuario no tiene parish_id, NO podrá ver ni crear items

4. PRÓXIMO PASO:
   - Hacer obligatoria la selección de parroquia en registro
   - Ver archivo: HACER_PARROQUIA_OBLIGATORIA.md

*/
