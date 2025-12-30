'use client'

import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Card, CardContent } from '@/components/ui/card'

interface SectionCardProps {
  title: string
  description?: string
  href: string
  image?: string
  imageAlt?: string
  variant?: 'default' | 'featured'
  className?: string
}

export function SectionCard({
  title,
  description,
  href,
  image,
  imageAlt,
  variant = 'default',
  className,
}: SectionCardProps) {
  return (
    <Link href={href}>
      <Card
        className={cn(
          'group overflow-hidden transition-shadow hover:shadow-md',
          className
        )}
      >
        <CardContent className="p-0">
          {image && (
            <div
              className={cn(
                'relative bg-muted',
                variant === 'featured' ? 'aspect-video' : 'aspect-square'
              )}
            >
              <Image
                src={image}
                alt={imageAlt || title}
                fill
                className="object-cover"
              />
            </div>
          )}
          <div className="flex items-center justify-between p-4">
            <div>
              <h3 className="font-medium">{title}</h3>
              {description && (
                <p className="mt-1 text-sm text-muted-foreground">
                  {description}
                </p>
              )}
            </div>
            <ArrowRight className="h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-1" />
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
