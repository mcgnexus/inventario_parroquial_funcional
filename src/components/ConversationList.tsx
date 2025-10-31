'use client'

import React from 'react'
import { FileText, AlertTriangle, Sparkles } from 'lucide-react'
import InventoryForm from './InventoryForm'
import type { Mensaje, CatalogacionIA } from '@/hooks/useInventory'

interface ConversationListProps {
  conversacion: Mensaje[]
  editandoId: string | null
  catalogacionEditada: CatalogacionIA | null
  guardando: boolean
  onIniciarEdicion: (mensajeId: string, cat: CatalogacionIA) => void
  onGuardarEdicion: (mensajeId: string) => void
  onCancelarEdicion: () => void
  onAprobar: (cat: CatalogacionIA, mensajeId?: string) => void
  onActualizarCampo: <K extends keyof CatalogacionIA>(campo: K, valor: CatalogacionIA[K]) => void
  onActualizarArray: (campo: 'materiales' | 'tecnicas' | 'deterioros_visibles', valor: string) => void
}

export default function ConversationList({
  conversacion,
  editandoId,
  catalogacionEditada,
  guardando,
  onIniciarEdicion,
  onGuardarEdicion,
  onCancelarEdicion,
  onAprobar,
  onActualizarCampo,
  onActualizarArray,
}: ConversationListProps) {
  return (
    <>
      {conversacion.map((msg, index) => (
        <div
          key={msg.mensajeId ?? index}
          className={`flex ${msg.tipo === 'usuario' ? 'justify-end' : 'justify-start'}`}
        >
          <div
            className={`max-w-[85%] p-3 rounded-lg shadow-sm ${
              msg.tipo === 'usuario'
                ? 'bg-slate-700 text-white rounded-br-none'
                : msg.tipo === 'sistema'
                ? 'bg-yellow-50 text-yellow-800 border-l-4 border-yellow-500 rounded-bl-none'
                : 'bg-white text-slate-800 rounded-bl-none border border-slate-200'
            }`}
          >
            <div className="flex items-start gap-3">
              <span className="flex-shrink-0 pt-0.5">
                {msg.tipo === 'usuario' ? (
                  <FileText className="h-4 w-4" />
                ) : msg.tipo === 'sistema' ? (
                  <AlertTriangle className="h-4 w-4" />
                ) : (
                  <Sparkles className="h-4 w-4 text-amber-600" />
                )}
              </span>
              <div className="flex-1">
                <p className="whitespace-pre-wrap leading-relaxed text-sm">{msg.texto}</p>

                {/* Renderizar ficha de inventario si existe catalogación */}
                {msg.catalogacion && (
                  <InventoryForm
                    catalogacion={msg.catalogacion}
                    mensajeId={msg.mensajeId}
                    estaEditando={editandoId === msg.mensajeId}
                    catalogacionEditada={catalogacionEditada}
                    guardando={guardando}
                    imagenOriginal={msg.imagenOriginal}
                    onIniciarEdicion={onIniciarEdicion}
                    onGuardarEdicion={onGuardarEdicion}
                    onCancelarEdicion={onCancelarEdicion}
                    onAprobar={onAprobar}
                    onActualizarCampo={onActualizarCampo}
                    onActualizarArray={onActualizarArray}
                  />
                )}

                <p
                  className={`text-xs mt-2 ${
                    msg.tipo === 'usuario' ? 'text-slate-300' : 'text-slate-400'
                  }`}
                >
                  {msg.timestamp.toLocaleTimeString('es-ES', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
            </div>
          </div>
        </div>
      ))}
    </>
  )
}
