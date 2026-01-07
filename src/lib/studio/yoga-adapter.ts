/**
 * Yoga Layout Adapter
 * 
 * Converte a árvore de SceneNode para nós Yoga e calcula
 * as coordenadas absolutas para renderização.
 */

import Yoga, { Node as YogaNode, Direction, FlexDirection, Justify, Align, PositionType, Wrap } from 'yoga-layout'
import type {
  SceneNode,
  FrameNode,
  TextNode,
  LayoutMode,
  Alignment
} from '@/types/studio'

let measureCanvas: HTMLCanvasElement | null = null
let measureCtx: CanvasRenderingContext2D | null = null

function getMeasureContext(): CanvasRenderingContext2D | null {
  if (typeof document === 'undefined') return null

  if (!measureCanvas) {
    measureCanvas = document.createElement('canvas')
    measureCtx = measureCanvas.getContext('2d')
  }
  return measureCtx
}

export function measureText(
  content: string,
  fontFamily: string,
  fontSize: number,
  fontWeight: number,
  maxWidth: number,
  lineHeight: number | 'AUTO'
): { width: number; height: number } {
  const ctx = getMeasureContext()
  if (!ctx) {
    return { width: maxWidth, height: fontSize * 1.2 }
  }

  ctx.font = `${fontWeight} ${fontSize}px "${fontFamily}", sans-serif`

  const actualLineHeight = lineHeight === 'AUTO' ? fontSize * 1.4 : lineHeight

  // Handle newlines first - split into paragraphs
  const paragraphs = content.split('\n')
  let totalLines = 0
  let maxLineWidth = 0

  for (const paragraph of paragraphs) {
    if (paragraph.trim() === '') {
      // Empty line (just a newline)
      totalLines++
      continue
    }

    // Word wrap each paragraph
    const words = paragraph.split(' ')
    let currentLine = ''

    for (const word of words) {
      const testLine = currentLine + (currentLine ? ' ' : '') + word
      const metrics = ctx.measureText(testLine)

      if (metrics.width > maxWidth && currentLine) {
        // Line is too long, wrap
        maxLineWidth = Math.max(maxLineWidth, ctx.measureText(currentLine).width)
        currentLine = word
        totalLines++
      } else {
        currentLine = testLine
      }
    }

    // Last line of paragraph
    if (currentLine) {
      maxLineWidth = Math.max(maxLineWidth, ctx.measureText(currentLine).width)
      totalLines++
    }
  }

  // Ensure at least one line
  if (totalLines === 0) totalLines = 1

  return {
    width: Math.min(maxLineWidth, maxWidth),
    height: totalLines * actualLineHeight,
  }
}

// ============================================
// TYPES
// ============================================

export interface ComputedLayout {
  nodeId: string
  x: number
  y: number
  width: number
  height: number
  children: ComputedLayout[]
}

export interface LayoutContext {
  parentWidth: number
  parentHeight: number
  scale: number
}

// ============================================
// MAPPING FUNCTIONS
// ============================================

function mapLayoutModeToFlexDirection(mode: LayoutMode): FlexDirection {
  switch (mode) {
    case 'HORIZONTAL':
      return FlexDirection.Row
    case 'VERTICAL':
      return FlexDirection.Column
    case 'NONE':
    default:
      return FlexDirection.Column
  }
}

function mapAlignmentToJustify(alignment: Alignment): Justify {
  switch (alignment) {
    case 'START':
      return Justify.FlexStart
    case 'CENTER':
      return Justify.Center
    case 'END':
      return Justify.FlexEnd
    case 'SPACE_BETWEEN':
      return Justify.SpaceBetween
    default:
      return Justify.FlexStart
  }
}

function mapAlignmentToAlign(alignment: Alignment): Align {
  switch (alignment) {
    case 'START':
      return Align.FlexStart
    case 'CENTER':
      return Align.Center
    case 'END':
      return Align.FlexEnd
    case 'SPACE_BETWEEN':
      return Align.SpaceBetween
    default:
      return Align.FlexStart
  }
}

// ============================================
// YOGA NODE CONFIGURATION
// ============================================

function configureYogaNode(
  yogaNode: YogaNode,
  sceneNode: SceneNode,
  isRoot: boolean = false,
  parentHasAutoLayout: boolean = false
): void {
  const { autoLayout, size, position } = sceneNode

  // Position type based on layout mode
  // Key fix: when parent has auto-layout, children participate in flex
  // When parent does NOT have auto-layout, children use absolute positioning with fixed sizes
  // Exception: elements with layoutPositioning: 'ABSOLUTE' always use absolute positioning
  const isAbsolutePositioned = autoLayout.layoutPositioning === 'ABSOLUTE'
  
  if (isAbsolutePositioned) {
    // Elements with ABSOLUTE positioning always use absolute position
    yogaNode.setPositionType(PositionType.Absolute)
    yogaNode.setPosition(Yoga.EDGE_LEFT, position.x)
    yogaNode.setPosition(Yoga.EDGE_TOP, position.y)
    yogaNode.setWidth(size.width)
    yogaNode.setHeight(size.height)
    return // Early return for absolute positioned elements
  } else if (parentHasAutoLayout) {
    // When parent has auto-layout, all children are relative (participate in flex)
    yogaNode.setPositionType(PositionType.Relative)
  } else if (!isRoot) {
    // When parent does NOT have auto-layout, children use absolute positioning
    // This preserves the original Figma positions
    yogaNode.setPositionType(PositionType.Absolute)
    yogaNode.setPosition(Yoga.EDGE_LEFT, position.x)
    yogaNode.setPosition(Yoga.EDGE_TOP, position.y)
    
    // For absolute positioned elements, always use fixed size from Figma
    yogaNode.setWidth(size.width)
    yogaNode.setHeight(size.height)
    
    // Configure flex properties for this node's children if it's a FRAME
    if (sceneNode.type === 'FRAME') {
      yogaNode.setFlexDirection(mapLayoutModeToFlexDirection(autoLayout.layoutMode))
      yogaNode.setJustifyContent(mapAlignmentToJustify(autoLayout.primaryAxisAlignment))
      yogaNode.setAlignItems(mapAlignmentToAlign(autoLayout.counterAxisAlignment))
      yogaNode.setFlexWrap(autoLayout.wrap ? Wrap.Wrap : Wrap.NoWrap)
      yogaNode.setGap(Yoga.GUTTER_ALL, autoLayout.gap)
      yogaNode.setPadding(Yoga.EDGE_TOP, autoLayout.padding.top)
      yogaNode.setPadding(Yoga.EDGE_RIGHT, autoLayout.padding.right)
      yogaNode.setPadding(Yoga.EDGE_BOTTOM, autoLayout.padding.bottom)
      yogaNode.setPadding(Yoga.EDGE_LEFT, autoLayout.padding.left)
    }
    return // Early return for absolute positioned elements
  } else {
    yogaNode.setPositionType(PositionType.Relative)
  }

  // For TEXT nodes, configure sizing
  if (sceneNode.type === 'TEXT') {
    const textNode = sceneNode as TextNode
    const { style, content } = textNode.textProps

    // Calculate line height - lineHeight is a multiplier (e.g., 1.5)
    const lineHeightPx = typeof style.lineHeight === 'number'
      ? style.fontSize * style.lineHeight
      : style.fontSize * 1.4

    // Width sizing
    if (autoLayout.horizontalSizing === 'HUG') {
      // Measure text to get intrinsic width
      const measured = measureText(content, style.fontFamily, style.fontSize, style.fontWeight, 10000, lineHeightPx)
      yogaNode.setWidth(measured.width)
    } else if (autoLayout.horizontalSizing === 'FIXED') {
      yogaNode.setWidth(size.width)
    } else if (autoLayout.horizontalSizing === 'FILL') {
      // FILL: use alignSelf stretch to fill parent width
      yogaNode.setAlignSelf(Align.Stretch)
      yogaNode.setWidthPercent(100)
    }

    // Height sizing
    if (autoLayout.verticalSizing === 'HUG') {
      // For HUG height, we need to estimate based on width
      // If width is FILL, use a reasonable estimate; actual height will be calculated in render
      let estimatedWidth: number
      if (autoLayout.horizontalSizing === 'FIXED') {
        estimatedWidth = size.width
      } else if (autoLayout.horizontalSizing === 'FILL') {
        // Use parent's available width estimate - this will be refined in render
        // For now, use a generous estimate to avoid clipping
        estimatedWidth = 1000
      } else {
        estimatedWidth = 10000
      }
      const measured = measureText(content, style.fontFamily, style.fontSize, style.fontWeight, estimatedWidth, lineHeightPx)
      // Add some buffer for text that might wrap more
      yogaNode.setMinHeight(measured.height)
      yogaNode.setHeightAuto()
    } else if (autoLayout.verticalSizing === 'FIXED') {
      yogaNode.setHeight(size.height)
    } else if (autoLayout.verticalSizing === 'FILL') {
      yogaNode.setAlignSelf(Align.Stretch)
      yogaNode.setHeightPercent(100)
    }

    return // TEXT nodes don't need flex direction, gap, etc.
  }

  // For non-TEXT nodes (FRAME, RECTANGLE, IMAGE, etc.)

  // Flex direction (only for FRAME)
  if (sceneNode.type === 'FRAME') {
    yogaNode.setFlexDirection(mapLayoutModeToFlexDirection(autoLayout.layoutMode))
    yogaNode.setJustifyContent(mapAlignmentToJustify(autoLayout.primaryAxisAlignment))
    yogaNode.setAlignItems(mapAlignmentToAlign(autoLayout.counterAxisAlignment))
    yogaNode.setFlexWrap(autoLayout.wrap ? Wrap.Wrap : Wrap.NoWrap)
    yogaNode.setGap(Yoga.GUTTER_ALL, autoLayout.gap)
    yogaNode.setPadding(Yoga.EDGE_TOP, autoLayout.padding.top)
    yogaNode.setPadding(Yoga.EDGE_RIGHT, autoLayout.padding.right)
    yogaNode.setPadding(Yoga.EDGE_BOTTOM, autoLayout.padding.bottom)
    yogaNode.setPadding(Yoga.EDGE_LEFT, autoLayout.padding.left)
  }

  // Width sizing
  switch (autoLayout.horizontalSizing) {
    case 'FIXED':
      yogaNode.setWidth(size.width)
      break
    case 'HUG':
      yogaNode.setWidthAuto()
      break
    case 'FILL':
      // FILL width: use alignSelf stretch + flexGrow
      yogaNode.setAlignSelf(Align.Stretch)
      yogaNode.setFlexGrow(1)
      yogaNode.setFlexShrink(1)
      break
  }

  // Height sizing
  switch (autoLayout.verticalSizing) {
    case 'FIXED':
      yogaNode.setHeight(size.height)
      break
    case 'HUG':
      yogaNode.setHeightAuto()
      break
    case 'FILL':
      // FILL height: use alignSelf stretch + flexGrow
      yogaNode.setAlignSelf(Align.Stretch)
      yogaNode.setFlexGrow(1)
      yogaNode.setFlexShrink(1)
      break
  }

  // Min/Max constraints for safety
  if (size.width > 0 && autoLayout.horizontalSizing === 'HUG') {
    yogaNode.setMinWidth(0)
  }
  if (size.height > 0 && autoLayout.verticalSizing === 'HUG') {
    yogaNode.setMinHeight(0)
  }
}

// ============================================
// TREE BUILDING
// ============================================

function buildYogaTree(
  sceneNode: SceneNode,
  isRoot: boolean = false,
  parentHasAutoLayout: boolean = false
): YogaNode {
  const yogaNode = Yoga.Node.create()

  // Configure this node
  configureYogaNode(yogaNode, sceneNode, isRoot, parentHasAutoLayout)

  // Process children for FRAME nodes
  if (sceneNode.type === 'FRAME') {
    const frameNode = sceneNode as FrameNode
    const hasAutoLayout = frameNode.autoLayout.layoutMode !== 'NONE'

    frameNode.children.forEach((child, index) => {
      if (child.visible) {
        const childYogaNode = buildYogaTree(child, false, hasAutoLayout)
        yogaNode.insertChild(childYogaNode, index)
      }
    })
  }

  return yogaNode
}

function extractLayout(
  yogaNode: YogaNode,
  sceneNode: SceneNode,
  parentX: number = 0,
  parentY: number = 0
): ComputedLayout {
  const layout = yogaNode.getComputedLayout()

  // For absolute positioned elements, layout.left/top already contains the position
  // relative to parent, so we just add parentX/parentY
  const absoluteX = parentX + layout.left
  const absoluteY = parentY + layout.top

  const computed: ComputedLayout = {
    nodeId: sceneNode.id,
    x: absoluteX,
    y: absoluteY,
    width: layout.width,
    height: layout.height,
    children: [],
  }

  // Process children
  if (sceneNode.type === 'FRAME') {
    const frameNode = sceneNode as FrameNode
    let childIndex = 0

    frameNode.children.forEach((child) => {
      if (child.visible) {
        const childYogaNode = yogaNode.getChild(childIndex)
        if (childYogaNode) {
          computed.children.push(
            extractLayout(childYogaNode, child, absoluteX, absoluteY)
          )
          childIndex++
        }
      }
    })
  }

  return computed
}

// ============================================
// MAIN API
// ============================================

/**
 * Calcula o layout de toda a árvore de SceneNodes usando Yoga
 * 
 * @param rootNode - Nó raiz da árvore (geralmente um FRAME)
 * @param containerWidth - Largura do container (opcional, usa size do rootNode)
 * @param containerHeight - Altura do container (opcional, usa size do rootNode)
 * @returns ComputedLayout com coordenadas absolutas
 */
export function calculateLayout(
  rootNode: FrameNode,
  containerWidth?: number,
  containerHeight?: number
): ComputedLayout {
  // Set root dimensions
  const width = containerWidth ?? rootNode.size.width
  const height = containerHeight ?? rootNode.size.height

  // PASS 1: Build tree and calculate initial layout to get widths
  const yogaRoot = buildYogaTree(rootNode, true)
  yogaRoot.setWidth(width)
  yogaRoot.setHeight(height)
  yogaRoot.calculateLayout(width, height, Direction.LTR)

  // PASS 2: Re-measure TEXT nodes with FILL width and recalculate
  // This ensures text height is correct based on actual available width
  remeasureTextNodes(yogaRoot, rootNode)
  yogaRoot.calculateLayout(width, height, Direction.LTR)

  // Extract computed positions
  const computedLayout = extractLayout(yogaRoot, rootNode)

  // Free Yoga nodes
  yogaRoot.freeRecursive()

  return computedLayout
}

/**
 * Re-measure TEXT nodes after initial layout to get correct heights
 * based on actual computed widths
 */
function remeasureTextNodes(yogaNode: YogaNode, sceneNode: SceneNode): void {
  if (sceneNode.type === 'TEXT') {
    const textNode = sceneNode as TextNode
    const { style, content } = textNode.textProps
    const { autoLayout } = textNode

    // Re-measure if width is FILL (height can be HUG or FILL)
    if (autoLayout.horizontalSizing === 'FILL') {
      const computedWidth = yogaNode.getComputedWidth()
      
      if (computedWidth > 0 && autoLayout.verticalSizing === 'HUG') {
        const lineHeightPx = typeof style.lineHeight === 'number'
          ? style.fontSize * style.lineHeight
          : style.fontSize * 1.4

        const measured = measureText(
          content,
          style.fontFamily,
          style.fontSize,
          style.fontWeight,
          computedWidth,
          lineHeightPx
        )
        
        // Update height based on actual width
        yogaNode.setHeight(measured.height)
      }
    }
  }

  // Process children for FRAME nodes
  if (sceneNode.type === 'FRAME') {
    const frameNode = sceneNode as FrameNode
    let childIndex = 0

    frameNode.children.forEach((child) => {
      if (child.visible) {
        const childYogaNode = yogaNode.getChild(childIndex)
        if (childYogaNode) {
          remeasureTextNodes(childYogaNode, child)
          childIndex++
        }
      }
    })
  }
}

/**
 * Cria um mapa de ID -> ComputedLayout para acesso rápido
 */
export function createLayoutMap(
  computedLayout: ComputedLayout
): Map<string, ComputedLayout> {
  const map = new Map<string, ComputedLayout>()

  function traverse(layout: ComputedLayout) {
    map.set(layout.nodeId, layout)
    layout.children.forEach(traverse)
  }

  traverse(computedLayout)
  return map
}

/**
 * Recalcula o layout apenas para um subtree
 * Útil para updates incrementais
 */
export function calculateSubtreeLayout(
  node: SceneNode,
  parentLayout: ComputedLayout
): ComputedLayout {
  if (node.type !== 'FRAME') {
    // Non-frame nodes use their fixed size
    return {
      nodeId: node.id,
      x: parentLayout.x + node.position.x,
      y: parentLayout.y + node.position.y,
      width: node.size.width,
      height: node.size.height,
      children: [],
    }
  }

  return calculateLayout(node as FrameNode)
}

/**
 * Valida se o layout é válido (sem overlaps indesejados)
 */
export function validateLayout(
  layout: ComputedLayout,
  tolerance: number = 0
): { valid: boolean; issues: string[] } {
  const issues: string[] = []

  function checkOverlap(
    a: ComputedLayout,
    b: ComputedLayout
  ): boolean {
    return !(
      a.x + a.width + tolerance <= b.x ||
      b.x + b.width + tolerance <= a.x ||
      a.y + a.height + tolerance <= b.y ||
      b.y + b.height + tolerance <= a.y
    )
  }

  function validateChildren(parent: ComputedLayout) {
    const children = parent.children

    // Check for overlaps between siblings
    for (let i = 0; i < children.length; i++) {
      for (let j = i + 1; j < children.length; j++) {
        if (checkOverlap(children[i], children[j])) {
          issues.push(
            `Overlap detected between ${children[i].nodeId} and ${children[j].nodeId}`
          )
        }
      }

      // Check children bounds
      const child = children[i]
      if (
        child.x < parent.x ||
        child.y < parent.y ||
        child.x + child.width > parent.x + parent.width + tolerance ||
        child.y + child.height > parent.y + parent.height + tolerance
      ) {
        issues.push(`Node ${child.nodeId} exceeds parent bounds`)
      }

      // Recurse
      validateChildren(child)
    }
  }

  validateChildren(layout)

  return {
    valid: issues.length === 0,
    issues,
  }
}

// ============================================
// UTILITIES
// ============================================

/**
 * Calcula o tamanho mínimo necessário para conter todos os filhos
 */
export function calculateMinimumSize(
  node: FrameNode
): { minWidth: number; minHeight: number } {
  const yogaNode = buildYogaTree(node, true)

  // Set to auto to get intrinsic size
  yogaNode.setWidthAuto()
  yogaNode.setHeightAuto()

  yogaNode.calculateLayout(undefined, undefined, Direction.LTR)

  const layout = yogaNode.getComputedLayout()

  yogaNode.freeRecursive()

  return {
    minWidth: layout.width,
    minHeight: layout.height,
  }
}

/**
 * Simula como o layout mudaria com um novo conteúdo de texto
 */
export function simulateTextChange(
  rootNode: FrameNode,
  textNodeId: string,
  newWidth: number,
  newHeight: number
): ComputedLayout {
  // Clone the tree with modified text node dimensions
  const modifiedRoot = JSON.parse(JSON.stringify(rootNode)) as FrameNode

  function findAndModify(node: SceneNode): boolean {
    if (node.id === textNodeId) {
      node.size.width = newWidth
      node.size.height = newHeight
      return true
    }
    if (node.type === 'FRAME') {
      for (const child of (node as FrameNode).children) {
        if (findAndModify(child)) return true
      }
    }
    return false
  }

  findAndModify(modifiedRoot)

  return calculateLayout(modifiedRoot)
}
