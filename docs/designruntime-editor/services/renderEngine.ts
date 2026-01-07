
import { Color, SceneNode, LayoutMap, ExportOptions, Page } from '../types';
import { jsPDF } from 'jspdf';
import JSZip from 'jszip';
import { calculateLayout } from './layoutEngine'; // Need layout engine for batch export calculations

declare const CanvasKitInit: any;

interface TextMeasurement {
  width: number;
  height: number;
}

interface TextStyle {
  fontSize: number;
  fontWeight: number;
  fontFamily: string;
  lineHeight: number;
  letterSpacing?: number;
}

interface RenderContext {
    canvas: any;
    layout: LayoutMap;
    selectedId?: string | null;
    scale?: number;
}

class RenderEngineService {
  public ck: any = null; // CanvasKit Instance
  public fontMgr: any = null; // SkFontMgr
  public typeFace: any = null; // Primary Typeface (Inter)
  public isReady: boolean = false;
  public hasFonts: boolean = false; // New flag to track if fonts loaded successfully
  
  private imageCache: Map<string, any> = new Map(); // Cache SkImage
  private imageLoadingPromises: Map<string, Promise<void>> = new Map();

  constructor() {}

  async init() {
    if (this.isReady) return;

    // Retry loop for CanvasKitInit availability (in case script is slow)
    let retries = 0;
    while (typeof CanvasKitInit === 'undefined' && retries < 20) {
        await new Promise(r => setTimeout(r, 200));
        retries++;
    }

    if (typeof CanvasKitInit === 'undefined') {
      throw new Error("CanvasKitInit not found. The WASM script failed to load.");
    }

    try {
      // 1. Init WebAssembly
      this.ck = await CanvasKitInit({
        locateFile: (file: string) => `https://unpkg.com/canvaskit-wasm@0.39.1/bin/${file}`,
      });

      // 2. Load Fonts
      const fonts = [
          // Inter
          { name: 'Inter Regular', url: 'https://cdn.jsdelivr.net/npm/@fontsource/inter@5.0.15/files/inter-latin-400-normal.woff' },
          { name: 'Inter Bold', url: 'https://cdn.jsdelivr.net/npm/@fontsource/inter@5.0.15/files/inter-latin-700-normal.woff' },
          // Playfair Display
          { name: 'Playfair Regular', url: 'https://cdn.jsdelivr.net/npm/@fontsource/playfair-display@5.0.15/files/playfair-display-latin-400-normal.woff' },
          { name: 'Playfair Bold', url: 'https://cdn.jsdelivr.net/npm/@fontsource/playfair-display@5.0.15/files/playfair-display-latin-700-normal.woff' }
      ];

      const fontBuffers: ArrayBuffer[] = [];
      
      const results = await Promise.allSettled(fonts.map(async (font) => {
          console.log(`RenderEngine: Fetching ${font.name}...`);
          const res = await fetch(font.url, { mode: 'cors' });
          if (!res.ok) throw new Error(`Status ${res.status}`);
          return await res.arrayBuffer();
      }));

      results.forEach((result, index) => {
          if (result.status === 'fulfilled') {
              fontBuffers.push(result.value);
          } else {
              console.warn(`RenderEngine: Failed to load ${fonts[index].name} (${fonts[index].url})`, result.reason);
          }
      });

      if (fontBuffers.length > 0) {
          try {
              this.fontMgr = this.ck.FontMgr.FromData(fontBuffers);
              this.hasFonts = true;
          } catch (e) {
              console.error("RenderEngine: Font buffer loaded but failed to parse", e);
          }
      }

      this.isReady = true;
      console.log("🎨 RenderEngine: Initialized");

    } catch (e) {
      console.error("RenderEngine Init Failed", e);
      throw e;
    }
  }

  // --- Image Handling ---
  getCachedImage(src: string): any | null {
    return this.imageCache.get(src) || null;
  }

  async loadImage(src: string): Promise<void> {
    if (this.imageCache.has(src)) return;
    if (this.imageLoadingPromises.has(src)) return this.imageLoadingPromises.get(src);

    const promise = (async () => {
      try {
        const res = await fetch(src, { mode: 'cors', credentials: 'omit' });
        if (!res.ok) throw new Error("Image fetch failed");
        const buffer = await res.arrayBuffer();
        const img = this.ck.MakeImageFromEncoded(buffer);
        if (img) {
          this.imageCache.set(src, img);
        }
      } catch (e) {
        console.warn(`Failed to load image: ${src}`, e);
      } finally {
        this.imageLoadingPromises.delete(src);
      }
    })();

    this.imageLoadingPromises.set(src, promise);
    return promise;
  }

  // --- Text Measurement ---
  measureText(text: string, style: TextStyle, maxWidth?: number): TextMeasurement {
    if (!this.isReady || !this.ck || !this.hasFonts || !this.fontMgr) {
      return { 
        width: Math.min(text.length * style.fontSize * 0.6, maxWidth || 10000), 
        height: style.fontSize * style.lineHeight 
      };
    }

    const paraStyle = new this.ck.ParagraphStyle({
      textStyle: {
        fontSize: style.fontSize,
        fontFamilies: [style.fontFamily, 'Inter', 'Playfair Display', 'Roboto', 'sans-serif'], 
        fontStyle: {
          weight: style.fontWeight === 700 ? this.ck.FontWeight.Bold : 
                  style.fontWeight === 500 ? this.ck.FontWeight.Medium : 
                  this.ck.FontWeight.Normal,
        },
        heightMultiplier: style.lineHeight
      },
    });

    const builder = this.ck.ParagraphBuilder.Make(paraStyle, this.fontMgr);
    builder.addText(text);
    const paragraph = builder.build();
    paragraph.layout(maxWidth || 100000); 

    const width = paragraph.getMaxWidth();
    const height = paragraph.getHeight();

    if (paragraph.delete) paragraph.delete();
    if (builder.delete) builder.delete();
    if (paraStyle.delete) paraStyle.delete();

    if (text.length === 0) {
        return { width: 0, height: style.fontSize * style.lineHeight };
    }

    return { 
      width: Math.ceil(width), 
      height: Math.ceil(height)
    };
  }

  // --- Core Rendering Logic ---
  renderScene(ctx: RenderContext, node: SceneNode) {
      const { canvas, layout, selectedId, scale = 1 } = ctx;
      const ck = this.ck;
      const box = layout[node.id];
      
      if (!box || box.width <= 0 || box.height <= 0) return;

      canvas.save();

      const rect = ck.XYWHRect(box.x, box.y, box.width, box.height);
      const radius = (node.type === 'FRAME' || node.type === 'IMAGE') ? (node.cornerRadius || 0) : 0;
      const rrect = radius > 0 ? ck.RRectXY(rect, radius, radius) : null;

      // Clipping
      if (node.type === 'FRAME') {
         if (rrect) canvas.clipRRect(rrect, ck.ClipOp.Intersect, true);
         else canvas.clipRect(rect, ck.ClipOp.Intersect, true);
      }

      // Background Fill
      if (node.type === 'FRAME' || node.type === 'IMAGE') {
          if (node.backgroundColor && node.backgroundColor.a > 0) {
              const paint = new ck.Paint();
              paint.setStyle(ck.PaintStyle.Fill);
              paint.setAntiAlias(true);
              paint.setColor(this.toSkColor(node.backgroundColor, node.opacity ?? 1));
              if (rrect) canvas.drawRRect(rrect, paint);
              else canvas.drawRect(rect, paint);
              paint.delete();
          }
      }

      // Image Drawing
      if (node.type === 'IMAGE') {
           const skImg = this.getCachedImage(node.image.src);
           if (skImg) {
               const paint = new ck.Paint();
               const imgW = skImg.width();
               const imgH = skImg.height();
               const aspectImg = imgW / imgH;
               const aspectBox = box.width / box.height;
               
               let srcRect;
               if (node.image.fit === 'cover') {
                    let drawW, drawH;
                    if (aspectImg > aspectBox) {
                        drawH = imgH;
                        drawW = imgH * aspectBox;
                    } else {
                        drawW = imgW;
                        drawH = imgW / aspectBox;
                    }
                    const startX = (imgW - drawW) / 2;
                    const startY = (imgH - drawH) / 2;
                    srcRect = ck.XYWHRect(startX, startY, drawW, drawH);
               } else {
                   srcRect = ck.XYWHRect(0, 0, imgW, imgH);
               }

               canvas.save();
               if (rrect) canvas.clipRRect(rrect, ck.ClipOp.Intersect, true);
               else canvas.clipRect(rect, ck.ClipOp.Intersect, true);
               canvas.drawImageRect(skImg, srcRect, rect, paint);
               canvas.restore();
               paint.delete();
           } else {
               const paint = new ck.Paint();
               paint.setColor(ck.Color4f(0.9, 0.9, 0.9, 1));
               canvas.drawRect(rect, paint);
               paint.delete();
           }
      }

      // Text Drawing
      if (node.type === 'TEXT') {
          if (this.hasFonts && this.fontMgr) {
              const paraStyle = new ck.ParagraphStyle({
                  textAlign: {
                      'left': ck.TextAlign.Left,
                      'center': ck.TextAlign.Center,
                      'right': ck.TextAlign.Right
                  }[node.text.textAlign] || ck.TextAlign.Left,
                  textStyle: {
                      color: this.toSkColor(node.text.color),
                      fontSize: node.text.fontSize,
                      fontFamilies: [node.text.fontFamily, 'Inter', 'Roboto', 'sans-serif'],
                      fontStyle: {
                          weight: node.text.fontWeight === 700 ? ck.FontWeight.Bold : 
                                  node.text.fontWeight === 500 ? ck.FontWeight.Medium : 
                                  ck.FontWeight.Normal,
                      },
                      heightMultiplier: node.text.lineHeight
                  },
              });

              const builder = ck.ParagraphBuilder.Make(paraStyle, this.fontMgr);
              builder.addText(node.text.content);
              const paragraph = builder.build();
              paragraph.layout(box.width); 
              canvas.drawParagraph(paragraph, box.x, box.y);
              
              if (paragraph.delete) paragraph.delete();
              if (builder.delete) builder.delete();
              if (paraStyle.delete) paraStyle.delete();
          }
      }

      // Recursion
      if (node.type === 'FRAME' && node.children) {
          node.children.forEach(child => this.renderScene(ctx, child));
      }

      // Stroke
      if ((node.type === 'FRAME' || node.type === 'IMAGE') && node.strokeColor && node.strokeWidth) {
           const paint = new ck.Paint();
           paint.setStyle(ck.PaintStyle.Stroke);
           paint.setStrokeWidth(node.strokeWidth);
           paint.setColor(this.toSkColor(node.strokeColor, node.opacity ?? 1));
           paint.setAntiAlias(true);
           if (rrect) canvas.drawRRect(rrect, paint);
           else canvas.drawRect(rect, paint);
           paint.delete();
      }

      if (selectedId === node.id) {
          const paint = new ck.Paint();
          paint.setColor(ck.Color4f(0.23, 0.51, 0.96, 1.0));
          paint.setStyle(ck.PaintStyle.Stroke);
          paint.setStrokeWidth(2 / scale);
          if (rrect) canvas.drawRRect(rrect, paint);
          else canvas.drawRect(rect, paint);
          paint.delete();
      }

      canvas.restore();
  }


  // --- Multi-Page Export Functionality ---
  
  async exportDocument(pages: Page[], currentPageId: string, options: ExportOptions): Promise<Blob> {
      if (!this.ck || !this.isReady) throw new Error("Render Engine not ready");

      // Filter pages based on scope
      const targetPages = options.scope === 'ALL_PAGES' 
          ? pages 
          : pages.filter(p => p.id === currentPageId);

      if (targetPages.length === 0) throw new Error("No pages to export");

      // Pre-calculate layouts for all target pages if they are not active
      // (The layoutEngine is fast enough to run on export)
      const pageData = targetPages.map(page => {
          // We assume layout engine is robust. 
          // Note: Text measurement inside layout depends on RenderEngine being ready, which it is.
          const layout = calculateLayout(page.node, 2000, 2000); 
          const rootBox = layout[page.node.id];
          return { page, layout, width: rootBox.width, height: rootBox.height };
      });

      // 1. PDF Export (Combined)
      if (options.format === 'PDF') {
          return this.generateMultiPagePDF(pageData);
      }

      // 2. ZIP Export (Multiple PNG/SVG)
      if (targetPages.length > 1) {
          return this.generateZipArchive(pageData, options);
      }

      // 3. Single File Export (Fallback to existing logic)
      const single = pageData[0];
      if (options.format === 'SVG') {
          return this.generateSVG(single.page.node, single.layout);
      } else {
          const bytes = this.generateImageBytes(single.page.node, single.layout, single.width, single.height, options);
          return new Blob([bytes], { type: 'image/png' });
      }
  }

  private async generateMultiPagePDF(pageData: { page: Page, layout: LayoutMap, width: number, height: number }[]): Promise<Blob> {
    const doc = new jsPDF({
        orientation: 'portrait', // Will be overridden per page
        unit: 'px',
        hotfixes: ['px_scaling']
    });

    // Remove default page 1
    doc.deletePage(1);

    for (const p of pageData) {
        doc.addPage([p.width, p.height], p.width > p.height ? 'landscape' : 'portrait');
        
        // Generate High Res Image for the page
        // Rasterizing is safer for consistency than raw vector PDF in browser without heavy libs
        const scale = 2; // 2x for print quality
        const pngBytes = this.generateImageBytes(p.page.node, p.layout, p.width, p.height, { 
            format: 'PNG', 
            scale, 
            transparentBackground: false, 
            quality: 1,
            scope: 'CURRENT_PAGE'
        });

        doc.addImage(pngBytes, 'PNG', 0, 0, p.width, p.height);
    }

    return doc.output('blob');
  }

  private async generateZipArchive(pageData: { page: Page, layout: LayoutMap, width: number, height: number }[], options: ExportOptions): Promise<Blob> {
    const zip = new JSZip();
    const ext = options.format.toLowerCase();

    for (let i = 0; i < pageData.length; i++) {
        const p = pageData[i];
        const fileName = `${i + 1}_${p.page.name.replace(/\s+/g, '_')}.${ext}`;
        
        let blob: Blob;
        if (options.format === 'SVG') {
            blob = this.generateSVG(p.page.node, p.layout);
        } else {
            const bytes = this.generateImageBytes(p.page.node, p.layout, p.width, p.height, options);
            blob = new Blob([bytes], { type: 'image/png' });
        }
        
        zip.file(fileName, blob);
    }

    return await zip.generateAsync({ type: 'blob' });
  }

  public generateImageBytes(node: SceneNode, layout: LayoutMap, w: number, h: number, options: ExportOptions): Uint8Array {
      const ck = this.ck;
      const scale = options.scale || 1;
      const width = Math.ceil(w * scale);
      const height = Math.ceil(h * scale);

      const surface = ck.MakeSurface(width, height);
      if (!surface) throw new Error("Could not create offscreen surface");

      const canvas = surface.getCanvas();
      canvas.scale(scale, scale);

      if (options.transparentBackground) {
          canvas.clear(ck.TRANSPARENT);
      } else {
          let hasVisibleBackground = false;
          if ((node.type === 'FRAME' || node.type === 'IMAGE') && node.backgroundColor && node.backgroundColor.a > 0) {
              hasVisibleBackground = true;
          }

          if (!hasVisibleBackground) {
              canvas.clear(ck.WHITE);
          } else {
              canvas.clear(ck.TRANSPARENT);
          }
      }

      this.renderScene({ canvas, layout, scale }, node);

      const img = surface.makeImageSnapshot();
      const bytes = img.encodeToBytes(); 
      
      img.delete();
      surface.delete();

      return bytes;
  }

  // Pure JSON -> SVG Generator
  private generateSVG(node: SceneNode, layout: LayoutMap): Blob {
      const box = layout[node.id];
      const w = box.width;
      const h = box.height;
      
      let svgContent = '';

      const processNode = (n: SceneNode) => {
          const b = layout[n.id];
          if (!b) return '';
          
          let el = '';
          const radius = (n.type === 'FRAME' || n.type === 'IMAGE') ? (n.cornerRadius || 0) : 0;
          const clipId = `clip-${n.id}`;

          if (n.type === 'FRAME') {
             let fill = 'none';
             if (n.backgroundColor && n.backgroundColor.a > 0) {
                 fill = `rgba(${n.backgroundColor.r},${n.backgroundColor.g},${n.backgroundColor.b},${n.backgroundColor.a})`;
             }
             
             el += `<rect x="${b.x}" y="${b.y}" width="${b.width}" height="${b.height}" rx="${radius}" fill="${fill}" />`;
             
             if (n.children && n.children.length > 0) {
                 el = `<defs><clipPath id="${clipId}"><rect x="${b.x}" y="${b.y}" width="${b.width}" height="${b.height}" rx="${radius}" /></clipPath></defs>` + el;
                 el += `<g clip-path="url(#${clipId})">`;
                 n.children.forEach(c => {
                     el += processNode(c);
                 });
                 el += `</g>`;
             }
             
             if (n.strokeColor && n.strokeWidth) {
                 const s = n.strokeColor;
                 const stroke = `rgba(${s.r},${s.g},${s.b},${s.a})`;
                 el += `<rect x="${b.x}" y="${b.y}" width="${b.width}" height="${b.height}" rx="${radius}" fill="none" stroke="${stroke}" stroke-width="${n.strokeWidth}" />`;
             }
          } 
          else if (n.type === 'TEXT') {
             const style = `font-family: '${n.text.fontFamily}', sans-serif; font-size: ${n.text.fontSize}px; font-weight: ${n.text.fontWeight}; fill: rgba(${n.text.color.r},${n.text.color.g},${n.text.color.b},${n.text.color.a}); white-space: pre;`;
             const baselineY = b.y + n.text.fontSize * 0.9; 
             el += `<text x="${b.x}" y="${baselineY}" style="${style}">${this.escapeXml(n.text.content)}</text>`;
          }
          else if (n.type === 'IMAGE') {
              const preserve = n.image.fit === 'cover' ? 'xMidYMid slice' : 'none';
              el += `<image href="${n.image.src}" x="${b.x}" y="${b.y}" width="${b.width}" height="${b.height}" preserveAspectRatio="${preserve}" rx="${radius}" />`;
          }

          return el;
      };

      svgContent = processNode(node);

      const svgBody = `
        <svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg">
            ${svgContent}
        </svg>
      `;
      
      return new Blob([svgBody], { type: 'image/svg+xml' });
  }

  private escapeXml(unsafe: string) {
    return unsafe.replace(/[<>&'"]/g, function (c) {
        switch (c) {
            case '<': return '&lt;';
            case '>': return '&gt;';
            case '&': return '&amp;';
            case '\'': return '&apos;';
            case '"': return '&quot;';
        }
        return c;
    });
  }


  toSkColor(c?: Color, opacity: number = 1): Float32Array {
    if (!c) return this.ck.TRANSPARENT;
    return this.ck.Color4f(c.r/255, c.g/255, c.b/255, c.a * opacity);
  }
}

export const RenderEngine = new RenderEngineService();
