import { NextRequest, NextResponse } from 'next/server'
import { getGoogleFontsUrl, categorizeFontsAsync } from '@/lib/fonts/google-fonts'

// CORS headers for Figma plugin
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

// Temporary storage for plugin imports (in production, use Redis or similar)
const pendingImports = new Map<string, unknown>()

// Handle preflight requests
export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders })
}

// GET endpoint to retrieve pending import
export async function GET(request: NextRequest) {
  const templateId = request.nextUrl.searchParams.get('templateId')
  
  if (!templateId) {
    return NextResponse.json({ error: 'Missing templateId' }, { status: 400, headers: corsHeaders })
  }
  
  const template = pendingImports.get(templateId)
  
  if (!template) {
    return NextResponse.json({ error: 'Template not found or expired' }, { status: 404, headers: corsHeaders })
  }
  
  // Remove from pending after retrieval
  pendingImports.delete(templateId)
  
  return NextResponse.json({ template }, { headers: corsHeaders })
}

// ============================================
// TYPES FOR PLUGIN EXPORT DATA
// ============================================

interface FigmaColor {
  r: number  // 0-1 range
  g: number
  b: number
  a?: number
}

interface FigmaPaint {
  type: string
  color?: FigmaColor
  opacity?: number
  visible?: boolean
  imageHash?: string
  scaleMode?: string
  // Image transform matrix for CROP mode [[a, b, tx], [c, d, ty]]
  // tx, ty represent the position offset (0-1 range)
  imageTransform?: [[number, number, number], [number, number, number]]
  // Scale factor for TILE mode
  scalingFactor?: number
  gradientStops?: Array<{ position: number; color: FigmaColor }>
  gradientHandlePositions?: Array<{ x: number; y: number }>
}

interface FigmaEffect {
  type: string
  visible: boolean
  radius: number
  color?: FigmaColor
  offset?: { x: number; y: number }
  spread?: number
}

interface PluginTextNode {
  id: string
  name: string
  type: 'TEXT'
  characters: string
  x: number
  y: number
  width: number
  height: number
  rotation: number
  opacity: number
  visible: boolean
  locked: boolean
  fontName: { family: string; style: string }
  fontSize: number
  fontWeight: number
  letterSpacing: { value: number; unit: string }
  lineHeight: { value?: number; unit: string }
  textAlignHorizontal: string
  textAlignVertical: string
  textDecoration: string
  textCase: string
  listOptions: Array<{
    lineIndex: number
    startIndex: number
    endIndex: number
    type: 'ORDERED' | 'UNORDERED' | 'NONE'
  }>
  paragraphSpacing: number
  paragraphIndent: number
  fills: FigmaPaint[]
}

interface PluginVectorNode {
  id: string
  name: string
  type: 'VECTOR' | 'LINE' | 'STAR' | 'POLYGON' | 'ELLIPSE' | 'RECTANGLE'
  x: number
  y: number
  width: number
  height: number
  rotation: number
  opacity: number
  visible: boolean
  locked: boolean
  fillGeometry?: Array<{ path: string; windingRule: string }>
  strokeGeometry?: Array<{ path: string; windingRule: string }>
  strokeIsFilled?: boolean // true for Dynamic/Brush strokes (should be filled, not stroked)
  strokeWeight: number
  strokeAlign?: string
  strokeCap?: string
  strokeJoin?: string
  strokeMiterLimit?: number
  dashPattern?: number[]
  fills: FigmaPaint[]
  strokes: FigmaPaint[]
  cornerRadius?: number
  rectangleCornerRadii?: [number, number, number, number]
}

interface PluginFrameNode {
  id: string
  name: string
  type: 'FRAME' | 'GROUP' | 'COMPONENT' | 'INSTANCE'
  x: number
  y: number
  width: number
  height: number
  rotation: number
  opacity: number
  visible: boolean
  locked: boolean
  clipsContent: boolean
  layoutMode: string
  layoutPositioning?: string
  primaryAxisSizingMode: string
  counterAxisSizingMode: string
  primaryAxisAlignItems: string
  counterAxisAlignItems: string
  paddingLeft: number
  paddingRight: number
  paddingTop: number
  paddingBottom: number
  itemSpacing: number
  cornerRadius?: number
  rectangleCornerRadii?: [number, number, number, number]
  fills: FigmaPaint[]
  strokes: FigmaPaint[]
  strokeWeight?: number
  effects: FigmaEffect[]
  children: PluginNode[]
}

type PluginNode = PluginTextNode | PluginVectorNode | PluginFrameNode | {
  id: string
  name: string
  type: string
  x: number
  y: number
  width: number
  height: number
  rotation?: number
  opacity?: number
  visible?: boolean
  locked?: boolean
  fills?: FigmaPaint[]
  [key: string]: unknown
}

interface PluginExportData {
  version: string
  fileKey: string
  fileName: string
  exportedAt: string
  rootNode: PluginNode
  images: Record<string, string> // imageHash -> base64
}

// ============================================
// DEFAULT VALUES (matching figma-importer.ts)
// ============================================

const DEFAULT_GOVERNANCE = {
  lockedProps: [] as string[],
  isContentOnly: false,
  editableBy: ['owner', 'admin', 'editor'] as string[],
  allowImageUpload: true,
}

const DEFAULT_AUTO_LAYOUT = {
  layoutMode: 'NONE' as const,
  horizontalSizing: 'FIXED' as const,
  verticalSizing: 'FIXED' as const,
  primaryAxisAlignment: 'START' as const,
  counterAxisAlignment: 'START' as const,
  padding: { top: 0, right: 0, bottom: 0, left: 0 },
  gap: 0,
  wrap: false,
}

// ============================================
// COLOR CONVERSION (matching figma-importer.ts)
// ============================================

function convertFigmaColor(figmaColor: FigmaColor): { r: number; g: number; b: number; a: number } {
  return {
    r: Math.round(figmaColor.r * 255),
    g: Math.round(figmaColor.g * 255),
    b: Math.round(figmaColor.b * 255),
    a: figmaColor.a ?? 1,
  }
}

// ============================================
// FILL CONVERSION (matching figma-importer.ts)
// ============================================

function convertFigmaPaint(paint: FigmaPaint, images: Record<string, string>): unknown | null {
  if (paint.visible === false) return null

  switch (paint.type) {
    case 'SOLID':
      if (!paint.color) return null
      const solidColor = convertFigmaColor(paint.color)
      if (paint.opacity !== undefined && paint.opacity < 1) {
        solidColor.a = paint.opacity
      }
      return {
        type: 'SOLID',
        color: solidColor,
      }

    case 'GRADIENT_LINEAR':
    case 'GRADIENT_RADIAL':
      if (!paint.gradientStops) return null
      const gradientFill: {
        type: string
        stops: Array<{ position: number; color: { r: number; g: number; b: number; a: number } }>
        angle?: number
      } = {
        type: paint.type === 'GRADIENT_LINEAR' ? 'GRADIENT_LINEAR' : 'GRADIENT_RADIAL',
        stops: paint.gradientStops.map(stop => ({
          position: stop.position,
          color: convertFigmaColor(stop.color),
        })),
      }
      if (paint.type === 'GRADIENT_LINEAR' && paint.gradientHandlePositions && paint.gradientHandlePositions.length >= 2) {
        const [start, end] = paint.gradientHandlePositions
        const angle = Math.atan2(end.y - start.y, end.x - start.x) * (180 / Math.PI)
        gradientFill.angle = angle
      }
      return gradientFill

    case 'IMAGE':
      if (!paint.imageHash) return null
      const base64 = images[paint.imageHash]
      
      // Determine scale mode
      let scaleMode: 'FILL' | 'FIT' | 'CROP' | 'TILE' = 'FILL'
      if (paint.scaleMode === 'TILE') scaleMode = 'TILE'
      else if (paint.scaleMode === 'FIT') scaleMode = 'FIT'
      else if (paint.scaleMode === 'CROP') scaleMode = 'CROP'
      
      // Extract crop position from imageTransform
      // imageTransform is [[scaleX, 0, offsetX], [0, scaleY, offsetY]]
      // offsetX and offsetY are in 0-1 range representing the position
      let imagePosition = { x: 0.5, y: 0.5 } // default center
      if (paint.imageTransform && scaleMode === 'CROP') {
        const [[, , offsetX], [, , offsetY]] = paint.imageTransform
        // Convert from Figma's offset to our position format
        // Figma uses negative offsets from top-left, we use 0-1 position
        imagePosition = {
          x: Math.max(0, Math.min(1, -offsetX)),
          y: Math.max(0, Math.min(1, -offsetY)),
        }
      }
      
      return {
        type: 'IMAGE',
        src: base64 ? `data:image/png;base64,${base64}` : undefined,
        scaleMode,
        imagePosition,
        scalingFactor: paint.scalingFactor,
      }

    default:
      return null
  }
}

function convertFigmaFills(fills: FigmaPaint[] | undefined, images: Record<string, string>): unknown[] {
  if (!fills) return []
  return fills
    .map(f => convertFigmaPaint(f, images))
    .filter((fill): fill is NonNullable<typeof fill> => fill !== null)
}

// ============================================
// EFFECT CONVERSION (matching figma-importer.ts)
// ============================================

function convertFigmaEffects(effects?: FigmaEffect[]): unknown[] {
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
// BORDER CONVERSION (matching figma-importer.ts)
// ============================================

function convertFigmaStrokes(strokes?: FigmaPaint[], strokeWeight?: number): unknown | undefined {
  if (!strokes || strokes.length === 0 || !strokeWeight) return undefined

  const visibleStroke = strokes.find(s => s.visible !== false && s.type === 'SOLID' && s.color)
  if (!visibleStroke || !visibleStroke.color) return undefined

  return {
    color: convertFigmaColor(visibleStroke.color),
    width: strokeWeight,
    style: 'SOLID',
  }
}

// Extract stroke color for Dynamic/Brush strokes (where strokeWeight may be 0)
function extractStrokeColor(strokes: FigmaPaint[]): unknown | undefined {
  const visibleStroke = strokes.find(s => s.visible !== false && s.type === 'SOLID' && s.color)
  if (!visibleStroke || !visibleStroke.color) return undefined

  return {
    color: convertFigmaColor(visibleStroke.color),
    width: 1, // Default width for filled strokes
    style: 'SOLID',
  }
}

// ============================================
// CORNER RADIUS CONVERSION
// ============================================

function convertCornerRadius(node: PluginVectorNode | PluginFrameNode): number | { topLeft: number; topRight: number; bottomRight: number; bottomLeft: number } {
  if (node.rectangleCornerRadii) {
    const [topLeft, topRight, bottomRight, bottomLeft] = node.rectangleCornerRadii
    return { topLeft, topRight, bottomRight, bottomLeft }
  }
  return node.cornerRadius || 0
}

// ============================================
// LAYOUT CONVERSION (matching figma-importer.ts)
// ============================================

function mapLayoutMode(mode?: string): 'HORIZONTAL' | 'VERTICAL' | 'NONE' {
  switch (mode) {
    case 'HORIZONTAL': return 'HORIZONTAL'
    case 'VERTICAL': return 'VERTICAL'
    default: return 'NONE'
  }
}

function mapSizingMode(mode?: string): 'FIXED' | 'HUG' | 'FILL' {
  switch (mode) {
    case 'HUG': return 'HUG'
    case 'FILL': return 'FILL'
    default: return 'FIXED'
  }
}

function mapAlignment(alignment?: string): 'START' | 'CENTER' | 'END' | 'SPACE_BETWEEN' {
  switch (alignment) {
    case 'MIN': return 'START'
    case 'CENTER': return 'CENTER'
    case 'MAX': return 'END'
    case 'SPACE_BETWEEN': return 'SPACE_BETWEEN'
    default: return 'START'
  }
}

function convertAutoLayout(node: PluginFrameNode) {
  const layoutMode = mapLayoutMode(node.layoutMode)
  const layoutPositioning = node.layoutPositioning as 'AUTO' | 'ABSOLUTE' | undefined
  
  if (layoutMode === 'NONE') {
    return { 
      ...DEFAULT_AUTO_LAYOUT,
      layoutPositioning,
    }
  }

  // CRITICAL: Map sizing based on layout direction
  // In Figma:
  // - HORIZONTAL: primaryAxis = horizontal (width), counterAxis = vertical (height)
  // - VERTICAL: primaryAxis = vertical (height), counterAxis = horizontal (width)
  let horizontalSizing: 'FIXED' | 'HUG' | 'FILL'
  let verticalSizing: 'FIXED' | 'HUG' | 'FILL'
  
  if (layoutMode === 'HORIZONTAL') {
    horizontalSizing = mapSizingMode(node.primaryAxisSizingMode)
    verticalSizing = mapSizingMode(node.counterAxisSizingMode)
  } else {
    // VERTICAL
    horizontalSizing = mapSizingMode(node.counterAxisSizingMode)
    verticalSizing = mapSizingMode(node.primaryAxisSizingMode)
  }

  return {
    layoutMode,
    horizontalSizing,
    verticalSizing,
    primaryAxisAlignment: mapAlignment(node.primaryAxisAlignItems),
    counterAxisAlignment: mapAlignment(node.counterAxisAlignItems),
    padding: {
      top: node.paddingTop || 0,
      right: node.paddingRight || 0,
      bottom: node.paddingBottom || 0,
      left: node.paddingLeft || 0,
    },
    gap: node.itemSpacing || 0,
    wrap: false,
    layoutPositioning,
  }
}

// ============================================
// TEXT STYLE CONVERSION (matching figma-importer.ts)
// ============================================

function mapTextAlign(align?: string): 'LEFT' | 'CENTER' | 'RIGHT' | 'JUSTIFY' {
  switch (align) {
    case 'CENTER': return 'CENTER'
    case 'RIGHT': return 'RIGHT'
    case 'JUSTIFIED': return 'JUSTIFY'
    default: return 'LEFT'
  }
}

function mapFontWeight(weight?: number): number {
  if (!weight) return 400
  const validWeights = [100, 200, 300, 400, 500, 600, 700, 800, 900]
  return validWeights.reduce((prev, curr) => 
    Math.abs(curr - weight) < Math.abs(prev - weight) ? curr : prev
  )
}

function mapTextCase(textCase?: string): string {
  switch (textCase) {
    case 'UPPER': return 'UPPERCASE'
    case 'LOWER': return 'LOWERCASE'
    case 'TITLE': return 'CAPITALIZE'
    default: return 'NONE'
  }
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function generateId(): string {
  return 'node_' + Math.random().toString(36).substring(2, 15)
}

function hasImageFill(fills?: FigmaPaint[]): boolean {
  return fills?.some(fill => fill.type === 'IMAGE' && fill.visible !== false) || false
}

// Apply bullets to text content based on listOptions
function applyBulletsToContent(
  content: string, 
  listOptions?: PluginTextNode['listOptions']
): string {
  if (!listOptions || listOptions.length === 0) return content
  
  const lines = content.split('\n')
  const result: string[] = []
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const listOption = listOptions.find(opt => opt.lineIndex === i)
    
    if (listOption && listOption.type === 'UNORDERED') {
      result.push('• ' + line)
    } else if (listOption && listOption.type === 'ORDERED') {
      const orderedCount = listOptions
        .filter(opt => opt.lineIndex < i && opt.type === 'ORDERED')
        .length + 1
      result.push(orderedCount + '. ' + line)
    } else {
      result.push(line)
    }
  }
  
  return result.join('\n')
}

function extractListOptions(listOptions?: PluginTextNode['listOptions']): { type: 'ORDERED' | 'UNORDERED' | 'NONE' } | undefined {
  if (!listOptions || listOptions.length === 0) return undefined
  
  const hasOrdered = listOptions.some(opt => opt.type === 'ORDERED')
  const hasUnordered = listOptions.some(opt => opt.type === 'UNORDERED')
  
  if (hasUnordered) return { type: 'UNORDERED' }
  if (hasOrdered) return { type: 'ORDERED' }
  return undefined
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
function collectFontsFromNode(node: unknown, fonts: Map<string, CollectedFont>): void {
  if (!node || typeof node !== 'object') return
  
  const n = node as Record<string, unknown>
  
  // Verifica se é um nó de texto
  if (n.type === 'TEXT' && n.textProps) {
    const textProps = n.textProps as Record<string, unknown>
    const style = textProps.style as Record<string, unknown> | undefined
    
    if (style?.fontFamily) {
      const family = style.fontFamily as string
      const weight = (style.fontWeight as number) || 400
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
  if (Array.isArray(n.children)) {
    for (const child of n.children) {
      collectFontsFromNode(child, fonts)
    }
  }
}

/**
 * Processa as fontes coletadas e gera metadados
 */
async function processFonts(rootNode: unknown): Promise<{
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
// NODE CONVERSION (matching figma-importer.ts structure)
// ============================================

function convertTextNode(node: PluginTextNode, images: Record<string, string>): unknown {
  const fills = convertFigmaFills(node.fills, images)
  
  // Calculate line height as multiplier
  let lineHeight: number | 'AUTO' = 'AUTO'
  if (node.lineHeight.unit === 'PIXELS' && node.lineHeight.value) {
    // Convert pixels to multiplier relative to font size
    lineHeight = node.lineHeight.value / node.fontSize
  } else if (node.lineHeight.unit === 'PERCENT' && node.lineHeight.value) {
    lineHeight = node.lineHeight.value / 100
  }
  
  // Calculate letter spacing in pixels
  // Figma uses PIXELS or PERCENT for letterSpacing
  let letterSpacingPx = 0
  if (node.letterSpacing) {
    if (node.letterSpacing.unit === 'PIXELS') {
      letterSpacingPx = node.letterSpacing.value || 0
    } else if (node.letterSpacing.unit === 'PERCENT') {
      // Convert percentage to pixels based on font size
      letterSpacingPx = (node.letterSpacing.value || 0) * node.fontSize / 100
    }
  }

  return {
    id: generateId(),
    name: node.name,
    type: 'TEXT',
    visible: node.visible !== false,
    locked: node.locked || false,
    opacity: node.opacity ?? 1,
    blendMode: 'NORMAL',
    position: { x: node.x, y: node.y },
    size: { width: node.width, height: node.height },
    rotation: node.rotation || 0,
    cornerRadius: 0,
    fills,
    shadows: [],
    autoLayout: {
      ...DEFAULT_AUTO_LAYOUT,
      horizontalSizing: 'FIXED',
      verticalSizing: 'HUG',
    },
    textProps: {
      content: applyBulletsToContent(node.characters, node.listOptions),
      style: {
        fontFamily: node.fontName?.family || 'Inter',
        fontSize: node.fontSize || 16,
        fontWeight: mapFontWeight(node.fontWeight),
        fontStyle: node.fontName?.style?.toLowerCase().includes('italic') ? 'italic' : 'normal',
        lineHeight,
        letterSpacing: letterSpacingPx,
        textAlign: mapTextAlign(node.textAlignHorizontal),
        textDecoration: node.textDecoration === 'UNDERLINE' ? 'UNDERLINE' : 
                        node.textDecoration === 'STRIKETHROUGH' ? 'STRIKETHROUGH' : 'NONE',
        textTransform: mapTextCase(node.textCase),
      },
      editable: true,
      listOptions: extractListOptions(node.listOptions),
      indentation: node.paragraphIndent,
      paragraphSpacing: node.paragraphSpacing,
    },
    governance: DEFAULT_GOVERNANCE,
  }
}

// Helper to extract image props from a Figma image fill
function extractImageProps(imageFill: FigmaPaint | undefined, images: Record<string, string>): {
  src?: string
  objectFit: 'FILL' | 'FIT' | 'CROP' | 'TILE'
  objectPosition: { x: number; y: number }
  scalingFactor?: number
  imageTransform?: [[number, number, number], [number, number, number]]
} {
  const base64 = imageFill?.imageHash ? images[imageFill.imageHash] : undefined
  
  // Determine objectFit based on scaleMode
  let objectFit: 'FILL' | 'FIT' | 'CROP' | 'TILE' = 'FILL'
  if (imageFill?.scaleMode === 'TILE') objectFit = 'TILE'
  else if (imageFill?.scaleMode === 'FIT') objectFit = 'FIT'
  else if (imageFill?.scaleMode === 'CROP') objectFit = 'CROP'
  
  // For CROP mode, imageTransform is a 2x3 affine transform matrix
  // [[scaleX, skewX, translateX], [skewY, scaleY, translateY]]
  // translateX/Y are in normalized coordinates (0-1 range relative to image)
  let objectPosition = { x: 0.5, y: 0.5 }
  const imageTransform = imageFill?.imageTransform
  
  if (imageTransform && objectFit === 'CROP') {
    // The transform matrix contains scale and translation
    // tx (imageTransform[0][2]) and ty (imageTransform[1][2]) represent the offset
    // These are typically negative values indicating how much the image is shifted
    const tx = imageTransform[0][2]
    const ty = imageTransform[1][2]
    
    // Convert to position (0-1 range where 0.5 is center)
    // Figma's tx/ty are offsets, we need to convert to position
    objectPosition = {
      x: Math.max(0, Math.min(1, 0.5 - tx)),
      y: Math.max(0, Math.min(1, 0.5 - ty)),
    }
  }
  
  return {
    src: base64 ? `data:image/png;base64,${base64}` : undefined,
    objectFit,
    objectPosition,
    scalingFactor: imageFill?.scalingFactor,
    imageTransform,
  }
}

function convertRectangleNode(node: PluginVectorNode, images: Record<string, string>): unknown {
  const fills = convertFigmaFills(node.fills, images)
  
  // Check if this is actually an image container (like figma-importer.ts does)
  if (hasImageFill(node.fills)) {
    const imageFill = node.fills?.find(f => f.type === 'IMAGE') as FigmaPaint | undefined
    const imageProps = extractImageProps(imageFill, images)
    
    return {
      id: generateId(),
      name: node.name,
      type: 'IMAGE',
      visible: node.visible !== false,
      locked: node.locked || false,
      opacity: node.opacity ?? 1,
      blendMode: 'NORMAL',
      position: { x: node.x, y: node.y },
      size: { width: node.width, height: node.height },
      rotation: node.rotation || 0,
      cornerRadius: convertCornerRadius(node),
      fills: [],
      border: convertFigmaStrokes(node.strokes, node.strokeWeight),
      shadows: [],
      autoLayout: DEFAULT_AUTO_LAYOUT,
      imageProps: {
        src: imageProps.src,
        alt: node.name,
        objectFit: imageProps.objectFit,
        objectPosition: imageProps.objectPosition,
        scalingFactor: imageProps.scalingFactor,
        imageTransform: imageProps.imageTransform,
      },
      governance: DEFAULT_GOVERNANCE,
    }
  }

  return {
    id: generateId(),
    name: node.name,
    type: 'RECTANGLE',
    visible: node.visible !== false,
    locked: node.locked || false,
    opacity: node.opacity ?? 1,
    blendMode: 'NORMAL',
    position: { x: node.x, y: node.y },
    size: { width: node.width, height: node.height },
    rotation: node.rotation || 0,
    cornerRadius: convertCornerRadius(node),
    fills,
    border: convertFigmaStrokes(node.strokes, node.strokeWeight),
    shadows: [],
    autoLayout: DEFAULT_AUTO_LAYOUT,
    governance: DEFAULT_GOVERNANCE,
  }
}

function convertEllipseNode(node: PluginVectorNode, images: Record<string, string>): unknown {
  const fills = convertFigmaFills(node.fills, images)
  
  // Check if this is actually an image container
  if (hasImageFill(node.fills)) {
    const imageFill = node.fills?.find(f => f.type === 'IMAGE') as FigmaPaint | undefined
    const imageProps = extractImageProps(imageFill, images)
    
    return {
      id: generateId(),
      name: node.name,
      type: 'IMAGE',
      visible: node.visible !== false,
      locked: node.locked || false,
      opacity: node.opacity ?? 1,
      blendMode: 'NORMAL',
      position: { x: node.x, y: node.y },
      size: { width: node.width, height: node.height },
      rotation: node.rotation || 0,
      cornerRadius: 0,
      fills: [],
      border: convertFigmaStrokes(node.strokes, node.strokeWeight),
      shadows: [],
      autoLayout: DEFAULT_AUTO_LAYOUT,
      imageProps: {
        src: imageProps.src,
        alt: node.name,
        objectFit: imageProps.objectFit,
        objectPosition: imageProps.objectPosition,
        scalingFactor: imageProps.scalingFactor,
        imageTransform: imageProps.imageTransform,
      },
      governance: DEFAULT_GOVERNANCE,
    }
  }

  return {
    id: generateId(),
    name: node.name,
    type: 'ELLIPSE',
    visible: node.visible !== false,
    locked: node.locked || false,
    opacity: node.opacity ?? 1,
    blendMode: 'NORMAL',
    position: { x: node.x, y: node.y },
    size: { width: node.width, height: node.height },
    rotation: node.rotation || 0,
    cornerRadius: 0,
    fills,
    border: convertFigmaStrokes(node.strokes, node.strokeWeight),
    shadows: [],
    autoLayout: DEFAULT_AUTO_LAYOUT,
    governance: DEFAULT_GOVERNANCE,
  }
}

function convertVectorNode(node: PluginVectorNode, images: Record<string, string>): unknown {
  // Check if this node was exported as PNG (no valid geometry)
  const pngKey = 'node_' + node.id
  const pngBase64 = images[pngKey]
  
  // If we have a PNG export for this node, convert it to an IMAGE node
  if (pngBase64 || (node as unknown as { needsPngExport?: boolean }).needsPngExport) {
    return {
      id: generateId(),
      name: node.name,
      type: 'IMAGE',
      visible: node.visible !== false,
      locked: node.locked || false,
      opacity: node.opacity ?? 1,
      blendMode: 'NORMAL',
      position: { x: node.x, y: node.y },
      size: { width: node.width, height: node.height },
      rotation: node.rotation || 0,
      cornerRadius: 0,
      fills: [],
      border: undefined,
      shadows: [],
      autoLayout: DEFAULT_AUTO_LAYOUT,
      governance: DEFAULT_GOVERNANCE,
      imageProps: {
        src: pngBase64 ? `data:image/png;base64,${pngBase64}` : undefined,
        alt: node.name,
        objectFit: 'FILL',
        objectPosition: { x: 0.5, y: 0.5 },
      },
    }
  }
  
  const fills = convertFigmaFills(node.fills, images)
  
  // Convert fillGeometry and strokeGeometry
  const fillPaths = node.fillGeometry?.map(g => ({
    path: g.path,
    windingRule: g.windingRule === 'EVENODD' ? 'EVENODD' : 'NONZERO',
  })) || []
  
  const strokePaths = node.strokeGeometry?.map(g => ({
    path: g.path,
    windingRule: g.windingRule === 'EVENODD' ? 'EVENODD' : 'NONZERO',
  })) || []
  
  // Debug log for stroke data
  console.log(`[Plugin Import] VectorNode "${node.name}": fillPaths=${fillPaths.length}, strokePaths=${strokePaths.length}, strokeIsFilled=${node.strokeIsFilled}, strokeWeight=${node.strokeWeight}, hasStrokes=${node.strokes?.length || 0}`)

  return {
    id: generateId(),
    name: node.name,
    type: 'VECTOR',
    visible: node.visible !== false,
    locked: node.locked || false,
    opacity: node.opacity ?? 1,
    blendMode: 'NORMAL',
    position: { x: node.x, y: node.y },
    size: { width: node.width, height: node.height },
    rotation: node.rotation || 0,
    cornerRadius: 0,
    fills,
    border: convertFigmaStrokes(node.strokes, node.strokeWeight) || 
      // For Dynamic/Brush strokes, create border from strokes even if strokeWeight is 0
      (node.strokeIsFilled && node.strokes?.length > 0 ? extractStrokeColor(node.strokes) : undefined),
    shadows: [],
    autoLayout: DEFAULT_AUTO_LAYOUT,
    governance: DEFAULT_GOVERNANCE,
    fillPaths: fillPaths.length > 0 ? fillPaths : undefined,
    strokePaths: strokePaths.length > 0 ? strokePaths : undefined,
    strokeIsFilled: node.strokeIsFilled, // true for Dynamic/Brush strokes
    strokeCap: node.strokeCap === 'ROUND' ? 'ROUND' : node.strokeCap === 'SQUARE' ? 'SQUARE' : 'NONE',
    strokeJoin: node.strokeJoin === 'ROUND' ? 'ROUND' : node.strokeJoin === 'BEVEL' ? 'BEVEL' : 'MITER',
    strokeMiterLimit: node.strokeMiterLimit,
    dashPattern: node.dashPattern,
  }
}

function convertFrameNode(node: PluginFrameNode, images: Record<string, string>): unknown {
  const fills = convertFigmaFills(node.fills, images)
  
  // Check if frame has image fill
  const hasImage = hasImageFill(node.fills)
  if (hasImage) {
    // Find and update the image fill src
    for (const fill of fills as Array<{ type: string; src?: string }>) {
      if (fill.type === 'IMAGE' && !fill.src) {
        const imageFill = node.fills?.find(f => f.type === 'IMAGE')
        if (imageFill?.imageHash && images[imageFill.imageHash]) {
          fill.src = `data:image/png;base64,${images[imageFill.imageHash]}`
        }
      }
    }
  }

  // Convert children recursively
  const children: unknown[] = []
  if (node.children) {
    for (const child of node.children) {
      const converted = convertNode(child, images)
      if (converted) {
        children.push(converted)
      }
    }
  }

  return {
    id: generateId(),
    name: node.name,
    type: 'FRAME',
    visible: node.visible !== false,
    locked: node.locked || false,
    opacity: node.opacity ?? 1,
    blendMode: 'NORMAL',
    position: { x: node.x, y: node.y },
    size: { width: node.width, height: node.height },
    rotation: node.rotation || 0,
    cornerRadius: convertCornerRadius(node),
    fills,
    border: convertFigmaStrokes(node.strokes, node.strokeWeight || 1),
    shadows: convertFigmaEffects(node.effects),
    autoLayout: convertAutoLayout(node),
    clipsContent: node.clipsContent ?? false,
    children,
    governance: DEFAULT_GOVERNANCE,
  }
}

// Main node conversion dispatcher (matching figma-importer.ts)
function convertNode(node: PluginNode, images: Record<string, string>): unknown | null {
  // Skip invisible nodes
  if (node.visible === false) {
    return null
  }

  switch (node.type) {
    case 'FRAME':
    case 'GROUP':
    case 'COMPONENT':
    case 'INSTANCE':
      return convertFrameNode(node as PluginFrameNode, images)

    case 'TEXT':
      return convertTextNode(node as PluginTextNode, images)

    case 'RECTANGLE':
      return convertRectangleNode(node as PluginVectorNode, images)

    case 'ELLIPSE':
      return convertEllipseNode(node as PluginVectorNode, images)

    case 'VECTOR':
    case 'LINE':
    case 'STAR':
    case 'POLYGON':
    case 'BOOLEAN_OPERATION':
      return convertVectorNode(node as PluginVectorNode, images)

    default:
      // Try to convert unknown types with geometry as vectors
      if ('fillGeometry' in node || 'fills' in node) {
        console.log(`[Plugin Import] Converting unknown type "${node.type}" as VECTOR for "${node.name}"`)
        return convertVectorNode(node as PluginVectorNode, images)
      }
      console.warn(`[Plugin Import] Unknown node type "${node.type}" for "${node.name}" - skipped`)
      return null
  }
}

// ============================================
// MAIN POST HANDLER
// ============================================

export async function POST(request: NextRequest) {
  try {
    const data: PluginExportData = await request.json()
    
    console.log('[Plugin Import] Received data from Figma plugin')
    console.log('[Plugin Import] File:', data.fileName)
    console.log('[Plugin Import] Version:', data.version)
    console.log('[Plugin Import] Images:', Object.keys(data.images || {}).length)
    
    // Convert plugin data to internal format
    const convertedRoot = convertNode(data.rootNode, data.images || {})
    
    if (!convertedRoot) {
      return NextResponse.json(
        { error: 'Failed to convert root node' },
        { status: 400, headers: corsHeaders }
      )
    }
    
    // Process fonts from the template
    const fontInfo = await processFonts(convertedRoot)
    console.log('[Plugin Import] Fonts found:', {
      googleFonts: fontInfo.googleFonts.map((f: { family: string }) => f.family),
      customFonts: fontInfo.customFonts,
    })
    
    // Create template structure
    const template = {
      id: generateId(),
      name: data.fileName,
      description: `Imported from Figma on ${new Date().toLocaleDateString()}`,
      thumbnail: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      rootNode: convertedRoot,
      metadata: {
        figmaFileKey: data.fileKey,
        importedAt: data.exportedAt,
        pluginVersion: data.version,
      },
      // Font information for rendering
      fonts: {
        googleFonts: fontInfo.googleFonts,
        customFonts: fontInfo.customFonts,
        googleFontsUrl: fontInfo.googleFontsUrl,
      },
    }
    
    console.log('[Plugin Import] Template created:', template.id)
    
    // Store template temporarily for retrieval
    pendingImports.set(template.id, template)
    
    // Auto-cleanup after 5 minutes
    setTimeout(() => pendingImports.delete(template.id), 5 * 60 * 1000)
    
    // Return the template data
    return NextResponse.json({
      success: true,
      templateId: template.id,
      template,
      editorUrl: `/templates/editor/${template.id}?source=plugin`,
    }, { headers: corsHeaders })
  } catch (error) {
    console.error('[Plugin Import] Error:', error)
    return NextResponse.json(
      { error: 'Failed to import from plugin', details: String(error) },
      { status: 500, headers: corsHeaders }
    )
  }
}
