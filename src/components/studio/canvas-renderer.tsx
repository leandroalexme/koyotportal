'use client'

import { useEffect, useRef, useState } from 'react'
import { CanvasEngine } from '@/lib/studio/canvas-engine'
import type { FrameNode, TemplateFonts } from '@/types/studio'

interface CanvasRendererProps {
  rootNode: FrameNode
  fonts?: TemplateFonts
  selectedNodeId: string | null
  onNodeClick: (nodeId: string | null) => void
  zoom: number
  panOffset: { x: number; y: number }
  showGrid?: boolean
  onHover?: (nodeId: string | null) => void
  onZoomChange?: (zoom: number) => void
  onPanChange?: (offset: { x: number; y: number }) => void
}

export function CanvasRenderer({
  rootNode,
  fonts,
  selectedNodeId,
  onNodeClick,
  zoom,
  panOffset,
  showGrid = false,
  onZoomChange,
  onPanChange,
}: CanvasRendererProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const engineRef = useRef<CanvasEngine | null>(null)
  const [isReady, setIsReady] = useState(false)
  
  // Initialize engine once
  useEffect(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container) return
    
    // Prevent creating duplicate engines (React StrictMode double-mount)
    if (engineRef.current) {
      // Engine already exists, skipping creation
      return
    }
    
    // Create engine
    const engine = new CanvasEngine({
      canvas,
      container,
      rootNode,
      fonts,
      onZoomChange,
      onPanChange,
      onNodeClick,
    })
    
    engineRef.current = engine
    setIsReady(true)
    
    return () => {
      engine.destroy()
      engineRef.current = null
      setIsReady(false)
    }
  // Only run once on mount - callbacks are stored in engine
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  
  // Sync rootNode changes
  useEffect(() => {
    if (isReady) {
      engineRef.current?.setRootNode(rootNode)
    }
  }, [rootNode, isReady])
  
  // Sync selectedNodeId changes
  useEffect(() => {
    if (isReady) {
      engineRef.current?.setSelectedNodeId(selectedNodeId)
    }
  }, [selectedNodeId, isReady])
  
  // Sync showGrid changes
  useEffect(() => {
    if (isReady) {
      engineRef.current?.setShowGrid(showGrid)
    }
  }, [showGrid, isReady])
  
  // Sync zoom from parent (for external controls like toolbar)
  useEffect(() => {
    if (!isReady) return
    const engine = engineRef.current
    if (engine && Math.abs(engine.getZoom() - zoom) > 0.001) {
      engine.setZoom(zoom)
    }
  }, [zoom, isReady])
  
  // Sync panOffset from parent (for external controls)
  useEffect(() => {
    if (!isReady) return
    const engine = engineRef.current
    if (engine) {
      const currentPan = engine.getPanOffset()
      if (currentPan.x !== panOffset.x || currentPan.y !== panOffset.y) {
        engine.setPanOffset(panOffset)
      }
    }
  }, [panOffset, isReady])
  
  return (
    <div 
      ref={containerRef}
      className="w-full h-full overflow-hidden relative select-none"
      style={{ backgroundColor: '#d4d4d8' }}
    >
      <canvas
        ref={canvasRef}
        className="w-full h-full [image-rendering:crisp-edges]"
      />
      
      {!isReady && (
        <div 
          className="absolute inset-0 flex items-center justify-center"
          style={{ backgroundColor: '#d4d4d8' }}
        >
          <div className="text-zinc-500 text-sm">Carregando...</div>
        </div>
      )}
    </div>
  )
}

export default CanvasRenderer
