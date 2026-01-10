/**
 * MockupStore
 * 
 * Estado global para gerenciamento de mockups usando Zustand.
 * Integra com o editor-store para sincronização de templates.
 */

import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'
import type {
  MockupDefinition,
  TemplateSnapshot,
  Point2D,
  MockupCategory,
} from './types'

/**
 * Estado de um mockup individual
 */
interface MockupInstance {
  /** ID único da instância */
  id: string
  /** Definição do mockup */
  definition: MockupDefinition
  /** Snapshots dos templates para cada área de inserção */
  templateSnapshots: Map<number, TemplateSnapshot>
  /** Zoom atual */
  zoom: number
  /** Offset de pan */
  panOffset: Point2D
  /** Última renderização */
  lastRenderAt: number | null
  /** Está carregando */
  isLoading: boolean
}

/**
 * Estado global do MockupStore
 */
interface MockupState {
  /** Mockups disponíveis (biblioteca) */
  availableMockups: MockupDefinition[]
  /** Mockups ativos (em uso/visualização) */
  activeMockups: Map<string, MockupInstance>
  /** ID do mockup selecionado */
  selectedMockupId: string | null
  /** Filtro de categoria */
  categoryFilter: MockupCategory | null
  /** Termo de busca */
  searchTerm: string
  /** Está carregando biblioteca */
  isLoadingLibrary: boolean
}

/**
 * Ações do MockupStore
 */
interface MockupActions {
  // Biblioteca
  setAvailableMockups: (mockups: MockupDefinition[]) => void
  addMockupToLibrary: (mockup: MockupDefinition) => void
  removeMockupFromLibrary: (mockupId: string) => void
  
  // Filtros
  setCategoryFilter: (category: MockupCategory | null) => void
  setSearchTerm: (term: string) => void
  getFilteredMockups: () => MockupDefinition[]
  
  // Instâncias ativas
  createMockupInstance: (definition: MockupDefinition) => string
  removeMockupInstance: (instanceId: string) => void
  selectMockup: (instanceId: string | null) => void
  
  // Atualização de templates
  updateTemplateSnapshot: (
    instanceId: string,
    areaIndex: number,
    snapshot: TemplateSnapshot
  ) => void
  clearTemplateSnapshot: (instanceId: string, areaIndex: number) => void
  
  // Viewport
  setMockupZoom: (instanceId: string, zoom: number) => void
  setMockupPan: (instanceId: string, offset: Point2D) => void
  resetMockupViewport: (instanceId: string) => void
  
  // Estado
  setMockupLoading: (instanceId: string, isLoading: boolean) => void
  markMockupRendered: (instanceId: string) => void
  
  // Helpers
  getMockupInstance: (instanceId: string) => MockupInstance | undefined
  getSelectedMockup: () => MockupInstance | undefined
  
  // Reset
  reset: () => void
}

type MockupStore = MockupState & MockupActions

/**
 * Estado inicial
 */
const initialState: MockupState = {
  availableMockups: [],
  activeMockups: new Map(),
  selectedMockupId: null,
  categoryFilter: null,
  searchTerm: '',
  isLoadingLibrary: false,
}

/**
 * Gera ID único para instância de mockup
 */
function generateInstanceId(): string {
  return `mockup_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

/**
 * Store de Mockups
 */
export const useMockupStore = create<MockupStore>()(
  devtools(
    immer((set, get) => ({
      ...initialState,

      // ============================================
      // BIBLIOTECA
      // ============================================

      setAvailableMockups: (mockups) => set({ availableMockups: mockups }),

      addMockupToLibrary: (mockup) => set((state) => {
        // Evitar duplicatas
        if (!state.availableMockups.find(m => m.id === mockup.id)) {
          state.availableMockups.push(mockup)
        }
      }),

      removeMockupFromLibrary: (mockupId) => set((state) => {
        state.availableMockups = state.availableMockups.filter(m => m.id !== mockupId)
      }),

      // ============================================
      // FILTROS
      // ============================================

      setCategoryFilter: (category) => set({ categoryFilter: category }),

      setSearchTerm: (term) => set({ searchTerm: term }),

      getFilteredMockups: () => {
        const { availableMockups, categoryFilter, searchTerm } = get()
        
        return availableMockups.filter((mockup) => {
          // Filtro de categoria
          if (categoryFilter && mockup.category !== categoryFilter) {
            return false
          }
          
          // Filtro de busca
          if (searchTerm) {
            const term = searchTerm.toLowerCase()
            const matchesName = mockup.name.toLowerCase().includes(term)
            const matchesDescription = mockup.description?.toLowerCase().includes(term)
            const matchesTags = mockup.tags?.some(tag => tag.toLowerCase().includes(term))
            
            if (!matchesName && !matchesDescription && !matchesTags) {
              return false
            }
          }
          
          return true
        })
      },

      // ============================================
      // INSTÂNCIAS ATIVAS
      // ============================================

      createMockupInstance: (definition) => {
        const instanceId = generateInstanceId()
        
        set((state) => {
          state.activeMockups.set(instanceId, {
            id: instanceId,
            definition,
            templateSnapshots: new Map(),
            zoom: 1,
            panOffset: { x: 0, y: 0 },
            lastRenderAt: null,
            isLoading: false,
          })
          state.selectedMockupId = instanceId
        })
        
        return instanceId
      },

      removeMockupInstance: (instanceId) => set((state) => {
        state.activeMockups.delete(instanceId)
        if (state.selectedMockupId === instanceId) {
          // Selecionar outro ou null
          const remaining = Array.from(state.activeMockups.keys())
          state.selectedMockupId = remaining[0] ?? null
        }
      }),

      selectMockup: (instanceId) => set({ selectedMockupId: instanceId }),

      // ============================================
      // ATUALIZAÇÃO DE TEMPLATES
      // ============================================

      updateTemplateSnapshot: (instanceId, areaIndex, snapshot) => set((state) => {
        const instance = state.activeMockups.get(instanceId)
        if (instance) {
          // Cast necessário pois immer não lida bem com DOM types
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          instance.templateSnapshots.set(areaIndex, snapshot as any)
        }
      }),

      clearTemplateSnapshot: (instanceId, areaIndex) => set((state) => {
        const instance = state.activeMockups.get(instanceId)
        if (instance) {
          instance.templateSnapshots.delete(areaIndex)
        }
      }),

      // ============================================
      // VIEWPORT
      // ============================================

      setMockupZoom: (instanceId, zoom) => set((state) => {
        const instance = state.activeMockups.get(instanceId)
        if (instance) {
          instance.zoom = Math.max(0.1, Math.min(5, zoom))
        }
      }),

      setMockupPan: (instanceId, offset) => set((state) => {
        const instance = state.activeMockups.get(instanceId)
        if (instance) {
          instance.panOffset = offset
        }
      }),

      resetMockupViewport: (instanceId) => set((state) => {
        const instance = state.activeMockups.get(instanceId)
        if (instance) {
          instance.zoom = 1
          instance.panOffset = { x: 0, y: 0 }
        }
      }),

      // ============================================
      // ESTADO
      // ============================================

      setMockupLoading: (instanceId, isLoading) => set((state) => {
        const instance = state.activeMockups.get(instanceId)
        if (instance) {
          instance.isLoading = isLoading
        }
      }),

      markMockupRendered: (instanceId) => set((state) => {
        const instance = state.activeMockups.get(instanceId)
        if (instance) {
          instance.lastRenderAt = Date.now()
        }
      }),

      // ============================================
      // HELPERS
      // ============================================

      getMockupInstance: (instanceId) => {
        return get().activeMockups.get(instanceId)
      },

      getSelectedMockup: () => {
        const { selectedMockupId, activeMockups } = get()
        if (!selectedMockupId) return undefined
        return activeMockups.get(selectedMockupId)
      },

      // ============================================
      // RESET
      // ============================================

      reset: () => set(initialState),
    })),
    { name: 'MockupStore' }
  )
)

// ============================================
// SELECTOR HOOKS
// ============================================

export const useSelectedMockup = () => useMockupStore((state) => state.getSelectedMockup())
export const useFilteredMockups = () => useMockupStore((state) => state.getFilteredMockups())
export const useMockupCategories = () => useMockupStore((state) => {
  const categories = new Set(state.availableMockups.map(m => m.category))
  return Array.from(categories)
})
