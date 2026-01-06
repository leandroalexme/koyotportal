/**
 * Koyot Studio - Render Engine
 */

import type { 
  SceneNode, 
  FrameNode, 
  TextNode, 
  ImageNode,
  RectangleNode,
  EllipseNode,
  Fill,
  SolidFill,
  GradientFill,
  Color,
} from '@/types/studio'
import { calculateLayout, createLayoutMap, type ComputedLayout } from './yoga-adapter'

export interface FontConfig {
  family: string
  weights: number[]
  googleFontsUrl?: string
}

export interface RenderContext {
  ctx: CanvasRenderingContext2D
  layoutMap: Map<string, ComputedLayout>
  loadedImages: Map<string, HTMLImageElement>
  loadedFonts: Set<string>
  zoom: number
  centerOffset: { x: number; y: number }
  selectedNodeId: string | null
  hoveredNodeId: string | null
  dpr: number
}

export interface HitTestResult {
  nodeId: string
  node: SceneNode
  depth: number
}

const BRAND_FONTS: FontConfig[] = [
  {
    family: 'Playfair Display',
    weights: [400, 500, 600, 700],
    googleFontsUrl: 'https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600;700&display=swap',
  },
  {
    family: 'Inter',
    weights: [300, 400, 500, 600, 700],
    googleFontsUrl: 'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap',
  },
]

class FontEngine {
  private loadedFonts: Set<string> = new Set()
  private loadingPromises: Map<string, Promise<void>> = new Map()
  
  async loadFont(family: string, weight: number = 400): Promise<boolean> {
    const fontKey = family + ':' + weight
    if (this.loadedFonts.has(fontKey)) return true
    if (this.loadingPromises.has(fontKey)) {
      await this.loadingPromises.get(fontKey)
      return this.loadedFonts.has(fontKey)
    }
    const loadPromise = this.doLoadFont(family, weight)
    this.loadingPromises.set(fontKey, loadPromise)
    try {
      await loadPromise
      this.loadedFonts.add(fontKey)
      return true
    } catch (error) {
      console.warn('Failed to load font', error)
      return false
    } finally {
      this.loadingPromises.delete(fontKey)
    }
  }
  
  private async doLoadFont(family: string, weight: number): Promise<void> {
    if (document.fonts.check(weight + ' 16px "' + family + '"')) return
    const fontConfig = BRAND_FONTS.find(f => f.family === family)
    if (fontConfig?.googleFontsUrl) {
      await this.loadGoogleFont(fontConfig)
    }
    try {
      await document.fonts.load(weight + ' 16px "' + family + '"')
    } catch {
      console.warn('Font not available')
    }
  }
  
  private async loadGoogleFont(config: FontConfig): Promise<void> {
    const linkId = 'font-' + config.family.replace(/s+/g, '-').toLowerCase()
    if (document.getElementById(linkId)) return
    return new Promise((resolve, reject) => {
      const link = document.createElement('link')
      link.id = linkId
      link.rel = 'stylesheet'
      link.href = config.googleFontsUrl!
      link.onload = () => resolve()
      link.onerror = () => reject(new Error('Failed'))
      document.head.appendChild(link)
    })
  }
  
  async loadBrandFonts(): Promise<void> {
    const promises = BRAND_FONTS.flatMap(font => 
      font.weights.map(weight => this.loadFont(font.family, weight))
    )
    await Promise.allSettled(promises)
  }
  
  getLoadedFonts(): Set<string> {
    return new Set(this.loadedFonts)
  }
}

export const fontEngine = new FontEngine()

class ImageLoader {
  private cache: Map<string, HTMLImageElement> = new Map()
  
  async loadImage(src: string): Promise<HTMLImageElement | null> {
    if (!src) return null
    if (this.cache.has(src)) return this.cache.get(src)!
    return new Promise((resolve) => {
      const img = new Image()
      img.crossOrigin = 'anonymous'
      img.onload = () => { this.cache.set(src, img); resolve(img) }
      img.onerror = () => resolve(null)
      img.src = src
    })
  }
  
  getCache(): Map<string, HTMLImageElement> { return this.cache }
}

export const imageLoader = new ImageLoader()

function colorToRgba(color: Color): string {
  return 'rgba(' + color.r + ', ' + color.g + ', ' + color.b + ', ' + color.a + ')'
}

function applyFill(ctx: CanvasRenderingContext2D, fill: Fill, x: number, y: number, w: number, h: number): void {
  ctx.save()
  if (fill.type === 'SOLID') {
    ctx.fillStyle = colorToRgba((fill as SolidFill).color)
    ctx.fillRect(x, y, w, h)
  } else if (fill.type === 'GRADIENT_LINEAR' || fill.type === 'GRADIENT_RADIAL') {
    const gf = fill as GradientFill
    if (gf.stops?.length) {
      const gradient = fill.type === 'GRADIENT_LINEAR'
        ? ctx.createLinearGradient(x, y, x + w, y + h)
        : ctx.createRadialGradient(x + w/2, y + h/2, 0, x + w/2, y + h/2, Math.max(w, h)/2)
      gf.stops.forEach(s => gradient.addColorStop(s.position, colorToRgba(s.color)))
      ctx.fillStyle = gradient
      ctx.fillRect(x, y, w, h)
    }
  }
  ctx.restore()
}

function drawRoundedRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number): void {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + w - r, y)
  ctx.quadraticCurveTo(x + w, y, x + w, y + r)
  ctx.lineTo(x + w, y + h - r)
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
  ctx.lineTo(x + r, y + h)
  ctx.quadraticCurveTo(x, y + h, x, y + h - r)
  ctx.lineTo(x, y + r)
  ctx.quadraticCurveTo(x, y, x + r, y)
  ctx.closePath()
}

function renderFrame(node: FrameNode, context: RenderContext): void {
  const { ctx, layoutMap, zoom, selectedNodeId, hoveredNodeId, dpr, centerOffset } = context
  const layout = layoutMap.get(node.id)
  if (!layout) return
  const x = layout.x * zoom * dpr + centerOffset.x * dpr
  const y = layout.y * zoom * dpr + centerOffset.y * dpr
  const width = layout.width * zoom * dpr
  const height = layout.height * zoom * dpr
  const radius = (typeof node.cornerRadius === 'number' ? node.cornerRadius : node.cornerRadius.topLeft) * zoom * dpr
  ctx.save()
  ctx.globalAlpha = node.opacity
  if (node.clipsContent && radius > 0) { drawRoundedRect(ctx, x, y, width, height, radius); ctx.clip() }
  node.fills.forEach(fill => {
    if (radius > 0) { drawRoundedRect(ctx, x, y, width, height, radius); if (fill.type === 'SOLID') { ctx.fillStyle = colorToRgba(fill.color); ctx.fill() } }
    else { applyFill(ctx, fill, x, y, width, height) }
  })
  if (node.border) { ctx.strokeStyle = colorToRgba(node.border.color); ctx.lineWidth = node.border.width * zoom * dpr; drawRoundedRect(ctx, x, y, width, height, radius); ctx.stroke() }
  node.children.forEach(child => renderNode(child, context))
  ctx.restore()
  if (selectedNodeId === node.id) {
    ctx.save()
    ctx.strokeStyle = '#0066FF'
    ctx.lineWidth = 2 * dpr
    drawRoundedRect(ctx, x - 1, y - 1, width + 2, height + 2, radius)
    ctx.stroke()
    ctx.restore()
  } else if (hoveredNodeId === node.id) {
    ctx.save()
    ctx.strokeStyle = 'rgba(0, 102, 255, 0.4)'
    ctx.lineWidth = 1 * dpr
    ctx.setLineDash([4 * dpr, 4 * dpr])
    drawRoundedRect(ctx, x, y, width, height, radius)
    ctx.stroke()
    ctx.restore()
  }
}

function renderText(node: TextNode, context: RenderContext): void {
  const { ctx, layoutMap, zoom, selectedNodeId, dpr, centerOffset } = context
  const layout = layoutMap.get(node.id)
  if (!layout) return
  const x = layout.x * zoom * dpr + centerOffset.x * dpr
  const y = layout.y * zoom * dpr + centerOffset.y * dpr
  const width = layout.width * zoom * dpr
  const height = layout.height * zoom * dpr
  ctx.save()
  ctx.globalAlpha = node.opacity
  const { style, content } = node.textProps
  const fontSize = style.fontSize * zoom * dpr
  
  // Build font string with fontStyle (italic/normal)
  const fontStyle = style.fontStyle === 'italic' ? 'italic ' : ''
  ctx.font = fontStyle + style.fontWeight + ' ' + fontSize + 'px "' + style.fontFamily + '", sans-serif'
  ctx.textBaseline = 'top'
  
  // Letter spacing
  const letterSpacing = (style.letterSpacing ?? 0) * zoom * dpr
  
  // Text fill color
  const textFill = node.fills.find(f => f.type === 'SOLID') as SolidFill | undefined
  ctx.fillStyle = textFill ? colorToRgba(textFill.color) : '#000000'
  
  // Line height calculation
  const lineHeight = style.lineHeight === 'AUTO' 
    ? fontSize * 1.2 
    : (typeof style.lineHeight === 'number' && style.lineHeight < 10 
        ? fontSize * style.lineHeight 
        : style.lineHeight * zoom * dpr)
  
  // Word wrap and render - handle newlines first
  const paragraphs = content.split('\n')
  const lines: string[] = []
  
  // Process each paragraph
  paragraphs.forEach((paragraph) => {
    if (paragraph === '') {
      lines.push('') // Empty line for paragraph break
      return
    }
    
    const words = paragraph.split(' ')
    let line = ''
    
    // Build lines with word wrap
    words.forEach((word) => {
      const testLine = line + (line ? ' ' : '') + word
      const testWidth = measureTextWithSpacing(ctx, testLine, letterSpacing)
      if (testWidth > width && line) {
        lines.push(line)
        line = word
      } else {
        line = testLine
      }
    })
    if (line) lines.push(line)
  })
  
  // Render each line
  let currentY = y
  lines.forEach((lineText, lineIndex) => {
    const isLastLine = lineIndex === lines.length - 1
    
    if (style.textAlign === 'JUSTIFY' && !isLastLine && lines.length > 1) {
      // Justify: distribute words across width
      renderJustifiedLine(ctx, lineText, x, currentY, width, letterSpacing)
    } else {
      // Normal alignment
      let textX = x
      if (style.textAlign === 'CENTER') {
        textX = x + (width - measureTextWithSpacing(ctx, lineText, letterSpacing)) / 2
      } else if (style.textAlign === 'RIGHT') {
        textX = x + width - measureTextWithSpacing(ctx, lineText, letterSpacing)
      }
      renderTextWithSpacing(ctx, lineText, textX, currentY, letterSpacing)
    }
    currentY += lineHeight
  })
  
  ctx.restore()
  if (selectedNodeId === node.id) {
    ctx.save()
    ctx.strokeStyle = '#0066FF'
    ctx.lineWidth = 2 * dpr
    ctx.strokeRect(x - 1, y - 1, width + 2, height + 2)
    ctx.restore()
  }
}

// Helper: measure text with letter spacing
function measureTextWithSpacing(ctx: CanvasRenderingContext2D, text: string, letterSpacing: number): number {
  if (letterSpacing === 0) return ctx.measureText(text).width
  let totalWidth = 0
  for (let i = 0; i < text.length; i++) {
    totalWidth += ctx.measureText(text[i]).width + (i < text.length - 1 ? letterSpacing : 0)
  }
  return totalWidth
}

// Helper: render text with letter spacing
function renderTextWithSpacing(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, letterSpacing: number): void {
  if (letterSpacing === 0) {
    ctx.fillText(text, x, y)
    return
  }
  let currentX = x
  for (let i = 0; i < text.length; i++) {
    ctx.fillText(text[i], currentX, y)
    currentX += ctx.measureText(text[i]).width + letterSpacing
  }
}

// Helper: render justified line
function renderJustifiedLine(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, width: number, letterSpacing: number): void {
  const words = text.split(' ')
  if (words.length === 1) {
    renderTextWithSpacing(ctx, text, x, y, letterSpacing)
    return
  }
  
  // Calculate total word width
  let totalWordWidth = 0
  words.forEach(word => {
    totalWordWidth += measureTextWithSpacing(ctx, word, letterSpacing)
  })
  
  // Calculate space between words
  const totalSpaceWidth = width - totalWordWidth
  const spaceWidth = totalSpaceWidth / (words.length - 1)
  
  let currentX = x
  words.forEach((word, i) => {
    renderTextWithSpacing(ctx, word, currentX, y, letterSpacing)
    currentX += measureTextWithSpacing(ctx, word, letterSpacing) + (i < words.length - 1 ? spaceWidth : 0)
  })
}

function renderImage(node: ImageNode, context: RenderContext): void {
  const { ctx, layoutMap, loadedImages, zoom, selectedNodeId, dpr, centerOffset } = context
  const layout = layoutMap.get(node.id)
  if (!layout) return
  const x = layout.x * zoom * dpr + centerOffset.x * dpr
  const y = layout.y * zoom * dpr + centerOffset.y * dpr
  const width = layout.width * zoom * dpr
  const height = layout.height * zoom * dpr
  ctx.save()
  ctx.globalAlpha = node.opacity
  const img = node.imageProps.src ? loadedImages.get(node.imageProps.src) : null
  if (img) {
    ctx.beginPath(); ctx.rect(x, y, width, height); ctx.clip()
    let drawX = x, drawY = y, drawW = width, drawH = height
    const imgAspect = img.width / img.height
    const boxAspect = width / height
    if (node.imageProps.objectFit === 'FIT') {
      if (imgAspect > boxAspect) { drawH = width / imgAspect; drawY = y + (height - drawH) / 2 }
      else { drawW = height * imgAspect; drawX = x + (width - drawW) / 2 }
    } else if (node.imageProps.objectFit === 'CROP') {
      if (imgAspect > boxAspect) { drawW = height * imgAspect; drawX = x + (width - drawW) * node.imageProps.objectPosition.x }
      else { drawH = width / imgAspect; drawY = y + (height - drawH) * node.imageProps.objectPosition.y }
    }
    ctx.drawImage(img, drawX, drawY, drawW, drawH)
  } else {
    ctx.fillStyle = '#f0f0f0'; ctx.fillRect(x, y, width, height)
    ctx.fillStyle = '#999'; ctx.font = (24 * zoom * dpr) + 'px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
    ctx.fillText('IMG', x + width / 2, y + height / 2)
  }
  ctx.restore()
  if (selectedNodeId === node.id) {
    ctx.save()
    ctx.strokeStyle = '#0066FF'
    ctx.lineWidth = 2 * dpr
    ctx.strokeRect(x - 1, y - 1, width + 2, height + 2)
    ctx.restore()
  }
}

function renderRectangle(node: RectangleNode, context: RenderContext): void {
  const { ctx, layoutMap, zoom, selectedNodeId, dpr, centerOffset } = context
  const layout = layoutMap.get(node.id)
  if (!layout) return
  const x = layout.x * zoom * dpr + centerOffset.x * dpr
  const y = layout.y * zoom * dpr + centerOffset.y * dpr
  const width = layout.width * zoom * dpr
  const height = layout.height * zoom * dpr
  const radius = (typeof node.cornerRadius === 'number' ? node.cornerRadius : node.cornerRadius.topLeft) * zoom * dpr
  ctx.save()
  ctx.globalAlpha = node.opacity
  node.fills.forEach(fill => {
    if (radius > 0) { drawRoundedRect(ctx, x, y, width, height, radius); if (fill.type === 'SOLID') { ctx.fillStyle = colorToRgba(fill.color); ctx.fill() } }
    else { applyFill(ctx, fill, x, y, width, height) }
  })
  if (node.border) {
    ctx.strokeStyle = colorToRgba(node.border.color)
    ctx.lineWidth = node.border.width * zoom * dpr
    if (radius > 0) {
      drawRoundedRect(ctx, x, y, width, height, radius)
      ctx.stroke()
    } else {
      ctx.strokeRect(x, y, width, height)
    }
  }
  ctx.restore()
  
  if (selectedNodeId === node.id) {
    ctx.save()
    ctx.strokeStyle = '#0066FF'
    ctx.lineWidth = 2 * dpr
    ctx.strokeRect(x - 1, y - 1, width + 2, height + 2)
    ctx.restore()
  }
}

function renderEllipse(node: EllipseNode, context: RenderContext): void {
  const { ctx, layoutMap, zoom, selectedNodeId, dpr, centerOffset } = context
  const layout = layoutMap.get(node.id)
  if (!layout) return
  const x = layout.x * zoom * dpr + centerOffset.x * dpr
  const y = layout.y * zoom * dpr + centerOffset.y * dpr
  const width = layout.width * zoom * dpr
  const height = layout.height * zoom * dpr
  const cx = x + width / 2
  const cy = y + height / 2
  ctx.save()
  ctx.globalAlpha = node.opacity
  node.fills.forEach(fill => { ctx.beginPath(); ctx.ellipse(cx, cy, width / 2, height / 2, 0, 0, Math.PI * 2); if (fill.type === 'SOLID') { ctx.fillStyle = colorToRgba(fill.color); ctx.fill() } })
  if (node.border) { ctx.beginPath(); ctx.ellipse(cx, cy, width / 2, height / 2, 0, 0, Math.PI * 2); ctx.strokeStyle = colorToRgba(node.border.color); ctx.lineWidth = node.border.width * zoom * dpr; ctx.stroke() }
  ctx.restore()
  if (selectedNodeId === node.id) {
    ctx.save()
    ctx.strokeStyle = '#0066FF'
    ctx.lineWidth = 2 * dpr
    ctx.beginPath()
    ctx.ellipse(cx, cy, width / 2 + 1, height / 2 + 1, 0, 0, Math.PI * 2)
    ctx.stroke()
    ctx.restore()
  }
}

function renderNode(node: SceneNode, context: RenderContext): void {
  if (!node.visible) return
  switch (node.type) {
    case 'FRAME': renderFrame(node as FrameNode, context); break
    case 'TEXT': renderText(node as TextNode, context); break
    case 'IMAGE': renderImage(node as ImageNode, context); break
    case 'RECTANGLE': renderRectangle(node as RectangleNode, context); break
    case 'ELLIPSE': renderEllipse(node as EllipseNode, context); break
  }
}

function collectImageNodes(node: SceneNode): ImageNode[] {
  const images: ImageNode[] = []
  if (node.type === 'IMAGE') images.push(node as ImageNode)
  if (node.type === 'FRAME') { (node as FrameNode).children.forEach(c => images.push(...collectImageNodes(c))) }
  return images
}

function drawGrid(ctx: CanvasRenderingContext2D, w: number, h: number, zoom: number, centerOffset: { x: number; y: number }, dpr: number): void {
  const gridSize = 20 * zoom * dpr
  const ox = (centerOffset.x * dpr) % gridSize
  const oy = (centerOffset.y * dpr) % gridSize
  ctx.save()
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.05)'
  ctx.lineWidth = 1
  for (let xPos = ox; xPos < w; xPos += gridSize) { ctx.beginPath(); ctx.moveTo(xPos, 0); ctx.lineTo(xPos, h); ctx.stroke() }
  for (let yPos = oy; yPos < h; yPos += gridSize) { ctx.beginPath(); ctx.moveTo(0, yPos); ctx.lineTo(w, yPos); ctx.stroke() }
  ctx.restore()
}

function drawArtboardShadow(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, dpr: number): void {
  ctx.save()
  ctx.shadowColor = 'rgba(0, 0, 0, 0.15)'
  ctx.shadowBlur = 24 * dpr
  ctx.shadowOffsetX = 0
  ctx.shadowOffsetY = 4 * dpr
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(x, y, w, h)
  ctx.restore()
}

export async function renderScene(
  canvas: HTMLCanvasElement,
  rootNode: FrameNode,
  options: {
    zoom?: number
    centerOffset?: { x: number; y: number }
    selectedNodeId?: string | null
    hoveredNodeId?: string | null
    showGrid?: boolean
  } = {}
): Promise<Map<string, ComputedLayout>> {
  const ctx = canvas.getContext('2d')
  if (!ctx) return new Map()
  
  const dpr = window.devicePixelRatio || 1
  const zoom = options.zoom ?? 1
  const centerOffset = options.centerOffset ?? { x: 0, y: 0 }
  
  const displayWidth = canvas.clientWidth
  const displayHeight = canvas.clientHeight
  canvas.width = displayWidth * dpr
  canvas.height = displayHeight * dpr
  
  ctx.fillStyle = '#f8fafc'
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  
  if (options.showGrid) {
    drawGrid(ctx, canvas.width, canvas.height, zoom, centerOffset, dpr)
  }
  
  const computedLayout = calculateLayout(rootNode)
  const layoutMap = createLayoutMap(computedLayout)
  
  const loadedImages = imageLoader.getCache()
  const imageNodes = collectImageNodes(rootNode)
  await Promise.all(imageNodes.map(n => n.imageProps.src ? imageLoader.loadImage(n.imageProps.src) : null))
  
  const artX = centerOffset.x * dpr
  const artY = centerOffset.y * dpr
  const artW = rootNode.size.width * zoom * dpr
  const artH = rootNode.size.height * zoom * dpr
  drawArtboardShadow(ctx, artX, artY, artW, artH, dpr)
  
  const context: RenderContext = {
    ctx,
    layoutMap,
    loadedImages,
    loadedFonts: fontEngine.getLoadedFonts(),
    zoom,
    centerOffset,
    selectedNodeId: options.selectedNodeId ?? null,
    hoveredNodeId: options.hoveredNodeId ?? null,
    dpr,
  }
  
  renderNode(rootNode, context)
  return layoutMap
}

export function hitTest(
  rootNode: FrameNode,
  layoutMap: Map<string, ComputedLayout>,
  point: { x: number; y: number },
  zoom: number = 1,
  _centerOffset: { x: number; y: number } = { x: 0, y: 0 }
): HitTestResult | null {
  const results: HitTestResult[] = []
  
  function testNode(node: SceneNode, depth: number): void {
    if (!node.visible) return
    const layout = layoutMap.get(node.id)
    if (!layout) return
    
    const nodeX = layout.x
    const nodeY = layout.y
    const nodeW = layout.width
    const nodeH = layout.height
    
    if (point.x >= nodeX && point.x <= nodeX + nodeW && point.y >= nodeY && point.y <= nodeY + nodeH) {
      results.push({ nodeId: node.id, node, depth })
    }
    
    if (node.type === 'FRAME') {
      (node as FrameNode).children.forEach(c => testNode(c, depth + 1))
    }
  }
  
  testNode(rootNode, 0)
  if (results.length === 0) return null
  return results.reduce((d, c) => c.depth > d.depth ? c : d)
}

export { BRAND_FONTS }
