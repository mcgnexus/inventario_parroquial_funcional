'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface PaginationProps {
  currentPage: number
  totalPages: number
  total: number
  perPage: number
  baseUrl: string
  preserveParams?: Record<string, string | undefined>
}

export default function Pagination({
  currentPage,
  totalPages,
  total,
  perPage,
  baseUrl,
  preserveParams = {},
}: PaginationProps) {
  const router = useRouter()

  // Construir URL con parámetros preservados
  const buildUrl = (page: number) => {
    const params = new URLSearchParams()

    // Preservar parámetros existentes
    Object.entries(preserveParams).forEach(([key, value]) => {
      if (value && value.trim()) {
        params.set(key, value)
      }
    })

    // Agregar página
    if (page > 1) {
      params.set('page', page.toString())
    }

    const queryString = params.toString()
    return `${baseUrl}${queryString ? `?${queryString}` : ''}`
  }

  // Calcular rango de páginas a mostrar
  const getPageNumbers = () => {
    const delta = 2 // Páginas a mostrar a cada lado de la actual
    const range: (number | string)[] = []
    const rangeWithDots: (number | string)[] = []

    // Siempre mostrar primera página
    range.push(1)

    // Añadir páginas alrededor de la actual
    for (let i = currentPage - delta; i <= currentPage + delta; i++) {
      if (i > 1 && i < totalPages) {
        range.push(i)
      }
    }

    // Siempre mostrar última página
    if (totalPages > 1) {
      range.push(totalPages)
    }

    // Añadir puntos suspensivos donde sea necesario
    let prev = 0
    for (const i of range) {
      if (typeof i === 'number') {
        if (prev && i - prev > 1) {
          rangeWithDots.push('...')
        }
        rangeWithDots.push(i)
        prev = i
      }
    }

    return rangeWithDots
  }

  const pageNumbers = getPageNumbers()
  const startItem = (currentPage - 1) * perPage + 1
  const endItem = Math.min(currentPage * perPage, total)

  // Handler para cambio de página vía select
  const handlePerPageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newPerPage = parseInt(e.target.value, 10)
    const params = new URLSearchParams()

    Object.entries(preserveParams).forEach(([key, value]) => {
      if (value && value.trim()) {
        params.set(key, value)
      }
    })

    params.set('per_page', newPerPage.toString())
    params.set('page', '1') // Reset a página 1 cuando se cambia items por página

    router.push(`${baseUrl}?${params.toString()}`)
  }

  if (totalPages <= 1) {
    return null // No mostrar paginación si solo hay 1 página
  }

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-4 py-3 bg-white border border-slate-200 rounded-lg">
      {/* Info */}
      <div className="text-sm text-slate-600">
        Mostrando <span className="font-medium">{startItem}</span> a{' '}
        <span className="font-medium">{endItem}</span> de{' '}
        <span className="font-medium">{total}</span> resultados
      </div>

      {/* Controls */}
      <div className="flex items-center gap-4">
        {/* Per page selector */}
        <div className="flex items-center gap-2">
          <label htmlFor="perPage" className="text-sm text-slate-600">
            Por página:
          </label>
          <select
            id="perPage"
            value={perPage}
            onChange={handlePerPageChange}
            className="text-sm border border-slate-300 rounded px-2 py-1 bg-white"
          >
            <option value="10">10</option>
            <option value="20">20</option>
            <option value="50">50</option>
            <option value="100">100</option>
          </select>
        </div>

        {/* Page numbers */}
        <nav className="flex items-center gap-1" aria-label="Paginación">
          {/* Previous button */}
          {currentPage > 1 ? (
            <Link
              href={buildUrl(currentPage - 1)}
              className="px-3 py-1 text-sm border border-slate-300 rounded hover:bg-slate-50 transition-colors"
              aria-label="Página anterior"
            >
              ‹
            </Link>
          ) : (
            <span className="px-3 py-1 text-sm border border-slate-200 rounded text-slate-400 cursor-not-allowed">
              ‹
            </span>
          )}

          {/* Page numbers */}
          {pageNumbers.map((pageNum, index) => {
            if (pageNum === '...') {
              return (
                <span key={`dots-${index}`} className="px-2 text-slate-400">
                  ...
                </span>
              )
            }

            const isCurrentPage = pageNum === currentPage

            return (
              <Link
                key={pageNum}
                href={buildUrl(pageNum as number)}
                className={`px-3 py-1 text-sm border rounded transition-colors ${
                  isCurrentPage
                    ? 'bg-amber-600 text-white border-amber-600 font-medium'
                    : 'border-slate-300 hover:bg-slate-50'
                }`}
                aria-label={`Página ${pageNum}`}
                aria-current={isCurrentPage ? 'page' : undefined}
              >
                {pageNum}
              </Link>
            )
          })}

          {/* Next button */}
          {currentPage < totalPages ? (
            <Link
              href={buildUrl(currentPage + 1)}
              className="px-3 py-1 text-sm border border-slate-300 rounded hover:bg-slate-50 transition-colors"
              aria-label="Página siguiente"
            >
              ›
            </Link>
          ) : (
            <span className="px-3 py-1 text-sm border border-slate-200 rounded text-slate-400 cursor-not-allowed">
              ›
            </span>
          )}
        </nav>
      </div>
    </div>
  )
}
