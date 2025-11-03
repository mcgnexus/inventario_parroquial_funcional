"use client"
import { useEffect, useState, Suspense } from 'react'
import { getCurrentUser, signOut, onAuthStateChange, signUpWithProfile, getSupabaseBrowser } from '@/lib/auth'
import { useSearchParams, useRouter } from 'next/navigation'
import { Eye, EyeOff, LogIn, UserPlus, LogOut, User } from 'lucide-react'
import type { PostgrestError } from '@supabase/supabase-js'
import type { AuthResponse } from '@supabase/supabase-js'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'

type ParishOption = { id: string; name: string }
export default function AuthPage() {
  return (
    <Suspense fallback={null}>
      <AuthPageContent />
    </Suspense>
  )
}

function AuthPageContent() {
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [parishId, setParishId] = useState('')
  const [parishOptions, setParishOptions] = useState<{ id: string; name: string }[]>([])
  const [parishOpen, setParishOpen] = useState(false)
  const [parishLoading, setParishLoading] = useState(false)
  const [selectedParishId, setSelectedParishId] = useState<string | null>(null)
  const [role, setRole] = useState('user')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const searchParams = useSearchParams()
  const reason = searchParams.get('reason')
  const urlMode = searchParams.get('mode')
  const router = useRouter()
  useEffect(() => {
    console.log('[Auth] Componente montado, urlMode:', urlMode)
    if (urlMode === 'register' || urlMode === 'login') {
      setMode(urlMode as 'login' | 'register')
    }
  }, [urlMode])

  // Capturar errores globales
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      console.error('[Auth] Error global capturado:', event.error)
    }
    window.addEventListener('error', handleError)
    return () => window.removeEventListener('error', handleError)
  }, [])

  useEffect(() => {
    let unsubscribe: (() => void) | null = null
    ;(async () => {
      const user = await getCurrentUser()
      setUserId(user?.id ?? null)
    })()
    unsubscribe = onAuthStateChange(async () => {
      const user = await getCurrentUser()
      setUserId(user?.id ?? null)
    })
    return () => { unsubscribe?.() }
  }, [])

  useEffect(() => {
    const q = parishId.trim()
    setSelectedParishId(null)
    if (mode === 'register' && q.length >= 2) {
      const sb = getSupabaseBrowser()
      if (!sb) return
      setParishLoading(true)
      sb
        .from('parishes')
        .select('id,name')
        .ilike('name', `%${q}%`)
        .limit(5)
        .then(({ data, error }: { data: ParishOption[] | null; error: PostgrestError | null }) => {
          if (error) {
            console.warn('Error buscando parroquias:', error.message)
            setParishOptions([])
            setParishOpen(false)
            return
          }
          setParishOptions(data || [])
          setParishOpen(!!(data && data.length))
        })
        .finally(() => setParishLoading(false))
    } else {
      setParishOptions([])
      setParishOpen(false)
    }
  }, [parishId, mode])

  const handleSelectParish = (opt: { id: string; name: string }) => {
    setParishId(opt.name)
    setSelectedParishId(opt.id)
    setParishOpen(false)
  }

  const handleSignIn = async () => {
    console.log('[Auth] Iniciando handleSignIn');
    setError('');
    setLoading(true);
    
    try {
      // Intentar con la API route (más confiable para establecer cookies del servidor)
      console.log('[Auth] Intentando login con API route...');
      
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Importante: incluir cookies en la petición
        body: JSON.stringify({ email, password }),
      });

      console.log('[Auth] Respuesta API:', response.status);
      
      if (response.ok) {
        const result = await response.json().catch(() => null);
        console.log('[Auth] Login exitoso vía API');

        // La respuesta de la API debería ser { session: { ... } }
        const session = result?.data?.session ?? result?.session;
        if (session) {
          console.log('[Auth] Login exitoso - sesión establecida en el servidor');
          console.log('[Auth] Iniciando sincronización de sesión...');

          // Sincronizar sesión del cliente (localStorage) con los tokens devueltos por la API
          try {
            console.log('[Auth] Obteniendo cliente Supabase...');
            const supabase = getSupabaseBrowser();
            if (supabase) {
              console.log('[Auth] Cliente obtenido, llamando setSession...');
              // Lanzar setSession en segundo plano para no bloquear la navegación
              void supabase.auth.setSession({
                access_token: session.access_token,
                refresh_token: session.refresh_token,
              }).then(({ data: setData, error: setError }: AuthResponse) => {
                console.log('[Auth] setSession resultado:', { setData, setError });
                if (setError) {
                  console.warn('[Auth] setSession error:', setError.message);
                } else {
                  console.log('[Auth] Sesión sincronizada correctamente');
                }
              }).catch((e: unknown) => {
                console.warn('[Auth] Error al sincronizar sesión:', e);
              });
            } else {
              console.warn('[Auth] No se pudo obtener cliente Supabase para setSession');
            }
          } catch (sessionError) {
            console.warn('[Auth] Error al sincronizar sesión:', sessionError);
            // Continuar con la redirección aunque falle la sincronización
          }

          console.log('[Auth] Preparando redirección...');
          
          // Decidir destino: si venimos por "login-required", ir a Inventario
          const dest = reason === 'login-required' ? '/inventario' : '/';
          console.log('[Auth] Destino calculado:', dest, 'reason:', reason);

          // Redirigir inmediatamente usando reemplazo de ubicación
          console.log('[Auth] Redirigiendo con window.location.replace...', dest);
          window.location.replace(dest);
          
        } else {
          console.warn('[Auth] No se recibió sesión en la respuesta de la API. Result:', result);
          // Si la API responde OK pero sin sesión, es probable que las credenciales sean inválidas.
          setError(result?.error || 'Email o contraseña incorrectos.');
        }
        return;
      } else {
        // Si la respuesta no es OK, es un error del servidor (e.g. 500)
        const errorData = await response.json().catch(() => null);
        const serverErrorMessage = errorData?.error || `Error del servidor: ${response.statusText} (${response.status})`;
        console.error('[Auth] Error en API route:', serverErrorMessage, errorData);
        // Este mensaje apunta a un problema de configuración en Vercel (variables de entorno)
        setError(`Error de comunicación con el servidor. Por favor, contacta al administrador. (${response.status})`);
        // No lanzamos error para que no lo capture el bloque catch de abajo
      }
      
    } catch (err) {
      console.log('[Auth] Error en login con API, error:', err);
      setError(err instanceof Error ? err.message : 'Error al iniciar sesión');
    } finally {
      console.log('[Auth] Finalizando handleSignIn');
      setLoading(false);
    }
  }

  const handleSignUp = async () => {
    if (!email.trim() || !password || !fullName.trim()) {
      setError('Completa nombre, email y contraseña')
      return
    }
    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden')
      return
    }
    setLoading(true)
    setError(null)
    try {
      const user = await signUpWithProfile({
        email: email.trim(),
        password,
        fullName: fullName.trim(),
        role,
        parishId: selectedParishId || (parishId.trim() || undefined),
      })
      setUserId(user?.id ?? null)
      // Redirigir si hay sesión activa tras registro
      const sb = getSupabaseBrowser()
      if (sb) {
        const { data } = await sb.auth.getSession()
        if (data?.session) {
          router.push('/inventario')
        } else {
          setMode('login')
        }
      } else {
        setMode('login')
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Error al registrar usuario'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  const handleSignOut = async () => {
    setLoading(true)
    setError(null)
    try {
      await signOut()
      setUserId(null)
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Error al cerrar sesión'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-md mx-auto px-6 py-10">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-foreground mb-2">Autenticación</h1>
        <p className="text-sm text-muted-foreground">Accede al sistema de inventario parroquial</p>
      </div>

      {reason === 'login-required' && (
        <Card className="mb-6 border-amber-200 bg-amber-50/50">
          <CardContent className="pt-4">
            <p className="text-sm text-amber-800">
              Se requiere iniciar sesión para subir imágenes desde el chat.
            </p>
          </CardContent>
        </Card>
      )}

      <div className="mb-6 flex gap-2">
        <Button
          variant={mode === 'login' ? 'default' : 'outline'}
          onClick={() => setMode('login')}
          className="flex-1"
        >
          <LogIn className="mr-2 h-4 w-4" />
          Iniciar sesión
        </Button>
        <Button
          variant={mode === 'register' ? 'default' : 'outline'}
          onClick={() => setMode('register')}
          className="flex-1"
        >
          <UserPlus className="mr-2 h-4 w-4" />
          Registrarse
        </Button>
      </div>

      {mode === 'login' ? (
        <Card>
          <CardHeader>
            <CardTitle>Iniciar sesión</CardTitle>
            <CardDescription>Ingresa tus credenciales para acceder</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="usuario@parroquia.org"
                autoComplete="email"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="pr-10"
                  autoComplete="current-password"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowPassword(v => !v)}
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                >
                  {showPassword ? <EyeOff className="h-4 w-4 text-muted-foreground" /> : <Eye className="h-4 w-4 text-muted-foreground" />}
                </Button>
              </div>
            </div>

            {error && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive border border-destructive/20">
                {error}
              </div>
            )}
          </CardContent>
          <CardFooter className="flex flex-wrap gap-2">
            <Button
              type="button"
              onClick={() => {
                console.log('[Auth] Botón clickeado - Email:', email.trim(), 'Password:', password ? 'presente' : 'vacío');
                if (!email.trim() || !password) {
                  console.log('[Auth] Validación fallida - campos vacíos');
                  setError('Por favor completa email y contraseña');
                  return;
                }
                console.log('[Auth] Validación pasada - llamando a handleSignIn');
                handleSignIn();
              }}
              disabled={loading}
              className="flex-1"
            >
              <LogIn className="mr-2 h-4 w-4" />
              {loading ? 'Iniciando...' : 'Iniciar sesión'}
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={handleSignOut}
              disabled={loading || !userId}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Cerrar sesión
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => console.log('[Auth] Botón de prueba clickeado')}
            >
              Test
            </Button>
          </CardFooter>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Crear cuenta</CardTitle>
            <CardDescription>Completa el formulario para registrarte</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Nombre completo</Label>
              <Input
                id="fullName"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Nombre y apellidos"
                autoComplete="name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="register-email">Email</Label>
              <Input
                id="register-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="usuario@parroquia.org"
                autoComplete="email"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="register-password">Contraseña</Label>
              <div className="relative">
                <Input
                  id="register-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="pr-10"
                  autoComplete="new-password"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowPassword(v => !v)}
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                >
                  {showPassword ? <EyeOff className="h-4 w-4 text-muted-foreground" /> : <Eye className="h-4 w-4 text-muted-foreground" />}
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar contraseña</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="pr-10"
                  autoComplete="new-password"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowConfirmPassword(v => !v)}
                  aria-label={showConfirmPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4 text-muted-foreground" /> : <Eye className="h-4 w-4 text-muted-foreground" />}
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="parish">Parroquia (opcional)</Label>
              <div className="relative">
                <Input
                  id="parish"
                  type="text"
                  value={parishId}
                  onChange={(e) => setParishId(e.target.value)}
                  placeholder="Escribe para buscar por nombre"
                  onFocus={() => parishOptions.length && setParishOpen(true)}
                />
                {parishOpen && (
                  <div className="absolute z-10 mt-1 w-full bg-card border border-border rounded-md shadow-lg">
                    {parishLoading ? (
                      <div className="px-3 py-2 text-sm text-muted-foreground">Buscando...</div>
                    ) : parishOptions.length ? (
                      parishOptions.map((opt) => (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => handleSelectParish(opt)}
                          className="block w-full text-left px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground transition-colors"
                        >
                          {opt.name}
                        </button>
                      ))
                    ) : (
                      <div className="px-3 py-2 text-sm text-muted-foreground">Sin resultados</div>
                    )}
                  </div>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Rol</Label>
              <select
                id="role"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="user">Usuario</option>
                <option value="admin">Administrador</option>
              </select>
            </div>

            {error && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive border border-destructive/20">
                {error}
              </div>
            )}
          </CardContent>
          <CardFooter className="flex gap-2">
            <Button
              onClick={handleSignUp}
              disabled={loading}
              className="flex-1"
            >
              <UserPlus className="mr-2 h-4 w-4" />
              {loading ? 'Registrando...' : 'Registrarse'}
            </Button>
            <Button
              variant="outline"
              onClick={() => setMode('login')}
            >
              Ya tengo cuenta
            </Button>
          </CardFooter>
        </Card>
      )}

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <User className="h-4 w-4" />
            Estado de sesión
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Usuario:</span>
              <span className="text-sm font-mono">
                {userId ? userId.substring(0, 8) + '...' : 'No autenticado'}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Tras iniciar sesión, prueba a subir una imagen en el chat para verificar que `/api/upload` deriva tu usuario desde cookies.
            </p>
          </div>
        </CardContent>
      </Card>

      <footer className="text-center mt-10 text-sm text-muted-foreground">
        <p>Creado por: Manuel Carrasco García</p>
      </footer>
    </div>
  )
}