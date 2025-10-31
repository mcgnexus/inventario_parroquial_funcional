import { NextResponse } from 'next/server'
import { getSupabaseServiceClient } from '@/lib/supabaseServer'
import { UUIDSchema, createErrorResponse, createSuccessResponse } from '@/schemas'
import { z } from 'zod'

function toArray(val: unknown): string[] {
  if (Array.isArray(val)) return val.map((v) => String(v).trim()).filter(Boolean)
  if (typeof val === 'string')
    return val
      .split(',')
      .map((v) => v.trim())
      .filter(Boolean)
  return []
}

/**
 * Schema para el body de actualización
 * Acepta IDs UUID (nuevos) y numéricos (legacy de conversaciones)
 */
const IdSchema = z.union([
  UUIDSchema,
  z.string().regex(/^\d+$/, 'Debe ser un número válido'),
  z.number().int(),
])

const UpdateRequestSchema = z.object({
  id: IdSchema,
  changes: z.record(z.string(), z.unknown()),
})

export async function POST(req: Request) {
  try {
    const body = await req.json()

    // Validar estructura básica del request
    const requestValidation = UpdateRequestSchema.safeParse(body)
    if (!requestValidation.success) {
      const errors = requestValidation.error.issues.map((err) => `${err.path.join('.')}: ${err.message}`)
      return NextResponse.json(createErrorResponse(errors.join(', ')), { status: 400 })
    }

    const { id, changes } = requestValidation.data

    const supabase = getSupabaseServiceClient()

    // 1) Intentar actualizar en tabla legacy 'conversaciones'
    const { data: rows, error: selError } = await supabase
      .from('conversaciones')
      .select('id, respuesta')
      .eq('id', id)
      .limit(1)

    if (selError) {
      console.error('Error seleccionando conversación:', selError)
      return NextResponse.json(createErrorResponse('Error seleccionando'), { status: 500 })
    }

    const rowsTyped: { id: string; respuesta: string | null }[] | null = rows as
      | { id: string; respuesta: string | null }[]
      | null
    const row = rowsTyped?.[0]
    if (!row) {
      // 2) Si no existe en conversaciones, intentar en tabla canónica 'items'
      const { data: itemRows, error: itemSelError } = await supabase
        .from('items')
        .select('id,user_id,parish_id,parish_name,inventory_number,status,image_url,data,published_at,approved_at')
        .eq('id', id)
        .limit(1)

      if (itemSelError) {
        console.error('Error seleccionando item:', itemSelError)
        return NextResponse.json(createErrorResponse('Error seleccionando'), { status: 500 })
      }

      const item = (itemRows as unknown as Array<{
        id: string
        user_id: string
        parish_id?: string | null
        parish_name?: string | null
        inventory_number?: string | null
        status?: string | null
        image_url?: string | null
        data?: Record<string, unknown> | null
        published_at?: string | null
        approved_at?: string | null
      }> | null)?.[0]

      if (!item) {
        return NextResponse.json(createErrorResponse('No existe el item'), { status: 404 })
      }

      // Normalización y merge sobre data JSON
      const currentData: Record<string, unknown> = (item.data || {}) as Record<string, unknown>
      const normalized: Record<string, unknown> = { ...changes }

      // Normalizar arrays
      normalized.materiales = toArray(changes.materiales ?? currentData.materiales)
      normalized.tecnicas = toArray(changes.tecnicas ?? currentData.tecnicas)
      normalized.deterioros_visibles = toArray(changes.deterioros_visibles ?? currentData.deterioros_visibles)

      // Resolver parroquia por id o nombre exacto si viene parish_input
      if ('parish_input' in changes) {
        const input = String(changes.parish_input || '').trim()
        delete normalized.parish_input
        if (input) {
          const isValidUUID = UUIDSchema.safeParse(input).success
          if (isValidUUID) {
            const { data }: { data: { id: string; name: string } | null } = await supabase
              .from('parishes')
              .select('id,name')
              .eq('id', input)
              .maybeSingle()
            if (data) {
              normalized.parish_id = data.id
              normalized.parish_name = data.name
            } else {
              normalized.parish_id = undefined
              normalized.parish_name = input
            }
          } else {
            const { data }: { data: { id: string; name: string } | null } = await supabase
              .from('parishes')
              .select('id,name')
              .eq('name', input)
              .maybeSingle()
            if (data) {
              normalized.parish_id = data.id
              normalized.parish_name = data.name
            } else {
              normalized.parish_id = undefined
              normalized.parish_name = input
            }
          }
        } else {
          normalized.parish_id = undefined
          normalized.parish_name = undefined
        }
      }

      const mergedData = { ...currentData, ...normalized }

      // Construir payload de actualización para columnas top-level y data
      const updatePayload: Record<string, unknown> = { data: mergedData }

      if ('image_url' in normalized) updatePayload.image_url = normalized.image_url
      if ('inventory_number' in normalized) updatePayload.inventory_number = normalized.inventory_number
      if ('parish_id' in normalized) updatePayload.parish_id = normalized.parish_id
      if ('parish_name' in normalized) updatePayload.parish_name = normalized.parish_name
      if ('published_at' in normalized) updatePayload.published_at = normalized.published_at
      if ('approved_at' in normalized) updatePayload.approved_at = normalized.approved_at
      if ('status' in normalized) updatePayload.status = normalized.status

      const { error: updItemError } = await supabase
        .from('items')
        .update(updatePayload)
        .eq('id', id)

      if (updItemError) {
        console.error('Error actualizando item:', updItemError)
        return NextResponse.json(createErrorResponse('Error actualizando'), { status: 500 })
      }

      return NextResponse.json(createSuccessResponse(mergedData, 'Catalogación actualizada exitosamente'))
    }

    let current: Record<string, unknown> = {}
    try {
      current = JSON.parse(row.respuesta || '{}') as Record<string, unknown>
    } catch {
      console.warn('respuesta no JSON, se sobrescribe')
      current = {}
    }

    const normalized: Record<string, unknown> = { ...changes }

    // Normalizar arrays
    normalized.materiales = toArray(changes.materiales ?? current.materiales)
    normalized.tecnicas = toArray(changes.tecnicas ?? current.tecnicas)
    normalized.deterioros_visibles = toArray(changes.deterioros_visibles ?? current.deterioros_visibles)

    // Resolver parroquia por id UUID o por nombre exacto
    if ('parish_input' in changes) {
      const input = String(changes.parish_input || '').trim()
      delete normalized.parish_input
      if (input) {
        // Validar si es UUID
        const isValidUUID = UUIDSchema.safeParse(input).success
        if (isValidUUID) {
          const { data }: { data: { id: string; name: string } | null } = await supabase
            .from('parishes')
            .select('id,name')
            .eq('id', input)
            .maybeSingle()
          if (data) {
            normalized.parish_id = data.id
            normalized.parish_name = data.name
          } else {
            normalized.parish_id = undefined
            normalized.parish_name = input
          }
        } else {
          const { data }: { data: { id: string; name: string } | null } = await supabase
            .from('parishes')
            .select('id,name')
            .eq('name', input)
            .maybeSingle()
          if (data) {
            normalized.parish_id = data.id
            normalized.parish_name = data.name
          } else {
            normalized.parish_id = undefined
            normalized.parish_name = input
          }
        }
      } else {
        normalized.parish_id = undefined
        normalized.parish_name = undefined
      }
    }

    const updated = { ...current, ...normalized }

    const { error: updError } = await supabase
      .from('conversaciones')
      .update({ respuesta: JSON.stringify(updated) })
      .eq('id', id)

    if (updError) {
      console.error('Error actualizando conversación:', updError)
      return NextResponse.json(createErrorResponse('Error actualizando'), { status: 500 })
    }

    return NextResponse.json(createSuccessResponse(updated, 'Catalogación actualizada exitosamente'))
  } catch (e: unknown) {
    console.error('Error en API actualización catálogo:', e)
    const msg = e instanceof Error ? e.message : 'Error inesperado'
    return NextResponse.json(createErrorResponse(msg), { status: 500 })
  }
}