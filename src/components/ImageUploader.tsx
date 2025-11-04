'use client'

import React from 'react'
import { Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ImageUploaderProps {
  fileInputRef: React.RefObject<HTMLInputElement | null>
  onSeleccionImagen: (e: React.ChangeEvent<HTMLInputElement>) => void
  disabled?: boolean
  showUploadButton?: boolean
}

export default function ImageUploader({
  fileInputRef,
  onSeleccionImagen,
  disabled = false,
  showUploadButton = true,
}: ImageUploaderProps) {
  return (
    <>
      {/* Input oculto de archivo */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={onSeleccionImagen}
        className="hidden"
      />

      {/* Botón de subir */}
      {showUploadButton && (
        <Button
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled}
          variant="default"
          size="default"
          className="gap-2 whitespace-nowrap bg-amber-600 hover:bg-amber-700 text-white"
        >
          <Upload className="h-5 w-5" />
          <span>Subir Foto</span>
        </Button>
      )}
    </>
  )
}
