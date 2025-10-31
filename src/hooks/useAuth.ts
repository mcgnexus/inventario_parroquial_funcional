import { useState, useEffect } from 'react'
import { getCurrentUser, onAuthStateChange } from '@/lib/auth'

export interface User {
  id: string
  email?: string | null
}

/**
 * Hook para gestionar el estado de autenticación del usuario
 *
 * @returns {User | null} usuario - Usuario autenticado o null
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const usuario = useAuth()
 *
 *   if (!usuario) {
 *     return <div>No autenticado</div>
 *   }
 *
 *   return <div>Hola {usuario.email}</div>
 * }
 * ```
 */
export function useAuth(): User | null {
  const [usuario, setUsuario] = useState<User | null>(null)

  useEffect(() => {
    // Cargar usuario inicial
    (async () => {
      const u = await getCurrentUser()
      setUsuario(u ? { id: u.id, email: u.email } : null)
    })()

    // Suscribirse a cambios de sesión
    const unsubscribe = onAuthStateChange((_event, session) => {
      setUsuario(session?.user ? { id: session.user.id, email: session.user.email } : null)
    })

    return () => unsubscribe()
  }, [])

  return usuario
}
