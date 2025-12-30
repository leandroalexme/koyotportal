export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

// ============================================
// BLOCK TYPES - The Heart of Koyot
// ============================================

export type BlockType =
  | 'color_palette'
  | 'typography_showcase'
  | 'logo_grid'
  | 'logo_usage'
  | 'voice_tone'
  | 'imagery_style'
  | 'spacing_system'
  | 'icon_set'
  | 'pattern_library'
  | 'motion_guidelines'
  | 'text_block'
  | 'image_block'
  | 'divider'
  | 'custom'

// Block Content Types (JSONB structures)
export interface ColorPaletteContent {
  colors: {
    name: string
    hex: string
    rgb?: string
    cmyk?: string
    pantone?: string
    usage?: string
    category?: 'primary' | 'secondary' | 'accent' | 'neutral' | 'semantic'
  }[]
  description?: string
}

export interface TypographyShowcaseContent {
  fonts: {
    name: string
    family: string
    weight: string | number
    style?: 'normal' | 'italic'
    usage?: string
    fallback?: string
    source?: 'google' | 'adobe' | 'custom'
    preview?: string
  }[]
  scale?: {
    name: string
    size: string
    lineHeight: string
    letterSpacing?: string
  }[]
  description?: string
}

export interface LogoGridContent {
  logos: {
    name: string
    src: string
    background?: 'light' | 'dark' | 'transparent'
    format?: string
    minSize?: string
    clearSpace?: string
  }[]
  description?: string
}

export interface LogoUsageContent {
  dos: { description: string; image?: string }[]
  donts: { description: string; image?: string }[]
  description?: string
}

export interface VoiceToneContent {
  voice: {
    trait: string
    description: string
    examples?: string[]
  }[]
  tone: {
    context: string
    tone: string
    example?: string
  }[]
  keywords?: string[]
  description?: string
}

export interface ImageryStyleContent {
  style: string
  guidelines: string[]
  examples: { src: string; caption?: string }[]
  filters?: { name: string; value: string }[]
  description?: string
}

export interface TextBlockContent {
  content: string
  format?: 'markdown' | 'html' | 'plain'
}

export interface ImageBlockContent {
  src: string
  alt?: string
  caption?: string
  width?: number
  height?: number
}

export interface DividerContent {
  style?: 'solid' | 'dashed' | 'dotted'
  spacing?: 'sm' | 'md' | 'lg'
}

export interface CustomBlockContent {
  [key: string]: Json
}

export type BlockContent =
  | ColorPaletteContent
  | TypographyShowcaseContent
  | LogoGridContent
  | LogoUsageContent
  | VoiceToneContent
  | ImageryStyleContent
  | TextBlockContent
  | ImageBlockContent
  | DividerContent
  | CustomBlockContent

// ============================================
// DATABASE TYPES
// ============================================

export interface Brand {
  id: string
  created_at: string
  updated_at: string
  name: string
  slug: string
  logo_url: string | null
  owner_id: string
  ai_context_prompt: string | null
  mission: string | null
  vision: string | null
  values: string[] | null
  voice_tone: Json | null
  personality: Json | null
  settings: Json | null
  is_public: boolean
}

export interface Page {
  id: string
  created_at: string
  updated_at: string
  brand_id: string
  title: string
  slug: string
  description: string | null
  order_index: number
  is_published: boolean
}

export interface Block {
  id: string
  created_at: string
  updated_at: string
  page_id: string
  type: BlockType
  content: BlockContent
  title: string | null
  description: string | null
  order_index: number
  is_visible: boolean
  ai_generated: boolean
  ai_prompt: string | null
  ai_model: string | null
}

export interface Asset {
  id: string
  created_at: string
  updated_at: string
  brand_id: string
  name: string
  file_path: string
  file_type: string
  file_size: number
  mime_type: string
  width: number | null
  height: number | null
  alt_text: string | null
  tags: string[] | null
  ai_tags: string[] | null
  ai_description: string | null
  ai_colors: string[] | null
  metadata: Json | null
  version: number
  parent_asset_id: string | null
  is_archived: boolean
  uploaded_by: string
}

export interface AssetCollection {
  id: string
  created_at: string
  updated_at: string
  brand_id: string
  name: string
  description: string | null
  cover_asset_id: string | null
  is_public: boolean
}

export interface BrandMember {
  id: string
  created_at: string
  brand_id: string
  user_id: string
  role: 'owner' | 'admin' | 'editor' | 'viewer'
}

// ============================================
// API TYPES
// ============================================

export interface AIGenerationRequest {
  brand_id: string
  block_type: BlockType
  prompt?: string
  context?: Json
}

export interface AIGenerationResponse {
  content: BlockContent
  model: string
  prompt_used: string
}
