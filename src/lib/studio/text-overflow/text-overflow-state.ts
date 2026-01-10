/**
 * Text Overflow State Manager
 * 
 * Gerencia o estado de overflow de texto para feedback visual na sidebar.
 */

export interface TextOverflowState {
  /** ID do nó de texto */
  nodeId: string
  /** Tamanho original da fonte */
  originalFontSize: number
  /** Tamanho atual (ajustado) da fonte */
  currentFontSize: number
  /** Se a fonte foi ajustada */
  isAdjusted: boolean
  /** Percentual de redução (1 = sem redução, 0.6 = 60% do original) */
  reductionPercentage: number
  /** Se o texto ainda está em overflow mesmo após ajuste máximo */
  isOverflowing: boolean
  /** Limite de caracteres (se definido) */
  characterLimit?: number
  /** Contagem atual de caracteres */
  characterCount: number
}

type StateChangeCallback = (states: Map<string, TextOverflowState>) => void

class TextOverflowStateManager {
  private states: Map<string, TextOverflowState> = new Map()
  private listeners: Set<StateChangeCallback> = new Set()

  /**
   * Obtém o estado de overflow de um nó específico
   */
  getState(nodeId: string): TextOverflowState | undefined {
    return this.states.get(nodeId)
  }

  /**
   * Obtém todos os estados
   */
  getAllStates(): Map<string, TextOverflowState> {
    return new Map(this.states)
  }

  /**
   * Define o estado de overflow de um nó
   */
  setState(nodeId: string, state: TextOverflowState): void {
    this.states.set(nodeId, state)
    this.notifyListeners()
  }

  /**
   * Atualiza parcialmente o estado de um nó
   */
  updateState(nodeId: string, updates: Partial<TextOverflowState>): void {
    const current = this.states.get(nodeId)
    if (current) {
      this.states.set(nodeId, { ...current, ...updates })
      this.notifyListeners()
    }
  }

  /**
   * Remove o estado de um nó
   */
  clearState(nodeId: string): void {
    this.states.delete(nodeId)
    this.notifyListeners()
  }

  /**
   * Limpa todos os estados
   */
  clearAll(): void {
    this.states.clear()
    this.notifyListeners()
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

  private notifyListeners(): void {
    const states = this.getAllStates()
    this.listeners.forEach(callback => callback(states))
  }
}

// Singleton instance
const textOverflowStateManager = new TextOverflowStateManager()

// Export helpers
export function getTextOverflowState(nodeId: string): TextOverflowState | undefined {
  return textOverflowStateManager.getState(nodeId)
}

export function setTextOverflowState(nodeId: string, state: TextOverflowState): void {
  textOverflowStateManager.setState(nodeId, state)
}

export function subscribeToTextOverflow(callback: StateChangeCallback): () => void {
  return textOverflowStateManager.subscribe(callback)
}

export { textOverflowStateManager }
