import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'

interface BrandHomeProps {
  params: Promise<{ brand_id: string }>
}

const featuredSections = [
  {
    title: 'Logo',
    href: '/identity#logo',
    preview: 'K',
    bg: 'bg-muted',
  },
  {
    title: 'Typography',
    href: '/identity#typography',
    preview: 'Aa',
    bg: 'bg-muted/50',
  },
  {
    title: 'Color',
    href: '/identity#color',
    preview: null,
    bg: 'bg-gradient-to-br from-neutral-200 via-neutral-300 to-neutral-400',
  },
  {
    title: 'Images & videos',
    href: '/assets',
    preview: null,
    bg: 'bg-muted',
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
  const { brand_id } = await params
  const basePath = `/${brand_id}`

  return (
    <div className="min-h-screen">
      <div className="border-b bg-foreground py-6">
        <div className="container mx-auto px-6">
          <div className="h-2 w-full rounded-full bg-gradient-to-r from-neutral-600 via-neutral-400 to-neutral-600" />
        </div>
      </div>

      <div className="container mx-auto px-6 py-12">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {featuredSections.map((section) => (
            <Link key={section.title} href={`${basePath}${section.href}`}>
              <Card className="group overflow-hidden transition-shadow hover:shadow-md">
                <CardContent className="p-0">
                  <div className={`flex aspect-square items-center justify-center ${section.bg}`}>
                    {section.preview && (
                      <span className="text-5xl font-bold">{section.preview}</span>
                    )}
                  </div>
                  <div className="flex items-center justify-between p-4">
                    <h3 className="font-medium">{section.title}</h3>
                    <ArrowRight className="h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-1" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        <Separator className="my-12" />

        <div className="grid gap-6 md:grid-cols-3">
          {quickLinks.map((link) => (
            <Link key={link.title} href={`${basePath}${link.href}`}>
              <Card className="group h-full transition-shadow hover:shadow-md">
                <CardContent className="flex h-full items-center justify-between p-6">
                  <div>
                    <h3 className="font-medium">{link.title}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {link.description}
                    </p>
                  </div>
                  <ArrowRight className="h-5 w-5 flex-shrink-0 text-muted-foreground transition-transform group-hover:translate-x-1" />
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
