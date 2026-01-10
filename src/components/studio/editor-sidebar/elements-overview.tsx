'use client'

import { useState, useMemo, useCallback } from 'react'
import { 
  Type, 
  Image as ImageLucide, 
  MoreHorizontal,
  ChevronDown,
  ChevronRight,
  Pencil,
  ImageIcon,
  Shapes,
  CircleDot,
  Minus,
  LayoutGrid,
} from 'lucide-react'
import NextImage from 'next/image'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { SidebarFooter } from './components'
import { useEditorStore } from '@/stores/editor-store'
import type { 
  SceneNode, 
  TextNode, 
  ImageNode, 
  FrameNode,
  RectangleNode,
  EllipseNode,
  LineNode,
} from '@/types/studio'

// ============================================
// TYPES
// ============================================

interface TextFieldItem {
  id: string
  name: string
  content: string
  fontSize: number
  node: TextNode
}

interface MediaItem {
  id: string
  name: string
  type: 'IMAGE' | 'RECTANGLE' | 'ELLIPSE' | 'LINE' | 'LOGO' | 'VECTOR'
  node: SceneNode
  src?: string
  positionY: number // For sorting by position in layout
}

// ============================================
// CONSTANTS
// ============================================

const INITIAL_VISIBLE_COUNT = 4

// ============================================
// HELPER FUNCTIONS
// ============================================

function getNodeLabel(node: SceneNode): string {
  const name = node.name.toLowerCase()
  
  // Try to extract a semantic label from the name
  if (name.includes('title') || name.includes('titulo')) return 'Título'
  if (name.includes('headline')) return 'Headline'
  if (name.includes('subhead')) return 'Subheadline'
  if (name.includes('client') || name.includes('cliente')) return 'Cliente'
  if (name.includes('date') || name.includes('data')) return 'Data'
  if (name.includes('description') || name.includes('descricao')) return 'Descrição'
  if (name.includes('label') || name.includes('rotulo')) return 'Rótulo'
  if (name.includes('value') || name.includes('valor')) return 'Valor'
  if (name.includes('footer') || name.includes('rodape')) return 'Rodapé'
  if (name.includes('header') || name.includes('cabecalho')) return 'Cabeçalho'
  if (name.includes('logo') || name.includes('marca')) return 'Logo'
  if (name.includes('button') || name.includes('btn') || name.includes('cta')) return 'Botão'
  
  // Return the original name if no semantic match
  return node.name
}

function isLogoNode(node: SceneNode): boolean {
  const name = node.name.toLowerCase()
  return name.includes('logo') || name.includes('marca') || name.includes('brand')
}

function isVectorNode(node: SceneNode): boolean {
  const name = node.name.toLowerCase()
  return name.includes('vector') || name.includes('icon') || name.includes('icone')
}

function collectTextNodes(node: SceneNode, results: TextFieldItem[] = []): TextFieldItem[] {
  if (node.type === 'TEXT') {
    const textNode = node as TextNode
    results.push({
      id: node.id,
      name: getNodeLabel(node),
      content: textNode.textProps.content,
      fontSize: textNode.textProps.style.fontSize,
      node: textNode,
    })
  }
  
  if (node.type === 'FRAME') {
    const frameNode = node as FrameNode
    for (const child of frameNode.children) {
      collectTextNodes(child, results)
    }
  }
  
  return results
}

function collectMediaNodes(node: SceneNode, results: MediaItem[] = [], parentY: number = 0): MediaItem[] {
  const nodeY = parentY + (node.position?.y || 0)
  
  if (node.type === 'IMAGE') {
    const imageNode = node as ImageNode
    const isLogo = isLogoNode(node)
    results.push({
      id: node.id,
      name: getNodeLabel(node),
      type: isLogo ? 'LOGO' : 'IMAGE',
      node: imageNode,
      src: imageNode.imageProps.src,
      positionY: nodeY,
    })
  }
  
  if (node.type === 'RECTANGLE') {
    const isVector = isVectorNode(node)
    results.push({
      id: node.id,
      name: getNodeLabel(node),
      type: isVector ? 'VECTOR' : 'RECTANGLE',
      node: node as RectangleNode,
      positionY: nodeY,
    })
  }
  
  if (node.type === 'ELLIPSE') {
    results.push({
      id: node.id,
      name: getNodeLabel(node),
      type: 'ELLIPSE',
      node: node as EllipseNode,
      positionY: nodeY,
    })
  }
  
  if (node.type === 'LINE') {
    results.push({
      id: node.id,
      name: getNodeLabel(node),
      type: 'LINE',
      node: node as LineNode,
      positionY: nodeY,
    })
  }
  
  if (node.type === 'FRAME') {
    const frameNode = node as FrameNode
    for (const child of frameNode.children) {
      collectMediaNodes(child, results, nodeY)
    }
  }
  
  // Sort by position Y (top to bottom)
  return results.sort((a, b) => a.positionY - b.positionY)
}

function getMediaIcon(type: MediaItem['type']) {
  switch (type) {
    case 'IMAGE':
      return <ImageIcon className="size-4" />
    case 'LOGO':
      return <Shapes className="size-4" />
    case 'RECTANGLE':
      return <LayoutGrid className="size-4" />
    case 'ELLIPSE':
      return <CircleDot className="size-4" />
    case 'LINE':
      return <Minus className="size-4" />
    case 'VECTOR':
      return <Shapes className="size-4" />
    default:
      return <ImageIcon className="size-4" />
  }
}

// ============================================
// TEXT FIELD ITEM COMPONENT
// ============================================

interface TextFieldItemProps {
  item: TextFieldItem
  onSelect: (id: string) => void
  onUpdate: (id: string, content: string) => void
}

function TextFieldItemComponent({ item, onSelect, onUpdate }: TextFieldItemProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [value, setValue] = useState(item.content)

  const handleBlur = () => {
    setIsEditing(false)
    if (value !== item.content) {
      onUpdate(item.id, value)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleBlur()
    }
    if (e.key === 'Escape') {
      setValue(item.content)
      setIsEditing(false)
    }
  }

  return (
    <div className="group">
      <p className="text-[11px] text-muted-foreground mb-1.5">{item.name}</p>
      <div 
        className="relative bg-muted/50 rounded-lg overflow-hidden transition-colors hover:bg-muted/80 cursor-pointer"
        onClick={() => !isEditing && onSelect(item.id)}
      >
        {isEditing ? (
          <Input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            autoFocus
            className="h-auto py-2.5 px-3 text-sm bg-white border-primary/30 focus-visible:ring-1"
          />
        ) : (
          <div className="flex items-center justify-between py-2.5 px-3">
            <span className="text-sm truncate flex-1">{item.content}</span>
            <Button
              variant="ghost"
              size="icon"
              className="size-6 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-2"
              onClick={(e) => {
                e.stopPropagation()
                setIsEditing(true)
              }}
            >
              <Pencil className="size-3" />
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

// ============================================
// MEDIA ITEM COMPONENT
// ============================================

interface MediaItemProps {
  item: MediaItem
  onSelect: (id: string) => void
}

function MediaItemComponent({ item, onSelect }: MediaItemProps) {
  return (
    <div 
      className="group cursor-pointer"
      onClick={() => onSelect(item.id)}
    >
      <div className="relative aspect-video bg-muted/50 rounded-lg overflow-hidden transition-all hover:ring-2 hover:ring-primary/30">
        {item.src ? (
          <NextImage 
            src={item.src} 
            alt={item.name}
            fill
            className="object-cover"
            unoptimized
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
            {getMediaIcon(item.type)}
          </div>
        )}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
      </div>
      <p className="text-[11px] text-muted-foreground mt-1.5 truncate">{item.name}</p>
    </div>
  )
}

// ============================================
// SECTION COMPONENT
// ============================================

interface SectionProps {
  title: string
  icon: React.ReactNode
  count: number
  children: React.ReactNode
  showAllLabel?: string
  isExpanded: boolean
  onToggleExpand: () => void
}

function Section({ 
  title, 
  icon, 
  count, 
  children, 
  showAllLabel,
  isExpanded,
  onToggleExpand,
}: SectionProps) {
  return (
    <section className="space-y-3">
      {/* Section Header */}
      <div className="flex items-center gap-2">
        <span className="text-muted-foreground">{icon}</span>
        <h4 className="text-sm font-medium">{title}</h4>
        <span className="text-xs text-muted-foreground">({count})</span>
      </div>

      {/* Section Content */}
      <div className="space-y-3">
        {children}
      </div>

      {/* Show All Button */}
      {showAllLabel && count > INITIAL_VISIBLE_COUNT && (
        <button
          onClick={onToggleExpand}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors w-full py-2"
        >
          <MoreHorizontal className="size-4" />
          <span>
            {isExpanded 
              ? `Mostrar menos` 
              : `Mostrar todos os ${count} ${showAllLabel}`
            }
          </span>
          {isExpanded ? (
            <ChevronDown className="size-3 ml-auto" />
          ) : (
            <ChevronRight className="size-3 ml-auto" />
          )}
        </button>
      )}
    </section>
  )
}

// ============================================
// MAIN COMPONENT
// ============================================

export function ElementsOverview() {
  const { template, selectNode, updateNode } = useEditorStore()
  
  const [textExpanded, setTextExpanded] = useState(false)
  const [mediaExpanded, setMediaExpanded] = useState(false)

  // Collect all text and media nodes
  const textFields = useMemo(() => {
    if (!template) return []
    return collectTextNodes(template.rootNode)
  }, [template])

  const mediaItems = useMemo(() => {
    if (!template) return []
    return collectMediaNodes(template.rootNode)
  }, [template])

  // Visible items based on expanded state
  const visibleTextFields = textExpanded 
    ? textFields 
    : textFields.slice(0, INITIAL_VISIBLE_COUNT)

  const visibleMediaItems = mediaExpanded 
    ? mediaItems 
    : mediaItems.slice(0, INITIAL_VISIBLE_COUNT)

  // Handlers
  const handleSelectNode = useCallback((nodeId: string) => {
    selectNode(nodeId)
  }, [selectNode])

  const handleUpdateText = useCallback((nodeId: string, content: string) => {
    updateNode(nodeId, {
      textProps: {
        content,
      },
    } as Partial<TextNode>)
  }, [updateNode])

  if (!template) {
    return null
  }

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="px-6 py-5 border-b">
        <h3 className="text-base font-medium">Editar conteúdo</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Edite textos e mídias do template
        </p>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-zinc-200 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-zinc-300">
        <div className="px-6 py-5 space-y-8">
          {/* Text Section */}
          {textFields.length > 0 && (
            <Section
              title="Text"
              icon={<Type className="size-4" />}
              count={textFields.length}
              showAllLabel="campos de texto"
              isExpanded={textExpanded}
              onToggleExpand={() => setTextExpanded(!textExpanded)}
            >
              <div className="space-y-4">
                {visibleTextFields.map((item) => (
                  <TextFieldItemComponent
                    key={item.id}
                    item={item}
                    onSelect={handleSelectNode}
                    onUpdate={handleUpdateText}
                  />
                ))}
              </div>
            </Section>
          )}

          {/* Media Section */}
          {mediaItems.length > 0 && (
            <Section
              title="Media"
              icon={<ImageLucide className="size-4" />}
              count={mediaItems.length}
              showAllLabel="elementos de mídia"
              isExpanded={mediaExpanded}
              onToggleExpand={() => setMediaExpanded(!mediaExpanded)}
            >
              <div className="grid grid-cols-2 gap-3">
                {visibleMediaItems.map((item) => (
                  <MediaItemComponent
                    key={item.id}
                    item={item}
                    onSelect={handleSelectNode}
                  />
                ))}
              </div>
            </Section>
          )}

          {/* Empty State */}
          {textFields.length === 0 && mediaItems.length === 0 && (
            <div className="flex flex-col items-center text-center py-8">
              <div className="size-12 rounded-full bg-muted flex items-center justify-center mb-3">
                <LayoutGrid className="size-5 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground">
                Nenhum elemento editável encontrado
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <SidebarFooter />
    </div>
  )
}
