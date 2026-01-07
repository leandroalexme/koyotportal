/**
 * Figma Style Translator
 * 
 * Maps Figma styles and variables to internal design tokens.
 * Attempts to match Figma style names to existing variables in the store.
 */

import type { FigmaColor, FigmaStyle, FigmaVariable, FigmaVariableCollection } from '@/types/figma'
import type { Color, TextStyle } from '@/types/studio'
import type { Variable, VariableType, VariableScope, CreateVariableInput } from '@/types/variables'

// ============================================
// COLOR UTILITIES
// ============================================

/**
 * Convert Figma color (0-1) to hex string
 */
export function figmaColorToHex(color: FigmaColor): string {
  const r = Math.round(color.r * 255).toString(16).padStart(2, '0')
  const g = Math.round(color.g * 255).toString(16).padStart(2, '0')
  const b = Math.round(color.b * 255).toString(16).padStart(2, '0')
  return `#${r}${g}${b}`.toUpperCase()
}

/**
 * Convert internal Color to hex string
 */
export function colorToHex(color: Color): string {
  const r = color.r.toString(16).padStart(2, '0')
  const g = color.g.toString(16).padStart(2, '0')
  const b = color.b.toString(16).padStart(2, '0')
  return `#${r}${g}${b}`.toUpperCase()
}

/**
 * Parse hex color to internal Color
 */
export function hexToColor(hex: string): Color {
  const cleanHex = hex.replace('#', '')
  return {
    r: parseInt(cleanHex.substring(0, 2), 16),
    g: parseInt(cleanHex.substring(2, 4), 16),
    b: parseInt(cleanHex.substring(4, 6), 16),
    a: 1,
  }
}

/**
 * Calculate color distance (simple Euclidean)
 */
export function colorDistance(c1: Color, c2: Color): number {
  return Math.sqrt(
    Math.pow(c1.r - c2.r, 2) +
    Math.pow(c1.g - c2.g, 2) +
    Math.pow(c1.b - c2.b, 2)
  )
}

// ============================================
// STYLE NAME NORMALIZATION
// ============================================

/**
 * Normalize a style name for matching
 * Converts to lowercase, removes special chars, normalizes separators
 */
export function normalizeStyleName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[\/\\]/g, '-')  // Replace path separators
    .replace(/[^a-z0-9-_]/g, '-')  // Replace special chars
    .replace(/-+/g, '-')  // Collapse multiple dashes
    .replace(/^-|-$/g, '')  // Trim dashes
}

/**
 * Extract semantic tokens from a Figma style name
 * e.g., "Brand/Primary/500" -> ["brand", "primary", "500"]
 */
export function extractStyleTokens(name: string): string[] {
  return name
    .split(/[\/\\-_\s]+/)
    .map(t => t.toLowerCase().trim())
    .filter(t => t.length > 0)
}

// ============================================
// STYLE MATCHING
// ============================================

export interface StyleMatch {
  figmaStyleName: string
  matchedVariableId: string | null
  matchedVariableName: string | null
  confidence: number  // 0-1
  suggestedVariableName?: string
}

export interface StyleMatcherConfig {
  /** Existing variables to match against */
  existingVariables: Variable[]
  /** Minimum confidence threshold for auto-matching (0-1) */
  minConfidence?: number
  /** Brand-specific color mappings */
  brandColorMap?: Record<string, string>
}

/**
 * Calculate match confidence between Figma style name and variable name
 */
function calculateNameMatchConfidence(figmaName: string, variableName: string): number {
  const figmaTokens = extractStyleTokens(figmaName)
  const varTokens = extractStyleTokens(variableName)
  
  if (figmaTokens.length === 0 || varTokens.length === 0) return 0
  
  // Count matching tokens
  let matchCount = 0
  for (const ft of figmaTokens) {
    for (const vt of varTokens) {
      if (ft === vt || ft.includes(vt) || vt.includes(ft)) {
        matchCount++
        break
      }
    }
  }
  
  // Calculate confidence based on match ratio
  const maxTokens = Math.max(figmaTokens.length, varTokens.length)
  return matchCount / maxTokens
}

/**
 * Find the best matching variable for a Figma style
 */
export function findBestVariableMatch(
  figmaStyleName: string,
  figmaStyleType: 'FILL' | 'TEXT' | 'EFFECT' | 'GRID',
  config: StyleMatcherConfig
): StyleMatch {
  const { existingVariables, minConfidence = 0.5, brandColorMap } = config
  
  let bestMatch: StyleMatch = {
    figmaStyleName,
    matchedVariableId: null,
    matchedVariableName: null,
    confidence: 0,
    suggestedVariableName: normalizeStyleName(figmaStyleName),
  }
  
  // Filter variables by compatible type
  const compatibleTypes: VariableType[] = figmaStyleType === 'FILL' 
    ? ['color'] 
    : figmaStyleType === 'TEXT' 
    ? ['string'] 
    : ['color', 'number']
  
  const candidates = existingVariables.filter(v => compatibleTypes.includes(v.type))
  
  // Check brand color map first (exact matches)
  if (brandColorMap && figmaStyleName in brandColorMap) {
    const mappedVarName = brandColorMap[figmaStyleName]
    const exactMatch = candidates.find(v => 
      v.name === mappedVarName || v.displayName === mappedVarName
    )
    if (exactMatch) {
      return {
        figmaStyleName,
        matchedVariableId: exactMatch.id,
        matchedVariableName: exactMatch.name,
        confidence: 1.0,
      }
    }
  }
  
  // Find best name match
  for (const variable of candidates) {
    const nameConfidence = Math.max(
      calculateNameMatchConfidence(figmaStyleName, variable.name),
      calculateNameMatchConfidence(figmaStyleName, variable.displayName)
    )
    
    if (nameConfidence > bestMatch.confidence && nameConfidence >= minConfidence) {
      bestMatch = {
        figmaStyleName,
        matchedVariableId: variable.id,
        matchedVariableName: variable.name,
        confidence: nameConfidence,
      }
    }
  }
  
  return bestMatch
}

// ============================================
// FIGMA VARIABLE CONVERSION
// ============================================

/**
 * Convert Figma variable type to internal variable type
 */
function mapFigmaVariableType(resolvedType: string): VariableType {
  switch (resolvedType) {
    case 'COLOR':
      return 'color'
    case 'FLOAT':
      return 'number'
    case 'STRING':
      return 'string'
    case 'BOOLEAN':
      return 'boolean'
    default:
      return 'string'
  }
}

/**
 * Determine variable scopes based on Figma variable scopes
 */
function mapFigmaVariableScopes(figmaScopes?: string[]): VariableScope[] {
  if (!figmaScopes || figmaScopes.length === 0) return ['all']
  
  const scopeMap: Record<string, VariableScope> = {
    'ALL_SCOPES': 'all',
    'TEXT_CONTENT': 'text',
    'FILL_COLOR': 'fill',
    'STROKE_COLOR': 'stroke',
    'EFFECT_COLOR': 'fill',
    'CORNER_RADIUS': 'number',
    'WIDTH_HEIGHT': 'number',
    'GAP': 'number',
  }
  
  const mappedScopes = figmaScopes
    .map(s => scopeMap[s])
    .filter((s): s is VariableScope => s !== undefined)
  
  return mappedScopes.length > 0 ? mappedScopes : ['all']
}

/**
 * Convert a Figma variable to CreateVariableInput
 */
export function convertFigmaVariable(
  figmaVar: FigmaVariable,
  collectionId: string,
  modeId: string = 'default'
): CreateVariableInput {
  const type = mapFigmaVariableType(figmaVar.resolvedType)
  const scopes = mapFigmaVariableScopes(figmaVar.scopes)
  
  // Get the value for the specified mode (or first available)
  let initialValue: string | number | boolean | null = null
  const modeValue = figmaVar.valuesByMode[modeId] || Object.values(figmaVar.valuesByMode)[0]
  
  if (modeValue !== undefined) {
    if (typeof modeValue === 'object' && 'type' in modeValue && modeValue.type === 'VARIABLE_ALIAS') {
      // This is an alias - we'll handle this separately
      initialValue = null
    } else if (typeof modeValue === 'object' && 'r' in modeValue) {
      // Color value
      initialValue = figmaColorToHex(modeValue as FigmaColor)
    } else {
      initialValue = modeValue as string | number | boolean
    }
  }
  
  return {
    name: normalizeStyleName(figmaVar.name),
    displayName: figmaVar.name,
    type,
    collectionId,
    scopes,
    description: figmaVar.description,
    initialValue,
  }
}

// ============================================
// STYLE IMPORT RESULT
// ============================================

export interface StyleImportResult {
  /** Variables to create */
  variablesToCreate: CreateVariableInput[]
  /** Mapping of Figma style ID to matched/created variable ID */
  styleToVariableMap: Record<string, string>
  /** Styles that couldn't be matched or converted */
  unmatchedStyles: string[]
  /** Warnings during import */
  warnings: string[]
}

/**
 * Process Figma styles and variables for import
 */
export function processStylesForImport(
  figmaStyles: Record<string, FigmaStyle>,
  figmaVariables: FigmaVariable[] | undefined,
  figmaCollections: FigmaVariableCollection[] | undefined,
  config: StyleMatcherConfig & { targetCollectionId: string }
): StyleImportResult {
  const result: StyleImportResult = {
    variablesToCreate: [],
    styleToVariableMap: {},
    unmatchedStyles: [],
    warnings: [],
  }
  
  // Process Figma variables first (they have more semantic info)
  if (figmaVariables && figmaVariables.length > 0) {
    for (const figmaVar of figmaVariables) {
      // Check if we already have a matching variable
      const match = findBestVariableMatch(
        figmaVar.name,
        figmaVar.resolvedType === 'COLOR' ? 'FILL' : 'TEXT',
        config
      )
      
      if (match.matchedVariableId && match.confidence >= 0.8) {
        // High confidence match - use existing variable
        result.styleToVariableMap[figmaVar.id] = match.matchedVariableId
      } else {
        // Create new variable
        const newVar = convertFigmaVariable(figmaVar, config.targetCollectionId)
        result.variablesToCreate.push(newVar)
        // We'll map the ID after creation
      }
    }
  }
  
  // Process Figma styles (fill, text, effect styles)
  for (const [styleId, style] of Object.entries(figmaStyles)) {
    const match = findBestVariableMatch(style.name, style.styleType, config)
    
    if (match.matchedVariableId && match.confidence >= 0.6) {
      result.styleToVariableMap[styleId] = match.matchedVariableId
    } else {
      result.unmatchedStyles.push(style.name)
      result.warnings.push(`Style "${style.name}" could not be matched to an existing variable`)
    }
  }
  
  return result
}

// ============================================
// TEXT STYLE MATCHING
// ============================================

export interface TextStyleMatch {
  figmaStyleName: string
  matchedTextStyle: TextStyle | null
  confidence: number
}

/**
 * Common text style presets for matching
 */
const TEXT_STYLE_KEYWORDS: Record<string, Partial<TextStyle>> = {
  'display': { fontSize: 48, fontWeight: 600 },
  'headline': { fontSize: 32, fontWeight: 600 },
  'title': { fontSize: 24, fontWeight: 600 },
  'heading': { fontSize: 20, fontWeight: 600 },
  'h1': { fontSize: 32, fontWeight: 700 },
  'h2': { fontSize: 28, fontWeight: 600 },
  'h3': { fontSize: 24, fontWeight: 600 },
  'h4': { fontSize: 20, fontWeight: 600 },
  'h5': { fontSize: 18, fontWeight: 600 },
  'h6': { fontSize: 16, fontWeight: 600 },
  'body': { fontSize: 16, fontWeight: 400 },
  'paragraph': { fontSize: 16, fontWeight: 400 },
  'text': { fontSize: 16, fontWeight: 400 },
  'caption': { fontSize: 12, fontWeight: 400 },
  'label': { fontSize: 12, fontWeight: 500 },
  'small': { fontSize: 12, fontWeight: 400 },
  'tiny': { fontSize: 10, fontWeight: 400 },
  'large': { fontSize: 18, fontWeight: 400 },
  'xl': { fontSize: 20, fontWeight: 400 },
  'xxl': { fontSize: 24, fontWeight: 400 },
  'bold': { fontWeight: 700 },
  'semibold': { fontWeight: 600 },
  'medium': { fontWeight: 500 },
  'regular': { fontWeight: 400 },
  'light': { fontWeight: 300 },
}

/**
 * Infer text style properties from a Figma style name
 */
export function inferTextStyleFromName(styleName: string): Partial<TextStyle> {
  const tokens = extractStyleTokens(styleName)
  let inferred: Partial<TextStyle> = {}
  
  for (const token of tokens) {
    if (token in TEXT_STYLE_KEYWORDS) {
      inferred = { ...inferred, ...TEXT_STYLE_KEYWORDS[token] }
    }
    
    // Check for size numbers (e.g., "16", "24px")
    const sizeMatch = token.match(/^(\d+)(px)?$/)
    if (sizeMatch) {
      inferred.fontSize = parseInt(sizeMatch[1], 10)
    }
    
    // Check for weight numbers (e.g., "400", "700")
    const weightMatch = token.match(/^(100|200|300|400|500|600|700|800|900)$/)
    if (weightMatch) {
      inferred.fontWeight = parseInt(weightMatch[1], 10) as TextStyle['fontWeight']
    }
  }
  
  return inferred
}

// ============================================
// EXPORTS
// ============================================
