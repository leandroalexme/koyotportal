'use client'

/**
 * MockupPointEditor
 * 
 * Editor visual para definir os 4 pontos de perspectiva de um mockup.
 * Permite arrastar os pontos sobre uma imagem de fundo.
 */

import { useState, useRef, useCallback, useEffect } from 'react'
import { cn } from '@/lib/utils'
import type { Quad, Point2D } from '@/lib/studio/mockups'

interface MockupPointEditorProps {
  /** URL da imagem de fundo */
  backgroundImage: string
  /** Quad inicial (opcional) */
  initialQuad?: Quad
  /** Callback quando quad muda */
  onQuadChange?: (quad: Quad) => void
  /** Classe CSS adicional */
  className?: string
  /** Mostrar coordenadas */
  showCoordinates?: boolean
  /** Cor dos pontos */
  pointColor?: string
}

const DEFAULT_QUAD: Quad = {
  topLeft: { x: 100, y: 100 },
  topRight: { x: 400, y: 100 },
  bottomRight: { x: 400, y: 300 },
  bottomLeft: { x: 100, y: 300 },
}

type PointKey = 'topLeft' | 'topRight' | 'bottomRight' | 'bottomLeft'

const POINT_LABELS: Record<PointKey, string> = {
  topLeft: 'TL',
  topRight: 'TR',
  bottomRight: 'BR',
  bottomLeft: 'BL',
}

const POINT_COLORS: Record<PointKey, string> = {
  topLeft: '#ef4444',     // red
  topRight: '#22c55e',    // green
  bottomRight: '#3b82f6', // blue
  bottomLeft: '#f59e0b',  // amber
}

export function MockupPointEditor({
  backgroundImage,
  initialQuad,
  onQuadChange,
  className,
  showCoordinates = true,
  pointColor,
}: MockupPointEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [quad, setQuad] = useState<Quad>(initialQuad ?? DEFAULT_QUAD)
  const [draggingPoint, setDraggingPoint] = useState<PointKey | null>(null)
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 })
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 })
  const [scale, setScale] = useState(1)
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  
  // Carregar imagem e calcular escala
  useEffect(() => {
    const img = new Image()
    img.onload = () => {
      setImageSize({ width: img.naturalWidth, height: img.naturalHeight })
    }
    img.src = backgroundImage
  }, [backgroundImage])
  
  // Calcular escala quando container ou imagem mudam
  useEffect(() => {
    if (!containerRef.current || imageSize.width === 0) return
    
    const container = containerRef.current
    const rect = container.getBoundingClientRect()
    setContainerSize({ width: rect.width, height: rect.height })
    
    const scaleX = rect.width / imageSize.width
    const scaleY = rect.height / imageSize.height
    const newScale = Math.min(scaleX, scaleY, 1) * 0.95
    setScale(newScale)
    
    const scaledWidth = imageSize.width * newScale
    const scaledHeight = imageSize.height * newScale
    setOffset({
      x: (rect.width - scaledWidth) / 2,
      y: (rect.height - scaledHeight) / 2,
    })
  }, [imageSize, containerSize.width, containerSize.height])
  
  // Resize observer
  useEffect(() => {
    if (!containerRef.current) return
    
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerSize({
          width: entry.contentRect.width,
          height: entry.contentRect.height,
        })
      }
    })
    
    observer.observe(containerRef.current)
    return () => observer.disconnect()
  }, [])
  
  // Converter coordenadas de tela para imagem
  const screenToImage = useCallback((screenX: number, screenY: number): Point2D => {
    const container = containerRef.current
    if (!container) return { x: 0, y: 0 }
    
    const rect = container.getBoundingClientRect()
    const x = (screenX - rect.left - offset.x) / scale
    const y = (screenY - rect.top - offset.y) / scale
    
    return {
      x: Math.max(0, Math.min(imageSize.width, Math.round(x))),
      y: Math.max(0, Math.min(imageSize.height, Math.round(y))),
    }
  }, [offset, scale, imageSize])
  
  // Converter coordenadas de imagem para tela
  const imageToScreen = useCallback((point: Point2D): Point2D => {
    return {
      x: point.x * scale + offset.x,
      y: point.y * scale + offset.y,
    }
  }, [offset, scale])
  
  // Handlers de drag
  const handleMouseDown = useCallback((e: React.MouseEvent, pointKey: PointKey) => {
    e.preventDefault()
    e.stopPropagation()
    setDraggingPoint(pointKey)
  }, [])
  
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!draggingPoint) return
    
    const newPoint = screenToImage(e.clientX, e.clientY)
    
    setQuad((prev) => {
      const newQuad = { ...prev, [draggingPoint]: newPoint }
      onQuadChange?.(newQuad)
      return newQuad
    })
  }, [draggingPoint, screenToImage, onQuadChange])
  
  const handleMouseUp = useCallback(() => {
    setDraggingPoint(null)
  }, [])
  
  // Renderizar ponto arrastável
  const renderPoint = (pointKey: PointKey) => {
    const point = quad[pointKey]
    const screenPos = imageToScreen(point)
    const color = pointColor ?? POINT_COLORS[pointKey]
    const isDragging = draggingPoint === pointKey
    
    return (
      <div
        key={pointKey}
        className={cn(
          'absolute flex items-center justify-center cursor-grab select-none',
          isDragging && 'cursor-grabbing z-50'
        )}
        style={{
          left: screenPos.x,
          top: screenPos.y,
          transform: 'translate(-50%, -50%)',
        }}
        onMouseDown={(e) => handleMouseDown(e, pointKey)}
      >
        {/* Ponto principal */}
        <div
          className={cn(
            'w-5 h-5 rounded-full border-2 border-white shadow-lg transition-transform',
            isDragging && 'scale-125'
          )}
          style={{ backgroundColor: color }}
        />
        
        {/* Label */}
        <span
          className="absolute -top-6 text-xs font-bold px-1.5 py-0.5 rounded shadow"
          style={{ backgroundColor: color, color: 'white' }}
        >
          {POINT_LABELS[pointKey]}
        </span>
        
        {/* Coordenadas */}
        {showCoordinates && (
          <span className="absolute top-6 text-xs bg-black/70 text-white px-1 py-0.5 rounded whitespace-nowrap">
            {point.x}, {point.y}
          </span>
        )}
      </div>
    )
  }
  
  // Renderizar linhas conectando os pontos
  const renderLines = () => {
    const points = [
      imageToScreen(quad.topLeft),
      imageToScreen(quad.topRight),
      imageToScreen(quad.bottomRight),
      imageToScreen(quad.bottomLeft),
    ]
    
    const pathD = `M ${points[0].x} ${points[0].y} L ${points[1].x} ${points[1].y} L ${points[2].x} ${points[2].y} L ${points[3].x} ${points[3].y} Z`
    
    return (
      <svg className="absolute inset-0 pointer-events-none" style={{ overflow: 'visible' }}>
        {/* Área preenchida */}
        <path
          d={pathD}
          fill="rgba(59, 130, 246, 0.1)"
          stroke="rgba(59, 130, 246, 0.8)"
          strokeWidth="2"
          strokeDasharray="5,5"
        />
        
        {/* Linhas individuais com cores */}
        <line
          x1={points[0].x} y1={points[0].y}
          x2={points[1].x} y2={points[1].y}
          stroke={POINT_COLORS.topLeft}
          strokeWidth="2"
        />
        <line
          x1={points[1].x} y1={points[1].y}
          x2={points[2].x} y2={points[2].y}
          stroke={POINT_COLORS.topRight}
          strokeWidth="2"
        />
        <line
          x1={points[2].x} y1={points[2].y}
          x2={points[3].x} y2={points[3].y}
          stroke={POINT_COLORS.bottomRight}
          strokeWidth="2"
        />
        <line
          x1={points[3].x} y1={points[3].y}
          x2={points[0].x} y2={points[0].y}
          stroke={POINT_COLORS.bottomLeft}
          strokeWidth="2"
        />
      </svg>
    )
  }
  
  return (
    <div
      ref={containerRef}
      className={cn(
        'relative w-full h-full min-h-[400px] bg-zinc-900 rounded-lg overflow-hidden select-none',
        className
      )}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* Imagem de fundo */}
      {backgroundImage && (
        <img
          src={backgroundImage}
          alt="Mockup background"
          className="absolute pointer-events-none"
          style={{
            left: offset.x,
            top: offset.y,
            width: imageSize.width * scale,
            height: imageSize.height * scale,
          }}
          draggable={false}
        />
      )}
      
      {/* Linhas */}
      {renderLines()}
      
      {/* Pontos */}
      {renderPoint('topLeft')}
      {renderPoint('topRight')}
      {renderPoint('bottomRight')}
      {renderPoint('bottomLeft')}
      
      {/* Info */}
      <div className="absolute bottom-3 left-3 text-xs text-zinc-400 bg-black/50 px-2 py-1 rounded">
        Imagem: {imageSize.width} × {imageSize.height}px
      </div>
    </div>
  )
}
