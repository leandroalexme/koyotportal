import React, { useRef, useEffect, useState } from 'react';
import { SceneNode, LayoutMap } from '../types';
import { RenderEngine } from '../services/renderEngine';
import { ZoomIn, ZoomOut, Maximize, MousePointer2 } from 'lucide-react';

interface CanvasRendererProps {
  rootNode: SceneNode;
  layout: LayoutMap;
  selectedId: string | null;
  onSelect: (id: string) => void;
  width: number;
  height: number;
}

export const CanvasRenderer: React.FC<CanvasRendererProps> = ({ 
  rootNode, 
  layout, 
  selectedId, 
  onSelect, 
  width, 
  height 
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const surfaceRef = useRef<any>(null);

  // Viewport State
  const [scale, setScale] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  
  // Retina Display Support
  const dpr = window.devicePixelRatio || 1;

  // Initial Center
  useEffect(() => {
    // Center the content initially
    const rootBox = layout[rootNode.id];
    if (rootBox) {
        const cx = (width - rootBox.width) / 2;
        const cy = 60; // Top padding
        setPan({ x: cx, y: cy });
    }
  }, [width, height, rootNode.id]); // Run only on init or resize/root change

  // --- Image Preloading Logic ---
  useEffect(() => {
    if (!RenderEngine.isReady) return;

    const traverse = (node: SceneNode) => {
      if (node.type === 'IMAGE' && node.image.src) {
        RenderEngine.loadImage(node.image.src);
      }
      if (node.type === 'FRAME') {
        node.children.forEach(traverse);
      }
    };
    traverse(rootNode);
  }, [rootNode]);


  // --- Render Loop ---
  useEffect(() => {
    if (!RenderEngine.isReady || !canvasRef.current) return;
    const ck = RenderEngine.ck;

    // Handle Retina Surface Creation
    if (!surfaceRef.current) {
        const surface = ck.MakeWebGLCanvasSurface(canvasRef.current);
        if (!surface) {
            console.error("Could not create WebGL surface");
            return;
        }
        surfaceRef.current = surface;
    }

    const surface = surfaceRef.current;
    const canvas = surface.getCanvas();

    const drawFrame = () => {
        // Clear with Dark Gray Background (Zinc-900)
        canvas.clear(ck.parseColorString('#18181b')); 

        canvas.save();
        // 1. Handle Retina scaling
        canvas.scale(dpr, dpr);
        
        // 2. Handle User Pan/Zoom
        canvas.translate(pan.x, pan.y);
        canvas.scale(scale, scale);

        // 3. Render Scene using Centralized Engine
        // (Shadow removal: deleted the shadow drawing block here)
        RenderEngine.renderScene({
            canvas,
            layout,
            selectedId,
            scale // Pass visual scale for stroke optimization
        }, rootNode);

        canvas.restore();
        surface.flush();
    };

    let animationFrameId: number;
    const renderLoop = () => {
        drawFrame();
        animationFrameId = requestAnimationFrame(renderLoop);
    };
    renderLoop();

    return () => {
        cancelAnimationFrame(animationFrameId);
    };
  }, [rootNode, layout, selectedId, width, height, scale, pan, dpr]);


  // --- Events ---
  
  const handleWheel = (e: React.WheelEvent) => {
      // Ctrl + Wheel for Zoom, otherwise Pan
      if (e.ctrlKey || e.metaKey) {
          e.preventDefault();
          const zoomSensitivity = 0.001;
          const newScale = Math.min(Math.max(0.1, scale - e.deltaY * zoomSensitivity), 5);
          setScale(newScale);
      } else {
          setPan(p => ({ x: p.x - e.deltaX, y: p.y - e.deltaY }));
      }
  };

  const handlePointerDown = (e: React.PointerEvent) => {
      if (e.button === 1 || e.buttons === 4 || e.shiftKey) { 
          setIsPanning(true);
          e.currentTarget.setPointerCapture(e.pointerId);
      }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
      if (isPanning) {
          setPan(p => ({ x: p.x + e.movementX, y: p.y + e.movementY }));
      }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
      setIsPanning(false);
      e.currentTarget.releasePointerCapture(e.pointerId);
  };

  const handleClick = (e: React.MouseEvent) => {
    if (isPanning) return; // Don't select if we just panned

    if (!layout[rootNode.id]) return;
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    // Transform Mouse Coordinate (Screen) -> World Coordinate
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    const worldX = (mouseX - pan.x) / scale;
    const worldY = (mouseY - pan.y) / scale;

    let hitId: string | null = null;
    let smallestArea = Infinity;

    const traverse = (node: SceneNode) => {
        const b = layout[node.id];
        if (b && worldX >= b.x && worldX <= b.x + b.width && worldY >= b.y && worldY <= b.y + b.height) {
            const area = b.width * b.height;
            if (area <= smallestArea) {
                smallestArea = area;
                hitId = node.id;
            }
            if (node.type === 'FRAME') node.children.forEach(traverse);
        }
    };
    traverse(rootNode);
    onSelect(hitId || '');
  };

  return (
    <div className="relative w-full h-full overflow-hidden bg-zinc-900 flex select-none">
        
        {/* Canvas */}
        <canvas 
            ref={canvasRef}
            width={width * dpr}
            height={height * dpr}
            style={{ width: width, height: height, cursor: isPanning ? 'grabbing' : 'default' }}
            onWheel={handleWheel}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onClick={handleClick}
            className="block touch-none"
        />

        {/* View Controls */}
        <div className="absolute bottom-6 left-6 flex items-center gap-2 bg-white border border-slate-200 rounded-lg p-1.5 text-slate-600 z-10">
            <button onClick={() => setScale(s => Math.max(0.1, s - 0.1))} className="p-1 hover:bg-slate-100 rounded transition-colors"><ZoomOut size={16} /></button>
            <span className="text-xs font-mono w-12 text-center text-slate-900">{Math.round(scale * 100)}%</span>
            <button onClick={() => setScale(s => Math.min(5, s + 0.1))} className="p-1 hover:bg-slate-100 rounded transition-colors"><ZoomIn size={16} /></button>
            <div className="w-px h-4 bg-slate-200 mx-1"></div>
            <button onClick={() => { setScale(1); setPan({x: (width - 800)/2, y: 60}); }} className="p-1 hover:bg-slate-100 rounded transition-colors" title="Reset View"><Maximize size={16} /></button>
        </div>

        {/* Hints */}
        <div className="absolute bottom-6 right-6 text-[10px] text-zinc-500 flex items-center gap-4 z-10 pointer-events-none">
             <span className="flex items-center gap-1"><MousePointer2 size={10} /> Select</span>
             <span className="flex items-center gap-1"><span className="border border-zinc-700 bg-zinc-800 rounded px-1 text-zinc-400">Shift</span> + Drag to Pan</span>
             <span className="flex items-center gap-1"><span className="border border-zinc-700 bg-zinc-800 rounded px-1 text-zinc-400">Ctrl</span> + Scroll to Zoom</span>
        </div>
    </div>
  );
};