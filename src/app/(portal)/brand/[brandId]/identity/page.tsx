import { ColorBlock, TypographyBlock } from '@/components/blocks'
import { Separator } from '@/components/ui/separator'

const brandColors = [
  { name: 'Primary Black', hex: '#0A0A0A', usage: 'Headlines, CTAs' },
  { name: 'Secondary', hex: '#404040', usage: 'Body text' },
  { name: 'Muted', hex: '#737373', usage: 'Captions' },
  { name: 'Border', hex: '#E5E5E5', usage: 'Dividers' },
  { name: 'Background', hex: '#FAFAFA', usage: 'Surfaces' },
  { name: 'White', hex: '#FFFFFF', usage: 'Cards' },
]

const brandFonts = [
  {
    name: 'Display',
    family: 'Inter',
    weight: '700',
    preview: 'Aa Bb Cc',
  },
  {
    name: 'Body',
    family: 'Inter',
    weight: '400',
    preview: 'Aa Bb Cc',
  },
  {
    name: 'Mono',
    family: 'JetBrains Mono',
    weight: '400',
    preview: 'Aa Bb Cc',
  },
]

export default function IdentityPage() {
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

      <section id="typography" className="mb-12">
        <TypographyBlock title="Typography" fonts={brandFonts} />
      </section>

      <Separator className="my-12" />

      <section id="color">
        <ColorBlock title="Color Palette" colors={brandColors} />
      </section>
    </div>
  )
}
