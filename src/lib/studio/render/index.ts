/**
 * Koyot Studio - Render Module
 * 
 * Provides abstraction layer for Canvas2D and CanvasKit (Skia) rendering backends.
 * 
 * Usage:
 * ```typescript
 * import { createRenderContext, type IRenderContext } from '@/lib/studio/render'
 * 
 * // Create render context (auto-detects best backend)
 * const { context, backend } = await createRenderContext(canvasElement)
 * 
 * // Use the context like Canvas2D
 * context.fillStyle = '#ff0000'
 * context.fillRect(0, 0, 100, 100)
 * context.flush() // Required for CanvasKit
 * ```
 */

// Types
export { type IRenderContext, type TransformArray } from './render-context'
export { type RenderBackendType } from './backend-detector'
export { type RenderContextOptions } from './render-context-factory'

// Factory
export { createRenderContext, createCanvas2DContext } from './render-context-factory'

// Context implementations
export { Canvas2DRenderContext } from './canvas2d-context'
export { CanvasKitRenderContext } from './canvaskit-context'

// Loader and detector
export { loadCanvasKit, isCanvasKitLoaded, getCanvasKit } from './canvaskit-loader'
export { detectBestBackend, isWebGLAvailable, getBackendCapabilities } from './backend-detector'
