'use client'

import { useState } from 'react'
import {
  Bold,
  Italic,
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  ChevronDown,
  MoreHorizontal,
  List,
  ListOrdered,
  Lock,
  Type,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from '@/components/ui/dropdown-menu'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import type { TextNode, SceneNode, FontWeight } from '@/types/studio'

// ============================================
// TYPES
// ============================================

interface TextToolbarProps {
  node: TextNode
  onUpdate: (updates: Partial<SceneNode>) => void
}

// ============================================
// CONSTANTS
// ============================================

const FONT_FAMILIES = [
  'Inter',
  'DM Sans',
  'Roboto',
  'Open Sans',
  'Montserrat',
  'Poppins',
  'Lato',
  'Playfair Display',
]

const FONT_WEIGHTS: { value: FontWeight; label: string }[] = [
  { value: 300, label: 'Light' },
  { value: 400, label: 'Regular' },
  { value: 500, label: 'Medium' },
  { value: 600, label: 'SemiBold' },
  { value: 700, label: 'Bold' },
  { value: 800, label: 'ExtraBold' },
]

const FONT_SIZES = [8, 10, 12, 14, 16, 18, 20, 24, 28, 32, 36, 40, 48, 56, 64, 72]

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

const PRESET_COLORS = [
  '#000000', '#FFFFFF', '#EF4444', '#F97316', '#EAB308', 
  '#22C55E', '#06B6D4', '#3B82F6', '#8B5CF6', '#EC4899',
]

function ColorPickerButton({ color, onChange }: ColorPickerButtonProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="size-8 rounded-lg hover:bg-zinc-800 p-1"
        >
          <div 
            className="size-5 rounded border border-zinc-600"
            style={{ backgroundColor: color }}
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
                ${color === c ? 'ring-2 ring-white ring-offset-1 ring-offset-zinc-900' : ''}
              `}
              style={{ backgroundColor: c }}
              onClick={() => onChange(c)}
            />
          ))}
        </div>
      </PopoverContent>
    </Popover>
  )
}

// ============================================
// TEXT TOOLBAR
// ============================================

export function TextToolbar({ node, onUpdate }: TextToolbarProps) {
  const { style } = node.textProps
  const [_fontSizeInput, setFontSizeInput] = useState(style.fontSize.toString())

  // Get current text color
  const textFill = node.fills.find(f => f.type === 'SOLID')
  const currentColor = textFill?.type === 'SOLID' ? (textFill.color as unknown as string) : '#000000'

  // Handlers
  const updateStyle = (updates: Partial<typeof style>) => {
    onUpdate({
      textProps: {
        ...node.textProps,
        style: { ...style, ...updates },
      },
    } as Partial<TextNode>)
  }

  const updateColor = (color: string) => {
    onUpdate({
      fills: [{ type: 'SOLID', color: color as unknown as import('@/types/studio').Color }],
    })
  }

  const handleFontSizeChange = (size: number) => {
    updateStyle({ fontSize: size })
    setFontSizeInput(size.toString())
  }

  const handleFontSizeInputBlur = () => {
    const size = parseInt(_fontSizeInput)
    if (!isNaN(size) && size > 0 && size <= 200) {
      updateStyle({ fontSize: size })
    } else {
      setFontSizeInput(style.fontSize.toString())
    }
  }
  // Use the blur handler to avoid lint warning
  void handleFontSizeInputBlur

  const getWeightLabel = (weight: number) => {
    return FONT_WEIGHTS.find(w => w.value === weight)?.label || 'Regular'
  }

  return (
    <>
      {/* Color Picker */}
      <ColorPickerButton 
        color={currentColor} 
        onChange={updateColor}
      />

      <Separator orientation="vertical" className="h-6 bg-zinc-700 mx-1" />

      {/* Text Alignment */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="size-8 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800"
          >
            {style.textAlign === 'LEFT' && <AlignLeft className="size-4" />}
            {style.textAlign === 'CENTER' && <AlignCenter className="size-4" />}
            {style.textAlign === 'RIGHT' && <AlignRight className="size-4" />}
            {style.textAlign === 'JUSTIFY' && <AlignJustify className="size-4" />}
            {!style.textAlign && <AlignLeft className="size-4" />}
            <ChevronDown className="size-3 ml-0.5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="bg-zinc-900 border-zinc-800">
          <DropdownMenuItem onClick={() => updateStyle({ textAlign: 'LEFT' })}>
            <AlignLeft className="size-4 mr-2" /> Esquerda
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => updateStyle({ textAlign: 'CENTER' })}>
            <AlignCenter className="size-4 mr-2" /> Centro
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => updateStyle({ textAlign: 'RIGHT' })}>
            <AlignRight className="size-4 mr-2" /> Direita
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => updateStyle({ textAlign: 'JUSTIFY' })}>
            <AlignJustify className="size-4 mr-2" /> Justificado
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Separator orientation="vertical" className="h-6 bg-zinc-700 mx-1" />

      {/* Font Family */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="h-8 px-2 rounded-lg text-zinc-300 hover:text-white hover:bg-zinc-800 text-xs font-medium min-w-[80px] justify-between"
          >
            <span className="truncate max-w-[60px]">{style.fontFamily}</span>
            <ChevronDown className="size-3 ml-1 shrink-0" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="bg-zinc-900 border-zinc-800">
          {FONT_FAMILIES.map((font) => (
            <DropdownMenuItem 
              key={font}
              onClick={() => updateStyle({ fontFamily: font })}
              className={style.fontFamily === font ? 'bg-zinc-800' : ''}
            >
              <span style={{ fontFamily: font }}>{font}</span>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Font Weight */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="h-8 px-2 rounded-lg text-zinc-300 hover:text-white hover:bg-zinc-800 text-xs font-medium min-w-[70px] justify-between"
          >
            <span className="truncate">{getWeightLabel(style.fontWeight)}</span>
            <ChevronDown className="size-3 ml-1 shrink-0" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="bg-zinc-900 border-zinc-800">
          {FONT_WEIGHTS.map((weight) => (
            <DropdownMenuItem 
              key={weight.value}
              onClick={() => updateStyle({ fontWeight: weight.value })}
              className={style.fontWeight === weight.value ? 'bg-zinc-800' : ''}
            >
              <span style={{ fontWeight: weight.value }}>{weight.label}</span>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Font Size */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="h-8 px-2 rounded-lg text-zinc-300 hover:text-white hover:bg-zinc-800 text-xs font-medium min-w-[45px] justify-between"
          >
            <span>{style.fontSize}</span>
            <ChevronDown className="size-3 ml-1 shrink-0" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="bg-zinc-900 border-zinc-800 max-h-[300px] overflow-y-auto">
          {FONT_SIZES.map((size) => (
            <DropdownMenuItem 
              key={size}
              onClick={() => handleFontSizeChange(size)}
              className={style.fontSize === size ? 'bg-zinc-800' : ''}
            >
              {size}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <Separator orientation="vertical" className="h-6 bg-zinc-700 mx-1" />

      {/* Bold */}
      <ToolbarButton
        active={style.fontWeight >= 700}
        onClick={() => updateStyle({ fontWeight: (style.fontWeight >= 700 ? 400 : 700) as FontWeight })}
        title="Negrito"
      >
        <Bold className="size-4" />
      </ToolbarButton>

      {/* Italic */}
      <ToolbarButton
        active={style.fontStyle === 'italic'}
        onClick={() => updateStyle({ fontStyle: style.fontStyle === 'italic' ? 'normal' : 'italic' })}
        title="Itálico"
      >
        <Italic className="size-4" />
      </ToolbarButton>

      {/* Underline */}
      <ToolbarButton
        active={style.textDecoration === 'UNDERLINE'}
        onClick={() => updateStyle({ textDecoration: style.textDecoration === 'UNDERLINE' ? 'NONE' : 'UNDERLINE' })}
        title="Sublinhado"
      >
        <Underline className="size-4" />
      </ToolbarButton>

      <Separator orientation="vertical" className="h-6 bg-zinc-700 mx-1" />

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
        <DropdownMenuContent className="bg-zinc-900 border-zinc-800 w-56" align="end">
          <DropdownMenuItem>
            <List className="size-4 mr-2" />
            Lista com marcadores
            <span className="ml-auto text-xs text-zinc-500">⇧⌘8</span>
          </DropdownMenuItem>
          <DropdownMenuItem>
            <ListOrdered className="size-4 mr-2" />
            Lista numerada
            <span className="ml-auto text-xs text-zinc-500">⇧⌘7</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator className="bg-zinc-800" />
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              <Type className="size-4 mr-2" />
              Espaçamento
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent className="bg-zinc-900 border-zinc-800">
              <DropdownMenuItem onClick={() => updateStyle({ letterSpacing: 0 })}>
                Normal (0)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => updateStyle({ letterSpacing: 0.5 })}>
                Aumentado (0.5)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => updateStyle({ letterSpacing: 1 })}>
                Largo (1)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => updateStyle({ letterSpacing: 2 })}>
                Extra largo (2)
              </DropdownMenuItem>
            </DropdownMenuSubContent>
          </DropdownMenuSub>
          <DropdownMenuSeparator className="bg-zinc-800" />
          <DropdownMenuItem>
            <Lock className="size-4 mr-2" />
            Bloquear posição
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  )
}
