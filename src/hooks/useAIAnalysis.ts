import { useState, useCallback, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { enviarMensajeDify, enviarImagenDifyConInputArchivo, prepararImagen, type RespuestaDify } from '@/lib/dify'
import { normalizeCatalogacionData } from '@/lib/aiUtils' // Importar desde un nuevo fichero
import { guardarConversacion } from '@/lib/supabase'
import { CatalogacionIASchema, type CatalogacionIA } from '@/schemas'

// Re-export for backward compatibility
export type { CatalogacionIA }

export interface Mensaje {
  tipo: 'usuario' | 'ia' | 'sistema'
  texto: string
  timestamp: Date
  catalogacion?: CatalogacionIA
  mensajeId?: string
  imagenOriginal?: File
  imagenSupabaseUrl?: string
  imagenSupabasePath?: string
}

export interface UseAIAnalysisReturn {
  conversacion: Mensaje[]
  cargando: boolean
  error: string | null
  mensajesEndRef: React.RefObject<HTMLDivElement | null>
  setError: (error: string | null) => void
  actualizarMensaje: (mensajeId: string, catalogacion: CatalogacionIA) => void
  analizarObjeto: (
    mensaje: string,
    imagenSeleccionada: File | null,
    userId: string,
    onLimpiarImagen: () => void
  ) => Promise<void>
  manejarKeyPress: (
    e: React.KeyboardEvent,
    mensaje: string,
    imagenSeleccionada: File | null,
    userId: string,
    onLimpiarImagen: () => void
  ) => void
}

/**
 * Hook para gestionar el análisis de objetos con IA
 *
 * @returns {UseAIAnalysisReturn} Estado y funciones para análisis con IA
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { conversacion, cargando, error, analizarObjeto } = useAIAnalysis()
 *
 *   const handleAnalyze = async () => {
 *     await analizarObjeto(mensaje, imagen, userId, clearImage)
 *   }
 *
 *   return (
 *     <div>
 *       {conversacion.map(msg => <div key={msg.mensajeId}>{msg.texto}</div>)}
 *       {cargando && <p>Analizando...</p>}
 *     </div>
 *   )
 * }
 * ```
 */
export function useAIAnalysis(): UseAIAnalysisReturn {
  const [conversacion, setConversacion] = useState<Mensaje[]>([])
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const mensajesEndRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  // Auto-scroll al final de conversación
  useEffect(() => {
    mensajesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [conversacion])

  const actualizarMensaje = useCallback((mensajeId: string, catalogacion: CatalogacionIA) => {
    setConversacion((prev) =>
      prev.map((msg) => {
        if (msg.mensajeId === mensajeId && msg.catalogacion) {
          return {
            ...msg,
            catalogacion: { ...catalogacion },
          }
        }
        return msg
      })
    )
  }, [])

  const analizarObjeto = useCallback(
    async (
      mensaje: string,
      imagenSeleccionada: File | null,
      userId: string,
      onLimpiarImagen: () => void
    ) => {
      if ((!mensaje.trim() && !imagenSeleccionada) || cargando) return

      try {
        setCargando(true)
        setError(null)

        const mensajeParaEnviar = mensaje.trim() || 'Analiza esta imagen'
        const mensajeId = Date.now().toString()

        // Mensaje del usuario
        const nuevoMensajeUsuario: Mensaje = {
          tipo: 'usuario',
          texto: mensajeParaEnviar,
          timestamp: new Date(),
          mensajeId,
          imagenOriginal: imagenSeleccionada || undefined,
        }
        setConversacion((prev) => [...prev, nuevoMensajeUsuario])

        let respuesta: RespuestaDify
        let imagenOriginalRef: File | undefined

        if (imagenSeleccionada) {
          imagenOriginalRef = imagenSeleccionada

          const mensajeSistema: Mensaje = {
            tipo: 'sistema',
            texto: 'Preparando imagen para análisis...',
            timestamp: new Date(),
          }
          setConversacion((prev) => [...prev, mensajeSistema])

          const imagenPreparada = await prepararImagen(imagenSeleccionada)

          if (imagenPreparada.size !== imagenSeleccionada.size) {
            const mensajeCompresion: Mensaje = {
              tipo: 'sistema',
              texto: `Imagen optimizada: ${(imagenSeleccionada.size / 1024).toFixed(1)}KB → ${(imagenPreparada.size / 1024).toFixed(1)}KB`,
              timestamp: new Date(),
            }
            setConversacion((prev) => [...prev, mensajeCompresion])
          }

          respuesta = await enviarImagenDifyConInputArchivo(
            mensajeParaEnviar,
            imagenPreparada,
            userId
          )

          if (respuesta?.supabaseImage) {
            setConversacion((prev) =>
              prev.map((m) =>
                m.mensajeId === mensajeId
                  ? {
                      ...m,
                      imagenSupabaseUrl: respuesta.supabaseImage!.url,
                      imagenSupabasePath: respuesta.supabaseImage!.path,
                    }
                  : m
              )
            )
          }
        } else {
          respuesta = await enviarMensajeDify(mensajeParaEnviar, userId)
        }

        if (respuesta.exito && respuesta.respuesta) {
          if (respuesta.authWarning) {
            setError(
              'La imagen no se guardó en Supabase por falta de login. Inicia sesión para guardar tus imágenes.'
            )
            const avisoAuth: Mensaje = {
              tipo: 'sistema',
              texto: 'Aviso: inicia sesión para poder guardar la imagen en el inventario.',
              timestamp: new Date(),
            }
            setConversacion((prev) => [...prev, avisoAuth])
            setTimeout(() => router.push('/auth?from=chat&reason=login-required'), 600)
          }

          let catalogacion: CatalogacionIA | null = null
          const textoRespuesta = respuesta.respuesta

          try {
            const jsonMatch = respuesta.respuesta.match(/\{[\s\S]*\}/)
            if (jsonMatch) {
              const parsedData = JSON.parse(jsonMatch[0])
              const normalizedData = normalizeCatalogacionData(parsedData, textoRespuesta)
              // Validar con Zod schema
              const validationResult = CatalogacionIASchema.safeParse(normalizedData)
              if (validationResult.success) {
                catalogacion = validationResult.data
              } else {
                console.warn('Datos de catalogación no válidos:', validationResult.error.issues)
                // Aun así usar datos normalizados para ofrecer la mejor info posible
                catalogacion = normalizedData
              }
            }
          } catch (error) {
            console.log('No se pudo parsear como JSON, mostrando texto plano', error)
          }

          const nuevoMensajeIA: Mensaje = {
            tipo: 'ia',
            texto: textoRespuesta,
            timestamp: new Date(),
            catalogacion: catalogacion || undefined,
            mensajeId: 'ia-' + mensajeId,
            imagenOriginal: imagenOriginalRef || undefined,
          }
          setConversacion((prev) => [...prev, nuevoMensajeIA])

          guardarConversacion(userId, mensajeParaEnviar, respuesta.respuesta).catch(
            (err: unknown) => console.error('Error al guardar:', err)
          )
        } else {
          throw new Error(respuesta.error || 'Error desconocido')
        }
      } catch (err: unknown) {
        const mensajeError = err instanceof Error ? err.message : 'Error desconocido'
        setError(mensajeError)
        const nuevoMensajeError: Mensaje = {
          tipo: 'sistema',
          texto: 'Error al analizar el objeto. Por favor, intente nuevamente.',
          timestamp: new Date(),
        }
        setConversacion((prev) => [...prev, nuevoMensajeError])
      } finally {
        setCargando(false)
        onLimpiarImagen()
      }
    },
    [cargando, router]
  )

  const manejarKeyPress = useCallback(
    (
      e: React.KeyboardEvent,
      mensaje: string,
      imagenSeleccionada: File | null,
      userId: string,
      onLimpiarImagen: () => void
    ) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        analizarObjeto(mensaje, imagenSeleccionada, userId, onLimpiarImagen)
      }
    },
    [analizarObjeto]
  )

  return {
    conversacion,
    cargando,
    error,
    mensajesEndRef,
    setError,
    actualizarMensaje,
    analizarObjeto,
    manejarKeyPress,
  }
}
