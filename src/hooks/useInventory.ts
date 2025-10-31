import { useState, useCallback } from 'react'
import { guardarCatalogacion, type CatalogacionCompleta } from '@/lib/supabase'
import { getCurrentUser } from '@/lib/auth'
import { useAuth } from './useAuth'
import { useImageUpload } from './useImageUpload'
import { useCatalogacionEditor } from './useCatalogacionEditor'
import { useAIAnalysis, type CatalogacionIA, type Mensaje } from './useAIAnalysis'

// Re-export types for backward compatibility
export type { CatalogacionIA, Mensaje } from './useAIAnalysis'

export interface UseInventoryReturn {
  // Estado
  mensaje: string
  conversacion: Mensaje[]
  cargando: boolean
  guardando: boolean
  error: string | null
  imagenSeleccionada: File | null
  previewImagen: string | null
  editandoId: string | null
  catalogacionEditada: CatalogacionIA | null
  usuario: { id: string; email?: string | null } | null

  // Refs
  mensajesEndRef: React.RefObject<HTMLDivElement | null>
  fileInputRef: React.RefObject<HTMLInputElement | null>

  // Acciones
  setMensaje: (mensaje: string) => void
  manejarSeleccionImagen: (e: React.ChangeEvent<HTMLInputElement>) => void
  limpiarImagen: () => void
  analizarObjeto: () => Promise<void>
  manejarKeyPress: (e: React.KeyboardEvent) => void
  iniciarEdicion: (mensajeId: string, cat: CatalogacionIA) => void
  cancelarEdicion: () => void
  guardarEdicion: (mensajeId: string) => void
  actualizarCampo: <K extends keyof CatalogacionIA>(campo: K, valor: CatalogacionIA[K]) => void
  actualizarArray: (campo: 'materiales' | 'tecnicas' | 'deterioros_visibles', texto: string) => void
  aprobarCatalogacion: (cat: CatalogacionIA, mensajeId?: string) => Promise<void>
}

/**
 * Hook principal para gestionar el inventario
 * Orquesta múltiples sub-hooks especializados:
 * - useAuth: autenticación
 * - useImageUpload: gestión de imágenes
 * - useCatalogacionEditor: edición de catalogaciones
 * - useAIAnalysis: análisis con IA
 */
export function useInventory(): UseInventoryReturn {
  const [mensaje, setMensaje] = useState('')
  const [guardando, setGuardando] = useState(false)

  // Sub-hooks especializados
  const usuario = useAuth()
  const {
    imagenSeleccionada,
    previewImagen,
    fileInputRef,
    manejarSeleccionImagen,
    limpiarImagen,
  } = useImageUpload()

  const {
    editandoId,
    catalogacionEditada,
    iniciarEdicion,
    cancelarEdicion,
    guardarEdicion: guardarEdicionHook,
    actualizarCampo,
    actualizarArray,
  } = useCatalogacionEditor()

  const {
    conversacion,
    cargando,
    error,
    mensajesEndRef,
    setError,
    actualizarMensaje,
    analizarObjeto: analizarObjetoHook,
  } = useAIAnalysis()

  // Wrapper para analizarObjeto que no necesita parámetros
  const analizarObjeto = useCallback(async () => {
    // Resolver usuario en línea para evitar bloqueo temprano en UI
    const currentUser = usuario ?? (await getCurrentUser())
    if (!currentUser) {
      setError('Debes iniciar sesión para usar esta función')
      return
    }
    await analizarObjetoHook(mensaje, imagenSeleccionada, currentUser.id, limpiarImagen)
    setMensaje('') // Limpiar mensaje después de enviar
  }, [mensaje, imagenSeleccionada, usuario, limpiarImagen, analizarObjetoHook, setError])

  // Wrapper para manejarKeyPress
  const manejarKeyPress = useCallback(
    async (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        // Evitar bloqueo temprano: resolver usuario en línea si aún no está disponible
        const currentUser = usuario ?? (await getCurrentUser())
        if (!currentUser) {
          setError('Debes iniciar sesión para usar esta función')
          return
        }
        await analizarObjetoHook(mensaje, imagenSeleccionada, currentUser.id, limpiarImagen)
        setMensaje('')
      }
    },
    [usuario, mensaje, imagenSeleccionada, limpiarImagen, analizarObjetoHook, setError]
  )

  // Guardar edición con actualización de conversación
  const guardarEdicion = useCallback(
    (mensajeId: string) => {
      guardarEdicionHook(mensajeId, (mid, catalogacion) => {
        actualizarMensaje(mid, catalogacion)
      })
    },
    [guardarEdicionHook, actualizarMensaje]
  )

  // Aprobar catalogación
  const aprobarCatalogacion = useCallback(
    async (cat: CatalogacionIA, mensajeId?: string) => {
      setGuardando(true)
      try {
        const user = await getCurrentUser()
        if (!user) {
          setGuardando(false)
          setError('Debes iniciar sesión para aprobar la ficha.')
          return
        }

        const mensajeConImagen = conversacion.find(
          (m) => m.mensajeId === mensajeId || m.mensajeId === mensajeId?.replace('ia-', '')
        )
        if (!mensajeConImagen) {
          setGuardando(false)
          setError('No se encontró el mensaje asociado a la imagen.')
          return
        }

        const catalogoCompleto: CatalogacionCompleta = { user_id: user.id, ...cat }

        if (mensajeConImagen.imagenSupabaseUrl && mensajeConImagen.imagenSupabasePath) {
          catalogoCompleto.image_url = mensajeConImagen.imagenSupabaseUrl
          catalogoCompleto.image_path = mensajeConImagen.imagenSupabasePath
        }

        const necesitaArchivo = !(catalogoCompleto.image_url && catalogoCompleto.image_path)
        const imagenFileParaGuardar = necesitaArchivo
          ? mensajeConImagen.imagenOriginal ?? null
          : null

        if (necesitaArchivo && !imagenFileParaGuardar) {
          setGuardando(false)
          setError('Debes adjuntar una fotografía para aprobar la ficha.')
          return
        }

        const res = await guardarCatalogacion(user.id, catalogoCompleto, imagenFileParaGuardar)
        if (!res) {
          setError('Error al aprobar: respuesta vacía del servidor.')
        } else if ('error' in res) {
          setError(`Error al aprobar: ${res.error}`)
        } else {
          // Éxito - podrías agregar un mensaje de éxito aquí
          console.log('Ficha aprobada correctamente')
        }
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e)
        setError(`Error inesperado al aprobar: ${msg}`)
      } finally {
        setGuardando(false)
      }
    },
    [conversacion, setError]
  )

  return {
    // Estado
    mensaje,
    conversacion,
    cargando,
    guardando,
    error,
    imagenSeleccionada,
    previewImagen,
    editandoId,
    catalogacionEditada,
    usuario,

    // Refs
    mensajesEndRef,
    fileInputRef,

    // Acciones
    setMensaje,
    manejarSeleccionImagen,
    limpiarImagen,
    analizarObjeto,
    manejarKeyPress,
    iniciarEdicion,
    cancelarEdicion,
    guardarEdicion,
    actualizarCampo,
    actualizarArray,
    aprobarCatalogacion,
  }
}
