'use client'

import { useState } from 'react'
import {
  Type,
  Palette,
  Image,
  Hash,
  ToggleLeft,
  Link2,
  MoreHorizontal,
  Pencil,
  Trash2,
  Lock,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useVariablesStore } from '@/stores/variables-store'
import type { Variable, VariableType } from '@/types/variables'

// ============================================
// HELPER: Get icon for variable type
// ============================================

function getVariableIcon(type: VariableType) {
  switch (type) {
    case 'string':
      return <Type className="size-4" />
    case 'color':
      return <Palette className="size-4" />
    case 'image':
      return <Image className="size-4" />
    case 'number':
      return <Hash className="size-4" />
    case 'boolean':
      return <ToggleLeft className="size-4" />
    default:
      return <Type className="size-4" />
  }
}

// ============================================
// TYPES
// ============================================

interface VariableItemProps {
  variable: Variable
  isEditing?: boolean
  onStartEdit?: () => void
  onEndEdit?: () => void
}

// ============================================
// VARIABLE ITEM
// ============================================

export function VariableItem({
  variable,
  isEditing = false,
  onStartEdit,
  onEndEdit,
}: VariableItemProps) {
  const { setVariableValue, deleteVariable, activeModeId } = useVariablesStore()
  const [localValue, setLocalValue] = useState(
    variable.valuesByMode[activeModeId] ?? variable.valuesByMode['default'] ?? ''
  )

  const currentValue = variable.valuesByMode[activeModeId] ?? variable.valuesByMode['default']
  const isAlias = !!variable.aliasOf
  const isLocked = variable.isLocked

  const handleValueChange = (newValue: string) => {
    setLocalValue(newValue)
  }

  const handleValueBlur = () => {
    if (localValue !== currentValue) {
      setVariableValue(variable.id, localValue)
    }
    onEndEdit?.()
  }

  const handleDelete = () => {
    deleteVariable(variable.id)
  }

  return (
    <div className="group flex items-center gap-2 py-2 px-3 rounded-md hover:bg-accent/50 transition-colors">
      {/* Icon */}
      <span className="text-muted-foreground shrink-0">
        {getVariableIcon(variable.type)}
      </span>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {/* Name */}
        <div className="flex items-center gap-1.5">
          <span className="text-sm font-medium truncate">
            {variable.displayName}
          </span>
          {isAlias && (
            <Link2 className="size-3 text-violet-500 shrink-0" />
          )}
          {isLocked && (
            <Lock className="size-3 text-muted-foreground shrink-0" />
          )}
        </div>

        {/* Value */}
        {isEditing && !isLocked ? (
          <Input
            value={String(localValue)}
            onChange={(e) => handleValueChange(e.target.value)}
            onBlur={handleValueBlur}
            onKeyDown={(e) => e.key === 'Enter' && handleValueBlur()}
            className="h-7 text-xs mt-1"
            autoFocus
          />
        ) : (
          <p 
            className={cn(
              "text-xs text-muted-foreground truncate cursor-pointer",
              !isLocked && "hover:text-foreground"
            )}
            onClick={() => !isLocked && onStartEdit?.()}
          >
            {variable.type === 'color' ? (
              <span className="flex items-center gap-1.5">
                <span 
                  className="size-3 rounded border shrink-0" 
                  style={{ backgroundColor: String(currentValue) }}
                />
                {String(currentValue)}
              </span>
            ) : (
              String(currentValue) || '(vazio)'
            )}
          </p>
        )}
      </div>

      {/* Actions */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="size-6 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <MoreHorizontal className="size-3.5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={onStartEdit} disabled={isLocked}>
            <Pencil className="size-3.5 mr-2" />
            Editar
          </DropdownMenuItem>
          <DropdownMenuItem 
            onClick={handleDelete}
            className="text-destructive focus:text-destructive"
          >
            <Trash2 className="size-3.5 mr-2" />
            Excluir
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
