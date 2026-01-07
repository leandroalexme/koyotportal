/**
 * Figma Images API Route
 * 
 * Busca imagens do Figma e faz upload para Supabase Storage
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface ImageUploadRequest {
  accessToken: string
  fileKey: string
  nodeIds: string[]
  brandId: string
  scale?: number
}

interface ImageResult {
  nodeId: string
  originalUrl: string
  storedUrl?: string
  success: boolean
  error?: string
}

export async function POST(request: NextRequest) {
  try {
    const body: ImageUploadRequest = await request.json()
    const { accessToken, fileKey, nodeIds, brandId, scale = 2 } = body

    if (!accessToken || !fileKey || !nodeIds?.length || !brandId) {
      return NextResponse.json(
        { error: 'accessToken, fileKey, nodeIds, and brandId are required' },
        { status: 400 }
      )
    }

    console.log(`[Figma Images] Fetching ${nodeIds.length} images from ${fileKey}`)

    // 1. Buscar URLs das imagens do Figma
    const figmaUrl = `https://api.figma.com/v1/images/${fileKey}?ids=${nodeIds.join(',')}&format=png&scale=${scale}`
    
    const figmaResponse = await fetch(figmaUrl, {
      headers: {
        'X-Figma-Token': accessToken,
      },
    })

    if (!figmaResponse.ok) {
      const errorText = await figmaResponse.text()
      console.error('[Figma Images] Figma API error:', errorText)
      return NextResponse.json(
        { error: `Figma API error: ${figmaResponse.status}` },
        { status: figmaResponse.status }
      )
    }

    const figmaData = await figmaResponse.json()
    const imageUrls: Record<string, string> = figmaData.images || {}

    console.log(`[Figma Images] Got ${Object.keys(imageUrls).length} image URLs`)

    // 2. Fazer download e upload para Supabase Storage
    const supabase = await createClient()
    const results: ImageResult[] = []

    for (const nodeId of nodeIds) {
      const originalUrl = imageUrls[nodeId]
      
      if (!originalUrl) {
        results.push({
          nodeId,
          originalUrl: '',
          success: false,
          error: 'Image URL not found',
        })
        continue
      }

      try {
        // Download da imagem
        const imageResponse = await fetch(originalUrl)
        if (!imageResponse.ok) {
          results.push({
            nodeId,
            originalUrl,
            success: false,
            error: `Failed to download image: ${imageResponse.status}`,
          })
          continue
        }

        const imageBlob = await imageResponse.blob()
        const imageBuffer = await imageBlob.arrayBuffer()

        // Gerar nome único para o arquivo
        const fileName = `figma-${fileKey}-${nodeId.replace(':', '-')}-${Date.now()}.png`
        const filePath = `${brandId}/figma-imports/${fileName}`

        // Upload para Supabase Storage
        const { error: uploadError } = await supabase.storage
          .from('assets')
          .upload(filePath, imageBuffer, {
            contentType: 'image/png',
            upsert: true,
          })

        if (uploadError) {
          console.error('[Figma Images] Upload error:', uploadError)
          results.push({
            nodeId,
            originalUrl,
            success: false,
            error: `Upload failed: ${uploadError.message}`,
          })
          continue
        }

        // Obter URL pública
        const { data: publicUrlData } = supabase.storage
          .from('assets')
          .getPublicUrl(filePath)

        results.push({
          nodeId,
          originalUrl,
          storedUrl: publicUrlData.publicUrl,
          success: true,
        })

        console.log(`[Figma Images] Uploaded: ${nodeId} -> ${publicUrlData.publicUrl}`)

      } catch (err) {
        console.error('[Figma Images] Error processing image:', err)
        results.push({
          nodeId,
          originalUrl,
          success: false,
          error: err instanceof Error ? err.message : 'Unknown error',
        })
      }
    }

    const successCount = results.filter(r => r.success).length
    console.log(`[Figma Images] Completed: ${successCount}/${nodeIds.length} images uploaded`)

    return NextResponse.json({
      success: true,
      results,
      totalUploaded: successCount,
      totalFailed: nodeIds.length - successCount,
    })

  } catch (error) {
    console.error('[Figma Images] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
