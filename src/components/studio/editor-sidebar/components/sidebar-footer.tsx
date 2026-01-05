'use client'

import { Undo2, Redo2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

// ============================================
// TYPES
// ============================================

interface SidebarFooterProps {
  onUndo?: () => void
  onRedo?: () => void
  canUndo?: boolean
  canRedo?: boolean
  status?: 'saved' | 'saving' | 'unsaved'
}

// ============================================
// SIDEBAR FOOTER
// ============================================

export function SidebarFooter({ 
  onUndo, 
  onRedo, 
  canUndo = false, 
  canRedo = false,
  status = 'saved' 
}: SidebarFooterProps) {
  const statusText = {
    saved: 'Salvo',
    saving: 'Salvando...',
    unsaved: 'Não salvo',
  }

  return (
    <div className="px-6 py-5 bg-muted/50 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Button 
          variant="ghost" 
          size="icon" 
          className="size-8 bg-muted/50" 
          disabled={!canUndo}
          onClick={onUndo}
        >
          <Undo2 className="size-4" />
        </Button>
        <Button 
          variant="ghost" 
          size="icon" 
          className="size-8 bg-muted/50" 
          disabled={!canRedo}
          onClick={onRedo}
        >
          <Redo2 className="size-4" />
        </Button>
      </div>
      <span className="text-sm font-medium text-muted-foreground">{statusText[status]}</span>
    </div>
  )
}
