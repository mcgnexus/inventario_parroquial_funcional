import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import {
  FILE_UPLOAD_CONSTANTS,
  validateMimeType,
  validateFileSize,
  createErrorResponse,
  createSuccessResponse,
} from '@/schemas'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

const effectiveKey = serviceRoleKey || anonKey

// Client con privilegios para Storage (Service Role si disponible)
const supabase =
  supabaseUrl && effectiveKey
    ? createClient(supabaseUrl, effectiveKey, {
        auth: { autoRefreshToken: false, persistSession: false },
      })
    : null

export async function POST(req: NextRequest) {
  if (!supabase) {
    return NextResponse.json(
      createErrorResponse('Supabase no configurado en el servidor'),
      { status: 500 }
    )
  }

  try {
    const form = await req.formData()
    const file = form.get('file')

    // Client SSR para obtener usuario desde cookies (solo lectura)
    if (!supabaseUrl || !anonKey) {
      return NextResponse.json(createErrorResponse('Auth no configurado'), { status: 500 })
    }

    const supabaseAuth = createServerClient(supabaseUrl, anonKey, {
      cookies: {
        get: async (name: string) => {
          const store = await cookies()
          return store.get(name)?.value
        },
      },
    })

    const { data: authData, error: authError } = await supabaseAuth.auth.getUser()
    if (authError) {
      return NextResponse.json(createErrorResponse('No autorizado'), { status: 401 })
    }
    const userId = authData?.user?.id
    if (!userId) {
      return NextResponse.json(createErrorResponse('No autorizado'), { status: 401 })
    }

    if (!(file instanceof Blob)) {
      return NextResponse.json(createErrorResponse('Archivo inválido'), { status: 400 })
    }

    const size = file.size
    const type = file.type

    // Validar tamaño del archivo usando el helper de Zod
    if (!validateFileSize(size)) {
      return NextResponse.json(
        createErrorResponse(
          `Imagen demasiado grande (max ${FILE_UPLOAD_CONSTANTS.MAX_FILE_SIZE_MB}MB)`
        ),
        { status: 413 }
      )
    }

    // Validar tipo MIME usando el helper de Zod
    if (!validateMimeType(type)) {
      return NextResponse.json(
        createErrorResponse(
          `Tipo de archivo no permitido. Permitidos: ${FILE_UPLOAD_CONSTANTS.ALLOWED_IMAGE_TYPES.join(', ')}`
        ),
        { status: 400 }
      )
    }

    const timestamp = Date.now()
    const originalName = file instanceof File ? file.name : `imagen_${timestamp}.jpg`
    const ext = originalName.split('.').pop() || 'jpg'
    const fileName = `${timestamp}_${Math.random().toString(36).substring(7)}.${ext}`
    const filePath = `items/${userId}/${fileName}`

    const contentType = type

    const { error } = await supabase.storage
      .from('inventario')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
        contentType,
      })

    if (error) {
      console.error('❌ Error Storage (API):', error)
      return NextResponse.json(createErrorResponse(error.message), { status: 500 })
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from('inventario').getPublicUrl(filePath)

    return NextResponse.json(
      createSuccessResponse({ url: publicUrl, path: filePath }, 'Archivo subido exitosamente'),
      { status: 200 }
    )
  } catch (err) {
    console.error('❌ Error inesperado en /api/upload:', err)
    return NextResponse.json(createErrorResponse('Error subiendo imagen'), { status: 500 })
  }
}