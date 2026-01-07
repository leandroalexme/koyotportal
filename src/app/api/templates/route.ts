/**
 * Templates API Route
 * 
 * POST /api/templates - Salva um novo template
 * GET /api/templates - Lista templates por brandId
 */

import { NextRequest, NextResponse } from 'next/server'
import type { Template } from '@/types/studio'

// Armazenamento em memória do servidor (temporário)
// TODO: Migrar para Supabase quando a tabela estiver criada
const serverTemplateStore = new Map<string, {
  id: string
  brandId: string
  template: Template
  createdAt: string
  updatedAt: string
  source: string
  sourceUrl?: string
}>()

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, brandId, template, source, sourceUrl } = body
    
    if (!id || !brandId || !template) {
      return NextResponse.json(
        { error: 'id, brandId, and template are required' },
        { status: 400 }
      )
    }
    
    const now = new Date().toISOString()
    const entry = {
      id,
      brandId,
      template: {
        ...template,
        id,
      },
      createdAt: now,
      updatedAt: now,
      source: source || 'figma',
      sourceUrl,
    }
    
    serverTemplateStore.set(id, entry)
    
    console.log('[Templates API] Saved template:', id, template.name)
    
    return NextResponse.json({
      success: true,
      templateId: id,
    })
    
  } catch (error) {
    console.error('[Templates API] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const brandId = searchParams.get('brandId')
    const templateId = searchParams.get('id')
    
    // Buscar por ID específico
    if (templateId) {
      const entry = serverTemplateStore.get(templateId)
      
      if (!entry) {
        return NextResponse.json(
          { error: 'Template not found' },
          { status: 404 }
        )
      }
      
      return NextResponse.json({
        success: true,
        template: entry.template,
      })
    }
    
    // Listar por brandId
    if (brandId) {
      const templates = Array.from(serverTemplateStore.values())
        .filter(entry => entry.brandId === brandId)
        .map(entry => entry.template)
      
      return NextResponse.json({
        success: true,
        templates,
      })
    }
    
    // Listar todos
    const templates = Array.from(serverTemplateStore.values())
      .map(entry => entry.template)
    
    return NextResponse.json({
      success: true,
      templates,
    })
    
  } catch (error) {
    console.error('[Templates API] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
