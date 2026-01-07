/**
 * Importador de fontes do Figma
 * 
 * Responsável por:
 * - Extrair informações de fontes dos designs do Figma
 * - Fazer download de fontes (quando disponível via plugin)
 * - Mapear fontes do Figma para fontes da marca
 */

import type {
  BrandFont,
  FontImportOptions,
  FontImportResult,
  FigmaFontInfo,
  FontMapping,
  BrandTypography,
  FontFormat,
} from '@/types/fonts'
import {
  createFont,
  getFontByFamily,
  getFontByFigmaName,
  uploadFontFile,
  extractFontWeight,
  extractFontStyle,
  detectFontFormat,
} from './font-service'

/**
 * Extrai informações de fonte de um nó de texto do Figma
 */
export function extractFigmaFontInfo(textNode: {
  fontName?: { family: string; style: string }
  fontWeight?: number
}): FigmaFontInfo | null {
  if (!textNode.fontName) return null
  
  const { family, style } = textNode.fontName
  const weight = textNode.fontWeight || extractFontWeight(style)
  
  // Gera nome PostScript aproximado
  const postscriptName = `${family.replace(/\s+/g, '')}-${style.replace(/\s+/g, '')}`
  
  return {
    family,
    style,
    postscriptName,
    weight,
  }
}

/**
 * Coleta todas as fontes únicas de um design do Figma
 */
export function collectFigmaFonts(nodes: unknown[]): FigmaFontInfo[] {
  const fontsMap = new Map<string, FigmaFontInfo>()
  
  function traverse(node: unknown) {
    if (!node || typeof node !== 'object') return
    
    const n = node as Record<string, unknown>
    
    // Verifica se é um nó de texto
    if (n.type === 'TEXT' && n.fontName) {
      const fontInfo = extractFigmaFontInfo(n as { fontName: { family: string; style: string }; fontWeight?: number })
      if (fontInfo) {
        const key = `${fontInfo.family}-${fontInfo.weight}-${fontInfo.style}`
        if (!fontsMap.has(key)) {
          fontsMap.set(key, fontInfo)
        }
      }
    }
    
    // Recursivamente processa filhos
    if (Array.isArray(n.children)) {
      for (const child of n.children) {
        traverse(child)
      }
    }
  }
  
  for (const node of nodes) {
    traverse(node)
  }
  
  return Array.from(fontsMap.values())
}

/**
 * Verifica se uma fonte já existe na marca
 */
export async function fontExistsInBrand(
  brandId: string,
  fontInfo: FigmaFontInfo
): Promise<BrandFont | null> {
  // Primeiro tenta pelo nome PostScript
  let font = await getFontByFigmaName(brandId, fontInfo.postscriptName)
  if (font) return font
  
  // Depois tenta por família/peso/estilo
  font = await getFontByFamily(
    brandId,
    fontInfo.family,
    fontInfo.weight,
    extractFontStyle(fontInfo.style)
  )
  
  return font
}

/**
 * Importa uma fonte do Figma para a marca
 */
export async function importFigmaFont(
  brandId: string,
  fontInfo: FigmaFontInfo,
  fontData: ArrayBuffer | null,
  fileName: string | null,
  options: FontImportOptions,
  userId: string
): Promise<FontImportResult> {
  try {
    // Se não usar fonte original, retorna mapeamento para fonte padrão
    if (!options.useOriginal) {
      return {
        success: true,
        wasSubstituted: true,
        originalFamily: fontInfo.family,
      }
    }
    
    // Verifica se a fonte já existe
    const existingFont = await fontExistsInBrand(brandId, fontInfo)
    if (existingFont) {
      return {
        success: true,
        font: existingFont,
        wasSubstituted: false,
      }
    }
    
    // Se não temos os dados da fonte, não podemos importar
    if (!fontData || !fileName) {
      return {
        success: false,
        error: `Fonte "${fontInfo.family}" não disponível para download. Use a fonte padrão da marca ou faça upload manual.`,
        wasSubstituted: false,
        originalFamily: fontInfo.family,
      }
    }
    
    // Detecta formato
    const format = detectFontFormat('', fileName)
    if (!format) {
      return {
        success: false,
        error: `Formato de fonte não suportado: ${fileName}`,
        wasSubstituted: false,
        originalFamily: fontInfo.family,
      }
    }
    
    // Faz upload do arquivo
    const buffer = Buffer.from(fontData)
    const { filePath } = await uploadFontFile(
      brandId,
      buffer,
      fileName,
      getMimeType(format)
    )
    
    // Cria registro no banco
    const font = await createFont({
      brandId,
      family: fontInfo.family,
      style: extractFontStyle(fontInfo.style),
      weight: fontInfo.weight,
      filePath,
      fileName,
      fileSize: buffer.length,
      format,
      source: 'figma',
      figmaPostscriptName: fontInfo.postscriptName,
      category: options.category,
      uploadedBy: userId,
    })
    
    return {
      success: true,
      font,
      wasSubstituted: false,
    }
  } catch (error) {
    console.error('[FigmaFontImporter] Error importing font:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
      wasSubstituted: false,
      originalFamily: fontInfo.family,
    }
  }
}

/**
 * Processa múltiplas fontes de um design do Figma
 */
export async function processFigmaFonts(
  brandId: string,
  fontInfos: FigmaFontInfo[],
  fontFiles: Map<string, { data: ArrayBuffer; fileName: string }>,
  options: FontImportOptions,
  userId: string
): Promise<{
  imported: FontImportResult[]
  mappings: FontMapping[]
}> {
  const results: FontImportResult[] = []
  const mappings: FontMapping[] = []
  
  for (const fontInfo of fontInfos) {
    const fileKey = `${fontInfo.family}-${fontInfo.style}`
    const fileData = fontFiles.get(fileKey)
    
    const result = await importFigmaFont(
      brandId,
      fontInfo,
      fileData?.data || null,
      fileData?.fileName || null,
      options,
      userId
    )
    
    results.push(result)
    
    // Se foi substituída, adiciona ao mapeamento
    if (result.wasSubstituted && options.defaultFontFamily) {
      mappings.push({
        originalFamily: fontInfo.family,
        replacementFamily: options.defaultFontFamily,
        preserveWeight: true,
      })
    }
  }
  
  return { imported: results, mappings }
}

/**
 * Aplica mapeamento de fontes a um template
 */
export function applyFontMappings<T extends Record<string, unknown>>(
  template: T,
  mappings: FontMapping[]
): T {
  if (mappings.length === 0) return template
  
  const mappingMap = new Map(
    mappings.map(m => [m.originalFamily.toLowerCase(), m])
  )
  
  function processValue(value: unknown): unknown {
    if (typeof value === 'string') {
      // Verifica se é um nome de fonte
      const mapping = mappingMap.get(value.toLowerCase())
      if (mapping) {
        return mapping.replacementFamily
      }
      return value
    }
    
    if (Array.isArray(value)) {
      return value.map(processValue)
    }
    
    if (value && typeof value === 'object') {
      const obj = value as Record<string, unknown>
      const result: Record<string, unknown> = {}
      
      for (const [key, val] of Object.entries(obj)) {
        // Processa fontFamily especificamente
        if (key === 'fontFamily' && typeof val === 'string') {
          const mapping = mappingMap.get(val.toLowerCase())
          result[key] = mapping ? mapping.replacementFamily : val
        } else {
          result[key] = processValue(val)
        }
      }
      
      return result
    }
    
    return value
  }
  
  return processValue(template) as T
}

/**
 * Obtém a tipografia padrão da marca
 */
export async function getBrandDefaultTypography(
  brandId: string
): Promise<BrandTypography | null> {
  // TODO: Implementar busca da tipografia padrão da marca no banco
  // Por enquanto retorna null para usar fallback
  return null
}

/**
 * Retorna o mime type para um formato de fonte
 */
function getMimeType(format: FontFormat): string {
  const mimeTypes: Record<FontFormat, string> = {
    ttf: 'font/ttf',
    otf: 'font/otf',
    woff: 'font/woff',
    woff2: 'font/woff2',
  }
  return mimeTypes[format]
}

/**
 * Valida se um arquivo é uma fonte válida
 */
export function isValidFontFile(
  fileName: string,
  mimeType: string
): boolean {
  const validExtensions = ['ttf', 'otf', 'woff', 'woff2']
  const ext = fileName.split('.').pop()?.toLowerCase()
  
  if (ext && validExtensions.includes(ext)) {
    return true
  }
  
  const validMimeTypes = [
    'font/ttf',
    'font/otf',
    'font/woff',
    'font/woff2',
    'application/x-font-ttf',
    'application/x-font-otf',
    'application/font-woff',
    'application/font-woff2',
  ]
  
  return validMimeTypes.includes(mimeType)
}
