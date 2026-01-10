/**
 * Auto Layout State Manager
 * 
 * Gerencia o estado dos handles de auto-layout para feedback visual
 * quando o usuário edita gap/padding via sidebar.
 */

import type { AutoLayoutHandleType } from './types'

// ============================================================================
// Types
// ============================================================================

export interface AutoLayoutActiveState {
  /** Handle atualmente ativo (hover ou editando via sidebar) */
  activeHandle: AutoLayoutHandleType | null
  /** ID do frame com o handle ativo */
  activeFrameId: string | null
  /** Índice do gap ativo (para múltiplos gaps) */
  activeGapIndex: number
  /** Valor atual sendo editado */
  currentValue: number
  /** Fonte da ativação: 'hover' (canvas) ou 'sidebar' (input) */
  source: 'hover' | 'sidebar' | null
}

type StateChangeCallback = (state: AutoLayoutActiveState) => void

// ============================================================================
// State Manager (Singleton)
// ============================================================================

class AutoLayoutStateManager {
  private state: AutoLayoutActiveState = {
    activeHandle: null,
    activeFrameId: null,
    activeGapIndex: -1,
    currentValue: 0,
    source: null,
  }

  private listeners: Set<StateChangeCallback> = new Set()

  /**
   * Obtém o estado atual
   */
  getState(): AutoLayoutActiveState {
    return { ...this.state }
  }

  /**
   * Ativa um handle (hover ou edição via sidebar)
   */
  activateHandle(
    handleType: AutoLayoutHandleType,
    frameId: string,
    value: number,
    source: 'hover' | 'sidebar',
    gapIndex: number = -1
  ): void {
    this.state = {
      activeHandle: handleType,
      activeFrameId: frameId,
      activeGapIndex: gapIndex,
      currentValue: value,
      source,
    }
    this.notifyListeners()
  }

  /**
   * Atualiza o valor do handle ativo
   */
  updateValue(value: number): void {
    if (this.state.activeHandle) {
      this.state.currentValue = value
      this.notifyListeners()
    }
  }

  /**
   * Desativa o handle atual
   */
  deactivateHandle(source?: 'hover' | 'sidebar'): void {
    // Se source é especificado, só desativa se a fonte corresponder
    if (source && this.state.source !== source) {
      return
    }
    
    this.state = {
      activeHandle: null,
      activeFrameId: null,
      activeGapIndex: -1,
      currentValue: 0,
      source: null,
    }
    this.notifyListeners()
  }

  /**
   * Verifica se um handle específico está ativo
   */
  isHandleActive(handleType: AutoLayoutHandleType, frameId: string): boolean {
    return (
      this.state.activeHandle === handleType &&
      this.state.activeFrameId === frameId
    )
  }

  /**
   * Verifica se qualquer handle está ativo para um frame
   */
  hasActiveHandle(frameId: string): boolean {
    return this.state.activeFrameId === frameId && this.state.activeHandle !== null
  }

  /**
   * Registra um listener para mudanças de estado
   */
  subscribe(callback: StateChangeCallback): () => void {
    this.listeners.add(callback)
    return () => {
      this.listeners.delete(callback)
    }
  }

  /**
   * Notifica todos os listeners sobre mudança de estado
   */
  private notifyListeners(): void {
    const state = this.getState()
    this.listeners.forEach(callback => callback(state))
  }
}

// Singleton instance
export const autoLayoutState = new AutoLayoutStateManager()

// ============================================================================
// React Hook Helper
// ============================================================================

/**
 * Helper para ativar handle de padding via sidebar
 */
export function activatePaddingHandle(
  side: 'top' | 'right' | 'bottom' | 'left',
  frameId: string,
  value: number
): void {
  const handleType = `padding-${side}` as AutoLayoutHandleType
  autoLayoutState.activateHandle(handleType, frameId, value, 'sidebar')
}

/**
 * Helper para ativar handle de gap via sidebar
 */
export function activateGapHandle(
  frameId: string,
  value: number,
  gapIndex: number = 0
): void {
  autoLayoutState.activateHandle('gap', frameId, value, 'sidebar', gapIndex)
}

/**
 * Helper para desativar handle via sidebar
 */
export function deactivateSidebarHandle(): void {
  autoLayoutState.deactivateHandle('sidebar')
}
