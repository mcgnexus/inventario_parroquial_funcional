import Link from 'next/link'
import { Suspense } from 'react'
import Image from 'next/image'
import { obtenerCatalogoPaginado, type FiltrosCatalogo } from '@/lib/supabase'
import CatalogoUserFilter from '@/components/CatalogoUserFilter'
import OptimizedImage from '@/components/OptimizedImage'
import Pagination from '@/components/Pagination'

export const dynamic = 'force-dynamic'

type SearchParams = {
  tipo?: string
  categoria?: string
  q?: string
  parroquia?: string
  user?: string
  page?: string
  per_page?: string
}

export default async function CatalogoPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const sp = await searchParams

  // Parámetros de paginación
  const page = parseInt(sp.page || '1', 10)
  const perPage = parseInt(sp.per_page || '20', 10)

  // Parámetros de filtro
  const userParam = (sp?.user || '').trim()
  const tipo = (sp?.tipo || '').trim()
  const categoria = (sp?.categoria || '').trim().toLowerCase()
  const q = (sp?.q || '').trim()
  const parroquia = (sp?.parroquia || '').trim()

  // Construir filtros para la consulta paginada
  const filtros: FiltrosCatalogo = {}
  if (userParam) filtros.user_id = userParam
  if (categoria) filtros.categoria = categoria
  if (q) filtros.search = q
  if (parroquia) filtros.parish_id = parroquia

  // Obtener datos paginados
  const { items, total, totalPages } = await obtenerCatalogoPaginado(page, perPage, filtros)

  // Filtrar por tipo en memoria (si es necesario)
  const filtrados = tipo
    ? items.filter((it) => (it.data.tipo_objeto || '').toLowerCase() === tipo.toLowerCase())
    : items

  // Construir query string para links
  const qsParts: string[] = []
  if (tipo) qsParts.push(`tipo=${encodeURIComponent(tipo)}`)
  if (categoria) qsParts.push(`categoria=${encodeURIComponent(categoria)}`)
  if (q) qsParts.push(`q=${encodeURIComponent(q)}`)
  if (parroquia) qsParts.push(`parroquia=${encodeURIComponent(parroquia)}`)
  if (userParam) qsParts.push(`user=${encodeURIComponent(userParam)}`)
  const queryString = qsParts.length ? `?${qsParts.join('&')}` : ''

  // Obtener opciones únicas para filtros
  const tipos = Array.from(new Set(items.map((i) => i.data.tipo_objeto).filter(Boolean))).sort()

  // Opciones fijas de categoría
  const CATEGORY_OPTIONS = [
    'Pintura',
    'Escultura',
    'Talla',
    'Orfebreria',
    'Ornamentos',
    'Telas',
    'Mobiliario',
    'Documentos',
    'Otros',
  ]
  const CATEGORY_LOWER = CATEGORY_OPTIONS.map((s) => s.toLowerCase())
  const categoriasExtra = Array.from(
    new Set(
      items
        .map((i) => (i.data.categoria || '').toLowerCase())
        .filter((c) => c && !CATEGORY_LOWER.includes(c))
    )
  ).sort()

  // Parroquias únicas (solo nombres, no UUIDs)
  const parroquias = Array.from(
    new Set(
      items
        .map((i) => {
          // Priorizar parish_name si existe
          if (i.data.parish_name && i.data.parish_name.trim()) {
            return i.data.parish_name.trim()
          }
          // Si parish_id parece un UUID, no mostrarlo
          if (typeof i.data.parish_id === 'string') {
            const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(i.data.parish_id)
            if (!isUuid) {
              return i.data.parish_id.trim()
            }
          }
          return ''
        })
        .filter(Boolean)
    )
  ).sort()

  // Si el parámetro parroquia es un UUID, intentar obtener el nombre
  let parishHeader = ''
  if (parroquia) {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(parroquia)
    if (isUuid) {
      // Buscar el nombre en los items cargados
      const itemWithName = items.find(i => i.data.parish_id === parroquia && i.data.parish_name)
      parishHeader = itemWithName?.data.parish_name || 'Parroquia desconocida'
    } else {
      parishHeader = parroquia
    }
  } else if (parroquias.length === 1) {
    parishHeader = parroquias[0]
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <Image
          src="/guadix.svg"
          alt="Diócesis de Guadix"
          width={32}
          height={32}
          priority
          className="logo-escudo"
          style={{ height: '2rem', width: 'auto' }}
        />
        <div className="text-sm text-slate-600">Diócesis de Guadix — Catálogo</div>
      </div>

      {/* Title */}
      <div className="flex items-baseline justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Catálogo</h1>
          {parishHeader && <p className="text-sm text-slate-600">Parroquia: {parishHeader}</p>}
          {userParam && (
            <p className="text-xs mt-1 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
              Filtrando: Mis piezas
            </p>
          )}
          <p className="text-xs text-slate-500 mt-1">
            Mostrando {filtrados.length} de {total} resultados
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Suspense fallback={null}>
            <CatalogoUserFilter />
          </Suspense>
          <Link
            href="/inventario"
            className="px-4 py-2 bg-amber-600 text-white text-sm font-medium rounded-md hover:bg-amber-700 transition-colors shadow-sm"
          >
            + Insertar otra pieza
          </Link>
        </div>
      </div>

      {/* Filters */}
      <form
        method="GET"
        className="mb-6 bg-white border border-slate-200 rounded-lg p-4 flex flex-wrap gap-4 items-end"
      >
        {userParam && <input type="hidden" name="user" value={userParam} />}

        <div>
          <label htmlFor="tipo" className="block text-xs font-semibold text-slate-600 mb-1">
            Tipo
          </label>
          <select
            id="tipo"
            name="tipo"
            defaultValue={tipo}
            className="text-sm border border-slate-300 rounded px-2 py-1 bg-white"
          >
            <option value="">Todos</option>
            {tipos.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="categoria" className="block text-xs font-semibold text-slate-600 mb-1">
            Categoría
          </label>
          <select
            id="categoria"
            name="categoria"
            defaultValue={categoria}
            className="text-sm border border-slate-300 rounded px-2 py-1 bg-white"
          >
            <option value="">Todas</option>
            {CATEGORY_OPTIONS.map((label) => (
              <option key={label.toLowerCase()} value={label.toLowerCase()}>
                {label}
              </option>
            ))}
            {categoriasExtra.map((c) => (
              <option key={c} value={c}>
                {c.charAt(0).toUpperCase() + c.slice(1)}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="parroquia" className="block text-xs font-semibold text-slate-600 mb-1">
            Parroquia
          </label>
          <select
            id="parroquia"
            name="parroquia"
            defaultValue={parroquia}
            className="text-sm border border-slate-300 rounded px-2 py-1 bg-white"
          >
            <option value="">Todas</option>
            {parroquias.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>

        <div className="flex-1 min-w-[200px]">
          <label htmlFor="buscar" className="block text-xs font-semibold text-slate-600 mb-1">
            Buscar
          </label>
          <input
            type="text"
            id="buscar"
            name="q"
            placeholder="Palabras clave (descripción, estilo, observaciones...)"
            defaultValue={q}
            className="w-full text-sm border border-slate-300 rounded px-3 py-1.5"
          />
        </div>

        <div className="flex gap-2">
          <button
            type="submit"
            className="px-3 py-1.5 bg-amber-600 text-white rounded text-sm hover:bg-amber-700"
          >
            Filtrar
          </button>
          <Link
            href="/catalogo"
            className="px-3 py-1.5 bg-slate-100 text-slate-700 rounded text-sm hover:bg-slate-200"
          >
            Limpiar
          </Link>
        </div>
      </form>

      {/* Results */}
      {filtrados.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-slate-600">No hay elementos que coincidan con el filtro.</p>
          <Link
            href="/catalogo"
            className="mt-4 inline-block text-sm text-amber-600 hover:text-amber-700"
          >
            Ver todos los elementos
          </Link>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtrados.map((it) => (
              <div
                key={it.id}
                id={`item-${it.id}`}
                className="relative group bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-shadow"
              >
                <Link
                  href={`/catalogo/${it.id}${queryString}`}
                  className="block bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-all duration-200"
                >
                  <div className="aspect-[4/3] bg-slate-100 overflow-hidden">
                    <OptimizedImage
                      src={it.data.image_url}
                      alt={it.data.descripcion_breve || it.data.tipo_objeto}
                      fill
                      sizes="(min-width:1024px) 33vw, (min-width:640px) 50vw, 100vw"
                      quality={75}
                      loading="lazy"
                      className="object-contain object-center"
                      containerClassName="w-full h-full"
                      fallbackText="Sin imagen"
                    />
                  </div>
                  <div className="p-4">
                    <h3 className="text-sm font-semibold text-slate-800">
                      {it.data.descripcion_breve || it.data.tipo_objeto}
                    </h3>
                    <p className="text-xs text-slate-600 mt-1">
                      {it.data.categoria} · {it.data.datacion_aproximada || it.data.siglos_estimados}
                    </p>
                  </div>
                </Link>
                <Link
                  href={`/catalogo/${it.id}${queryString}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="absolute top-2 right-2 bg-white/90 border border-slate-200 rounded p-1 shadow-sm opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity"
                >
                  <Image src="/window.svg" alt="Abrir en nueva pestaña" width={16} height={16} />
                </Link>
              </div>
            ))}
          </div>

          {/* Pagination */}
          <div className="mt-8">
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              total={total}
              perPage={perPage}
              baseUrl="/catalogo"
              preserveParams={{
                tipo,
                categoria,
                q,
                parroquia,
                user: userParam,
              }}
            />
          </div>
        </>
      )}

      <footer className="text-center mt-10 text-sm text-gray-500">
        <p>💡Creado por: Manuel Carrasco García</p>
      </footer>
    </div>
  )
}
