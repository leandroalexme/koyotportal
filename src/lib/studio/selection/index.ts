/**
 * Selection System
 * 
 * Sistema de seleção, hover e handles para o editor.
 */

export { SelectionManager } from './selection-manager'
export type { SelectionState, SelectionEvents } from './selection-manager'

export { SelectionRenderer, DEFAULT_SELECTION_STYLE } from './selection-renderer'
export type { SelectionStyle, HandleType, HandleInfo } from './selection-renderer'

export { 
  hitTest, 
  hitTestAll, 
  isPointInRect, 
  getBoundingBox,
  findNodeById,
  findNodesByIds,
} from './hit-test'
export type { HitTestOptions, HitTestResult } from './hit-test'
