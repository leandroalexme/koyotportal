/**
 * CanvasKit Loader
 * 
 * Handles async loading of the CanvasKit WASM module.
 * CanvasKit is loaded once and cached for reuse.
 * 
 * Adapted from Suika Editor for Koyot Studio
 */

import type { CanvasKit } from 'canvaskit-wasm'

let canvasKitInstance: CanvasKit | null = null
let loadingPromise: Promise<CanvasKit> | null = null

/**
 * Configuration for CanvasKit loading
 */
export interface CanvasKitConfig {
  /**
   * Custom path to locate WASM files.
   * Default: uses CDN
   */
  locateFile?: (file: string) => string
}

/**
 * Default file locator - uses unpkg CDN for WASM files
 */
const defaultLocateFile = (file: string): string => {
  return `https://unpkg.com/canvaskit-wasm@0.39.1/bin/${file}`
}

/**
 * Load CanvasKit WASM module
 * 
 * This function is idempotent - calling it multiple times
 * will return the same instance.
 */
export async function loadCanvasKit(
  config?: CanvasKitConfig,
): Promise<CanvasKit> {
  // Return cached instance if available
  if (canvasKitInstance) {
    return canvasKitInstance
  }

  // Return existing loading promise if in progress
  if (loadingPromise) {
    return loadingPromise
  }

  // Start loading
  loadingPromise = (async () => {
    try {
      // Dynamic import to avoid bundling issues
      const CanvasKitInit = (await import('canvaskit-wasm')).default

      const locateFile = config?.locateFile ?? defaultLocateFile

      canvasKitInstance = await CanvasKitInit({
        locateFile,
      })

      console.log('[Koyot] CanvasKit loaded successfully')
      return canvasKitInstance
    } catch (error) {
      loadingPromise = null
      console.error('[Koyot] Failed to load CanvasKit:', error)
      throw error
    }
  })()

  return loadingPromise
}

/**
 * Check if CanvasKit is already loaded
 */
export function isCanvasKitLoaded(): boolean {
  return canvasKitInstance !== null
}

/**
 * Get the loaded CanvasKit instance
 * @throws Error if CanvasKit is not loaded yet
 */
export function getCanvasKit(): CanvasKit {
  if (!canvasKitInstance) {
    throw new Error('[Koyot] CanvasKit not loaded. Call loadCanvasKit() first.')
  }
  return canvasKitInstance
}

/**
 * Reset CanvasKit instance (mainly for testing)
 */
export function resetCanvasKit(): void {
  canvasKitInstance = null
  loadingPromise = null
}
