'use client'

import { lazy, Suspense } from 'react'
import type { Block, BlockType } from '@/types'
import { Skeleton } from '@/components/ui/skeleton'

// Lazy load block components for better performance
const ColorPaletteBlock = lazy(() => import('./color-palette-block'))
const TypographyShowcaseBlock = lazy(() => import('./typography-showcase-block'))
const LogoGridBlock = lazy(() => import('./logo-grid-block'))
const LogoUsageBlock = lazy(() => import('./logo-usage-block'))
const VoiceToneBlock = lazy(() => import('./voice-tone-block'))
const ImageryStyleBlock = lazy(() => import('./imagery-style-block'))
const TextBlock = lazy(() => import('./text-block'))
const ImageBlock = lazy(() => import('./image-block'))
const DividerBlock = lazy(() => import('./divider-block'))

// Block Registry - Maps block types to their components
const blockComponents: Record<BlockType, React.LazyExoticComponent<React.ComponentType<BlockProps>>> = {
  color_palette: ColorPaletteBlock,
  typography_showcase: TypographyShowcaseBlock,
  logo_grid: LogoGridBlock,
  logo_usage: LogoUsageBlock,
  voice_tone: VoiceToneBlock,
  imagery_style: ImageryStyleBlock,
  spacing_system: TextBlock, // Placeholder
  icon_set: TextBlock, // Placeholder
  pattern_library: TextBlock, // Placeholder
  motion_guidelines: TextBlock, // Placeholder
  text_block: TextBlock,
  image_block: ImageBlock,
  divider: DividerBlock,
  custom: TextBlock, // Fallback
}

export interface BlockProps {
  block: Block
  isEditing?: boolean
  onUpdate?: (content: Block['content']) => void
}

function BlockSkeleton() {
  return (
    <div className="space-y-4 p-6">
      <Skeleton className="h-6 w-1/3" />
      <Skeleton className="h-32 w-full" />
    </div>
  )
}

export function BlockRenderer({ block, isEditing, onUpdate }: BlockProps) {
  const BlockComponent = blockComponents[block.type]

  if (!BlockComponent) {
    return (
      <div className="rounded-lg border border-dashed p-6 text-center text-muted-foreground">
        Unknown block type: {block.type}
      </div>
    )
  }

  return (
    <Suspense fallback={<BlockSkeleton />}>
      <BlockComponent block={block} isEditing={isEditing} onUpdate={onUpdate} />
    </Suspense>
  )
}

// Render an array of blocks
export function BlockList({
  blocks,
  isEditing,
  onUpdateBlock,
}: {
  blocks: Block[]
  isEditing?: boolean
  onUpdateBlock?: (blockId: string, content: Block['content']) => void
}) {
  const sortedBlocks = [...blocks].sort((a, b) => a.order_index - b.order_index)

  return (
    <div className="space-y-8">
      {sortedBlocks.map((block) => (
        <BlockRenderer
          key={block.id}
          block={block}
          isEditing={isEditing}
          onUpdate={onUpdateBlock ? (content) => onUpdateBlock(block.id, content) : undefined}
        />
      ))}
    </div>
  )
}
