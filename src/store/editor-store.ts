'use client'

import { create } from 'zustand'
import type { Block } from '@/types'

type EditorMode = 'view' | 'edit'

interface EditorState {
  mode: EditorMode
  selectedBlockId: string | null
  isDragging: boolean
  hasUnsavedChanges: boolean
  
  setMode: (mode: EditorMode) => void
  toggleMode: () => void
  selectBlock: (blockId: string | null) => void
  setDragging: (isDragging: boolean) => void
  setUnsavedChanges: (hasChanges: boolean) => void
}

export const useEditorStore = create<EditorState>((set) => ({
  mode: 'view',
  selectedBlockId: null,
  isDragging: false,
  hasUnsavedChanges: false,

  setMode: (mode) => set({ mode }),
  toggleMode: () => set((state) => ({ mode: state.mode === 'view' ? 'edit' : 'view' })),
  selectBlock: (blockId) => set({ selectedBlockId: blockId }),
  setDragging: (isDragging) => set({ isDragging }),
  setUnsavedChanges: (hasChanges) => set({ hasUnsavedChanges: hasChanges }),
}))

interface BlocksState {
  blocks: Block[]
  isLoading: boolean
  error: string | null

  setBlocks: (blocks: Block[]) => void
  addBlock: (block: Block) => void
  updateBlock: (blockId: string, updates: Partial<Block>) => void
  removeBlock: (blockId: string) => void
  reorderBlocks: (startIndex: number, endIndex: number) => void
  setLoading: (isLoading: boolean) => void
  setError: (error: string | null) => void
}

export const useBlocksStore = create<BlocksState>((set) => ({
  blocks: [],
  isLoading: false,
  error: null,

  setBlocks: (blocks) => set({ blocks }),
  
  addBlock: (block) => set((state) => ({
    blocks: [...state.blocks, block],
  })),
  
  updateBlock: (blockId, updates) => set((state) => ({
    blocks: state.blocks.map((b) =>
      b.id === blockId ? { ...b, ...updates } : b
    ),
  })),
  
  removeBlock: (blockId) => set((state) => ({
    blocks: state.blocks.filter((b) => b.id !== blockId),
  })),
  
  reorderBlocks: (startIndex, endIndex) => set((state) => {
    const newBlocks = [...state.blocks]
    const [removed] = newBlocks.splice(startIndex, 1)
    newBlocks.splice(endIndex, 0, removed)
    return {
      blocks: newBlocks.map((block, index) => ({
        ...block,
        order_index: index,
      })),
    }
  }),
  
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
}))
