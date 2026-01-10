/**
 * Template Database Service
 * 
 * Usa IndexedDB para persistência robusta de templates.
 * IndexedDB é mais confiável que localStorage para dados grandes
 * e persiste entre sessões do navegador.
 */

import type { Template } from '@/types/studio'

const DB_NAME = 'koyot_templates_db'
const DB_VERSION = 1
const STORE_NAME = 'templates'

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
// DATABASE INITIALIZATION
// ============================================

let dbInstance: IDBDatabase | null = null

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (dbInstance) {
      resolve(dbInstance)
      return
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onerror = () => {
      console.error('[TemplateDB] Failed to open database:', request.error)
      reject(request.error)
    }

    request.onsuccess = () => {
      dbInstance = request.result
      // Database opened
      resolve(dbInstance)
    }

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result

      // Create templates store
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' })
        store.createIndex('brandId', 'brandId', { unique: false })
        store.createIndex('updatedAt', 'updatedAt', { unique: false })
        // Store created
      }
    }
  })
}

// ============================================
// CRUD OPERATIONS
// ============================================

/**
 * Salva um template no banco de dados
 */
export async function saveTemplate(
  id: string,
  brandId: string,
  template: Template,
  source: StoredTemplate['source'] = 'figma',
  sourceUrl?: string
): Promise<boolean> {
  try {
    const db = await openDB()
    
    const now = new Date().toISOString()
    const entry: StoredTemplate = {
      id,
      brandId,
      template: {
        ...template,
        id,
        updatedAt: now,
      },
      createdAt: now,
      updatedAt: now,
      source,
      sourceUrl,
    }

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite')
      const store = transaction.objectStore(STORE_NAME)
      
      const request = store.put(entry)
      
      request.onsuccess = () => {
        // Template saved
        resolve(true)
      }
      
      request.onerror = () => {
        console.error('[TemplateDB] Failed to save template:', request.error)
        reject(request.error)
      }
    })
  } catch (error) {
    console.error('[TemplateDB] Error saving template:', error)
    return false
  }
}

/**
 * Busca um template pelo ID
 */
export async function getTemplate(id: string): Promise<Template | null> {
  try {
    const db = await openDB()
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readonly')
      const store = transaction.objectStore(STORE_NAME)
      
      const request = store.get(id)
      
      request.onsuccess = () => {
        const entry = request.result as StoredTemplate | undefined
        if (entry) {
          // Template found
          resolve(entry.template)
        } else {
          // Template not found
          resolve(null)
        }
      }
      
      request.onerror = () => {
        console.error('[TemplateDB] Failed to get template:', request.error)
        reject(request.error)
      }
    })
  } catch (error) {
    console.error('[TemplateDB] Error getting template:', error)
    return null
  }
}

/**
 * Busca todos os templates de uma brand
 */
export async function getTemplatesByBrand(brandId: string): Promise<Template[]> {
  try {
    const db = await openDB()
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readonly')
      const store = transaction.objectStore(STORE_NAME)
      const index = store.index('brandId')
      
      const request = index.getAll(brandId)
      
      request.onsuccess = () => {
        const entries = request.result as StoredTemplate[]
        const templates = entries.map(e => e.template)
        // Templates found for brand
        resolve(templates)
      }
      
      request.onerror = () => {
        console.error('[TemplateDB] Failed to get templates by brand:', request.error)
        reject(request.error)
      }
    })
  } catch (error) {
    console.error('[TemplateDB] Error getting templates by brand:', error)
    return []
  }
}

/**
 * Lista todos os templates
 */
export async function getAllTemplates(): Promise<StoredTemplate[]> {
  try {
    const db = await openDB()
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readonly')
      const store = transaction.objectStore(STORE_NAME)
      
      const request = store.getAll()
      
      request.onsuccess = () => {
        const entries = request.result as StoredTemplate[]
        // All templates retrieved
        resolve(entries)
      }
      
      request.onerror = () => {
        console.error('[TemplateDB] Failed to get all templates:', request.error)
        reject(request.error)
      }
    })
  } catch (error) {
    console.error('[TemplateDB] Error getting all templates:', error)
    return []
  }
}

/**
 * Deleta um template
 */
export async function deleteTemplate(id: string): Promise<boolean> {
  try {
    const db = await openDB()
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite')
      const store = transaction.objectStore(STORE_NAME)
      
      const request = store.delete(id)
      
      request.onsuccess = () => {
        // Template deleted
        resolve(true)
      }
      
      request.onerror = () => {
        console.error('[TemplateDB] Failed to delete template:', request.error)
        reject(request.error)
      }
    })
  } catch (error) {
    console.error('[TemplateDB] Error deleting template:', error)
    return false
  }
}

/**
 * Atualiza um template existente
 */
export async function updateTemplate(id: string, template: Template): Promise<boolean> {
  try {
    const db = await openDB()
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite')
      const store = transaction.objectStore(STORE_NAME)
      
      // First get the existing entry
      const getRequest = store.get(id)
      
      getRequest.onsuccess = () => {
        const existing = getRequest.result as StoredTemplate | undefined
        
        if (!existing) {
          console.warn('[TemplateDB] Template not found for update:', id)
          resolve(false)
          return
        }
        
        const now = new Date().toISOString()
        const updated: StoredTemplate = {
          ...existing,
          template: {
            ...template,
            id,
            updatedAt: now,
          },
          updatedAt: now,
        }
        
        const putRequest = store.put(updated)
        
        putRequest.onsuccess = () => {
          // Template updated
          resolve(true)
        }
        
        putRequest.onerror = () => {
          console.error('[TemplateDB] Failed to update template:', putRequest.error)
          reject(putRequest.error)
        }
      }
      
      getRequest.onerror = () => {
        console.error('[TemplateDB] Failed to get template for update:', getRequest.error)
        reject(getRequest.error)
      }
    })
  } catch (error) {
    console.error('[TemplateDB] Error updating template:', error)
    return false
  }
}

/**
 * Verifica se um template existe
 */
export async function templateExists(id: string): Promise<boolean> {
  const template = await getTemplate(id)
  return template !== null
}

// ============================================
// MIGRATION FROM LOCALSTORAGE
// ============================================

/**
 * Migra templates do localStorage para IndexedDB
 */
export async function migrateFromLocalStorage(): Promise<number> {
  const STORAGE_KEY = 'koyot_imported_templates'
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return 0
    
    const templates = JSON.parse(stored) as StoredTemplate[]
    let migrated = 0
    
    for (const entry of templates) {
      const exists = await templateExists(entry.id)
      if (!exists) {
        await saveTemplate(
          entry.id,
          entry.brandId,
          entry.template,
          entry.source,
          entry.sourceUrl
        )
        migrated++
      }
    }
    
    if (migrated > 0) {
      // Migration complete
      // Clear localStorage after successful migration
      localStorage.removeItem(STORAGE_KEY)
    }
    
    return migrated
  } catch (error) {
    console.error('[TemplateDB] Migration failed:', error)
    return 0
  }
}

// ============================================
// INITIALIZATION
// ============================================

/**
 * Inicializa o banco de dados e migra dados antigos
 */
export async function initTemplateDB(): Promise<void> {
  try {
    await openDB()
    await migrateFromLocalStorage()
    // DB initialized
  } catch (error) {
    console.error('[TemplateDB] Initialization failed:', error)
  }
}
