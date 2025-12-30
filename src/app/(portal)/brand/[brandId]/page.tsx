import { SectionCard } from '@/components/blocks'
import { Separator } from '@/components/ui/separator'

interface BrandHomeProps {
  params: Promise<{ brandId: string }>
}

const featuredSections = [
  {
    title: 'Logo',
    href: '/identity#logo',
    image: '/placeholder-logo.svg',
  },
  {
    title: 'Typography',
    href: '/identity#typography',
    image: '/placeholder-typography.svg',
  },
  {
    title: 'Color',
    href: '/identity#color',
    image: '/placeholder-color.svg',
  },
  {
    title: 'Images & videos',
    href: '/assets',
    image: '/placeholder-images.svg',
  },
]

const quickLinks = [
  {
    title: 'Worth Bookmarking',
    description: 'Essential brand resources',
    href: '/bookmarks',
  },
  {
    title: 'Shape Illustrations',
    description: 'A curated collection of minimalist geometric designs',
    href: '/assets/illustrations',
  },
  {
    title: 'Documents',
    description: 'From marketing materials to internal documents',
    href: '/assets/documents',
  },
]

export default async function BrandHome({ params }: BrandHomeProps) {
  const { brandId } = await params
  const basePath = `/brand/${brandId}`

  return (
    <div className="min-h-screen">
      <div className="border-b bg-foreground py-6">
        <div className="container mx-auto px-6">
          <div className="h-2 w-full rounded-full bg-gradient-to-r from-muted via-muted-foreground to-muted" />
        </div>
      </div>

      <div className="container mx-auto px-6 py-12">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {featuredSections.map((section) => (
            <SectionCard
              key={section.title}
              title={section.title}
              href={`${basePath}${section.href}`}
              image={section.image}
              variant="featured"
            />
          ))}
        </div>

        <Separator className="my-12" />

        <div className="grid gap-6 md:grid-cols-3">
          {quickLinks.map((link) => (
            <SectionCard
              key={link.title}
              title={link.title}
              description={link.description}
              href={`${basePath}${link.href}`}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
