'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { 
  renderScene, 
  hitTest, 
  fontEngine,
} from '@/lib/studio/render-engine'
import { type ComputedLayout } from '@/lib/studio/yoga-adapter'
import type { FrameNode } from '@/types/studio'

interface CanvasRendererProps {
  rootNode: FrameNode
  selectedNodeId: string | null
  onNodeClick: (nodeId: string | null) => void
  zoom: number
  panOffset: { x: number; y: number }
  showGrid?: boolean
  onHover?: (nodeId: string | null) => void
}

export function CanvasRenderer({
  rootNode,
  selectedNodeId,
  onNodeClick,
  zoom,
  panOffset,
  showGrid = false,
  onHover,
}: CanvasRendererProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null)
  const [layoutMap, setLayoutMap] = useState<Map<string, ComputedLayout>>(new Map())
  const [fontsLoaded, setFontsLoaded] = useState(false)
  const animationFrameRef = useRef<number | null>(null)
  
  useEffect(() => {
    fontEngine.loadBrandFonts().then(() => {
      setFontsLoaded(true)
    })
  }, [])
  
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !fontsLoaded) return
    
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
    }
    
    animationFrameRef.current = requestAnimationFrame(async () => {
      const newLayoutMap = await renderScene(canvas, rootNode, {
        zoom,
        panOffset,
        selectedNodeId,
        hoveredNodeId,
        showGrid,
        backgroundColor: '#1a1a1a',
      })
      
      setLayoutMap(newLayoutMap)
    })
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [rootNode, zoom, panOffset, selectedNodeId, hoveredNodeId, showGrid, fontsLoaded])
  
  useEffect(() => {
    const container = containerRef.current
    const canvas = canvasRef.current
    if (!container || !canvas) return
    
    const resizeObserver = new ResizeObserver(() => {
      if (fontsLoaded) {
        renderScene(canvas, rootNode, {
          zoom,
          panOffset,
          selectedNodeId,
          hoveredNodeId,
          showGrid,
          backgroundColor: '#1a1a1a',
        })
      }
    })
    
    resizeObserver.observe(container)
    
    return () => {
      resizeObserver.disconnect()
    }
  }, [rootNode, zoom, panOffset, selectedNodeId, hoveredNodeId, showGrid, fontsLoaded])
  
  const handleClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return
    
    const rect = canvas.getBoundingClientRect()
    const dpr = window.devicePixelRatio || 1
    
    const x = (e.clientX - rect.left) * dpr
    const y = (e.clientY - rect.top) * dpr
    
    const canvasX = x / dpr
    const canvasY = y / dpr
    
    const result = hitTest(rootNode, layoutMap, { x: canvasX, y: canvasY }, zoom, panOffset)
    
    if (result) {
      onNodeClick(result.nodeId)
    } else {
      onNodeClick(null)
    }
  }, [rootNode, layoutMap, zoom, panOffset, onNodeClick])
  
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return
    
    const rect = canvas.getBoundingClientRect()
    const dpr = window.devicePixelRatio || 1
    
    const x = (e.clientX - rect.left) * dpr
    const y = (e.clientY - rect.top) * dpr
    
    const canvasX = x / dpr
    const canvasY = y / dpr
    
    const result = hitTest(rootNode, layoutMap, { x: canvasX, y: canvasY }, zoom, panOffset)
    
    const newHoveredId = result?.nodeId ?? null
    
    if (newHoveredId !== hoveredNodeId) {
      setHoveredNodeId(newHoveredId)
      onHover?.(newHoveredId)
    }
  }, [rootNode, layoutMap, zoom, panOffset, hoveredNodeId, onHover])
  
  const handleMouseLeave = useCallback(() => {
    setHoveredNodeId(null)
    onHover?.(null)
  }, [onHover])
  
  return (
    <div 
      ref={containerRef}
      className="w-full h-full bg-[#1a1a1a] overflow-hidden relative"
    >
      <canvas
        ref={canvasRef}
        className="w-full h-full cursor-crosshair"
        onClick={handleClick}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{
          imageRendering: 'crisp-edges',
        }}
      />
      
      {!fontsLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#1a1a1a]">
          <div className="text-white/50 text-sm">Carregando fontes...</div>
        </div>
      )}
      
      <div className="absolute bottom-4 left-4 text-white/30 text-xs font-mono">
        {Math.round(zoom * 100)}% | {rootNode.size.width}×{rootNode.size.height}
      </div>
    </div>
  )
}

export default CanvasRenderer
