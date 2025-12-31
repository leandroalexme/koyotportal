'use client'

import { useState, useMemo, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  ChevronLeft,
  ChevronRight,
  Layers,
  Undo2,
  Redo2,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Share2,
  Sparkles,
  Save,
  Eye,
  EyeOff,
  Lock,
  MoreHorizontal,
  Type,
  Image as ImageIcon,
  Square,
  Circle,
  Minus,
  Frame,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import { getMockTemplateById, MOCK_TEMPLATES } from '@/lib/studio/mocks'
import { CanvasRenderer } from '@/components/studio/canvas-renderer'
import { EditorControls } from '@/components/studio/editor-controls'
import { ExportDialog, type ExportSettings, downloadBlob, exportToPng, exportToJpg } from '@/components/studio/export-dialog'
import { 
  type SceneNode, 
  type FrameNode,
  type TextNode,
  type ImageNode,
  type Template,
  type UserRole,
  TEMPLATE_FORMATS,
  flattenNodes,
} from '@/types/studio'

// ============================================
// LAYER TREE ITEM
// ============================================

interface LayerItemProps {
  node: SceneNode
  depth: number
  selectedId: string | null
  onSelect: (id: string) => void
}

function LayerItem({ node, depth, selectedId, onSelect }: LayerItemProps) {
  const [expanded, setExpanded] = useState(true)
  const hasChildren = node.type === 'FRAME' && (node as FrameNode).children.length > 0
  
  const getIcon = () => {
    switch (node.type) {
      case 'FRAME': return <Frame className="h-3.5 w-3.5" />
      case 'TEXT': return <Type className="h-3.5 w-3.5" />
      case 'IMAGE': return <ImageIcon className="h-3.5 w-3.5" />
      case 'RECTANGLE': return <Square className="h-3.5 w-3.5" />
      case 'ELLIPSE': return <Circle className="h-3.5 w-3.5" />
      case 'LINE': return <Minus className="h-3.5 w-3.5" />
      default: return <Square className="h-3.5 w-3.5" />
    }
  }
  
  return (
    <div>
      <div
        className={cn(
          'group flex items-center gap-1 px-2 py-1.5 rounded-sm cursor-pointer transition-colors',
          selectedId === node.id ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
        )}
        style={{ paddingLeft: `${depth * 12 + 8}px` }}
        onClick={() => onSelect(node.id)}
      >
        {hasChildren ? (
          <button
            onClick={(e) => {
              e.stopPropagation()
              setExpanded(!expanded)
            }}
            className="p-0.5 hover:bg-black/10 rounded"
          >
            <ChevronRight className={cn('h-3 w-3 transition-transform', expanded && 'rotate-90')} />
          </button>
        ) : (
          <span className="w-4" />
        )}
        
        <span className="shrink-0">{getIcon()}</span>
        <span className="flex-1 truncate text-xs">{node.name}</span>
        
        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          {node.visible ? (
            <Eye className="h-3 w-3 opacity-50" />
          ) : (
            <EyeOff className="h-3 w-3 opacity-30" />
          )}
          {node.locked && <Lock className="h-3 w-3 opacity-50" />}
        </div>
      </div>
      
      {hasChildren && expanded && (
        <div>
          {(node as FrameNode).children.map((child) => (
            <LayerItem
              key={child.id}
              node={child}
              depth={depth + 1}
              selectedId={selectedId}
              onSelect={onSelect}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// ============================================
// LAYERS PANEL
// ============================================

interface LayersPanelProps {
  rootNode: FrameNode
  selectedId: string | null
  onSelect: (id: string) => void
}

function LayersPanel({ rootNode, selectedId, onSelect }: LayersPanelProps) {
  return (
    <div className="flex flex-col h-full">
      <div className="p-3 border-b flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Layers className="h-4 w-4" />
          <span className="font-medium text-sm">Camadas</span>
        </div>
        <Button variant="ghost" size="icon" className="h-6 w-6">
          <MoreHorizontal className="h-3.5 w-3.5" />
        </Button>
      </div>
      
      <ScrollArea className="flex-1">
        <div className="py-2">
          <LayerItem
            node={rootNode}
            depth={0}
            selectedId={selectedId}
            onSelect={onSelect}
          />
        </div>
      </ScrollArea>
    </div>
  )
}

// ============================================
// MAIN EDITOR PAGE
// ============================================

export default function TemplateEditorPage() {
  const params = useParams()
  const router = useRouter()
  const brandId = params.brand_id as string
  const templateId = params.templateId as string
  
  // State
  const [zoom, setZoom] = useState(0.5)
  const [panOffset] = useState({ x: 0, y: 0 })
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)
  const [leftPanelOpen, setLeftPanelOpen] = useState(true)
  const [rightPanelOpen, setRightPanelOpen] = useState(true)
  const [showGrid] = useState(false)
  
  // TODO: Get from auth context
  const userRole: UserRole = 'owner'
  
  // Get template (using mocks for now)
  const [template, setTemplate] = useState<Template | null>(() => {
    return getMockTemplateById(templateId) || MOCK_TEMPLATES[0]
  })
  
  // Get selected node
  const selectedNode = useMemo(() => {
    if (!selectedNodeId || !template) return null
    const allNodes = flattenNodes(template.rootNode)
    return allNodes.find(n => n.id === selectedNodeId) || null
  }, [selectedNodeId, template])
  
  // Zoom controls
  const handleZoomIn = () => setZoom(Math.min(zoom + 0.1, 2))
  const handleZoomOut = () => setZoom(Math.max(zoom - 0.1, 0.1))
  const handleZoomFit = () => setZoom(0.5)
  
  // Node selection
  const handleNodeClick = useCallback((nodeId: string | null) => {
    setSelectedNodeId(nodeId)
  }, [])
  
  // Update node
  const handleUpdateNode = useCallback((nodeId: string, updates: Partial<SceneNode>) => {
    if (!template) return
    
    const updateNode = (node: SceneNode): SceneNode => {
      if (node.id === nodeId) {
        return { ...node, ...updates } as SceneNode
      }
      if (node.type === 'FRAME') {
        const frameNode = node as FrameNode
        return {
          ...frameNode,
          children: frameNode.children.map(updateNode),
        }
      }
      return node
    }
    
    setTemplate({
      ...template,
      rootNode: updateNode(template.rootNode) as FrameNode,
    })
  }, [template])
  
  // Update text content
  const handleUpdateTextContent = useCallback((nodeId: string, content: string) => {
    if (!template) return
    
    const updateNode = (node: SceneNode): SceneNode => {
      if (node.id === nodeId && node.type === 'TEXT') {
        const textNode = node as TextNode
        return {
          ...textNode,
          textProps: {
            ...textNode.textProps,
            content,
          },
        }
      }
      if (node.type === 'FRAME') {
        const frameNode = node as FrameNode
        return {
          ...frameNode,
          children: frameNode.children.map(updateNode),
        }
      }
      return node
    }
    
    setTemplate({
      ...template,
      rootNode: updateNode(template.rootNode) as FrameNode,
    })
  }, [template])
  
  // Update image
  const handleUpdateImage = useCallback((nodeId: string, assetId: string, src: string) => {
    if (!template) return
    
    const updateNode = (node: SceneNode): SceneNode => {
      if (node.id === nodeId && node.type === 'IMAGE') {
        const imageNode = node as ImageNode
        return {
          ...imageNode,
          imageProps: {
            ...imageNode.imageProps,
            assetId,
            src,
          },
        }
      }
      if (node.type === 'FRAME') {
        const frameNode = node as FrameNode
        return {
          ...frameNode,
          children: frameNode.children.map(updateNode),
        }
      }
      return node
    }
    
    setTemplate({
      ...template,
      rootNode: updateNode(template.rootNode) as FrameNode,
    })
  }, [template])
  
  // Export handler
  const handleExport = async (settings: ExportSettings) => {
    const canvas = document.createElement('canvas')
    const width = template!.rootNode.size.width * settings.scale
    const height = template!.rootNode.size.height * settings.scale
    canvas.width = width
    canvas.height = height
    
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Could not get canvas context')
    
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, width, height)
    
    ctx.fillStyle = '#666666'
    ctx.font = `${24 * settings.scale}px Inter`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(`${template!.name} - ${settings.format.toUpperCase()}`, width / 2, height / 2)
    
    let blob: Blob
    let filename: string
    
    switch (settings.format) {
      case 'png':
        blob = await exportToPng(canvas)
        filename = `${template!.name}.png`
        break
      case 'jpg':
        blob = await exportToJpg(canvas, settings.quality / 100)
        filename = `${template!.name}.jpg`
        break
      default:
        blob = await exportToPng(canvas)
        filename = `${template!.name}.png`
    }
    
    downloadBlob(blob, filename)
  }
  
  if (!template) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p>Template não encontrado</p>
      </div>
    )
  }
  
  const formatInfo = TEMPLATE_FORMATS[template.format]
  
  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Top Bar */}
      <header className="h-12 border-b flex items-center justify-between px-4 bg-background shrink-0">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8"
            onClick={() => router.push(`/${brandId}/templates`)}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          
          <Separator orientation="vertical" className="h-6" />
          
          <div>
            <h1 className="text-sm font-medium">{template.name}</h1>
            <p className="text-xs text-muted-foreground">
              {formatInfo.name} • {formatInfo.width}×{formatInfo.height}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-0.5">
            <Button variant="ghost" size="icon" className="h-8 w-8" disabled>
              <Undo2 className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" disabled>
              <Redo2 className="h-4 w-4" />
            </Button>
          </div>
          
          <Separator orientation="vertical" className="h-6" />
          
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleZoomOut}>
              <ZoomOut className="h-4 w-4" />
            </Button>
            <span className="text-xs w-12 text-center">{Math.round(zoom * 100)}%</span>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleZoomIn}>
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleZoomFit}>
              <Maximize2 className="h-4 w-4" />
            </Button>
          </div>
          
          <Separator orientation="vertical" className="h-6" />
          
          <Button variant="ghost" size="sm" className="gap-2">
            <Sparkles className="h-4 w-4" />
            AI Assist
          </Button>
          
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <Share2 className="h-4 w-4" />
          </Button>
          
          <ExportDialog template={template} onExport={handleExport} />
          
          <Button size="sm" className="gap-2">
            <Save className="h-4 w-4" />
            Salvar
          </Button>
        </div>
      </header>
      
      {/* Main Area */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left Panel - Layers */}
        <div className={cn(
          'border-r bg-background transition-all duration-200 shrink-0',
          leftPanelOpen ? 'w-56' : 'w-0 overflow-hidden'
        )}>
          {leftPanelOpen && (
            <LayersPanel
              rootNode={template.rootNode}
              selectedId={selectedNodeId}
              onSelect={setSelectedNodeId}
            />
          )}
        </div>
        
        {/* Toggle Left Panel */}
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            'absolute top-1/2 -translate-y-1/2 z-10 h-6 w-4 rounded-l-none bg-background border border-l-0',
            leftPanelOpen ? 'left-56' : 'left-0'
          )}
          onClick={() => setLeftPanelOpen(!leftPanelOpen)}
        >
          {leftPanelOpen ? <ChevronLeft className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
        </Button>
        
        {/* Canvas */}
        <div className="flex-1 overflow-hidden">
          <CanvasRenderer
            rootNode={template.rootNode}
            selectedNodeId={selectedNodeId}
            onNodeClick={handleNodeClick}
            zoom={zoom}
            panOffset={panOffset}
            showGrid={showGrid}
          />
        </div>
        
        {/* Toggle Right Panel */}
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            'absolute top-1/2 -translate-y-1/2 z-10 h-6 w-4 rounded-r-none bg-background border border-r-0',
            rightPanelOpen ? 'right-72' : 'right-0'
          )}
          onClick={() => setRightPanelOpen(!rightPanelOpen)}
        >
          {rightPanelOpen ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />}
        </Button>
        
        {/* Right Panel - Properties */}
        <div className={cn(
          'border-l bg-background transition-all duration-200 shrink-0',
          rightPanelOpen ? 'w-72' : 'w-0 overflow-hidden'
        )}>
          {rightPanelOpen && (
            <EditorControls
              selectedNode={selectedNode}
              userRole={userRole}
              onUpdateNode={handleUpdateNode}
              onUpdateTextContent={handleUpdateTextContent}
              onUpdateImage={handleUpdateImage}
            />
          )}
        </div>
      </div>
    </div>
  )
}
