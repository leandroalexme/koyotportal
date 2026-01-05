'use client'

import {
  Type,
  Image,
  Square,
  Circle,
  Minus,
  MousePointer,
  Hexagon,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  ChevronRight,
  Folder,
  File,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import type { SceneNode } from '@/types/studio'

// ============================================
// TYPES
// ============================================

export interface LayerItemData {
  id: string
  name: string
  type: SceneNode['type']
  isVisible: boolean
  isEditable: boolean
  isLocked: boolean
  children?: LayerItemData[]
}

interface LayerItemProps {
  layer: LayerItemData
  selectedId: string | null
  onSelect: (layerId: string) => void
  onToggleVisibility?: (layerId: string) => void
  onToggleLock?: (layerId: string) => void
}

// ============================================
// HELPER: Get icon for node type
// ============================================

function getLayerIcon(type: SceneNode['type'], name: string) {
  const nameLower = name.toLowerCase()
  
  if (nameLower.includes('button') || nameLower.includes('btn') || nameLower.includes('cta')) {
    return <MousePointer className="size-4" />
  }
  if (nameLower.includes('logo') || nameLower.includes('marca')) {
    return <Hexagon className="size-4" />
  }
  
  switch (type) {
    case 'TEXT':
      return <Type className="size-4" />
    case 'IMAGE':
      return <Image className="size-4" />
    case 'FRAME':
      return <Folder className="size-4" />
    case 'RECTANGLE':
      return <Square className="size-4" />
    case 'ELLIPSE':
      return <Circle className="size-4" />
    case 'LINE':
      return <Minus className="size-4" />
    default:
      return <File className="size-4" />
  }
}

// ============================================
// LAYER ITEM - Usando padrão shadcn file tree
// ============================================

export function LayerItem({ 
  layer, 
  selectedId,
  onSelect,
  onToggleVisibility,
  onToggleLock,
}: LayerItemProps) {
  const hasChildren = layer.children && layer.children.length > 0
  const isSelected = selectedId === layer.id

  const handleToggleVisibility = (e: React.MouseEvent) => {
    e.stopPropagation()
    onToggleVisibility?.(layer.id)
  }

  const handleToggleLock = (e: React.MouseEvent) => {
    e.stopPropagation()
    onToggleLock?.(layer.id)
  }

  // Inline toggle buttons JSX
  const toggleButtons = (
    <div className="flex items-center gap-0.5 opacity-0 group-hover/layer:opacity-100 transition-opacity">
      <TooltipProvider delayDuration={200}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="size-5"
              onClick={handleToggleVisibility}
            >
              {layer.isVisible ? (
                <Eye className="size-3 text-muted-foreground" />
              ) : (
                <EyeOff className="size-3 text-muted-foreground" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top" className="text-xs">
            {layer.isVisible ? 'Ocultar' : 'Mostrar'}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      
      <TooltipProvider delayDuration={200}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="size-5"
              onClick={handleToggleLock}
            >
              {layer.isLocked ? (
                <Lock className="size-3 text-muted-foreground" />
              ) : (
                <Unlock className="size-3 text-muted-foreground" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top" className="text-xs">
            {layer.isLocked ? 'Desbloquear' : 'Bloquear'}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  )

  // Inline status indicators JSX
  const statusIndicators = (
    <div className="flex items-center gap-0.5 shrink-0">
      {layer.isLocked && (
        <Lock className="size-3 text-amber-500" />
      )}
      {!layer.isVisible && (
        <EyeOff className="size-3 text-muted-foreground" />
      )}
    </div>
  )

  // Leaf node (no children)
  if (!hasChildren) {
    return (
      <button
        onClick={() => onSelect(layer.id)}
        className={cn(
          "group/layer flex items-center gap-2 w-full rounded-md px-2 py-1.5 text-sm transition-colors text-left",
          isSelected 
            ? "bg-accent text-accent-foreground" 
            : "hover:bg-accent/50",
          !layer.isVisible && "opacity-50"
        )}
      >
        <span className="text-muted-foreground shrink-0">
          {getLayerIcon(layer.type, layer.name)}
        </span>
        <span className="flex-1 truncate">{layer.name}</span>
        {toggleButtons}
        {statusIndicators}
      </button>
    )
  }

  // Parent node with children (collapsible)
  return (
    <Collapsible
      defaultOpen
      className="group/collapsible [&[data-state=open]>button>svg:first-child]:rotate-90"
    >
      <CollapsibleTrigger asChild>
        <button
          onClick={() => onSelect(layer.id)}
          className={cn(
            "group/layer flex items-center gap-2 w-full rounded-md px-2 py-1.5 text-sm transition-colors text-left",
            isSelected 
              ? "bg-accent text-accent-foreground" 
              : "hover:bg-accent/50",
            !layer.isVisible && "opacity-50"
          )}
        >
          <ChevronRight className="size-4 text-muted-foreground transition-transform shrink-0" />
          <span className="text-muted-foreground shrink-0">
            {getLayerIcon(layer.type, layer.name)}
          </span>
          <span className="flex-1 truncate">{layer.name}</span>
          {toggleButtons}
          {statusIndicators}
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="ml-4 pl-2 border-l border-border">
          {layer.children?.map((child) => (
            <LayerItem
              key={child.id}
              layer={child}
              selectedId={selectedId}
              onSelect={onSelect}
              onToggleVisibility={onToggleVisibility}
              onToggleLock={onToggleLock}
            />
          ))}
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}
