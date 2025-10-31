import { useState, useCallback } from 'react'
import type { CatalogacionIA } from './useAIAnalysis'

export interface UseCatalogacionEditorReturn {
  editandoId: string | null
  catalogacionEditada: CatalogacionIA | null
  iniciarEdicion: (mensajeId: string, catalogacion: CatalogacionIA) => void
  cancelarEdicion: () => void
  guardarEdicion: (mensajeId: string, onSave: (mensajeId: string, catalogacion: CatalogacionIA) => void) => void
  actualizarCampo: <K extends keyof CatalogacionIA>(campo: K, valor: CatalogacionIA[K]) => void
  actualizarArray: (campo: 'materiales' | 'tecnicas' | 'deterioros_visibles', texto: string) => void
}

/**
 * Hook para gestionar la edición de catalogaciones
 *
 * @returns {UseCatalogacionEditorReturn} Estado y funciones para editar catalogaciones
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { editandoId, catalogacionEditada, iniciarEdicion, cancelarEdicion, actualizarCampo } = useCatalogacionEditor()
 *
 *   const handleEdit = () => {
 *     iniciarEdicion('msg-123', catalogacion)
 *   }
 *
 *   return (
 *     <div>
 *       {editandoId && (
 *         <input
 *           value={catalogacionEditada?.tipo_objeto || ''}
 *           onChange={(e) => actualizarCampo('tipo_objeto', e.target.value)}
 *         />
 *       )}
 *     </div>
 *   )
 * }
 * ```
 */
export function useCatalogacionEditor(): UseCatalogacionEditorReturn {
  const [editandoId, setEditandoId] = useState<string | null>(null)
  const [catalogacionEditada, setCatalogacionEditada] = useState<CatalogacionIA | null>(null)

  const iniciarEdicion = useCallback((mensajeId: string, catalogacion: CatalogacionIA) => {
    setEditandoId(mensajeId)
    setCatalogacionEditada(JSON.parse(JSON.stringify(catalogacion))) // Deep clone
  }, [])

  const cancelarEdicion = useCallback(() => {
    setEditandoId(null)
    setCatalogacionEditada(null)
  }, [])

  const guardarEdicion = useCallback(
    (mensajeId: string, onSave: (mensajeId: string, catalogacion: CatalogacionIA) => void) => {
      if (!catalogacionEditada) return
      onSave(mensajeId, catalogacionEditada)
      setEditandoId(null)
      setCatalogacionEditada(null)
    },
    [catalogacionEditada]
  )

  const actualizarCampo = useCallback(
    <K extends keyof CatalogacionIA>(campo: K, valor: CatalogacionIA[K]) => {
      if (!catalogacionEditada) return
      setCatalogacionEditada((prev) => (prev ? { ...prev, [campo]: valor } : null))
    },
    [catalogacionEditada]
  )

  const actualizarArray = useCallback(
    (campo: 'materiales' | 'tecnicas' | 'deterioros_visibles', texto: string) => {
      if (!catalogacionEditada) return
      const valores = texto.split(',').map((v) => v.trim()).filter((v) => v)
      setCatalogacionEditada((prev) => (prev ? { ...prev, [campo]: valores } : null))
    },
    [catalogacionEditada]
  )

  return {
    editandoId,
    catalogacionEditada,
    iniciarEdicion,
    cancelarEdicion,
    guardarEdicion,
    actualizarCampo,
    actualizarArray,
  }
}
