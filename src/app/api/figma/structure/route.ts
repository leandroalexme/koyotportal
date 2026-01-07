/**
 * Figma Structure API Route
 * 
 * GET /api/figma/structure
 * 
 * Retorna a estrutura hierárquica de um arquivo Figma (páginas e frames).
 * Usado pelo FigmaPicker para exibir opções de seleção.
 */

import { NextRequest, NextResponse } from 'next/server'
import type { FigmaFileStructure, FigmaPageInfo, FigmaFrameInfo } from '@/lib/figma/figma-url-parser'

const FIGMA_API_BASE = 'https://api.figma.com/v1'

interface FigmaDocumentNode {
  id: string
  name: string
  type: string
  children?: FigmaDocumentNode[]
  absoluteBoundingBox?: {
    x: number
    y: number
    width: number
    height: number
  }
}

interface FigmaFileResponse {
  name: string
  lastModified: string
  version: string
  document: {
    id: string
    name: string
    type: string
    children: FigmaDocumentNode[]
  }
  thumbnailUrl?: string
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const fileKey = searchParams.get('fileKey')
    const accessToken = searchParams.get('accessToken')
    const nodeId = searchParams.get('nodeId') // Opcional: se fornecido, retorna frames dessa página
    
    if (!fileKey || !accessToken) {
      return NextResponse.json(
        { error: 'fileKey and accessToken are required' },
        { status: 400 }
      )
    }
    
    // Buscar estrutura do arquivo
    // Usar depth=2 para pegar páginas e frames de primeiro nível
    const url = `${FIGMA_API_BASE}/files/${fileKey}?depth=2`
    
    const response = await fetch(url, {
      headers: {
        'X-Figma-Token': accessToken,
      },
    })
    
    if (response.status === 429) {
      const retryAfter = response.headers.get('Retry-After')
      return NextResponse.json(
        { 
          error: 'Rate limit exceeded',
          retryAfter: retryAfter ? parseInt(retryAfter, 10) : 60,
        },
        { status: 429 }
      )
    }
    
    if (!response.ok) {
      const errorText = await response.text().catch(() => response.statusText)
      return NextResponse.json(
        { error: `Figma API error: ${response.status} - ${errorText}` },
        { status: response.status }
      )
    }
    
    const fileData: FigmaFileResponse = await response.json()
    
    // Processar estrutura
    const pages: FigmaPageInfo[] = []
    
    for (const page of fileData.document.children || []) {
      if (page.type !== 'CANVAS') continue
      
      // Se nodeId foi fornecido, filtrar apenas essa página
      if (nodeId && page.id !== nodeId) continue
      
      const frames: FigmaFrameInfo[] = []
      
      for (const child of page.children || []) {
        // Considerar frames, componentes e component sets
        if (!['FRAME', 'COMPONENT', 'COMPONENT_SET', 'GROUP'].includes(child.type)) continue
        
        const frameInfo: FigmaFrameInfo = {
          id: child.id,
          name: child.name,
          type: child.type,
          width: child.absoluteBoundingBox?.width || 0,
          height: child.absoluteBoundingBox?.height || 0,
          childCount: child.children?.length || 0,
          isComponent: child.type === 'COMPONENT' || child.type === 'COMPONENT_SET',
        }
        
        frames.push(frameInfo)
      }
      
      pages.push({
        id: page.id,
        name: page.name,
        frames,
      })
    }
    
    const structure: FigmaFileStructure = {
      name: fileData.name,
      lastModified: fileData.lastModified,
      version: fileData.version,
      pages,
    }
    
    return NextResponse.json(structure)
    
  } catch (error) {
    console.error('[Figma Structure] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
