/**
 * Template Storage Service
 * 
 * Gerencia persistência de templates importados.
 * Usa localStorage como armazenamento temporário até integração com Supabase.
 */

import type { Template } from '@/types/studio'

const STORAGE_KEY = 'koyot_imported_templates'

interface StoredTemplate {
  id: string
  brandId: string
  template: Template
  createdAt: string
  updatedAt: string
  source: 'figma' | 'upload' | 'created'
  sourceUrl?: string
}

// ============================================
// STORAGE FUNCTIONS
// ============================================

function getStoredTemplates(): StoredTemplate[] {
  if (typeof window === 'undefined') return []
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

function setStoredTemplates(templates: StoredTemplate[]): void {
  if (typeof window === 'undefined') return
  
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(templates))
  } catch (error) {
    console.error('[Template Storage] Failed to save:', error)
  }
}

// ============================================
// PUBLIC API
// ============================================

/**
 * Salva um template importado
 */
export function saveImportedTemplate(
  id: string,
  brandId: string,
  template: Template,
  source: StoredTemplate['source'] = 'figma',
  sourceUrl?: string
): StoredTemplate {
  const stored = getStoredTemplates()
  
  const now = new Date().toISOString()
  const newEntry: StoredTemplate = {
    id,
    brandId,
    template: {
      ...template,
      id, // Garantir que o ID do template seja o mesmo
    },
    createdAt: now,
    updatedAt: now,
    source,
    sourceUrl,
  }
  
  // Remover se já existir (update)
  const filtered = stored.filter(t => t.id !== id)
  filtered.push(newEntry)
  
  setStoredTemplates(filtered)
  
  console.log('[Template Storage] Saved:', id, template.name)
  
  return newEntry
}

/**
 * Busca um template pelo ID
 */
export function getImportedTemplate(id: string): Template | null {
  const stored = getStoredTemplates()
  const entry = stored.find(t => t.id === id)
  return entry?.template || null
}

/**
 * Busca todos os templates de uma brand
 */
export function getImportedTemplatesByBrand(brandId: string): Template[] {
  const stored = getStoredTemplates()
  return stored
    .filter(t => t.brandId === brandId)
    .map(t => t.template)
}

/**
 * Deleta um template
 */
export function deleteImportedTemplate(id: string): boolean {
  const stored = getStoredTemplates()
  const filtered = stored.filter(t => t.id !== id)
  
  if (filtered.length === stored.length) {
    return false // Não encontrado
  }
  
  setStoredTemplates(filtered)
  return true
}

/**
 * Lista todos os templates importados
 */
export function listImportedTemplates(): StoredTemplate[] {
  return getStoredTemplates()
}

/**
 * Verifica se um template existe
 */
export function templateExists(id: string): boolean {
  const stored = getStoredTemplates()
  return stored.some(t => t.id === id)
}

/**
 * Atualiza um template existente
 */
export function updateImportedTemplate(id: string, template: Template): boolean {
  const stored = getStoredTemplates()
  const index = stored.findIndex(t => t.id === id)
  
  if (index === -1) return false
  
  stored[index] = {
    ...stored[index],
    template,
    updatedAt: new Date().toISOString(),
  }
  
  setStoredTemplates(stored)
  return true
}
