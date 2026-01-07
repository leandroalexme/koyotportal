// Koyot Figma Plugin - Export complete node data
// This plugin extracts data that REST API doesn't expose (listOptions, geometry, etc)

interface ExportedTextNode {
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
  // Rich text data
  fontName: FontName
  fontSize: number
  fontWeight: number
  letterSpacing: LetterSpacing
  lineHeight: LineHeight
  textAlignHorizontal: string
  textAlignVertical: string
  textDecoration: string
  textCase: string
  // List options per line
  listOptions: Array<{
    lineIndex: number
    startIndex: number
    endIndex: number
    type: 'ORDERED' | 'UNORDERED' | 'NONE'
  }>
  // Paragraph spacing
  paragraphSpacing: number
  paragraphIndent: number
  // Fills
  fills: Paint[]
}

interface ExportedVectorNode {
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
  // Vector paths
  fillGeometry: VectorPaths
  strokeGeometry: VectorPaths
  // Stroke properties
  strokeWeight: number
  strokeAlign: string
  strokeCap: string
  strokeJoin: string
  strokeMiterLimit: number
  dashPattern: number[]
  // Fills and strokes
  fills: Paint[]
  strokes: Paint[]
}

interface ExportedFrameNode {
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
  // Layout
  layoutMode: string
  layoutPositioning: string
  primaryAxisSizingMode: string
  counterAxisSizingMode: string
  primaryAxisAlignItems: string
  counterAxisAlignItems: string
  paddingLeft: number
  paddingRight: number
  paddingTop: number
  paddingBottom: number
  itemSpacing: number
  // Corner radius
  cornerRadius: number
  // Fills
  fills: Paint[]
  strokes: Paint[]
  effects: Effect[]
  // Children
  children: ExportedNode[]
}

interface ExportedImageNode {
  id: string
  name: string
  type: 'IMAGE'
  x: number
  y: number
  width: number
  height: number
  rotation: number
  opacity: number
  visible: boolean
  locked: boolean
  // Image data
  imageHash: string | null
  scaleMode: string
  fills: Paint[]
}

type ExportedNode = ExportedTextNode | ExportedVectorNode | ExportedFrameNode | ExportedImageNode | {
  id: string
  name: string
  type: string
  x: number
  y: number
  width: number
  height: number
  [key: string]: unknown
}

interface ExportData {
  version: string
  fileKey: string
  fileName: string
  exportedAt: string
  rootNode: ExportedNode
  images: Record<string, string> // imageHash -> base64
}

// Extract list options from text node
function extractListOptions(textNode: TextNode): ExportedTextNode['listOptions'] {
  const listOptions: ExportedTextNode['listOptions'] = []
  const content = textNode.characters
  const lines = content.split('\n')
  
  let charIndex = 0
  for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
    const line = lines[lineIndex]
    const startIndex = charIndex
    const endIndex = charIndex + line.length
    
    // Get list options for this line (use first character of line)
    if (line.length > 0) {
      try {
        const lineListOptions = textNode.getRangeListOptions(startIndex, startIndex + 1)
        if (lineListOptions !== figma.mixed) {
          listOptions.push({
            lineIndex,
            startIndex,
            endIndex,
            type: lineListOptions.type
          })
        }
      } catch (e) {
        // Ignore errors for empty ranges
      }
    }
    
    charIndex = endIndex + 1 // +1 for newline
  }
  
  return listOptions
}

// Export text node with full data
function exportTextNode(node: TextNode): ExportedTextNode {
  const fontName = node.fontName !== figma.mixed ? node.fontName : { family: 'Inter', style: 'Regular' }
  const fontSize = node.fontSize !== figma.mixed ? node.fontSize : 16
  const letterSpacing = node.letterSpacing !== figma.mixed ? node.letterSpacing : { value: 0, unit: 'PIXELS' }
  const lineHeight = node.lineHeight !== figma.mixed ? node.lineHeight : { unit: 'AUTO' }
  const textDecoration = node.textDecoration !== figma.mixed ? node.textDecoration : 'NONE'
  const textCase = node.textCase !== figma.mixed ? node.textCase : 'ORIGINAL'
  const paragraphSpacing = node.paragraphSpacing !== figma.mixed ? node.paragraphSpacing : 0
  const paragraphIndent = node.paragraphIndent !== figma.mixed ? node.paragraphIndent : 0
  
  return {
    id: node.id,
    name: node.name,
    type: 'TEXT',
    characters: node.characters,
    x: node.x,
    y: node.y,
    width: node.width,
    height: node.height,
    rotation: node.rotation,
    opacity: node.opacity,
    visible: node.visible,
    locked: node.locked,
    fontName,
    fontSize,
    fontWeight: getFontWeight(fontName.style),
    letterSpacing,
    lineHeight,
    textAlignHorizontal: node.textAlignHorizontal,
    textAlignVertical: node.textAlignVertical,
    textDecoration,
    textCase,
    listOptions: extractListOptions(node),
    paragraphSpacing,
    paragraphIndent,
    fills: node.fills as Paint[]
  }
}

// Get font weight from style name
function getFontWeight(style: string): number {
  const weights: Record<string, number> = {
    'Thin': 100,
    'ExtraLight': 200,
    'Light': 300,
    'Regular': 400,
    'Medium': 500,
    'SemiBold': 600,
    'Bold': 700,
    'ExtraBold': 800,
    'Black': 900
  }
  
  for (const [name, weight] of Object.entries(weights)) {
    if (style.includes(name)) return weight
  }
  return 400
}

// Export vector node with geometry
function exportVectorNode(node: VectorNode | LineNode | StarNode | PolygonNode | EllipseNode | RectangleNode): ExportedVectorNode {
  return {
    id: node.id,
    name: node.name,
    type: node.type as ExportedVectorNode['type'],
    x: node.x,
    y: node.y,
    width: node.width,
    height: node.height,
    rotation: node.rotation,
    opacity: node.opacity,
    visible: node.visible,
    locked: node.locked,
    fillGeometry: node.fillGeometry,
    strokeGeometry: node.strokeGeometry,
    strokeWeight: typeof node.strokeWeight === 'number' ? node.strokeWeight : 1,
    strokeAlign: node.strokeAlign,
    strokeCap: node.strokeCap !== figma.mixed ? node.strokeCap : 'NONE',
    strokeJoin: node.strokeJoin !== figma.mixed ? node.strokeJoin : 'MITER',
    strokeMiterLimit: node.strokeMiterLimit,
    dashPattern: node.dashPattern,
    fills: node.fills as Paint[],
    strokes: node.strokes as Paint[]
  }
}

// Export frame node
function exportFrameNode(node: FrameNode | GroupNode | ComponentNode | InstanceNode): ExportedFrameNode {
  const children: ExportedNode[] = []
  
  if ('children' in node) {
    for (const child of node.children) {
      const exported = exportNode(child)
      if (exported) children.push(exported)
    }
  }
  
  const isFrame = node.type === 'FRAME' || node.type === 'COMPONENT' || node.type === 'INSTANCE'
  
  return {
    id: node.id,
    name: node.name,
    type: node.type as ExportedFrameNode['type'],
    x: node.x,
    y: node.y,
    width: node.width,
    height: node.height,
    rotation: node.rotation,
    opacity: node.opacity,
    visible: node.visible,
    locked: node.locked,
    clipsContent: isFrame ? (node as FrameNode).clipsContent : false,
    layoutMode: isFrame ? (node as FrameNode).layoutMode : 'NONE',
    layoutPositioning: 'layoutPositioning' in node ? (node as FrameNode).layoutPositioning : 'AUTO',
    primaryAxisSizingMode: isFrame ? (node as FrameNode).primaryAxisSizingMode : 'AUTO',
    counterAxisSizingMode: isFrame ? (node as FrameNode).counterAxisSizingMode : 'AUTO',
    primaryAxisAlignItems: isFrame ? (node as FrameNode).primaryAxisAlignItems : 'MIN',
    counterAxisAlignItems: isFrame ? (node as FrameNode).counterAxisAlignItems : 'MIN',
    paddingLeft: isFrame ? (node as FrameNode).paddingLeft : 0,
    paddingRight: isFrame ? (node as FrameNode).paddingRight : 0,
    paddingTop: isFrame ? (node as FrameNode).paddingTop : 0,
    paddingBottom: isFrame ? (node as FrameNode).paddingBottom : 0,
    itemSpacing: isFrame ? (node as FrameNode).itemSpacing : 0,
    cornerRadius: 'cornerRadius' in node && typeof node.cornerRadius === 'number' ? node.cornerRadius : 0,
    fills: node.fills as Paint[],
    strokes: 'strokes' in node ? node.strokes as Paint[] : [],
    effects: node.effects as Effect[],
    children
  }
}

// Export any node
function exportNode(node: SceneNode): ExportedNode | null {
  if (!node.visible) return null
  
  switch (node.type) {
    case 'TEXT':
      return exportTextNode(node as TextNode)
    
    case 'VECTOR':
    case 'LINE':
    case 'STAR':
    case 'POLYGON':
    case 'ELLIPSE':
    case 'RECTANGLE':
      return exportVectorNode(node as VectorNode)
    
    case 'FRAME':
    case 'GROUP':
    case 'COMPONENT':
    case 'INSTANCE':
      return exportFrameNode(node as FrameNode | GroupNode | ComponentNode | InstanceNode)
    
    default:
      // Generic export for other node types
      return {
        id: node.id,
        name: node.name,
        type: node.type,
        x: 'x' in node ? node.x : 0,
        y: 'y' in node ? node.y : 0,
        width: 'width' in node ? node.width : 0,
        height: 'height' in node ? node.height : 0
      }
  }
}

// Collect all image hashes from the tree
async function collectImageHashes(node: SceneNode, hashes: Set<string>): Promise<void> {
  if ('fills' in node && Array.isArray(node.fills)) {
    for (const fill of node.fills) {
      if (fill.type === 'IMAGE' && fill.imageHash) {
        hashes.add(fill.imageHash)
      }
    }
  }
  
  if ('children' in node) {
    for (const child of (node as FrameNode).children) {
      await collectImageHashes(child, hashes)
    }
  }
}

// Export images as base64
async function exportImages(hashes: Set<string>): Promise<Record<string, string>> {
  const images: Record<string, string> = {}
  
  for (const hash of hashes) {
    try {
      const image = figma.getImageByHash(hash)
      if (image) {
        const bytes = await image.getBytesAsync()
        const base64 = figma.base64Encode(bytes)
        images[hash] = base64
      }
    } catch (e) {
      console.error(`Failed to export image ${hash}:`, e)
    }
  }
  
  return images
}

// Main export function
async function exportSelection(): Promise<ExportData | null> {
  const selection = figma.currentPage.selection
  
  if (selection.length === 0) {
    figma.notify('Please select a frame to export')
    return null
  }
  
  const rootNode = selection[0]
  
  // Collect image hashes
  const imageHashes = new Set<string>()
  await collectImageHashes(rootNode, imageHashes)
  
  // Export images
  const images = await exportImages(imageHashes)
  
  // Export node tree
  const exportedRoot = exportNode(rootNode)
  
  if (!exportedRoot) {
    figma.notify('Failed to export selected node')
    return null
  }
  
  return {
    version: '1.0.0',
    fileKey: figma.fileKey || 'unknown',
    fileName: figma.root.name,
    exportedAt: new Date().toISOString(),
    rootNode: exportedRoot,
    images
  }
}

// Show UI
figma.showUI(__html__, { width: 400, height: 300 })

// Handle messages from UI
figma.ui.onmessage = async (msg: { type: string; apiUrl?: string }) => {
  if (msg.type === 'export') {
    const data = await exportSelection()
    
    if (data) {
      figma.ui.postMessage({ type: 'export-data', data })
      figma.notify('Export ready! Click "Send to Koyot" to import.')
    }
  }
  
  if (msg.type === 'send-to-koyot') {
    const data = await exportSelection()
    
    if (data && msg.apiUrl) {
      figma.ui.postMessage({ 
        type: 'send-data', 
        data,
        apiUrl: msg.apiUrl
      })
    }
  }
  
  if (msg.type === 'close') {
    figma.closePlugin()
  }
}
