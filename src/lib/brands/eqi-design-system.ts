/**
 * EQI Investimentos - Design System
 * 
 * Engenharia reversa completa da identidade visual
 * Baseado em análise de materiais oficiais da marca
 * 
 * @brand EQI Investimentos
 * @version 1.0.0
 * @author Koyot Brand System
 */

import type { 
  Color, 
  TextStyle, 
  NodeGovernance,
  SolidFill,
} from '@/types/studio'

// ============================================
// PALETA CROMÁTICA EQI
// ============================================

/**
 * Verde EQI - Cor Institucional Principal
 * Transmite: Crescimento, Prosperidade, Estabilidade
 */
export const EQI_COLORS = {
  // Verde Principal (institucional)
  primary: {
    main: { r: 0, g: 75, b: 60, a: 1 } as Color,      // #004B3C - Verde EQI escuro
    light: { r: 0, g: 166, b: 125, a: 1 } as Color,   // #00A67D - Verde vibrante
    dark: { r: 0, g: 50, b: 40, a: 1 } as Color,      // #003228 - Verde profundo
    accent: { r: 45, g: 199, b: 156, a: 1 } as Color, // #2DC79C - Verde destaque/CTA
  },
  
  // Superfícies e Backgrounds
  surface: {
    dark: { r: 0, g: 60, b: 48, a: 1 } as Color,       // #003C30 - Fundo escuro premium
    light: { r: 240, g: 237, b: 233, a: 1 } as Color,  // #F0EDE9 - Bege claro/off-white
    mint: { r: 177, g: 209, b: 196, a: 1 } as Color,   // #B1D1C4 - Verde menta suave
    white: { r: 255, g: 255, b: 255, a: 1 } as Color,  // #FFFFFF - Branco puro
  },
  
  // Texto
  text: {
    primary: { r: 0, g: 50, b: 40, a: 1 } as Color,     // #003228 - Texto principal escuro
    secondary: { r: 100, g: 100, b: 100, a: 1 } as Color, // #646464 - Texto secundário
    light: { r: 255, g: 255, b: 255, a: 1 } as Color,   // #FFFFFF - Texto em fundo escuro
    muted: { r: 150, g: 150, b: 150, a: 1 } as Color,   // #969696 - Texto discreto
  },
  
  // Acentos e Feedback
  accent: {
    gold: { r: 197, g: 168, b: 120, a: 1 } as Color,    // #C5A878 - Dourado premium
    success: { r: 45, g: 199, b: 156, a: 1 } as Color,  // #2DC79C - Positivo/Alta
    warning: { r: 255, g: 193, b: 7, a: 1 } as Color,   // #FFC107 - Alerta
    error: { r: 220, g: 53, b: 69, a: 1 } as Color,     // #DC3545 - Negativo/Baixa
  },
} as const

// Conversão para HEX
export const EQI_HEX = {
  primary: {
    main: '#004B3C',
    light: '#00A67D',
    dark: '#003228',
    accent: '#2DC79C',
  },
  surface: {
    dark: '#003C30',
    light: '#F0EDE9',
    mint: '#B1D1C4',
    white: '#FFFFFF',
  },
  text: {
    primary: '#003228',
    secondary: '#646464',
    light: '#FFFFFF',
    muted: '#969696',
  },
  accent: {
    gold: '#C5A878',
    success: '#2DC79C',
    warning: '#FFC107',
    error: '#DC3545',
  },
} as const

// ============================================
// TIPOGRAFIA EQI
// ============================================

/**
 * Sistema tipográfico EQI
 * 
 * Primária: Família serifada para headlines (Editorial/Clássica)
 * - Sugerida: Playfair Display, Cormorant Garamond, ou similar
 * 
 * Secundária: Sans-serif para corpo e UI
 * - Sugerida: Inter, Poppins, ou similar
 */
export const EQI_TYPOGRAPHY = {
  fontFamilies: {
    display: 'Playfair Display',    // Headlines e títulos grandes
    heading: 'Inter',               // Subtítulos e labels
    body: 'Inter',                  // Corpo de texto
    ui: 'Inter',                    // Interface e números
  },
  
  // Escala tipográfica (em pixels)
  scale: {
    display: {
      xl: 72,    // Hero headlines
      lg: 56,    // Section headlines
      md: 42,    // Card titles
      sm: 32,    // Subtitles
    },
    heading: {
      h1: 28,
      h2: 24,
      h3: 20,
      h4: 18,
      h5: 16,
      h6: 14,
    },
    body: {
      lg: 18,
      md: 16,
      sm: 14,
      xs: 12,
    },
    caption: {
      md: 11,
      sm: 10,
      xs: 8,     // Textos regulatórios e rodapé
    },
  },
  
  // Pesos
  weights: {
    light: 300,
    regular: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },
  
  // Line heights
  lineHeights: {
    tight: 1.1,     // Headlines
    normal: 1.4,    // Subtítulos
    relaxed: 1.6,   // Corpo de texto
    loose: 1.8,     // Textos longos
  },
  
  // Letter spacing
  letterSpacing: {
    tight: -0.02,   // Headlines grandes
    normal: 0,      // Padrão
    wide: 0.02,     // Labels
    caps: 0.1,      // All caps
  },
} as const

// Estilos de texto pré-definidos
export const EQI_TEXT_STYLES: Record<string, TextStyle> = {
  // Display
  displayXl: {
    fontFamily: 'Playfair Display',
    fontSize: 72,
    fontWeight: 400,
    fontStyle: 'normal',
    lineHeight: 1.1,
    letterSpacing: -0.02,
    textAlign: 'LEFT',
    textDecoration: 'NONE',
    textTransform: 'NONE',
  },
  displayLg: {
    fontFamily: 'Playfair Display',
    fontSize: 56,
    fontWeight: 400,
    fontStyle: 'normal',
    lineHeight: 1.1,
    letterSpacing: -0.02,
    textAlign: 'LEFT',
    textDecoration: 'NONE',
    textTransform: 'NONE',
  },
  displayMd: {
    fontFamily: 'Playfair Display',
    fontSize: 42,
    fontWeight: 400,
    fontStyle: 'normal',
    lineHeight: 1.2,
    letterSpacing: -0.01,
    textAlign: 'LEFT',
    textDecoration: 'NONE',
    textTransform: 'NONE',
  },
  
  // Headings
  h1: {
    fontFamily: 'Inter',
    fontSize: 28,
    fontWeight: 600,
    fontStyle: 'normal',
    lineHeight: 1.3,
    letterSpacing: 0,
    textAlign: 'LEFT',
    textDecoration: 'NONE',
    textTransform: 'NONE',
  },
  h2: {
    fontFamily: 'Inter',
    fontSize: 24,
    fontWeight: 600,
    fontStyle: 'normal',
    lineHeight: 1.3,
    letterSpacing: 0,
    textAlign: 'LEFT',
    textDecoration: 'NONE',
    textTransform: 'NONE',
  },
  h3: {
    fontFamily: 'Inter',
    fontSize: 20,
    fontWeight: 500,
    fontStyle: 'normal',
    lineHeight: 1.4,
    letterSpacing: 0,
    textAlign: 'LEFT',
    textDecoration: 'NONE',
    textTransform: 'NONE',
  },
  
  // Body
  bodyLg: {
    fontFamily: 'Inter',
    fontSize: 18,
    fontWeight: 400,
    fontStyle: 'normal',
    lineHeight: 1.6,
    letterSpacing: 0,
    textAlign: 'LEFT',
    textDecoration: 'NONE',
    textTransform: 'NONE',
  },
  bodyMd: {
    fontFamily: 'Inter',
    fontSize: 16,
    fontWeight: 400,
    fontStyle: 'normal',
    lineHeight: 1.6,
    letterSpacing: 0,
    textAlign: 'LEFT',
    textDecoration: 'NONE',
    textTransform: 'NONE',
  },
  bodySm: {
    fontFamily: 'Inter',
    fontSize: 14,
    fontWeight: 400,
    fontStyle: 'normal',
    lineHeight: 1.5,
    letterSpacing: 0,
    textAlign: 'LEFT',
    textDecoration: 'NONE',
    textTransform: 'NONE',
  },
  
  // Labels e UI
  label: {
    fontFamily: 'Inter',
    fontSize: 12,
    fontWeight: 500,
    fontStyle: 'normal',
    lineHeight: 1.4,
    letterSpacing: 0.02,
    textAlign: 'LEFT',
    textDecoration: 'NONE',
    textTransform: 'UPPERCASE',
  },
  caption: {
    fontFamily: 'Inter',
    fontSize: 11,
    fontWeight: 400,
    fontStyle: 'normal',
    lineHeight: 1.4,
    letterSpacing: 0,
    textAlign: 'LEFT',
    textDecoration: 'NONE',
    textTransform: 'NONE',
  },
  
  // Regulatório (rodapés legais)
  regulatory: {
    fontFamily: 'Inter',
    fontSize: 8,
    fontWeight: 400,
    fontStyle: 'normal',
    lineHeight: 1.3,
    letterSpacing: 0,
    textAlign: 'LEFT',
    textDecoration: 'NONE',
    textTransform: 'NONE',
  },
}

// ============================================
// ESPAÇAMENTOS E GRID
// ============================================

export const EQI_SPACING = {
  // Base unit: 4px
  unit: 4,
  
  // Scale
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  xxxl: 64,
  
  // Margens de segurança para impressão (em mm)
  print: {
    bleed: 3,          // Sangria
    safeMargin: 5,     // Margem de segurança mínima
    standardMargin: 15, // Margem padrão A4
  },
  
  // Margens de template
  template: {
    businessCard: {
      outer: 5,        // mm
      inner: 3,        // mm
    },
    letterhead: {
      top: 20,         // mm
      bottom: 15,      // mm
      left: 20,        // mm
      right: 20,       // mm
    },
  },
} as const

// ============================================
// SLOGAN E IDENTIDADE VERBAL
// ============================================

export const EQI_VERBAL_IDENTITY = {
  // Taglines oficiais
  taglines: {
    main: 'ESCOLHA IR ALÉM',
    secondary: 'PENSADO PRA VOCÊ IR ALÉM',
    research: 'mind your money',
  },
  
  // Sub-marcas
  subBrands: {
    main: 'EQI Investimentos',
    private: 'EQI Private',
    research: 'EQI Research',
    talent: 'EQI Talent',
  },
  
  // Tom de voz
  toneOfVoice: {
    personality: ['Profissional', 'Seguro', 'Especialista', 'Acessível'],
    values: ['Confiança', 'Resultado', 'Parceria', 'Transparência'],
    avoid: ['Jargões excessivos', 'Promessas irreais', 'Tom agressivo'],
  },
  
  // Textos sugeridos para templates
  suggestedCopy: {
    headlines: [
      'Suas escolhas em alta.',
      'Seu legado. Levado a sério.',
      'Sua história tem valor.',
      'Seu futuro também.',
      'Inteligência em Investimentos',
      'Sua jornada patrimonial',
    ],
    subheadlines: [
      'Desenvolver uma trajetória de valor exige visão de longo prazo, escolhas conscientes e parceria de verdade.',
      'Na EQI, acompanhamos seu crescimento com a mesma convicção com que cuidamos de um portfólio.',
      'Conte com nossa equipe de especialistas para estruturar seus investimentos com estratégia e direção.',
    ],
    callToAction: [
      'Fale com um especialista',
      'Agende uma conversa',
      'Comece sua jornada',
      'Saiba mais',
    ],
  },
} as const

// ============================================
// GOVERNANÇA DE TEMPLATES
// ============================================

/**
 * Governança para logo - Totalmente bloqueado
 */
export const LOGO_GOVERNANCE: NodeGovernance = {
  lockedProps: [
    'position', 'size', 'rotation', 'opacity', 'fills', 'border',
    'shadows', 'cornerRadius', 'gap', 'padding', 'layoutMode',
    'sizing', 'alignment', 'content', 'image'
  ],
  isContentOnly: false,
  editableBy: ['owner'],
  allowImageUpload: false,
  allowImageCrop: false,
  helpText: 'O logotipo EQI é um elemento protegido e não pode ser alterado.',
}

/**
 * Governança para títulos - Fonte bloqueada, conteúdo editável
 */
export const TITLE_GOVERNANCE: NodeGovernance = {
  lockedProps: [
    'fontFamily', 'fontSize', 'fontWeight', 'lineHeight',
    'letterSpacing', 'textAlign', 'fills', 'position', 'size'
  ],
  isContentOnly: true,
  editableBy: ['owner', 'admin', 'editor', 'member'],
  constraints: {
    fontSize: { min: 24, max: 72 },
  },
  allowedFonts: ['Playfair Display', 'Inter'],
  allowImageUpload: false,
  allowImageCrop: false,
  placeholder: 'Digite o título aqui',
  helpText: 'Edite apenas o texto. A formatação segue o padrão da marca.',
}

/**
 * Governança para campos de dados (nome, cargo, etc.)
 */
export const DATA_FIELD_GOVERNANCE: NodeGovernance = {
  lockedProps: [
    'fontFamily', 'fontSize', 'fontWeight', 'lineHeight',
    'letterSpacing', 'textAlign', 'fills', 'position'
  ],
  isContentOnly: true,
  editableBy: ['owner', 'admin', 'editor', 'member'],
  allowImageUpload: false,
  allowImageCrop: false,
  placeholder: 'Preencha este campo',
  helpText: 'Preencha com suas informações.',
}

/**
 * Governança para imagens de template
 */
export const IMAGE_GOVERNANCE: NodeGovernance = {
  lockedProps: [
    'position', 'size', 'cornerRadius', 'border', 'opacity'
  ],
  isContentOnly: true,
  editableBy: ['owner', 'admin', 'editor', 'member'],
  allowImageUpload: true,
  allowImageCrop: true,
  helpText: 'Você pode substituir a imagem mantendo o enquadramento.',
}

// ============================================
// MEDIDAS DE TEMPLATES
// ============================================

export const EQI_TEMPLATE_SIZES = {
  // Cartão de Visita - 90mm x 50mm
  businessCard: {
    width: 90,
    height: 50,
    unit: 'mm',
    // Conversão para pixels (300 DPI)
    widthPx: 1063,
    heightPx: 591,
    dpi: 300,
    bleed: 3,
  },
  
  // Papel Timbrado A4
  letterhead: {
    width: 210,
    height: 297,
    unit: 'mm',
    widthPx: 2480,
    heightPx: 3508,
    dpi: 300,
    margins: {
      top: 20,
      right: 20,
      bottom: 15,
      left: 20,
    },
  },
  
  // Assinatura de E-mail
  emailSignature: {
    width: 600,
    height: 200,
    unit: 'px',
    widthPx: 600,
    heightPx: 200,
    dpi: 72,
  },
  
  // Post Instagram (Feed)
  instagramPost: {
    width: 1080,
    height: 1080,
    unit: 'px',
    dpi: 72,
  },
  
  // Story Instagram
  instagramStory: {
    width: 1080,
    height: 1920,
    unit: 'px',
    dpi: 72,
  },
  
  // LinkedIn Post
  linkedinPost: {
    width: 1200,
    height: 628,
    unit: 'px',
    dpi: 72,
  },
} as const

// ============================================
// FILLS HELPERS
// ============================================

export function createSolidFill(color: Color, brandColorId?: string): SolidFill {
  return {
    type: 'SOLID',
    color,
    brandColorId,
  }
}

export const EQI_FILLS = {
  primaryDark: createSolidFill(EQI_COLORS.primary.main, 'eqi-primary-main'),
  primaryLight: createSolidFill(EQI_COLORS.primary.light, 'eqi-primary-light'),
  primaryAccent: createSolidFill(EQI_COLORS.primary.accent, 'eqi-primary-accent'),
  surfaceDark: createSolidFill(EQI_COLORS.surface.dark, 'eqi-surface-dark'),
  surfaceLight: createSolidFill(EQI_COLORS.surface.light, 'eqi-surface-light'),
  surfaceWhite: createSolidFill(EQI_COLORS.surface.white, 'eqi-surface-white'),
  textPrimary: createSolidFill(EQI_COLORS.text.primary, 'eqi-text-primary'),
  textLight: createSolidFill(EQI_COLORS.text.light, 'eqi-text-light'),
} as const

// ============================================
// BRAND VARIABLES (para vinculação semântica)
// ============================================

export const EQI_BRAND_VARIABLES = {
  colors: {
    'brand-primary': EQI_HEX.primary.main,
    'brand-primary-light': EQI_HEX.primary.light,
    'brand-accent': EQI_HEX.primary.accent,
    'brand-surface': EQI_HEX.surface.light,
    'brand-surface-dark': EQI_HEX.surface.dark,
    'text-main': EQI_HEX.text.primary,
    'text-light': EQI_HEX.text.light,
    'text-muted': EQI_HEX.text.muted,
  },
  fonts: {
    'font-display': EQI_TYPOGRAPHY.fontFamilies.display,
    'font-heading': EQI_TYPOGRAPHY.fontFamilies.heading,
    'font-body': EQI_TYPOGRAPHY.fontFamilies.body,
  },
} as const

export const EQI_DESIGN_SYSTEM = {
  colors: EQI_COLORS,
  hex: EQI_HEX,
  typography: EQI_TYPOGRAPHY,
  textStyles: EQI_TEXT_STYLES,
  spacing: EQI_SPACING,
  verbal: EQI_VERBAL_IDENTITY,
  templateSizes: EQI_TEMPLATE_SIZES,
  fills: EQI_FILLS,
  variables: EQI_BRAND_VARIABLES,
  governance: {
    logo: LOGO_GOVERNANCE,
    title: TITLE_GOVERNANCE,
    dataField: DATA_FIELD_GOVERNANCE,
    image: IMAGE_GOVERNANCE,
  },
}

export default EQI_DESIGN_SYSTEM
