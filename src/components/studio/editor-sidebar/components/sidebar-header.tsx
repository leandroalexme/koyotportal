'use client'

import { ChevronLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

// ============================================
// TYPES
// ============================================

export type BadgeVariant = 'text' | 'frame' | 'image' | 'rectangle' | 'ellipse'

interface SidebarHeaderProps {
  title: string
  badge?: string
  badgeVariant?: BadgeVariant
  onBack?: () => void
}

// ============================================
// SIDEBAR HEADER
// ============================================

export function SidebarHeader({ title, badge, badgeVariant = 'text', onBack }: SidebarHeaderProps) {
  return (
    <div className="px-6 py-5 flex items-center gap-3">
      {onBack && (
        <Button variant="ghost" size="icon" className="size-8" onClick={onBack}>
          <ChevronLeft className="size-4" />
        </Button>
      )}
      <div className="flex-1 min-w-0 flex items-center justify-between">
        <h3 className="text-base font-medium truncate">{title}</h3>
        {badge && (
          <Badge className="text-xs shrink-0 ml-2 bg-foreground text-background">
            {badge}
          </Badge>
        )}
      </div>
    </div>
  )
}
