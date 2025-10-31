'use client'

import React from 'react'
import Image from 'next/image'
import { Upload, X } from 'lucide-react'
import { generateBlurDataURL } from '@/lib/image-utils'

interface ImageUploaderProps {
  fileInputRef: React.RefObject<HTMLInputElement | null>
  previewImagen: string | null
  imagenSeleccionada: File | null
  onSeleccionImagen: (e: React.ChangeEvent<HTMLInputElement>) => void
  onLimpiarImagen: () => void
  disabled?: boolean
}

export default function ImageUploader({
  fileInputRef,
  previewImagen,
  imagenSeleccionada,
  onSeleccionImagen,
  onLimpiarImagen,
  disabled = false,
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
      <button
        onClick={() => fileInputRef.current?.click()}
        disabled={disabled}
        className="px-4 py-2 bg-amber-600 text-white rounded-lg font-semibold hover:bg-amber-700 disabled:bg-slate-300 flex items-center gap-2 shadow-sm"
      >
        <Upload className="h-5 w-5" /> Subir Foto
      </button>

      {/* Preview de imagen optimizado */}
      {previewImagen && (
        <div className="px-5 py-3 bg-slate-50 border-t border-slate-200">
          <div className="flex items-center gap-3">
            <div className="relative w-16 h-16 rounded border-2 border-slate-300 overflow-hidden bg-slate-100">
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
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-slate-800">{imagenSeleccionada?.name}</p>
              <p className="text-xs text-slate-600">
                {imagenSeleccionada ? (imagenSeleccionada.size / 1024).toFixed(1) : 0} KB
              </p>
            </div>
            <button
              onClick={onLimpiarImagen}
              className="p-1.5 bg-red-600 text-white rounded-full hover:bg-red-700"
              aria-label="Quitar imagen"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </>
  )
}
