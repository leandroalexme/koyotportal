/**
 * Koyot Studio - Mockups Module
 * 
 * Sistema de mockups dinâmicos para visualização de templates
 * em cenários reais (cartões de visita, outdoors, dispositivos, etc.)
 * 
 * Recursos:
 * - Transformações de perspectiva (homografia)
 * - Renderização GPU via CanvasKit/Skia
 * - Camadas com blend modes (multiply, overlay, etc.)
 * - Integração reativa com Zustand
 * 
 * @example
 * ```typescript
 * import { MockupRenderer, useMockupStore, mockupPresets } from '@/lib/studio/mockups'
 * 
 * // Criar renderer
 * const renderer = new MockupRenderer({ preferCanvasKit: true })
 * await renderer.ready
 * 
 * // Renderizar mockup
 * const result = await renderer.render(mockupPresets[0], templateSnapshots)
 * ```
 */

// Types
export type {
  Point2D,
  Quad,
  MockupCategory,
  MockupBlendMode,
  MockupLayer,
  MockupInsertArea,
  MockupDefinition,
  TemplateSnapshot,
  MockupRenderState,
  MockupRenderResult,
  MockupExportOptions,
  MockupUpdateEvent,
} from './types'

export { quadToFlatArray } from './types'

// Perspective Transform
export type { Matrix3x3 } from './perspective-transform'
export {
  identityMatrix,
  multiplyMatrices,
  invertMatrix,
  quadToQuadMatrix,
  rectToQuadMatrix,
  transformPoint,
  matrixToCSSMatrix3d,
  matrixToCanvasKit,
  applyPerspectiveCanvas2D,
} from './perspective-transform'

// Renderer
export type { MockupRendererOptions, RenderResult } from './mockup-renderer'
export { MockupRenderer } from './mockup-renderer'

// Store
export {
  useMockupStore,
  useSelectedMockup,
  useFilteredMockups,
  useMockupCategories,
} from './mockup-store'

// Presets
export {
  mockupPresets,
  getMockupPresetById,
  getMockupPresetsByCategory,
  businessCardInHandMockup,
  billboardUrbanMockup,
  posterWallMockup,
  phoneScreenMockup,
  laptopScreenMockup,
  paperBagMockup,
  instagramPostMockup,
} from './presets'

// Hooks
export {
  useTemplateSnapshot,
  useTemplateSnapshotCanvas,
  captureNodeSnapshot,
  createSnapshotFromCanvas,
} from './use-template-snapshot'

// Demo Mockups (para desenvolvimento)
export {
  demoMockups,
  getDemoMockupById,
  demoBusinessCardMockup,
  demoPhoneMockup,
  demoBillboardMockup,
  demoSocialMockup,
} from './demo-mockups'
