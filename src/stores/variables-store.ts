/**
 * Variables Store - Zustand
 * 
 * Gerenciamento de estado para o sistema de variáveis.
 * Single Source of Truth para toda a plataforma.
 */

import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'
import { nanoid } from 'nanoid'
import type {
  Variable,
  VariableCollection,
  VariableBinding,
  VariableValue,
  VariablesState,
  CreateVariableInput,
  UpdateVariableInput,
  CreateBindingInput,
  VariableFilters,
  ResolvedVariable,
} from '@/types/variables'
import type { UserRole } from '@/types/studio'

// ============================================
// STORE INTERFACE
// ============================================

interface VariablesStore extends VariablesState {
  // Mode Actions
  setActiveMode: (modeId: string) => void
  
  // Collection Actions
  createCollection: (name: string, description?: string) => VariableCollection
  updateCollection: (collectionId: string, updates: Partial<VariableCollection>) => void
  deleteCollection: (collectionId: string) => void
  
  // Variable Actions
  createVariable: (input: CreateVariableInput) => Variable
  updateVariable: (variableId: string, updates: UpdateVariableInput) => void
  deleteVariable: (variableId: string) => void
  setVariableValue: (variableId: string, value: VariableValue, modeId?: string) => void
  
  // Binding Actions
  createBinding: (input: CreateBindingInput) => VariableBinding
  deleteBinding: (bindingId: string) => void
  deleteBindingsForNode: (nodeId: string) => void
  getBindingsForNode: (nodeId: string) => VariableBinding[]
  getBindingForProperty: (nodeId: string, property: string) => VariableBinding | null
  
  // Resolution
  resolveVariable: (variableId: string, modeId?: string) => ResolvedVariable | null
  resolveValue: (variableId: string, modeId?: string) => VariableValue
  
  // Query
  getVariablesByCollection: (collectionId: string) => Variable[]
  getVariablesByType: (type: Variable['type']) => Variable[]
  filterVariables: (filters: VariableFilters) => Variable[]
  getVariableById: (variableId: string) => Variable | null
  
  // Permissions
  canUserEditVariable: (variableId: string, userRole: UserRole) => boolean
  
  // Sync
  reset: () => void
  loadFromData: (data: Partial<VariablesState>) => void
}

// ============================================
// INITIAL STATE
// ============================================

const initialState: VariablesState = {
  collections: [],
  variables: {},
  bindings: [],
  activeModeId: 'default',
  isLoading: false,
  error: null,
}

// ============================================
// STORE IMPLEMENTATION
// ============================================

export const useVariablesStore = create<VariablesStore>()(
  devtools(
    persist(
      (set, get) => ({
        ...initialState,

        // ============================================
        // MODE ACTIONS
        // ============================================

        setActiveMode: (modeId) => {
          set({ activeModeId: modeId }, false, 'setActiveMode')
        },

        // ============================================
        // COLLECTION ACTIONS
        // ============================================

        createCollection: (name, description) => {
          const now = new Date().toISOString()
          const collection: VariableCollection = {
            id: nanoid(),
            name,
            description,
            modes: [{ id: 'default', name: 'Padrão', isDefault: true }],
            variableIds: [],
            order: get().collections.length,
            createdAt: now,
            updatedAt: now,
          }

          set(
            (state) => ({
              collections: [...state.collections, collection],
            }),
            false,
            'createCollection'
          )

          return collection
        },

        updateCollection: (collectionId, updates) => {
          set(
            (state) => ({
              collections: state.collections.map((c) =>
                c.id === collectionId
                  ? { ...c, ...updates, updatedAt: new Date().toISOString() }
                  : c
              ),
            }),
            false,
            'updateCollection'
          )
        },

        deleteCollection: (collectionId) => {
          const state = get()
          const collection = state.collections.find((c) => c.id === collectionId)
          
          if (!collection) return

          // Remove all variables in this collection
          const variablesToDelete = collection.variableIds
          const newVariables = { ...state.variables }
          variablesToDelete.forEach((id) => delete newVariables[id])

          // Remove bindings for deleted variables
          const newBindings = state.bindings.filter(
            (b) => !variablesToDelete.includes(b.variableId)
          )

          set(
            {
              collections: state.collections.filter((c) => c.id !== collectionId),
              variables: newVariables,
              bindings: newBindings,
            },
            false,
            'deleteCollection'
          )
        },

        // ============================================
        // VARIABLE ACTIONS
        // ============================================

        createVariable: (input) => {
          const now = new Date().toISOString()
          const variable: Variable = {
            id: nanoid(),
            name: input.name,
            displayName: input.displayName,
            type: input.type,
            collectionId: input.collectionId,
            scopes: input.scopes || ['all'],
            editableBy: input.editableBy || ['owner', 'admin', 'editor'],
            isLocked: false,
            description: input.description,
            tags: input.tags,
            valuesByMode: {
              default: input.initialValue ?? null,
            },
            createdAt: now,
            updatedAt: now,
          }

          set(
            (state) => ({
              variables: {
                ...state.variables,
                [variable.id]: variable,
              },
              collections: state.collections.map((c) =>
                c.id === input.collectionId
                  ? { ...c, variableIds: [...c.variableIds, variable.id] }
                  : c
              ),
            }),
            false,
            'createVariable'
          )

          return variable
        },

        updateVariable: (variableId, updates) => {
          set(
            (state) => {
              const variable = state.variables[variableId]
              if (!variable) return state

              // Handle aliasOf: convert null to undefined
              const processedUpdates = {
                ...updates,
                aliasOf: updates.aliasOf === null ? undefined : updates.aliasOf,
              }

              const updatedVariable: Variable = {
                ...variable,
                ...processedUpdates,
                updatedAt: new Date().toISOString(),
              }

              return {
                variables: {
                  ...state.variables,
                  [variableId]: updatedVariable,
                },
              }
            },
            false,
            'updateVariable'
          )
        },

        deleteVariable: (variableId) => {
          set(
            (state) => {
              const variable = state.variables[variableId]
              if (!variable) return state

              const newVariables = { ...state.variables }
              delete newVariables[variableId]

              return {
                variables: newVariables,
                collections: state.collections.map((c) =>
                  c.id === variable.collectionId
                    ? { ...c, variableIds: c.variableIds.filter((id) => id !== variableId) }
                    : c
                ),
                bindings: state.bindings.filter((b) => b.variableId !== variableId),
              }
            },
            false,
            'deleteVariable'
          )
        },

        setVariableValue: (variableId, value, modeId) => {
          const mode = modeId || get().activeModeId

          set(
            (state) => {
              const variable = state.variables[variableId]
              if (!variable) return state

              return {
                variables: {
                  ...state.variables,
                  [variableId]: {
                    ...variable,
                    valuesByMode: {
                      ...variable.valuesByMode,
                      [mode]: value,
                    },
                    updatedAt: new Date().toISOString(),
                  },
                },
              }
            },
            false,
            'setVariableValue'
          )
        },

        // ============================================
        // BINDING ACTIONS
        // ============================================

        createBinding: (input) => {
          const now = new Date().toISOString()
          
          // Remove existing binding for same node+property
          const existingBindings = get().bindings.filter(
            (b) => !(b.nodeId === input.nodeId && b.property === input.property)
          )

          const binding: VariableBinding = {
            id: nanoid(),
            nodeId: input.nodeId,
            property: input.property,
            variableId: input.variableId,
            createdAt: now,
          }

          set(
            { bindings: [...existingBindings, binding] },
            false,
            'createBinding'
          )

          return binding
        },

        deleteBinding: (bindingId) => {
          set(
            (state) => ({
              bindings: state.bindings.filter((b) => b.id !== bindingId),
            }),
            false,
            'deleteBinding'
          )
        },

        deleteBindingsForNode: (nodeId) => {
          set(
            (state) => ({
              bindings: state.bindings.filter((b) => b.nodeId !== nodeId),
            }),
            false,
            'deleteBindingsForNode'
          )
        },

        getBindingsForNode: (nodeId) => {
          return get().bindings.filter((b) => b.nodeId === nodeId)
        },

        getBindingForProperty: (nodeId, property) => {
          return get().bindings.find(
            (b) => b.nodeId === nodeId && b.property === property
          ) || null
        },

        // ============================================
        // RESOLUTION
        // ============================================

        resolveVariable: (variableId, modeId) => {
          const state = get()
          const mode = modeId || state.activeModeId
          const variable = state.variables[variableId]

          if (!variable) return null

          const resolutionChain: string[] = [variable.name]
          let currentVariable = variable
          let isAlias = false

          // Resolve alias chain
          while (currentVariable.aliasOf) {
            const aliasTarget = state.variables[currentVariable.aliasOf]
            if (!aliasTarget) break
            
            resolutionChain.push(aliasTarget.name)
            currentVariable = aliasTarget
            isAlias = true

            // Prevent infinite loops
            if (resolutionChain.length > 10) break
          }

          // Get value for mode (fallback to default)
          let value = currentVariable.valuesByMode[mode]
          if (value === undefined) {
            value = currentVariable.valuesByMode['default'] ?? null
          }

          return {
            variable,
            value,
            resolutionChain,
            isFromExternalSource: !!currentVariable.source,
            isAlias,
          }
        },

        resolveValue: (variableId, modeId) => {
          const resolved = get().resolveVariable(variableId, modeId)
          return resolved?.value ?? null
        },

        // ============================================
        // QUERY
        // ============================================

        getVariablesByCollection: (collectionId) => {
          const state = get()
          const collection = state.collections.find((c) => c.id === collectionId)
          if (!collection) return []

          return collection.variableIds
            .map((id) => state.variables[id])
            .filter(Boolean)
        },

        getVariablesByType: (type) => {
          return Object.values(get().variables).filter((v) => v.type === type)
        },

        filterVariables: (filters) => {
          let variables = Object.values(get().variables)

          if (filters.type) {
            variables = variables.filter((v) => v.type === filters.type)
          }

          if (filters.scope) {
            variables = variables.filter(
              (v) => v.scopes.includes('all') || v.scopes.includes(filters.scope!)
            )
          }

          if (filters.collectionId) {
            variables = variables.filter((v) => v.collectionId === filters.collectionId)
          }

          if (filters.tags && filters.tags.length > 0) {
            variables = variables.filter((v) =>
              filters.tags!.some((tag) => v.tags?.includes(tag))
            )
          }

          if (filters.search) {
            const search = filters.search.toLowerCase()
            variables = variables.filter(
              (v) =>
                v.name.toLowerCase().includes(search) ||
                v.displayName.toLowerCase().includes(search) ||
                v.description?.toLowerCase().includes(search)
            )
          }

          return variables
        },

        getVariableById: (variableId) => {
          return get().variables[variableId] || null
        },

        // ============================================
        // PERMISSIONS
        // ============================================

        canUserEditVariable: (variableId, userRole) => {
          const variable = get().variables[variableId]
          if (!variable) return false
          if (variable.isLocked) return false
          return variable.editableBy.includes(userRole)
        },

        // ============================================
        // SYNC
        // ============================================

        reset: () => {
          set(initialState, false, 'reset')
        },

        loadFromData: (data) => {
          set(
            (state) => ({
              ...state,
              ...data,
            }),
            false,
            'loadFromData'
          )
        },
      }),
      {
        name: 'koyot-variables',
        partialize: (state) => ({
          collections: state.collections,
          variables: state.variables,
          bindings: state.bindings,
          activeModeId: state.activeModeId,
        }),
      }
    ),
    { name: 'VariablesStore' }
  )
)

// ============================================
// SELECTORS (for performance)
// ============================================

export const selectCollections = (state: VariablesStore) => state.collections
export const selectVariables = (state: VariablesStore) => state.variables
export const selectBindings = (state: VariablesStore) => state.bindings
export const selectActiveModeId = (state: VariablesStore) => state.activeModeId

export const selectVariableById = (variableId: string) => (state: VariablesStore) =>
  state.variables[variableId]

export const selectBindingsForNode = (nodeId: string) => (state: VariablesStore) =>
  state.bindings.filter((b) => b.nodeId === nodeId)
