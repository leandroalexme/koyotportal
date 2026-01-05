'use client'

import { useState, useCallback } from 'react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { PageCard, type PageData } from './components/page-card'
import { LayerTree } from './components/layer-tree'
import { VariablesPanel } from './variables-panel'
import type { FrameNode } from '@/types/studio'

// ============================================
// TYPES
// ============================================

interface LeftSidebarProps {
  pages: PageData[]
  selectedPageId: string | null
  currentPageNode: FrameNode | null
  selectedNodeId: string | null
  onSelectPage: (pageId: string) => void
  onSelectNode: (nodeId: string) => void
}

// ============================================
// LEFT SIDEBAR
// ============================================

export function LeftSidebar({
  pages,
  selectedPageId,
  currentPageNode,
  selectedNodeId,
  onSelectPage,
  onSelectNode,
}: LeftSidebarProps) {
  const [activeTab, setActiveTab] = useState<string>('pages')

  const handleSelectNode = useCallback((nodeId: string) => {
    onSelectNode(nodeId)
  }, [onSelectNode])

  return (
    <aside className="w-64 h-full border-r bg-background flex flex-col overflow-hidden">

      {/* Tabs - Estilo igual ao da imagem de referência */}
      <Tabs 
        value={activeTab} 
        onValueChange={setActiveTab}
        className="flex-1 flex flex-col overflow-hidden"
      >
        <div className="px-2 pt-2">
          <TabsList className="w-full h-9 p-1 bg-muted rounded-lg grid grid-cols-3">
            <TabsTrigger 
              value="pages" 
              className="text-xs rounded-md data-[state=active]:bg-background data-[state=active]:shadow-sm"
            >
              Pages
            </TabsTrigger>
            <TabsTrigger 
              value="layers"
              className="text-xs rounded-md data-[state=active]:bg-background data-[state=active]:shadow-sm"
            >
              Layers
            </TabsTrigger>
            <TabsTrigger 
              value="variables"
              className="text-xs rounded-md data-[state=active]:bg-background data-[state=active]:shadow-sm"
            >
              Variables
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Pages Tab */}
        <TabsContent 
          value="pages" 
          className="flex-1 overflow-hidden mt-0"
        >
          <ScrollArea className="h-full [&_[data-radix-scroll-area-viewport]]:!overflow-y-auto [&_[data-radix-scroll-area-scrollbar]]:w-1.5 [&_[data-radix-scroll-area-thumb]]:bg-zinc-200 [&_[data-radix-scroll-area-thumb]]:rounded-full">
            <div className="p-4 space-y-4">
              {pages.map((page) => (
                <PageCard
                  key={page.id}
                  page={page}
                  isSelected={selectedPageId === page.id}
                  onSelect={onSelectPage}
                />
              ))}
            </div>
          </ScrollArea>
        </TabsContent>

        {/* Layers Tab */}
        <TabsContent 
          value="layers" 
          className="flex-1 overflow-hidden mt-0"
        >
          <LayerTree
            rootNode={currentPageNode}
            selectedLayerId={selectedNodeId}
            onSelectLayer={handleSelectNode}
          />
        </TabsContent>

        {/* Variables Tab */}
        <TabsContent 
          value="variables" 
          className="flex-1 overflow-hidden mt-0"
        >
          <VariablesPanel />
        </TabsContent>
      </Tabs>
    </aside>
  )
}
