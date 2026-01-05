'use client'

import { useState, useCallback } from 'react'
import {
  Hexagon,
  Image,
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
import type { ImageNode, UserRole } from '@/types/studio'
import { SidebarLayout, LockedLabel } from './components'

// ============================================
// TYPES
// ============================================

interface LogoSettingsProps {
  node: ImageNode
  userRole: UserRole
  onUpdate: (nodeId: string, updates: Partial<ImageNode>) => void
  onBack?: () => void
}

// ============================================
// CONSTANTS
// ============================================

const LOGO_VARIANT_OPTIONS = [
  { label: 'Principal', value: 'primary' },
  { label: 'Secundário', value: 'secondary' },
  { label: 'Monocromático', value: 'mono' },
  { label: 'Negativo', value: 'negative' },
]

const LOGO_SIZE_OPTIONS = [
  { label: 'Pequeno', value: 'sm', scale: 0.5 },
  { label: 'Médio', value: 'md', scale: 0.75 },
  { label: 'Grande', value: 'lg', scale: 1 },
  { label: 'Extra Grande', value: 'xl', scale: 1.25 },
]

const LINK_TARGET_OPTIONS = [
  { label: 'Mesma aba', value: '_self' },
  { label: 'Nova aba', value: '_blank' },
]

// ============================================
// MAIN LOGO SETTINGS COMPONENT
// ============================================

export function LogoSettings({ node, userRole, onUpdate, onBack }: LogoSettingsProps) {
  const isMember = userRole === 'member'
  
  // Locked controls (for demo)
  const isLogoLocked = true // Demo: locked (logo variant)
  const isSizeLocked = true // Demo: locked
  const isLinkLocked = false // Demo: unlocked
  
  // Local state
  const [logoVariant, setLogoVariant] = useState('primary')
  const [sizeIndex, setSizeIndex] = useState(2) // Default to Large
  const [linkUrl, setLinkUrl] = useState((node.metadata?.linkUrl as string) ?? '')
  const [linkTarget, setLinkTarget] = useState((node.metadata?.linkTarget as string) ?? '_self')

  // Handlers
  const handleLogoVariantChange = useCallback((variant: string) => {
    setLogoVariant(variant)
    // TODO: Update logo source based on variant from brand assets
  }, [])

  const handleSizeChange = useCallback((scale: number) => {
    // TODO: Update size based on scale
  }, [])

  const handleLinkChange = useCallback((url: string, target: string) => {
    onUpdate(node.id, {
      metadata: {
        ...node.metadata,
        linkUrl: url,
        linkTarget: target,
      },
    })
  }, [node.id, node.metadata, onUpdate])

  const handleReplaceLogo = useCallback(() => {
    // TODO: Open logo picker from brand assets
    console.log('Replace logo')
  }, [])

  return (
    <SidebarLayout
      title={node.name}
      badge="Logo"
      icon={<Hexagon className="size-5" />}
      description="Configure a variante, tamanho e link do logo da marca."
      onBack={onBack}
    >
      {/* Logo Preview */}
      <section className="space-y-3">
        <div className="aspect-video rounded-lg bg-muted overflow-hidden border flex items-center justify-center p-4">
          {node.imageProps.src ? (
            <img 
              src={node.imageProps.src} 
              alt={node.imageProps.alt || 'Logo'}
              className="max-w-full max-h-full object-contain"
            />
          ) : (
            <div className="flex flex-col items-center gap-2">
              <Hexagon className="size-12 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Logo não definido</span>
            </div>
          )}
        </div>
        <Button 
          variant="outline" 
          className="w-full"
          onClick={handleReplaceLogo}
          disabled={isLogoLocked}
        >
          Selecionar do Brand Guide
        </Button>
      </section>

      {/* Settings Accordions */}
      <Accordion type="single" collapsible>
        {/* Variante Accordion */}
        <AccordionItem value="variant" className="border-b border-border/50">
          <AccordionTrigger className="text-sm font-medium py-4 hover:no-underline">
            Variante
          </AccordionTrigger>
          <AccordionContent className="space-y-6 pb-6 pt-3">
            {/* Variante do Logo */}
            <div className={cn("grid grid-cols-2 items-center gap-4", isLogoLocked && "opacity-30")}>
              <LockedLabel locked={isLogoLocked}>Versão</LockedLabel>
              <Select
                value={logoVariant}
                onValueChange={handleLogoVariantChange}
                disabled={isLogoLocked}
              >
                <SelectTrigger className="w-full h-10 bg-muted/50 border-0">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LOGO_VARIANT_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Tamanho */}
            <div className={cn("space-y-3", isSizeLocked && "opacity-30")}>
              <div className="grid grid-cols-2 items-center gap-4">
                <LockedLabel locked={isSizeLocked}>Tamanho</LockedLabel>
                <Select
                  value={LOGO_SIZE_OPTIONS[sizeIndex]?.value ?? 'lg'}
                  onValueChange={(v) => {
                    const idx = LOGO_SIZE_OPTIONS.findIndex(s => s.value === v)
                    if (idx >= 0) {
                      setSizeIndex(idx)
                      handleSizeChange(LOGO_SIZE_OPTIONS[idx].scale)
                    }
                  }}
                  disabled={isSizeLocked}
                >
                  <SelectTrigger className="w-full h-10 bg-transparent border border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {LOGO_SIZE_OPTIONS.map((option) => (
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
                    handleSizeChange(LOGO_SIZE_OPTIONS[v[0]].scale)
                  }}
                  min={0}
                  max={LOGO_SIZE_OPTIONS.length - 1}
                  step={1}
                  disabled={isSizeLocked}
                  className="w-full"
                />
              </div>
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

        {/* Informações Accordion */}
        <AccordionItem value="info" className="border-b border-border/50">
          <AccordionTrigger className="text-sm font-medium py-4 hover:no-underline">
            Informações
          </AccordionTrigger>
          <AccordionContent className="space-y-4 pb-6 pt-3">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <span className="text-muted-foreground">Texto Alt</span>
              <span className="truncate">{node.imageProps.alt || 'Não definido'}</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <span className="text-muted-foreground">Formato</span>
              <span>SVG / PNG</span>
            </div>
            <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
              <p className="text-xs text-amber-700">
                O logo é gerenciado pelo Brand Guide. Alterações aqui afetam apenas este template.
              </p>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </SidebarLayout>
  )
}
