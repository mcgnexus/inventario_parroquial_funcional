// Utilidad: crear usuario de prueba para Playwright usando Service Role
// Requiere variables:
// - NEXT_PUBLIC_SUPABASE_URL
// - SUPABASE_SERVICE_ROLE_KEY
// - TEST_USER_EMAIL
// - TEST_USER_PASSWORD

import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const email = process.env.TEST_USER_EMAIL
const password = process.env.TEST_USER_PASSWORD

if (!url || !serviceKey) {
  console.error('Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en el entorno.')
  process.exit(1)
}

if (!email || !password) {
  console.error('Faltan TEST_USER_EMAIL o TEST_USER_PASSWORD en el entorno.')
  process.exit(1)
}

const supabase = createClient(url, serviceKey)

async function ensureTestUser() {
  console.log(`[CreateTestUser] Creando/verificando usuario: ${email}`)
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })

  if (error) {
    // Si el usuario ya existe, continuar sin error
    const msg = String(error.message || error)
    if (msg.toLowerCase().includes('user already exists') || msg.toLowerCase().includes('duplicate')) {
      console.log('[CreateTestUser] Usuario ya existe; OK')
      return
    }
    console.error('[CreateTestUser] Error al crear usuario:', error)
    process.exit(1)
  }

  console.log('[CreateTestUser] Usuario creado:', data.user?.id || '(sin id)')
}

ensureTestUser().then(() => {
  console.log('[CreateTestUser] Finalizado')
}).catch((e) => {
  console.error('[CreateTestUser] Error inesperado:', e)
  process.exit(1)
})