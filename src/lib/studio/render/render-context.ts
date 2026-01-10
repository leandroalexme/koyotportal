/**
 * IRenderContext - Abstract interface for rendering operations
 * 
 * This interface mirrors the Canvas2D API but allows for different
 * backend implementations (Canvas2D native, CanvasKit/Skia, etc.)
 * 
 * Adapted from Suika Editor for Koyot Studio
 */

export interface IRenderContext {
  // State management
  save(): void
  restore(): void

  // Transformations
  transform(a: number, b: number, c: number, d: number, e: number, f: number): void
  setTransform(a: number, b: number, c: number, d: number, e: number, f: number): void
  resetTransform(): void
  scale(x: number, y: number): void
  rotate(angle: number): void
  translate(x: number, y: number): void
  getTransform(): DOMMatrix

  // Path operations
  beginPath(): void
  closePath(): void
  moveTo(x: number, y: number): void
  lineTo(x: number, y: number): void
  bezierCurveTo(cp1x: number, cp1y: number, cp2x: number, cp2y: number, x: number, y: number): void
  quadraticCurveTo(cpx: number, cpy: number, x: number, y: number): void
  arc(x: number, y: number, radius: number, startAngle: number, endAngle: number, counterclockwise?: boolean): void
  arcTo(x1: number, y1: number, x2: number, y2: number, radius: number): void
  rect(x: number, y: number, w: number, h: number): void
  roundRect(x: number, y: number, w: number, h: number, radii?: number | number[]): void
  ellipse(x: number, y: number, radiusX: number, radiusY: number, rotation: number, startAngle: number, endAngle: number, counterclockwise?: boolean): void

  // Drawing operations
  fill(fillRule?: CanvasFillRule): void
  fillPath2D(path: Path2D, fillRule?: CanvasFillRule): void
  stroke(): void
  clip(fillRule?: CanvasFillRule): void

  // Rectangles
  clearRect(x: number, y: number, w: number, h: number): void
  fillRect(x: number, y: number, w: number, h: number): void
  strokeRect(x: number, y: number, w: number, h: number): void

  // Style properties
  fillStyle: string | CanvasGradient | CanvasPattern
  strokeStyle: string | CanvasGradient | CanvasPattern
  lineWidth: number
  lineCap: CanvasLineCap
  lineJoin: CanvasLineJoin
  miterLimit: number
  globalAlpha: number
  globalCompositeOperation: GlobalCompositeOperation
  imageSmoothingEnabled: boolean

  // Line dash
  setLineDash(segments: number[]): void
  getLineDash(): number[]
  lineDashOffset: number

  // Text
  font: string
  textAlign: CanvasTextAlign
  textBaseline: CanvasTextBaseline
  fillText(text: string, x: number, y: number, maxWidth?: number): void
  strokeText(text: string, x: number, y: number, maxWidth?: number): void
  measureText(text: string): TextMetrics

  // CanvasKit-specific: draw paragraph (optional)
  drawParagraph?(paragraph: unknown, x: number, y: number): void

  // Images
  drawImage(
    image: CanvasImageSource,
    dx: number,
    dy: number,
    dw?: number,
    dh?: number,
    sx?: number,
    sy?: number,
    sw?: number,
    sh?: number,
  ): void

  // Pixel manipulation
  createImageData(width: number, height: number): ImageData
  getImageData(sx: number, sy: number, sw: number, sh: number): ImageData
  putImageData(imageData: ImageData, dx: number, dy: number): void

  // Flush pending operations
  flush(): void

  // Canvas dimensions
  readonly canvas: { width: number; height: number }

  /**
   * Indicates if this render context automatically applies device pixel ratio (DPR).
   */
  readonly appliesDPR: boolean
}

/**
 * Transform array type [a, b, c, d, e, f]
 */
export type TransformArray = [number, number, number, number, number, number]
