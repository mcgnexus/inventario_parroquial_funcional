import { getSupabaseBrowser } from './auth'

export const supabase = getSupabaseBrowser()

// Removed unused interface Conversacion to satisfy no-unused-vars

export interface CatalogImage {
  url: string
  path: string
  alt?: string
  order?: number
}

function isUuid(s: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(s)
}

export interface CatalogacionCompleta {
  parish_id?: string
  parish_name?: string
  user_id: string
  tipo_objeto: string
  categoria: string
  descripcion_breve: string
  descripcion_detallada: string
  materiales: string[]
  tecnicas: string[]
  estilo_artistico: string
  datacion_aproximada: string
  siglos_estimados: string
  iconografia: string
  estado_conservacion: string
  deterioros_visibles: string[]
  dimensiones_estimadas: string
  valor_artistico: string
  observaciones: string
  confianza_analisis: string
  // campos adicionales
  inventory_number?: string
  location?: string
  image_url?: string
  image_path?: string
  images?: CatalogImage[]
  // compatibilidad con campos opcionales
  name?: string
  author?: string
  autor?: string
  localizacion_actual?: string
  published_at?: string
  approved_at?: string
  status?: string
}

export async function guardarConversacion(
  userId: string,
  mensaje: string,
  respuesta: string
) {
  if (!supabase) {
    console.warn('⚠️ Supabase no está configurado')
    return null
  }

  try {
    const { data, error } = await supabase
      .from('conversaciones')
      .insert([
        {
          user_id: userId,
          mensaje: mensaje,
          respuesta: respuesta,
          fecha: new Date().toISOString()
        }
      ])
      .select()

    if (error) {
      console.error('❌ Error al guardar conversación:', error)
      return null
    }
    
    console.log('✅ Conversación guardada correctamente')
    return data
  } catch (error: unknown) {
    console.error('❌ Error inesperado al guardar:', error)
    return null
  }
}

async function uploadViaApiRoute(file: File): Promise<{ path: string; url: string } | null> {
  try {
    const form = new FormData()
    form.append('file', file)
    // El userId se deriva en servidor vía cookies; no se envía aquí

    const res = await fetch('/api/upload', {
      method: 'POST',
      body: form,
    })

    if (!res.ok) {
      console.error('❌ Fallback /api/upload respondió con error HTTP:', res.status)
      if (res.status === 401) {
        // Propaga un error específico para que la UI pueda redirigir a /auth
        throw new Error('AUTH_401')
      }
      try {
        const errJson = await res.json()
        console.error('📄 Detalle /api/upload:', errJson)
      } catch {}
      return null
    }

    const json = await res.json()
    if (!json?.url || !json?.path) {
      console.error('❌ Fallback /api/upload no devolvió url/path válidos:', json)
      return null
    }

    console.log('✅ Subida vía /api/upload correcta:', json.url)
    return { path: json.path, url: json.url }
  } catch (e) {
    if (e instanceof Error && e.message === 'AUTH_401') {
      // Re-lanza para que Promise.allSettled lo capture como rechazo
      throw e
    }
    console.error('❌ Error al usar fallback /api/upload:', e)
    return null
  }
}

export async function subirImagen(
  file: File,
  userId: string
): Promise<{ path: string; url: string } | null> {
  if (!supabase) {
    console.warn('⚠️ Supabase no está configurado')
    return null
  }

  try {
    console.log('📤 Subiendo imagen a Supabase Storage...')

    const timestamp = Date.now()
    const fileExt = file.name.split('.').pop()
    const fileName = `${timestamp}_${Math.random().toString(36).substring(7)}.${fileExt}`
    const filePath = `items/${userId}/${fileName}`

    const { error } = await supabase.storage
      .from('inventario')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true,
        contentType: file.type || 'application/octet-stream'
      })

    if (error) {
      console.error('❌ Error al subir imagen:', error?.message || error)
      const errObj = (typeof error === 'object' && error) ? error as { name?: string; status?: number; statusCode?: number; cause?: unknown } : {}
      console.error('🔎 Detalle del error Supabase:', errObj)

      // Fallback: subir vía API route para evitar problemas de CORS/red
      console.warn('🔁 Intentando subida alterna vía /api/upload...')
      const viaApi = await uploadViaApiRoute(file)
      if (viaApi) return viaApi

      return null
    }

    const { data: { publicUrl } } = supabase.storage
      .from('inventario')
      .getPublicUrl(filePath)

    console.log('✅ Imagen subida correctamente:', publicUrl)

    return {
      path: filePath,
      url: publicUrl
    }
  } catch (error: unknown) {
    console.error('❌ Error inesperado al subir imagen:', error)
    try {
      const json = JSON.stringify(error)
      console.error('🧪 Error serializado:', json)
    } catch {}

    // Fallback también si la excepción fue de red CORS
    console.warn('🔁 Intentando subida alterna vía /api/upload tras excepción...')
    const viaApi = await uploadViaApiRoute(file)
    if (viaApi) return viaApi

    return null
  }
}

/**
 * Genera el código de 3 letras para una parroquia a partir de su nombre y localidad.
 * Formato: XXX (2 primeras letras del nombre + primera letra de la localidad)
 * Ejemplo: "Santa María la Mayor", "Huéscar" -> "STH"
 * Ejemplo: "San Pedro", "Alcalá" -> "SPA"
 * @param parishName - El nombre de la parroquia.
 * @param location - La localidad de la parroquia (opcional).
 * @returns El código de 3 letras en mayúsculas.
 */
export function generarCodigoParroquia(parishName: string, location?: string): string {
  // Palabras que se deben ignorar (artículos, preposiciones, conectores)
  const stopWords = ['de', 'la', 'el', 'los', 'las', 'y', 'en', 'del', 'al', 'a']

  // Normalizar: quitar tildes y convertir a minúsculas
  const normalize = (str: string) =>
    str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()

  // Dividir en palabras y normalizar cada una
  const palabras = parishName
    .split(' ')
    .filter(word => word.length > 0)

  // Filtrar palabras significativas (no stopwords)
  const palabrasSignificativas = palabras
    .filter(word => !stopWords.includes(normalize(word)))

  // Si solo hay una palabra significativa, tomar las 2 primeras letras
  // Si hay más de una, tomar la primera letra de las dos primeras palabras
  let codigoParroquia = ''
  if (palabrasSignificativas.length === 1) {
    // Tomar las 2 primeras letras de la única palabra
    codigoParroquia = palabrasSignificativas[0].substring(0, 2).toUpperCase()
  } else if (palabrasSignificativas.length >= 2) {
    // Tomar primera letra de las dos primeras palabras
    codigoParroquia = (palabrasSignificativas[0].charAt(0) + palabrasSignificativas[1].charAt(0)).toUpperCase()
  } else {
    // Fallback: usar las primeras dos letras del nombre completo
    codigoParroquia = parishName.substring(0, 2).toUpperCase()
  }

  // Asegurar que tengamos 2 letras
  codigoParroquia = codigoParroquia.padEnd(2, 'X')

  // Obtener la letra de la localidad
  let letraLocalidad = 'X'
  if (location && location.trim().length > 0) {
    // Si la localidad tiene varias palabras (nombre compuesto), tomar la primera letra de la primera palabra
    const primeraLetra = location.trim().charAt(0).toUpperCase()
    letraLocalidad = primeraLetra
  }

  // Combinar: 2 letras del nombre + 1 letra de la localidad
  return codigoParroquia + letraLocalidad
}

/**
 * Genera el código de 3 letras para una categoría.
 * Ejemplo: "pintura" -> "PIN", "escultura" -> "ESC"
 * @param categoria - La categoría del objeto.
 * @returns El código de 3 letras en mayúsculas.
 */
export function generarCodigoCategoria(categoria: string): string {
  // Normalizar y quitar tildes
  const normalize = (str: string) =>
    str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase()

  const normalizado = normalize(categoria)

  // Mapeo de categorías a códigos específicos (basado en el enum CategoriaObjetoEnum)
  const mapeoCategorias: Record<string, string> = {
    'PINTURA': 'PIN',
    'ESCULTURA': 'ESC',
    'ORFEBRERIA': 'ORF',
    'TEXTIL': 'TEX',
    'DOCUMENTO': 'DOC',
    'LIBRO': 'LIB',
    'MOBILIARIO': 'MOB',
    'INSTRUMENTO_MUSICAL': 'INS',
    'INSTRUMENTOMUSICAL': 'INS',
    'RETABLO': 'RET',
    'IMAGINERIA': 'IMA',
    'VITRAL': 'VIT',
    'CERAMICA': 'CER',
    'METALURGIA': 'MET',
    'OTRO': 'OTR',
    'OTROS': 'OTR',
    // Variantes adicionales
    'TALLA': 'TAL',
    'ORNAMENTOS': 'ORN',
    'TELAS': 'TEL',
    'DOCUMENTOS': 'DOC',
  }

  // Si existe mapeo, usarlo
  if (mapeoCategorias[normalizado]) {
    return mapeoCategorias[normalizado]
  }

  // Si no, tomar las 3 primeras letras
  return normalizado.substring(0, 3).padEnd(3, 'X')
}

/**
 * Genera un número de inventario único para una parroquia.
 * Formato: XXX-YYYY-ZZZ-NNNN
 * Donde:
 * - XXX: Código de 3 letras de la parroquia (2 letras del nombre + 1 letra de la localidad)
 * - YYYY: Año de confección de la ficha
 * - ZZZ: Código de 3 letras de la categoría del objeto
 * - NNNN: Número secuencial único para cada parroquia (4 dígitos, comenzando desde 0001)
 *
 * @param parishId - El UUID de la parroquia.
 * @param categoria - La categoría del objeto (e.g., 'pintura', 'escultura').
 * @returns El número de inventario generado o null si hay un error.
 */
export async function generarNumeroInventario(
  parishId: string,
  categoria: string
): Promise<string | null> {
  console.log('🔢 generarNumeroInventario llamado con:', { parishId, categoria })

  if (!supabase) {
    console.error('❌ Supabase no está configurado')
    return null
  }

  try {
    // 1. Obtener el nombre y localidad de la parroquia para el código XXX
    console.log('�� Obteniendo nombre y localidad de parroquia...')
    const { data, error } = await supabase
      .rpc('get_parish_info', { parish_uuid: parishId })

    if (error) {
      console.error('❌ Error al obtener parroquia:', error)
      return null
    }

    if (!data || data.length === 0) {
      console.error(`❌ No se encontró la parroquia con ID: ${parishId}`)
      return null
    }

    const parish = data[0] as { name?: string; location?: string }
    const parishName = parish.name
    const location = parish.location

    if (!parishName) {
      console.error(`❌ La parroquia con ID ${parishId} no tiene nombre`)
      return null
    }

    console.log('✅ Parroquia encontrada:', parishName, location ? `(${location})` : '')

    const parishCode = generarCodigoParroquia(parishName, location)
    console.log('✅ Código de parroquia:', parishCode)

    // 2. Obtener el año actual (YYYY)
    const year = new Date().getFullYear()
    console.log('📅 Año:', year)

    // 3. Obtener el código de la categoría (ZZZ)
    const categoryCode = generarCodigoCategoria(categoria)
    console.log('🎨 Código de categoría:', categoryCode)

    // 4. Obtener el número secuencial para esa parroquia (NNNN)
    // Cuenta todos los items de esta parroquia para generar el siguiente número
    // Usar función RPC para evitar problemas de recursión infinita en RLS
    console.log('🔍 Contando items en la parroquia...')
    const { data: count, error: countError } = await supabase
      .rpc('count_parish_items', { parish_uuid: parishId })

    if (countError) {
      console.error('❌ Error al contar items:', countError)
      throw countError
    }

    console.log('📊 Items encontrados:', count)
    const nextNumber = (count ?? 0) + 1
    const sequentialNumber = String(nextNumber).padStart(4, '0')
    console.log('🔢 Número secuencial:', sequentialNumber)

    const numeroFinal = `${parishCode}-${year}-${categoryCode}-${sequentialNumber}`
    console.log('✅ Número de inventario generado:', numeroFinal)
    return numeroFinal
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    console.error('❌ Error al generar número de inventario:', msg, e)
    return null
  }
}

export async function guardarCatalogacion(
  userId: string,
  catalogo: CatalogacionCompleta,
  imagenFile: File | null
): Promise<{ id: string } | { error: string } | null> {
  try {
    // Determinar imagen a asociar: reutilizar si ya viene en el catálogo, o subir si se proporciona archivo
    let imageUrl = catalogo.image_url || ''
    let imagePath = catalogo.image_path || ''

    if (imagenFile) {
      const resultadoImagen = await subirImagen(imagenFile, userId)
      if (!resultadoImagen) {
        return { error: 'No se pudo subir la fotografía. Inténtalo de nuevo.' }
      }
      imageUrl = resultadoImagen.url
      imagePath = resultadoImagen.path
    }

    if (!imageUrl || !imagePath) {
      return { error: 'No se puede aprobar sin fotografía adjunta.' }
    }

    // Generar número de inventario si no existe y tenemos parish_id y categoría
    let inventoryNumber = catalogo.inventory_number
    if (!inventoryNumber && catalogo.parish_id && catalogo.categoria) {
      // generarNumeroInventario devuelve string | null; normalizamos null a undefined
      inventoryNumber = (await generarNumeroInventario(catalogo.parish_id, catalogo.categoria)) ?? undefined
    }

    const jsonRespuesta = {
      ...catalogo,
      image_url: imageUrl,
      image_path: imagePath,
      published_at: new Date().toISOString(),
      approved_at: new Date().toISOString(),
      status: 'approved',
      // Asegurarnos de que el número de inventario se guarda
      inventory_number: inventoryNumber,
    }

    const { data, error } = await supabase
      .from('conversaciones')
      .insert([
        {
          user_id: userId,
          fecha: new Date().toISOString(),
          mensaje: 'Aprobación de catalogación',
          respuesta: JSON.stringify(jsonRespuesta)
        }
      ])
      .select()

    if (error) throw error

    return data && data.length > 0 ? { id: data[0].id } : null
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    console.error('Error en guardarCatalogacion:', msg)
    return { error: msg || 'Error desconocido al guardar catalogación' }
  }
}

export async function obtenerConversaciones(userId: string) {
  if (!supabase) {
    console.warn('⚠️ Supabase no está configurado')
    return []
  }

  try {
    const { data, error } = await supabase
      .from('conversaciones')
      .select('*')
      .eq('user_id', userId)
      .order('fecha', { ascending: false })

    if (error) {
      console.error('❌ Error al obtener conversaciones:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('❌ Error inesperado al obtener conversaciones:', error)
    return []
  }
}

export async function eliminarImagen(filePath: string): Promise<boolean> {
  if (!supabase) {
    console.warn('⚠️ Supabase no está configurado')
    return false
  }

  try {
    const { error } = await supabase.storage
      .from('inventario')
      .remove([filePath])

    if (error) {
      console.error('❌ Error al eliminar imagen:', error)
      return false
    }

    console.log('✅ Imagen eliminada correctamente')
    return true
  } catch (error) {
    console.error('❌ Error inesperado al eliminar imagen:', error)
    return false
  }
}

export function obtenerUrlPublica(filePath: string): string | null {
  if (!supabase) {
    console.warn('⚠️ Supabase no está configurado')
    return null
  }

  const { data } = supabase.storage
    .from('inventario')
    .getPublicUrl(filePath)

  return data.publicUrl
}


export interface CatalogoItem {
  id: string
  user_id: string
  fecha: string
  data: CatalogacionCompleta
}

export async function obtenerCatalogo(userId?: string): Promise<CatalogoItem[]> {
  if (!supabase) {
    console.warn('⚠️ Supabase no está configurado')
    return []
  }

  try {
    // 1) Intentar obtener desde tabla items (si existe el esquema ampliado)
    const fromItems = await obtenerCatalogoDesdeItems(userId)
    // Si items existe pero está vacío, hacer fallback a conversaciones para no dejar catálogo vacío
    if (fromItems && Array.isArray(fromItems) && fromItems.length > 0) {
      return fromItems
    }

    // 2) Fallback a conversaciones
    let query = supabase
      .from('conversaciones')
      .select('*')
      .order('fecha', { ascending: false })

    if (userId) query = query.eq('user_id', userId)

    const { data, error } = await query
    if (error) {
      console.error('❌ Error al obtener catálogo:', error)
      return []
    }

    const items: CatalogoItem[] = []
    for (const row of (data || [])) {
      try {
        const parsed = JSON.parse(row.respuesta)
        const hasImage = parsed && typeof parsed.image_url === 'string' && parsed.image_url.trim() !== ''
        const isApproved = Boolean((parsed && parsed.approved_at) || (parsed && parsed.status === 'approved'))
        const isPublished = Boolean((parsed && parsed.published_at) || (parsed && parsed.status === 'published'))
        const passesRule = hasImage || isApproved || isPublished
        if (parsed && typeof parsed === 'object' && parsed.tipo_objeto && passesRule) {
          items.push({ id: row.id, user_id: row.user_id, fecha: row.fecha, data: parsed })
        }
      } catch {}
    }
    return items
  } catch (error) {
    console.error('❌ Error inesperado al obtener catálogo:', error)
    return []
  }
}

export async function obtenerCatalogoItem(id: string): Promise<CatalogoItem | null> {
  if (!supabase) {
    console.warn('⚠️ Supabase no está configurado')
    return null
  }
  try {
    // 1) Intentar desde items primero
    const fromItems = await obtenerCatalogoItemDesdeItems(id)
    if (fromItems) return fromItems

    // 2) Fallback a conversaciones
    const idForQuery = /^\d+$/.test(id) ? Number(id) : id
    const { data, error } = await supabase
      .from('conversaciones')
      .select('*')
      .eq('id', idForQuery)
      .limit(1)
    if (error) {
      console.error('❌ Error al obtener item de catálogo:', error)
      return null
    }
    const row = data?.[0]
    if (!row) return null
    try {
      const parsed = JSON.parse(row.respuesta)
      const hasImage = parsed && typeof parsed.image_url === 'string' && parsed.image_url.trim() !== ''
      const isApproved = Boolean((parsed && parsed.approved_at) || (parsed && parsed.status === 'approved'))
      const isPublished = Boolean((parsed && parsed.published_at) || (parsed && parsed.status === 'published'))
      const passesRule = hasImage || isApproved || isPublished
      if (parsed && typeof parsed === 'object' && parsed.tipo_objeto && passesRule) {
        return { id: row.id, user_id: row.user_id, fecha: row.fecha, data: parsed }
      }
    } catch {}
    return null
  } catch (error) {
    console.error('❌ Error inesperado al obtener item:', error)
    return null
  }
}

// ==========================
// Lectura desde tabla items
// ==========================

type ItemRow = {
  id: string
  user_id: string
  parish_id?: string
  inventory_number?: string
  status?: string
  image_url?: string
  data?: unknown
  published_at?: string
  approved_at?: string
  created_at: string
}

async function obtenerCatalogoDesdeItems(userId?: string): Promise<CatalogoItem[] | null> {
  try {
    let query = supabase
      .from('items')
      .select('id,user_id,parish_id,inventory_number,status,image_url,data,published_at,approved_at,created_at')
      .order('created_at', { ascending: false })

    if (userId) query = query.eq('user_id', userId)

    const { data, error } = await query as unknown as { data: ItemRow[] | null, error: unknown }
    if (error) {
      // Si la tabla o columnas no existen aún, retornar null para fallback
      const errMsg = error instanceof Error ? error.message : String(error)
      console.warn('⚠️ No se pudo leer items (usando fallback a conversaciones):', errMsg)
      return null
    }

    const items: CatalogoItem[] = []
    for (const row of (data || [])) {
      const parsed = (row.data ?? {}) as Partial<CatalogacionCompleta>
      const hasImage = typeof row.image_url === 'string' && row.image_url.trim() !== ''
      const isApproved = Boolean(row.approved_at || row.status === 'approved')
      const isPublished = Boolean(row.published_at || row.status === 'published')
      const passesRule = hasImage || isApproved || isPublished
      if (passesRule && (parsed?.tipo_objeto || parsed?.name)) {
        const merged = {
          ...parsed,
          user_id: row.user_id,
          tipo_objeto: parsed.tipo_objeto ?? parsed.name ?? 'sin_especificar',
          parish_id: parsed.parish_id ?? row.parish_id,
          image_url: parsed.image_url ?? row.image_url,
          inventory_number: parsed.inventory_number ?? row.inventory_number,
          published_at: parsed.published_at ?? row.published_at,
          approved_at: parsed.approved_at ?? row.approved_at,
          status: parsed.status ?? row.status,
        } as CatalogacionCompleta
        items.push({ id: row.id, user_id: row.user_id, fecha: row.created_at, data: merged })
      }
    }
    return items
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    console.warn('⚠️ Error inesperado leyendo items (fallback a conversaciones):', msg)
    return null
  }
}

async function obtenerCatalogoItemDesdeItems(id: string): Promise<CatalogoItem | null> {
  try {
    // Si el id no es UUID, evitar consultar items para no provocar error de tipo
    if (!isUuid(id)) {
      return null
    }
    const { data, error } = await supabase
      .from('items')
      .select('id,user_id,parish_id,inventory_number,status,image_url,data,published_at,approved_at,created_at')
      .eq('id', id)
      .limit(1) as unknown as { data: ItemRow[] | null, error: unknown }
    if (error) {
      const errMsg = error instanceof Error ? error.message : JSON.stringify(error)
      console.warn('⚠️ No se pudo leer item desde items (fallback a conversaciones):', errMsg)
      return null
    }
    const row = data?.[0]
    if (!row) return null
    const parsed = (row.data ?? {}) as Partial<CatalogacionCompleta>
    const hasImage = typeof row.image_url === 'string' && row.image_url.trim() !== ''
    const isApproved = Boolean(row.approved_at || row.status === 'approved')
    const isPublished = Boolean(row.published_at || row.status === 'published')
    const passesRule = hasImage || isApproved || isPublished
    if (!passesRule) return null
    const merged = {
      ...parsed,
      user_id: row.user_id,
      tipo_objeto: parsed.tipo_objeto ?? parsed.name ?? 'sin_especificar',
      parish_id: parsed.parish_id ?? row.parish_id,
      image_url: parsed.image_url ?? row.image_url,
      inventory_number: parsed.inventory_number ?? row.inventory_number,
      published_at: parsed.published_at ?? row.published_at,
      approved_at: parsed.approved_at ?? row.approved_at,
      status: parsed.status ?? row.status,
    } as CatalogacionCompleta
    return { id: row.id, user_id: row.user_id, fecha: row.created_at, data: merged }
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    console.warn('⚠️ Error inesperado leyendo item desde items (fallback a conversaciones):', msg)
    return null
  }
}

export async function obtenerParroquiaNombre(parishId: string): Promise<string | null> {
  if (!supabase) {
    console.warn('⚠️ Supabase no está configurado')
    return null
  }
  try {
    console.log('🔍 Buscando parroquia con ID:', parishId)
    const { data, error } = await supabase
      .from('parishes')
      .select('name, location')
      .eq('id', parishId)
      .limit(1)

    if (error) {
      console.error('❌ Error al obtener nombre de parroquia:', error)
      return null
    }

    console.log('📊 Resultado de la búsqueda:', data)

    if (!data || data.length === 0) {
      console.warn(`⚠️ No se encontró ninguna parroquia con el UUID: ${parishId}`)
      console.warn('💡 Posibles causas:')
      console.warn('   1. La parroquia no existe en la base de datos')
      console.warn('   2. El UUID es incorrecto')
      console.warn('   3. La tabla parishes está vacía')
      console.warn('📝 Ejecuta este SQL para verificar:')
      console.warn(`   SELECT * FROM parishes WHERE id = '${parishId}';`)
      return null
    }

    const row = data[0] as { name?: string; location?: string } | undefined
    const fullName = row?.name ?? null
    console.log(`✅ Parroquia encontrada: ${fullName} (${row?.location || 'sin ubicación'})`)
    return fullName
  } catch (error) {
    console.error('❌ Error inesperado al obtener nombre de parroquia:', error)
    return null
  }
}

// ==========================
// Paginación
// ==========================

export interface FiltrosCatalogo {
  parish_id?: string
  categoria?: string
  estado_conservacion?: string
  status?: string
  search?: string
  user_id?: string
}

export interface ResultadoPaginado {
  items: CatalogoItem[]
  total: number
  page: number
  perPage: number
  totalPages: number
}

/**
 * Obtiene el catálogo con paginación y filtros
 */
export async function obtenerCatalogoPaginado(
  page = 1,
  perPage = 20,
  filtros: FiltrosCatalogo = {}
): Promise<ResultadoPaginado> {
  if (!supabase) {
    console.warn('⚠️ Supabase no está configurado')
    return {
      items: [],
      total: 0,
      page,
      perPage,
      totalPages: 0,
    }
  }

  try {
    // Intentar desde tabla items primero
    const fromItems = await obtenerCatalogoPaginadoDesdeItems(page, perPage, filtros)
    // Si la tabla items existe pero está vacía, hacer fallback a conversaciones
    if (fromItems && fromItems.total > 0) return fromItems

    // Fallback a conversaciones
    return await obtenerCatalogoPaginadoDesdeConversaciones(page, perPage, filtros)
  } catch (error) {
    console.error('❌ Error inesperado al obtener catálogo paginado:', error)
    return {
      items: [],
      total: 0,
      page,
      perPage,
      totalPages: 0,
    }
  }
}

/**
 * Obtiene catálogo paginado desde tabla items
 */
async function obtenerCatalogoPaginadoDesdeItems(
  page: number,
  perPage: number,
  filtros: FiltrosCatalogo
): Promise<ResultadoPaginado | null> {
  try {
    const offset = (page - 1) * perPage

    // Query base
    let query = supabase
      .from('items')
      .select('id,user_id,parish_id,inventory_number,status,image_url,data,published_at,approved_at,created_at', { count: 'exact' })
      .order('created_at', { ascending: false })

    // Aplicar filtros
    if (filtros.parish_id) {
      query = query.eq('parish_id', filtros.parish_id)
    }
    if (filtros.status) {
      query = query.eq('status', filtros.status)
    }
    if (filtros.user_id) {
      query = query.eq('user_id', filtros.user_id)
    }
    if (filtros.categoria) {
      query = query.eq('data->>categoria', filtros.categoria)
    }

    // Filtro de búsqueda en el campo data (JSON)
    if (filtros.search) {
      // Búsqueda básica en campos de texto dentro del JSON
      query = query.or(`data->>tipo_objeto.ilike.%${filtros.search}%,data->>descripcion_breve.ilike.%${filtros.search}%,inventory_number.ilike.%${filtros.search}%`)
    }

    // Paginación
    query = query.range(offset, offset + perPage - 1)

    const { data, error, count } = await query as unknown as {
      data: ItemRow[] | null
      error: unknown
      count: number | null
    }


    if (error) {
      const errMsg = error instanceof Error ? error.message : String(error)
      console.warn('⚠️ No se pudo leer items paginado (usando fallback):', errMsg)
      return null
    }

    // Obtener nombres de parroquias para todos los items
    const uniqueParishIds = Array.from(new Set(
      (data || [])
        .map(row => row.parish_id)
        .filter((id): id is string => typeof id === 'string' && id.length > 0)
    ))

    // Consultar nombres de parroquias
    const parishNames = new Map<string, string>()
    if (uniqueParishIds.length > 0) {
      try {
        const { data: parishes } = await supabase
          .from('parishes')
          .select('id, name')
          .in('id', uniqueParishIds)

        if (parishes) {
          parishes.forEach((p: { id: string; name: string }) => {
            if (p.id && p.name) {
              parishNames.set(p.id, p.name)
            }
          })
        }
      } catch (e) {
        console.warn('⚠️ No se pudieron obtener nombres de parroquias:', e)
      }
    }

    const items: CatalogoItem[] = []
    for (const row of data || []) {
      const parsed = (row.data ?? {}) as Partial<CatalogacionCompleta>
      const hasImage = typeof row.image_url === 'string' && row.image_url.trim() !== ''
      const isApproved = Boolean(row.approved_at || row.status === 'approved')
      const isPublished = Boolean(row.published_at || row.status === 'published')
      const passesRule = hasImage || isApproved || isPublished

      if (passesRule && (parsed?.tipo_objeto || parsed?.name)) {
        // Obtener nombre de parroquia del mapa
        const parishId = parsed.parish_id ?? row.parish_id
        const parishName = parishId ? parishNames.get(parishId) : undefined

        const merged = {
          ...parsed,
          user_id: row.user_id,
          tipo_objeto: parsed.tipo_objeto ?? parsed.name ?? 'sin_especificar',
          parish_id: parishId,
          parish_name: parishName || parsed.parish_name, // Usar nombre de BD o fallback
          image_url: parsed.image_url ?? row.image_url,
          inventory_number: parsed.inventory_number ?? row.inventory_number,
          published_at: parsed.published_at ?? row.published_at,
          approved_at: parsed.approved_at ?? row.approved_at,
          status: parsed.status ?? row.status,
        } as CatalogacionCompleta

        items.push({
          id: row.id,
          user_id: row.user_id,
          fecha: row.created_at,
          data: merged,
        })
      }
    }

    const total = count ?? 0
    const totalPages = Math.ceil(total / perPage)

    return {
      items,
      total,
      page,
      perPage,
      totalPages,
    }
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    console.warn('⚠️ Error al obtener catálogo paginado desde items:', msg)
    return null
  }
}

/**
 * Obtiene catálogo paginado desde tabla conversaciones (fallback)
 */
async function obtenerCatalogoPaginadoDesdeConversaciones(
  page: number,
  perPage: number,
  filtros: FiltrosCatalogo
): Promise<ResultadoPaginado> {
  try {
    const offset = (page - 1) * perPage

    // Query base
    let query = supabase
      .from('conversaciones')
      .select('*', { count: 'exact' })
      .order('fecha', { ascending: false })

    if (filtros.user_id) {
      query = query.eq('user_id', filtros.user_id)
    }

    const { data, error } = await query

    if (error) {
      console.error('❌ Error al obtener catálogo paginado:', error)
      return {
        items: [],
        total: 0,
        page,
        perPage,
        totalPages: 0,
      }
    }

    const allItems: CatalogoItem[] = []
    for (const row of data || []) {
      try {
        const parsed = JSON.parse(row.respuesta)
        const hasImage = parsed && typeof parsed.image_url === 'string' && parsed.image_url.trim() !== ''
        const isApproved = Boolean((parsed && parsed.approved_at) || (parsed && parsed.status === 'approved'))
        const isPublished = Boolean((parsed && parsed.published_at) || (parsed && parsed.status === 'published'))
        const passesRule = hasImage || isApproved || isPublished

        if (parsed && typeof parsed === 'object' && parsed.tipo_objeto && passesRule) {
          // Aplicar filtros en memoria (ya que conversaciones es tabla legacy)
          let include = true

          if (filtros.parish_id && parsed.parish_id !== filtros.parish_id) {
            include = false
          }
          if (filtros.categoria && parsed.categoria !== filtros.categoria) {
            include = false
          }
          if (filtros.estado_conservacion && parsed.estado_conservacion !== filtros.estado_conservacion) {
            include = false
          }
          if (filtros.status && parsed.status !== filtros.status) {
            include = false
          }
          if (filtros.search) {
            const searchLower = filtros.search.toLowerCase()
            const matchesTipo = parsed.tipo_objeto?.toLowerCase().includes(searchLower)
            const matchesDesc = parsed.descripcion_breve?.toLowerCase().includes(searchLower)
            const matchesInv = parsed.inventory_number?.toLowerCase().includes(searchLower)
            if (!matchesTipo && !matchesDesc && !matchesInv) {
              include = false
            }
          }

          if (include) {
            allItems.push({
              id: row.id,
              user_id: row.user_id,
              fecha: row.fecha,
              data: parsed,
            })
          }
        }
      } catch {
        // Ignorar filas con JSON inválido
      }
    }

    // Aplicar paginación en memoria
    const total = allItems.length
    const paginatedItems = allItems.slice(offset, offset + perPage)
    const totalPages = Math.ceil(total / perPage)

    return {
      items: paginatedItems,
      total,
      page,
      perPage,
      totalPages,
    }
  } catch (error) {
    console.error('❌ Error inesperado al obtener catálogo paginado desde conversaciones:', error)
    return {
      items: [],
      total: 0,
      page,
      perPage,
      totalPages: 0,
    }
  }
}