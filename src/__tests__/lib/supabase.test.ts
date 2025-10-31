import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  guardarConversacion,
  guardarCatalogacion,
  subirImagen,
  obtenerCatalogo,
  obtenerCatalogoItem,
  eliminarImagen,
  obtenerUrlPublica,
} from '@/lib/supabase'
import { mockUser, mockCatalogoItem, createMockFile } from '../utils/test-utils'

// Mock del cliente Supabase (hoisted para que esté disponible en mocks)
const { mockSupabaseClient } = vi.hoisted(() => ({
  mockSupabaseClient: {
    from: vi.fn(),
    storage: {
      from: vi.fn(),
    },
  },
}))

vi.mock('@/lib/auth', () => ({
  getSupabaseBrowser: () => mockSupabaseClient,
}))

describe('Supabase Library', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('guardarConversacion', () => {
    it('should save conversation successfully', async () => {
      const mockInsert = vi.fn(() => ({
        select: vi.fn(() => Promise.resolve({
          data: [{ id: 'conv-123' }],
          error: null,
        })),
      }))

      mockSupabaseClient.from = vi.fn(() => ({
        insert: mockInsert,
      }))

      const result = await guardarConversacion(
        'user-123',
        'Test message',
        'Test response'
      )

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('conversaciones')
      expect(mockInsert).toHaveBeenCalledWith([
        expect.objectContaining({
          user_id: 'user-123',
          mensaje: 'Test message',
          respuesta: 'Test response',
        }),
      ])
      expect(result).toEqual([{ id: 'conv-123' }])
    })

    it('should return null on error', async () => {
      const mockInsert = vi.fn(() => ({
        select: vi.fn(() => Promise.resolve({
          data: null,
          error: { message: 'Database error' },
        })),
      }))

      mockSupabaseClient.from = vi.fn(() => ({
        insert: mockInsert,
      }))

      const result = await guardarConversacion(
        'user-123',
        'Test',
        'Response'
      )

      expect(result).toBeNull()
    })
  })

  describe('subirImagen', () => {
    it('should upload image to Supabase Storage', async () => {
      const mockFile = createMockFile('test.jpg', 1024 * 500)

      const mockUpload = vi.fn(() => Promise.resolve({ error: null }))
      const mockGetPublicUrl = vi.fn(() => ({
        data: { publicUrl: 'https://example.com/test.jpg' },
      }))

      mockSupabaseClient.storage.from = vi.fn(() => ({
        upload: mockUpload,
        getPublicUrl: mockGetPublicUrl,
      }))

      const result = await subirImagen(mockFile, mockUser.id)

      expect(mockSupabaseClient.storage.from).toHaveBeenCalledWith('inventario')
      expect(mockUpload).toHaveBeenCalledWith(
        expect.stringMatching(/^items\/.*\.jpg$/),
        mockFile,
        expect.objectContaining({
          cacheControl: '3600',
          upsert: true,
        })
      )
      expect(result).toEqual({
        path: expect.any(String),
        url: 'https://example.com/test.jpg',
      })
    })

    it('should fallback to API upload on storage error', async () => {
      const mockFile = createMockFile('test.jpg')

      const mockUpload = vi.fn(() => Promise.resolve({
        error: { message: 'Storage error' },
      }))

      mockSupabaseClient.storage.from = vi.fn(() => ({
        upload: mockUpload,
      }))

      // Mock fetch para /api/upload
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            url: 'https://example.com/fallback.jpg',
            path: 'items/user/fallback.jpg',
          }),
        } as Response)
      )

      const result = await subirImagen(mockFile, mockUser.id)

      expect(result).toEqual({
        url: 'https://example.com/fallback.jpg',
        path: 'items/user/fallback.jpg',
      })
    })
  })

  describe('guardarCatalogacion', () => {
    it('should save catalogacion with image', async () => {
      const mockFile = createMockFile('catalog.jpg')
      const catalogoData = {
        ...mockCatalogoItem.data,
        user_id: mockUser.id,
      }

      // Mock de subida de imagen
      const mockUpload = vi.fn(() => Promise.resolve({ error: null }))
      const mockGetPublicUrl = vi.fn(() => ({
        data: { publicUrl: 'https://example.com/catalog.jpg' },
      }))

      mockSupabaseClient.storage.from = vi.fn(() => ({
        upload: mockUpload,
        getPublicUrl: mockGetPublicUrl,
      }))

      // Mock de inserción en conversaciones
      const mockInsert = vi.fn(() => ({
        select: vi.fn(() => Promise.resolve({
          data: [{ id: 'cat-123' }],
          error: null,
        })),
      }))

      mockSupabaseClient.from = vi.fn(() => ({
        insert: mockInsert,
      }))

      const result = await guardarCatalogacion(mockUser.id, catalogoData, mockFile)

      expect(result).toEqual({ id: 'cat-123' })
      expect(mockInsert).toHaveBeenCalledWith([
        expect.objectContaining({
          user_id: mockUser.id,
          mensaje: 'Aprobación de catalogación',
        }),
      ])
    })

    it('should return error if no image provided', async () => {
      const catalogoData = {
        ...mockCatalogoItem.data,
        user_id: mockUser.id,
      }

      const result = await guardarCatalogacion(mockUser.id, catalogoData, null)

      expect(result).toEqual({
        error: 'No se puede aprobar sin fotografía adjunta.',
      })
    })

    it('should reuse existing image_url if provided', async () => {
      const catalogoData = {
        ...mockCatalogoItem.data,
        user_id: mockUser.id,
        image_url: 'https://example.com/existing.jpg',
        image_path: 'items/user/existing.jpg',
      }

      const mockInsert = vi.fn(() => ({
        select: vi.fn(() => Promise.resolve({
          data: [{ id: 'cat-456' }],
          error: null,
        })),
      }))

      mockSupabaseClient.from = vi.fn(() => ({
        insert: mockInsert,
      }))

      const result = await guardarCatalogacion(mockUser.id, catalogoData, null)

      expect(result).toEqual({ id: 'cat-456' })
      // No debería intentar subir imagen nueva
      expect(mockSupabaseClient.storage.from).not.toHaveBeenCalled()
    })
  })

  describe('obtenerCatalogo', () => {
    it('should fetch catalog items from items table', async () => {
      const mockOrder = vi.fn(() => Promise.resolve({
        data: [
          {
            id: 'item-1',
            user_id: mockUser.id,
            status: 'approved',
            image_url: 'https://example.com/img.jpg',
            data: { tipo_objeto: 'Cáliz' },
            created_at: '2024-01-01T00:00:00Z',
            approved_at: '2024-01-01T00:00:00Z',
          },
        ],
        error: null,
      }))

      const mockSelect = vi.fn(() => ({
        order: mockOrder,
      }))

      mockSupabaseClient.from = vi.fn(() => ({
        select: mockSelect,
      }))

      const result = await obtenerCatalogo()

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('items')
      expect(result).toHaveLength(1)
      expect(result[0].data.tipo_objeto).toBe('Cáliz')
    })

    it('should fallback to conversaciones table on items error', async () => {
      // Primera llamada a items falla
      const mockItemsOrder = vi.fn(() => Promise.resolve({
        data: null,
        error: { message: 'Table not found' },
      }))

      const mockItemsSelect = vi.fn(() => ({
        order: mockItemsOrder,
      }))

      // Segunda llamada a conversaciones funciona
      const mockConversacionesOrder = vi.fn(() => Promise.resolve({
        data: [
          {
            id: 'conv-1',
            user_id: mockUser.id,
            fecha: '2024-01-01T00:00:00Z',
            respuesta: JSON.stringify({
              tipo_objeto: 'Cruz procesional',
              approved_at: '2024-01-01T00:00:00Z',
              image_url: 'https://example.com/cruz.jpg',
            }),
          },
        ],
        error: null,
      }))

      const mockConversacionesSelect = vi.fn(() => ({
        order: mockConversacionesOrder,
      }))

      mockSupabaseClient.from = vi.fn((table) => ({
        select: table === 'items' ? mockItemsSelect : mockConversacionesSelect,
      }))

      const result = await obtenerCatalogo()

      expect(result).toHaveLength(1)
      expect(result[0].data.tipo_objeto).toBe('Cruz procesional')
    })

    it('should filter by user if provided', async () => {
      const mockEq = vi.fn(() => Promise.resolve({
        data: [
          {
            id: 'item-1',
            user_id: mockUser.id,
            status: 'approved',
            image_url: 'https://example.com/img.jpg',
            data: { tipo_objeto: 'Cáliz del usuario' },
            created_at: '2024-01-01T00:00:00Z',
            approved_at: '2024-01-01T00:00:00Z',
          },
        ],
        error: null,
      }))

      const mockOrder = vi.fn(() => ({
        eq: mockEq,
      }))

      const mockSelect = vi.fn(() => ({
        order: mockOrder,
      }))

      mockSupabaseClient.from = vi.fn(() => ({
        select: mockSelect,
      }))

      const result = await obtenerCatalogo(mockUser.id)

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('items')
      expect(mockEq).toHaveBeenCalledWith('user_id', mockUser.id)
      expect(result).toHaveLength(1)
      expect(result[0].user_id).toBe(mockUser.id)
    })
  })

  describe('obtenerCatalogoItem', () => {
    it('should fetch single catalog item by ID', async () => {
      const mockLimit = vi.fn(() => Promise.resolve({
        data: [
          {
            id: '550e8400-e29b-41d4-a716-446655440000',
            user_id: mockUser.id,
            status: 'approved',
            image_url: 'https://example.com/img.jpg',
            data: { tipo_objeto: 'Cáliz' },
            created_at: '2024-01-01T00:00:00Z',
            approved_at: '2024-01-01T00:00:00Z',
          },
        ],
        error: null,
      }))

      const mockEq = vi.fn(() => ({
        limit: mockLimit,
      }))

      const mockSelect = vi.fn(() => ({
        eq: mockEq,
      }))

      mockSupabaseClient.from = vi.fn(() => ({
        select: mockSelect,
      }))

      const result = await obtenerCatalogoItem('550e8400-e29b-41d4-a716-446655440000')

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('items')
      expect(mockEq).toHaveBeenCalledWith('id', '550e8400-e29b-41d4-a716-446655440000')
      expect(result?.data.tipo_objeto).toBe('Cáliz')
    })

    it('should return null if item not found', async () => {
      const mockLimit = vi.fn(() => Promise.resolve({
        data: [],
        error: null,
      }))

      const mockEq = vi.fn(() => ({
        limit: mockLimit,
      }))

      const mockSelect = vi.fn(() => ({
        eq: mockEq,
      }))

      mockSupabaseClient.from = vi.fn(() => ({
        select: mockSelect,
      }))

      const result = await obtenerCatalogoItem('non-existent')

      expect(result).toBeNull()
    })
  })

  describe('eliminarImagen', () => {
    it('should delete image from storage', async () => {
      const mockRemove = vi.fn(() => Promise.resolve({ error: null }))

      mockSupabaseClient.storage.from = vi.fn(() => ({
        remove: mockRemove,
      }))

      const result = await eliminarImagen('items/user/test.jpg')

      expect(mockSupabaseClient.storage.from).toHaveBeenCalledWith('inventario')
      expect(mockRemove).toHaveBeenCalledWith(['items/user/test.jpg'])
      expect(result).toBe(true)
    })

    it('should return false on error', async () => {
      const mockRemove = vi.fn(() => Promise.resolve({
        error: { message: 'File not found' },
      }))

      mockSupabaseClient.storage.from = vi.fn(() => ({
        remove: mockRemove,
      }))

      const result = await eliminarImagen('items/user/missing.jpg')

      expect(result).toBe(false)
    })
  })

  describe('obtenerUrlPublica', () => {
    it('should return public URL for file path', () => {
      const mockGetPublicUrl = vi.fn(() => ({
        data: { publicUrl: 'https://example.com/public/test.jpg' },
      }))

      mockSupabaseClient.storage.from = vi.fn(() => ({
        getPublicUrl: mockGetPublicUrl,
      }))

      const url = obtenerUrlPublica('items/user/test.jpg')

      expect(mockSupabaseClient.storage.from).toHaveBeenCalledWith('inventario')
      expect(mockGetPublicUrl).toHaveBeenCalledWith('items/user/test.jpg')
      expect(url).toBe('https://example.com/public/test.jpg')
    })
  })
})
