import { z } from 'zod'

/**
 * Schema de validación para parroquias
 */
export const ParishSchema = z.object({
  id: z.string().uuid('El ID debe ser un UUID válido'),
  name: z
    .string()
    .min(1, 'El nombre de la parroquia es requerido')
    .max(200, 'El nombre no puede exceder 200 caracteres'),
  diocese: z.string().max(200, 'La diócesis no puede exceder 200 caracteres').optional(),
  location: z.string().max(500, 'La ubicación no puede exceder 500 caracteres').optional(),
  municipality: z.string().max(200, 'El municipio no puede exceder 200 caracteres').optional(),
  province: z.string().max(200, 'La provincia no puede exceder 200 caracteres').optional(),
  postal_code: z.string().max(10, 'El código postal no puede exceder 10 caracteres').optional(),
  phone: z.string().max(20, 'El teléfono no puede exceder 20 caracteres').optional(),
  email: z.string().email('El email debe ser válido').optional(),
  website: z.string().url('El sitio web debe ser una URL válida').optional(),
  description: z
    .string()
    .max(2000, 'La descripción no puede exceder 2000 caracteres')
    .optional(),
  foundation_date: z.string().optional(),
  patron_saint: z.string().max(200, 'El santo patrono no puede exceder 200 caracteres').optional(),
  created_at: z.string().datetime().optional(),
  updated_at: z.string().datetime().optional(),
})

export type Parish = z.infer<typeof ParishSchema>

/**
 * Schema para crear una nueva parroquia
 */
export const CrearParishSchema = ParishSchema.omit({
  id: true,
  created_at: true,
  updated_at: true,
})

export type CrearParish = z.infer<typeof CrearParishSchema>

/**
 * Schema para actualizar una parroquia
 */
export const ActualizarParishSchema = ParishSchema.partial().extend({
  id: z.string().uuid('El ID debe ser un UUID válido'),
})

export type ActualizarParish = z.infer<typeof ActualizarParishSchema>

/**
 * Schema simplificado para lista de parroquias (usado en selects)
 */
export const ParishListItemSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  municipality: z.string().optional(),
  province: z.string().optional(),
})

export type ParishListItem = z.infer<typeof ParishListItemSchema>
