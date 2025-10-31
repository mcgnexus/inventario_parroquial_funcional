/**
 * Punto de entrada centralizado para todos los schemas de validación Zod
 */

// Catalogación schemas
export * from './catalogacion.schema'

// Parish schemas
export * from './parish.schema'

// Auth schemas
export * from './auth.schema'

// Upload schemas
export * from './upload.schema'

/**
 * Utilidades de validación comunes
 */
import { z } from 'zod'

/**
 * Schema para IDs UUID
 */
export const UUIDSchema = z.string().uuid('Debe ser un UUID válido')

/**
 * Schema para fechas ISO
 */
export const ISODateSchema = z.string().datetime('Debe ser una fecha válida en formato ISO')

/**
 * Schema para paginación
 */
export const PaginationSchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
  offset: z.number().int().min(0).optional(),
})

export type Pagination = z.infer<typeof PaginationSchema>

/**
 * Schema para respuestas de API genéricas
 */
export const ApiResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    success: z.boolean(),
    data: dataSchema.optional(),
    error: z.string().optional(),
    message: z.string().optional(),
  })

export type ApiResponse<T> = {
  success: boolean
  data?: T
  error?: string
  message?: string
}

/**
 * Schema para respuestas de API paginadas
 */
export const PaginatedResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    success: z.boolean(),
    data: z.array(dataSchema),
    pagination: z.object({
      page: z.number().int(),
      limit: z.number().int(),
      total: z.number().int(),
      totalPages: z.number().int(),
    }),
    error: z.string().optional(),
  })

export type PaginatedResponse<T> = {
  success: boolean
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
  error?: string
}

/**
 * Helper para crear respuestas de error
 */
export const createErrorResponse = (error: string): ApiResponse<never> => ({
  success: false,
  error,
})

/**
 * Helper para crear respuestas exitosas
 */
export const createSuccessResponse = <T>(data: T, message?: string): ApiResponse<T> => ({
  success: true,
  data,
  message,
})

/**
 * Helper para manejar errores de validación Zod
 */
export const handleZodError = (error: z.ZodError): string => {
  const errors = error.issues.map((err) => `${err.path.join('.')}: ${err.message}`)
  return errors.join(', ')
}

/**
 * Helper para validar de forma segura
 */
export const safeValidate = <T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; error: string } => {
  try {
    const validated = schema.parse(data)
    return { success: true, data: validated }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: handleZodError(error) }
    }
    return { success: false, error: 'Error de validación desconocido' }
  }
}
