/**
 * Figma REST API Types
 * 
 * Tipos para a resposta da API do Figma.
 * Baseado na documentação oficial: https://www.figma.com/developers/api
 */

// ============================================
// BASIC TYPES
// ============================================

export interface FigmaColor {
  r: number // 0-1
  g: number // 0-1
  b: number // 0-1
  a: number // 0-1
}

export interface FigmaVector {
  x: number
  y: number
}

export interface FigmaRectangle {
  x: number
  y: number
  width: number
  height: number
}

export interface FigmaTransform {
  [index: number]: number[]
}

// ============================================
// PAINT & EFFECTS
// ============================================

export type FigmaPaintType = 
  | 'SOLID'
  | 'GRADIENT_LINEAR'
  | 'GRADIENT_RADIAL'
  | 'GRADIENT_ANGULAR'
  | 'GRADIENT_DIAMOND'
  | 'IMAGE'
  | 'EMOJI'
  | 'VIDEO'

export interface FigmaColorStop {
  position: number
  color: FigmaColor
}

export interface FigmaPaint {
  type: FigmaPaintType
  visible?: boolean
  opacity?: number
  color?: FigmaColor
  blendMode?: string
  gradientHandlePositions?: FigmaVector[]
  gradientStops?: FigmaColorStop[]
  scaleMode?: 'FILL' | 'FIT' | 'TILE' | 'STRETCH'
  imageTransform?: FigmaTransform
  scalingFactor?: number
  rotation?: number
  imageRef?: string
  gifRef?: string
  filters?: FigmaImageFilters
}

export interface FigmaImageFilters {
  exposure?: number
  contrast?: number
  saturation?: number
  temperature?: number
  tint?: number
  highlights?: number
  shadows?: number
}

export interface FigmaEffect {
  type: 'INNER_SHADOW' | 'DROP_SHADOW' | 'LAYER_BLUR' | 'BACKGROUND_BLUR'
  visible: boolean
  radius: number
  color?: FigmaColor
  blendMode?: string
  offset?: FigmaVector
  spread?: number
  showShadowBehindNode?: boolean
}

export interface FigmaStroke {
  type: FigmaPaintType
  color?: FigmaColor
  opacity?: number
  visible?: boolean
}

// ============================================
// LAYOUT & CONSTRAINTS
// ============================================

export type FigmaLayoutMode = 'NONE' | 'HORIZONTAL' | 'VERTICAL'

export type FigmaPrimaryAxisAlignItems = 
  | 'MIN'
  | 'CENTER'
  | 'MAX'
  | 'SPACE_BETWEEN'

export type FigmaCounterAxisAlignItems = 
  | 'MIN'
  | 'CENTER'
  | 'MAX'
  | 'BASELINE'

export type FigmaSizingMode = 'FIXED' | 'HUG' | 'FILL'

export interface FigmaLayoutConstraint {
  vertical: 'TOP' | 'BOTTOM' | 'CENTER' | 'TOP_BOTTOM' | 'SCALE'
  horizontal: 'LEFT' | 'RIGHT' | 'CENTER' | 'LEFT_RIGHT' | 'SCALE'
}

// ============================================
// TEXT
// ============================================

export type FigmaTextAlignHorizontal = 'LEFT' | 'CENTER' | 'RIGHT' | 'JUSTIFIED'
export type FigmaTextAlignVertical = 'TOP' | 'CENTER' | 'BOTTOM'
export type FigmaTextAutoResize = 'NONE' | 'HEIGHT' | 'WIDTH_AND_HEIGHT' | 'TRUNCATE'

export interface FigmaTypeStyle {
  fontFamily: string
  fontPostScriptName?: string
  paragraphSpacing?: number
  paragraphIndent?: number
  listSpacing?: number
  italic?: boolean
  fontWeight: number
  fontSize: number
  textCase?: 'ORIGINAL' | 'UPPER' | 'LOWER' | 'TITLE' | 'SMALL_CAPS' | 'SMALL_CAPS_FORCED'
  textDecoration?: 'NONE' | 'UNDERLINE' | 'STRIKETHROUGH'
  textAutoResize?: FigmaTextAutoResize
  textAlignHorizontal?: FigmaTextAlignHorizontal
  textAlignVertical?: FigmaTextAlignVertical
  letterSpacing?: number
  fills?: FigmaPaint[]
  hyperlink?: { type: 'URL' | 'NODE'; url?: string; nodeID?: string }
  opentypeFlags?: Record<string, number>
  lineHeightPx?: number
  lineHeightPercent?: number
  lineHeightPercentFontSize?: number
  lineHeightUnit?: 'PIXELS' | 'FONT_SIZE_%' | 'INTRINSIC_%'
  // List options
  listOptions?: FigmaTextListOptions
  indentation?: number
}

export interface FigmaTextListOptions {
  type: 'ORDERED' | 'UNORDERED' | 'NONE'
}

// ============================================
// NODES
// ============================================

export type FigmaNodeType = 
  | 'DOCUMENT'
  | 'CANVAS'
  | 'FRAME'
  | 'GROUP'
  | 'SECTION'
  | 'VECTOR'
  | 'BOOLEAN_OPERATION'
  | 'STAR'
  | 'LINE'
  | 'ELLIPSE'
  | 'REGULAR_POLYGON'
  | 'RECTANGLE'
  | 'TABLE'
  | 'TABLE_CELL'
  | 'TEXT'
  | 'SLICE'
  | 'COMPONENT'
  | 'COMPONENT_SET'
  | 'INSTANCE'
  | 'STICKY'
  | 'SHAPE_WITH_TEXT'
  | 'CONNECTOR'
  | 'WASHI_TAPE'

export interface FigmaBaseNode {
  id: string
  name: string
  type: FigmaNodeType
  visible?: boolean
  locked?: boolean
  pluginData?: Record<string, string>
  sharedPluginData?: Record<string, Record<string, string>>
  componentPropertyReferences?: Record<string, string>
}

export interface FigmaSceneNode extends FigmaBaseNode {
  // Geometry
  absoluteBoundingBox?: FigmaRectangle
  absoluteRenderBounds?: FigmaRectangle | null
  rotation?: number
  
  // Fills & Strokes
  fills?: FigmaPaint[]
  strokes?: FigmaStroke[]
  strokeWeight?: number
  strokeAlign?: 'INSIDE' | 'OUTSIDE' | 'CENTER'
  strokeCap?: 'NONE' | 'ROUND' | 'SQUARE' | 'LINE_ARROW' | 'TRIANGLE_ARROW'
  strokeJoin?: 'MITER' | 'BEVEL' | 'ROUND'
  strokeDashes?: number[]
  strokeMiterAngle?: number
  
  // Corner radius
  cornerRadius?: number
  rectangleCornerRadii?: [number, number, number, number]
  
  // Effects
  effects?: FigmaEffect[]
  
  // Blend
  blendMode?: string
  opacity?: number
  
  // Constraints
  constraints?: FigmaLayoutConstraint
  
  // Layout
  layoutMode?: FigmaLayoutMode
  layoutWrap?: 'NO_WRAP' | 'WRAP'
  primaryAxisSizingMode?: FigmaSizingMode
  counterAxisSizingMode?: FigmaSizingMode
  primaryAxisAlignItems?: FigmaPrimaryAxisAlignItems
  counterAxisAlignItems?: FigmaCounterAxisAlignItems
  paddingLeft?: number
  paddingRight?: number
  paddingTop?: number
  paddingBottom?: number
  itemSpacing?: number
  counterAxisSpacing?: number
  layoutPositioning?: 'AUTO' | 'ABSOLUTE'
  itemReverseZIndex?: boolean
  strokesIncludedInLayout?: boolean
  
  // Auto-layout child properties
  layoutAlign?: 'INHERIT' | 'STRETCH' | 'MIN' | 'CENTER' | 'MAX'
  layoutGrow?: number
  layoutSizingHorizontal?: FigmaSizingMode
  layoutSizingVertical?: FigmaSizingMode
  
  // Clipping
  clipsContent?: boolean
  
  // Export settings
  exportSettings?: FigmaExportSetting[]
  
  // Styles
  styles?: Record<string, string>
  
  // Children
  children?: FigmaSceneNode[]
  
  // Vector geometry (for VECTOR, STAR, POLYGON nodes)
  fillGeometry?: FigmaVectorPath[]
  strokeGeometry?: FigmaVectorPath[]
  strokeMiterLimit?: number
  dashPattern?: number[]
}

/**
 * Represents a vector path with SVG path data
 */
export interface FigmaVectorPath {
  path: string
  windingRule: 'NONZERO' | 'EVENODD'
}

export interface FigmaFrameNode extends FigmaSceneNode {
  type: 'FRAME' | 'GROUP' | 'COMPONENT' | 'COMPONENT_SET' | 'INSTANCE'
  children: FigmaSceneNode[]
}

export interface FigmaTextNode extends FigmaSceneNode {
  type: 'TEXT'
  characters: string
  style?: FigmaTypeStyle
  characterStyleOverrides?: number[]
  styleOverrideTable?: Record<number, FigmaTypeStyle>
}

export interface FigmaVectorNode extends FigmaSceneNode {
  type: 'VECTOR' | 'STAR' | 'LINE' | 'ELLIPSE' | 'REGULAR_POLYGON' | 'RECTANGLE'
}

export interface FigmaInstanceNode extends FigmaSceneNode {
  type: 'INSTANCE'
  componentId: string
  children: FigmaSceneNode[]
}

// ============================================
// EXPORT
// ============================================

export interface FigmaExportSetting {
  suffix: string
  format: 'JPG' | 'PNG' | 'SVG' | 'PDF'
  constraint: {
    type: 'SCALE' | 'WIDTH' | 'HEIGHT'
    value: number
  }
}

// ============================================
// STYLES & VARIABLES
// ============================================

export interface FigmaStyle {
  key: string
  name: string
  styleType: 'FILL' | 'TEXT' | 'EFFECT' | 'GRID'
  description?: string
}

export interface FigmaVariable {
  id: string
  name: string
  key: string
  variableCollectionId: string
  resolvedType: 'BOOLEAN' | 'FLOAT' | 'STRING' | 'COLOR'
  valuesByMode: Record<string, FigmaVariableValue>
  remote?: boolean
  description?: string
  hiddenFromPublishing?: boolean
  scopes?: string[]
  codeSyntax?: Record<string, string>
}

export type FigmaVariableValue = 
  | boolean
  | number
  | string
  | FigmaColor
  | { type: 'VARIABLE_ALIAS'; id: string }

export interface FigmaVariableCollection {
  id: string
  name: string
  key: string
  modes: { modeId: string; name: string }[]
  defaultModeId: string
  remote?: boolean
  hiddenFromPublishing?: boolean
  variableIds: string[]
}

// ============================================
// API RESPONSES
// ============================================

export interface FigmaFileResponse {
  name: string
  role: string
  lastModified: string
  editorType: string
  thumbnailUrl: string
  version: string
  document: FigmaSceneNode
  components: Record<string, FigmaComponent>
  componentSets: Record<string, FigmaComponentSet>
  schemaVersion: number
  styles: Record<string, FigmaStyle>
  mainFileKey?: string
}

export interface FigmaNodesResponse {
  name: string
  lastModified: string
  thumbnailUrl: string
  version: string
  nodes: Record<string, { document: FigmaSceneNode; components: Record<string, FigmaComponent>; styles: Record<string, FigmaStyle> }>
}

export interface FigmaImagesResponse {
  err: string | null
  images: Record<string, string>
}

export interface FigmaComponent {
  key: string
  name: string
  description: string
  componentSetId?: string
  documentationLinks?: { uri: string }[]
}

export interface FigmaComponentSet {
  key: string
  name: string
  description: string
  documentationLinks?: { uri: string }[]
}

// ============================================
// IMPORT CONFIG
// ============================================

export interface FigmaImportConfig {
  /** Figma Personal Access Token */
  accessToken: string
  /** File key from Figma URL */
  fileKey: string
  /** Node ID to import (optional, imports whole file if not provided) */
  nodeId?: string
  /** Scale factor for export (default: 1) */
  scale?: number
  /** Whether to import images */
  importImages?: boolean
  /** Whether to map Figma styles to variables */
  mapStylesToVariables?: boolean
  /** Brand ID to associate with imported template */
  brandId?: string
}

export interface FigmaImportResult {
  success: boolean
  template?: import('./studio').Template
  errors?: string[]
  warnings?: string[]
  imageMap?: Record<string, string>
  styleMap?: Record<string, string>
}

// ============================================
// URL PARSING
// ============================================

export interface ParsedFigmaUrl {
  fileKey: string
  nodeId?: string
  fileName?: string
}

/**
 * Parse a Figma URL to extract file key and node ID
 * Supports formats:
 * - https://www.figma.com/file/FILEKEY/FileName
 * - https://www.figma.com/file/FILEKEY/FileName?node-id=NODEID
 * - https://www.figma.com/design/FILEKEY/FileName?node-id=NODEID
 */
export function parseFigmaUrl(url: string): ParsedFigmaUrl | null {
  try {
    const urlObj = new URL(url)
    
    // Check if it's a Figma URL
    if (!urlObj.hostname.includes('figma.com')) {
      return null
    }
    
    // Extract file key from path
    const pathParts = urlObj.pathname.split('/')
    const fileIndex = pathParts.findIndex(p => p === 'file' || p === 'design')
    
    if (fileIndex === -1 || !pathParts[fileIndex + 1]) {
      return null
    }
    
    const fileKey = pathParts[fileIndex + 1]
    const fileName = pathParts[fileIndex + 2] || undefined
    
    // Extract node ID from query params
    // Figma URLs use hyphen (2293-222) but API expects colon (2293:222)
    const nodeIdParam = urlObj.searchParams.get('node-id')
    let nodeId = nodeIdParam ? decodeURIComponent(nodeIdParam) : undefined
    
    // Convert hyphen to colon for API compatibility
    if (nodeId && nodeId.includes('-') && !nodeId.includes(':')) {
      nodeId = nodeId.replace(/-/g, ':')
    }
    
    return {
      fileKey,
      nodeId,
      fileName,
    }
  } catch {
    return null
  }
}
