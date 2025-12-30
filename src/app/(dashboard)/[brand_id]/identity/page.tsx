'use client'

import { BlockList } from '@/components/brand/blocks'
import { Separator } from '@/components/ui/separator'
import { useEditorStore } from '@/store/editor-store'
import type { Block, ColorPaletteContent, TypographyShowcaseContent } from '@/types'

const demoBlocks: Block[] = [
  {
    id: '1',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    page_id: 'identity',
    type: 'color_palette',
    title: 'Color Palette',
    description: 'Our brand colors define the visual identity across all touchpoints.',
    content: {
      colors: [
        { name: 'Primary Black', hex: '#0A0A0A', usage: 'Headlines, CTAs', category: 'primary' },
        { name: 'Dark Gray', hex: '#404040', usage: 'Body text', category: 'primary' },
        { name: 'Medium Gray', hex: '#737373', usage: 'Captions', category: 'secondary' },
        { name: 'Light Gray', hex: '#A3A3A3', usage: 'Disabled states', category: 'secondary' },
        { name: 'Border', hex: '#E5E5E5', usage: 'Dividers, borders', category: 'neutral' },
        { name: 'Background', hex: '#FAFAFA', usage: 'Page backgrounds', category: 'neutral' },
        { name: 'White', hex: '#FFFFFF', usage: 'Cards, surfaces', category: 'neutral' },
      ],
    } as ColorPaletteContent,
    order_index: 0,
    is_visible: true,
    ai_generated: false,
    ai_prompt: null,
    ai_model: null,
  },
  {
    id: '2',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    page_id: 'identity',
    type: 'typography_showcase',
    title: 'Typography',
    description: 'Our type system creates hierarchy and enhances readability.',
    content: {
      fonts: [
        {
          name: 'Display',
          family: 'Inter',
          weight: '700',
          usage: 'Headlines and titles',
          source: 'google',
          preview: 'Aa Bb Cc Dd',
        },
        {
          name: 'Body',
          family: 'Inter',
          weight: '400',
          usage: 'Paragraphs and body text',
          source: 'google',
          preview: 'Aa Bb Cc Dd',
        },
        {
          name: 'Mono',
          family: 'JetBrains Mono',
          weight: '400',
          usage: 'Code and technical content',
          source: 'google',
          preview: 'Aa Bb Cc Dd',
        },
      ],
      scale: [
        { name: 'Display', size: '3rem', lineHeight: '1.1' },
        { name: 'H1', size: '2.25rem', lineHeight: '1.2' },
        { name: 'H2', size: '1.875rem', lineHeight: '1.25' },
        { name: 'H3', size: '1.5rem', lineHeight: '1.3' },
        { name: 'Body', size: '1rem', lineHeight: '1.5' },
        { name: 'Small', size: '0.875rem', lineHeight: '1.5' },
      ],
    } as TypographyShowcaseContent,
    order_index: 1,
    is_visible: true,
    ai_generated: false,
    ai_prompt: null,
    ai_model: null,
  },
]

export default function IdentityPage() {
  const { mode } = useEditorStore()

  return (
    <div className="container mx-auto px-6 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Visual Identity</h1>
        <p className="mt-2 text-muted-foreground">
          The visual foundation of our brand
        </p>
      </div>

      <section id="logo" className="mb-12">
        <h2 className="mb-6 text-xl font-semibold">Logo</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="flex aspect-video items-center justify-center rounded-lg border bg-muted">
            <span className="text-4xl font-bold tracking-tighter">KOYOT</span>
          </div>
          <div className="flex aspect-video items-center justify-center rounded-lg border bg-foreground">
            <span className="text-4xl font-bold tracking-tighter text-background">
              KOYOT
            </span>
          </div>
          <div className="flex aspect-video items-center justify-center rounded-lg border">
            <span className="text-4xl font-bold tracking-tighter">K</span>
          </div>
        </div>
      </section>

      <Separator className="my-12" />

      <BlockList blocks={demoBlocks} isEditing={mode === 'edit'} />
    </div>
  )
}
