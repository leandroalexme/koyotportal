'use client'

import { cn } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { BlockProps } from './block-registry'
import type { TypographyShowcaseContent } from '@/types'

export default function TypographyShowcaseBlock({ block, isEditing }: BlockProps) {
  const content = block.content as TypographyShowcaseContent

  return (
    <Card>
      {(block.title || block.description) && (
        <CardHeader>
          {block.title && <CardTitle>{block.title}</CardTitle>}
          {block.description && <CardDescription>{block.description}</CardDescription>}
        </CardHeader>
      )}
      <CardContent className="space-y-6">
        {content.fonts.map((font) => (
          <div
            key={font.name}
            className={cn(
              'rounded-lg border bg-muted/30 p-6',
              isEditing && 'cursor-pointer hover:ring-2 hover:ring-ring'
            )}
          >
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">{font.name}</span>
                {font.source && (
                  <Badge variant="outline" className="text-xs capitalize">
                    {font.source}
                  </Badge>
                )}
              </div>
              <span className="text-xs text-muted-foreground">
                {font.family} · {font.weight}
                {font.style === 'italic' && ' Italic'}
              </span>
            </div>

            <p
              className="text-5xl leading-tight"
              style={{
                fontFamily: font.family,
                fontWeight: font.weight,
                fontStyle: font.style || 'normal',
              }}
            >
              {font.preview || 'Aa Bb Cc Dd Ee Ff Gg'}
            </p>

            <p
              className="mt-4 text-lg"
              style={{
                fontFamily: font.family,
                fontWeight: font.weight,
                fontStyle: font.style || 'normal',
              }}
            >
              The quick brown fox jumps over the lazy dog. 0123456789
            </p>

            {font.usage && (
              <p className="mt-4 text-sm text-muted-foreground">{font.usage}</p>
            )}

            {font.fallback && (
              <p className="mt-2 text-xs text-muted-foreground">
                Fallback: {font.fallback}
              </p>
            )}
          </div>
        ))}

        {content.scale && content.scale.length > 0 && (
          <div className="rounded-lg border p-6">
            <h4 className="mb-4 text-sm font-medium text-muted-foreground">
              Type Scale
            </h4>
            <div className="space-y-4">
              {content.scale.map((item) => (
                <div
                  key={item.name}
                  className="flex items-baseline justify-between border-b pb-2 last:border-0"
                >
                  <span
                    style={{
                      fontSize: item.size,
                      lineHeight: item.lineHeight,
                      letterSpacing: item.letterSpacing,
                    }}
                  >
                    {item.name}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {item.size} / {item.lineHeight}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
