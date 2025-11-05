'use client'

import Link from 'next/link'
import { Mail, Linkedin } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="border-t bg-muted/30 mt-auto">
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

        {/* Subtle mention of next project */}
        <div className="mt-3 text-center text-xs text-muted-foreground/70">
          <Link href="/acerca-de" className="hover:text-foreground transition-colors">
            Próximamente: <span className="font-medium">Fides Sacristía</span> - Suite con IA para parroquias
          </Link>
        </div>
      </div>
    </footer>
  )
}
