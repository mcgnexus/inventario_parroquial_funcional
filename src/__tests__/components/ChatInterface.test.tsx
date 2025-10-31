import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '../utils/test-utils'
import { mockUser, mockDifyResponse, createMockFile } from '../utils/test-utils'
import * as authLib from '@/lib/auth'
import * as difyLib from '@/lib/dify'
import * as supabaseLib from '@/lib/supabase'

// Mocks hoisted para asegurar que el componente use las versiones mockeadas al importarse
const { getCurrentUserMock, onAuthStateChangeMock } = vi.hoisted(() => ({
  getCurrentUserMock: vi.fn(),
  onAuthStateChangeMock: vi.fn(),
}))

vi.mock('@/lib/auth', () => ({
  getCurrentUser: getCurrentUserMock,
  onAuthStateChange: onAuthStateChangeMock,
  getSupabaseBrowser: vi.fn(() => null),
}))
vi.mock('@/lib/dify')
vi.mock('@/lib/supabase', () => {
  const guardarConversacion = vi.fn(async () => [{ id: 'mock-row' }])
  const guardarCatalogacion = vi.fn(async () => ({ id: 'mock-id' }))
  const subirImagen = vi.fn(async () => ({ url: 'https://example.com/img.jpg', path: 'items/mock/path.jpg' }))
  const supabase = {} as unknown
  return {
    guardarConversacion,
    guardarCatalogacion,
    subirImagen,
    supabase,
  }
})

import ChatInterface from '@/components/ChatInterface'

// Hoisted mock para next/navigation para poder espiar push en tests específicos
const { mockPush } = vi.hoisted(() => ({
  mockPush: vi.fn(),
}))

describe('ChatInterface Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    // Setup default mocks
    getCurrentUserMock.mockResolvedValue(mockUser)
    onAuthStateChangeMock.mockReturnValue(() => {})

    vi.mocked(difyLib.enviarMensajeDify).mockResolvedValue(mockDifyResponse)
    vi.mocked(difyLib.enviarImagenDifyConInputArchivo).mockResolvedValue({
      ...mockDifyResponse,
      supabaseImage: {
        url: 'https://example.com/test.jpg',
        path: 'items/user/test.jpg',
      },
    })
    vi.mocked(difyLib.prepararImagen).mockImplementation((file) => Promise.resolve(file))

    vi.mocked(supabaseLib.guardarConversacion).mockResolvedValue([{ id: 'conv-123' }])
    vi.mocked(supabaseLib.guardarCatalogacion).mockResolvedValue({ id: 'cat-123' })
  })

  describe('Initial Render', () => {
    it('should render welcome screen when no messages', () => {
      render(<ChatInterface />)

      expect(screen.getByText(/Asistente de Catalogación Patrimonial/i)).toBeInTheDocument()
      expect(screen.getByText(/Suba una fotografía del objeto/i)).toBeInTheDocument()
    })

    it('should render main UI elements', () => {
      render(<ChatInterface />)

      expect(screen.getByText(/Inventario de Bienes Muebles/i)).toBeInTheDocument()
      expect(screen.getByPlaceholderText(/Descripción adicional/i)).toBeInTheDocument()
      expect(screen.getByText(/Subir Foto/i)).toBeInTheDocument()
      expect(screen.getByText(/Analizar/i)).toBeInTheDocument()
    })

    it('should show authentication status', async () => {
      render(<ChatInterface />)

      await waitFor(() => {
        expect(screen.getByText(/Autenticado como/i)).toBeInTheDocument()
        expect(
          screen.getByText((content) => content.includes(mockUser.email || ''))
        ).toBeInTheDocument()
      })
    })
  })

  describe('Image Upload', () => {
    it('should allow image upload and show preview', async () => {
      render(<ChatInterface />)

      const mockFile = createMockFile('test.jpg')
      const uploadButton = screen.getByText(/Subir Foto/i)

      // Click para abrir input file
      fireEvent.click(uploadButton)

      // Simular selección de archivo
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
      expect(fileInput).toBeInTheDocument()

      Object.defineProperty(fileInput, 'files', {
        value: [mockFile],
        writable: false,
      })

      fireEvent.change(fileInput)

      await waitFor(() => {
        expect(screen.getByText(mockFile.name)).toBeInTheDocument()
      })
    })

    it('should reject files larger than 10MB', async () => {
      render(<ChatInterface />)

      const largeFile = createMockFile('large.jpg', 15 * 1024 * 1024)
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement

      Object.defineProperty(fileInput, 'files', {
        value: [largeFile],
        writable: false,
      })

      fireEvent.change(fileInput)

      await waitFor(() => {
        expect(screen.getByText(/demasiado grande/i)).toBeInTheDocument()
      })
    })

    it('should allow removing uploaded image', async () => {
      render(<ChatInterface />)

      const mockFile = createMockFile('test.jpg')
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement

      Object.defineProperty(fileInput, 'files', {
        value: [mockFile],
        writable: false,
      })

      fireEvent.change(fileInput)

      await waitFor(() => {
        expect(screen.getByText(mockFile.name)).toBeInTheDocument()
      })

      const removeButton = screen.getByLabelText(/Quitar imagen/i)
      fireEvent.click(removeButton)

      await waitFor(() => {
        expect(screen.queryByText(mockFile.name)).not.toBeInTheDocument()
      })
    })
  })

  describe('Message Sending', () => {
    it('should send text message when clicking Analizar', async () => {
      render(<ChatInterface />)

      // Esperar a que el usuario se cargue
      await waitFor(() => {
        expect(screen.getByText(/Autenticado como/i)).toBeInTheDocument()
      })

      const textarea = screen.getByPlaceholderText(/Descripción adicional/i)
      const analyzeButton = screen.getByRole('button', { name: /Analizar/i })

      fireEvent.change(textarea, { target: { value: 'Test message' } })
      fireEvent.click(analyzeButton)

      await waitFor(() => {
        expect(difyLib.enviarMensajeDify).toHaveBeenCalledWith(
          'Test message',
          expect.any(String)
        )
      })
    })

    it('should send image with message when image is selected', async () => {
      render(<ChatInterface />)

      const mockFile = createMockFile('test.jpg')
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement

      Object.defineProperty(fileInput, 'files', {
        value: [mockFile],
        writable: false,
      })

      fireEvent.change(fileInput)

      await waitFor(() => {
        expect(screen.getByText(mockFile.name)).toBeInTheDocument()
      })

      const analyzeButton = screen.getByText(/Analizar/i)
      fireEvent.click(analyzeButton)

      await waitFor(() => {
        expect(difyLib.prepararImagen).toHaveBeenCalledWith(mockFile)
        expect(difyLib.enviarImagenDifyConInputArchivo).toHaveBeenCalled()
      })
    })

    it('should disable button while loading', async () => {
      // Asegurar que el mock respete el tipo RespuestaDify (respuesta: string)
      vi.mocked(difyLib.enviarMensajeDify).mockResolvedValue(mockDifyResponse)
      render(<ChatInterface />)

      const textarea = screen.getByPlaceholderText(/Descripción adicional/i)
      const analyzeButton = screen.getByRole('button', { name: /Analizar/i }) as HTMLButtonElement

      fireEvent.change(textarea, { target: { value: 'Test' } })
      fireEvent.click(analyzeButton)

      // Button should be disabled immediately
      expect(analyzeButton.disabled).toBe(true)

      // After the async call completes, UI will update; no need to assert re-enabled here
    })
  })

  describe('Authentication Checks', () => {
    it('should redirect to /auth if user tries to upload without authentication', async () => {
      vi.mocked(authLib.getCurrentUser).mockResolvedValue(null)

      vi.mock('next/navigation', () => ({
        useRouter: () => ({ push: mockPush }),
      }))

      render(<ChatInterface />)

      const mockFile = createMockFile('test.jpg')
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement

      Object.defineProperty(fileInput, 'files', {
        value: [mockFile],
        writable: false,
      })

      fireEvent.change(fileInput)

      await waitFor(() => {
        expect(screen.getByText(mockFile.name)).toBeInTheDocument()
      })

      const analyzeButton = screen.getByText(/Analizar/i)
      fireEvent.click(analyzeButton)

      await waitFor(() => {
        expect(screen.getByText(/iniciar sesión/i)).toBeInTheDocument()
      })
    })
  })

  describe('Catalogacion Display', () => {
    it('should display catalogacion form when AI responds', async () => {
      render(<ChatInterface />)

      const textarea = screen.getByPlaceholderText(/Descripción adicional/i)
      fireEvent.change(textarea, { target: { value: 'Analizar cáliz' } })

      const analyzeButton = screen.getByText(/Analizar/i)
      fireEvent.click(analyzeButton)

      await waitFor(() => {
        expect(screen.getByText(/Ficha de Inventario/i)).toBeInTheDocument()
      })
    })

    it('should allow editing catalogacion fields', async () => {
      render(<ChatInterface />)

      // Primero enviar mensaje para obtener catalogación
      const textarea = screen.getByPlaceholderText(/Descripción adicional/i)
      fireEvent.change(textarea, { target: { value: 'Test' } })

      const analyzeButton = screen.getByText(/Analizar/i)
      fireEvent.click(analyzeButton)

      await waitFor(() => {
        expect(screen.getByText(/Ficha de Inventario/i)).toBeInTheDocument()
      })

      // Buscar botón de editar
      const editButtons = screen.getAllByText(/Editar/i)
      const editButton = editButtons[0]
      fireEvent.click(editButton)

      await waitFor(() => {
        // Debería mostrar campos editables
        expect(screen.getAllByRole('textbox').length).toBeGreaterThan(1)
      })
    })
  })

  describe('Error Handling', () => {
    it('should display error message on API failure', async () => {
      vi.mocked(difyLib.enviarMensajeDify).mockResolvedValue({
        exito: false,
        error: 'API Error',
      })

      render(<ChatInterface />)

      const textarea = screen.getByPlaceholderText(/Descripción adicional/i)
      fireEvent.change(textarea, { target: { value: 'Test' } })

      const analyzeButton = screen.getByText(/Analizar/i)
      fireEvent.click(analyzeButton)

      await waitFor(() => {
        expect(screen.getByText(/Error al analizar/i)).toBeInTheDocument()
      })
    })
  })

  describe('Keyboard Shortcuts', () => {
    it('should send message on Enter key press', async () => {
      render(<ChatInterface />)

      const textarea = screen.getByPlaceholderText(/Descripción adicional/i)
      fireEvent.change(textarea, { target: { value: 'Test message' } })

      fireEvent.keyDown(textarea, { key: 'Enter', shiftKey: false })

      await waitFor(() => {
        expect(difyLib.enviarMensajeDify).toHaveBeenCalled()
      })
    })

    it('should NOT send message on Shift+Enter', async () => {
      render(<ChatInterface />)

      const textarea = screen.getByPlaceholderText(/Descripción adicional/i)
      fireEvent.change(textarea, { target: { value: 'Test message' } })

      fireEvent.keyDown(textarea, { key: 'Enter', shiftKey: true })

      await waitFor(() => {
        expect(difyLib.enviarMensajeDify).not.toHaveBeenCalled()
      })
    })
  })
})
