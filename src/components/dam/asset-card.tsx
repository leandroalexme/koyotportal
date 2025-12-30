'use client'

import { useState } from 'react'
import Image from 'next/image'
import { 
  MoreHorizontal, 
  Download, 
  Trash2, 
  Edit, 
  Copy, 
  Archive,
  Eye,
  FileText,
  FileImage,
  FileVideo,
  File,
  Crown,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Loader2,
  RefreshCw
} from 'lucide-react'
import { AspectRatio } from '@/components/ui/aspect-ratio'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
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
import { cn } from '@/lib/utils'
import type { Asset } from '@/services/dam-service'

interface AssetCardProps {
  asset: Asset
  onPreview?: (asset: Asset) => void
  onEdit?: (asset: Asset) => void
  onDelete?: (asset: Asset) => void
  onDownload?: (asset: Asset) => void
  onArchive?: (asset: Asset) => void
  onCopyUrl?: (asset: Asset) => void
  onReanalyze?: (asset: Asset) => void
  selected?: boolean
  onSelect?: (asset: Asset) => void
  analyzing?: boolean
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

const categoryColors = {
  logo: 'bg-amber-500/10 text-amber-600',
  image: 'bg-blue-500/10 text-blue-600',
  video: 'bg-purple-500/10 text-purple-600',
  document: 'bg-green-500/10 text-green-600',
  typography: 'bg-pink-500/10 text-pink-600',
  icon: 'bg-cyan-500/10 text-cyan-600',
  other: 'bg-gray-500/10 text-gray-600',
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}

function getPublicUrl(filePath: string): string {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  return `${supabaseUrl}/storage/v1/object/public/brand-assets/${filePath}`
}

export function AssetCard({
  asset,
  onPreview,
  onEdit,
  onDelete,
  onDownload,
  onArchive,
  onCopyUrl,
  onReanalyze,
  selected,
  onSelect,
  analyzing = false,
}: AssetCardProps) {
  const [imageError, setImageError] = useState(false)
  const [showTags, setShowTags] = useState(false)
  const isImage = asset.mime_type.startsWith('image/')
  const category = (asset.file_type as keyof typeof categoryIcons) || 'other'
  const CategoryIcon = categoryIcons[category] || File
  
  const hasAiTags = asset.ai_tags && asset.ai_tags.length > 0
  const aiColors = (asset.ai_colors as string[]) || []

  const handleCopyUrl = () => {
    const url = getPublicUrl(asset.file_path)
    navigator.clipboard.writeText(url)
    onCopyUrl?.(asset)
  }

  return (
    <div
      className={cn(
        'group relative overflow-hidden rounded-lg border bg-card transition-all duration-200',
        'hover:border-foreground/20 hover:shadow-lg',
        selected && 'ring-2 ring-primary border-primary'
      )}
    >
      {/* Selection checkbox area */}
      {onSelect && (
        <button
          onClick={() => onSelect(asset)}
          className={cn(
            'absolute left-2 top-2 z-10 h-5 w-5 rounded border-2 transition-all',
            'bg-background/80 backdrop-blur-sm',
            selected 
              ? 'border-primary bg-primary' 
              : 'border-muted-foreground/30 opacity-0 group-hover:opacity-100'
          )}
        >
          {selected && (
            <svg className="h-full w-full text-primary-foreground" viewBox="0 0 24 24">
              <path fill="currentColor" d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
            </svg>
          )}
        </button>
      )}

      {/* Preview area */}
      <AspectRatio ratio={1} className="bg-muted">
        {isImage && !imageError ? (
          <Image
            src={getPublicUrl(asset.file_path)}
            alt={asset.alt_text || asset.name}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            onError={() => setImageError(true)}
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <CategoryIcon className="h-12 w-12 text-muted-foreground/50" />
          </div>
        )}
        
        {/* Hover overlay */}
        <div className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 transition-opacity group-hover:opacity-100">
          <Button
            variant="secondary"
            size="sm"
            className="gap-2"
            onClick={() => onPreview?.(asset)}
          >
            <Eye className="h-4 w-4" />
            Preview
          </Button>
        </div>
      </AspectRatio>

      {/* Info section */}
      <div className="p-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium" title={asset.name}>
              {asset.name}
            </p>
            <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
              <span>{formatFileSize(asset.file_size)}</span>
              {asset.width && asset.height && (
                <>
                  <span>•</span>
                  <span>{asset.width}×{asset.height}</span>
                </>
              )}
            </div>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => onPreview?.(asset)}>
                <Eye className="mr-2 h-4 w-4" />
                Visualizar
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onEdit?.(asset)}>
                <Edit className="mr-2 h-4 w-4" />
                Editar
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleCopyUrl}>
                <Copy className="mr-2 h-4 w-4" />
                Copiar URL
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onDownload?.(asset)}>
                <Download className="mr-2 h-4 w-4" />
                Download
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onArchive?.(asset)}>
                <Archive className="mr-2 h-4 w-4" />
                Arquivar
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => onDelete?.(asset)}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Excluir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Smart Tags Section */}
        <Collapsible open={showTags} onOpenChange={setShowTags}>
          {/* Analyzing state */}
          {analyzing && (
            <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
              <Loader2 className="h-3 w-3 animate-spin" />
              <span>Analisando com IA...</span>
            </div>
          )}

          {/* Tags preview */}
          {!analyzing && hasAiTags && (
            <div className="mt-2">
              <CollapsibleTrigger asChild>
                <button className="flex w-full items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
                  <Sparkles className="h-3 w-3" />
                  <span>Smart Tags</span>
                  {showTags ? (
                    <ChevronUp className="h-3 w-3 ml-auto" />
                  ) : (
                    <ChevronDown className="h-3 w-3 ml-auto" />
                  )}
                </button>
              </CollapsibleTrigger>
              
              {/* Collapsed: show first 3 tags */}
              {!showTags && (
                <div className="mt-1 flex flex-wrap gap-1">
                  {asset.ai_tags!.slice(0, 3).map((tag) => (
                    <Badge 
                      key={tag} 
                      variant="secondary" 
                      className="text-[10px] px-1.5 py-0"
                    >
                      {tag}
                    </Badge>
                  ))}
                  {asset.ai_tags!.length > 3 && (
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                      +{asset.ai_tags!.length - 3}
                    </Badge>
                  )}
                </div>
              )}

              {/* Expanded: show all tags + colors */}
              <CollapsibleContent>
                <div className="mt-2 space-y-2">
                  {/* All tags */}
                  <div className="flex flex-wrap gap-1">
                    {asset.ai_tags!.map((tag) => (
                      <Badge 
                        key={tag} 
                        variant="secondary" 
                        className="text-[10px] px-1.5 py-0"
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>

                  {/* AI Colors */}
                  {aiColors.length > 0 && (
                    <div className="flex items-center gap-1">
                      <span className="text-[10px] text-muted-foreground">Cores:</span>
                      <div className="flex gap-0.5">
                        {aiColors.slice(0, 5).map((color, i) => (
                          <TooltipProvider key={i}>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div
                                  className="h-4 w-4 rounded-sm border border-border/50"
                                  style={{ backgroundColor: color }}
                                />
                              </TooltipTrigger>
                              <TooltipContent side="bottom" className="text-xs">
                                {color}
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Re-analyze button */}
                  {onReanalyze && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-full text-[10px] gap-1"
                      onClick={() => onReanalyze(asset)}
                      disabled={analyzing}
                    >
                      <RefreshCw className="h-3 w-3" />
                      Re-analisar
                    </Button>
                  )}
                </div>
              </CollapsibleContent>
            </div>
          )}

          {/* No tags yet */}
          {!analyzing && !hasAiTags && isImage && onReanalyze && (
            <Button
              variant="ghost"
              size="sm"
              className="mt-2 h-6 w-full text-[10px] gap-1 text-muted-foreground"
              onClick={() => onReanalyze(asset)}
            >
              <Sparkles className="h-3 w-3" />
              Analisar com IA
            </Button>
          )}
        </Collapsible>

        {/* Category badge */}
        <div className="mt-2">
          <Badge 
            variant="secondary" 
            className={cn('text-[10px] capitalize', categoryColors[category])}
          >
            <CategoryIcon className="mr-1 h-3 w-3" />
            {category}
          </Badge>
        </div>
      </div>
    </div>
  )
}
