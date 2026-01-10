/**
 * MockupRenderer
 * 
 * Renderizador de mockups com suporte a:
 * - Transformações de perspectiva (homografia)
 * - Camadas (base, template, overlay)
 * - Blend modes (multiply, overlay, etc.)
 * - CanvasKit (GPU) e Canvas2D (fallback)
 */

import type { CanvasKit, Surface as SkSurface, Canvas as SkCanvas, Image as SkImage } from 'canvaskit-wasm'
import {
  type MockupDefinition,
  type MockupLayer,
  type MockupInsertArea,
  type TemplateSnapshot,
  type MockupBlendMode,
  type Point2D,
} from './types'
import {
  rectToQuadMatrix,
  matrixToCanvasKit,
  applyPerspectiveCanvas2D,
} from './perspective-transform'
import { loadCanvasKit, getCanvasKit } from '../render/canvaskit-loader'

/**
 * Opções para inicialização do MockupRenderer
 */
export interface MockupRendererOptions {
  /** Preferir CanvasKit (WebGL) se disponível */
  preferCanvasKit?: boolean
  /** Número de subdivisões para perspectiva em Canvas2D */
  canvas2dSubdivisions?: number
  /** Callback quando backend estiver pronto */
  onReady?: (backend: 'canvaskit' | 'canvas2d') => void
}

/**
 * Resultado de renderização
 */
export interface RenderResult {
  canvas: HTMLCanvasElement
  renderTimeMs: number
  backend: 'canvaskit' | 'canvas2d'
}

/**
 * Cache de imagens carregadas
 */
interface ImageCache {
  htmlImages: Map<string, HTMLImageElement>
  skImages: Map<string, SkImage>
}

export class MockupRenderer {
  private ck: CanvasKit | null = null
  private surface: SkSurface | null = null
  private skCanvas: SkCanvas | null = null
  
  private outputCanvas: HTMLCanvasElement
  private ctx2d: CanvasRenderingContext2D | null = null
  
  private imageCache: ImageCache = {
    htmlImages: new Map(),
    skImages: new Map(),
  }
  
  private backend: 'canvaskit' | 'canvas2d' = 'canvas2d'
  private subdivisions: number = 8
  private isInitialized = false
  
  readonly ready: Promise<void>
  
  constructor(options: MockupRendererOptions = {}) {
    this.outputCanvas = document.createElement('canvas')
    this.subdivisions = options.canvas2dSubdivisions ?? 8
    
    this.ready = this.initialize(options)
  }
  
  private async initialize(options: MockupRendererOptions): Promise<void> {
    if (options.preferCanvasKit !== false) {
      try {
        await loadCanvasKit()
        this.ck = getCanvasKit()
        this.backend = 'canvaskit'
        console.log('[MockupRenderer] Usando CanvasKit (GPU)')
      } catch (error) {
        console.warn('[MockupRenderer] CanvasKit não disponível, usando Canvas2D:', error)
        this.backend = 'canvas2d'
      }
    } else {
      this.backend = 'canvas2d'
    }
    
    if (this.backend === 'canvas2d') {
      this.ctx2d = this.outputCanvas.getContext('2d')
    }
    
    this.isInitialized = true
    options.onReady?.(this.backend)
  }
  
  /**
   * Renderiza um mockup completo
   */
  async render(
    definition: MockupDefinition,
    templateSnapshots: Map<number, TemplateSnapshot>
  ): Promise<RenderResult> {
    await this.ready
    
    const startTime = performance.now()
    
    // Configurar canvas de saída
    const { width, height } = definition.canvasSize
    this.outputCanvas.width = width
    this.outputCanvas.height = height
    
    if (this.backend === 'canvaskit' && this.ck) {
      await this.renderWithCanvasKit(definition, templateSnapshots)
    } else {
      await this.renderWithCanvas2D(definition, templateSnapshots)
    }
    
    const renderTimeMs = performance.now() - startTime
    
    return {
      canvas: this.outputCanvas,
      renderTimeMs,
      backend: this.backend,
    }
  }
  
  /**
   * Renderização usando CanvasKit (GPU)
   */
  private async renderWithCanvasKit(
    definition: MockupDefinition,
    templateSnapshots: Map<number, TemplateSnapshot>
  ): Promise<void> {
    const ck = this.ck!
    const { width, height } = definition.canvasSize
    
    // Criar surface se necessário
    if (!this.surface || this.surface.width() !== width || this.surface.height() !== height) {
      this.surface?.delete()
      this.surface = ck.MakeSurface(width, height)
      if (!this.surface) {
        throw new Error('[MockupRenderer] Falha ao criar surface')
      }
    }
    
    const canvas = this.surface.getCanvas()
    canvas.clear(ck.TRANSPARENT)
    
    // 1. Desenhar camada base
    await this.drawLayerCanvasKit(canvas, definition.layers.base)
    
    // 2. Desenhar templates nas áreas de inserção
    for (let i = 0; i < definition.insertAreas.length; i++) {
      const area = definition.insertAreas[i]
      const snapshot = templateSnapshots.get(i)
      
      if (snapshot) {
        await this.drawTemplateCanvasKit(canvas, snapshot, area)
      }
    }
    
    // 3. Desenhar overlay (sombras/luz)
    if (definition.layers.overlay) {
      await this.drawLayerCanvasKit(
        canvas, 
        definition.layers.overlay,
        definition.layers.overlay.blendMode
      )
    }
    
    // Copiar para canvas de saída
    const snapshot = this.surface.makeImageSnapshot()
    const pixels = snapshot.readPixels(0, 0, {
      width,
      height,
      colorType: ck.ColorType.RGBA_8888,
      alphaType: ck.AlphaType.Unpremul,
      colorSpace: ck.ColorSpace.SRGB,
    })
    snapshot.delete()
    
    if (pixels) {
      const imageData = new ImageData(new Uint8ClampedArray(pixels), width, height)
      const ctx = this.outputCanvas.getContext('2d')!
      ctx.putImageData(imageData, 0, 0)
    }
  }
  
  /**
   * Desenha uma camada usando CanvasKit
   */
  private async drawLayerCanvasKit(
    canvas: SkCanvas,
    layer: MockupLayer,
    blendMode?: MockupBlendMode
  ): Promise<void> {
    const ck = this.ck!
    const image = await this.loadSkImage(layer.src)
    if (!image) return
    
    const paint = new ck.Paint()
    paint.setAntiAlias(true)
    
    if (layer.opacity !== undefined) {
      paint.setAlphaf(layer.opacity)
    }
    
    if (blendMode) {
      const ckBlendMode = this.mapBlendMode(blendMode)
      if (ckBlendMode) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        paint.setBlendMode(ckBlendMode as any)
      }
    }
    
    canvas.drawImage(image, 0, 0, paint)
    paint.delete()
  }
  
  /**
   * Desenha template com perspectiva usando CanvasKit
   */
  private async drawTemplateCanvasKit(
    canvas: SkCanvas,
    snapshot: TemplateSnapshot,
    area: MockupInsertArea
  ): Promise<void> {
    const ck = this.ck!
    
    // Converter snapshot para SkImage
    const skImage = await this.snapshotToSkImage(snapshot)
    if (!skImage) return
    
    // Calcular matriz de perspectiva
    const matrix = rectToQuadMatrix(snapshot.width, snapshot.height, area.quad)
    if (!matrix) {
      console.warn('[MockupRenderer] Falha ao calcular matriz de perspectiva')
      return
    }
    
    canvas.save()
    
    // Aplicar rotação adicional se especificada
    if (area.rotation) {
      const center = this.getQuadCenter(area.quad)
      canvas.rotate(area.rotation, center.x, center.y)
    }
    
    // Aplicar transformação de perspectiva
    const ckMatrix = matrixToCanvasKit(matrix)
    canvas.concat(ckMatrix)
    
    // Desenhar imagem
    const paint = new ck.Paint()
    paint.setAntiAlias(true)
    
    if (area.opacity !== undefined) {
      paint.setAlphaf(area.opacity)
    }
    
    canvas.drawImage(skImage, 0, 0, paint)
    
    paint.delete()
    canvas.restore()
    
    // Limpar SkImage temporária
    skImage.delete()
  }
  
  /**
   * Renderização usando Canvas2D (fallback)
   */
  private async renderWithCanvas2D(
    definition: MockupDefinition,
    templateSnapshots: Map<number, TemplateSnapshot>
  ): Promise<void> {
    const ctx = this.ctx2d!
    const { width, height } = definition.canvasSize
    
    ctx.clearRect(0, 0, width, height)
    
    // 1. Desenhar camada base
    await this.drawLayerCanvas2D(ctx, definition.layers.base)
    
    // 2. Desenhar templates nas áreas de inserção
    for (let i = 0; i < definition.insertAreas.length; i++) {
      const area = definition.insertAreas[i]
      const snapshot = templateSnapshots.get(i)
      
      if (snapshot) {
        await this.drawTemplateCanvas2D(ctx, snapshot, area)
      }
    }
    
    // 3. Desenhar overlay (sombras/luz)
    if (definition.layers.overlay) {
      await this.drawLayerCanvas2D(
        ctx,
        definition.layers.overlay,
        definition.layers.overlay.blendMode
      )
    }
  }
  
  /**
   * Desenha uma camada usando Canvas2D
   */
  private async drawLayerCanvas2D(
    ctx: CanvasRenderingContext2D,
    layer: MockupLayer,
    blendMode?: MockupBlendMode
  ): Promise<void> {
    const image = await this.loadHtmlImage(layer.src)
    if (!image) return
    
    ctx.save()
    
    if (layer.opacity !== undefined) {
      ctx.globalAlpha = layer.opacity
    }
    
    if (blendMode) {
      ctx.globalCompositeOperation = this.mapBlendModeToCSS(blendMode)
    }
    
    ctx.drawImage(image, 0, 0)
    ctx.restore()
  }
  
  /**
   * Desenha template com perspectiva usando Canvas2D
   */
  private async drawTemplateCanvas2D(
    ctx: CanvasRenderingContext2D,
    snapshot: TemplateSnapshot,
    area: MockupInsertArea
  ): Promise<void> {
    // Validar snapshot
    if (snapshot.width <= 0 || snapshot.height <= 0) {
      console.warn('[MockupRenderer] Snapshot inválido, ignorando')
      return
    }
    
    // Converter snapshot para canvas/image
    const sourceImage = await this.snapshotToCanvasSource(snapshot)
    if (!sourceImage) {
      console.warn('[MockupRenderer] Não foi possível converter snapshot para imagem')
      return
    }
    
    ctx.save()
    
    if (area.opacity !== undefined) {
      ctx.globalAlpha = area.opacity
    }
    
    // Aplicar rotação adicional se especificada
    if (area.rotation) {
      const center = this.getQuadCenter(area.quad)
      ctx.translate(center.x, center.y)
      ctx.rotate((area.rotation * Math.PI) / 180)
      ctx.translate(-center.x, -center.y)
    }
    
    try {
      // Usar aproximação por subdivisão de triângulos para perspectiva
      applyPerspectiveCanvas2D(
        ctx,
        sourceImage,
        snapshot.width,
        snapshot.height,
        area.quad,
        this.subdivisions
      )
    } catch (error) {
      console.warn('[MockupRenderer] Erro ao aplicar perspectiva:', error)
    }
    
    ctx.restore()
  }
  
  /**
   * Carrega imagem HTML (com cache)
   */
  private async loadHtmlImage(src: string): Promise<HTMLImageElement | null> {
    if (this.imageCache.htmlImages.has(src)) {
      return this.imageCache.htmlImages.get(src)!
    }
    
    return new Promise((resolve) => {
      const img = new Image()
      img.crossOrigin = 'anonymous'
      img.onload = () => {
        this.imageCache.htmlImages.set(src, img)
        resolve(img)
      }
      img.onerror = () => {
        console.warn(`[MockupRenderer] Falha ao carregar imagem: ${src}`)
        resolve(null)
      }
      img.src = src
    })
  }
  
  /**
   * Carrega imagem SkImage (com cache)
   */
  private async loadSkImage(src: string): Promise<SkImage | null> {
    if (!this.ck) return null
    
    if (this.imageCache.skImages.has(src)) {
      return this.imageCache.skImages.get(src)!
    }
    
    try {
      const response = await fetch(src, { mode: 'cors' })
      const buffer = await response.arrayBuffer()
      const skImage = this.ck.MakeImageFromEncoded(buffer)
      
      if (skImage) {
        this.imageCache.skImages.set(src, skImage)
      }
      
      return skImage
    } catch (error) {
      console.warn(`[MockupRenderer] Falha ao carregar SkImage: ${src}`, error)
      return null
    }
  }
  
  /**
   * Converte TemplateSnapshot para SkImage
   */
  private async snapshotToSkImage(snapshot: TemplateSnapshot): Promise<SkImage | null> {
    if (!this.ck) return null
    
    const { imageData, width, height } = snapshot
    
    if (imageData instanceof ImageData) {
      return this.ck.MakeImage(
        {
          width,
          height,
          alphaType: this.ck.AlphaType.Unpremul,
          colorType: this.ck.ColorType.RGBA_8888,
          colorSpace: this.ck.ColorSpace.SRGB,
        },
        imageData.data,
        width * 4
      )
    }
    
    if (imageData instanceof HTMLCanvasElement) {
      const ctx = imageData.getContext('2d')
      const imgData = ctx?.getImageData(0, 0, width, height)
      if (!imgData) return null
      
      return this.ck.MakeImage(
        {
          width,
          height,
          alphaType: this.ck.AlphaType.Unpremul,
          colorType: this.ck.ColorType.RGBA_8888,
          colorSpace: this.ck.ColorSpace.SRGB,
        },
        imgData.data,
        width * 4
      )
    }
    
    if (imageData instanceof HTMLImageElement) {
      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(imageData, 0, 0)
      const imgData = ctx.getImageData(0, 0, width, height)
      
      return this.ck.MakeImage(
        {
          width,
          height,
          alphaType: this.ck.AlphaType.Unpremul,
          colorType: this.ck.ColorType.RGBA_8888,
          colorSpace: this.ck.ColorSpace.SRGB,
        },
        imgData.data,
        width * 4
      )
    }
    
    return null
  }
  
  /**
   * Converte TemplateSnapshot para CanvasImageSource
   */
  private async snapshotToCanvasSource(
    snapshot: TemplateSnapshot
  ): Promise<CanvasImageSource | null> {
    const { imageData, width, height } = snapshot
    
    // Validar dimensões
    if (width <= 0 || height <= 0) {
      console.warn('[MockupRenderer] Snapshot com dimensões inválidas:', width, height)
      return null
    }
    
    if (imageData instanceof HTMLImageElement) {
      // Verificar se imagem está carregada
      if (!imageData.complete || imageData.naturalWidth === 0) {
        console.warn('[MockupRenderer] HTMLImageElement não carregado')
        return null
      }
      return imageData
    }
    
    if (imageData instanceof HTMLCanvasElement) {
      // Verificar se canvas tem dimensões válidas
      if (imageData.width <= 0 || imageData.height <= 0) {
        console.warn('[MockupRenderer] HTMLCanvasElement com dimensões inválidas')
        return null
      }
      return imageData
    }
    
    if (imageData instanceof ImageData) {
      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')!
      ctx.putImageData(imageData, 0, 0)
      return canvas
    }
    
    return null
  }
  
  /**
   * Calcula centro de um quadrilátero
   */
  private getQuadCenter(quad: { topLeft: Point2D; topRight: Point2D; bottomRight: Point2D; bottomLeft: Point2D }): Point2D {
    return {
      x: (quad.topLeft.x + quad.topRight.x + quad.bottomRight.x + quad.bottomLeft.x) / 4,
      y: (quad.topLeft.y + quad.topRight.y + quad.bottomRight.y + quad.bottomLeft.y) / 4,
    }
  }
  
  /**
   * Mapeia blend mode para CanvasKit
   */
  private mapBlendMode(mode: MockupBlendMode) {
    if (!this.ck) return null
    
    const modeMap: Record<MockupBlendMode, unknown> = {
      'normal': this.ck.BlendMode.SrcOver,
      'multiply': this.ck.BlendMode.Multiply,
      'screen': this.ck.BlendMode.Screen,
      'overlay': this.ck.BlendMode.Overlay,
      'soft-light': this.ck.BlendMode.SoftLight,
      'hard-light': this.ck.BlendMode.HardLight,
    }
    
    return modeMap[mode] ?? this.ck.BlendMode.SrcOver
  }
  
  /**
   * Mapeia blend mode para CSS
   */
  private mapBlendModeToCSS(mode: MockupBlendMode): GlobalCompositeOperation {
    const modeMap: Record<MockupBlendMode, GlobalCompositeOperation> = {
      'normal': 'source-over',
      'multiply': 'multiply',
      'screen': 'screen',
      'overlay': 'overlay',
      'soft-light': 'soft-light',
      'hard-light': 'hard-light',
    }
    
    return modeMap[mode] ?? 'source-over'
  }
  
  /**
   * Exporta mockup renderizado
   */
  async export(
    definition: MockupDefinition,
    templateSnapshots: Map<number, TemplateSnapshot>,
    options: {
      format?: 'png' | 'jpeg' | 'webp'
      quality?: number
      scale?: number
    } = {}
  ): Promise<Blob> {
    const { format = 'png', quality = 0.92, scale = 1 } = options
    
    // Se scale > 1, renderizar em resolução maior
    if (scale !== 1) {
      const scaledDefinition = {
        ...definition,
        canvasSize: {
          width: definition.canvasSize.width * scale,
          height: definition.canvasSize.height * scale,
        },
        insertAreas: definition.insertAreas.map(area => ({
          ...area,
          quad: {
            topLeft: { x: area.quad.topLeft.x * scale, y: area.quad.topLeft.y * scale },
            topRight: { x: area.quad.topRight.x * scale, y: area.quad.topRight.y * scale },
            bottomRight: { x: area.quad.bottomRight.x * scale, y: area.quad.bottomRight.y * scale },
            bottomLeft: { x: area.quad.bottomLeft.x * scale, y: area.quad.bottomLeft.y * scale },
          },
        })),
      }
      
      await this.render(scaledDefinition, templateSnapshots)
    } else {
      await this.render(definition, templateSnapshots)
    }
    
    return new Promise((resolve, reject) => {
      this.outputCanvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob)
          } else {
            reject(new Error('Falha ao exportar mockup'))
          }
        },
        `image/${format}`,
        quality
      )
    })
  }
  
  /**
   * Limpa cache de imagens
   */
  clearCache(): void {
    this.imageCache.htmlImages.clear()
    
    for (const skImage of this.imageCache.skImages.values()) {
      skImage.delete()
    }
    this.imageCache.skImages.clear()
  }
  
  /**
   * Libera recursos
   */
  destroy(): void {
    this.clearCache()
    this.surface?.delete()
    this.surface = null
    this.skCanvas = null
    this.ck = null
  }
}
