'use client'

import { useMemo, useState, useCallback } from 'react'
import {
  Palette,
  LayoutGrid,
  Undo2,
  Redo2,
  Link2,
  Image as ImageIcon,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'

import type { Template, TextNode, ImageNode, FrameNode, SceneNode } from '@/types/studio'

function ColorSwatch({ color, className }: { color: string; className?: string }) {
  return (
    <span 
      className={cn('inline-block', className)} 
      style={{ backgroundColor: color }} 
    />
  )
}

// ============================================
// TYPES
// ============================================

type SidebarSection = 'content' | 'layout'

interface EditableField {
  id: string
  nodeId: string
  name: string
  semanticLabel: string
  type: 'text' | 'image'
  content: string
  placeholder?: string
}

interface ColorScheme {
  id: string
  name: string
  colors: string[]
}

interface LayoutOption {
  id: string
  name: string
  type: 'text-image' | 'image-text' | 'text-only' | 'image-only'
}

// ============================================
// PRESET DATA (would come from brand settings)
// ============================================

const COLOR_SCHEMES: ColorScheme[] = [
  { id: 'professional', name: 'Profissional', colors: ['#E8E4F0', '#1E1B4B', '#EF4444'] },
  { id: 'vibrant', name: 'Viva', colors: ['#A855F7', '#3B82F6', '#EF4444'] },
  { id: 'minimal', name: 'Minimalista', colors: ['#FFFFFF', '#000000', '#666666'] },
  { id: 'warm', name: 'Acolhedor', colors: ['#FEF3C7', '#92400E', '#F59E0B'] },
]

const LAYOUT_OPTIONS: LayoutOption[] = [
  { id: 'text-image', name: 'Texto com imagem', type: 'text-image' },
  { id: 'image-text', name: 'Imagem com texto', type: 'image-text' },
  { id: 'text-only', name: 'Apenas texto', type: 'text-only' },
  { id: 'image-only', name: 'Apenas imagem', type: 'image-only' },
]

const CTA_OPTIONS = [
  'Saiba mais',
  'Compre agora',
  'Entre em contato',
  'Agende uma reunião',
  'Baixe grátis',
  'Inscreva-se',
]

// ============================================
// HELPER: Extract editable fields from template
// ============================================

function extractEditableFields(rootNode: FrameNode): EditableField[] {
  const fields: EditableField[] = []
  
  function inferSemanticLabel(name: string): string {
    const nameLower = name.toLowerCase()
    if (nameLower.includes('headline') || nameLower.includes('title') || nameLower.includes('título')) {
      return 'Título Principal'
    }
    if (nameLower.includes('subline') || nameLower.includes('subtitle') || nameLower.includes('apoio')) {
      return 'Texto de apoio'
    }
    if (nameLower.includes('description') || nameLower.includes('descrição') || nameLower.includes('body')) {
      return 'Descrição'
    }
    if (nameLower.includes('cta') || nameLower.includes('button') || nameLower.includes('botão')) {
      return 'Chamada para ação / CTA'
    }
    if (nameLower.includes('logo')) {
      return 'Logo'
    }
    return name
  }
  
  function traverse(node: SceneNode) {
    if (node.type === 'TEXT') {
      const textNode = node as TextNode
      if (textNode.textProps.editable) {
        fields.push({
          id: `field_${node.id}`,
          nodeId: node.id,
          name: node.name,
          semanticLabel: inferSemanticLabel(node.name),
          type: 'text',
          content: textNode.textProps.content,
          placeholder: textNode.textProps.placeholder,
        })
      }
    }
    if (node.type === 'IMAGE') {
      const imageNode = node as ImageNode
      fields.push({
        id: `field_${node.id}`,
        nodeId: node.id,
        name: node.name,
        semanticLabel: inferSemanticLabel(node.name),
        type: 'image',
        content: imageNode.imageProps.src || '',
      })
    }
    if (node.type === 'FRAME') {
      const frameNode = node as FrameNode
      frameNode.children.forEach(traverse)
    }
  }
  
  traverse(rootNode)
  return fields
}

// ============================================
// ICON SIDEBAR
// ============================================

interface IconSidebarProps {
  activeSection: SidebarSection
  onSectionChange: (section: SidebarSection) => void
  onUndo?: () => void
  onRedo?: () => void
}

function IconSidebar({ activeSection, onSectionChange, onUndo, onRedo }: IconSidebarProps) {
  const sections: { id: SidebarSection; icon: React.ReactNode; label: string }[] = [
    { id: 'content', icon: <Palette className="size-5" />, label: 'Conteúdo' },
    { id: 'layout', icon: <LayoutGrid className="size-5" />, label: 'Layout' },
  ]

  return (
    <TooltipProvider>
      <aside className="w-12 border-l bg-sidebar flex flex-col items-center py-3">
        <nav className="flex-1 flex flex-col gap-1">
          {sections.map((section) => (
            <Tooltip key={section.id}>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    'size-9 rounded-lg',
                    activeSection === section.id && 'bg-primary/10 text-primary'
                  )}
                  onClick={() => onSectionChange(section.id)}
                >
                  {section.icon}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="left">
                <p>{section.label}</p>
              </TooltipContent>
            </Tooltip>
          ))}
        </nav>
        
        <Separator className="my-2" />
        
        <div className="flex flex-col gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="size-9 rounded-lg text-muted-foreground hover:text-foreground"
                onClick={onUndo}
              >
                <Undo2 className="size-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left">
              <p>Desfazer</p>
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="size-9 rounded-lg text-muted-foreground hover:text-foreground"
                onClick={onRedo}
              >
                <Redo2 className="size-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left">
              <p>Refazer</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </aside>
    </TooltipProvider>
  )
}

// ============================================
// COLOR SCHEME SELECTOR
// ============================================

interface ColorSchemeSelectorProps {
  value: string
  onChange: (schemeId: string) => void
}

function ColorSchemeSelector({ value, onChange }: ColorSchemeSelectorProps) {
  const selectedScheme = COLOR_SCHEMES.find(s => s.id === value) || COLOR_SCHEMES[0]
  
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="h-12">
        <div className="flex items-center gap-3">
          <div className="flex">
            {selectedScheme.colors.map((color, i) => (
              <ColorSwatch
                key={i}
                color={color}
                className={cn(
                  'size-6',
                  i === 0 && 'rounded-l',
                  i === selectedScheme.colors.length - 1 && 'rounded-r'
                )}
              />
            ))}
          </div>
          <span className="text-sm">{selectedScheme.name}</span>
        </div>
      </SelectTrigger>
      <SelectContent>
        {COLOR_SCHEMES.map((scheme) => (
          <SelectItem key={scheme.id} value={scheme.id}>
            <div className="flex items-center gap-3">
              <div className="flex">
                {scheme.colors.map((color, i) => (
                  <ColorSwatch
                    key={i}
                    color={color}
                    className={cn(
                      'size-5',
                      i === 0 && 'rounded-l',
                      i === scheme.colors.length - 1 && 'rounded-r'
                    )}
                  />
                ))}
              </div>
              <span>{scheme.name}</span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

// ============================================
// LAYOUT THUMBNAIL
// ============================================

function LayoutThumbnail({ type, selected }: { type: string; selected?: boolean }) {
  return (
    <div className={cn(
      'w-full aspect-[4/3] bg-muted rounded border-2 flex overflow-hidden transition-all',
      selected ? 'border-foreground' : 'border-transparent'
    )}>
      {type === 'text-image' && (
        <>
          <div className="w-1/2 p-2 flex flex-col gap-1 justify-center">
            <div className="h-1.5 w-full bg-muted-foreground/30 rounded" />
            <div className="h-1.5 w-3/4 bg-muted-foreground/30 rounded" />
            <div className="h-1.5 w-1/2 bg-muted-foreground/30 rounded" />
          </div>
          <div className="w-1/2 bg-muted-foreground/20 flex items-center justify-center">
            <svg className="w-4 h-4 text-muted-foreground/40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="4" y1="4" x2="20" y2="20" />
              <line x1="20" y1="4" x2="4" y2="20" />
            </svg>
          </div>
        </>
      )}
      {type === 'image-text' && (
        <>
          <div className="w-1/2 bg-muted-foreground/20 flex items-center justify-center">
            <svg className="w-4 h-4 text-muted-foreground/40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="4" y1="4" x2="20" y2="20" />
              <line x1="20" y1="4" x2="4" y2="20" />
            </svg>
          </div>
          <div className="w-1/2 p-2 flex flex-col gap-1 justify-center">
            <div className="h-1.5 w-full bg-muted-foreground/30 rounded" />
            <div className="h-1.5 w-3/4 bg-muted-foreground/30 rounded" />
            <div className="h-1.5 w-1/2 bg-muted-foreground/30 rounded" />
          </div>
        </>
      )}
      {type === 'text-only' && (
        <div className="w-full p-3 flex flex-col gap-1 justify-center">
          <div className="h-1.5 w-full bg-muted-foreground/30 rounded" />
          <div className="h-1.5 w-3/4 bg-muted-foreground/30 rounded" />
          <div className="h-1.5 w-1/2 bg-muted-foreground/30 rounded" />
        </div>
      )}
      {type === 'image-only' && (
        <div className="w-full bg-muted-foreground/20 flex items-center justify-center">
          <svg className="w-6 h-6 text-muted-foreground/40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="4" y1="4" x2="20" y2="20" />
            <line x1="20" y1="4" x2="4" y2="20" />
          </svg>
        </div>
      )}
    </div>
  )
}

// ============================================
// SECTION FIELD
// ============================================

interface SectionFieldProps {
  label: string
  children: React.ReactNode
  linked?: boolean
}

function SectionField({ label, children, linked }: SectionFieldProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">{label}</Label>
        {linked && (
          <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center">
            <Link2 className="h-3 w-3 text-primary" />
          </div>
        )}
      </div>
      {children}
    </div>
  )
}

// ============================================
// CONTENT PANEL - Functional implementation
// ============================================

interface ContentPanelProps {
  fields: EditableField[]
  colorScheme: string
  onColorSchemeChange: (schemeId: string) => void
  onFieldChange: (nodeId: string, value: string) => void
}

function ContentPanel({ fields, colorScheme, onColorSchemeChange, onFieldChange }: ContentPanelProps) {
  const titleField = fields.find(f => f.semanticLabel === 'Título Principal')
  const subtitleField = fields.find(f => f.semanticLabel === 'Texto de apoio')
  const descriptionField = fields.find(f => f.semanticLabel === 'Descrição')
  const ctaField = fields.find(f => f.semanticLabel === 'Chamada para ação / CTA')
  const imageFields = fields.filter(f => f.type === 'image')
  
  return (
    <div className="space-y-5">
      {titleField && (
        <SectionField label={titleField.semanticLabel} linked>
          <Textarea
            className="min-h-[60px] resize-none text-sm"
            value={titleField.content}
            placeholder={titleField.placeholder}
            onChange={(e) => onFieldChange(titleField.nodeId, e.target.value)}
          />
        </SectionField>
      )}
      
      {subtitleField && (
        <SectionField label={subtitleField.semanticLabel} linked>
          <Textarea
            className="min-h-[60px] resize-none text-sm"
            value={subtitleField.content}
            placeholder={subtitleField.placeholder}
            onChange={(e) => onFieldChange(subtitleField.nodeId, e.target.value)}
          />
        </SectionField>
      )}
      
      {descriptionField && (
        <SectionField label={descriptionField.semanticLabel} linked>
          <Textarea
            className="min-h-[80px] resize-none text-sm"
            value={descriptionField.content}
            placeholder={descriptionField.placeholder}
            onChange={(e) => onFieldChange(descriptionField.nodeId, e.target.value)}
          />
        </SectionField>
      )}
      
      {ctaField && (
        <SectionField label={ctaField.semanticLabel} linked>
          <Select 
            value={ctaField.content} 
            onValueChange={(value) => onFieldChange(ctaField.nodeId, value)}
          >
            <SelectTrigger className="h-10">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CTA_OPTIONS.map((option) => (
                <SelectItem key={option} value={option}>{option}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </SectionField>
      )}
      
      <SectionField label="Esquema de cores" linked>
        <ColorSchemeSelector value={colorScheme} onChange={onColorSchemeChange} />
      </SectionField>
      
      {imageFields.length > 0 && (
        <SectionField label="Imagens" linked>
          <div className="space-y-3">
            {imageFields.map((field) => (
              <div key={field.id} className="border rounded-lg p-3 space-y-2">
                <div className="aspect-video bg-muted rounded-md flex items-center justify-center overflow-hidden">
                  {field.content ? (
                    <img src={field.content} alt={field.name} className="w-full h-full object-cover" />
                  ) : (
                    <ImageIcon className="h-8 w-8 text-muted-foreground/50" />
                  )}
                </div>
                <Button variant="outline" className="w-full" size="sm">
                  Trocar imagem
                </Button>
              </div>
            ))}
          </div>
        </SectionField>
      )}
    </div>
  )
}

// ============================================
// LAYOUT PANEL
// ============================================

interface LayoutPanelProps {
  selectedLayout: string
  onLayoutChange: (layoutId: string) => void
}

function LayoutPanel({ selectedLayout, onLayoutChange }: LayoutPanelProps) {
  return (
    <div className="space-y-5">
      <SectionField label="Estrutura do conteúdo" linked>
        <div className="grid grid-cols-2 gap-2">
          {LAYOUT_OPTIONS.map((layout) => (
            <button
              key={layout.id}
              className="text-left"
              onClick={() => onLayoutChange(layout.id)}
            >
              <LayoutThumbnail type={layout.type} selected={selectedLayout === layout.id} />
              <p className="text-xs mt-1.5 text-muted-foreground">{layout.name}</p>
            </button>
          ))}
        </div>
      </SectionField>
    </div>
  )
}

// ============================================
// MAIN SEMANTIC SIDEBAR
// ============================================

interface SemanticSidebarProps {
  template: Template
  onUpdateTextContent: (nodeId: string, content: string) => void
  onUndo?: () => void
  onRedo?: () => void
}

export function SemanticSidebar({ template, onUpdateTextContent, onUndo, onRedo }: SemanticSidebarProps) {
  const [activeSection, setActiveSection] = useState<SidebarSection>('content')
  const [colorScheme, setColorScheme] = useState('professional')
  const [selectedLayout, setSelectedLayout] = useState('text-image')
  
  const editableFields = useMemo(() => {
    return extractEditableFields(template.rootNode)
  }, [template.rootNode])
  
  const handleFieldChange = useCallback((nodeId: string, value: string) => {
    onUpdateTextContent(nodeId, value)
  }, [onUpdateTextContent])
  
  const titlePreview = editableFields.find(f => f.semanticLabel === 'Título Principal')?.content || template.name
  
  return (
    <div className="flex">
      <IconSidebar
        activeSection={activeSection}
        onSectionChange={setActiveSection}
        onUndo={onUndo}
        onRedo={onRedo}
      />
      
      <div className="w-72 border-l bg-background flex flex-col">
        <div className="p-4 border-b">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-base font-semibold">
              {activeSection === 'content' ? 'Conteúdo' : 'Layout'}
            </h2>
            <Badge variant="secondary" className="bg-primary/10 text-primary text-[10px] max-w-[120px] truncate">
              {titlePreview.substring(0, 18)}...
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Ajuste o texto e a aparência do material. Todas as opções seguem o padrão visual da marca.
          </p>
        </div>
        
        <ScrollArea className="flex-1">
          <div className="p-4">
            {activeSection === 'content' && (
              <ContentPanel
                fields={editableFields}
                colorScheme={colorScheme}
                onColorSchemeChange={setColorScheme}
                onFieldChange={handleFieldChange}
              />
            )}
            {activeSection === 'layout' && (
              <LayoutPanel
                selectedLayout={selectedLayout}
                onLayoutChange={setSelectedLayout}
              />
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  )
}
