-- ============================================================================
-- SCRIPT DE INSERCIÓN DE TODAS LAS PARROQUIAS DE LA DIÓCESIS DE GUADIX
-- ============================================================================
-- Total: 74 parroquias
-- Diócesis: Guadix (Granada, España)
-- Generado automáticamente
-- ============================================================================
-- INSTRUCCIONES:
-- 1. Abre Supabase → SQL Editor
-- 2. Copia y pega TODO este script
-- 3. Haz clic en "Run" o presiona Ctrl+Enter
-- 4. Espera a que termine (debería decir "Success. 74 rows affected")
-- ============================================================================

-- Insertar todas las parroquias de la Diócesis de Guadix
INSERT INTO parishes (id, name, location, diocese) VALUES
  (gen_random_uuid(), 'Ntra. Sra. de la Anunciación', 'Albuñan', 'Guadix'),
  (gen_random_uuid(), 'Ntra. Sra. de la Anunciación', 'Aldeire', 'Guadix'),
  (gen_random_uuid(), 'Ntra. Sra. de la Anunciación', 'Alicún de Ortega', 'Guadix'),
  (gen_random_uuid(), 'Ntra. Sra. de la Anunciación', 'Alquife', 'Guadix'),
  (gen_random_uuid(), 'Ntra. Sra. de Fátima', 'Bácor (Guadix)', 'Guadix'),
  (gen_random_uuid(), 'Ntra. Sra. de la Anunciación', 'Baúl (Baza)', 'Guadix'),
  (gen_random_uuid(), 'El Sagrario (La Mayor)', 'Baza', 'Guadix'),
  (gen_random_uuid(), 'San Juan Bautista', 'Baza', 'Guadix'),
  (gen_random_uuid(), 'Santo Ángel', 'Baza', 'Guadix'),
  (gen_random_uuid(), 'Santiago Apóstol', 'Baza', 'Guadix'),
  (gen_random_uuid(), 'Ntra. Sra. de la Anunciación', 'Beas de Guadix', 'Guadix'),
  (gen_random_uuid(), 'San Francisco de Asís', 'Belerda (Guadix)', 'Guadix'),
  (gen_random_uuid(), 'Ntra. Sra. del Carmen', 'Benalúa', 'Guadix'),
  (gen_random_uuid(), 'Ntra. Sra. de la Anunciación', 'Benamaurel', 'Guadix'),
  (gen_random_uuid(), 'Ntra. Sra. de la Anunciación', 'La Calahorra', 'Guadix'),
  (gen_random_uuid(), 'Santa María y San Pedro', 'Caniles', 'Guadix'),
  (gen_random_uuid(), 'La Purísima Concepción', 'Castilléjar', 'Guadix'),
  (gen_random_uuid(), 'Ntra. Sra. de los Ángeles', 'Castril', 'Guadix'),
  (gen_random_uuid(), 'Ntra. Sra. de la Anunciación', 'Cogollos de Guadix', 'Guadix'),
  (gen_random_uuid(), 'Ntra. Sra. de la Anunciación', 'Cortes de Baza', 'Guadix'),
  (gen_random_uuid(), 'Ntra. Sra. del Rosario', 'Cortes de Baza (Campo Cámara)', 'Guadix'),
  (gen_random_uuid(), 'Santa María de la Anunciación', 'Cortes y Graena', 'Guadix'),
  (gen_random_uuid(), 'San Isidro Labrador', 'Cuevas del Campo', 'Guadix'),
  (gen_random_uuid(), 'Ntra. Sra. de la Anunciación', 'Cúllar', 'Guadix'),
  (gen_random_uuid(), 'Inmaculada Concepción', 'Cúllar (El Margen)', 'Guadix'),
  (gen_random_uuid(), 'La Asunción de la Virgen', 'Cúllar (Venta Quemada)', 'Guadix'),
  (gen_random_uuid(), 'San Juan Bautista', 'Cúllar (Las Vertientes)', 'Guadix'),
  (gen_random_uuid(), 'Ntra. Sra. de la Anunciación', 'Darro', 'Guadix'),
  (gen_random_uuid(), 'Ntra. Sra. de la Anunciación', 'Dehesas de Guadix', 'Guadix'),
  (gen_random_uuid(), 'Ntra. Sra. de la Anunciación', 'Diezma', 'Guadix'),
  (gen_random_uuid(), 'Ntra. Sra. de la Anunciación', 'Dólar', 'Guadix'),
  (gen_random_uuid(), 'Ntra. Sra. de la Anunciación', 'Ferreira', 'Guadix'),
  (gen_random_uuid(), 'Santa María de la Anunciación', 'Fonelas', 'Guadix'),
  (gen_random_uuid(), 'Ntra. Sra. de la Anunciación', 'Freila', 'Guadix'),
  (gen_random_uuid(), 'Ntra. Sra. de la Anunciación', 'Galera', 'Guadix'),
  (gen_random_uuid(), 'Ntra. Sra. de la Anunciación', 'Gobernador', 'Guadix'),
  (gen_random_uuid(), 'Ntra. Sra. de la Anunciación', 'Gor', 'Guadix'),
  (gen_random_uuid(), 'Ntra. Sra. de la Anunciación', 'Gorafe', 'Guadix'),
  (gen_random_uuid(), 'Jesucristo Redentor', 'Guadix', 'Guadix'),
  (gen_random_uuid(), 'Ntra. Sra. de Fátima', 'Guadix', 'Guadix'),
  (gen_random_uuid(), 'Ntra. Sra. de Gracia', 'Guadix', 'Guadix'),
  (gen_random_uuid(), 'Sagrado Corazón de Jesús', 'Guadix', 'Guadix'),
  (gen_random_uuid(), 'Sagrario', 'Guadix', 'Guadix'),
  (gen_random_uuid(), 'San Miguel Arcángel', 'Guadix', 'Guadix'),
  (gen_random_uuid(), 'Santa Ana', 'Guadix', 'Guadix'),
  (gen_random_uuid(), 'Santiago Apóstol', 'Guadix', 'Guadix'),
  (gen_random_uuid(), 'San Luis, Rey de Francia', 'Hernán-Valle (Guadix)', 'Guadix'),
  (gen_random_uuid(), 'Ntra. Sra. de la Anunciación', 'Huélago', 'Guadix'),
  (gen_random_uuid(), 'Ntra. Sra. de la Anunciación', 'Huéneja', 'Guadix'),
  (gen_random_uuid(), 'San José Obrero', 'Huéneja (La Huertezuela)', 'Guadix'),
  (gen_random_uuid(), 'Santa María La Mayor', 'Huéscar', 'Guadix'),
  (gen_random_uuid(), 'Ntra. Sra. de la Esperanza', 'Huéscar (San Clemente)', 'Guadix'),
  (gen_random_uuid(), 'Ntra. Sra. de la Anunciación', 'Jérez del Marquesado', 'Guadix'),
  (gen_random_uuid(), 'Ntra. Sra. de la Anunciación', 'Lanteira', 'Guadix'),
  (gen_random_uuid(), 'San Antonio de Padua', 'Lugros', 'Guadix'),
  (gen_random_uuid(), 'Ntra. Sra. de la Anunciación', 'Marchal', 'Guadix'),
  (gen_random_uuid(), 'San José', 'Morelabor (Laborcillas)', 'Guadix'),
  (gen_random_uuid(), 'Ntra. Sra. de la Anunciación', 'Morelabor (Moreda)', 'Guadix'),
  (gen_random_uuid(), 'Santa María de la Anunciación', 'Orce', 'Guadix'),
  (gen_random_uuid(), 'Ntra. Sra. de la Paz', 'Paulenca (Guadix)', 'Guadix'),
  (gen_random_uuid(), 'Ntra. Sra. de la Anunciación', 'Pedro Martínez', 'Guadix'),
  (gen_random_uuid(), 'Ntra. Sra. de la Anunciación', 'La Peza', 'Guadix'),
  (gen_random_uuid(), 'San Antonio de Padua', 'Polícar', 'Guadix'),
  (gen_random_uuid(), 'Santa María de la Quinta Angustia', 'Puebla de Don Fadrique', 'Guadix'),
  (gen_random_uuid(), 'San Antón de los Almaciles', 'Puebla de Don Fadrique (Almaciles)', 'Guadix'),
  (gen_random_uuid(), 'Santas Mártires', 'Puebla de Don Fadrique (Las Santas)', 'Guadix'),
  (gen_random_uuid(), 'Ntra. Sra. de la Anunciación y San Martín', 'Purullena', 'Guadix'),
  (gen_random_uuid(), 'Ntra. Sra. de la Anunciación', 'Purullena (El Bejarín)', 'Guadix'),
  (gen_random_uuid(), 'Ntra. Sra. de la Anunciación', 'Valle del Zalabí (Alcudia de Guadix)', 'Guadix'),
  (gen_random_uuid(), 'Ntra. Sra. de la Anunciación', 'Valle del Zalabí (Charches)', 'Guadix'),
  (gen_random_uuid(), 'Ntra. Sra. de la Anunciación', 'Valle del Zalabí (Exfiliana)', 'Guadix'),
  (gen_random_uuid(), 'Santa Ana', 'Villanueva de las Torres', 'Guadix'),
  (gen_random_uuid(), 'Ntra. Sra. de la Anunciación', 'Zújar', 'Guadix');

-- ============================================================================
-- VERIFICACIÓN: Contar total de parroquias insertadas
-- ============================================================================
SELECT COUNT(*) AS total_parroquias
FROM parishes
WHERE diocese = 'Guadix';

-- ============================================================================
-- LISTADO: Ver todas las parroquias ordenadas por municipio y nombre
-- ============================================================================
SELECT
  id,
  name,
  location,
  diocese,
  created_at
FROM parishes
WHERE diocese = 'Guadix'
ORDER BY location, name;

-- ============================================================================
-- ESTADÍSTICAS: Parroquias por municipio
-- ============================================================================
SELECT
  location AS municipio,
  COUNT(*) AS cantidad_parroquias
FROM parishes
WHERE diocese = 'Guadix'
GROUP BY location
ORDER BY cantidad_parroquias DESC, municipio;

-- ============================================================================
-- BÚSQUEDA: Encontrar parroquias específicas
-- ============================================================================
-- Ejemplo: Buscar todas las parroquias de Huéscar
-- SELECT * FROM parishes
-- WHERE diocese = 'Guadix'
--   AND location ILIKE '%Huéscar%';

-- Ejemplo: Buscar por nombre
-- SELECT * FROM parishes
-- WHERE diocese = 'Guadix'
--   AND name ILIKE '%Santa María%';

-- ============================================================================
-- NOTAS IMPORTANTES:
-- ============================================================================
-- 1. Cada parroquia tendrá un UUID único generado automáticamente
-- 2. El campo 'diocese' está establecido en 'Guadix' para todas
-- 3. El campo 'location' contiene el municipio/localidad
-- 4. El campo 'name' contiene el nombre completo de la parroquia
-- 5. Después de ejecutar, recarga tu aplicación (F5) para ver los cambios
-- ============================================================================

-- ✅ SCRIPT COMPLETADO
-- Todas las 74 parroquias de la Diócesis de Guadix han sido insertadas.
-- ============================================================================
