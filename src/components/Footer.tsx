'use client'

import Link from 'next/link'
import { Mail, Linkedin, Sparkles, ArrowRight } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="border-t mt-auto">
      {/* Banner llamativo para Fides Sacristía */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-700 dark:to-indigo-700">
        <div className="container mx-auto px-4 py-4">
          <Link
            href="/acerca-de"
            className="flex flex-col sm:flex-row items-center justify-center gap-3 text-white hover:opacity-90 transition-opacity group"
          >
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 animate-pulse" />
              <span className="text-lg font-semibold">Próximamente: Fides Sacristía</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm sm:text-base text-blue-100">
                Suite completa con IA para gestión parroquial
              </span>
              <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>
        </div>
      </div>

      {/* Footer tradicional */}
      <div className="bg-muted/30">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
            {/* Branding */}
            <div className="flex flex-col sm:flex-row items-center gap-2">
              <span>Desarrollado por</span>
              <span className="font-medium text-foreground">Manuel Carrasco García</span>
            </div>

            {/* Links */}
            <div className="flex items-center gap-4">
              <Link
                href="/acerca-de"
                className="hover:text-foreground transition-colors underline"
              >
                Acerca de
              </Link>
              <a
                href="mailto:mcgnexus@gmail.com"
                className="hover:text-foreground transition-colors flex items-center gap-1"
                title="Contacto por email"
              >
                <Mail className="h-4 w-4" />
                <span className="hidden sm:inline">mcgnexus@gmail.com</span>
              </a>
              <a
                href="https://www.linkedin.com/in/manuel-carrasco-garcia"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-foreground transition-colors flex items-center gap-1"
                title="LinkedIn"
              >
                <Linkedin className="h-4 w-4" />
                <span className="hidden sm:inline">LinkedIn</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
