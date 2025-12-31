'use client'

import { useState, useMemo } from 'react'
import { 
  Type,
  Image as ImageIcon,
  Palette,
  Layout,
  Settings,
  Lock,
  Unlock,
  ChevronDown,
  Upload,
  FolderOpen,
  RefreshCw,
  Info,
  AlertCircle
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Slider } from '@/components/ui/slider'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  Alert,
  AlertDescription,
} from '@/components/ui/alert'
import { cn } from '@/lib/utils'
import type { 
  SceneNode, 
  TextNode, 
  ImageNode, 
  FrameNode,
  UserRole,
  LockableProperty,
  NodeGovernance,
  SizingMode,
  Alignment,
} from '@/types/studio'
import { DEFAULT_GOVERNANCE } from '@/types/studio'

// ============================================
// TYPES
// ============================================

interface EditorControlsProps {
  selectedNode: SceneNode | null
  userRole: UserRole
  onUpdateNode: (nodeId: string, updates: Partial<SceneNode>) => void
  onUpdateTextContent: (nodeId: string, content: string) => void
  onUpdateImage: (nodeId: string, assetId: string, src: string) => void
  onOpenAssetPicker?: () => void
  brandColors?: string[]
  brandFonts?: string[]
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function canEditProperty(
  governance: NodeGovernance | undefined,
  property: LockableProperty,
  userRole: UserRole
): boolean {
  const gov = governance || DEFAULT_GOVERNANCE
  
  // Viewers can't edit anything
  if (userRole === 'viewer') return false
  
  // Check if user role is allowed to edit
  if (!gov.editableBy.includes(userRole)) return false
  
  // Check if property is locked
  if (gov.lockedProps.includes(property)) {
    // Only owners and admins can edit locked properties
    return userRole === 'owner' || userRole === 'admin'
  }
  
  return true
}

function isContentOnlyMode(
  governance: NodeGovernance | undefined,
  userRole: UserRole
): boolean {
  const gov = governance || DEFAULT_GOVERNANCE
  
  // Owners and admins always have full access
  if (userRole === 'owner' || userRole === 'admin') return false
  
  return gov.isContentOnly
}

function getConstraint(
  governance: NodeGovernance | undefined,
  property: keyof NonNullable<NodeGovernance['constraints']>
): { min: number; max: number } | undefined {
  return governance?.constraints?.[property]
}

// ============================================
// LOCKED INDICATOR
// ============================================

function LockedIndicator({ locked }: { locked: boolean }) {
  if (!locked) return null
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Lock className="h-3.5 w-3.5 text-muted-foreground" />
        </TooltipTrigger>
        <TooltipContent>
          <p>Esta propriedade está bloqueada pelo dono da marca</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

// ============================================
// TEXT CONTENT EDITOR (MEMBER VIEW)
// ============================================

interface TextContentEditorProps {
  node: TextNode
  userRole: UserRole
  onUpdateContent: (content: string) => void
}

function TextContentEditor({ node, userRole, onUpdateContent }: TextContentEditorProps) {
  const [value, setValue] = useState(node.textProps.content)
  const governance = node.governance
  const canEdit = canEditProperty(governance, 'content', userRole)
  
  const handleChange = (newValue: string) => {
    setValue(newValue)
  }
  
  const handleBlur = () => {
    if (value !== node.textProps.content) {
      onUpdateContent(value)
    }
  }
  
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium flex items-center gap-2">
          <Type className="h-4 w-4" />
          Texto
        </Label>
        <LockedIndicator locked={!canEdit} />
      </div>
      
      {governance?.helpText && (
        <Alert variant="default" className="py-2">
          <Info className="h-4 w-4" />
          <AlertDescription className="text-xs">
            {governance.helpText}
          </AlertDescription>
        </Alert>
      )}
      
      <Textarea
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        onBlur={handleBlur}
        disabled={!canEdit}
        placeholder={governance?.placeholder || 'Digite o texto...'}
        className="min-h-[100px] resize-none"
      />
      
      {governance?.placeholder && value === '' && (
        <p className="text-xs text-muted-foreground">
          Exemplo: {governance.placeholder}
        </p>
      )}
    </div>
  )
}

// ============================================
// IMAGE CONTENT EDITOR (MEMBER VIEW)
// ============================================

interface ImageContentEditorProps {
  node: ImageNode
  userRole: UserRole
  onUpdateImage: (assetId: string, src: string) => void
  onOpenAssetPicker?: () => void
}

function ImageContentEditor({ 
  node, 
  userRole, 
  onUpdateImage, 
  onOpenAssetPicker 
}: ImageContentEditorProps) {
  const governance = node.governance
  const canEdit = canEditProperty(governance, 'image', userRole)
  const allowUpload = governance?.allowImageUpload ?? true
  const allowCrop = governance?.allowImageCrop ?? true
  
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium flex items-center gap-2">
          <ImageIcon className="h-4 w-4" />
          Imagem
        </Label>
        <LockedIndicator locked={!canEdit} />
      </div>
      
      {/* Image preview */}
      <div className="relative aspect-video bg-muted rounded-lg overflow-hidden border">
        {node.imageProps.src ? (
          <img 
            src={node.imageProps.src} 
            alt={node.imageProps.alt}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <ImageIcon className="h-8 w-8 text-muted-foreground/50" />
          </div>
        )}
      </div>
      
      {canEdit && (
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="flex-1"
            onClick={onOpenAssetPicker}
          >
            <FolderOpen className="h-4 w-4 mr-2" />
            Escolher do DAM
          </Button>
          
          {allowUpload && (
            <Button variant="outline" size="sm">
              <Upload className="h-4 w-4" />
            </Button>
          )}
        </div>
      )}
      
      {/* Image settings */}
      {canEdit && allowCrop && (
        <div className="pt-2 border-t">
          <Label className="text-xs text-muted-foreground">Ajuste de imagem</Label>
          <Select defaultValue={node.imageProps.objectFit}>
            <SelectTrigger className="mt-1 h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="FILL">Preencher</SelectItem>
              <SelectItem value="FIT">Ajustar</SelectItem>
              <SelectItem value="CROP">Cortar</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  )
}

// ============================================
// LAYOUT CONTROLS (OWNER VIEW)
// ============================================

interface LayoutControlsProps {
  node: SceneNode
  userRole: UserRole
  onUpdate: (updates: Partial<SceneNode>) => void
}

function LayoutControls({ node, userRole, onUpdate }: LayoutControlsProps) {
  const governance = node.governance
  
  const canEditGap = canEditProperty(governance, 'gap', userRole)
  const canEditPadding = canEditProperty(governance, 'padding', userRole)
  const canEditSizing = canEditProperty(governance, 'sizing', userRole)
  const canEditAlignment = canEditProperty(governance, 'alignment', userRole)
  
  const gapConstraint = getConstraint(governance, 'gap')
  const paddingConstraint = getConstraint(governance, 'padding')
  
  return (
    <div className="space-y-4">
      {/* Direction */}
      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground flex items-center gap-2">
          Direção
          <LockedIndicator locked={!canEditProperty(governance, 'layoutMode', userRole)} />
        </Label>
        <div className="flex gap-1">
          <Button 
            variant={node.autoLayout.layoutMode === 'HORIZONTAL' ? 'secondary' : 'outline'}
            size="sm"
            className="flex-1 text-xs"
            disabled={!canEditProperty(governance, 'layoutMode', userRole)}
          >
            Horizontal
          </Button>
          <Button 
            variant={node.autoLayout.layoutMode === 'VERTICAL' ? 'secondary' : 'outline'}
            size="sm"
            className="flex-1 text-xs"
            disabled={!canEditProperty(governance, 'layoutMode', userRole)}
          >
            Vertical
          </Button>
        </div>
      </div>
      
      {/* Sizing */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground flex items-center gap-2">
            Largura
            <LockedIndicator locked={!canEditSizing} />
          </Label>
          <Select 
            value={node.autoLayout.horizontalSizing} 
            disabled={!canEditSizing}
          >
            <SelectTrigger className="h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="FIXED">Fixo</SelectItem>
              <SelectItem value="HUG">Ajustar (Hug)</SelectItem>
              <SelectItem value="FILL">Preencher (Fill)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground flex items-center gap-2">
            Altura
            <LockedIndicator locked={!canEditSizing} />
          </Label>
          <Select 
            value={node.autoLayout.verticalSizing}
            disabled={!canEditSizing}
          >
            <SelectTrigger className="h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="FIXED">Fixo</SelectItem>
              <SelectItem value="HUG">Ajustar (Hug)</SelectItem>
              <SelectItem value="FILL">Preencher (Fill)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      {/* Gap */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-xs text-muted-foreground flex items-center gap-2">
            Espaçamento (Gap)
            <LockedIndicator locked={!canEditGap} />
          </Label>
          <span className="text-xs">{node.autoLayout.gap}px</span>
        </div>
        <Slider
          value={[node.autoLayout.gap]}
          min={gapConstraint?.min ?? 0}
          max={gapConstraint?.max ?? 100}
          step={1}
          disabled={!canEditGap}
        />
        {gapConstraint && (
          <p className="text-[10px] text-muted-foreground">
            Limite: {gapConstraint.min}-{gapConstraint.max}px
          </p>
        )}
      </div>
      
      {/* Padding */}
      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground flex items-center gap-2">
          Padding
          <LockedIndicator locked={!canEditPadding} />
        </Label>
        <div className="grid grid-cols-4 gap-1">
          {(['top', 'right', 'bottom', 'left'] as const).map((side) => (
            <div key={side} className="space-y-1">
              <Label className="text-[10px] text-muted-foreground uppercase">{side[0]}</Label>
              <Input
                type="number"
                value={node.autoLayout.padding[side]}
                className="h-8 text-xs text-center"
                disabled={!canEditPadding}
                min={paddingConstraint?.min ?? 0}
                max={paddingConstraint?.max ?? 200}
              />
            </div>
          ))}
        </div>
      </div>
      
      {/* Alignment */}
      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground flex items-center gap-2">
          Alinhamento
          <LockedIndicator locked={!canEditAlignment} />
        </Label>
        <div className="grid grid-cols-3 gap-1">
          {(['START', 'CENTER', 'END'] as const).map((align) => (
            <Button
              key={align}
              variant={node.autoLayout.primaryAxisAlignment === align ? 'secondary' : 'outline'}
              size="sm"
              className="text-xs"
              disabled={!canEditAlignment}
            >
              {align === 'START' ? 'Início' : align === 'CENTER' ? 'Centro' : 'Fim'}
            </Button>
          ))}
        </div>
      </div>
    </div>
  )
}

// ============================================
// STYLE CONTROLS (OWNER VIEW)
// ============================================

interface StyleControlsProps {
  node: SceneNode
  userRole: UserRole
  onUpdate: (updates: Partial<SceneNode>) => void
  brandColors?: string[]
  brandFonts?: string[]
}

function StyleControls({ 
  node, 
  userRole, 
  onUpdate,
  brandColors = [],
  brandFonts = []
}: StyleControlsProps) {
  const governance = node.governance
  const allowedColors = governance?.allowedColors || brandColors
  const allowedFonts = governance?.allowedFonts || brandFonts
  
  const isTextNode = node.type === 'TEXT'
  const textNode = node as TextNode
  
  return (
    <div className="space-y-4">
      {/* Colors */}
      {node.fills.length > 0 && (
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground flex items-center gap-2">
            <Palette className="h-3.5 w-3.5" />
            Cor de fundo
            <LockedIndicator locked={!canEditProperty(governance, 'fills', userRole)} />
          </Label>
          
          {allowedColors.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {allowedColors.map((color) => (
                <button
                  key={color}
                  className="w-8 h-8 rounded-md border-2 border-transparent hover:border-foreground/30 transition-colors"
                  style={{ backgroundColor: color }}
                  disabled={!canEditProperty(governance, 'fills', userRole)}
                />
              ))}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              {node.fills.map((fill, i) => (
                fill.type === 'SOLID' && (
                  <div
                    key={i}
                    className="w-8 h-8 rounded-md border"
                    style={{ 
                      backgroundColor: `rgba(${fill.color.r}, ${fill.color.g}, ${fill.color.b}, ${fill.color.a})` 
                    }}
                  />
                )
              ))}
            </div>
          )}
          
          {governance?.allowedColors && (
            <p className="text-[10px] text-muted-foreground">
              Cores restritas à paleta da marca
            </p>
          )}
        </div>
      )}
      
      {/* Text-specific styles */}
      {isTextNode && (
        <>
          {/* Font Family */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground flex items-center gap-2">
              Fonte
              <LockedIndicator locked={!canEditProperty(governance, 'fontFamily', userRole)} />
            </Label>
            <Select 
              value={textNode.textProps.style.fontFamily}
              disabled={!canEditProperty(governance, 'fontFamily', userRole)}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {allowedFonts.length > 0 ? (
                  allowedFonts.map((font) => (
                    <SelectItem key={font} value={font}>{font}</SelectItem>
                  ))
                ) : (
                  <>
                    <SelectItem value="Inter">Inter</SelectItem>
                    <SelectItem value="Roboto">Roboto</SelectItem>
                    <SelectItem value="Open Sans">Open Sans</SelectItem>
                  </>
                )}
              </SelectContent>
            </Select>
          </div>
          
          {/* Font Size */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs text-muted-foreground flex items-center gap-2">
                Tamanho
                <LockedIndicator locked={!canEditProperty(governance, 'fontSize', userRole)} />
              </Label>
              <span className="text-xs">{textNode.textProps.style.fontSize}px</span>
            </div>
            <Slider
              value={[textNode.textProps.style.fontSize]}
              min={getConstraint(governance, 'fontSize')?.min ?? 8}
              max={getConstraint(governance, 'fontSize')?.max ?? 120}
              step={1}
              disabled={!canEditProperty(governance, 'fontSize', userRole)}
            />
          </div>
          
          {/* Font Weight */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground flex items-center gap-2">
              Peso
              <LockedIndicator locked={!canEditProperty(governance, 'fontWeight', userRole)} />
            </Label>
            <Select 
              value={String(textNode.textProps.style.fontWeight)}
              disabled={!canEditProperty(governance, 'fontWeight', userRole)}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="300">Light</SelectItem>
                <SelectItem value="400">Regular</SelectItem>
                <SelectItem value="500">Medium</SelectItem>
                <SelectItem value="600">Semibold</SelectItem>
                <SelectItem value="700">Bold</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {/* Text Alignment */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground flex items-center gap-2">
              Alinhamento do texto
              <LockedIndicator locked={!canEditProperty(governance, 'textAlign', userRole)} />
            </Label>
            <div className="flex gap-1">
              {(['LEFT', 'CENTER', 'RIGHT'] as const).map((align) => (
                <Button
                  key={align}
                  variant={textNode.textProps.style.textAlign === align ? 'secondary' : 'outline'}
                  size="sm"
                  className="flex-1 text-xs"
                  disabled={!canEditProperty(governance, 'textAlign', userRole)}
                >
                  {align === 'LEFT' ? 'Esq' : align === 'CENTER' ? 'Centro' : 'Dir'}
                </Button>
              ))}
            </div>
          </div>
        </>
      )}
      
      {/* Opacity */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-xs text-muted-foreground flex items-center gap-2">
            Opacidade
            <LockedIndicator locked={!canEditProperty(governance, 'opacity', userRole)} />
          </Label>
          <span className="text-xs">{Math.round(node.opacity * 100)}%</span>
        </div>
        <Slider
          value={[node.opacity * 100]}
          min={0}
          max={100}
          step={1}
          disabled={!canEditProperty(governance, 'opacity', userRole)}
        />
      </div>
    </div>
  )
}

// ============================================
// MAIN COMPONENT
// ============================================

export function EditorControls({
  selectedNode,
  userRole,
  onUpdateNode,
  onUpdateTextContent,
  onUpdateImage,
  onOpenAssetPicker,
  brandColors = [],
  brandFonts = [],
}: EditorControlsProps) {
  const contentOnlyMode = selectedNode 
    ? isContentOnlyMode(selectedNode.governance, userRole) 
    : false
  
  // No selection
  if (!selectedNode) {
    return (
      <div className="h-full flex flex-col">
        <div className="p-4 border-b">
          <h2 className="font-semibold text-sm">Propriedades</h2>
        </div>
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="text-center">
            <Settings className="h-8 w-8 mx-auto text-muted-foreground/50 mb-2" />
            <p className="text-sm text-muted-foreground">
              Selecione um elemento no canvas para editar
            </p>
          </div>
        </div>
      </div>
    )
  }
  
  // Content-only mode for members
  if (contentOnlyMode) {
    return (
      <div className="h-full flex flex-col">
        <div className="p-4 border-b">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-sm">{selectedNode.name}</h2>
            <Badge variant="secondary" className="text-xs">
              <Lock className="h-3 w-3 mr-1" />
              Modo Template
            </Badge>
          </div>
        </div>
        
        <ScrollArea className="flex-1">
          <div className="p-4 space-y-4">
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription className="text-xs">
                Você pode editar apenas o conteúdo deste template. Layout e estilos são definidos pela marca.
              </AlertDescription>
            </Alert>
            
            {selectedNode.type === 'TEXT' && (
              <TextContentEditor
                node={selectedNode as TextNode}
                userRole={userRole}
                onUpdateContent={(content) => onUpdateTextContent(selectedNode.id, content)}
              />
            )}
            
            {selectedNode.type === 'IMAGE' && (
              <ImageContentEditor
                node={selectedNode as ImageNode}
                userRole={userRole}
                onUpdateImage={(assetId, src) => onUpdateImage(selectedNode.id, assetId, src)}
                onOpenAssetPicker={onOpenAssetPicker}
              />
            )}
            
            {selectedNode.type === 'FRAME' && (
              <p className="text-sm text-muted-foreground text-center py-4">
                Este é um contêiner. Selecione um elemento de texto ou imagem para editar.
              </p>
            )}
          </div>
        </ScrollArea>
      </div>
    )
  }
  
  // Full editor mode for owners/admins/editors
  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-sm truncate">{selectedNode.name}</h2>
          <Badge variant="outline" className="text-xs shrink-0">
            {selectedNode.type}
          </Badge>
        </div>
      </div>
      
      <Tabs defaultValue="content" className="flex-1 flex flex-col">
        <TabsList className="w-full rounded-none border-b justify-start px-4 h-10">
          <TabsTrigger value="content" className="text-xs">
            Conteúdo
          </TabsTrigger>
          <TabsTrigger value="layout" className="text-xs">
            Layout
          </TabsTrigger>
          <TabsTrigger value="style" className="text-xs">
            Estilo
          </TabsTrigger>
        </TabsList>
        
        <ScrollArea className="flex-1">
          <TabsContent value="content" className="p-4 space-y-4 mt-0">
            {selectedNode.type === 'TEXT' && (
              <TextContentEditor
                node={selectedNode as TextNode}
                userRole={userRole}
                onUpdateContent={(content) => onUpdateTextContent(selectedNode.id, content)}
              />
            )}
            
            {selectedNode.type === 'IMAGE' && (
              <ImageContentEditor
                node={selectedNode as ImageNode}
                userRole={userRole}
                onUpdateImage={(assetId, src) => onUpdateImage(selectedNode.id, assetId, src)}
                onOpenAssetPicker={onOpenAssetPicker}
              />
            )}
            
            {selectedNode.type === 'FRAME' && (
              <div className="text-center py-8">
                <Layout className="h-8 w-8 mx-auto text-muted-foreground/50 mb-2" />
                <p className="text-sm text-muted-foreground">
                  Frames não têm conteúdo editável.
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Use as abas Layout e Estilo para configurar.
                </p>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="layout" className="p-4 mt-0">
            <LayoutControls
              node={selectedNode}
              userRole={userRole}
              onUpdate={(updates) => onUpdateNode(selectedNode.id, updates)}
            />
          </TabsContent>
          
          <TabsContent value="style" className="p-4 mt-0">
            <StyleControls
              node={selectedNode}
              userRole={userRole}
              onUpdate={(updates) => onUpdateNode(selectedNode.id, updates)}
              brandColors={brandColors}
              brandFonts={brandFonts}
            />
          </TabsContent>
        </ScrollArea>
      </Tabs>
    </div>
  )
}

export default EditorControls
