'use client'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { getCurrentUser, onAuthStateChange, signOut } from '@/lib/auth'
import { useRouter } from 'next/navigation'
import { LogIn, UserPlus, FileText, PlusCircle, LogOut, Church } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

export default function Home() {
  const [userEmail, setUserEmail] = useState<string | null>(null)

  useEffect(() => {
    let unsub: (() => void) | null = null
    ;(async () => {
      const u = await getCurrentUser()
      setUserEmail(u?.email ?? null)
    })()
    unsub = onAuthStateChange(() => {
      getCurrentUser().then(u => {
        setUserEmail(u?.email ?? null)
      })
    })
    return () => { unsub?.() }
  }, [])

  const router = useRouter()
  const handleSignOut = async () => {
    await signOut()
    setUserEmail(null)
    router.refresh()
  }

  return (
    <main className="min-h-screen bg-background py-8 sm:py-12 px-3 sm:px-4">
      <div className="container mx-auto max-w-6xl">
        {/* Header con tema litúrgico */}
        <header className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Church className="h-10 w-10 sm:h-12 sm:w-12 text-primary" />
            <h1 className="text-4xl sm:text-6xl font-bold text-primary">
              FidesDigital
            </h1>
          </div>
          <p className="text-lg text-muted-foreground mb-2">
            Inventario Patrimonial Eclesiástico
          </p>
          <p className="text-sm text-muted-foreground">
            Catalogación asistida por IA para el patrimonio de la Diócesis
          </p>
          {userEmail && (
            <div className="mt-4">
              <Badge variant="secondary" className="text-sm">
                Sesión activa: {userEmail}
              </Badge>
            </div>
          )}
        </header>

        {/* Grid de acciones principales */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {/* Catálogo Público */}
          <Link href="/catalogo" className="group">
            <Card className="h-full transition-all hover:shadow-lg hover:border-primary/50">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <FileText className="h-8 w-8 text-primary group-hover:scale-110 transition-transform" />
                  <Badge variant="outline">Público</Badge>
                </div>
                <CardTitle className="group-hover:text-primary transition-colors">
                  Catálogo Diocesano
                </CardTitle>
                <CardDescription>
                  Explora el patrimonio artístico y litúrgico inventariado de la Diócesis de Guadix
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>

          {/* Inserción de inventario */}
          <Link
            href={userEmail ? '/inventario' : '/auth?mode=login&reason=login-required'}
            className="group"
          >
            <Card className="h-full transition-all hover:shadow-lg hover:border-primary/50">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <PlusCircle className="h-8 w-8 text-primary group-hover:scale-110 transition-transform" />
                  {!userEmail && (
                    <Badge variant="secondary" className="bg-amber-100 text-amber-700 border-amber-200">
                      Requiere login
                    </Badge>
                  )}
                </div>
                <CardTitle className="group-hover:text-primary transition-colors">
                  Nueva Catalogación
                </CardTitle>
                <CardDescription>
                  Analiza una fotografía con IA y registra un objeto del patrimonio parroquial
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>

          {/* Iniciar sesión */}
          {!userEmail && (
            <Link href="/auth?mode=login" className="group">
              <Card className="h-full transition-all hover:shadow-lg hover:border-primary/50">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <LogIn className="h-8 w-8 text-primary group-hover:scale-110 transition-transform" />
                  </div>
                  <CardTitle className="group-hover:text-primary transition-colors">
                    Iniciar Sesión
                  </CardTitle>
                  <CardDescription>
                    Accede para gestionar el inventario de tu parroquia
                  </CardDescription>
                </CardHeader>
              </Card>
            </Link>
          )}

          {/* Registrarse */}
          {!userEmail && (
            <Link href="/auth?mode=register" className="group">
              <Card className="h-full transition-all hover:shadow-lg hover:border-primary/50">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <UserPlus className="h-8 w-8 text-primary group-hover:scale-110 transition-transform" />
                  </div>
                  <CardTitle className="group-hover:text-primary transition-colors">
                    Registrarse
                  </CardTitle>
                  <CardDescription>
                    Crea una cuenta vinculada a tu parroquia para colaborar en el inventario
                  </CardDescription>
                </CardHeader>
              </Card>
            </Link>
          )}

          {/* Salir - solo visible si hay sesión */}
          {userEmail && (
            <Card className="h-full">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <LogOut className="h-8 w-8 text-destructive" />
                </div>
                <CardTitle>Cerrar Sesión</CardTitle>
                <CardDescription className="mb-4">
                  Finaliza tu sesión actual de forma segura
                </CardDescription>
                <Button
                  variant="destructive"
                  onClick={handleSignOut}
                  className="w-full"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Salir
                </Button>
              </CardHeader>
            </Card>
          )}
        </section>

        {/* Información adicional */}
        <Card className="bg-muted/50 border-primary/20">
          <CardContent className="pt-6">
            <div className="grid md:grid-cols-3 gap-6 text-center">
              <div>
                <div className="text-3xl font-bold text-primary mb-1">IA</div>
                <p className="text-sm text-muted-foreground">
                  Análisis automático con inteligencia artificial
                </p>
              </div>
              <div>
                <div className="text-3xl font-bold text-primary mb-1">Cloud</div>
                <p className="text-sm text-muted-foreground">
                  Almacenamiento seguro en la nube de Supabase
                </p>
              </div>
              <div>
                <div className="text-3xl font-bold text-primary mb-1">Colaborativo</div>
                <p className="text-sm text-muted-foreground">
                  Múltiples parroquias trabajando juntas
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <footer className="text-center mt-12 text-sm text-muted-foreground">
          <p className="flex items-center justify-center gap-2">
            <Church className="h-4 w-4" />
            Diócesis de Guadix • Desarrollado por Manuel Carrasco García
          </p>
        </footer>
      </div>
    </main>
  )
}
