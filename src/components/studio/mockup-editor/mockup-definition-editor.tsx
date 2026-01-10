'use client'

/**
 * MockupDefinitionEditor
 * 
 * Editor completo para criar/editar definições de mockup.
 * Inclui upload de imagens, edição de pontos e preview.
 */

import { useState, useCallback } from 'react'
import { cn } from '@/lib/utils'
import { MockupPointEditor } from './mockup-point-editor'
import type { MockupDefinition, Quad, MockupCategory, MockupBlendMode } from '@/lib/studio/mockups'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Slider } from '@/components/ui/slider'
import { Upload, Copy, Download, Eye, Settings, Layers } from 'lucide-react'
import { useDropzone } from 'react-dropzone'

interface MockupDefinitionEditorProps {
  /** Definição inicial para edição */
  initialDefinition?: Partial<MockupDefinition>
  /** Callback quando definição é salva */
  onSave?: (definition: MockupDefinition) => void
  /** Callback quando definição muda */
  onChange?: (definition: Partial<MockupDefinition>) => void
  /** Classe CSS adicional */
  className?: string
}

const CATEGORIES: { value: MockupCategory; label: string }[] = [
  { value: 'business-card', label: 'Cartão de Visita' },
  { value: 'stationery', label: 'Papelaria' },
  { value: 'billboard', label: 'Outdoor' },
  { value: 'poster', label: 'Poster' },
  { value: 'device', label: 'Dispositivo' },
  { value: 'apparel', label: 'Vestuário' },
  { value: 'packaging', label: 'Embalagem' },
  { value: 'social-media', label: 'Social Media' },
]

const BLEND_MODES: { value: MockupBlendMode; label: string }[] = [
  { value: 'normal', label: 'Normal' },
  { value: 'multiply', label: 'Multiply' },
  { value: 'screen', label: 'Screen' },
  { value: 'overlay', label: 'Overlay' },
  { value: 'soft-light', label: 'Soft Light' },
  { value: 'hard-light', label: 'Hard Light' },
]

function generateId(): string {
  return `mockup-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

export function MockupDefinitionEditor({
  initialDefinition,
  onSave,
  onChange,
  className,
}: MockupDefinitionEditorProps) {
  const [definition, setDefinition] = useState<Partial<MockupDefinition>>({
    id: generateId(),
    name: '',
    description: '',
    category: 'business-card',
    tags: [],
    canvasSize: { width: 1200, height: 800 },
    layers: {
      base: { src: '', opacity: 1 },
    },
    insertAreas: [
      {
        quad: {
          topLeft: { x: 200, y: 150 },
          topRight: { x: 600, y: 150 },
          bottomRight: { x: 600, y: 450 },
          bottomLeft: { x: 200, y: 450 },
        },
        expectedSize: { width: 400, height: 300 },
        opacity: 1,
      },
    ],
    ...initialDefinition,
  })
  
  const [activeTab, setActiveTab] = useState('basic')
  const [baseImagePreview, setBaseImagePreview] = useState<string>(
    initialDefinition?.layers?.base?.src ?? ''
  )
  const [overlayImagePreview, setOverlayImagePreview] = useState<string>(
    initialDefinition?.layers?.overlay?.src ?? ''
  )
  
  // Update definition and notify
  const updateDefinition = useCallback((updates: Partial<MockupDefinition>) => {
    setDefinition((prev) => {
      const newDef = { ...prev, ...updates }
      onChange?.(newDef)
      return newDef
    })
  }, [onChange])
  
  // Handle base image upload
  const onDropBase = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (!file) return
    
    const reader = new FileReader()
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string
      setBaseImagePreview(dataUrl)
      
      // Get image dimensions
      const img = new Image()
      img.onload = () => {
        updateDefinition({
          canvasSize: { width: img.naturalWidth, height: img.naturalHeight },
          layers: {
            ...definition.layers,
            base: { ...definition.layers?.base, src: dataUrl, opacity: 1 },
          },
        })
      }
      img.src = dataUrl
    }
    reader.readAsDataURL(file)
  }, [definition.layers, updateDefinition])
  
  // Handle overlay image upload
  const onDropOverlay = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (!file) return
    
    const reader = new FileReader()
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string
      setOverlayImagePreview(dataUrl)
      updateDefinition({
        layers: {
          ...definition.layers,
          base: definition.layers?.base ?? { src: '', opacity: 1 },
          overlay: { src: dataUrl, opacity: 0.5, blendMode: 'multiply' },
        },
      })
    }
    reader.readAsDataURL(file)
  }, [definition.layers, updateDefinition])
  
  const { getRootProps: getBaseRootProps, getInputProps: getBaseInputProps } = useDropzone({
    onDrop: onDropBase,
    accept: { 'image/*': ['.png', '.jpg', '.jpeg', '.webp'] },
    maxFiles: 1,
  })
  
  const { getRootProps: getOverlayRootProps, getInputProps: getOverlayInputProps } = useDropzone({
    onDrop: onDropOverlay,
    accept: { 'image/*': ['.png', '.webp'] },
    maxFiles: 1,
  })
  
  // Handle quad change
  const handleQuadChange = useCallback((quad: Quad) => {
    updateDefinition({
      insertAreas: [
        {
          ...definition.insertAreas?.[0],
          quad,
          expectedSize: definition.insertAreas?.[0]?.expectedSize ?? { width: 400, height: 300 },
          opacity: definition.insertAreas?.[0]?.opacity ?? 1,
        },
      ],
    })
  }, [definition.insertAreas, updateDefinition])
  
  // Generate JSON output
  const generateJSON = useCallback(() => {
    const output: MockupDefinition = {
      id: definition.id ?? generateId(),
      name: definition.name ?? 'Untitled Mockup',
      description: definition.description,
      category: definition.category ?? 'business-card',
      tags: definition.tags,
      canvasSize: definition.canvasSize ?? { width: 1200, height: 800 },
      layers: {
        base: {
          src: `/mockups/${definition.id}/base.jpg`,
          opacity: definition.layers?.base?.opacity ?? 1,
        },
        ...(definition.layers?.overlay && {
          overlay: {
            src: `/mockups/${definition.id}/overlay.png`,
            opacity: definition.layers.overlay.opacity ?? 0.5,
            blendMode: definition.layers.overlay.blendMode ?? 'multiply',
          },
        }),
      },
      insertAreas: definition.insertAreas ?? [],
    }
    return JSON.stringify(output, null, 2)
  }, [definition])
  
  // Copy JSON to clipboard
  const copyJSON = useCallback(() => {
    navigator.clipboard.writeText(generateJSON())
  }, [generateJSON])
  
  // Save definition
  const handleSave = useCallback(() => {
    if (!definition.name || !definition.layers?.base?.src) {
      alert('Por favor, preencha o nome e faça upload da imagem base.')
      return
    }
    
    const fullDefinition: MockupDefinition = {
      id: definition.id ?? generateId(),
      name: definition.name,
      description: definition.description,
      category: definition.category ?? 'business-card',
      tags: definition.tags,
      canvasSize: definition.canvasSize ?? { width: 1200, height: 800 },
      layers: {
        base: definition.layers.base,
        overlay: definition.layers.overlay,
      },
      insertAreas: definition.insertAreas ?? [],
    }
    
    onSave?.(fullDefinition)
  }, [definition, onSave])
  
  return (
    <div className={cn('grid gap-6 lg:grid-cols-[1fr_400px]', className)}>
      {/* Editor de pontos */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Editor de Pontos
          </CardTitle>
          <CardDescription>
            Arraste os pontos para definir a área de inserção do template
          </CardDescription>
        </CardHeader>
        <CardContent>
          {baseImagePreview ? (
            <MockupPointEditor
              backgroundImage={baseImagePreview}
              initialQuad={definition.insertAreas?.[0]?.quad}
              onQuadChange={handleQuadChange}
              className="h-[500px]"
            />
          ) : (
            <div
              {...getBaseRootProps()}
              className="h-[500px] border-2 border-dashed rounded-lg flex flex-col items-center justify-center gap-4 cursor-pointer hover:border-primary/50 transition-colors"
            >
              <input {...getBaseInputProps()} />
              <Upload className="h-12 w-12 text-muted-foreground" />
              <div className="text-center">
                <p className="font-medium">Arraste uma imagem ou clique para selecionar</p>
                <p className="text-sm text-muted-foreground">PNG, JPG ou WebP</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Painel de configurações */}
      <div className="space-y-4">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="basic" className="gap-1.5">
              <Settings className="h-4 w-4" />
              Básico
            </TabsTrigger>
            <TabsTrigger value="layers" className="gap-1.5">
              <Layers className="h-4 w-4" />
              Camadas
            </TabsTrigger>
            <TabsTrigger value="output" className="gap-1.5">
              <Copy className="h-4 w-4" />
              JSON
            </TabsTrigger>
          </TabsList>
          
          {/* Tab: Básico */}
          <TabsContent value="basic" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome do Mockup</Label>
              <Input
                id="name"
                value={definition.name ?? ''}
                onChange={(e) => updateDefinition({ name: e.target.value })}
                placeholder="Ex: Cartão de Visita Premium"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={definition.description ?? ''}
                onChange={(e) => updateDefinition({ description: e.target.value })}
                placeholder="Descrição opcional do mockup"
                rows={2}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="category">Categoria</Label>
              <Select
                value={definition.category}
                onValueChange={(v) => updateDefinition({ category: v as MockupCategory })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="tags">Tags (separadas por vírgula)</Label>
              <Input
                id="tags"
                value={definition.tags?.join(', ') ?? ''}
                onChange={(e) => updateDefinition({ 
                  tags: e.target.value.split(',').map(t => t.trim()).filter(Boolean) 
                })}
                placeholder="elegante, minimalista, premium"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Largura Esperada</Label>
                <Input
                  type="number"
                  value={definition.insertAreas?.[0]?.expectedSize?.width ?? 400}
                  onChange={(e) => updateDefinition({
                    insertAreas: [{
                      ...definition.insertAreas?.[0],
                      quad: definition.insertAreas?.[0]?.quad ?? {
                        topLeft: { x: 0, y: 0 },
                        topRight: { x: 100, y: 0 },
                        bottomRight: { x: 100, y: 100 },
                        bottomLeft: { x: 0, y: 100 },
                      },
                      expectedSize: {
                        width: parseInt(e.target.value) || 400,
                        height: definition.insertAreas?.[0]?.expectedSize?.height ?? 300,
                      },
                      opacity: definition.insertAreas?.[0]?.opacity ?? 1,
                    }],
                  })}
                />
              </div>
              <div className="space-y-2">
                <Label>Altura Esperada</Label>
                <Input
                  type="number"
                  value={definition.insertAreas?.[0]?.expectedSize?.height ?? 300}
                  onChange={(e) => updateDefinition({
                    insertAreas: [{
                      ...definition.insertAreas?.[0],
                      quad: definition.insertAreas?.[0]?.quad ?? {
                        topLeft: { x: 0, y: 0 },
                        topRight: { x: 100, y: 0 },
                        bottomRight: { x: 100, y: 100 },
                        bottomLeft: { x: 0, y: 100 },
                      },
                      expectedSize: {
                        width: definition.insertAreas?.[0]?.expectedSize?.width ?? 400,
                        height: parseInt(e.target.value) || 300,
                      },
                      opacity: definition.insertAreas?.[0]?.opacity ?? 1,
                    }],
                  })}
                />
              </div>
            </div>
          </TabsContent>
          
          {/* Tab: Camadas */}
          <TabsContent value="layers" className="space-y-4 mt-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Imagem Base</CardTitle>
              </CardHeader>
              <CardContent>
                {baseImagePreview ? (
                  <div className="space-y-2">
                    <div className="relative aspect-video rounded overflow-hidden bg-muted">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={baseImagePreview}
                        alt="Base"
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => {
                        setBaseImagePreview('')
                        updateDefinition({
                          layers: { ...definition.layers, base: { src: '', opacity: 1 } },
                        })
                      }}
                    >
                      Remover
                    </Button>
                  </div>
                ) : (
                  <div
                    {...getBaseRootProps()}
                    className="border-2 border-dashed rounded-lg p-4 text-center cursor-pointer hover:border-primary/50"
                  >
                    <input {...getBaseInputProps()} />
                    <Upload className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">Upload imagem base</p>
                  </div>
                )}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Overlay (Sombras/Luz)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {overlayImagePreview ? (
                  <div className="space-y-2">
                    <div className="relative aspect-video rounded overflow-hidden bg-zinc-800">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={overlayImagePreview}
                        alt="Overlay"
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => {
                        setOverlayImagePreview('')
                        updateDefinition({
                          layers: { 
                            base: definition.layers?.base ?? { src: '', opacity: 1 },
                            overlay: undefined,
                          },
                        })
                      }}
                    >
                      Remover
                    </Button>
                  </div>
                ) : (
                  <div
                    {...getOverlayRootProps()}
                    className="border-2 border-dashed rounded-lg p-4 text-center cursor-pointer hover:border-primary/50"
                  >
                    <input {...getOverlayInputProps()} />
                    <Upload className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">Upload overlay (PNG transparente)</p>
                  </div>
                )}
                
                {definition.layers?.overlay && (
                  <>
                    <div className="space-y-2">
                      <Label className="text-xs">Blend Mode</Label>
                      <Select
                        value={definition.layers.overlay.blendMode ?? 'multiply'}
                        onValueChange={(v) => updateDefinition({
                          layers: {
                            ...definition.layers,
                            base: definition.layers?.base ?? { src: '', opacity: 1 },
                            overlay: {
                              ...definition.layers?.overlay,
                              src: definition.layers?.overlay?.src ?? '',
                              blendMode: v as MockupBlendMode,
                            },
                          },
                        })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {BLEND_MODES.map((mode) => (
                            <SelectItem key={mode.value} value={mode.value}>
                              {mode.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label className="text-xs">
                        Opacidade: {Math.round((definition.layers.overlay.opacity ?? 0.5) * 100)}%
                      </Label>
                      <Slider
                        value={[(definition.layers.overlay.opacity ?? 0.5) * 100]}
                        onValueChange={([v]) => updateDefinition({
                          layers: {
                            ...definition.layers,
                            base: definition.layers?.base ?? { src: '', opacity: 1 },
                            overlay: {
                              ...definition.layers?.overlay,
                              src: definition.layers?.overlay?.src ?? '',
                              opacity: v / 100,
                            },
                          },
                        })}
                        min={0}
                        max={100}
                        step={5}
                      />
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Tab: JSON Output */}
          <TabsContent value="output" className="space-y-4 mt-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Definição JSON</Label>
                <Button variant="ghost" size="sm" onClick={copyJSON}>
                  <Copy className="h-4 w-4 mr-1" />
                  Copiar
                </Button>
              </div>
              <pre className="bg-zinc-900 text-zinc-100 p-4 rounded-lg text-xs overflow-auto max-h-[400px]">
                {generateJSON()}
              </pre>
            </div>
          </TabsContent>
        </Tabs>
        
        {/* Actions */}
        <div className="flex gap-2">
          <Button onClick={handleSave} className="flex-1">
            <Download className="h-4 w-4 mr-2" />
            Salvar Mockup
          </Button>
        </div>
      </div>
    </div>
  )
}
