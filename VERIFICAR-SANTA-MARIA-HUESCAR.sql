-- ============================================
-- DIAGNÓSTICO: Santa María La Mayor de Huéscar
-- ============================================

-- 1. Buscar la parroquia en la base de datos (varias variantes posibles)
SELECT id, name, location, diocese
FROM parishes
WHERE
  (name ILIKE '%Santa María%' OR name ILIKE '%Santa Maria%')
  AND (location ILIKE '%Huéscar%' OR location ILIKE '%Huescar%')
ORDER BY name;

-- 2. Buscar todas las variantes de "Santa María" + "Mayor"
SELECT id, name, location, diocese
FROM parishes
WHERE
  name ILIKE '%Santa María%Mayor%'
  OR name ILIKE '%Santa Maria%Mayor%'
ORDER BY name;

-- 3. Ver TODAS las parroquias de Huéscar
SELECT id, name, location, diocese
FROM parishes
WHERE location ILIKE '%Huéscar%' OR location ILIKE '%Huescar%'
ORDER BY name;

-- 4. Contar cuántas parroquias hay en total
SELECT COUNT(*) as total_parroquias FROM parishes;

-- 5. Ver las primeras 10 parroquias para verificar el formato
SELECT id, name, location FROM parishes ORDER BY name LIMIT 10;
