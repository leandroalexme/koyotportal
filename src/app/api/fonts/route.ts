/**
 * API de gerenciamento de fontes
 * 
 * GET /api/fonts?brandId=xxx - Lista fontes da marca
 * POST /api/fonts - Upload de nova fonte
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  listBrandFonts,
  createFont,
  uploadFontFile,
  detectFontFormat,
  extractFontWeight,
  extractFontStyle,
} from '@/lib/fonts/font-service'
import { MAX_FONT_FILE_SIZE, FONT_EXTENSIONS } from '@/types/fonts'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const brandId = searchParams.get('brandId')
    
    if (!brandId) {
      return NextResponse.json(
        { error: 'brandId é obrigatório' },
        { status: 400 }
      )
    }
    
    const fonts = await listBrandFonts(brandId)
    
    return NextResponse.json({ fonts })
  } catch (error) {
    console.error('[API Fonts] GET error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro interno' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
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
    
    // Parse do form data
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const brandId = formData.get('brandId') as string | null
    const family = formData.get('family') as string | null
    const style = formData.get('style') as string | null
    const weight = formData.get('weight') as string | null
    const category = formData.get('category') as string | null
    const isDefault = formData.get('isDefault') === 'true'
    
    // Validações
    if (!file) {
      return NextResponse.json(
        { error: 'Arquivo de fonte é obrigatório' },
        { status: 400 }
      )
    }
    
    if (!brandId) {
      return NextResponse.json(
        { error: 'brandId é obrigatório' },
        { status: 400 }
      )
    }
    
    // Valida tamanho
    if (file.size > MAX_FONT_FILE_SIZE) {
      return NextResponse.json(
        { error: `Arquivo muito grande. Máximo: ${MAX_FONT_FILE_SIZE / 1024 / 1024}MB` },
        { status: 400 }
      )
    }
    
    // Valida formato
    const format = detectFontFormat(file.type, file.name)
    if (!format) {
      return NextResponse.json(
        { error: `Formato não suportado. Use: ${FONT_EXTENSIONS.join(', ')}` },
        { status: 400 }
      )
    }
    
    // Extrai informações do nome do arquivo se não fornecidas
    const fontFamily = family || file.name.split('.')[0].split('-')[0]
    const fontStyle = style ? (style as 'normal' | 'italic') : extractFontStyle(file.name)
    const fontWeight = weight ? parseInt(weight, 10) : extractFontWeight(file.name)
    
    // Faz upload do arquivo
    const buffer = Buffer.from(await file.arrayBuffer())
    const { filePath } = await uploadFontFile(brandId, buffer, file.name, file.type)
    
    // Cria registro no banco
    const font = await createFont({
      brandId,
      family: fontFamily,
      style: fontStyle,
      weight: fontWeight,
      filePath,
      fileName: file.name,
      fileSize: file.size,
      format,
      source: 'upload',
      isDefault,
      category: category as 'display' | 'heading' | 'body' | 'ui' | undefined,
      uploadedBy: user.id,
    })
    
    return NextResponse.json({ font }, { status: 201 })
  } catch (error) {
    console.error('[API Fonts] POST error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro interno' },
      { status: 500 }
    )
  }
}
