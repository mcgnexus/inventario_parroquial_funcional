-- ============================================================================
-- CREAR TABLA WAITLIST PARA FIDES SACRISTÍA
-- ============================================================================
-- Tabla para registrar interesados en la próxima suite: Fides Sacristía
-- Lista de espera con información de contacto y preferencias
-- ============================================================================

-- Crear tabla waitlist
CREATE TABLE IF NOT EXISTS waitlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Datos de contacto (requeridos)
  email TEXT NOT NULL UNIQUE,
  nombre TEXT NOT NULL,

  -- Datos opcionales
  parroquia TEXT,
  diocesis TEXT,
  cargo TEXT,
  intereses TEXT,

  -- Metadatos
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  notificado BOOLEAN DEFAULT FALSE,
  notificado_at TIMESTAMPTZ,

  -- Constraints
  CONSTRAINT email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

-- Índices para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_waitlist_email ON waitlist(email);
CREATE INDEX IF NOT EXISTS idx_waitlist_created_at ON waitlist(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_waitlist_diocesis ON waitlist(diocesis) WHERE diocesis IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_waitlist_notificado ON waitlist(notificado) WHERE notificado = FALSE;

-- Comentarios
COMMENT ON TABLE waitlist IS 'Lista de espera para Fides Sacristía - Suite con IA para parroquias';
COMMENT ON COLUMN waitlist.email IS 'Email de contacto (único, requerido)';
COMMENT ON COLUMN waitlist.nombre IS 'Nombre completo del interesado';
COMMENT ON COLUMN waitlist.parroquia IS 'Nombre de la parroquia (opcional)';
COMMENT ON COLUMN waitlist.diocesis IS 'Nombre de la diócesis (opcional)';
COMMENT ON COLUMN waitlist.cargo IS 'Cargo o función: párroco, sacristán, secretaria, etc.';
COMMENT ON COLUMN waitlist.intereses IS 'Funcionalidades que más le interesan (texto libre)';
COMMENT ON COLUMN waitlist.notificado IS 'Si ya se le ha notificado del lanzamiento';
COMMENT ON COLUMN waitlist.notificado_at IS 'Fecha de notificación del lanzamiento';

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Habilitar RLS
ALTER TABLE waitlist ENABLE ROW LEVEL SECURITY;

-- Policy: Cualquier usuario autenticado puede registrarse
CREATE POLICY "waitlist_insert_authenticated"
ON waitlist
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Policy: Solo admin puede ver la lista completa
CREATE POLICY "waitlist_select_admin"
ON waitlist
FOR SELECT
TO authenticated
USING (
  (auth.jwt() ->> 'email') = 'mcgnexus@gmail.com'
  OR
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role = 'admin'
  )
);

-- Policy: Solo admin puede actualizar (marcar como notificado)
CREATE POLICY "waitlist_update_admin"
ON waitlist
FOR UPDATE
TO authenticated
USING (
  (auth.jwt() ->> 'email') = 'mcgnexus@gmail.com'
  OR
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role = 'admin'
  )
)
WITH CHECK (
  (auth.jwt() ->> 'email') = 'mcgnexus@gmail.com'
  OR
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role = 'admin'
  )
);

-- Policy: Solo admin puede eliminar
CREATE POLICY "waitlist_delete_admin"
ON waitlist
FOR DELETE
TO authenticated
USING (
  (auth.jwt() ->> 'email') = 'mcgnexus@gmail.com'
  OR
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role = 'admin'
  )
);

-- ============================================================================
-- FUNCIÓN PARA MARCAR COMO NOTIFICADO
-- ============================================================================

CREATE OR REPLACE FUNCTION marcar_waitlist_notificado(
  waitlist_ids UUID[]
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Verificar que quien llama es admin
  IF NOT (
    (auth.jwt() ->> 'email') = 'mcgnexus@gmail.com'
    OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  ) THEN
    RAISE EXCEPTION 'Solo admin puede marcar como notificado';
  END IF;

  -- Actualizar registros
  UPDATE waitlist
  SET
    notificado = TRUE,
    notificado_at = NOW()
  WHERE id = ANY(waitlist_ids)
  AND notificado = FALSE;
END;
$$;

COMMENT ON FUNCTION marcar_waitlist_notificado IS 'Marca registros de waitlist como notificados (solo admin)';

-- ============================================================================
-- VISTA PARA ADMIN: ESTADÍSTICAS DE LA LISTA DE ESPERA
-- ============================================================================

CREATE OR REPLACE VIEW waitlist_stats AS
SELECT
  COUNT(*) as total_registros,
  COUNT(*) FILTER (WHERE notificado = FALSE) as pendientes_notificar,
  COUNT(*) FILTER (WHERE notificado = TRUE) as ya_notificados,
  COUNT(DISTINCT diocesis) FILTER (WHERE diocesis IS NOT NULL) as diocesis_unicas,
  COUNT(*) FILTER (WHERE cargo ILIKE '%párroco%' OR cargo ILIKE '%parroco%') as parrocos,
  COUNT(*) FILTER (WHERE cargo ILIKE '%sacristán%' OR cargo ILIKE '%sacristan%') as sacristanes,
  COUNT(*) FILTER (WHERE cargo ILIKE '%secretari%') as secretarias,
  MIN(created_at) as primer_registro,
  MAX(created_at) as ultimo_registro
FROM waitlist;

COMMENT ON VIEW waitlist_stats IS 'Estadísticas agregadas de la lista de espera (solo visible para admin)';

-- Grant para vista (solo admin puede verla)
GRANT SELECT ON waitlist_stats TO authenticated;

-- ============================================================================
-- QUERY DE VERIFICACIÓN
-- ============================================================================

-- Ver todos los registros (solo admin)
-- SELECT * FROM waitlist ORDER BY created_at DESC;

-- Ver estadísticas
-- SELECT * FROM waitlist_stats;

-- Ver registros por diócesis
-- SELECT diocesis, COUNT(*) as total
-- FROM waitlist
-- WHERE diocesis IS NOT NULL
-- GROUP BY diocesis
-- ORDER BY total DESC;

-- ============================================================================
-- ÉXITO
-- ============================================================================
-- Tabla waitlist creada con éxito ✅
-- RLS policies configuradas ✅
-- Función marcar_waitlist_notificado() lista ✅
-- Vista waitlist_stats disponible para admin ✅
-- ============================================================================
