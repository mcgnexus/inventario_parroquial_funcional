import { z } from 'zod'

/**
 * Schema de validación para login
 */
export const LoginSchema = z.object({
  email: z.string().email('El email debe ser válido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
})

export type LoginData = z.infer<typeof LoginSchema>

/**
 * Schema de validación para registro
 */
export const RegisterSchema = z
  .object({
    email: z.string().email('El email debe ser válido'),
    password: z
      .string()
      .min(8, 'La contraseña debe tener al menos 8 caracteres')
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        'La contraseña debe contener al menos una mayúscula, una minúscula y un número'
      ),
    confirmPassword: z.string(),
    full_name: z.string().min(2, 'El nombre completo debe tener al menos 2 caracteres'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmPassword'],
  })

export type RegisterData = z.infer<typeof RegisterSchema>

/**
 * Schema de validación para perfil de usuario
 */
export const ProfileSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  full_name: z.string().min(2, 'El nombre completo debe tener al menos 2 caracteres'),
  role: z.enum(['admin', 'cataloger', 'viewer']).default('viewer'),
  parish_id: z.string().uuid().optional(),
  phone: z.string().max(20).optional(),
  bio: z.string().max(500, 'La biografía no puede exceder 500 caracteres').optional(),
  avatar_url: z.string().url().optional(),
  created_at: z.string().datetime().optional(),
  updated_at: z.string().datetime().optional(),
})

export type Profile = z.infer<typeof ProfileSchema>

/**
 * Schema para actualizar perfil
 */
export const ActualizarProfileSchema = ProfileSchema.partial().extend({
  id: z.string().uuid(),
})

export type ActualizarProfile = z.infer<typeof ActualizarProfileSchema>

/**
 * Schema para cambio de contraseña
 */
export const CambiarPasswordSchema = z
  .object({
    currentPassword: z.string().min(6, 'La contraseña actual es requerida'),
    newPassword: z
      .string()
      .min(8, 'La nueva contraseña debe tener al menos 8 caracteres')
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        'La contraseña debe contener al menos una mayúscula, una minúscula y un número'
      ),
    confirmNewPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmNewPassword'],
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: 'La nueva contraseña debe ser diferente a la actual',
    path: ['newPassword'],
  })

export type CambiarPassword = z.infer<typeof CambiarPasswordSchema>

/**
 * Schema para reset de contraseña (solicitud)
 */
export const ResetPasswordRequestSchema = z.object({
  email: z.string().email('El email debe ser válido'),
})

export type ResetPasswordRequest = z.infer<typeof ResetPasswordRequestSchema>

/**
 * Schema para reset de contraseña (confirmación)
 */
export const ResetPasswordConfirmSchema = z
  .object({
    token: z.string().min(1, 'El token es requerido'),
    password: z
      .string()
      .min(8, 'La contraseña debe tener al menos 8 caracteres')
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        'La contraseña debe contener al menos una mayúscula, una minúscula y un número'
      ),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmPassword'],
  })

export type ResetPasswordConfirm = z.infer<typeof ResetPasswordConfirmSchema>
