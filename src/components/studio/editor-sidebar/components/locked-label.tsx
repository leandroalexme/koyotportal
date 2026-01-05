'use client'

import { Lock } from 'lucide-react'
import { Label } from '@/components/ui/label'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

// ============================================
// TYPES
// ============================================

interface LockedLabelProps {
  children: React.ReactNode
  locked?: boolean
  tooltipText?: string
}

// ============================================
// LOCKED LABEL
// ============================================

export function LockedLabel({ 
  children, 
  locked, 
  tooltipText = 'Este controle está bloqueado pelo administrador da marca.' 
}: LockedLabelProps) {
  if (locked) {
    return (
      <TooltipProvider delayDuration={200}>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-1.5 cursor-help">
              <Lock className="size-3 text-muted-foreground" />
              <Label className="text-sm font-normal text-muted-foreground cursor-help">{children}</Label>
            </div>
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-[200px]">
            <p className="text-xs">{tooltipText}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }
  
  return (
    <Label className="text-sm font-normal text-muted-foreground">{children}</Label>
  )
}
