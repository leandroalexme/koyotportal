/**
 * Text Overflow Manager
 * 
 * Gerencia o cálculo de auto-size de fonte para caixas de texto fixas.
 * Quando o texto excede o espaço disponível, a fonte é reduzida automaticamente.
 */

import { getConstraintsForFontSize, getMinFontSize } from './constraints'
import { setTextOverflowState, type TextOverflowState } from './text-overflow-state'

interface TextMeasureParams {
  content: string
  fontFamily: string
  fontSize: number
  fontWeight: number
  letterSpacing: number
  lineHeight: number | 'AUTO'
  maxWidth: number
  maxHeight: number
}

interface AutoSizeResult {
  /** Tamanho de fonte calculado */
  fontSize: number
  /** Se a fonte foi ajustada */
  isAdjusted: boolean
  /** Percentual do tamanho original */
  percentage: number
  /** Se ainda está em overflow após ajuste máximo */
  isOverflowing: boolean
}

/**
 * Calcula o tamanho de fonte ideal para caber no espaço disponível
 */
export function calculateAutoSizeFontSize(params: TextMeasureParams): AutoSizeResult {
  const { 
    content, 
    fontFamily, 
    fontSize: originalFontSize, 
    fontWeight, 
    letterSpacing,
    lineHeight,
    maxWidth, 
    maxHeight 
  } = params

  // Se não há conteúdo ou dimensões, retorna original
  if (!content || maxWidth <= 0 || maxHeight <= 0) {
    return {
      fontSize: originalFontSize,
      isAdjusted: false,
      percentage: 1,
      isOverflowing: false,
    }
  }

  // Verifica se estamos no browser (document disponível)
  if (typeof document === 'undefined') {
    return {
      fontSize: originalFontSize,
      isAdjusted: false,
      percentage: 1,
      isOverflowing: false,
    }
  }

  const constraints = getConstraintsForFontSize(originalFontSize)
  const minFontSize = getMinFontSize(originalFontSize)
  
  // Canvas temporário para medição
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    return {
      fontSize: originalFontSize,
      isAdjusted: false,
      percentage: 1,
      isOverflowing: false,
    }
  }

  let currentFontSize = originalFontSize
  let fitsInBox = false

  // Tenta reduzir a fonte até caber ou atingir o mínimo
  while (currentFontSize >= minFontSize && !fitsInBox) {
    const { width: measuredWidth, height: measuredHeight } = measureTextDimensions(
      ctx,
      content,
      fontFamily,
      currentFontSize,
      fontWeight,
      letterSpacing,
      lineHeight,
      maxWidth
    )

    if (measuredWidth <= maxWidth && measuredHeight <= maxHeight) {
      fitsInBox = true
    } else {
      currentFontSize -= constraints.step
    }
  }

  // Garante que não fica abaixo do mínimo
  currentFontSize = Math.max(currentFontSize, minFontSize)

  const isAdjusted = currentFontSize < originalFontSize
  const percentage = currentFontSize / originalFontSize

  // Verifica se ainda está em overflow após ajuste máximo
  const finalMeasure = measureTextDimensions(
    ctx,
    content,
    fontFamily,
    currentFontSize,
    fontWeight,
    letterSpacing,
    lineHeight,
    maxWidth
  )
  const isOverflowing = finalMeasure.height > maxHeight

  return {
    fontSize: currentFontSize,
    isAdjusted,
    percentage,
    isOverflowing,
  }
}

/**
 * Mede as dimensões do texto com word wrap
 */
function measureTextDimensions(
  ctx: CanvasRenderingContext2D,
  content: string,
  fontFamily: string,
  fontSize: number,
  fontWeight: number,
  letterSpacing: number,
  lineHeight: number | 'AUTO',
  maxWidth: number
): { width: number; height: number } {
  ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`
  
  // lineHeight é um multiplicador (ex: 1.5) ou 'AUTO'
  const actualLineHeight = lineHeight === 'AUTO' ? fontSize * 1.2 : fontSize * lineHeight
  const lines = wrapText(ctx, content, maxWidth, letterSpacing)
  
  let maxLineWidth = 0
  for (const line of lines) {
    const lineWidth = measureLineWidth(ctx, line, letterSpacing)
    maxLineWidth = Math.max(maxLineWidth, lineWidth)
  }

  return {
    width: maxLineWidth,
    height: lines.length * actualLineHeight,
  }
}

/**
 * Mede a largura de uma linha considerando letter spacing
 */
function measureLineWidth(
  ctx: CanvasRenderingContext2D,
  text: string,
  letterSpacing: number
): number {
  const baseWidth = ctx.measureText(text).width
  const spacingWidth = letterSpacing * Math.max(0, text.length - 1)
  return baseWidth + spacingWidth
}

/**
 * Quebra o texto em linhas respeitando a largura máxima
 */
function wrapText(
  ctx: CanvasRenderingContext2D,
  content: string,
  maxWidth: number,
  letterSpacing: number
): string[] {
  const paragraphs = content.split('\n')
  const lines: string[] = []

  for (const paragraph of paragraphs) {
    if (!paragraph) {
      lines.push('')
      continue
    }

    const words = paragraph.split(' ')
    let currentLine = ''

    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word
      const testWidth = measureLineWidth(ctx, testLine, letterSpacing)

      if (testWidth <= maxWidth) {
        currentLine = testLine
      } else {
        if (currentLine) {
          lines.push(currentLine)
        }
        currentLine = word
      }
    }

    if (currentLine) {
      lines.push(currentLine)
    }
  }

  return lines.length > 0 ? lines : ['']
}

/**
 * Classe para gerenciar overflow de texto em nós
 */
export class TextOverflowManager {
  private cache: Map<string, AutoSizeResult> = new Map()

  /**
   * Calcula e atualiza o estado de overflow para um nó de texto
   */
  calculateForNode(
    nodeId: string,
    content: string,
    originalFontSize: number,
    fontFamily: string,
    fontWeight: number,
    letterSpacing: number,
    lineHeight: number | 'AUTO',
    maxWidth: number,
    maxHeight: number,
    characterLimit?: number
  ): AutoSizeResult {
    // Cache key inclui hash do conteúdo para invalidar quando texto muda
    const contentHash = content.split('').reduce((a, b) => ((a << 5) - a + b.charCodeAt(0)) | 0, 0)
    const cacheKey = `${nodeId}-${contentHash}-${originalFontSize}-${maxWidth}-${maxHeight}`
    
    // Verifica cache
    const cached = this.cache.get(cacheKey)
    if (cached) {
      return cached
    }

    const result = calculateAutoSizeFontSize({
      content,
      fontFamily,
      fontSize: originalFontSize,
      fontWeight,
      letterSpacing,
      lineHeight,
      maxWidth,
      maxHeight,
    })

    // Atualiza cache
    this.cache.set(cacheKey, result)

    // Atualiza estado global para a sidebar
    const state: TextOverflowState = {
      nodeId,
      originalFontSize,
      currentFontSize: result.fontSize,
      isAdjusted: result.isAdjusted,
      reductionPercentage: result.percentage,
      isOverflowing: result.isOverflowing,
      characterLimit,
      characterCount: content.length,
    }
    setTextOverflowState(nodeId, state)

    return result
  }

  /**
   * Limpa o cache para um nó específico
   */
  clearCache(nodeId?: string): void {
    if (nodeId) {
      // Remove entradas do cache que começam com o nodeId
      for (const key of this.cache.keys()) {
        if (key.startsWith(nodeId)) {
          this.cache.delete(key)
        }
      }
    } else {
      this.cache.clear()
    }
  }
}

// Singleton instance
export const textOverflowManager = new TextOverflowManager()
