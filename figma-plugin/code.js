"use strict";
// Koyot Figma Plugin - Export complete node data
// This plugin extracts data that REST API doesn't expose (listOptions, geometry, etc)
// Extract list options from text node
function extractListOptions(textNode) {
    const listOptions = [];
    const content = textNode.characters;
    const lines = content.split('\n');
    let charIndex = 0;
    for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
        const line = lines[lineIndex];
        const startIndex = charIndex;
        const endIndex = charIndex + line.length;
        // Get list options for this line (use first character of line)
        if (line.length > 0) {
            try {
                const lineListOptions = textNode.getRangeListOptions(startIndex, startIndex + 1);
                if (lineListOptions !== figma.mixed) {
                    listOptions.push({
                        lineIndex,
                        startIndex,
                        endIndex,
                        type: lineListOptions.type
                    });
                }
            }
            catch (e) {
                // Ignore errors for empty ranges
            }
        }
        charIndex = endIndex + 1; // +1 for newline
    }
    return listOptions;
}
// Export text node with full data
function exportTextNode(node) {
    const fontName = node.fontName !== figma.mixed ? node.fontName : { family: 'Inter', style: 'Regular' };
    const fontSize = node.fontSize !== figma.mixed ? node.fontSize : 16;
    const letterSpacing = node.letterSpacing !== figma.mixed ? node.letterSpacing : { value: 0, unit: 'PIXELS' };
    const lineHeight = node.lineHeight !== figma.mixed ? node.lineHeight : { unit: 'AUTO' };
    const textDecoration = node.textDecoration !== figma.mixed ? node.textDecoration : 'NONE';
    const textCase = node.textCase !== figma.mixed ? node.textCase : 'ORIGINAL';
    const paragraphSpacing = node.paragraphSpacing !== figma.mixed ? node.paragraphSpacing : 0;
    const paragraphIndent = node.paragraphIndent !== figma.mixed ? node.paragraphIndent : 0;
    return {
        id: node.id,
        name: node.name,
        type: 'TEXT',
        characters: node.characters,
        x: node.x,
        y: node.y,
        width: node.width,
        height: node.height,
        rotation: node.rotation,
        opacity: node.opacity,
        visible: node.visible,
        locked: node.locked,
        fontName,
        fontSize,
        fontWeight: getFontWeight(fontName.style),
        letterSpacing,
        lineHeight,
        textAlignHorizontal: node.textAlignHorizontal,
        textAlignVertical: node.textAlignVertical,
        textDecoration,
        textCase,
        listOptions: extractListOptions(node),
        paragraphSpacing,
        paragraphIndent,
        fills: node.fills
    };
}
// Get font weight from style name
function getFontWeight(style) {
    const weights = {
        'Thin': 100,
        'ExtraLight': 200,
        'Light': 300,
        'Regular': 400,
        'Medium': 500,
        'SemiBold': 600,
        'Bold': 700,
        'ExtraBold': 800,
        'Black': 900
    };
    for (const [name, weight] of Object.entries(weights)) {
        if (style.includes(name))
            return weight;
    }
    return 400;
}
// Export vector node with geometry
function exportVectorNode(node) {
    // Get corner radii if available (for RECTANGLE)
    let cornerRadius = 0;
    let rectangleCornerRadii = undefined;
    if ('cornerRadius' in node && typeof node.cornerRadius === 'number') {
        cornerRadius = node.cornerRadius;
    }
    if ('topLeftRadius' in node) {
        rectangleCornerRadii = [
            node.topLeftRadius || 0,
            node.topRightRadius || 0,
            node.bottomRightRadius || 0,
            node.bottomLeftRadius || 0
        ];
    }
    
    // Try to get geometry from multiple sources
    // 1. fillGeometry (preferred for filled shapes)
    // 2. vectorPaths (available on VectorNode)
    // 3. strokeGeometry (for stroked shapes)
    
    let fillGeometry = undefined;
    let strokeGeometry = undefined;
    
    // Check fillGeometry
    if (node.fillGeometry && node.fillGeometry.length > 0) {
        const validPaths = node.fillGeometry.filter(g => g.path && g.path.length > 0);
        if (validPaths.length > 0) {
            fillGeometry = validPaths.map(g => ({ path: g.path, windingRule: g.windingRule || 'NONZERO' }));
        }
    }
    
    // If no fillGeometry, try vectorPaths (only on VectorNode)
    if (!fillGeometry && 'vectorPaths' in node && node.vectorPaths && node.vectorPaths.length > 0) {
        const validPaths = node.vectorPaths.filter(g => g.data && g.data.length > 0);
        if (validPaths.length > 0) {
            // vectorPaths uses 'data' instead of 'path'
            fillGeometry = validPaths.map(g => ({ path: g.data, windingRule: g.windingRule || 'NONZERO' }));
        }
    }
    
    // Check strokeGeometry
    // For Dynamic/Brush strokes, strokeGeometry contains filled shapes (not lines)
    // We detect this by comparing strokeGeometry complexity with a basic stroke
    let strokeIsFilled = false;
    
    // Debug: log what properties are available
    const strokeGeomLen = node.strokeGeometry ? node.strokeGeometry.length : 0;
    const strokesLen = node.strokes ? node.strokes.length : 0;
    console.log('[Koyot Debug] ' + node.name + ' (' + node.type + '): hasStrokeGeometry=' + ('strokeGeometry' in node) + ', strokeGeometryLength=' + strokeGeomLen + ', strokes=' + strokesLen);
    
    // strokeGeometry is readonly and contains the computed stroke paths
    // For Dynamic/Brush strokes, these paths are complex filled shapes
    if ('strokeGeometry' in node && node.strokeGeometry && node.strokeGeometry.length > 0) {
        console.log(`[Koyot Debug] ${node.name}: strokeGeometry[0] keys=${Object.keys(node.strokeGeometry[0] || {}).join(',')}`);
        
        // strokeGeometry uses 'data' property, not 'path' (like vectorPaths)
        const validPaths = node.strokeGeometry.filter(g => (g.path && g.path.length > 0) || (g.data && g.data.length > 0));
        if (validPaths.length > 0) {
            // Use 'data' if 'path' is not available
            strokeGeometry = validPaths.map(g => ({ 
                path: g.path || g.data, 
                windingRule: g.windingRule || 'NONZERO' 
            }));
            
            // Detect Dynamic/Brush strokes by checking path complexity
            // Dynamic/Brush strokes generate very complex paths (hundreds/thousands of commands)
            // Basic strokes generate simpler paths
            const totalPathLength = validPaths.reduce((sum, g) => sum + (g.path || g.data || '').length, 0);
            const avgPathLength = totalPathLength / validPaths.length;
            strokeIsFilled = avgPathLength > 200; // Complex paths indicate Dynamic/Brush
            
            console.log(`[Koyot] ${node.name} (${node.type}): strokeGeometry paths=${validPaths.length}, avgLength=${avgPathLength}, strokeIsFilled=${strokeIsFilled}`);
        }
    }
    
    const hasGeometry = fillGeometry || strokeGeometry;
    
    // Only mark for PNG export if we truly have no geometry
    const needsPngExport = !hasGeometry && 
        (node.type === 'VECTOR' || node.type === 'BOOLEAN_OPERATION' || 
         node.type === 'STAR' || node.type === 'POLYGON' || node.type === 'LINE');
    
    return {
        id: node.id,
        name: node.name,
        type: node.type,
        x: node.x,
        y: node.y,
        width: node.width,
        height: node.height,
        rotation: node.rotation,
        opacity: node.opacity,
        visible: node.visible,
        locked: node.locked,
        fillGeometry: fillGeometry,
        strokeGeometry: strokeGeometry,
        strokeIsFilled: strokeIsFilled, // true for Dynamic/Brush strokes
        strokeWeight: typeof node.strokeWeight === 'number' ? node.strokeWeight : 1,
        strokeAlign: node.strokeAlign,
        strokeCap: node.strokeCap !== figma.mixed ? node.strokeCap : 'NONE',
        strokeJoin: node.strokeJoin !== figma.mixed ? node.strokeJoin : 'MITER',
        strokeMiterLimit: node.strokeMiterLimit,
        dashPattern: node.dashPattern,
        cornerRadius,
        rectangleCornerRadii,
        fills: node.fills,
        strokes: node.strokes,
        needsPngExport: needsPngExport
    };
}
// Export frame node
function exportFrameNode(node) {
    const children = [];
    if ('children' in node) {
        for (const child of node.children) {
            const exported = exportNode(child);
            if (exported)
                children.push(exported);
        }
    }
    const isFrame = node.type === 'FRAME' || node.type === 'COMPONENT' || node.type === 'INSTANCE';
    
    // Get corner radii if available
    let cornerRadius = 0;
    let rectangleCornerRadii = undefined;
    if ('cornerRadius' in node && typeof node.cornerRadius === 'number') {
        cornerRadius = node.cornerRadius;
    }
    if ('topLeftRadius' in node) {
        rectangleCornerRadii = [
            node.topLeftRadius || 0,
            node.topRightRadius || 0,
            node.bottomRightRadius || 0,
            node.bottomLeftRadius || 0
        ];
    }
    
    return {
        id: node.id,
        name: node.name,
        type: node.type,
        x: node.x,
        y: node.y,
        width: node.width,
        height: node.height,
        rotation: node.rotation,
        opacity: node.opacity,
        visible: node.visible,
        locked: node.locked,
        clipsContent: isFrame ? node.clipsContent : false,
        layoutMode: isFrame ? node.layoutMode : 'NONE',
        layoutPositioning: 'layoutPositioning' in node ? node.layoutPositioning : 'AUTO',
        primaryAxisSizingMode: isFrame ? node.primaryAxisSizingMode : 'AUTO',
        counterAxisSizingMode: isFrame ? node.counterAxisSizingMode : 'AUTO',
        primaryAxisAlignItems: isFrame ? node.primaryAxisAlignItems : 'MIN',
        counterAxisAlignItems: isFrame ? node.counterAxisAlignItems : 'MIN',
        paddingLeft: isFrame ? node.paddingLeft : 0,
        paddingRight: isFrame ? node.paddingRight : 0,
        paddingTop: isFrame ? node.paddingTop : 0,
        paddingBottom: isFrame ? node.paddingBottom : 0,
        itemSpacing: isFrame ? node.itemSpacing : 0,
        cornerRadius,
        rectangleCornerRadii,
        fills: node.fills,
        strokes: 'strokes' in node ? node.strokes : [],
        strokeWeight: 'strokeWeight' in node ? (typeof node.strokeWeight === 'number' ? node.strokeWeight : 1) : 0,
        effects: node.effects,
        children
    };
}
// Export any node
function exportNode(node) {
    if (!node.visible)
        return null;
    switch (node.type) {
        case 'TEXT':
            return exportTextNode(node);
        case 'VECTOR':
        case 'LINE':
        case 'STAR':
        case 'POLYGON':
        case 'ELLIPSE':
        case 'RECTANGLE':
        case 'BOOLEAN_OPERATION':
            return exportVectorNode(node);
        case 'FRAME':
        case 'GROUP':
        case 'COMPONENT':
        case 'INSTANCE':
            return exportFrameNode(node);
        default:
            // For unknown types that have geometry, try to export as vector
            if ('fillGeometry' in node || 'fills' in node) {
                return exportVectorNode(node);
            }
            // Generic export for other node types
            return {
                id: node.id,
                name: node.name,
                type: node.type,
                x: 'x' in node ? node.x : 0,
                y: 'y' in node ? node.y : 0,
                width: 'width' in node ? node.width : 0,
                height: 'height' in node ? node.height : 0
            };
    }
}
// Collect all image hashes from the tree
async function collectImageHashes(node, hashes) {
    if ('fills' in node && Array.isArray(node.fills)) {
        for (const fill of node.fills) {
            if (fill.type === 'IMAGE' && fill.imageHash) {
                hashes.add(fill.imageHash);
            }
        }
    }
    if ('children' in node) {
        for (const child of node.children) {
            await collectImageHashes(child, hashes);
        }
    }
}

// Collect nodes that need PNG export (vectors without geometry)
async function collectNodesForPngExport(node, nodes) {
    // Check if this is a vector-type node without valid geometry
    if (node.type === 'VECTOR' || node.type === 'BOOLEAN_OPERATION' || 
        node.type === 'STAR' || node.type === 'POLYGON' || node.type === 'LINE') {
        
        // Check all possible geometry sources
        const hasFillGeometry = node.fillGeometry && node.fillGeometry.length > 0 && 
            node.fillGeometry.some(g => g.path && g.path.length > 0);
        const hasVectorPaths = 'vectorPaths' in node && node.vectorPaths && node.vectorPaths.length > 0 &&
            node.vectorPaths.some(g => g.data && g.data.length > 0);
        const hasStrokeGeometry = node.strokeGeometry && node.strokeGeometry.length > 0 &&
            node.strokeGeometry.some(g => g.path && g.path.length > 0);
        
        // Only add to PNG export if no geometry at all
        if (!hasFillGeometry && !hasVectorPaths && !hasStrokeGeometry) {
            nodes.push(node);
        }
    }
    if ('children' in node) {
        for (const child of node.children) {
            await collectNodesForPngExport(child, nodes);
        }
    }
}

// Export images as base64
async function exportImages(hashes) {
    const images = {};
    for (const hash of hashes) {
        try {
            const image = figma.getImageByHash(hash);
            if (image) {
                const bytes = await image.getBytesAsync();
                const base64 = figma.base64Encode(bytes);
                images[hash] = base64;
            }
        }
        catch (e) {
            console.error(`Failed to export image ${hash}:`, e);
        }
    }
    return images;
}

// Export nodes as PNG images
async function exportNodesAsPng(nodes) {
    const images = {};
    for (const node of nodes) {
        try {
            // Export at 2x scale for better quality
            const bytes = await node.exportAsync({
                format: 'PNG',
                constraint: { type: 'SCALE', value: 2 }
            });
            const base64 = figma.base64Encode(bytes);
            // Use node ID as the key with a special prefix
            images['node_' + node.id] = base64;
        }
        catch (e) {
            console.error(`Failed to export node ${node.id} as PNG:`, e);
        }
    }
    return images;
}

// Main export function
async function exportSelection() {
    const selection = figma.currentPage.selection;
    if (selection.length === 0) {
        figma.notify('Please select a frame to export');
        return null;
    }
    const rootNode = selection[0];
    
    // Collect image hashes
    const imageHashes = new Set();
    await collectImageHashes(rootNode, imageHashes);
    
    // Collect nodes that need PNG export
    const nodesForPng = [];
    await collectNodesForPngExport(rootNode, nodesForPng);
    
    // Export images
    const images = await exportImages(imageHashes);
    
    // Export vector nodes as PNG
    const pngImages = await exportNodesAsPng(nodesForPng);
    Object.assign(images, pngImages);
    
    // Export node tree
    const exportedRoot = exportNode(rootNode);
    if (!exportedRoot) {
        figma.notify('Failed to export selected node');
        return null;
    }
    
    return {
        version: '1.0.0',
        fileKey: figma.fileKey || 'unknown',
        fileName: figma.root.name,
        exportedAt: new Date().toISOString(),
        rootNode: exportedRoot,
        images
    };
}
// Show UI
figma.showUI(__html__, { width: 400, height: 300 });
// Handle messages from UI
figma.ui.onmessage = async (msg) => {
    if (msg.type === 'export') {
        const data = await exportSelection();
        if (data) {
            figma.ui.postMessage({ type: 'export-data', data });
            figma.notify('Export ready! Click "Send to Koyot" to import.');
        }
    }
    if (msg.type === 'send-to-koyot') {
        const data = await exportSelection();
        if (data && msg.apiUrl) {
            figma.ui.postMessage({
                type: 'send-data',
                data,
                apiUrl: msg.apiUrl
            });
        }
    }
    if (msg.type === 'close') {
        figma.closePlugin();
    }
};
