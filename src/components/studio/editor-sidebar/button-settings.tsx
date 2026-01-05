'use client'

import { useState, useCallback } from 'react'
import {
  MousePointer,
  Link,
  ExternalLink,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
import type { FrameNode, UserRole } from '@/types/studio'
import { SidebarLayout, LockedLabel, ColorSelect, type BrandColor } from './components'

// ============================================
// TYPES
// ============================================

interface ButtonSettingsProps {
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

const BUTTON_STYLE_OPTIONS = [
  { label: 'Preenchido', value: 'filled' },
  { label: 'Contorno', value: 'outline' },
  { label: 'Fantasma', value: 'ghost' },
]

const BUTTON_SIZE_OPTIONS = [
  { label: 'Pequeno', value: 'sm', padding: 8 },
  { label: 'Médio', value: 'md', padding: 16 },
  { label: 'Grande', value: 'lg', padding: 24 },
]

const CORNER_RADIUS_OPTIONS = [
  { label: 'Nenhum', value: 0 },
  { label: 'Pequeno', value: 4 },
  { label: 'Normal', value: 8 },
  { label: 'Grande', value: 16 },
  { label: 'Pílula', value: 9999 },
]

const LINK_TARGET_OPTIONS = [
  { label: 'Mesma aba', value: '_self' },
  { label: 'Nova aba', value: '_blank' },
]

// ============================================
// HELPER FUNCTIONS
// ============================================

function rgbaToHex(color: { r: number; g: number; b: number; a: number }): string {
  const r = Math.round(color.r).toString(16).padStart(2, '0')
  const g = Math.round(color.g).toString(16).padStart(2, '0')
  const b = Math.round(color.b).toString(16).padStart(2, '0')
  return `#${r}${g}${b}`
}

// ============================================
// MAIN BUTTON SETTINGS COMPONENT
// ============================================

export function ButtonSettings({ node, userRole, onUpdate, onBack }: ButtonSettingsProps) {
  const isMember = userRole === 'member'
  
  // Locked controls (for demo)
  const isStyleLocked = true // Demo: locked
  const isColorLocked = true // Demo: locked
  const isCornerLocked = true // Demo: locked
  const isLinkLocked = false // Demo: unlocked
  
  // Local state
  const [buttonStyle, setButtonStyle] = useState('filled')
  const [linkUrl, setLinkUrl] = useState((node.metadata?.linkUrl as string) ?? '')
  const [linkTarget, setLinkTarget] = useState((node.metadata?.linkTarget as string) ?? '_self')
  
  // Corner radius state
  const [cornerIndex, setCornerIndex] = useState(() => {
    const radius = typeof node.cornerRadius === 'number' ? node.cornerRadius : node.cornerRadius.topLeft
    const idx = CORNER_RADIUS_OPTIONS.findIndex(c => c.value === radius)
    return idx >= 0 ? idx : 2 // Default to Normal
  })

  // Size state
  const [sizeIndex, setSizeIndex] = useState(() => {
    const padding = node.autoLayout.padding.top
    const idx = BUTTON_SIZE_OPTIONS.findIndex(s => s.padding === padding)
    return idx >= 0 ? idx : 1 // Default to Medium
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

  const handleSizeChange = useCallback((padding: number) => {
    onUpdate(node.id, {
      autoLayout: {
        ...node.autoLayout,
        padding: {
          top: padding,
          right: padding * 2,
          bottom: padding,
          left: padding * 2,
        },
      },
    })
  }, [node.id, node.autoLayout, onUpdate])

  const handleLinkChange = useCallback((url: string, target: string) => {
    onUpdate(node.id, {
      metadata: {
        ...node.metadata,
        linkUrl: url,
        linkTarget: target,
      },
    })
  }, [node.id, node.metadata, onUpdate])

  return (
    <SidebarLayout
      title={node.name}
      badge="Botão"
      icon={<MousePointer className="size-5" />}
      description="Configure o estilo, cores e link do botão."
      onBack={onBack}
    >
      {/* Settings Accordions */}
      <Accordion type="single" collapsible>
        {/* Estilo Accordion */}
        <AccordionItem value="style" className="border-b border-border/50">
          <AccordionTrigger className="text-sm font-medium py-4 hover:no-underline">
            Estilo
          </AccordionTrigger>
          <AccordionContent className="space-y-6 pb-6 pt-3">
            {/* Variante */}
            <div className={cn("grid grid-cols-2 items-center gap-4", isStyleLocked && "opacity-30")}>
              <LockedLabel locked={isStyleLocked}>Variante</LockedLabel>
              <Select
                value={buttonStyle}
                onValueChange={setButtonStyle}
                disabled={isStyleLocked}
              >
                <SelectTrigger className="w-full h-10 bg-muted/50 border-0">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {BUTTON_STYLE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Tamanho */}
            <div className={cn("space-y-3", isStyleLocked && "opacity-30")}>
              <div className="grid grid-cols-2 items-center gap-4">
                <LockedLabel locked={isStyleLocked}>Tamanho</LockedLabel>
                <Select
                  value={BUTTON_SIZE_OPTIONS[sizeIndex]?.value ?? 'md'}
                  onValueChange={(v) => {
                    const idx = BUTTON_SIZE_OPTIONS.findIndex(s => s.value === v)
                    if (idx >= 0) {
                      setSizeIndex(idx)
                      handleSizeChange(BUTTON_SIZE_OPTIONS[idx].padding)
                    }
                  }}
                  disabled={isStyleLocked}
                >
                  <SelectTrigger className="w-full h-10 bg-transparent border border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {BUTTON_SIZE_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="px-1">
                <Slider
                  value={[sizeIndex]}
                  onValueChange={(v) => {
                    setSizeIndex(v[0])
                    handleSizeChange(BUTTON_SIZE_OPTIONS[v[0]].padding)
                  }}
                  min={0}
                  max={BUTTON_SIZE_OPTIONS.length - 1}
                  step={1}
                  disabled={isStyleLocked}
                  className="w-full"
                />
              </div>
            </div>

            {/* Cantos */}
            <div className={cn("space-y-3", isCornerLocked && "opacity-30")}>
              <div className="grid grid-cols-2 items-center gap-4">
                <LockedLabel locked={isCornerLocked}>Cantos</LockedLabel>
                <Select
                  value={String(CORNER_RADIUS_OPTIONS[cornerIndex]?.value ?? 8)}
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

        {/* Cores Accordion */}
        <AccordionItem value="colors" className="border-b border-border/50">
          <AccordionTrigger className="text-sm font-medium py-4 hover:no-underline">
            Cores
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
          </AccordionContent>
        </AccordionItem>

        {/* Link Accordion */}
        <AccordionItem value="link" className="border-b border-border/50">
          <AccordionTrigger className="text-sm font-medium py-4 hover:no-underline">
            <div className="flex items-center gap-2">
              <Link className="size-4" />
              Link
            </div>
          </AccordionTrigger>
          <AccordionContent className="space-y-6 pb-6 pt-3">
            {/* URL */}
            <div className={cn("space-y-2", isLinkLocked && "opacity-30")}>
              <LockedLabel locked={isLinkLocked}>URL de Destino</LockedLabel>
              <Input
                value={linkUrl}
                onChange={(e) => {
                  setLinkUrl(e.target.value)
                  handleLinkChange(e.target.value, linkTarget)
                }}
                placeholder="https://exemplo.com"
                disabled={isLinkLocked}
                className="h-10"
              />
            </div>

            {/* Target */}
            <div className={cn("grid grid-cols-2 items-center gap-4", isLinkLocked && "opacity-30")}>
              <LockedLabel locked={isLinkLocked}>Abrir em</LockedLabel>
              <Select
                value={linkTarget}
                onValueChange={(v) => {
                  setLinkTarget(v)
                  handleLinkChange(linkUrl, v)
                }}
                disabled={isLinkLocked}
              >
                <SelectTrigger className="w-full h-10 bg-muted/50 border-0">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LINK_TARGET_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex items-center gap-2">
                        {option.value === '_blank' && <ExternalLink className="size-3" />}
                        {option.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Preview Link */}
            {linkUrl && (
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full gap-2"
                onClick={() => window.open(linkUrl, '_blank')}
              >
                <ExternalLink className="size-3" />
                Testar Link
              </Button>
            )}
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </SidebarLayout>
  )
}
