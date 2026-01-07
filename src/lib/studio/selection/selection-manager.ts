/**
 * Selection Manager
 * 
 * Gerencia o estado de seleção de elementos no editor.
 * Inspirado no padrão do Suika Editor (selected_elements.ts)
 */

import type { SceneNode, FrameNode } from '@/types/studio'

export interface SelectionState {
  selectedIds: Set<string>
  hoveredId: string | null
  highlightedId: string | null
}

export interface SelectionEvents {
  selectionChange: (selectedIds: string[]) => void
  hoverChange: (hoveredId: string | null, prevId: string | null) => void
  highlightChange: (highlightedId: string | null) => void
}

type EventHandler<T> = (data: T) => void

/**
 * Gerencia seleção, hover e highlight de elementos
 */
export class SelectionManager {
  private selectedIds: Set<string> = new Set()
  private hoveredId: string | null = null
  private highlightedId: string | null = null
  private parentIdSet: Set<string> = new Set()
  
  private eventHandlers: Map<keyof SelectionEvents, Set<EventHandler<unknown>>> = new Map()
  
  constructor(private rootNode: FrameNode | null = null) {}
  
  // ============================================
  // ROOT NODE
  // ============================================
  
  setRootNode(rootNode: FrameNode | null) {
    this.rootNode = rootNode
    this.updateParentIdSet()
  }
  
  // ============================================
  // SELECTION
  // ============================================
  
  /**
   * Seleciona um único elemento (limpa seleção anterior)
   */
  select(nodeId: string) {
    const prevIds = Array.from(this.selectedIds)
    this.selectedIds.clear()
    this.selectedIds.add(nodeId)
    this.updateParentIdSet()
    
    if (!this.isSameSelection(prevIds)) {
      this.emit('selectionChange', Array.from(this.selectedIds))
    }
  }
  
  /**
   * Adiciona elemento à seleção (multi-select com Shift)
   */
  addToSelection(nodeId: string) {
    const prevIds = Array.from(this.selectedIds)
    this.selectedIds.add(nodeId)
    this.updateParentIdSet()
    
    if (!this.isSameSelection(prevIds)) {
      this.emit('selectionChange', Array.from(this.selectedIds))
    }
  }
  
  /**
   * Toggle seleção de um elemento
   */
  toggleSelection(nodeId: string) {
    const prevIds = Array.from(this.selectedIds)
    
    if (this.selectedIds.has(nodeId)) {
      this.selectedIds.delete(nodeId)
    } else {
      this.selectedIds.add(nodeId)
    }
    this.updateParentIdSet()
    
    if (!this.isSameSelection(prevIds)) {
      this.emit('selectionChange', Array.from(this.selectedIds))
    }
  }
  
  /**
   * Limpa toda a seleção
   */
  clearSelection() {
    if (this.selectedIds.size === 0) return
    
    this.selectedIds.clear()
    this.parentIdSet.clear()
    this.emit('selectionChange', [])
  }
  
  /**
   * Define múltiplos elementos selecionados
   */
  setSelection(nodeIds: string[]) {
    const prevIds = Array.from(this.selectedIds)
    this.selectedIds = new Set(nodeIds)
    this.updateParentIdSet()
    
    if (!this.isSameSelection(prevIds)) {
      this.emit('selectionChange', Array.from(this.selectedIds))
    }
  }
  
  /**
   * Verifica se um elemento está selecionado
   */
  isSelected(nodeId: string): boolean {
    return this.selectedIds.has(nodeId)
  }
  
  /**
   * Retorna IDs dos elementos selecionados
   */
  getSelectedIds(): string[] {
    return Array.from(this.selectedIds)
  }
  
  /**
   * Retorna quantidade de elementos selecionados
   */
  getSelectionCount(): number {
    return this.selectedIds.size
  }
  
  /**
   * Verifica se há seleção
   */
  hasSelection(): boolean {
    return this.selectedIds.size > 0
  }
  
  // ============================================
  // HOVER
  // ============================================
  
  /**
   * Define elemento em hover
   */
  setHover(nodeId: string | null) {
    const prevId = this.hoveredId
    if (prevId === nodeId) return
    
    this.hoveredId = nodeId
    this.setHighlight(nodeId)
    this.emit('hoverChange', nodeId, prevId)
  }
  
  /**
   * Retorna ID do elemento em hover
   */
  getHoveredId(): string | null {
    return this.hoveredId
  }
  
  /**
   * Verifica se um elemento está em hover
   */
  isHovered(nodeId: string): boolean {
    return this.hoveredId === nodeId
  }
  
  // ============================================
  // HIGHLIGHT
  // ============================================
  
  /**
   * Define elemento destacado (usado para layer panel)
   */
  setHighlight(nodeId: string | null) {
    if (this.highlightedId === nodeId) return
    
    this.highlightedId = nodeId
    this.emit('highlightChange', nodeId)
  }
  
  /**
   * Retorna ID do elemento destacado
   */
  getHighlightedId(): string | null {
    return this.highlightedId
  }
  
  // ============================================
  // PARENT ID SET (para deep selection)
  // ============================================
  
  /**
   * Retorna set de IDs dos pais dos elementos selecionados
   * Usado para deep selection (Cmd+click)
   */
  getParentIdSet(): Set<string> {
    return new Set(this.parentIdSet)
  }
  
  private updateParentIdSet() {
    this.parentIdSet.clear()
    if (!this.rootNode) return
    
    for (const nodeId of this.selectedIds) {
      const parentIds = this.getParentIds(nodeId)
      parentIds.forEach(id => this.parentIdSet.add(id))
    }
  }
  
  private getParentIds(nodeId: string): string[] {
    const parentIds: string[] = []
    if (!this.rootNode) return parentIds
    
    const findParents = (node: SceneNode, targetId: string, path: string[]): boolean => {
      if (node.id === targetId) {
        parentIds.push(...path)
        return true
      }
      
      if ('children' in node && node.children) {
        for (const child of node.children) {
          if (findParents(child, targetId, [...path, node.id])) {
            return true
          }
        }
      }
      return false
    }
    
    findParents(this.rootNode, nodeId, [])
    return parentIds
  }
  
  // ============================================
  // HELPERS
  // ============================================
  
  private isSameSelection(prevIds: string[]): boolean {
    if (prevIds.length !== this.selectedIds.size) return false
    return prevIds.every(id => this.selectedIds.has(id))
  }
  
  // ============================================
  // EVENTS
  // ============================================
  
  on<K extends keyof SelectionEvents>(event: K, handler: SelectionEvents[K]) {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, new Set())
    }
    this.eventHandlers.get(event)!.add(handler as EventHandler<unknown>)
  }
  
  off<K extends keyof SelectionEvents>(event: K, handler: SelectionEvents[K]) {
    this.eventHandlers.get(event)?.delete(handler as EventHandler<unknown>)
  }
  
  private emit<K extends keyof SelectionEvents>(event: K, ...args: Parameters<SelectionEvents[K]>) {
    const handlers = this.eventHandlers.get(event)
    if (handlers) {
      handlers.forEach(handler => {
        (handler as (...args: Parameters<SelectionEvents[K]>) => void)(...args)
      })
    }
  }
  
  // ============================================
  // STATE SNAPSHOT
  // ============================================
  
  getState(): SelectionState {
    return {
      selectedIds: new Set(this.selectedIds),
      hoveredId: this.hoveredId,
      highlightedId: this.highlightedId,
    }
  }
}
