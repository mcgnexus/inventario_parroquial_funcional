import type { Metadata } from 'next'
import { Inter, Lora } from 'next/font/google'
import './globals.css'
import NavBar from '@/components/NavBar'

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
})

const lora = Lora({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-lora',
})

export const metadata: Metadata = {
  title: 'FidesDigital',
  description: 'Sistema SaaS de inventario y catalogación de patrimonio parroquial mediante inteligencia artificial',
  keywords: 'patrimonio, parroquial, inventario, catalogación, arte sacro, IA',
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  viewportFit: 'cover',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es" className={`${inter.variable} ${lora.variable}`} suppressHydrationWarning>
      <body className="bg-slate-50 text-slate-800 antialiased" suppressHydrationWarning>
        <NavBar />
        {children}
      </body>
    </html>
  )
}