'use client'

/**
 * Editor Store - Estado Central do Editor de Templates
 * 
 * Gerencia:
 * - Template atual e sua árvore de nós
 * - Seleção de elementos
 * - Histórico (Undo/Redo)
 * - Estado de UI (zoom, pan, grid)
 * - Sincronização com Canvas e Sidebars
 */

import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'
import type {
  Template,
  SceneNode,
  FrameNode,
  Vector2D,
  UserRole,
  NodeGovernance,
  LockableProperty,
} from '@/types/studio'
import { findNodeById, flattenNodes, generateNodeId } from '@/types/studio'

// ============================================
// TYPES
// ============================================

type EditorMode = 'view' | 'edit' | 'preview'

interface HistoryEntry {
  template: Template
  timestamp: number
  description: string
}

interface UIState {
  showGrid: boolean
  showRulers: boolean
  showGuides: boolean
  snapToGrid: boolean
  gridSize: number
  showLayerPanel: boolean
  showVariablesPanel: boolean
}

interface EditorState {
  // Core
  mode: EditorMode
  template: Template | null
  userRole: UserRole
  
  // Selection
  selectedNodeIds: string[]
  hoveredNodeId: string | null
  
  // Viewport
  zoom: number
  panOffset: Vector2D
  
  // History
  history: {
    past: HistoryEntry[]
    future: HistoryEntry[]
  }
  maxHistorySize: number
  
  // UI
  ui: UIState
  
  // Dirty state
  isDirty: boolean
  lastSavedAt: string | null
}

interface EditorActions {
  // Mode
  setMode: (mode: EditorMode) => void
  toggleMode: () => void
  
  // Template
  setTemplate: (template: Template) => void
  
  // User Role
  setUserRole: (role: UserRole) => void
  
  // Selection
  selectNode: (nodeId: string, addToSelection?: boolean) => void
  selectNodes: (nodeIds: string[]) => void
  deselectNode: (nodeId: string) => void
  clearSelection: () => void
  setHoveredNode: (nodeId: string | null) => void
  
  // Node Operations
  updateNode: <T extends SceneNode>(nodeId: string, updates: Partial<T>) => void
  updateNodeProperty: (nodeId: string, path: string, value: unknown) => void
  deleteNode: (nodeId: string) => void
  duplicateNode: (nodeId: string) => string | null
  moveNode: (nodeId: string, newParentId: string, index?: number) => void
  reorderNode: (nodeId: string, direction: 'up' | 'down') => void
  
  // Visibility & Lock
  toggleNodeVisibility: (nodeId: string) => void
  toggleNodeLock: (nodeId: string) => void
  
  // Viewport
  setZoom: (zoom: number) => void
  zoomIn: () => void
  zoomOut: () => void
  zoomToFit: () => void
  setPanOffset: (offset: Vector2D) => void
  
  // History
  undo: () => void
  redo: () => void
  pushHistory: (description: string) => void
  clearHistory: () => void
  
  // UI
  setUIState: (updates: Partial<UIState>) => void
  toggleGrid: () => void
  toggleRulers: () => void
  
  // Permissions
  canEditNode: (nodeId: string) => boolean
  canEditProperty: (nodeId: string, property: LockableProperty) => boolean
  getNodeGovernance: (nodeId: string) => NodeGovernance | undefined
  
  // Helpers
  getSelectedNode: () => SceneNode | null
  getSelectedNodes: () => SceneNode[]
  getNodeById: (nodeId: string) => SceneNode | null
  getAllNodes: () => SceneNode[]
  
  // Dirty state
  markDirty: () => void
  markClean: () => void
  
  // Reset
  reset: () => void
}

type EditorStore = EditorState & EditorActions

// ============================================
// INITIAL STATE
// ============================================

const initialUIState: UIState = {
  showGrid: true,
  showRulers: false,
  showGuides: true,
  snapToGrid: true,
  gridSize: 8,
  showLayerPanel: true,
  showVariablesPanel: false,
}

const initialState: EditorState = {
  mode: 'edit',
  template: null,
  userRole: 'editor',
  selectedNodeIds: [],
  hoveredNodeId: null,
  zoom: 1,
  panOffset: { x: 0, y: 0 },
  history: { past: [], future: [] },
  maxHistorySize: 50,
  ui: initialUIState,
  isDirty: false,
  lastSavedAt: null,
}

// ============================================
// HELPER: Deep clone
// ============================================

function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj))
}

// ============================================
// HELPER: Update node in tree
// ============================================

function updateNodeInTree<T extends SceneNode>(
  root: SceneNode,
  nodeId: string,
  updates: Partial<T>
): SceneNode {
  if (root.id === nodeId) {
    return { ...root, ...updates } as SceneNode
  }
  
  if (root.type === 'FRAME') {
    return {
      ...root,
      children: (root as FrameNode).children.map(child => 
        updateNodeInTree(child, nodeId, updates)
      ),
    } as FrameNode
  }
  
  return root
}

// ============================================
// HELPER: Delete node from tree
// ============================================

function deleteNodeFromTree(root: FrameNode, nodeId: string): FrameNode {
  return {
    ...root,
    children: root.children
      .filter(child => child.id !== nodeId)
      .map(child => {
        if (child.type === 'FRAME') {
          return deleteNodeFromTree(child as FrameNode, nodeId)
        }
        return child
      }),
  }
}

// ============================================
// HELPER: Find parent of node
// ============================================

function findParentNode(root: FrameNode, nodeId: string): FrameNode | null {
  for (const child of root.children) {
    if (child.id === nodeId) return root
    if (child.type === 'FRAME') {
      const found = findParentNode(child as FrameNode, nodeId)
      if (found) return found
    }
  }
  return null
}

// ============================================
// STORE IMPLEMENTATION
// ============================================

export const useEditorStore = create<EditorStore>()(
  devtools(
    persist(
      immer((set, get) => ({
        ...initialState,

        // ============================================
        // MODE
        // ============================================
        
        setMode: (mode) => set({ mode }),
        
        toggleMode: () => set((state) => ({
          mode: state.mode === 'view' ? 'edit' : 'view'
        })),

        // ============================================
        // TEMPLATE
        // ============================================
        
        setTemplate: (template) => set({
          template,
          selectedNodeIds: [],
          history: { past: [], future: [] },
          isDirty: false,
        }),

        // ============================================
        // USER ROLE
        // ============================================
        
        setUserRole: (role) => set({ userRole: role }),

        // ============================================
        // SELECTION
        // ============================================
        
        selectNode: (nodeId, addToSelection = false) => set((state) => {
          if (addToSelection) {
            if (state.selectedNodeIds.includes(nodeId)) {
              return { selectedNodeIds: state.selectedNodeIds.filter((id: string) => id !== nodeId) }
            }
            return { selectedNodeIds: [...state.selectedNodeIds, nodeId] }
          }
          return { selectedNodeIds: [nodeId] }
        }),
        
        selectNodes: (nodeIds) => set({ selectedNodeIds: nodeIds }),
        
        deselectNode: (nodeId) => set((state) => ({
          selectedNodeIds: state.selectedNodeIds.filter((id: string) => id !== nodeId)
        })),
        
        clearSelection: () => set({ selectedNodeIds: [] }),
        
        setHoveredNode: (nodeId) => set({ hoveredNodeId: nodeId }),

        // ============================================
        // NODE OPERATIONS
        // ============================================
        
        updateNode: (nodeId, updates) => {
          const { template, pushHistory } = get()
          if (!template) return
          
          pushHistory(`Update ${nodeId}`)
          
          set((state) => {
            if (!state.template) return
            
            // Deep merge helper for immer
            const deepMerge = (target: Record<string, unknown>, source: Record<string, unknown>) => {
              for (const key of Object.keys(source)) {
                const sourceVal = source[key]
                const targetVal = target[key]
                
                if (
                  sourceVal !== null &&
                  typeof sourceVal === 'object' &&
                  !Array.isArray(sourceVal) &&
                  targetVal !== null &&
                  typeof targetVal === 'object' &&
                  !Array.isArray(targetVal)
                ) {
                  deepMerge(targetVal as Record<string, unknown>, sourceVal as Record<string, unknown>)
                } else {
                  target[key] = sourceVal
                }
              }
            }
            
            // Helper to mutate node in place (works with immer)
            const mutateNode = (node: SceneNode): boolean => {
              if (node.id === nodeId) {
                deepMerge(node as unknown as Record<string, unknown>, updates as Record<string, unknown>)
                return true
              }
              if (node.type === 'FRAME') {
                for (const child of (node as FrameNode).children) {
                  if (mutateNode(child)) return true
                }
              }
              return false
            }
            
            mutateNode(state.template.rootNode)
            state.isDirty = true
          })
        },
        
        updateNodeProperty: (nodeId, path, value) => {
          const { template, pushHistory } = get()
          if (!template) return
          
          const node = findNodeById(template.rootNode, nodeId)
          if (!node) return
          
          pushHistory(`Update ${path}`)
          
          set((state) => {
            if (!state.template) return
            
            const parts = path.split('.')
            const updatedNode = deepClone(node)
            
            let current: Record<string, unknown> = updatedNode as unknown as Record<string, unknown>
            for (let i = 0; i < parts.length - 1; i++) {
              current = current[parts[i]] as Record<string, unknown>
            }
            current[parts[parts.length - 1]] = value
            
            state.template.rootNode = updateNodeInTree(
              state.template.rootNode,
              nodeId,
              updatedNode as Partial<SceneNode>
            ) as FrameNode
            state.isDirty = true
          })
        },
        
        deleteNode: (nodeId) => {
          const { template, pushHistory, selectedNodeIds } = get()
          if (!template) return
          
          // Can't delete root
          if (template.rootNode.id === nodeId) return
          
          pushHistory(`Delete node`)
          
          set((state) => {
            if (!state.template) return
            state.template.rootNode = deleteNodeFromTree(state.template.rootNode, nodeId)
            state.selectedNodeIds = selectedNodeIds.filter(id => id !== nodeId)
            state.isDirty = true
          })
        },
        
        duplicateNode: (nodeId) => {
          const { template, pushHistory } = get()
          if (!template) return null
          
          const node = findNodeById(template.rootNode, nodeId)
          if (!node) return null
          
          const parent = findParentNode(template.rootNode, nodeId)
          if (!parent) return null
          
          const newId = generateNodeId()
          const duplicatedNode = deepClone(node)
          duplicatedNode.id = newId
          duplicatedNode.name = `${node.name} copy`
          
          // Offset position slightly
          duplicatedNode.position = {
            x: node.position.x + 20,
            y: node.position.y + 20,
          }
          
          pushHistory(`Duplicate node`)
          
          set((state) => {
            if (!state.template) return
            const parentNode = findNodeById(state.template.rootNode, parent.id) as FrameNode
            if (parentNode && parentNode.type === 'FRAME') {
              parentNode.children.push(duplicatedNode)
            }
            state.selectedNodeIds = [newId]
            state.isDirty = true
          })
          
          return newId
        },
        
        moveNode: (nodeId, newParentId, index) => {
          const { template, pushHistory } = get()
          if (!template) return
          
          const node = findNodeById(template.rootNode, nodeId)
          if (!node) return
          
          pushHistory(`Move node`)
          
          set((state) => {
            if (!state.template) return
            
            // Remove from current parent
            state.template.rootNode = deleteNodeFromTree(state.template.rootNode, nodeId)
            
            // Add to new parent
            const newParent = findNodeById(state.template.rootNode, newParentId) as FrameNode
            if (newParent && newParent.type === 'FRAME') {
              if (index !== undefined) {
                newParent.children.splice(index, 0, node)
              } else {
                newParent.children.push(node)
              }
            }
            state.isDirty = true
          })
        },
        
        reorderNode: (nodeId, direction) => {
          const { template, pushHistory } = get()
          if (!template) return
          
          const parent = findParentNode(template.rootNode, nodeId)
          if (!parent) return
          
          const currentIndex = parent.children.findIndex(c => c.id === nodeId)
          if (currentIndex === -1) return
          
          const newIndex = direction === 'up' 
            ? Math.max(0, currentIndex - 1)
            : Math.min(parent.children.length - 1, currentIndex + 1)
          
          if (currentIndex === newIndex) return
          
          pushHistory(`Reorder node`)
          
          set((state) => {
            if (!state.template) return
            const parentNode = findNodeById(state.template.rootNode, parent.id) as FrameNode
            if (parentNode && parentNode.type === 'FRAME') {
              const [removed] = parentNode.children.splice(currentIndex, 1)
              parentNode.children.splice(newIndex, 0, removed)
            }
            state.isDirty = true
          })
        },

        // ============================================
        // VISIBILITY & LOCK
        // ============================================
        
        toggleNodeVisibility: (nodeId) => {
          const { template } = get()
          if (!template) return
          
          const node = findNodeById(template.rootNode, nodeId)
          if (!node) return
          
          set((state) => {
            if (!state.template) return
            state.template.rootNode = updateNodeInTree(
              state.template.rootNode,
              nodeId,
              { visible: !node.visible }
            ) as FrameNode
            state.isDirty = true
          })
        },
        
        toggleNodeLock: (nodeId) => {
          const { template } = get()
          if (!template) return
          
          const node = findNodeById(template.rootNode, nodeId)
          if (!node) return
          
          set((state) => {
            if (!state.template) return
            state.template.rootNode = updateNodeInTree(
              state.template.rootNode,
              nodeId,
              { locked: !node.locked }
            ) as FrameNode
            state.isDirty = true
          })
        },

        // ============================================
        // VIEWPORT
        // ============================================
        
        setZoom: (zoom) => set({ zoom: Math.max(0.1, Math.min(5, zoom)) }),
        
        zoomIn: () => set((state) => ({ 
          zoom: Math.min(5, state.zoom * 1.2) 
        })),
        
        zoomOut: () => set((state) => ({ 
          zoom: Math.max(0.1, state.zoom / 1.2) 
        })),
        
        zoomToFit: () => set({ zoom: 1, panOffset: { x: 0, y: 0 } }),
        
        setPanOffset: (offset) => set({ panOffset: offset }),

        // ============================================
        // HISTORY
        // ============================================
        
        undo: () => {
          const { history, template } = get()
          if (history.past.length === 0 || !template) return
          
          const previous = history.past[history.past.length - 1]
          
          set((state) => {
            state.history.past.pop()
            state.history.future.unshift({
              template: deepClone(template),
              timestamp: Date.now(),
              description: 'Undo',
            })
            state.template = previous.template
          })
        },
        
        redo: () => {
          const { history, template } = get()
          if (history.future.length === 0 || !template) return
          
          const next = history.future[0]
          
          set((state) => {
            state.history.future.shift()
            state.history.past.push({
              template: deepClone(template),
              timestamp: Date.now(),
              description: 'Redo',
            })
            state.template = next.template
          })
        },
        
        pushHistory: (description) => {
          const { template, maxHistorySize } = get()
          if (!template) return
          
          set((state) => {
            state.history.past.push({
              template: deepClone(template),
              timestamp: Date.now(),
              description,
            })
            
            // Limit history size
            if (state.history.past.length > maxHistorySize) {
              state.history.past.shift()
            }
            
            // Clear future on new action
            state.history.future = []
          })
        },
        
        clearHistory: () => set({
          history: { past: [], future: [] }
        }),

        // ============================================
        // UI
        // ============================================
        
        setUIState: (updates) => set((state) => ({
          ui: { ...state.ui, ...updates }
        })),
        
        toggleGrid: () => set((state) => ({
          ui: { ...state.ui, showGrid: !state.ui.showGrid }
        })),
        
        toggleRulers: () => set((state) => ({
          ui: { ...state.ui, showRulers: !state.ui.showRulers }
        })),

        // ============================================
        // PERMISSIONS
        // ============================================
        
        canEditNode: (nodeId) => {
          const { template, userRole } = get()
          if (!template) return false
          
          const node = findNodeById(template.rootNode, nodeId)
          if (!node) return false
          
          // Locked nodes can't be edited
          if (node.locked) return false
          
          // Check governance
          const governance = node.governance
          if (!governance) return true
          
          return governance.editableBy.includes(userRole)
        },
        
        canEditProperty: (nodeId, property) => {
          const { template, userRole } = get()
          if (!template) return false
          
          const node = findNodeById(template.rootNode, nodeId)
          if (!node) return false
          
          // Check if locked
          if (node.locked) return false
          
          const governance = node.governance
          if (!governance) return true
          
          // Check if user role can edit
          if (!governance.editableBy.includes(userRole)) return false
          
          // Check if property is locked
          return !governance.lockedProps.includes(property)
        },
        
        getNodeGovernance: (nodeId) => {
          const { template } = get()
          if (!template) return undefined
          
          const node = findNodeById(template.rootNode, nodeId)
          return node?.governance
        },

        // ============================================
        // HELPERS
        // ============================================
        
        getSelectedNode: () => {
          const { template, selectedNodeIds } = get()
          if (!template || selectedNodeIds.length !== 1) return null
          return findNodeById(template.rootNode, selectedNodeIds[0])
        },
        
        getSelectedNodes: () => {
          const { template, selectedNodeIds } = get()
          if (!template) return []
          return selectedNodeIds
            .map(id => findNodeById(template.rootNode, id))
            .filter((n): n is SceneNode => n !== null)
        },
        
        getNodeById: (nodeId) => {
          const { template } = get()
          if (!template) return null
          return findNodeById(template.rootNode, nodeId)
        },
        
        getAllNodes: () => {
          const { template } = get()
          if (!template) return []
          return flattenNodes(template.rootNode)
        },

        // ============================================
        // DIRTY STATE
        // ============================================
        
        markDirty: () => set({ isDirty: true }),
        
        markClean: () => set({ 
          isDirty: false, 
          lastSavedAt: new Date().toISOString() 
        }),

        // ============================================
        // RESET
        // ============================================
        
        reset: () => set(initialState),
      })),
      {
        name: 'koyot-editor-store',
        partialize: (state) => ({
          ui: state.ui,
          zoom: state.zoom,
        }),
      }
    ),
    { name: 'EditorStore' }
  )
)

// ============================================
// SELECTOR HOOKS (Performance Optimization)
// ============================================

export const useSelectedNode = () => useEditorStore((state) => state.getSelectedNode())
export const useSelectedNodes = () => useEditorStore((state) => state.getSelectedNodes())
export const useEditorMode = () => useEditorStore((state) => state.mode)
export const useUserRole = () => useEditorStore((state) => state.userRole)
export const useZoom = () => useEditorStore((state) => state.zoom)
export const useCanUndo = () => useEditorStore((state) => state.history.past.length > 0)
export const useCanRedo = () => useEditorStore((state) => state.history.future.length > 0)
