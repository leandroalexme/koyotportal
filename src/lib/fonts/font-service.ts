/**
 * Serviço de gerenciamento de fontes customizadas
 */

import { createClient } from '@/lib/supabase/server'
import type {
  BrandFont,
  BrandFontInsert,
  BrandFontUpdate,
  FontFormat,
  FontStyle,
  FontFaceCSS,
  FONT_MIME_TYPES,
  MAX_FONT_FILE_SIZE,
} from '@/types/fonts'

/**
 * Converte row do banco para o tipo BrandFont
 */
function rowToBrandFont(row: Record<string, unknown>): BrandFont {
  return {
    id: row.id as string,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
    brandId: row.brand_id as string,
    family: row.family as string,
    style: row.style as FontStyle,
    weight: row.weight as number,
    filePath: row.file_path as string,
    fileName: row.file_name as string,
    fileSize: row.file_size as number,
    format: row.format as FontFormat,
    source: row.source as BrandFont['source'],
    sourceUrl: row.source_url as string | undefined,
    figmaPostscriptName: row.figma_postscript_name as string | undefined,
    isDefault: row.is_default as boolean,
    category: row.category as BrandFont['category'],
    isActive: row.is_active as boolean,
    uploadedBy: row.uploaded_by as string | undefined,
  }
}

/**
 * Lista todas as fontes de uma marca
 */
export async function listBrandFonts(brandId: string): Promise<BrandFont[]> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('brand_fonts')
    .select('*')
    .eq('brand_id', brandId)
    .eq('is_active', true)
    .order('family')
    .order('weight')
  
  if (error) {
    console.error('[FontService] Error listing fonts:', error)
    throw new Error(`Erro ao listar fontes: ${error.message}`)
  }
  
  return (data || []).map(rowToBrandFont)
}

/**
 * Busca uma fonte por ID
 */
export async function getFontById(fontId: string): Promise<BrandFont | null> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('brand_fonts')
    .select('*')
    .eq('id', fontId)
    .single()
  
  if (error) {
    if (error.code === 'PGRST116') return null
    console.error('[FontService] Error getting font:', error)
    throw new Error(`Erro ao buscar fonte: ${error.message}`)
  }
  
  return data ? rowToBrandFont(data) : null
}

/**
 * Busca fonte por família e peso
 */
export async function getFontByFamily(
  brandId: string,
  family: string,
  weight: number = 400,
  style: FontStyle = 'normal'
): Promise<BrandFont | null> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('brand_fonts')
    .select('*')
    .eq('brand_id', brandId)
    .eq('family', family)
    .eq('weight', weight)
    .eq('style', style)
    .eq('is_active', true)
    .single()
  
  if (error) {
    if (error.code === 'PGRST116') return null
    console.error('[FontService] Error getting font by family:', error)
    throw new Error(`Erro ao buscar fonte: ${error.message}`)
  }
  
  return data ? rowToBrandFont(data) : null
}

/**
 * Busca fonte pelo nome PostScript do Figma
 */
export async function getFontByFigmaName(
  brandId: string,
  postscriptName: string
): Promise<BrandFont | null> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('brand_fonts')
    .select('*')
    .eq('brand_id', brandId)
    .eq('figma_postscript_name', postscriptName)
    .eq('is_active', true)
    .single()
  
  if (error) {
    if (error.code === 'PGRST116') return null
    console.error('[FontService] Error getting font by Figma name:', error)
    throw new Error(`Erro ao buscar fonte: ${error.message}`)
  }
  
  return data ? rowToBrandFont(data) : null
}

/**
 * Cria uma nova fonte
 */
export async function createFont(font: BrandFontInsert): Promise<BrandFont> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('brand_fonts')
    .insert({
      brand_id: font.brandId,
      family: font.family,
      style: font.style || 'normal',
      weight: font.weight || 400,
      file_path: font.filePath,
      file_name: font.fileName,
      file_size: font.fileSize,
      format: font.format,
      source: font.source || 'upload',
      source_url: font.sourceUrl,
      figma_postscript_name: font.figmaPostscriptName,
      is_default: font.isDefault || false,
      category: font.category,
      uploaded_by: font.uploadedBy,
    })
    .select()
    .single()
  
  if (error) {
    console.error('[FontService] Error creating font:', error)
    throw new Error(`Erro ao criar fonte: ${error.message}`)
  }
  
  return rowToBrandFont(data)
}

/**
 * Atualiza uma fonte
 */
export async function updateFont(
  fontId: string,
  updates: BrandFontUpdate
): Promise<BrandFont> {
  const supabase = await createClient()
  
  const updateData: Record<string, unknown> = {}
  if (updates.family !== undefined) updateData.family = updates.family
  if (updates.style !== undefined) updateData.style = updates.style
  if (updates.weight !== undefined) updateData.weight = updates.weight
  if (updates.isDefault !== undefined) updateData.is_default = updates.isDefault
  if (updates.category !== undefined) updateData.category = updates.category
  if (updates.isActive !== undefined) updateData.is_active = updates.isActive
  
  const { data, error } = await supabase
    .from('brand_fonts')
    .update(updateData)
    .eq('id', fontId)
    .select()
    .single()
  
  if (error) {
    console.error('[FontService] Error updating font:', error)
    throw new Error(`Erro ao atualizar fonte: ${error.message}`)
  }
  
  return rowToBrandFont(data)
}

/**
 * Deleta uma fonte (soft delete)
 */
export async function deleteFont(fontId: string): Promise<void> {
  const supabase = await createClient()
  
  const { error } = await supabase
    .from('brand_fonts')
    .update({ is_active: false })
    .eq('id', fontId)
  
  if (error) {
    console.error('[FontService] Error deleting font:', error)
    throw new Error(`Erro ao deletar fonte: ${error.message}`)
  }
}

/**
 * Deleta permanentemente uma fonte e seu arquivo
 */
export async function deleteFontPermanently(fontId: string): Promise<void> {
  const supabase = await createClient()
  
  // Busca a fonte para pegar o file_path
  const font = await getFontById(fontId)
  if (!font) {
    throw new Error('Fonte não encontrada')
  }
  
  // Deleta o arquivo do storage
  const { error: storageError } = await supabase.storage
    .from('brand-fonts')
    .remove([font.filePath])
  
  if (storageError) {
    console.error('[FontService] Error deleting font file:', storageError)
  }
  
  // Deleta o registro do banco
  const { error } = await supabase
    .from('brand_fonts')
    .delete()
    .eq('id', fontId)
  
  if (error) {
    console.error('[FontService] Error deleting font record:', error)
    throw new Error(`Erro ao deletar fonte: ${error.message}`)
  }
}

/**
 * Upload de arquivo de fonte
 */
export async function uploadFontFile(
  brandId: string,
  file: File | Buffer,
  fileName: string,
  mimeType: string
): Promise<{ filePath: string; publicUrl: string }> {
  const supabase = await createClient()
  
  // Gera um nome único para o arquivo
  const timestamp = Date.now()
  const sanitizedName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_')
  const filePath = `${brandId}/${timestamp}-${sanitizedName}`
  
  // Upload para o storage
  const { error } = await supabase.storage
    .from('brand-fonts')
    .upload(filePath, file, {
      contentType: mimeType,
      upsert: false,
    })
  
  if (error) {
    console.error('[FontService] Error uploading font:', error)
    throw new Error(`Erro ao fazer upload da fonte: ${error.message}`)
  }
  
  // Gera URL pública
  const { data: urlData } = supabase.storage
    .from('brand-fonts')
    .getPublicUrl(filePath)
  
  return {
    filePath,
    publicUrl: urlData.publicUrl,
  }
}

/**
 * Gera CSS @font-face para uma fonte
 */
export function generateFontFaceCSS(font: BrandFont, publicUrl: string): string {
  const formatMap: Record<FontFormat, string> = {
    ttf: 'truetype',
    otf: 'opentype',
    woff: 'woff',
    woff2: 'woff2',
  }
  
  return `@font-face {
  font-family: '${font.family}';
  font-style: ${font.style};
  font-weight: ${font.weight};
  font-display: swap;
  src: url('${publicUrl}') format('${formatMap[font.format]}');
}`
}

/**
 * Gera CSS para todas as fontes de uma marca
 */
export async function generateBrandFontsCSS(brandId: string): Promise<string> {
  const supabase = await createClient()
  const fonts = await listBrandFonts(brandId)
  
  const cssBlocks: string[] = []
  
  for (const font of fonts) {
    const { data: urlData } = supabase.storage
      .from('brand-fonts')
      .getPublicUrl(font.filePath)
    
    cssBlocks.push(generateFontFaceCSS(font, urlData.publicUrl))
  }
  
  return cssBlocks.join('\n\n')
}

/**
 * Detecta o formato da fonte pelo mime type ou extensão
 */
export function detectFontFormat(
  mimeType: string,
  fileName: string
): FontFormat | null {
  // Tenta pelo mime type
  const mimeToFormat: Record<string, FontFormat> = {
    'font/ttf': 'ttf',
    'application/x-font-ttf': 'ttf',
    'application/x-font-truetype': 'ttf',
    'font/otf': 'otf',
    'application/x-font-otf': 'otf',
    'application/x-font-opentype': 'otf',
    'font/woff': 'woff',
    'application/font-woff': 'woff',
    'font/woff2': 'woff2',
    'application/font-woff2': 'woff2',
  }
  
  if (mimeToFormat[mimeType]) {
    return mimeToFormat[mimeType]
  }
  
  // Fallback para extensão
  const ext = fileName.split('.').pop()?.toLowerCase()
  if (ext && ['ttf', 'otf', 'woff', 'woff2'].includes(ext)) {
    return ext as FontFormat
  }
  
  return null
}

/**
 * Extrai peso da fonte do nome do arquivo ou estilo
 */
export function extractFontWeight(styleName: string): number {
  const weightMap: Record<string, number> = {
    thin: 100,
    hairline: 100,
    extralight: 200,
    ultralight: 200,
    light: 300,
    regular: 400,
    normal: 400,
    medium: 500,
    semibold: 600,
    demibold: 600,
    bold: 700,
    extrabold: 800,
    ultrabold: 800,
    black: 900,
    heavy: 900,
  }
  
  const normalized = styleName.toLowerCase().replace(/[^a-z]/g, '')
  
  for (const [key, weight] of Object.entries(weightMap)) {
    if (normalized.includes(key)) {
      return weight
    }
  }
  
  return 400
}

/**
 * Extrai estilo (normal/italic) do nome
 */
export function extractFontStyle(styleName: string): FontStyle {
  const normalized = styleName.toLowerCase()
  if (normalized.includes('italic') || normalized.includes('oblique')) {
    return 'italic'
  }
  return 'normal'
}
