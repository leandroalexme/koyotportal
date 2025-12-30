'use client'

import Image from 'next/image'
import { Card, CardContent } from '@/components/ui/card'
import type { BlockProps } from './block-registry'
import type { ImageBlockContent } from '@/types'

export default function ImageBlock({ block, isEditing }: BlockProps) {
  const content = block.content as ImageBlockContent

  return (
    <Card className={isEditing ? 'cursor-pointer hover:ring-2 hover:ring-ring' : ''}>
      <CardContent className="p-0">
        <div className="relative aspect-video overflow-hidden rounded-lg">
          <Image
            src={content.src}
            alt={content.alt || ''}
            fill
            className="object-cover"
          />
        </div>
        {content.caption && (
          <p className="p-4 text-center text-sm text-muted-foreground">
            {content.caption}
          </p>
        )}
      </CardContent>
    </Card>
  )
}
