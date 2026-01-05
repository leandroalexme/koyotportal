'use client'

import { useState } from 'react'
import { Link2, Link2Off } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { usePropertyBinding, useFilteredVariables } from '@/hooks/use-variables'
import type { VariableType, VariableScope } from '@/types/variables'

// ============================================
// TYPES
// ============================================

interface VariableLinkButtonProps {
  nodeId: string
  property: string
  variableType: VariableType
  scope: VariableScope
  disabled?: boolean
}

// ============================================
// VARIABLE LINK BUTTON
// ============================================

export function VariableLinkButton({
  nodeId,
  property,
  variableType,
  scope,
  disabled = false,
}: VariableLinkButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const { isLinked, variable, link, unlink } = usePropertyBinding(nodeId, property)
  
  const availableVariables = useFilteredVariables({
    type: variableType,
    scope,
  })

  const handleSelectVariable = (variableId: string) => {
    link(variableId)
    setIsOpen(false)
  }

  const handleUnlink = () => {
    unlink()
    setIsOpen(false)
  }

  if (disabled) {
    return null
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "size-6 shrink-0",
            isLinked && "text-violet-600 hover:text-violet-700"
          )}
        >
          {isLinked ? (
            <Link2 className="size-3.5" />
          ) : (
            <Link2Off className="size-3.5 text-muted-foreground" />
          )}
        </Button>
      </PopoverTrigger>
      
      <PopoverContent align="end" className="w-64 p-0">
        <div className="p-3 border-b">
          <h4 className="text-sm font-medium">
            {isLinked ? 'Variável Conectada' : 'Conectar Variável'}
          </h4>
          <p className="text-xs text-muted-foreground mt-1">
            {isLinked 
              ? 'Esta propriedade está linkada a uma variável'
              : 'Selecione uma variável para conectar'
            }
          </p>
        </div>

        {isLinked && variable && (
          <div className="p-3 border-b bg-violet-50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-violet-900">
                  {variable.displayName}
                </p>
                <p className="text-xs text-violet-600">
                  {variable.name}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="text-xs text-violet-600 hover:text-violet-700"
                onClick={handleUnlink}
              >
                <Link2Off className="size-3 mr-1" />
                Desconectar
              </Button>
            </div>
          </div>
        )}

        <ScrollArea className="max-h-48">
          <div className="p-2">
            {availableVariables.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-4">
                Nenhuma variável disponível.
                <br />
                Crie uma na aba Variables.
              </p>
            ) : (
              <div className="space-y-1">
                {availableVariables.map((v) => (
                  <button
                    key={v.id}
                    onClick={() => handleSelectVariable(v.id)}
                    className={cn(
                      "w-full flex items-center justify-between p-2 rounded-md text-left transition-colors",
                      "hover:bg-accent",
                      variable?.id === v.id && "bg-violet-100"
                    )}
                  >
                    <div>
                      <p className="text-sm">{v.displayName}</p>
                      <p className="text-xs text-muted-foreground">{v.name}</p>
                    </div>
                    {variable?.id === v.id && (
                      <Badge variant="secondary" className="text-violet-600">
                        Ativo
                      </Badge>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  )
}

// ============================================
// VARIABLE INDICATOR
// Shows when a property is linked to a variable
// ============================================

interface VariableIndicatorProps {
  nodeId: string
  property: string
}

export function VariableIndicator({ nodeId, property }: VariableIndicatorProps) {
  const { isLinked, variable } = usePropertyBinding(nodeId, property)

  if (!isLinked || !variable) {
    return null
  }

  return (
    <Badge 
      variant="secondary" 
      className="text-violet-600 bg-violet-100 text-[10px] px-1.5 py-0"
    >
      <Link2 className="size-2.5 mr-1" />
      {variable.displayName}
    </Badge>
  )
}
