"use client"
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { ArrowLeft, BookOpen, Menu, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { useState } from 'react'
import { cn } from '@/lib/utils'

export default function NavBar() {
  const router = useRouter()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <nav className="w-full border-b bg-card no-print sticky top-0 z-50 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo y nombre */}
          <Link
            href="/"
            className="flex items-center gap-3 hover:opacity-80 transition-opacity group"
            aria-label="Ir a inicio"
          >
            <div className="relative h-10 w-10 flex-shrink-0">
              <Image
                src="/guadix.svg"
                alt="Escudo Diócesis de Guadix"
                width={40}
                height={40}
                priority
                className="object-contain transition-transform group-hover:scale-105"
              />
            </div>
            <div className="hidden sm:block">
              <span className="text-base font-semibold text-foreground">
                Diócesis de Guadix
              </span>
              <p className="text-xs text-muted-foreground hidden md:block">
                Inventario Patrimonial
              </p>
            </div>
          </Link>

          {/* Navegación Desktop */}
          <div className="hidden md:flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.back()}
              aria-label="Volver a la página anterior"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver
            </Button>

            <Button
              variant="ghost"
              size="sm"
              asChild
            >
              <Link href="/catalogo" aria-label="Ir al catálogo diocesano">
                <BookOpen className="mr-2 h-4 w-4" />
                Catálogo
              </Link>
            </Button>

            <ThemeToggle />
          </div>

          {/* Navegación móvil */}
          <div className="flex md:hidden items-center gap-2">
            <ThemeToggle />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label={mobileMenuOpen ? "Cerrar menú" : "Abrir menú"}
            >
              {mobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>

        {/* Menú móvil desplegable */}
        <div
          className={cn(
            "md:hidden border-t overflow-hidden transition-all duration-200 ease-in-out",
            mobileMenuOpen ? "max-h-48 opacity-100" : "max-h-0 opacity-0"
          )}
        >
          <div className="py-3 space-y-1">
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start"
              onClick={() => {
                router.back()
                setMobileMenuOpen(false)
              }}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver
            </Button>

            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start"
              asChild
              onClick={() => setMobileMenuOpen(false)}
            >
              <Link href="/catalogo">
                <BookOpen className="mr-2 h-4 w-4" />
                Catálogo Diocesano
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </nav>
  )
}
