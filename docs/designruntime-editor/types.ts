
export type NodeType = 'FRAME' | 'TEXT' | 'IMAGE';

export type LayoutMode = 'HORIZONTAL' | 'VERTICAL';
export type SizingMode = 'FIXED' | 'FILL' | 'HUG';
export type Alignment = 'START' | 'CENTER' | 'END' | 'SPACE_BETWEEN';

export interface Color {
  r: number;
  g: number;
  b: number;
  a: number;
}

export interface Padding {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export interface BaseNode {
  id: string;
  name: string;
  type: NodeType;
  parent?: string;
}

export interface LayoutProps {
  sizingHorizontal: SizingMode;
  sizingVertical: SizingMode;
  width: number; // Used if FIXED
  height: number; // Used if FIXED
  
  // Container props
  layoutMode?: LayoutMode;
  gap?: number;
  padding?: Padding;
  primaryAxisAlign?: Alignment; // Main axis
  counterAxisAlign?: Alignment; // Cross axis
}

export interface StyleProps {
  backgroundColor?: Color;
  cornerRadius?: number;
  strokeColor?: Color;
  strokeWidth?: number;
  opacity?: number;
}

export interface TextProps {
  content: string;
  fontSize: number;
  fontWeight: number; // 400, 500, 600, 700
  fontFamily: string;
  color: Color;
  textAlign: 'left' | 'center' | 'right';
  lineHeight: number; // Multiplier approx
}

export interface ImageProps {
  src: string; // URL
  fit: 'cover' | 'contain';
}

// Discriminated Union for Node Types
export interface FrameNode extends BaseNode, LayoutProps, StyleProps {
  type: 'FRAME';
  children: SceneNode[];
}

export interface TextNode extends BaseNode, LayoutProps {
  type: 'TEXT';
  text: TextProps;
}

export interface ImageNode extends BaseNode, LayoutProps, StyleProps {
  type: 'IMAGE';
  image: ImageProps;
}

export type SceneNode = FrameNode | TextNode | ImageNode;

export interface ComputedLayout {
  x: number;
  y: number;
  width: number;
  height: number;
}

export type LayoutMap = Record<string, ComputedLayout>;

// --- NEW ARCHITECTURE TYPES ---

// 1. IDENTITY BASE (Design System Source of Truth)
export interface IdentityBase {
    id: string;
    name: string;
    colors: {
        primary: Color;
        secondary: Color;
        background: Color;
        surface: Color;
        textMain: Color;
        textMuted: Color;
        divider: Color;
    };
    typography: {
        headings: { family: string; weight: number };
        body: { family: string; weight: number };
    };
    spacing: {
        base: number; // e.g. 4 or 8
    };
    cornerRadius: {
        small: number;
        medium: number;
        large: number;
    };
}

// 2. TEMPLATE (Derived Layout Definition)
// Defines the structure, dimensions, and initial content.
// It relies on an IdentityBase for values.
export interface Template {
    id: string;
    type: 'SYSTEM' | 'USER';
    ownerId: string | null;
    identityId: string; // Reference to Base
    name: string;
    category: 'SOCIAL' | 'PRINT' | 'PRESENTATION' | 'WEBSITE';
    width: number;
    height: number;
    pages: { name: string; node: SceneNode }[]; // Initial state of pages
    createdAt: number;
    updatedAt: number;
    preview?: string; // Base64 Data URL or Image URL
}

// 3. PAGE (Instance part)
export interface Page {
  id: string;
  name: string;
  node: SceneNode; // The root node of this page
}

// 4. DESIGN DOCUMENT (User Instance)
// This is the "Instantiated" version that the user edits.
// It contains a snapshot of the identity to ensure it doesn't break if Base changes later.
export interface DesignDocument {
  id: string;
  templateId: string;
  name: string;
  identity: IdentityBase; // Snapshot of the system used
  pages: Page[];
  lastModified: number;
  
  // Helper to track if this document is linked to a user template being edited directly
  // In a real app, we might separate "Editor Mode" vs "Instance Mode"
  // For this simplified persistence requirement, we'll assume we can save back to source template
  sourceTemplateId?: string; 
}

// --- EXPORT TYPES ---
export type ExportFormat = 'PNG' | 'PDF' | 'SVG';

export interface ExportOptions {
  format: ExportFormat;
  scale: number;
  transparentBackground: boolean;
  quality: number; // 0-1 for JPEG/WebP
  scope: 'CURRENT_PAGE' | 'ALL_PAGES';
}
