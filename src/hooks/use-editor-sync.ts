'use client'

/**
 * useEditorSync Hook
 * 
 * Sincroniza alterações entre Canvas, RightSidebar e Stores.
 * Garante que qualquer alteração seja refletida em tempo real sem latência.
 */

import { useCallback, useMemo, useRef, useEffect } from 'react'
import { useEditorStore } from '@/stores/editor-store'
import { useVariablesStore } from '@/stores/variables-store'
import type { SceneNode, TextNode, ImageNode, LockableProperty, UserRole } from '@/types/studio'
import type { VariableType, VariableScope } from '@/types/variables'

// ============================================
// TYPES
// ============================================


interface UseEditorSyncResult {
  // Selected Node
  selectedNode: SceneNode | null
  selectedNodeType: SceneNode['type'] | null
  hasSelection: boolean
  
  // Permissions
  canEdit: boolean
  canEditProperty: (property: LockableProperty) => boolean
  userRole: UserRole
  
  // Node Updates
  updateNode: <T extends SceneNode>(updates: Partial<T>) => void
  updateProperty: (path: string, value: unknown) => void
  
  // Text-specific
  updateTextContent: (content: string) => void
  updateTextStyle: (styleProp: string, value: unknown) => void
  
  // Image-specific
  updateImageSrc: (src: string, assetId?: string) => void
  updateImageFit: (fit: 'FILL' | 'FIT' | 'CROP' | 'TILE') => void
  
  // Common Style
  updateFill: (colorHex: string) => void
  updateOpacity: (opacity: number) => void
  updateCornerRadius: (radius: number) => void
  
  // Variable Linking
  linkPropertyToVariable: (property: string, variableId: string) => void
  unlinkProperty: (property: string) => void
  getPropertyBinding: (property: string) => { isLinked: boolean; variableId?: string; variableName?: string }
  
  // Actions
  deleteSelected: () => void
  duplicateSelected: () => string | null
  bringForward: () => void
  sendBackward: () => void
}

// ============================================
// DEBOUNCE HELPER
// ============================================

function useDebounce(
  callback: (path: string, value: unknown) => void,
  delay: number
): (path: string, value: unknown) => void {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  
  const debouncedFn = useCallback((path: string, value: unknown) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    timeoutRef.current = setTimeout(() => {
      callback(path, value)
    }, delay)
  }, [callback, delay])
  
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])
  
  return debouncedFn
}

// ============================================
// MAIN HOOK
// ============================================

export function useEditorSync(): UseEditorSyncResult {
  const {
    selectedNodeIds,
    userRole,
    getSelectedNode,
    updateNode: storeUpdateNode,
    updateNodeProperty,
    deleteNode,
    duplicateNode,
    reorderNode,
    canEditNode,
    canEditProperty: storeCanEditProperty,
  } = useEditorStore()
  
  const {
    createBinding,
    deleteBinding,
    getBindingsForNode,
    getVariableById,
  } = useVariablesStore()
  
  // Get selected node
  const selectedNode = useMemo(() => {
    if (selectedNodeIds.length !== 1) return null
    return getSelectedNode()
  }, [selectedNodeIds, getSelectedNode])
  
  const selectedNodeType = selectedNode?.type ?? null
  const hasSelection = selectedNode !== null
  
  // Permissions
  const canEdit = selectedNode ? canEditNode(selectedNode.id) : false
  
  const canEditProperty = useCallback((property: LockableProperty): boolean => {
    if (!selectedNode) return false
    return storeCanEditProperty(selectedNode.id, property)
  }, [selectedNode, storeCanEditProperty])
  
  // ============================================
  // NODE UPDATES
  // ============================================
  
  const updateNode = useCallback(<T extends SceneNode>(updates: Partial<T>) => {
    if (!selectedNode || !canEdit) return
    storeUpdateNode(selectedNode.id, updates)
  }, [selectedNode, canEdit, storeUpdateNode])
  
  const updateProperty = useCallback((path: string, value: unknown) => {
    if (!selectedNode || !canEdit) return
    updateNodeProperty(selectedNode.id, path, value)
  }, [selectedNode, canEdit, updateNodeProperty])
  
  // Debounced version for real-time typing
  const debouncedUpdateProperty = useDebounce(updateProperty, 100)
  
  // ============================================
  // TEXT UPDATES
  // ============================================
  
  const updateTextContent = useCallback((content: string) => {
    if (!selectedNode || selectedNode.type !== 'TEXT' || !canEditProperty('content')) return
    debouncedUpdateProperty('textProps.content', content)
  }, [selectedNode, canEditProperty, debouncedUpdateProperty])
  
  const updateTextStyle = useCallback((styleProp: string, value: unknown) => {
    if (!selectedNode || selectedNode.type !== 'TEXT') return
    updateProperty(`textProps.style.${styleProp}`, value)
  }, [selectedNode, updateProperty])
  
  // ============================================
  // IMAGE UPDATES
  // ============================================
  
  const updateImageSrc = useCallback((src: string, assetId?: string) => {
    if (!selectedNode || selectedNode.type !== 'IMAGE' || !canEditProperty('image')) return
    
    const updates: Partial<ImageNode> = {
      imageProps: {
        ...(selectedNode as ImageNode).imageProps,
        src,
        ...(assetId && { assetId }),
      },
    }
    updateNode(updates)
  }, [selectedNode, canEditProperty, updateNode])
  
  const updateImageFit = useCallback((fit: 'FILL' | 'FIT' | 'CROP' | 'TILE') => {
    if (!selectedNode || selectedNode.type !== 'IMAGE') return
    updateProperty('imageProps.objectFit', fit)
  }, [selectedNode, updateProperty])
  
  // ============================================
  // COMMON STYLE UPDATES
  // ============================================
  
  const updateFill = useCallback((colorHex: string) => {
    if (!selectedNode || !canEditProperty('fills')) return
    
    // Parse hex to Color
    const r = parseInt(colorHex.slice(1, 3), 16)
    const g = parseInt(colorHex.slice(3, 5), 16)
    const b = parseInt(colorHex.slice(5, 7), 16)
    
    updateProperty('fills', [{
      type: 'SOLID',
      color: { r, g, b, a: 1 },
    }])
  }, [selectedNode, canEditProperty, updateProperty])
  
  const updateOpacity = useCallback((opacity: number) => {
    if (!selectedNode || !canEditProperty('opacity')) return
    updateProperty('opacity', Math.max(0, Math.min(1, opacity)))
  }, [selectedNode, canEditProperty, updateProperty])
  
  const updateCornerRadius = useCallback((radius: number) => {
    if (!selectedNode || !canEditProperty('cornerRadius')) return
    updateProperty('cornerRadius', Math.max(0, radius))
  }, [selectedNode, canEditProperty, updateProperty])
  
  // ============================================
  // VARIABLE LINKING
  // ============================================
  
  const linkPropertyToVariable = useCallback((property: string, variableId: string) => {
    if (!selectedNode) return
    
    // Remove existing binding if any
    const existingBindings = getBindingsForNode(selectedNode.id)
    const existingBinding = existingBindings.find(b => b.property === property)
    if (existingBinding) {
      deleteBinding(existingBinding.id)
    }
    
    // Create new binding
    createBinding({
      nodeId: selectedNode.id,
      property,
      variableId,
    })
  }, [selectedNode, getBindingsForNode, deleteBinding, createBinding])
  
  const unlinkProperty = useCallback((property: string) => {
    if (!selectedNode) return
    
    const bindings = getBindingsForNode(selectedNode.id)
    const binding = bindings.find(b => b.property === property)
    if (binding) {
      deleteBinding(binding.id)
    }
  }, [selectedNode, getBindingsForNode, deleteBinding])
  
  const getPropertyBinding = useCallback((property: string) => {
    if (!selectedNode) return { isLinked: false }
    
    const bindings = getBindingsForNode(selectedNode.id)
    const binding = bindings.find(b => b.property === property)
    
    if (!binding) return { isLinked: false }
    
    const variable = getVariableById(binding.variableId)
    
    return {
      isLinked: true,
      variableId: binding.variableId,
      variableName: variable?.displayName,
    }
  }, [selectedNode, getBindingsForNode, getVariableById])
  
  // ============================================
  // ACTIONS
  // ============================================
  
  const deleteSelected = useCallback(() => {
    if (!selectedNode || !canEdit) return
    deleteNode(selectedNode.id)
  }, [selectedNode, canEdit, deleteNode])
  
  const duplicateSelected = useCallback(() => {
    if (!selectedNode || !canEdit) return null
    return duplicateNode(selectedNode.id)
  }, [selectedNode, canEdit, duplicateNode])
  
  const bringForward = useCallback(() => {
    if (!selectedNode) return
    reorderNode(selectedNode.id, 'down') // Down in array = forward in z-index
  }, [selectedNode, reorderNode])
  
  const sendBackward = useCallback(() => {
    if (!selectedNode) return
    reorderNode(selectedNode.id, 'up') // Up in array = backward in z-index
  }, [selectedNode, reorderNode])
  
  return {
    // Selected Node
    selectedNode,
    selectedNodeType,
    hasSelection,
    
    // Permissions
    canEdit,
    canEditProperty,
    userRole,
    
    // Node Updates
    updateNode,
    updateProperty,
    
    // Text-specific
    updateTextContent,
    updateTextStyle,
    
    // Image-specific
    updateImageSrc,
    updateImageFit,
    
    // Common Style
    updateFill,
    updateOpacity,
    updateCornerRadius,
    
    // Variable Linking
    linkPropertyToVariable,
    unlinkProperty,
    getPropertyBinding,
    
    // Actions
    deleteSelected,
    duplicateSelected,
    bringForward,
    sendBackward,
  }
}

// ============================================
// SPECIALIZED HOOKS
// ============================================

/**
 * Hook for text node editing
 */
export function useTextNodeSync() {
  const { selectedNode, canEdit, canEditProperty, updateTextContent, updateTextStyle, updateProperty } = useEditorSync()
  
  const isTextNode = selectedNode?.type === 'TEXT'
  const textNode = isTextNode ? selectedNode as TextNode : null
  
  return {
    isTextNode,
    textNode,
    canEdit: canEdit && isTextNode,
    canEditContent: canEditProperty('content'),
    canEditFontFamily: canEditProperty('fontFamily'),
    canEditFontSize: canEditProperty('fontSize'),
    canEditFontWeight: canEditProperty('fontWeight'),
    canEditTextAlign: canEditProperty('textAlign'),
    canEditTextColor: canEditProperty('textColor'),
    canEditLineHeight: canEditProperty('lineHeight'),
    canEditLetterSpacing: canEditProperty('letterSpacing'),
    updateContent: updateTextContent,
    updateStyle: updateTextStyle,
    updateProperty,
  }
}

/**
 * Hook for image node editing
 */
export function useImageNodeSync() {
  const { selectedNode, canEdit, canEditProperty, updateImageSrc, updateImageFit, updateProperty } = useEditorSync()
  
  const isImageNode = selectedNode?.type === 'IMAGE'
  const imageNode = isImageNode ? selectedNode as ImageNode : null
  
  return {
    isImageNode,
    imageNode,
    canEdit: canEdit && isImageNode,
    canEditImage: canEditProperty('image'),
    updateSrc: updateImageSrc,
    updateFit: updateImageFit,
    updateProperty,
  }
}

/**
 * Hook for frame/shape editing
 */
export function useFrameNodeSync() {
  const { selectedNode, canEdit, canEditProperty, updateFill, updateOpacity, updateCornerRadius, updateProperty } = useEditorSync()
  
  const isFrameNode = selectedNode?.type === 'FRAME' || selectedNode?.type === 'RECTANGLE'
  
  return {
    isFrameNode,
    node: selectedNode,
    canEdit: canEdit && isFrameNode,
    canEditFills: canEditProperty('fills'),
    canEditOpacity: canEditProperty('opacity'),
    canEditCornerRadius: canEditProperty('cornerRadius'),
    canEditPadding: canEditProperty('padding'),
    canEditGap: canEditProperty('gap'),
    updateFill,
    updateOpacity,
    updateCornerRadius,
    updateProperty,
  }
}

/**
 * Hook for variable-aware property editing
 */
export function useVariableSyncedProperty<T>(
  property: string,
  variableType: VariableType,
  scope: VariableScope
) {
  const { selectedNode, updateProperty, getPropertyBinding, linkPropertyToVariable, unlinkProperty } = useEditorSync()
  const { filterVariables, resolveValue, activeModeId } = useVariablesStore()
  
  const binding = getPropertyBinding(property)
  const availableVariables = filterVariables({ type: variableType, scope })
  
  // Get current value (from variable if linked, or from node)
  const getValue = useCallback((): T | undefined => {
    if (binding.isLinked && binding.variableId) {
      return resolveValue(binding.variableId, activeModeId) as T
    }
    
    if (!selectedNode) return undefined
    
    // Navigate to property
    const parts = property.split('.')
    let current: unknown = selectedNode
    for (const part of parts) {
      if (current && typeof current === 'object') {
        current = (current as Record<string, unknown>)[part]
      } else {
        return undefined
      }
    }
    return current as T
  }, [binding, selectedNode, property, resolveValue, activeModeId])
  
  return {
    value: getValue(),
    isLinked: binding.isLinked,
    variableId: binding.variableId,
    variableName: binding.variableName,
    availableVariables,
    link: linkPropertyToVariable,
    unlink: () => unlinkProperty(property),
    update: (value: T) => updateProperty(property, value),
  }
}
