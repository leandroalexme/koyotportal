/**
 * Mockup Types
 * 
 * Definições de tipos para o sistema de mockups dinâmicos.
 * Mockups permitem visualizar templates em cenários reais (cartões, outdoors, etc.)
 */

/**
 * Ponto 2D para coordenadas
 */
export interface Point2D {
  x: number
  y: number
}

/**
 * Quadrilátero definido por 4 pontos (para transformação de perspectiva)
 * Ordem: top-left, top-right, bottom-right, bottom-left
 */
export interface Quad {
  topLeft: Point2D
  topRight: Point2D
  bottomRight: Point2D
  bottomLeft: Point2D
}

/**
 * Converte Quad para array flat [x1,y1, x2,y2, x3,y3, x4,y4]
 */
export function quadToFlatArray(quad: Quad): number[] {
  return [
    quad.topLeft.x, quad.topLeft.y,
    quad.topRight.x, quad.topRight.y,
    quad.bottomRight.x, quad.bottomRight.y,
    quad.bottomLeft.x, quad.bottomLeft.y,
  ]
}

/**
 * Categorias de mockups
 */
export type MockupCategory = 
  | 'business-card'
  | 'stationery'
  | 'billboard'
  | 'poster'
  | 'device'
  | 'apparel'
  | 'packaging'
  | 'social-media'

/**
 * Blend modes suportados para camada de overlay
 */
export type MockupBlendMode = 
  | 'multiply'
  | 'screen'
  | 'overlay'
  | 'soft-light'
  | 'hard-light'
  | 'normal'

/**
 * Configuração de uma camada do mockup
 */
export interface MockupLayer {
  /** URL da imagem */
  src: string
  /** Opacidade da camada (0-1) */
  opacity?: number
  /** Blend mode para composição */
  blendMode?: MockupBlendMode
}

/**
 * Área de inserção do template no mockup
 */
export interface MockupInsertArea {
  /** Quadrilátero de destino (perspectiva) */
  quad: Quad
  /** Tamanho original esperado do template (para aspect ratio) */
  expectedSize: {
    width: number
    height: number
  }
  /** Rotação adicional em graus */
  rotation?: number
  /** Opacidade do template inserido */
  opacity?: number
}

/**
 * Definição completa de um mockup
 */
export interface MockupDefinition {
  /** ID único do mockup */
  id: string
  /** Nome para exibição */
  name: string
  /** Descrição opcional */
  description?: string
  /** Categoria do mockup */
  category: MockupCategory
  /** Tags para busca */
  tags?: string[]
  
  /** Dimensões do canvas do mockup */
  canvasSize: {
    width: number
    height: number
  }
  
  /** Camadas do mockup */
  layers: {
    /** Imagem de fundo (cena real) */
    base: MockupLayer
    /** Imagem de overlay (sombras, reflexos, texturas) - opcional */
    overlay?: MockupLayer
    /** Camada de máscara adicional - opcional */
    mask?: MockupLayer
  }
  
  /** Áreas onde templates podem ser inseridos */
  insertAreas: MockupInsertArea[]
  
  /** Thumbnail para preview */
  thumbnail?: string
  
  /** Metadados adicionais */
  metadata?: {
    author?: string
    createdAt?: string
    updatedAt?: string
    version?: number
  }
}

/**
 * Template renderizado como imagem para inserção no mockup
 */
export interface TemplateSnapshot {
  /** ID do template original */
  templateId: string
  /** ImageData ou URL da imagem renderizada */
  imageData: ImageData | HTMLImageElement | HTMLCanvasElement
  /** Dimensões do snapshot */
  width: number
  height: number
  /** Timestamp da última atualização */
  updatedAt: number
}

/**
 * Estado de um mockup em renderização
 */
export interface MockupRenderState {
  /** Definição do mockup */
  definition: MockupDefinition
  /** Snapshots dos templates para cada área de inserção */
  templateSnapshots: Map<number, TemplateSnapshot>
  /** Zoom atual */
  zoom: number
  /** Offset de pan */
  panOffset: Point2D
  /** Se está carregando recursos */
  isLoading: boolean
  /** Erros de carregamento */
  errors: string[]
}

/**
 * Resultado da renderização de um mockup
 */
export interface MockupRenderResult {
  /** Canvas com o mockup renderizado */
  canvas: HTMLCanvasElement
  /** Tempo de renderização em ms */
  renderTime: number
  /** Backend utilizado */
  backend: 'canvas2d' | 'canvaskit'
}

/**
 * Opções para exportar mockup
 */
export interface MockupExportOptions {
  /** Formato de saída */
  format: 'png' | 'jpeg' | 'webp'
  /** Qualidade (0-1) para jpeg/webp */
  quality?: number
  /** Escala de exportação (1 = tamanho original, 2 = 2x, etc.) */
  scale?: number
  /** Fundo transparente (apenas PNG) */
  transparentBackground?: boolean
}

/**
 * Evento de atualização do mockup
 */
export interface MockupUpdateEvent {
  type: 'template-changed' | 'definition-changed' | 'zoom-changed' | 'pan-changed'
  payload?: unknown
}
