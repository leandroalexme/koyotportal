/**
 * Koyot Mockup Engine V2
 * 
 * Sistema profissional de mockups com suporte a PSD e Smart Objects
 * 
 * Arquitetura Híbrida:
 * - Preview Real-Time: CanvasKit/Skia com perspectiva (setPolyToPoly)
 * - Export Final: Photopea para warp/mesh complexo (futuro)
 * 
 * @example
 * ```typescript
 * import { parsePsdFile, CanvasKitMockupRenderer } from '@/lib/studio/mockup-engine'
 * 
 * // 1. Parse PSD
 * const result = await parsePsdFile(file, { name: 'Meu Mockup' })
 * if (result.success) {
 *   const template = result.template
 *   
 *   // 2. Renderizar com design
 *   const renderer = new CanvasKitMockupRenderer()
 *   await renderer.ready
 *   
 *   const renderResult = await renderer.render(template, [
 *     { smartObjectId: 'screen', image: myDesignImage }
 *   ])
 * }
 * ```
 */

// Types
export type {
  Point2D,
  Bounds,
  Size,
  Quad,
  AffineTransform,
  Matrix3x3,
  BlendMode,
  LayerType,
  RGBA,
  SolidColorInfo,
  SmartObjectInfo,
  SmartObjectMask,
  PsdLayer,
  LayerEffectsInfo,
  LayerEffectShadow,
  LayerEffectGlow,
  LayerEffectBevel,
  LayerEffectSolidFill,
  MockupCategory,
  MockupTemplate,
  ImageAdjustments,
  DesignInput as DesignInputType,
  ExportOptions,
  RenderRequest,
  RenderResult,
  MockupEngineState,
  MockupEngineEventType,
  MockupEngineEvent,
  MockupEngineEventHandler,
} from './core/types'

// PSD Parser
export {
  parsePsd,
  parsePsdFile,
  isPsdFile,
  type PsdParseOptions,
  type PsdParseResult,
} from './core/psd-parser'

// CanvasKit Renderer
export {
  CanvasKitMockupRenderer,
  type MockupRendererOptions,
  type DesignInput as RendererDesignInput,
  type RenderOptions,
} from './render/canvaskit-mockup-renderer'
