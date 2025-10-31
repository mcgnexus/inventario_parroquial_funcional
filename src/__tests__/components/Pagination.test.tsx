import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import Pagination from '@/components/Pagination'

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    prefetch: vi.fn(),
  }),
}))

describe('Pagination Component', () => {
  it('should render pagination info correctly', () => {
    const { container } = render(
      <Pagination
        currentPage={1}
        totalPages={5}
        total={100}
        perPage={20}
        baseUrl="/catalogo"
      />
    )

    // Verificar que se renderiza correctamente
    expect(screen.getByText(/Mostrando/)).toBeInTheDocument()
    expect(container.textContent).toContain('resultados')
    // Verificar que muestra información de paginación
    const elements = screen.queryAllByText('100')
    expect(elements.length).toBeGreaterThan(0)
  })

  it('should not render when there is only 1 page', () => {
    const { container } = render(
      <Pagination
        currentPage={1}
        totalPages={1}
        total={10}
        perPage={20}
        baseUrl="/catalogo"
      />
    )

    expect(container.firstChild).toBeNull()
  })

  it('should render correct number of page buttons', () => {
    render(
      <Pagination
        currentPage={3}
        totalPages={5}
        total={100}
        perPage={20}
        baseUrl="/catalogo"
      />
    )

    // Should have page numbers 1, 2, 3, 4, 5
    expect(screen.getByText('1')).toBeInTheDocument()
    expect(screen.getByText('2')).toBeInTheDocument()
    expect(screen.getByText('3')).toBeInTheDocument()
    expect(screen.getByText('4')).toBeInTheDocument()
    expect(screen.getByText('5')).toBeInTheDocument()
  })

  it('should highlight current page', () => {
    render(
      <Pagination
        currentPage={3}
        totalPages={5}
        total={100}
        perPage={20}
        baseUrl="/catalogo"
      />
    )

    const currentPageButton = screen.getByLabelText('Página 3')
    expect(currentPageButton).toHaveClass('bg-amber-600')
    expect(currentPageButton).toHaveAttribute('aria-current', 'page')
  })

  it('should disable previous button on first page', () => {
    const { container } = render(
      <Pagination
        currentPage={1}
        totalPages={5}
        total={100}
        perPage={20}
        baseUrl="/catalogo"
      />
    )

    // El botón anterior está deshabilitado (es un span, no un link)
    const prevButton = container.querySelector('.cursor-not-allowed')
    expect(prevButton).toBeInTheDocument()
    expect(prevButton?.textContent).toBe('‹')
  })

  it('should disable next button on last page', () => {
    const { container } = render(
      <Pagination
        currentPage={5}
        totalPages={5}
        total={100}
        perPage={20}
        baseUrl="/catalogo"
      />
    )

    // El botón siguiente está deshabilitado
    const allDisabled = container.querySelectorAll('.cursor-not-allowed')
    const nextButton = Array.from(allDisabled).find(el => el.textContent === '›')
    expect(nextButton).toBeInTheDocument()
  })

  it('should show dots for large page ranges', () => {
    render(
      <Pagination
        currentPage={10}
        totalPages={20}
        total={400}
        perPage={20}
        baseUrl="/catalogo"
      />
    )

    const dots = screen.getAllByText('...')
    expect(dots.length).toBeGreaterThan(0)
  })

  it('should preserve query parameters in pagination links', () => {
    render(
      <Pagination
        currentPage={1}
        totalPages={5}
        total={100}
        perPage={20}
        baseUrl="/catalogo"
        preserveParams={{ categoria: 'pintura', q: 'test' }}
      />
    )

    const page2Button = screen.getByLabelText('Página 2')
    expect(page2Button).toHaveAttribute('href')
    const href = page2Button.getAttribute('href')
    expect(href).toContain('categoria=pintura')
    expect(href).toContain('q=test')
  })

  it('should have per-page selector', () => {
    render(
      <Pagination
        currentPage={1}
        totalPages={5}
        total={100}
        perPage={20}
        baseUrl="/catalogo"
      />
    )

    const perPageSelect = screen.getByLabelText('Por página:')
    expect(perPageSelect).toBeInTheDocument()
    expect(perPageSelect).toHaveValue('20')
  })
})
