-- ============================================================================
-- Script para Insertar Parroquias en la Base de Datos
-- ============================================================================
-- Ejecutar en el SQL Editor de Supabase
-- ============================================================================

-- 1. INSERTAR SANTA MARÍA LA MAYOR DE HUÉSCAR
INSERT INTO parishes (id, name, location, diocese)
VALUES (
  gen_random_uuid(),
  'Santa María la Mayor',
  'Huéscar',
  'Guadix'
);

-- ============================================================================
-- 2. INSERTAR OTRAS PARROQUIAS COMUNES (OPCIONAL)
-- ============================================================================
-- Descomenta las que necesites:

-- INSERT INTO parishes (id, name, location, diocese)
-- VALUES
--   (gen_random_uuid(), 'Ntra. Sra. de la Anunciación', 'Galera', 'Guadix'),
--   (gen_random_uuid(), 'Santiago Apóstol', 'Baza', 'Guadix'),
--   (gen_random_uuid(), 'San Juan Bautista', 'Baza', 'Guadix'),
--   (gen_random_uuid(), 'Santa Ana', 'Guadix', 'Guadix'),
--   (gen_random_uuid(), 'Santiago Apóstol', 'Guadix', 'Guadix'),
--   (gen_random_uuid(), 'Sagrado Corazón de Jesús', 'Guadix', 'Guadix'),
--   (gen_random_uuid(), 'San Miguel Arcángel', 'Guadix', 'Guadix'),
--   (gen_random_uuid(), 'Ntra. Sra. de Gracia', 'Guadix', 'Guadix'),
--   (gen_random_uuid(), 'Sagrario', 'Guadix', 'Guadix');

-- ============================================================================
-- 3. VERIFICAR QUE SE INSERTÓ CORRECTAMENTE
-- ============================================================================
SELECT id, name, location, diocese, created_at
FROM parishes
WHERE name = 'Santa María la Mayor'
  AND location = 'Huéscar';

-- ============================================================================
-- 4. VER TODAS LAS PARROQUIAS REGISTRADAS
-- ============================================================================
SELECT id, name, location, diocese
FROM parishes
ORDER BY location, name;

-- ============================================================================
-- 5. CONTAR PARROQUIAS POR MUNICIPIO
-- ============================================================================
SELECT location, COUNT(*) as total
FROM parishes
GROUP BY location
ORDER BY location;
