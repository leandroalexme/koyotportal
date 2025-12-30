'use client'

import { cn } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useEditorStore } from '@/stores/editor-store'

interface ColorSwatch {
  name: string
  hex: string
  usage?: string
}

interface ColorBlockProps {
  title?: string
  colors: ColorSwatch[]
  className?: string
}

export function ColorBlock({
  title = 'Color',
  colors,
  className,
}: ColorBlockProps) {
  const { mode } = useEditorStore()

  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="grid grid-cols-2 gap-px bg-border sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {colors.map((color) => (
            <div
              key={color.name}
              className={cn(
                'group relative bg-card',
                mode === 'edit' && 'cursor-pointer hover:ring-2 hover:ring-ring'
              )}
            >
              <div
                className="aspect-square w-full"
                style={{ backgroundColor: color.hex }}
              />
              <div className="p-3">
                <p className="text-sm font-medium">{color.name}</p>
                <p className="text-xs text-muted-foreground uppercase">
                  {color.hex}
                </p>
                {color.usage && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    {color.usage}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
