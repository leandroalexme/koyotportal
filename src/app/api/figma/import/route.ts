/**
 * Figma Import API Route
 * 
 * POST /api/figma/import
 * 
 * Imports a Figma frame/page and converts it to an internal Template.
 */

import { NextRequest, NextResponse } from 'next/server'
import { importFromFigmaUrl, importFromFigma } from '@/lib/figma'
import type { FigmaImportConfig } from '@/types/figma'

export interface FigmaImportRequest {
  /** Figma URL (alternative to fileKey + nodeId) */
  url?: string
  /** Figma file key */
  fileKey?: string
  /** Node ID to import */
  nodeId?: string
  /** Figma Personal Access Token */
  accessToken: string
  /** Brand ID to associate with the template */
  brandId?: string
  /** Whether to import images */
  importImages?: boolean
  /** Scale factor for image export */
  scale?: number
  /** Whether to map Figma styles to variables */
  mapStylesToVariables?: boolean
}

export async function POST(request: NextRequest) {
  try {
    const body: FigmaImportRequest = await request.json()
    
    // Validate required fields
    if (!body.accessToken) {
      return NextResponse.json(
        { error: 'accessToken is required' },
        { status: 400 }
      )
    }
    
    if (!body.url && !body.fileKey) {
      return NextResponse.json(
        { error: 'Either url or fileKey is required' },
        { status: 400 }
      )
    }
    
    let result
    
    if (body.url) {
      // Import from URL
      result = await importFromFigmaUrl(body.url, body.accessToken, {
        brandId: body.brandId,
        importImages: body.importImages ?? false, // Desabilitado por padrão para evitar rate limit
        scale: body.scale ?? 2,
        mapStylesToVariables: body.mapStylesToVariables ?? false,
      })
    } else {
      // Import from fileKey + nodeId
      const config: FigmaImportConfig = {
        accessToken: body.accessToken,
        fileKey: body.fileKey!,
        nodeId: body.nodeId,
        brandId: body.brandId,
        importImages: body.importImages ?? false, // Desabilitado por padrão para evitar rate limit
        scale: body.scale ?? 2,
        mapStylesToVariables: body.mapStylesToVariables ?? false,
      }
      result = await importFromFigma(config)
    }
    
    if (!result.success) {
      return NextResponse.json(
        { 
          error: 'Import failed',
          errors: result.errors,
          warnings: result.warnings,
        },
        { status: 422 }
      )
    }
    
    return NextResponse.json({
      success: true,
      template: result.template,
      warnings: result.warnings,
      imageMap: result.imageMap,
    })
    
  } catch (error) {
    console.error('Figma import error:', error)
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

/**
 * GET /api/figma/import
 * 
 * Returns API documentation
 */
export async function GET() {
  return NextResponse.json({
    name: 'Figma Import API',
    version: '1.0.0',
    description: 'Import Figma frames and convert to Koyot templates',
    endpoints: {
      'POST /api/figma/import': {
        description: 'Import a Figma frame',
        body: {
          url: 'string (optional) - Full Figma URL',
          fileKey: 'string (optional) - Figma file key',
          nodeId: 'string (optional) - Node ID to import',
          accessToken: 'string (required) - Figma Personal Access Token',
          brandId: 'string (optional) - Brand ID for the template',
          importImages: 'boolean (optional, default: true) - Import images',
          scale: 'number (optional, default: 2) - Image export scale',
          mapStylesToVariables: 'boolean (optional, default: false) - Map styles to variables',
        },
        response: {
          success: 'boolean',
          template: 'Template object',
          warnings: 'string[]',
          imageMap: 'Record<string, string> - Node ID to image URL mapping',
        },
      },
    },
    notes: [
      'Either url or fileKey must be provided',
      'Get your Personal Access Token from Figma Settings > Account > Personal access tokens',
      'The imported template will have auto-layout properties mapped to Yoga layout',
    ],
  })
}
