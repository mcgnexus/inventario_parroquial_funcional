import { describe, it, expect } from 'vitest'
import {
  LoginSchema,
  RegisterSchema,
  ProfileSchema,
  CambiarPasswordSchema,
  ResetPasswordRequestSchema,
  ResetPasswordConfirmSchema,
} from '@/schemas/auth.schema'

describe('Auth Schemas', () => {
  describe('LoginSchema', () => {
    it('debe validar credenciales de login válidas', () => {
      const validData = {
        email: 'usuario@example.com',
        password: 'password123',
      }

      const result = LoginSchema.safeParse(validData)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.email).toBe('usuario@example.com')
        expect(result.data.password).toBe('password123')
      }
    })

    it('debe rechazar email inválido', () => {
      const invalidData = {
        email: 'not-an-email',
        password: 'password123',
      }

      const result = LoginSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('debe rechazar contraseña demasiado corta', () => {
      const invalidData = {
        email: 'usuario@example.com',
        password: '12345', // Menos de 6 caracteres
      }

      const result = LoginSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })
  })

  describe('RegisterSchema', () => {
    it('debe validar datos de registro válidos', () => {
      const validData = {
        email: 'nuevo@example.com',
        password: 'Password123',
        confirmPassword: 'Password123',
        full_name: 'Juan Pérez',
      }

      const result = RegisterSchema.safeParse(validData)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.email).toBe('nuevo@example.com')
        expect(result.data.full_name).toBe('Juan Pérez')
      }
    })

    it('debe rechazar contraseña sin mayúscula', () => {
      const invalidData = {
        email: 'nuevo@example.com',
        password: 'password123', // Sin mayúscula
        confirmPassword: 'password123',
        full_name: 'Juan Pérez',
      }

      const result = RegisterSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('debe rechazar contraseña sin número', () => {
      const invalidData = {
        email: 'nuevo@example.com',
        password: 'PasswordAbc', // Sin número
        confirmPassword: 'PasswordAbc',
        full_name: 'Juan Pérez',
      }

      const result = RegisterSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('debe rechazar contraseñas que no coinciden', () => {
      const invalidData = {
        email: 'nuevo@example.com',
        password: 'Password123',
        confirmPassword: 'Password456', // No coincide
        full_name: 'Juan Pérez',
      }

      const result = RegisterSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('debe rechazar nombre demasiado corto', () => {
      const invalidData = {
        email: 'nuevo@example.com',
        password: 'Password123',
        confirmPassword: 'Password123',
        full_name: 'J', // Solo 1 caracter
      }

      const result = RegisterSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })
  })

  describe('ProfileSchema', () => {
    it('debe validar perfil válido', () => {
      const validData = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        email: 'usuario@example.com',
        full_name: 'Juan Pérez',
        role: 'cataloger',
        parish_id: '123e4567-e89b-12d3-a456-426614174001',
      }

      const result = ProfileSchema.safeParse(validData)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.role).toBe('cataloger')
      }
    })

    it('debe rechazar rol inválido', () => {
      const invalidData = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        email: 'usuario@example.com',
        full_name: 'Juan Pérez',
        role: 'superadmin', // Rol no válido
      }

      const result = ProfileSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('debe usar role por defecto como viewer', () => {
      const data = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        email: 'usuario@example.com',
        full_name: 'Juan Pérez',
      }

      const result = ProfileSchema.safeParse(data)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.role).toBe('viewer')
      }
    })
  })

  describe('CambiarPasswordSchema', () => {
    it('debe validar cambio de contraseña válido', () => {
      const validData = {
        currentPassword: 'oldPassword123',
        newPassword: 'NewPassword456',
        confirmNewPassword: 'NewPassword456',
      }

      const result = CambiarPasswordSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('debe rechazar nueva contraseña igual a la actual', () => {
      const invalidData = {
        currentPassword: 'Password123',
        newPassword: 'Password123', // Igual a la actual
        confirmNewPassword: 'Password123',
      }

      const result = CambiarPasswordSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('debe rechazar nueva contraseña que no coincide con confirmación', () => {
      const invalidData = {
        currentPassword: 'OldPassword123',
        newPassword: 'NewPassword456',
        confirmNewPassword: 'DifferentPassword789',
      }

      const result = CambiarPasswordSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })
  })

  describe('ResetPasswordRequestSchema', () => {
    it('debe validar solicitud de reset con email válido', () => {
      const validData = {
        email: 'usuario@example.com',
      }

      const result = ResetPasswordRequestSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('debe rechazar email inválido', () => {
      const invalidData = {
        email: 'not-an-email',
      }

      const result = ResetPasswordRequestSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })
  })

  describe('ResetPasswordConfirmSchema', () => {
    it('debe validar confirmación de reset válida', () => {
      const validData = {
        token: 'abc123def456',
        password: 'NewPassword123',
        confirmPassword: 'NewPassword123',
      }

      const result = ResetPasswordConfirmSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('debe rechazar token vacío', () => {
      const invalidData = {
        token: '',
        password: 'NewPassword123',
        confirmPassword: 'NewPassword123',
      }

      const result = ResetPasswordConfirmSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('debe rechazar contraseñas que no coinciden', () => {
      const invalidData = {
        token: 'abc123def456',
        password: 'NewPassword123',
        confirmPassword: 'DifferentPassword456',
      }

      const result = ResetPasswordConfirmSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })
  })
})
