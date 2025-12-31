'use client'

import { useEffect, useRef, useState, useCallback, useMemo } from 'react'
import { calculateLayout, createLayoutMap, type ComputedLayout } from '@/lib/studio/yoga-adapter'
import type { 
  SceneNode, 
  FrameNode, 
  TextNode, 
  ImageNode,
  Fill,
  Color,
} from '@/types/studio'

// ============================================
// TYPES
// ============================================

interface CanvasRendererProps {
  rootNode: FrameNode
  selectedNodeId: string | null
  onNodeClick: (nodeId: string | null) => void
  zoom: number
  panOffset: { x: number; y: number }
  showGrid?: boolean
  gridSize?: number
}

interface RenderContext {
  ctx: CanvasRenderingContext2D
  layoutMap: Map<string, ComputedLayout>
  zoom: number
  selectedNodeId: string | null
  loadedImages: Map<string, HTMLImageElement>
}

// ============================================
// COLOR UTILITIES
// ============================================

function colorToRgba(color: Color): string {
  return `rgba(${color.r}, ${color.g}, ${color.b}, ${color.a})`
}

// ============================================
// FILL RENDERING
// ============================================

function applyFill(
  ctx: CanvasRenderingContext2D,
  fill: Fill,
  x: number,
  y: number,
  width: number,
  height: number
): void {
  if (fill.type === 'SOLID') {
    ctx.fillStyle = colorToRgba(fill.color)
    ctx.fillRect(x, y, width, height)
  } else if (fill.type === 'GRADIENT_LINEAR') {
    const angle = fill.angle || 0
    const radians = (angle * Math.PI) / 180
    const cx = x + width / 2
    const cy = y + height / 2
    const halfDiag = Math.sqrt(width * width + height * height) / 2
    
    const x1 = cx - halfDiag * Math.cos(radians)
    const y1 = cy - halfDiag * Math.sin(radians)
    const x2 = cx + halfDiag * Math.cos(radians)
    const y2 = cy + halfDiag * Math.sin(radians)
    
    const gradient = ctx.createLinearGradient(x1, y1, x2, y2)
    fill.stops.forEach((stop) => {
      gradient.addColorStop(stop.position, colorToRgba(stop.color))
    })
    ctx.fillStyle = gradient
    ctx.fillRect(x, y, width, height)
  } else if (fill.type === 'GRADIENT_RADIAL') {
    const cx = x + width / 2
    const cy = y + height / 2
    const radius = Math.max(width, height) / 2
    
    const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius)
    fill.stops.forEach((stop) => {
      gradient.addColorStop(stop.position, colorToRgba(stop.color))
    })
    ctx.fillStyle = gradient
    ctx.fillRect(x, y, width, height)
  }
}

// ============================================
// NODE RENDERING
// ============================================

function renderFrame(
  node: FrameNode,
  context: RenderContext
): void {
  const { ctx, layoutMap, zoom, selectedNodeId } = context
  const layout = layoutMap.get(node.id)
  if (!layout) return
  
  const x = layout.x * zoom
  const y = layout.y * zoom
  const width = layout.width * zoom
  const height = layout.height * zoom
  
  ctx.save()
  
  // Apply opacity
  ctx.globalAlpha = node.opacity
  
  // Apply corner radius clipping
  const radius = typeof node.cornerRadius === 'number' 
    ? node.cornerRadius * zoom 
    : node.cornerRadius.topLeft * zoom
  
  if (radius > 0 || node.clipsContent) {
    ctx.beginPath()
    ctx.roundRect(x, y, width, height, radius)
    ctx.clip()
  }
  
  // Render fills
  node.fills.forEach((fill) => {
    applyFill(ctx, fill, x, y, width, height)
  })
  
  // Render border
  if (node.border && node.border.width > 0) {
    ctx.strokeStyle = colorToRgba(node.border.color)
    ctx.lineWidth = node.border.width * zoom
    if (node.border.style === 'DASHED') {
      ctx.setLineDash([8 * zoom, 4 * zoom])
    } else if (node.border.style === 'DOTTED') {
      ctx.setLineDash([2 * zoom, 2 * zoom])
    }
    ctx.strokeRect(x, y, width, height)
    ctx.setLineDash([])
  }
  
  // Render children
  node.children.forEach((child) => {
    if (child.visible) {
      renderNode(child, context)
    }
  })
  
  ctx.restore()
  
  // Render selection highlight (outside clip)
  if (selectedNodeId === node.id) {
    renderSelectionHighlight(ctx, x, y, width, height)
  }
}

function renderText(
  node: TextNode,
  context: RenderContext
): void {
  const { ctx, layoutMap, zoom, selectedNodeId } = context
  const layout = layoutMap.get(node.id)
  if (!layout) return
  
  const x = layout.x * zoom
  const y = layout.y * zoom
  const width = layout.width * zoom
  const height = layout.height * zoom
  
  ctx.save()
  ctx.globalAlpha = node.opacity
  
  // Background fills
  node.fills.forEach((fill) => {
    if (fill.type === 'SOLID') {
      ctx.fillStyle = colorToRgba(fill.color)
    }
  })
  
  // Text styling
  const { style, content } = node.textProps
  const fontSize = style.fontSize * zoom
  const fontWeight = style.fontWeight
  const fontFamily = style.fontFamily || 'Inter'
  
  ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`
  ctx.textBaseline = 'top'
  
  // Text alignment
  let textX = x
  if (style.textAlign === 'CENTER') {
    ctx.textAlign = 'center'
    textX = x + width / 2
  } else if (style.textAlign === 'RIGHT') {
    ctx.textAlign = 'right'
    textX = x + width
  } else {
    ctx.textAlign = 'left'
  }
  
  // Line height
  const lineHeight = style.lineHeight === 'AUTO' 
    ? fontSize * 1.2 
    : style.fontSize * style.lineHeight * zoom
  
  // Render text with wrapping
  const words = content.split(' ')
  let line = ''
  let currentY = y
  
  words.forEach((word, index) => {
    const testLine = line + word + ' '
    const metrics = ctx.measureText(testLine)
    
    if (metrics.width > width && index > 0) {
      ctx.fillText(line.trim(), textX, currentY)
      line = word + ' '
      currentY += lineHeight
    } else {
      line = testLine
    }
  })
  ctx.fillText(line.trim(), textX, currentY)
  
  ctx.restore()
  
  // Selection highlight
  if (selectedNodeId === node.id) {
    renderSelectionHighlight(ctx, x, y, width, height)
  }
}

function renderImage(
  node: ImageNode,
  context: RenderContext
): void {
  const { ctx, layoutMap, zoom, selectedNodeId, loadedImages } = context
  const layout = layoutMap.get(node.id)
  if (!layout) return
  
  const x = layout.x * zoom
  const y = layout.y * zoom
  const width = layout.width * zoom
  const height = layout.height * zoom
  
  ctx.save()
  ctx.globalAlpha = node.opacity
  
  // Apply corner radius
  const radius = typeof node.cornerRadius === 'number' 
    ? node.cornerRadius * zoom 
    : node.cornerRadius.topLeft * zoom
  
  if (radius > 0) {
    ctx.beginPath()
    ctx.roundRect(x, y, width, height, radius)
    ctx.clip()
  }
  
  // Render image or placeholder
  const src = node.imageProps.src || ''
  const loadedImg = loadedImages.get(src)
  
  if (loadedImg) {
    // Object fit handling
    const { objectFit } = node.imageProps
    let sx = 0, sy = 0, sw = loadedImg.width, sh = loadedImg.height
    let dx = x, dy = y, dw = width, dh = height
    
    if (objectFit === 'CROP' || objectFit === 'FILL') {
      const imgAspect = loadedImg.width / loadedImg.height
      const boxAspect = width / height
      
      if (imgAspect > boxAspect) {
        sw = loadedImg.height * boxAspect
        sx = (loadedImg.width - sw) / 2
      } else {
        sh = loadedImg.width / boxAspect
        sy = (loadedImg.height - sh) / 2
      }
    } else if (objectFit === 'FIT') {
      const imgAspect = loadedImg.width / loadedImg.height
      const boxAspect = width / height
      
      if (imgAspect > boxAspect) {
        dh = width / imgAspect
        dy = y + (height - dh) / 2
      } else {
        dw = height * imgAspect
        dx = x + (width - dw) / 2
      }
    }
    
    ctx.drawImage(loadedImg, sx, sy, sw, sh, dx, dy, dw, dh)
  } else {
    // Placeholder
    ctx.fillStyle = '#f0f0f0'
    ctx.fillRect(x, y, width, height)
    ctx.fillStyle = '#999'
    ctx.font = `${12 * zoom}px Inter`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('📷', x + width / 2, y + height / 2)
  }
  
  ctx.restore()
  
  // Selection highlight
  if (selectedNodeId === node.id) {
    renderSelectionHighlight(ctx, x, y, width, height)
  }
}

function renderRectangle(
  node: SceneNode,
  context: RenderContext
): void {
  const { ctx, layoutMap, zoom, selectedNodeId } = context
  const layout = layoutMap.get(node.id)
  if (!layout) return
  
  const x = layout.x * zoom
  const y = layout.y * zoom
  const width = layout.width * zoom
  const height = layout.height * zoom
  
  ctx.save()
  ctx.globalAlpha = node.opacity
  
  const radius = typeof node.cornerRadius === 'number' 
    ? node.cornerRadius * zoom 
    : node.cornerRadius.topLeft * zoom
  
  // Fills
  node.fills.forEach((fill) => {
    ctx.beginPath()
    ctx.roundRect(x, y, width, height, radius)
    if (fill.type === 'SOLID') {
      ctx.fillStyle = colorToRgba(fill.color)
      ctx.fill()
    }
  })
  
  // Border
  if (node.border && node.border.width > 0) {
    ctx.strokeStyle = colorToRgba(node.border.color)
    ctx.lineWidth = node.border.width * zoom
    ctx.stroke()
  }
  
  ctx.restore()
  
  if (selectedNodeId === node.id) {
    renderSelectionHighlight(ctx, x, y, width, height)
  }
}

function renderNode(node: SceneNode, context: RenderContext): void {
  if (!node.visible) return
  
  switch (node.type) {
    case 'FRAME':
      renderFrame(node as FrameNode, context)
      break
    case 'TEXT':
      renderText(node as TextNode, context)
      break
    case 'IMAGE':
      renderImage(node as ImageNode, context)
      break
    case 'RECTANGLE':
    case 'ELLIPSE':
    case 'LINE':
      renderRectangle(node, context)
      break
  }
}

// ============================================
// SELECTION HIGHLIGHT (THE ONLY VISUAL FEEDBACK)
// ============================================

function renderSelectionHighlight(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number
): void {
  ctx.save()
  
  // Blue selection border
  ctx.strokeStyle = '#0066FF'
  ctx.lineWidth = 2
  ctx.setLineDash([])
  ctx.strokeRect(x - 1, y - 1, width + 2, height + 2)
  
  // Corner handles (visual only - no dragging)
  const handleSize = 6
  ctx.fillStyle = '#0066FF'
  
  // Corners
  const corners = [
    [x - handleSize / 2, y - handleSize / 2],
    [x + width - handleSize / 2, y - handleSize / 2],
    [x - handleSize / 2, y + height - handleSize / 2],
    [x + width - handleSize / 2, y + height - handleSize / 2],
  ]
  
  corners.forEach(([cx, cy]) => {
    ctx.fillRect(cx, cy, handleSize, handleSize)
  })
  
  ctx.restore()
}

// ============================================
// GRID RENDERING
// ============================================

function renderGrid(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  gridSize: number,
  zoom: number
): void {
  const scaledGridSize = gridSize * zoom
  
  ctx.save()
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.05)'
  ctx.lineWidth = 1
  
  // Vertical lines
  for (let x = 0; x <= width; x += scaledGridSize) {
    ctx.beginPath()
    ctx.moveTo(x, 0)
    ctx.lineTo(x, height)
    ctx.stroke()
  }
  
  // Horizontal lines
  for (let y = 0; y <= height; y += scaledGridSize) {
    ctx.beginPath()
    ctx.moveTo(0, y)
    ctx.lineTo(width, y)
    ctx.stroke()
  }
  
  ctx.restore()
}

// ============================================
// HIT TESTING (for click detection)
// ============================================

function hitTest(
  node: SceneNode,
  layoutMap: Map<string, ComputedLayout>,
  x: number,
  y: number,
  zoom: number
): string | null {
  const layout = layoutMap.get(node.id)
  if (!layout || !node.visible) return null
  
  const nodeX = layout.x * zoom
  const nodeY = layout.y * zoom
  const nodeWidth = layout.width * zoom
  const nodeHeight = layout.height * zoom
  
  // Check if point is inside this node
  const isInside = 
    x >= nodeX && 
    x <= nodeX + nodeWidth && 
    y >= nodeY && 
    y <= nodeY + nodeHeight
  
  if (!isInside) return null
  
  // Check children first (they're on top)
  if (node.type === 'FRAME') {
    const frameNode = node as FrameNode
    // Reverse order to check topmost children first
    for (let i = frameNode.children.length - 1; i >= 0; i--) {
      const childHit = hitTest(frameNode.children[i], layoutMap, x, y, zoom)
      if (childHit) return childHit
    }
  }
  
  return node.id
}

// ============================================
// MAIN COMPONENT
// ============================================

export function CanvasRenderer({
  rootNode,
  selectedNodeId,
  onNodeClick,
  zoom,
  panOffset,
  showGrid = false,
  gridSize = 20,
}: CanvasRendererProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [loadedImages, setLoadedImages] = useState<Map<string, HTMLImageElement>>(new Map())
  
  // Calculate layout using Yoga
  const computedLayout = useMemo(() => {
    return calculateLayout(rootNode)
  }, [rootNode])
  
  const layoutMap = useMemo(() => {
    return createLayoutMap(computedLayout)
  }, [computedLayout])
  
  // Preload images
  useEffect(() => {
    const imagesToLoad: string[] = []
    
    function collectImages(node: SceneNode) {
      if (node.type === 'IMAGE') {
        const src = (node as ImageNode).imageProps.src
        if (src && !loadedImages.has(src)) {
          imagesToLoad.push(src)
        }
      }
      if (node.type === 'FRAME') {
        (node as FrameNode).children.forEach(collectImages)
      }
    }
    
    collectImages(rootNode)
    
    if (imagesToLoad.length > 0) {
      Promise.all(
        imagesToLoad.map((src) => {
          return new Promise<[string, HTMLImageElement]>((resolve, reject) => {
            const img = new Image()
            img.crossOrigin = 'anonymous'
            img.onload = () => resolve([src, img])
            img.onerror = () => reject(new Error(`Failed to load: ${src}`))
            img.src = src
          })
        })
      ).then((results) => {
        setLoadedImages((prev) => {
          const next = new Map(prev)
          results.forEach(([src, img]) => next.set(src, img))
          return next
        })
      }).catch(console.error)
    }
  }, [rootNode, loadedImages])
  
  // Render canvas
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    
    // Set canvas size
    const canvasWidth = rootNode.size.width * zoom
    const canvasHeight = rootNode.size.height * zoom
    
    canvas.width = canvasWidth
    canvas.height = canvasHeight
    
    // Clear
    ctx.clearRect(0, 0, canvasWidth, canvasHeight)
    
    // Apply pan offset
    ctx.save()
    ctx.translate(panOffset.x, panOffset.y)
    
    // Render grid if enabled
    if (showGrid) {
      renderGrid(ctx, canvasWidth, canvasHeight, gridSize, zoom)
    }
    
    // Render scene
    const context: RenderContext = {
      ctx,
      layoutMap,
      zoom,
      selectedNodeId,
      loadedImages,
    }
    
    renderNode(rootNode, context)
    
    ctx.restore()
  }, [rootNode, computedLayout, layoutMap, zoom, panOffset, selectedNodeId, showGrid, gridSize, loadedImages])
  
  // Handle click - NO DRAGGING, just selection
  const handleClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return
    
    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left - panOffset.x
    const y = e.clientY - rect.top - panOffset.y
    
    // Find clicked node
    const hitNodeId = hitTest(rootNode, layoutMap, x, y, zoom)
    onNodeClick(hitNodeId)
  }, [rootNode, layoutMap, zoom, panOffset, onNodeClick])
  
  return (
    <div 
      ref={containerRef}
      className="relative flex items-center justify-center bg-muted/30 overflow-auto"
      style={{ width: '100%', height: '100%' }}
    >
      {/* Canvas wrapper with shadow */}
      <div 
        className="relative shadow-2xl"
        style={{
          transform: `translate(${panOffset.x}px, ${panOffset.y}px)`,
        }}
      >
        <canvas
          ref={canvasRef}
          onClick={handleClick}
          className="cursor-default"
          style={{
            width: rootNode.size.width * zoom,
            height: rootNode.size.height * zoom,
          }}
        />
      </div>
    </div>
  )
}

export default CanvasRenderer
