/**
 * Backend Detector
 * 
 * Detects the best available rendering backend for the current browser.
 * Priority: WebGL > Canvas2D (fallback)
 * 
 * Adapted from Suika Editor for Koyot Studio
 */

export type RenderBackendType = 'webgl' | 'canvas2d'

/**
 * Check if WebGL is available
 */
export function isWebGLAvailable(): boolean {
  if (typeof document === 'undefined') return false

  try {
    const canvas = document.createElement('canvas')
    const gl =
      canvas.getContext('webgl2') ||
      canvas.getContext('webgl') ||
      canvas.getContext('experimental-webgl')
    return gl !== null
  } catch {
    return false
  }
}

/**
 * Detect the best available rendering backend
 */
export async function detectBestBackend(): Promise<RenderBackendType> {
  if (isWebGLAvailable()) {
    return 'webgl'
  }

  console.warn(
    '[Koyot] WebGL not available, falling back to Canvas2D. Performance may be reduced.',
  )
  return 'canvas2d'
}

/**
 * Get backend capabilities info (for debugging/UI)
 */
export async function getBackendCapabilities(): Promise<{
  webgl: boolean
  recommended: RenderBackendType
}> {
  const webgl = isWebGLAvailable()
  const recommended = await detectBestBackend()

  return {
    webgl,
    recommended,
  }
}
