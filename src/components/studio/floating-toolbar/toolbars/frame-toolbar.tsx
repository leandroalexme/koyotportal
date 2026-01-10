'use client'

import {
  ChevronDown,
  MoreHorizontal,
  AlignLeft,
  AlignCenter,
  AlignRight,
  LayoutGrid,
  Lock,
  Copy,
  Trash2,
  Sparkles,
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import type { FrameNode, SceneNode } from '@/types/studio'

// ============================================
// TYPES
// ============================================

interface FrameToolbarProps {
  node: FrameNode
  onUpdate: (updates: Partial<SceneNode>) => void
  isButton?: boolean
}

// ============================================
// CONSTANTS
// ============================================

const PRESET_COLORS = [
  '#000000', '#FFFFFF', '#EF4444', '#F97316', '#EAB308', 
  '#22C55E', '#06B6D4', '#3B82F6', '#8B5CF6', '#EC4899',
  'transparent',
]

const CORNER_RADIUS_OPTIONS = [
  { value: 0, label: 'Sem borda' },
  { value: 4, label: 'Pequeno (4)' },
  { value: 8, label: 'Médio (8)' },
  { value: 12, label: 'Grande (12)' },
  { value: 16, label: 'Extra (16)' },
  { value: 9999, label: 'Circular' },
]

// ============================================
// TOOLBAR BUTTON
// ============================================

interface ToolbarButtonProps {
  active?: boolean
  onClick?: () => void
  children: React.ReactNode
  title?: string
}

function ToolbarButton({ active, onClick, children, title }: ToolbarButtonProps) {
  return (
    <Button
      variant="ghost"
      size="icon"
      className={`
        size-8 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800
        ${active ? 'bg-zinc-800 text-white' : ''}
      `}
      onClick={onClick}
      title={title}
    >
      {children}
    </Button>
  )
}

// ============================================
// COLOR PICKER BUTTON
// ============================================

interface ColorPickerButtonProps {
  color: string
  onChange: (color: string) => void
}

function ColorPickerButton({ color, onChange }: ColorPickerButtonProps) {
  const displayColor = color === 'transparent' ? 'transparent' : color
  
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="size-8 rounded-lg hover:bg-zinc-800 p-1"
        >
          <div 
            className={`size-5 rounded border border-zinc-600 ${color === 'transparent' ? 'bg-[url(/checkerboard.svg)]' : ''}`}
            style={{ backgroundColor: displayColor }}
          />
          <ChevronDown className="size-3 text-zinc-400 ml-0.5" />
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-auto p-2 bg-zinc-900 border-zinc-800"
        align="start"
      >
        <div className="grid grid-cols-5 gap-1">
          {PRESET_COLORS.map((c) => (
            <button
              key={c}
              className={`
                size-6 rounded border border-zinc-700 hover:scale-110 transition-transform
                ${c === 'transparent' ? 'bg-[url(/checkerboard.svg)]' : ''}
                ${color === c ? 'ring-2 ring-white ring-offset-1 ring-offset-zinc-900' : ''}
              `}
              style={{ backgroundColor: c === 'transparent' ? undefined : c }}
              onClick={() => onChange(c)}
            />
          ))}
        </div>
      </PopoverContent>
    </Popover>
  )
}

// ============================================
// FRAME TOOLBAR
// ============================================

export function FrameToolbar({ node, onUpdate, isButton }: FrameToolbarProps) {
  // Get current fill color
  const fill = node.fills.find(f => f.type === 'SOLID')
  const currentColor = fill?.type === 'SOLID' ? (fill.color as unknown as string) : 'transparent'
  
  // Get auto layout props
  const autoLayout = node.autoLayout

  // Handlers
  const updateColor = (color: string) => {
    if (color === 'transparent') {
      onUpdate({ fills: [] } as Partial<FrameNode>)
    } else {
      onUpdate({
        fills: [{ type: 'SOLID', color: color as unknown as import('@/types/studio').Color }],
      })
    }
  }

  const updateAutoLayout = (updates: Partial<typeof autoLayout>) => {
    onUpdate({
      autoLayout: { ...autoLayout, ...updates },
    } as Partial<FrameNode>)
  }

  const updateCornerRadius = (radius: number) => {
    onUpdate({
      cornerRadius: radius,
    } as Partial<FrameNode>)
  }

  return (
    <>
      {/* Color Picker */}
      <ColorPickerButton 
        color={currentColor} 
        onChange={updateColor}
      />

      <Separator orientation="vertical" className="h-6 bg-zinc-700 mx-1" />

      {/* Horizontal Alignment */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="size-8 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800"
          >
            {autoLayout.primaryAxisAlignment === 'START' && <AlignLeft className="size-4" />}
            {autoLayout.primaryAxisAlignment === 'CENTER' && <AlignCenter className="size-4" />}
            {autoLayout.primaryAxisAlignment === 'END' && <AlignRight className="size-4" />}
            {!autoLayout.primaryAxisAlignment && <AlignLeft className="size-4" />}
            <ChevronDown className="size-3 ml-0.5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="bg-zinc-900 border-zinc-800">
          <DropdownMenuItem onClick={() => updateAutoLayout({ primaryAxisAlignment: 'START' })}>
            <AlignLeft className="size-4 mr-2" /> Início
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => updateAutoLayout({ primaryAxisAlignment: 'CENTER' })}>
            <AlignCenter className="size-4 mr-2" /> Centro
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => updateAutoLayout({ primaryAxisAlignment: 'END' })}>
            <AlignRight className="size-4 mr-2" /> Fim
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

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

      {isButton && (
        <>
          <Separator orientation="vertical" className="h-6 bg-zinc-700 mx-1" />
          
          {/* Effects for buttons */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="h-8 px-2 rounded-lg text-zinc-300 hover:text-white hover:bg-zinc-800 text-xs font-medium"
              >
                Effects
                <ChevronDown className="size-3 ml-1" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-zinc-900 border-zinc-800">
              <DropdownMenuItem>
                <Sparkles className="size-4 mr-2" /> Sombra
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Sparkles className="size-4 mr-2" /> Brilho
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Sparkles className="size-4 mr-2" /> Gradiente
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </>
      )}

      <Separator orientation="vertical" className="h-6 bg-zinc-700 mx-1" />

      {/* Layout Grid */}
      <ToolbarButton title="Auto Layout">
        <LayoutGrid className="size-4" />
      </ToolbarButton>

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
