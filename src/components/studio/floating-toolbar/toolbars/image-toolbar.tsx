'use client'

import {
  ChevronDown,
  MoreHorizontal,
  Lock,
  Copy,
  Trash2,
  Replace,
  Crop,
  FlipHorizontal,
  FlipVertical,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { ImageNode, SceneNode } from '@/types/studio'

// ============================================
// TYPES
// ============================================

interface ImageToolbarProps {
  node: ImageNode
  onUpdate: (updates: Partial<SceneNode>) => void
  isLogo?: boolean
}

// ============================================
// CONSTANTS
// ============================================

const CORNER_RADIUS_OPTIONS = [
  { value: 0, label: 'Sem borda' },
  { value: 4, label: 'Pequeno (4)' },
  { value: 8, label: 'Médio (8)' },
  { value: 12, label: 'Grande (12)' },
  { value: 9999, label: 'Circular' },
]

// ============================================
// IMAGE TOOLBAR
// ============================================

export function ImageToolbar({ node, onUpdate, isLogo }: ImageToolbarProps) {
  // ImageProps doesn't have scaleMode, so we'll use a simple approach
  const updateImageProps = (updates: Partial<typeof node.imageProps>) => {
    onUpdate({
      imageProps: { ...node.imageProps, ...updates },
    } as Partial<ImageNode>)
  }
  
  // Placeholder for scale mode - would need to be added to ImageProps type
  void updateImageProps

  const updateCornerRadius = (radius: number) => {
    onUpdate({
      cornerRadius: radius,
    } as Partial<ImageNode>)
  }

  return (
    <>
      {/* Corner Radius */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="size-8 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="size-4">
              <path 
                d="M2 10V6C2 3.79086 3.79086 2 6 2H10" 
                stroke="currentColor" 
                strokeWidth="1.5" 
                strokeLinecap="round"
              />
            </svg>
            <ChevronDown className="size-3 ml-0.5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="bg-zinc-900 border-zinc-800">
          {CORNER_RADIUS_OPTIONS.map((option) => (
            <DropdownMenuItem 
              key={option.value}
              onClick={() => updateCornerRadius(option.value)}
              className={node.cornerRadius === option.value ? 'bg-zinc-800' : ''}
            >
              {option.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {!isLogo && (
        <>
          <Separator orientation="vertical" className="h-6 bg-zinc-700 mx-1" />

          {/* Crop */}
          <Button
            variant="ghost"
            size="icon"
            className="size-8 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800"
            title="Cortar"
          >
            <Crop className="size-4" />
          </Button>

          {/* Flip */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="size-8 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800"
              >
                <FlipHorizontal className="size-4" />
                <ChevronDown className="size-3 ml-0.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-zinc-900 border-zinc-800">
              <DropdownMenuItem>
                <FlipHorizontal className="size-4 mr-2" /> Espelhar horizontal
              </DropdownMenuItem>
              <DropdownMenuItem>
                <FlipVertical className="size-4 mr-2" /> Espelhar vertical
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </>
      )}

      <Separator orientation="vertical" className="h-6 bg-zinc-700 mx-1" />

      {/* Replace */}
      <Button
        variant="ghost"
        size="icon"
        className="size-8 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800"
        title="Substituir imagem"
      >
        <Replace className="size-4" />
      </Button>

      {/* More Options */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="size-8 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800"
          >
            <MoreHorizontal className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="bg-zinc-900 border-zinc-800 w-48" align="end">
          <DropdownMenuItem>
            <Copy className="size-4 mr-2" />
            Duplicar
            <span className="ml-auto text-xs text-zinc-500">⌘D</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator className="bg-zinc-800" />
          <DropdownMenuItem>
            <Lock className="size-4 mr-2" />
            Bloquear
          </DropdownMenuItem>
          <DropdownMenuSeparator className="bg-zinc-800" />
          <DropdownMenuItem className="text-red-400 focus:text-red-400">
            <Trash2 className="size-4 mr-2" />
            Excluir
            <span className="ml-auto text-xs text-zinc-500">⌫</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  )
}
