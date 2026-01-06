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

  // Non-FRAME nodes (TEXT, IMAGE, etc.) should ALWAYS be relative when inside auto-layout parent
  const isNonFrameNode = sceneNode.type !== 'FRAME'

  // Position type based on layout mode
  // Key fix: non-FRAME nodes always participate in auto-layout when parent has it
  if (parentHasAutoLayout || isNonFrameNode) {
    // Always relative when parent is auto-layout or this is a leaf node
    yogaNode.setPositionType(PositionType.Relative)
  } else if (autoLayout.layoutMode === 'NONE' && !isRoot) {
    // Only FRAME nodes with layoutMode NONE outside auto-layout are absolute
    yogaNode.setPositionType(PositionType.Absolute)
    yogaNode.setPosition(Yoga.EDGE_LEFT, position.x)
    yogaNode.setPosition(Yoga.EDGE_TOP, position.y)
  } else {
    yogaNode.setPositionType(PositionType.Relative)
  }

  // For TEXT nodes, measure text to get intrinsic size
  if (sceneNode.type === 'TEXT') {
    const textNode = sceneNode as TextNode
    const { style, content } = textNode.textProps

    // Calculate line height
    const lineHeightPx = typeof style.lineHeight === 'number' && style.lineHeight < 10
      ? style.fontSize * style.lineHeight
      : style.fontSize * 1.4

    // Measure text with proper width constraint
    // For FIXED: use explicit size
    // For FILL: text will get width from parent - use a reasonable default for measurement
    // For HUG: let text expand naturally
    let maxWidth: number
    if (autoLayout.horizontalSizing === 'FIXED' && size.width > 0) {
      maxWidth = size.width
    } else if (autoLayout.horizontalSizing === 'FILL') {
      // For FILL sizing, use size.width if set, otherwise let Yoga handle it
      // The actual width will be determined by flex layout
      maxWidth = size.width > 0 ? size.width : 10000
    } else {
      // HUG - let text be as wide as content needs
      maxWidth = 10000
    }

    const measured = measureText(
      content,
      style.fontFamily,
      style.fontSize,
      style.fontWeight,
      maxWidth,
      lineHeightPx
    )

    // Set dimensions based on sizing mode
    if (autoLayout.horizontalSizing === 'HUG') {
      yogaNode.setWidth(measured.width)
    } else if (autoLayout.horizontalSizing === 'FIXED') {
      yogaNode.setWidth(size.width)
    } else if (autoLayout.horizontalSizing === 'FILL') {
      yogaNode.setFlexGrow(1)
      yogaNode.setFlexShrink(1)
      yogaNode.setFlexBasis(0) // Important for proper flex distribution
    }

    if (autoLayout.verticalSizing === 'HUG') {
      yogaNode.setHeight(measured.height)
    } else if (autoLayout.verticalSizing === 'FIXED') {
      yogaNode.setHeight(size.height)
    } else if (autoLayout.verticalSizing === 'FILL') {
      yogaNode.setFlexGrow(1)
      yogaNode.setFlexShrink(1)
      yogaNode.setFlexBasis(0)
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
      yogaNode.setFlexGrow(1)
      yogaNode.setFlexShrink(1)
      yogaNode.setFlexBasis(0) // Use 0 basis for proper flex distribution
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
      yogaNode.setFlexGrow(1)
      yogaNode.setFlexShrink(1)
      yogaNode.setFlexBasis(0)
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
  // Build Yoga tree
  const yogaRoot = buildYogaTree(rootNode, true)

  // Set root dimensions
  const width = containerWidth ?? rootNode.size.width
  const height = containerHeight ?? rootNode.size.height

  yogaRoot.setWidth(width)
  yogaRoot.setHeight(height)

  // Calculate layout
  yogaRoot.calculateLayout(width, height, Direction.LTR)

  // DEBUG: Log computed layout for all nodes
  function logLayoutTree(yogaNode: YogaNode, node: SceneNode, depth: number = 0) {
    const layout = yogaNode.getComputedLayout()
    const indent = '  '.repeat(depth)
    console.log(`${indent}[${node.type}] ${node.name || node.id}: x=${layout.left}, y=${layout.top}, w=${layout.width}, h=${layout.height}`)

    if (node.type === 'FRAME') {
      const frameNode = node as FrameNode
      let childIndex = 0
      frameNode.children.forEach((child) => {
        if (child.visible) {
          const childYogaNode = yogaNode.getChild(childIndex)
          if (childYogaNode) {
            logLayoutTree(childYogaNode, child, depth + 1)
            childIndex++
          }
        }
      })
    }
  }
  console.log('=== YOGA LAYOUT DEBUG ===')
  logLayoutTree(yogaRoot, rootNode)
  console.log('=========================')

  // Extract computed positions
  const computedLayout = extractLayout(yogaRoot, rootNode)

  // Free Yoga nodes
  yogaRoot.freeRecursive()

  return computedLayout
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
