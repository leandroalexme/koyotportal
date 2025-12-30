'use client'

import { create } from 'zustand'

type EditorMode = 'view' | 'edit'

interface EditorState {
  mode: EditorMode
  setMode: (mode: EditorMode) => void
  toggleMode: () => void
}

export const useEditorStore = create<EditorState>((set) => ({
  mode: 'view',
  setMode: (mode) => set({ mode }),
  toggleMode: () => set((state) => ({ mode: state.mode === 'view' ? 'edit' : 'view' })),
}))
