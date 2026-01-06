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
  Move,
  HelpCircle,
  Settings2,
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
import { Label } from '@/components/ui/label'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import type { FrameNode, LayoutMode, Alignment, UserRole } from '@/types/studio'
import { SidebarLayout, LockedLabel, ColorSelect, TransformControls, InfoAlert, type BrandColor } from './components'

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
// LAYOUT OPTIONS - Premium Select Components
// ============================================

const DIRECTION_OPTIONS = [
  { value: 'HORIZONTAL', label: 'Horizontal', description: 'Itens lado a lado', icon: ArrowRight },
  { value: 'VERTICAL', label: 'Vertical', description: 'Itens empilhados', icon: ArrowDown },
  { value: 'NONE', label: 'Livre', description: 'Posição absoluta', icon: Move },
] as const

const ALIGNMENT_OPTIONS_HORIZONTAL = [
  { value: 'START', label: 'Início', description: 'Alinhar à esquerda', icon: AlignStartHorizontal },
  { value: 'CENTER', label: 'Centro', description: 'Centralizar horizontalmente', icon: AlignCenterHorizontal },
  { value: 'END', label: 'Fim', description: 'Alinhar à direita', icon: AlignEndHorizontal },
  { value: 'SPACE_BETWEEN', label: 'Distribuir', description: 'Espaço igual entre itens', icon: null },
] as const

const ALIGNMENT_OPTIONS_VERTICAL = [
  { value: 'START', label: 'Topo', description: 'Alinhar ao topo', icon: AlignStartVertical },
  { value: 'CENTER', label: 'Centro', description: 'Centralizar verticalmente', icon: AlignCenterVertical },
  { value: 'END', label: 'Base', description: 'Alinhar à base', icon: AlignEndVertical },
  { value: 'SPACE_BETWEEN', label: 'Distribuir', description: 'Espaço igual entre itens', icon: null },
] as const

const DISTRIBUTION_OPTIONS_HORIZONTAL = [
  { value: 'START', label: 'Topo', description: 'Alinhar itens ao topo', icon: AlignStartVertical },
  { value: 'CENTER', label: 'Centro', description: 'Centralizar itens verticalmente', icon: AlignCenterVertical },
  { value: 'END', label: 'Base', description: 'Alinhar itens à base', icon: AlignEndVertical },
] as const

const DISTRIBUTION_OPTIONS_VERTICAL = [
  { value: 'START', label: 'Esquerda', description: 'Alinhar itens à esquerda', icon: AlignStartHorizontal },
  { value: 'CENTER', label: 'Centro', description: 'Centralizar itens horizontalmente', icon: AlignCenterHorizontal },
  { value: 'END', label: 'Direita', description: 'Alinhar itens à direita', icon: AlignEndHorizontal },
] as const

// ============================================
// PREMIUM SELECT ITEM WITH ICON
// ============================================

interface SelectOptionItemProps {
  icon: React.ComponentType<{ className?: string }> | null
  label: string
  description: string
}

function SelectOptionItem({ icon: Icon, label, description }: SelectOptionItemProps) {
  return (
    <div className="flex items-center gap-3 py-1">
      <div className="flex items-center justify-center size-8 rounded-md bg-muted/50">
        {Icon ? <Icon className="size-4 text-muted-foreground" /> : <span className="text-sm">⇔</span>}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium">{label}</div>
        <div className="text-xs text-muted-foreground truncate">{description}</div>
      </div>
    </div>
  )
}

// ============================================
// SECTION LABEL WITH TOOLTIP
// ============================================

interface SectionLabelProps {
  children: React.ReactNode
  tooltip?: string
}

function SectionLabel({ children, tooltip }: SectionLabelProps) {
  return (
    <div className="flex items-center gap-1.5">
      <Label className="text-sm text-muted-foreground font-normal">{children}</Label>
      {tooltip && (
        <TooltipProvider delayDuration={200}>
          <Tooltip>
            <TooltipTrigger asChild>
              <HelpCircle className="size-3.5 text-muted-foreground/50 cursor-help" />
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-[200px]">
              <p className="text-xs">{tooltip}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </div>
  )
}

// ============================================
// MAIN FRAME SETTINGS COMPONENT
// ============================================

export function FrameSettings({ node, userRole, onUpdate, onBack }: FrameSettingsProps) {
  // Locked controls - all unlocked for testing
  const isLayoutLocked = false
  const isGapLocked = false
  const isPaddingLocked = false
  const isColorLocked = false
  const isCornerLocked = false
  
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

  const handleTransformUpdate = useCallback((updates: {
    x?: number
    y?: number
    width?: number
    height?: number
    rotation?: number
    opacity?: number
  }) => {
    const nodeUpdates: Partial<FrameNode> = {}
    
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
              <AccordionContent className="space-y-5 pb-6 pt-3">
                {/* Direção */}
                <div className={cn("space-y-2", isLayoutLocked && "opacity-30 pointer-events-none")}>
                  <SectionLabel tooltip="Define como os elementos filhos são organizados">
                    Direção
                  </SectionLabel>
                  <Select
                    value={node.autoLayout.layoutMode}
                    onValueChange={(v) => handleLayoutModeChange(v as LayoutMode)}
                    disabled={isLayoutLocked}
                  >
                    <SelectTrigger className="w-full h-11 bg-background border border-border hover:bg-muted/50 transition-colors">
                      <SelectValue>
                        {(() => {
                          const opt = DIRECTION_OPTIONS.find(o => o.value === node.autoLayout.layoutMode)
                          if (!opt) return null
                          const Icon = opt.icon
                          return (
                            <div className="flex items-center gap-2">
                              <Icon className="size-4 text-muted-foreground" />
                              <span>{opt.label}</span>
                            </div>
                          )
                        })()}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent className="w-[280px]">
                      {DIRECTION_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value} className="py-2">
                          <SelectOptionItem
                            icon={opt.icon}
                            label={opt.label}
                            description={opt.description}
                          />
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Alinhamento Principal */}
                {node.autoLayout.layoutMode !== 'NONE' && (
                  <div className={cn("space-y-2", isLayoutLocked && "opacity-30 pointer-events-none")}>
                    <SectionLabel tooltip="Define onde os elementos são posicionados no eixo principal">
                      Alinhamento
                    </SectionLabel>
                    <Select
                      value={node.autoLayout.primaryAxisAlignment}
                      onValueChange={(v) => handlePrimaryAlignmentChange(v as Alignment)}
                      disabled={isLayoutLocked}
                    >
                      <SelectTrigger className="w-full h-11 bg-background border border-border hover:bg-muted/50 transition-colors">
                        <SelectValue>
                          {(() => {
                            const options = node.autoLayout.layoutMode === 'HORIZONTAL' 
                              ? ALIGNMENT_OPTIONS_HORIZONTAL 
                              : ALIGNMENT_OPTIONS_VERTICAL
                            const opt = options.find(o => o.value === node.autoLayout.primaryAxisAlignment)
                            if (!opt) return null
                            const Icon = opt.icon
                            return (
                              <div className="flex items-center gap-2">
                                {Icon ? <Icon className="size-4 text-muted-foreground" /> : <span className="text-sm">⇔</span>}
                                <span>{opt.label}</span>
                              </div>
                            )
                          })()}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent className="w-[280px]">
                        {(node.autoLayout.layoutMode === 'HORIZONTAL' 
                          ? ALIGNMENT_OPTIONS_HORIZONTAL 
                          : ALIGNMENT_OPTIONS_VERTICAL
                        ).map((opt) => (
                          <SelectItem key={opt.value} value={opt.value} className="py-2">
                            <SelectOptionItem
                              icon={opt.icon}
                              label={opt.label}
                              description={opt.description}
                            />
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Distribuição (Alinhamento Secundário) */}
                {node.autoLayout.layoutMode !== 'NONE' && (
                  <div className={cn("space-y-2", isLayoutLocked && "opacity-30 pointer-events-none")}>
                    <SectionLabel tooltip="Define o alinhamento dos elementos no eixo perpendicular">
                      Distribuição
                    </SectionLabel>
                    <Select
                      value={node.autoLayout.counterAxisAlignment}
                      onValueChange={(v) => handleCounterAlignmentChange(v as Alignment)}
                      disabled={isLayoutLocked}
                    >
                      <SelectTrigger className="w-full h-11 bg-background border border-border hover:bg-muted/50 transition-colors">
                        <SelectValue>
                          {(() => {
                            const options = node.autoLayout.layoutMode === 'HORIZONTAL' 
                              ? DISTRIBUTION_OPTIONS_HORIZONTAL 
                              : DISTRIBUTION_OPTIONS_VERTICAL
                            const opt = options.find(o => o.value === node.autoLayout.counterAxisAlignment)
                            if (!opt) return null
                            const Icon = opt.icon
                            return (
                              <div className="flex items-center gap-2">
                                <Icon className="size-4 text-muted-foreground" />
                                <span>{opt.label}</span>
                              </div>
                            )
                          })()}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent className="w-[280px]">
                        {(node.autoLayout.layoutMode === 'HORIZONTAL' 
                          ? DISTRIBUTION_OPTIONS_HORIZONTAL 
                          : DISTRIBUTION_OPTIONS_VERTICAL
                        ).map((opt) => (
                          <SelectItem key={opt.value} value={opt.value} className="py-2">
                            <SelectOptionItem
                              icon={opt.icon}
                              label={opt.label}
                              description={opt.description}
                            />
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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

            {/* Transformação Accordion - Always at the end */}
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
                    locked={isLayoutLocked}
                    onUpdate={handleTransformUpdate}
                  />
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
    </SidebarLayout>
  )
}
