'use client'

import { useState, useCallback } from 'react'
import {
  Shapes,
  Settings2,
  Palette,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import type { RectangleNode, EllipseNode, LineNode, VectorNode as VectorNodeType, UserRole, SceneNode } from '@/types/studio'
import { SidebarLayout, LockedLabel, TransformControls, InfoAlert } from './components'

// ============================================
// TYPES
// ============================================

type VectorShapeNode = RectangleNode | EllipseNode | LineNode | VectorNodeType

interface VectorSettingsProps {
  node: VectorShapeNode
  userRole: UserRole
  onUpdate: (nodeId: string, updates: Partial<SceneNode>) => void
  onBack?: () => void
}

// ============================================
// CONSTANTS
// ============================================

const CORNER_RADIUS_OPTIONS = [
  { label: 'Nenhum', value: 0 },
  { label: 'Pequeno', value: 4 },
  { label: 'Normal', value: 8 },
  { label: 'Grande', value: 16 },
  { label: 'Extra Grande', value: 24 },
  { label: 'Circular', value: 9999 },
]

const PRESET_COLORS = [
  '#000000', '#FFFFFF', '#EF4444', '#F97316', '#EAB308', 
  '#22C55E', '#06B6D4', '#3B82F6', '#8B5CF6', '#EC4899',
  '#6B7280', '#374151', '#1F2937', '#F3F4F6', '#E5E7EB',
]

const STROKE_WIDTH_OPTIONS = [
  { label: 'Nenhum', value: 0 },
  { label: 'Fino (1px)', value: 1 },
  { label: 'Normal (2px)', value: 2 },
  { label: 'Médio (3px)', value: 3 },
  { label: 'Grosso (4px)', value: 4 },
  { label: 'Extra (6px)', value: 6 },
]

// ============================================
// COLOR PICKER COMPONENT
// ============================================

interface ColorPickerProps {
  color: string
  onChange: (color: string) => void
  disabled?: boolean
}

function ColorPicker({ color, onChange, disabled }: ColorPickerProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="w-full h-10 justify-start gap-2"
          disabled={disabled}
        >
          <div 
            className="size-5 rounded border border-border"
            style={{ backgroundColor: color || 'transparent' }}
          />
          <span className="text-sm">{color || 'Transparente'}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-3" align="start">
        <div className="space-y-3">
          <div className="grid grid-cols-5 gap-1.5">
            {PRESET_COLORS.map((c) => (
              <button
                key={c}
                className={cn(
                  "size-7 rounded border border-border hover:scale-110 transition-transform",
                  color === c && "ring-2 ring-primary ring-offset-2"
                )}
                style={{ backgroundColor: c }}
                onClick={() => onChange(c)}
              />
            ))}
          </div>
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={() => onChange('transparent')}
          >
            Transparente
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function getVectorTypeLabel(node: VectorShapeNode): string {
  switch (node.type) {
    case 'RECTANGLE': return 'Retângulo'
    case 'ELLIPSE': return 'Elipse'
    case 'LINE': return 'Linha'
    default: return 'Vetor'
  }
}

function getVectorTypeBadge(node: VectorShapeNode): string {
  switch (node.type) {
    case 'RECTANGLE': return 'Retângulo'
    case 'ELLIPSE': return 'Elipse'
    case 'LINE': return 'Linha'
    default: return 'Vetor'
  }
}

// ============================================
// MAIN VECTOR SETTINGS COMPONENT
// ============================================

export function VectorSettings({ node, userRole: _userRole, onUpdate, onBack }: VectorSettingsProps) {
  // Locked controls
  const isFillLocked = false
  const isStrokeLocked = false
  const isCornerLocked = false
  
  // Helper to convert Color object to hex string
  const colorToHex = (color: unknown): string => {
    if (!color) return 'transparent'
    if (typeof color === 'string') return color
    const c = color as { r: number; g: number; b: number; a?: number }
    if (typeof c.r === 'number' && typeof c.g === 'number' && typeof c.b === 'number') {
      const toHex = (n: number) => Math.round(n * 255).toString(16).padStart(2, '0')
      return `#${toHex(c.r)}${toHex(c.g)}${toHex(c.b)}`
    }
    return 'transparent'
  }

  // Get current fill color
  const fill = node.fills?.find(f => f.type === 'SOLID')
  const currentFillColor = fill?.type === 'SOLID' ? colorToHex(fill.color) : 'transparent'
  
  // Get current border (stroke)
  const border = node.border
  const currentStrokeColor = border?.color ? colorToHex(border.color) : 'transparent'
  const currentStrokeWidth = border?.width ?? 0
  
  // Corner radius state (only for rectangles)
  const [cornerIndex, setCornerIndex] = useState(() => {
    if (node.type !== 'RECTANGLE') return 0
    const radius = typeof node.cornerRadius === 'number' ? node.cornerRadius : (node.cornerRadius?.topLeft ?? 0)
    const idx = CORNER_RADIUS_OPTIONS.findIndex(c => c.value === radius)
    return idx >= 0 ? idx : 0
  })

  // Handlers
  const handleFillColorChange = useCallback((color: string) => {
    if (color === 'transparent') {
      onUpdate(node.id, { fills: [] })
    } else {
      onUpdate(node.id, {
        fills: [{ type: 'SOLID', color: color as unknown as import('@/types/studio').Color }],
      })
    }
  }, [node.id, onUpdate])

  const handleStrokeColorChange = useCallback((color: string) => {
    if (color === 'transparent') {
      onUpdate(node.id, { border: undefined })
    } else {
      onUpdate(node.id, {
        border: {
          color: color as unknown as import('@/types/studio').Color,
          width: currentStrokeWidth || 1,
          style: 'SOLID',
        },
      })
    }
  }, [node.id, currentStrokeWidth, onUpdate])

  const handleStrokeWidthChange = useCallback((width: number) => {
    if (width === 0) {
      onUpdate(node.id, { border: undefined })
    } else {
      onUpdate(node.id, {
        border: {
          ...node.border,
          width,
          style: 'SOLID',
          color: (currentStrokeColor !== 'transparent' ? currentStrokeColor : '#000000') as unknown as import('@/types/studio').Color,
        },
      })
    }
  }, [node.id, node.border, currentStrokeColor, onUpdate])

  const handleCornerRadiusChange = useCallback((value: number) => {
    onUpdate(node.id, { cornerRadius: value })
  }, [node.id, onUpdate])

  const handleTransformUpdate = useCallback((updates: {
    x?: number
    y?: number
    width?: number
    height?: number
    rotation?: number
    opacity?: number
  }) => {
    const nodeUpdates: Partial<VectorShapeNode> = {}
    
    if (updates.x !== undefined || updates.y !== undefined) {
      nodeUpdates.position = {
        x: updates.x ?? node.position.x,
        y: updates.y ?? node.position.y,
      }
    }
    
    if (updates.width !== undefined || updates.height !== undefined) {
      nodeUpdates.size = {
        width: updates.width ?? node.size.width,
        height: updates.height ?? node.size.height,
      }
    }
    
    if (updates.rotation !== undefined) {
      nodeUpdates.rotation = updates.rotation
    }
    
    if (updates.opacity !== undefined) {
      nodeUpdates.opacity = updates.opacity / 100
    }
    
    onUpdate(node.id, nodeUpdates)
  }, [node.id, node.position, node.size, onUpdate])

  const isRectangle = node.type === 'RECTANGLE'
  const isLine = node.type === 'LINE'

  return (
    <SidebarLayout
      title={node.name}
      badge={getVectorTypeBadge(node)}
      icon={<Shapes className="size-5" />}
      description={`Configure as propriedades do ${getVectorTypeLabel(node).toLowerCase()}, cores e transformações.`}
      onBack={onBack}
    >
      {/* Vector Preview */}
      <section className="space-y-3">
        <div className="aspect-video rounded-lg bg-muted overflow-hidden border flex items-center justify-center">
          {node.type === 'VECTOR' ? (
            // For VECTOR type, show a generic shape icon with the fill color
            <div 
              className="w-20 h-20 flex items-center justify-center"
              style={{ color: currentFillColor === 'transparent' ? '#6b7280' : currentFillColor }}
            >
              <Shapes className="w-16 h-16" style={{ fill: 'currentColor' }} />
            </div>
          ) : (
            <div 
              className={cn(
                "transition-all",
                isRectangle && "w-24 h-16",
                node.type === 'ELLIPSE' && "w-20 h-20 rounded-full",
                isLine && "w-32 h-1"
              )}
              style={{ 
                backgroundColor: currentFillColor === 'transparent' ? '#e5e7eb' : currentFillColor,
                borderRadius: isRectangle ? `${CORNER_RADIUS_OPTIONS[cornerIndex]?.value || 0}px` : undefined,
                border: currentStrokeWidth > 0 ? `${currentStrokeWidth}px solid ${currentStrokeColor}` : undefined,
              }}
            />
          )}
        </div>
      </section>

      {/* Settings Accordions */}
      <Accordion type="single" collapsible defaultValue="appearance">
        {/* Aparência Accordion */}
        <AccordionItem value="appearance" className="border-b border-border/50">
          <AccordionTrigger className="text-sm font-medium py-4 hover:no-underline">
            Aparência
          </AccordionTrigger>
          <AccordionContent className="space-y-6 pb-6 pt-3">
            {/* Fill Color */}
            {!isLine && (
              <div className={cn("space-y-2", isFillLocked && "opacity-30")}>
                <LockedLabel locked={isFillLocked}>
                  <div className="flex items-center gap-2">
                    <Palette className="size-3" />
                    Cor de Preenchimento
                  </div>
                </LockedLabel>
                <ColorPicker
                  color={currentFillColor}
                  onChange={handleFillColorChange}
                  disabled={isFillLocked}
                />
              </div>
            )}

            {/* Stroke Color */}
            <div className={cn("space-y-2", isStrokeLocked && "opacity-30")}>
              <LockedLabel locked={isStrokeLocked}>
                <div className="flex items-center gap-2">
                  <Palette className="size-3" />
                  Cor da Borda
                </div>
              </LockedLabel>
              <ColorPicker
                color={currentStrokeColor}
                onChange={handleStrokeColorChange}
                disabled={isStrokeLocked}
              />
            </div>

            {/* Stroke Width */}
            <div className={cn("space-y-3", isStrokeLocked && "opacity-30")}>
              <div className="grid grid-cols-2 items-center gap-4">
                <LockedLabel locked={isStrokeLocked}>Espessura da Borda</LockedLabel>
                <Select
                  value={String(currentStrokeWidth)}
                  onValueChange={(v) => handleStrokeWidthChange(parseInt(v, 10))}
                  disabled={isStrokeLocked}
                >
                  <SelectTrigger className="w-full h-10 bg-muted/50 border-0">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STROKE_WIDTH_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={String(option.value)}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Corner Radius - Only for Rectangles */}
        {isRectangle && (
          <AccordionItem value="corners" className="border-b border-border/50">
            <AccordionTrigger className="text-sm font-medium py-4 hover:no-underline">
              Cantos
            </AccordionTrigger>
            <AccordionContent className="space-y-6 pb-6 pt-3">
              <div className={cn("space-y-3", isCornerLocked && "opacity-30")}>
                <div className="grid grid-cols-2 items-center gap-4">
                  <LockedLabel locked={isCornerLocked}>Arredondamento</LockedLabel>
                  <Select
                    value={String(CORNER_RADIUS_OPTIONS[cornerIndex]?.value ?? 0)}
                    onValueChange={(v) => {
                      const idx = CORNER_RADIUS_OPTIONS.findIndex(c => c.value === parseInt(v, 10))
                      if (idx >= 0) setCornerIndex(idx)
                      handleCornerRadiusChange(parseInt(v, 10))
                    }}
                    disabled={isCornerLocked}
                  >
                    <SelectTrigger className="w-full h-10 bg-muted/50 border-0">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CORNER_RADIUS_OPTIONS.map((corner) => (
                        <SelectItem key={corner.value} value={String(corner.value)}>
                          {corner.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="px-1">
                  <Slider
                    value={[cornerIndex]}
                    onValueChange={(v) => {
                      setCornerIndex(v[0])
                      handleCornerRadiusChange(CORNER_RADIUS_OPTIONS[v[0]].value)
                    }}
                    min={0}
                    max={CORNER_RADIUS_OPTIONS.length - 1}
                    step={1}
                    disabled={isCornerLocked}
                    className="w-full"
                  />
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        )}

        {/* Transformação Accordion */}
        <AccordionItem value="transform" className="border-b border-border/50">
          <AccordionTrigger className="text-sm font-medium py-4 hover:no-underline">
            Transformação
          </AccordionTrigger>
          <AccordionContent className="pb-6 pt-3 overflow-visible">
            <div className="space-y-6">
              <InfoAlert icon={<Settings2 className="size-4" />}>
                Configurações avançadas de posição, dimensão e aparência do elemento.
              </InfoAlert>
              <TransformControls
                x={node.position.x}
                y={node.position.y}
                width={node.size.width}
                height={node.size.height}
                rotation={node.rotation ?? 0}
                opacity={(node.opacity ?? 1) * 100}
                locked={false}
                onUpdate={handleTransformUpdate}
              />
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </SidebarLayout>
  )
}
