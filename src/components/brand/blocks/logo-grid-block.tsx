'use client'

import Image from 'next/image'
import { Download } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import type { BlockProps } from './block-registry'
import type { LogoGridContent } from '@/types'

export default function LogoGridBlock({ block, isEditing }: BlockProps) {
  const content = block.content as LogoGridContent

  const getBackgroundClass = (bg?: string) => {
    switch (bg) {
      case 'dark':
        return 'bg-foreground'
      case 'transparent':
        return 'bg-[linear-gradient(45deg,#e5e5e5_25%,transparent_25%),linear-gradient(-45deg,#e5e5e5_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#e5e5e5_75%),linear-gradient(-45deg,transparent_75%,#e5e5e5_75%)] bg-[length:20px_20px] bg-[position:0_0,0_10px,10px_-10px,-10px_0px]'
      default:
        return 'bg-muted'
    }
  }

  return (
    <Card>
      {(block.title || block.description) && (
        <CardHeader>
          {block.title && <CardTitle>{block.title}</CardTitle>}
          {block.description && <CardDescription>{block.description}</CardDescription>}
        </CardHeader>
      )}
      <CardContent className="p-0">
        <div className="grid gap-px bg-border sm:grid-cols-2 lg:grid-cols-3">
          {content.logos.map((logo) => (
            <div
              key={logo.name}
              className={cn(
                'group relative bg-card',
                isEditing && 'cursor-pointer hover:ring-2 hover:ring-ring'
              )}
            >
              <div
                className={cn(
                  'flex aspect-video items-center justify-center p-8',
                  getBackgroundClass(logo.background)
                )}
              >
                <div className="relative h-full w-full">
                  <Image
                    src={logo.src}
                    alt={logo.name}
                    fill
                    className="object-contain"
                  />
                </div>

                <div className="absolute inset-0 flex items-center justify-center bg-background/80 opacity-0 transition-opacity group-hover:opacity-100">
                  <Button size="sm" variant="secondary" className="gap-2">
                    <Download className="h-4 w-4" />
                    Download
                  </Button>
                </div>
              </div>

              <div className="flex items-center justify-between p-3">
                <div>
                  <p className="text-sm font-medium">{logo.name}</p>
                  {logo.format && (
                    <p className="text-xs text-muted-foreground uppercase">
                      {logo.format}
                    </p>
                  )}
                </div>
                {logo.minSize && (
                  <Badge variant="outline" className="text-xs">
                    Min: {logo.minSize}
                  </Badge>
                )}
              </div>
            </div>
          ))}
        </div>

        {content.description && (
          <div className="border-t p-4">
            <p className="text-sm text-muted-foreground">{content.description}</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
