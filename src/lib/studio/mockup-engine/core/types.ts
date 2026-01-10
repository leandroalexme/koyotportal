/**
 * Koyot Mockup Engine V2 - Types
 * 
 * Tipos TypeScript para o sistema de mockups com PSD e Smart Objects
 */

import type { CanvasKit, Surface as SkSurface, Canvas as SkCanvas, Image as SkImage } from 'canvaskit-wasm'

// =============================================================================
// GEOMETRY
// =============================================================================

export interface Point2D {
  x: number
  y: number
}

export interface Bounds {
  left: number
  top: number
  right: number
  bottom: number
}

export interface Size {
  width: number
  height: number
}

/**
 * Quadrilátero definido por 4 pontos (para perspectiva)
 */
export interface Quad {
  topLeft: Point2D
  topRight: Point2D
  bottomRight: Point2D
  bottomLeft: Point2D
}

// =============================================================================
// TRANSFORM
// =============================================================================

/**
 * Matriz de transformação afim 2x3
 */
export interface AffineTransform {
  xx: number  // scale x
  xy: number  // skew y
  yx: number  // skew x
  yy: number  // scale y
  tx: number  // translate x
  ty: number  // translate y
}

/**
 * Matriz 3x3 para transformações de perspectiva
 */
export type Matrix3x3 = [
  number, number, number,
  number, number, number,
  number, number, number
]

// =============================================================================
// BLEND MODES
// =============================================================================

/**
 * Blend modes suportados (mapeamento PSD → Skia)
 */
export type BlendMode =
  | 'normal'
  | 'multiply'
  | 'screen'
  | 'overlay'
  | 'darken'
  | 'lighten'
  | 'colorDodge'
  | 'colorBurn'
  | 'hardLight'
  | 'softLight'
  | 'difference'
  | 'exclusion'
  | 'hue'
  | 'saturation'
  | 'color'
  | 'luminosity'

// =============================================================================
// PSD LAYER TYPES
// =============================================================================

export type LayerType =
  | 'image'
  | 'smartObject'
  | 'text'
  | 'shape'
  | 'group'
  | 'adjustment'
  | 'solidColor'

/**
 * Cor RGBA (valores de 0 a 255)
 */
export interface RGBA {
  r: number
  g: number
  b: number
  a: number
}

/**
 * Informações de preenchimento sólido (camada de cor)
 */
export interface SolidColorInfo {
  color: RGBA
}

/**
 * Informações de máscara para Smart Object (pode ser herdada do grupo pai)
 */
export interface SmartObjectMask {
  bounds: Bounds
  /** Chave da imagem da máscara no layerImages map */
  imageKey: string
}

/**
 * Informações de um Smart Object extraído do PSD
 */
export interface SmartObjectInfo {
  id: string
  name: string
  bounds: Bounds
  size: Size

  /** Matriz de transformação afim aplicada ao Smart Object */
  transform: AffineTransform

  /** Pontos de perspectiva (se warp/distorção aplicada) */
  perspectiveQuad?: Quad

  /** Conteúdo original do Smart Object */
  placedContent: {
    width: number
    height: number
    type: 'embedded' | 'linked'
    /** Dados da imagem original (se embedded) */
    imageData?: Uint8Array
  }

  /** Máscara aplicada (pode ser herdada do grupo pai) */
  mask?: SmartObjectMask

  blendMode: BlendMode
  opacity: number
  visible: boolean
}

/**
 * Camada genérica do PSD
 */
export interface PsdLayer {
  id: string
  name: string
  type: LayerType
  bounds: Bounds
  zIndex: number
  visible: boolean
  opacity: number
  blendMode: BlendMode

  /** Dados de imagem da camada (pixels) */
  imageData?: ImageData

  /** Informações de Smart Object (se type === 'smartObject') */
  smartObject?: SmartObjectInfo

  /** Camadas filhas (se type === 'group') */
  children?: PsdLayer[]

  /** Máscara de camada */
  mask?: {
    bounds: Bounds
    imageData?: ImageData
    defaultColor: number
  }

  /** Indica se a camada é uma clipping mask (recortada pela camada abaixo) */
  clipping?: boolean

  /** Opacidade de preenchimento (diferente de opacity que afeta efeitos também) */
  fillOpacity?: number

  /** Informações de cor sólida (se type === 'solidColor') */
  solidColor?: SolidColorInfo

  /** Efeitos de camada (sombras, brilhos, etc) */
  effects?: LayerEffectsInfo
}

/**
 * Informações de efeitos de camada
 */
export interface LayerEffectsInfo {
  dropShadow?: LayerEffectShadow[]
  innerShadow?: LayerEffectShadow[]
  outerGlow?: LayerEffectGlow
  innerGlow?: LayerEffectGlow
  bevel?: LayerEffectBevel
  solidFill?: LayerEffectSolidFill[]
}

export interface LayerEffectShadow {
  enabled?: boolean
  color?: RGBA
  opacity?: number
  angle?: number
  distance?: number
  size?: number
  blendMode?: BlendMode
}

export interface LayerEffectGlow {
  enabled?: boolean
  color?: RGBA
  opacity?: number
  size?: number
  blendMode?: BlendMode
}

export interface LayerEffectBevel {
  enabled?: boolean
  style?: string
  angle?: number
  altitude?: number
  size?: number
  highlightColor?: RGBA
  shadowColor?: RGBA
}

export interface LayerEffectSolidFill {
  enabled?: boolean
  color?: RGBA
  opacity?: number
  blendMode?: BlendMode
}

// =============================================================================
// MOCKUP TEMPLATE
// =============================================================================

export type MockupCategory =
  | 'device'
  | 'print'
  | 'apparel'
  | 'packaging'
  | 'social'
  | 'outdoor'
  | 'stationery'
  | 'other'

/**
 * Template de Mockup gerado a partir de um PSD
 */
export interface MockupTemplate {
  id: string
  name: string
  description: string
  category: MockupCategory
  tags: string[]

  /** Dimensões do canvas */
  canvasSize: Size

  /** Todas as camadas do PSD */
  layers: PsdLayer[]

  /** Áreas editáveis (Smart Objects onde o design será inserido) */
  insertAreas: SmartObjectInfo[]

  /** Thumbnail para preview */
  thumbnail?: string

  /** Metadados */
  metadata: {
    psdPath?: string
    originalFilename: string
    createdAt: string
    updatedAt: string
    version: number
    author?: string
  }

  /**
   * Camadas especiais para renderização profissional
   * Usado no sistema de "sanduíche" de camadas:
   * 1. Base layer (fundo)
   * 2. User design (com perspectiva + máscara)
   * 3. Overlay (mãos, reflexos, sombras)
   */
  renderLayers?: {
    /** ID da camada de fundo (sem elementos frontais) */
    baseLayerId?: string
    /** ID da camada de overlay (mãos, reflexos, transparente onde design aparece) */
    overlayLayerId?: string
  }
}

// =============================================================================
// RENDER REQUEST/RESULT
// =============================================================================

/**
 * Ajustes de imagem
 */
export interface ImageAdjustments {
  brightness?: number  // -100 to 100
  contrast?: number    // -100 to 100
  saturation?: number  // -100 to 100
  hue?: number         // -180 to 180
}

/**
 * Design a ser inserido em um Smart Object
 */
export interface DesignInput {
  /** ID do Smart Object alvo */
  smartObjectId: string

  /** Imagem do design (URL, base64 ou ImageData) */
  image: string | ImageData | HTMLImageElement | SkImage

  /** Ajustes opcionais */
  adjustments?: ImageAdjustments

  /** Fit mode */
  fit?: 'cover' | 'contain' | 'stretch'
}

/**
 * Opções de exportação
 */
export interface ExportOptions {
  format: 'png' | 'jpg' | 'webp'
  quality?: number // 1-100 (para jpg/webp)
  scale?: number   // 1, 2, 4 (multiplier de resolução)
}

/**
 * Requisição de renderização
 */
export interface RenderRequest {
  /** Template a ser usado */
  template: MockupTemplate

  /** Designs a inserir nos Smart Objects */
  designs: DesignInput[]

  /** Opções de exportação */
  output?: ExportOptions
}

/**
 * Resultado da renderização
 */
export interface RenderResult {
  success: boolean

  /** Imagem renderizada */
  image?: {
    data: Uint8Array | Blob
    width: number
    height: number
    format: 'png' | 'jpg' | 'webp'
  }

  /** URL temporária da imagem */
  imageUrl?: string

  /** Base64 da imagem */
  imageBase64?: string

  /** Canvas de saída (para preview rápido sem conversão) */
  canvas?: HTMLCanvasElement

  /** Tempo de renderização em ms */
  renderTimeMs: number

  /** Erro (se success === false) */
  error?: string
}

// =============================================================================
// ENGINE STATE
// =============================================================================

export interface MockupEngineState {
  isInitialized: boolean
  canvasKit: CanvasKit | null
  surface: SkSurface | null
  canvas: SkCanvas | null

  /** Templates carregados */
  templates: Map<string, MockupTemplate>

  /** Cache de imagens */
  imageCache: Map<string, SkImage>
}

// =============================================================================
// EVENTS
// =============================================================================

export type MockupEngineEventType =
  | 'initialized'
  | 'templateLoaded'
  | 'renderStart'
  | 'renderComplete'
  | 'renderError'
  | 'progress'

export interface MockupEngineEvent {
  type: MockupEngineEventType
  data?: unknown
  timestamp: number
}

export type MockupEngineEventHandler = (event: MockupEngineEvent) => void
