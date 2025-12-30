import { createClient } from '@/lib/supabase/client'

const BUCKET_NAME = 'brand-assets'

interface UploadOptions {
  brandId: string
  file: File
  folder?: string
  onProgress?: (progress: number) => void
}

interface UploadResult {
  path: string
  publicUrl: string
  size: number
  type: string
}

export async function uploadFile(options: UploadOptions): Promise<UploadResult> {
  const { brandId, file, folder = 'general' } = options
  const supabase = createClient()

  const fileExt = file.name.split('.').pop()?.toLowerCase() || 'bin'
  const timestamp = Date.now()
  const randomId = Math.random().toString(36).substring(2, 9)
  const fileName = `${brandId}/${folder}/${timestamp}-${randomId}.${fileExt}`

  const { error: uploadError } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: false,
    })

  if (uploadError) {
    throw new Error(`Upload failed: ${uploadError.message}`)
  }

  const { data: { publicUrl } } = supabase.storage
    .from(BUCKET_NAME)
    .getPublicUrl(fileName)

  return {
    path: fileName,
    publicUrl,
    size: file.size,
    type: file.type,
  }
}

export async function deleteFile(path: string): Promise<void> {
  const supabase = createClient()

  const { error } = await supabase.storage
    .from(BUCKET_NAME)
    .remove([path])

  if (error) {
    throw new Error(`Delete failed: ${error.message}`)
  }
}

export async function getSignedUrl(
  path: string,
  expiresIn = 3600
): Promise<string> {
  const supabase = createClient()

  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .createSignedUrl(path, expiresIn)

  if (error) {
    throw new Error(`Failed to get signed URL: ${error.message}`)
  }

  return data.signedUrl
}

export async function listFiles(
  brandId: string,
  folder?: string
): Promise<{ name: string; size: number; createdAt: string }[]> {
  const supabase = createClient()
  const path = folder ? `${brandId}/${folder}` : brandId

  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .list(path, {
      limit: 100,
      sortBy: { column: 'created_at', order: 'desc' },
    })

  if (error) {
    throw new Error(`Failed to list files: ${error.message}`)
  }

  return (data || []).map((file) => ({
    name: file.name,
    size: file.metadata?.size || 0,
    createdAt: file.created_at,
  }))
}

export function getFileType(mimeType: string): 'image' | 'video' | 'document' | 'other' {
  if (mimeType.startsWith('image/')) return 'image'
  if (mimeType.startsWith('video/')) return 'video'
  if (
    mimeType.includes('pdf') ||
    mimeType.includes('document') ||
    mimeType.includes('spreadsheet') ||
    mimeType.includes('presentation')
  ) {
    return 'document'
  }
  return 'other'
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}

export async function getImageDimensions(
  file: File
): Promise<{ width: number; height: number } | null> {
  if (!file.type.startsWith('image/')) return null

  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => {
      resolve({ width: img.width, height: img.height })
      URL.revokeObjectURL(img.src)
    }
    img.onerror = () => resolve(null)
    img.src = URL.createObjectURL(file)
  })
}
