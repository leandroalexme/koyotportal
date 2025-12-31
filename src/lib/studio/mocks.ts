/**
 * Koyot Studio - Mock Data
 * 
 * Templates de exemplo para testar a galeria e o editor.
 * Estruturados no formato SceneNode.
 */

import type { 
  Template, 
  FrameNode, 
  TextNode, 
  ImageNode,
  RectangleNode,
} from '@/types/studio'

// ============================================
// HELPER: CREATE NODE DEFAULTS
// ============================================

const createBaseNode = (overrides: Partial<FrameNode>) => ({
  visible: true,
  locked: false,
  opacity: 1,
  blendMode: 'NORMAL' as const,
  position: { x: 0, y: 0 },
  rotation: 0,
  cornerRadius: 0,
  fills: [],
  shadows: [],
  autoLayout: {
    layoutMode: 'NONE' as const,
    horizontalSizing: 'FIXED' as const,
    verticalSizing: 'FIXED' as const,
    primaryAxisAlignment: 'START' as const,
    counterAxisAlignment: 'START' as const,
    padding: { top: 0, right: 0, bottom: 0, left: 0 },
    gap: 0,
    wrap: false,
  },
  ...overrides,
})

// ============================================
// EQI INVESTIMENTOS - INSTAGRAM POST
// ============================================

const eqiInstagramPostRoot: FrameNode = {
  ...createBaseNode({}),
  id: 'root_eqi_instagram',
  name: 'Instagram Post - EQI',
  type: 'FRAME',
  size: { width: 1080, height: 1080 },
  fills: [{ type: 'SOLID', color: { r: 0, g: 31, b: 63, a: 1 } }], // Navy blue
  clipsContent: true,
  autoLayout: {
    layoutMode: 'VERTICAL',
    horizontalSizing: 'FIXED',
    verticalSizing: 'FIXED',
    primaryAxisAlignment: 'SPACE_BETWEEN',
    counterAxisAlignment: 'CENTER',
    padding: { top: 80, right: 60, bottom: 80, left: 60 },
    gap: 40,
    wrap: false,
  },
  children: [
    // Logo area
    {
      ...createBaseNode({}),
      id: 'frame_logo',
      name: 'Logo Container',
      type: 'FRAME',
      size: { width: 200, height: 60 },
      position: { x: 0, y: 0 },
      clipsContent: false,
      autoLayout: {
        layoutMode: 'HORIZONTAL',
        horizontalSizing: 'HUG',
        verticalSizing: 'HUG',
        primaryAxisAlignment: 'START',
        counterAxisAlignment: 'CENTER',
        padding: { top: 0, right: 0, bottom: 0, left: 0 },
        gap: 0,
        wrap: false,
      },
      children: [
        {
          ...createBaseNode({}),
          id: 'img_logo',
          name: 'Logo',
          type: 'IMAGE',
          size: { width: 180, height: 50 },
          imageProps: {
            assetId: undefined, // Será preenchido com asset do DAM
            src: '/placeholder-logo.svg',
            alt: 'EQI Investimentos Logo',
            objectFit: 'FIT',
            objectPosition: { x: 0.5, y: 0.5 },
          },
        } as ImageNode,
      ],
    } as FrameNode,
    
    // Main content
    {
      ...createBaseNode({}),
      id: 'frame_content',
      name: 'Content',
      type: 'FRAME',
      size: { width: 960, height: 700 },
      position: { x: 0, y: 0 },
      clipsContent: false,
      autoLayout: {
        layoutMode: 'VERTICAL',
        horizontalSizing: 'FILL',
        verticalSizing: 'HUG',
        primaryAxisAlignment: 'CENTER',
        counterAxisAlignment: 'CENTER',
        padding: { top: 0, right: 0, bottom: 0, left: 0 },
        gap: 24,
        wrap: false,
      },
      children: [
        {
          ...createBaseNode({}),
          id: 'text_headline',
          name: 'Headline',
          type: 'TEXT',
          size: { width: 960, height: 120 },
          textProps: {
            content: 'Invista no seu futuro com segurança',
            style: {
              fontFamily: 'Inter',
              fontSize: 64,
              fontWeight: 700,
              lineHeight: 1.1,
              letterSpacing: -1,
              textAlign: 'CENTER',
              textDecoration: 'NONE',
              textTransform: 'NONE',
            },
            editable: true,
            placeholder: 'Digite o título...',
          },
          fills: [{ type: 'SOLID', color: { r: 255, g: 255, b: 255, a: 1 } }],
        } as TextNode,
        {
          ...createBaseNode({}),
          id: 'text_subline',
          name: 'Subline',
          type: 'TEXT',
          size: { width: 800, height: 80 },
          textProps: {
            content: 'Assessoria financeira personalizada para alcançar seus objetivos',
            style: {
              fontFamily: 'Inter',
              fontSize: 28,
              fontWeight: 400,
              lineHeight: 1.4,
              letterSpacing: 0,
              textAlign: 'CENTER',
              textDecoration: 'NONE',
              textTransform: 'NONE',
            },
            editable: true,
            placeholder: 'Digite a descrição...',
          },
          fills: [{ type: 'SOLID', color: { r: 255, g: 255, b: 255, a: 0.8 } }],
        } as TextNode,
      ],
    } as FrameNode,
    
    // CTA Button
    {
      ...createBaseNode({}),
      id: 'frame_cta',
      name: 'CTA Button',
      type: 'FRAME',
      size: { width: 280, height: 56 },
      cornerRadius: 28,
      fills: [{ type: 'SOLID', color: { r: 212, g: 175, b: 55, a: 1 } }], // Gold
      clipsContent: false,
      autoLayout: {
        layoutMode: 'HORIZONTAL',
        horizontalSizing: 'HUG',
        verticalSizing: 'HUG',
        primaryAxisAlignment: 'CENTER',
        counterAxisAlignment: 'CENTER',
        padding: { top: 16, right: 40, bottom: 16, left: 40 },
        gap: 0,
        wrap: false,
      },
      children: [
        {
          ...createBaseNode({}),
          id: 'text_cta',
          name: 'CTA Text',
          type: 'TEXT',
          size: { width: 200, height: 24 },
          textProps: {
            content: 'Saiba mais',
            style: {
              fontFamily: 'Inter',
              fontSize: 18,
              fontWeight: 600,
              lineHeight: 1,
              letterSpacing: 0.5,
              textAlign: 'CENTER',
              textDecoration: 'NONE',
              textTransform: 'UPPERCASE',
            },
            editable: true,
          },
          fills: [{ type: 'SOLID', color: { r: 0, g: 31, b: 63, a: 1 } }],
        } as TextNode,
      ],
    } as FrameNode,
  ],
}

// ============================================
// EQI INVESTIMENTOS - LINKEDIN BANNER
// ============================================

const eqiLinkedInBannerRoot: FrameNode = {
  ...createBaseNode({}),
  id: 'root_eqi_linkedin',
  name: 'LinkedIn Banner - EQI',
  type: 'FRAME',
  size: { width: 1584, height: 396 },
  fills: [
    { 
      type: 'GRADIENT_LINEAR', 
      stops: [
        { position: 0, color: { r: 0, g: 31, b: 63, a: 1 } },
        { position: 1, color: { r: 0, g: 51, b: 102, a: 1 } },
      ],
      angle: 135,
    }
  ],
  clipsContent: true,
  autoLayout: {
    layoutMode: 'HORIZONTAL',
    horizontalSizing: 'FIXED',
    verticalSizing: 'FIXED',
    primaryAxisAlignment: 'SPACE_BETWEEN',
    counterAxisAlignment: 'CENTER',
    padding: { top: 40, right: 80, bottom: 40, left: 80 },
    gap: 60,
    wrap: false,
  },
  children: [
    // Left content
    {
      ...createBaseNode({}),
      id: 'frame_left',
      name: 'Left Content',
      type: 'FRAME',
      size: { width: 800, height: 316 },
      clipsContent: false,
      autoLayout: {
        layoutMode: 'VERTICAL',
        horizontalSizing: 'HUG',
        verticalSizing: 'HUG',
        primaryAxisAlignment: 'CENTER',
        counterAxisAlignment: 'START',
        padding: { top: 0, right: 0, bottom: 0, left: 0 },
        gap: 16,
        wrap: false,
      },
      children: [
        {
          ...createBaseNode({}),
          id: 'text_tagline',
          name: 'Tagline',
          type: 'TEXT',
          size: { width: 400, height: 24 },
          textProps: {
            content: 'EQI INVESTIMENTOS',
            style: {
              fontFamily: 'Inter',
              fontSize: 14,
              fontWeight: 600,
              lineHeight: 1,
              letterSpacing: 3,
              textAlign: 'LEFT',
              textDecoration: 'NONE',
              textTransform: 'UPPERCASE',
            },
            editable: true,
          },
          fills: [{ type: 'SOLID', color: { r: 212, g: 175, b: 55, a: 1 } }],
        } as TextNode,
        {
          ...createBaseNode({}),
          id: 'text_main',
          name: 'Main Text',
          type: 'TEXT',
          size: { width: 700, height: 100 },
          textProps: {
            content: 'Transformando sonhos em patrimônio',
            style: {
              fontFamily: 'Inter',
              fontSize: 48,
              fontWeight: 700,
              lineHeight: 1.1,
              letterSpacing: -1,
              textAlign: 'LEFT',
              textDecoration: 'NONE',
              textTransform: 'NONE',
            },
            editable: true,
          },
          fills: [{ type: 'SOLID', color: { r: 255, g: 255, b: 255, a: 1 } }],
        } as TextNode,
      ],
    } as FrameNode,
    
    // Right - Logo
    {
      ...createBaseNode({}),
      id: 'img_logo_right',
      name: 'Logo',
      type: 'IMAGE',
      size: { width: 200, height: 60 },
      imageProps: {
        src: '/placeholder-logo-white.svg',
        alt: 'EQI Logo',
        objectFit: 'FIT',
        objectPosition: { x: 0.5, y: 0.5 },
      },
    } as ImageNode,
  ],
}

// ============================================
// EQI INVESTIMENTOS - BUSINESS CARD
// ============================================

const eqiBusinessCardRoot: FrameNode = {
  ...createBaseNode({}),
  id: 'root_eqi_business_card',
  name: 'Business Card - EQI',
  type: 'FRAME',
  size: { width: 1050, height: 600 },
  fills: [{ type: 'SOLID', color: { r: 255, g: 255, b: 255, a: 1 } }],
  clipsContent: true,
  autoLayout: {
    layoutMode: 'HORIZONTAL',
    horizontalSizing: 'FIXED',
    verticalSizing: 'FIXED',
    primaryAxisAlignment: 'SPACE_BETWEEN',
    counterAxisAlignment: 'START',
    padding: { top: 0, right: 0, bottom: 0, left: 0 },
    gap: 0,
    wrap: false,
  },
  children: [
    // Left side - Navy
    {
      ...createBaseNode({}),
      id: 'frame_left_side',
      name: 'Left Side',
      type: 'FRAME',
      size: { width: 350, height: 600 },
      fills: [{ type: 'SOLID', color: { r: 0, g: 31, b: 63, a: 1 } }],
      clipsContent: false,
      autoLayout: {
        layoutMode: 'VERTICAL',
        horizontalSizing: 'FIXED',
        verticalSizing: 'FILL',
        primaryAxisAlignment: 'CENTER',
        counterAxisAlignment: 'CENTER',
        padding: { top: 40, right: 40, bottom: 40, left: 40 },
        gap: 0,
        wrap: false,
      },
      children: [
        {
          ...createBaseNode({}),
          id: 'img_logo_card',
          name: 'Logo',
          type: 'IMAGE',
          size: { width: 180, height: 50 },
          imageProps: {
            src: '/placeholder-logo-white.svg',
            alt: 'EQI Logo',
            objectFit: 'FIT',
            objectPosition: { x: 0.5, y: 0.5 },
          },
        } as ImageNode,
      ],
    } as FrameNode,
    
    // Right side - Content
    {
      ...createBaseNode({}),
      id: 'frame_right_side',
      name: 'Right Side',
      type: 'FRAME',
      size: { width: 700, height: 600 },
      clipsContent: false,
      autoLayout: {
        layoutMode: 'VERTICAL',
        horizontalSizing: 'FILL',
        verticalSizing: 'FILL',
        primaryAxisAlignment: 'CENTER',
        counterAxisAlignment: 'START',
        padding: { top: 60, right: 60, bottom: 60, left: 60 },
        gap: 24,
        wrap: false,
      },
      children: [
        {
          ...createBaseNode({}),
          id: 'text_name',
          name: 'Name',
          type: 'TEXT',
          size: { width: 580, height: 40 },
          textProps: {
            content: 'João Silva',
            style: {
              fontFamily: 'Inter',
              fontSize: 32,
              fontWeight: 700,
              lineHeight: 1,
              letterSpacing: 0,
              textAlign: 'LEFT',
              textDecoration: 'NONE',
              textTransform: 'NONE',
            },
            editable: true,
            placeholder: 'Nome completo',
          },
          fills: [{ type: 'SOLID', color: { r: 0, g: 31, b: 63, a: 1 } }],
        } as TextNode,
        {
          ...createBaseNode({}),
          id: 'text_role',
          name: 'Role',
          type: 'TEXT',
          size: { width: 580, height: 24 },
          textProps: {
            content: 'Assessor de Investimentos',
            style: {
              fontFamily: 'Inter',
              fontSize: 16,
              fontWeight: 500,
              lineHeight: 1,
              letterSpacing: 0,
              textAlign: 'LEFT',
              textDecoration: 'NONE',
              textTransform: 'NONE',
            },
            editable: true,
            placeholder: 'Cargo',
          },
          fills: [{ type: 'SOLID', color: { r: 100, g: 100, b: 100, a: 1 } }],
        } as TextNode,
        // Separator
        {
          ...createBaseNode({}),
          id: 'rect_separator',
          name: 'Separator',
          type: 'RECTANGLE',
          size: { width: 60, height: 3 },
          fills: [{ type: 'SOLID', color: { r: 212, g: 175, b: 55, a: 1 } }],
        } as RectangleNode,
        // Contact info
        {
          ...createBaseNode({}),
          id: 'frame_contact',
          name: 'Contact Info',
          type: 'FRAME',
          size: { width: 580, height: 100 },
          clipsContent: false,
          autoLayout: {
            layoutMode: 'VERTICAL',
            horizontalSizing: 'FILL',
            verticalSizing: 'HUG',
            primaryAxisAlignment: 'START',
            counterAxisAlignment: 'START',
            padding: { top: 0, right: 0, bottom: 0, left: 0 },
            gap: 8,
            wrap: false,
          },
          children: [
            {
              ...createBaseNode({}),
              id: 'text_email',
              name: 'Email',
              type: 'TEXT',
              size: { width: 580, height: 20 },
              textProps: {
                content: 'joao.silva@eqi.com.br',
                style: {
                  fontFamily: 'Inter',
                  fontSize: 14,
                  fontWeight: 400,
                  lineHeight: 1.4,
                  letterSpacing: 0,
                  textAlign: 'LEFT',
                  textDecoration: 'NONE',
                  textTransform: 'NONE',
                },
                editable: true,
              },
              fills: [{ type: 'SOLID', color: { r: 60, g: 60, b: 60, a: 1 } }],
            } as TextNode,
            {
              ...createBaseNode({}),
              id: 'text_phone',
              name: 'Phone',
              type: 'TEXT',
              size: { width: 580, height: 20 },
              textProps: {
                content: '+55 11 99999-9999',
                style: {
                  fontFamily: 'Inter',
                  fontSize: 14,
                  fontWeight: 400,
                  lineHeight: 1.4,
                  letterSpacing: 0,
                  textAlign: 'LEFT',
                  textDecoration: 'NONE',
                  textTransform: 'NONE',
                },
                editable: true,
              },
              fills: [{ type: 'SOLID', color: { r: 60, g: 60, b: 60, a: 1 } }],
            } as TextNode,
            {
              ...createBaseNode({}),
              id: 'text_website',
              name: 'Website',
              type: 'TEXT',
              size: { width: 580, height: 20 },
              textProps: {
                content: 'www.eqi.com.br',
                style: {
                  fontFamily: 'Inter',
                  fontSize: 14,
                  fontWeight: 400,
                  lineHeight: 1.4,
                  letterSpacing: 0,
                  textAlign: 'LEFT',
                  textDecoration: 'NONE',
                  textTransform: 'NONE',
                },
                editable: true,
              },
              fills: [{ type: 'SOLID', color: { r: 60, g: 60, b: 60, a: 1 } }],
            } as TextNode,
          ],
        } as FrameNode,
      ],
    } as FrameNode,
  ],
}

// ============================================
// MOCK TEMPLATES
// ============================================

export const MOCK_TEMPLATES: Template[] = [
  {
    id: 'template_eqi_instagram_1',
    brandId: 'a0295b8d-c0f9-49db-b839-8a6021d3ecf7', // EQI Investimentos
    name: 'Post Institucional',
    description: 'Template para posts institucionais no Instagram',
    category: 'social_instagram',
    format: 'instagram_post',
    thumbnailUrl: '/templates/eqi-instagram-post.png',
    rootNode: eqiInstagramPostRoot,
    schemaVersion: 1,
    tags: ['instagram', 'institucional', 'investimentos'],
    isPublic: false,
    aiGenerated: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: 'system',
  },
  {
    id: 'template_eqi_linkedin_1',
    brandId: 'a0295b8d-c0f9-49db-b839-8a6021d3ecf7',
    name: 'Banner LinkedIn',
    description: 'Banner para perfil do LinkedIn',
    category: 'social_linkedin',
    format: 'linkedin_banner',
    thumbnailUrl: '/templates/eqi-linkedin-banner.png',
    rootNode: eqiLinkedInBannerRoot,
    schemaVersion: 1,
    tags: ['linkedin', 'banner', 'perfil'],
    isPublic: false,
    aiGenerated: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: 'system',
  },
  {
    id: 'template_eqi_business_card_1',
    brandId: 'a0295b8d-c0f9-49db-b839-8a6021d3ecf7',
    name: 'Cartão de Visita',
    description: 'Cartão de visita padrão EQI',
    category: 'print_business_card',
    format: 'business_card',
    thumbnailUrl: '/templates/eqi-business-card.png',
    rootNode: eqiBusinessCardRoot,
    schemaVersion: 1,
    tags: ['cartão', 'visita', 'print'],
    isPublic: false,
    aiGenerated: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: 'system',
  },
  {
    id: 'template_eqi_story_1',
    brandId: 'a0295b8d-c0f9-49db-b839-8a6021d3ecf7',
    name: 'Story Promocional',
    description: 'Template para stories promocionais',
    category: 'social_instagram',
    format: 'instagram_story',
    thumbnailUrl: '/templates/eqi-story.png',
    rootNode: {
      ...createBaseNode({}),
      id: 'root_story',
      name: 'Story',
      type: 'FRAME',
      size: { width: 1080, height: 1920 },
      fills: [{ type: 'SOLID', color: { r: 0, g: 31, b: 63, a: 1 } }],
      clipsContent: true,
      children: [],
      autoLayout: {
        layoutMode: 'VERTICAL',
        horizontalSizing: 'FIXED',
        verticalSizing: 'FIXED',
        primaryAxisAlignment: 'CENTER',
        counterAxisAlignment: 'CENTER',
        padding: { top: 60, right: 40, bottom: 60, left: 40 },
        gap: 24,
        wrap: false,
      },
    } as FrameNode,
    schemaVersion: 1,
    tags: ['story', 'instagram', 'promocional'],
    isPublic: false,
    aiGenerated: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: 'system',
  },
  {
    id: 'template_eqi_flyer_1',
    brandId: 'a0295b8d-c0f9-49db-b839-8a6021d3ecf7',
    name: 'Flyer A5',
    description: 'Flyer para eventos e campanhas',
    category: 'print_flyer',
    format: 'flyer_a5',
    thumbnailUrl: '/templates/eqi-flyer.png',
    rootNode: {
      ...createBaseNode({}),
      id: 'root_flyer',
      name: 'Flyer A5',
      type: 'FRAME',
      size: { width: 1748, height: 2480 },
      fills: [{ type: 'SOLID', color: { r: 255, g: 255, b: 255, a: 1 } }],
      clipsContent: true,
      children: [],
      autoLayout: {
        layoutMode: 'VERTICAL',
        horizontalSizing: 'FIXED',
        verticalSizing: 'FIXED',
        primaryAxisAlignment: 'START',
        counterAxisAlignment: 'CENTER',
        padding: { top: 80, right: 60, bottom: 80, left: 60 },
        gap: 32,
        wrap: false,
      },
    } as FrameNode,
    schemaVersion: 1,
    tags: ['flyer', 'print', 'evento'],
    isPublic: false,
    aiGenerated: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: 'system',
  },
  {
    id: 'template_eqi_web_banner_1',
    brandId: 'a0295b8d-c0f9-49db-b839-8a6021d3ecf7',
    name: 'Web Banner - Leaderboard',
    description: 'Banner para Google Ads (728x90)',
    category: 'digital_web_banner',
    format: 'web_banner_leaderboard',
    thumbnailUrl: '/templates/eqi-web-banner.png',
    rootNode: {
      ...createBaseNode({}),
      id: 'root_web_banner',
      name: 'Web Banner',
      type: 'FRAME',
      size: { width: 728, height: 90 },
      fills: [{ type: 'SOLID', color: { r: 0, g: 31, b: 63, a: 1 } }],
      clipsContent: true,
      children: [],
      autoLayout: {
        layoutMode: 'HORIZONTAL',
        horizontalSizing: 'FIXED',
        verticalSizing: 'FIXED',
        primaryAxisAlignment: 'SPACE_BETWEEN',
        counterAxisAlignment: 'CENTER',
        padding: { top: 16, right: 24, bottom: 16, left: 24 },
        gap: 16,
        wrap: false,
      },
    } as FrameNode,
    schemaVersion: 1,
    tags: ['banner', 'web', 'ads', 'google'],
    isPublic: false,
    aiGenerated: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: 'system',
  },
]

// ============================================
// HELPER FUNCTIONS
// ============================================

export function getMockTemplateById(id: string): Template | undefined {
  return MOCK_TEMPLATES.find(t => t.id === id)
}

export function getMockTemplatesByCategory(category: string): Template[] {
  return MOCK_TEMPLATES.filter(t => t.category === category)
}

export function getMockTemplatesByBrand(brandId: string): Template[] {
  return MOCK_TEMPLATES.filter(t => t.brandId === brandId)
}
