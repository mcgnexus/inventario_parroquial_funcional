/* eslint-disable @typescript-eslint/no-require-imports */
const { createClient } = require('@supabase/supabase-js')

// Cargar variables de entorno
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('❌ Falta configuración de Supabase:')
  console.error('   - NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✅' : '❌')
  console.error('   - SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceRoleKey ? '✅' : '❌')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function checkAuthConfig() {
  try {
    console.log('🔍 Verificando configuración de autenticación...')
    
    // Obtener configuración actual
    const { data: config, error } = await supabase
      .rpc('get_auth_config')
      .single()
    
    if (error) {
      console.log('ℹ️ No se pudo obtener configuración directamente, verificando en Supabase Dashboard...')
      console.log('   Por favor, revisa manualmente en:')
      console.log('   https://app.supabase.com/project/_/auth/providers')
      console.log('   https://app.supabase.com/project/_/auth/settings')
      return
    }
    
    console.log('📋 Configuración actual:')
    console.log('   - Confirmación por email:', config.email_confirm_enabled ? '✅ Activada' : '❌ Desactivada')
    console.log('   - Confirmación por SMS:', config.sms_confirm_enabled ? '✅ Activada' : '❌ Desactivada')
    console.log('   - Autoconfirmación:', config.autoconfirm ? '✅ Activada' : '❌ Desactivada')
    
  } catch (error) {
    console.error('❌ Error al verificar configuración:', error.message)
  }
}

async function disableEmailConfirmation() {
  try {
    console.log('🔄 Desactivando confirmación por email...')
    
    // Desactivar confirmación por email
    const { error } = await supabase
      .rpc('update_auth_config', {
        email_confirm_enabled: false,
        autoconfirm: true
      })
    
    if (error) {
      console.error('❌ Error al desactivar confirmación:', error.message)
      console.log('\n💡 Alternativa manual:')
      console.log('   1. Ve a https://app.supabase.com')
      console.log('   2. Selecciona tu proyecto')
      console.log('   3. Ve a Authentication → Settings')
      console.log('   4. Desactiva "Enable email confirmations"')
      console.log('   5. Activa "Enable autoconfirm"')
      return
    }
    
    console.log('✅ Confirmación por email desactivada exitosamente')
    console.log('✅ Autoconfirmación activada')
    
  } catch (error) {
    console.error('❌ Error:', error.message)
  }
}

// Ejecutar según el argumento
const command = process.argv[2]

if (command === 'disable') {
  disableEmailConfirmation()
} else {
  checkAuthConfig()
}