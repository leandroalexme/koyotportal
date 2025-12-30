'use client'

import { cn } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useEditorStore } from '@/stores/editor-store'

interface FontStyle {
  name: string
  family: string
  weight: string
  preview?: string
}

interface TypographyBlockProps {
  title?: string
  fonts: FontStyle[]
  className?: string
}

export function TypographyBlock({
  title = 'Typography',
  fonts,
  className,
}: TypographyBlockProps) {
  const { mode } = useEditorStore()

  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {fonts.map((font) => (
          <div
            key={font.name}
            className={cn(
              'rounded-lg border bg-muted/30 p-6',
              mode === 'edit' && 'cursor-pointer hover:ring-2 hover:ring-ring'
            )}
          >
            <div className="mb-4 flex items-baseline justify-between">
              <span className="text-sm font-medium text-muted-foreground">
                {font.name}
              </span>
              <span className="text-xs text-muted-foreground">
                {font.family} · {font.weight}
              </span>
            </div>
            <p
              className="text-4xl leading-tight"
              style={{ fontFamily: font.family, fontWeight: font.weight }}
            >
              {font.preview || 'Aa'}
            </p>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
