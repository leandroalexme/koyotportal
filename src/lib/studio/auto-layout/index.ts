/**
 * Auto Layout Module
 * 
 * Sistema de handles visuais para padding e gap em frames com auto-layout.
 */

export { AutoLayoutHandlesRenderer } from './auto-layout-renderer'
export {
  calculatePaddingHandles,
  calculateGapHandles,
  renderPaddingHatchArea,
  renderGapHatchArea,
  renderValueTooltip,
} from './auto-layout-renderer'

export {
  DEFAULT_AUTO_LAYOUT_COLORS,
} from './types'

export type {
  AutoLayoutHandleType,
  PaddingHandle,
  GapHandle,
  AutoLayoutHandle,
  AutoLayoutColors,
  AutoLayoutFrameAttrs,
} from './types'

// State management
export {
  autoLayoutState,
  activatePaddingHandle,
  activateGapHandle,
  deactivateSidebarHandle,
} from './auto-layout-state'

export type {
  AutoLayoutActiveState,
} from './auto-layout-state'
