import { SceneNode, LayoutMap } from '../types';
import { RenderEngine } from './renderEngine';

// Pass 1: Measure intrinsics (Measure Pass)
// This strictly follows the "Measure" phase of the spec
function measureNode(node: SceneNode, availableWidth: number | undefined): { width: number, height: number } {
  
  // --- TEXT MEASUREMENT ---
  if (node.type === 'TEXT') {
    const isFixedW = node.sizingHorizontal === 'FIXED';
    const isFixedH = node.sizingVertical === 'FIXED';

    // If both fixed, no need to measure
    if (isFixedW && isFixedH) {
      return { width: node.width, height: node.height };
    }

    // Use RenderEngine (Skia) for precise text metrics
    const maxWidth = isFixedW ? node.width : availableWidth;
    
    const measured = RenderEngine.measureText(
      node.text.content,
      {
        fontSize: node.text.fontSize,
        fontWeight: node.text.fontWeight,
        fontFamily: node.text.fontFamily,
        lineHeight: node.text.lineHeight
      },
      maxWidth
    );

    return {
      width: isFixedW ? node.width : measured.width,
      height: isFixedH ? node.height : measured.height
    };
  }

  // --- IMAGE MEASUREMENT ---
  if (node.type === 'IMAGE') {
    return {
      width: node.sizingHorizontal === 'FIXED' ? node.width : (availableWidth || 100), 
      height: node.sizingVertical === 'FIXED' ? node.height : 100
    };
  }

  // --- FRAME MEASUREMENT (Recursive) ---
  if (node.type === 'FRAME') {
    let calculatedWidth = node.width;
    let calculatedHeight = node.height;
    const isFixedW = node.sizingHorizontal === 'FIXED';
    const isFixedH = node.sizingVertical === 'FIXED';

    // Optimization: If fixed size, return immediately (ignoring children for measure pass)
    // Note: In a full engine, we might still measure children for constraints, but for now this is faster.
    if (isFixedW && isFixedH) return { width: calculatedWidth, height: calculatedHeight };

    const paddingX = (node.padding?.left || 0) + (node.padding?.right || 0);
    const paddingY = (node.padding?.top || 0) + (node.padding?.bottom || 0);
    const gap = node.gap || 0;

    // We need to determine Available Width for children.
    // If we are FIXED width, children have that width minus padding.
    // If we are HUG width, children are unconstrained (undefined).
    const childAvailableWidth = isFixedW ? Math.max(0, calculatedWidth - paddingX) : undefined;

    let totalChildSizeMain = 0;
    let maxChildSizeCross = 0;
    
    // Measure Children
    const childMeasurements = node.children.map(child => measureNode(child, childAvailableWidth));

    if (node.layoutMode === 'HORIZONTAL') {
      // Row
      childMeasurements.forEach(m => {
        totalChildSizeMain += m.width;
        maxChildSizeCross = Math.max(maxChildSizeCross, m.height);
      });
      totalChildSizeMain += Math.max(0, childMeasurements.length - 1) * gap;
      
      if (!isFixedW) calculatedWidth = totalChildSizeMain + paddingX;
      if (!isFixedH) calculatedHeight = maxChildSizeCross + paddingY;

    } else { 
      // Column
      childMeasurements.forEach(m => {
        totalChildSizeMain += m.height;
        maxChildSizeCross = Math.max(maxChildSizeCross, m.width);
      });
      totalChildSizeMain += Math.max(0, childMeasurements.length - 1) * gap;

      if (!isFixedW) calculatedWidth = maxChildSizeCross + paddingX;
      if (!isFixedH) calculatedHeight = totalChildSizeMain + paddingY;
    }

    return { 
        width: Math.max(calculatedWidth, 0), 
        height: Math.max(calculatedHeight, 0) 
    };
  }

  return { width: 0, height: 0 };
}


// Pass 2: Layout Calculation (Layout Pass)
// Determines absolute coordinates based on measurements
export function calculateLayout(
  root: SceneNode, 
  containerWidth: number = 800, 
  containerHeight: number = 600
): LayoutMap {
  
  // If engine isn't ready (fonts not loaded), we can't layout accurately.
  // We return a basic map to prevent crash, but UI should show loading.
  if (!RenderEngine.isReady) {
    return { [root.id]: { x: 0, y: 0, width: containerWidth, height: containerHeight }};
  }

  const layoutMap: LayoutMap = {};

  // 0. Resolve Root Dimensions
  // If root is HUG, we need to measure it first to get the bounding box.
  let rootX = 0;
  let rootY = 0;
  let rootW = root.width;
  let rootH = root.height;

  if (root.sizingHorizontal === 'HUG' || root.sizingVertical === 'HUG') {
      const availW = root.sizingHorizontal === 'FIXED' ? root.width : containerWidth;
      const measured = measureNode(root, availW);
      if (root.sizingHorizontal === 'HUG') rootW = measured.width;
      if (root.sizingVertical === 'HUG') rootH = measured.height;
  }
  
  if (root.sizingHorizontal === 'FILL') rootW = containerWidth;
  if (root.sizingVertical === 'FILL') rootH = containerHeight;

  function traverse(node: SceneNode, x: number, y: number, w: number, h: number) {
    // Record absolute position (Scene Graph -> Render Tree)
    layoutMap[node.id] = { x, y, width: w, height: h };

    if (node.type === 'FRAME') {
      const paddingLeft = node.padding?.left || 0;
      const paddingTop = node.padding?.top || 0;
      const paddingRight = node.padding?.right || 0;
      const paddingBottom = node.padding?.bottom || 0;
      const gap = node.gap || 0;

      const innerWidth = Math.max(0, w - paddingLeft - paddingRight);
      const innerHeight = Math.max(0, h - paddingTop - paddingBottom);

      const isRow = node.layoutMode === 'HORIZONTAL';
      
      let usedSpaceMain = 0;
      let fillCount = 0;

      // 1. Measure Children for Main Axis
      const childrenSizes = node.children.map(child => {
         const isChildFillMain = isRow ? child.sizingHorizontal === 'FILL' : child.sizingVertical === 'FILL';
         
         if (isChildFillMain) {
           fillCount++;
           return null; // Will calculate later
         } else {
           // Measure content
           const measured = measureNode(child, isRow ? undefined : innerWidth);
           usedSpaceMain += isRow ? measured.width : measured.height;
           return measured;
         }
      });

      usedSpaceMain += Math.max(0, node.children.length - 1) * gap;
      const remainingSpace = Math.max(0, (isRow ? innerWidth : innerHeight) - usedSpaceMain);
      const fillUnit = fillCount > 0 ? remainingSpace / fillCount : 0;

      // 2. Resolve final dimensions for children
      const finalChildLayouts = node.children.map((child, index) => {
         let childW = 0;
         let childH = 0;
         const preMeasured = childrenSizes[index];

         if (isRow) {
            // Horizontal
            if (child.sizingHorizontal === 'FILL') childW = fillUnit;
            else if (preMeasured) childW = preMeasured.width;

            if (child.sizingVertical === 'FILL') childH = innerHeight;
            else if (child.sizingVertical === 'FIXED') childH = child.height;
            else {
                // If HUG Vertical in a Row, we need to remeasure based on the final width we just calculated
                const reMeasure = measureNode(child, childW); 
                childH = reMeasure.height;
            }

         } else {
             // Vertical
             if (child.sizingHorizontal === 'FILL') childW = innerWidth;
             else if (child.sizingHorizontal === 'FIXED') childW = child.width;
             else {
                 // HUG Horizontal in Column
                 const reMeasure = measureNode(child, undefined);
                 childW = reMeasure.width;
             }

             if (child.sizingVertical === 'FILL') childH = fillUnit;
             else if (preMeasured) childH = preMeasured.height;
         }
         return { width: childW, height: childH, node: child };
      });

      // 3. Alignment & Positioning
      let currentX = x + paddingLeft;
      let currentY = y + paddingTop;
      let startOffset = 0;
      let distributionGap = gap;
      
      if (fillCount === 0) {
        // If no fill items, we might align content differently
        const totalContentSize = usedSpaceMain; 
        const availableMain = isRow ? innerWidth : innerHeight;
        const slack = Math.max(0, availableMain - totalContentSize);

        if (node.primaryAxisAlign === 'CENTER') startOffset = slack / 2;
        else if (node.primaryAxisAlign === 'END') startOffset = slack;
        else if (node.primaryAxisAlign === 'SPACE_BETWEEN' && node.children.length > 1) {
            distributionGap = gap + (slack / (node.children.length - 1));
        }
      }

      if (isRow) currentX += startOffset;
      else currentY += startOffset;

      finalChildLayouts.forEach((item) => {
         const { width: childW, height: childH, node: childNode } = item;
         
         let childX = currentX;
         let childY = currentY;

         // Cross Axis Alignment
         if (isRow) {
             const slackCross = innerHeight - childH;
             if (node.counterAxisAlign === 'CENTER') childY += slackCross / 2;
             else if (node.counterAxisAlign === 'END') childY += slackCross;
         } else {
             const slackCross = innerWidth - childW;
             if (node.counterAxisAlign === 'CENTER') childX += slackCross / 2;
             else if (node.counterAxisAlign === 'END') childX += slackCross;
         }

         traverse(childNode, childX, childY, childW, childH);

         if (isRow) currentX += childW + distributionGap;
         else currentY += childH + distributionGap;
      });
    }
  }

  // Start Traversal with Resolved Root Size
  traverse(root, rootX, rootY, rootW, rootH);
  
  return layoutMap;
}