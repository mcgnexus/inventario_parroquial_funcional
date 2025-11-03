import type { Metadata } from 'next'
import { Inter, Lora } from 'next/font/google'
import './globals.css'
import NavBar from '@/components/NavBar'
import { ThemeProvider } from '@/components/theme-provider'

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
      <body className="antialiased" suppressHydrationWarning>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <NavBar />
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}