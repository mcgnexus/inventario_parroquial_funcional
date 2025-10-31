import { useState, useRef } from 'react'

export interface UseImageUploadReturn {
  imagenSeleccionada: File | null
  previewImagen: string | null
  fileInputRef: React.RefObject<HTMLInputElement | null>
  manejarSeleccionImagen: (e: React.ChangeEvent<HTMLInputElement>) => void
  limpiarImagen: () => void
}

/**
 * Hook para gestionar la carga y previsualización de imágenes
 *
 * @returns {UseImageUploadReturn} Estado y funciones para manejo de imágenes
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { imagenSeleccionada, previewImagen, manejarSeleccionImagen, limpiarImagen } = useImageUpload()
 *
 *   return (
 *     <div>
 *       <input type="file" onChange={manejarSeleccionImagen} />
 *       {previewImagen && <img src={previewImagen} alt="Preview" />}
 *     </div>
 *   )
 * }
 * ```
 */
export function useImageUpload(): UseImageUploadReturn {
  const [imagenSeleccionada, setImagenSeleccionada] = useState<File | null>(null)
  const [previewImagen, setPreviewImagen] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const manejarSeleccionImagen = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validar tipo de archivo
    if (!file.type.startsWith('image/')) {
      console.error('El archivo seleccionado no es una imagen')
      return
    }

    // Validar tamaño (10MB máximo)
    const MAX_SIZE = 10 * 1024 * 1024
    if (file.size > MAX_SIZE) {
      console.error('La imagen es demasiado grande (máximo 10MB)')
      return
    }

    setImagenSeleccionada(file)

    // Crear preview
    const reader = new FileReader()
    reader.onload = (evt) => {
      if (evt.target?.result) {
        setPreviewImagen(evt.target.result as string)
      }
    }
    reader.readAsDataURL(file)
  }

  const limpiarImagen = () => {
    setImagenSeleccionada(null)
    setPreviewImagen(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return {
    imagenSeleccionada,
    previewImagen,
    fileInputRef,
    manejarSeleccionImagen,
    limpiarImagen,
  }
}
