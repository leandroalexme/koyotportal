/**
 * Text Overflow Management Module
 * 
 * Sistema híbrido para gerenciar overflow de texto:
 * - Auto-size de fonte para caixas fixas
 * - Auto-height para frames com auto-layout
 * - Indicadores visuais de ajuste
 */

export { TextOverflowManager, calculateAutoSizeFontSize, textOverflowManager } from './text-overflow-manager'
export { 
  getTextOverflowState, 
  setTextOverflowState, 
  subscribeToTextOverflow,
  type TextOverflowState,
} from './text-overflow-state'
export { TEXT_SIZE_CONSTRAINTS, getConstraintsForFontSize } from './constraints'
