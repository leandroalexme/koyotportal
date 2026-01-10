/**
 * Canvas Engine V2 - Renderização com suporte a CanvasKit (Skia)
 * 
 * Esta versão suporta dois backends:
 * - Canvas2D (padrão, compatibilidade)
 * - CanvasKit/Skia (WebGL, alta performance)
 * 
 * O backend CanvasKit oferece:
 * - Renderização GPU acelerada
 * - Transformações de perspectiva (para mockups)
 * - BlendModes avançados
 * - Melhor qualidade de texto
 */

import { 
  createRenderContext, 
  type IRenderContext, 
  type RenderBackendType,
  type RenderContextOptions,
} from './render'
import { type ComputedLayout } from './yoga-adapter'
import { calculateLayout, createLayoutMap } from './yoga-adapter'
import type { FrameNode, SceneNode, TextNode, ImageNode, Fill, SolidFill, Color } from '@/types/studio'

// Constants
const MIN_ZOOM = 0.1
const MAX_ZOOM = 5

export type RenderBackend = 'canvas2d' | 'canvaskit'

interface CanvasEngineV2Options {
  canvas: HTMLCanvasElement
  container: HTMLDivElement
  rootNode: FrameNode
  backend?: RenderBackend
  onReady?: (backend: RenderBackendType) => void
  onZoomChange?: (zoom: number) => void
  onPanChange?: (offset: { x: number; y: number }) => void
}

interface ViewportState {
  zoom: number
  panOffset: { x: number; y: number }
  containerSize: { width: number; height: number }
}

export class CanvasEngineV2 {
  private canvas: HTMLCanvasElement
  private container: HTMLDivElement
  private rootNode: FrameNode
  
  // Render context abstraction
  private renderContext: IRenderContext | null = null
  private currentBackend: RenderBackendType = 'canvas2d'
  
  // Promise that resolves when engine is ready
  readonly ready: Promise<void>
  
  private viewport: ViewportState = {
    zoom: 1,
    panOffset: { x: 0, y: 0 },
    containerSize: { width: 0, height: 0 },
  }
  
  private layoutCache: Map<string, ComputedLayout> | null = null
  private imageCache: Map<string, HTMLImageElement> = new Map()
  
  private animationFrameId: number | null = null
  private resizeObserver: ResizeObserver | null = null
  private destroyed: boolean = false
  
  // Callbacks
  private onZoomChange?: (zoom: number) => void
  private onPanChange?: (offset: { x: number; y: number }) => void
  
  constructor(options: CanvasEngineV2Options) {
    this.canvas = options.canvas
    this.container = options.container
    this.rootNode = options.rootNode
    this.onZoomChange = options.onZoomChange
    this.onPanChange = options.onPanChange
    
    // Initialize render context asynchronously
    this.ready = this.initRenderContext(options.backend, options.onReady)
  }
  
  private async initRenderContext(
    preferredBackend?: RenderBackend,
    onReady?: (backend: RenderBackendType) => void,
  ): Promise<void> {
    const options: RenderContextOptions = {
      forceBackend: preferredBackend === 'canvaskit' ? 'webgl' : 'canvas2d',
      onBackendReady: (backend) => {
        this.currentBackend = backend
        onReady?.(backend)
      },
    }
    
    try {
      const { context, backend } = await createRenderContext(this.canvas, options)
      this.renderContext = context
      this.currentBackend = backend
      
      // Setup resize observer
      this.resizeObserver = new ResizeObserver(() => {
        this.updateContainerSize()
        this.render()
      })
      this.resizeObserver.observe(this.container)
      
      // Initial size
      this.updateContainerSize()
      
      // Initial render
      this.render()
    } catch (error) {
      console.error('[Koyot] Failed to initialize render context:', error)
      throw error
    }
  }
  
  private updateContainerSize(): void {
    this.viewport.containerSize = {
      width: this.container.clientWidth,
      height: this.container.clientHeight,
    }
    
    // Update canvas size
    const dpr = window.devicePixelRatio || 1
    this.canvas.width = this.viewport.containerSize.width * dpr
    this.canvas.height = this.viewport.containerSize.height * dpr
  }
  
  // ============================================
  // PUBLIC API
  // ============================================
  
  get backend(): RenderBackendType {
    return this.currentBackend
  }
  
  get isCanvasKit(): boolean {
    return this.currentBackend === 'webgl'
  }
  
  setRootNode(rootNode: FrameNode): void {
    this.rootNode = rootNode
    this.layoutCache = null
    this.render()
  }
  
  setZoom(zoom: number): void {
    const newZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, zoom))
    if (Math.abs(this.viewport.zoom - newZoom) > 0.001) {
      this.viewport.zoom = newZoom
      this.render()
      this.onZoomChange?.(newZoom)
    }
  }
  
  getZoom(): number {
    return this.viewport.zoom
  }
  
  setPanOffset(offset: { x: number; y: number }): void {
    this.viewport.panOffset = offset
    this.render()
    this.onPanChange?.(offset)
  }
  
  getPanOffset(): { x: number; y: number } {
    return { ...this.viewport.panOffset }
  }
  
  /**
   * Get the render context for advanced operations
   */
  getRenderContext(): IRenderContext | null {
    return this.renderContext
  }
  
  // ============================================
  // RENDER
  // ============================================
  
  render(): void {
    if (this.destroyed || !this.renderContext) return
    if (this.viewport.containerSize.width === 0) return
    
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId)
    }
    
    this.animationFrameId = requestAnimationFrame(() => {
      if (this.destroyed || !this.renderContext) return
      this.doRender()
    })
  }
  
  private doRender(): void {
    const ctx = this.renderContext!
    const { zoom, panOffset, containerSize } = this.viewport
    const dpr = window.devicePixelRatio || 1
    
    // Calculate layout if needed
    if (!this.layoutCache) {
      const computedLayout = calculateLayout(this.rootNode)
      this.layoutCache = createLayoutMap(computedLayout)
    }
    
    // Clear canvas
    ctx.fillStyle = '#e4e4e7' // zinc-300
    ctx.fillRect(0, 0, containerSize.width * dpr, containerSize.height * dpr)
    
    // Calculate center offset
    const artWidth = this.rootNode.size.width * zoom
    const artHeight = this.rootNode.size.height * zoom
    const centerOffset = {
      x: (containerSize.width - artWidth) / 2 + panOffset.x,
      y: (containerSize.height - artHeight) / 2 + panOffset.y,
    }
    
    // Draw artboard shadow
    ctx.save()
    const shadowX = centerOffset.x * dpr
    const shadowY = centerOffset.y * dpr
    const shadowW = artWidth * dpr
    const shadowH = artHeight * dpr
    
    // Simple shadow (CanvasKit doesn't support shadow directly on context)
    ctx.fillStyle = 'rgba(0, 0, 0, 0.1)'
    ctx.fillRect(shadowX + 4 * dpr, shadowY + 4 * dpr, shadowW, shadowH)
    ctx.restore()
    
    // Render scene
    this.renderNode(this.rootNode, {
      zoom,
      dpr,
      centerOffset,
      layoutMap: this.layoutCache,
    })
    
    // Flush for CanvasKit
    ctx.flush()
  }
  
  private renderNode(
    node: SceneNode,
    options: {
      zoom: number
      dpr: number
      centerOffset: { x: number; y: number }
      layoutMap: Map<string, ComputedLayout>
    },
  ): void {
    if (!node.visible) return
    
    const ctx = this.renderContext!
    const { zoom, dpr, centerOffset, layoutMap } = options
    const layout = layoutMap.get(node.id)
    if (!layout) return
    
    const x = layout.x * zoom * dpr + centerOffset.x * dpr
    const y = layout.y * zoom * dpr + centerOffset.y * dpr
    const width = layout.width * zoom * dpr
    const height = layout.height * zoom * dpr
    
    ctx.save()
    ctx.globalAlpha = node.opacity
    
    switch (node.type) {
      case 'FRAME':
        this.renderFrame(node as FrameNode, x, y, width, height, options)
        break
      case 'TEXT':
        this.renderText(node as TextNode, x, y, width, height, options)
        break
      case 'IMAGE':
        this.renderImage(node as ImageNode, x, y, width, height)
        break
      case 'RECTANGLE':
        this.renderRectangle(node, x, y, width, height, options)
        break
      case 'ELLIPSE':
        this.renderEllipse(node, x, y, width, height)
        break
    }
    
    ctx.restore()
  }
  
  private renderFrame(
    node: FrameNode,
    x: number,
    y: number,
    width: number,
    height: number,
    options: {
      zoom: number
      dpr: number
      centerOffset: { x: number; y: number }
      layoutMap: Map<string, ComputedLayout>
    },
  ): void {
    const ctx = this.renderContext!
    const { zoom, dpr } = options
    
    const radius = (typeof node.cornerRadius === 'number' 
      ? node.cornerRadius 
      : node.cornerRadius.topLeft) * zoom * dpr
    
    // Clip if needed
    if (node.clipsContent && radius > 0) {
      ctx.beginPath()
      ctx.roundRect(x, y, width, height, radius)
      ctx.clip()
    }
    
    // Render fills
    for (const fill of node.fills) {
      this.applyFill(fill, x, y, width, height, radius)
    }
    
    // Render border
    if (node.border) {
      ctx.strokeStyle = this.colorToRgba(node.border.color)
      ctx.lineWidth = node.border.width * zoom * dpr
      ctx.beginPath()
      ctx.roundRect(x, y, width, height, radius)
      ctx.stroke()
    }
    
    // Render children
    for (const child of node.children) {
      this.renderNode(child, options)
    }
  }
  
  private renderText(
    node: TextNode,
    x: number,
    y: number,
    _width: number,
    _height: number,
    options: { zoom: number; dpr: number },
  ): void {
    const ctx = this.renderContext!
    const { zoom, dpr } = options
    const { style, content } = node.textProps
    
    const fontSize = style.fontSize * zoom * dpr
    const fontStyle = style.fontStyle === 'italic' ? 'italic ' : ''
    
    ctx.font = `${fontStyle}${style.fontWeight} ${fontSize}px "${style.fontFamily}", sans-serif`
    ctx.textBaseline = 'top'
    
    // Text fill color
    const textFill = node.fills.find(f => f.type === 'SOLID') as SolidFill | undefined
    ctx.fillStyle = textFill ? this.colorToRgba(textFill.color) : '#000000'
    
    // Simple text render (word wrap would be more complex)
    const lineHeight = style.lineHeight === 'AUTO' 
      ? fontSize * 1.2 
      : fontSize * style.lineHeight
    
    const lines = content.split('\n')
    let currentY = y
    
    for (const line of lines) {
      ctx.fillText(line, x, currentY)
      currentY += lineHeight
    }
  }
  
  private renderImage(
    node: ImageNode,
    x: number,
    y: number,
    width: number,
    height: number,
  ): void {
    const ctx = this.renderContext!
    const src = node.imageProps?.src
    
    if (!src) {
      // Placeholder
      ctx.fillStyle = '#f0f0f0'
      ctx.fillRect(x, y, width, height)
      return
    }
    
    // Check cache
    let img = this.imageCache.get(src)
    if (!img) {
      // Load image async
      img = new Image()
      img.crossOrigin = 'anonymous'
      img.onload = () => {
        this.imageCache.set(src, img!)
        this.render() // Re-render when loaded
      }
      img.src = src
      
      // Show placeholder while loading
      ctx.fillStyle = '#f0f0f0'
      ctx.fillRect(x, y, width, height)
      return
    }
    
    // Draw image
    ctx.drawImage(img, x, y, width, height)
  }
  
  private renderRectangle(
    node: SceneNode,
    x: number,
    y: number,
    width: number,
    height: number,
    options: { zoom: number; dpr: number },
  ): void {
    const ctx = this.renderContext!
    const { zoom, dpr } = options
    
    const rectNode = node as { cornerRadius?: number | { topLeft: number }; fills: Fill[]; border?: { color: Color; width: number } }
    const radius = (typeof rectNode.cornerRadius === 'number' 
      ? rectNode.cornerRadius 
      : rectNode.cornerRadius?.topLeft ?? 0) * zoom * dpr
    
    for (const fill of rectNode.fills) {
      this.applyFill(fill, x, y, width, height, radius)
    }
    
    if (rectNode.border) {
      ctx.strokeStyle = this.colorToRgba(rectNode.border.color)
      ctx.lineWidth = rectNode.border.width * zoom * dpr
      ctx.beginPath()
      ctx.roundRect(x, y, width, height, radius)
      ctx.stroke()
    }
  }
  
  private renderEllipse(
    node: SceneNode,
    x: number,
    y: number,
    width: number,
    height: number,
  ): void {
    const ctx = this.renderContext!
    
    const ellipseNode = node as { fills: Fill[]; border?: { color: Color; width: number } }
    const cx = x + width / 2
    const cy = y + height / 2
    
    for (const fill of ellipseNode.fills) {
      if (fill.type === 'SOLID') {
        ctx.fillStyle = this.colorToRgba((fill as SolidFill).color)
        ctx.beginPath()
        ctx.ellipse(cx, cy, width / 2, height / 2, 0, 0, Math.PI * 2)
        ctx.fill()
      }
    }
    
    if (ellipseNode.border) {
      ctx.strokeStyle = this.colorToRgba(ellipseNode.border.color)
      ctx.beginPath()
      ctx.ellipse(cx, cy, width / 2, height / 2, 0, 0, Math.PI * 2)
      ctx.stroke()
    }
  }
  
  private applyFill(
    fill: Fill,
    x: number,
    y: number,
    width: number,
    height: number,
    radius: number,
  ): void {
    const ctx = this.renderContext!
    
    if (fill.type === 'SOLID') {
      ctx.fillStyle = this.colorToRgba((fill as SolidFill).color)
      ctx.beginPath()
      ctx.roundRect(x, y, width, height, radius)
      ctx.fill()
    }
  }
  
  private colorToRgba(color: Color): string {
    return `rgba(${color.r}, ${color.g}, ${color.b}, ${color.a})`
  }
  
  // ============================================
  // CLEANUP
  // ============================================
  
  destroy(): void {
    this.destroyed = true
    this.resizeObserver?.disconnect()
    
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId)
      this.animationFrameId = null
    }
    
    // Cleanup CanvasKit resources if using that backend
    if (this.renderContext && 'destroy' in this.renderContext) {
      (this.renderContext as { destroy: () => void }).destroy()
    }
  }
}
