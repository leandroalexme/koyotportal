'use client'

import { useState } from 'react'
import { ChevronRight, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { VariableItem } from './variable-item'
import { useVariablesStore } from '@/stores/variables-store'
import type { VariableCollection } from '@/types/variables'

// ============================================
// TYPES
// ============================================

interface CollectionSectionProps {
  collection: VariableCollection
  onAddVariable?: (collectionId: string) => void
}

// ============================================
// COLLECTION SECTION
// ============================================

export function CollectionSection({
  collection,
  onAddVariable,
}: CollectionSectionProps) {
  const [isOpen, setIsOpen] = useState(true)
  const [editingVariableId, setEditingVariableId] = useState<string | null>(null)
  const { getVariablesByCollection } = useVariablesStore()

  const variables = getVariablesByCollection(collection.id)

  return (
    <Collapsible
      open={isOpen}
      onOpenChange={setIsOpen}
      className="group/collapsible"
    >
      <div className="flex items-center justify-between px-3 py-2">
        <CollapsibleTrigger asChild>
          <button className="flex items-center gap-2 text-sm font-medium hover:text-foreground transition-colors">
            <ChevronRight 
              className={cn(
                "size-4 text-muted-foreground transition-transform",
                isOpen && "rotate-90"
              )} 
            />
            {collection.name}
            <span className="text-xs text-muted-foreground font-normal">
              ({variables.length})
            </span>
          </button>
        </CollapsibleTrigger>

        <Button
          variant="ghost"
          size="icon"
          className="size-6 opacity-0 group-hover/collapsible:opacity-100 transition-opacity"
          onClick={() => onAddVariable?.(collection.id)}
        >
          <Plus className="size-3.5" />
        </Button>
      </div>

      <CollapsibleContent>
        <div className="space-y-0.5">
          {variables.length === 0 ? (
            <p className="text-xs text-muted-foreground px-3 py-2">
              Nenhuma variável nesta coleção
            </p>
          ) : (
            variables.map((variable) => (
              <VariableItem
                key={variable.id}
                variable={variable}
                isEditing={editingVariableId === variable.id}
                onStartEdit={() => setEditingVariableId(variable.id)}
                onEndEdit={() => setEditingVariableId(null)}
              />
            ))
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}
