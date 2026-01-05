'use client'

import { useMemo, useCallback } from 'react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { LayerItem, type LayerItemData } from './layer-item'
import { useEditorStore } from '@/stores/editor-store'
import type { SceneNode, FrameNode } from '@/types/studio'

// ============================================
// TYPES
// ============================================

interface LayerTreeProps {
  rootNode: FrameNode | null
  selectedLayerId: string | null
  onSelectLayer: (layerId: string) => void
}

// ============================================
// HELPER: Convert SceneNode to LayerItemData
// ============================================

function sceneNodeToLayerData(node: SceneNode): LayerItemData {
  const governance = node.governance
  const baseData: LayerItemData = {
    id: node.id,
    name: node.name,
    type: node.type,
    isVisible: node.visible,
    isEditable: governance ? (!governance.isContentOnly && governance.editableBy.includes('member')) : true,
    isLocked: node.locked,
  }

  if (node.type === 'FRAME') {
    const frameNode = node as FrameNode
    return {
      ...baseData,
      children: frameNode.children.map(sceneNodeToLayerData),
    }
  }

  return baseData
}

// ============================================
// LAYER TREE COMPONENT
// ============================================

export function LayerTree({ 
  rootNode, 
  selectedLayerId,
  onSelectLayer,
}: LayerTreeProps) {
  const { toggleNodeVisibility, toggleNodeLock } = useEditorStore()
  
  const layerData = useMemo(() => {
    if (!rootNode) return null
    return sceneNodeToLayerData(rootNode)
  }, [rootNode])

  const handleToggleVisibility = useCallback((layerId: string) => {
    toggleNodeVisibility(layerId)
  }, [toggleNodeVisibility])

  const handleToggleLock = useCallback((layerId: string) => {
    toggleNodeLock(layerId)
  }, [toggleNodeLock])

  if (!layerData) {
    return (
      <div className="flex items-center justify-center h-32 text-sm text-muted-foreground">
        Nenhuma camada disponível
      </div>
    )
  }

  return (
    <ScrollArea className="h-full [&_[data-radix-scroll-area-scrollbar]]:w-1.5 [&_[data-radix-scroll-area-thumb]]:bg-zinc-200 [&_[data-radix-scroll-area-thumb]]:rounded-full">
      <div className="p-3">
        <LayerItem
          layer={layerData}
          selectedId={selectedLayerId}
          onSelect={onSelectLayer}
          onToggleVisibility={handleToggleVisibility}
          onToggleLock={handleToggleLock}
        />
      </div>
    </ScrollArea>
  )
}
