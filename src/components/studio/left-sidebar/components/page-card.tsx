'use client'

import { useRef, useEffect, useState } from 'react'
import { Copy, Trash2, Pencil } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import type { FrameNode } from '@/types/studio'
import { renderScene } from '@/lib/studio/render-engine'

// ============================================
// TYPES
// ============================================

export interface PageData {
  id: string
  name: string
  thumbnail?: string
  rootNode?: FrameNode
  width: number
  height: number
  isVisible: boolean
  isEdited?: boolean
  format?: string
}

interface PageCardProps {
  page: PageData
  isSelected: boolean
  onSelect: (pageId: string) => void
  onDuplicate?: (pageId: string) => void
  onDelete?: (pageId: string) => void
  onRename?: (pageId: string) => void
}

// ============================================
// PAGE CARD COMPONENT
// Container fixo com preview proporcional interno
// ============================================

export function PageCard({ 
  page, 
  isSelected, 
  onSelect,
  onDuplicate,
  onDelete,
  onRename,
}: PageCardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [thumbnailReady, setThumbnailReady] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  
  // Render thumbnail using canvas when rootNode is available
  // Only render once on mount or when rootNode ID changes (not on every edit)
  const rootNodeIdRef = useRef<string | null>(null)
  
  useEffect(() => {
    if (!page.rootNode || !canvasRef.current || !containerRef.current) return
    
    // Skip if already rendered for this rootNode
    if (rootNodeIdRef.current === page.rootNode.id && thumbnailReady) return
    rootNodeIdRef.current = page.rootNode.id
    
    const canvas = canvasRef.current
    const container = containerRef.current
    
    // Get container dimensions and apply margin (10% on each side = 80% usable)
    const containerWidth = container.clientWidth * 0.85
    const containerHeight = container.clientHeight * 0.85
    
    // Calculate scale to fit template within container with margins
    const scale = Math.min(
      containerWidth / page.width,
      containerHeight / page.height,
      1 // Don't upscale
    )
    
    // Set actual canvas dimensions
    const canvasWidth = Math.round(page.width * scale)
    const canvasHeight = Math.round(page.height * scale)
    
    canvas.style.width = `${canvasWidth}px`
    canvas.style.height = `${canvasHeight}px`
    
    // Wait for next frame to ensure canvas is sized
    requestAnimationFrame(() => {
      renderScene(canvas, page.rootNode!, {
        zoom: scale,
        centerOffset: { x: 0, y: 0 },
      }).then(() => {
        setThumbnailReady(true)
      }).catch(err => {
        console.error('Failed to render thumbnail:', err)
      })
    })
  }, [page.rootNode?.id, page.width, page.height, thumbnailReady])

  const handleDuplicate = (e: React.MouseEvent) => {
    e.stopPropagation()
    onDuplicate?.(page.id)
  }

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    setShowDeleteDialog(true)
  }

  const handleConfirmDelete = () => {
    onDelete?.(page.id)
    setShowDeleteDialog(false)
  }

  const handleRename = (e: React.MouseEvent) => {
    e.stopPropagation()
    onRename?.(page.id)
  }

  return (
    <>
      <div 
        className="group cursor-pointer"
        onClick={() => onSelect(page.id)}
      >
        {/* Container com seleção apenas no preview */}
        <div 
          ref={containerRef}
          className={cn(
            "relative aspect-[4/3] bg-muted rounded-lg flex items-center justify-center overflow-hidden transition-all",
            isSelected && "ring-2 ring-foreground ring-offset-2"
          )}
        >
          {page.rootNode ? (
            <canvas
              ref={canvasRef}
              className={cn(
                "rounded transition-opacity",
                thumbnailReady ? "opacity-100" : "opacity-0"
              )}
            />
          ) : page.thumbnail ? (
            <img 
              src={page.thumbnail} 
              alt={page.name}
              className="max-w-full max-h-full object-contain rounded"
            />
          ) : (
            <div 
              className="bg-zinc-800 rounded flex items-center justify-center"
              style={{ aspectRatio: String(page.width / page.height), maxWidth: '90%', maxHeight: '85%' }}
            >
              <div className="p-3 space-y-1.5">
                <div className="h-1.5 w-10 bg-zinc-600 rounded" />
                <div className="h-1 w-6 bg-zinc-700 rounded" />
                <div className="h-1 w-8 bg-zinc-700 rounded" />
              </div>
            </div>
          )}

          {/* Hover Actions */}
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="secondary"
                  size="icon"
                  className="size-8 bg-white hover:bg-white"
                  onClick={handleDuplicate}
                >
                  <Copy className="size-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs">
                Duplicar
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="secondary"
                  size="icon"
                  className="size-8 bg-white hover:bg-white"
                  onClick={handleRename}
                >
                  <Pencil className="size-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs">
                Renomear
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="secondary"
                  size="icon"
                  className="size-8 bg-white hover:bg-white"
                  onClick={handleDeleteClick}
                >
                  <Trash2 className="size-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs">
                Excluir
              </TooltipContent>
            </Tooltip>
          </div>
        </div>
        
        {/* Nome da página - fora da seleção */}
        <p className={cn(
          "text-sm mt-2 truncate",
          isSelected ? "text-foreground font-medium" : "text-muted-foreground"
        )}>
          {page.name}
        </p>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir template</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir <strong>{page.name}</strong>? 
              O template será movido para a lixeira e poderá ser restaurado posteriormente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-foreground text-background hover:bg-foreground/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
