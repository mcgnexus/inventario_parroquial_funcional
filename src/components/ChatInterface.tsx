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
  BookOpen,
  ExternalLink,
} from 'lucide-react'

// Hooks y componentes
import { useInventory } from '@/hooks/useInventory'
import ImageUploader from './ImageUploader'
import ConversationList from './ConversationList'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

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
    <div className="flex flex-col min-h-[100dvh] max-w-6xl mx-auto bg-background rounded-xl shadow-2xl overflow-hidden border">
      {/* ENCABEZADO */}
      <div className="bg-primary text-primary-foreground p-4 border-b-4 border-primary">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-3">
              <Database className="h-7 w-7" />
              <h2 className="text-xl font-serif font-semibold">
                Inventario de Bienes Muebles
              </h2>
            </div>
            <p className="text-sm opacity-90 ml-10">
              Parroquia de Santa María de Huéscar, Diócesis de Guadix
            </p>
          </div>
          <div className="flex items-center gap-3">
            {usuario ? (
              <>
                <Badge variant="secondary" className="gap-2">
                  <ShieldCheck className="h-4 w-4" />
                  {usuario.email || '—'}
                </Badge>
              </>
            ) : (
              <>
                <Badge variant="destructive" className="gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  No autenticado
                </Badge>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => router.push('/auth?from=chat')}
                >
                  Iniciar sesión
                </Button>
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
            <Card className="max-w-3xl mx-auto">
              <CardHeader>
                <Sparkles className="h-12 w-12 text-primary mx-auto mb-2" />
                <CardTitle className="text-2xl font-serif">
                  Asistente de Catalogación Patrimonial
                </CardTitle>
                <CardDescription className="text-base">
                  Suba una fotografía del objeto a catalogar. La IA generará una propuesta de ficha
                  técnica que podrá revisar, editar y guardar en la base de datos.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                  {CATEGORIAS_RAPIDAS.map((cat, idx) => (
                    <Card key={idx} className="p-3 text-center hover:bg-accent transition-colors">
                      <img src={cat.image} alt={cat.label} className="h-8 w-8 mx-auto mb-2" />
                      <p className="font-semibold text-foreground text-xs">{cat.label}</p>
                      <p className="text-xs text-muted-foreground mt-1">{cat.descripcion}</p>
                    </Card>
                  ))}
                </div>

                {/* Botones para ir al catálogo */}
                <div className="flex flex-col sm:flex-row justify-center gap-3">
                  <Button asChild>
                    <Link href="/catalogo">
                      <BookOpen className="mr-2 h-4 w-4" />
                      Ir al catálogo
                    </Link>
                  </Button>
                  <Button variant="outline" asChild>
                    <Link href="/catalogo" target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="mr-2 h-4 w-4" />
                      Abrir en nueva pestaña
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
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
            <Card className="p-3">
              <div className="flex items-center gap-3">
                <Loader2 className="h-5 w-5 text-primary animate-spin" />
                <span className="text-muted-foreground text-sm">Analizando objeto...</span>
              </div>
            </Card>
          </div>
        )}

        <div ref={mensajesEndRef} />
      </div>

      {/* Error */}
      {error && (
        <div className="px-5 py-3 bg-destructive/10 border-t border-destructive/20">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <span className="text-sm text-destructive font-medium">{error}</span>
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
      <div className="border-t-2 p-4 bg-card">
        <div className="flex gap-3">
          <ImageUploader
            fileInputRef={fileInputRef}
            previewImagen={null}
            imagenSeleccionada={imagenSeleccionada}
            onSeleccionImagen={manejarSeleccionImagen}
            onLimpiarImagen={limpiarImagen}
            disabled={cargando}
          />

          <Input
            type="text"
            value={mensaje}
            onChange={(e) => setMensaje(e.target.value)}
            onKeyDown={manejarKeyPress}
            placeholder="Descripción adicional del objeto (opcional)..."
            disabled={cargando}
            className="flex-1"
          />

          <Button
            onClick={analizarObjeto}
            disabled={cargando || (!mensaje.trim() && !imagenSeleccionada)}
            size="lg"
            className="gap-2"
          >
            {cargando ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <ScanSearch className="h-5 w-5" />
            )}
            <span>{cargando ? 'Analizando' : 'Analizar'}</span>
          </Button>
        </div>
      </div>
    </div>
  )
}
