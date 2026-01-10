/**
 * Perspective Transform (Homografia)
 * 
 * Implementa transformações de perspectiva para mapear um retângulo
 * em um quadrilátero arbitrário (4 pontos).
 * 
 * Usado para inserir templates em mockups com perspectiva realista.
 */

import type { Point2D, Quad } from './types'

/**
 * Matriz 3x3 para transformações de perspectiva
 * Formato row-major: [a, b, c, d, e, f, g, h, i]
 * 
 * | a  b  c |
 * | d  e  f |
 * | g  h  i |
 */
export type Matrix3x3 = [
  number, number, number,
  number, number, number,
  number, number, number
]

/**
 * Cria matriz identidade 3x3
 */
export function identityMatrix(): Matrix3x3 {
  return [1, 0, 0, 0, 1, 0, 0, 0, 1]
}

/**
 * Multiplica duas matrizes 3x3
 */
export function multiplyMatrices(a: Matrix3x3, b: Matrix3x3): Matrix3x3 {
  return [
    a[0] * b[0] + a[1] * b[3] + a[2] * b[6],
    a[0] * b[1] + a[1] * b[4] + a[2] * b[7],
    a[0] * b[2] + a[1] * b[5] + a[2] * b[8],

    a[3] * b[0] + a[4] * b[3] + a[5] * b[6],
    a[3] * b[1] + a[4] * b[4] + a[5] * b[7],
    a[3] * b[2] + a[4] * b[5] + a[5] * b[8],

    a[6] * b[0] + a[7] * b[3] + a[8] * b[6],
    a[6] * b[1] + a[7] * b[4] + a[8] * b[7],
    a[6] * b[2] + a[7] * b[5] + a[8] * b[8],
  ]
}

/**
 * Calcula a matriz adjunta de uma matriz 3x3
 */
function adjugate(m: Matrix3x3): Matrix3x3 {
  return [
    m[4] * m[8] - m[5] * m[7],
    m[2] * m[7] - m[1] * m[8],
    m[1] * m[5] - m[2] * m[4],

    m[5] * m[6] - m[3] * m[8],
    m[0] * m[8] - m[2] * m[6],
    m[2] * m[3] - m[0] * m[5],

    m[3] * m[7] - m[4] * m[6],
    m[1] * m[6] - m[0] * m[7],
    m[0] * m[4] - m[1] * m[3],
  ]
}

/**
 * Calcula o determinante de uma matriz 3x3
 */
function determinant(m: Matrix3x3): number {
  return (
    m[0] * (m[4] * m[8] - m[5] * m[7]) -
    m[1] * (m[3] * m[8] - m[5] * m[6]) +
    m[2] * (m[3] * m[7] - m[4] * m[6])
  )
}

/**
 * Inverte uma matriz 3x3
 */
export function invertMatrix(m: Matrix3x3): Matrix3x3 | null {
  const det = determinant(m)
  if (Math.abs(det) < 1e-10) {
    return null // Matriz singular, não pode ser invertida
  }

  const adj = adjugate(m)
  const invDet = 1 / det

  return adj.map(v => v * invDet) as Matrix3x3
}

/**
 * Calcula matriz de transformação de um quadrilátero para outro
 * (Transformação quadrilateral para quadrilateral)
 * 
 * @param src - Quadrilátero de origem
 * @param dst - Quadrilátero de destino
 * @returns Matriz de transformação 3x3
 */
export function quadToQuadMatrix(src: Quad, dst: Quad): Matrix3x3 | null {
  // Primeiro: calcular matriz que mapeia unidade para src
  const srcMatrix = unitSquareToQuad(src)
  if (!srcMatrix) return null

  // Segundo: calcular matriz que mapeia unidade para dst
  const dstMatrix = unitSquareToQuad(dst)
  if (!dstMatrix) return null

  // Terceiro: inverter srcMatrix para mapear src para unidade
  const srcInverse = invertMatrix(srcMatrix)
  if (!srcInverse) return null

  // Resultado: dst * src^-1 (mapeia src -> unidade -> dst)
  return multiplyMatrices(dstMatrix, srcInverse)
}

/**
 * Calcula matriz que mapeia quadrado unitário [0,1]x[0,1] para um quadrilátero
 */
function unitSquareToQuad(quad: Quad): Matrix3x3 | null {
  const { topLeft: p0, topRight: p1, bottomRight: p2, bottomLeft: p3 } = quad

  const dx1 = p1.x - p2.x
  const dy1 = p1.y - p2.y
  const dx2 = p3.x - p2.x
  const dy2 = p3.y - p2.y
  const dx3 = p0.x - p1.x + p2.x - p3.x
  const dy3 = p0.y - p1.y + p2.y - p3.y

  const det = dx1 * dy2 - dx2 * dy1
  if (Math.abs(det) < 1e-10) {
    return null
  }

  const a13 = (dx3 * dy2 - dx2 * dy3) / det
  const a23 = (dx1 * dy3 - dx3 * dy1) / det

  return [
    p1.x - p0.x + a13 * p1.x,
    p3.x - p0.x + a23 * p3.x,
    p0.x,

    p1.y - p0.y + a13 * p1.y,
    p3.y - p0.y + a23 * p3.y,
    p0.y,

    a13,
    a23,
    1,
  ]
}

/**
 * Calcula matriz para mapear retângulo [0,0,w,h] para quadrilátero de destino
 * 
 * @param width - Largura do retângulo de origem
 * @param height - Altura do retângulo de origem
 * @param dst - Quadrilátero de destino
 * @returns Matriz de transformação 3x3
 */
export function rectToQuadMatrix(
  width: number,
  height: number,
  dst: Quad
): Matrix3x3 | null {
  // Criar quadrilátero de origem como retângulo
  const src: Quad = {
    topLeft: { x: 0, y: 0 },
    topRight: { x: width, y: 0 },
    bottomRight: { x: width, y: height },
    bottomLeft: { x: 0, y: height },
  }

  return quadToQuadMatrix(src, dst)
}

/**
 * Transforma um ponto usando matriz 3x3 (coordenadas homogêneas)
 */
export function transformPoint(point: Point2D, matrix: Matrix3x3): Point2D {
  const w = matrix[6] * point.x + matrix[7] * point.y + matrix[8]

  if (Math.abs(w) < 1e-10) {
    return point // Evita divisão por zero
  }

  return {
    x: (matrix[0] * point.x + matrix[1] * point.y + matrix[2]) / w,
    y: (matrix[3] * point.x + matrix[4] * point.y + matrix[5]) / w,
  }
}

/**
 * Converte matriz 3x3 para formato CSS matrix3d
 * 
 * CSS matrix3d é column-major e 4x4:
 * matrix3d(a, b, 0, p, c, d, 0, q, 0, 0, 1, 0, tx, ty, 0, 1)
 */
export function matrixToCSSMatrix3d(m: Matrix3x3): string {
  // Normalizar pela última componente
  const scale = m[8] !== 0 ? 1 / m[8] : 1

  const a = m[0] * scale
  const b = m[3] * scale
  const c = m[1] * scale
  const d = m[4] * scale
  const tx = m[2] * scale
  const ty = m[5] * scale
  const p = m[6] * scale
  const q = m[7] * scale

  // matrix3d em column-major order
  return `matrix3d(${a}, ${b}, 0, ${p}, ${c}, ${d}, 0, ${q}, 0, 0, 1, 0, ${tx}, ${ty}, 0, 1)`
}

/**
 * Converte matriz 3x3 para formato CanvasKit (row-major flat array)
 * CanvasKit usa matriz 3x3 no formato: [scaleX, skewX, transX, skewY, scaleY, transY, persp0, persp1, persp2]
 */
export function matrixToCanvasKit(m: Matrix3x3): number[] {
  // CanvasKit espera: [m[0], m[1], m[2], m[3], m[4], m[5], m[6], m[7], m[8]]
  // Que corresponde a:
  // | scaleX  skewX   transX  |   | m[0]  m[1]  m[2] |
  // | skewY   scaleY  transY  | = | m[3]  m[4]  m[5] |
  // | persp0  persp1  persp2  |   | m[6]  m[7]  m[8] |
  return [...m]
}

/**
 * Aplica transformação de perspectiva a um canvas usando Canvas2D
 * 
 * Nota: Canvas2D não suporta perspectiva nativa, então usamos 
 * uma aproximação com subdivisão de triângulos
 */
export function applyPerspectiveCanvas2D(
  ctx: CanvasRenderingContext2D,
  sourceImage: CanvasImageSource,
  srcWidth: number,
  srcHeight: number,
  dstQuad: Quad,
  subdivisions: number = 8
): void {
  // Validar dimensões
  if (srcWidth <= 0 || srcHeight <= 0) {
    console.warn('[applyPerspectiveCanvas2D] Dimensões inválidas:', srcWidth, srcHeight)
    return
  }

  // Validar imagem
  if (sourceImage instanceof HTMLCanvasElement) {
    if (sourceImage.width <= 0 || sourceImage.height <= 0) {
      console.warn('[applyPerspectiveCanvas2D] Canvas com dimensões inválidas')
      return
    }
  }
  if (sourceImage instanceof HTMLImageElement) {
    if (!sourceImage.complete || sourceImage.naturalWidth <= 0) {
      console.warn('[applyPerspectiveCanvas2D] Imagem não carregada')
      return
    }
  }

  const { topLeft, topRight, bottomRight, bottomLeft } = dstQuad

  console.log('[applyPerspectiveCanvas2D] Drawing perspective transform')
  console.log('[applyPerspectiveCanvas2D] Source size:', srcWidth, 'x', srcHeight)
  console.log('[applyPerspectiveCanvas2D] Quad:',
    `TL(${topLeft.x.toFixed(0)},${topLeft.y.toFixed(0)})`,
    `TR(${topRight.x.toFixed(0)},${topRight.y.toFixed(0)})`,
    `BR(${bottomRight.x.toFixed(0)},${bottomRight.y.toFixed(0)})`,
    `BL(${bottomLeft.x.toFixed(0)},${bottomLeft.y.toFixed(0)})`
  )

  // Subdividir em grid de triângulos para aproximar perspectiva
  let trianglesDrawn = 0

  for (let y = 0; y < subdivisions; y++) {
    for (let x = 0; x < subdivisions; x++) {
      const u0 = x / subdivisions
      const v0 = y / subdivisions
      const u1 = (x + 1) / subdivisions
      const v1 = (y + 1) / subdivisions

      // Calcular pontos no quadrilátero de destino (interpolação bilinear)
      const p00 = bilinearInterpolate(topLeft, topRight, bottomRight, bottomLeft, u0, v0)
      const p10 = bilinearInterpolate(topLeft, topRight, bottomRight, bottomLeft, u1, v0)
      const p01 = bilinearInterpolate(topLeft, topRight, bottomRight, bottomLeft, u0, v1)
      const p11 = bilinearInterpolate(topLeft, topRight, bottomRight, bottomLeft, u1, v1)

      // Coordenadas de origem na imagem
      const sx0 = u0 * srcWidth
      const sy0 = v0 * srcHeight
      const sx1 = u1 * srcWidth
      const sy1 = v1 * srcHeight

      // Desenhar dois triângulos para formar o quadrado
      drawTexturedTriangle(ctx, sourceImage,
        sx0, sy0, sx1, sy0, sx0, sy1,
        p00.x, p00.y, p10.x, p10.y, p01.x, p01.y
      )
      drawTexturedTriangle(ctx, sourceImage,
        sx1, sy0, sx1, sy1, sx0, sy1,
        p10.x, p10.y, p11.x, p11.y, p01.x, p01.y
      )
      trianglesDrawn += 2
    }
  }

  console.log('[applyPerspectiveCanvas2D] Triangles drawn:', trianglesDrawn)
}

/**
 * Interpolação bilinear de um ponto dentro de um quadrilátero
 */
function bilinearInterpolate(
  topLeft: Point2D,
  topRight: Point2D,
  bottomRight: Point2D,
  bottomLeft: Point2D,
  u: number,
  v: number
): Point2D {
  // Interpolação horizontal nas bordas superior e inferior
  const topX = topLeft.x + (topRight.x - topLeft.x) * u
  const topY = topLeft.y + (topRight.y - topLeft.y) * u
  const bottomX = bottomLeft.x + (bottomRight.x - bottomLeft.x) * u
  const bottomY = bottomLeft.y + (bottomRight.y - bottomLeft.y) * u

  // Interpolação vertical
  return {
    x: topX + (bottomX - topX) * v,
    y: topY + (bottomY - topY) * v,
  }
}

/**
 * Desenha um triângulo texturizado usando Canvas2D
 * Baseado em transformação afim por triângulo
 * 
 * A transformação mapeia do espaço da imagem fonte para o espaço do canvas destino
 */
function drawTexturedTriangle(
  ctx: CanvasRenderingContext2D,
  img: CanvasImageSource,
  sx0: number, sy0: number,
  sx1: number, sy1: number,
  sx2: number, sy2: number,
  dx0: number, dy0: number,
  dx1: number, dy1: number,
  dx2: number, dy2: number
): void {
  ctx.save()

  // Criar clipping path com o triângulo de destino
  ctx.beginPath()
  ctx.moveTo(dx0, dy0)
  ctx.lineTo(dx1, dy1)
  ctx.lineTo(dx2, dy2)
  ctx.closePath()
  ctx.clip()

  // Calcular transformação afim que mapeia triângulo fonte -> triângulo destino
  // Resolvemos: para pontos fonte (sx, sy), encontrar (dx, dy) no destino
  // 
  // | dx |   | a  b  tx |   | sx |
  // | dy | = | c  d  ty | * | sy |
  // | 1  |   | 0  0  1  |   | 1  |
  //
  // Onde: dx = a*sx + b*sy + tx
  //       dy = c*sx + d*sy + ty

  const denom = (sx0 - sx2) * (sy1 - sy2) - (sx1 - sx2) * (sy0 - sy2)

  if (Math.abs(denom) < 1e-10) {
    ctx.restore()
    return
  }

  // Resolver para a, b, tx (coeficientes da linha x: dx = a*sx + b*sy + tx)
  const a = ((dx0 - dx2) * (sy1 - sy2) - (dx1 - dx2) * (sy0 - sy2)) / denom
  const b = ((dx1 - dx2) * (sx0 - sx2) - (dx0 - dx2) * (sx1 - sx2)) / denom
  const tx = dx2 - a * sx2 - b * sy2

  // Resolver para c, d, ty (coeficientes da linha y: dy = c*sx + d*sy + ty)
  const c = ((dy0 - dy2) * (sy1 - sy2) - (dy1 - dy2) * (sy0 - sy2)) / denom
  const d = ((dy1 - dy2) * (sx0 - sx2) - (dy0 - dy2) * (sx1 - sx2)) / denom
  const ty = dy2 - c * sx2 - d * sy2

  // Aplicar transformação ao contexto
  // Canvas2D transform(m11, m12, m21, m22, dx, dy) cria a matriz:
  // | m11  m21  dx |   então para nossa transformação:
  // | m12  m22  dy |   dx' = m11*x + m21*y + dx = a*x + b*y + tx
  // | 0    0    1  |   dy' = m12*x + m22*y + dy = c*x + d*y + ty
  // 
  // Portanto: m11=a, m12=c, m21=b, m22=d, dx=tx, dy=ty
  ctx.transform(a, c, b, d, tx, ty)

  // Agora desenhar a imagem inteira - a transformação e o clip cuidam do resto
  ctx.drawImage(img, 0, 0)

  ctx.restore()
}
