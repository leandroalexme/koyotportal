/**
 * Koyot Mockup Engine V2 - PSD Parser
 * 
 * Parser de arquivos PSD usando ag-psd
 * Extrai layers, Smart Objects e metadados para criar MockupTemplates
 */

// Performance: desativar logs em produção
const DEBUG = false
const log = (...args: unknown[]) => { if (DEBUG) console.log(...args) }

import { readPsd, type Layer } from 'ag-psd'
import type {
  MockupTemplate,
  MockupCategory,
  PsdLayer,
  SmartObjectInfo,
  BlendMode,
  LayerType,
  Quad,
  Bounds,
  Size,
  RGBA,
  SolidColorInfo,
  LayerEffectsInfo,
} from './types'

/**
 * Opções para parsing de PSD
 */
export interface PsdParseOptions {
  /** Nome do mockup */
  name?: string
  /** Descrição */
  description?: string
  /** Categoria */
  category?: MockupCategory
  /** Tags */
  tags?: string[]
  /** Extrair dados de imagem das camadas */
  extractLayerImages?: boolean
}

/**
 * Resultado do parsing de PSD
 */
export interface PsdParseResult {
  success: boolean
  template?: MockupTemplate
  /** Imagens das camadas extraídas (base64 PNG) */
  layerImages?: Map<string, string>
  /** Erros encontrados */
  errors: string[]
  /** Warnings */
  warnings: string[]
}

/**
 * Mapeia blend mode do PSD para nosso tipo
 */
function mapBlendMode(psdBlendMode?: string): BlendMode {
  const mapping: Record<string, BlendMode> = {
    'normal': 'normal',
    'multiply': 'multiply',
    'screen': 'screen',
    'overlay': 'overlay',
    'darken': 'darken',
    'lighten': 'lighten',
    'color dodge': 'colorDodge',
    'linear dodge': 'colorDodge', // Linear Dodge (Add) mapeia para ColorDodge
    'color burn': 'colorBurn',
    'linear burn': 'colorBurn',
    'hard light': 'hardLight',
    'soft light': 'softLight',
    'vivid light': 'hardLight',
    'linear light': 'hardLight',
    'pin light': 'hardLight',
    'difference': 'difference',
    'exclusion': 'exclusion',
    'hue': 'hue',
    'saturation': 'saturation',
    'color': 'color',
    'luminosity': 'luminosity',
    'pass through': 'normal', // Grupos com pass through
  }
  const result = mapping[psdBlendMode?.toLowerCase() ?? 'normal'] ?? 'normal'
  if (psdBlendMode && result === 'normal' && psdBlendMode.toLowerCase() !== 'normal') {
    log(`[PSD Parser] Unknown blend mode: "${psdBlendMode}", defaulting to normal`)
  }
  return result
}

/**
 * Determina o tipo de camada
 */
function getLayerType(layer: Layer): LayerType {
  if (layer.children) return 'group'
  if (layer.placedLayer) return 'smartObject'
  if (layer.text) return 'text'
  // Camada de cor sólida (solid color fill)
  if (layer.vectorFill && 'color' in layer.vectorFill && layer.vectorFill.type === 'color') return 'solidColor'
  if (layer.vectorFill || layer.vectorStroke) return 'shape'
  if (layer.adjustment) return 'adjustment'
  return 'image'
}

/**
 * Converte cor do ag-psd para RGBA
 */
function convertColor(color: unknown): RGBA | undefined {
  if (!color || typeof color !== 'object') return undefined
  
  const c = color as Record<string, number>
  
  // Formato RGBA
  if ('r' in c && 'g' in c && 'b' in c) {
    return {
      r: Math.round(c.r ?? 0),
      g: Math.round(c.g ?? 0),
      b: Math.round(c.b ?? 0),
      a: Math.round(c.a ?? 255),
    }
  }
  
  return undefined
}

/**
 * Extrai informações de cor sólida
 */
function extractSolidColorInfo(layer: Layer): SolidColorInfo | undefined {
  if (!layer.vectorFill || layer.vectorFill.type !== 'color') return undefined
  
  const color = convertColor(layer.vectorFill.color)
  if (!color) return undefined
  
  return { color }
}

/**
 * Extrai efeitos de camada
 */
function extractLayerEffects(layer: Layer): LayerEffectsInfo | undefined {
  const effects = layer.effects
  if (!effects) return undefined
  
  const result: LayerEffectsInfo = {}
  
  // Drop Shadow
  if (effects.dropShadow && effects.dropShadow.length > 0) {
    result.dropShadow = effects.dropShadow.map(shadow => ({
      enabled: shadow.enabled,
      color: convertColor(shadow.color),
      opacity: shadow.opacity,
      angle: shadow.angle,
      distance: shadow.distance?.value,
      size: shadow.size?.value,
      blendMode: mapBlendMode(shadow.blendMode),
    }))
  }
  
  // Inner Shadow
  if (effects.innerShadow && effects.innerShadow.length > 0) {
    result.innerShadow = effects.innerShadow.map(shadow => ({
      enabled: shadow.enabled,
      color: convertColor(shadow.color),
      opacity: shadow.opacity,
      angle: shadow.angle,
      distance: shadow.distance?.value,
      size: shadow.size?.value,
      blendMode: mapBlendMode(shadow.blendMode),
    }))
  }
  
  // Solid Fill
  if (effects.solidFill && effects.solidFill.length > 0) {
    result.solidFill = effects.solidFill.map(fill => ({
      enabled: fill.enabled,
      color: convertColor(fill.color),
      opacity: fill.opacity,
      blendMode: mapBlendMode(fill.blendMode),
    }))
  }
  
  return Object.keys(result).length > 0 ? result : undefined
}

/**
 * Extrai os 4 pontos de perspectiva do transform do Smart Object
 * Prefere nonAffineTransform (perspectiva real) quando disponível
 * O transform[] do ag-psd contém: [x0, y0, x1, y1, x2, y2, x3, y3]
 * Representando os 4 cantos: topLeft, topRight, bottomRight, bottomLeft
 */
function extractPerspectiveQuad(layer: Layer): Quad | undefined {
  const placed = layer.placedLayer
  if (!placed) return undefined

  // Preferir nonAffineTransform (perspectiva real do Photoshop)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const placedAny = placed as any
  const nonAffine = placedAny.nonAffineTransform
  const affine = placed.transform
  
  log(`[PSD Parser] Smart Object "${layer.name}" transforms:`, { nonAffine, affine, keys: Object.keys(placed) })
  
  const transform = nonAffine || affine
  if (!transform || transform.length < 8) {
    log(`[PSD Parser] No valid transform found for "${layer.name}"`)
    return undefined
  }

  const quad = {
    topLeft: { x: transform[0], y: transform[1] },
    topRight: { x: transform[2], y: transform[3] },
    bottomRight: { x: transform[4], y: transform[5] },
    bottomLeft: { x: transform[6], y: transform[7] },
  }
  
  log(`[PSD Parser] Extracted quad:`, JSON.stringify(quad))
  return quad
}

/**
 * Extrai informações de um Smart Object
 */
function extractSmartObjectInfo(
  layer: Layer,
  layerId: string
): SmartObjectInfo | undefined {
  const placed = layer.placedLayer
  if (!placed) return undefined

  const bounds: Bounds = {
    left: layer.left ?? 0,
    top: layer.top ?? 0,
    right: layer.right ?? 0,
    bottom: layer.bottom ?? 0,
  }

  const size: Size = {
    width: (layer.right ?? 0) - (layer.left ?? 0),
    height: (layer.bottom ?? 0) - (layer.top ?? 0),
  }

  // Extrair quad de perspectiva do transform (usa nonAffineTransform se disponível)
  const perspectiveQuad = extractPerspectiveQuad(layer)

  return {
    id: layerId,
    name: layer.name ?? 'Smart Object',
    bounds,
    size,
    transform: {
      xx: 1, xy: 0,
      yx: 0, yy: 1,
      tx: bounds.left, ty: bounds.top,
    },
    perspectiveQuad,
    placedContent: {
      width: placed.width ?? size.width,
      height: placed.height ?? size.height,
      type: placed.type === 'vector' ? 'linked' : 'embedded',
    },
    blendMode: mapBlendMode(layer.blendMode),
    opacity: (layer.opacity ?? 255) / 255,
    visible: !layer.hidden,
  }
}

/**
 * Converte canvas para base64 PNG
 */
function canvasToBase64(canvas: HTMLCanvasElement | OffscreenCanvas): string {
  log('[PSD Parser] canvasToBase64 called, type:', canvas.constructor.name, 'size:', canvas.width, 'x', canvas.height)

  if (canvas instanceof HTMLCanvasElement) {
    const result = canvas.toDataURL('image/png')
    log('[PSD Parser] HTMLCanvasElement toDataURL length:', result.length)
    return result
  }

  // OffscreenCanvas - converter para HTMLCanvasElement
  if (typeof OffscreenCanvas !== 'undefined' && canvas instanceof OffscreenCanvas) {
    log('[PSD Parser] Converting OffscreenCanvas to HTMLCanvasElement')
    const htmlCanvas = document.createElement('canvas')
    htmlCanvas.width = canvas.width
    htmlCanvas.height = canvas.height
    const ctx = htmlCanvas.getContext('2d')
    if (ctx) {
      // OffscreenCanvas pode ser desenhado diretamente
      ctx.drawImage(canvas as unknown as CanvasImageSource, 0, 0)
      const result = htmlCanvas.toDataURL('image/png')
      log('[PSD Parser] OffscreenCanvas converted, length:', result.length)
      return result
    }
  }

  log('[PSD Parser] canvasToBase64 failed, returning empty string')
  return ''
}

/**
 * Processa uma camada recursivamente
 */
function processLayer(
  layer: Layer,
  zIndex: number,
  layerImages: Map<string, string>,
  extractImages: boolean
): PsdLayer {
  const layerId = `layer-${zIndex}-${layer.name?.replace(/\s/g, '-') ?? 'unnamed'}`
  const layerType = getLayerType(layer)

  const bounds: Bounds = {
    left: layer.left ?? 0,
    top: layer.top ?? 0,
    right: layer.right ?? 0,
    bottom: layer.bottom ?? 0,
  }

  // ag-psd retorna opacity de 0-255, mas pode retornar valores baixos ou undefined
  // Se opacity for undefined ou muito baixo (< 10), assumir 100% (255)
  const rawOpacity = layer.opacity ?? 255
  const normalizedOpacity = rawOpacity > 10 ? rawOpacity / 255 : 1

  const psdLayer: PsdLayer = {
    id: layerId,
    name: layer.name ?? 'Unnamed Layer',
    type: layerType,
    bounds,
    zIndex,
    visible: !layer.hidden,
    opacity: normalizedOpacity,
    blendMode: mapBlendMode(layer.blendMode),
    clipping: layer.clipping ?? false,
    fillOpacity: layer.fillOpacity !== undefined ? layer.fillOpacity / 255 : undefined,
  }

  log(`[PSD Parser] Layer: "${layer.name}" type: ${layerType}, blendMode: ${layer.blendMode} -> ${psdLayer.blendMode}, hasCanvas: ${!!layer.canvas}, visible: ${psdLayer.visible}, rawOpacity: ${layer.opacity}, opacity: ${psdLayer.opacity}`)

  // Extrair imagem da camada
  if (extractImages && layer.canvas) {
    const base64 = canvasToBase64(layer.canvas)
    if (base64) {
      layerImages.set(layerId, base64)
      log(`[PSD Parser] Extracted image for layer: "${layer.name}" (id: ${layerId})`)
    }
  }

  // Smart Object
  if (layerType === 'smartObject') {
    psdLayer.smartObject = extractSmartObjectInfo(layer, layerId)
  }

  // Solid Color (camada de cor)
  if (layerType === 'solidColor') {
    psdLayer.solidColor = extractSolidColorInfo(layer)
  }

  // Efeitos de camada
  psdLayer.effects = extractLayerEffects(layer)

  // Grupo - processar filhos
  // ag-psd retorna filhos de baixo para cima, então usamos index diretamente
  if (layer.children) {
    psdLayer.children = layer.children.map((child, i) => {
      // Filho index 0 = fundo do grupo = zIndex menor
      const childZIndex = zIndex * 100 + i
      return processLayer(child, childZIndex, layerImages, extractImages)
    })
  }

  // Máscara
  if (layer.mask) {
    psdLayer.mask = {
      bounds: {
        left: layer.mask.left ?? 0,
        top: layer.mask.top ?? 0,
        right: layer.mask.right ?? 0,
        bottom: layer.mask.bottom ?? 0,
      },
      defaultColor: layer.mask.defaultColor ?? 0,
    }

    // Extrair imagem da máscara se existir
    if (layer.mask.canvas && extractImages) {
      const maskBase64 = canvasToBase64(layer.mask.canvas)
      if (maskBase64) {
        layerImages.set(`${layerId}_mask`, maskBase64)
      }
    }
  }

  return psdLayer
}

/**
 * Encontra todos os Smart Objects em uma lista de camadas
 * Herda máscaras de grupos pai quando o Smart Object não tem máscara própria
 */
function findSmartObjects(layers: PsdLayer[], layerImages: Map<string, string>): SmartObjectInfo[] {
  const smartObjects: SmartObjectInfo[] = []

  function traverse(layerList: PsdLayer[], parentMask?: { id: string; bounds: Bounds }) {
    for (const layer of layerList) {
      // Se este grupo tem máscara, usar como máscara pai para filhos
      let currentMask = parentMask
      if (layer.type === 'group' && layer.mask) {
        currentMask = {
          id: layer.id,
          bounds: layer.mask.bounds,
        }
        log(`[PSD Parser] Group "${layer.name}" has mask, bounds:`, layer.mask.bounds, `will inherit to children`)
      }

      if (layer.type === 'smartObject' && layer.smartObject) {
        // Se o Smart Object não tem máscara própria mas o grupo pai tem, herdar
        if (!layer.smartObject.mask && currentMask) {
          const maskImageKey = `${currentMask.id}_mask`
          if (layerImages.has(maskImageKey)) {
            layer.smartObject.mask = {
              bounds: currentMask.bounds,
              imageKey: maskImageKey,
            }
            log(`[PSD Parser] Smart Object "${layer.name}" inherited mask from group "${currentMask.id}"`)
          }
        }
        smartObjects.push(layer.smartObject)
      }

      if (layer.children) {
        traverse(layer.children, currentMask)
      }
    }
  }

  traverse(layers)
  return smartObjects
}

/**
 * Identifica camadas especiais para renderização em camadas
 * Convenções de nomes:
 * - Base: contém "BASE" ou "Background" (sem smart objects ou overlay)
 * - Overlay: contém "OVERLAY", "HAND", "HANDS", "REFLECTION", "SHADOW", "LIGHT"
 */
function findRenderLayers(layers: PsdLayer[]): { baseLayerId?: string; overlayLayerId?: string } {
  let baseLayerId: string | undefined
  let overlayLayerId: string | undefined

  const basePatterns = [/\bBASE\b/i, /\bBACKGROUND\b/i, /\bBG\b/i, /\bFUNDO\b/i]
  const overlayPatterns = [/\bOVERLAY\b/i, /\bHAND\b/i, /\bHANDS\b/i, /\bREFLECTION\b/i, /\bSHADOW\b/i, /\bLIGHT\b/i, /\bGLASS\b/i, /\bOCLUSION\b/i]

  function traverse(layerList: PsdLayer[]) {
    for (const layer of layerList) {
      const name = layer.name

      // Verificar se é camada base
      if (!baseLayerId && basePatterns.some(pattern => pattern.test(name))) {
        baseLayerId = layer.id
      }

      // Verificar se é camada overlay
      if (!overlayLayerId && overlayPatterns.some(pattern => pattern.test(name))) {
        overlayLayerId = layer.id
      }

      // Recursivamente verificar grupos
      if (layer.children) {
        traverse(layer.children)
      }
    }
  }

  traverse(layers)

  return { baseLayerId, overlayLayerId }
}

/**
 * Parse de arquivo PSD
 * 
 * @param buffer - ArrayBuffer do arquivo PSD
 * @param options - Opções de parsing
 * @returns Resultado do parsing com MockupTemplate
 */
export async function parsePsd(
  buffer: ArrayBuffer,
  options: PsdParseOptions = {}
): Promise<PsdParseResult> {
  const errors: string[] = []
  const warnings: string[] = []
  const layerImages = new Map<string, string>()

  try {
    // Parse do PSD
    const psd = readPsd(buffer, {
      skipCompositeImageData: false,
      skipLayerImageData: !options.extractLayerImages,
      skipThumbnail: false,
    })

    if (!psd.width || !psd.height) {
      errors.push('PSD não tem dimensões válidas')
      return { success: false, errors, warnings }
    }

    // Processar camadas
    // No ag-psd, as camadas vêm na ordem do Photoshop (de BAIXO para CIMA na UI)
    // Ou seja: index 0 = fundo, index N-1 = topo
    // Para renderização: fundo (index 0) deve ter zIndex MENOR, topo deve ter zIndex MAIOR
    // Então usamos o index diretamente como zIndex!
    const layers: PsdLayer[] = []
    if (psd.children) {
      const totalLayers = psd.children.length
      log(`[PSD Parser] Processing ${totalLayers} root layers`)
      psd.children.forEach((layer, index) => {
        // index 0 (fundo no PS) = zIndex 0 = renderizado primeiro
        // index N-1 (topo no PS) = zIndex maior = renderizado por último
        const zIndex = index
        log(`[PSD Parser] Root layer "${layer.name}" index: ${index} -> zIndex: ${zIndex}`)
        layers.push(
          processLayer(layer, zIndex, layerImages, options.extractLayerImages ?? true)
        )
      })
    }

    // Encontrar Smart Objects (passa layerImages para herdar máscaras de grupos)
    const insertAreas = findSmartObjects(layers, layerImages)

    if (insertAreas.length === 0) {
      warnings.push('Nenhum Smart Object encontrado no PSD. O mockup não terá áreas editáveis.')
    }

    // Extrair thumbnail
    let thumbnail: string | undefined
    if (psd.imageResources?.thumbnail) {
      thumbnail = canvasToBase64(psd.imageResources.thumbnail)
    } else if (psd.canvas) {
      thumbnail = canvasToBase64(psd.canvas)
    }

    // Extrair imagem composta do PSD (para usar como base)
    if (psd.canvas) {
      const compositeBase64 = canvasToBase64(psd.canvas)
      if (compositeBase64) {
        layerImages.set('__composite__', compositeBase64)
      }
    }

    // Identificar camadas especiais para renderização em camadas
    const renderLayers = findRenderLayers(layers)
    log('[PSD Parser] Render layers found:', renderLayers)

    // Criar template
    const template: MockupTemplate = {
      id: `mockup-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      name: options.name ?? 'Mockup Importado',
      description: options.description ?? '',
      category: options.category ?? 'other',
      tags: options.tags ?? [],
      canvasSize: {
        width: psd.width,
        height: psd.height,
      },
      layers,
      insertAreas,
      thumbnail,
      metadata: {
        originalFilename: options.name ?? 'unknown.psd',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        version: 1,
      },
      renderLayers: (renderLayers.baseLayerId || renderLayers.overlayLayerId)
        ? renderLayers
        : undefined,
    }

    return {
      success: true,
      template,
      layerImages,
      errors,
      warnings,
    }
  } catch (error) {
    errors.push(`Erro ao parsear PSD: ${error instanceof Error ? error.message : 'Erro desconhecido'}`)
    return { success: false, errors, warnings }
  }
}

/**
 * Parse de arquivo PSD a partir de File
 */
export async function parsePsdFile(
  file: File,
  options: PsdParseOptions = {}
): Promise<PsdParseResult> {
  const buffer = await file.arrayBuffer()
  return parsePsd(buffer, {
    ...options,
    name: options.name ?? file.name.replace('.psd', ''),
  })
}

/**
 * Valida se um arquivo é um PSD válido
 */
export function isPsdFile(file: File): boolean {
  return file.name.toLowerCase().endsWith('.psd') || file.type === 'image/vnd.adobe.photoshop'
}
