import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const BUCKET_NAME = 'brand-assets'

interface TransformParams {
  width?: number
  height?: number
  format?: 'webp' | 'png' | 'jpeg'
  quality?: number
  grayscale?: boolean
}

function parseTransformParams(searchParams: URLSearchParams): TransformParams {
  const params: TransformParams = {}
  
  const w = searchParams.get('w') || searchParams.get('width')
  const h = searchParams.get('h') || searchParams.get('height')
  const f = searchParams.get('f') || searchParams.get('format')
  const q = searchParams.get('q') || searchParams.get('quality')
  const g = searchParams.get('g') || searchParams.get('grayscale')
  
  if (w) params.width = Math.min(Math.max(parseInt(w, 10), 1), 4096)
  if (h) params.height = Math.min(Math.max(parseInt(h, 10), 1), 4096)
  if (f && ['webp', 'png', 'jpeg', 'jpg'].includes(f)) {
    params.format = f === 'jpg' ? 'jpeg' : f as 'webp' | 'png' | 'jpeg'
  }
  if (q) params.quality = Math.min(Math.max(parseInt(q, 10), 1), 100)
  if (g === 'true' || g === '1') params.grayscale = true
  
  return params
}

function buildSupabaseTransformUrl(
  publicUrl: string,
  params: TransformParams
): string {
  const transformParts: string[] = []
  
  if (params.width) transformParts.push(`width=${params.width}`)
  if (params.height) transformParts.push(`height=${params.height}`)
  if (params.format) transformParts.push(`format=${params.format}`)
  if (params.quality) transformParts.push(`quality=${params.quality}`)
  
  if (transformParts.length === 0) {
    return publicUrl
  }
  
  // Supabase Storage transformation URL format
  // https://project.supabase.co/storage/v1/render/image/public/bucket/path?width=X&height=Y
  const url = new URL(publicUrl)
  const pathParts = url.pathname.split('/')
  
  // Find 'object' or 'public' in path and replace with 'render/image'
  const objectIndex = pathParts.indexOf('object')
  if (objectIndex !== -1) {
    pathParts.splice(objectIndex, 1, 'render', 'image')
  }
  
  url.pathname = pathParts.join('/')
  transformParts.forEach(param => {
    const [key, value] = param.split('=')
    url.searchParams.set(key, value)
  })
  
  return url.toString()
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path } = await params
    const filePath = path.join('/')
    const searchParams = request.nextUrl.searchParams
    const transformParams = parseTransformParams(searchParams)
    
    const supabase = await createClient()
    
    // Get the public URL
    const { data: { publicUrl } } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(filePath)
    
    // Check if file exists by trying to get metadata
    const { error: headError } = await supabase.storage
      .from(BUCKET_NAME)
      .list(filePath.split('/').slice(0, -1).join('/'), {
        limit: 1,
        search: filePath.split('/').pop()
      })
    
    if (headError) {
      return NextResponse.json(
        { error: 'Asset not found' },
        { status: 404 }
      )
    }
    
    // If grayscale is requested, we need to process server-side
    // For now, redirect to Supabase's built-in transformation
    if (Object.keys(transformParams).length > 0 && !transformParams.grayscale) {
      const transformedUrl = buildSupabaseTransformUrl(publicUrl, transformParams)
      return NextResponse.redirect(transformedUrl)
    }
    
    // For grayscale or no transforms, redirect to original
    return NextResponse.redirect(publicUrl)
    
  } catch (error) {
    console.error('Media API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Metadata endpoint for asset info
export async function HEAD(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path } = await params
    const filePath = path.join('/')
    
    const supabase = await createClient()
    
    const { data: { publicUrl } } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(filePath)
    
    const response = new NextResponse(null, { status: 200 })
    response.headers.set('X-Asset-Url', publicUrl)
    response.headers.set('X-Asset-Path', filePath)
    
    return response
  } catch {
    return new NextResponse(null, { status: 404 })
  }
}
