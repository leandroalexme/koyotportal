'use client'

import Image from 'next/image'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import type { BlockProps } from './block-registry'
import type { ImageryStyleContent } from '@/types'

export default function ImageryStyleBlock({ block }: BlockProps) {
  const content = block.content as ImageryStyleContent

  return (
    <Card>
      {(block.title || block.description) && (
        <CardHeader>
          {block.title && <CardTitle>{block.title}</CardTitle>}
          {block.description && <CardDescription>{block.description}</CardDescription>}
        </CardHeader>
      )}
      <CardContent className="space-y-6">
        {content.style && (
          <div className="rounded-lg bg-muted/50 p-4">
            <h4 className="mb-2 text-sm font-medium">Style</h4>
            <p className="text-muted-foreground">{content.style}</p>
          </div>
        )}

        {content.guidelines && content.guidelines.length > 0 && (
          <div>
            <h4 className="mb-3 text-sm font-medium text-muted-foreground">
              Guidelines
            </h4>
            <ul className="space-y-2">
              {content.guidelines.map((guideline, index) => (
                <li key={index} className="flex items-start gap-2 text-sm">
                  <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-foreground" />
                  {guideline}
                </li>
              ))}
            </ul>
          </div>
        )}

        {content.examples && content.examples.length > 0 && (
          <div>
            <h4 className="mb-3 text-sm font-medium text-muted-foreground">
              Examples
            </h4>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {content.examples.map((example, index) => (
                <div key={index} className="overflow-hidden rounded-lg border">
                  <div className="relative aspect-video bg-muted">
                    <Image
                      src={example.src}
                      alt={example.caption || `Example ${index + 1}`}
                      fill
                      className="object-cover"
                    />
                  </div>
                  {example.caption && (
                    <p className="p-3 text-sm text-muted-foreground">
                      {example.caption}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {content.filters && content.filters.length > 0 && (
          <div>
            <h4 className="mb-3 text-sm font-medium text-muted-foreground">
              Filters & Effects
            </h4>
            <div className="grid gap-2 sm:grid-cols-2">
              {content.filters.map((filter) => (
                <div
                  key={filter.name}
                  className="flex items-center justify-between rounded border p-3"
                >
                  <span className="text-sm">{filter.name}</span>
                  <code className="text-xs text-muted-foreground">{filter.value}</code>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
