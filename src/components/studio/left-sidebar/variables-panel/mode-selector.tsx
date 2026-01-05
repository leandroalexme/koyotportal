'use client'

import { Check, ChevronDown, Layers } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu'
import { useVariableMode } from '@/hooks/use-variables'

// ============================================
// MODE SELECTOR
// Allows switching between variable modes/contexts
// ============================================

export function ModeSelector() {
  const { activeModeId, availableModes, setActiveMode } = useVariableMode()
  
  const activeModeName = availableModes.find(m => m.id === activeModeId)?.name || 'Padrão'

  if (availableModes.length <= 1) {
    return null
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-8 gap-2 text-xs"
        >
          <Layers className="size-3.5" />
          {activeModeName}
          <ChevronDown className="size-3 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-48">
        <DropdownMenuLabel className="text-xs text-muted-foreground">
          Modo de Variáveis
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {availableModes.map((mode) => (
          <DropdownMenuItem
            key={mode.id}
            onClick={() => setActiveMode(mode.id)}
            className="flex items-center justify-between"
          >
            <span>{mode.name}</span>
            {activeModeId === mode.id && (
              <Check className="size-4 text-violet-600" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

// ============================================
// MODE INDICATOR
// Shows current mode in a compact format
// ============================================

interface ModeIndicatorProps {
  className?: string
}

export function ModeIndicator({ className }: ModeIndicatorProps) {
  const { activeModeId, availableModes } = useVariableMode()
  
  const activeModeName = availableModes.find(m => m.id === activeModeId)?.name || 'Padrão'

  if (availableModes.length <= 1) {
    return null
  }

  return (
    <div className={cn(
      "flex items-center gap-1.5 text-xs text-muted-foreground",
      className
    )}>
      <Layers className="size-3" />
      <span>{activeModeName}</span>
    </div>
  )
}
