import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { analyzeAsset, type AssetAnalysisResult } from '@/services/asset-analysis'

export async function POST(request: NextRequest) {
  try {
    const { assetId, url, brandContext } = await request.json()

    if (!assetId || !url) {
      return NextResponse.json(
        { error: 'assetId e url são obrigatórios' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Verify user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }

    // Verify asset exists and user has access
    const { data: asset, error: assetError } = await supabase
      .from('assets')
      .select('id, brand_id, file_path')
      .eq('id', assetId)
      .single()

    if (assetError || !asset) {
      return NextResponse.json(
        { error: 'Asset não encontrado' },
        { status: 404 }
      )
    }

    // Analyze asset with AI
    let analysis: AssetAnalysisResult

    try {
      analysis = await analyzeAsset({
        url,
        brandContext,
      })
    } catch (aiError) {
      console.error('AI Analysis error:', aiError)
      return NextResponse.json(
        { error: 'Falha na análise de IA', details: aiError instanceof Error ? aiError.message : 'Erro desconhecido' },
        { status: 500 }
      )
    }

    // Update asset with analysis results
    const { error: updateError } = await supabase
      .from('assets')
      .update({
        ai_tags: analysis.tags,
        ai_description: analysis.description,
        ai_colors: analysis.dominantColors.map(c => c.hex),
        alt_text: analysis.altText,
        metadata: {
          ai_analysis: {
            category: analysis.category,
            style: analysis.style,
            mood: analysis.mood,
            objects: analysis.objects,
            confidence: analysis.confidence,
            analyzed_at: new Date().toISOString(),
          },
          dominant_colors_detailed: analysis.dominantColors,
        },
      })
      .eq('id', assetId)

    if (updateError) {
      console.error('Update error:', updateError)
      return NextResponse.json(
        { error: 'Erro ao atualizar asset' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      analysis,
    })
  } catch (error) {
    console.error('Asset analysis route error:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// GET endpoint to check analysis status or re-analyze
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const assetId = searchParams.get('assetId')

  if (!assetId) {
    return NextResponse.json(
      { error: 'assetId é obrigatório' },
      { status: 400 }
    )
  }

  const supabase = await createClient()

  const { data: asset, error } = await supabase
    .from('assets')
    .select('id, ai_tags, ai_description, ai_colors, alt_text, metadata')
    .eq('id', assetId)
    .single()

  if (error || !asset) {
    return NextResponse.json(
      { error: 'Asset não encontrado' },
      { status: 404 }
    )
  }

  const hasAnalysis = asset.ai_tags && asset.ai_tags.length > 0

  return NextResponse.json({
    assetId: asset.id,
    analyzed: hasAnalysis,
    tags: asset.ai_tags || [],
    description: asset.ai_description || '',
    colors: asset.ai_colors || [],
    altText: asset.alt_text || '',
    metadata: asset.metadata,
  })
}
