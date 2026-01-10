/**
 * Canvas2DRenderContext
 * 
 * Wrapper around native CanvasRenderingContext2D that implements IRenderContext.
 * This provides a fallback and maintains backward compatibility.
 * 
 * Adapted from Suika Editor for Koyot Studio
 */

import { type IRenderContext } from './render-context'

export class Canvas2DRenderContext implements IRenderContext {
  private ctx: CanvasRenderingContext2D

  readonly canvas: { width: number; height: number }
  readonly appliesDPR = false

  constructor(ctx: CanvasRenderingContext2D) {
    this.ctx = ctx
    this.canvas = {
      width: ctx.canvas.width,
      height: ctx.canvas.height,
    }
  }

  // ============ State Management ============

  save(): void {
    this.ctx.save()
  }

  restore(): void {
    this.ctx.restore()
  }

  // ============ Transformations ============

  transform(a: number, b: number, c: number, d: number, e: number, f: number): void {
    this.ctx.transform(a, b, c, d, e, f)
  }

  setTransform(a: number, b: number, c: number, d: number, e: number, f: number): void {
    this.ctx.setTransform(a, b, c, d, e, f)
  }

  resetTransform(): void {
    this.ctx.resetTransform()
  }

  scale(x: number, y: number): void {
    this.ctx.scale(x, y)
  }

  rotate(angle: number): void {
    this.ctx.rotate(angle)
  }

  translate(x: number, y: number): void {
    this.ctx.translate(x, y)
  }

  getTransform(): DOMMatrix {
    return this.ctx.getTransform()
  }

  // ============ Path Operations ============

  beginPath(): void {
    this.ctx.beginPath()
  }

  closePath(): void {
    this.ctx.closePath()
  }

  moveTo(x: number, y: number): void {
    this.ctx.moveTo(x, y)
  }

  lineTo(x: number, y: number): void {
    this.ctx.lineTo(x, y)
  }

  bezierCurveTo(cp1x: number, cp1y: number, cp2x: number, cp2y: number, x: number, y: number): void {
    this.ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, x, y)
  }

  quadraticCurveTo(cpx: number, cpy: number, x: number, y: number): void {
    this.ctx.quadraticCurveTo(cpx, cpy, x, y)
  }

  arc(x: number, y: number, radius: number, startAngle: number, endAngle: number, counterclockwise?: boolean): void {
    this.ctx.arc(x, y, radius, startAngle, endAngle, counterclockwise)
  }

  arcTo(x1: number, y1: number, x2: number, y2: number, radius: number): void {
    this.ctx.arcTo(x1, y1, x2, y2, radius)
  }

  rect(x: number, y: number, w: number, h: number): void {
    this.ctx.rect(x, y, w, h)
  }

  roundRect(x: number, y: number, w: number, h: number, radii?: number | number[]): void {
    this.ctx.roundRect(x, y, w, h, radii)
  }

  ellipse(
    x: number,
    y: number,
    radiusX: number,
    radiusY: number,
    rotation: number,
    startAngle: number,
    endAngle: number,
    counterclockwise?: boolean,
  ): void {
    this.ctx.ellipse(x, y, radiusX, radiusY, rotation, startAngle, endAngle, counterclockwise)
  }

  // ============ Drawing Operations ============

  fill(fillRule?: CanvasFillRule): void {
    this.ctx.fill(fillRule)
  }

  fillPath2D(path: Path2D, fillRule?: CanvasFillRule): void {
    this.ctx.fill(path, fillRule)
  }

  stroke(): void {
    this.ctx.stroke()
  }

  clip(fillRule?: CanvasFillRule): void {
    this.ctx.clip(fillRule)
  }

  // ============ Rectangles ============

  clearRect(x: number, y: number, w: number, h: number): void {
    this.ctx.clearRect(x, y, w, h)
  }

  fillRect(x: number, y: number, w: number, h: number): void {
    this.ctx.fillRect(x, y, w, h)
  }

  strokeRect(x: number, y: number, w: number, h: number): void {
    this.ctx.strokeRect(x, y, w, h)
  }

  // ============ Style Properties ============

  get fillStyle(): string | CanvasGradient | CanvasPattern {
    return this.ctx.fillStyle
  }

  set fillStyle(value: string | CanvasGradient | CanvasPattern) {
    this.ctx.fillStyle = value
  }

  get strokeStyle(): string | CanvasGradient | CanvasPattern {
    return this.ctx.strokeStyle
  }

  set strokeStyle(value: string | CanvasGradient | CanvasPattern) {
    this.ctx.strokeStyle = value
  }

  get lineWidth(): number {
    return this.ctx.lineWidth
  }

  set lineWidth(value: number) {
    this.ctx.lineWidth = value
  }

  get lineCap(): CanvasLineCap {
    return this.ctx.lineCap
  }

  set lineCap(value: CanvasLineCap) {
    this.ctx.lineCap = value
  }

  get lineJoin(): CanvasLineJoin {
    return this.ctx.lineJoin
  }

  set lineJoin(value: CanvasLineJoin) {
    this.ctx.lineJoin = value
  }

  get miterLimit(): number {
    return this.ctx.miterLimit
  }

  set miterLimit(value: number) {
    this.ctx.miterLimit = value
  }

  get globalAlpha(): number {
    return this.ctx.globalAlpha
  }

  set globalAlpha(value: number) {
    this.ctx.globalAlpha = value
  }

  get globalCompositeOperation(): GlobalCompositeOperation {
    return this.ctx.globalCompositeOperation
  }

  set globalCompositeOperation(value: GlobalCompositeOperation) {
    this.ctx.globalCompositeOperation = value
  }

  get imageSmoothingEnabled(): boolean {
    return this.ctx.imageSmoothingEnabled
  }

  set imageSmoothingEnabled(value: boolean) {
    this.ctx.imageSmoothingEnabled = value
  }

  // ============ Line Dash ============

  setLineDash(segments: number[]): void {
    this.ctx.setLineDash(segments)
  }

  getLineDash(): number[] {
    return this.ctx.getLineDash()
  }

  get lineDashOffset(): number {
    return this.ctx.lineDashOffset
  }

  set lineDashOffset(value: number) {
    this.ctx.lineDashOffset = value
  }

  // ============ Text ============

  get font(): string {
    return this.ctx.font
  }

  set font(value: string) {
    this.ctx.font = value
  }

  get textAlign(): CanvasTextAlign {
    return this.ctx.textAlign
  }

  set textAlign(value: CanvasTextAlign) {
    this.ctx.textAlign = value
  }

  get textBaseline(): CanvasTextBaseline {
    return this.ctx.textBaseline
  }

  set textBaseline(value: CanvasTextBaseline) {
    this.ctx.textBaseline = value
  }

  fillText(text: string, x: number, y: number, maxWidth?: number): void {
    this.ctx.fillText(text, x, y, maxWidth)
  }

  strokeText(text: string, x: number, y: number, maxWidth?: number): void {
    this.ctx.strokeText(text, x, y, maxWidth)
  }

  measureText(text: string): TextMetrics {
    return this.ctx.measureText(text)
  }

  // ============ Images ============

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
  ): void {
    if (sx !== undefined && sy !== undefined && sw !== undefined && sh !== undefined) {
      this.ctx.drawImage(image, sx, sy, sw, sh, dx, dy, dw!, dh!)
    } else if (dw !== undefined && dh !== undefined) {
      this.ctx.drawImage(image, dx, dy, dw, dh)
    } else {
      this.ctx.drawImage(image, dx, dy)
    }
  }

  // ============ Pixel Manipulation ============

  createImageData(width: number, height: number): ImageData {
    return this.ctx.createImageData(width, height)
  }

  getImageData(sx: number, sy: number, sw: number, sh: number): ImageData {
    return this.ctx.getImageData(sx, sy, sw, sh)
  }

  putImageData(imageData: ImageData, dx: number, dy: number): void {
    this.ctx.putImageData(imageData, dx, dy)
  }

  // ============ Canvas2D Specific ============

  flush(): void {
    // No-op for Canvas2D - operations are immediate
  }

  /**
   * Get the underlying CanvasRenderingContext2D
   */
  getNativeContext(): CanvasRenderingContext2D {
    return this.ctx
  }
}
