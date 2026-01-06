/**
 * Template Loader
 * 
 * Carrega templates de arquivos separados e registra no TemplateRegistry.
 * Cada template é um arquivo individual em src/data/templates/
 * 
 * Em produção, isso será substituído por chamadas ao Supabase.
 */

import { templateRegistry, categoryToFolderId } from './template-service'

// Import templates from individual files
import { eqiBusinessCardTemplate } from '@/data/templates/eqi/business-card'
import { eqiLetterheadTemplate } from '@/data/templates/eqi/letterhead'
import { eqiEmailSignatureTemplate } from '@/data/templates/eqi/email-signature'

// ============================================
// TEMPLATE LOADER
// ============================================

let initialized = false

/**
 * Initialize the template registry with all available templates
 */
export function initializeTemplates(): void {
  if (initialized) return
  
  // Register EQI templates
  templateRegistry.register(eqiBusinessCardTemplate, categoryToFolderId(eqiBusinessCardTemplate.category))
  templateRegistry.register(eqiLetterheadTemplate, categoryToFolderId(eqiLetterheadTemplate.category))
  templateRegistry.register(eqiEmailSignatureTemplate, categoryToFolderId(eqiEmailSignatureTemplate.category))
  
  initialized = true
}

// ============================================
// PUBLIC API
// ============================================

export { templateRegistry } from './template-service'

/**
 * Get template by ID (full template for editor)
 */
export function getTemplateById(id: string) {
  initializeTemplates()
  return templateRegistry.getTemplate(id)
}

/**
 * Get all templates for a brand
 */
export function getTemplatesForBrand(brandId: string) {
  initializeTemplates()
  return templateRegistry.getTemplatesByBrand(brandId)
}

/**
 * Get folder tree with templates
 */
export function getTemplateFolderTree(brandId?: string) {
  initializeTemplates()
  return templateRegistry.getFolderTree(brandId)
}

/**
 * Search templates
 */
export function searchTemplates(query: string, brandId?: string) {
  initializeTemplates()
  return templateRegistry.searchTemplates(query, brandId)
}
