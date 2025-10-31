import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  enviarMensajeDify,
  enviarImagenDifyConInputArchivo,
  comprimirImagen,
  prepararImagen,
} from '@/lib/dify'
import { createMockFile, mockDifyResponse } from '../utils/test-utils'
import axios from 'axios'

// Mock de axios
vi.mock('axios')
const mockedAxios = axios as unknown as {
  post: ReturnType<typeof vi.fn>
  isAxiosError: (error: unknown) => boolean
}

// Mock de subirImagen de supabase
vi.mock('@/lib/supabase', () => ({
  subirImagen: vi.fn(() => Promise.resolve({
    url: 'https://example.com/test.jpg',
    path: 'items/user/test.jpg',
  })),
}))

describe('Dify Library', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('enviarMensajeDify', () => {
    it('should send text message to Dify successfully', async () => {
      mockedAxios.post = vi.fn().mockResolvedValue({
        data: {
          answer: 'Test response from AI',
          conversation_id: 'conv-123',
        },
      })

      const result = await enviarMensajeDify('Test message', 'user-123')

      expect(mockedAxios.post).toHaveBeenCalledWith(
        expect.stringContaining('/chat-messages'),
        expect.objectContaining({
          query: 'Test message',
          user: 'user-123',
          response_mode: 'blocking',
        }),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': expect.stringMatching(/^Bearer /),
            'Content-Type': 'application/json',
          }),
        })
      )

      expect(result).toEqual({
        exito: true,
        respuesta: 'Test response from AI',
        conversationId: 'conv-123',
      })
    })

    it('should handle authentication error', async () => {
      mockedAxios.post = vi.fn().mockRejectedValue({
        isAxiosError: true,
        response: {
          status: 401,
          data: { message: 'Invalid API key' },
        },
      })

      mockedAxios.isAxiosError = () => true

      const result = await enviarMensajeDify('Test', 'user-123')

      expect(result.exito).toBe(false)
      expect(result.error).toContain('autenticación')
    })

    it('should handle network error', async () => {
      mockedAxios.post = vi.fn().mockRejectedValue(new Error('Network error'))

      const result = await enviarMensajeDify('Test', 'user-123')

      expect(result.exito).toBe(false)
      expect(result.error).toBeTruthy()
    })
  })

  describe('enviarImagenDifyConInputArchivo', () => {
    it('should upload image and send to Dify successfully', async () => {
      const mockFile = createMockFile('test.jpg', 1024 * 500)

      // Mock upload de archivo a Dify
      mockedAxios.post = vi.fn()
        .mockResolvedValueOnce({
          data: { id: 'file-123' },
        })
        // Mock envío de mensaje con imagen
        .mockResolvedValueOnce({
          data: {
            answer: JSON.stringify(mockDifyResponse.respuesta),
            conversation_id: 'conv-456',
          },
        })

      const result = await enviarImagenDifyConInputArchivo(
        'Analiza esta imagen',
        mockFile,
        'user-123'
      )

      expect(mockedAxios.post).toHaveBeenCalledTimes(2)

      // Verificar primera llamada: upload de archivo
      expect(mockedAxios.post).toHaveBeenNthCalledWith(
        1,
        expect.stringContaining('/files/upload'),
        expect.any(FormData),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': expect.stringMatching(/^Bearer /),
          }),
        })
      )

      // Verificar segunda llamada: mensaje con imagen
      expect(mockedAxios.post).toHaveBeenNthCalledWith(
        2,
        expect.stringContaining('/chat-messages'),
        expect.objectContaining({
          query: 'Analiza esta imagen',
          files: expect.arrayContaining([
            expect.objectContaining({
              type: 'image',
              transfer_method: 'local_file',
              upload_file_id: 'file-123',
            }),
          ]),
        }),
        expect.any(Object)
      )

      expect(result.exito).toBe(true)
      expect(result.supabaseImage).toBeDefined()
    })

    it('should handle file too large error', async () => {
      const largeMockFile = createMockFile('large.jpg', 15 * 1024 * 1024) // 15MB

      const result = await enviarImagenDifyConInputArchivo(
        'Test',
        largeMockFile,
        'user-123'
      )

      expect(result.exito).toBe(false)
      expect(result.error).toContain('grande')
    })

    it('should handle non-image file error', async () => {
      const textFile = new File(['text content'], 'test.txt', {
        type: 'text/plain',
      })

      const result = await enviarImagenDifyConInputArchivo(
        'Test',
        textFile,
        'user-123'
      )

      expect(result.exito).toBe(false)
      expect(result.error).toContain('imagen')
    })

    it('should continue if Supabase upload fails but Dify succeeds', async () => {
      const mockFile = createMockFile('test.jpg')

      // Mock de supabase que falla
      const { subirImagen } = await import('@/lib/supabase')
      vi.mocked(subirImagen).mockResolvedValueOnce(null)

      // Mock de Dify que funciona
      mockedAxios.post = vi.fn()
        .mockResolvedValueOnce({
          data: { id: 'file-789' },
        })
        .mockResolvedValueOnce({
          data: {
            answer: 'Analysis result',
            conversation_id: 'conv-789',
          },
        })

      const result = await enviarImagenDifyConInputArchivo(
        'Test',
        mockFile,
        'user-123'
      )

      expect(result.exito).toBe(true)
      expect(result.supabaseImage).toBeNull()
    })
  })

  describe('comprimirImagen', () => {
    it('should return original file if under max size', async () => {
      const smallFile = createMockFile('small.jpg', 1024 * 500) // 500KB

      const result = await comprimirImagen(smallFile, 10 * 1024 * 1024)

      expect(result).toBe(smallFile)
    })

    it('should compress image if over max size', async () => {
      const largeFile = createMockFile('large.jpg', 15 * 1024 * 1024) // 15MB

      // Mock de canvas y blob
      const mockCanvas = {
        width: 0,
        height: 0,
        getContext: vi.fn(() => ({
          imageSmoothingEnabled: true,
          imageSmoothingQuality: 'high',
          drawImage: vi.fn(),
        })),
        toBlob: vi.fn((callback) => {
          const blob = new Blob(['compressed'], { type: 'image/jpeg' })
          callback(blob)
        }),
      }

      global.document.createElement = vi.fn((tagName) => {
        if (tagName === 'canvas') return mockCanvas as unknown as HTMLCanvasElement
        return {} as HTMLElement
      })

      const result = await comprimirImagen(largeFile, 10 * 1024 * 1024)

      expect(result).toBeInstanceOf(File)
      expect(result.size).toBeLessThan(largeFile.size)
    })
  })

  describe('prepararImagen', () => {
    it('should validate and return valid image', async () => {
      const validFile = createMockFile('valid.jpg', 5 * 1024 * 1024)

      const result = await prepararImagen(validFile)

      expect(result).toBe(validFile)
    })

    it('should reject non-image file', async () => {
      const textFile = new File(['text'], 'test.txt', { type: 'text/plain' })

      await expect(prepararImagen(textFile)).rejects.toThrow('imagen')
    })

    it('should reject unsupported extension', async () => {
      const bmpFile = new File(['bmp data'], 'test.bmp', { type: 'image/bmp' })

      await expect(prepararImagen(bmpFile)).rejects.toThrow('Formato no permitido')
    })

    it('should compress if file is too large', async () => {
      const largeFile = createMockFile('large.jpg', 15 * 1024 * 1024)

      // Mock comprimirImagen (se simula vía canvas/toBlob más abajo)

      // Necesitamos mockear la función comprimirImagen internamente
      const mockCanvas = {
        width: 0,
        height: 0,
        getContext: vi.fn(() => ({
          imageSmoothingEnabled: true,
          imageSmoothingQuality: 'high',
          drawImage: vi.fn(),
        })),
        toBlob: vi.fn((callback) => {
          const blob = new Blob(['compressed'], { type: 'image/jpeg' })
          callback(blob)
        }),
      }

      global.document.createElement = vi.fn((tagName) => {
        if (tagName === 'canvas') return mockCanvas as unknown as HTMLCanvasElement
        return {} as HTMLElement
      })

      const result = await prepararImagen(largeFile)

      expect(result).toBeInstanceOf(File)
    })
  })
})
