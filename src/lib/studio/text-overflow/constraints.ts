/**
 * Text Size Constraints
 * 
 * Define os limites de redução de fonte para cada tamanho base.
 * A fonte pode reduzir até um percentual mínimo do tamanho original.
 */

export interface TextSizeConstraint {
  /** Tamanho mínimo absoluto da fonte (nunca menor que isso) */
  minFontSize: number
  /** Percentual mínimo do tamanho original (ex: 0.6 = 60%) */
  minPercentage: number
  /** Passo de redução em pixels */
  step: number
}

/**
 * Constraints baseados no tamanho original da fonte
 * Fontes maiores podem reduzir mais, fontes menores têm limite mais restrito
 */
export const TEXT_SIZE_CONSTRAINTS: Record<string, TextSizeConstraint> = {
  // Títulos grandes (>= 48px)
  large: {
    minFontSize: 24,
    minPercentage: 0.5, // Pode reduzir até 50%
    step: 2,
  },
  // Títulos médios (32-47px)
  medium: {
    minFontSize: 18,
    minPercentage: 0.55, // Pode reduzir até 55%
    step: 1,
  },
  // Texto normal (16-31px)
  normal: {
    minFontSize: 12,
    minPercentage: 0.65, // Pode reduzir até 65%
    step: 1,
  },
  // Texto pequeno (< 16px)
  small: {
    minFontSize: 10,
    minPercentage: 0.75, // Pode reduzir até 75%
    step: 0.5,
  },
}

/**
 * Retorna as constraints apropriadas para um tamanho de fonte
 */
export function getConstraintsForFontSize(fontSize: number): TextSizeConstraint {
  if (fontSize >= 48) return TEXT_SIZE_CONSTRAINTS.large
  if (fontSize >= 32) return TEXT_SIZE_CONSTRAINTS.medium
  if (fontSize >= 16) return TEXT_SIZE_CONSTRAINTS.normal
  return TEXT_SIZE_CONSTRAINTS.small
}

/**
 * Calcula o tamanho mínimo permitido para uma fonte
 */
export function getMinFontSize(originalFontSize: number): number {
  const constraints = getConstraintsForFontSize(originalFontSize)
  const percentageMin = originalFontSize * constraints.minPercentage
  return Math.max(constraints.minFontSize, percentageMin)
}
