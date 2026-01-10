'use client'

/**
 * MockupPreviewPanel
 * 
 * Painel de preview de mockups que sincroniza em tempo real
 * com o template sendo editado no editor.
 */

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { cn } from '@/lib/utils'
import { MockupViewer } from './mockup-viewer'
import {
  mockupPresets,
  type TemplateSnapshot,
} from '@/lib/studio/mockups'
import { useEditorStore } from '@/stores/editor-store'
import { renderScene } from '@/lib/studio/render-engine'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { 
  PanelRightClose, 
  PanelRightOpen, 
  RefreshCw, 
  Loader2,
} from 'lucide-react'

interface MockupPreviewPanelProps {
  /** Classe CSS adicional */
  className?: string
  /** Posição do painel */
  position?: 'right' | 'bottom'
  /** Callback quando painel é fechado */
  onClose?: () => void
  /** Está aberto */
  isOpen?: boolean
}

export function MockupPreviewPanel({
  className,
  position = 'right',
  onClose,
  isOpen = true,
}: MockupPreviewPanelProps) {
  const template = useEditorStore((state) => state.template)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  
  const [selectedMockupId, setSelectedMockupId] = useState(mockupPresets[0]?.id ?? '')
  const [snapshot, setSnapshot] = useState<TemplateSnapshot | null>(null)
  const [isRendering, setIsRendering] = useState(false)
  const [lastUpdate, setLastUpdate] = useState<number>(0)
  
  const debounceRef = useRef<NodeJS.Timeout | null>(null)
  
  // Mockup selecionado
  const selectedMockup = useMemo(() => {
    return mockupPresets.find((m) => m.id === selectedMockupId) ?? mockupPresets[0]
  }, [selectedMockupId])
  
  // Criar canvas offscreen
  useEffect(() => {
    if (!canvasRef.current) {
      canvasRef.current = document.createElement('canvas')
    }
  }, [])
  
  // Capturar snapshot do template
  const captureSnapshot = useCallback(async () => {
    if (!template?.rootNode || !canvasRef.current) return
    
    setIsRendering(true)
    
    try {
      const canvas = canvasRef.current
      const { width, height } = template.rootNode.size
      
      canvas.width = width
      canvas.height = height
      
      // Renderizar template
      await renderScene(canvas, template.rootNode, {
        zoom: 1,
        centerOffset: { x: 0, y: 0 },
        showGrid: false,
      })
      
      // Criar snapshot
      const ctx = canvas.getContext('2d')
      if (!ctx) return
      
      const newSnapshot: TemplateSnapshot = {
        templateId: template.id,
        imageData: canvas,
        width,
        height,
        updatedAt: Date.now(),
      }
      
      setSnapshot(newSnapshot)
      setLastUpdate(Date.now())
    } catch (error) {
      console.error('[MockupPreviewPanel] Erro ao capturar snapshot:', error)
    } finally {
      setIsRendering(false)
    }
  }, [template])
  
  // Atualizar snapshot quando template mudar (com debounce)
  useEffect(() => {
    if (!template) return
    
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }
    
    debounceRef.current = setTimeout(() => {
      captureSnapshot()
    }, 200) // 200ms debounce
    
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
    }
  }, [template, captureSnapshot])
  
  // Criar map de snapshots para o viewer
  const snapshotsMap = useMemo(() => {
    const map = new Map<number, TemplateSnapshot>()
    if (snapshot) {
      map.set(0, snapshot)
    }
    return map
  }, [snapshot])
  
  // Handler de download
  const handleDownload = useCallback((blob: Blob) => {
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `mockup-${selectedMockup?.name?.toLowerCase().replace(/\s+/g, '-') ?? 'preview'}.png`
    a.click()
    URL.revokeObjectURL(url)
  }, [selectedMockup])
  
  if (!isOpen) {
    return (
      <Button
        variant="outline"
        size="icon"
        className="fixed right-4 top-1/2 -translate-y-1/2 z-50"
        onClick={() => onClose?.()}
      >
        <PanelRightOpen className="h-4 w-4" />
      </Button>
    )
  }
  
  return (
    <div
      className={cn(
        'flex flex-col bg-background border-l',
        position === 'right' ? 'w-[350px] h-full' : 'w-full h-[300px] border-t border-l-0',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Mockup Preview</span>
          {isRendering && (
            <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
          )}
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={captureSnapshot}
            disabled={isRendering}
          >
            <RefreshCw className={cn('h-3.5 w-3.5', isRendering && 'animate-spin')} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={onClose}
          >
            <PanelRightClose className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
      
      {/* Seletor de mockup */}
      <div className="px-3 py-2 border-b">
        <Select value={selectedMockupId} onValueChange={setSelectedMockupId}>
          <SelectTrigger className="h-8 text-xs">
            <SelectValue placeholder="Selecione um mockup" />
          </SelectTrigger>
          <SelectContent>
            {mockupPresets.map((mockup) => (
              <SelectItem key={mockup.id} value={mockup.id} className="text-xs">
                {mockup.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      {/* Viewer */}
      <div className="flex-1 min-h-0">
        {selectedMockup && (
          <MockupViewer
            definition={selectedMockup}
            templateSnapshots={snapshotsMap}
            showControls={true}
            interactive={true}
            onDownload={handleDownload}
            className="h-full rounded-none"
          />
        )}
      </div>
      
      {/* Footer */}
      <div className="px-3 py-2 border-t text-xs text-muted-foreground">
        {lastUpdate > 0 ? (
          <span>Atualizado: {new Date(lastUpdate).toLocaleTimeString()}</span>
        ) : (
          <span>Aguardando template...</span>
        )}
      </div>
    </div>
  )
}
