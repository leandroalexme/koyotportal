/**
 * Template Service
 * 
 * Serviço centralizado para gerenciamento de templates.
 * Implementa o padrão Single Source of Truth para templates.
 * 
 * Arquitetura:
 * - Templates são dados estruturados, não código
 * - Cada template é um registro único com ID próprio
 * - Categorias organizam templates hierarquicamente
 * - Brands têm acesso granular a templates específicos
 */

import type { Template, TemplateCategory, TemplateFormat } from '@/types/studio'

// ============================================
// CATEGORY HIERARCHY
// ============================================

export interface TemplateFolder {
  id: string
  name: string
  slug: string
  icon?: string
  parentId: string | null
  order: number
}

export interface TemplateCategoryNode {
  folder: TemplateFolder
  children: TemplateCategoryNode[]
  templates: TemplateMetadata[]
}

// ============================================
// TEMPLATE METADATA (lightweight for listing)
// ============================================

export interface TemplateMetadata {
  id: string
  name: string
  description?: string
  category: TemplateCategory
  format: TemplateFormat
  brandId: string
  folderId: string
  thumbnailUrl?: string
  tags: string[]
  isPublic: boolean
  aiGenerated: boolean
  createdAt: string
  updatedAt: string
  createdBy: string
  version: number
}

// ============================================
// BRAND-TEMPLATE RELATIONSHIP
// ============================================

export interface BrandTemplateAccess {
  brandId: string
  templateId: string
  accessLevel: 'view' | 'edit' | 'admin'
  grantedAt: string
  grantedBy: string
}

// ============================================
// FOLDER STRUCTURE (Mock Data)
// ============================================

export const TEMPLATE_FOLDERS: TemplateFolder[] = [
  // Root folders
  { id: 'print', name: 'Print', slug: 'print', parentId: null, order: 1 },
  { id: 'digital', name: 'Digital', slug: 'digital', parentId: null, order: 2 },
  { id: 'social-media', name: 'Social Media & Ads', slug: 'social-media', parentId: null, order: 3 },
  
  // Print subfolders
  { id: 'print-business-cards', name: 'Business Cards', slug: 'business-cards', parentId: 'print', order: 1 },
  { id: 'print-letterhead', name: 'Letterhead', slug: 'letterhead', parentId: 'print', order: 2 },
  { id: 'print-flyers', name: 'Flyers', slug: 'flyers', parentId: 'print', order: 3 },
  { id: 'print-one-pager', name: 'One-pager', slug: 'one-pager', parentId: 'print', order: 4 },
  { id: 'print-posters', name: 'Posters', slug: 'posters', parentId: 'print', order: 5 },
  
  // Digital subfolders
  { id: 'digital-web-banner', name: 'Web Banner', slug: 'web-banner', parentId: 'digital', order: 1 },
  { id: 'digital-email', name: 'Email Signatures', slug: 'email-signatures', parentId: 'digital', order: 2 },
  { id: 'digital-newsletter', name: 'Newsletter Header', slug: 'newsletter', parentId: 'digital', order: 3 },
  
  // Social Media subfolders
  { id: 'social-instagram', name: 'Instagram', slug: 'instagram', parentId: 'social-media', order: 1 },
  { id: 'social-linkedin', name: 'LinkedIn', slug: 'linkedin', parentId: 'social-media', order: 2 },
  { id: 'social-twitter', name: 'Twitter', slug: 'twitter', parentId: 'social-media', order: 3 },
  { id: 'social-facebook', name: 'Facebook', slug: 'facebook', parentId: 'social-media', order: 4 },
]

// ============================================
// TEMPLATE REGISTRY (In-memory store)
// ============================================

class TemplateRegistry {
  private templates: Map<string, Template> = new Map()
  private metadata: Map<string, TemplateMetadata> = new Map()
  private brandAccess: Map<string, Set<string>> = new Map() // brandId -> Set<templateId>
  
  /**
   * Register a template in the registry
   */
  register(template: Template, folderId: string): void {
    this.templates.set(template.id, template)
    
    const meta: TemplateMetadata = {
      id: template.id,
      name: template.name,
      description: template.description,
      category: template.category,
      format: template.format,
      brandId: template.brandId,
      folderId,
      thumbnailUrl: template.thumbnailUrl,
      tags: template.tags,
      isPublic: template.isPublic,
      aiGenerated: template.aiGenerated,
      createdAt: template.createdAt,
      updatedAt: template.updatedAt,
      createdBy: template.createdBy,
      version: template.schemaVersion,
    }
    this.metadata.set(template.id, meta)
    
    // Grant access to the brand
    this.grantAccess(template.brandId, template.id)
  }
  
  /**
   * Grant a brand access to a template
   */
  grantAccess(brandId: string, templateId: string): void {
    if (!this.brandAccess.has(brandId)) {
      this.brandAccess.set(brandId, new Set())
    }
    this.brandAccess.get(brandId)!.add(templateId)
  }
  
  /**
   * Get full template by ID (for editor)
   */
  getTemplate(templateId: string): Template | undefined {
    return this.templates.get(templateId)
  }
  
  /**
   * Get template metadata by ID (lightweight)
   */
  getMetadata(templateId: string): TemplateMetadata | undefined {
    return this.metadata.get(templateId)
  }
  
  /**
   * Get all templates accessible by a brand
   */
  getTemplatesByBrand(brandId: string): TemplateMetadata[] {
    const accessibleIds = this.brandAccess.get(brandId) || new Set()
    const result: TemplateMetadata[] = []
    
    for (const id of accessibleIds) {
      const meta = this.metadata.get(id)
      if (meta) result.push(meta)
    }
    
    // Also include public templates
    for (const [id, meta] of this.metadata) {
      if (meta.isPublic && !accessibleIds.has(id)) {
        result.push(meta)
      }
    }
    
    return result
  }
  
  /**
   * Get templates by folder
   */
  getTemplatesByFolder(folderId: string, brandId?: string): TemplateMetadata[] {
    const result: TemplateMetadata[] = []
    const accessibleIds = brandId ? (this.brandAccess.get(brandId) || new Set()) : null
    
    for (const [, meta] of this.metadata) {
      if (meta.folderId !== folderId) continue
      
      // Check access
      if (accessibleIds) {
        if (!accessibleIds.has(meta.id) && !meta.isPublic) continue
      }
      
      result.push(meta)
    }
    
    return result
  }
  
  /**
   * Get all templates (for admin)
   */
  getAllTemplates(): TemplateMetadata[] {
    return Array.from(this.metadata.values())
  }
  
  /**
   * Get folder hierarchy with templates
   */
  getFolderTree(brandId?: string): TemplateCategoryNode[] {
    const rootFolders = TEMPLATE_FOLDERS.filter(f => f.parentId === null)
      .sort((a, b) => a.order - b.order)
    
    const buildNode = (folder: TemplateFolder): TemplateCategoryNode => {
      const children = TEMPLATE_FOLDERS
        .filter(f => f.parentId === folder.id)
        .sort((a, b) => a.order - b.order)
        .map(buildNode)
      
      const templates = this.getTemplatesByFolder(folder.id, brandId)
      
      return { folder, children, templates }
    }
    
    return rootFolders.map(buildNode)
  }
  
  /**
   * Search templates
   */
  searchTemplates(query: string, brandId?: string): TemplateMetadata[] {
    const lowerQuery = query.toLowerCase()
    const accessibleIds = brandId ? (this.brandAccess.get(brandId) || new Set()) : null
    const result: TemplateMetadata[] = []
    
    for (const [, meta] of this.metadata) {
      // Check access
      if (accessibleIds && !accessibleIds.has(meta.id) && !meta.isPublic) continue
      
      // Search in name, description, and tags
      const matchesName = meta.name.toLowerCase().includes(lowerQuery)
      const matchesDesc = meta.description?.toLowerCase().includes(lowerQuery)
      const matchesTags = meta.tags.some(t => t.toLowerCase().includes(lowerQuery))
      
      if (matchesName || matchesDesc || matchesTags) {
        result.push(meta)
      }
    }
    
    return result
  }
}

// ============================================
// SINGLETON INSTANCE
// ============================================

export const templateRegistry = new TemplateRegistry()

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Map TemplateCategory to folder ID
 */
export function categoryToFolderId(category: TemplateCategory): string {
  const mapping: Partial<Record<TemplateCategory, string>> = {
    'social_instagram': 'social-instagram',
    'social_linkedin': 'social-linkedin',
    'social_twitter': 'social-twitter',
    'social_facebook': 'social-facebook',
    'print_business_card': 'print-business-cards',
    'print_flyer': 'print-flyers',
    'print_one_pager': 'print-letterhead', // Papel timbrado vai para letterhead
    'print_poster': 'print-posters',
    'digital_web_banner': 'digital-web-banner',
    'digital_email_header': 'digital-email',
    'digital_newsletter': 'digital-newsletter',
  }
  return mapping[category] || 'print'
}

/**
 * Get folder by ID
 */
export function getFolderById(folderId: string): TemplateFolder | undefined {
  return TEMPLATE_FOLDERS.find(f => f.id === folderId)
}

/**
 * Get parent folders (breadcrumb)
 */
export function getFolderBreadcrumb(folderId: string): TemplateFolder[] {
  const result: TemplateFolder[] = []
  let current = getFolderById(folderId)
  
  while (current) {
    result.unshift(current)
    current = current.parentId ? getFolderById(current.parentId) : undefined
  }
  
  return result
}
