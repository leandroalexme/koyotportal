'use client'

import { useState, useCallback, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import {
  Figma,
  Link2,
  Loader2,
  AlertCircle,
  ChevronRight,
  FileText,
  Frame,
  Component,
  CheckCircle2,
  XCircle,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { 
  parseFigmaUrlAdvanced, 
  isValidFigmaUrl,
  type FigmaFileStructure,
  type FigmaPageInfo,
  type FigmaFrameInfo,
} from '@/lib/figma/figma-url-parser'
import { saveTemplate } from '@/lib/studio/template-db'

// ============================================
// TYPES
// ============================================

export interface FigmaPickerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  brandId: string
  onImportComplete: (results: ImportResult[]) => void
  context?: 'editor' | 'library' // Onde o picker foi aberto
}

export interface ImportResult {
  nodeId: string
  templateId: string
  name: string
  success: boolean
  error?: string
}

type Step = 'url' | 'token' | 'select' | 'importing' | 'complete'

// ============================================
// FRAME ITEM COMPONENT
// ============================================

interface FrameItemProps {
  frame: FigmaFrameInfo
  selected: boolean
  onToggle: (frameId: string, selected: boolean) => void
}

function FrameItem({ frame, selected, onToggle }: FrameItemProps) {
  const Icon = frame.isComponent ? Component : Frame
  
  return (
    <div
      className={cn(
        "flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all",
        selected 
          ? "border-primary bg-primary/5" 
          : "border-border hover:border-primary/50 hover:bg-accent/50"
      )}
      onClick={() => onToggle(frame.id, !selected)}
    >
      <Checkbox 
        checked={selected}
        onCheckedChange={(checked) => onToggle(frame.id, checked as boolean)}
        onClick={(e) => e.stopPropagation()}
      />
      
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <Icon className="size-4 text-muted-foreground shrink-0" />
        <span className="truncate font-medium">{frame.name}</span>
      </div>
      
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <span>{frame.width} × {frame.height}</span>
        {frame.isComponent && (
          <Badge variant="secondary" className="text-xs">
            Component
          </Badge>
        )}
      </div>
    </div>
  )
}

// ============================================
// PAGE SECTION COMPONENT
// ============================================

interface PageSectionProps {
  page: FigmaPageInfo
  selectedFrames: Set<string>
  onToggleFrame: (frameId: string, selected: boolean) => void
  onSelectAllPage: (pageId: string, frames: FigmaFrameInfo[]) => void
}

function PageSection({ page, selectedFrames, onToggleFrame, onSelectAllPage }: PageSectionProps) {
  const selectedCount = page.frames.filter(f => selectedFrames.has(f.id)).length
  const allSelected = selectedCount === page.frames.length && page.frames.length > 0
  
  return (
    <Collapsible defaultOpen className="group">
      <div className="flex items-center gap-2 py-2">
        <CollapsibleTrigger className="flex items-center gap-2 flex-1 hover:bg-accent/50 rounded-md p-1 -ml-1">
          <ChevronRight className="size-4 text-muted-foreground transition-transform group-data-[state=open]:rotate-90" />
          <FileText className="size-4 text-muted-foreground" />
          <span className="font-medium">{page.name}</span>
          <Badge variant="outline" className="text-xs ml-auto">
            {page.frames.length} frames
          </Badge>
        </CollapsibleTrigger>
        
        <Button
          variant="ghost"
          size="sm"
          className="text-xs"
          onClick={() => onSelectAllPage(page.id, page.frames)}
        >
          {allSelected ? 'Desmarcar' : 'Selecionar'} todos
        </Button>
      </div>
      
      <CollapsibleContent>
        <div className="space-y-2 pl-6 pb-4">
          {page.frames.map(frame => (
            <FrameItem
              key={frame.id}
              frame={frame}
              selected={selectedFrames.has(frame.id)}
              onToggle={onToggleFrame}
            />
          ))}
          
          {page.frames.length === 0 && (
            <p className="text-sm text-muted-foreground py-4 text-center">
              Nenhum frame encontrado nesta página
            </p>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}

// ============================================
// MAIN COMPONENT
// ============================================

export function FigmaPicker({
  open,
  onOpenChange,
  brandId,
  onImportComplete,
  context = 'library',
}: FigmaPickerProps) {
  // State
  const [step, setStep] = useState<Step>('url')
  const [figmaUrl, setFigmaUrl] = useState('')
  const [accessToken, setAccessToken] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // File structure
  const [fileStructure, setFileStructure] = useState<FigmaFileStructure | null>(null)
  const [selectedFrames, setSelectedFrames] = useState<Set<string>>(new Set())
  const [frameNames, setFrameNames] = useState<Map<string, string>>(new Map())
  
  // Import results
  const [importResults, setImportResults] = useState<ImportResult[]>([])
  
  // Reset state when dialog closes
  useEffect(() => {
    if (!open) {
      setStep('url')
      setFigmaUrl('')
      setError(null)
      setFileStructure(null)
      setSelectedFrames(new Set())
      setFrameNames(new Map())
      setImportResults([])
    }
  }, [open])
  
  // Parse URL and validate
  const parsedUrl = figmaUrl ? parseFigmaUrlAdvanced(figmaUrl) : null
  const isUrlValid = figmaUrl ? isValidFigmaUrl(figmaUrl) : false
  
  // Handlers
  const handleUrlSubmit = useCallback(() => {
    if (!isUrlValid) {
      setError('URL do Figma inválida')
      return
    }
    setError(null)
    setStep('token')
  }, [isUrlValid])
  
  const handleFetchStructure = useCallback(async () => {
    if (!parsedUrl || !accessToken) return
    
    setIsLoading(true)
    setError(null)
    
    try {
      const params = new URLSearchParams({
        fileKey: parsedUrl.fileKey,
        accessToken,
      })
      
      if (parsedUrl.nodeId) {
        params.append('nodeId', parsedUrl.nodeId)
      }
      
      const response = await fetch(`/api/figma/structure?${params}`)
      const data = await response.json()
      
      if (!response.ok) {
        if (response.status === 429) {
          setError(`Rate limit excedido. Aguarde ${data.retryAfter || 60} segundos.`)
        } else {
          setError(data.error || 'Erro ao carregar estrutura do arquivo')
        }
        return
      }
      
      setFileStructure(data)
      
      // Build frame names map
      const names = new Map<string, string>()
      for (const page of data.pages) {
        for (const frame of page.frames) {
          names.set(frame.id, frame.name)
        }
      }
      setFrameNames(names)
      
      // Se URL tinha node-id específico, pré-selecionar o frame
      if (parsedUrl.nodeId && parsedUrl.type === 'frame') {
        setSelectedFrames(new Set([parsedUrl.nodeId]))
      }
      
      setStep('select')
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar arquivo')
    } finally {
      setIsLoading(false)
    }
  }, [parsedUrl, accessToken])
  
  const handleToggleFrame = useCallback((frameId: string, selected: boolean) => {
    setSelectedFrames(prev => {
      const next = new Set(prev)
      if (selected) {
        next.add(frameId)
      } else {
        next.delete(frameId)
      }
      return next
    })
  }, [])
  
  const handleSelectAllPage = useCallback((pageId: string, frames: FigmaFrameInfo[]) => {
    setSelectedFrames(prev => {
      const next = new Set(prev)
      const allSelected = frames.every(f => prev.has(f.id))
      
      for (const frame of frames) {
        if (allSelected) {
          next.delete(frame.id)
        } else {
          next.add(frame.id)
        }
      }
      
      return next
    })
  }, [])
  
  const handleImport = useCallback(async () => {
    if (!parsedUrl || selectedFrames.size === 0) return
    
    setStep('importing')
    setError(null)
    
    try {
      const frames = Array.from(selectedFrames).map(nodeId => ({
        nodeId,
        name: frameNames.get(nodeId) || 'Untitled',
      }))
      
      const response = await fetch('/api/figma/batch-import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accessToken,
          fileKey: parsedUrl.fileKey,
          brandId,
          frames,
          importImages: true, // Habilitado para importar imagens
          scale: 2,
        }),
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        setError(data.error || 'Erro na importação')
        setStep('select')
        return
      }
      
      // Salvar templates no IndexedDB para persistência
      for (const result of data.results) {
        if (result.success && result.template) {
          await saveTemplate(
            result.templateId,
            brandId,
            result.template,
            'figma',
            `https://www.figma.com/design/${parsedUrl.fileKey}?node-id=${result.nodeId}`
          )
        }
      }
      
      setImportResults(data.results)
      setStep('complete')
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro na importação')
      setStep('select')
    }
  }, [parsedUrl, selectedFrames, accessToken, brandId, frameNames])
  
  const handleComplete = useCallback(() => {
    onImportComplete(importResults)
    onOpenChange(false)
  }, [importResults, onImportComplete, onOpenChange])
  
  // Render
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Figma className="h-5 w-5" />
            Importar do Figma
          </DialogTitle>
          <DialogDescription>
            {step === 'url' && 'Cole a URL do arquivo ou frame do Figma'}
            {step === 'token' && 'Insira seu token de acesso do Figma'}
            {step === 'select' && 'Selecione os frames para importar'}
            {step === 'importing' && 'Importando frames selecionados...'}
            {step === 'complete' && 'Importação concluída'}
          </DialogDescription>
        </DialogHeader>
        
        {/* Step: URL Input */}
        {step === 'url' && (
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="figma-url">URL do Figma</Label>
              <div className="relative">
                <Link2 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="figma-url"
                  placeholder="https://www.figma.com/design/..."
                  value={figmaUrl}
                  onChange={(e) => setFigmaUrl(e.target.value)}
                  className="pl-9"
                  onKeyDown={(e) => e.key === 'Enter' && handleUrlSubmit()}
                />
              </div>
              
              {parsedUrl && parsedUrl.type !== 'invalid' && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Badge variant="outline">{parsedUrl.type}</Badge>
                  {parsedUrl.fileName && <span>{parsedUrl.fileName}</span>}
                </div>
              )}
            </div>
            
            {error && (
              <div className="flex items-center gap-2 text-sm text-destructive">
                <AlertCircle className="h-4 w-4" />
                {error}
              </div>
            )}
          </div>
        )}
        
        {/* Step: Token Input */}
        {step === 'token' && (
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="access-token">Token de Acesso</Label>
              <Input
                id="access-token"
                type="password"
                placeholder="figd_..."
                value={accessToken}
                onChange={(e) => setAccessToken(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleFetchStructure()}
              />
              <p className="text-xs text-muted-foreground">
                Crie um token em{' '}
                <a 
                  href="https://www.figma.com/developers/api#access-tokens" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  figma.com/developers
                </a>
              </p>
            </div>
            
            {error && (
              <div className="flex items-center gap-2 text-sm text-destructive">
                <AlertCircle className="h-4 w-4" />
                {error}
              </div>
            )}
          </div>
        )}
        
        {/* Step: Frame Selection */}
        {step === 'select' && fileStructure && (
          <div className="py-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-medium">{fileStructure.name}</h3>
                <p className="text-sm text-muted-foreground">
                  {fileStructure.pages.length} página(s) • {selectedFrames.size} frame(s) selecionado(s)
                </p>
              </div>
            </div>
            
            <ScrollArea className="h-[300px] pr-4">
              <div className="space-y-4">
                {fileStructure.pages.map(page => (
                  <PageSection
                    key={page.id}
                    page={page}
                    selectedFrames={selectedFrames}
                    onToggleFrame={handleToggleFrame}
                    onSelectAllPage={handleSelectAllPage}
                  />
                ))}
              </div>
            </ScrollArea>
            
            {error && (
              <div className="flex items-center gap-2 text-sm text-destructive mt-4">
                <AlertCircle className="h-4 w-4" />
                {error}
              </div>
            )}
          </div>
        )}
        
        {/* Step: Importing */}
        {step === 'importing' && (
          <div className="py-8 flex flex-col items-center justify-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground">
              Importando {selectedFrames.size} frame(s)...
            </p>
          </div>
        )}
        
        {/* Step: Complete */}
        {step === 'complete' && (
          <div className="py-4">
            <div className="space-y-3">
              {importResults.map(result => (
                <div
                  key={result.nodeId}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-lg border",
                    result.success ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"
                  )}
                >
                  {result.success ? (
                    <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-600 shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{result.name}</p>
                    {result.error && (
                      <p className="text-sm text-red-600">{result.error}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Footer */}
        <DialogFooter>
          {step === 'url' && (
            <Button onClick={handleUrlSubmit} disabled={!isUrlValid}>
              Continuar
            </Button>
          )}
          
          {step === 'token' && (
            <>
              <Button variant="outline" onClick={() => setStep('url')}>
                Voltar
              </Button>
              <Button 
                onClick={handleFetchStructure} 
                disabled={!accessToken || isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Carregando...
                  </>
                ) : (
                  'Carregar Arquivo'
                )}
              </Button>
            </>
          )}
          
          {step === 'select' && (
            <>
              <Button variant="outline" onClick={() => setStep('token')}>
                Voltar
              </Button>
              <Button 
                onClick={handleImport} 
                disabled={selectedFrames.size === 0}
              >
                Importar {selectedFrames.size} Frame(s)
              </Button>
            </>
          )}
          
          {step === 'complete' && (
            <Button onClick={handleComplete}>
              {context === 'editor' ? 'Abrir Template' : 'Concluir'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
