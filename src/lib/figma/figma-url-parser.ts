/**
 * Figma URL Parser Service
 * 
 * Identifica automaticamente o tipo de link do Figma e extrai informações relevantes.
 * Suporta URLs de projeto, página e frame específico.
 */

// ============================================
// TYPES
// ============================================

export type FigmaUrlType = 
  | 'project'      // URL de arquivo sem node-id (ex: figma.com/file/ID/Name)
  | 'page'         // URL com node-id de uma página (ex: node-id=0:1)
  | 'frame'        // URL com node-id de um frame específico
  | 'component'    // URL com node-id de um componente
  | 'invalid'

export interface ParsedFigmaUrlAdvanced {
  type: FigmaUrlType
  fileKey: string
  fileName?: string
  nodeId?: string
  nodeType?: 'PAGE' | 'FRAME' | 'COMPONENT' | 'COMPONENT_SET' | 'INSTANCE' | 'UNKNOWN'
  
  // Metadados adicionais
  isPrototype?: boolean
  branchKey?: string
  versionId?: string
}

export interface FigmaFileStructure {
  name: string
  lastModified: string
  version: string
  pages: FigmaPageInfo[]
}

export interface FigmaPageInfo {
  id: string
  name: string
  frames: FigmaFrameInfo[]
}

export interface FigmaFrameInfo {
  id: string
  name: string
  type: string
  width: number
  height: number
  thumbnailUrl?: string
  childCount: number
  isComponent?: boolean
  componentSetId?: string
}

// ============================================
// URL PARSER
// ============================================

/**
 * Parse avançado de URL do Figma com detecção de tipo
 */
export function parseFigmaUrlAdvanced(url: string): ParsedFigmaUrlAdvanced {
  try {
    const urlObj = new URL(url)
    
    // Verificar se é URL do Figma
    if (!urlObj.hostname.includes('figma.com')) {
      return { type: 'invalid', fileKey: '' }
    }
    
    const pathParts = urlObj.pathname.split('/')
    
    // Detectar tipo de URL (file, design, proto, branch)
    const isPrototype = pathParts.includes('proto')
    const fileIndex = pathParts.findIndex(p => 
      p === 'file' || p === 'design' || p === 'proto'
    )
    
    if (fileIndex === -1 || !pathParts[fileIndex + 1]) {
      return { type: 'invalid', fileKey: '' }
    }
    
    const fileKey = pathParts[fileIndex + 1]
    const fileName = pathParts[fileIndex + 2] 
      ? decodeURIComponent(pathParts[fileIndex + 2].replace(/-/g, ' '))
      : undefined
    
    // Extrair node-id
    const nodeIdParam = urlObj.searchParams.get('node-id')
    let nodeId = nodeIdParam ? decodeURIComponent(nodeIdParam) : undefined
    
    // Converter formato URL (2293-222) para formato API (2293:222)
    if (nodeId && nodeId.includes('-') && !nodeId.includes(':')) {
      nodeId = nodeId.replace(/-/g, ':')
    }
    
    // Extrair branch e version
    const branchKey = urlObj.searchParams.get('branch-id') || undefined
    const versionId = urlObj.searchParams.get('version-id') || undefined
    
    // Determinar tipo baseado no node-id
    let type: FigmaUrlType = 'project'
    let nodeType: ParsedFigmaUrlAdvanced['nodeType'] = undefined
    
    if (nodeId) {
      // Node IDs de páginas geralmente começam com "0:" ou são simples como "1:2"
      // Frames têm IDs mais complexos como "2293:222"
      const parts = nodeId.split(':')
      if (parts.length === 2) {
        const firstPart = parseInt(parts[0], 10)
        if (firstPart === 0) {
          type = 'page'
          nodeType = 'PAGE'
        } else {
          // Não podemos saber se é frame ou componente só pela URL
          // Isso será determinado pela API
          type = 'frame'
          nodeType = 'UNKNOWN'
        }
      }
    }
    
    return {
      type,
      fileKey,
      fileName,
      nodeId,
      nodeType,
      isPrototype,
      branchKey,
      versionId,
    }
  } catch {
    return { type: 'invalid', fileKey: '' }
  }
}

/**
 * Valida se uma URL é válida para importação
 */
export function isValidFigmaUrl(url: string): boolean {
  const parsed = parseFigmaUrlAdvanced(url)
  return parsed.type !== 'invalid' && parsed.fileKey.length > 0
}

/**
 * Converte node-id do formato API (2293:222) para formato URL (2293-222)
 */
export function nodeIdToUrlFormat(nodeId: string): string {
  return nodeId.replace(/:/g, '-')
}

/**
 * Converte node-id do formato URL (2293-222) para formato API (2293:222)
 */
export function nodeIdToApiFormat(nodeId: string): string {
  if (nodeId.includes(':')) return nodeId
  return nodeId.replace(/-/g, ':')
}

/**
 * Gera URL do Figma a partir de fileKey e nodeId
 */
export function generateFigmaUrl(fileKey: string, nodeId?: string, fileName?: string): string {
  let url = `https://www.figma.com/design/${fileKey}`
  
  if (fileName) {
    url += `/${encodeURIComponent(fileName.replace(/\s+/g, '-'))}`
  }
  
  if (nodeId) {
    url += `?node-id=${nodeIdToUrlFormat(nodeId)}`
  }
  
  return url
}

// ============================================
// EXPORTS
// ============================================

export { parseFigmaUrl } from '@/types/figma'
