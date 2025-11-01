-- ============================================================================
-- SCRIPT DE DIAGNÓSTICO: VERIFICAR TABLA PARISHES
-- ============================================================================
-- Usa este script para diagnosticar problemas con la tabla de parroquias
-- ============================================================================

-- 1. VERIFICAR SI LA TABLA EXISTS
SELECT EXISTS (
  SELECT FROM information_schema.tables
  WHERE table_schema = 'public'
  AND table_name = 'parishes'
) AS tabla_parishes_existe;

-- 2. CONTAR TOTAL DE PARROQUIAS
SELECT COUNT(*) AS total_parroquias
FROM parishes;

-- 3. CONTAR PARROQUIAS POR DIÓCESIS
SELECT diocese, COUNT(*) AS cantidad
FROM parishes
GROUP BY diocese
ORDER BY cantidad DESC;

-- 4. VER TODAS LAS PARROQUIAS DE GUADIX (PRIMERAS 10)
SELECT id, name, location, diocese, created_at
FROM parishes
WHERE diocese = 'Guadix'
ORDER BY created_at DESC
LIMIT 10;

-- 5. BUSCAR UN UUID ESPECÍFICO (Reemplaza con tu UUID problemático)
-- Reemplaza '81a66003-fd37-4f89-bacf-87e3f6197c8a' con el UUID que te da error
SELECT id, name, location, diocese
FROM parishes
WHERE id = '81a66003-fd37-4f89-bacf-87e3f6197c8a';

-- 6. VERIFICAR SI HAY PARROQUIAS SIN NOMBRE
SELECT id, name, location
FROM parishes
WHERE name IS NULL OR name = '';

-- 7. VERIFICAR SI HAY DUPLICADOS (MISMO NOMBRE Y UBICACIÓN)
SELECT name, location, COUNT(*) as cantidad
FROM parishes
GROUP BY name, location
HAVING COUNT(*) > 1;

-- 8. VER ESTRUCTURA DE LA TABLA
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'parishes'
ORDER BY ordinal_position;

-- 9. BUSCAR PARROQUIAS POR NOMBRE PARCIAL
-- Ejemplo: Buscar "Santa María"
SELECT id, name, location
FROM parishes
WHERE name ILIKE '%Santa María%'
ORDER BY location;

-- 10. VER LAS ÚLTIMAS PARROQUIAS INSERTADAS
SELECT id, name, location, diocese, created_at
FROM parishes
ORDER BY created_at DESC
LIMIT 20;

-- ============================================================================
-- SOLUCIONES COMUNES
-- ============================================================================

-- PROBLEMA 1: La tabla no existe
-- SOLUCIÓN: Crear la tabla
/*
CREATE TABLE IF NOT EXISTS parishes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  location TEXT,
  diocese TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
*/

-- PROBLEMA 2: La tabla está vacía
-- SOLUCIÓN: Ejecutar el script INSERT-TODAS-PARROQUIAS-GUADIX.sql

-- PROBLEMA 3: El UUID no existe
-- SOLUCIÓN: Verificar qué parroquias existen realmente
-- Ejecuta la consulta #4 arriba para ver las parroquias disponibles

-- PROBLEMA 4: Hay parroquias duplicadas
-- SOLUCIÓN: Limpiar duplicados
/*
-- ⚠️ CUIDADO: Esto elimina duplicados, mantiene solo el más antiguo
DELETE FROM parishes a
USING parishes b
WHERE a.id > b.id
  AND a.name = b.name
  AND a.location = b.location;
*/

-- ============================================================================
-- VERIFICACIÓN FINAL
-- ============================================================================
-- Ejecuta esto para ver un resumen completo:
SELECT
  'Total parroquias' AS metrica,
  COUNT(*)::TEXT AS valor
FROM parishes
UNION ALL
SELECT
  'Parroquias de Guadix',
  COUNT(*)::TEXT
FROM parishes
WHERE diocese = 'Guadix'
UNION ALL
SELECT
  'Parroquias sin nombre',
  COUNT(*)::TEXT
FROM parishes
WHERE name IS NULL OR name = ''
UNION ALL
SELECT
  'Parroquias sin ubicación',
  COUNT(*)::TEXT
FROM parishes
WHERE location IS NULL OR location = '';

-- ============================================================================
-- FIN DEL DIAGNÓSTICO
-- ============================================================================
