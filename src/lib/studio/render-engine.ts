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
  VectorNode,
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
  
  /**
   * Carrega fontes de um template (Google Fonts ou customizadas)
   */
  async loadTemplateFonts(fonts: {
    googleFonts?: Array<{ family: string; weights: number[] }>
    customFonts?: string[]
    googleFontsUrl?: string | null
  }): Promise<void> {
    if (!fonts) return
    
    // Carregar via URL única do Google Fonts (mais eficiente)
    if (fonts.googleFontsUrl) {
      await this.loadGoogleFontUrl(fonts.googleFontsUrl)
    }
    
    // Carregar cada fonte do Google individualmente se não tiver URL única
    if (fonts.googleFonts && !fonts.googleFontsUrl) {
      for (const font of fonts.googleFonts) {
        const url = `https://fonts.googleapis.com/css2?family=${font.family.replace(/\s+/g, '+')}:wght@${font.weights.join(';')}&display=swap`
        await this.loadGoogleFontUrl(url)
      }
    }
    
    // Marcar fontes como carregadas
    if (fonts.googleFonts) {
      for (const font of fonts.googleFonts) {
        for (const weight of font.weights) {
          this.loadedFonts.add(`${font.family}-${weight}`)
        }
      }
    }
    
    console.log('[FontEngine] Template fonts loaded:', {
      googleFonts: fonts.googleFonts?.map(f => f.family) || [],
      customFonts: fonts.customFonts || [],
    })
  }
  
  /**
   * Carrega uma URL do Google Fonts
   */
  private async loadGoogleFontUrl(url: string): Promise<void> {
    const linkId = 'gfont-' + url.split('family=')[1]?.split('&')[0]?.replace(/[^a-zA-Z0-9]/g, '-') || 'custom'
    if (document.getElementById(linkId)) return
    
    return new Promise((resolve, reject) => {
      const link = document.createElement('link')
      link.id = linkId
      link.rel = 'stylesheet'
      link.href = url
      link.onload = () => {
        console.log('[FontEngine] Loaded Google Font:', url)
        resolve()
      }
      link.onerror = () => {
        console.warn('[FontEngine] Failed to load font:', url)
        reject(new Error('Failed to load font'))
      }
      document.head.appendChild(link)
    })
  }
  
  getLoadedFonts(): Set<string> {
    return new Set(this.loadedFonts)
  }
}

export const fontEngine = new FontEngine()

class ImageLoader {
  private cache: Map<string, HTMLImageElement> = new Map()
  private failedUrls: Set<string> = new Set() // Cache failed URLs to avoid retrying
  private loadingPromises: Map<string, Promise<HTMLImageElement | null>> = new Map()
  
  async loadImage(src: string): Promise<HTMLImageElement | null> {
    if (!src) return null
    
    // Return cached image
    if (this.cache.has(src)) return this.cache.get(src)!
    
    // Don't retry failed URLs
    if (this.failedUrls.has(src)) return null
    
    // Return existing loading promise to avoid duplicate requests
    if (this.loadingPromises.has(src)) {
      return this.loadingPromises.get(src)!
    }
    
    const loadPromise = new Promise<HTMLImageElement | null>((resolve) => {
      const img = new Image()
      img.crossOrigin = 'anonymous'
      img.onload = () => { 
        this.cache.set(src, img)
        this.loadingPromises.delete(src)
        resolve(img) 
      }
      img.onerror = () => { 
        this.failedUrls.add(src) // Mark as failed
        this.loadingPromises.delete(src)
        resolve(null) 
      }
      img.src = src
    })
    
    this.loadingPromises.set(src, loadPromise)
    return loadPromise
  }
  
  getCache(): Map<string, HTMLImageElement> { return this.cache }
}

export const imageLoader = new ImageLoader()

function colorToRgba(color: Color): string {
  return 'rgba(' + color.r + ', ' + color.g + ', ' + color.b + ', ' + color.a + ')'
}

function applyFill(
  ctx: CanvasRenderingContext2D, 
  fill: Fill, 
  x: number, 
  y: number, 
  w: number, 
  h: number,
  loadedImages?: Map<string, HTMLImageElement>
): void {
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
  } else if (fill.type === 'IMAGE' && loadedImages) {
    const imageFill = fill as { type: 'IMAGE'; src?: string; scaleMode?: string }
    if (imageFill.src) {
      const img = loadedImages.get(imageFill.src)
      if (img) {
        // Draw image fill with proper scaling
        const imgAspect = img.width / img.height
        const boxAspect = w / h
        let drawX = x, drawY = y, drawW = w, drawH = h
        
        if (imageFill.scaleMode === 'FIT') {
          if (imgAspect > boxAspect) { drawH = w / imgAspect; drawY = y + (h - drawH) / 2 }
          else { drawW = h * imgAspect; drawX = x + (w - drawW) / 2 }
        } else { // FILL (default) - cover the area
          if (imgAspect > boxAspect) { drawW = h * imgAspect; drawX = x + (w - drawW) / 2 }
          else { drawH = w / imgAspect; drawY = y + (h - drawH) / 2 }
        }
        
        ctx.drawImage(img, drawX, drawY, drawW, drawH)
      }
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
  const { ctx, layoutMap, loadedImages, zoom, dpr, centerOffset } = context
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
    if (fill.type === 'IMAGE') {
      applyFill(ctx, fill, x, y, width, height, loadedImages)
    } else if (radius > 0) { 
      drawRoundedRect(ctx, x, y, width, height, radius)
      if (fill.type === 'SOLID') { ctx.fillStyle = colorToRgba(fill.color); ctx.fill() }
    } else { 
      applyFill(ctx, fill, x, y, width, height, loadedImages) 
    }
  })
  if (node.border) { ctx.strokeStyle = colorToRgba(node.border.color); ctx.lineWidth = node.border.width * zoom * dpr; drawRoundedRect(ctx, x, y, width, height, radius); ctx.stroke() }
  node.children.forEach(child => renderNode(child, context))
  ctx.restore()
}

function renderText(node: TextNode, context: RenderContext): void {
  const { ctx, layoutMap, zoom, dpr, centerOffset } = context
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
  
  // Line height calculation - lineHeight is a multiplier (e.g., 1.5)
  const lineHeight = style.lineHeight === 'AUTO' 
    ? fontSize * 1.2 
    : fontSize * style.lineHeight
  
  // Indentation and paragraph spacing
  const indentation = (node.textProps.indentation ?? 0) * zoom * dpr
  const paragraphSpacing = (node.textProps.paragraphSpacing ?? 0) * zoom * dpr
  
  // Word wrap and render - handle newlines first
  const paragraphs = content.split('\n')
  const lineData: { text: string; isParagraphEnd: boolean }[] = []
  
  // Process each paragraph
  paragraphs.forEach((paragraph, paragraphIndex) => {
    if (paragraph === '') {
      // Empty paragraph - add spacing
      lineData.push({ text: '', isParagraphEnd: true })
      return
    }
    
    const words = paragraph.split(' ')
    let line = ''
    
    // Build lines with word wrap
    words.forEach((word) => {
      const testLine = line + (line ? ' ' : '') + word
      const testWidth = measureTextWithSpacing(ctx, testLine, letterSpacing)
      if (testWidth > width - indentation && line) {
        lineData.push({ text: line, isParagraphEnd: false })
        line = word
      } else {
        line = testLine
      }
    })
    // Last line of paragraph
    if (line) {
      const isLastParagraph = paragraphIndex === paragraphs.length - 1
      lineData.push({ text: line, isParagraphEnd: !isLastParagraph })
    }
  })
  
  // Render each line
  let currentY = y
  lineData.forEach((line, lineIndex) => {
    const lineText = line.text
    const isLastLine = lineIndex === lineData.length - 1
    
    // Skip empty lines but add paragraph spacing
    if (lineText === '' && line.isParagraphEnd) {
      currentY += paragraphSpacing > 0 ? paragraphSpacing : lineHeight
      return
    }
    
    // Calculate base X position with indentation
    const baseX = x + indentation
    const effectiveWidth = width - indentation
    
    if (style.textAlign === 'JUSTIFY' && !isLastLine && lineData.length > 1 && lineText.trim()) {
      // Justify: distribute words across width
      renderJustifiedLine(ctx, lineText, baseX, currentY, effectiveWidth, letterSpacing)
    } else {
      // Normal alignment
      let textX = baseX
      if (style.textAlign === 'CENTER') {
        textX = baseX + (effectiveWidth - measureTextWithSpacing(ctx, lineText, letterSpacing)) / 2
      } else if (style.textAlign === 'RIGHT') {
        textX = baseX + effectiveWidth - measureTextWithSpacing(ctx, lineText, letterSpacing)
      }
      renderTextWithSpacing(ctx, lineText, textX, currentY, letterSpacing)
    }
    
    currentY += lineHeight
    // Add paragraph spacing after paragraph ends
    if (line.isParagraphEnd && paragraphSpacing > 0) {
      currentY += paragraphSpacing
    }
  })
  
  ctx.restore()
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
  const { ctx, layoutMap, loadedImages, zoom, dpr, centerOffset } = context
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
      // Contain - fit inside container
      if (imgAspect > boxAspect) { drawH = width / imgAspect; drawY = y + (height - drawH) / 2 }
      else { drawW = height * imgAspect; drawX = x + (width - drawW) / 2 }
      ctx.drawImage(img, drawX, drawY, drawW, drawH)
    } else if (node.imageProps.objectFit === 'CROP') {
      // Crop with transform matrix from Figma
      // imageTransform is [[scaleX, skewX, tx], [skewY, scaleY, ty]]
      const transform = (node.imageProps as { imageTransform?: [[number, number, number], [number, number, number]] }).imageTransform
      
      if (transform) {
        // Extract scale and translation from transform matrix
        const scaleX = transform[0][0]
        const scaleY = transform[1][1]
        const tx = transform[0][2]
        const ty = transform[1][2]
        
        // Calculate the scaled image dimensions
        // scaleX/scaleY represent how much of the image is visible (e.g., 0.5 = 50% visible)
        drawW = width / scaleX
        drawH = height / scaleY
        
        // tx/ty are the offset in normalized coordinates (0-1)
        // They represent where the top-left of the visible area starts on the image
        drawX = x - (tx * drawW)
        drawY = y - (ty * drawH)
      } else {
        // Fallback to position-based crop
        if (imgAspect > boxAspect) { drawW = height * imgAspect; drawX = x + (width - drawW) * node.imageProps.objectPosition.x }
        else { drawH = width / imgAspect; drawY = y + (height - drawH) * node.imageProps.objectPosition.y }
      }
      ctx.drawImage(img, drawX, drawY, drawW, drawH)
    } else if (node.imageProps.objectFit === 'TILE') {
      // Tile - repeat the image
      const scalingFactor = (node.imageProps as { scalingFactor?: number }).scalingFactor || 1
      const tileW = img.width * scalingFactor * zoom * dpr
      const tileH = img.height * scalingFactor * zoom * dpr
      for (let ty = y; ty < y + height; ty += tileH) {
        for (let tx = x; tx < x + width; tx += tileW) {
          ctx.drawImage(img, tx, ty, tileW, tileH)
        }
      }
    } else {
      // FILL (default) - cover the container (like CSS object-fit: cover)
      if (imgAspect > boxAspect) { drawW = height * imgAspect; drawX = x + (width - drawW) / 2 }
      else { drawH = width / imgAspect; drawY = y + (height - drawH) / 2 }
      ctx.drawImage(img, drawX, drawY, drawW, drawH)
    }
  } else {
    ctx.fillStyle = '#f0f0f0'; ctx.fillRect(x, y, width, height)
    ctx.fillStyle = '#999'; ctx.font = (24 * zoom * dpr) + 'px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
    ctx.fillText('IMG', x + width / 2, y + height / 2)
  }
  ctx.restore()
}

function renderRectangle(node: RectangleNode, context: RenderContext): void {
  const { ctx, layoutMap, zoom, dpr, centerOffset } = context
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
}

function renderEllipse(node: EllipseNode, context: RenderContext): void {
  const { ctx, layoutMap, zoom, dpr, centerOffset } = context
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
}

/**
 * Render a VectorNode using SVG path data
 */
function renderVector(node: VectorNode, context: RenderContext): void {
  const { ctx, layoutMap, zoom, dpr, centerOffset } = context
  const layout = layoutMap.get(node.id)
  if (!layout) return
  
  const x = layout.x * zoom * dpr + centerOffset.x * dpr
  const y = layout.y * zoom * dpr + centerOffset.y * dpr
  const scaleX = (layout.width / node.size.width) * zoom * dpr
  const scaleY = (layout.height / node.size.height) * zoom * dpr
  
  ctx.save()
  ctx.globalAlpha = node.opacity
  ctx.translate(x, y)
  ctx.scale(scaleX, scaleY)
  
  // Render fill paths
  if (node.fillPaths && node.fillPaths.length > 0) {
    for (const fill of node.fills) {
      if (fill.type === 'SOLID') {
        ctx.fillStyle = colorToRgba(fill.color)
      }
    }
    
    for (const pathData of node.fillPaths) {
      const path = new Path2D(pathData.path)
      ctx.fill(path, pathData.windingRule === 'EVENODD' ? 'evenodd' : 'nonzero')
    }
  }
  
  // Render stroke paths
  // For Dynamic/Brush strokes, strokeGeometry contains filled shapes (not lines to stroke)
  if (node.strokePaths && node.strokePaths.length > 0) {
    // Check if this is a Dynamic/Brush stroke (should be filled, not stroked)
    const strokeIsFilled = node.strokeIsFilled
    
    if (strokeIsFilled) {
      // Fill the stroke paths (for Dynamic/Brush strokes)
      // Get stroke color from border or use a default
      const strokeColor = node.border ? colorToRgba(node.border.color) : '#000000'
      ctx.fillStyle = strokeColor
      for (const pathData of node.strokePaths) {
        const path = new Path2D(pathData.path)
        ctx.fill(path, pathData.windingRule === 'EVENODD' ? 'evenodd' : 'nonzero')
      }
    } else if (node.border) {
      // Normal stroke rendering (requires border)
      const strokeColor = colorToRgba(node.border.color)
      ctx.strokeStyle = strokeColor
      ctx.lineWidth = node.border.width / zoom // Adjust for scale
      ctx.lineCap = node.strokeCap === 'ROUND' ? 'round' : node.strokeCap === 'SQUARE' ? 'square' : 'butt'
      ctx.lineJoin = node.strokeJoin === 'ROUND' ? 'round' : node.strokeJoin === 'BEVEL' ? 'bevel' : 'miter'
      if (node.strokeMiterLimit) ctx.miterLimit = node.strokeMiterLimit
      if (node.dashPattern && node.dashPattern.length > 0) {
        ctx.setLineDash(node.dashPattern)
      }
      
      for (const pathData of node.strokePaths) {
        const path = new Path2D(pathData.path)
        ctx.stroke(path)
      }
    }
  } else if (node.border && node.fillPaths && node.fillPaths.length > 0) {
    // If no stroke paths but has border, stroke the fill paths
    ctx.strokeStyle = colorToRgba(node.border.color)
    ctx.lineWidth = node.border.width / zoom
    for (const pathData of node.fillPaths) {
      const path = new Path2D(pathData.path)
      ctx.stroke(path)
    }
  }
  
  ctx.restore()
}

function renderNode(node: SceneNode, context: RenderContext): void {
  if (!node.visible) return
  switch (node.type) {
    case 'FRAME': renderFrame(node as FrameNode, context); break
    case 'TEXT': renderText(node as TextNode, context); break
    case 'IMAGE': renderImage(node as ImageNode, context); break
    case 'RECTANGLE': renderRectangle(node as RectangleNode, context); break
    case 'ELLIPSE': renderEllipse(node as EllipseNode, context); break
    case 'VECTOR': renderVector(node as VectorNode, context); break
  }
}

/**
 * Collect all image sources from the scene tree
 * Includes IMAGE nodes and FRAME nodes with image fills
 */
function collectImageSources(node: SceneNode): string[] {
  const sources: string[] = []
  
  // Collect from IMAGE nodes
  if (node.type === 'IMAGE') {
    const imageNode = node as ImageNode
    if (imageNode.imageProps?.src) {
      sources.push(imageNode.imageProps.src)
    }
  }
  
  // Collect from FRAME nodes (image fills and children)
  if (node.type === 'FRAME') {
    const frameNode = node as FrameNode
    
    // Check for image fills
    for (const fill of frameNode.fills) {
      if (fill.type === 'IMAGE') {
        const imageFill = fill as { type: 'IMAGE'; src?: string }
        if (imageFill.src) {
          sources.push(imageFill.src)
        }
      }
    }
    
    // Recurse into children
    for (const child of frameNode.children) {
      sources.push(...collectImageSources(child))
    }
  }
  
  return sources
}

// Legacy function for backward compatibility
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

// Cache for layout calculations to avoid recalculating on every render
let cachedLayoutRootId: string | null = null
let cachedLayoutMap: Map<string, ComputedLayout> | null = null
let cachedRootNodeHash: string | null = null

// Simple hash function to detect structural changes in rootNode
function hashRootNode(rootNode: FrameNode): string {
  // Hash based on node count and root dimensions - fast approximation
  let nodeCount = 0
  function countNodes(node: SceneNode): void {
    nodeCount++
    if (node.type === 'FRAME') {
      (node as FrameNode).children.forEach(countNodes)
    }
  }
  countNodes(rootNode)
  return `${rootNode.id}-${rootNode.size.width}-${rootNode.size.height}-${nodeCount}`
}

/**
 * Calculate layout only - call this when rootNode changes
 */
export function calculateSceneLayout(rootNode: FrameNode): Map<string, ComputedLayout> {
  const newHash = hashRootNode(rootNode)
  
  // Return cached layout if rootNode hasn't changed
  if (cachedLayoutRootId === rootNode.id && cachedLayoutMap && cachedRootNodeHash === newHash) {
    // Using cached layout
    return cachedLayoutMap
  }
  
  // Recalculating layout
  
  // Calculate new layout
  const computedLayout = calculateLayout(rootNode)
  const layoutMap = createLayoutMap(computedLayout)
  
  // Cache the result
  cachedLayoutRootId = rootNode.id
  cachedLayoutMap = layoutMap
  cachedRootNodeHash = newHash
  
  // Layout calculated
  
  return layoutMap
}

/**
 * Clear the layout cache - call when template changes
 */
export function clearLayoutCache(): void {
  cachedLayoutRootId = null
  cachedLayoutMap = null
  cachedRootNodeHash = null
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
    layoutMap?: Map<string, ComputedLayout> // Optional pre-calculated layout
  } = {}
): Promise<Map<string, ComputedLayout>> {
  const ctx = canvas.getContext('2d')
  if (!ctx) return new Map()
  
  const dpr = window.devicePixelRatio || 1
  const zoom = options.zoom ?? 1
  const centerOffset = options.centerOffset ?? { x: 0, y: 0 }
  
  // renderScene called
  
  const displayWidth = canvas.clientWidth
  const displayHeight = canvas.clientHeight
  canvas.width = displayWidth * dpr
  canvas.height = displayHeight * dpr
  
  ctx.fillStyle = '#e4e4e7' // zinc-300
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  
  // Use provided layoutMap or calculate (with caching)
  const layoutMap = options.layoutMap ?? calculateSceneLayout(rootNode)
  
  const loadedImages = imageLoader.getCache()
  
  // Collect all image sources (from IMAGE nodes and FRAME fills)
  const imageSources = collectImageSources(rootNode)
  await Promise.all(imageSources.map(src => imageLoader.loadImage(src)))
  
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
