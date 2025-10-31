/**
 * Utilidades para optimización de imágenes
 */

/**
 * Genera un placeholder blur data URL para imágenes
 * Usa un SVG simple con degradado para el efecto blur
 */
export function generateBlurDataURL(width = 400, height = 300): string {
  const svg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:rgb(226,232,240);stop-opacity:1" />
          <stop offset="100%" style="stop-color:rgb(203,213,225);stop-opacity:1" />
        </linearGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#grad)" />
    </svg>
  `

  const base64 = Buffer.from(svg).toString('base64')
  return `data:image/svg+xml;base64,${base64}`
}

/**
 * Genera un blur data URL específico para un color
 */
export function generateColorBlurDataURL(color = '#e2e8f0', width = 400, height = 300): string {
  const svg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="${color}" />
      <filter id="blur">
        <feGaussianBlur stdDeviation="20" />
      </filter>
      <rect width="100%" height="100%" fill="${color}" filter="url(#blur)" opacity="0.5" />
    </svg>
  `

  const base64 = Buffer.from(svg).toString('base64')
  return `data:image/svg+xml;base64,${base64}`
}

/**
 * Genera un shimmer loading placeholder
 */
export function generateShimmerDataURL(width = 400, height = 300): string {
  const shimmer = `
    <svg width="${width}" height="${height}" version="1.1" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="shimmer" x1="0" x2="1" y1="0" y2="0">
          <stop stop-color="#f1f5f9" offset="0%" />
          <stop stop-color="#e2e8f0" offset="50%" />
          <stop stop-color="#f1f5f9" offset="100%" />
          <animate attributeName="x1" values="-1;1" dur="1.5s" repeatCount="indefinite" />
          <animate attributeName="x2" values="0;2" dur="1.5s" repeatCount="indefinite" />
        </linearGradient>
      </defs>
      <rect width="${width}" height="${height}" fill="url(#shimmer)" />
    </svg>
  `

  const base64 = Buffer.from(shimmer).toString('base64')
  return `data:image/svg+xml;base64,${base64}`
}

/**
 * Genera dimensiones optimizadas para imágenes basadas en el contexto
 */
export function getOptimizedDimensions(context: 'thumbnail' | 'card' | 'detail' | 'fullscreen') {
  const dimensions = {
    thumbnail: { width: 150, height: 150, quality: 70 },
    card: { width: 400, height: 300, quality: 75 },
    detail: { width: 800, height: 600, quality: 80 },
    fullscreen: { width: 1920, height: 1080, quality: 85 },
  }

  return dimensions[context]
}

/**
 * Valida si una URL es válida para Next/Image
 */
export function isValidImageUrl(url: string | undefined | null): boolean {
  if (!url) return false
  try {
    const parsed = new URL(url)
    return ['http:', 'https:'].includes(parsed.protocol)
  } catch {
    return false
  }
}

/**
 * Obtiene el dominio de una URL de imagen para configuración de Next.js
 */
export function getImageDomain(url: string): string | null {
  try {
    const parsed = new URL(url)
    return parsed.hostname
  } catch {
    return null
  }
}

/**
 * Genera srcset para responsive images
 */
export function generateSrcSet(baseUrl: string, sizes: number[]): string {
  return sizes.map((size) => `${baseUrl}?w=${size} ${size}w`).join(', ')
}

/**
 * Tamaños predefinidos para responsive images
 */
export const RESPONSIVE_SIZES = {
  thumbnail: [150, 300],
  card: [400, 800],
  detail: [800, 1200, 1600],
  fullscreen: [1920, 2560],
}

/**
 * Configuración de calidad por dispositivo
 */
export const QUALITY_BY_DEVICE = {
  mobile: 70,
  tablet: 75,
  desktop: 80,
  retina: 85,
}
