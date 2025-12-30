'use client'

import Image from 'next/image'
import { Check, X } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import type { BlockProps } from './block-registry'
import type { LogoUsageContent } from '@/types'

export default function LogoUsageBlock({ block }: BlockProps) {
  const content = block.content as LogoUsageContent

  return (
    <Card>
      {(block.title || block.description) && (
        <CardHeader>
          {block.title && <CardTitle>{block.title}</CardTitle>}
          {block.description && <CardDescription>{block.description}</CardDescription>}
        </CardHeader>
      )}
      <CardContent>
        <div className="grid gap-8 md:grid-cols-2">
          <div>
            <div className="mb-4 flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-green-100">
                <Check className="h-4 w-4 text-green-600" />
              </div>
              <h4 className="font-medium">Do</h4>
            </div>
            <div className="space-y-4">
              {content.dos.map((item, index) => (
                <div key={index} className="rounded-lg border p-4">
                  {item.image && (
                    <div className="relative mb-3 aspect-video overflow-hidden rounded bg-muted">
                      <Image
                        src={item.image}
                        alt={item.description}
                        fill
                        className="object-contain"
                      />
                    </div>
                  )}
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="mb-4 flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-red-100">
                <X className="h-4 w-4 text-red-600" />
              </div>
              <h4 className="font-medium">Don&apos;t</h4>
            </div>
            <div className="space-y-4">
              {content.donts.map((item, index) => (
                <div key={index} className="rounded-lg border border-red-200 bg-red-50/50 p-4">
                  {item.image && (
                    <div className="relative mb-3 aspect-video overflow-hidden rounded bg-muted">
                      <Image
                        src={item.image}
                        alt={item.description}
                        fill
                        className="object-contain"
                      />
                    </div>
                  )}
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
