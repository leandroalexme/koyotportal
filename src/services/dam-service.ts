import { createClient } from '@/lib/supabase/client'
import { GoogleGenerativeAI } from '@google/generative-ai'
import type { Tables, TablesInsert } from '@/types/supabase'

const BUCKET_NAME = 'brand-assets'

export type Asset = Tables<'assets'>
export type AssetInsert = TablesInsert<'assets'>

export interface AssetUploadOptions {
  brandId: string
  file: File
  folder?: string
  category?: 'logo' | 'image' | 'typography' | 'document' | 'icon' | 'video' | 'other'
  tags?: string[]
  autoTag?: boolean
}

export interface AssetUploadResult {
  asset: Asset
  publicUrl: string
}

export interface AssetFilters {
  category?: string
  folder?: string
  tags?: string[]
  search?: string
  archived?: boolean
}

export interface TransformOptions {
  width?: number
  height?: number
  format?: 'webp' | 'png' | 'jpeg'
  quality?: number
  grayscale?: boolean
}

// ============================================
// AI Auto-Tagging
// ============================================

const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GOOGLE_AI_API_KEY || '')

export async function generateAssetTags(
  file: File,
  brandContext?: string
): Promise<{ tags: string[]; description: string; colors: string[] }> {
  if (!process.env.NEXT_PUBLIC_GOOGLE_AI_API_KEY) {
    return { tags: [], description: '', colors: [] }
  }

  try {
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-1.5-flash',
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.3,
      },
    })

    // Convert file to base64 for vision model
    const base64 = await fileToBase64(file)
    
    const prompt = `Analyze this image and provide:
1. Relevant tags for a brand asset library (5-10 tags)
2. A brief description (1-2 sentences)
3. Dominant colors as hex codes (3-5 colors)

${brandContext ? `Brand context: ${brandContext}` : ''}

Respond in JSON format:
{
  "tags": ["tag1", "tag2", ...],
  "description": "Brief description",
  "colors": ["#XXXXXX", ...]
}

Tags should be in Portuguese and relevant for brand asset management.`

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          mimeType: file.type,
          data: base64
        }
      }
    ])

    const text = result.response.text()
    const parsed = JSON.parse(text.replace(/```json\n?|\n?```/g, '').trim())
    
    return {
      tags: parsed.tags || [],
      description: parsed.description || '',
      colors: parsed.colors || []
    }
  } catch (error) {
    console.error('AI tagging error:', error)
    return { tags: [], description: '', colors: [] }
  }
}

async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      resolve(result.split(',')[1])
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

// ============================================
// Asset Upload
// ============================================

export async function uploadAsset(
  options: AssetUploadOptions
): Promise<AssetUploadResult> {
  const { brandId, file, folder = 'general', category, tags = [], autoTag = true } = options
  const supabase = createClient()

  // Get current user
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    throw new Error('Usuário não autenticado')
  }

  // Generate unique filename
  const fileExt = file.name.split('.').pop()?.toLowerCase() || 'bin'
  const timestamp = Date.now()
  const randomId = Math.random().toString(36).substring(2, 9)
  const sanitizedName = file.name
    .replace(/\.[^/.]+$/, '')
    .replace(/[^a-zA-Z0-9-_]/g, '-')
    .substring(0, 50)
  const fileName = `${brandId}/${folder}/${timestamp}-${randomId}-${sanitizedName}.${fileExt}`

  // Upload to storage
  const { error: uploadError } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: false,
    })

  if (uploadError) {
    throw new Error(`Upload falhou: ${uploadError.message}`)
  }

  // Get public URL
  const { data: { publicUrl } } = supabase.storage
    .from(BUCKET_NAME)
    .getPublicUrl(fileName)

  // Get image dimensions
  const dimensions = await getImageDimensions(file)

  // Auto-tag with AI if enabled and is an image
  let aiTags: string[] = []
  let aiDescription = ''
  let aiColors: string[] = []

  if (autoTag && file.type.startsWith('image/')) {
    const aiResult = await generateAssetTags(file)
    aiTags = aiResult.tags
    aiDescription = aiResult.description
    aiColors = aiResult.colors
  }

  // Determine category from file type if not provided
  const assetCategory = category || detectCategory(file.type, file.name)

  // Create asset record
  const assetData: AssetInsert = {
    brand_id: brandId,
    name: file.name,
    file_path: fileName,
    file_type: assetCategory,
    file_size: file.size,
    mime_type: file.type,
    width: dimensions?.width || null,
    height: dimensions?.height || null,
    tags: tags,
    ai_tags: aiTags,
    ai_description: aiDescription,
    ai_colors: aiColors,
    metadata: {
      folder: folder,
      original_name: file.name,
      dimensions: dimensions,
      source: 'upload'
    },
    uploaded_by: user.id,
    version: 1,
  }

  const { data: asset, error: assetError } = await supabase
    .from('assets')
    .insert(assetData)
    .select()
    .single()

  if (assetError || !asset) {
    // Cleanup uploaded file on error
    await supabase.storage.from(BUCKET_NAME).remove([fileName])
    throw new Error(`Erro ao criar asset: ${assetError?.message}`)
  }

  return { asset, publicUrl }
}

// ============================================
// Asset Queries
// ============================================

export async function getAssets(
  brandId: string,
  filters?: AssetFilters
): Promise<Asset[]> {
  const supabase = createClient()
  
  let query = supabase
    .from('assets')
    .select('*')
    .eq('brand_id', brandId)
    .eq('is_archived', filters?.archived ?? false)
    .order('created_at', { ascending: false })

  if (filters?.category && filters.category !== 'all') {
    query = query.eq('file_type', filters.category)
  }

  if (filters?.search) {
    query = query.or(`name.ilike.%${filters.search}%,ai_description.ilike.%${filters.search}%`)
  }

  if (filters?.tags && filters.tags.length > 0) {
    query = query.overlaps('tags', filters.tags)
  }

  const { data, error } = await query

  if (error) {
    throw new Error(`Erro ao buscar assets: ${error.message}`)
  }

  return data || []
}

export async function getAsset(assetId: string): Promise<Asset | null> {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('assets')
    .select('*')
    .eq('id', assetId)
    .single()

  if (error) {
    return null
  }

  return data
}

export async function updateAsset(
  assetId: string,
  updates: Partial<Asset>
): Promise<Asset> {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('assets')
    .update(updates)
    .eq('id', assetId)
    .select()
    .single()

  if (error || !data) {
    throw new Error(`Erro ao atualizar asset: ${error?.message}`)
  }

  return data
}

export async function deleteAsset(assetId: string): Promise<void> {
  const supabase = createClient()
  
  // Get asset to find file path
  const asset = await getAsset(assetId)
  if (!asset) {
    throw new Error('Asset não encontrado')
  }

  // Delete from storage
  const { error: storageError } = await supabase.storage
    .from(BUCKET_NAME)
    .remove([asset.file_path])

  if (storageError) {
    console.error('Storage delete error:', storageError)
  }

  // Delete from database
  const { error: dbError } = await supabase
    .from('assets')
    .delete()
    .eq('id', assetId)

  if (dbError) {
    throw new Error(`Erro ao deletar asset: ${dbError.message}`)
  }
}

export async function archiveAsset(assetId: string): Promise<Asset> {
  return updateAsset(assetId, { is_archived: true })
}

// ============================================
// Asset URL Generation
// ============================================

export function getAssetUrl(
  filePath: string,
  transforms?: TransformOptions
): string {
  const supabase = createClient()
  
  const { data: { publicUrl } } = supabase.storage
    .from(BUCKET_NAME)
    .getPublicUrl(filePath)

  if (!transforms || Object.keys(transforms).length === 0) {
    return publicUrl
  }

  // Build transformation URL via our Media API
  const params = new URLSearchParams()
  if (transforms.width) params.set('w', transforms.width.toString())
  if (transforms.height) params.set('h', transforms.height.toString())
  if (transforms.format) params.set('f', transforms.format)
  if (transforms.quality) params.set('q', transforms.quality.toString())
  if (transforms.grayscale) params.set('g', 'true')

  return `/api/media/${filePath}?${params.toString()}`
}

export function getThumbnailUrl(filePath: string, size = 200): string {
  return getAssetUrl(filePath, { width: size, height: size, format: 'webp', quality: 80 })
}

// ============================================
// Helpers
// ============================================

function detectCategory(
  mimeType: string,
  fileName: string
): 'logo' | 'image' | 'typography' | 'document' | 'icon' | 'video' | 'other' {
  const lowerName = fileName.toLowerCase()
  
  // Check filename patterns
  if (lowerName.includes('logo') || lowerName.includes('marca')) return 'logo'
  if (lowerName.includes('icon') || lowerName.includes('icone')) return 'icon'
  
  // Check mime type
  if (mimeType.startsWith('image/svg')) return 'icon'
  if (mimeType.startsWith('image/')) return 'image'
  if (mimeType.startsWith('video/')) return 'video'
  if (mimeType.includes('font') || lowerName.match(/\.(ttf|otf|woff|woff2)$/)) return 'typography'
  if (
    mimeType.includes('pdf') ||
    mimeType.includes('document') ||
    mimeType.includes('spreadsheet') ||
    mimeType.includes('presentation') ||
    lowerName.match(/\.(pdf|doc|docx|xls|xlsx|ppt|pptx)$/)
  ) {
    return 'document'
  }
  
  return 'other'
}

async function getImageDimensions(
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

// ============================================
// Collections
// ============================================

export async function getCollections(brandId: string) {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('asset_collections')
    .select(`
      *,
      cover_asset:assets(id, file_path, name)
    `)
    .eq('brand_id', brandId)
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error(`Erro ao buscar coleções: ${error.message}`)
  }

  return data || []
}

export async function createCollection(
  brandId: string,
  name: string,
  description?: string
) {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('asset_collections')
    .insert({
      brand_id: brandId,
      name,
      description,
    })
    .select()
    .single()

  if (error || !data) {
    throw new Error(`Erro ao criar coleção: ${error?.message}`)
  }

  return data
}

export async function addToCollection(collectionId: string, assetId: string) {
  const supabase = createClient()
  
  const { error } = await supabase
    .from('asset_collection_items')
    .insert({
      collection_id: collectionId,
      asset_id: assetId,
    })

  if (error) {
    throw new Error(`Erro ao adicionar à coleção: ${error.message}`)
  }
}
