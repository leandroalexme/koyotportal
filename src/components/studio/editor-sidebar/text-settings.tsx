'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import {
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Sparkles,
  Type,
  Lock,
  Unlock,
  Settings2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
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
import type { TextNode, TextAlign, FontWeight, UserRole } from '@/types/studio'
import { SidebarLayout, LockedLabel, ColorSelect, TransformControls, InfoAlert, type BrandColor } from './components'
import { VariableLinkButton, VariableIndicator } from './components/variable-link'

// ============================================
// TYPES
// ============================================

interface TextSettingsProps {
  node: TextNode
  userRole: UserRole
  onUpdate: (nodeId: string, updates: Partial<TextNode>) => void
  onBack?: () => void
}

interface BrandFont {
  id: string
  name: string
  family: string
}

// ============================================
// BRAND PRESETS (would come from brand settings)
// ============================================

const BRAND_COLORS: BrandColor[] = [
  { id: 'eqi-blue', name: 'Azul EQI', value: '#1E1B4B' },
  { id: 'eqi-purple', name: 'Roxo EQI', value: '#7C3AED' },
  { id: 'white', name: 'Branco', value: '#FFFFFF' },
  { id: 'gray-100', name: 'Cinza Claro', value: '#F4F4F5' },
  { id: 'gray-500', name: 'Cinza Médio', value: '#71717A' },
  { id: 'gray-900', name: 'Cinza Escuro', value: '#18181B' },
  { id: 'black', name: 'Preto', value: '#000000' },
  { id: 'accent-red', name: 'Vermelho', value: '#EF4444' },
]

const BRAND_FONTS: BrandFont[] = [
  { id: 'eqi-sans', name: 'EQI Sans', family: 'EQI Sans' },
  { id: 'inter', name: 'Inter', family: 'Inter' },
  { id: 'poppins', name: 'Poppins', family: 'Poppins' },
]

const FONT_SIZES = [
  { label: 'Pequeno 12px', value: 12 },
  { label: 'Pequeno 14px', value: 14 },
  { label: 'Médio 16px', value: 16 },
  { label: 'Médio 18px', value: 18 },
  { label: 'Médio 20px', value: 20 },
  { label: 'Grande 24px', value: 24 },
  { label: 'Grande 28px', value: 28 },
  { label: 'Grande 32px', value: 32 },
  { label: 'XL 36px', value: 36 },
  { label: 'XL 40px', value: 40 },
  { label: 'XXL 48px', value: 48 },
  { label: 'XXL 56px', value: 56 },
  { label: 'XXL 64px', value: 64 },
  { label: 'XXL 72px', value: 72 },
]

const FONT_STYLES = [
  { label: 'Normal', value: 'normal' },
  { label: 'Itálico', value: 'italic' },
]

const LETTER_SPACINGS = [
  { label: 'Apertado', value: -0.5 },
  { label: 'Normal', value: 0 },
  { label: 'Médio', value: 0.5 },
  { label: 'Largo', value: 1 },
]

const LINE_HEIGHTS = [
  { label: 'Pequeno', value: 1.2 },
  { label: 'Normal', value: 1.5 },
  { label: 'Médio', value: 1.75 },
  { label: 'Grande', value: 2 },
]

const FONT_WEIGHTS: { label: string; value: FontWeight }[] = [
  { label: 'Thin', value: 100 },
  { label: 'Light', value: 300 },
  { label: 'Regular', value: 400 },
  { label: 'Medium', value: 500 },
  { label: 'Semibold', value: 600 },
  { label: 'Bold', value: 700 },
  { label: 'Black', value: 900 },
]

// ============================================
// HELPER: Debounce hook
// ============================================

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}

// ============================================
// HELPER: Get text color from fills
// ============================================

function getTextColor(node: TextNode): string {
  const fill = node.fills[0]
  if (fill?.type === 'SOLID') {
    const { r, g, b } = fill.color
    return `rgb(${r}, ${g}, ${b})`
  }
  return '#000000'
}

function findBrandColorByValue(value: string): BrandColor | undefined {
  const normalized = value.toLowerCase()
  return BRAND_COLORS.find(c => {
    const colorNorm = c.value.toLowerCase()
    if (colorNorm === normalized) return true
    // Check RGB match
    if (value.startsWith('rgb')) {
      const match = value.match(/(\d+),\s*(\d+),\s*(\d+)/)
      if (match) {
        const hex = `#${parseInt(match[1]).toString(16).padStart(2, '0')}${parseInt(match[2]).toString(16).padStart(2, '0')}${parseInt(match[3]).toString(16).padStart(2, '0')}`
        return hex.toLowerCase() === colorNorm
      }
    }
    return false
  })
}

// ============================================
// SECTION HEADER
// ============================================

interface SectionHeaderProps {
  label: string
  locked?: boolean
  onToggleLock?: () => void
  showLock?: boolean
}

function FieldLabel({ label, locked, onToggleLock, showLock = false }: SectionHeaderProps) {
  return (
    <div className="flex items-center gap-1.5 mb-2">
      {showLock && locked && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                className="text-muted-foreground hover:text-foreground"
                onClick={onToggleLock}
              >
                <Lock className="size-3.5 fill-current" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="top">
              <p>Campo bloqueado para membros</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
      {showLock && !locked && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                className="text-muted-foreground hover:text-foreground"
                onClick={onToggleLock}
              >
                <Unlock className="size-3.5" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="top">
              <p>Campo editável</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
      <Label className="text-sm font-normal text-muted-foreground">
        {label}
      </Label>
    </div>
  )
}


// ============================================
// ALIGNMENT TABS (using shadcn Tabs)
// ============================================

interface AlignmentTabsProps {
  value: TextAlign
  onChange: (align: TextAlign) => void
  disabled?: boolean
}

function AlignmentTabs({ value, onChange, disabled }: AlignmentTabsProps) {
  return (
    <Tabs 
      value={value} 
      onValueChange={(v) => onChange(v as TextAlign)}
      className="w-full"
    >
      <TabsList className="w-full grid grid-cols-4 bg-muted/50">
        <TabsTrigger value="LEFT" disabled={disabled} className="gap-1">
          <AlignLeft className="size-4" />
        </TabsTrigger>
        <TabsTrigger value="CENTER" disabled={disabled} className="gap-1">
          <AlignCenter className="size-4" />
        </TabsTrigger>
        <TabsTrigger value="RIGHT" disabled={disabled} className="gap-1">
          <AlignRight className="size-4" />
        </TabsTrigger>
        <TabsTrigger value="JUSTIFY" disabled={disabled} className="gap-1">
          <AlignJustify className="size-4" />
        </TabsTrigger>
      </TabsList>
    </Tabs>
  )
}

// ============================================
// MAIN TEXT SETTINGS COMPONENT
// ============================================

export function TextSettings({ node, userRole, onUpdate, onBack }: TextSettingsProps) {
  const [content, setContent] = useState(node.textProps.content)
  const [isContentLocked, setIsContentLocked] = useState(
    node.governance?.lockedProps?.includes('content') ?? false
  )
  
  const debouncedContent = useDebounce(content, 300)
  const initialContentRef = useRef(node.textProps.content)
  
  const isMember = userRole === 'member'
  const canEditContent = !isMember || !isContentLocked
  const canEditTypography = !isMember
  const canEditColor = !isMember
  
  // Locked controls - all unlocked for testing
  const isTypographyLocked = false
  const isColorLocked = false
  const isFontFamilyLocked = false
  const isSpacingLocked = false
  
  const maxChars = 100
  const charCount = content.length

  // Spacing states (synced with sliders)
  // Slider uses 0-6 range for granularity (7 steps), select uses 0-3 (4 options)
  const [letterSpacingValue, setLetterSpacingValue] = useState(2) // Default: Normal (index 1 * 2)
  const [lineHeightValue, setLineHeightValue] = useState(2) // Default: Normal (index 1 * 2)
  
  // Font size slider state
  const [fontSizeIndex, setFontSizeIndex] = useState(() => {
    const idx = FONT_SIZES.findIndex(s => s.value === node.textProps.style.fontSize)
    return idx >= 0 ? idx : 6 // Default to 32px
  })
  
  // Map slider value (0-6) to select index (0-3)
  const sliderToSelectIndex = (value: number) => Math.min(Math.round(value / 2), 3)
  // Map select index (0-3) to slider value (0-6)
  const selectIndexToSlider = (index: number) => index * 2

  // Sync local state when node content changes externally (e.g., undo/redo)
  // Note: Component is keyed by node.id, so this only handles same-node updates
  useEffect(() => {
    if (node.textProps.content !== initialContentRef.current && node.textProps.content !== content) {
      setContent(node.textProps.content)
      initialContentRef.current = node.textProps.content
    }
  }, [node.textProps.content, content])

  // Update node content when debounced value changes
  useEffect(() => {
    if (debouncedContent !== initialContentRef.current) {
      onUpdate(node.id, {
        textProps: {
          ...node.textProps,
          content: debouncedContent,
        },
      })
      initialContentRef.current = debouncedContent
    }
  }, [debouncedContent, node.id, node.textProps, onUpdate])

  const handleFontChange = useCallback((fontFamily: string) => {
    onUpdate(node.id, {
      textProps: {
        ...node.textProps,
        style: {
          ...node.textProps.style,
          fontFamily,
        },
      },
    })
  }, [node.id, node.textProps, onUpdate])

  const handleFontSizeChange = useCallback((fontSize: string) => {
    onUpdate(node.id, {
      textProps: {
        ...node.textProps,
        style: {
          ...node.textProps.style,
          fontSize: parseInt(fontSize, 10),
        },
      },
    })
  }, [node.id, node.textProps, onUpdate])

  const handleFontWeightChange = useCallback((fontWeight: string) => {
    onUpdate(node.id, {
      textProps: {
        ...node.textProps,
        style: {
          ...node.textProps.style,
          fontWeight: parseInt(fontWeight, 10) as FontWeight,
        },
      },
    })
  }, [node.id, node.textProps, onUpdate])

  const handleAlignmentChange = useCallback((textAlign: TextAlign) => {
    onUpdate(node.id, {
      textProps: {
        ...node.textProps,
        style: {
          ...node.textProps.style,
          textAlign,
        },
      },
    })
  }, [node.id, node.textProps, onUpdate])

  const handleFontStyleChange = useCallback((fontStyle: 'normal' | 'italic') => {
    onUpdate(node.id, {
      textProps: {
        ...node.textProps,
        style: {
          ...node.textProps.style,
          fontStyle,
        },
      },
    })
  }, [node.id, node.textProps, onUpdate])

  const handleColorChange = useCallback((color: BrandColor) => {
    const hexToRgb = (hex: string) => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
      return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      } : { r: 0, g: 0, b: 0 }
    }
    
    const rgb = hexToRgb(color.value)
    onUpdate(node.id, {
      fills: [{
        type: 'SOLID',
        color: { ...rgb, a: 1 },
        brandColorId: color.id,
      }],
    })
  }, [node.id, onUpdate])

  const handleLetterSpacingChange = useCallback((sliderValue: number) => {
    const spacingIndex = sliderToSelectIndex(sliderValue)
    const letterSpacing = LETTER_SPACINGS[spacingIndex]?.value ?? 0
    setLetterSpacingValue(sliderValue)
    onUpdate(node.id, {
      textProps: {
        ...node.textProps,
        style: {
          ...node.textProps.style,
          letterSpacing,
        },
      },
    })
  }, [node.id, node.textProps, onUpdate])

  const handleLineHeightChange = useCallback((sliderValue: number) => {
    const heightIndex = sliderToSelectIndex(sliderValue)
    const lineHeight = LINE_HEIGHTS[heightIndex]?.value ?? 1.5
    setLineHeightValue(sliderValue)
    onUpdate(node.id, {
      textProps: {
        ...node.textProps,
        style: {
          ...node.textProps.style,
          lineHeight,
        },
      },
    })
  }, [node.id, node.textProps, onUpdate])

  const handleRevert = useCallback(() => {
    setContent(initialContentRef.current)
    onUpdate(node.id, {
      textProps: {
        ...node.textProps,
        content: initialContentRef.current,
      },
    })
  }, [node.id, node.textProps, onUpdate])

  const handleTransformUpdate = useCallback((updates: {
    x?: number
    y?: number
    width?: number
    height?: number
    rotation?: number
    opacity?: number
  }) => {
    const nodeUpdates: Partial<TextNode> = {}
    
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

  const currentColor = getTextColor(node)

  return (
    <SidebarLayout
      title={node.name}
      badge={`text-${node.textProps.style.fontSize}px`}
      icon={<Type className="size-5" />}
      description="Edite o conteúdo e as propriedades tipográficas deste elemento de texto."
      onBack={onBack}
    >
      {/* Content Section */}
      <section>
            <div className="space-y-2">
              {/* Header with Variable Link */}
              <div className="flex items-center justify-between mb-2">
                <Label className="text-sm font-medium">Conteúdo</Label>
                <div className="flex items-center gap-1">
                  <VariableIndicator nodeId={node.id} property="textProps.content" />
                  <VariableLinkButton
                    nodeId={node.id}
                    property="textProps.content"
                    variableType="string"
                    scope="text"
                  />
                </div>
              </div>
              
              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder={node.textProps.placeholder || 'Digite o texto...'}
                disabled={!canEditContent}
                className={cn(
                  'min-h-[120px] resize-none text-sm bg-transparent border border-foreground/20 focus-visible:ring-1 focus-visible:border-foreground/40',
                  !canEditContent && 'opacity-30 cursor-not-allowed'
                )}
                maxLength={maxChars}
              />
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  {charCount}/{maxChars} caracteres
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 gap-1.5 text-sm"
                  disabled={!canEditContent}
                >
                  <Sparkles className="size-3" />
                  Sugerir com IA
                </Button>
              </div>
            </div>
          </section>

          {/* Settings Accordions */}
          <Accordion type="single" collapsible>
            {/* Fonte Accordion */}
            <AccordionItem value="fonte" className="border-b border-border/50">
              <AccordionTrigger className="text-sm font-medium py-4 hover:no-underline">
                Fonte
              </AccordionTrigger>
              <AccordionContent className="space-y-6 pb-6 pt-3">
                {/* Família */}
                <div className={cn("grid grid-cols-2 items-center gap-4", isFontFamilyLocked && "opacity-30")}>
                  <LockedLabel locked={isFontFamilyLocked}>Família</LockedLabel>
                  <Select
                    value={node.textProps.style.fontFamily}
                    onValueChange={handleFontChange}
                    disabled={isFontFamilyLocked}
                  >
                    <SelectTrigger className="w-full h-10 bg-muted/50 border-0">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {BRAND_FONTS.map((font) => (
                        <SelectItem key={font.id} value={font.family}>
                          <span style={{ fontFamily: font.family }}>{font.name} Family</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Tamanho */}
                <div className="space-y-3">
                  <div className="grid grid-cols-2 items-center gap-4">
                    <Label className="text-sm font-normal text-muted-foreground">Tamanho</Label>
                    <Select
                      value={String(FONT_SIZES[fontSizeIndex]?.value || node.textProps.style.fontSize)}
                      onValueChange={(v) => {
                        const idx = FONT_SIZES.findIndex(s => s.value === parseInt(v, 10))
                        if (idx >= 0) setFontSizeIndex(idx)
                        handleFontSizeChange(v)
                      }}
                      disabled={!canEditTypography}
                    >
                      <SelectTrigger className="w-full h-10 bg-transparent border border-border">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {FONT_SIZES.map((size) => (
                          <SelectItem key={size.value} value={String(size.value)}>
                            {size.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="px-1">
                    <Slider
                      value={[fontSizeIndex]}
                      onValueChange={(v) => {
                        setFontSizeIndex(v[0])
                        handleFontSizeChange(String(FONT_SIZES[v[0]].value))
                      }}
                      min={0}
                      max={FONT_SIZES.length - 1}
                      step={1}
                      disabled={!canEditTypography}
                      className="w-full"
                    />
                  </div>
                </div>

                {/* Espessura */}
                <div className={cn("grid grid-cols-2 items-center gap-4", isTypographyLocked && "opacity-30")}>
                  <LockedLabel locked={isTypographyLocked}>Espessura</LockedLabel>
                  <Select
                    value={String(node.textProps.style.fontWeight)}
                    onValueChange={handleFontWeightChange}
                    disabled={isTypographyLocked}
                  >
                    <SelectTrigger className="w-full h-10 bg-muted/50 border-0">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {FONT_WEIGHTS.map((weight) => (
                        <SelectItem key={weight.value} value={String(weight.value)}>
                          {weight.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Estilo */}
                <div className={cn("grid grid-cols-2 items-center gap-4", isTypographyLocked && "opacity-30")}>
                  <LockedLabel locked={isTypographyLocked}>Estilo</LockedLabel>
                  <Select
                    value={node.textProps.style.fontStyle ?? 'normal'}
                    onValueChange={(v) => handleFontStyleChange(v as 'normal' | 'italic')}
                    disabled={isTypographyLocked}
                  >
                    <SelectTrigger className="w-full h-10 bg-muted/50 border-0">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {FONT_STYLES.map((style) => (
                        <SelectItem key={style.value} value={style.value}>
                          {style.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Alinhamento */}
                <div className={cn("grid grid-cols-2 items-center gap-4", isTypographyLocked && "opacity-30")}>
                  <LockedLabel locked={isTypographyLocked}>Alinhamento</LockedLabel>
                  <AlignmentTabs
                    value={node.textProps.style.textAlign}
                    onChange={handleAlignmentChange}
                    disabled={isTypographyLocked}
                  />
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Cores Accordion */}
          <AccordionItem value="cores" className="border-b border-border/50">
            <AccordionTrigger className="text-sm font-medium py-4 hover:no-underline">
              Cores
            </AccordionTrigger>
            <AccordionContent className="space-y-6 pb-6 pt-3">
              <div className={cn("grid grid-cols-2 items-center gap-4", isColorLocked && "opacity-30")}>
                <LockedLabel locked={isColorLocked}>Cor</LockedLabel>
                <ColorSelect
                  value={currentColor}
                  colors={BRAND_COLORS}
                  onChange={handleColorChange}
                  disabled={isColorLocked}
                />
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Espaçamento Accordion */}
          <AccordionItem value="espacamento" className="border-b border-border/50">
            <AccordionTrigger className="text-sm font-medium py-4 hover:no-underline">
              Espaçamento
            </AccordionTrigger>
            <AccordionContent className="space-y-6 pb-6 pt-3 overflow-visible">
              {/* Entre letras */}
              <div className={cn("space-y-3", isSpacingLocked && "opacity-30")}>
                <div className="grid grid-cols-2 items-center gap-4">
                  <LockedLabel locked={isSpacingLocked}>Letras</LockedLabel>
                  <Select
                    value={String(sliderToSelectIndex(letterSpacingValue))}
                    onValueChange={(v) => handleLetterSpacingChange(selectIndexToSlider(parseInt(v, 10)))}
                    disabled={isSpacingLocked}
                  >
                    <SelectTrigger className="w-full h-10 bg-transparent border border-border">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {LETTER_SPACINGS.map((spacing, index) => (
                        <SelectItem key={spacing.value} value={String(index)}>
                          {spacing.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="px-1">
                  <Slider
                    value={[letterSpacingValue]}
                    onValueChange={(v) => handleLetterSpacingChange(v[0])}
                    min={0}
                    max={6}
                    step={1}
                    disabled={isSpacingLocked}
                    className="w-full"
                  />
                </div>
              </div>

              {/* Entre linhas */}
              <div className={cn("space-y-3", isSpacingLocked && "opacity-30")}>
                <div className="grid grid-cols-2 items-center gap-4">
                  <LockedLabel locked={isSpacingLocked}>Linhas</LockedLabel>
                  <Select
                    value={String(sliderToSelectIndex(lineHeightValue))}
                    onValueChange={(v) => handleLineHeightChange(selectIndexToSlider(parseInt(v, 10)))}
                    disabled={isSpacingLocked}
                  >
                    <SelectTrigger className="w-full h-10 bg-transparent border border-border">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {LINE_HEIGHTS.map((lh, index) => (
                        <SelectItem key={lh.value} value={String(index)}>
                          {lh.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="px-1">
                  <Slider
                    value={[lineHeightValue]}
                    onValueChange={(v) => handleLineHeightChange(v[0])}
                    min={0}
                    max={6}
                    step={1}
                    disabled={isSpacingLocked}
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
                  locked={!canEditTypography}
                  onUpdate={handleTransformUpdate}
                />
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
    </SidebarLayout>
  )
}
