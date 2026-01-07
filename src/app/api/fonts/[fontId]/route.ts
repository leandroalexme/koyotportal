/**
 * API de operações em fonte individual
 * 
 * GET /api/fonts/[fontId] - Busca fonte por ID
 * PATCH /api/fonts/[fontId] - Atualiza fonte
 * DELETE /api/fonts/[fontId] - Deleta fonte
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  getFontById,
  updateFont,
  deleteFont,
  deleteFontPermanently,
} from '@/lib/fonts/font-service'

interface RouteParams {
  params: Promise<{ fontId: string }>
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { fontId } = await params
    
    const font = await getFontById(fontId)
    
    if (!font) {
      return NextResponse.json(
        { error: 'Fonte não encontrada' },
        { status: 404 }
      )
    }
    
    return NextResponse.json({ font })
  } catch (error) {
    console.error('[API Fonts] GET error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro interno' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const supabase = await createClient()
    
    // Verifica autenticação
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }
    
    const { fontId } = await params
    const body = await request.json()
    
    // Verifica se a fonte existe
    const existingFont = await getFontById(fontId)
    if (!existingFont) {
      return NextResponse.json(
        { error: 'Fonte não encontrada' },
        { status: 404 }
      )
    }
    
    // Atualiza a fonte
    const font = await updateFont(fontId, {
      family: body.family,
      style: body.style,
      weight: body.weight,
      isDefault: body.isDefault,
      category: body.category,
      isActive: body.isActive,
    })
    
    return NextResponse.json({ font })
  } catch (error) {
    console.error('[API Fonts] PATCH error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro interno' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const supabase = await createClient()
    
    // Verifica autenticação
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }
    
    const { fontId } = await params
    const { searchParams } = new URL(request.url)
    const permanent = searchParams.get('permanent') === 'true'
    
    // Verifica se a fonte existe
    const existingFont = await getFontById(fontId)
    if (!existingFont) {
      return NextResponse.json(
        { error: 'Fonte não encontrada' },
        { status: 404 }
      )
    }
    
    if (permanent) {
      await deleteFontPermanently(fontId)
    } else {
      await deleteFont(fontId)
    }
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[API Fonts] DELETE error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro interno' },
      { status: 500 }
    )
  }
}
