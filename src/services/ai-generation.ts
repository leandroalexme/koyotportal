import { GoogleGenerativeAI } from '@google/generative-ai'
import type { BlockType, BlockContent, Brand } from '@/types'

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY || '')

// ============================================
// GENESIS FLOW - Brand Generation from Briefing
// ============================================

export interface BriefingInput {
  brandName: string
  targetAudience: string
  personality: string[]
  marketSegment: string
  additionalContext?: string
}

export interface GeneratedColor {
  name: string
  hex: string
  justification: string
  category: 'primary' | 'secondary' | 'accent' | 'neutral'
}

export interface GeneratedTypography {
  headline: {
    family: string
    weight: string
    style: string
  }
  body: {
    family: string
    weight: string
    style: string
  }
}

export interface GeneratedBrandIdentity {
  mission: string
  vision: string
  voice_tone: {
    description: string
    characteristics: string[]
    keywords: string[]
  }
}

export interface GeneratedBrand {
  brand_identity: GeneratedBrandIdentity
  colors: GeneratedColor[]
  typography: GeneratedTypography
  logo_concept: string
}

const GENESIS_SYSTEM_PROMPT = `You are an expert brand strategist and visual identity designer. Your task is to create a complete brand identity based on a briefing.

You MUST respond with a valid JSON object following this EXACT structure:

{
  "brand_identity": {
    "mission": "A clear, concise mission statement (1-2 sentences)",
    "vision": "An aspirational vision statement (1-2 sentences)",
    "voice_tone": {
      "description": "Overall description of how the brand communicates",
      "characteristics": ["trait1", "trait2", "trait3", "trait4"],
      "keywords": ["keyword1", "keyword2", "keyword3", "keyword4", "keyword5"]
    }
  },
  "colors": [
    {
      "name": "Color Name",
      "hex": "#XXXXXX",
      "justification": "Why this color fits the brand",
      "category": "primary|secondary|accent|neutral"
    }
  ],
  "typography": {
    "headline": {
      "family": "Google Font Name",
      "weight": "700",
      "style": "Description of when to use"
    },
    "body": {
      "family": "Google Font Name", 
      "weight": "400",
      "style": "Description of when to use"
    }
  },
  "logo_concept": "Detailed description of the logo concept including shape, style, symbolism, and visual elements"
}

IMPORTANT RULES:
1. Colors array MUST have exactly 5 colors: 2 primary, 1 secondary, 1 accent, 1 neutral
2. All hex codes must be valid 6-character hex colors (e.g., #1A2B3C)
3. Typography fonts MUST be available on Google Fonts
4. All text must be in Portuguese (Brazil)
5. Be creative but professional
6. The brand identity should reflect the personality traits provided
7. Colors should work well together and be accessible`

export async function generateBrandFromBriefing(
  briefing: BriefingInput
): Promise<GeneratedBrand> {
  if (!process.env.GOOGLE_AI_API_KEY) {
    throw new Error('GOOGLE_AI_API_KEY não configurada nas variáveis de ambiente.')
  }

  const model = genAI.getGenerativeModel({
    model: 'gemini-2.5-flash',
    generationConfig: {
      responseMimeType: 'application/json',
      temperature: 0.8,
    },
  })

  const userPrompt = `
Crie uma identidade de marca completa para:

**Nome da Marca:** ${briefing.brandName}

**Público-alvo:** ${briefing.targetAudience}

**Personalidade da Marca:** ${briefing.personality.join(', ')}

**Segmento de Mercado:** ${briefing.marketSegment}

${briefing.additionalContext ? `**Contexto Adicional:** ${briefing.additionalContext}` : ''}

Gere uma identidade visual coesa que reflita esses atributos. Seja criativo e estratégico.
`

  const fullPrompt = `${GENESIS_SYSTEM_PROMPT}\n\n${userPrompt}`

  try {
    const result = await model.generateContent(fullPrompt)
    const response = result.response
    const text = response.text()

    if (!text) {
      throw new Error('Nenhum conteúdo retornado do Gemini')
    }

    const parsed = parseAIResponse<GeneratedBrand>(text)
    validateGeneratedBrand(parsed)

    return parsed
  } catch (error) {
    console.error('Genesis AI Error:', error)
    
    if (error instanceof SyntaxError) {
      throw new Error('Erro ao processar resposta da IA. Tente novamente.')
    }
    
    throw error
  }
}

function parseAIResponse<T>(text: string): T {
  // Try to extract JSON from the response
  let jsonText = text.trim()
  
  // Remove markdown code blocks if present
  if (jsonText.startsWith('```json')) {
    jsonText = jsonText.slice(7)
  } else if (jsonText.startsWith('```')) {
    jsonText = jsonText.slice(3)
  }
  
  if (jsonText.endsWith('```')) {
    jsonText = jsonText.slice(0, -3)
  }
  
  jsonText = jsonText.trim()
  
  try {
    return JSON.parse(jsonText) as T
  } catch {
    // Try to find JSON object in the text
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]) as T
    }
    throw new SyntaxError('Could not parse JSON from AI response')
  }
}

function validateGeneratedBrand(brand: GeneratedBrand): void {
  if (!brand.brand_identity) {
    throw new Error('brand_identity is missing')
  }
  if (!brand.brand_identity.mission || !brand.brand_identity.vision) {
    throw new Error('mission or vision is missing')
  }
  if (!brand.colors || !Array.isArray(brand.colors) || brand.colors.length < 3) {
    throw new Error('colors array is invalid or too short')
  }
  if (!brand.typography || !brand.typography.headline || !brand.typography.body) {
    throw new Error('typography is incomplete')
  }
  if (!brand.logo_concept) {
    throw new Error('logo_concept is missing')
  }
  
  // Validate hex colors
  for (const color of brand.colors) {
    if (!color.hex || !/^#[0-9A-Fa-f]{6}$/.test(color.hex)) {
      throw new Error(`Invalid hex color: ${color.hex}`)
    }
  }
}

interface AIGenerationOptions {
  brand: Brand
  blockType: BlockType
  customPrompt?: string
  context?: Record<string, unknown>
}

interface AIGenerationResult {
  content: BlockContent
  model: string
  promptUsed: string
}

const BLOCK_PROMPTS: Record<BlockType, string> = {
  color_palette: `Generate a professional color palette with 6-8 colors including:
- 2 primary colors
- 2 secondary colors  
- 2 accent colors
- 2 neutral colors
Each color should have: name, hex value, and usage description.`,

  typography_showcase: `Generate a typography system with 3-4 font recommendations:
- Display/Heading font
- Body text font
- Optional: Accent or mono font
Include font family, weight, and usage guidelines.`,

  logo_grid: `Generate logo usage guidelines including:
- Primary logo description
- Secondary/alternate versions
- Minimum size requirements
- Clear space rules`,

  logo_usage: `Generate logo do's and don'ts:
- 5 correct usage examples
- 5 incorrect usage examples
Each with clear descriptions.`,

  voice_tone: `Generate brand voice and tone guidelines:
- 4-5 voice characteristics (e.g., Professional, Friendly, Bold)
- Tone variations by context (formal, casual, urgent)
- 10-15 brand keywords`,

  imagery_style: `Generate imagery style guidelines:
- Overall photography/illustration style
- 5-7 specific guidelines
- Color treatment and filters
- Composition rules`,

  spacing_system: `Generate a spacing system:
- Base unit (e.g., 4px or 8px)
- Scale multipliers
- Usage guidelines for margins and padding`,

  icon_set: `Generate icon style guidelines:
- Icon style (outlined, filled, duotone)
- Stroke weight
- Corner radius
- Size variations`,

  pattern_library: `Generate pattern/texture guidelines:
- Pattern styles that match the brand
- Usage contexts
- Color variations`,

  motion_guidelines: `Generate motion/animation guidelines:
- Timing functions
- Duration standards
- Transition types
- Animation principles`,

  text_block: 'Generate descriptive text content.',
  image_block: 'Generate image placeholder description.',
  divider: 'Generate divider style.',
  custom: 'Generate custom content based on context.',
}

export async function generateBlockContent(
  options: AIGenerationOptions
): Promise<AIGenerationResult> {
  const { brand, blockType, customPrompt, context } = options

  const brandContext = `
Brand Name: ${brand.name}
Mission: ${brand.mission || 'Not defined'}
Vision: ${brand.vision || 'Not defined'}
Values: ${brand.values?.join(', ') || 'Not defined'}
AI Context: ${brand.ai_context_prompt || 'No additional context'}
`

  const basePrompt = BLOCK_PROMPTS[blockType]
  const fullPrompt = customPrompt
    ? `${basePrompt}\n\nAdditional instructions: ${customPrompt}`
    : basePrompt

  const systemPrompt = `You are a brand design expert. Generate content for a brand guideline block.
${brandContext}

Output must be valid JSON matching the expected block content structure.
Be specific, professional, and aligned with the brand's identity.`

  // This is a placeholder - integrate with your preferred AI provider
  // (OpenAI, Anthropic, etc.)
  const response = await callAIProvider({
    systemPrompt,
    userPrompt: fullPrompt,
    context,
  })

  return {
    content: response.content,
    model: response.model,
    promptUsed: fullPrompt,
  }
}

async function callAIProvider(params: {
  systemPrompt: string
  userPrompt: string
  context?: Record<string, unknown>
}): Promise<{ content: BlockContent; model: string }> {
  if (!process.env.GOOGLE_AI_API_KEY) {
    throw new Error('GOOGLE_AI_API_KEY not configured in environment variables.')
  }

  const model = genAI.getGenerativeModel({ 
    model: 'gemini-1.5-flash',
    generationConfig: {
      responseMimeType: 'application/json',
      temperature: 0.7,
    },
  })

  const prompt = `${params.systemPrompt}\n\n${params.userPrompt}`
  
  const result = await model.generateContent(prompt)
  const response = result.response
  const text = response.text()

  if (!text) {
    throw new Error('No content returned from Gemini')
  }

  return {
    content: JSON.parse(text) as BlockContent,
    model: 'gemini-1.5-flash',
  }
}

export function getBlockPrompt(blockType: BlockType): string {
  return BLOCK_PROMPTS[blockType]
}

export function validateBlockContent(
  blockType: BlockType,
  content: unknown
): content is BlockContent {
  if (!content || typeof content !== 'object') return false

  switch (blockType) {
    case 'color_palette':
      return 'colors' in content && Array.isArray((content as { colors: unknown }).colors)
    case 'typography_showcase':
      return 'fonts' in content && Array.isArray((content as { fonts: unknown }).fonts)
    case 'logo_grid':
      return 'logos' in content && Array.isArray((content as { logos: unknown }).logos)
    case 'logo_usage':
      return 'dos' in content && 'donts' in content
    case 'voice_tone':
      return 'voice' in content || 'tone' in content
    case 'imagery_style':
      return 'style' in content || 'guidelines' in content
    case 'text_block':
      return 'content' in content
    case 'image_block':
      return 'src' in content
    case 'divider':
      return true
    default:
      return true
  }
}
