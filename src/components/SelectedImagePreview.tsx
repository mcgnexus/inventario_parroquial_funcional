'use client'

import React from 'react'
import Image from 'next/image'
import { Upload, X } from 'lucide-react'
import { generateBlurDataURL } from '@/lib/image-utils'

interface SelectedImagePreviewProps {
  previewImagen: string | null
  imagenSeleccionada: File | null
  onLimpiarImagen: () => void
}

export default function SelectedImagePreview({
  previewImagen,
  imagenSeleccionada,
  onLimpiarImagen,
}: SelectedImagePreviewProps) {
  if (!imagenSeleccionada && !previewImagen) return null

  return (
    <div className="px-5 py-3 bg-muted/50 border-t">
      <div className="flex items-center gap-3">
        <div className="relative w-16 h-16 rounded border-2 border-border overflow-hidden bg-muted flex items-center justify-center">
          {previewImagen ? (
            <Image
              src={previewImagen}
              alt="Preview de imagen seleccionada"
              fill
              sizes="64px"
              className="object-cover"
              placeholder="blur"
              blurDataURL={generateBlurDataURL(64, 64)}
              quality={75}
            />
          ) : (
            <Upload className="h-6 w-6 text-muted-foreground" />
          )}
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold">{imagenSeleccionada?.name}</p>
          <p className="text-xs text-muted-foreground">
            {imagenSeleccionada ? (imagenSeleccionada.size / 1024).toFixed(1) : 0} KB
          </p>
        </div>
        <button
          onClick={onLimpiarImagen}
          className="p-1.5 bg-destructive text-destructive-foreground rounded-full hover:bg-destructive/90 transition-colors"
          aria-label="Quitar imagen"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}