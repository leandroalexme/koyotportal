'use client'

import { useState, useMemo, useCallback, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ChevronDown, Minus, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { getMockTemplateById, MOCK_TEMPLATES } from '@/lib/studio/mocks'
import { CanvasRenderer } from '@/components/studio/canvas-renderer'
import { EditorSidebar } from '@/components/studio/editor-sidebar'
import { LeftSidebar, type PageData } from '@/components/studio/left-sidebar'
import { useEditorStore } from '@/stores/editor-store'
import { 
  type SceneNode, 
  type Template,
  flattenNodes,
} from '@/types/studio'

// ============================================
// MOCK PAGES DATA
// ============================================

function getTemplatePages(template: Template): PageData[] {
  // In a real app, this would come from the template's artboards/frames
  return [
    {
      id: 'page-1',
      name: template.name,
      width: template.rootNode.size.width,
      height: template.rootNode.size.height,
      isVisible: true,
      isEdited: true,
      format: 'Instagram Square',
    },
    {
      id: 'page-2',
      name: 'link-preview-image',
      width: 1200,
      height: 628,
      isVisible: true,
      format: 'Link Preview',
    },
    {
      id: 'page-3',
      name: 'email-visual',
      width: 600,
      height: 400,
      isVisible: true,
      format: 'Email',
    },
    {
      id: 'page-4',
      name: 'web-banner-header',
      width: 1920,
      height: 400,
      isVisible: false,
      format: 'Web Banner',
    },
  ]
}

// ============================================
// ZOOM CONTROLS
// ============================================

interface ZoomControlsProps {
  zoom: number
  onZoomIn: () => void
  onZoomOut: () => void
}

function ZoomControls({ zoom, onZoomIn, onZoomOut }: ZoomControlsProps) {
  return (
    <div className="absolute bottom-4 left-4 flex items-center gap-0.5 bg-foreground rounded-full px-1 py-1">
      <Button 
        variant="ghost" 
        size="icon" 
        className="size-7 rounded-full text-background/70 hover:text-background hover:bg-background/10" 
        onClick={onZoomOut}
      >
        <Minus className="size-3.5" />
      </Button>
      
      <span className="text-xs font-medium px-2 text-background min-w-10 text-center tabular-nums">
        {Math.round(zoom * 100)}%
      </span>
      
      <Button 
        variant="ghost" 
        size="icon" 
        className="size-7 rounded-full text-background/70 hover:text-background hover:bg-background/10" 
        onClick={onZoomIn}
      >
        <Plus className="size-3.5" />
      </Button>
    </div>
  )
}

// ============================================
// EDITOR HEADER
// ============================================

interface EditorHeaderProps {
  template: Template
  onBack: () => void
  onExport: () => void
  onPublish: () => void
}

function EditorHeader({ template, onBack, onExport, onPublish }: EditorHeaderProps) {
  return (
    <header className="h-12 border-b flex items-center justify-between px-4 bg-background shrink-0">
      <div className="flex items-center gap-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="gap-2 font-medium">
              {template.name}
              <ChevronDown className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuItem onClick={onBack}>
              Back to Templates
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Rename</DropdownMenuItem>
            <DropdownMenuItem>Duplicate</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        
        <Badge variant="outline" className="text-[10px] font-medium uppercase tracking-wide">
          Template
        </Badge>
        
        <div className="flex items-center gap-1.5">
          <span className="size-2 rounded-full bg-destructive" />
          <span className="text-xs text-muted-foreground">Not published</span>
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={onExport}>
          Export
        </Button>
        <Button size="sm" onClick={onPublish}>
          Publish
        </Button>
      </div>
    </header>
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
  
  // EditorStore - centralized state
  const {
    template,
    selectedNodeIds,
    zoom,
    panOffset,
    ui,
    setTemplate,
    selectNode,
    clearSelection,
    setZoom,
    zoomIn,
    zoomOut,
    updateNode,
    undo,
    redo,
  } = useEditorStore()
  
  const [selectedPageId, setSelectedPageId] = useState<string>('page-1')
  
  // Initialize template from mock data
  useEffect(() => {
    const mockTemplate = getMockTemplateById(templateId) || MOCK_TEMPLATES[0]
    if (mockTemplate && (!template || template.id !== mockTemplate.id)) {
      setTemplate(mockTemplate)
    }
  }, [templateId, template, setTemplate])
  
  // Get pages for the template
  const pages = useMemo(() => {
    if (!template) return []
    return getTemplatePages(template)
  }, [template])
  
  // Selected node from store
  const selectedNodeId = selectedNodeIds[0] ?? null
  
  const selectedNode = useMemo(() => {
    if (!selectedNodeId || !template) return null
    const allNodes = flattenNodes(template.rootNode)
    return allNodes.find(n => n.id === selectedNodeId) || null
  }, [selectedNodeId, template])
  
  // Zoom handlers
  const handleZoomIn = useCallback(() => zoomIn(), [zoomIn])
  const handleZoomOut = useCallback(() => zoomOut(), [zoomOut])
  
  // Selection handlers
  const handleNodeClick = useCallback((nodeId: string | null) => {
    if (nodeId) {
      selectNode(nodeId)
    } else {
      clearSelection()
    }
  }, [selectNode, clearSelection])
  
    
  // Update node handler - uses store
  const handleUpdateNode = useCallback((nodeId: string, updates: Partial<SceneNode>) => {
    updateNode(nodeId, updates)
  }, [updateNode])
  
  const handleDeselectNode = useCallback(() => {
    clearSelection()
  }, [clearSelection])
  
  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Undo: Ctrl/Cmd + Z
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault()
        undo()
      }
      // Redo: Ctrl/Cmd + Shift + Z or Ctrl/Cmd + Y
      if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault()
        redo()
      }
      // Deselect: Escape
      if (e.key === 'Escape') {
        clearSelection()
      }
    }
    
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [undo, redo, clearSelection])
  
  const handleBack = useCallback(() => {
    router.push(`/${brandId}/templates`)
  }, [router, brandId])
  
  const handleExport = useCallback(() => {
    console.log('Export')
  }, [])
  
  const handlePublish = useCallback(() => {
    console.log('Publish')
  }, [])
  
  if (!template) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-muted-foreground">Template não encontrado</p>
      </div>
    )
  }
  
  return (
    <div className="flex flex-col h-screen bg-background overflow-hidden [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
      <EditorHeader 
        template={template}
        onBack={handleBack}
        onExport={handleExport}
        onPublish={handlePublish}
      />
      
      <div className="flex-1 flex overflow-hidden [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        <LeftSidebar
          pages={pages}
          selectedPageId={selectedPageId}
          currentPageNode={template.rootNode}
          selectedNodeId={selectedNodeId}
          onSelectPage={setSelectedPageId}
          onSelectNode={(nodeId) => nodeId ? selectNode(nodeId) : clearSelection()}
        />
        
        <main className="flex-1 relative overflow-hidden bg-zinc-200">
          <CanvasRenderer
            rootNode={template.rootNode}
            selectedNodeId={selectedNodeId}
            onNodeClick={handleNodeClick}
            zoom={zoom}
            panOffset={panOffset}
            showGrid={ui.showGrid}
            onZoomChange={setZoom}
          />
          
          <ZoomControls 
            zoom={zoom}
            onZoomIn={handleZoomIn}
            onZoomOut={handleZoomOut}
          />
        </main>
        
        <EditorSidebar
          selectedNode={selectedNode}
          userRole="editor"
          onUpdateNode={handleUpdateNode}
          onDeselectNode={handleDeselectNode}
        />
      </div>
    </div>
  )
}
