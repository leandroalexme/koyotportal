'use client'

import { useState, useMemo } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Layers,
  Settings,
  Undo2,
  Redo2,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Download,
  Share2,
  MoreHorizontal,
  Type,
  Image as ImageIcon,
  Square,
  Circle,
  Minus,
  Frame,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignStartVertical,
  AlignCenterVertical,
  AlignEndVertical,
  ArrowRight,
  ArrowDown,
  Grip,
  Trash2,
  Copy,
  Move,
  MousePointer2,
  Hand,
  PenTool,
  Sparkles,
  Save,
  Play
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Slider } from '@/components/ui/slider'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { cn } from '@/lib/utils'
import { getMockTemplateById, MOCK_TEMPLATES } from '@/lib/studio/mocks'
import { 
  type SceneNode, 
  type FrameNode,
  type Template,
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
  onToggleVisibility: (id: string) => void
  onToggleLock: (id: string) => void
}

function LayerItem({ 
  node, 
  depth, 
  selectedId, 
  onSelect, 
  onToggleVisibility, 
  onToggleLock 
}: LayerItemProps) {
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
          selectedId === node.id ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
        )}
        style={{ paddingLeft: `${depth * 12 + 8}px` }}
        onClick={() => onSelect(node.id)}
      >
        {/* Expand/Collapse */}
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
        
        {/* Icon */}
        <span className="shrink-0">{getIcon()}</span>
        
        {/* Name */}
        <span className="flex-1 truncate text-xs">{node.name}</span>
        
        {/* Actions */}
        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={(e) => {
              e.stopPropagation()
              onToggleVisibility(node.id)
            }}
            className="p-0.5 hover:bg-black/10 rounded"
          >
            {node.visible ? (
              <Eye className="h-3 w-3" />
            ) : (
              <EyeOff className="h-3 w-3 opacity-50" />
            )}
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation()
              onToggleLock(node.id)
            }}
            className="p-0.5 hover:bg-black/10 rounded"
          >
            {node.locked ? (
              <Lock className="h-3 w-3" />
            ) : (
              <Unlock className="h-3 w-3 opacity-50" />
            )}
          </button>
        </div>
      </div>
      
      {/* Children */}
      {hasChildren && expanded && (
        <div>
          {(node as FrameNode).children.map((child) => (
            <LayerItem
              key={child.id}
              node={child}
              depth={depth + 1}
              selectedId={selectedId}
              onSelect={onSelect}
              onToggleVisibility={onToggleVisibility}
              onToggleLock={onToggleLock}
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
  const handleToggleVisibility = (id: string) => {
    console.log('Toggle visibility:', id)
  }
  
  const handleToggleLock = (id: string) => {
    console.log('Toggle lock:', id)
  }
  
  return (
    <div className="flex flex-col h-full">
      <div className="p-3 border-b flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Layers className="h-4 w-4" />
          <span className="font-medium text-sm">Layers</span>
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
            onToggleVisibility={handleToggleVisibility}
            onToggleLock={handleToggleLock}
          />
        </div>
      </ScrollArea>
    </div>
  )
}

// ============================================
// PROPERTIES PANEL
// ============================================

interface PropertiesPanelProps {
  selectedNode: SceneNode | null
}

function PropertiesPanel({ selectedNode }: PropertiesPanelProps) {
  if (!selectedNode) {
    return (
      <div className="flex flex-col h-full">
        <div className="p-3 border-b flex items-center gap-2">
          <Settings className="h-4 w-4" />
          <span className="font-medium text-sm">Properties</span>
        </div>
        <div className="flex-1 flex items-center justify-center p-4">
          <p className="text-sm text-muted-foreground text-center">
            Select a layer to view its properties
          </p>
        </div>
      </div>
    )
  }
  
  return (
    <div className="flex flex-col h-full">
      <div className="p-3 border-b flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Settings className="h-4 w-4" />
          <span className="font-medium text-sm">Properties</span>
        </div>
        <Badge variant="outline" className="text-xs">
          {selectedNode.type}
        </Badge>
      </div>
      
      <ScrollArea className="flex-1">
        <div className="p-3 space-y-4">
          {/* Position & Size */}
          <Collapsible defaultOpen>
            <CollapsibleTrigger className="flex items-center justify-between w-full py-1">
              <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Transform
              </span>
              <ChevronDown className="h-3.5 w-3.5" />
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-2 space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs text-muted-foreground">X</Label>
                  <Input 
                    type="number" 
                    value={selectedNode.position.x} 
                    className="h-8 text-xs"
                    readOnly
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Y</Label>
                  <Input 
                    type="number" 
                    value={selectedNode.position.y} 
                    className="h-8 text-xs"
                    readOnly
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">W</Label>
                  <Input 
                    type="number" 
                    value={selectedNode.size.width} 
                    className="h-8 text-xs"
                    readOnly
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">H</Label>
                  <Input 
                    type="number" 
                    value={selectedNode.size.height} 
                    className="h-8 text-xs"
                    readOnly
                  />
                </div>
              </div>
              
              <div>
                <Label className="text-xs text-muted-foreground">Rotation</Label>
                <div className="flex items-center gap-2">
                  <Slider 
                    value={[selectedNode.rotation]} 
                    max={360} 
                    step={1}
                    className="flex-1"
                  />
                  <Input 
                    type="number" 
                    value={selectedNode.rotation} 
                    className="h-8 w-16 text-xs"
                    readOnly
                  />
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>
          
          <Separator />
          
          {/* Auto Layout */}
          <Collapsible defaultOpen>
            <CollapsibleTrigger className="flex items-center justify-between w-full py-1">
              <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Auto Layout
              </span>
              <ChevronDown className="h-3.5 w-3.5" />
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-2 space-y-3">
              {/* Layout Direction */}
              <div>
                <Label className="text-xs text-muted-foreground">Direction</Label>
                <div className="flex gap-1 mt-1">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button 
                          variant={selectedNode.autoLayout.layoutMode === 'HORIZONTAL' ? 'secondary' : 'outline'} 
                          size="icon" 
                          className="h-8 w-8"
                        >
                          <ArrowRight className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Horizontal</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button 
                          variant={selectedNode.autoLayout.layoutMode === 'VERTICAL' ? 'secondary' : 'outline'} 
                          size="icon" 
                          className="h-8 w-8"
                        >
                          <ArrowDown className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Vertical</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button 
                          variant={selectedNode.autoLayout.layoutMode === 'NONE' ? 'secondary' : 'outline'} 
                          size="icon" 
                          className="h-8 w-8"
                        >
                          <Grip className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>None (Absolute)</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>
              
              {/* Sizing */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs text-muted-foreground">Horizontal</Label>
                  <Select value={selectedNode.autoLayout.horizontalSizing}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="FIXED">Fixed</SelectItem>
                      <SelectItem value="HUG">Hug</SelectItem>
                      <SelectItem value="FILL">Fill</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Vertical</Label>
                  <Select value={selectedNode.autoLayout.verticalSizing}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="FIXED">Fixed</SelectItem>
                      <SelectItem value="HUG">Hug</SelectItem>
                      <SelectItem value="FILL">Fill</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              {/* Gap */}
              <div>
                <Label className="text-xs text-muted-foreground">Gap</Label>
                <Input 
                  type="number" 
                  value={selectedNode.autoLayout.gap} 
                  className="h-8 text-xs"
                  readOnly
                />
              </div>
              
              {/* Padding */}
              <div>
                <Label className="text-xs text-muted-foreground">Padding</Label>
                <div className="grid grid-cols-4 gap-1 mt-1">
                  <Input 
                    type="number" 
                    value={selectedNode.autoLayout.padding.top} 
                    className="h-8 text-xs text-center"
                    placeholder="T"
                    readOnly
                  />
                  <Input 
                    type="number" 
                    value={selectedNode.autoLayout.padding.right} 
                    className="h-8 text-xs text-center"
                    placeholder="R"
                    readOnly
                  />
                  <Input 
                    type="number" 
                    value={selectedNode.autoLayout.padding.bottom} 
                    className="h-8 text-xs text-center"
                    placeholder="B"
                    readOnly
                  />
                  <Input 
                    type="number" 
                    value={selectedNode.autoLayout.padding.left} 
                    className="h-8 text-xs text-center"
                    placeholder="L"
                    readOnly
                  />
                </div>
              </div>
              
              {/* Alignment */}
              <div>
                <Label className="text-xs text-muted-foreground">Alignment</Label>
                <div className="flex gap-1 mt-1">
                  <Button variant="outline" size="icon" className="h-8 w-8">
                    <AlignStartVertical className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="icon" className="h-8 w-8">
                    <AlignCenterVertical className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="icon" className="h-8 w-8">
                    <AlignEndVertical className="h-4 w-4" />
                  </Button>
                  <Separator orientation="vertical" className="h-8" />
                  <Button variant="outline" size="icon" className="h-8 w-8">
                    <AlignLeft className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="icon" className="h-8 w-8">
                    <AlignCenter className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="icon" className="h-8 w-8">
                    <AlignRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>
          
          <Separator />
          
          {/* Fill */}
          <Collapsible defaultOpen>
            <CollapsibleTrigger className="flex items-center justify-between w-full py-1">
              <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Fill
              </span>
              <ChevronDown className="h-3.5 w-3.5" />
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-2 space-y-2">
              {selectedNode.fills.length === 0 ? (
                <p className="text-xs text-muted-foreground">No fills</p>
              ) : (
                selectedNode.fills.map((fill, index) => (
                  <div key={index} className="flex items-center gap-2">
                    {fill.type === 'SOLID' && (
                      <>
                        <div 
                          className="w-8 h-8 rounded border"
                          style={{ 
                            backgroundColor: `rgba(${fill.color.r}, ${fill.color.g}, ${fill.color.b}, ${fill.color.a})` 
                          }}
                        />
                        <span className="text-xs text-muted-foreground">
                          rgba({fill.color.r}, {fill.color.g}, {fill.color.b}, {fill.color.a})
                        </span>
                      </>
                    )}
                    {fill.type.startsWith('GRADIENT') && (
                      <span className="text-xs">Gradient</span>
                    )}
                  </div>
                ))
              )}
              <Button variant="outline" size="sm" className="w-full text-xs">
                Add Fill
              </Button>
            </CollapsibleContent>
          </Collapsible>
          
          <Separator />
          
          {/* Opacity */}
          <div>
            <Label className="text-xs text-muted-foreground">Opacity</Label>
            <div className="flex items-center gap-2 mt-1">
              <Slider 
                value={[selectedNode.opacity * 100]} 
                max={100} 
                step={1}
                className="flex-1"
              />
              <Input 
                type="number" 
                value={Math.round(selectedNode.opacity * 100)} 
                className="h-8 w-16 text-xs"
                readOnly
              />
            </div>
          </div>
        </div>
      </ScrollArea>
    </div>
  )
}

// ============================================
// TOOLBAR
// ============================================

interface ToolbarProps {
  activeTool: string
  onToolChange: (tool: string) => void
}

function Toolbar({ activeTool, onToolChange }: ToolbarProps) {
  const tools = [
    { id: 'select', icon: MousePointer2, label: 'Select (V)' },
    { id: 'hand', icon: Hand, label: 'Hand (H)' },
    { id: 'frame', icon: Frame, label: 'Frame (F)' },
    { id: 'rectangle', icon: Square, label: 'Rectangle (R)' },
    { id: 'ellipse', icon: Circle, label: 'Ellipse (O)' },
    { id: 'line', icon: Minus, label: 'Line (L)' },
    { id: 'text', icon: Type, label: 'Text (T)' },
    { id: 'image', icon: ImageIcon, label: 'Image' },
    { id: 'pen', icon: PenTool, label: 'Pen (P)' },
  ]
  
  return (
    <div className="flex items-center gap-0.5 p-1 bg-muted/50 rounded-lg">
      {tools.map((tool) => (
        <TooltipProvider key={tool.id}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={activeTool === tool.id ? 'secondary' : 'ghost'}
                size="icon"
                className="h-8 w-8"
                onClick={() => onToolChange(tool.id)}
              >
                <tool.icon className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>{tool.label}</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ))}
    </div>
  )
}

// ============================================
// CANVAS (PLACEHOLDER)
// ============================================

interface CanvasProps {
  template: Template
  zoom: number
  selectedId: string | null
  onSelect: (id: string | null) => void
}

function Canvas({ template, zoom, selectedId, onSelect }: CanvasProps) {
  const formatInfo = TEMPLATE_FORMATS[template.format]
  
  return (
    <div 
      className="flex-1 bg-muted/30 overflow-auto flex items-center justify-center"
      onClick={() => onSelect(null)}
    >
      {/* Canvas container with zoom */}
      <div 
        className="relative bg-white shadow-2xl"
        style={{
          width: formatInfo.width * zoom,
          height: formatInfo.height * zoom,
          transform: `scale(1)`,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Placeholder - will be replaced with CanvasKit Skia */}
        <div className="absolute inset-0 flex items-center justify-center border-2 border-dashed border-muted-foreground/20">
          <div className="text-center">
            <div className="text-6xl mb-4">🎨</div>
            <p className="text-muted-foreground font-medium">Canvas Area</p>
            <p className="text-sm text-muted-foreground/60 mt-1">
              {formatInfo.width} × {formatInfo.height}px
            </p>
            <Badge variant="outline" className="mt-3">
              CanvasKit Skia (Coming Soon)
            </Badge>
          </div>
        </div>
        
        {/* Grid overlay */}
        <div 
          className="absolute inset-0 pointer-events-none opacity-10"
          style={{
            backgroundImage: `
              linear-gradient(to right, #000 1px, transparent 1px),
              linear-gradient(to bottom, #000 1px, transparent 1px)
            `,
            backgroundSize: `${20 * zoom}px ${20 * zoom}px`,
          }}
        />
      </div>
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
  const [activeTool, setActiveTool] = useState('select')
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)
  const [leftPanelOpen, setLeftPanelOpen] = useState(true)
  const [rightPanelOpen, setRightPanelOpen] = useState(true)
  
  // Get template (using mocks for now)
  const template = useMemo(() => {
    return getMockTemplateById(templateId) || MOCK_TEMPLATES[0]
  }, [templateId])
  
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
  
  if (!template) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p>Template not found</p>
      </div>
    )
  }
  
  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Top Bar */}
      <header className="h-12 border-b flex items-center justify-between px-4 bg-background">
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
              {TEMPLATE_FORMATS[template.format].name}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Undo/Redo */}
          <div className="flex items-center gap-0.5">
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <Undo2 className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <Redo2 className="h-4 w-4" />
            </Button>
          </div>
          
          <Separator orientation="vertical" className="h-6" />
          
          {/* Toolbar */}
          <Toolbar activeTool={activeTool} onToolChange={setActiveTool} />
          
          <Separator orientation="vertical" className="h-6" />
          
          {/* Zoom */}
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
          
          {/* Actions */}
          <Button variant="ghost" size="sm" className="gap-2">
            <Sparkles className="h-4 w-4" />
            AI Assist
          </Button>
          
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <Play className="h-4 w-4" />
          </Button>
          
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <Share2 className="h-4 w-4" />
          </Button>
          
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <Download className="h-4 w-4" />
          </Button>
          
          <Button size="sm" className="gap-2">
            <Save className="h-4 w-4" />
            Save
          </Button>
        </div>
      </header>
      
      {/* Main Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Layers */}
        <div className={cn(
          'border-r bg-background transition-all duration-200',
          leftPanelOpen ? 'w-64' : 'w-0'
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
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 h-8 w-4 rounded-l-none"
          onClick={() => setLeftPanelOpen(!leftPanelOpen)}
        >
          {leftPanelOpen ? <ChevronLeft className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
        </Button>
        
        {/* Canvas */}
        <Canvas
          template={template}
          zoom={zoom}
          selectedId={selectedNodeId}
          onSelect={setSelectedNodeId}
        />
        
        {/* Toggle Right Panel */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 h-8 w-4 rounded-r-none"
          onClick={() => setRightPanelOpen(!rightPanelOpen)}
        >
          {rightPanelOpen ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />}
        </Button>
        
        {/* Right Panel - Properties */}
        <div className={cn(
          'border-l bg-background transition-all duration-200',
          rightPanelOpen ? 'w-72' : 'w-0'
        )}>
          {rightPanelOpen && (
            <PropertiesPanel selectedNode={selectedNode} />
          )}
        </div>
      </div>
    </div>
  )
}
