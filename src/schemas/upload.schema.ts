import { z } from 'zod'

/**
 * Tipos MIME permitidos para imágenes
 */
const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
] as const

/**
 * Tamaño máximo de archivo en bytes (10MB)
 */
const MAX_FILE_SIZE = 10 * 1024 * 1024

/**
 * Schema de validación para subida de archivos (cliente)
 */
export const FileUploadSchema = z.object({
  file: z
    .instanceof(File)
    .refine((file) => file.size > 0, 'El archivo no puede estar vacío')
    .refine(
      (file) => file.size <= MAX_FILE_SIZE,
      `El archivo no puede superar ${MAX_FILE_SIZE / 1024 / 1024}MB`
    )
    .refine(
      (file) => ALLOWED_IMAGE_TYPES.includes(file.type as (typeof ALLOWED_IMAGE_TYPES)[number]),
      `Solo se permiten archivos de tipo: ${ALLOWED_IMAGE_TYPES.join(', ')}`
    ),
  folder: z.string().optional().default('uploads'),
  userId: z.string().uuid().optional(),
})

export type FileUpload = z.infer<typeof FileUploadSchema>

/**
 * Schema para respuesta de subida de archivo
 */
export const FileUploadResponseSchema = z.object({
  success: z.boolean(),
  url: z.string().url().optional(),
  path: z.string().optional(),
  error: z.string().optional(),
})

export type FileUploadResponse = z.infer<typeof FileUploadResponseSchema>

/**
 * Schema de validación para eliminar archivos
 */
export const DeleteFileSchema = z.object({
  path: z.string().min(1, 'El path del archivo es requerido'),
})

export type DeleteFile = z.infer<typeof DeleteFileSchema>

/**
 * Schema para metadata de archivo
 */
export const FileMetadataSchema = z.object({
  name: z.string(),
  size: z.number().int().positive(),
  type: z.string(),
  lastModified: z.number().int().optional(),
})

export type FileMetadata = z.infer<typeof FileMetadataSchema>

/**
 * Validación de tipo MIME en servidor
 */
export const validateMimeType = (mimeType: string): boolean => {
  return ALLOWED_IMAGE_TYPES.includes(mimeType as (typeof ALLOWED_IMAGE_TYPES)[number])
}

/**
 * Validación de tamaño de archivo
 */
export const validateFileSize = (size: number): boolean => {
  return size > 0 && size <= MAX_FILE_SIZE
}

/**
 * Constantes exportadas para reutilización
 */
export const FILE_UPLOAD_CONSTANTS = {
  MAX_FILE_SIZE,
  ALLOWED_IMAGE_TYPES,
  MAX_FILE_SIZE_MB: MAX_FILE_SIZE / 1024 / 1024,
} as const
