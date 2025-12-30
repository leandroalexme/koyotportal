/**
 * Asset Analysis Service - AI Vision for Auto-tagging
 * Uses Gemini Vision API to analyze images and extract metadata
 */

import { GoogleGenerativeAI } from '@google/generative-ai'

// Initialize Gemini AI (server-side only)
const getGenAI = () => {
  const apiKey = process.env.GOOGLE_AI_API_KEY
  if (!apiKey) {
    throw new Error('GOOGLE_AI_API_KEY não configurada')
  }
  return new GoogleGenerativeAI(apiKey)
}

export interface AssetAnalysisResult {
  tags: string[]
  description: string
  altText: string
  dominantColors: Array<{
    hex: string
    name: string
    percentage: number
  }>
  category: 'logo' | 'photo' | 'illustration' | 'icon' | 'pattern' | 'typography' | 'other'
  style: string[]
  mood: string[]
  objects: string[]
  confidence: number
}

export interface AnalyzeAssetOptions {
  url: string
  brandContext?: string
  existingTags?: string[]
}

const ANALYSIS_PROMPT = `Você é um especialista em análise visual para gestão de ativos de marca (DAM).
Analise esta imagem e forneça uma análise detalhada em JSON.

IMPORTANTE:
- Tags devem ser em português
- Seja específico e relevante para branding
- Identifique cores com precisão (hex codes válidos)
- A descrição ALT deve ser acessível e concisa

Responda APENAS com JSON válido no formato:
{
  "tags": ["tag1", "tag2", "tag3", ...],
  "description": "Descrição detalhada do asset para contexto de marca",
  "altText": "Texto alternativo curto e acessível (max 125 caracteres)",
  "dominantColors": [
    {"hex": "#XXXXXX", "name": "nome da cor em português", "percentage": 40},
    {"hex": "#XXXXXX", "name": "nome da cor", "percentage": 30},
    {"hex": "#XXXXXX", "name": "nome da cor", "percentage": 20}
  ],
  "category": "logo|photo|illustration|icon|pattern|typography|other",
  "style": ["minimalista", "moderno", "vintage", etc],
  "mood": ["profissional", "amigável", "luxuoso", etc],
  "objects": ["objetos identificados na imagem"],
  "confidence": 0.95
}

Tags sugeridas para branding:
- Tipo: logotipo, ícone, foto, ilustração, padrão, textura
- Estilo: minimalista, moderno, clássico, vintage, futurista, orgânico
- Uso: redes sociais, apresentação, website, impressão, avatar
- Cores: azul marinho, dourado, monocromático, colorido, gradiente
- Elementos: tipografia, símbolo, mascote, abstrato, geométrico`

/**
 * Analyzes an asset using Gemini Vision API
 * @param options - Analysis options including URL and brand context
 * @returns Analysis result with tags, colors, description, etc.
 */
export async function analyzeAsset(
  options: AnalyzeAssetOptions
): Promise<AssetAnalysisResult> {
  const { url, brandContext, existingTags } = options

  const genAI = getGenAI()
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.5-flash',
    generationConfig: {
      responseMimeType: 'application/json',
      temperature: 0.3,
    },
  })

  let contextPrompt = ANALYSIS_PROMPT

  if (brandContext) {
    contextPrompt += `\n\nContexto da marca: ${brandContext}`
  }

  if (existingTags && existingTags.length > 0) {
    contextPrompt += `\n\nTags existentes no sistema (use como referência): ${existingTags.join(', ')}`
  }

  try {
    // Fetch image and convert to base64
    const imageResponse = await fetch(url)
    if (!imageResponse.ok) {
      throw new Error(`Failed to fetch image: ${imageResponse.status}`)
    }

    const imageBuffer = await imageResponse.arrayBuffer()
    const base64 = Buffer.from(imageBuffer).toString('base64')
    const mimeType = imageResponse.headers.get('content-type') || 'image/jpeg'

    const result = await model.generateContent([
      contextPrompt,
      {
        inlineData: {
          mimeType,
          data: base64,
        },
      },
    ])

    const text = result.response.text()
    const parsed = JSON.parse(text.replace(/```json\n?|\n?```/g, '').trim())

    // Validate and normalize response
    return {
      tags: Array.isArray(parsed.tags) ? parsed.tags.slice(0, 15) : [],
      description: parsed.description || '',
      altText: (parsed.altText || parsed.description || '').substring(0, 125),
      dominantColors: Array.isArray(parsed.dominantColors)
        ? parsed.dominantColors.slice(0, 5).map((c: { hex: string; name: string; percentage: number }) => ({
            hex: c.hex?.startsWith('#') ? c.hex : `#${c.hex}`,
            name: c.name || 'Cor',
            percentage: Math.min(100, Math.max(0, c.percentage || 0)),
          }))
        : [],
      category: parsed.category || 'other',
      style: Array.isArray(parsed.style) ? parsed.style : [],
      mood: Array.isArray(parsed.mood) ? parsed.mood : [],
      objects: Array.isArray(parsed.objects) ? parsed.objects : [],
      confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 0.8,
    }
  } catch (error) {
    console.error('Asset analysis error:', error)
    throw new Error(`Falha na análise do asset: ${error instanceof Error ? error.message : 'Erro desconhecido'}`)
  }
}

/**
 * Analyzes an asset from a File object (client-side compatible)
 */
export async function analyzeAssetFromFile(
  file: File,
  brandContext?: string
): Promise<AssetAnalysisResult> {
  // Convert file to base64
  const base64 = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      resolve(result.split(',')[1])
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })

  const genAI = getGenAI()
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.5-flash',
    generationConfig: {
      responseMimeType: 'application/json',
      temperature: 0.3,
    },
  })

  let contextPrompt = ANALYSIS_PROMPT
  if (brandContext) {
    contextPrompt += `\n\nContexto da marca: ${brandContext}`
  }

  try {
    const result = await model.generateContent([
      contextPrompt,
      {
        inlineData: {
          mimeType: file.type,
          data: base64,
        },
      },
    ])

    const text = result.response.text()
    const parsed = JSON.parse(text.replace(/```json\n?|\n?```/g, '').trim())

    return {
      tags: Array.isArray(parsed.tags) ? parsed.tags.slice(0, 15) : [],
      description: parsed.description || '',
      altText: (parsed.altText || parsed.description || '').substring(0, 125),
      dominantColors: Array.isArray(parsed.dominantColors)
        ? parsed.dominantColors.slice(0, 5).map((c: { hex: string; name: string; percentage: number }) => ({
            hex: c.hex?.startsWith('#') ? c.hex : `#${c.hex}`,
            name: c.name || 'Cor',
            percentage: Math.min(100, Math.max(0, c.percentage || 0)),
          }))
        : [],
      category: parsed.category || 'other',
      style: Array.isArray(parsed.style) ? parsed.style : [],
      mood: Array.isArray(parsed.mood) ? parsed.mood : [],
      objects: Array.isArray(parsed.objects) ? parsed.objects : [],
      confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 0.8,
    }
  } catch (error) {
    console.error('Asset analysis error:', error)
    throw new Error(`Falha na análise do asset: ${error instanceof Error ? error.message : 'Erro desconhecido'}`)
  }
}

/**
 * Quick tag generation for faster processing
 */
export async function generateQuickTags(
  url: string
): Promise<{ tags: string[]; colors: string[] }> {
  const genAI = getGenAI()
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.5-flash',
    generationConfig: {
      responseMimeType: 'application/json',
      temperature: 0.2,
    },
  })

  try {
    const imageResponse = await fetch(url)
    const imageBuffer = await imageResponse.arrayBuffer()
    const base64 = Buffer.from(imageBuffer).toString('base64')
    const mimeType = imageResponse.headers.get('content-type') || 'image/jpeg'

    const result = await model.generateContent([
      `Analise rapidamente esta imagem e retorne:
      {"tags": ["5-8 tags em português"], "colors": ["3-5 hex codes das cores dominantes"]}`,
      {
        inlineData: { mimeType, data: base64 },
      },
    ])

    const text = result.response.text()
    const parsed = JSON.parse(text.replace(/```json\n?|\n?```/g, '').trim())

    return {
      tags: parsed.tags || [],
      colors: parsed.colors || [],
    }
  } catch (error) {
    console.error('Quick tag error:', error)
    return { tags: [], colors: [] }
  }
}

/**
 * Batch analyze multiple assets
 */
export async function analyzeAssetsBatch(
  urls: string[],
  brandContext?: string
): Promise<Map<string, AssetAnalysisResult>> {
  const results = new Map<string, AssetAnalysisResult>()

  // Process in parallel with concurrency limit
  const concurrencyLimit = 3
  const chunks: string[][] = []

  for (let i = 0; i < urls.length; i += concurrencyLimit) {
    chunks.push(urls.slice(i, i + concurrencyLimit))
  }

  for (const chunk of chunks) {
    const chunkResults = await Promise.allSettled(
      chunk.map((url) => analyzeAsset({ url, brandContext }))
    )

    chunkResults.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        results.set(chunk[index], result.value)
      }
    })
  }

  return results
}
