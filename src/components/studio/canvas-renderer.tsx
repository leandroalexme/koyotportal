'use client'

import { useEffect, useRef, useState, useCallback, useMemo } from 'react'
import { 
  renderScene, 
  hitTest, 
  fontEngine,
} from '@/lib/studio/render-engine'
import { type ComputedLayout } from '@/lib/studio/yoga-adapter'
import type { FrameNode } from '@/types/studio'
import { cn } from '@/lib/utils'

interface CanvasRendererProps {
  rootNode: FrameNode
  selectedNodeId: string | null
  onNodeClick: (nodeId: string | null) => void
  zoom: number
  panOffset: { x: number; y: number }
  showGrid?: boolean
  onHover?: (nodeId: string | null) => void
  onZoomChange?: (zoom: number) => void
}

export function CanvasRenderer({
  rootNode,
  selectedNodeId,
  onNodeClick,
  zoom,
  panOffset,
  showGrid = false,
  onHover,
  onZoomChange,
}: CanvasRendererProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null)
  const [layoutMap, setLayoutMap] = useState<Map<string, ComputedLayout>>(new Map())
  const [fontsLoaded, setFontsLoaded] = useState(false)
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 })
  const animationFrameRef = useRef<number | null>(null)
  
  const centerOffset = useMemo(() => {
    if (containerSize.width === 0 || containerSize.height === 0) {
      return { x: 0, y: 0 }
    }
    
    const artWidth = rootNode.size.width * zoom
    const artHeight = rootNode.size.height * zoom
    
    const offsetX = (containerSize.width - artWidth) / 2
    const offsetY = (containerSize.height - artHeight) / 2
    
    return {
      x: offsetX + panOffset.x * zoom,
      y: offsetY + panOffset.y * zoom,
    }
  }, [containerSize, rootNode.size, zoom, panOffset])
  
  useEffect(() => {
    fontEngine.loadBrandFonts().then(() => {
      setFontsLoaded(true)
    })
  }, [])
  
  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    
    const updateSize = () => {
      setContainerSize({
        width: container.clientWidth,
        height: container.clientHeight,
      })
    }
    
    updateSize()
    
    const resizeObserver = new ResizeObserver(updateSize)
    resizeObserver.observe(container)
    
    return () => resizeObserver.disconnect()
  }, [])
  
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !fontsLoaded || containerSize.width === 0) return
    
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
    }
    
    animationFrameRef.current = requestAnimationFrame(async () => {
      const newLayoutMap = await renderScene(canvas, rootNode, {
        zoom,
        centerOffset,
        selectedNodeId,
        hoveredNodeId,
        showGrid,
      })
      
      setLayoutMap(newLayoutMap)
    })
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [rootNode, zoom, centerOffset, selectedNodeId, hoveredNodeId, showGrid, fontsLoaded, containerSize])
  
  const handleWheel = useCallback((e: React.WheelEvent<HTMLCanvasElement>) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault()
      const delta = e.deltaY > 0 ? -0.1 : 0.1
      const newZoom = Math.max(0.1, Math.min(3, zoom + delta))
      onZoomChange?.(newZoom)
    }
  }, [zoom, onZoomChange])
  
  const handleClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return
    
    const rect = canvas.getBoundingClientRect()
    const clickX = e.clientX - rect.left
    const clickY = e.clientY - rect.top
    
    const artX = (clickX - centerOffset.x) / zoom
    const artY = (clickY - centerOffset.y) / zoom
    
    const result = hitTest(rootNode, layoutMap, { x: artX, y: artY }, 1, { x: 0, y: 0 })
    
    if (result) {
      onNodeClick(result.nodeId)
    } else {
      onNodeClick(null)
    }
  }, [rootNode, layoutMap, zoom, centerOffset, onNodeClick])
  
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return
    
    const rect = canvas.getBoundingClientRect()
    const clickX = e.clientX - rect.left
    const clickY = e.clientY - rect.top
    
    const artX = (clickX - centerOffset.x) / zoom
    const artY = (clickY - centerOffset.y) / zoom
    
    const result = hitTest(rootNode, layoutMap, { x: artX, y: artY }, 1, { x: 0, y: 0 })
    
    const newHoveredId = result?.nodeId ?? null
    
    if (newHoveredId !== hoveredNodeId) {
      setHoveredNodeId(newHoveredId)
      onHover?.(newHoveredId)
    }
  }, [rootNode, layoutMap, zoom, centerOffset, hoveredNodeId, onHover])
  
  const handleMouseLeave = useCallback(() => {
    setHoveredNodeId(null)
    onHover?.(null)
  }, [onHover])
  
  return (
    <div 
      ref={containerRef}
      className="w-full h-full bg-slate-100 overflow-hidden relative"
    >
      <canvas
        ref={canvasRef}
        className={cn(
          'w-full h-full cursor-crosshair',
          '[image-rendering:crisp-edges]'
        )}
        onClick={handleClick}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onWheel={handleWheel}
      />
      
      {!fontsLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-100">
          <div className="text-slate-400 text-sm">Carregando fontes...</div>
        </div>
      )}
    </div>
  )
}

export default CanvasRenderer
