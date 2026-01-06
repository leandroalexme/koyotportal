/**
 * Koyot Studio - Mock Data
 * 
 * DEPRECATED: Este arquivo será removido em favor do template-service.ts
 * 
 * Use as funções do template-loader.ts:
 * - getTemplateById(id)
 * - getTemplatesForBrand(brandId)
 * - getTemplateFolderTree(brandId)
 * - searchTemplates(query, brandId)
 */

import type { Template } from '@/types/studio'
import { 
  getTemplateById as getTemplateFromRegistry,
  getTemplatesForBrand,
  initializeTemplates,
  templateRegistry,
} from './template-loader'

// Initialize templates on import
initializeTemplates()

// ============================================
// LEGACY API (for backward compatibility)
// ============================================

/**
 * @deprecated Use getTemplateById from template-loader.ts
 */
export function getMockTemplateById(id: string): Template | undefined {
  return getTemplateFromRegistry(id)
}

/**
 * @deprecated Use getTemplatesForBrand from template-loader.ts
 */
export function getMockTemplatesByBrand(brandId: string): Template[] {
  const metadata = getTemplatesForBrand(brandId)
  return metadata
    .map(m => templateRegistry.getTemplate(m.id))
    .filter((t): t is Template => t !== undefined)
}

/**
 * @deprecated Use template-loader.ts functions
 */
export function getMockTemplatesByCategory(category: string): Template[] {
  const allTemplates = templateRegistry.getAllTemplates()
  return allTemplates
    .filter(m => m.category === category)
    .map(m => templateRegistry.getTemplate(m.id))
    .filter((t): t is Template => t !== undefined)
}

/**
 * @deprecated Use template-loader.ts functions
 * Get all templates as array (for legacy compatibility)
 */
export const MOCK_TEMPLATES: Template[] = (() => {
  initializeTemplates()
  return templateRegistry.getAllTemplates()
    .map(m => templateRegistry.getTemplate(m.id))
    .filter((t): t is Template => t !== undefined)
})()
