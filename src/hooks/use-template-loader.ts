/**
 * Template Loader Hook
 * 
 * Carrega templates de múltiplas fontes:
 * 1. API do servidor (templates importados)
 * 2. localStorage (persistência local)
 * 3. Templates de mock (fallback)
 */

'use client'

import { useState, useEffect, useCallback } from 'react'
import type { Template } from '@/types/studio'
import { getMockTemplateById, MOCK_TEMPLATES } from '@/lib/studio/mocks'

const STORAGE_KEY = 'koyot_imported_templates'

interface StoredTemplateEntry {
  id: string
  brandId: string
  template: Template
  createdAt: string
  source: string
}

// ============================================
// LOCAL STORAGE HELPERS
// ============================================

function getLocalTemplates(): StoredTemplateEntry[] {
  if (typeof window === 'undefined') return []
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

function saveLocalTemplate(entry: StoredTemplateEntry): void {
  if (typeof window === 'undefined') return
  
  try {
    const stored = getLocalTemplates()
    const filtered = stored.filter(t => t.id !== entry.id)
    filtered.push(entry)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered))
    console.log('[Template Loader] Saved to localStorage:', entry.id)
  } catch (error) {
    console.error('[Template Loader] Failed to save to localStorage:', error)
  }
}

function getLocalTemplate(id: string): Template | null {
  const stored = getLocalTemplates()
  const entry = stored.find(t => t.id === id)
  return entry?.template || null
}

// ============================================
// HOOK
// ============================================

interface UseTemplateLoaderResult {
  template: Template | null
  isLoading: boolean
  error: string | null
  saveTemplate: (template: Template, brandId: string, source?: string) => void
}

export function useTemplateLoader(templateId: string, brandId: string): UseTemplateLoaderResult {
  const [template, setTemplate] = useState<Template | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Load template on mount or when templateId changes
  useEffect(() => {
    let cancelled = false
    
    async function loadTemplate() {
      setIsLoading(true)
      setError(null)
      
      // 1. Tentar buscar do localStorage (mais rápido)
      const localTemplate = getLocalTemplate(templateId)
      if (localTemplate && !cancelled) {
        console.log('[Template Loader] Found in localStorage:', localTemplate.name)
        setTemplate(localTemplate)
        setIsLoading(false)
        return
      }
      
      // 2. Tentar buscar da API
      try {
        const response = await fetch(`/api/templates?id=${templateId}`)
        if (response.ok && !cancelled) {
          const data = await response.json()
          if (data.success && data.template) {
            console.log('[Template Loader] Found in API:', data.template.name)
            // Salvar no localStorage para persistência
            saveLocalTemplate({
              id: templateId,
              brandId,
              template: data.template,
              createdAt: new Date().toISOString(),
              source: 'api',
            })
            setTemplate(data.template)
            setIsLoading(false)
            return
          }
        }
      } catch {
        console.log('[Template Loader] API not available')
      }
      
      // 3. Fallback para templates de mock
      if (!cancelled) {
        const mockTemplate = getMockTemplateById(templateId)
        if (mockTemplate) {
          console.log('[Template Loader] Using mock template:', mockTemplate.name)
          setTemplate(mockTemplate)
        } else {
          // Usar primeiro template de mock como fallback final
          const fallback = MOCK_TEMPLATES[0]
          console.log('[Template Loader] Using fallback template:', fallback?.name)
          setTemplate(fallback || null)
        }
        setIsLoading(false)
      }
    }
    
    loadTemplate()
    
    return () => { cancelled = true }
  }, [templateId, brandId])
  
  // Save template function
  const saveTemplate = useCallback((newTemplate: Template, templateBrandId: string, source = 'figma') => {
    // Salvar no localStorage
    saveLocalTemplate({
      id: newTemplate.id,
      brandId: templateBrandId,
      template: newTemplate,
      createdAt: new Date().toISOString(),
      source,
    })
    
    // Atualizar estado
    setTemplate(newTemplate)
    
    // Também salvar na API (fire and forget)
    fetch('/api/templates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: newTemplate.id,
        brandId: templateBrandId,
        template: newTemplate,
        source,
      }),
    }).catch(() => {
      console.log('[Template Loader] API save failed, localStorage backup active')
    })
  }, [])
  
  return {
    template,
    isLoading,
    error,
    saveTemplate,
  }
}

// ============================================
// UTILITY: Save template after import
// ============================================

export function saveImportedTemplateToStorage(
  id: string,
  brandId: string,
  template: Template,
  source = 'figma',
  sourceUrl?: string
): void {
  // Salvar no localStorage
  saveLocalTemplate({
    id,
    brandId,
    template: {
      ...template,
      id,
    },
    createdAt: new Date().toISOString(),
    source,
  })
  
  // Também salvar na API
  fetch('/api/templates', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      id,
      brandId,
      template: {
        ...template,
        id,
      },
      source,
      sourceUrl,
    }),
  }).catch(() => {
    console.log('[Template Storage] API save failed, localStorage backup active')
  })
}
