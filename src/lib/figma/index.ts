/**
 * Figma Integration Module
 * 
 * Exports all Figma-related functionality for importing designs.
 */

export {
  importFromFigma,
  importFromFigmaUrl,
  parseFigmaUrl,
  convertFigmaColor,
  colorToHex,
  createFigmaClient,
} from './figma-importer'

export type {
  FigmaApiClient,
  ConversionContext,
} from './figma-importer'

export {
  figmaColorToHex,
  colorToHex as internalColorToHex,
  hexToColor,
  colorDistance,
  normalizeStyleName,
  extractStyleTokens,
  findBestVariableMatch,
  convertFigmaVariable,
  processStylesForImport,
  inferTextStyleFromName,
} from './style-translator'

export type {
  StyleMatch,
  StyleMatcherConfig,
  StyleImportResult,
  TextStyleMatch,
} from './style-translator'
