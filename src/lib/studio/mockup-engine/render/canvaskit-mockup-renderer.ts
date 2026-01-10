/**
 * Koyot Mockup Engine V2 - CanvasKit Renderer
 * 
 * Renderizador de mockups usando CanvasKit/Skia com perspectiva
 */

import type { CanvasKit, Surface as SkSurface, Canvas as SkCanvas, Image as SkImage } from 'canvaskit-wasm'
import { loadCanvasKit, getCanvasKit } from '../../render/canvaskit-loader'
import type { MockupTemplate, Quad, Size, BlendMode, RenderResult } from '../core/types'

export interface MockupRendererOptions {
  onReady?: () => void
  onError?: (error: Error) => void
}

export interface RenderOptions {
  /** Escala de renderização (0.25 = 25%, 1 = 100%). Default: 1 */
  scale?: number
  /** Formato de saída. Default: 'png' */
  format?: 'png' | 'jpeg' | 'webp'
  /** Qualidade para JPEG/WebP (0-1). Default: 0.85 */
  quality?: number
  /** Se true, retorna apenas o canvas sem converter para dataURL. Default: false */
  returnCanvas?: boolean
}

export interface DesignInput {
  smartObjectId: string
  image: HTMLImageElement | HTMLCanvasElement | ImageData
  fit?: 'cover' | 'contain' | 'stretch'
}

function getSkiaBlendMode(ck: CanvasKit, mode: BlendMode) {
  switch (mode) {
    case 'multiply': return ck.BlendMode.Multiply
    case 'screen': return ck.BlendMode.Screen
    case 'overlay': return ck.BlendMode.Overlay
    case 'darken': return ck.BlendMode.Darken
    case 'lighten': return ck.BlendMode.Lighten
    case 'colorDodge': return ck.BlendMode.ColorDodge
    case 'colorBurn': return ck.BlendMode.ColorBurn
    case 'hardLight': return ck.BlendMode.HardLight
    case 'softLight': return ck.BlendMode.SoftLight
    case 'difference': return ck.BlendMode.Difference
    case 'exclusion': return ck.BlendMode.Exclusion
    case 'hue': return ck.BlendMode.Hue
    case 'saturation': return ck.BlendMode.Saturation
    case 'color': return ck.BlendMode.Color
    case 'luminosity': return ck.BlendMode.Luminosity
    default: return ck.BlendMode.SrcOver
  }
}

export class CanvasKitMockupRenderer {
  private ck: CanvasKit | null = null
  private surface: SkSurface | null = null
  private canvas: SkCanvas | null = null
  private outputCanvas: HTMLCanvasElement
  private imageCache: Map<string, SkImage> = new Map()
  private isInitialized = false
  
  // Performance: controle de logs (desativar em produção)
  private static DEBUG = false
  
  // Helper para logs condicionais
  private log(...args: unknown[]): void {
    if (CanvasKitMockupRenderer.DEBUG) console.log(...args)
  }

  readonly ready: Promise<void>

  constructor(options: MockupRendererOptions = {}) {
    this.outputCanvas = document.createElement('canvas')
    this.ready = this.initialize(options)
  }

  private async initialize(options: MockupRendererOptions): Promise<void> {
    try {
      await loadCanvasKit()
      this.ck = getCanvasKit()
      this.isInitialized = true
      options.onReady?.()
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Erro ao inicializar CanvasKit')
      options.onError?.(err)
      throw err
    }
  }

  private setupSurface(width: number, height: number): void {
    if (!this.ck) return

    // Limpar surface anterior
    if (this.surface) {
      this.surface.delete()
      this.surface = null
      this.canvas = null
    }

    this.outputCanvas.width = width
    this.outputCanvas.height = height

    // Usar WebGL surface para performance
    this.surface = this.ck.MakeWebGLCanvasSurface(this.outputCanvas)

    if (!this.surface) {
      this.log('[Renderer] WebGL failed, using software')
      this.surface = this.ck.MakeSurface(width, height)
    }

    if (this.surface) {
      this.canvas = this.surface.getCanvas()
      this.log('[Renderer] Surface created:', width, 'x', height)
    } else {
      console.error('[Renderer] Failed to create surface')
    }
  }

  private async loadImage(src: string | HTMLImageElement | HTMLCanvasElement | ImageData): Promise<SkImage | null> {
    if (!this.ck) return null
    
    // Cache key mais eficiente
    let cacheKey: string
    if (typeof src === 'string') {
      // Para base64, usar hash dos primeiros 100 chars + length
      cacheKey = src.length > 100 ? `${src.substring(0, 100)}_${src.length}` : src
    } else if (src instanceof HTMLCanvasElement) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const canvasAny = src as any
      if (!canvasAny.__cacheId) canvasAny.__cacheId = Math.random()
      cacheKey = `canvas_${src.width}_${src.height}_${canvasAny.__cacheId}`
    } else if (src instanceof HTMLImageElement) {
      cacheKey = `img_${src.src?.substring(0, 50) || ''}_${src.width}_${src.height}`
    } else {
      cacheKey = `data_${src.width}_${src.height}`
    }
    
    if (this.imageCache.has(cacheKey)) {
      return this.imageCache.get(cacheKey)!
    }
    try {
      let skImage: SkImage | null = null
      if (typeof src === 'string') {
        // Otimização: decodificar base64 diretamente sem fetch
        if (src.startsWith('data:')) {
          const base64Data = src.split(',')[1]
          const binaryString = atob(base64Data)
          const bytes = new Uint8Array(binaryString.length)
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i)
          }
          skImage = this.ck.MakeImageFromEncoded(bytes)
        } else {
          // URL normal - usar fetch
          const response = await fetch(src)
          const buffer = await response.arrayBuffer()
          skImage = this.ck.MakeImageFromEncoded(new Uint8Array(buffer))
        }
      } else if (src instanceof HTMLImageElement) {
        const canvas = document.createElement('canvas')
        canvas.width = src.naturalWidth || src.width
        canvas.height = src.naturalHeight || src.height
        const ctx = canvas.getContext('2d')!
        ctx.drawImage(src, 0, 0)
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
        skImage = this.ck.MakeImage(
          { width: canvas.width, height: canvas.height, alphaType: this.ck.AlphaType.Unpremul, colorType: this.ck.ColorType.RGBA_8888, colorSpace: this.ck.ColorSpace.SRGB },
          imageData.data,
          canvas.width * 4
        )
      } else if (src instanceof HTMLCanvasElement) {
        const ctx = src.getContext('2d')!
        const imageData = ctx.getImageData(0, 0, src.width, src.height)
        skImage = this.ck.MakeImage(
          { width: src.width, height: src.height, alphaType: this.ck.AlphaType.Unpremul, colorType: this.ck.ColorType.RGBA_8888, colorSpace: this.ck.ColorSpace.SRGB },
          imageData.data,
          src.width * 4
        )
      } else if (src instanceof ImageData) {
        skImage = this.ck.MakeImage(
          { width: src.width, height: src.height, alphaType: this.ck.AlphaType.Unpremul, colorType: this.ck.ColorType.RGBA_8888, colorSpace: this.ck.ColorSpace.SRGB },
          src.data,
          src.width * 4
        )
      }
      if (skImage && typeof src === 'string') {
        this.imageCache.set(cacheKey, skImage)
      }
      return skImage
    } catch (error) {
      console.error('[MockupRenderer V2] Erro ao carregar imagem:', error)
      return null
    }
  }

  private drawWithPerspective(image: SkImage, srcSize: Size, dstQuad: Quad, opacity: number = 1, blendMode: BlendMode = 'normal'): void {
    if (!this.ck || !this.canvas) return
    const paint = new this.ck.Paint()
    paint.setAntiAlias(true)
    paint.setAlphaf(opacity)
    paint.setBlendMode(getSkiaBlendMode(this.ck, blendMode))
    this.canvas.save()
    const vertices = this.ck.MakeVertices(
      this.ck.VertexMode.TriangleFan,
      new Float32Array([dstQuad.topLeft.x, dstQuad.topLeft.y, dstQuad.topRight.x, dstQuad.topRight.y, dstQuad.bottomRight.x, dstQuad.bottomRight.y, dstQuad.bottomLeft.x, dstQuad.bottomLeft.y]),
      new Float32Array([0, 0, 1, 0, 1, 1, 0, 1]),
      new Uint32Array([0xFFFFFFFF, 0xFFFFFFFF, 0xFFFFFFFF, 0xFFFFFFFF])
    )
    if (vertices) {
      // Usar o tamanho real da imagem para o shader (não o srcSize do Smart Object)
      // Isso garante que a imagem seja mapeada corretamente para o quad de destino
      const shader = image.makeShaderCubic(this.ck.TileMode.Clamp, this.ck.TileMode.Clamp, 1 / 3, 1 / 3, this.ck.Matrix.scaled(1 / image.width(), 1 / image.height()))
      paint.setShader(shader)
      this.canvas.drawVertices(vertices, this.ck.BlendMode.SrcOver, paint)
      shader.delete()
      vertices.delete()
    }
    this.canvas.restore()
    paint.delete()
  }

  async render(template: MockupTemplate, designs: DesignInput[], layerImages: Map<string, string>, options: RenderOptions = {}): Promise<RenderResult> {
    const { scale = 1, format = 'jpeg', quality = 0.85, returnCanvas = false } = options
    await this.ready
    if (!this.ck || !this.isInitialized) {
      return { success: false, renderTimeMs: 0, error: 'CanvasKit não inicializado' }
    }
    const startTime = performance.now()
    const timings: Record<string, number> = {}
    
    try {
      // Aplicar escala para preview rápido
      const renderWidth = Math.round(template.canvasSize.width * scale)
      const renderHeight = Math.round(template.canvasSize.height * scale)
      
      const t0 = performance.now()
      this.setupSurface(renderWidth, renderHeight)
      timings.setupSurface = performance.now() - t0
      
      if (!this.canvas) throw new Error('Falha ao criar canvas')
      
      // Aplicar escala no canvas
      if (scale !== 1) {
        this.canvas.scale(scale, scale)
      }
      
      this.canvas.clear(this.ck.TRANSPARENT)

      const designMap = new Map<string, DesignInput>()
      for (const design of designs) {
        designMap.set(design.smartObjectId, design)
      }

      // Verificar se as camadas de renderização têm imagens válidas
      const hasValidBaseImage = template.renderLayers?.baseLayerId && layerImages.has(template.renderLayers.baseLayerId)
      const hasValidOverlayImage = template.renderLayers?.overlayLayerId && layerImages.has(template.renderLayers.overlayLayerId)
      
      // Usar Professional Layered apenas se AMBAS as camadas (base e overlay) tiverem imagens
      // Caso contrário, usar renderização camada-por-camada que processa grupos corretamente
      let t1 = performance.now()
      if (hasValidBaseImage && hasValidOverlayImage) {
        this.log('[Renderer] Using Professional Layered Rendering (base + overlay images found)')
        await this.renderProfessionalLayers(template, designMap, layerImages)
      } else {
        this.log('[Renderer] Using Layer-by-Layer Rendering (processing all layers with groups)')
        this.log(`[Renderer] Base image: ${hasValidBaseImage}, Overlay image: ${hasValidOverlayImage}`)
        await this.renderHybridFallback(template, designMap, layerImages)
      }
      timings.renderLayers = performance.now() - t1

      t1 = performance.now()
      this.surface?.flush()
      timings.flush = performance.now() - t1
      
      // Se returnCanvas, não converter para dataURL (mais rápido para preview)
      if (returnCanvas) {
        console.log('[Renderer] Timings:', timings)
        return { success: true, renderTimeMs: performance.now() - startTime, canvas: this.outputCanvas }
      }
      
      t1 = performance.now()
      const imageUrl = this.captureToDataURL(renderWidth, renderHeight, format, quality)
      timings.captureToDataURL = performance.now() - t1
      
      console.log('[Renderer] Timings:', timings)
      return { success: true, renderTimeMs: performance.now() - startTime, imageUrl }
    } catch (error) {
      console.error('[Renderer] Error:', error)
      return { success: false, renderTimeMs: performance.now() - startTime, error: error instanceof Error ? error.message : 'Erro desconhecido' }
    }
  }

  /**
   * Renderização Profissional em Camadas (Sanduíche)
   * 1. Base Layer (Fundo limpo)
   * 2. Designs dos usuários (com perspectiva e máscara)
   * 3. Overlay Layer (Mãos, reflexos, sombras)
   */
  private async renderProfessionalLayers(template: MockupTemplate, designMap: Map<string, DesignInput>, layerImages: Map<string, string>): Promise<void> {
    if (!this.canvas || !template.renderLayers) return

    // Helper para desenhar camada com máscara opcional
    const drawLayer = async (layerId: string, blendMode: import('canvaskit-wasm').BlendMode = this.ck!.BlendMode.SrcOver) => {
      const imgKey = layerId
      const maskKey = `${layerId}_mask`

      const imgUrl = layerImages.get(imgKey)
      if (!imgUrl) return

      const skImg = await this.loadImage(imgUrl)
      if (!skImg) return

      const maskUrl = layerImages.get(maskKey)
      let skMask: import('canvaskit-wasm').Image | null = null
      if (maskUrl) {
        skMask = await this.loadImage(maskUrl)
        this.log(`[Renderer] Mask loaded for layer ${layerId}`)
      }

      if (skMask) {
        // Desenhar com máscara usando saveLayer + DstIn
        const layerPaint = new this.ck!.Paint()
        this.canvas!.saveLayer(layerPaint)

        const paint = new this.ck!.Paint()
        paint.setBlendMode(blendMode)
        this.canvas!.drawImage(skImg, 0, 0, paint)
        paint.delete()

        // Aplicar máscara
        const maskPaint = new this.ck!.Paint()
        maskPaint.setBlendMode(this.ck!.BlendMode.DstIn)
        this.canvas!.drawImage(skMask, 0, 0, maskPaint)
        maskPaint.delete()

        layerPaint.delete()
        this.canvas!.restore()
      } else {
        // Desenho simples
        const paint = new this.ck!.Paint()
        paint.setBlendMode(blendMode)
        this.canvas!.drawImage(skImg, 0, 0, paint)
        paint.delete()
      }
    }

    // 1. Base Layer
    if (template.renderLayers.baseLayerId) {
      await drawLayer(template.renderLayers.baseLayerId)
      this.log('[Renderer] Base layer drawn')
    }

    // 2. User Designs
    for (const insertArea of template.insertAreas) {
      await this.renderInsertArea(insertArea, designMap, layerImages)
    }

    // 3. Overlay Layer
    if (template.renderLayers.overlayLayerId) {
      await drawLayer(template.renderLayers.overlayLayerId)
      this.log('[Renderer] Overlay layer drawn')
    }
  }

  /**
   * Renderização por Camadas (processa todas as camadas na ordem correta)
   * Renderiza de baixo para cima (zIndex crescente), substituindo Smart Objects pelo design
   */
  private async renderHybridFallback(template: MockupTemplate, designMap: Map<string, DesignInput>, layerImages: Map<string, string>): Promise<void> {
    if (!this.canvas || !this.ck) return

    this.log('[Renderer] Starting layer-by-layer rendering')
    this.log('[Renderer] Total layers:', template.layers.length)
    
    // Helper para coletar todos os IDs de camadas recursivamente
    const getAllLayerIds = (layers: import('../core/types').PsdLayer[]): string[] => {
      const ids: string[] = []
      for (const layer of layers) {
        ids.push(layer.id)
        if (layer.children) {
          ids.push(...getAllLayerIds(layer.children))
        }
      }
      return ids
    }
    
    this.log('[Renderer] Available images:', Array.from(layerImages.keys()).filter(k => !k.includes('_mask')))
    this.log('[Renderer] All layer IDs in template:', getAllLayerIds(template.layers))

    // Renderizar camadas na ordem correta (de trás para frente)
    // zIndex menor = fundo = renderizado primeiro
    const sortedLayers = [...template.layers].sort((a, b) => a.zIndex - b.zIndex)
    
    this.log('[Renderer] Root layers render order:', sortedLayers.map(l => `${l.name}(z:${l.zIndex})`).join(' -> '))
    
    for (const layer of sortedLayers) {
      await this.renderLayerRecursive(layer, designMap, layerImages)
    }
  }

  /**
   * Renderiza uma camada recursivamente (incluindo grupos)
   */
  private async renderLayerRecursive(
    layer: import('../core/types').PsdLayer,
    designMap: Map<string, DesignInput>,
    layerImages: Map<string, string>
  ): Promise<void> {
    if (!this.canvas || !this.ck) return
    if (!layer.visible) return

    this.log(`[Renderer] Processing layer: "${layer.name}" (type: ${layer.type}, zIndex: ${layer.zIndex})`)

    // Grupo - renderizar filhos recursivamente
    if (layer.type === 'group' && layer.children) {
      this.log(`[Renderer] Entering group: "${layer.name}" with ${layer.children.length} children, blendMode: ${layer.blendMode}`)
      
      // Ordenar filhos por zIndex (menor primeiro = fundo)
      const sortedChildren = [...layer.children].sort((a, b) => a.zIndex - b.zIndex)
      
      this.log(`[Renderer] Group "${layer.name}" render order:`, sortedChildren.map(c => `${c.name}(z:${c.zIndex})`).join(' -> '))
      
      for (const child of sortedChildren) {
        await this.renderLayerRecursive(child, designMap, layerImages)
      }
      return
    }

    // Smart Object - substituir pelo design do usuário
    if (layer.type === 'smartObject' && layer.smartObject) {
      this.log(`[Renderer] Found Smart Object: "${layer.name}"`)
      await this.renderInsertArea(layer.smartObject, designMap, layerImages, false)
      return
    }

    // Camada de imagem normal
    const layerImage = layerImages.get(layer.id)
    if (layerImage) {
      const skImage = await this.loadImage(layerImage)
      if (skImage) {
        this.canvas.save()
        
        const paint = new this.ck.Paint()
        paint.setAlphaf(layer.opacity)
        paint.setBlendMode(getSkiaBlendMode(this.ck, layer.blendMode))
        
        // Desenhar na posição correta
        this.canvas.drawImage(skImage, layer.bounds.left, layer.bounds.top, paint)
        
        paint.delete()
        this.canvas.restore()
        
        this.log(`[Renderer] Drew layer: "${layer.name}" at (${layer.bounds.left}, ${layer.bounds.top}) blendMode: ${layer.blendMode}, opacity: ${layer.opacity}`)
      }
    } else {
      this.log(`[Renderer] No image found for layer: "${layer.name}" (id: ${layer.id}, type: ${layer.type})`)
    }
  }

  /**
   * Renderiza uma única área de inserção (Smart Object)
   */
  private async renderInsertArea(
    insertArea: import('../core/types').SmartObjectInfo,
    designMap: Map<string, DesignInput>,
    layerImages: Map<string, string>,
    forceClear: boolean = false
  ): Promise<void> {
    if (!this.canvas || !this.ck) return

    // Buscar design pelo ID do Smart Object
    let design = designMap.get(insertArea.id)
    
    // Log para debug de múltiplos Smart Objects
    this.log(`[Renderer] Processing insertArea: "${insertArea.name}" (id: ${insertArea.id})`)
    this.log(`[Renderer] Available designs: [${Array.from(designMap.keys()).join(', ')}]`)
    
    // Se não encontrou pelo ID exato, tentar pelo nome
    if (!design) {
      const designKeys = Array.from(designMap.keys())
      for (const key of designKeys) {
        if (insertArea.name.toLowerCase().includes(key.toLowerCase()) || 
            key.toLowerCase().includes(insertArea.name.toLowerCase())) {
          design = designMap.get(key)
          this.log(`[Renderer] Found design by name match: ${key}`)
          break
        }
      }
    }
    
    // Fallback: usar o primeiro design disponível se só houver um
    if (!design && designMap.size === 1) {
      design = designMap.values().next().value
      this.log(`[Renderer] Using single available design as fallback`)
    }

    if (design) {
      this.log(`[Renderer] Rendering design for: "${insertArea.name}"`)
    } else {
      this.log(`[Renderer] No design found for: "${insertArea.name}", skipping`)
    }

    if (design) {
      // Carregar a máscara do Smart Object se disponível
      // Primeiro tenta a máscara própria, depois a máscara herdada do grupo pai
      let maskKey = `${insertArea.id}_mask`
      let maskImage = layerImages.get(maskKey)
      
      // Se não tem máscara própria, verificar se tem máscara herdada do grupo
      if (!maskImage && insertArea.mask?.imageKey) {
        maskKey = insertArea.mask.imageKey
        maskImage = layerImages.get(maskKey)
        if (maskImage) {
          this.log(`[Renderer] Using inherited mask from group: ${maskKey}`)
        }
      }

      // Carregar o design do usuário
      const designSkImage = await this.loadImage(design.image)
      if (!designSkImage) {
        console.error('[Renderer] Failed to load design image for insertArea:', insertArea.name)
        return
      }

      if (insertArea.perspectiveQuad) {
        this.canvas.save()

        // Carregar a máscara se disponível
        let maskSkImage: import('canvaskit-wasm').Image | null = null
        if (maskImage) {
          maskSkImage = await this.loadImage(maskImage)
          this.log('[Renderer] Mask loaded for insertArea:', insertArea.name, !!maskSkImage)
        }

        // Log do perspectiveQuad para debug (v2)
        this.log(`[Renderer v2] PerspectiveQuad for "${insertArea.name}":`, JSON.stringify(insertArea.perspectiveQuad))
        this.log(`[Renderer v2] PlacedContent size:`, insertArea.placedContent)
        this.log(`[Renderer v2] Has mask image:`, !!maskSkImage)
        
        // Se temos máscara de grupo, NÃO usar clipPath do perspectiveQuad
        // A máscara já define a forma correta do recorte
        if (!maskSkImage) {
          // Sem máscara: usar clipping path baseado no quad de perspectiva
          const clipPath = new this.ck.Path()
          clipPath.moveTo(insertArea.perspectiveQuad.topLeft.x, insertArea.perspectiveQuad.topLeft.y)
          clipPath.lineTo(insertArea.perspectiveQuad.topRight.x, insertArea.perspectiveQuad.topRight.y)
          clipPath.lineTo(insertArea.perspectiveQuad.bottomRight.x, insertArea.perspectiveQuad.bottomRight.y)
          clipPath.lineTo(insertArea.perspectiveQuad.bottomLeft.x, insertArea.perspectiveQuad.bottomLeft.y)
          clipPath.close()
          this.canvas.clipPath(clipPath, this.ck.ClipOp.Intersect, true)

          // Se for modo híbrido, limpar a área antes de desenhar
          if (forceClear) {
            const clearPaint = new this.ck.Paint()
            clearPaint.setBlendMode(this.ck.BlendMode.Clear)
            this.canvas.drawPath(clipPath, clearPaint)
            clearPaint.delete()
            this.log('[Renderer] Cleared area for insertArea:', insertArea.name)
          }

          this.drawWithPerspective(designSkImage, insertArea.placedContent, insertArea.perspectiveQuad, 1.0)
          clipPath.delete()
          this.log('[Renderer] Design drawn with perspective (no mask) for insertArea:', insertArea.name)
        } else {
          // Com máscara: usar saveLayer + máscara para recorte preciso
          const layerPaint = new this.ck.Paint()
          this.canvas.saveLayer(layerPaint)

          // Desenhar design com perspectiva
          this.drawWithPerspective(designSkImage, insertArea.placedContent, insertArea.perspectiveQuad, 1.0)

          // Aplicar máscara - usar bounds da máscara (posição onde foi extraída)
          const maskBounds = insertArea.mask?.bounds ?? insertArea.bounds
          this.log(`[Renderer] Mask bounds:`, maskBounds)
          this.log(`[Renderer] InsertArea bounds:`, insertArea.bounds)
          this.log(`[Renderer] Mask image size: ${maskSkImage.width()} x ${maskSkImage.height()}`)
          
          const maskPaint = new this.ck.Paint()
          maskPaint.setBlendMode(this.ck.BlendMode.DstIn)
          this.canvas.drawImage(maskSkImage, maskBounds.left, maskBounds.top, maskPaint)
          this.log(`[Renderer] Mask drawn at (${maskBounds.left}, ${maskBounds.top})`)

          maskPaint.delete()
          layerPaint.delete()
          this.canvas.restore()
          this.log('[Renderer] Design drawn with perspective and mask for insertArea:', insertArea.name)
        }

        this.canvas.restore()
      } else {
        // Sem perspectiva
        this.canvas.save()
        const paint = new this.ck.Paint()
        paint.setBlendMode(this.ck.BlendMode.SrcOver)

        const width = insertArea.bounds.right - insertArea.bounds.left
        const height = insertArea.bounds.bottom - insertArea.bounds.top

        this.canvas.translate(insertArea.bounds.left, insertArea.bounds.top)
        this.canvas.scale(width / designSkImage.width(), height / designSkImage.height())
        this.canvas.drawImage(designSkImage, 0, 0, paint)

        paint.delete()
        this.canvas.restore()
        this.log('[Renderer] Design drawn without perspective for insertArea:', insertArea.name)
      }
    }
  }

  private captureToDataURL(width: number, height: number, format: 'png' | 'jpeg' | 'webp' = 'jpeg', quality: number = 0.85): string {
    if (!this.surface || !this.ck) return ''

    // Ler pixels do surface CanvasKit
    const imageInfo = {
      width,
      height,
      colorType: this.ck.ColorType.RGBA_8888,
      alphaType: this.ck.AlphaType.Unpremul,
      colorSpace: this.ck.ColorSpace.SRGB,
    }

    const pixels = this.surface.makeImageSnapshot().readPixels(0, 0, imageInfo)
    if (!pixels) {
      console.error('[Renderer] Failed to read pixels')
      return ''
    }

    // Criar ImageData e desenhar em canvas 2D
    const imageData = new ImageData(new Uint8ClampedArray(pixels), width, height)
    const ctx = this.outputCanvas.getContext('2d')
    if (ctx) {
      ctx.putImageData(imageData, 0, 0)
    }

    // JPEG é muito mais rápido que PNG para preview
    const mimeType = format === 'png' ? 'image/png' : format === 'webp' ? 'image/webp' : 'image/jpeg'
    return this.outputCanvas.toDataURL(mimeType, quality)
  }

  getOutputCanvas(): HTMLCanvasElement { return this.outputCanvas }

  /**
   * Pré-carrega todas as imagens do template no cache
   * Chamar uma vez quando o template é selecionado para acelerar renders subsequentes
   */
  async preloadTemplateImages(layerImages: Map<string, string>): Promise<void> {
    await this.ready
    if (!this.ck) return
    
    const startTime = performance.now()
    const promises: Promise<void>[] = []
    
    for (const [, base64] of layerImages) {
      promises.push(
        this.loadImage(base64).then(() => {})
      )
    }
    
    await Promise.all(promises)
    console.log(`[Renderer] Preloaded ${layerImages.size} images in ${(performance.now() - startTime).toFixed(1)}ms`)
  }

  /**
   * Renderização rápida para preview (escala reduzida + JPEG)
   * Ideal para preview em tempo real enquanto o usuário edita
   */
  async renderPreview(template: MockupTemplate, designs: DesignInput[], layerImages: Map<string, string>): Promise<RenderResult> {
    // Renderizar em resolução completa mas com JPEG para velocidade
    return this.render(template, designs, layerImages, {
      scale: 1,
      format: 'jpeg',
      quality: 0.95,
    })
  }

  /**
   * Renderização em alta qualidade para export final
   */
  async renderHighQuality(template: MockupTemplate, designs: DesignInput[], layerImages: Map<string, string>): Promise<RenderResult> {
    return this.render(template, designs, layerImages, {
      scale: 1,
      format: 'png',
      quality: 1,
    })
  }

  async exportAsBlob(format: 'png' | 'jpg' | 'webp' = 'png', quality = 0.92): Promise<Blob> {
    return new Promise((resolve, reject) => {
      this.outputCanvas.toBlob((blob) => { if (blob) resolve(blob); else reject(new Error('Falha ao exportar')) }, `image/${format}`, quality)
    })
  }

  destroy(): void {
    this.imageCache.forEach((image) => image.delete())
    this.imageCache.clear()
    this.surface?.delete()
    this.surface = null
    this.canvas = null
  }
}
