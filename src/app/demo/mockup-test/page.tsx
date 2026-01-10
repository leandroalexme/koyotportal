'use client'

import { useState, useRef } from 'react'
import { MockupUploader } from '@/components/studio/mockup-uploader'
import { CanvasKitMockupRenderer } from '@/lib/studio/mockup-engine/render/canvaskit-mockup-renderer'
import type { MockupTemplate } from '@/lib/studio/mockup-engine'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Loader2, Image as ImageIcon, Layers, Play, Download } from 'lucide-react'
import { Label } from '@/components/ui/label'

// Mock Templates do usuário
const MOCK_USER_TEMPLATES = [
  {
    id: 'tmpl_1',
    name: 'Instagram Story Sale',
    width: 1080,
    height: 1920,
    thumbnail: 'https://placehold.co/108x192/FF6B6B/FFFFFF/png?text=Story',
    preview: 'https://placehold.co/1080x1920/FF6B6B/FFFFFF/png?text=SALE+50%25',
  },
  {
    id: 'tmpl_2',
    name: 'Business Card Clean',
    width: 1050,
    height: 600,
    thumbnail: 'https://placehold.co/175x100/4ECDC4/FFFFFF/png?text=Card',
    preview: 'https://placehold.co/1050x600/4ECDC4/FFFFFF/png?text=John+Doe%0ACEO',
  },
  {
    id: 'tmpl_3',
    name: 'Post Quadrado',
    width: 1080,
    height: 1080,
    thumbnail: 'https://placehold.co/108x108/FFE66D/333333/png?text=Post',
    preview: 'https://placehold.co/1080x1080/FFE66D/333333/png?text=Awesome+Post',
  },
]

export default function MockupTestPage() {
  const [template, setTemplate] = useState<MockupTemplate | null>(null)
  const [layerImages, setLayerImages] = useState<Map<string, string>>(new Map())
  const [renderedImage, setRenderedImage] = useState<string | null>(null)
  const [isRendering, setIsRendering] = useState(false)
  const [renderTime, setRenderTime] = useState<number | null>(null)
  const [testDesign, setTestDesign] = useState<HTMLImageElement | null>(null)
  const [activeTab, setActiveTab] = useState('info')
  const [selectedUserTemplateId, setSelectedUserTemplateId] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const rendererRef = useRef<CanvasKitMockupRenderer | null>(null)

  const handleSelectUserTemplate = (mockTemplate: typeof MOCK_USER_TEMPLATES[0]) => {
    setSelectedUserTemplateId(mockTemplate.id)
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => setTestDesign(img)
    img.src = mockTemplate.preview
  }

  const handleTemplateCreated = async (newTemplate: MockupTemplate, images: Map<string, string>) => {
    setTemplate(newTemplate)
    setLayerImages(images)
    setRenderedImage(null)
    setRenderTime(null)
    
    // Pré-carregar imagens do template para acelerar renders
    if (!rendererRef.current) {
      rendererRef.current = new CanvasKitMockupRenderer()
    }
    await rendererRef.current.ready
    await rendererRef.current.preloadTemplateImages(images)
  }

  const handleLoadTestDesign = () => {
    fileInputRef.current?.click()
  }

  const handleDesignFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const img = new Image()
    img.onload = () => setTestDesign(img)
    img.src = URL.createObjectURL(file)
  }

  const handleRender = async () => {
    if (!template) return

    setIsRendering(true)
    try {
      if (!rendererRef.current) {
        rendererRef.current = new CanvasKitMockupRenderer()
      }
      await rendererRef.current.ready

      const designs = template.insertAreas.map((area) => ({
        smartObjectId: area.id,
        image: testDesign || createPlaceholderImage(area.placedContent.width, area.placedContent.height),
      }))

      console.log('[MockupTest] Rendering with CanvasKit (preview mode)')
      // Usar renderPreview para preview rápido (resolução completa + JPEG)
      const result = await rendererRef.current.renderPreview(template, designs, layerImages)

      console.log('[MockupTest] Render result:', result)

      if (result.success && result.imageUrl) {
        setRenderedImage(result.imageUrl)
        setRenderTime(result.renderTimeMs)
        setActiveTab('preview')
      } else {
        console.error('Render failed:', result.error)
      }
    } catch (error) {
      console.error('Render error:', error)
    } finally {
      setIsRendering(false)
    }
  }

  const handleDownload = () => {
    if (!renderedImage) return
    const link = document.createElement('a')
    link.href = renderedImage
    link.download = `${template?.name || 'mockup'}-render.png`
    link.click()
  }

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Mockup Engine V2 - Teste</h1>
        <p className="text-muted-foreground">
          Teste o upload de PSD com Smart Objects e renderização com CanvasKit
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <div className="space-y-6">
          <MockupUploader onTemplateCreated={handleTemplateCreated} />

          {template && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ImageIcon className="h-5 w-5" />
                  Design de Teste
                </CardTitle>
                <CardDescription>
                  Carregue uma imagem para inserir nos Smart Objects
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleDesignFileChange}
                  className="hidden"
                />

                <div className="flex gap-2">
                  <Button variant="outline" onClick={handleLoadTestDesign} className="flex-1">
                    {testDesign ? 'Trocar Design' : 'Carregar Design'}
                  </Button>
                  <Button onClick={handleRender} disabled={isRendering} className="flex-1">
                    {isRendering ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Renderizando...
                      </>
                    ) : (
                      <>
                        <Play className="mr-2 h-4 w-4" />
                        Renderizar
                      </>
                    )}
                  </Button>
                </div>

                <div className="space-y-4 pt-4 border-t">
                  <div className="flex items-center justify-between">
                    <Label className="font-medium text-sm">Meus Templates</Label>
                    <span className="text-xs text-muted-foreground">{MOCK_USER_TEMPLATES.length} disponíveis</span>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    {MOCK_USER_TEMPLATES.map((tmpl) => (
                      <div
                        key={tmpl.id}
                        className={`
                          relative aspect-[9/16] rounded-md overflow-hidden border cursor-pointer hover:border-primary transition-colors group
                          ${selectedUserTemplateId === tmpl.id ? 'ring-2 ring-primary border-primary' : 'border-border'}
                        `}
                        onClick={() => handleSelectUserTemplate(tmpl)}
                      >
                        <img
                          src={tmpl.thumbnail}
                          alt={tmpl.name}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/40 flex items-end p-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          <p className="text-[10px] text-white font-medium truncate w-full shadow-sm">{tmpl.name}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {testDesign && (
                  <div className="border rounded-lg p-2 bg-muted/30">
                    <img
                      src={testDesign.src}
                      alt="Design de teste"
                      className="max-h-32 mx-auto object-contain"
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          {template && (
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="info">Informações</TabsTrigger>
                <TabsTrigger value="preview">Preview</TabsTrigger>
              </TabsList>

              <TabsContent value="info" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>{template.name}</CardTitle>
                    <CardDescription>
                      {template.canvasSize.width} × {template.canvasSize.height}px
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="secondary">{template.category}</Badge>
                      {template.tags?.map((tag) => (
                        <Badge key={tag} variant="outline">{tag}</Badge>
                      ))}
                    </div>

                    <div className="space-y-2">
                      <h4 className="font-medium flex items-center gap-2">
                        <Layers className="h-4 w-4" />
                        Smart Objects ({template.insertAreas.length})
                      </h4>
                      <div className="space-y-2">
                        {template.insertAreas.map((area) => (
                          <div key={area.id} className="bg-muted/50 rounded-lg p-3 text-sm">
                            <div className="font-medium">{area.name}</div>
                            <div className="text-muted-foreground">
                              {area.placedContent.width} × {area.placedContent.height}px
                              {area.perspectiveQuad && (
                                <Badge variant="secondary" className="ml-2 text-xs">
                                  Perspectiva
                                </Badge>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <h4 className="font-medium">Camadas ({template.layers.length})</h4>
                      <div className="max-h-48 overflow-y-auto space-y-1">
                        {template.layers.map((layer) => (
                          <div key={layer.id} className="text-sm flex items-center gap-2">
                            <span className={layer.visible ? '' : 'opacity-50'}>
                              {layer.name}
                            </span>
                            <Badge variant="outline" className="text-xs">
                              {layer.type}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="preview">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>Resultado</CardTitle>
                      {renderTime !== null && (
                        <Badge variant="secondary">
                          {renderTime.toFixed(1)}ms
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    {renderedImage ? (
                      <div className="space-y-4">
                        <div className="border rounded-lg overflow-hidden bg-[url('/checkerboard.svg')] bg-repeat">
                          <img
                            src={renderedImage}
                            alt="Mockup renderizado"
                            className="w-full h-auto"
                          />
                        </div>
                        <Button onClick={handleDownload} variant="outline" className="w-full">
                          <Download className="mr-2 h-4 w-4" />
                          Download PNG
                        </Button>
                      </div>
                    ) : (
                      <div className="h-64 flex items-center justify-center border rounded-lg bg-muted/30">
                        <p className="text-muted-foreground text-sm">
                          Clique em &quot;Renderizar&quot; para ver o resultado
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          )}

          {!template && (
            <Card>
              <CardContent className="h-64 flex items-center justify-center">
                <p className="text-muted-foreground text-center">
                  Faça upload de um PSD para começar
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}

function createPlaceholderImage(width: number, height: number): HTMLCanvasElement {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')!

  // Gradient background
  const gradient = ctx.createLinearGradient(0, 0, width, height)
  gradient.addColorStop(0, '#6366f1')
  gradient.addColorStop(1, '#8b5cf6')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, width, height)

  // Text
  ctx.fillStyle = 'white'
  ctx.font = `bold ${Math.min(width, height) / 8}px sans-serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText('DESIGN', width / 2, height / 2 - 20)
  ctx.font = `${Math.min(width, height) / 12}px sans-serif`
  ctx.fillText(`${width}×${height}`, width / 2, height / 2 + 20)

  return canvas
}
