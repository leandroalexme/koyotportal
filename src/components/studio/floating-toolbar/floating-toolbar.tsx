'use client'

import { useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { TextToolbar } from './toolbars/text-toolbar'
import { FrameToolbar } from './toolbars/frame-toolbar'
import { ImageToolbar } from './toolbars/image-toolbar'
import { ShapeToolbar } from './toolbars/shape-toolbar'
import { useEditorStore } from '@/stores/editor-store'
import type { 
  SceneNode, 
  TextNode, 
  FrameNode, 
  ImageNode,
  RectangleNode,
  EllipseNode,
  LineNode,
} from '@/types/studio'

// ============================================
// TYPES
// ============================================

export interface ToolbarPosition {
  x: number
  y: number
}

interface FloatingToolbarProps {
  position?: ToolbarPosition
  offset?: { x: number; y: number }
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function isButtonFrame(node: FrameNode): boolean {
  const name = node.name.toLowerCase()
  return name.includes('button') || name.includes('btn') || name.includes('cta')
}

function isLogoImage(node: ImageNode): boolean {
  const name = node.name.toLowerCase()
  return name.includes('logo') || name.includes('marca') || name.includes('brand')
}

// ============================================
// FLOATING TOOLBAR CONTAINER
// ============================================

const TOOLBAR_CLASSES = `
  fixed z-50 
  flex items-center gap-0.5
  bg-zinc-900 
  rounded-xl 
  shadow-2xl shadow-black/25
  border border-zinc-800
  px-1.5 py-1.5
  animate-in fade-in-0 zoom-in-95 duration-150
`

export function FloatingToolbar({ 
  position,
  offset = { x: 0, y: -60 },
}: FloatingToolbarProps) {
  const { template, selectedNodeIds, updateNode } = useEditorStore()
  const [isMinimized, setIsMinimized] = useState(true)

  // Get selected node
  const selectedNode = useMemo(() => {
    if (!template || selectedNodeIds.length !== 1) return null
    
    const findNode = (node: SceneNode): SceneNode | null => {
      if (node.id === selectedNodeIds[0]) return node
      if (node.type === 'FRAME') {
        for (const child of (node as FrameNode).children) {
          const found = findNode(child)
          if (found) return found
        }
      }
      return null
    }
    
    return findNode(template.rootNode)
  }, [template, selectedNodeIds])

  // Don't render if no node selected
  if (!selectedNode) return null

  // Calculate position
  const toolbarStyle = position ? {
    left: `${position.x + offset.x}px`,
    top: `${position.y + offset.y}px`,
    transform: 'translateX(-50%)',
  } : {
    left: '50%',
    top: '80px',
    transform: 'translateX(-50%)',
  }

  // Handle node update
  const handleUpdate = (updates: Partial<SceneNode>) => {
    updateNode(selectedNode.id, updates)
  }

  // Render appropriate toolbar based on node type
  const renderToolbar = () => {
    switch (selectedNode.type) {
      case 'TEXT':
        return (
          <TextToolbar 
            node={selectedNode as TextNode} 
            onUpdate={handleUpdate}
          />
        )
      
      case 'FRAME':
        const frameNode = selectedNode as FrameNode
        if (isButtonFrame(frameNode)) {
          return (
            <FrameToolbar 
              node={frameNode} 
              onUpdate={handleUpdate}
              isButton
            />
          )
        }
        return (
          <FrameToolbar 
            node={frameNode} 
            onUpdate={handleUpdate}
          />
        )
      
      case 'IMAGE':
        const imageNode = selectedNode as ImageNode
        return (
          <ImageToolbar 
            node={imageNode} 
            onUpdate={handleUpdate}
            isLogo={isLogoImage(imageNode)}
          />
        )
      
      case 'RECTANGLE':
      case 'ELLIPSE':
      case 'LINE':
        return (
          <ShapeToolbar 
            node={selectedNode as RectangleNode | EllipseNode | LineNode} 
            onUpdate={handleUpdate}
          />
        )
      
      default:
        return null
    }
  }

  const toolbar = renderToolbar()
  if (!toolbar) return null

  // Get node type label for minimized state
  const getNodeTypeLabel = () => {
    switch (selectedNode.type) {
      case 'TEXT': return 'Texto'
      case 'FRAME': return isButtonFrame(selectedNode as FrameNode) ? 'Botão' : 'Frame'
      case 'IMAGE': return isLogoImage(selectedNode as ImageNode) ? 'Logo' : 'Imagem'
      case 'RECTANGLE': return 'Retângulo'
      case 'ELLIPSE': return 'Elipse'
      case 'LINE': return 'Linha'
      default: return 'Elemento'
    }
  }

  return (
    <div 
      className={TOOLBAR_CLASSES}
      style={toolbarStyle}
    >
      {isMinimized ? (
        // Minimized state - just show expand button with element type
        <Button
          variant="ghost"
          size="sm"
          className="h-7 px-2 rounded-lg text-zinc-300 hover:text-white hover:bg-zinc-800 text-xs font-medium gap-1.5"
          onClick={() => setIsMinimized(false)}
        >
          <ChevronRight className="size-3.5" />
          <span>{getNodeTypeLabel()}</span>
        </Button>
      ) : (
        // Expanded state - show full toolbar with minimize button
        <>
          {toolbar}
          <Button
            variant="ghost"
            size="icon"
            className="size-7 rounded-lg text-zinc-500 hover:text-white hover:bg-zinc-800 ml-0.5"
            onClick={() => setIsMinimized(true)}
            title="Minimizar toolbar"
          >
            <ChevronLeft className="size-3.5" />
          </Button>
        </>
      )}
    </div>
  )
}
