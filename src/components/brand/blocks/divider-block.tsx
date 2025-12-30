'use client'

import { cn } from '@/lib/utils'
import { Separator } from '@/components/ui/separator'
import type { BlockProps } from './block-registry'
import type { DividerContent } from '@/types'

export default function DividerBlock({ block }: BlockProps) {
  const content = block.content as DividerContent

  const spacingClass = {
    sm: 'my-4',
    md: 'my-8',
    lg: 'my-12',
  }[content.spacing || 'md']

  return (
    <Separator
      className={cn(
        spacingClass,
        content.style === 'dashed' && 'border-dashed',
        content.style === 'dotted' && 'border-dotted'
      )}
    />
  )
}
