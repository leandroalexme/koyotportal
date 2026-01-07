/**
 * Serviço de integração com Google Fonts
 * 
 * Verifica se uma fonte está disponível no Google Fonts
 * e gera URLs de CDN para carregamento
 * 
 * Lista completa obtida da API do Google Fonts (1700+ fontes)
 */

// Cache da lista de fontes do Google (carregada dinamicamente)
let googleFontsCache: Set<string> | null = null
let googleFontsCachePromise: Promise<Set<string>> | null = null

/**
 * Lista estática de fontes populares do Google Fonts (fallback)
 * Usada quando a API não está disponível
 */
const GOOGLE_FONTS_FALLBACK = new Set([
  // Sans-serif populares
  'Inter', 'Roboto', 'Open Sans', 'Lato', 'Montserrat', 'Poppins',
  'Source Sans Pro', 'Source Sans 3', 'Nunito', 'Nunito Sans', 'Raleway',
  'Ubuntu', 'Rubik', 'Work Sans', 'Noto Sans', 'Fira Sans', 'Mulish',
  'Barlow', 'Manrope', 'DM Sans', 'Plus Jakarta Sans', 'Outfit',
  'Lexend', 'Sora', 'Space Grotesk', 'Urbanist', 'Figtree',
  'Albert Sans', 'Be Vietnam Pro', 'Bricolage Grotesque',
  'Pragati Narrow', 'Radio Canada', 'Radio Canada Big',
  
  // Serif populares
  'Playfair Display', 'Merriweather', 'Lora', 'PT Serif', 'Libre Baskerville',
  'Source Serif Pro', 'Source Serif 4', 'Crimson Text', 'Cormorant Garamond',
  'EB Garamond', 'Bitter', 'Noto Serif', 'Spectral', 'Libre Caslon Text',
  'DM Serif Display', 'DM Serif Text', 'Fraunces', 'Newsreader',
  
  // Display/Decorativas
  'Oswald', 'Bebas Neue', 'Anton', 'Archivo Black', 'Righteous',
  'Abril Fatface', 'Alfa Slab One', 'Permanent Marker', 'Pacifico',
  'Lobster', 'Dancing Script', 'Great Vibes', 'Satisfy', 'Caveat',
  'Comfortaa', 'Quicksand', 'Varela Round', 'Fredoka One', 'Fredoka',
  
  // Monospace
  'JetBrains Mono', 'Fira Code', 'Source Code Pro', 'Roboto Mono',
  'IBM Plex Mono', 'Space Mono', 'Ubuntu Mono', 'Inconsolata',
  'Cousine', 'Anonymous Pro', 'Overpass Mono',
  
  // Brasileiras/Latinas comuns
  'Archivo', 'Archivo Narrow', 'Exo 2', 'Titillium Web', 'Saira',
  'Saira Condensed', 'Asap', 'Asap Condensed', 'Hind', 'Karla',
])

/**
 * Busca a lista completa de fontes do Google Fonts via API
 */
async function fetchGoogleFontsList(): Promise<Set<string>> {
  try {
    // Usar a API pública do Google Fonts (não requer API key para lista básica)
    const response = await fetch(
      'https://fonts.google.com/metadata/fonts',
      { next: { revalidate: 86400 } } // Cache por 24h
    )
    
    if (!response.ok) {
      console.warn('[Google Fonts] API request failed, using fallback list')
      return GOOGLE_FONTS_FALLBACK
    }
    
    const text = await response.text()
    // A resposta começa com ")]}'" que precisa ser removido
    const jsonText = text.replace(/^\)\]\}'/, '')
    const data = JSON.parse(jsonText)
    
    const fonts = new Set<string>()
    
    if (data.familyMetadataList) {
      for (const font of data.familyMetadataList) {
        if (font.family) {
          fonts.add(font.family)
        }
      }
    }
    
    console.log(`[Google Fonts] Loaded ${fonts.size} fonts from API`)
    return fonts.size > 0 ? fonts : GOOGLE_FONTS_FALLBACK
    
  } catch (error) {
    console.warn('[Google Fonts] Failed to fetch fonts list:', error)
    return GOOGLE_FONTS_FALLBACK
  }
}

/**
 * Obtém a lista de fontes do Google (com cache)
 */
async function getGoogleFontsList(): Promise<Set<string>> {
  if (googleFontsCache) {
    return googleFontsCache
  }
  
  if (!googleFontsCachePromise) {
    googleFontsCachePromise = fetchGoogleFontsList().then(fonts => {
      googleFontsCache = fonts
      return fonts
    })
  }
  
  return googleFontsCachePromise
}

/**
 * Verifica se uma fonte está disponível no Google Fonts (síncrono, usa cache/fallback)
 */
export function isGoogleFont(fontFamily: string): boolean {
  const normalized = fontFamily.trim()
  // Usa cache se disponível, senão fallback
  const list = googleFontsCache || GOOGLE_FONTS_FALLBACK
  return list.has(normalized)
}

/**
 * Verifica se uma fonte está disponível no Google Fonts (assíncrono, busca da API)
 */
export async function isGoogleFontAsync(fontFamily: string): Promise<boolean> {
  const normalized = fontFamily.trim()
  const list = await getGoogleFontsList()
  return list.has(normalized)
}

/**
 * Pré-carrega a lista de fontes do Google (chamar no início da aplicação)
 */
export async function preloadGoogleFontsList(): Promise<void> {
  await getGoogleFontsList()
}

/**
 * Gera URL do Google Fonts para uma família de fonte
 */
export function getGoogleFontUrl(
  fontFamily: string,
  weights: number[] = [400, 500, 600, 700],
  italic: boolean = false
): string {
  const family = fontFamily.replace(/\s+/g, '+')
  
  // Formata os pesos
  const weightSpecs = weights.map(w => {
    if (italic) {
      return `0,${w};1,${w}`
    }
    return w.toString()
  })
  
  const weightsParam = italic 
    ? `ital,wght@${weightSpecs.join(';')}`
    : `wght@${weights.join(';')}`
  
  return `https://fonts.googleapis.com/css2?family=${family}:${weightsParam}&display=swap`
}

/**
 * Gera CSS @import para Google Fonts
 */
export function getGoogleFontImport(
  fontFamily: string,
  weights: number[] = [400, 500, 600, 700]
): string {
  const url = getGoogleFontUrl(fontFamily, weights)
  return `@import url('${url}');`
}

/**
 * Gera link HTML para Google Fonts
 */
export function getGoogleFontLink(
  fontFamily: string,
  weights: number[] = [400, 500, 600, 700]
): string {
  const url = getGoogleFontUrl(fontFamily, weights)
  return `<link href="${url}" rel="stylesheet">`
}

/**
 * Gera URLs para múltiplas fontes do Google
 */
export function getGoogleFontsUrl(
  fonts: Array<{ family: string; weights?: number[] }>
): string {
  const families = fonts.map(f => {
    const family = f.family.replace(/\s+/g, '+')
    const weights = f.weights || [400, 500, 600, 700]
    return `family=${family}:wght@${weights.join(';')}`
  })
  
  return `https://fonts.googleapis.com/css2?${families.join('&')}&display=swap`
}

/**
 * Extrai fontes únicas de um template e separa em Google Fonts e customizadas (síncrono)
 */
export function categorizeFonts(fontFamilies: string[]): {
  googleFonts: string[]
  customFonts: string[]
} {
  const googleFonts: string[] = []
  const customFonts: string[] = []
  
  const seen = new Set<string>()
  
  for (const family of fontFamilies) {
    const normalized = family.trim()
    if (seen.has(normalized)) continue
    seen.add(normalized)
    
    if (isGoogleFont(normalized)) {
      googleFonts.push(normalized)
    } else {
      customFonts.push(normalized)
    }
  }
  
  return { googleFonts, customFonts }
}

/**
 * Extrai fontes únicas de um template e separa em Google Fonts e customizadas (assíncrono)
 * Usa a API do Google Fonts para verificação mais precisa
 */
export async function categorizeFontsAsync(fontFamilies: string[]): Promise<{
  googleFonts: string[]
  customFonts: string[]
}> {
  // Pré-carrega a lista de fontes
  await getGoogleFontsList()
  
  const googleFonts: string[] = []
  const customFonts: string[] = []
  
  const seen = new Set<string>()
  
  for (const family of fontFamilies) {
    const normalized = family.trim()
    if (seen.has(normalized)) continue
    seen.add(normalized)
    
    if (await isGoogleFontAsync(normalized)) {
      googleFonts.push(normalized)
    } else {
      customFonts.push(normalized)
    }
  }
  
  return { googleFonts, customFonts }
}

/**
 * Informações de fonte para o template
 */
export interface FontInfo {
  family: string
  source: 'google' | 'custom' | 'system'
  url?: string
  weights: number[]
}

/**
 * Resolve informações de fonte (Google ou customizada)
 */
export function resolveFontInfo(
  fontFamily: string,
  customFontUrl?: string
): FontInfo {
  // Fontes do sistema
  const systemFonts = ['Arial', 'Helvetica', 'Times New Roman', 'Georgia', 'Verdana', 'system-ui', 'sans-serif', 'serif', 'monospace']
  if (systemFonts.some(sf => fontFamily.toLowerCase().includes(sf.toLowerCase()))) {
    return {
      family: fontFamily,
      source: 'system',
      weights: [400, 700],
    }
  }
  
  // Google Fonts
  if (isGoogleFont(fontFamily)) {
    return {
      family: fontFamily,
      source: 'google',
      url: getGoogleFontUrl(fontFamily),
      weights: [300, 400, 500, 600, 700],
    }
  }
  
  // Fonte customizada
  return {
    family: fontFamily,
    source: 'custom',
    url: customFontUrl,
    weights: [400, 700],
  }
}

/**
 * Gera CSS para carregar todas as fontes de um template
 */
export function generateFontsCSS(fonts: FontInfo[]): string {
  const imports: string[] = []
  
  for (const font of fonts) {
    if (font.source === 'google' && font.url) {
      imports.push(`@import url('${font.url}');`)
    } else if (font.source === 'custom' && font.url) {
      imports.push(`@font-face {
  font-family: '${font.family}';
  src: url('${font.url}');
  font-display: swap;
}`)
    }
  }
  
  return imports.join('\n\n')
}
