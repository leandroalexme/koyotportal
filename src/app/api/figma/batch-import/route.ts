/**
 * Figma Batch Import API Route
 * 
 * POST /api/figma/batch-import
 * 
 * Importa múltiplos frames do Figma e salva como templates no banco de dados.
 * Retorna os IDs dos templates criados para redirecionamento.
 */

import { NextRequest, NextResponse } from 'next/server'
import { importFromFigma } from '@/lib/figma/figma-importer'
import type { FigmaImportConfig } from '@/types/figma'
import { nanoid } from 'nanoid'

interface BatchImportRequest {
  accessToken: string
  fileKey: string
  brandId: string
  frames: {
    nodeId: string
    name: string
  }[]
  importImages?: boolean
  scale?: number
}

interface ImportedTemplateResult {
  nodeId: string
  templateId: string
  name: string
  success: boolean
  error?: string
  template?: unknown // Template completo para salvar no cliente
}

interface BatchImportResponse {
  success: boolean
  results: ImportedTemplateResult[]
  totalImported: number
  totalFailed: number
}

export async function POST(request: NextRequest) {
  try {
    const body: BatchImportRequest = await request.json()
    
    const { accessToken, fileKey, brandId, frames, importImages = false, scale = 2 } = body
    
    if (!accessToken || !fileKey || !brandId || !frames?.length) {
      return NextResponse.json(
        { error: 'accessToken, fileKey, brandId, and frames are required' },
        { status: 400 }
      )
    }
    
    console.log(`[Batch Import] Importing ${frames.length} frames from ${fileKey}`)
    
    const results: ImportedTemplateResult[] = []
    let totalImported = 0
    let totalFailed = 0
    
    // Processar cada frame sequencialmente para evitar rate limit
    for (const frame of frames) {
      try {
        console.log(`[Batch Import] Processing frame: ${frame.name} (${frame.nodeId})`)
        
        const config: FigmaImportConfig = {
          accessToken,
          fileKey,
          nodeId: frame.nodeId,
          brandId,
          importImages,
          scale,
          mapStylesToVariables: false,
        }
        
        const result = await importFromFigma(config)
        
        if (result.success && result.template) {
          // Gerar ID único para o template
          const templateId = nanoid()
          
          // Salvar template via API
          try {
            const saveResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/templates`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                id: templateId,
                brandId,
                template: {
                  ...result.template,
                  id: templateId,
                },
                source: 'figma',
                sourceUrl: `https://www.figma.com/design/${fileKey}?node-id=${frame.nodeId}`,
              }),
            })
            
            if (!saveResponse.ok) {
              console.warn(`[Batch Import] Failed to save template ${templateId}`)
            }
          } catch (saveError) {
            console.warn(`[Batch Import] Error saving template:`, saveError)
          }
          
          results.push({
            nodeId: frame.nodeId,
            templateId,
            name: result.template.name,
            success: true,
            template: {
              ...result.template,
              id: templateId,
            },
          })
          
          totalImported++
          console.log(`[Batch Import] Success: ${frame.name} -> ${templateId}`)
        } else {
          results.push({
            nodeId: frame.nodeId,
            templateId: '',
            name: frame.name,
            success: false,
            error: result.errors?.join(', ') || 'Unknown error',
          })
          
          totalFailed++
          console.log(`[Batch Import] Failed: ${frame.name} - ${result.errors?.join(', ')}`)
        }
        
        // Pequena pausa entre importações para evitar rate limit
        if (frames.indexOf(frame) < frames.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 500))
        }
        
      } catch (error) {
        results.push({
          nodeId: frame.nodeId,
          templateId: '',
          name: frame.name,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        })
        
        totalFailed++
      }
    }
    
    const response: BatchImportResponse = {
      success: totalImported > 0,
      results,
      totalImported,
      totalFailed,
    }
    
    return NextResponse.json(response)
    
  } catch (error) {
    console.error('[Batch Import] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
