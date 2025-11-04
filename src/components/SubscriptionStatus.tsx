'use client'

import { useEffect, useState } from 'react'
import { getSupabaseBrowser } from '@/lib/auth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Clock, XCircle } from 'lucide-react'

interface SubscriptionInfo {
  user_status: string
  subscription_end: string | null
  payment_method: string | null
  role: string
}

export default function SubscriptionStatus() {
  const [info, setInfo] = useState<SubscriptionInfo | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadSubscriptionInfo()
  }, [])

  async function loadSubscriptionInfo() {
    const supabase = getSupabaseBrowser()
    if (!supabase) return

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('profiles')
        .select('user_status, subscription_end, payment_method, role')
        .eq('id', user.id)
        .single()

      if (error) throw error
      setInfo(data)
    } catch (error) {
      console.error('Error cargando info de suscripción:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Cargando...</CardTitle>
        </CardHeader>
      </Card>
    )
  }

  if (!info || info.role === 'admin') {
    return null // No mostrar a admins
  }

  // Estado: Pendiente de aprobación
  if (info.user_status === 'pending') {
    return (
      <Alert>
        <Clock className="h-4 w-4" />
        <AlertTitle>Registro pendiente de aprobación</AlertTitle>
        <AlertDescription className="mt-2 space-y-2">
          <p>
            Tu cuenta está siendo revisada por el administrador de la Diócesis de Guadix.
          </p>
          <p className="text-sm text-muted-foreground">
            Recibirás confirmación cuando tu cuenta sea aprobada.
          </p>
        </AlertDescription>
      </Alert>
    )
  }

  // Estado: Activo - Mostrar mensaje discreto de colaboración opcional
  if (info.user_status === 'active') {
    return (
      <Card className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <span>💙</span>
            Colaboración voluntaria
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-3">
            Si deseas colaborar con el mantenimiento de esta aplicación, puedes enviar tu aportación voluntaria por Bizum:
          </p>
          <div className="bg-white dark:bg-gray-900 rounded-md p-3 border border-blue-200 inline-block">
            <p className="text-xs text-muted-foreground mb-1">Bizum (opcional):</p>
            <p className="text-xl font-semibold text-blue-700 dark:text-blue-300">
              614 242 716
            </p>
          </div>
          <p className="text-xs text-muted-foreground mt-3 italic">
            Tu colaboración ayuda a mantener el servicio, pero es completamente opcional.
          </p>
        </CardContent>
      </Card>
    )
  }

  // Estado: Suspendido
  if (info.user_status === 'suspended') {
    return (
      <Alert variant="destructive">
        <XCircle className="h-4 w-4" />
        <AlertTitle>Cuenta suspendida</AlertTitle>
        <AlertDescription className="mt-2">
          <p>Tu cuenta ha sido suspendida.</p>
          <p className="mt-2">
            Para más información, contacta al administrador en{' '}
            <strong>mcgnexus@gmail.com</strong>.
          </p>
        </AlertDescription>
      </Alert>
    )
  }

  // Estado: Rechazado
  if (info.user_status === 'rejected') {
    return (
      <Alert variant="destructive">
        <XCircle className="h-4 w-4" />
        <AlertTitle>Cuenta rechazada</AlertTitle>
        <AlertDescription className="mt-2">
          <p>Tu solicitud de registro no ha sido aprobada.</p>
          <p className="mt-2">
            Para más información, contacta al administrador en{' '}
            <strong>mcgnexus@gmail.com</strong>.
          </p>
        </AlertDescription>
      </Alert>
    )
  }

  return null
}
