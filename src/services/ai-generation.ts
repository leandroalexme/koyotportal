import type { BlockType, BlockContent, Brand } from '@/types'

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
  // Placeholder implementation
  // Replace with actual AI provider integration
  
  // Example with OpenAI:
  // const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  // const completion = await openai.chat.completions.create({
  //   model: 'gpt-4',
  //   messages: [
  //     { role: 'system', content: params.systemPrompt },
  //     { role: 'user', content: params.userPrompt },
  //   ],
  //   response_format: { type: 'json_object' },
  // })
  // return {
  //   content: JSON.parse(completion.choices[0].message.content),
  //   model: 'gpt-4',
  // }

  throw new Error('AI provider not configured. Please integrate with OpenAI, Anthropic, or another provider.')
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
