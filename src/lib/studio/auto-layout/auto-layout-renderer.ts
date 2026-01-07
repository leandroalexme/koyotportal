/**
 * Auto Layout Handles Renderer
 * 
 * Renderiza handles visuais para padding e gap em frames com auto-layout.
 * Inspirado no Suika Editor.
 */

import type { FrameNode } from '@/types/studio'
import type { ComputedLayout } from '../yoga-adapter'
import {
  type AutoLayoutColors,
  type GapHandle,
  type PaddingHandle,
  DEFAULT_AUTO_LAYOUT_COLORS,
} from './types'

interface RenderOptions {
  ctx: CanvasRenderingContext2D
  layoutMap: Map<string, ComputedLayout>
  zoom: number
  dpr: number
  centerOffset: { x: number; y: number }
}

/**
 * Calcula handles de padding para um frame com auto-layout
 */
export function calculatePaddingHandles(
  frame: FrameNode,
  layout: ComputedLayout,
  zoom: number
): PaddingHandle[] {
  if (frame.autoLayout?.layoutMode === 'NONE') return []

  const handles: PaddingHandle[] = []
  const handleLength = 12 / zoom

  const padding = frame.autoLayout.padding || { top: 0, right: 0, bottom: 0, left: 0 }
  const paddingTop = padding.top
  const paddingRight = padding.right
  const paddingBottom = padding.bottom
  const paddingLeft = padding.left

  const width = layout.width
  const height = layout.height
  const centerX = width / 2
  const centerY = height / 2

  const minPaddingOffset = 4 / zoom

  // Top padding handle
  const topY = paddingTop > 0 ? paddingTop / 2 : minPaddingOffset
  handles.push({
    type: 'padding-top',
    start: { x: centerX - handleLength / 2, y: topY },
    end: { x: centerX + handleLength / 2, y: topY },
    value: paddingTop,
    frameId: frame.id,
  })

  // Right padding handle
  const rightX = paddingRight > 0 ? width - paddingRight / 2 : width - minPaddingOffset
  handles.push({
    type: 'padding-right',
    start: { x: rightX, y: centerY - handleLength / 2 },
    end: { x: rightX, y: centerY + handleLength / 2 },
    value: paddingRight,
    frameId: frame.id,
  })

  // Bottom padding handle
  const bottomY = paddingBottom > 0 ? height - paddingBottom / 2 : height - minPaddingOffset
  handles.push({
    type: 'padding-bottom',
    start: { x: centerX - handleLength / 2, y: bottomY },
    end: { x: centerX + handleLength / 2, y: bottomY },
    value: paddingBottom,
    frameId: frame.id,
  })

  // Left padding handle
  const leftX = paddingLeft > 0 ? paddingLeft / 2 : minPaddingOffset
  handles.push({
    type: 'padding-left',
    start: { x: leftX, y: centerY - handleLength / 2 },
    end: { x: leftX, y: centerY + handleLength / 2 },
    value: paddingLeft,
    frameId: frame.id,
  })

  return handles
}

/**
 * Calcula handles de gap entre filhos de um frame com auto-layout
 */
export function calculateGapHandles(
  frame: FrameNode,
  layout: ComputedLayout,
  layoutMap: Map<string, ComputedLayout>,
  zoom: number
): GapHandle[] {
  if (frame.autoLayout?.layoutMode === 'NONE') return []

  const children = frame.children
  if (children.length < 2) return []

  const handles: GapHandle[] = []
  const gap = frame.autoLayout.gap || 0
  const direction = frame.autoLayout.layoutMode === 'HORIZONTAL' ? 'horizontal' : 'vertical'
  const handleLength = 8 / zoom

  const padding = frame.autoLayout.padding || { top: 0, right: 0, bottom: 0, left: 0 }

  for (let i = 0; i < children.length - 1; i++) {
    const child = children[i]
    const nextChild = children[i + 1]

    const childLayout = layoutMap.get(child.id)
    const nextLayout = layoutMap.get(nextChild.id)

    if (!childLayout || !nextLayout) continue

    // Posições relativas ao frame pai
    const childRelX = childLayout.x - layout.x
    const childRelY = childLayout.y - layout.y
    const nextRelX = nextLayout.x - layout.x
    const nextRelY = nextLayout.y - layout.y

    let start: { x: number; y: number }
    let end: { x: number; y: number }

    if (direction === 'vertical') {
      const gapY = (childRelY + childLayout.height + nextRelY) / 2
      const contentCenterX = padding.left + (layout.width - padding.left - padding.right) / 2
      start = { x: contentCenterX - handleLength / 2, y: gapY }
      end = { x: contentCenterX + handleLength / 2, y: gapY }
    } else {
      const gapX = (childRelX + childLayout.width + nextRelX) / 2
      const contentCenterY = padding.top + (layout.height - padding.top - padding.bottom) / 2
      start = { x: gapX, y: contentCenterY - handleLength / 2 }
      end = { x: gapX, y: contentCenterY + handleLength / 2 }
    }

    handles.push({
      type: 'gap',
      start,
      end,
      value: gap,
      frameId: frame.id,
      gapIndex: i,
    })
  }

  return handles
}

/**
 * Renderiza um handle de padding
 */
function renderPaddingHandle(
  ctx: CanvasRenderingContext2D,
  handle: PaddingHandle,
  zoom: number,
  dpr: number,
  colors: AutoLayoutColors
): void {
  const lineWidth = 2 * dpr / zoom

  ctx.save()
  ctx.beginPath()
  ctx.moveTo(handle.start.x, handle.start.y)
  ctx.lineTo(handle.end.x, handle.end.y)
  ctx.strokeStyle = colors.padding
  ctx.lineWidth = lineWidth
  ctx.lineCap = 'round'
  ctx.stroke()
  ctx.restore()
}

/**
 * Renderiza um handle de gap
 */
function renderGapHandle(
  ctx: CanvasRenderingContext2D,
  handle: GapHandle,
  zoom: number,
  dpr: number,
  colors: AutoLayoutColors
): void {
  const lineWidth = 2 * dpr / zoom

  ctx.save()
  ctx.beginPath()
  ctx.moveTo(handle.start.x, handle.start.y)
  ctx.lineTo(handle.end.x, handle.end.y)
  ctx.strokeStyle = colors.gap
  ctx.lineWidth = lineWidth
  ctx.lineCap = 'round'
  ctx.stroke()
  ctx.restore()
}

/**
 * Renderiza área hachurada para padding
 */
export function renderPaddingHatchArea(
  ctx: CanvasRenderingContext2D,
  frameWidth: number,
  frameHeight: number,
  paddingType: 'padding-top' | 'padding-right' | 'padding-bottom' | 'padding-left',
  paddingValue: number,
  zoom: number,
  dpr: number,
  colors: AutoLayoutColors
): void {
  if (paddingValue <= 0) return

  ctx.save()

  let x = 0, y = 0, width = 0, height = 0

  if (paddingType === 'padding-top') {
    x = 0
    y = 0
    width = frameWidth
    height = paddingValue
  } else if (paddingType === 'padding-right') {
    x = frameWidth - paddingValue
    y = 0
    width = paddingValue
    height = frameHeight
  } else if (paddingType === 'padding-bottom') {
    x = 0
    y = frameHeight - paddingValue
    width = frameWidth
    height = paddingValue
  } else if (paddingType === 'padding-left') {
    x = 0
    y = 0
    width = paddingValue
    height = frameHeight
  }

  // Background semi-transparente
  ctx.fillStyle = colors.paddingFill
  ctx.fillRect(x, y, width, height)

  // Padrão hachurado
  drawHatchPattern(ctx, x, y, width, height, zoom, dpr, colors.padding)

  ctx.restore()
}

/**
 * Renderiza área hachurada para gap
 */
export function renderGapHatchArea(
  ctx: CanvasRenderingContext2D,
  frameWidth: number,
  frameHeight: number,
  direction: 'vertical' | 'horizontal',
  gapStart: number,
  gapSize: number,
  padding: { top: number; right: number; bottom: number; left: number },
  zoom: number,
  dpr: number,
  colors: AutoLayoutColors
): void {
  if (gapSize <= 0) return

  ctx.save()

  let x = 0, y = 0, width = 0, height = 0

  if (direction === 'vertical') {
    x = padding.left
    y = gapStart
    width = frameWidth - padding.left - padding.right
    height = gapSize
  } else {
    x = gapStart
    y = padding.top
    width = gapSize
    height = frameHeight - padding.top - padding.bottom
  }

  // Background semi-transparente
  ctx.fillStyle = colors.gapFill
  ctx.fillRect(x, y, width, height)

  // Padrão hachurado
  drawHatchPattern(ctx, x, y, width, height, zoom, dpr, colors.gap)

  ctx.restore()
}

/**
 * Desenha padrão hachurado diagonal (estilo Figma)
 */
function drawHatchPattern(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  zoom: number,
  dpr: number,
  color: string
): void {
  const spacing = 10 / zoom
  const lineWidth = 1.5 * dpr / zoom

  ctx.save()
  ctx.strokeStyle = color
  ctx.lineWidth = lineWidth
  ctx.globalAlpha = 0.35

  // Clip na área
  ctx.beginPath()
  ctx.rect(x, y, width, height)
  ctx.clip()

  // Desenha linhas diagonais
  const diagonal = Math.sqrt(width * width + height * height)
  const numLines = Math.ceil(diagonal / spacing) * 2

  ctx.beginPath()
  for (let i = -numLines; i <= numLines; i++) {
    const offset = i * spacing
    ctx.moveTo(x + offset, y + height)
    ctx.lineTo(x + offset + height, y)
  }
  ctx.stroke()

  ctx.restore()
}

/**
 * Renderiza tooltip com valor
 */
export function renderValueTooltip(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  value: number,
  zoom: number,
  dpr: number,
  color: string
): void {
  const text = Math.round(value).toString()
  const fontSize = 12 * dpr / zoom
  const paddingX = 6 * dpr / zoom
  const paddingY = 4 * dpr / zoom
  const borderRadius = 4 * dpr / zoom

  ctx.save()

  ctx.font = `500 ${fontSize}px Inter, system-ui, sans-serif`
  const textWidth = ctx.measureText(text).width
  const boxWidth = textWidth + paddingX * 2
  const boxHeight = fontSize + paddingY * 2

  const boxX = x - boxWidth / 2
  const boxY = y - boxHeight / 2

  // Background
  ctx.fillStyle = color
  ctx.beginPath()
  ctx.moveTo(boxX + borderRadius, boxY)
  ctx.lineTo(boxX + boxWidth - borderRadius, boxY)
  ctx.quadraticCurveTo(boxX + boxWidth, boxY, boxX + boxWidth, boxY + borderRadius)
  ctx.lineTo(boxX + boxWidth, boxY + boxHeight - borderRadius)
  ctx.quadraticCurveTo(boxX + boxWidth, boxY + boxHeight, boxX + boxWidth - borderRadius, boxY + boxHeight)
  ctx.lineTo(boxX + borderRadius, boxY + boxHeight)
  ctx.quadraticCurveTo(boxX, boxY + boxHeight, boxX, boxY + boxHeight - borderRadius)
  ctx.lineTo(boxX, boxY + borderRadius)
  ctx.quadraticCurveTo(boxX, boxY, boxX + borderRadius, boxY)
  ctx.closePath()
  ctx.fill()

  // Texto
  ctx.fillStyle = '#FFFFFF'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(text, x, y)

  ctx.restore()
}

/**
 * Classe para renderizar handles de auto-layout
 */
export class AutoLayoutHandlesRenderer {
  private colors: AutoLayoutColors

  constructor(colors: Partial<AutoLayoutColors> = {}) {
    this.colors = { ...DEFAULT_AUTO_LAYOUT_COLORS, ...colors }
  }

  /**
   * Renderiza todos os handles de auto-layout para um frame
   */
  renderHandles(
    frame: FrameNode,
    options: RenderOptions,
    hoveredHandle: string | null = null,
    draggingHandle: string | null = null
  ): void {
    if (frame.autoLayout?.layoutMode === 'NONE') return

    const { ctx, layoutMap, zoom, dpr, centerOffset } = options
    const layout = layoutMap.get(frame.id)
    if (!layout) return

    const frameX = layout.x * zoom * dpr + centerOffset.x * dpr
    const frameY = layout.y * zoom * dpr + centerOffset.y * dpr

    ctx.save()
    ctx.translate(frameX, frameY)
    ctx.scale(zoom * dpr, zoom * dpr)

    // Renderiza área hachurada se hover ou dragging
    const activeHandle = draggingHandle || hoveredHandle
    if (activeHandle) {
      this.renderHatchArea(frame, layout, activeHandle, zoom, dpr)
    }

    // Renderiza handles de padding
    const paddingHandles = calculatePaddingHandles(frame, layout, zoom)
    for (const handle of paddingHandles) {
      renderPaddingHandle(ctx, handle, zoom, dpr, this.colors)
    }

    // Renderiza handles de gap
    const gapHandles = calculateGapHandles(frame, layout, layoutMap, zoom)
    for (const handle of gapHandles) {
      renderGapHandle(ctx, handle, zoom, dpr, this.colors)
    }

    ctx.restore()
  }

  /**
   * Renderiza área hachurada para o handle ativo
   */
  private renderHatchArea(
    frame: FrameNode,
    layout: ComputedLayout,
    handleType: string,
    zoom: number,
    dpr: number
  ): void {
    const ctx = document.createElement('canvas').getContext('2d')
    if (!ctx) return

    const padding = frame.autoLayout?.padding || { top: 0, right: 0, bottom: 0, left: 0 }

    if (handleType === 'gap') {
      const gap = frame.autoLayout?.gap || 0
      const direction = frame.autoLayout?.layoutMode === 'HORIZONTAL' ? 'horizontal' : 'vertical'
      renderGapHatchArea(
        ctx,
        layout.width,
        layout.height,
        direction,
        0, // TODO: calcular posição real do gap
        gap,
        padding,
        zoom,
        dpr,
        this.colors
      )
    } else if (handleType.startsWith('padding-')) {
      const paddingType = handleType as 'padding-top' | 'padding-right' | 'padding-bottom' | 'padding-left'
      let paddingValue = 0
      if (paddingType === 'padding-top') paddingValue = padding.top
      else if (paddingType === 'padding-right') paddingValue = padding.right
      else if (paddingType === 'padding-bottom') paddingValue = padding.bottom
      else if (paddingType === 'padding-left') paddingValue = padding.left

      renderPaddingHatchArea(
        ctx,
        layout.width,
        layout.height,
        paddingType,
        paddingValue,
        zoom,
        dpr,
        this.colors
      )
    }
  }

  /**
   * Hit test para handles de padding
   */
  hitTestPaddingHandle(
    frame: FrameNode,
    layout: ComputedLayout,
    point: { x: number; y: number },
    zoom: number
  ): PaddingHandle | null {
    if (frame.autoLayout?.layoutMode === 'NONE') return null

    const handles = calculatePaddingHandles(frame, layout, zoom)
    const hitDistance = 12 / zoom

    for (const handle of handles) {
      const dist = this.pointToLineDistance(point, handle.start, handle.end)
      if (dist <= hitDistance) {
        return handle
      }
    }

    return null
  }

  /**
   * Hit test para handles de gap
   */
  hitTestGapHandle(
    frame: FrameNode,
    layout: ComputedLayout,
    layoutMap: Map<string, ComputedLayout>,
    point: { x: number; y: number },
    zoom: number
  ): GapHandle | null {
    if (frame.autoLayout?.layoutMode === 'NONE') return null

    const handles = calculateGapHandles(frame, layout, layoutMap, zoom)
    const hitDistance = 12 / zoom

    for (const handle of handles) {
      const dist = this.pointToLineDistance(point, handle.start, handle.end)
      if (dist <= hitDistance) {
        return handle
      }
    }

    return null
  }

  /**
   * Calcula distância de um ponto a um segmento de linha
   */
  private pointToLineDistance(
    point: { x: number; y: number },
    lineStart: { x: number; y: number },
    lineEnd: { x: number; y: number }
  ): number {
    const dx = lineEnd.x - lineStart.x
    const dy = lineEnd.y - lineStart.y
    const lineLength = Math.sqrt(dx * dx + dy * dy)

    if (lineLength === 0) {
      const pdx = point.x - lineStart.x
      const pdy = point.y - lineStart.y
      return Math.sqrt(pdx * pdx + pdy * pdy)
    }

    const t = Math.max(0, Math.min(1, 
      ((point.x - lineStart.x) * dx + (point.y - lineStart.y) * dy) / (lineLength * lineLength)
    ))

    const closestX = lineStart.x + t * dx
    const closestY = lineStart.y + t * dy

    const distX = point.x - closestX
    const distY = point.y - closestY
    return Math.sqrt(distX * distX + distY * distY)
  }
}
