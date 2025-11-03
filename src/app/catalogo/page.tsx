import Link from 'next/link'
import { Suspense } from 'react'
import Image from 'next/image'
import { obtenerCatalogoPaginado, type FiltrosCatalogo } from '@/lib/supabase'
import CatalogoUserFilter from '@/components/CatalogoUserFilter'
import OptimizedImage from '@/components/OptimizedImage'
import Pagination from '@/components/Pagination'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Search, Filter, Plus, ExternalLink, X } from 'lucide-react'

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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="relative h-8 w-8">
          <Image
            src="/guadix.svg"
            alt="Diócesis de Guadix"
            width={32}
            height={32}
            priority
            className="object-contain"
          />
        </div>
        <div className="text-sm text-muted-foreground">Diócesis de Guadix — Catálogo</div>
      </div>

      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-foreground">Catálogo Diocesano</h1>
          {parishHeader && (
            <p className="text-sm text-muted-foreground">
              Parroquia: <span className="font-medium text-foreground">{parishHeader}</span>
            </p>
          )}
          <div className="flex flex-wrap items-center gap-2">
            {userParam && (
              <Badge variant="secondary" className="gap-1">
                <Filter className="h-3 w-3" />
                Mis piezas
              </Badge>
            )}
            <p className="text-xs text-muted-foreground">
              Mostrando {filtrados.length} de {total} resultados
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Suspense fallback={null}>
            <CatalogoUserFilter />
          </Suspense>
          <Button asChild>
            <Link href="/inventario">
              <Plus className="mr-2 h-4 w-4" />
              Añadir pieza
            </Link>
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros de búsqueda
          </CardTitle>
          <CardDescription>Refina tu búsqueda usando los criterios disponibles</CardDescription>
        </CardHeader>
        <CardContent>
          <form method="GET" className="flex flex-wrap gap-4 items-end">
            {userParam && <input type="hidden" name="user" value={userParam} />}

            <div className="space-y-2">
              <Label htmlFor="tipo">Tipo</Label>
              <select
                id="tipo"
                name="tipo"
                defaultValue={tipo}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="">Todos</option>
                {tipos.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="categoria">Categoría</Label>
              <select
                id="categoria"
                name="categoria"
                defaultValue={categoria}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
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

            <div className="space-y-2">
              <Label htmlFor="parroquia">Parroquia</Label>
              <select
                id="parroquia"
                name="parroquia"
                defaultValue={parroquia}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="">Todas</option>
                {parroquias.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex-1 min-w-[200px] space-y-2">
              <Label htmlFor="buscar">Buscar</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  id="buscar"
                  name="q"
                  placeholder="Palabras clave..."
                  defaultValue={q}
                  className="pl-9"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <Button type="submit">
                <Search className="mr-2 h-4 w-4" />
                Filtrar
              </Button>
              <Button type="button" variant="outline" asChild>
                <Link href="/catalogo">
                  <X className="mr-2 h-4 w-4" />
                  Limpiar
                </Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Results */}
      {filtrados.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent className="pt-6">
            <Search className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-lg font-medium text-foreground mb-2">No hay resultados</p>
            <p className="text-sm text-muted-foreground mb-4">
              No se encontraron elementos que coincidan con los filtros aplicados
            </p>
            <Button variant="outline" asChild>
              <Link href="/catalogo">Ver todos los elementos</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtrados.map((it) => (
              <Card
                key={it.id}
                id={`item-${it.id}`}
                className="group overflow-hidden hover:shadow-lg transition-all duration-300"
              >
                <Link href={`/catalogo/${it.id}${queryString}`} className="block">
                  <div className="aspect-[4/3] bg-muted overflow-hidden relative">
                    <OptimizedImage
                      src={it.data.image_url}
                      alt={it.data.descripcion_breve || it.data.tipo_objeto}
                      fill
                      sizes="(min-width:1024px) 33vw, (min-width:640px) 50vw, 100vw"
                      quality={75}
                      loading="lazy"
                      className="object-contain object-center transition-transform group-hover:scale-105"
                      containerClassName="w-full h-full"
                      fallbackText="Sin imagen"
                    />
                    <Link
                      href={`/catalogo/${it.id}${queryString}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="absolute top-2 right-2 bg-background/95 border rounded-md p-2 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Link>
                  </div>
                  <CardHeader>
                    <CardTitle className="text-base line-clamp-2">
                      {it.data.descripcion_breve || it.data.tipo_objeto}
                    </CardTitle>
                    <CardDescription>
                      {it.data.categoria} · {it.data.datacion_aproximada || it.data.siglos_estimados}
                    </CardDescription>
                  </CardHeader>
                </Link>
              </Card>
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

      <footer className="text-center mt-10 text-sm text-muted-foreground">
        <p>Creado por: Manuel Carrasco García</p>
      </footer>
    </div>
  )
}
