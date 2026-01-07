/**
 * Selection Renderer
 * 
 * Renderiza visuais de seleção, hover, labels e handles.
 * Inspirado no padrão do Suika Editor (selected_box.ts, scene_graph.ts)
 */

import type { SceneNode, FrameNode } from '@/types/studio'
import type { ComputedLayout } from '../yoga-adapter'

export interface SelectionStyle {
  // Selection box - elementos
  selectionStroke: string
  selectionStrokeWidth: number
  
  // Selection box - frames (cor diferenciada)
  frameSelectionStroke: string
  
  // Hover
  hoverStroke: string
  hoverStrokeWidth: number
  
  // Label - elementos
  labelBackground: string
  labelTextColor: string
  labelFontSize: number
  labelFontFamily: string
  labelPadding: { x: number; y: number }
  labelBorderRadius: number
  labelOffset: number
  
  // Label - frames (cor diferenciada)
  frameLabelBackground: string
  
  // Handles
  handleSize: number
  handleFill: string
  handleStroke: string
  handleStrokeWidth: number
}

export const DEFAULT_SELECTION_STYLE: SelectionStyle = {
  // Elementos: azul
  selectionStroke: '#4F6EF7',
  selectionStrokeWidth: 1,
  
  // Frames: roxo/violeta para diferenciar
  frameSelectionStroke: '#9747FF',
  
  hoverStroke: '#4F6EF7',
  hoverStrokeWidth: 1,
  
  // Label elementos: azul
  labelBackground: '#4F6EF7',
  labelTextColor: '#FFFFFF',
  labelFontSize: 12,
  labelFontFamily: 'Inter, system-ui, sans-serif',
  labelPadding: { x: 8, y: 4 },
  labelBorderRadius: 4,
  labelOffset: 0,
  
  // Label frames: roxo/violeta
  frameLabelBackground: '#9747FF',
  
  handleSize: 8,
  handleFill: '#FFFFFF',
  handleStroke: '#4F6EF7',
  handleStrokeWidth: 1.5,
}

export type HandleType = 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w'

export interface HandleInfo {
  type: HandleType
  x: number
  y: number
  cursor: string
}

interface RenderOptions {
  ctx: CanvasRenderingContext2D
  layoutMap: Map<string, ComputedLayout>
  zoom: number
  dpr: number
  centerOffset: { x: number; y: number }
}

/**
 * Renderiza elementos visuais de seleção
 */
export class SelectionRenderer {
  private style: SelectionStyle
  private handles: HandleInfo[] = []
  
  constructor(style: Partial<SelectionStyle> = {}) {
    this.style = { ...DEFAULT_SELECTION_STYLE, ...style }
  }
  
  /**
   * Atualiza estilo de renderização
   */
  setStyle(style: Partial<SelectionStyle>) {
    this.style = { ...this.style, ...style }
  }
  
  // ============================================
  // HOVER OUTLINE
  // ============================================
  
  /**
   * Desenha outline de hover em um elemento
   */
  drawHoverOutline(
    node: SceneNode,
    options: RenderOptions
  ) {
    const { ctx, layoutMap, zoom, dpr, centerOffset } = options
    const layout = layoutMap.get(node.id)
    if (!layout) return
    
    const x = layout.x * zoom * dpr + centerOffset.x * dpr
    const y = layout.y * zoom * dpr + centerOffset.y * dpr
    const width = layout.width * zoom * dpr
    const height = layout.height * zoom * dpr
    
    ctx.save()
    ctx.strokeStyle = this.style.hoverStroke
    ctx.lineWidth = this.style.hoverStrokeWidth * dpr
    ctx.setLineDash([])
    
    // Get border radius if frame
    const radius = this.getNodeRadius(node, zoom, dpr)
    
    if (radius > 0) {
      this.drawRoundedRect(ctx, x, y, width, height, radius)
      ctx.stroke()
    } else {
      ctx.strokeRect(x, y, width, height)
    }
    
    ctx.restore()
  }
  
  // ============================================
  // SELECTION BOX
  // ============================================
  
  /**
   * Desenha box de seleção com label
   */
  drawSelectionBox(
    node: SceneNode,
    options: RenderOptions,
    showLabel: boolean = true,
    labelText?: string
  ) {
    const { ctx, layoutMap, zoom, dpr, centerOffset } = options
    const layout = layoutMap.get(node.id)
    if (!layout) return
    
    const x = layout.x * zoom * dpr + centerOffset.x * dpr
    const y = layout.y * zoom * dpr + centerOffset.y * dpr
    const width = layout.width * zoom * dpr
    const height = layout.height * zoom * dpr
    
    // Determina se é um frame para usar cor diferenciada
    const isFrame = node.type === 'FRAME'
    const strokeColor = isFrame ? this.style.frameSelectionStroke : this.style.selectionStroke
    
    // Draw selection outline
    ctx.save()
    ctx.strokeStyle = strokeColor
    ctx.lineWidth = this.style.selectionStrokeWidth * dpr
    ctx.setLineDash([])
    
    const radius = this.getNodeRadius(node, zoom, dpr)
    
    if (radius > 0) {
      this.drawRoundedRect(ctx, x, y, width, height, radius)
      ctx.stroke()
    } else {
      ctx.strokeRect(x, y, width, height)
    }
    
    ctx.restore()
    
    // Draw label
    if (showLabel) {
      const label = labelText || this.getNodeLabel(node)
      this.drawLabel(ctx, label, x, y, dpr, isFrame)
    }
    
    // Update handles positions
    this.updateHandles(x, y, width, height, dpr)
  }
  
  /**
   * Desenha box de seleção múltipla (bounding box)
   */
  drawMultiSelectionBox(
    nodes: SceneNode[],
    options: RenderOptions
  ) {
    if (nodes.length === 0) return
    
    const { ctx, layoutMap, zoom, dpr, centerOffset } = options
    
    // Calculate bounding box
    let minX = Infinity, minY = Infinity
    let maxX = -Infinity, maxY = -Infinity
    
    for (const node of nodes) {
      const layout = layoutMap.get(node.id)
      if (!layout) continue
      
      const x = layout.x * zoom * dpr + centerOffset.x * dpr
      const y = layout.y * zoom * dpr + centerOffset.y * dpr
      const width = layout.width * zoom * dpr
      const height = layout.height * zoom * dpr
      
      minX = Math.min(minX, x)
      minY = Math.min(minY, y)
      maxX = Math.max(maxX, x + width)
      maxY = Math.max(maxY, y + height)
    }
    
    if (!isFinite(minX)) return
    
    const width = maxX - minX
    const height = maxY - minY
    
    // Draw bounding box
    ctx.save()
    ctx.strokeStyle = this.style.selectionStroke
    ctx.lineWidth = this.style.selectionStrokeWidth * dpr
    ctx.setLineDash([])
    ctx.strokeRect(minX, minY, width, height)
    ctx.restore()
    
    // Draw label showing count
    const label = `${nodes.length} elements`
    this.drawLabel(ctx, label, minX, minY, dpr)
    
    // Update handles
    this.updateHandles(minX, minY, width, height, dpr)
  }
  
  // ============================================
  // LABEL
  // ============================================
  
  /**
   * Desenha label fixo no topo da bounding box
   * Radius apenas no topo (cantos inferiores retos para "colar" na bounding box)
   */
  private drawLabel(
    ctx: CanvasRenderingContext2D,
    text: string,
    x: number,
    y: number,
    dpr: number,
    isFrame: boolean = false
  ) {
    const { 
      labelBackground, 
      frameLabelBackground,
      labelTextColor, 
      labelFontSize, 
      labelFontFamily,
      labelPadding,
      labelBorderRadius,
    } = this.style
    
    // ALL CAPS
    const displayText = text.toUpperCase()
    
    const fontSize = labelFontSize * dpr
    ctx.save()
    ctx.font = `600 ${fontSize}px ${labelFontFamily}`
    
    const textMetrics = ctx.measureText(displayText)
    const textWidth = textMetrics.width
    const textHeight = fontSize
    
    const paddingX = labelPadding.x * dpr
    const paddingY = labelPadding.y * dpr
    const radius = labelBorderRadius * dpr
    
    const boxWidth = textWidth + paddingX * 2
    const boxHeight = textHeight + paddingY * 2
    const boxX = x
    // Label fixo no topo da bounding box (alinhado com a borda superior)
    const boxY = y - boxHeight
    
    // Draw background - cor diferenciada para frames
    ctx.fillStyle = isFrame ? frameLabelBackground : labelBackground
    ctx.beginPath()
    // Desenha retângulo com radius apenas no topo
    this.drawTopRoundedRect(ctx, boxX, boxY, boxWidth, boxHeight, radius)
    ctx.fill()
    
    // Draw text
    ctx.fillStyle = labelTextColor
    ctx.textBaseline = 'middle'
    ctx.textAlign = 'left'
    ctx.fillText(displayText, boxX + paddingX, boxY + boxHeight / 2)
    
    ctx.restore()
  }
  
  // ============================================
  // RESIZE HANDLES
  // ============================================
  
  /**
   * Desenha handles de resize
   */
  drawHandles(ctx: CanvasRenderingContext2D, dpr: number) {
    const { handleSize, handleFill, handleStroke, handleStrokeWidth } = this.style
    const size = handleSize * dpr
    const halfSize = size / 2
    
    ctx.save()
    
    for (const handle of this.handles) {
      ctx.fillStyle = handleFill
      ctx.strokeStyle = handleStroke
      ctx.lineWidth = handleStrokeWidth * dpr
      
      ctx.beginPath()
      ctx.rect(handle.x - halfSize, handle.y - halfSize, size, size)
      ctx.fill()
      ctx.stroke()
    }
    
    ctx.restore()
  }
  
  /**
   * Atualiza posições dos handles
   */
  private updateHandles(x: number, y: number, width: number, height: number, _dpr: number) {
    const halfW = width / 2
    const halfH = height / 2
    
    this.handles = [
      { type: 'nw', x: x, y: y, cursor: 'nwse-resize' },
      { type: 'n', x: x + halfW, y: y, cursor: 'ns-resize' },
      { type: 'ne', x: x + width, y: y, cursor: 'nesw-resize' },
      { type: 'e', x: x + width, y: y + halfH, cursor: 'ew-resize' },
      { type: 'se', x: x + width, y: y + height, cursor: 'nwse-resize' },
      { type: 's', x: x + halfW, y: y + height, cursor: 'ns-resize' },
      { type: 'sw', x: x, y: y + height, cursor: 'nesw-resize' },
      { type: 'w', x: x, y: y + halfH, cursor: 'ew-resize' },
    ]
  }
  
  /**
   * Retorna handles atuais
   */
  getHandles(): HandleInfo[] {
    return this.handles
  }
  
  /**
   * Testa se um ponto está sobre um handle
   */
  hitTestHandle(px: number, py: number, dpr: number): HandleInfo | null {
    const hitPadding = (this.style.handleSize / 2 + 4) * dpr
    
    for (const handle of this.handles) {
      const dx = Math.abs(px - handle.x)
      const dy = Math.abs(py - handle.y)
      
      if (dx <= hitPadding && dy <= hitPadding) {
        return handle
      }
    }
    
    return null
  }
  
  // ============================================
  // SIZE INDICATOR
  // ============================================
  
  /**
   * Desenha indicador de tamanho abaixo do elemento
   */
  drawSizeIndicator(
    node: SceneNode,
    options: RenderOptions
  ) {
    const { ctx, layoutMap, zoom, dpr, centerOffset } = options
    const layout = layoutMap.get(node.id)
    if (!layout) return
    
    const x = layout.x * zoom * dpr + centerOffset.x * dpr
    const y = layout.y * zoom * dpr + centerOffset.y * dpr
    const width = layout.width * zoom * dpr
    const height = layout.height * zoom * dpr
    
    // Format dimensions
    const w = Math.round(layout.width)
    const h = Math.round(layout.height)
    const text = `${w} × ${h}`
    
    const fontSize = 10 * dpr
    ctx.save()
    ctx.font = `400 ${fontSize}px ${this.style.labelFontFamily}`
    
    const textMetrics = ctx.measureText(text)
    const textWidth = textMetrics.width
    const textHeight = fontSize
    
    const paddingX = 6 * dpr
    const paddingY = 3 * dpr
    const offset = 8 * dpr
    const radius = 3 * dpr
    
    const boxWidth = textWidth + paddingX * 2
    const boxHeight = textHeight + paddingY * 2
    const boxX = x + (width - boxWidth) / 2
    const boxY = y + height + offset
    
    // Draw background
    ctx.fillStyle = this.style.selectionStroke
    ctx.beginPath()
    this.drawRoundedRect(ctx, boxX, boxY, boxWidth, boxHeight, radius)
    ctx.fill()
    
    // Draw text
    ctx.fillStyle = '#FFFFFF'
    ctx.textBaseline = 'middle'
    ctx.textAlign = 'center'
    ctx.fillText(text, boxX + boxWidth / 2, boxY + boxHeight / 2)
    
    ctx.restore()
  }
  
  // ============================================
  // HELPERS
  // ============================================
  
  private getNodeRadius(node: SceneNode, zoom: number, dpr: number): number {
    if ('cornerRadius' in node && typeof node.cornerRadius === 'number') {
      return node.cornerRadius * zoom * dpr
    }
    return 0
  }
  
  private getNodeLabel(node: SceneNode): string {
    // Return appropriate label based on node type
    switch (node.type) {
      case 'TEXT':
        return 'EDIT TEXT'
      case 'FRAME':
        return (node as FrameNode).name || 'FRAME'
      case 'IMAGE':
        return 'IMAGE'
      case 'RECTANGLE':
        return 'RECTANGLE'
      case 'ELLIPSE':
        return 'ELLIPSE'
      case 'VECTOR':
        return 'VECTOR'
      default:
        return node.type
    }
  }
  
  private drawRoundedRect(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    radius: number
  ) {
    const r = Math.min(radius, width / 2, height / 2)
    ctx.beginPath()
    ctx.moveTo(x + r, y)
    ctx.lineTo(x + width - r, y)
    ctx.quadraticCurveTo(x + width, y, x + width, y + r)
    ctx.lineTo(x + width, y + height - r)
    ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height)
    ctx.lineTo(x + r, y + height)
    ctx.quadraticCurveTo(x, y + height, x, y + height - r)
    ctx.lineTo(x, y + r)
    ctx.quadraticCurveTo(x, y, x + r, y)
    ctx.closePath()
  }
  
  /**
   * Desenha retângulo com radius apenas nos cantos superiores
   * Cantos inferiores são retos para "colar" na bounding box
   */
  private drawTopRoundedRect(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    radius: number
  ) {
    const r = Math.min(radius, width / 2, height / 2)
    ctx.beginPath()
    ctx.moveTo(x + r, y)
    ctx.lineTo(x + width - r, y)
    ctx.quadraticCurveTo(x + width, y, x + width, y + r)
    ctx.lineTo(x + width, y + height) // Canto inferior direito reto
    ctx.lineTo(x, y + height) // Canto inferior esquerdo reto
    ctx.lineTo(x, y + r)
    ctx.quadraticCurveTo(x, y, x + r, y)
    ctx.closePath()
  }
}
