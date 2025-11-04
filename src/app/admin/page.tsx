'use client'

import { useEffect, useState, useCallback } from 'react'
import { getSupabaseBrowser } from '@/lib/auth'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'
import { useRouter } from 'next/navigation'

interface UserData {
  id: string
  email: string
  full_name: string
  role: string
  user_status: string
  parish_name: string | null
  subscription_start: string | null
  subscription_end: string | null
  last_payment_date: string | null
  payment_method: string | null
  subscription_status: string
  registered_at: string
  items_count: number
}

interface PaymentDialogData {
  userId: string
  userName: string
  userEmail: string
  currentStatus: string
}

export default function AdminPanel() {
  const [users, setUsers] = useState<UserData[]>([])
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [paymentDialog, setPaymentDialog] = useState<PaymentDialogData | null>(null)
  const [paymentAmount, setPaymentAmount] = useState('10.00')
  const [paymentReference, setPaymentReference] = useState('')
  const [paymentNotes, setPaymentNotes] = useState('')
  const [approvalNotes, setApprovalNotes] = useState('')
  const { toast } = useToast()
  const router = useRouter()

  const loadUsers = useCallback(async () => {
    const supabase = getSupabaseBrowser()
    if (!supabase) return

    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('admin_users_dashboard')
        .select('*')
        .order('registered_at', { ascending: false })

      if (error) throw error

      setUsers(data || [])
    } catch (error) {
      console.error('Error cargando usuarios:', error)
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los usuarios',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }, [toast])

  const checkAdminAndLoadData = useCallback(async () => {
    const supabase = getSupabaseBrowser()
    if (!supabase) {
      router.push('/auth')
      return
    }

    try {
      // Verificar si el usuario es admin
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth')
        return
      }

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      if (profileError || profile?.role !== 'admin') {
        toast({
          title: 'Acceso denegado',
          description: 'No tienes permisos de administrador',
          variant: 'destructive',
        })
        router.push('/')
        return
      }

      setIsAdmin(true)
      await loadUsers()
    } catch (error) {
      console.error('Error verificando admin:', error)
      router.push('/auth')
    }
  }, [router, toast, loadUsers])

  useEffect(() => {
    checkAdminAndLoadData()
  }, [checkAdminAndLoadData])

  

  async function approveUser(userId: string) {
    const supabase = getSupabaseBrowser()
    if (!supabase) return

    try {
      const { error } = await supabase.rpc('approve_user', {
        target_user_id: userId,
        admin_notes: approvalNotes || null,
      })

      if (error) throw error

      toast({
        title: 'Usuario aprobado',
        description: 'El usuario ha sido aprobado. Ahora debe realizar el pago.',
      })

      setApprovalNotes('')
      await loadUsers()
    } catch (error) {
      console.error('Error aprobando usuario:', error)
      toast({
        title: 'Error',
        description: 'No se pudo aprobar el usuario',
        variant: 'destructive',
      })
    }
  }

  async function activateSubscription() {
    if (!paymentDialog) return

    const supabase = getSupabaseBrowser()
    if (!supabase) return

    try {
      const { error } = await supabase.rpc('activate_subscription', {
        target_user_id: paymentDialog.userId,
        payment_amount: parseFloat(paymentAmount),
        payment_ref: paymentReference || null,
        method: 'manual',
        admin_notes: paymentNotes || null,
      })

      if (error) throw error

      toast({
        title: 'Suscripción activada',
        description: `${paymentDialog.userName} ahora tiene acceso completo por 1 mes`,
      })

      setPaymentDialog(null)
      setPaymentAmount('10.00')
      setPaymentReference('')
      setPaymentNotes('')
      await loadUsers()
    } catch (error) {
      console.error('Error activando suscripción:', error)
      toast({
        title: 'Error',
        description: 'No se pudo activar la suscripción',
        variant: 'destructive',
      })
    }
  }

  async function renewSubscription(userId: string, userName: string) {
    const supabase = getSupabaseBrowser()
    if (!supabase) return

    try {
      const { error } = await supabase.rpc('renew_subscription', {
        target_user_id: userId,
        payment_amount: 10.00,
        payment_ref: null,
        admin_notes: 'Renovación manual',
      })

      if (error) throw error

      toast({
        title: 'Suscripción renovada',
        description: `${userName} tiene 1 mes más de acceso`,
      })

      await loadUsers()
    } catch (error) {
      console.error('Error renovando suscripción:', error)
      toast({
        title: 'Error',
        description: 'No se pudo renovar la suscripción',
        variant: 'destructive',
      })
    }
  }

  async function suspendUser(userId: string, userName: string) {
    const supabase = getSupabaseBrowser()
    if (!supabase) return

    const reason = prompt(`¿Por qué suspender a ${userName}?`)
    if (!reason) return

    try {
      const { error } = await supabase.rpc('suspend_user', {
        target_user_id: userId,
        reason,
      })

      if (error) throw error

      toast({
        title: 'Usuario suspendido',
        description: `${userName} ha sido suspendido`,
      })

      await loadUsers()
    } catch (error) {
      console.error('Error suspendiendo usuario:', error)
      toast({
        title: 'Error',
        description: 'No se pudo suspender el usuario',
        variant: 'destructive',
      })
    }
  }

  function getStatusBadge(status: string) {
    const variants: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
      pending: { label: 'Pendiente aprobación', variant: 'outline' },
      approved_unpaid: { label: 'Aprobado - Sin pago', variant: 'secondary' },
      active: { label: 'Activo', variant: 'default' },
      suspended: { label: 'Suspendido', variant: 'destructive' },
      rejected: { label: 'Rechazado', variant: 'destructive' },
    }

    const config = variants[status] || { label: status, variant: 'outline' as const }
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  function getSubscriptionBadge(status: string) {
    const variants: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
      'Sin suscripción': { variant: 'outline' },
      'Expirado': { variant: 'destructive' },
      'Por expirar': { variant: 'secondary' },
      'Activo': { variant: 'default' },
    }

    const config = variants[status] || { variant: 'outline' as const }
    return <Badge variant={config.variant}>{status}</Badge>
  }

  const pendingUsers = users.filter(u => u.user_status === 'pending')
  const approvedUnpaidUsers = users.filter(u => u.user_status === 'approved_unpaid')
  const activeUsers = users.filter(u => u.user_status === 'active')
  const expiringUsers = activeUsers.filter(u => u.subscription_status === 'Por expirar')

  if (!isAdmin) {
    return (
      <div className="container mx-auto p-8">
        <Card>
          <CardHeader>
            <CardTitle>Verificando permisos...</CardTitle>
          </CardHeader>
        </Card>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="container mx-auto p-8">
        <Card>
          <CardHeader>
            <CardTitle>Cargando usuarios…</CardTitle>
            <CardDescription>Por favor, espera unos segundos.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Panel de Administración</h1>
        <p className="text-muted-foreground">
          Gestión de usuarios y suscripciones - Diócesis de Guadix
        </p>
      </div>

      {/* Resumen de estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Pendientes de aprobación</CardDescription>
            <CardTitle className="text-3xl">{pendingUsers.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Aprobados sin pago</CardDescription>
            <CardTitle className="text-3xl">{approvedUnpaidUsers.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Usuarios activos</CardDescription>
            <CardTitle className="text-3xl">{activeUsers.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Por expirar (7 días)</CardDescription>
            <CardTitle className="text-3xl">{expiringUsers.length}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Tabs con diferentes vistas */}
      <Tabs defaultValue="pending" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="pending">
            Pendientes ({pendingUsers.length})
          </TabsTrigger>
          <TabsTrigger value="unpaid">
            Sin pago ({approvedUnpaidUsers.length})
          </TabsTrigger>
          <TabsTrigger value="active">
            Activos ({activeUsers.length})
          </TabsTrigger>
          <TabsTrigger value="all">
            Todos ({users.length})
          </TabsTrigger>
        </TabsList>

        {/* Usuarios pendientes de aprobación */}
        <TabsContent value="pending">
          <Card>
            <CardHeader>
              <CardTitle>Usuarios pendientes de aprobación</CardTitle>
              <CardDescription>
                Nuevos registros que esperan tu autorización
              </CardDescription>
            </CardHeader>
            <CardContent>
              {pendingUsers.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  No hay usuarios pendientes
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Parroquia</TableHead>
                      <TableHead>Fecha registro</TableHead>
                      <TableHead>Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.full_name}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>{user.parish_name || 'Sin asignar'}</TableCell>
                        <TableCell>
                          {new Date(user.registered_at).toLocaleDateString('es-ES')}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => approveUser(user.id)}
                            >
                              Aprobar
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => suspendUser(user.id, user.full_name)}
                            >
                              Rechazar
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Usuarios aprobados sin pago */}
        <TabsContent value="unpaid">
          <Card>
            <CardHeader>
              <CardTitle>Usuarios aprobados esperando pago</CardTitle>
              <CardDescription>
                Usuarios autorizados que deben realizar el pago de 10€/mes
              </CardDescription>
            </CardHeader>
            <CardContent>
              {approvedUnpaidUsers.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  No hay usuarios en esta categoría
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Parroquia</TableHead>
                      <TableHead>Aprobado hace</TableHead>
                      <TableHead>Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {approvedUnpaidUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.full_name}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>{user.parish_name || 'Sin asignar'}</TableCell>
                        <TableCell>
                          {new Date(user.registered_at).toLocaleDateString('es-ES')}
                        </TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            onClick={() => setPaymentDialog({
                              userId: user.id,
                              userName: user.full_name,
                              userEmail: user.email,
                              currentStatus: user.user_status,
                            })}
                          >
                            Registrar pago
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Usuarios activos */}
        <TabsContent value="active">
          <Card>
            <CardHeader>
              <CardTitle>Usuarios activos</CardTitle>
              <CardDescription>
                Usuarios con suscripción activa
              </CardDescription>
            </CardHeader>
            <CardContent>
              {activeUsers.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  No hay usuarios activos
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Items</TableHead>
                      <TableHead>Suscripción hasta</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {activeUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.full_name}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>{user.items_count}</TableCell>
                        <TableCell>
                          {user.subscription_end
                            ? new Date(user.subscription_end).toLocaleDateString('es-ES')
                            : 'N/A'}
                        </TableCell>
                        <TableCell>
                          {getSubscriptionBadge(user.subscription_status)}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => renewSubscription(user.id, user.full_name)}
                            >
                              Renovar
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => suspendUser(user.id, user.full_name)}
                            >
                              Suspender
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Todos los usuarios */}
        <TabsContent value="all">
          <Card>
            <CardHeader>
              <CardTitle>Todos los usuarios</CardTitle>
              <CardDescription>Vista completa de todos los usuarios registrados</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Parroquia</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Suscripción</TableHead>
                    <TableHead>Items</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.full_name}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>{user.parish_name || 'Sin asignar'}</TableCell>
                      <TableCell>{getStatusBadge(user.user_status)}</TableCell>
                      <TableCell>{getSubscriptionBadge(user.subscription_status)}</TableCell>
                      <TableCell>{user.items_count}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialog para registrar pago */}
      <Dialog open={!!paymentDialog} onOpenChange={() => setPaymentDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar pago de suscripción</DialogTitle>
            <DialogDescription>
              Activar suscripción para {paymentDialog?.userName}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="amount">Monto (€)</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="reference">Referencia de pago (opcional)</Label>
              <Input
                id="reference"
                placeholder="Número Bizum, ID Ko-fi, etc."
                value={paymentReference}
                onChange={(e) => setPaymentReference(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="notes">Notas (opcional)</Label>
              <Textarea
                id="notes"
                placeholder="Información adicional sobre el pago"
                value={paymentNotes}
                onChange={(e) => setPaymentNotes(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPaymentDialog(null)}>
              Cancelar
            </Button>
            <Button onClick={activateSubscription}>
              Activar suscripción (1 mes)
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
