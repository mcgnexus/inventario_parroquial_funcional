'use client'

import { useState } from 'react'
import Image, { type ImageProps } from 'next/image'
import { generateBlurDataURL, isValidImageUrl } from '@/lib/image-utils'

interface OptimizedImageProps extends Omit<ImageProps, 'src' | 'alt'> {
  src: string | undefined | null
  alt: string
  fallbackSrc?: string
  fallbackText?: string
  containerClassName?: string
  onError?: () => void
}

/**
 * Componente de imagen optimizada con:
 * - Lazy loading automático
 * - Blur placeholder
 * - Fallback para errores
 * - Optimización de Next.js
 */
export default function OptimizedImage({
  src,
  alt,
  width,
  height,
  quality = 75,
  priority = false,
  loading = 'lazy',
  fallbackSrc = '/placeholder-image.svg',
  fallbackText = 'Sin imagen',
  containerClassName = '',
  className = '',
  onError,
  ...props
}: OptimizedImageProps) {
  const [error, setError] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  const handleError = () => {
    setError(true)
    setIsLoading(false)
    onError?.()
  }

  const handleLoad = () => {
    setIsLoading(false)
  }

  // Validar URL
  const isValid = isValidImageUrl(src)
  const shouldShowFallback = error || !isValid

  // Generar blur placeholder
  const blurDataURL = generateBlurDataURL(
    typeof width === 'number' ? width : 400,
    typeof height === 'number' ? height : 300
  )

  if (shouldShowFallback) {
    // Intentar mostrar fallbackSrc si existe
    if (fallbackSrc && fallbackSrc !== '/placeholder-image.svg') {
      return (
        <div className={`relative ${containerClassName}`}>
          <Image
            src={fallbackSrc}
            alt={alt}
            width={width}
            height={height}
            className={className}
            {...props}
          />
        </div>
      )
    }

    // Mostrar placeholder de texto
    return (
      <div
        className={`flex items-center justify-center bg-slate-100 ${containerClassName}`}
        style={{
          width: typeof width === 'number' ? `${width}px` : width,
          height: typeof height === 'number' ? `${height}px` : height,
        }}
      >
        <div className="text-center text-slate-400 text-sm px-4">
          <svg
            className="w-12 h-12 mx-auto mb-2 opacity-50"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          {fallbackText}
        </div>
      </div>
    )
  }

  return (
    <div className={`relative ${containerClassName}`}>
      {isLoading && (
        <div
          className="absolute inset-0 bg-slate-100 animate-pulse"
          style={{
            backgroundImage: `url("${blurDataURL}")`,
            backgroundSize: 'cover',
          }}
        />
      )}
      <Image
        src={src!}
        alt={alt}
        width={width}
        height={height}
        quality={quality}
        priority={priority}
        loading={loading}
        placeholder="blur"
        blurDataURL={blurDataURL}
        onError={handleError}
        onLoad={handleLoad}
        className={`${className} ${isLoading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}
        {...props}
      />
    </div>
  )
}
