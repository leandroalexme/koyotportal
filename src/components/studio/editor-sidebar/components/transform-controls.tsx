'use client'

import { useState, useCallback, useEffect } from 'react'
import { Move, Maximize2, RotateCw, FlipHorizontal, FlipVertical } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

// ============================================
// TYPES
// ============================================

interface TransformControlsProps {
  x: number
  y: number
  width: number
  height: number
  rotation?: number
  opacity?: number
  locked?: boolean
  onUpdate: (updates: {
    x?: number
    y?: number
    width?: number
    height?: number
    rotation?: number
    opacity?: number
  }) => void
}

// ============================================
// NUMBER INPUT WITH LABEL
// ============================================

interface NumberInputProps {
  label: string
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
  step?: number
  unit?: string
  disabled?: boolean
  className?: string
}

function NumberInput({ 
  label, 
  value, 
  onChange, 
  min = 0, 
  max = 9999, 
  step = 1,
  unit = 'px',
  disabled = false,
  className,
}: NumberInputProps) {
  const [localValue, setLocalValue] = useState(String(value))
  
  useEffect(() => {
    setLocalValue(String(value))
  }, [value])
  
  const handleBlur = () => {
    const num = parseFloat(localValue)
    if (!isNaN(num)) {
      onChange(Math.max(min, Math.min(max, num)))
    } else {
      setLocalValue(String(value))
    }
  }
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleBlur()
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault()
      onChange(Math.min(max, value + step))
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      onChange(Math.max(min, value - step))
    }
  }
  
  return (
    <div className={cn("space-y-1.5", className)}>
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <div className="relative">
        <Input
          type="text"
          value={localValue}
          onChange={(e) => setLocalValue(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          className="h-9 pr-8 text-sm font-mono bg-muted/50 border-0"
        />
        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
          {unit}
        </span>
      </div>
    </div>
  )
}

// ============================================
// TRANSFORM CONTROLS COMPONENT
// ============================================

export function TransformControls({
  x,
  y,
  width,
  height,
  rotation = 0,
  opacity = 100,
  locked = false,
  onUpdate,
}: TransformControlsProps) {
  const [constrainProportions, setConstrainProportions] = useState(false)
  const aspectRatio = width / height
  
  const handleWidthChange = useCallback((newWidth: number) => {
    if (constrainProportions) {
      onUpdate({ width: newWidth, height: Math.round(newWidth / aspectRatio) })
    } else {
      onUpdate({ width: newWidth })
    }
  }, [constrainProportions, aspectRatio, onUpdate])
  
  const handleHeightChange = useCallback((newHeight: number) => {
    if (constrainProportions) {
      onUpdate({ height: newHeight, width: Math.round(newHeight * aspectRatio) })
    } else {
      onUpdate({ height: newHeight })
    }
  }, [constrainProportions, aspectRatio, onUpdate])

  return (
    <div className="space-y-4">
      {/* Position */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Move className="size-4 text-muted-foreground" />
          <span className="text-sm font-medium">Posição</span>
        </div>
        <div className={cn("grid grid-cols-2 gap-3", locked && "opacity-50 pointer-events-none")}>
          <NumberInput
            label="X"
            value={Math.round(x)}
            onChange={(v) => onUpdate({ x: v })}
            disabled={locked}
          />
          <NumberInput
            label="Y"
            value={Math.round(y)}
            onChange={(v) => onUpdate({ y: v })}
            disabled={locked}
          />
        </div>
      </div>
      
      {/* Size */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Maximize2 className="size-4 text-muted-foreground" />
            <span className="text-sm font-medium">Tamanho</span>
          </div>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    "size-7",
                    constrainProportions && "bg-accent text-accent-foreground"
                  )}
                  onClick={() => setConstrainProportions(!constrainProportions)}
                  disabled={locked}
                >
                  <svg 
                    viewBox="0 0 24 24" 
                    className="size-4"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M21 3H3v18h18V3z" />
                    <path d="M9 3v18M3 9h18" />
                  </svg>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {constrainProportions ? 'Proporções travadas' : 'Travar proporções'}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <div className={cn("grid grid-cols-2 gap-3", locked && "opacity-50 pointer-events-none")}>
          <NumberInput
            label="Largura"
            value={Math.round(width)}
            onChange={handleWidthChange}
            min={1}
            disabled={locked}
          />
          <NumberInput
            label="Altura"
            value={Math.round(height)}
            onChange={handleHeightChange}
            min={1}
            disabled={locked}
          />
        </div>
      </div>
      
      {/* Rotation */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <RotateCw className="size-4 text-muted-foreground" />
          <span className="text-sm font-medium">Rotação</span>
        </div>
        <div className={cn("grid grid-cols-2 gap-3", locked && "opacity-50 pointer-events-none")}>
          <NumberInput
            label="Ângulo"
            value={Math.round(rotation)}
            onChange={(v) => onUpdate({ rotation: v })}
            min={-360}
            max={360}
            unit="°"
            disabled={locked}
          />
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Espelhar</Label>
            <div className="flex gap-1">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-9 w-9"
                      disabled={locked}
                    >
                      <FlipHorizontal className="size-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Espelhar horizontal</TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-9 w-9"
                      disabled={locked}
                    >
                      <FlipVertical className="size-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Espelhar vertical</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
        </div>
      </div>
      
      {/* Opacity */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Opacidade</span>
          <span className="text-sm text-muted-foreground">{Math.round(opacity)}%</span>
        </div>
        <Slider
          value={[opacity]}
          onValueChange={(v) => onUpdate({ opacity: v[0] })}
          min={0}
          max={100}
          step={1}
          disabled={locked}
          className={cn(locked && "opacity-50")}
        />
      </div>
    </div>
  )
}

// ============================================
// COMPACT TRANSFORM (for inline use)
// ============================================

interface CompactTransformProps {
  x: number
  y: number
  width: number
  height: number
  locked?: boolean
  onUpdate: (updates: { x?: number; y?: number; width?: number; height?: number }) => void
}

export function CompactTransform({
  x,
  y,
  width,
  height,
  locked = false,
  onUpdate,
}: CompactTransformProps) {
  return (
    <div className={cn("grid grid-cols-4 gap-2", locked && "opacity-50 pointer-events-none")}>
      <NumberInput
        label="X"
        value={Math.round(x)}
        onChange={(v) => onUpdate({ x: v })}
        disabled={locked}
      />
      <NumberInput
        label="Y"
        value={Math.round(y)}
        onChange={(v) => onUpdate({ y: v })}
        disabled={locked}
      />
      <NumberInput
        label="W"
        value={Math.round(width)}
        onChange={(v) => onUpdate({ width: v })}
        min={1}
        disabled={locked}
      />
      <NumberInput
        label="H"
        value={Math.round(height)}
        onChange={(v) => onUpdate({ height: v })}
        min={1}
        disabled={locked}
      />
    </div>
  )
}
