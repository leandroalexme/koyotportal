import { GoogleGenerativeAI } from '@google/generative-ai'
import { createClient } from '@/lib/supabase/server'
import type { BlockType, BlockContent, Brand, ColorPaletteContent, TypographyShowcaseContent, VoiceToneContent, Json } from '@/types'

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY || '')

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
    model: 'gemini-2.5-flash-preview-05-20',
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
    model: 'gemini-2.5-flash-preview-05-20',
  }
}

export function getBlockPrompt(blockType: BlockType): string {
  return BLOCK_PROMPTS[blockType]
}

// ============================================
// GENERATE INITIAL BRAND - Main Function
// ============================================

export interface BrandBriefing {
  companyName?: string
  industry?: string
  targetAudience?: string
  brandPersonality?: string
  competitors?: string
  uniqueValue?: string
  additionalContext?: string
}

export interface GeneratedBrandData {
  name: string
  mission: string
  vision: string
  values: string[]
  colors: {
    name: string
    hex: string
    reason: string
    category: 'primary' | 'secondary' | 'accent' | 'neutral' | 'semantic'
  }[]
  typography: {
    headline: {
      name: string
      family: string
      weight: string
      source: 'google' | 'adobe' | 'custom'
    }
    body: {
      name: string
      family: string
      weight: string
      source: 'google' | 'adobe' | 'custom'
    }
  }
  voiceTone: {
    voice: { trait: string; description: string; examples: string[] }[]
    tone: { context: string; tone: string; example: string }[]
    keywords: string[]
  }
}

export interface GenerateInitialBrandResult {
  brandId: string
  slug: string
  generatedData: GeneratedBrandData
}

export async function generateInitialBrand(
  briefing: BrandBriefing,
  userId: string
): Promise<GenerateInitialBrandResult> {
  if (!process.env.GOOGLE_AI_API_KEY) {
    throw new Error('GOOGLE_AI_API_KEY not configured in environment variables.')
  }

  // Step 1: Generate brand data with Gemini 2.5
  const generatedData = await generateBrandWithAI(briefing)

  // Step 2: Create brand in database
  const supabase = await createClient()
  
  const slug = generateSlug(generatedData.name)
  
  const { data: brand, error: brandError } = await supabase
    .from('brands')
    .insert({
      name: generatedData.name,
      slug,
      owner_id: userId,
      mission: generatedData.mission,
      vision: generatedData.vision,
      values: generatedData.values,
      ai_context_prompt: buildAIContextPrompt(briefing, generatedData),
      voice_tone: generatedData.voiceTone,
      is_public: false,
    })
    .select()
    .single()

  if (brandError || !brand) {
    throw new Error(`Failed to create brand: ${brandError?.message}`)
  }

  // Step 3: Create brand member (owner)
  await supabase.from('brand_members').insert({
    brand_id: brand.id,
    user_id: userId,
    role: 'owner',
  })

  // Step 4: Create initial pages
  const pages = await createInitialPages(supabase, brand.id)

  // Step 5: Create initial blocks with AI-generated content
  await createInitialBlocks(supabase, pages, generatedData)

  return {
    brandId: brand.id,
    slug: brand.slug,
    generatedData,
  }
}

async function generateBrandWithAI(briefing: BrandBriefing): Promise<GeneratedBrandData> {
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.5-flash-preview-05-20',
    generationConfig: {
      responseMimeType: 'application/json',
      temperature: 0.8,
    },
  })

  const prompt = `You are a senior brand strategist and designer. Based on the following briefing, generate a complete brand identity.

BRIEFING:
- Company/Project Name: ${briefing.companyName || 'Not specified - suggest a creative name'}
- Industry: ${briefing.industry || 'Not specified'}
- Target Audience: ${briefing.targetAudience || 'Not specified'}
- Brand Personality: ${briefing.brandPersonality || 'Not specified'}
- Competitors: ${briefing.competitors || 'Not specified'}
- Unique Value Proposition: ${briefing.uniqueValue || 'Not specified'}
- Additional Context: ${briefing.additionalContext || 'None'}

Generate a JSON response with the following structure:
{
  "name": "Brand name (use provided or suggest one)",
  "mission": "A compelling mission statement (1-2 sentences)",
  "vision": "An inspiring vision statement (1-2 sentences)",
  "values": ["Value 1", "Value 2", "Value 3", "Value 4", "Value 5"],
  "colors": [
    {
      "name": "Color name (e.g., 'Ocean Blue')",
      "hex": "#XXXXXX",
      "reason": "Why this color fits the brand",
      "category": "primary|secondary|accent|neutral|semantic"
    }
  ],
  "typography": {
    "headline": {
      "name": "Font display name",
      "family": "CSS font-family value",
      "weight": "400|500|600|700",
      "source": "google"
    },
    "body": {
      "name": "Font display name",
      "family": "CSS font-family value",
      "weight": "400|500",
      "source": "google"
    }
  },
  "voiceTone": {
    "voice": [
      {
        "trait": "Trait name (e.g., 'Professional')",
        "description": "What this means for the brand",
        "examples": ["Example phrase 1", "Example phrase 2"]
      }
    ],
    "tone": [
      {
        "context": "Context (e.g., 'Marketing')",
        "tone": "Tone description",
        "example": "Example sentence"
      }
    ],
    "keywords": ["keyword1", "keyword2", "keyword3"]
  }
}

IMPORTANT RULES:
1. Generate exactly 5 colors: 1 primary, 1 secondary, 2 accent, 1 neutral
2. Use only Google Fonts that are popular and professional
3. Generate 4 voice traits and 3 tone contexts
4. Generate 10-15 brand keywords
5. All hex colors must be valid 6-character hex codes
6. Be creative but professional`

  const result = await model.generateContent(prompt)
  const response = result.response
  const text = response.text()

  if (!text) {
    throw new Error('No content returned from Gemini')
  }

  return JSON.parse(text) as GeneratedBrandData
}

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 50)
    + '-' + Date.now().toString(36)
}

function buildAIContextPrompt(briefing: BrandBriefing, data: GeneratedBrandData): string {
  return `Brand: ${data.name}
Mission: ${data.mission}
Vision: ${data.vision}
Values: ${data.values.join(', ')}
Industry: ${briefing.industry || 'General'}
Target Audience: ${briefing.targetAudience || 'General'}
Brand Personality: ${briefing.brandPersonality || data.voiceTone.voice.map(v => v.trait).join(', ')}
Unique Value: ${briefing.uniqueValue || 'Not specified'}`
}

type SupabaseClientType = Awaited<ReturnType<typeof createClient>>

async function createInitialPages(
  supabase: SupabaseClientType,
  brandId: string
): Promise<{ identity: { id: string }; assets: { id: string } }> {
  // Create Identity page
  const { data: identityPage, error: identityError } = await supabase
    .from('pages')
    .insert({
      brand_id: brandId,
      title: 'Identity',
      slug: 'identity',
      description: 'Brand identity guidelines including colors, typography, and voice.',
      order_index: 0,
      is_published: true,
    })
    .select()
    .single()

  if (identityError || !identityPage) {
    throw new Error(`Failed to create Identity page: ${identityError?.message}`)
  }

  // Create Assets page
  const { data: assetsPage, error: assetsError } = await supabase
    .from('pages')
    .insert({
      brand_id: brandId,
      title: 'Assets',
      slug: 'assets',
      description: 'Brand assets including logos, images, and downloadable files.',
      order_index: 1,
      is_published: true,
    })
    .select()
    .single()

  if (assetsError || !assetsPage) {
    throw new Error(`Failed to create Assets page: ${assetsError?.message}`)
  }

  return {
    identity: { id: identityPage.id as string },
    assets: { id: assetsPage.id as string },
  }
}

async function createInitialBlocks(
  supabase: SupabaseClientType,
  pages: { identity: { id: string }; assets: { id: string } },
  data: GeneratedBrandData
): Promise<void> {
  const identityPageId = pages.identity.id

  // Block 1: Color Palette
  const colorPaletteContent: ColorPaletteContent = {
    colors: data.colors.map(c => ({
      name: c.name,
      hex: c.hex,
      usage: c.reason,
      category: c.category,
    })),
    description: `The ${data.name} color palette reflects our brand values and creates a consistent visual identity.`,
  }

  await supabase.from('blocks').insert({
    page_id: identityPageId,
    type: 'color_palette',
    title: 'Color Palette',
    description: 'Our brand colors and their usage guidelines',
    content: colorPaletteContent as unknown as Json,
    order_index: 0,
    is_visible: true,
    ai_generated: true,
    ai_model: 'gemini-2.5-flash-preview-05-20',
    ai_prompt: 'Generated from initial brand briefing',
  })

  // Block 2: Typography
  const typographyContent: TypographyShowcaseContent = {
    fonts: [
      {
        name: data.typography.headline.name,
        family: data.typography.headline.family,
        weight: data.typography.headline.weight,
        usage: 'Headlines, titles, and display text',
        source: data.typography.headline.source,
        preview: 'The quick brown fox jumps over the lazy dog',
      },
      {
        name: data.typography.body.name,
        family: data.typography.body.family,
        weight: data.typography.body.weight,
        usage: 'Body text, paragraphs, and general content',
        source: data.typography.body.source,
        preview: 'The quick brown fox jumps over the lazy dog',
      },
    ],
    scale: [
      { name: 'Display', size: '48px', lineHeight: '1.1' },
      { name: 'H1', size: '36px', lineHeight: '1.2' },
      { name: 'H2', size: '28px', lineHeight: '1.3' },
      { name: 'H3', size: '22px', lineHeight: '1.4' },
      { name: 'Body', size: '16px', lineHeight: '1.6' },
      { name: 'Small', size: '14px', lineHeight: '1.5' },
    ],
    description: `Typography system for ${data.name}, designed for readability and brand consistency.`,
  }

  await supabase.from('blocks').insert({
    page_id: identityPageId,
    type: 'typography_showcase',
    title: 'Typography',
    description: 'Font families and type scale',
    content: typographyContent as unknown as Json,
    order_index: 1,
    is_visible: true,
    ai_generated: true,
    ai_model: 'gemini-2.5-flash-preview-05-20',
    ai_prompt: 'Generated from initial brand briefing',
  })

  // Block 3: Voice & Tone
  const voiceToneContent: VoiceToneContent = {
    voice: data.voiceTone.voice,
    tone: data.voiceTone.tone,
    keywords: data.voiceTone.keywords,
    description: `The ${data.name} voice and tone guidelines ensure consistent communication across all channels.`,
  }

  await supabase.from('blocks').insert({
    page_id: identityPageId,
    type: 'voice_tone',
    title: 'Voice & Tone',
    description: 'How we communicate as a brand',
    content: voiceToneContent as unknown as Json,
    order_index: 2,
    is_visible: true,
    ai_generated: true,
    ai_model: 'gemini-2.5-flash-preview-05-20',
    ai_prompt: 'Generated from initial brand briefing',
  })

  // Block 4: Welcome text block on Assets page
  await supabase.from('blocks').insert({
    page_id: pages.assets.id,
    type: 'text_block',
    title: 'Brand Assets',
    description: 'Welcome to the assets library',
    content: {
      content: `# ${data.name} Asset Library\n\nWelcome to the official asset library. Here you'll find logos, images, and other brand materials ready for download.\n\n## Getting Started\n\nUpload your brand assets using the upload button above. All assets will be automatically organized and tagged for easy discovery.`,
      format: 'markdown',
    },
    order_index: 0,
    is_visible: true,
    ai_generated: true,
    ai_model: 'gemini-2.5-flash-preview-05-20',
    ai_prompt: 'Generated from initial brand briefing',
  })
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
