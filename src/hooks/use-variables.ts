/**
 * useVariables Hook
 * 
 * Hook para acessar e manipular o sistema de variáveis.
 * Fornece uma API simplificada para componentes React.
 */

import { useCallback, useMemo } from 'react'
import { useVariablesStore } from '@/stores/variables-store'
import type {
  VariableValue,
  VariableFilters,
} from '@/types/variables'
import type { UserRole } from '@/types/studio'

// ============================================
// MAIN HOOK
// ============================================

export function useVariables() {
  const store = useVariablesStore()

  return {
    // State
    collections: store.collections,
    variables: store.variables,
    bindings: store.bindings,
    activeModeId: store.activeModeId,
    isLoading: store.isLoading,
    error: store.error,

    // Mode
    setActiveMode: store.setActiveMode,

    // Collections
    createCollection: store.createCollection,
    updateCollection: store.updateCollection,
    deleteCollection: store.deleteCollection,

    // Variables
    createVariable: store.createVariable,
    updateVariable: store.updateVariable,
    deleteVariable: store.deleteVariable,
    setVariableValue: store.setVariableValue,

    // Bindings
    createBinding: store.createBinding,
    deleteBinding: store.deleteBinding,
    deleteBindingsForNode: store.deleteBindingsForNode,

    // Query
    getVariableById: store.getVariableById,
    getVariablesByCollection: store.getVariablesByCollection,
    getVariablesByType: store.getVariablesByType,
    filterVariables: store.filterVariables,

    // Resolution
    resolveVariable: store.resolveVariable,
    resolveValue: store.resolveValue,

    // Permissions
    canUserEditVariable: store.canUserEditVariable,
  }
}

// ============================================
// SPECIALIZED HOOKS
// ============================================

/**
 * Hook para acessar variáveis de um nó específico
 */
export function useNodeVariables(nodeId: string) {
  const store = useVariablesStore()

  const bindings = useMemo(
    () => store.getBindingsForNode(nodeId),
    [store, nodeId]
  )

  const getBindingForProperty = useCallback(
    (property: string) => store.getBindingForProperty(nodeId, property),
    [store, nodeId]
  )

  const getResolvedValueForProperty = useCallback(
    (property: string): VariableValue => {
      const binding = store.getBindingForProperty(nodeId, property)
      if (!binding) return null
      return store.resolveValue(binding.variableId)
    },
    [store, nodeId]
  )

  const isPropertyLinked = useCallback(
    (property: string): boolean => {
      return store.getBindingForProperty(nodeId, property) !== null
    },
    [store, nodeId]
  )

  const linkProperty = useCallback(
    (property: string, variableId: string) => {
      store.createBinding({ nodeId, property, variableId })
    },
    [store, nodeId]
  )

  const unlinkProperty = useCallback(
    (property: string) => {
      const binding = store.getBindingForProperty(nodeId, property)
      if (binding) {
        store.deleteBinding(binding.id)
      }
    },
    [store, nodeId]
  )

  return {
    bindings,
    getBindingForProperty,
    getResolvedValueForProperty,
    isPropertyLinked,
    linkProperty,
    unlinkProperty,
  }
}

/**
 * Hook para acessar variáveis filtradas por tipo/escopo
 */
export function useFilteredVariables(filters: VariableFilters) {
  const store = useVariablesStore()

  const variables = useMemo(
    () => store.filterVariables(filters),
    [store, filters]
  )

  return variables
}

/**
 * Hook para acessar variáveis de uma coleção
 */
export function useCollectionVariables(collectionId: string) {
  const store = useVariablesStore()

  const collection = useMemo(
    () => store.collections.find((c) => c.id === collectionId),
    [store.collections, collectionId]
  )

  const variables = useMemo(
    () => store.getVariablesByCollection(collectionId),
    [store, collectionId]
  )

  return {
    collection,
    variables,
  }
}

/**
 * Hook para verificar se uma propriedade está linkada a uma variável
 */
export function usePropertyBinding(nodeId: string, property: string) {
  const store = useVariablesStore()

  const binding = useMemo(
    () => store.getBindingForProperty(nodeId, property),
    [store, nodeId, property]
  )

  const variable = useMemo(
    () => (binding ? store.getVariableById(binding.variableId) : null),
    [store, binding]
  )

  const resolvedValue = useMemo(
    () => (binding ? store.resolveValue(binding.variableId) : null),
    [store, binding]
  )

  const isLinked = binding !== null

  const link = useCallback(
    (variableId: string) => {
      store.createBinding({ nodeId, property, variableId })
    },
    [store, nodeId, property]
  )

  const unlink = useCallback(() => {
    if (binding) {
      store.deleteBinding(binding.id)
    }
  }, [store, binding])

  return {
    isLinked,
    binding,
    variable,
    resolvedValue,
    link,
    unlink,
  }
}

/**
 * Hook para gerenciar o modo ativo
 */
export function useVariableMode() {
  const store = useVariablesStore()

  const availableModes = useMemo(() => {
    const modesSet = new Map<string, { id: string; name: string }>()
    
    store.collections.forEach((collection) => {
      collection.modes.forEach((mode) => {
        if (!modesSet.has(mode.id)) {
          modesSet.set(mode.id, mode)
        }
      })
    })

    return Array.from(modesSet.values())
  }, [store.collections])

  return {
    activeModeId: store.activeModeId,
    availableModes,
    setActiveMode: store.setActiveMode,
  }
}

/**
 * Hook para verificar permissões de edição
 */
export function useVariablePermissions(variableId: string, userRole: UserRole) {
  const store = useVariablesStore()

  const variable = store.getVariableById(variableId)
  const canEdit = store.canUserEditVariable(variableId, userRole)

  return {
    variable,
    canEdit,
    isLocked: variable?.isLocked ?? false,
  }
}
