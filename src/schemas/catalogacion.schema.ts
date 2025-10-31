import { z } from 'zod'

/**
 * Schema de validación para imágenes de catálogo
 */
export const CatalogImageSchema = z.object({
  url: z.string().url('La URL de la imagen debe ser válida'),
  path: z.string().min(1, 'El path de la imagen es requerido'),
  alt: z.string().optional(),
  order: z.number().int().min(0).optional(),
})

export type CatalogImage = z.infer<typeof CatalogImageSchema>

/**
 * Categorías válidas de objetos
 */
export const CategoriaObjetoEnum = z.enum([
  'pintura',
  'escultura',
  'orfebreria',
  'textil',
  'documento',
  'libro',
  'mobiliario',
  'instrumento_musical',
  'retablo',
  'imagineria',
  'vitral',
  'ceramica',
  'metalurgia',
  'otro',
])

export type CategoriaObjeto = z.infer<typeof CategoriaObjetoEnum>

/**
 * Estados de conservación válidos
 */
export const EstadoConservacionEnum = z.enum([
  'excelente',
  'bueno',
  'regular',
  'malo',
  'critico',
  'restaurado',
  'en_restauracion',
])

export type EstadoConservacion = z.infer<typeof EstadoConservacionEnum>

/**
 * Estados de publicación
 */
export const StatusEnum = z.enum([
  'draft',
  'pending',
  'approved',
  'published',
  'archived',
])

export type Status = z.infer<typeof StatusEnum>

/**
 * Schema base para catalogación (campos requeridos por IA)
 */
export const CatalogacionIASchema = z.object({
  tipo_objeto: z.string().min(1, 'El tipo de objeto es requerido'),
  categoria: CategoriaObjetoEnum,
  descripcion_breve: z
    .string()
    .min(10, 'La descripción breve debe tener al menos 10 caracteres')
    .max(500, 'La descripción breve no puede exceder 500 caracteres'),
  descripcion_detallada: z
    .string()
    .min(20, 'La descripción detallada debe tener al menos 20 caracteres')
    .max(5000, 'La descripción detallada no puede exceder 5000 caracteres'),
  materiales: z
    .array(z.string().min(1))
    .min(1, 'Debe especificar al menos un material')
    .max(20, 'No puede haber más de 20 materiales'),
  tecnicas: z
    .array(z.string().min(1))
    .min(1, 'Debe especificar al menos una técnica')
    .max(20, 'No puede haber más de 20 técnicas'),
  estilo_artistico: z.string().min(1, 'El estilo artístico es requerido'),
  datacion_aproximada: z.string().min(1, 'La datación aproximada es requerida'),
  siglos_estimados: z.string().min(1, 'Los siglos estimados son requeridos'),
  iconografia: z.string().min(1, 'La iconografía es requerida'),
  estado_conservacion: z.string().min(1, 'El estado de conservación es requerido'),
  deterioros_visibles: z
    .array(z.string().min(1))
    .max(50, 'No puede haber más de 50 deterioros'),
  dimensiones_estimadas: z.string().min(1, 'Las dimensiones estimadas son requeridas'),
  valor_artistico: z.string().min(1, 'El valor artístico es requerido'),
  observaciones: z.string(),
  confianza_analisis: z
    .string()
    .regex(/^(alta|media|baja)$/, 'La confianza debe ser alta, media o baja'),
  inventory_number: z.string().optional(),
  location: z.string().optional(),
  parish_id: z.string().uuid('El ID de parroquia debe ser un UUID válido').optional(),
})

export type CatalogacionIA = z.infer<typeof CatalogacionIASchema>

/**
 * Schema completo para catalogación guardada en base de datos
 */
export const CatalogacionCompletaSchema = CatalogacionIASchema.extend({
  user_id: z.string().uuid('El ID de usuario debe ser un UUID válido'),
  parish_id: z.string().uuid('El ID de parroquia debe ser un UUID válido').optional(),
  parish_name: z.string().optional(),
  inventory_number: z.string().optional(),
  location: z.string().optional(),
  image_url: z.string().url().optional(),
  image_path: z.string().optional(),
  images: z.array(CatalogImageSchema).optional(),
  // Campos adicionales opcionales
  name: z.string().optional(),
  author: z.string().optional(),
  autor: z.string().optional(),
  localizacion_actual: z.string().optional(),
  published_at: z.string().datetime().optional(),
  approved_at: z.string().datetime().optional(),
  status: StatusEnum.optional(),
})

export type CatalogacionCompleta = z.infer<typeof CatalogacionCompletaSchema>

/**
 * Schema para crear una nueva catalogación (sin user_id, se obtiene del servidor)
 */
export const CrearCatalogacionSchema = CatalogacionIASchema.extend({
  parish_id: z.string().uuid('El ID de parroquia debe ser un UUID válido'),
  inventory_number: z.string().optional(),
  location: z.string().optional(),
  image_url: z.string().url().optional(),
  image_path: z.string().optional(),
})

export type CrearCatalogacion = z.infer<typeof CrearCatalogacionSchema>

/**
 * Schema para actualizar una catalogación existente
 */
export const ActualizarCatalogacionSchema = CatalogacionIASchema.partial().extend({
  id: z.string().uuid('El ID debe ser un UUID válido'),
})

export type ActualizarCatalogacion = z.infer<typeof ActualizarCatalogacionSchema>

/**
 * Schema para filtros de búsqueda de catalogaciones
 */
export const FiltrosCatalogacionSchema = z.object({
  parish_id: z.string().uuid().optional(),
  categoria: CategoriaObjetoEnum.optional(),
  estado_conservacion: EstadoConservacionEnum.optional(),
  status: StatusEnum.optional(),
  search: z.string().optional(),
  limit: z.number().int().min(1).max(100).default(20),
  offset: z.number().int().min(0).default(0),
  order_by: z.enum(['created_at', 'updated_at', 'inventory_number']).default('created_at'),
  order_direction: z.enum(['asc', 'desc']).default('desc'),
})

export type FiltrosCatalogacion = z.infer<typeof FiltrosCatalogacionSchema>
