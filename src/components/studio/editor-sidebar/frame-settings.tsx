'use client'

import { useState, useCallback } from 'react'
import {
  LayoutGrid,
  ArrowRight,
  ArrowDown,
  AlignStartVertical,
  AlignCenterVertical,
  AlignEndVertical,
  AlignStartHorizontal,
  AlignCenterHorizontal,
  AlignEndHorizontal,
} from 'lucide-react'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
import type { FrameNode, LayoutMode, Alignment, UserRole } from '@/types/studio'
import { SidebarLayout, LockedLabel, ColorSelect, type BrandColor } from './components'

// ============================================
// TYPES
// ============================================

interface FrameSettingsProps {
  node: FrameNode
  userRole: UserRole
  onUpdate: (nodeId: string, updates: Partial<FrameNode>) => void
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

const GAP_OPTIONS = [
  { label: 'Nenhum', value: 0 },
  { label: 'Pequeno', value: 8 },
  { label: 'Normal', value: 16 },
  { label: 'Grande', value: 24 },
  { label: 'Extra', value: 32 },
]

const PADDING_OPTIONS = [
  { label: 'Nenhum', value: 0 },
  { label: 'Pequeno', value: 8 },
  { label: 'Normal', value: 16 },
  { label: 'Grande', value: 24 },
  { label: 'Extra', value: 32 },
]

const CORNER_RADIUS_OPTIONS = [
  { label: 'Nenhum', value: 0 },
  { label: 'Pequeno', value: 4 },
  { label: 'Normal', value: 8 },
  { label: 'Grande', value: 16 },
  { label: 'Circular', value: 9999 },
]

// ============================================
// HELPER FUNCTIONS
// ============================================

function findBrandColorByValue(value: string): BrandColor | undefined {
  return BRAND_COLORS.find(c => c.value.toLowerCase() === value.toLowerCase())
}

function rgbaToHex(color: { r: number; g: number; b: number; a: number }): string {
  const r = Math.round(color.r).toString(16).padStart(2, '0')
  const g = Math.round(color.g).toString(16).padStart(2, '0')
  const b = Math.round(color.b).toString(16).padStart(2, '0')
  return `#${r}${g}${b}`
}

// ============================================
// LAYOUT DIRECTION TABS
// ============================================

interface LayoutDirectionTabsProps {
  value: LayoutMode
  onChange: (value: LayoutMode) => void
  disabled?: boolean
}

function LayoutDirectionTabs({ value, onChange, disabled }: LayoutDirectionTabsProps) {
  return (
    <Tabs 
      value={value} 
      onValueChange={(v) => onChange(v as LayoutMode)}
      className="w-full"
    >
      <TabsList className="w-full grid grid-cols-3 bg-muted/50">
        <TabsTrigger value="HORIZONTAL" disabled={disabled} className="gap-1">
          <ArrowRight className="size-4" />
        </TabsTrigger>
        <TabsTrigger value="VERTICAL" disabled={disabled} className="gap-1">
          <ArrowDown className="size-4" />
        </TabsTrigger>
        <TabsTrigger value="NONE" disabled={disabled} className="gap-1 text-xs">
          Livre
        </TabsTrigger>
      </TabsList>
    </Tabs>
  )
}

// ============================================
// ALIGNMENT TABS (Primary Axis)
// ============================================

interface AlignmentTabsProps {
  value: Alignment
  onChange: (value: Alignment) => void
  direction: LayoutMode
  disabled?: boolean
}

function PrimaryAlignmentTabs({ value, onChange, direction, disabled }: AlignmentTabsProps) {
  const isHorizontal = direction === 'HORIZONTAL'
  
  return (
    <Tabs 
      value={value} 
      onValueChange={(v) => onChange(v as Alignment)}
      className="w-full"
    >
      <TabsList className="w-full grid grid-cols-4 bg-muted/50">
        <TabsTrigger value="START" disabled={disabled} className="gap-1">
          {isHorizontal ? <AlignStartHorizontal className="size-4" /> : <AlignStartVertical className="size-4" />}
        </TabsTrigger>
        <TabsTrigger value="CENTER" disabled={disabled} className="gap-1">
          {isHorizontal ? <AlignCenterHorizontal className="size-4" /> : <AlignCenterVertical className="size-4" />}
        </TabsTrigger>
        <TabsTrigger value="END" disabled={disabled} className="gap-1">
          {isHorizontal ? <AlignEndHorizontal className="size-4" /> : <AlignEndVertical className="size-4" />}
        </TabsTrigger>
        <TabsTrigger value="SPACE_BETWEEN" disabled={disabled} className="gap-1 text-xs">
          ⇔
        </TabsTrigger>
      </TabsList>
    </Tabs>
  )
}

function CounterAlignmentTabs({ value, onChange, direction, disabled }: AlignmentTabsProps) {
  const isHorizontal = direction === 'HORIZONTAL'
  
  return (
    <Tabs 
      value={value} 
      onValueChange={(v) => onChange(v as Alignment)}
      className="w-full"
    >
      <TabsList className="w-full grid grid-cols-3 bg-muted/50">
        <TabsTrigger value="START" disabled={disabled} className="gap-1">
          {isHorizontal ? <AlignStartVertical className="size-4" /> : <AlignStartHorizontal className="size-4" />}
        </TabsTrigger>
        <TabsTrigger value="CENTER" disabled={disabled} className="gap-1">
          {isHorizontal ? <AlignCenterVertical className="size-4" /> : <AlignCenterHorizontal className="size-4" />}
        </TabsTrigger>
        <TabsTrigger value="END" disabled={disabled} className="gap-1">
          {isHorizontal ? <AlignEndVertical className="size-4" /> : <AlignEndHorizontal className="size-4" />}
        </TabsTrigger>
      </TabsList>
    </Tabs>
  )
}

// ============================================
// MAIN FRAME SETTINGS COMPONENT
// ============================================

export function FrameSettings({ node, userRole, onUpdate, onBack }: FrameSettingsProps) {
  const isMember = userRole === 'member'
  const canEditLayout = !isMember
  const canEditStyle = !isMember
  
  // Locked controls (for demo - forcing some to show lock icon)
  const isLayoutLocked = true // Demo: locked
  const isGapLocked = false // Demo: unlocked
  const isPaddingLocked = false // Demo: unlocked
  const isColorLocked = true // Demo: locked
  const isCornerLocked = true // Demo: locked
  
  // Gap slider state
  const [gapIndex, setGapIndex] = useState(() => {
    const idx = GAP_OPTIONS.findIndex(g => g.value === node.autoLayout.gap)
    return idx >= 0 ? idx : 2 // Default to Normal
  })
  
  // Padding slider state (using top as reference for uniform padding)
  const [paddingIndex, setPaddingIndex] = useState(() => {
    const idx = PADDING_OPTIONS.findIndex(p => p.value === node.autoLayout.padding.top)
    return idx >= 0 ? idx : 2 // Default to Normal
  })
  
  // Corner radius slider state
  const [cornerIndex, setCornerIndex] = useState(() => {
    const radius = typeof node.cornerRadius === 'number' ? node.cornerRadius : node.cornerRadius.topLeft
    const idx = CORNER_RADIUS_OPTIONS.findIndex(c => c.value === radius)
    return idx >= 0 ? idx : 2 // Default to Normal
  })

  // Get current fill color
  const currentColor = node.fills[0]?.type === 'SOLID' 
    ? rgbaToHex(node.fills[0].color) 
    : '#FFFFFF'

  // Handlers
  const handleLayoutModeChange = useCallback((mode: LayoutMode) => {
    onUpdate(node.id, {
      autoLayout: {
        ...node.autoLayout,
        layoutMode: mode,
      },
    })
  }, [node.id, node.autoLayout, onUpdate])

  const handlePrimaryAlignmentChange = useCallback((alignment: Alignment) => {
    onUpdate(node.id, {
      autoLayout: {
        ...node.autoLayout,
        primaryAxisAlignment: alignment,
      },
    })
  }, [node.id, node.autoLayout, onUpdate])

  const handleCounterAlignmentChange = useCallback((alignment: Alignment) => {
    onUpdate(node.id, {
      autoLayout: {
        ...node.autoLayout,
        counterAxisAlignment: alignment,
      },
    })
  }, [node.id, node.autoLayout, onUpdate])

  const handleGapChange = useCallback((value: number) => {
    onUpdate(node.id, {
      autoLayout: {
        ...node.autoLayout,
        gap: value,
      },
    })
  }, [node.id, node.autoLayout, onUpdate])

  const handlePaddingChange = useCallback((value: number) => {
    onUpdate(node.id, {
      autoLayout: {
        ...node.autoLayout,
        padding: {
          top: value,
          right: value,
          bottom: value,
          left: value,
        },
      },
    })
  }, [node.id, node.autoLayout, onUpdate])

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

  return (
    <SidebarLayout
      title={node.name}
      badge="Frame"
      icon={<LayoutGrid className="size-5" />}
      description="Ajuste o layout, espaçamento e aparência deste container."
      onBack={onBack}
    >
      {/* Settings Accordions */}
      <Accordion type="single" collapsible>
            {/* Layout Accordion */}
            <AccordionItem value="layout" className="border-b border-border/50">
              <AccordionTrigger className="text-sm font-medium py-4 hover:no-underline">
                Layout
              </AccordionTrigger>
              <AccordionContent className="space-y-6 pb-6 pt-3">
                {/* Direção */}
                <div className={cn("grid grid-cols-2 items-center gap-4", isLayoutLocked && "opacity-30")}>
                  <LockedLabel locked={isLayoutLocked}>Direção</LockedLabel>
                  <LayoutDirectionTabs
                    value={node.autoLayout.layoutMode}
                    onChange={handleLayoutModeChange}
                    disabled={isLayoutLocked}
                  />
                </div>

                {/* Alinhamento Principal */}
                {node.autoLayout.layoutMode !== 'NONE' && (
                  <div className={cn("grid grid-cols-2 items-center gap-4", isLayoutLocked && "opacity-30")}>
                    <LockedLabel locked={isLayoutLocked}>Alinhamento</LockedLabel>
                    <PrimaryAlignmentTabs
                      value={node.autoLayout.primaryAxisAlignment}
                      onChange={handlePrimaryAlignmentChange}
                      direction={node.autoLayout.layoutMode}
                      disabled={isLayoutLocked}
                    />
                  </div>
                )}

                {/* Alinhamento Secundário */}
                {node.autoLayout.layoutMode !== 'NONE' && (
                  <div className={cn("grid grid-cols-2 items-center gap-4", isLayoutLocked && "opacity-30")}>
                    <LockedLabel locked={isLayoutLocked}>Distribuição</LockedLabel>
                    <CounterAlignmentTabs
                      value={node.autoLayout.counterAxisAlignment}
                      onChange={handleCounterAlignmentChange}
                      direction={node.autoLayout.layoutMode}
                      disabled={isLayoutLocked}
                    />
                  </div>
                )}
              </AccordionContent>
            </AccordionItem>

            {/* Espaçamento Accordion */}
            <AccordionItem value="spacing" className="border-b border-border/50">
              <AccordionTrigger className="text-sm font-medium py-4 hover:no-underline">
                Espaçamento
              </AccordionTrigger>
              <AccordionContent className="space-y-6 pb-6 pt-3 overflow-visible">
                {/* Gap */}
                <div className={cn("space-y-3", isGapLocked && "opacity-30")}>
                  <div className="grid grid-cols-2 items-center gap-4">
                    <LockedLabel locked={isGapLocked}>Entre itens</LockedLabel>
                    <Select
                      value={String(GAP_OPTIONS[gapIndex]?.value ?? node.autoLayout.gap)}
                      onValueChange={(v) => {
                        const idx = GAP_OPTIONS.findIndex(g => g.value === parseInt(v, 10))
                        if (idx >= 0) setGapIndex(idx)
                        handleGapChange(parseInt(v, 10))
                      }}
                      disabled={isGapLocked}
                    >
                      <SelectTrigger className="w-full h-10 bg-transparent border border-border">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {GAP_OPTIONS.map((gap) => (
                          <SelectItem key={gap.value} value={String(gap.value)}>
                            {gap.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="px-1">
                    <Slider
                      value={[gapIndex]}
                      onValueChange={(v) => {
                        setGapIndex(v[0])
                        handleGapChange(GAP_OPTIONS[v[0]].value)
                      }}
                      min={0}
                      max={GAP_OPTIONS.length - 1}
                      step={1}
                      disabled={isGapLocked}
                      className="w-full"
                    />
                  </div>
                </div>

                {/* Padding */}
                <div className={cn("space-y-3", isPaddingLocked && "opacity-30")}>
                  <div className="grid grid-cols-2 items-center gap-4">
                    <LockedLabel locked={isPaddingLocked}>Padding</LockedLabel>
                    <Select
                      value={String(PADDING_OPTIONS[paddingIndex]?.value ?? node.autoLayout.padding.top)}
                      onValueChange={(v) => {
                        const idx = PADDING_OPTIONS.findIndex(p => p.value === parseInt(v, 10))
                        if (idx >= 0) setPaddingIndex(idx)
                        handlePaddingChange(parseInt(v, 10))
                      }}
                      disabled={isPaddingLocked}
                    >
                      <SelectTrigger className="w-full h-10 bg-transparent border border-border">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {PADDING_OPTIONS.map((padding) => (
                          <SelectItem key={padding.value} value={String(padding.value)}>
                            {padding.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="px-1">
                    <Slider
                      value={[paddingIndex]}
                      onValueChange={(v) => {
                        setPaddingIndex(v[0])
                        handlePaddingChange(PADDING_OPTIONS[v[0]].value)
                      }}
                      min={0}
                      max={PADDING_OPTIONS.length - 1}
                      step={1}
                      disabled={isPaddingLocked}
                      className="w-full"
                    />
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Aparência Accordion */}
            <AccordionItem value="appearance" className="border-b border-border/50">
              <AccordionTrigger className="text-sm font-medium py-4 hover:no-underline">
                Aparência
              </AccordionTrigger>
              <AccordionContent className="space-y-6 pb-6 pt-3">
                {/* Cor de Fundo */}
                <div className={cn("grid grid-cols-2 items-center gap-4", isColorLocked && "opacity-30")}>
                  <LockedLabel locked={isColorLocked}>Fundo</LockedLabel>
                  <ColorSelect
                    value={currentColor}
                    colors={BRAND_COLORS}
                    onChange={handleColorChange}
                    disabled={isColorLocked}
                  />
                </div>

                {/* Corner Radius */}
                <div className={cn("space-y-3", isCornerLocked && "opacity-30")}>
                  <div className="grid grid-cols-2 items-center gap-4">
                    <LockedLabel locked={isCornerLocked}>Cantos</LockedLabel>
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
          </Accordion>
    </SidebarLayout>
  )
}
