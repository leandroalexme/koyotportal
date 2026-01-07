import { SceneNode, FrameNode, TextNode, ImageNode, Color, LayoutMode, SizingMode, Alignment } from '../types';

/**
 * FIGMA API TYPES
 */
interface FigmaNode {
  id: string;
  name: string;
  type: string;
  children?: FigmaNode[];
  
  layoutMode?: 'HORIZONTAL' | 'VERTICAL' | 'NONE';
  primaryAxisSizingMode?: 'FIXED' | 'AUTO'; 
  counterAxisSizingMode?: 'FIXED' | 'AUTO';
  layoutAlign?: 'INHERIT' | 'STRETCH'; 
  layoutGrow?: number; 
  primaryAxisAlignItems?: string;
  counterAxisAlignItems?: string;
  paddingLeft?: number;
  paddingRight?: number;
  paddingTop?: number;
  paddingBottom?: number;
  itemSpacing?: number;
  
  absoluteBoundingBox?: { width: number; height: number; x: number; y: number };
  fills?: any[];
  strokes?: any[];
  strokeWeight?: number;
  cornerRadius?: number;
  opacity?: number;
  visible?: boolean;
  
  characters?: string;
  style?: any;
}

// Global map to store resolved image URLs during the import process
let imageMap: Record<string, string> = {};

// --- UTILS ---

function parseColor(fills: any[] | undefined): Color | undefined {
  if (!fills || !Array.isArray(fills) || fills.length === 0) return undefined;
  const fill = fills.find(f => f.type === 'SOLID' && f.visible !== false);
  if (!fill) return undefined;
  const { r, g, b, a } = fill.color;
  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b * 255),
    a: (fill.opacity ?? a ?? 1)
  };
}

function mapAlignment(align: string | undefined): Alignment {
  switch (align) {
    case 'MIN': return 'START';
    case 'MAX': return 'END';
    case 'CENTER': return 'CENTER';
    case 'SPACE_BETWEEN': return 'SPACE_BETWEEN';
    default: return 'START';
  }
}

function hasImageFill(fNode: FigmaNode): boolean {
  return fNode.fills?.some(f => f.type === 'IMAGE' && f.visible !== false) ?? false;
}

/**
 * Identify nodes that should be flattened into Images (Icons, Vectors, or Actual Images)
 */
function shouldRenderAsImage(fNode: FigmaNode): boolean {
    const vectorTypes = ['VECTOR', 'BOOLEAN_OPERATION', 'STAR', 'REGULAR_POLYGON', 'LINE'];
    // If it's a vector shape, we render it as an image to preserve the icon fidelity
    if (vectorTypes.includes(fNode.type)) return true;
    
    // If it's a rectangle/frame specifically acting as an image holder (has image fill)
    // We treat it as an IMAGE node type in our engine
    if (hasImageFill(fNode)) return true;

    return false;
}

/**
 * CONVERSION LOGIC
 */
function convertNode(fNode: FigmaNode): SceneNode | null {
  if (fNode.visible === false) return null;

  // 1. Check if this node should be an IMAGE (Icon or Photo)
  if (shouldRenderAsImage(fNode)) {
     const width = fNode.absoluteBoundingBox?.width || 100;
     const height = fNode.absoluteBoundingBox?.height || 100;
     
     // Retrieve the URL we resolved in Pass 2
     const resolvedUrl = imageMap[fNode.id];

     return {
        id: fNode.id,
        name: fNode.name,
        type: 'IMAGE',
        width,
        height,
        sizingHorizontal: 'FIXED', 
        sizingVertical: 'FIXED',
        image: {
            src: resolvedUrl || '',
            fit: 'contain'
        },
        backgroundColor: { r:0, g:0, b:0, a:0 }, 
        cornerRadius: fNode.cornerRadius || 0,
        opacity: fNode.opacity,
     } as ImageNode;
  }

  // 2. TEXT
  if (fNode.type === 'TEXT') {
    const width = fNode.absoluteBoundingBox?.width || 0;
    const height = fNode.absoluteBoundingBox?.height || 0;

    return {
      id: fNode.id,
      name: fNode.name,
      type: 'TEXT',
      width,
      height,
      sizingHorizontal: fNode.style?.textAutoResize === 'WIDTH_AND_HEIGHT' ? 'HUG' : 'FIXED', 
      sizingVertical: 'HUG',
      text: {
        content: fNode.characters || '',
        fontSize: fNode.style?.fontSize || 16,
        fontWeight: fNode.style?.fontWeight || 400,
        fontFamily: fNode.style?.fontFamily || 'Inter',
        color: parseColor(fNode.fills) || { r: 0, g: 0, b: 0, a: 1 },
        textAlign: (fNode.style?.textAlignHorizontal || 'LEFT').toLowerCase(),
        lineHeight: 1.2
      }
    } as TextNode;
  }

  // 3. FRAME / CONTAINER
  const width = fNode.absoluteBoundingBox?.width || 100;
  const height = fNode.absoluteBoundingBox?.height || 100;

  let sizingHorizontal: SizingMode = 'FIXED';
  let sizingVertical: SizingMode = 'FIXED';
  
  const isAutoLayout = fNode.layoutMode === 'HORIZONTAL' || fNode.layoutMode === 'VERTICAL';

  if (isAutoLayout) {
    if (fNode.layoutMode === 'HORIZONTAL') {
        if (fNode.primaryAxisSizingMode === 'AUTO') sizingHorizontal = 'HUG';
        if (fNode.counterAxisSizingMode === 'AUTO') sizingVertical = 'HUG';
    } else {
        if (fNode.primaryAxisSizingMode === 'AUTO') sizingVertical = 'HUG';
        if (fNode.counterAxisSizingMode === 'AUTO') sizingHorizontal = 'HUG';
    }
  }
  
  if (fNode.layoutGrow === 1) sizingHorizontal = 'FILL'; 
  if (fNode.layoutAlign === 'STRETCH') sizingVertical = 'FILL';

  const newNode: FrameNode = {
    id: fNode.id,
    name: fNode.name,
    type: 'FRAME',
    width,
    height,
    sizingHorizontal,
    sizingVertical,
    layoutMode: fNode.layoutMode === 'HORIZONTAL' ? 'HORIZONTAL' : 'VERTICAL',
    gap: fNode.itemSpacing || 0,
    padding: {
      top: fNode.paddingTop || 0,
      right: fNode.paddingRight || 0,
      bottom: fNode.paddingBottom || 0,
      left: fNode.paddingLeft || 0
    },
    primaryAxisAlign: mapAlignment(fNode.primaryAxisAlignItems),
    counterAxisAlign: mapAlignment(fNode.counterAxisAlignItems),
    backgroundColor: parseColor(fNode.fills),
    strokeColor: parseColor(fNode.strokes),
    strokeWidth: fNode.strokeWeight || 0,
    cornerRadius: fNode.cornerRadius || 0,
    opacity: fNode.opacity,
    children: []
  };

  if (fNode.children) {
    newNode.children = fNode.children
      .map(convertNode)
      .filter((n): n is SceneNode => n !== null);
  }

  if (!isAutoLayout && fNode.children?.length) {
      newNode.layoutMode = 'VERTICAL';
      newNode.sizingHorizontal = 'FIXED';
      newNode.sizingVertical = 'FIXED'; 
  }

  return newNode;
}

// --- FETCH HELPER WITH RETRY ---
const wait = (ms: number) => new Promise(r => setTimeout(r, ms));

async function fetchWithRetry(url: string, options: RequestInit, retries = 3): Promise<Response> {
  for (let i = 0; i <= retries; i++) {
    const res = await fetch(url, options);
    
    if (res.status === 429) {
      if (i < retries) {
        // Respect Retry-After header if present
        const retryAfter = res.headers.get('Retry-After');
        let delay = 3000 * Math.pow(2, i); // Increased base delay to 3s
        
        if (retryAfter) {
            const seconds = parseInt(retryAfter, 10);
            if (!isNaN(seconds)) {
                delay = (seconds * 1000) + 1000; // Wait requested time + 1s buffer
            }
        }
        
        console.warn(`Figma Rate Limit (429). Retrying in ${delay}ms...`);
        await wait(delay);
        continue;
      }
    }
    return res;
  }
  throw new Error("Max retries exceeded");
}


/**
 * MAIN FETCH FUNCTION
 */
export async function fetchFigmaFile(token: string, fileKey: string, nodeId?: string): Promise<SceneNode> {
  const headers = { 'X-Figma-Token': token };
  
  // PASS 1: Fetch Structure
  let url = `https://api.figma.com/v1/files/${fileKey}`;
  if (nodeId) url += `/nodes?ids=${nodeId}`;

  // Use retry for main fetch
  const res = await fetchWithRetry(url, { headers });
  
  if (!res.ok) {
     const json = await res.json().catch(() => ({}));
     throw new Error(json.err || json.message || `Figma API Error: ${res.status}`);
  }

  const data = await res.json();
  
  let figmaRoot: FigmaNode | undefined;
  if (nodeId) {
    const key = Object.keys(data.nodes)[0];
    if (key && data.nodes[key]) figmaRoot = data.nodes[key].document;
  } else {
    figmaRoot = data.document?.children?.[0]?.children?.[0]; 
  }

  if (!figmaRoot) throw new Error("Could not find a valid root node.");
  
  if (figmaRoot.type === 'CANVAS') {
      const validChild = figmaRoot.children?.find(c => 
          ['FRAME', 'SECTION', 'COMPONENT', 'INSTANCE'].includes(c.type)
      );
      if (validChild) figmaRoot = validChild;
      else throw new Error("Selected Page is empty.");
  }

  // PASS 2: Collect Nodes needing Image Rendering
  const nodesToRender: string[] = [];
  
  function traverseForImages(node: FigmaNode) {
      if (shouldRenderAsImage(node)) {
          nodesToRender.push(node.id);
          return; 
      }
      if (node.children) {
          node.children.forEach(traverseForImages);
      }
  }
  traverseForImages(figmaRoot);

  // PASS 3: Fetch Image URLs from Figma
  imageMap = {}; // Reset
  if (nodesToRender.length > 0) {
      // Reduced chunk size to avoid 429s on image endpoints
      const chunkSize = 20;
      for (let i = 0; i < nodesToRender.length; i += chunkSize) {
          const chunk = nodesToRender.slice(i, i + chunkSize);
          const idsParam = chunk.join(',');
          
          try {
             // Added scale=2 for retina support
             const imgRes = await fetchWithRetry(`https://api.figma.com/v1/images/${fileKey}?ids=${idsParam}&format=png&scale=2`, { headers });
             if (imgRes.ok) {
                 const imgData = await imgRes.json();
                 if (imgData.images) {
                     Object.assign(imageMap, imgData.images);
                 }
             }
          } catch (e) {
             console.warn("Failed to fetch image chunk, continuing without these images.", e);
          }
      }
  }

  // PASS 4: Convert with populated imageMap
  const result = convertNode(figmaRoot);
  if (!result) throw new Error("Root conversion failed.");

  result.id = 'root';
  result.name = figmaRoot.name;

  return result;
}