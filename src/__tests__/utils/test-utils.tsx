import { ReactElement } from 'react'
import { render, RenderOptions } from '@testing-library/react'
import type { User, Session } from '@supabase/supabase-js'

// Mock de usuario autenticado
export const mockUser: User = {
  id: '123e4567-e89b-12d3-a456-426614174000',
  aud: 'authenticated',
  role: 'authenticated',
  email: 'test@example.com',
  email_confirmed_at: '2024-01-01T00:00:00Z',
  phone: '',
  confirmed_at: '2024-01-01T00:00:00Z',
  last_sign_in_at: '2024-01-01T00:00:00Z',
  app_metadata: {},
  user_metadata: { full_name: 'Test User' },
  identities: [],
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
}

export const mockSession: Session = {
  access_token: 'mock-access-token',
  refresh_token: 'mock-refresh-token',
  expires_in: 3600,
  expires_at: Date.now() / 1000 + 3600,
  token_type: 'bearer',
  user: mockUser,
}

// Mock de item de catálogo
export const mockCatalogoItem = {
  id: 'item-123',
  user_id: mockUser.id,
  fecha: '2024-01-01T00:00:00Z',
  data: {
    user_id: mockUser.id,
    tipo_objeto: 'Cáliz',
    categoria: 'orfebreria',
    descripcion_breve: 'Cáliz barroco de plata',
    descripcion_detallada: 'Cáliz de plata con decoración vegetal del siglo XVIII',
    materiales: ['plata', 'oro'],
    tecnicas: ['cincelado', 'repujado'],
    estilo_artistico: 'Barroco',
    datacion_aproximada: 'Siglo XVIII',
    siglos_estimados: 'XVIII',
    iconografia: 'Motivos eucarísticos',
    estado_conservacion: 'bueno',
    deterioros_visibles: ['pequeños arañazos'],
    dimensiones_estimadas: '25 cm de altura',
    valor_artistico: 'alto',
    observaciones: 'Pieza de gran valor histórico',
    confianza_analisis: 'alta',
    inventory_number: 'SMA-2024-ORF-001',
    location: 'Sacristía principal',
    parish_id: 'parish-123',
    image_url: 'https://example.com/image.jpg',
  },
}

// Mock de respuesta de Dify
export const mockDifyResponse = {
  exito: true,
  respuesta: JSON.stringify({
    tipo_objeto: 'Cáliz',
    categoria: 'orfebreria',
    descripcion_breve: 'Cáliz barroco de plata',
    descripcion_detallada: 'Cáliz de plata con decoración vegetal',
    materiales: ['plata'],
    tecnicas: ['cincelado'],
    estilo_artistico: 'Barroco',
    datacion_aproximada: 'Siglo XVIII',
    siglos_estimados: 'XVIII',
    iconografia: 'Motivos eucarísticos',
    estado_conservacion: 'bueno',
    deterioros_visibles: [],
    dimensiones_estimadas: '25 cm',
    valor_artistico: 'alto',
    observaciones: '',
    confianza_analisis: 'alta',
  }),
  conversationId: 'conv-123',
}

// Mock de File para tests
export function createMockFile(
  name: string = 'test-image.jpg',
  size: number = 1024 * 1024,
  type: string = 'image/jpeg'
): File {
  // Crear un Blob del tamaño solicitado para que File.size respete el parámetro
  const data = new Uint8Array(size)
  const blob = new Blob([data], { type })
  return new File([blob], name, { type, lastModified: Date.now() })
}

// Wrapper personalizado para render
function customRender(
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) {
  return render(ui, { ...options })
}

export * from '@testing-library/react'
export { customRender as render }
