'use client'

import Image from 'next/image'
import { cn } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useEditorStore } from '@/stores/editor-store'

interface LogoVariant {
  name: string
  src: string
  background?: 'light' | 'dark' | 'transparent'
}

interface LogoBlockProps {
  title?: string
  logos: LogoVariant[]
  className?: string
}

export function LogoBlock({
  title = 'Logo',
  logos,
  className,
}: LogoBlockProps) {
  const { mode } = useEditorStore()

  const getBackgroundClass = (bg?: string) => {
    switch (bg) {
      case 'dark':
        return 'bg-foreground'
      case 'transparent':
        return 'bg-[url("/checkerboard.svg")] bg-repeat'
      default:
        return 'bg-muted'
    }
  }

  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="grid gap-px bg-border sm:grid-cols-2 lg:grid-cols-3">
          {logos.map((logo) => (
            <div
              key={logo.name}
              className={cn(
                'group relative bg-card',
                mode === 'edit' && 'cursor-pointer hover:ring-2 hover:ring-ring'
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
              </div>
              <div className="p-3">
                <p className="text-sm font-medium">{logo.name}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
