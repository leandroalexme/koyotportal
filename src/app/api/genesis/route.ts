import { NextRequest, NextResponse } from 'next/server'
import { generateBrandFromBriefing } from '@/services/ai-generation'
import { createClient } from '@/lib/supabase/server'

export interface BriefingData {
  brandName: string
  targetAudience: string
  personality: string[]
  marketSegment: string
  additionalContext?: string
}

export async function POST(request: NextRequest) {
  try {
    const briefing: BriefingData = await request.json()

    // Validate required fields
    if (!briefing.brandName?.trim()) {
      return NextResponse.json(
        { error: 'Nome da marca é obrigatório' },
        { status: 400 }
      )
    }
    if (!briefing.targetAudience?.trim()) {
      return NextResponse.json(
        { error: 'Público-alvo é obrigatório' },
        { status: 400 }
      )
    }
    if (!briefing.personality || briefing.personality.length < 3) {
      return NextResponse.json(
        { error: 'Selecione pelo menos 3 adjetivos de personalidade' },
        { status: 400 }
      )
    }
    if (!briefing.marketSegment) {
      return NextResponse.json(
        { error: 'Segmento de mercado é obrigatório' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Usuário não autenticado' },
        { status: 401 }
      )
    }

    // Generate brand identity with AI
    const generatedBrand = await generateBrandFromBriefing(briefing)

    // Create slug from brand name
    const slug = briefing.brandName
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')

    // Create brand in database
    const { data: brand, error: brandError } = await supabase
      .from('brands')
      .insert({
        name: briefing.brandName,
        slug: `${slug}-${Date.now().toString(36)}`,
        owner_id: user.id,
        mission: generatedBrand.brand_identity.mission,
        vision: generatedBrand.brand_identity.vision,
        voice_tone: generatedBrand.brand_identity.voice_tone,
        ai_context_prompt: `Marca: ${briefing.brandName}\nPúblico: ${briefing.targetAudience}\nPersonalidade: ${briefing.personality.join(', ')}\nSegmento: ${briefing.marketSegment}`,
        values: briefing.personality,
        settings: {
          logo_concept: generatedBrand.logo_concept,
          generated_at: new Date().toISOString(),
          model: 'gemini-2.5-flash'
        }
      })
      .select()
      .single()

    if (brandError || !brand) {
      console.error('Error creating brand:', brandError)
      return NextResponse.json(
        { error: 'Erro ao criar marca no banco de dados' },
        { status: 500 }
      )
    }

    // Create Identity page
    const { data: identityPage, error: identityPageError } = await supabase
      .from('pages')
      .insert({
        brand_id: brand.id,
        title: 'Identidade Visual',
        slug: 'identity',
        description: 'Elementos visuais da marca',
        order_index: 0,
        is_published: true
      })
      .select()
      .single()

    if (identityPageError || !identityPage) {
      console.error('Error creating identity page:', identityPageError)
    }

    // Create Assets page
    const { error: assetsPageError } = await supabase
      .from('pages')
      .insert({
        brand_id: brand.id,
        title: 'Assets',
        slug: 'assets',
        description: 'Biblioteca de ativos digitais',
        order_index: 1,
        is_published: true
      })

    if (assetsPageError) {
      console.error('Error creating assets page:', assetsPageError)
    }

    // Create blocks for Identity page
    if (identityPage) {
      const blocksToInsert = [
        {
          page_id: identityPage.id,
          type: 'color_palette',
          title: 'Paleta de Cores',
          description: 'Cores oficiais da marca',
          content: {
            colors: generatedBrand.colors.map(color => ({
              name: color.name,
              hex: color.hex,
              usage: color.justification,
              category: color.category || 'primary'
            })),
            description: 'Paleta de cores gerada por IA baseada no briefing da marca'
          },
          order_index: 0,
          is_visible: true,
          ai_generated: true,
          ai_model: 'gemini-2.5-flash'
        },
        {
          page_id: identityPage.id,
          type: 'typography_showcase',
          title: 'Tipografia',
          description: 'Sistema tipográfico da marca',
          content: {
            fonts: [
              {
                name: 'Headline',
                family: generatedBrand.typography.headline.family,
                weight: generatedBrand.typography.headline.weight,
                usage: 'Títulos e destaques',
                source: 'google' as const
              },
              {
                name: 'Body',
                family: generatedBrand.typography.body.family,
                weight: generatedBrand.typography.body.weight,
                usage: 'Texto corrido e parágrafos',
                source: 'google' as const
              }
            ],
            description: 'Sistema tipográfico gerado por IA'
          },
          order_index: 1,
          is_visible: true,
          ai_generated: true,
          ai_model: 'gemini-2.5-flash'
        },
        {
          page_id: identityPage.id,
          type: 'voice_tone',
          title: 'Voz e Tom',
          description: 'Diretrizes de comunicação da marca',
          content: {
            voice: generatedBrand.brand_identity.voice_tone.characteristics.map(
              (trait: string) => ({
                trait,
                description: `A marca se comunica de forma ${trait.toLowerCase()}`,
                examples: []
              })
            ),
            tone: [
              {
                context: 'Formal',
                tone: 'Profissional e respeitoso',
                example: 'Comunicações corporativas e documentos oficiais'
              },
              {
                context: 'Casual',
                tone: 'Amigável e acessível',
                example: 'Redes sociais e comunicação direta com clientes'
              }
            ],
            keywords: generatedBrand.brand_identity.voice_tone.keywords || [],
            description: generatedBrand.brand_identity.voice_tone.description
          },
          order_index: 2,
          is_visible: true,
          ai_generated: true,
          ai_model: 'gemini-2.5-flash'
        }
      ]

      const { error: blocksError } = await supabase
        .from('blocks')
        .insert(blocksToInsert)

      if (blocksError) {
        console.error('Error creating blocks:', blocksError)
      }
    }

    return NextResponse.json({ 
      brandId: brand.id,
      slug: brand.slug,
      message: 'Marca criada com sucesso'
    })

  } catch (error) {
    console.error('Genesis error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
