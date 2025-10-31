import '@testing-library/jest-dom'
import { cleanup } from '@testing-library/react'
import { afterEach, vi } from 'vitest'

// Cleanup después de cada test
afterEach(() => {
  cleanup()
})

// Mock de variables de entorno para tests
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key'
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key'
process.env.NEXT_PUBLIC_DIFY_API_URL = 'https://api.dify.ai/v1'
process.env.NEXT_PUBLIC_DIFY_API_KEY = 'test-dify-key'

// Mock global de fetch
global.fetch = vi.fn()

// Mock de Next.js router
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}))

// Mock de Next.js Image
vi.mock('next/image', () => ({
  default: (props: unknown) => props,
}))

// Mock de window.URL.createObjectURL
global.URL.createObjectURL = vi.fn(() => 'mock-object-url')
global.URL.revokeObjectURL = vi.fn()

// Mock de FileReader
class MockFileReader {
  result: string | ArrayBuffer | null = null
  onload: ((this: FileReader, ev: ProgressEvent<FileReader>) => void) | null = null
  onloadend: ((this: FileReader, ev: ProgressEvent<FileReader>) => void) | null = null
  onerror: ((this: FileReader, ev: ProgressEvent<FileReader>) => void) | null = null

  readAsDataURL() {
    setTimeout(() => {
      this.result = 'data:image/png;base64,mock-base64-data'
      this.onload?.call(this as unknown as FileReader, {} as ProgressEvent<FileReader>)
      this.onloadend?.call(this as unknown as FileReader, {} as ProgressEvent<FileReader>)
    }, 0)
  }

  readAsArrayBuffer() {
    setTimeout(() => {
      this.result = new ArrayBuffer(8)
      this.onload?.call(this as unknown as FileReader, {} as ProgressEvent<FileReader>)
      this.onloadend?.call(this as unknown as FileReader, {} as ProgressEvent<FileReader>)
    }, 0)
  }
}

global.FileReader = MockFileReader as unknown as typeof FileReader

// Mock de Image para que onload se dispare en entorno JSDOM
class MockImage {
  onload: ((this: HTMLImageElement, ev: Event) => void) | null = null
  onerror: ((this: HTMLImageElement, ev: Event) => void) | null = null
  private _src = ''
  width = 1024
  height = 768

  set src(val: string) {
    this._src = val
    setTimeout(() => {
      this.onload?.call(this as unknown as HTMLImageElement, new Event('load'))
    }, 0)
  }
  get src() {
    return this._src
  }
}

global.Image = MockImage as unknown as typeof Image
