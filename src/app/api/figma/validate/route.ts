/**
 * Figma URL Validation API Route
 * 
 * POST /api/figma/validate
 * 
 * Validates a Figma URL and returns parsed information.
 */

import { NextRequest, NextResponse } from 'next/server'
import { parseFigmaUrl } from '@/lib/figma'

export interface FigmaValidateRequest {
  url: string
}

export async function POST(request: NextRequest) {
  try {
    const body: FigmaValidateRequest = await request.json()
    
    if (!body.url) {
      return NextResponse.json(
        { error: 'url is required' },
        { status: 400 }
      )
    }
    
    const parsed = parseFigmaUrl(body.url)
    
    if (!parsed) {
      return NextResponse.json(
        { 
          valid: false,
          error: 'Invalid Figma URL format',
        },
        { status: 200 }
      )
    }
    
    return NextResponse.json({
      valid: true,
      fileKey: parsed.fileKey,
      nodeId: parsed.nodeId,
      fileName: parsed.fileName,
    })
    
  } catch (error) {
    console.error('Figma validate error:', error)
    
    return NextResponse.json(
      { 
        valid: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
