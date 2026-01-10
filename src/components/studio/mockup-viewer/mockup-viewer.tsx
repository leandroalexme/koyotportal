'use client'

/**
 * MockupViewer
 * 
 * Componente React para visualização de mockups com templates aplicados.
 * Suporta zoom, pan e renderização em tempo real.
 */

import { useEffect, useRef, useState, useCallback } from 'react'
import { cn } from '@/lib/utils'
import {
  MockupRenderer,
  type MockupDefinition,
  type TemplateSnapshot,
} from '@/lib/studio/mockups'
import { ZoomIn, ZoomOut, RotateCcw, Loader2, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface MockupViewerProps {
  /** Definição do mockup a ser renderizado */
  definition: MockupDefinition
  /** Snapshots dos templates para cada área de inserção */
  templateSnapshots?: Map<number, TemplateSnapshot>
  /** Classe CSS adicional */
  className?: string
  /** Callback quando mockup é renderizado */
  onRender?: (renderTimeMs: number) => void
  /** Mostrar controles de zoom/pan */
  showControls?: boolean
  /** Permitir interação (zoom/pan) */
  interactive?: boolean
  /** Callback para download */
  onDownload?: (blob: Blob) => void
}

export function MockupViewer({
  definition,
  templateSnapshots = new Map(),
  className,
  onRender,
  showControls = true,
  interactive = true,
  onDownload,
}: MockupViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rendererRef = useRef<MockupRenderer | null>(null)
  
  const [isLoading, setIsLoading] = useState(true)
  const [backend, setBackend] = useState<'canvaskit' | 'canvas2d'>('canvas2d')
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [isPanning, setIsPanning] = useState(false)
  const [lastMousePos, setLastMousePos] = useState({ x: 0, y: 0 })
  const [renderTime, setRenderTime] = useState(0)
  
  // Inicializar renderer
  useEffect(() => {
    const renderer = new MockupRenderer({
      preferCanvasKit: true,
      onReady: (b) => {
        setBackend(b)
        setIsLoading(false)
      },
    })
    
    rendererRef.current = renderer
    
    return () => {
      renderer.destroy()
    }
  }, [])
  
  // Renderizar mockup quando dependências mudarem
  useEffect(() => {
    const renderer = rendererRef.current
    if (!renderer || isLoading || !canvasRef.current) return
    
    const doRender = async () => {
      try {
        const result = await renderer.render(definition, templateSnapshots)
        
        // Copiar para canvas de exibição
        const displayCanvas = canvasRef.current
        if (!displayCanvas) return
        
        const ctx = displayCanvas.getContext('2d')
        if (!ctx) return
        
        // Ajustar tamanho do canvas
        const containerWidth = containerRef.current?.clientWidth ?? 800
        const containerHeight = containerRef.current?.clientHeight ?? 600
        
        displayCanvas.width = containerWidth
        displayCanvas.height = containerHeight
        
        // Calcular escala para fit
        const scaleX = containerWidth / definition.canvasSize.width
        const scaleY = containerHeight / definition.canvasSize.height
        const fitScale = Math.min(scaleX, scaleY) * 0.9
        
        const finalScale = fitScale * zoom
        const scaledWidth = definition.canvasSize.width * finalScale
        const scaledHeight = definition.canvasSize.height * finalScale
        
        const offsetX = (containerWidth - scaledWidth) / 2 + pan.x
        const offsetY = (containerHeight - scaledHeight) / 2 + pan.y
        
        // Limpar e desenhar
        ctx.fillStyle = '#1a1a1a'
        ctx.fillRect(0, 0, containerWidth, containerHeight)
        
        // Sombra
        ctx.shadowColor = 'rgba(0, 0, 0, 0.3)'
        ctx.shadowBlur = 20
        ctx.shadowOffsetX = 0
        ctx.shadowOffsetY = 4
        
        ctx.drawImage(result.canvas, offsetX, offsetY, scaledWidth, scaledHeight)
        
        ctx.shadowColor = 'transparent'
        
        setRenderTime(result.renderTimeMs)
        onRender?.(result.renderTimeMs)
      } catch (error) {
        console.error('[MockupViewer] Erro ao renderizar:', error)
      }
    }
    
    doRender()
  }, [definition, templateSnapshots, isLoading, zoom, pan, onRender])
  
  // Handlers de interação
  const handleWheel = useCallback((e: React.WheelEvent) => {
    if (!interactive) return
    e.preventDefault()
    
    const delta = e.deltaY > 0 ? 0.9 : 1.1
    setZoom((prev) => Math.max(0.1, Math.min(5, prev * delta)))
  }, [interactive])
  
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!interactive) return
    if (e.button === 0) { // Left click
      setIsPanning(true)
      setLastMousePos({ x: e.clientX, y: e.clientY })
    }
  }, [interactive])
  
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!interactive || !isPanning) return
    
    const dx = e.clientX - lastMousePos.x
    const dy = e.clientY - lastMousePos.y
    
    setPan((prev) => ({ x: prev.x + dx, y: prev.y + dy }))
    setLastMousePos({ x: e.clientX, y: e.clientY })
  }, [interactive, isPanning, lastMousePos])
  
  const handleMouseUp = useCallback(() => {
    setIsPanning(false)
  }, [])
  
  const handleMouseLeave = useCallback(() => {
    setIsPanning(false)
  }, [])
  
  // Controles
  const handleZoomIn = () => setZoom((prev) => Math.min(5, prev * 1.2))
  const handleZoomOut = () => setZoom((prev) => Math.max(0.1, prev / 1.2))
  const handleReset = () => {
    setZoom(1)
    setPan({ x: 0, y: 0 })
  }
  
  const handleDownload = async () => {
    const renderer = rendererRef.current
    if (!renderer || !onDownload) return
    
    try {
      const blob = await renderer.export(definition, templateSnapshots, {
        format: 'png',
        scale: 2,
      })
      onDownload(blob)
    } catch (error) {
      console.error('[MockupViewer] Erro ao exportar:', error)
    }
  }
  
  return (
    <div
      ref={containerRef}
      className={cn(
        'relative w-full h-full min-h-[400px] bg-zinc-900 rounded-lg overflow-hidden',
        interactive && 'cursor-grab',
        isPanning && 'cursor-grabbing',
        className
      )}
    >
      {/* Canvas de exibição */}
      <canvas
        ref={canvasRef}
        className="w-full h-full"
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
      />
      
      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-zinc-900/80">
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
            <span className="text-sm text-zinc-400">Carregando renderizador...</span>
          </div>
        </div>
      )}
      
      {/* Info badge */}
      <div className="absolute top-3 left-3 flex items-center gap-2">
        <span className={cn(
          'px-2 py-1 text-xs font-medium rounded',
          backend === 'canvaskit' 
            ? 'bg-green-500/20 text-green-400' 
            : 'bg-yellow-500/20 text-yellow-400'
        )}>
          {backend === 'canvaskit' ? 'GPU' : 'CPU'}
        </span>
        {renderTime > 0 && (
          <span className="px-2 py-1 text-xs text-zinc-500 bg-zinc-800 rounded">
            {renderTime.toFixed(1)}ms
          </span>
        )}
      </div>
      
      {/* Controles */}
      {showControls && !isLoading && (
        <div className="absolute bottom-3 right-3 flex items-center gap-1">
          <Button
            variant="secondary"
            size="icon"
            className="h-8 w-8 bg-zinc-800 hover:bg-zinc-700"
            onClick={handleZoomOut}
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          
          <span className="px-2 text-xs text-zinc-400 min-w-[50px] text-center">
            {Math.round(zoom * 100)}%
          </span>
          
          <Button
            variant="secondary"
            size="icon"
            className="h-8 w-8 bg-zinc-800 hover:bg-zinc-700"
            onClick={handleZoomIn}
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
          
          <Button
            variant="secondary"
            size="icon"
            className="h-8 w-8 bg-zinc-800 hover:bg-zinc-700 ml-1"
            onClick={handleReset}
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
          
          {onDownload && (
            <Button
              variant="secondary"
              size="icon"
              className="h-8 w-8 bg-zinc-800 hover:bg-zinc-700 ml-1"
              onClick={handleDownload}
            >
              <Download className="h-4 w-4" />
            </Button>
          )}
        </div>
      )}
      
      {/* Nome do mockup */}
      <div className="absolute bottom-3 left-3">
        <span className="text-xs text-zinc-500">{definition.name}</span>
      </div>
    </div>
  )
}
