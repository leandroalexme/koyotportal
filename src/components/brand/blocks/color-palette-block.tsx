'use client'

import { useState } from 'react'
import { Copy, Check, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import type { BlockProps } from './block-registry'
import type { ColorPaletteContent } from '@/types'

export default function ColorPaletteBlock({ block, isEditing, onUpdate }: BlockProps) {
  const content = block.content as ColorPaletteContent
  const [copiedColor, setCopiedColor] = useState<string | null>(null)

  const copyToClipboard = async (hex: string) => {
    await navigator.clipboard.writeText(hex)
    setCopiedColor(hex)
    setTimeout(() => setCopiedColor(null), 2000)
  }

  const getCategoryColors = (category: string) => {
    return content.colors.filter((c) => c.category === category)
  }

  const categories = ['primary', 'secondary', 'accent', 'neutral', 'semantic']
  const hasCategories = content.colors.some((c) => c.category)

  return (
    <Card>
      {(block.title || block.description) && (
        <CardHeader>
          {block.title && <CardTitle>{block.title}</CardTitle>}
          {block.description && <CardDescription>{block.description}</CardDescription>}
        </CardHeader>
      )}
      <CardContent className="p-0">
        {hasCategories ? (
          <div className="divide-y">
            {categories.map((category) => {
              const categoryColors = getCategoryColors(category)
              if (categoryColors.length === 0) return null

              return (
                <div key={category} className="p-6">
                  <h4 className="mb-4 text-sm font-medium capitalize text-muted-foreground">
                    {category}
                  </h4>
                  <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
                    {categoryColors.map((color) => (
                      <ColorSwatch
                        key={color.hex}
                        color={color}
                        copied={copiedColor === color.hex}
                        onCopy={() => copyToClipboard(color.hex)}
                        isEditing={isEditing}
                      />
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="grid gap-px bg-border sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
            {content.colors.map((color) => (
              <ColorSwatch
                key={color.hex}
                color={color}
                copied={copiedColor === color.hex}
                onCopy={() => copyToClipboard(color.hex)}
                isEditing={isEditing}
              />
            ))}
          </div>
        )}

        {isEditing && (
          <div className="border-t p-4">
            <Button variant="outline" size="sm" className="gap-2">
              <Plus className="h-4 w-4" />
              Add Color
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

interface ColorSwatchProps {
  color: ColorPaletteContent['colors'][0]
  copied: boolean
  onCopy: () => void
  isEditing?: boolean
}

function ColorSwatch({ color, copied, onCopy, isEditing }: ColorSwatchProps) {
  return (
    <div
      className={cn(
        'group relative bg-card',
        isEditing && 'cursor-pointer hover:ring-2 hover:ring-ring'
      )}
    >
      <div
        className="aspect-square w-full"
        style={{ backgroundColor: color.hex }}
      />
      <div className="p-3">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium">{color.name}</p>
            <button
              onClick={onCopy}
              className="flex items-center gap-1 text-xs text-muted-foreground uppercase hover:text-foreground"
            >
              {color.hex}
              {copied ? (
                <Check className="h-3 w-3 text-green-500" />
              ) : (
                <Copy className="h-3 w-3 opacity-0 group-hover:opacity-100" />
              )}
            </button>
          </div>
        </div>
        {color.usage && (
          <p className="mt-2 text-xs text-muted-foreground">{color.usage}</p>
        )}
        {color.pantone && (
          <Badge variant="secondary" className="mt-2 text-xs">
            {color.pantone}
          </Badge>
        )}
      </div>
    </div>
  )
}
