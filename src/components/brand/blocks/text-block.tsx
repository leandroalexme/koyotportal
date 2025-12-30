'use client'

import { Card, CardContent } from '@/components/ui/card'
import type { BlockProps } from './block-registry'
import type { TextBlockContent } from '@/types'

export default function TextBlock({ block, isEditing }: BlockProps) {
  const content = block.content as TextBlockContent

  return (
    <Card className={isEditing ? 'cursor-pointer hover:ring-2 hover:ring-ring' : ''}>
      <CardContent className="prose prose-neutral max-w-none p-6 dark:prose-invert">
        {content.format === 'html' ? (
          <div dangerouslySetInnerHTML={{ __html: content.content }} />
        ) : (
          <p className="whitespace-pre-wrap">{content.content}</p>
        )}
      </CardContent>
    </Card>
  )
}
