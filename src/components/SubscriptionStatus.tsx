'use client'

import { useEffect, useState } from 'react'
import { getSupabaseBrowser } from '@/lib/auth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { AlertCircle, CheckCircle2, Clock, XCircle } from 'lucide-react'

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

  const getDaysRemaining = () => {
    if (!info.subscription_end) return null
    const end = new Date(info.subscription_end)
    const now = new Date()
    const diffTime = end.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  const daysRemaining = getDaysRemaining()

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
            Recibirás un email cuando tu cuenta sea aprobada y podrás proceder con el pago.
          </p>
        </AlertDescription>
      </Alert>
    )
  }

  // Estado: Aprobado pero sin pago
  if (info.user_status === 'approved_unpaid') {
    return (
      <div className="space-y-4">
        <Alert className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950">
          <CheckCircle2 className="h-4 w-4 text-blue-600" />
          <AlertTitle className="text-blue-800 dark:text-blue-100">¡Cuenta aprobada! Último paso: Realizar el pago</AlertTitle>
          <AlertDescription className="mt-2 space-y-3">
            <p className="text-blue-700 dark:text-blue-200">
              Tu cuenta ha sido aprobada por el administrador. Para activar el acceso completo, realiza la colaboración de{' '}
              <strong className="text-lg">10€/mes</strong>.
            </p>
          </AlertDescription>
        </Alert>

        <Card className="border-2 border-primary">
          <CardHeader className="bg-primary/5">
            <CardTitle className="flex items-center gap-2">
              <span className="text-2xl">💳</span>
              Instrucciones de pago
            </CardTitle>
            <CardDescription>Elige tu método preferido</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            {/* BIZUM - OPCIÓN PRINCIPAL */}
            <div className="rounded-lg border-2 border-green-500 bg-green-50 dark:bg-green-950 p-4">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-2xl">📱</span>
                <strong className="text-lg text-green-800 dark:text-green-100">Opción 1 - Bizum (Recomendado)</strong>
              </div>
              <div className="space-y-2">
                <div className="bg-white dark:bg-gray-900 rounded-md p-3 border border-green-200">
                  <p className="text-sm text-muted-foreground mb-1">Enviar Bizum a:</p>
                  <p className="text-3xl font-bold text-green-700 dark:text-green-300 tracking-wider">
                    614 242 716
                  </p>
                </div>
                <div className="bg-white dark:bg-gray-900 rounded-md p-3 border border-green-200">
                  <p className="text-sm text-muted-foreground mb-1">Concepto:</p>
                  <p className="text-lg font-semibold">Inventarios Diocesano</p>
                </div>
                <div className="bg-white dark:bg-gray-900 rounded-md p-3 border border-green-200">
                  <p className="text-sm text-muted-foreground mb-1">Importe:</p>
                  <p className="text-lg font-semibold">10,00 €</p>
                </div>
              </div>
            </div>

            {/* TRANSFERENCIA - OPCIÓN ALTERNATIVA */}
            <div className="rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 p-4">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-2xl">🏦</span>
                <strong className="text-base text-gray-800 dark:text-gray-100">Opción 2 - Transferencia bancaria</strong>
              </div>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-muted-foreground">IBAN:</span>
                  <p className="font-mono font-semibold">ES12 3456 7890 1234 5678 9012</p>
                  <p className="text-xs text-red-600 dark:text-red-400">← Reemplaza con tu IBAN real</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Beneficiario:</span>
                  <p className="font-semibold">Diócesis de Guadix</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Concepto:</span>
                  <p className="font-semibold">Inventarios - [Tu email]</p>
                </div>
              </div>
            </div>

            {/* INSTRUCCIONES FINALES */}
            <div className="rounded-lg bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 p-4">
              <p className="font-semibold mb-2 text-amber-900 dark:text-amber-100">📧 Después de realizar el pago:</p>
              <ol className="list-decimal list-inside space-y-1 text-sm text-amber-800 dark:text-amber-200">
                <li>Haz captura del comprobante de pago</li>
                <li>Envíalo por email a: <strong>mcgnexus@gmail.com</strong></li>
                <li>Incluye tu email de registro en el mensaje</li>
              </ol>
              <p className="mt-3 text-xs text-amber-700 dark:text-amber-300">
                ⏱️ Tu acceso se activará en menos de 24 horas (normalmente en pocas horas).
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Estado: Activo
  if (info.user_status === 'active') {
    const isExpiringSoon = daysRemaining !== null && daysRemaining <= 7
    const isExpired = daysRemaining !== null && daysRemaining < 0

    if (isExpired) {
      return (
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertTitle>Suscripción expirada</AlertTitle>
          <AlertDescription className="mt-2">
            <p>
              Tu suscripción expiró el{' '}
              {info.subscription_end
                ? new Date(info.subscription_end).toLocaleDateString('es-ES')
                : 'fecha desconocida'}
              .
            </p>
            <p className="mt-2">
              Para renovar, realiza el pago de <strong>10€</strong> y contacta al administrador.
            </p>
          </AlertDescription>
        </Alert>
      )
    }

    if (isExpiringSoon) {
      return (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Suscripción por expirar</AlertTitle>
          <AlertDescription className="mt-2">
            <p>
              Tu suscripción expira en <strong>{daysRemaining} días</strong> (
              {info.subscription_end
                ? new Date(info.subscription_end).toLocaleDateString('es-ES')
                : 'fecha desconocida'}
              ).
            </p>
            <p className="mt-2">
              Recuerda renovar tu pago de <strong>10€/mes</strong> para mantener el acceso.
            </p>
          </AlertDescription>
        </Alert>
      )
    }

    // Todo bien
    return (
      <Card className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Suscripción activa</CardTitle>
            <Badge variant="default">Activo</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Tu acceso es válido hasta el{' '}
            <strong>
              {info.subscription_end
                ? new Date(info.subscription_end).toLocaleDateString('es-ES', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })
                : 'fecha desconocida'}
            </strong>{' '}
            ({daysRemaining} días restantes).
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
