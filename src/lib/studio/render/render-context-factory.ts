/**
 * Render Context Factory
 * 
 * Factory for creating the appropriate render context based on
 * available backends and user preferences.
 * 
 * Adapted from Suika Editor for Koyot Studio
 */

import { detectBestBackend, type RenderBackendType } from './backend-detector'
import { Canvas2DRenderContext } from './canvas2d-context'
import { CanvasKitRenderContext } from './canvaskit-context'
import { loadCanvasKit } from './canvaskit-loader'
import { type IRenderContext } from './render-context'

export interface RenderContextOptions {
  /**
   * Force a specific backend. If not specified, the best available will be used.
   */
  forceBackend?: RenderBackendType

  /**
   * Custom path for CanvasKit WASM files
   */
  canvasKitWasmPath?: (file: string) => string

  /**
   * Callback when backend is initialized
   */
  onBackendReady?: (backend: RenderBackendType) => void

  /**
   * Callback when backend initialization fails
   */
  onBackendError?: (error: Error, fallbackBackend: RenderBackendType) => void
}

/**
 * Create a render context for the given canvas element
 * 
 * This function will:
 * 1. Detect the best available backend (or use forced backend)
 * 2. Try to initialize CanvasKit if WebGL is available
 * 3. Fall back to Canvas2D if CanvasKit fails
 */
export async function createRenderContext(
  canvasElement: HTMLCanvasElement,
  options: RenderContextOptions = {},
): Promise<{ context: IRenderContext; backend: RenderBackendType }> {
  const { forceBackend, canvasKitWasmPath, onBackendReady, onBackendError } = options

  // Determine which backend to use
  const targetBackend = forceBackend ?? (await detectBestBackend())

  // If Canvas2D is requested or detected, use it directly
  if (targetBackend === 'canvas2d') {
    const ctx = canvasElement.getContext('2d')
    if (!ctx) {
      throw new Error('[Koyot] Failed to get Canvas2D context')
    }
    const context = new Canvas2DRenderContext(ctx)
    onBackendReady?.('canvas2d')
    return { context, backend: 'canvas2d' }
  }

  // Try to initialize CanvasKit (WebGL)
  try {
    const canvasKit = await loadCanvasKit(
      canvasKitWasmPath ? { locateFile: canvasKitWasmPath } : undefined,
    )

    const context = new CanvasKitRenderContext(canvasKit, canvasElement)
    onBackendReady?.(targetBackend)
    console.log('[Koyot] Using CanvasKit (WebGL) backend')
    return { context, backend: targetBackend }
  } catch (error) {
    // Fall back to Canvas2D
    console.warn('[Koyot] CanvasKit initialization failed, falling back to Canvas2D:', error)

    onBackendError?.(error as Error, 'canvas2d')

    const ctx = canvasElement.getContext('2d')
    if (!ctx) {
      throw new Error('[Koyot] Failed to get Canvas2D context after CanvasKit failure')
    }

    const context = new Canvas2DRenderContext(ctx)
    onBackendReady?.('canvas2d')
    return { context, backend: 'canvas2d' }
  }
}

/**
 * Create a Canvas2D render context synchronously
 * 
 * Use this when you need immediate context creation without async,
 * or when you explicitly want Canvas2D.
 */
export function createCanvas2DContext(
  canvasElement: HTMLCanvasElement,
): Canvas2DRenderContext {
  const ctx = canvasElement.getContext('2d')
  if (!ctx) {
    throw new Error('[Koyot] Failed to get Canvas2D context')
  }
  return new Canvas2DRenderContext(ctx)
}
