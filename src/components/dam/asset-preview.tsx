'use client'

import { useState } from 'react'
import Image from 'next/image'
import { 
  X, 
  Download, 
  Copy, 
  Edit, 
  Trash2,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Maximize2,
  FileText,
  FileImage,
  FileVideo,
  File,
  Crown,
  Tag,
  Calendar,
  HardDrive,
  Palette
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import type { Asset } from '@/services/dam-service'

interface AssetPreviewProps {
  asset: Asset | null
  assets?: Asset[]
  open: boolean
  onOpenChange: (open: boolean) => void
  onEdit?: (asset: Asset) => void
  onDelete?: (asset: Asset) => void
  onDownload?: (asset: Asset) => void
}

const categoryIcons = {
  logo: Crown,
  image: FileImage,
  video: FileVideo,
  document: FileText,
  typography: FileText,
  icon: FileImage,
  other: File,
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function getPublicUrl(filePath: string): string {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  return `${supabaseUrl}/storage/v1/object/public/brand-assets/${filePath}`
}

export function AssetPreview({
  asset,
  assets = [],
  open,
  onOpenChange,
  onEdit,
  onDelete,
  onDownload,
}: AssetPreviewProps) {
  const [zoom, setZoom] = useState(1)
  const [currentIndex, setCurrentIndex] = useState(() => 
    asset ? assets.findIndex(a => a.id === asset.id) : 0
  )

  if (!asset) return null

  const currentAsset = assets.length > 0 ? assets[currentIndex] || asset : asset
  const isImage = currentAsset.mime_type.startsWith('image/')
  const category = (currentAsset.file_type as keyof typeof categoryIcons) || 'other'
  const CategoryIcon = categoryIcons[category] || File

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1)
      setZoom(1)
    }
  }

  const handleNext = () => {
    if (currentIndex < assets.length - 1) {
      setCurrentIndex(currentIndex + 1)
      setZoom(1)
    }
  }

  const handleCopyUrl = () => {
    const url = getPublicUrl(currentAsset.file_path)
    navigator.clipboard.writeText(url)
  }

  const handleDownload = () => {
    const url = getPublicUrl(currentAsset.file_path)
    const link = document.createElement('a')
    link.href = url
    link.download = currentAsset.name
    link.click()
    onDownload?.(currentAsset)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl h-[90vh] p-0 gap-0">
        <div className="flex h-full">
          {/* Preview area */}
          <div className="relative flex-1 bg-black/95 flex items-center justify-center">
            {/* Close button */}
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-4 top-4 z-10 text-white hover:bg-white/20"
              onClick={() => onOpenChange(false)}
            >
              <X className="h-5 w-5" />
            </Button>

            {/* Navigation arrows */}
            {assets.length > 1 && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    'absolute left-4 top-1/2 -translate-y-1/2 z-10 text-white hover:bg-white/20',
                    currentIndex === 0 && 'opacity-30 pointer-events-none'
                  )}
                  onClick={handlePrevious}
                >
                  <ChevronLeft className="h-8 w-8" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    'absolute right-4 top-1/2 -translate-y-1/2 z-10 text-white hover:bg-white/20',
                    currentIndex === assets.length - 1 && 'opacity-30 pointer-events-none'
                  )}
                  onClick={handleNext}
                >
                  <ChevronRight className="h-8 w-8" />
                </Button>
              </>
            )}

            {/* Zoom controls */}
            {isImage && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 flex items-center gap-2 rounded-full bg-black/50 px-3 py-1.5 backdrop-blur-sm">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-white hover:bg-white/20"
                  onClick={() => setZoom(Math.max(0.5, zoom - 0.25))}
                >
                  <ZoomOut className="h-4 w-4" />
                </Button>
                <span className="text-sm text-white min-w-[4rem] text-center">
                  {Math.round(zoom * 100)}%
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-white hover:bg-white/20"
                  onClick={() => setZoom(Math.min(3, zoom + 0.25))}
                >
                  <ZoomIn className="h-4 w-4" />
                </Button>
                <Separator orientation="vertical" className="h-4 bg-white/30" />
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-white hover:bg-white/20"
                  onClick={() => setZoom(1)}
                >
                  <Maximize2 className="h-4 w-4" />
                </Button>
              </div>
            )}

            {/* Image preview */}
            {isImage ? (
              <div 
                className="relative overflow-auto max-w-full max-h-full"
                style={{ transform: `scale(${zoom})`, transformOrigin: 'center' }}
              >
                <Image
                  src={getPublicUrl(currentAsset.file_path)}
                  alt={currentAsset.alt_text || currentAsset.name}
                  width={currentAsset.width || 800}
                  height={currentAsset.height || 600}
                  className="object-contain"
                  priority
                />
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center text-white">
                <CategoryIcon className="h-24 w-24 mb-4 opacity-50" />
                <p className="text-lg font-medium">{currentAsset.name}</p>
                <p className="text-sm text-white/60 mt-1">
                  Preview não disponível para este tipo de arquivo
                </p>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="w-80 border-l bg-background flex flex-col">
            <DialogHeader className="p-4 border-b">
              <DialogTitle className="text-lg truncate pr-8">
                {currentAsset.name}
              </DialogTitle>
            </DialogHeader>

            <ScrollArea className="flex-1">
              <div className="p-4 space-y-6">
                {/* Actions */}
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1"
                    onClick={handleDownload}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={handleCopyUrl}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>

                <Separator />

                {/* File info */}
                <div className="space-y-3">
                  <h4 className="text-sm font-medium">Informações</h4>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <HardDrive className="h-4 w-4" />
                      <span>Tamanho:</span>
                      <span className="text-foreground ml-auto">
                        {formatFileSize(currentAsset.file_size)}
                      </span>
                    </div>
                    
                    {currentAsset.width && currentAsset.height && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Maximize2 className="h-4 w-4" />
                        <span>Dimensões:</span>
                        <span className="text-foreground ml-auto">
                          {currentAsset.width} × {currentAsset.height}
                        </span>
                      </div>
                    )}
                    
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>Criado:</span>
                      <span className="text-foreground ml-auto">
                        {formatDate(currentAsset.created_at)}
                      </span>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* AI Tags */}
                {currentAsset.ai_tags && currentAsset.ai_tags.length > 0 && (
                  <>
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Tag className="h-4 w-4" />
                        <h4 className="text-sm font-medium">Tags (IA)</h4>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {currentAsset.ai_tags.map((tag) => (
                          <Badge key={tag} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <Separator />
                  </>
                )}

                {/* AI Colors */}
                {currentAsset.ai_colors && currentAsset.ai_colors.length > 0 && (
                  <>
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Palette className="h-4 w-4" />
                        <h4 className="text-sm font-medium">Cores detectadas</h4>
                      </div>
                      <div className="flex gap-2">
                        {currentAsset.ai_colors.map((color) => (
                          <button
                            key={color}
                            className="group relative h-8 w-8 rounded-md border shadow-sm transition-transform hover:scale-110"
                            style={{ backgroundColor: color }}
                            onClick={() => navigator.clipboard.writeText(color)}
                            title={`Copiar ${color}`}
                          >
                            <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[10px] opacity-0 group-hover:opacity-100 transition-opacity">
                              {color}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                    <Separator />
                  </>
                )}

                {/* AI Description */}
                {currentAsset.ai_description && (
                  <>
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium">Descrição (IA)</h4>
                      <p className="text-sm text-muted-foreground">
                        {currentAsset.ai_description}
                      </p>
                    </div>
                    <Separator />
                  </>
                )}

                {/* Danger zone */}
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-destructive">Ações</h4>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => onEdit?.(currentAsset)}
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Editar
                    </Button>
                    <Button 
                      variant="destructive" 
                      size="sm"
                      onClick={() => onDelete?.(currentAsset)}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Excluir
                    </Button>
                  </div>
                </div>
              </div>
            </ScrollArea>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
