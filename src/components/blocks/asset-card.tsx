'use client'

import Image from 'next/image'
import { Download, MoreHorizontal, Eye } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface AssetCardProps {
  name: string
  src: string
  type: 'image' | 'video' | 'document'
  className?: string
}

export function AssetCard({ name, src, type, className }: AssetCardProps) {
  return (
    <Card className={cn('group overflow-hidden', className)}>
      <CardContent className="p-0">
        <div className="relative aspect-square bg-muted">
          {type === 'image' && (
            <Image
              src={src}
              alt={name}
              fill
              className="object-cover transition-transform group-hover:scale-105"
            />
          )}
          <div className="absolute inset-0 flex items-center justify-center gap-2 bg-background/80 opacity-0 transition-opacity group-hover:opacity-100">
            <Button size="icon" variant="secondary">
              <Eye className="h-4 w-4" />
            </Button>
            <Button size="icon" variant="secondary">
              <Download className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="flex items-center justify-between p-3">
          <p className="truncate text-sm font-medium">{name}</p>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>View details</DropdownMenuItem>
              <DropdownMenuItem>Download</DropdownMenuItem>
              <DropdownMenuItem>Copy link</DropdownMenuItem>
              <DropdownMenuItem className="text-destructive">
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardContent>
    </Card>
  )
}
