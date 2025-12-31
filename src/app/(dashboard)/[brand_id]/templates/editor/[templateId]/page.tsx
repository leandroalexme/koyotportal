'use client'

import { useState, useMemo, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  ArrowLeft,
  ChevronDown,
  ChevronRight,
  Eye,
  EyeOff,
  Lock,
  Type,
  Image as ImageIcon,
  Square,
  Circle,
  Minus,
  Frame,
  ZoomIn,
  ZoomOut,
  Upload,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { cn } from '@/lib/utils'
import { getMockTemplateById, MOCK_TEMPLATES } from '@/lib/studio/mocks'
import { CanvasRenderer } from '@/components/studio/canvas-renderer'
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
// PAGE THUMBNAIL
// ============================================

interface PageThumbnailProps {
  node: FrameNode
  name: string
  isSelected: boolean
  onClick: () => void
}

function PageThumbnail({ node, name, isSelected, onClick }: PageThumbnailProps) {
  return (
    <div 
      className={cn(
        'cursor-pointer transition-all',
        isSelected && 'ring-2 ring-primary'
      )}
      onClick={onClick}
    >
      <div className="bg-muted rounded-md overflow-hidden aspect-[4/5] mb-2 flex items-center justify-center">
        <div 
          className="bg-white rounded shadow-sm"
          style={{
            width: '80%',
            aspectRatio: `${node.size.width}/${node.size.height}`,
            maxHeight: '90%',
          }}
        />
      </div>
      <p className="text-xs text-center text-muted-foreground truncate">{name}</p>
    </div>
  )
}

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
          'group flex items-center gap-1 px-2 py-1 rounded-sm cursor-pointer transition-colors',
          selectedId === node.id ? 'bg-primary/10 text-primary' : 'hover:bg-muted'
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
        
        <span className="shrink-0 text-muted-foreground">{getIcon()}</span>
        <span className="flex-1 truncate text-xs">{node.name}</span>
        
        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          {!node.visible && <EyeOff className="h-3 w-3 opacity-30" />}
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
// LEFT SIDEBAR
// ============================================

interface LeftSidebarProps {
  template: Template
  selectedNodeId: string | null
  onSelectNode: (id: string) => void
}

function LeftSidebar({ template, selectedNodeId, onSelectNode }: LeftSidebarProps) {
  return (
    <div className="w-[200px] border-r bg-background flex flex-col h-full">
      <Tabs defaultValue="pages" className="flex-1 flex flex-col">
        <TabsList className="w-full justify-start rounded-none border-b bg-transparent h-10 p-0">
          <TabsTrigger 
            value="pages" 
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 h-10"
          >
            Pages
          </TabsTrigger>
          <TabsTrigger 
            value="layers" 
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 h-10"
          >
            Layers
          </TabsTrigger>
          <TabsTrigger 
            value="variables" 
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 h-10"
          >
            Variables
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="pages" className="flex-1 m-0 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="p-3 space-y-4">
              <PageThumbnail
                node={template.rootNode}
                name={template.name}
                isSelected={true}
                onClick={() => {}}
              />
            </div>
          </ScrollArea>
        </TabsContent>
        
        <TabsContent value="layers" className="flex-1 m-0 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="py-2">
              <LayerItem
                node={template.rootNode}
                depth={0}
                selectedId={selectedNodeId}
                onSelect={onSelectNode}
              />
            </div>
          </ScrollArea>
        </TabsContent>
        
        <TabsContent value="variables" className="flex-1 m-0 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="p-3 space-y-2">
              <p className="text-xs text-muted-foreground">Variáveis do template</p>
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  )
}

// ============================================
// RIGHT SIDEBAR - STYLE PANEL
// ============================================

interface RightSidebarProps {
  selectedNode: SceneNode | null
  userRole: UserRole
  onUpdateNode: (nodeId: string, updates: Partial<SceneNode>) => void
  onUpdateTextContent: (nodeId: string, content: string) => void
  onUpdateImage: (nodeId: string, assetId: string, src: string) => void
}

function RightSidebar({ 
  selectedNode, 
  userRole, 
  onUpdateNode, 
  onUpdateTextContent,
  onUpdateImage 
}: RightSidebarProps) {
  if (!selectedNode) {
    return (
      <div className="w-[280px] border-l bg-background flex items-center justify-center">
        <p className="text-sm text-muted-foreground">Selecione um elemento</p>
      </div>
    )
  }

  const isTextNode = selectedNode.type === 'TEXT'
  const isImageNode = selectedNode.type === 'IMAGE'
  const textNode = isTextNode ? selectedNode as TextNode : null
  const imageNode = isImageNode ? selectedNode as ImageNode : null

  return (
    <div className="w-[280px] border-l bg-background flex flex-col h-full">
      {/* Header */}
      <div className="p-3 border-b flex items-center justify-between">
        <div className="flex items-center gap-2">
          {isTextNode && <Type className="h-4 w-4" />}
          {isImageNode && <ImageIcon className="h-4 w-4" />}
          {!isTextNode && !isImageNode && <Frame className="h-4 w-4" />}
          <span className="text-sm font-medium">{selectedNode.name}</span>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-6">
          {/* Style Section */}
          <div>
            <h3 className="text-xs font-medium text-muted-foreground mb-3">Style</h3>
            
            {/* Visibility */}
            <div className="flex items-center justify-between py-2">
              <Label className="text-sm">Visibility</Label>
              <div className="flex items-center gap-1">
                <Button 
                  variant={selectedNode.visible ? "secondary" : "ghost"} 
                  size="icon" 
                  className="h-7 w-7"
                >
                  <Eye className="h-3.5 w-3.5" />
                </Button>
                <Button 
                  variant={!selectedNode.visible ? "secondary" : "ghost"} 
                  size="icon" 
                  className="h-7 w-7"
                >
                  <EyeOff className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>

            {/* Position */}
            <div className="flex items-center justify-between py-2">
              <Label className="text-sm">Position</Label>
              <div className="flex items-center gap-2">
                <Input 
                  type="number" 
                  defaultValue={selectedNode.position.x} 
                  className="w-16 h-7 text-xs"
                />
                <span className="text-xs text-muted-foreground">px</span>
                <Input 
                  type="number" 
                  defaultValue={selectedNode.position.y} 
                  className="w-16 h-7 text-xs"
                />
                <span className="text-xs text-muted-foreground">px</span>
              </div>
            </div>

            {/* Text-specific controls */}
            {textNode && (
              <>
                {/* Typeface */}
                <div className="flex items-center justify-between py-2">
                  <Label className="text-sm">Typeface</Label>
                  <Button variant="outline" size="sm" className="h-7 text-xs">
                    {textNode.textProps.style.fontFamily}
                    <ChevronDown className="h-3 w-3 ml-1" />
                  </Button>
                </div>

                {/* Font Size */}
                <div className="flex items-center justify-between py-2">
                  <Label className="text-sm">Font size</Label>
                  <div className="flex items-center gap-1">
                    <Input 
                      type="number" 
                      defaultValue={textNode.textProps.style.fontSize} 
                      className="w-16 h-7 text-xs"
                    />
                    <span className="text-xs text-muted-foreground">px</span>
                  </div>
                </div>

                {/* Line Height */}
                <div className="flex items-center justify-between py-2">
                  <Label className="text-sm">Line height</Label>
                  <div className="flex items-center gap-1">
                    <Input 
                      type="number" 
                      defaultValue={textNode.textProps.style.lineHeight === 'AUTO' ? 24 : textNode.textProps.style.lineHeight} 
                      className="w-16 h-7 text-xs"
                    />
                    <span className="text-xs text-muted-foreground">px</span>
                  </div>
                </div>

                {/* Text Color */}
                <div className="flex items-center justify-between py-2">
                  <Label className="text-sm">Text color</Label>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded border bg-foreground" />
                    <Button variant="outline" size="sm" className="h-7 text-xs">
                      Button...
                    </Button>
                  </div>
                </div>

                {/* Alignment */}
                <div className="flex items-center justify-between py-2">
                  <Label className="text-sm">Alignment</Label>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" className="h-7 w-7">
                      <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="3" y1="6" x2="21" y2="6" />
                        <line x1="3" y1="12" x2="15" y2="12" />
                        <line x1="3" y1="18" x2="18" y2="18" />
                      </svg>
                    </Button>
                    <Button variant="secondary" size="icon" className="h-7 w-7">
                      <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="3" y1="6" x2="21" y2="6" />
                        <line x1="6" y1="12" x2="18" y2="12" />
                        <line x1="4" y1="18" x2="20" y2="18" />
                      </svg>
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7">
                      <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="3" y1="6" x2="21" y2="6" />
                        <line x1="9" y1="12" x2="21" y2="12" />
                        <line x1="6" y1="18" x2="21" y2="18" />
                      </svg>
                    </Button>
                  </div>
                </div>
              </>
            )}

            {/* Transparency */}
            <div className="flex items-center justify-between py-2">
              <Label className="text-sm">Transparency</Label>
              <div className="flex items-center gap-2 flex-1 max-w-[140px]">
                <Slider 
                  defaultValue={[selectedNode.opacity * 100]} 
                  max={100} 
                  step={1}
                  className="flex-1"
                />
                <span className="text-xs w-8 text-right">{Math.round(selectedNode.opacity * 100)}%</span>
              </div>
            </div>
          </div>

          {/* Content Section for Text */}
          {textNode && (
            <div>
              <h3 className="text-xs font-medium text-muted-foreground mb-3">Content</h3>
              <textarea
                className="w-full min-h-[80px] p-2 text-sm border rounded-md resize-none bg-background"
                defaultValue={textNode.textProps.content}
                onChange={(e) => onUpdateTextContent(selectedNode.id, e.target.value)}
              />
            </div>
          )}

          {/* Image Section */}
          {imageNode && (
            <div>
              <h3 className="text-xs font-medium text-muted-foreground mb-3">Image</h3>
              <div className="border rounded-md p-3 flex items-center gap-3">
                <div className="w-10 h-10 bg-muted rounded flex items-center justify-center">
                  <ImageIcon className="h-5 w-5 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs truncate">{imageNode.imageProps.src || 'No image'}</p>
                </div>
                <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0">
                  <Upload className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          )}

          {/* Revert Button */}
          <Button variant="outline" className="w-full" size="sm">
            Revert to original
          </Button>
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
  const [zoom, setZoom] = useState(0.6)
  const [panOffset] = useState({ x: 0, y: 0 })
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)
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
    <div className="flex h-screen bg-background">
      {/* Icon Sidebar */}
      <div className="w-12 border-r bg-muted/30 flex flex-col items-center py-3 gap-2">
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-8 w-8"
          onClick={() => router.push(`/${brandId}/templates`)}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
      </div>

      {/* Left Sidebar - Pages/Layers/Variables */}
      <LeftSidebar
        template={template}
        selectedNodeId={selectedNodeId}
        onSelectNode={setSelectedNodeId}
      />
      
      {/* Main Canvas Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="h-12 border-b flex items-center justify-between px-4 bg-background shrink-0">
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">{template.brandId}</span>
            <ChevronRight className="h-3 w-3 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Templates</span>
            <ChevronRight className="h-3 w-3 text-muted-foreground" />
            <span className="text-sm font-medium">{template.name}</span>
            <Badge variant="outline" className="text-xs">TEMPLATE</Badge>
            <Badge variant="secondary" className="text-xs bg-orange-100 text-orange-700 hover:bg-orange-100">
              Not published
            </Badge>
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="gap-2">
              <Eye className="h-4 w-4" />
              View source
            </Button>
            
            <ExportDialog template={template} onExport={handleExport} />
            
            <Button size="sm" className="gap-2">
              Publish
            </Button>
          </div>
        </header>
        
        {/* Canvas */}
        <div className="flex-1 relative overflow-hidden bg-[#f5f5f5]">
          <CanvasRenderer
            rootNode={template.rootNode}
            selectedNodeId={selectedNodeId}
            onNodeClick={handleNodeClick}
            zoom={zoom}
            panOffset={panOffset}
            showGrid={showGrid}
          />
          
          {/* Zoom Controls */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-background rounded-full px-3 py-1.5 shadow-md border">
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleZoomOut}>
              <ZoomOut className="h-3.5 w-3.5" />
            </Button>
            <span className="text-xs w-12 text-center">{Math.round(zoom * 100)}%</span>
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleZoomIn}>
              <ZoomIn className="h-3.5 w-3.5" />
            </Button>
          </div>
          
          {/* Page Navigation */}
          <div className="absolute bottom-4 left-4 flex items-center gap-2 bg-background rounded-full px-3 py-1.5 shadow-md border">
            <Button variant="ghost" size="icon" className="h-6 w-6">
              <ChevronDown className="h-3.5 w-3.5 rotate-90" />
            </Button>
            <span className="text-xs">1 / 35</span>
            <Button variant="ghost" size="icon" className="h-6 w-6">
              <ChevronDown className="h-3.5 w-3.5 -rotate-90" />
            </Button>
          </div>
        </div>
      </div>
      
      {/* Right Sidebar - Properties */}
      <RightSidebar
        selectedNode={selectedNode}
        userRole={userRole}
        onUpdateNode={handleUpdateNode}
        onUpdateTextContent={handleUpdateTextContent}
        onUpdateImage={handleUpdateImage}
      />
    </div>
  )
}
