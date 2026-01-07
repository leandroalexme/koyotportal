/**
 * Tipos para o sistema de fontes customizadas
 */

export type FontFormat = 'ttf' | 'otf' | 'woff' | 'woff2'
export type FontStyle = 'normal' | 'italic'
export type FontSource = 'upload' | 'figma' | 'google' | 'system'
export type FontCategory = 'display' | 'heading' | 'body' | 'ui'

export interface BrandFont {
  id: string
  createdAt: string
  updatedAt: string
  brandId: string
  
  // Font identification
  family: string
  style: FontStyle
  weight: number
  
  // File info
  filePath: string
  fileName: string
  fileSize: number
  format: FontFormat
  
  // Source tracking
  source: FontSource
  sourceUrl?: string
  figmaPostscriptName?: string
  
  // Metadata
  isDefault: boolean
  category?: FontCategory
  
  // Status
  isActive: boolean
  uploadedBy?: string
}

export interface BrandFontInsert {
  brandId: string
  family: string
  style?: FontStyle
  weight?: number
  filePath: string
  fileName: string
  fileSize: number
  format: FontFormat
  source?: FontSource
  sourceUrl?: string
  figmaPostscriptName?: string
  isDefault?: boolean
  category?: FontCategory
  uploadedBy?: string
}

export interface BrandFontUpdate {
  family?: string
  style?: FontStyle
  weight?: number
  isDefault?: boolean
  category?: FontCategory
  isActive?: boolean
}

/**
 * Informações de fonte extraídas do Figma
 */
export interface FigmaFontInfo {
  family: string
  style: string
  postscriptName: string
  weight: number
}

/**
 * Opções de importação de fonte
 */
export interface FontImportOptions {
  /** Usar fonte original do Figma */
  useOriginal: boolean
  /** Fonte padrão da marca para substituição */
  defaultFontFamily?: string
  /** Categoria da fonte (para organização) */
  category?: FontCategory
}

/**
 * Resultado da importação de fonte
 */
export interface FontImportResult {
  success: boolean
  font?: BrandFont
  error?: string
  /** Se a fonte foi substituída pela padrão da marca */
  wasSubstituted: boolean
  /** Fonte original do Figma (se substituída) */
  originalFamily?: string
}

/**
 * Mapeamento de fontes para substituição
 */
export interface FontMapping {
  /** Nome da fonte original */
  originalFamily: string
  /** Nome da fonte de substituição */
  replacementFamily: string
  /** Se deve manter o peso original */
  preserveWeight: boolean
}

/**
 * Configuração de tipografia da marca
 */
export interface BrandTypography {
  /** Fonte para títulos/display */
  display?: {
    family: string
    defaultWeight: number
  }
  /** Fonte para headings */
  heading?: {
    family: string
    defaultWeight: number
  }
  /** Fonte para corpo de texto */
  body?: {
    family: string
    defaultWeight: number
  }
  /** Fonte para UI/interface */
  ui?: {
    family: string
    defaultWeight: number
  }
}

/**
 * CSS @font-face gerado
 */
export interface FontFaceCSS {
  family: string
  style: FontStyle
  weight: number
  src: string
  format: FontFormat
}

/**
 * Mime types suportados para fontes
 */
export const FONT_MIME_TYPES: Record<FontFormat, string[]> = {
  ttf: ['font/ttf', 'application/x-font-ttf', 'application/x-font-truetype'],
  otf: ['font/otf', 'application/x-font-otf', 'application/x-font-opentype'],
  woff: ['font/woff', 'application/font-woff'],
  woff2: ['font/woff2', 'application/font-woff2'],
}

/**
 * Extensões de arquivo suportadas
 */
export const FONT_EXTENSIONS: FontFormat[] = ['ttf', 'otf', 'woff', 'woff2']

/**
 * Tamanho máximo de arquivo de fonte (10MB)
 */
export const MAX_FONT_FILE_SIZE = 10 * 1024 * 1024

/**
 * Pesos de fonte padrão
 */
export const FONT_WEIGHTS = {
  thin: 100,
  extraLight: 200,
  light: 300,
  regular: 400,
  medium: 500,
  semiBold: 600,
  bold: 700,
  extraBold: 800,
  black: 900,
} as const
