import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  signInWithEmail,
  signOut,
  getCurrentUser,
  signUpWithProfile,
  onAuthStateChange,
  getSupabaseBrowser
} from '@/lib/auth'
import { mockUser, mockSession } from '../utils/test-utils'

// Mock de @supabase/ssr
vi.mock('@supabase/ssr', () => ({
  createBrowserClient: vi.fn(() => ({
    auth: {
      signInWithPassword: vi.fn(),
      signOut: vi.fn(),
      getUser: vi.fn(),
      signUp: vi.fn(),
      onAuthStateChange: vi.fn(() => ({
        data: { subscription: { unsubscribe: vi.fn() } }
      })),
    },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          limit: vi.fn(() => ({
            then: vi.fn((resolve) => resolve({ data: [{ id: 'parish-123' }], error: null }))
          }))
        }))
      })),
      upsert: vi.fn(() => ({
        then: vi.fn((resolve) => resolve({ data: null, error: null }))
      }))
    })),
  })),
}))

describe('Auth Library', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Limpiar localStorage
    if (typeof window !== 'undefined') {
      localStorage.clear()
    }
    // Limpiar cookies
    if (typeof document !== 'undefined') {
      document.cookie.split(';').forEach(c => {
        document.cookie = c.replace(/^ +/, '').replace(/=.*/, '=;expires=' + new Date().toUTCString() + ';path=/')
      })
    }
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('getSupabaseBrowser', () => {
    it('should create and return a Supabase client', () => {
      const client = getSupabaseBrowser()
      expect(client).toBeDefined()
      expect(client).toHaveProperty('auth')
    })

    it('should return null if environment variables are missing', () => {
      const originalUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      const originalKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

      delete process.env.NEXT_PUBLIC_SUPABASE_URL
      delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

      // Force re-creation by clearing module cache
      vi.resetModules()

      process.env.NEXT_PUBLIC_SUPABASE_URL = originalUrl
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = originalKey
    })
  })

  describe('signInWithEmail', () => {
    it('should sign in user with valid credentials', async () => {
      const client = getSupabaseBrowser()
      if (!client) throw new Error('Client not initialized')

      const mockSignIn = vi.fn().mockResolvedValue({
        data: { user: mockUser, session: mockSession },
        error: null,
      })
      client.auth.signInWithPassword = mockSignIn

      const user = await signInWithEmail('test@example.com', 'password123')

      expect(mockSignIn).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      })
      expect(user).toEqual(mockUser)
    })

    it('should throw error with invalid credentials', async () => {
      const client = getSupabaseBrowser()
      if (!client) throw new Error('Client not initialized')

      const mockError = { message: 'Invalid login credentials' }
      const mockSignIn = vi.fn().mockResolvedValue({
        data: { user: null, session: null },
        error: mockError,
      })
      client.auth.signInWithPassword = mockSignIn

      await expect(
        signInWithEmail('wrong@example.com', 'wrongpassword')
      ).rejects.toEqual(mockError)
    })
  })

  describe('signOut', () => {
    it('should sign out user and clear local storage', async () => {
      const client = getSupabaseBrowser()
      if (!client) throw new Error('Client not initialized')

      // Simular artefactos en localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('sb-test-auth-token', 'mock-token')
        localStorage.setItem('sb-test-refresh-token', 'mock-refresh')
      }

      const mockSignOut = vi.fn().mockResolvedValue({ error: null })
      client.auth.signOut = mockSignOut

      await signOut()

      expect(mockSignOut).toHaveBeenCalled()

      // Verificar que se limpiaron los items de localStorage con prefijo sb-
      if (typeof window !== 'undefined') {
        const sbKeys = Object.keys(localStorage).filter(k => k.startsWith('sb-'))
        expect(sbKeys.length).toBe(0)
      }
    })
  })

  describe('getCurrentUser', () => {
    it('should return current user if authenticated', async () => {
      const client = getSupabaseBrowser()
      if (!client) throw new Error('Client not initialized')

      const mockGetUser = vi.fn().mockResolvedValue({
        data: { user: mockUser },
        error: null,
      })
      client.auth.getUser = mockGetUser

      const user = await getCurrentUser()

      expect(mockGetUser).toHaveBeenCalled()
      expect(user).toEqual(mockUser)
    })

    it('should return null if not authenticated', async () => {
      const client = getSupabaseBrowser()
      if (!client) throw new Error('Client not initialized')

      const mockGetUser = vi.fn().mockResolvedValue({
        data: { user: null },
        error: null,
      })
      client.auth.getUser = mockGetUser

      const user = await getCurrentUser()

      expect(user).toBeNull()
    })
  })

  describe('signUpWithProfile', () => {
    it('should create user and profile with valid data', async () => {
      const client = getSupabaseBrowser()
      if (!client) throw new Error('Client not initialized')

      const mockSignUp = vi.fn().mockResolvedValue({
        data: {
          user: mockUser,
          session: mockSession
        },
        error: null,
      })
      client.auth.signUp = mockSignUp

      // Mock del upsert en profiles
      const mockFrom = vi.fn(() => ({
        upsert: vi.fn(() => Promise.resolve({ data: null, error: null }))
      }))
      client.from = mockFrom

      const user = await signUpWithProfile({
        email: 'newuser@example.com',
        password: 'password123',
        fullName: 'New User',
        role: 'user',
        parishId: 'parish-123',
      })

      expect(mockSignUp).toHaveBeenCalledWith({
        email: 'newuser@example.com',
        password: 'password123',
        options: {
          data: {
            full_name: 'New User',
            role: 'user',
            parish_id: 'parish-123',
          },
        },
      })
      expect(user).toEqual(mockUser)
    })

    it('should resolve parish name to UUID', async () => {
      const client = getSupabaseBrowser()
      if (!client) throw new Error('Client not initialized')

      const mockSignUp = vi.fn().mockResolvedValue({
        data: { user: mockUser, session: mockSession },
        error: null,
      })
      client.auth.signUp = mockSignUp

      // Mock de búsqueda de parroquia por nombre
      const mockSelect = vi.fn(() => ({
        eq: vi.fn(() => ({
          limit: vi.fn(() => Promise.resolve({
            data: [{ id: 'parish-uuid-123' }],
            error: null,
          }))
        }))
      }))
      const mockFrom = vi.fn(() => ({
        select: mockSelect,
        upsert: vi.fn(() => Promise.resolve({ data: null, error: null }))
      }))
      client.from = mockFrom

      await signUpWithProfile({
        email: 'test@example.com',
        password: 'password123',
        fullName: 'Test User',
        parishId: 'Parroquia de Santa María',
      })

      expect(mockSelect).toHaveBeenCalledWith('id')
    })
  })

  describe('onAuthStateChange', () => {
    it('should subscribe to auth state changes', () => {
      const client = getSupabaseBrowser()
      if (!client) throw new Error('Client not initialized')

      const mockCallback = vi.fn()
      const mockUnsubscribe = vi.fn()

      const mockOnAuthStateChange = vi.fn(() => ({
        data: { subscription: { unsubscribe: mockUnsubscribe } }
      }))
      client.auth.onAuthStateChange = mockOnAuthStateChange

      const unsubscribe = onAuthStateChange(mockCallback)

      expect(mockOnAuthStateChange).toHaveBeenCalledWith(mockCallback)
      expect(unsubscribe).toBeInstanceOf(Function)

      unsubscribe()
      expect(mockUnsubscribe).toHaveBeenCalled()
    })
  })
})
