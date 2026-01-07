/**
 * Figma Importer Service
 * 
 * Converte estruturas de nós do Figma para o formato interno de Template.
 * Mapeia Auto Layout do Figma para propriedades Yoga.
 */

import { nanoid } from 'nanoid'
import { getGoogleFontsUrl, categorizeFontsAsync } from '@/lib/fonts/google-fonts'
import type {
  FigmaSceneNode,
  FigmaFrameNode,
  FigmaTextNode,
  FigmaPaint,
  FigmaEffect,
  FigmaImportConfig,
  FigmaImportResult,
  FigmaNodesResponse,
  FigmaImagesResponse,
  FigmaTypeStyle,
  FigmaColor,
} from '@/types/figma'
import { parseFigmaUrl } from '@/types/figma'
import type {
  Template,
  SceneNode,
  FrameNode,
  TextNode,
  ImageNode,
  RectangleNode,
  EllipseNode,
  VectorNode,
  VectorPath,
  Color,
  Fill,
  SolidFill,
  GradientFill,
  ImageFill,
  Shadow,
  Border,
  CornerRadius,
  AutoLayoutProps,
  TextStyle,
  TextProps,
  ImageProps,
  LayoutMode,
  SizingMode,
  Alignment,
  TextAlign,
  FontWeight,
  TemplateCategory,
  TemplateFormat,
} from '@/types/studio'
import { DEFAULT_AUTO_LAYOUT, DEFAULT_TEXT_STYLE, DEFAULT_GOVERNANCE } from '@/types/studio'

// ============================================
// CACHE - Evita requisições repetidas
// ============================================

interface CacheEntry {
  data: FigmaNodesResponse
  timestamp: number
}

// Cache em memória (dura enquanto a página estiver aberta)
const nodeCache = new Map<string, CacheEntry>()
const CACHE_TTL = 5 * 60 * 1000 // 5 minutos

function getCacheKey(fileKey: string, nodeId: string): string {
  return `${fileKey}:${nodeId}`
}

function getFromCache(fileKey: string, nodeId: string): FigmaNodesResponse | null {
  const key = getCacheKey(fileKey, nodeId)
  const entry = nodeCache.get(key)
  
  if (!entry) return null
  
  // Verificar se expirou
  if (Date.now() - entry.timestamp > CACHE_TTL) {
    nodeCache.delete(key)
    return null
  }
  
  console.log('[Figma Cache] Hit para:', key)
  return entry.data
}

function setCache(fileKey: string, nodeId: string, data: FigmaNodesResponse): void {
  const key = getCacheKey(fileKey, nodeId)
  nodeCache.set(key, { data, timestamp: Date.now() })
  console.log('[Figma Cache] Salvo:', key)
}

// ============================================
// FIGMA API CLIENT
// ============================================

const FIGMA_API_BASE = 'https://api.figma.com/v1'

interface FigmaApiClient {
  getFile(fileKey: string): Promise<Response>
  getNodes(fileKey: string, nodeIds: string[]): Promise<FigmaNodesResponse>
  getImages(fileKey: string, nodeIds: string[], format?: string, scale?: number): Promise<FigmaImagesResponse>
}

/**
 * Fetch simples com timeout e melhor tratamento de erros
 */
async function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeoutMs = 30000
): Promise<Response> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs)
  
  console.log('[Figma API] Fazendo requisição para:', url.split('?')[0])
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    })
    
    clearTimeout(timeoutId)
    
    console.log('[Figma API] Status:', response.status)
    
    if (response.status === 429) {
      throw new Error('Limite de requisições da API do Figma excedido (429). Aguarde 1-2 minutos e tente novamente.')
    }
    
    if (response.status === 403) {
      throw new Error('Acesso negado (403). Verifique se o token tem permissão para acessar este arquivo.')
    }
    
    if (response.status === 404) {
      throw new Error('Arquivo ou nó não encontrado (404). Verifique se a URL está correta.')
    }
    
    if (!response.ok) {
      const errorText = await response.text().catch(() => response.statusText)
      throw new Error(`Erro da API do Figma: ${response.status} - ${errorText}`)
    }
    
    return response
  } catch (error) {
    clearTimeout(timeoutId)
    
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Timeout: A requisição demorou muito. Verifique sua conexão e tente novamente.')
    }
    
    throw error
  }
}

function createFigmaClient(accessToken: string): FigmaApiClient {
  const headers = {
    'X-Figma-Token': accessToken,
    'Content-Type': 'application/json',
  }

  return {
    async getFile(fileKey: string) {
      // Usar depth=1 para reduzir dados e evitar rate limit
      return fetchWithTimeout(`${FIGMA_API_BASE}/files/${fileKey}?depth=1`, { headers })
    },

    async getNodes(fileKey: string, nodeIds: string[]): Promise<FigmaNodesResponse> {
      // IMPORTANTE: Usar /files/{key}?ids= em vez de /files/{key}/nodes
      // O endpoint /nodes tem rate limit muito mais restritivo
      const ids = nodeIds.join(',')
      const response = await fetchWithTimeout(
        `${FIGMA_API_BASE}/files/${fileKey}?ids=${encodeURIComponent(ids)}`, 
        { headers }
      )
      const fileData = await response.json()
      
      // Converter resposta do /files para formato do /nodes
      // O /files retorna o documento completo, precisamos extrair os nós
      const nodes: Record<string, { document: FigmaSceneNode }> = {}
      
      // Função recursiva para encontrar nós por ID
      const findNodeById = (node: FigmaSceneNode, targetId: string): FigmaSceneNode | null => {
        if (node.id === targetId) return node
        if (node.children) {
          for (const child of node.children) {
            const found = findNodeById(child, targetId)
            if (found) return found
          }
        }
        return null
      }
      
      // Buscar cada nó solicitado no documento
      for (const nodeId of nodeIds) {
        // Primeiro verificar nas páginas (children do document)
        for (const page of fileData.document?.children || []) {
          if (page.id === nodeId) {
            // Se o nó é uma página, pegar o primeiro frame dela
            const firstFrame = page.children?.[0]
            if (firstFrame) {
              nodes[nodeId] = { document: firstFrame }
            } else {
              nodes[nodeId] = { document: page }
            }
            break
          }
          // Buscar dentro da página
          const found = findNodeById(page, nodeId)
          if (found) {
            nodes[nodeId] = { document: found }
            break
          }
        }
      }
      
      return { nodes } as FigmaNodesResponse
    },

    async getImages(fileKey: string, nodeIds: string[], format = 'png', scale = 2): Promise<FigmaImagesResponse> {
      const ids = nodeIds.join(',')
      const response = await fetchWithTimeout(
        `${FIGMA_API_BASE}/images/${fileKey}?ids=${encodeURIComponent(ids)}&format=${format}&scale=${scale}`,
        { headers }
      )
      return response.json()
    },
  }
}

// ============================================
// COLOR CONVERSION
// ============================================

/**
 * Convert Figma color (0-1 range) to internal Color (0-255 range)
 */
function convertFigmaColor(figmaColor: FigmaColor): Color {
  return {
    r: Math.round(figmaColor.r * 255),
    g: Math.round(figmaColor.g * 255),
    b: Math.round(figmaColor.b * 255),
    a: figmaColor.a,
  }
}

/**
 * Convert internal Color to hex string
 */
function colorToHex(color: Color): string {
  const r = color.r.toString(16).padStart(2, '0')
  const g = color.g.toString(16).padStart(2, '0')
  const b = color.b.toString(16).padStart(2, '0')
  return `#${r}${g}${b}`
}

// ============================================
// FILL CONVERSION
// ============================================

function convertFigmaPaint(paint: FigmaPaint): Fill | null {
  if (paint.visible === false) return null

  switch (paint.type) {
    case 'SOLID':
      if (!paint.color) return null
      const solidFill: SolidFill = {
        type: 'SOLID',
        color: convertFigmaColor(paint.color),
      }
      if (paint.opacity !== undefined && paint.opacity < 1) {
        solidFill.color.a = paint.opacity
      }
      return solidFill

    case 'GRADIENT_LINEAR':
    case 'GRADIENT_RADIAL':
      if (!paint.gradientStops) return null
      const gradientFill: GradientFill = {
        type: paint.type === 'GRADIENT_LINEAR' ? 'GRADIENT_LINEAR' : 'GRADIENT_RADIAL',
        stops: paint.gradientStops.map(stop => ({
          position: stop.position,
          color: convertFigmaColor(stop.color),
        })),
      }
      // Calculate angle from gradient handle positions for linear gradients
      if (paint.type === 'GRADIENT_LINEAR' && paint.gradientHandlePositions && paint.gradientHandlePositions.length >= 2) {
        const [start, end] = paint.gradientHandlePositions
        const angle = Math.atan2(end.y - start.y, end.x - start.x) * (180 / Math.PI)
        gradientFill.angle = angle
      }
      return gradientFill

    case 'IMAGE':
      const imageFill: ImageFill = {
        type: 'IMAGE',
        src: paint.imageRef || undefined,
        scaleMode: paint.scaleMode === 'TILE' ? 'TILE' : paint.scaleMode === 'FIT' ? 'FIT' : 'FILL',
      }
      return imageFill

    default:
      return null
  }
}

function convertFigmaFills(fills?: FigmaPaint[]): Fill[] {
  if (!fills) return []
  return fills
    .map(convertFigmaPaint)
    .filter((fill): fill is Fill => fill !== null)
}

// ============================================
// EFFECT CONVERSION
// ============================================

function convertFigmaEffects(effects?: FigmaEffect[]): Shadow[] {
  if (!effects) return []
  
  return effects
    .filter(effect => effect.visible && (effect.type === 'DROP_SHADOW' || effect.type === 'INNER_SHADOW'))
    .map(effect => ({
      color: effect.color ? convertFigmaColor(effect.color) : { r: 0, g: 0, b: 0, a: 0.25 },
      offset: effect.offset || { x: 0, y: 0 },
      blur: effect.radius || 0,
      spread: effect.spread || 0,
    }))
}

// ============================================
// BORDER CONVERSION
// ============================================

function convertFigmaStrokes(strokes?: FigmaPaint[], strokeWeight?: number): Border | undefined {
  if (!strokes || strokes.length === 0 || !strokeWeight) return undefined

  const visibleStroke = strokes.find(s => s.visible !== false && s.type === 'SOLID' && s.color)
  if (!visibleStroke || !visibleStroke.color) return undefined

  return {
    color: convertFigmaColor(visibleStroke.color),
    width: strokeWeight,
    style: 'SOLID',
  }
}

// ============================================
// CORNER RADIUS CONVERSION
// ============================================

function convertCornerRadius(node: FigmaSceneNode): CornerRadius | number {
  if (node.rectangleCornerRadii) {
    const [topLeft, topRight, bottomRight, bottomLeft] = node.rectangleCornerRadii
    return { topLeft, topRight, bottomRight, bottomLeft }
  }
  return node.cornerRadius || 0
}

// ============================================
// LAYOUT CONVERSION
// ============================================

function mapFigmaLayoutMode(mode?: string): LayoutMode {
  switch (mode) {
    case 'HORIZONTAL':
      return 'HORIZONTAL'
    case 'VERTICAL':
      return 'VERTICAL'
    default:
      return 'NONE'
  }
}

function mapFigmaSizingMode(mode?: string): SizingMode {
  switch (mode) {
    case 'HUG':
      return 'HUG'
    case 'FILL':
      return 'FILL'
    default:
      return 'FIXED'
  }
}

function mapFigmaPrimaryAlignment(alignment?: string): Alignment {
  switch (alignment) {
    case 'MIN':
      return 'START'
    case 'CENTER':
      return 'CENTER'
    case 'MAX':
      return 'END'
    case 'SPACE_BETWEEN':
      return 'SPACE_BETWEEN'
    default:
      return 'START'
  }
}

function mapFigmaCounterAlignment(alignment?: string): Alignment {
  switch (alignment) {
    case 'MIN':
      return 'START'
    case 'CENTER':
      return 'CENTER'
    case 'MAX':
      return 'END'
    default:
      return 'START'
  }
}

function convertFigmaAutoLayout(node: FigmaSceneNode): AutoLayoutProps {
  const layoutMode = mapFigmaLayoutMode(node.layoutMode)
  
  // Preserve layoutPositioning for absolute positioned elements
  const layoutPositioning = node.layoutPositioning as 'AUTO' | 'ABSOLUTE' | undefined
  
  if (layoutMode === 'NONE') {
    return { 
      ...DEFAULT_AUTO_LAYOUT,
      layoutPositioning,
    }
  }

  return {
    layoutMode,
    horizontalSizing: mapFigmaSizingMode(node.layoutSizingHorizontal || node.primaryAxisSizingMode),
    verticalSizing: mapFigmaSizingMode(node.layoutSizingVertical || node.counterAxisSizingMode),
    primaryAxisAlignment: mapFigmaPrimaryAlignment(node.primaryAxisAlignItems),
    counterAxisAlignment: mapFigmaCounterAlignment(node.counterAxisAlignItems),
    padding: {
      top: node.paddingTop || 0,
      right: node.paddingRight || 0,
      bottom: node.paddingBottom || 0,
      left: node.paddingLeft || 0,
    },
    gap: node.itemSpacing || 0,
    wrap: node.layoutWrap === 'WRAP',
    layoutPositioning,
  }
}

// ============================================
// TEXT STYLE CONVERSION
// ============================================

function mapFigmaTextAlign(align?: string): TextAlign {
  switch (align) {
    case 'CENTER':
      return 'CENTER'
    case 'RIGHT':
      return 'RIGHT'
    case 'JUSTIFIED':
      return 'JUSTIFY'
    default:
      return 'LEFT'
  }
}

function mapFigmaFontWeight(weight?: number): FontWeight {
  if (!weight) return 400
  // Clamp to valid font weights
  const validWeights: FontWeight[] = [100, 200, 300, 400, 500, 600, 700, 800, 900]
  return validWeights.reduce((prev, curr) => 
    Math.abs(curr - weight) < Math.abs(prev - weight) ? curr : prev
  )
}

function convertFigmaTextStyle(style?: FigmaTypeStyle): TextStyle {
  if (!style) return { ...DEFAULT_TEXT_STYLE }

  // Calculate line height as multiplier (e.g., 1.5 = 150% of fontSize)
  let lineHeight: number | 'AUTO' = 'AUTO'
  if (style.lineHeightUnit === 'PIXELS' && style.lineHeightPx) {
    lineHeight = style.lineHeightPx / style.fontSize // Convert to multiplier
  } else if (style.lineHeightPercentFontSize) {
    lineHeight = style.lineHeightPercentFontSize / 100 // Already a multiplier
  } else if (style.lineHeightPercent) {
    lineHeight = style.lineHeightPercent / 100 // Already a multiplier
  }

  return {
    fontFamily: style.fontFamily || 'Inter',
    fontSize: style.fontSize || 16,
    fontWeight: mapFigmaFontWeight(style.fontWeight),
    fontStyle: style.italic ? 'italic' : 'normal',
    lineHeight,
    letterSpacing: style.letterSpacing || 0,
    textAlign: mapFigmaTextAlign(style.textAlignHorizontal),
    textDecoration: style.textDecoration === 'UNDERLINE' ? 'UNDERLINE' : 
                    style.textDecoration === 'STRIKETHROUGH' ? 'STRIKETHROUGH' : 'NONE',
    textTransform: style.textCase === 'UPPER' ? 'UPPERCASE' :
                   style.textCase === 'LOWER' ? 'LOWERCASE' :
                   style.textCase === 'TITLE' ? 'CAPITALIZE' : 'NONE',
  }
}

// ============================================
// IMAGE URL UPDATER
// ============================================

/**
 * Recursively update image nodes with fetched URLs
 * @param node - The node to update
 * @param imageMap - Map from Figma node ID to image URL
 * @param nodeMapping - Map from internal node ID to Figma node ID
 */
function updateImageUrls(
  node: SceneNode, 
  imageMap: Record<string, string>,
  nodeMapping: Map<string, string>
): void {
  // Get the Figma node ID from our mapping
  const figmaNodeId = nodeMapping.get(node.id)
  
  // Update IMAGE nodes
  if (node.type === 'IMAGE') {
    const imageNode = node as ImageNode
    
    if (figmaNodeId && imageMap[figmaNodeId]) {
      imageNode.imageProps = {
        ...imageNode.imageProps,
        src: imageMap[figmaNodeId],
      }
      console.log(`[Figma Import] Updated IMAGE node ${node.name}: ${imageMap[figmaNodeId].substring(0, 50)}...`)
    }
  }
  
  // Update FRAME nodes with image fills
  if (node.type === 'FRAME') {
    const frameNode = node as FrameNode
    
    // Check if this frame has an image fill that needs updating
    if (figmaNodeId && imageMap[figmaNodeId]) {
      // Find and update the image fill
      for (const fill of frameNode.fills) {
        if (fill.type === 'IMAGE') {
          const imageFill = fill as ImageFill
          imageFill.src = imageMap[figmaNodeId]
          console.log(`[Figma Import] Updated FRAME fill ${node.name}: ${imageMap[figmaNodeId].substring(0, 50)}...`)
          break
        }
      }
    }
    
    // Recursively process children
    for (const child of frameNode.children) {
      updateImageUrls(child, imageMap, nodeMapping)
    }
  }
}

// ============================================
// NODE CONVERSION
// ============================================

interface ConversionContext {
  imageNodes: string[] // Figma node IDs for image API
  imageNodeMapping: Map<string, string> // Map from internal node ID to Figma node ID
  warnings: string[]
  parentBounds?: { x: number; y: number }
}

function generateNodeId(): string {
  return `node_${nanoid(10)}`
}

function getNodePosition(node: FigmaSceneNode, ctx: ConversionContext): { x: number; y: number } {
  if (!node.absoluteBoundingBox) {
    return { x: 0, y: 0 }
  }
  
  const parentX = ctx.parentBounds?.x || 0
  const parentY = ctx.parentBounds?.y || 0
  
  return {
    x: node.absoluteBoundingBox.x - parentX,
    y: node.absoluteBoundingBox.y - parentY,
  }
}

function getNodeSize(node: FigmaSceneNode): { width: number; height: number } {
  if (!node.absoluteBoundingBox) {
    return { width: 100, height: 100 }
  }
  return {
    width: node.absoluteBoundingBox.width,
    height: node.absoluteBoundingBox.height,
  }
}

/**
 * Check if a node has image fill
 */
function hasImageFill(node: FigmaSceneNode): boolean {
  return node.fills?.some(fill => fill.type === 'IMAGE' && fill.visible !== false) || false
}

/**
 * Convert a Figma TEXT node to internal TextNode
 */
function convertTextNode(node: FigmaTextNode, ctx: ConversionContext): TextNode {
  const position = getNodePosition(node, ctx)
  const size = getNodeSize(node)
  const fills = convertFigmaFills(node.fills)
  
  // Get text color from fills
  const textFills = node.style?.fills ? convertFigmaFills(node.style.fills) : fills

  // Extract list options from style or detect from content
  // Note: REST API doesn't expose listOptions, so we detect bullets in content
  let listOptions: TextProps['listOptions'] = undefined
  const content = node.characters || ''
  
  // Log text content and style overrides for debugging
  console.log(`[Figma Import] TEXT "${node.name}" content:`, JSON.stringify(content.substring(0, 100)))
  console.log(`[Figma Import] TEXT "${node.name}" style.listOptions:`, node.style?.listOptions)
  console.log(`[Figma Import] TEXT "${node.name}" styleOverrideTable:`, node.styleOverrideTable)
  console.log(`[Figma Import] TEXT "${node.name}" characterStyleOverrides:`, node.characterStyleOverrides?.slice(0, 20))
  
  // Detect bullet points in content (Figma uses • for unordered lists)
  const lines = content.split('\n')
  const hasBullets = lines.some(line => /^[•\-\*]\s/.test(line.trim()))
  const hasNumbers = lines.some(line => /^\d+[\.\)]\s/.test(line.trim()))
  
  // Also check styleOverrideTable for list options
  let hasListInOverrides = false
  if (node.styleOverrideTable) {
    for (const key of Object.keys(node.styleOverrideTable)) {
      const override = node.styleOverrideTable[Number(key)]
      if (override?.listOptions) {
        hasListInOverrides = true
        console.log(`[Figma Import] TEXT "${node.name}" found listOptions in override ${key}:`, override.listOptions)
      }
    }
  }
  
  console.log(`[Figma Import] TEXT "${node.name}" hasBullets=${hasBullets} hasNumbers=${hasNumbers} hasListInOverrides=${hasListInOverrides}`)
  
  if (node.style?.listOptions) {
    listOptions = {
      type: node.style.listOptions.type || 'NONE',
    }
  } else if (hasBullets) {
    listOptions = { type: 'UNORDERED' }
  } else if (hasNumbers) {
    listOptions = { type: 'ORDERED' }
  }

  const textProps: TextProps = {
    content,
    style: convertFigmaTextStyle(node.style),
    editable: true,
    listOptions,
    indentation: node.style?.indentation,
    paragraphSpacing: node.style?.paragraphSpacing,
  }

  // Determine sizing based on text auto-resize
  let horizontalSizing: SizingMode = 'FIXED'
  let verticalSizing: SizingMode = 'HUG'
  
  if (node.style?.textAutoResize === 'WIDTH_AND_HEIGHT') {
    horizontalSizing = 'HUG'
    verticalSizing = 'HUG'
  } else if (node.style?.textAutoResize === 'HEIGHT') {
    horizontalSizing = 'FIXED'
    verticalSizing = 'HUG'
  }

  return {
    id: generateNodeId(),
    name: node.name,
    type: 'TEXT',
    visible: node.visible !== false,
    locked: node.locked || false,
    opacity: node.opacity ?? 1,
    blendMode: 'NORMAL',
    position,
    size,
    rotation: node.rotation || 0,
    cornerRadius: 0,
    fills: textFills,
    shadows: convertFigmaEffects(node.effects),
    autoLayout: {
      ...DEFAULT_AUTO_LAYOUT,
      horizontalSizing,
      verticalSizing,
    },
    textProps,
    governance: DEFAULT_GOVERNANCE,
  }
}

/**
 * Convert a Figma RECTANGLE node to internal RectangleNode or ImageNode
 */
function convertRectangleNode(node: FigmaSceneNode, ctx: ConversionContext): RectangleNode | ImageNode {
  const position = getNodePosition(node, ctx)
  const size = getNodeSize(node)
  const fills = convertFigmaFills(node.fills)

  // Check if this is actually an image container
  if (hasImageFill(node)) {
    ctx.imageNodes.push(node.id)
    
    const imageFill = node.fills?.find(f => f.type === 'IMAGE')
    const internalNodeId = generateNodeId()
    
    // Store mapping from internal ID to Figma ID for image URL resolution
    ctx.imageNodeMapping.set(internalNodeId, node.id)
    
    const imageProps: ImageProps = {
      src: imageFill?.imageRef || undefined,
      alt: node.name,
      objectFit: imageFill?.scaleMode === 'FIT' ? 'FIT' : 'FILL',
      objectPosition: { x: 0.5, y: 0.5 },
    }

    return {
      id: internalNodeId,
      name: node.name,
      type: 'IMAGE',
      visible: node.visible !== false,
      locked: node.locked || false,
      opacity: node.opacity ?? 1,
      blendMode: 'NORMAL',
      position,
      size,
      rotation: node.rotation || 0,
      cornerRadius: convertCornerRadius(node),
      fills: [], // Image nodes don't need fills
      border: convertFigmaStrokes(node.strokes, node.strokeWeight),
      shadows: convertFigmaEffects(node.effects),
      autoLayout: {
        ...DEFAULT_AUTO_LAYOUT,
        horizontalSizing: mapFigmaSizingMode(node.layoutSizingHorizontal),
        verticalSizing: mapFigmaSizingMode(node.layoutSizingVertical),
      },
      imageProps,
      governance: DEFAULT_GOVERNANCE,
    } as ImageNode
  }

  return {
    id: generateNodeId(),
    name: node.name,
    type: 'RECTANGLE',
    visible: node.visible !== false,
    locked: node.locked || false,
    opacity: node.opacity ?? 1,
    blendMode: 'NORMAL',
    position,
    size,
    rotation: node.rotation || 0,
    cornerRadius: convertCornerRadius(node),
    fills,
    border: convertFigmaStrokes(node.strokes, node.strokeWeight),
    shadows: convertFigmaEffects(node.effects),
    autoLayout: {
      ...DEFAULT_AUTO_LAYOUT,
      horizontalSizing: mapFigmaSizingMode(node.layoutSizingHorizontal),
      verticalSizing: mapFigmaSizingMode(node.layoutSizingVertical),
    },
    governance: DEFAULT_GOVERNANCE,
  }
}

/**
 * Convert a Figma LINE node to internal LineNode (as RectangleNode)
 */
function convertLineNode(node: FigmaSceneNode, ctx: ConversionContext): RectangleNode {
  const position = getNodePosition(node, ctx)
  const size = getNodeSize(node)
  
  // Lines have stroke color, use it as fill
  const fills = node.strokes ? convertFigmaFills(node.strokes) : []
  
  // Ensure minimum height for visibility
  const lineHeight = Math.max(node.strokeWeight || 1, 1)
  
  return {
    id: generateNodeId(),
    name: node.name,
    type: 'RECTANGLE',
    visible: node.visible !== false,
    locked: node.locked || false,
    opacity: node.opacity ?? 1,
    blendMode: 'NORMAL',
    position,
    size: {
      width: size.width || 100,
      height: lineHeight,
    },
    rotation: node.rotation || 0,
    cornerRadius: 0,
    fills,
    border: undefined,
    shadows: convertFigmaEffects(node.effects),
    autoLayout: {
      ...DEFAULT_AUTO_LAYOUT,
      horizontalSizing: 'FIXED',
      verticalSizing: 'FIXED',
    },
    governance: DEFAULT_GOVERNANCE,
  }
}

/**
 * Convert a Figma VECTOR node to an ImageNode
 * Since REST API doesn't provide fillGeometry/strokeGeometry,
 * we export vectors as images using the Figma images API
 */
function convertVectorAsImage(node: FigmaSceneNode, ctx: ConversionContext): ImageNode {
  const position = getNodePosition(node, ctx)
  const size = getNodeSize(node)
  const internalNodeId = generateNodeId()
  
  // Store mapping for image URL resolution
  ctx.imageNodeMapping.set(internalNodeId, node.id)
  
  return {
    id: internalNodeId,
    name: node.name,
    type: 'IMAGE',
    visible: node.visible !== false,
    locked: node.locked || false,
    opacity: node.opacity ?? 1,
    blendMode: 'NORMAL',
    position,
    size,
    rotation: node.rotation || 0,
    cornerRadius: 0,
    fills: [],
    border: undefined,
    shadows: convertFigmaEffects(node.effects),
    autoLayout: {
      ...DEFAULT_AUTO_LAYOUT,
      horizontalSizing: mapFigmaSizingMode(node.layoutSizingHorizontal),
      verticalSizing: mapFigmaSizingMode(node.layoutSizingVertical),
    },
    governance: DEFAULT_GOVERNANCE,
    imageProps: {
      src: undefined, // Will be filled by updateImageUrls
      alt: node.name,
      objectFit: 'FIT',
      objectPosition: { x: 0.5, y: 0.5 },
    },
  }
}

/**
 * Convert a Figma VECTOR node to internal VectorNode
 * Handles pen tool, pencil, and other vector shapes
 * NOTE: This is kept for future use when Plugin API is available
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function convertVectorNode(node: FigmaSceneNode, ctx: ConversionContext): VectorNode {
  const position = getNodePosition(node, ctx)
  const size = getNodeSize(node)
  const fills = convertFigmaFills(node.fills)
  
  // Convert fillGeometry and strokeGeometry to VectorPath arrays
  const fillPaths: VectorPath[] = []
  const strokePaths: VectorPath[] = []
  
  // fillGeometry contains SVG path data
  if (node.fillGeometry && Array.isArray(node.fillGeometry)) {
    for (const geom of node.fillGeometry) {
      if (geom.path) {
        fillPaths.push({
          path: geom.path,
          windingRule: geom.windingRule === 'EVENODD' ? 'EVENODD' : 'NONZERO',
        })
      }
    }
  }
  
  // strokeGeometry contains SVG path data for strokes
  if (node.strokeGeometry && Array.isArray(node.strokeGeometry)) {
    for (const geom of node.strokeGeometry) {
      if (geom.path) {
        strokePaths.push({
          path: geom.path,
          windingRule: geom.windingRule === 'EVENODD' ? 'EVENODD' : 'NONZERO',
        })
      }
    }
  }
  
  return {
    id: generateNodeId(),
    name: node.name,
    type: 'VECTOR',
    visible: node.visible !== false,
    locked: node.locked || false,
    opacity: node.opacity ?? 1,
    blendMode: 'NORMAL',
    position,
    size,
    rotation: node.rotation || 0,
    cornerRadius: 0,
    fills,
    border: convertFigmaStrokes(node.strokes, node.strokeWeight),
    shadows: convertFigmaEffects(node.effects),
    autoLayout: {
      ...DEFAULT_AUTO_LAYOUT,
      horizontalSizing: mapFigmaSizingMode(node.layoutSizingHorizontal),
      verticalSizing: mapFigmaSizingMode(node.layoutSizingVertical),
    },
    governance: DEFAULT_GOVERNANCE,
    fillPaths: fillPaths.length > 0 ? fillPaths : undefined,
    strokePaths: strokePaths.length > 0 ? strokePaths : undefined,
    strokeCap: node.strokeCap === 'ROUND' ? 'ROUND' : node.strokeCap === 'SQUARE' ? 'SQUARE' : 'NONE',
    strokeJoin: node.strokeJoin === 'ROUND' ? 'ROUND' : node.strokeJoin === 'BEVEL' ? 'BEVEL' : 'MITER',
    strokeMiterLimit: node.strokeMiterLimit,
    dashPattern: node.dashPattern,
  }
}

/**
 * Convert a Figma ELLIPSE node to internal EllipseNode
 */
function convertEllipseNode(node: FigmaSceneNode, ctx: ConversionContext): EllipseNode {
  const position = getNodePosition(node, ctx)
  const size = getNodeSize(node)
  const fills = convertFigmaFills(node.fills)

  return {
    id: generateNodeId(),
    name: node.name,
    type: 'ELLIPSE',
    visible: node.visible !== false,
    locked: node.locked || false,
    opacity: node.opacity ?? 1,
    blendMode: 'NORMAL',
    position,
    size,
    rotation: node.rotation || 0,
    cornerRadius: 0,
    fills,
    border: convertFigmaStrokes(node.strokes, node.strokeWeight),
    shadows: convertFigmaEffects(node.effects),
    autoLayout: {
      ...DEFAULT_AUTO_LAYOUT,
      horizontalSizing: mapFigmaSizingMode(node.layoutSizingHorizontal),
      verticalSizing: mapFigmaSizingMode(node.layoutSizingVertical),
    },
    governance: DEFAULT_GOVERNANCE,
  }
}

/**
 * Convert a Figma FRAME/GROUP/COMPONENT/INSTANCE node to internal FrameNode
 */
function convertFrameNode(node: FigmaFrameNode, ctx: ConversionContext): FrameNode {
  const position = getNodePosition(node, ctx)
  const size = getNodeSize(node)
  const internalNodeId = generateNodeId()
  
  // Check if frame has image fill - need to fetch the image
  const hasImage = hasImageFill(node)
  if (hasImage) {
    ctx.imageNodes.push(node.id)
    ctx.imageNodeMapping.set(internalNodeId, node.id)
  }
  
  // Convert fills - for image fills, we'll update the src later
  const fills = convertFigmaFills(node.fills)

  // Create new context for children with this node's bounds
  const childCtx: ConversionContext = {
    ...ctx,
    parentBounds: node.absoluteBoundingBox ? {
      x: node.absoluteBoundingBox.x,
      y: node.absoluteBoundingBox.y,
    } : ctx.parentBounds,
  }

  // Convert children recursively
  const children: SceneNode[] = []
  const hasAutoLayout = node.layoutMode === 'HORIZONTAL' || node.layoutMode === 'VERTICAL'
  
  if (node.children) {
    for (const child of node.children) {
      // Log for debugging
      console.log(`[Figma Import] Child "${child.name}" type=${child.type} layoutPositioning=${child.layoutPositioning || 'undefined'} parentAutoLayout=${hasAutoLayout}`)
      
      const converted = convertNode(child, childCtx)
      if (converted) {
        // If parent has auto-layout but child doesn't have layoutPositioning set,
        // and child is a RECTANGLE (like Divider), check if it should be absolute
        // based on its position relative to siblings
        children.push(converted)
      }
    }
  }

  return {
    id: internalNodeId,
    name: node.name,
    type: 'FRAME',
    visible: node.visible !== false,
    locked: node.locked || false,
    opacity: node.opacity ?? 1,
    blendMode: 'NORMAL',
    position,
    size,
    rotation: node.rotation || 0,
    cornerRadius: convertCornerRadius(node),
    fills,
    border: convertFigmaStrokes(node.strokes, node.strokeWeight),
    shadows: convertFigmaEffects(node.effects),
    autoLayout: convertFigmaAutoLayout(node),
    clipsContent: node.clipsContent ?? false,
    children,
    governance: DEFAULT_GOVERNANCE,
  }
}

/**
 * Main node conversion dispatcher
 */
function convertNode(node: FigmaSceneNode, ctx: ConversionContext): SceneNode | null {
  // Skip invisible nodes
  if (node.visible === false) {
    return null
  }

  switch (node.type) {
    case 'FRAME':
    case 'GROUP':
    case 'COMPONENT':
    case 'COMPONENT_SET':
    case 'INSTANCE':
      return convertFrameNode(node as FigmaFrameNode, ctx)

    case 'TEXT':
      return convertTextNode(node as FigmaTextNode, ctx)

    case 'RECTANGLE':
      return convertRectangleNode(node, ctx)

    case 'ELLIPSE':
      return convertEllipseNode(node, ctx)

    case 'VECTOR':
    case 'STAR':
    case 'REGULAR_POLYGON':
    case 'BOOLEAN_OPERATION':
      // Vector shapes - add to image nodes to export as SVG/PNG
      // REST API doesn't provide fillGeometry/strokeGeometry, so we export as image
      ctx.imageNodes.push(node.id)
      return convertVectorAsImage(node, ctx)

    case 'LINE':
      // Lines should also be exported as images to preserve rotation/orientation
      ctx.imageNodes.push(node.id)
      return convertVectorAsImage(node, ctx)

    default:
      ctx.warnings.push(`Unknown node type "${node.type}" for "${node.name}" - skipped`)
      return null
  }
}

// ============================================
// TEMPLATE DETECTION
// ============================================

function detectTemplateFormat(width: number, height: number): { format: TemplateFormat; category: TemplateCategory } {
  // Common format detection based on dimensions
  const ratio = width / height
  
  // Instagram Post (1:1)
  if (Math.abs(ratio - 1) < 0.05 && width >= 1000) {
    return { format: 'instagram_post', category: 'social_instagram' }
  }
  
  // Instagram Story (9:16)
  if (Math.abs(ratio - 0.5625) < 0.05) {
    return { format: 'instagram_story', category: 'social_instagram' }
  }
  
  // LinkedIn Post
  if (Math.abs(ratio - 1.91) < 0.1 && width >= 1000) {
    return { format: 'linkedin_post', category: 'social_linkedin' }
  }
  
  // A4 Portrait (approximately)
  if (Math.abs(ratio - 0.707) < 0.05 && width >= 2000) {
    return { format: 'one_pager', category: 'print_one_pager' }
  }
  
  // A4 Landscape
  if (Math.abs(ratio - 1.414) < 0.05 && height >= 2000) {
    return { format: 'flyer_a4', category: 'print_flyer' }
  }
  
  // Business card (approximately 1.75:1)
  if (Math.abs(ratio - 1.75) < 0.1 && width < 1200) {
    return { format: 'business_card', category: 'print_business_card' }
  }
  
  // Default to custom
  return { format: 'custom', category: 'other' }
}

// ============================================
// FONT COLLECTION
// ============================================

interface CollectedFont {
  family: string
  weights: Set<number>
  hasItalic: boolean
}

/**
 * Coleta todas as fontes usadas em um template
 */
function collectFontsFromNode(node: SceneNode, fonts: Map<string, CollectedFont>): void {
  if (node.type === 'TEXT') {
    const textNode = node as TextNode
    const style = textNode.textProps?.style
    
    if (style?.fontFamily) {
      const family = style.fontFamily
      const weight = style.fontWeight || 400
      const isItalic = style.fontStyle === 'italic'
      
      if (!fonts.has(family)) {
        fonts.set(family, { family, weights: new Set([weight]), hasItalic: isItalic })
      } else {
        const existing = fonts.get(family)!
        existing.weights.add(weight)
        if (isItalic) existing.hasItalic = true
      }
    }
  }
  
  // Recursivamente processa filhos
  if ('children' in node && Array.isArray(node.children)) {
    for (const child of node.children) {
      collectFontsFromNode(child as SceneNode, fonts)
    }
  }
}

/**
 * Processa as fontes coletadas e gera metadados
 */
async function processFonts(rootNode: SceneNode): Promise<{
  googleFonts: Array<{ family: string; weights: number[] }>
  customFonts: string[]
  googleFontsUrl: string | null
}> {
  const fontsMap = new Map<string, CollectedFont>()
  collectFontsFromNode(rootNode, fontsMap)
  
  const allFamilies = Array.from(fontsMap.keys())
  const { googleFonts: googleFontNames, customFonts } = await categorizeFontsAsync(allFamilies)
  
  // Prepara dados para Google Fonts
  const googleFonts = googleFontNames.map((family: string) => {
    const fontData = fontsMap.get(family)
    const weights = fontData ? Array.from(fontData.weights).sort((a, b) => a - b) : [400]
    return { family, weights }
  })
  
  // Gera URL do Google Fonts se houver fontes
  const googleFontsUrl = googleFonts.length > 0 
    ? getGoogleFontsUrl(googleFonts)
    : null
  
  return { googleFonts, customFonts, googleFontsUrl }
}

// ============================================
// MAIN IMPORT FUNCTION
// ============================================

/**
 * Import a Figma frame/page and convert to internal Template format
 */
export async function importFromFigma(config: FigmaImportConfig): Promise<FigmaImportResult> {
  const warnings: string[] = []
  
  // Validar token
  if (!config.accessToken || config.accessToken.length < 10) {
    return {
      success: false,
      errors: ['Token de acesso inválido. O token deve começar com "figd_" e ter pelo menos 40 caracteres.'],
    }
  }
  
  console.log('[Figma Import] Iniciando importação...')
  console.log('[Figma Import] FileKey:', config.fileKey)
  console.log('[Figma Import] NodeId:', config.nodeId || 'não especificado')
  
  try {
    const client = createFigmaClient(config.accessToken)
    
    // Fetch the node(s) from Figma
    let rootFigmaNode: FigmaSceneNode
    
    if (config.nodeId) {
      // Verificar cache primeiro
      const cached = getFromCache(config.fileKey, config.nodeId)
      let nodesResponse: FigmaNodesResponse
      
      if (cached) {
        console.log('[Figma Import] Usando dados do cache')
        nodesResponse = cached
      } else {
        // Fetch specific node
        console.log('[Figma Import] Buscando nó específico:', config.nodeId)
        nodesResponse = await client.getNodes(config.fileKey, [config.nodeId])
        // Salvar no cache
        setCache(config.fileKey, config.nodeId, nodesResponse)
      }
      
      const nodeData = nodesResponse.nodes[config.nodeId]
      
      if (!nodeData || !nodeData.document) {
        console.log('[Figma Import] Nó não encontrado. Nodes disponíveis:', Object.keys(nodesResponse.nodes))
        return {
          success: false,
          errors: [`Node ${config.nodeId} not found in file ${config.fileKey}`],
        }
      }
      
      rootFigmaNode = nodeData.document
      console.log('[Figma Import] Nó encontrado:', rootFigmaNode.name, 'Tipo:', rootFigmaNode.type)
      console.log('[Figma Import] Dimensões:', rootFigmaNode.absoluteBoundingBox)
      console.log('[Figma Import] Filhos:', rootFigmaNode.children?.length || 0)
    } else {
      // Fetch entire file
      const fileResponse = await client.getFile(config.fileKey)
      const fileData = await fileResponse.json()
      
      // Get first page's first frame
      const document = fileData.document
      const firstPage = document.children?.[0]
      const firstFrame = firstPage?.children?.[0]
      
      if (!firstFrame) {
        return {
          success: false,
          errors: ['No frames found in the Figma file'],
        }
      }
      
      rootFigmaNode = firstFrame
    }

    // Create conversion context
    const ctx: ConversionContext = {
      imageNodes: [],
      imageNodeMapping: new Map(),
      warnings: [],
      parentBounds: rootFigmaNode.absoluteBoundingBox ? {
        x: rootFigmaNode.absoluteBoundingBox.x,
        y: rootFigmaNode.absoluteBoundingBox.y,
      } : undefined,
    }

    // Convert the root node
    const convertedRoot = convertNode(rootFigmaNode, ctx)
    
    if (!convertedRoot || convertedRoot.type !== 'FRAME') {
      return {
        success: false,
        errors: ['Root node must be a FRAME'],
      }
    }

    // Fix root node position to 0,0
    convertedRoot.position = { x: 0, y: 0 }

    // Fetch images if needed
    let imageMap: Record<string, string> = {}
    if (config.importImages && ctx.imageNodes.length > 0) {
      try {
        // Export vectors as SVG for better quality
        const imagesResponse = await client.getImages(
          config.fileKey,
          ctx.imageNodes,
          'svg', // Use SVG format for vectors
          config.scale || 2
        )
        imageMap = imagesResponse.images || {}
      } catch (imgError) {
        warnings.push(`Failed to fetch images: ${imgError}`)
      }
    }

    // Update image nodes with fetched URLs
    if (Object.keys(imageMap).length > 0) {
      updateImageUrls(convertedRoot, imageMap, ctx.imageNodeMapping)
      console.log(`[Figma Import] Updated ${Object.keys(imageMap).length} image URLs`)
    }

    // Detect template format
    const { format, category } = detectTemplateFormat(
      convertedRoot.size.width,
      convertedRoot.size.height
    )

    // Process fonts from the template
    const fontInfo = await processFonts(convertedRoot)
    console.log('[Figma Import] Fonts found:', {
      googleFonts: fontInfo.googleFonts.map((f: { family: string }) => f.family),
      customFonts: fontInfo.customFonts,
    })

    // Create the template
    const template: Template = {
      id: `figma-import-${nanoid(8)}`,
      brandId: config.brandId || 'default',
      name: rootFigmaNode.name || 'Imported from Figma',
      description: `Imported from Figma file ${config.fileKey}`,
      category,
      format,
      rootNode: convertedRoot,
      schemaVersion: 1,
      tags: ['figma-import'],
      isPublic: false,
      aiGenerated: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: 'figma-importer',
      // Font information for rendering
      fonts: {
        googleFonts: fontInfo.googleFonts,
        customFonts: fontInfo.customFonts,
        googleFontsUrl: fontInfo.googleFontsUrl,
      },
    }

    return {
      success: true,
      template,
      warnings: [...warnings, ...ctx.warnings],
      imageMap,
    }

  } catch (error) {
    return {
      success: false,
      errors: [error instanceof Error ? error.message : 'Unknown error during import'],
      warnings,
    }
  }
}

/**
 * Import from a Figma URL
 */
export async function importFromFigmaUrl(
  url: string,
  accessToken: string,
  options?: Partial<Omit<FigmaImportConfig, 'accessToken' | 'fileKey' | 'nodeId'>>
): Promise<FigmaImportResult> {
  const parsed = parseFigmaUrl(url)
  
  if (!parsed) {
    return {
      success: false,
      errors: ['Invalid Figma URL'],
    }
  }

  return importFromFigma({
    accessToken,
    fileKey: parsed.fileKey,
    nodeId: parsed.nodeId,
    ...options,
  })
}

// ============================================
// EXPORTS
// ============================================

export {
  parseFigmaUrl,
  convertFigmaColor,
  colorToHex,
  createFigmaClient,
}

export type {
  FigmaApiClient,
  ConversionContext,
}
