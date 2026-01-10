/**
 * CanvasKitRenderContext
 * 
 * Implementation of IRenderContext using CanvasKit (Skia WASM).
 * This provides GPU-accelerated 2D rendering via WebGL.
 * 
 * Adapted from Suika Editor for Koyot Studio
 */

import type {
  Canvas as SkCanvas,
  CanvasKit,
  FontMgr as SkFontMgr,
  Paint as SkPaint,
  Path as SkPath,
  Surface as SkSurface,
} from 'canvaskit-wasm'

import { type IRenderContext } from './render-context'

interface TransformState {
  matrix: number[]
  fillStyle: string
  strokeStyle: string
  lineWidth: number
  lineCap: CanvasLineCap
  lineJoin: CanvasLineJoin
  miterLimit: number
  globalAlpha: number
  globalCompositeOperation: GlobalCompositeOperation
  lineDash: number[]
  lineDashOffset: number
  font: string
  textAlign: CanvasTextAlign
  textBaseline: CanvasTextBaseline
}

export class CanvasKitRenderContext implements IRenderContext {
  private ck: CanvasKit
  private surface: SkSurface
  private skCanvas: SkCanvas
  private currentPath: SkPath
  private fillPaint: SkPaint
  private strokePaint: SkPaint
  private stateStack: TransformState[] = []

  // Font management
  private fontMgr: SkFontMgr | null = null
  private loadedFonts: Map<string, ArrayBuffer> = new Map()

  // Current state
  private _fillStyle: string = '#000000'
  private _strokeStyle: string = '#000000'
  private _lineWidth: number = 1
  private _lineCap: CanvasLineCap = 'butt'
  private _lineJoin: CanvasLineJoin = 'miter'
  private _miterLimit: number = 10
  private _globalAlpha: number = 1
  private _globalCompositeOperation: GlobalCompositeOperation = 'source-over'
  private _lineDash: number[] = []
  private _lineDashOffset: number = 0
  private _font: string = '10px sans-serif'
  private _textAlign: CanvasTextAlign = 'start'
  private _textBaseline: CanvasTextBaseline = 'alphabetic'
  private _imageSmoothingEnabled: boolean = true

  readonly canvas: { width: number; height: number }
  readonly appliesDPR = false

  constructor(canvasKit: CanvasKit, canvasElement: HTMLCanvasElement) {
    this.ck = canvasKit

    // Create WebGL surface
    const surface = canvasKit.MakeWebGLCanvasSurface(canvasElement)
    if (!surface) {
      throw new Error('[Koyot] Failed to create CanvasKit WebGL surface')
    }
    this.surface = surface
    this.skCanvas = surface.getCanvas()

    // Initialize paints
    this.fillPaint = new canvasKit.Paint()
    this.fillPaint.setStyle(canvasKit.PaintStyle.Fill)
    this.fillPaint.setAntiAlias(true)

    this.strokePaint = new canvasKit.Paint()
    this.strokePaint.setStyle(canvasKit.PaintStyle.Stroke)
    this.strokePaint.setAntiAlias(true)

    // Initialize path
    this.currentPath = new canvasKit.Path()

    // Store canvas dimensions
    this.canvas = {
      width: canvasElement.width,
      height: canvasElement.height,
    }

    // Load default font
    this.loadDefaultFont()
  }

  /**
   * Load default fonts for text rendering
   */
  private async loadDefaultFont(): Promise<void> {
    const fontUrls = [
      { name: 'Inter', url: 'https://cdn.jsdelivr.net/npm/@fontsource/inter@5.0.15/files/inter-latin-400-normal.woff' },
      { name: 'Inter-Bold', url: 'https://cdn.jsdelivr.net/npm/@fontsource/inter@5.0.15/files/inter-latin-700-normal.woff' },
    ]

    try {
      for (const font of fontUrls) {
        try {
          const response = await fetch(font.url, { mode: 'cors' })
          if (response.ok) {
            const fontData = await response.arrayBuffer()
            this.loadedFonts.set(font.name, fontData)
          }
        } catch {
          // Silently fail for individual fonts
        }
      }

      if (this.loadedFonts.size > 0) {
        await this.initializeFontManager()
      }
    } catch (error) {
      console.warn('[Koyot] Failed to load default fonts:', error)
    }
  }

  private async initializeFontManager(): Promise<void> {
    if (this.loadedFonts.size === 0) return

    const fontDataArray = Array.from(this.loadedFonts.values())
    this.fontMgr = this.ck.FontMgr.FromData(...fontDataArray) ?? null

    if (!this.fontMgr) {
      console.warn('[Koyot] Failed to create FontMgr from font data')
    }
  }

  // ============ State Management ============

  save(): void {
    this.skCanvas.save()
    this.stateStack.push({
      matrix: this.skCanvas.getTotalMatrix(),
      fillStyle: this._fillStyle,
      strokeStyle: this._strokeStyle,
      lineWidth: this._lineWidth,
      lineCap: this._lineCap,
      lineJoin: this._lineJoin,
      miterLimit: this._miterLimit,
      globalAlpha: this._globalAlpha,
      globalCompositeOperation: this._globalCompositeOperation,
      lineDash: [...this._lineDash],
      lineDashOffset: this._lineDashOffset,
      font: this._font,
      textAlign: this._textAlign,
      textBaseline: this._textBaseline,
    })
  }

  restore(): void {
    this.skCanvas.restore()
    const state = this.stateStack.pop()
    if (state) {
      this._fillStyle = state.fillStyle
      this._strokeStyle = state.strokeStyle
      this._lineWidth = state.lineWidth
      this._lineCap = state.lineCap
      this._lineJoin = state.lineJoin
      this._miterLimit = state.miterLimit
      this._globalAlpha = state.globalAlpha
      this._globalCompositeOperation = state.globalCompositeOperation
      this._lineDash = state.lineDash
      this._lineDashOffset = state.lineDashOffset
      this._font = state.font
      this._textAlign = state.textAlign
      this._textBaseline = state.textBaseline
      this.updatePaints()
    }
  }

  // ============ Transformations ============

  transform(a: number, b: number, c: number, d: number, e: number, f: number): void {
    const matrix = [a, c, e, b, d, f, 0, 0, 1]
    this.skCanvas.concat(matrix)
  }

  setTransform(a: number, b: number, c: number, d: number, e: number, f: number): void {
    const currentMatrix = this.skCanvas.getTotalMatrix()
    const det = currentMatrix[0] * currentMatrix[4] - currentMatrix[1] * currentMatrix[3]
    if (Math.abs(det) > 1e-10) {
      const invDet = 1 / det
      const invMatrix = [
        currentMatrix[4] * invDet,
        -currentMatrix[1] * invDet,
        (currentMatrix[1] * currentMatrix[5] - currentMatrix[4] * currentMatrix[2]) * invDet,
        -currentMatrix[3] * invDet,
        currentMatrix[0] * invDet,
        (currentMatrix[3] * currentMatrix[2] - currentMatrix[0] * currentMatrix[5]) * invDet,
        0, 0, 1,
      ]
      this.skCanvas.concat(invMatrix)
    }
    this.transform(a, b, c, d, e, f)
  }

  resetTransform(): void {
    const currentMatrix = this.skCanvas.getTotalMatrix()
    const det = currentMatrix[0] * currentMatrix[4] - currentMatrix[1] * currentMatrix[3]
    if (Math.abs(det) > 1e-10) {
      const invDet = 1 / det
      const invMatrix = [
        currentMatrix[4] * invDet,
        -currentMatrix[1] * invDet,
        (currentMatrix[1] * currentMatrix[5] - currentMatrix[4] * currentMatrix[2]) * invDet,
        -currentMatrix[3] * invDet,
        currentMatrix[0] * invDet,
        (currentMatrix[3] * currentMatrix[2] - currentMatrix[0] * currentMatrix[5]) * invDet,
        0, 0, 1,
      ]
      this.skCanvas.concat(invMatrix)
    }
  }

  scale(x: number, y: number): void {
    this.skCanvas.scale(x, y)
  }

  rotate(angle: number): void {
    this.skCanvas.rotate((angle * 180) / Math.PI, 0, 0)
  }

  translate(x: number, y: number): void {
    this.skCanvas.translate(x, y)
  }

  getTransform(): DOMMatrix {
    const m = this.skCanvas.getTotalMatrix()
    return new DOMMatrix([m[0], m[3], m[1], m[4], m[2], m[5]])
  }

  // ============ Path Operations ============

  beginPath(): void {
    this.currentPath.delete()
    this.currentPath = new this.ck.Path()
  }

  closePath(): void {
    this.currentPath.close()
  }

  moveTo(x: number, y: number): void {
    this.currentPath.moveTo(x, y)
  }

  lineTo(x: number, y: number): void {
    this.currentPath.lineTo(x, y)
  }

  bezierCurveTo(cp1x: number, cp1y: number, cp2x: number, cp2y: number, x: number, y: number): void {
    this.currentPath.cubicTo(cp1x, cp1y, cp2x, cp2y, x, y)
  }

  quadraticCurveTo(cpx: number, cpy: number, x: number, y: number): void {
    this.currentPath.quadTo(cpx, cpy, x, y)
  }

  arc(x: number, y: number, radius: number, startAngle: number, endAngle: number, counterclockwise?: boolean): void {
    const startDeg = (startAngle * 180) / Math.PI
    let sweepDeg = ((endAngle - startAngle) * 180) / Math.PI

    if (counterclockwise && sweepDeg > 0) {
      sweepDeg -= 360
    } else if (!counterclockwise && sweepDeg < 0) {
      sweepDeg += 360
    }

    const rect = this.ck.LTRBRect(x - radius, y - radius, x + radius, y + radius)
    this.currentPath.arcToOval(rect, startDeg, sweepDeg, false)
  }

  arcTo(x1: number, y1: number, x2: number, y2: number, radius: number): void {
    this.currentPath.arcToTangent(x1, y1, x2, y2, radius)
  }

  rect(x: number, y: number, w: number, h: number): void {
    this.currentPath.addRect(this.ck.XYWHRect(x, y, w, h))
  }

  roundRect(x: number, y: number, w: number, h: number, radii?: number | number[]): void {
    if (radii === undefined || radii === 0) {
      this.rect(x, y, w, h)
      return
    }

    const r = typeof radii === 'number' ? radii : radii[0] ?? 0
    const rrect = this.ck.RRectXY(this.ck.XYWHRect(x, y, w, h), r, r)
    this.currentPath.addRRect(rrect)
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
    const rect = this.ck.LTRBRect(x - radiusX, y - radiusY, x + radiusX, y + radiusY)
    const startDeg = (startAngle * 180) / Math.PI
    let sweepDeg = ((endAngle - startAngle) * 180) / Math.PI

    if (counterclockwise && sweepDeg > 0) {
      sweepDeg -= 360
    } else if (!counterclockwise && sweepDeg < 0) {
      sweepDeg += 360
    }

    if (rotation !== 0) {
      const tempPath = new this.ck.Path()
      tempPath.addArc(rect, startDeg, sweepDeg)
      const rotMatrix = this.ck.Matrix.rotated(rotation, x, y)
      tempPath.transform(rotMatrix)
      this.currentPath.addPath(tempPath)
      tempPath.delete()
    } else {
      this.currentPath.addArc(rect, startDeg, sweepDeg)
    }
  }

  // ============ Drawing Operations ============

  fill(fillRule?: CanvasFillRule): void {
    this.updateFillPaint()
    if (fillRule === 'evenodd') {
      this.currentPath.setFillType(this.ck.FillType.EvenOdd)
    } else {
      this.currentPath.setFillType(this.ck.FillType.Winding)
    }
    this.skCanvas.drawPath(this.currentPath, this.fillPaint)
  }

  fillPath2D(path: Path2D, fillRule?: CanvasFillRule): void {
    const skPath = this.convertPath2DToSkPath(path)
    if (skPath) {
      if (fillRule === 'evenodd') {
        skPath.setFillType(this.ck.FillType.EvenOdd)
      }
      this.updateFillPaint()
      this.skCanvas.drawPath(skPath, this.fillPaint)
      skPath.delete()
    }
  }

  private convertPath2DToSkPath(path2d: Path2D): SkPath | null {
    const pathStr = (path2d as unknown as { _svgPath?: string })._svgPath
    if (pathStr && typeof pathStr === 'string') {
      return this.ck.Path.MakeFromSVGString(pathStr)
    }
    return null
  }

  stroke(): void {
    this.updateStrokePaint()
    this.skCanvas.drawPath(this.currentPath, this.strokePaint)
  }

  clip(fillRule?: CanvasFillRule): void {
    if (fillRule === 'evenodd') {
      this.currentPath.setFillType(this.ck.FillType.EvenOdd)
    }
    this.skCanvas.clipPath(this.currentPath, this.ck.ClipOp.Intersect, true)
  }

  // ============ Rectangles ============

  clearRect(x: number, y: number, w: number, h: number): void {
    const paint = new this.ck.Paint()
    paint.setBlendMode(this.ck.BlendMode.Clear)
    this.skCanvas.drawRect(this.ck.XYWHRect(x, y, w, h), paint)
    paint.delete()
  }

  fillRect(x: number, y: number, w: number, h: number): void {
    this.updateFillPaint()
    this.skCanvas.drawRect(this.ck.XYWHRect(x, y, w, h), this.fillPaint)
  }

  strokeRect(x: number, y: number, w: number, h: number): void {
    this.updateStrokePaint()
    this.skCanvas.drawRect(this.ck.XYWHRect(x, y, w, h), this.strokePaint)
  }

  // ============ Style Properties ============

  get fillStyle(): string {
    return this._fillStyle
  }

  set fillStyle(value: string | CanvasGradient | CanvasPattern) {
    if (typeof value === 'string') {
      this._fillStyle = value
    }
  }

  get strokeStyle(): string {
    return this._strokeStyle
  }

  set strokeStyle(value: string | CanvasGradient | CanvasPattern) {
    if (typeof value === 'string') {
      this._strokeStyle = value
    }
  }

  get lineWidth(): number {
    return this._lineWidth
  }

  set lineWidth(value: number) {
    this._lineWidth = value
  }

  get lineCap(): CanvasLineCap {
    return this._lineCap
  }

  set lineCap(value: CanvasLineCap) {
    this._lineCap = value
  }

  get lineJoin(): CanvasLineJoin {
    return this._lineJoin
  }

  set lineJoin(value: CanvasLineJoin) {
    this._lineJoin = value
  }

  get miterLimit(): number {
    return this._miterLimit
  }

  set miterLimit(value: number) {
    this._miterLimit = value
  }

  get globalAlpha(): number {
    return this._globalAlpha
  }

  set globalAlpha(value: number) {
    this._globalAlpha = Math.max(0, Math.min(1, value))
  }

  get globalCompositeOperation(): GlobalCompositeOperation {
    return this._globalCompositeOperation
  }

  set globalCompositeOperation(value: GlobalCompositeOperation) {
    this._globalCompositeOperation = value
  }

  get imageSmoothingEnabled(): boolean {
    return this._imageSmoothingEnabled
  }

  set imageSmoothingEnabled(value: boolean) {
    this._imageSmoothingEnabled = value
  }

  // ============ Line Dash ============

  setLineDash(segments: number[]): void {
    this._lineDash = [...segments]
  }

  getLineDash(): number[] {
    return [...this._lineDash]
  }

  get lineDashOffset(): number {
    return this._lineDashOffset
  }

  set lineDashOffset(value: number) {
    this._lineDashOffset = value
  }

  // ============ Text ============

  get font(): string {
    return this._font
  }

  set font(value: string) {
    this._font = value
  }

  get textAlign(): CanvasTextAlign {
    return this._textAlign
  }

  set textAlign(value: CanvasTextAlign) {
    this._textAlign = value
  }

  get textBaseline(): CanvasTextBaseline {
    return this._textBaseline
  }

  set textBaseline(value: CanvasTextBaseline) {
    this._textBaseline = value
  }

  async loadFont(fontFamily: string, fontData: ArrayBuffer): Promise<void> {
    this.loadedFonts.set(fontFamily, fontData)
    await this.initializeFontManager()
  }

  fillText(text: string, x: number, y: number, _maxWidth?: number): void {
    if (!this.fontMgr) {
      this.drawSimpleText(text, x, y)
      return
    }

    const parsed = this.parseFontString(this._font)

    const paraStyle = new this.ck.ParagraphStyle({
      textStyle: {
        color: this.parseColor(this._fillStyle),
        fontFamilies: [parsed.family, 'Inter', 'sans-serif'],
        fontSize: parsed.size,
        fontStyle: { weight: this.mapFontWeight(parsed.weight) },
      },
      textAlign: this.getSkTextAlign(),
    })

    const builder = this.ck.ParagraphBuilder.Make(paraStyle, this.fontMgr)
    builder.addText(text)
    const paragraph = builder.build()
    paragraph.layout(_maxWidth ?? 10000)

    let adjustedY = y
    const metrics = paragraph.getLineMetrics()
    if (metrics.length > 0) {
      const lineMetrics = metrics[0]
      switch (this._textBaseline) {
        case 'top':
          adjustedY = y
          break
        case 'middle':
          adjustedY = y - lineMetrics.height / 2
          break
        case 'bottom':
          adjustedY = y - lineMetrics.height
          break
        case 'alphabetic':
        default:
          adjustedY = y - lineMetrics.ascent
          break
      }
    }

    let adjustedX = x
    const width = paragraph.getMaxWidth()
    switch (this._textAlign) {
      case 'center':
        adjustedX = x - width / 2
        break
      case 'right':
      case 'end':
        adjustedX = x - width
        break
    }

    this.skCanvas.drawParagraph(paragraph, adjustedX, adjustedY)
    paragraph.delete()
    builder.delete()
  }

  strokeText(text: string, x: number, y: number, _maxWidth?: number): void {
    // Stroke text is complex in CanvasKit, fallback to fill for now
    this.fillText(text, x, y, _maxWidth)
  }

  measureText(text: string): TextMetrics {
    if (!this.fontMgr) {
      return { width: text.length * 8 } as TextMetrics
    }

    const parsed = this.parseFontString(this._font)
    const paraStyle = new this.ck.ParagraphStyle({
      textStyle: {
        fontFamilies: [parsed.family, 'Inter', 'sans-serif'],
        fontSize: parsed.size,
      },
    })

    const builder = this.ck.ParagraphBuilder.Make(paraStyle, this.fontMgr)
    builder.addText(text)
    const paragraph = builder.build()
    paragraph.layout(100000)

    const width = paragraph.getMaxWidth()
    paragraph.delete()
    builder.delete()

    return { width } as TextMetrics
  }

  drawParagraph(paragraph: unknown, x: number, y: number): void {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this.skCanvas.drawParagraph(paragraph as any, x, y)
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
    // For CanvasKit, we need to convert image to SkImage first
    // This is a simplified implementation
    if (image instanceof HTMLImageElement || image instanceof HTMLCanvasElement) {
      const canvas = image instanceof HTMLCanvasElement ? image : this.imageToCanvas(image)
      const imageData = canvas.getContext('2d')?.getImageData(0, 0, canvas.width, canvas.height)
      if (!imageData) return

      const skImage = this.ck.MakeImage(
        {
          width: canvas.width,
          height: canvas.height,
          alphaType: this.ck.AlphaType.Unpremul,
          colorType: this.ck.ColorType.RGBA_8888,
          colorSpace: this.ck.ColorSpace.SRGB,
        },
        imageData.data,
        canvas.width * 4,
      )

      if (skImage) {
        const paint = new this.ck.Paint()
        paint.setAlphaf(this._globalAlpha)

        if (sx !== undefined && sy !== undefined && sw !== undefined && sh !== undefined && dw !== undefined && dh !== undefined) {
          const srcRect = this.ck.XYWHRect(sx, sy, sw, sh)
          const dstRect = this.ck.XYWHRect(dx, dy, dw, dh)
          this.skCanvas.drawImageRect(skImage, srcRect, dstRect, paint)
        } else if (dw !== undefined && dh !== undefined) {
          const dstRect = this.ck.XYWHRect(dx, dy, dw, dh)
          const srcRect = this.ck.XYWHRect(0, 0, canvas.width, canvas.height)
          this.skCanvas.drawImageRect(skImage, srcRect, dstRect, paint)
        } else {
          this.skCanvas.drawImage(skImage, dx, dy, paint)
        }

        paint.delete()
        skImage.delete()
      }
    }
  }

  private imageToCanvas(image: HTMLImageElement): HTMLCanvasElement {
    const canvas = document.createElement('canvas')
    canvas.width = image.naturalWidth || image.width
    canvas.height = image.naturalHeight || image.height
    const ctx = canvas.getContext('2d')!
    ctx.drawImage(image, 0, 0)
    return canvas
  }

  // ============ Pixel Manipulation ============

  createImageData(width: number, height: number): ImageData {
    return new ImageData(width, height)
  }

  getImageData(sx: number, sy: number, sw: number, sh: number): ImageData {
    // CanvasKit doesn't support direct pixel reading like Canvas2D
    // Return empty ImageData as fallback
    console.warn('[Koyot] getImageData is not fully supported in CanvasKit mode')
    return new ImageData(sw, sh)
  }

  putImageData(imageData: ImageData, dx: number, dy: number): void {
    const skImage = this.ck.MakeImage(
      {
        width: imageData.width,
        height: imageData.height,
        alphaType: this.ck.AlphaType.Unpremul,
        colorType: this.ck.ColorType.RGBA_8888,
        colorSpace: this.ck.ColorSpace.SRGB,
      },
      imageData.data,
      imageData.width * 4,
    )

    if (skImage) {
      const paint = new this.ck.Paint()
      this.skCanvas.drawImage(skImage, dx, dy, paint)
      paint.delete()
      skImage.delete()
    }
  }

  // ============ CanvasKit Specific ============

  flush(): void {
    this.surface.flush()
  }

  /**
   * Get the underlying CanvasKit instance
   */
  getCanvasKit(): CanvasKit {
    return this.ck
  }

  /**
   * Get the Skia surface
   */
  getSurface(): SkSurface {
    return this.surface
  }

  /**
   * Get the Skia canvas
   */
  getSkCanvas(): SkCanvas {
    return this.skCanvas
  }

  // ============ Private Helpers ============

  private updatePaints(): void {
    this.updateFillPaint()
    this.updateStrokePaint()
  }

  private updateFillPaint(): void {
    this.fillPaint.setColor(this.parseColor(this._fillStyle))
    this.fillPaint.setAlphaf(this._globalAlpha)
    this.fillPaint.setBlendMode(this.mapBlendMode(this._globalCompositeOperation))
  }

  private updateStrokePaint(): void {
    this.strokePaint.setColor(this.parseColor(this._strokeStyle))
    this.strokePaint.setStrokeWidth(this._lineWidth)
    this.strokePaint.setAlphaf(this._globalAlpha)
    this.strokePaint.setBlendMode(this.mapBlendMode(this._globalCompositeOperation))
    this.strokePaint.setStrokeCap(this.mapStrokeCap(this._lineCap))
    this.strokePaint.setStrokeJoin(this.mapStrokeJoin(this._lineJoin))
    this.strokePaint.setStrokeMiter(this._miterLimit)

    if (this._lineDash.length > 0) {
      const effect = this.ck.PathEffect.MakeDash(this._lineDash, this._lineDashOffset)
      this.strokePaint.setPathEffect(effect)
    } else {
      this.strokePaint.setPathEffect(null)
    }
  }

  private parseColor(color: string): Float32Array {
    // Parse CSS color string to CanvasKit color
    if (color.startsWith('#')) {
      const hex = color.slice(1)
      if (hex.length === 3) {
        const r = parseInt(hex[0] + hex[0], 16) / 255
        const g = parseInt(hex[1] + hex[1], 16) / 255
        const b = parseInt(hex[2] + hex[2], 16) / 255
        return this.ck.Color4f(r, g, b, 1)
      } else if (hex.length === 6) {
        const r = parseInt(hex.slice(0, 2), 16) / 255
        const g = parseInt(hex.slice(2, 4), 16) / 255
        const b = parseInt(hex.slice(4, 6), 16) / 255
        return this.ck.Color4f(r, g, b, 1)
      } else if (hex.length === 8) {
        const r = parseInt(hex.slice(0, 2), 16) / 255
        const g = parseInt(hex.slice(2, 4), 16) / 255
        const b = parseInt(hex.slice(4, 6), 16) / 255
        const a = parseInt(hex.slice(6, 8), 16) / 255
        return this.ck.Color4f(r, g, b, a)
      }
    }

    // Parse rgba/rgb
    const rgbaMatch = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/)
    if (rgbaMatch) {
      const r = parseInt(rgbaMatch[1]) / 255
      const g = parseInt(rgbaMatch[2]) / 255
      const b = parseInt(rgbaMatch[3]) / 255
      const a = rgbaMatch[4] ? parseFloat(rgbaMatch[4]) : 1
      return this.ck.Color4f(r, g, b, a)
    }

    // Default to black
    return this.ck.Color4f(0, 0, 0, 1)
  }

  private parseFontString(font: string): { size: number; family: string; weight: number } {
    const match = font.match(/^(?:(\d+)\s+)?(\d+)px\s+(.+)$/)
    if (match) {
      return {
        weight: match[1] ? parseInt(match[1]) : 400,
        size: parseInt(match[2]),
        family: match[3].replace(/["']/g, ''),
      }
    }
    return { size: 10, family: 'sans-serif', weight: 400 }
  }

  private mapFontWeight(weight: number): { value: number } {
    return { value: weight }
  }

  private getSkTextAlign() {
    const alignMap: Record<string, unknown> = {
      left: this.ck.TextAlign.Left,
      right: this.ck.TextAlign.Right,
      center: this.ck.TextAlign.Center,
      start: this.ck.TextAlign.Left,
      end: this.ck.TextAlign.Right,
    }
    return alignMap[this._textAlign] || this.ck.TextAlign.Left
  }

  private mapBlendMode(mode: GlobalCompositeOperation) {
    const modeMap: Record<string, unknown> = {
      'source-over': this.ck.BlendMode.SrcOver,
      'source-in': this.ck.BlendMode.SrcIn,
      'source-out': this.ck.BlendMode.SrcOut,
      'source-atop': this.ck.BlendMode.SrcATop,
      'destination-over': this.ck.BlendMode.DstOver,
      'destination-in': this.ck.BlendMode.DstIn,
      'destination-out': this.ck.BlendMode.DstOut,
      'destination-atop': this.ck.BlendMode.DstATop,
      'lighter': this.ck.BlendMode.Plus,
      'copy': this.ck.BlendMode.Src,
      'xor': this.ck.BlendMode.Xor,
      'multiply': this.ck.BlendMode.Multiply,
      'screen': this.ck.BlendMode.Screen,
      'overlay': this.ck.BlendMode.Overlay,
      'darken': this.ck.BlendMode.Darken,
      'lighten': this.ck.BlendMode.Lighten,
      'color-dodge': this.ck.BlendMode.ColorDodge,
      'color-burn': this.ck.BlendMode.ColorBurn,
      'hard-light': this.ck.BlendMode.HardLight,
      'soft-light': this.ck.BlendMode.SoftLight,
      'difference': this.ck.BlendMode.Difference,
      'exclusion': this.ck.BlendMode.Exclusion,
      'hue': this.ck.BlendMode.Hue,
      'saturation': this.ck.BlendMode.Saturation,
      'color': this.ck.BlendMode.Color,
      'luminosity': this.ck.BlendMode.Luminosity,
    }
    return modeMap[mode] || this.ck.BlendMode.SrcOver
  }

  private mapStrokeCap(cap: CanvasLineCap) {
    const capMap: Record<string, unknown> = {
      butt: this.ck.StrokeCap.Butt,
      round: this.ck.StrokeCap.Round,
      square: this.ck.StrokeCap.Square,
    }
    return capMap[cap] || this.ck.StrokeCap.Butt
  }

  private mapStrokeJoin(join: CanvasLineJoin) {
    const joinMap: Record<string, unknown> = {
      miter: this.ck.StrokeJoin.Miter,
      round: this.ck.StrokeJoin.Round,
      bevel: this.ck.StrokeJoin.Bevel,
    }
    return joinMap[join] || this.ck.StrokeJoin.Miter
  }

  private drawSimpleText(text: string, x: number, y: number): void {
    // Fallback for when fonts are not loaded
    const paint = new this.ck.Paint()
    paint.setColor(this.parseColor(this._fillStyle))
    paint.setAntiAlias(true)

    const font = new this.ck.Font(null, 12)
    this.skCanvas.drawText(text, x, y, paint, font)

    paint.delete()
    font.delete()
  }

  /**
   * Destroy and cleanup resources
   */
  destroy(): void {
    this.currentPath.delete()
    this.fillPaint.delete()
    this.strokePaint.delete()
    this.surface.delete()
  }
}
