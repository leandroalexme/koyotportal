'use client'

import { useState, useCallback } from 'react'
import {
  Image,
  Crop,
  Move,
  Sun,
  Contrast,
  Droplets,
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
import { cn } from '@/lib/utils'
import type { ImageNode, UserRole } from '@/types/studio'
import { SidebarLayout, LockedLabel } from './components'

// ============================================
// TYPES
// ============================================

interface ImageSettingsProps {
  node: ImageNode
  userRole: UserRole
  onUpdate: (nodeId: string, updates: Partial<ImageNode>) => void
  onBack?: () => void
}

// ============================================
// CONSTANTS
// ============================================

const OBJECT_FIT_OPTIONS = [
  { label: 'Preencher', value: 'FILL' },
  { label: 'Ajustar', value: 'FIT' },
  { label: 'Cortar', value: 'CROP' },
  { label: 'Repetir', value: 'TILE' },
]

const CORNER_RADIUS_OPTIONS = [
  { label: 'Nenhum', value: 0 },
  { label: 'Pequeno', value: 4 },
  { label: 'Normal', value: 8 },
  { label: 'Grande', value: 16 },
  { label: 'Circular', value: 9999 },
]

// ============================================
// MAIN IMAGE SETTINGS COMPONENT
// ============================================

export function ImageSettings({ node, userRole, onUpdate, onBack }: ImageSettingsProps) {
  const isMember = userRole === 'member'
  
  // Locked controls (for demo)
  const isImageLocked = true // Demo: locked
  const isFilterLocked = false // Demo: unlocked
  const isCornerLocked = true // Demo: locked
  
  // Filter states
  const [brightness, setBrightness] = useState(node.imageProps.filters?.brightness ?? 100)
  const [contrast, setContrast] = useState(node.imageProps.filters?.contrast ?? 100)
  const [saturation, setSaturation] = useState(node.imageProps.filters?.saturation ?? 100)
  
  // Corner radius state
  const [cornerIndex, setCornerIndex] = useState(() => {
    const radius = typeof node.cornerRadius === 'number' ? node.cornerRadius : node.cornerRadius.topLeft
    const idx = CORNER_RADIUS_OPTIONS.findIndex(c => c.value === radius)
    return idx >= 0 ? idx : 0
  })

  // Handlers
  const handleObjectFitChange = useCallback((value: string) => {
    onUpdate(node.id, {
      imageProps: {
        ...node.imageProps,
        objectFit: value as 'FILL' | 'FIT' | 'CROP' | 'TILE',
      },
    })
  }, [node.id, node.imageProps, onUpdate])

  const handleFilterChange = useCallback((filter: 'brightness' | 'contrast' | 'saturation', value: number) => {
    onUpdate(node.id, {
      imageProps: {
        ...node.imageProps,
        filters: {
          ...node.imageProps.filters,
          brightness: filter === 'brightness' ? value : brightness,
          contrast: filter === 'contrast' ? value : contrast,
          saturation: filter === 'saturation' ? value : saturation,
          blur: node.imageProps.filters?.blur ?? 0,
        },
      },
    })
  }, [node.id, node.imageProps, brightness, contrast, saturation, onUpdate])

  const handleCornerRadiusChange = useCallback((value: number) => {
    onUpdate(node.id, {
      cornerRadius: value,
    })
  }, [node.id, onUpdate])

  const handleReplaceImage = useCallback(() => {
    // TODO: Open image picker/DAM
    console.log('Replace image')
  }, [])

  return (
    <SidebarLayout
      title={node.name}
      badge="Imagem"
      icon={<Image className="size-5" />}
      description="Configure as propriedades da imagem, ajuste filtros e posicionamento."
      onBack={onBack}
    >
      {/* Image Preview */}
      <section className="space-y-3">
        <div className="aspect-video rounded-lg bg-muted overflow-hidden border">
          {node.imageProps.src ? (
            <img 
              src={node.imageProps.src} 
              alt={node.imageProps.alt}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Image className="size-8 text-muted-foreground" />
            </div>
          )}
        </div>
        <Button 
          variant="outline" 
          className="w-full"
          onClick={handleReplaceImage}
          disabled={isImageLocked}
        >
          Substituir Imagem
        </Button>
      </section>

      {/* Settings Accordions */}
      <Accordion type="single" collapsible>
        {/* Posicionamento Accordion */}
        <AccordionItem value="position" className="border-b border-border/50">
          <AccordionTrigger className="text-sm font-medium py-4 hover:no-underline">
            Posicionamento
          </AccordionTrigger>
          <AccordionContent className="space-y-6 pb-6 pt-3">
            {/* Object Fit */}
            <div className={cn("grid grid-cols-2 items-center gap-4", isImageLocked && "opacity-30")}>
              <LockedLabel locked={isImageLocked}>Ajuste</LockedLabel>
              <Select
                value={node.imageProps.objectFit}
                onValueChange={handleObjectFitChange}
                disabled={isImageLocked}
              >
                <SelectTrigger className="w-full h-10 bg-muted/50 border-0">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {OBJECT_FIT_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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

        {/* Filtros Accordion */}
        <AccordionItem value="filters" className="border-b border-border/50">
          <AccordionTrigger className="text-sm font-medium py-4 hover:no-underline">
            Filtros
          </AccordionTrigger>
          <AccordionContent className="space-y-6 pb-6 pt-3">
            {/* Brightness */}
            <div className={cn("space-y-3", isFilterLocked && "opacity-30")}>
              <div className="grid grid-cols-2 items-center gap-4">
                <LockedLabel locked={isFilterLocked}>
                  <div className="flex items-center gap-2">
                    <Sun className="size-3" />
                    Brilho
                  </div>
                </LockedLabel>
                <span className="text-sm text-muted-foreground text-right">{brightness}%</span>
              </div>
              <div className="px-1">
                <Slider
                  value={[brightness]}
                  onValueChange={(v) => {
                    setBrightness(v[0])
                    handleFilterChange('brightness', v[0])
                  }}
                  min={0}
                  max={200}
                  step={1}
                  disabled={isFilterLocked}
                  className="w-full"
                />
              </div>
            </div>

            {/* Contrast */}
            <div className={cn("space-y-3", isFilterLocked && "opacity-30")}>
              <div className="grid grid-cols-2 items-center gap-4">
                <LockedLabel locked={isFilterLocked}>
                  <div className="flex items-center gap-2">
                    <Contrast className="size-3" />
                    Contraste
                  </div>
                </LockedLabel>
                <span className="text-sm text-muted-foreground text-right">{contrast}%</span>
              </div>
              <div className="px-1">
                <Slider
                  value={[contrast]}
                  onValueChange={(v) => {
                    setContrast(v[0])
                    handleFilterChange('contrast', v[0])
                  }}
                  min={0}
                  max={200}
                  step={1}
                  disabled={isFilterLocked}
                  className="w-full"
                />
              </div>
            </div>

            {/* Saturation */}
            <div className={cn("space-y-3", isFilterLocked && "opacity-30")}>
              <div className="grid grid-cols-2 items-center gap-4">
                <LockedLabel locked={isFilterLocked}>
                  <div className="flex items-center gap-2">
                    <Droplets className="size-3" />
                    Saturação
                  </div>
                </LockedLabel>
                <span className="text-sm text-muted-foreground text-right">{saturation}%</span>
              </div>
              <div className="px-1">
                <Slider
                  value={[saturation]}
                  onValueChange={(v) => {
                    setSaturation(v[0])
                    handleFilterChange('saturation', v[0])
                  }}
                  min={0}
                  max={200}
                  step={1}
                  disabled={isFilterLocked}
                  className="w-full"
                />
              </div>
            </div>

            {/* Reset Filters */}
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full"
              onClick={() => {
                setBrightness(100)
                setContrast(100)
                setSaturation(100)
                onUpdate(node.id, {
                  imageProps: {
                    ...node.imageProps,
                    filters: { brightness: 100, contrast: 100, saturation: 100, blur: 0 },
                  },
                })
              }}
              disabled={isFilterLocked}
            >
              Resetar Filtros
            </Button>
          </AccordionContent>
        </AccordionItem>

        {/* Acessibilidade Accordion */}
        <AccordionItem value="accessibility" className="border-b border-border/50">
          <AccordionTrigger className="text-sm font-medium py-4 hover:no-underline">
            Acessibilidade
          </AccordionTrigger>
          <AccordionContent className="space-y-6 pb-6 pt-3">
            <div className="grid grid-cols-2 items-center gap-4">
              <LockedLabel locked={false}>Texto Alt</LockedLabel>
              <span className="text-sm text-muted-foreground truncate">
                {node.imageProps.alt || 'Não definido'}
              </span>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </SidebarLayout>
  )
}
