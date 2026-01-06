'use client'

import { useState, useCallback, useEffect } from 'react'
import { Link2, Link2Off } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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
// CONSTANTS
// ============================================

const ROTATION_PRESETS = [
  { label: '0°', value: 0 },
  { label: '45°', value: 45 },
  { label: '90°', value: 90 },
  { label: '180°', value: 180 },
  { label: '270°', value: 270 },
]

// ============================================
// INLINE NUMBER INPUT (minimal)
// ============================================

interface InlineInputProps {
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
  step?: number
  unit?: string
  disabled?: boolean
  className?: string
}

function InlineInput({ 
  value, 
  onChange, 
  min = -9999, 
  max = 9999, 
  step = 1,
  unit = 'px',
  disabled = false,
  className,
}: InlineInputProps) {
  const [localValue, setLocalValue] = useState(String(Math.round(value)))
  
  useEffect(() => {
    setLocalValue(String(Math.round(value)))
  }, [value])
  
  const handleBlur = () => {
    const num = parseFloat(localValue)
    if (!isNaN(num)) {
      onChange(Math.max(min, Math.min(max, num)))
    } else {
      setLocalValue(String(Math.round(value)))
    }
  }
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleBlur()
      ;(e.target as HTMLInputElement).blur()
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault()
      const newVal = Math.min(max, value + step)
      onChange(newVal)
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      const newVal = Math.max(min, value - step)
      onChange(newVal)
    }
  }
  
  return (
    <div className={cn("relative", className)}>
      <Input
        type="text"
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        className="h-10 pr-8 text-sm bg-muted/50 border-0"
      />
      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
        {unit}
      </span>
    </div>
  )
}

// ============================================
// TRANSFORM CONTROLS - Following TextSettings Pattern
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
    <div className={cn("space-y-6", locked && "opacity-50 pointer-events-none")}>
      {/* Posição (X, Y) */}
      <div className="grid grid-cols-2 items-center gap-4">
        <Label className="text-sm font-normal text-muted-foreground">Posição</Label>
        <div className="grid grid-cols-2 gap-2">
          <InlineInput
            value={x}
            onChange={(v) => onUpdate({ x: v })}
            disabled={locked}
            unit="X"
          />
          <InlineInput
            value={y}
            onChange={(v) => onUpdate({ y: v })}
            disabled={locked}
            unit="Y"
          />
        </div>
      </div>

      {/* Dimensão (L x A) */}
      <div className="grid grid-cols-2 items-center gap-4">
        <div className="flex items-center gap-1">
          <Label className="text-sm font-normal text-muted-foreground">Dimensão</Label>
          <TooltipProvider delayDuration={200}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    "size-5",
                    constrainProportions && "text-primary bg-primary/10"
                  )}
                  onClick={() => setConstrainProportions(!constrainProportions)}
                  disabled={locked}
                >
                  {constrainProportions ? (
                    <Link2 className="size-3" />
                  ) : (
                    <Link2Off className="size-3 text-muted-foreground" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top" className="text-xs">
                {constrainProportions ? 'Proporções vinculadas' : 'Vincular proporções'}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <InlineInput
            value={width}
            onChange={handleWidthChange}
            min={1}
            disabled={locked}
            unit="L"
          />
          <InlineInput
            value={height}
            onChange={handleHeightChange}
            min={1}
            disabled={locked}
            unit="A"
          />
        </div>
      </div>

      {/* Rotação */}
      <div className="space-y-3">
        <div className="grid grid-cols-2 items-center gap-4">
          <Label className="text-sm font-normal text-muted-foreground">Rotação</Label>
          <Select
            value={String(rotation)}
            onValueChange={(v) => onUpdate({ rotation: parseInt(v, 10) })}
            disabled={locked}
          >
            <SelectTrigger className="w-full h-10 bg-muted/50 border-0">
              <SelectValue>{rotation}°</SelectValue>
            </SelectTrigger>
            <SelectContent>
              {ROTATION_PRESETS.map((preset) => (
                <SelectItem key={preset.value} value={String(preset.value)}>
                  {preset.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Slider
          value={[rotation]}
          onValueChange={(v) => onUpdate({ rotation: v[0] })}
          min={0}
          max={360}
          step={1}
          disabled={locked}
          className="w-full"
        />
      </div>

      {/* Opacidade */}
      <div className="space-y-3">
        <div className="grid grid-cols-2 items-center gap-4">
          <Label className="text-sm font-normal text-muted-foreground">Opacidade</Label>
          <span className="text-sm text-right">{Math.round(opacity)}%</span>
        </div>
        <Slider
          value={[opacity]}
          onValueChange={(v) => onUpdate({ opacity: v[0] })}
          min={0}
          max={100}
          step={1}
          disabled={locked}
          className="w-full"
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
      <div>
        <Label className="text-xs text-muted-foreground mb-1 block">X</Label>
        <InlineInput value={x} onChange={(v) => onUpdate({ x: v })} disabled={locked} unit="px" />
      </div>
      <div>
        <Label className="text-xs text-muted-foreground mb-1 block">Y</Label>
        <InlineInput value={y} onChange={(v) => onUpdate({ y: v })} disabled={locked} unit="px" />
      </div>
      <div>
        <Label className="text-xs text-muted-foreground mb-1 block">L</Label>
        <InlineInput value={width} onChange={(v) => onUpdate({ width: v })} min={1} disabled={locked} unit="px" />
      </div>
      <div>
        <Label className="text-xs text-muted-foreground mb-1 block">A</Label>
        <InlineInput value={height} onChange={(v) => onUpdate({ height: v })} min={1} disabled={locked} unit="px" />
      </div>
    </div>
  )
}
