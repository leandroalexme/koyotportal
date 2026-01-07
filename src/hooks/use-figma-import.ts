/**
 * Figma Import Hook
 * 
 * React hook for importing Figma designs into the editor.
 */

import { useState, useCallback } from 'react'
import type { Template } from '@/types/studio'
import type { FigmaImportResult } from '@/types/figma'

export interface UseFigmaImportOptions {
  /** Brand ID to associate with imported templates */
  brandId?: string
  /** Whether to import images (default: true) */
  importImages?: boolean
  /** Image export scale (default: 2) */
  scale?: number
  /** Whether to map Figma styles to variables */
  mapStylesToVariables?: boolean
  /** Callback when import succeeds */
  onSuccess?: (template: Template) => void
  /** Callback when import fails */
  onError?: (error: string) => void
}

export interface UseFigmaImportReturn {
  /** Import from a Figma URL */
  importFromUrl: (url: string, accessToken: string) => Promise<FigmaImportResult>
  /** Import from file key and optional node ID */
  importFromFileKey: (fileKey: string, accessToken: string, nodeId?: string) => Promise<FigmaImportResult>
  /** Validate a Figma URL */
  validateUrl: (url: string) => Promise<{ valid: boolean; fileKey?: string; nodeId?: string; error?: string }>
  /** Whether an import is in progress */
  isLoading: boolean
  /** Last import error */
  error: string | null
  /** Last imported template */
  template: Template | null
  /** Warnings from last import */
  warnings: string[]
  /** Image URL map from last import */
  imageMap: Record<string, string>
  /** Reset state */
  reset: () => void
}

export function useFigmaImport(options: UseFigmaImportOptions = {}): UseFigmaImportReturn {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [template, setTemplate] = useState<Template | null>(null)
  const [warnings, setWarnings] = useState<string[]>([])
  const [imageMap, setImageMap] = useState<Record<string, string>>({})

  const reset = useCallback(() => {
    setIsLoading(false)
    setError(null)
    setTemplate(null)
    setWarnings([])
    setImageMap({})
  }, [])

  const validateUrl = useCallback(async (url: string) => {
    try {
      const response = await fetch('/api/figma/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      })
      
      const data = await response.json()
      return data
    } catch (err) {
      return {
        valid: false,
        error: err instanceof Error ? err.message : 'Validation failed',
      }
    }
  }, [])

  const performImport = useCallback(async (
    body: Record<string, unknown>,
    accessToken: string
  ): Promise<FigmaImportResult> => {
    setIsLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/figma/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...body,
          accessToken,
          brandId: options.brandId,
          importImages: options.importImages ?? false, // Desabilitado para evitar rate limit
          scale: options.scale ?? 2,
          mapStylesToVariables: options.mapStylesToVariables ?? false,
        }),
      })
      
      const data = await response.json()
      
      if (!response.ok || !data.success) {
        const errorMsg = data.errors?.join(', ') || data.error || 'Import failed'
        setError(errorMsg)
        setWarnings(data.warnings || [])
        options.onError?.(errorMsg)
        return {
          success: false,
          errors: data.errors || [errorMsg],
          warnings: data.warnings || [],
        }
      }
      
      setTemplate(data.template)
      setWarnings(data.warnings || [])
      setImageMap(data.imageMap || {})
      options.onSuccess?.(data.template)
      
      return {
        success: true,
        template: data.template,
        warnings: data.warnings || [],
        imageMap: data.imageMap || {},
      }
      
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Import failed'
      setError(errorMsg)
      options.onError?.(errorMsg)
      return {
        success: false,
        errors: [errorMsg],
      }
    } finally {
      setIsLoading(false)
    }
  }, [options])

  const importFromUrl = useCallback(async (url: string, accessToken: string) => {
    return performImport({ url }, accessToken)
  }, [performImport])

  const importFromFileKey = useCallback(async (
    fileKey: string,
    accessToken: string,
    nodeId?: string
  ) => {
    return performImport({ fileKey, nodeId }, accessToken)
  }, [performImport])

  return {
    importFromUrl,
    importFromFileKey,
    validateUrl,
    isLoading,
    error,
    template,
    warnings,
    imageMap,
    reset,
  }
}

export default useFigmaImport
