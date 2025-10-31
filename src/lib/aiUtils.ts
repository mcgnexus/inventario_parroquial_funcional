// Utilidades para procesar respuestas de la IA y normalizar datos de catalogación
import { CategoriaObjetoEnum, type CatalogacionIA } from '@/schemas'

/**
 * Normaliza el JSON extraído de la respuesta de IA hacia el modelo CatalogacionIA.
 * - Asegura valores por defecto en campos críticos
 * - Mapea y valida la categoría contra CategoriaObjetoEnum
 * - Combina texto libre como descripción detallada cuando está disponible
 */
// Tipo de entrada flexible procedente de la IA: todos los campos opcionales y de tipo desconocido
type ParsedIAInput = {
  tipo_objeto?: unknown
  categoria?: unknown
  descripcion_breve?: unknown
  descripcion_detallada?: unknown
  materiales?: unknown
  tecnicas?: unknown
  estilo_artistico?: unknown
  datacion_aproximada?: unknown
  siglos_estimados?: unknown
  iconografia?: unknown
  estado_conservacion?: unknown
  deterioros_visibles?: unknown
  dimensiones_estimadas?: unknown
  valor_artistico?: unknown
  observaciones?: unknown
  confianza_analisis?: unknown
  inventory_number?: unknown
}

export function normalizeCatalogacionData(parsed: ParsedIAInput, textoRespuesta: string): CatalogacionIA {
  // Helper: mapear categoría a una opción válida del enum
  const mapCategoria = (val: unknown): CatalogacionIA['categoria'] | undefined => {
    if (!val || typeof val !== 'string') return undefined
    const v = val.trim().toLowerCase()
    const opciones = CategoriaObjetoEnum.options
    const idx = opciones.map((o) => o.toLowerCase()).indexOf(v)
    if (idx >= 0) return opciones[idx]
    // heurística simple para algunas variaciones comunes
    if (v.includes('escult')) return 'escultura'
    if (v.includes('pintur')) return 'pintura'
    if (v.includes('orfebr')) return 'orfebreria'
    if (v.includes('indument') || v.includes('vestim')) return 'textil'
    if (v.includes('document')) return 'documento'
    if (v.includes('mueble')) return 'mobiliario'
    if (v.includes('cerám') || v.includes('ceram')) return 'ceramica'
    if (v.includes('textil')) return 'textil'
    return undefined
  }

  // Asegurar arrays en campos listados
  const ensureArray = (val: unknown): string[] => {
    if (Array.isArray(val)) return val.filter((x) => typeof x === 'string')
    if (typeof val === 'string') {
      return val
        .split(/[,;\n]/)
        .map((s) => s.trim())
        .filter(Boolean)
    }
    return []
  }

  // Construir estructura con defaults seguros
  const catalogacion: CatalogacionIA = {
    tipo_objeto: typeof parsed?.tipo_objeto === 'string' && parsed.tipo_objeto.trim()
      ? (parsed.tipo_objeto as string).trim()
      : 'Objeto religioso',
    categoria: mapCategoria(parsed?.categoria) || 'escultura',
    descripcion_breve:
      typeof parsed?.descripcion_breve === 'string' && (parsed.descripcion_breve as string).trim()
        ? (parsed.descripcion_breve as string).trim()
        : 'Análisis automático sin descripción breve específica.',
    descripcion_detallada:
      typeof parsed?.descripcion_detallada === 'string' && (parsed.descripcion_detallada as string).trim()
        ? (parsed.descripcion_detallada as string).trim()
        : textoRespuesta,
    materiales: ensureArray(parsed?.materiales),
    tecnicas: ensureArray(parsed?.tecnicas),
    estilo_artistico:
      typeof parsed?.estilo_artistico === 'string' ? (parsed.estilo_artistico as string) : 'Desconocido',
    datacion_aproximada:
      typeof parsed?.datacion_aproximada === 'string' ? (parsed.datacion_aproximada as string) : 'Desconocida',
    siglos_estimados:
      typeof parsed?.siglos_estimados === 'string' ? (parsed.siglos_estimados as string) : 'Sin estimación',
    iconografia: typeof parsed?.iconografia === 'string' ? (parsed.iconografia as string) : 'No determinada',
    estado_conservacion:
      typeof parsed?.estado_conservacion === 'string' ? (parsed.estado_conservacion as string) : 'Sin evaluar',
    dimensiones_estimadas:
      typeof parsed?.dimensiones_estimadas === 'string' ? (parsed.dimensiones_estimadas as string) : 'No medidas',
    valor_artistico: typeof parsed?.valor_artistico === 'string' ? (parsed.valor_artistico as string) : 'No valorado',
    observaciones: typeof parsed?.observaciones === 'string' ? (parsed.observaciones as string) : '',
    deterioros_visibles: ensureArray(parsed?.deterioros_visibles),
    confianza_analisis: (() => {
      if (typeof parsed?.confianza_analisis === 'string') {
        const v = (parsed.confianza_analisis as string).trim().toLowerCase()
        if (v === 'alta' || v === 'media' || v === 'baja') return v
        const num = parseFloat(v)
        if (!isNaN(num)) return num >= 0.75 ? 'alta' : num >= 0.5 ? 'media' : 'baja'
        return 'media'
      }
      if (typeof parsed?.confianza_analisis === 'number') {
        const num = parsed.confianza_analisis as number
        return num >= 0.75 ? 'alta' : num >= 0.5 ? 'media' : 'baja'
      }
      return 'media'
    })(),
    // Campos opcionales comunes en el proyecto; mantener si vienen
    inventory_number: typeof parsed?.inventory_number === 'string' ? (parsed.inventory_number as string) : undefined,
  }

  return catalogacion
}

/**
 * Extrae el primer bloque JSON de un texto.
 * Devuelve null si no encuentra un objeto JSON.
 */
export function extractFirstJson(texto: string): Record<string, unknown> | null {
  const match = texto.match(/\{[\s\S]*\}/)
  if (!match) return null
  try {
    return JSON.parse(match[0])
  } catch {
    return null
  }
}