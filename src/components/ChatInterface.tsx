'use client'
/* eslint-disable @next/next/no-img-element */

import React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Database,
  ScanSearch,
  Loader2,
  AlertTriangle,
  ShieldCheck,
  Sparkles,
} from 'lucide-react'

// Hooks y componentes
import { useInventory } from '@/hooks/useInventory'
import ImageUploader from './ImageUploader'
import ConversationList from './ConversationList'

// Categorías rápidas
const CATEGORIAS_RAPIDAS = [
  { image: '/icons/chalice.svg', label: 'Orfebrería', descripcion: 'Cáliz, custodia, copón...' },
  { image: '/icons/chasuble.svg', label: 'Ornamentos', descripcion: 'Casulla, estola, paño...' },
  { image: '/icons/crucifix.svg', label: 'Imaginería', descripcion: 'Imágenes, retablos...' },
  { image: '/icons/book.svg', label: 'Documentos', descripcion: 'Libros, pergaminos, actas...' },
]

export default function ChatInterface() {
  const router = useRouter()

  // Usar el hook personalizado para toda la lógica
  const {
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
  } = useInventory()

  return (
    <div className="flex flex-col min-h-[100dvh] max-w-6xl mx-auto bg-stone-100 rounded-xl shadow-2xl overflow-hidden border border-slate-300">
      {/* ENCABEZADO */}
      <div className="bg-slate-800 text-white p-4 border-b-4 border-amber-600">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-3">
              <Database className="h-7 w-7 text-amber-500" />
              <h2 className="text-xl font-serif font-semibold">
                Inventario de Bienes Muebles
              </h2>
            </div>
            <p className="text-sm text-slate-300 ml-10">
              Parroquia de Santa María de Huéscar, Diócesis de Guadix
            </p>
          </div>
          <div className="flex items-center gap-3">
            {usuario ? (
              <>
                <ShieldCheck className="h-5 w-5 text-emerald-400" />
                <span className="text-sm text-slate-200">
                  Autenticado como {usuario.email || '—'}
                </span>
              </>
            ) : (
              <>
                <AlertTriangle className="h-5 w-5 text-amber-400" />
                <span className="text-sm text-slate-200">No autenticado</span>
                <button
                  onClick={() => router.push('/auth?from=chat')}
                  className="px-2 py-1 bg-amber-600 text-white rounded text-xs hover:bg-amber-700"
                >
                  Iniciar sesión
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ÁREA DE MENSAJES */}
      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        {/* Bienvenida */}
        {conversacion.length === 0 && (
          <div className="text-center space-y-6 mt-4">
            <div className="max-w-3xl mx-auto bg-white p-6 rounded-lg shadow-sm border border-slate-200">
              <Sparkles className="h-12 w-12 text-amber-600 mx-auto mb-4" />
              <h3 className="text-xl font-serif font-semibold text-slate-800 mb-3">
                Asistente de Catalogación Patrimonial
              </h3>
              <p className="text-slate-700 mb-4">
                Suba una fotografía del objeto a catalogar. La IA generará una propuesta de ficha
                técnica que podrá revisar, editar y guardar en la base de datos.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 mt-4">
                {CATEGORIAS_RAPIDAS.map((cat, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-stone-50 rounded-lg border border-slate-200 text-center"
                  >
                    <img src={cat.image} alt={cat.label} className="h-8 w-8 mx-auto mb-2" />
                    <p className="font-semibold text-slate-800 text-xs">{cat.label}</p>
                    <p className="text-xs text-slate-600 mt-1">{cat.descripcion}</p>
                  </div>
                ))}
              </div>

              {/* Botones para ir al catálogo */}
              <div className="mt-6 flex justify-center gap-3">
                <Link
                  href="/catalogo"
                  className="px-4 py-2 bg-amber-600 text-white rounded-lg text-sm hover:bg-amber-700"
                >
                  Ir al catálogo
                </Link>
                <Link
                  href="/catalogo"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-sm hover:bg-slate-200"
                >
                  Abrir catálogo en nueva pestaña
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Lista de conversación */}
        <ConversationList
          conversacion={conversacion}
          editandoId={editandoId}
          catalogacionEditada={catalogacionEditada}
          guardando={guardando}
          onIniciarEdicion={iniciarEdicion}
          onGuardarEdicion={guardarEdicion}
          onCancelarEdicion={cancelarEdicion}
          onAprobar={aprobarCatalogacion}
          onActualizarCampo={actualizarCampo}
          onActualizarArray={actualizarArray}
        />

        {/* Cargando */}
        {cargando && (
          <div className="flex justify-start">
            <div className="bg-white p-3 rounded-lg shadow-sm border border-slate-200">
              <div className="flex items-center gap-3">
                <Loader2 className="h-5 w-5 text-amber-600 animate-spin" />
                <span className="text-slate-600 text-sm">Analizando objeto...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={mensajesEndRef} />
      </div>

      {/* Error */}
      {error && (
        <div className="px-5 py-3 bg-red-50 border-t border-red-200">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            <span className="text-sm text-red-700 font-medium">{error}</span>
          </div>
        </div>
      )}

      {/* Preview de imagen */}
      {previewImagen && (
        <ImageUploader
          fileInputRef={fileInputRef}
          previewImagen={previewImagen}
          imagenSeleccionada={imagenSeleccionada}
          onSeleccionImagen={manejarSeleccionImagen}
          onLimpiarImagen={limpiarImagen}
          disabled={cargando}
        />
      )}

      {/* ÁREA DE ENTRADA */}
      <div className="border-t-2 border-slate-200 p-4 bg-white">
        <div className="flex gap-3">
          <ImageUploader
            fileInputRef={fileInputRef}
            previewImagen={null}
            imagenSeleccionada={imagenSeleccionada}
            onSeleccionImagen={manejarSeleccionImagen}
            onLimpiarImagen={limpiarImagen}
            disabled={cargando}
          />

          <input
            type="text"
            value={mensaje}
            onChange={(e) => setMensaje(e.target.value)}
            onKeyDown={manejarKeyPress}
            placeholder="Descripción adicional del objeto (opcional)..."
            className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 text-slate-800 shadow-sm"
            disabled={cargando}
          />

          <button
            onClick={analizarObjeto}
            disabled={cargando || (!mensaje.trim() && !imagenSeleccionada)}
            className="px-6 py-2 bg-slate-700 text-white rounded-lg font-semibold hover:bg-slate-800 disabled:bg-slate-300 flex items-center gap-2 shadow-sm"
          >
            {cargando ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <ScanSearch className="h-5 w-5" />
            )}
            <span>{cargando ? 'Analizando' : 'Analizar'}</span>
          </button>
        </div>
      </div>
    </div>
  )
}
