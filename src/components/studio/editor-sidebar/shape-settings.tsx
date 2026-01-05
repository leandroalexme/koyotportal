'use client'

import { useState, useCallback } from 'react'
import {
  Square,
  Circle,
  Minus,
} from 'lucide-react'
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
import { cn } from '@/lib/utils'
import type { RectangleNode, EllipseNode, LineNode, UserRole } from '@/types/studio'
import { SidebarLayout, LockedLabel, ColorSelect, type BrandColor } from './components'

// ============================================
// TYPES
// ============================================

type ShapeNode = RectangleNode | EllipseNode | LineNode

interface ShapeSettingsProps {
  node: ShapeNode
  userRole: UserRole
  onUpdate: (nodeId: string, updates: Partial<ShapeNode>) => void
  onBack?: () => void
}

// ============================================
// CONSTANTS
// ============================================

const BRAND_COLORS: BrandColor[] = [
  { id: 'primary', name: 'Primária', value: '#000000' },
  { id: 'secondary', name: 'Secundária', value: '#6B7280' },
  { id: 'accent', name: 'Destaque', value: '#3B82F6' },
  { id: 'background', name: 'Fundo', value: '#FFFFFF' },
  { id: 'surface', name: 'Superfície', value: '#F3F4F6' },
]

const CORNER_RADIUS_OPTIONS = [
  { label: 'Nenhum', value: 0 },
  { label: 'Pequeno', value: 4 },
  { label: 'Normal', value: 8 },
  { label: 'Grande', value: 16 },
  { label: 'Circular', value: 9999 },
]

const BORDER_STYLE_OPTIONS = [
  { label: 'Sólido', value: 'SOLID' },
  { label: 'Tracejado', value: 'DASHED' },
  { label: 'Pontilhado', value: 'DOTTED' },
]

const BORDER_WIDTH_OPTIONS = [
  { label: 'Nenhum', value: 0 },
  { label: 'Fino', value: 1 },
  { label: 'Normal', value: 2 },
  { label: 'Grosso', value: 4 },
  { label: 'Extra', value: 8 },
]

const OPACITY_OPTIONS = [
  { label: '0%', value: 0 },
  { label: '25%', value: 0.25 },
  { label: '50%', value: 0.5 },
  { label: '75%', value: 0.75 },
  { label: '100%', value: 1 },
]

// ============================================
// HELPER FUNCTIONS
// ============================================

function getShapeIcon(type: ShapeNode['type']) {
  switch (type) {
    case 'RECTANGLE':
      return <Square className="size-5" />
    case 'ELLIPSE':
      return <Circle className="size-5" />
    case 'LINE':
      return <Minus className="size-5" />
  }
}

function getShapeBadge(type: ShapeNode['type']) {
  switch (type) {
    case 'RECTANGLE':
      return 'Retângulo'
    case 'ELLIPSE':
      return 'Elipse'
    case 'LINE':
      return 'Linha'
  }
}

function getShapeDescription(type: ShapeNode['type']) {
  switch (type) {
    case 'RECTANGLE':
      return 'Configure as propriedades do retângulo, cores e bordas.'
    case 'ELLIPSE':
      return 'Configure as propriedades da elipse, cores e bordas.'
    case 'LINE':
      return 'Configure as propriedades da linha, cor e espessura.'
  }
}

function rgbaToHex(color: { r: number; g: number; b: number; a: number }): string {
  const r = Math.round(color.r).toString(16).padStart(2, '0')
  const g = Math.round(color.g).toString(16).padStart(2, '0')
  const b = Math.round(color.b).toString(16).padStart(2, '0')
  return `#${r}${g}${b}`
}

// ============================================
// MAIN SHAPE SETTINGS COMPONENT
// ============================================

export function ShapeSettings({ node, userRole, onUpdate, onBack }: ShapeSettingsProps) {
  const isMember = userRole === 'member'
  const isLine = node.type === 'LINE'
  const isRectangle = node.type === 'RECTANGLE'
  
  // Locked controls (for demo)
  const isColorLocked = true // Demo: locked
  const isBorderLocked = true // Demo: locked
  const isCornerLocked = false // Demo: unlocked
  const isOpacityLocked = false // Demo: unlocked
  
  // Corner radius state (only for rectangles)
  const [cornerIndex, setCornerIndex] = useState(() => {
    if (isLine) return 0
    const radius = typeof node.cornerRadius === 'number' ? node.cornerRadius : node.cornerRadius.topLeft
    const idx = CORNER_RADIUS_OPTIONS.findIndex(c => c.value === radius)
    return idx >= 0 ? idx : 0
  })

  // Border width state
  const [borderWidthIndex, setBorderWidthIndex] = useState(() => {
    const width = node.border?.width ?? 0
    const idx = BORDER_WIDTH_OPTIONS.findIndex(b => b.value === width)
    return idx >= 0 ? idx : 0
  })

  // Opacity state
  const [opacityIndex, setOpacityIndex] = useState(() => {
    const idx = OPACITY_OPTIONS.findIndex(o => o.value === node.opacity)
    return idx >= 0 ? idx : 4 // Default to 100%
  })

  // Get current fill color
  const currentColor = node.fills[0]?.type === 'SOLID' 
    ? rgbaToHex(node.fills[0].color) 
    : '#000000'

  // Handlers
  const handleColorChange = useCallback((color: BrandColor) => {
    onUpdate(node.id, {
      fills: [{
        type: 'SOLID',
        color: {
          r: parseInt(color.value.slice(1, 3), 16),
          g: parseInt(color.value.slice(3, 5), 16),
          b: parseInt(color.value.slice(5, 7), 16),
          a: 1,
        },
        brandColorId: color.id,
      }],
    })
  }, [node.id, onUpdate])

  const handleCornerRadiusChange = useCallback((value: number) => {
    onUpdate(node.id, {
      cornerRadius: value,
    })
  }, [node.id, onUpdate])

  const handleBorderWidthChange = useCallback((value: number) => {
    onUpdate(node.id, {
      border: {
        ...node.border,
        width: value,
        color: node.border?.color ?? { r: 0, g: 0, b: 0, a: 1 },
        style: node.border?.style ?? 'SOLID',
      },
    })
  }, [node.id, node.border, onUpdate])

  const handleBorderStyleChange = useCallback((value: string) => {
    onUpdate(node.id, {
      border: {
        ...node.border,
        style: value as 'SOLID' | 'DASHED' | 'DOTTED',
        width: node.border?.width ?? 1,
        color: node.border?.color ?? { r: 0, g: 0, b: 0, a: 1 },
      },
    })
  }, [node.id, node.border, onUpdate])

  const handleOpacityChange = useCallback((value: number) => {
    onUpdate(node.id, {
      opacity: value,
    })
  }, [node.id, onUpdate])

  return (
    <SidebarLayout
      title={node.name}
      badge={getShapeBadge(node.type)}
      icon={getShapeIcon(node.type)}
      description={getShapeDescription(node.type)}
      onBack={onBack}
    >
      {/* Settings Accordions */}
      <Accordion type="single" collapsible>
        {/* Preenchimento Accordion */}
        <AccordionItem value="fill" className="border-b border-border/50">
          <AccordionTrigger className="text-sm font-medium py-4 hover:no-underline">
            Preenchimento
          </AccordionTrigger>
          <AccordionContent className="space-y-6 pb-6 pt-3">
            {/* Cor */}
            <div className={cn("grid grid-cols-2 items-center gap-4", isColorLocked && "opacity-30")}>
              <LockedLabel locked={isColorLocked}>Cor</LockedLabel>
              <ColorSelect
                value={currentColor}
                colors={BRAND_COLORS}
                onChange={handleColorChange}
                disabled={isColorLocked}
              />
            </div>

            {/* Opacidade */}
            <div className={cn("space-y-3", isOpacityLocked && "opacity-30")}>
              <div className="grid grid-cols-2 items-center gap-4">
                <LockedLabel locked={isOpacityLocked}>Opacidade</LockedLabel>
                <Select
                  value={String(OPACITY_OPTIONS[opacityIndex]?.value ?? 1)}
                  onValueChange={(v) => {
                    const idx = OPACITY_OPTIONS.findIndex(o => o.value === parseFloat(v))
                    if (idx >= 0) setOpacityIndex(idx)
                    handleOpacityChange(parseFloat(v))
                  }}
                  disabled={isOpacityLocked}
                >
                  <SelectTrigger className="w-full h-10 bg-transparent border border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {OPACITY_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={String(option.value)}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="px-1">
                <Slider
                  value={[opacityIndex]}
                  onValueChange={(v) => {
                    setOpacityIndex(v[0])
                    handleOpacityChange(OPACITY_OPTIONS[v[0]].value)
                  }}
                  min={0}
                  max={OPACITY_OPTIONS.length - 1}
                  step={1}
                  disabled={isOpacityLocked}
                  className="w-full"
                />
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Borda Accordion */}
        <AccordionItem value="border" className="border-b border-border/50">
          <AccordionTrigger className="text-sm font-medium py-4 hover:no-underline">
            Borda
          </AccordionTrigger>
          <AccordionContent className="space-y-6 pb-6 pt-3">
            {/* Espessura */}
            <div className={cn("space-y-3", isBorderLocked && "opacity-30")}>
              <div className="grid grid-cols-2 items-center gap-4">
                <LockedLabel locked={isBorderLocked}>Espessura</LockedLabel>
                <Select
                  value={String(BORDER_WIDTH_OPTIONS[borderWidthIndex]?.value ?? 0)}
                  onValueChange={(v) => {
                    const idx = BORDER_WIDTH_OPTIONS.findIndex(b => b.value === parseInt(v, 10))
                    if (idx >= 0) setBorderWidthIndex(idx)
                    handleBorderWidthChange(parseInt(v, 10))
                  }}
                  disabled={isBorderLocked}
                >
                  <SelectTrigger className="w-full h-10 bg-transparent border border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {BORDER_WIDTH_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={String(option.value)}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="px-1">
                <Slider
                  value={[borderWidthIndex]}
                  onValueChange={(v) => {
                    setBorderWidthIndex(v[0])
                    handleBorderWidthChange(BORDER_WIDTH_OPTIONS[v[0]].value)
                  }}
                  min={0}
                  max={BORDER_WIDTH_OPTIONS.length - 1}
                  step={1}
                  disabled={isBorderLocked}
                  className="w-full"
                />
              </div>
            </div>

            {/* Estilo */}
            <div className={cn("grid grid-cols-2 items-center gap-4", isBorderLocked && "opacity-30")}>
              <LockedLabel locked={isBorderLocked}>Estilo</LockedLabel>
              <Select
                value={node.border?.style ?? 'SOLID'}
                onValueChange={handleBorderStyleChange}
                disabled={isBorderLocked}
              >
                <SelectTrigger className="w-full h-10 bg-muted/50 border-0">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {BORDER_STYLE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Cantos Accordion (only for rectangles) */}
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
                    <SelectTrigger className="w-full h-10 bg-transparent border border-border">
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
      </Accordion>
    </SidebarLayout>
  )
}
