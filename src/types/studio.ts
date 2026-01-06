/**
 * Koyot Studio - Scene Graph Types
 * 
 * Arquitetura de dados para o editor de templates.
 * Baseado em conceitos do Figma com Auto-layout determinístico.
 */

// ============================================
// BASE TYPES
// ============================================

export type NodeType = 'FRAME' | 'TEXT' | 'IMAGE' | 'RECTANGLE' | 'ELLIPSE' | 'LINE'

export type LayoutMode = 'HORIZONTAL' | 'VERTICAL' | 'NONE'

export type SizingMode = 'FIXED' | 'HUG' | 'FILL'

export type Alignment = 'START' | 'CENTER' | 'END' | 'SPACE_BETWEEN'

export type TextAlign = 'LEFT' | 'CENTER' | 'RIGHT' | 'JUSTIFY'

export type FontWeight = 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900

export type BlendMode = 'NORMAL' | 'MULTIPLY' | 'SCREEN' | 'OVERLAY' | 'DARKEN' | 'LIGHTEN'

// ============================================
// GOVERNANCE & PERMISSIONS (CRUCIAL FOR NON-DESIGNERS)
// ============================================

/** Propriedades que podem ser bloqueadas para membros */
export type LockableProperty = 
  | 'position'
  | 'size'
  | 'rotation'
  | 'opacity'
  | 'fills'
  | 'border'
  | 'shadows'
  | 'cornerRadius'
  | 'gap'
  | 'padding'
  | 'layoutMode'
  | 'sizing'
  | 'alignment'
  | 'fontFamily'
  | 'fontSize'
  | 'fontWeight'
  | 'lineHeight'
  | 'letterSpacing'
  | 'textAlign'
  | 'textColor'
  | 'content'
  | 'image'

/** Papel do usuário no contexto de edição */
export type UserRole = 'owner' | 'admin' | 'editor' | 'member' | 'viewer'

/** Configuração de governança para um nó */
export interface NodeGovernance {
  /** Propriedades bloqueadas - membros não podem alterar */
  lockedProps: LockableProperty[]
  
  /** Se true, usuário só pode alterar conteúdo (texto/imagem), não layout */
  isContentOnly: boolean
  
  /** Papéis que podem editar este nó */
  editableBy: UserRole[]
  
  /** Limites de valores permitidos (ex: fontSize entre 12 e 48) */
  constraints?: {
    fontSize?: { min: number; max: number }
    gap?: { min: number; max: number }
    padding?: { min: number; max: number }
    opacity?: { min: number; max: number }
    cornerRadius?: { min: number; max: number }
    lineHeight?: { min: number; max: number }
    letterSpacing?: { min: number; max: number }
  }
  
  /** Cores permitidas da paleta da marca */
  allowedColors?: string[]
  
  /** Fontes permitidas do brand guide */
  allowedFonts?: string[]
  
  /** Se permite upload de imagens ou apenas do DAM */
  allowImageUpload: boolean
  
  /** Se permite crop/ajuste de imagem */
  allowImageCrop: boolean
  
  /** IDs de assets permitidos do DAM (para galeria restrita) */
  allowedAssetIds?: string[]
  
  /** Texto placeholder/exemplo */
  placeholder?: string
  
  /** Descrição/instrução para o usuário */
  helpText?: string
}

/** Valores padrão de governança */
export const DEFAULT_GOVERNANCE: NodeGovernance = {
  lockedProps: [],
  isContentOnly: false,
  editableBy: ['owner', 'admin', 'editor'],
  allowImageUpload: true,
  allowImageCrop: true,
}

/** Governança restritiva para membros (modo template) */
export const MEMBER_GOVERNANCE: NodeGovernance = {
  lockedProps: [
    'position', 'size', 'rotation', 'fills', 'border', 'shadows',
    'cornerRadius', 'gap', 'padding', 'layoutMode', 'sizing', 'alignment',
    'fontFamily', 'fontSize', 'fontWeight', 'lineHeight', 'letterSpacing', 'textAlign'
  ],
  isContentOnly: true,
  editableBy: ['owner', 'admin', 'editor', 'member'],
  allowImageUpload: false,
  allowImageCrop: false,
}

// ============================================
// GEOMETRY & STYLING
// ============================================

export interface Vector2D {
  x: number
  y: number
}

export interface Size {
  width: number
  height: number
}

export interface Padding {
  top: number
  right: number
  bottom: number
  left: number
}

export interface CornerRadius {
  topLeft: number
  topRight: number
  bottomRight: number
  bottomLeft: number
}

export interface Color {
  r: number // 0-255
  g: number // 0-255
  b: number // 0-255
  a: number // 0-1
}

export interface Shadow {
  color: Color
  offset: Vector2D
  blur: number
  spread: number
}

export interface Border {
  color: Color
  width: number
  style: 'SOLID' | 'DASHED' | 'DOTTED'
}

// ============================================
// AUTO-LAYOUT PROPERTIES (CRUCIAL)
// ============================================

export interface AutoLayoutProps {
  /** Direção do layout: horizontal, vertical ou livre */
  layoutMode: LayoutMode
  
  /** Como o nó dimensiona horizontalmente */
  horizontalSizing: SizingMode
  
  /** Como o nó dimensiona verticalmente */
  verticalSizing: SizingMode
  
  /** Alinhamento principal (direção do layout) */
  primaryAxisAlignment: Alignment
  
  /** Alinhamento secundário (perpendicular ao layout) */
  counterAxisAlignment: Alignment
  
  /** Espaçamento interno */
  padding: Padding
  
  /** Espaço entre elementos filhos */
  gap: number
  
  /** Se os filhos devem quebrar linha */
  wrap: boolean
}

// ============================================
// TEXT PROPERTIES
// ============================================

export interface TextStyle {
  fontFamily: string
  fontSize: number
  fontWeight: FontWeight
  fontStyle: 'normal' | 'italic'
  lineHeight: number | 'AUTO'
  letterSpacing: number
  textAlign: TextAlign
  textDecoration: 'NONE' | 'UNDERLINE' | 'STRIKETHROUGH'
  textTransform: 'NONE' | 'UPPERCASE' | 'LOWERCASE' | 'CAPITALIZE'
}

export interface TextProps {
  content: string
  style: TextStyle
  /** ID do estilo de texto da marca (typography token) */
  brandStyleId?: string
  /** Se o texto é editável pelo usuário final */
  editable: boolean
  /** Placeholder quando vazio */
  placeholder?: string
}

// ============================================
// IMAGE PROPERTIES
// ============================================

export interface ImageProps {
  /** ID do asset no DAM - ponte com o sistema de assets */
  assetId?: string
  /** URL direta da imagem (fallback) */
  src?: string
  /** Texto alternativo para acessibilidade */
  alt: string
  /** Como a imagem se ajusta ao container */
  objectFit: 'FILL' | 'FIT' | 'CROP' | 'TILE'
  /** Posição do crop */
  objectPosition: Vector2D
  /** Filtros aplicados */
  filters?: {
    brightness: number
    contrast: number
    saturation: number
    blur: number
  }
}

// ============================================
// FILL & EFFECTS
// ============================================

export type FillType = 'SOLID' | 'GRADIENT_LINEAR' | 'GRADIENT_RADIAL' | 'IMAGE'

export interface SolidFill {
  type: 'SOLID'
  color: Color
  /** ID da cor da marca (color token) */
  brandColorId?: string
}

export interface GradientStop {
  position: number // 0-1
  color: Color
}

export interface GradientFill {
  type: 'GRADIENT_LINEAR' | 'GRADIENT_RADIAL'
  stops: GradientStop[]
  angle?: number // Para linear
}

export interface ImageFill {
  type: 'IMAGE'
  assetId?: string
  src?: string
  scaleMode: 'FILL' | 'FIT' | 'TILE'
}

export type Fill = SolidFill | GradientFill | ImageFill

// ============================================
// BASE NODE
// ============================================

export interface BaseNode {
  /** Identificador único do nó */
  id: string
  
  /** Nome do nó (exibido na árvore de layers) */
  name: string
  
  /** Tipo do nó */
  type: NodeType
  
  /** Visibilidade */
  visible: boolean
  
  /** Bloqueado para edição */
  locked: boolean
  
  /** Opacidade (0-1) */
  opacity: number
  
  /** Modo de blend */
  blendMode: BlendMode
  
  /** Posição relativa ao pai */
  position: Vector2D
  
  /** Tamanho */
  size: Size
  
  /** Rotação em graus */
  rotation: number
  
  /** Arredondamento de cantos */
  cornerRadius: CornerRadius | number
  
  /** Preenchimentos (múltiplos permitidos) */
  fills: Fill[]
  
  /** Borda */
  border?: Border
  
  /** Sombras */
  shadows: Shadow[]
  
  /** Propriedades de auto-layout */
  autoLayout: AutoLayoutProps
  
  /** Governança - controle de permissões para não-designers */
  governance?: NodeGovernance
  
  /** Metadados customizados */
  metadata?: Record<string, unknown>
}

// ============================================
// SPECIFIC NODE TYPES
// ============================================

export interface FrameNode extends BaseNode {
  type: 'FRAME'
  /** Filhos do frame (estrutura de árvore recursiva) */
  children: SceneNode[]
  /** Se deve clipar conteúdo que excede os limites */
  clipsContent: boolean
}

export interface TextNode extends BaseNode {
  type: 'TEXT'
  /** Propriedades específicas de texto */
  textProps: TextProps
}

export interface ImageNode extends BaseNode {
  type: 'IMAGE'
  /** Propriedades específicas de imagem */
  imageProps: ImageProps
}

export interface RectangleNode extends BaseNode {
  type: 'RECTANGLE'
}

export interface EllipseNode extends BaseNode {
  type: 'ELLIPSE'
  /** Ângulo inicial do arco (para criar arcos parciais) */
  arcStartAngle?: number
  /** Ângulo final do arco */
  arcEndAngle?: number
}

export interface LineNode extends BaseNode {
  type: 'LINE'
  /** Ponto inicial */
  startPoint: Vector2D
  /** Ponto final */
  endPoint: Vector2D
  /** Estilo da linha */
  strokeCap: 'NONE' | 'ROUND' | 'SQUARE'
}

// ============================================
// SCENE NODE (UNION TYPE)
// ============================================

export type SceneNode = 
  | FrameNode 
  | TextNode 
  | ImageNode 
  | RectangleNode 
  | EllipseNode 
  | LineNode

// ============================================
// TEMPLATE TYPES
// ============================================

export type TemplateCategory = 
  | 'social_instagram'
  | 'social_linkedin'
  | 'social_twitter'
  | 'social_facebook'
  | 'print_business_card'
  | 'print_flyer'
  | 'print_poster'
  | 'print_one_pager'
  | 'digital_web_banner'
  | 'digital_email_header'
  | 'digital_newsletter'
  | 'presentation'
  | 'report'
  | 'other'

export type TemplateFormat = 
  | 'instagram_post'      // 1080x1080
  | 'instagram_story'     // 1080x1920
  | 'instagram_reel'      // 1080x1920
  | 'linkedin_post'       // 1200x627
  | 'linkedin_banner'     // 1584x396
  | 'twitter_post'        // 1200x675
  | 'facebook_post'       // 1200x630
  | 'facebook_cover'      // 820x312
  | 'business_card'       // 1050x600 (3.5x2 inches at 300dpi)
  | 'flyer_a5'            // 1748x2480
  | 'flyer_a4'            // 2480x3508
  | 'poster_a3'           // 3508x4961
  | 'one_pager'           // 2480x3508
  | 'web_banner_leaderboard' // 728x90
  | 'web_banner_medium'   // 300x250
  | 'web_banner_skyscraper' // 160x600
  | 'email_header'        // 600x200
  | 'custom'

export interface TemplateFormatInfo {
  format: TemplateFormat
  name: string
  width: number
  height: number
  category: TemplateCategory
  unit: 'px' | 'mm' | 'in'
}

export interface Template {
  id: string
  brandId: string
  name: string
  description?: string
  category: TemplateCategory
  format: TemplateFormat
  thumbnailUrl?: string
  /** Nó raiz da árvore de cena */
  rootNode: FrameNode
  /** Versão do schema para migrações futuras */
  schemaVersion: number
  /** Tags para busca */
  tags: string[]
  /** Se é um template público da plataforma */
  isPublic: boolean
  /** Se foi gerado por IA */
  aiGenerated: boolean
  createdAt: string
  updatedAt: string
  createdBy: string
}

// ============================================
// EDITOR STATE
// ============================================

export interface EditorState {
  /** Template sendo editado */
  template: Template
  /** IDs dos nós selecionados */
  selectedNodeIds: string[]
  /** Nível de zoom (1 = 100%) */
  zoom: number
  /** Offset do canvas */
  panOffset: Vector2D
  /** Histórico para undo/redo */
  history: {
    past: Template[]
    future: Template[]
  }
  /** Estado de UI */
  ui: {
    showGrid: boolean
    showRulers: boolean
    showGuides: boolean
    snapToGrid: boolean
    gridSize: number
  }
}

// ============================================
// HELPER FUNCTIONS
// ============================================

export const DEFAULT_AUTO_LAYOUT: AutoLayoutProps = {
  layoutMode: 'NONE',
  horizontalSizing: 'FIXED',
  verticalSizing: 'FIXED',
  primaryAxisAlignment: 'START',
  counterAxisAlignment: 'START',
  padding: { top: 0, right: 0, bottom: 0, left: 0 },
  gap: 0,
  wrap: false,
}

export const DEFAULT_TEXT_STYLE: TextStyle = {
  fontFamily: 'Inter',
  fontSize: 16,
  fontWeight: 400,
  fontStyle: 'normal',
  lineHeight: 'AUTO',
  letterSpacing: 0,
  textAlign: 'LEFT',
  textDecoration: 'NONE',
  textTransform: 'NONE',
}

export const TEMPLATE_FORMATS: Record<TemplateFormat, TemplateFormatInfo> = {
  instagram_post: { format: 'instagram_post', name: 'Instagram Post', width: 1080, height: 1080, category: 'social_instagram', unit: 'px' },
  instagram_story: { format: 'instagram_story', name: 'Instagram Story', width: 1080, height: 1920, category: 'social_instagram', unit: 'px' },
  instagram_reel: { format: 'instagram_reel', name: 'Instagram Reel', width: 1080, height: 1920, category: 'social_instagram', unit: 'px' },
  linkedin_post: { format: 'linkedin_post', name: 'LinkedIn Post', width: 1200, height: 627, category: 'social_linkedin', unit: 'px' },
  linkedin_banner: { format: 'linkedin_banner', name: 'LinkedIn Banner', width: 1584, height: 396, category: 'social_linkedin', unit: 'px' },
  twitter_post: { format: 'twitter_post', name: 'Twitter Post', width: 1200, height: 675, category: 'social_twitter', unit: 'px' },
  facebook_post: { format: 'facebook_post', name: 'Facebook Post', width: 1200, height: 630, category: 'social_facebook', unit: 'px' },
  facebook_cover: { format: 'facebook_cover', name: 'Facebook Cover', width: 820, height: 312, category: 'social_facebook', unit: 'px' },
  business_card: { format: 'business_card', name: 'Business Card', width: 1050, height: 600, category: 'print_business_card', unit: 'px' },
  flyer_a5: { format: 'flyer_a5', name: 'Flyer A5', width: 1748, height: 2480, category: 'print_flyer', unit: 'px' },
  flyer_a4: { format: 'flyer_a4', name: 'Flyer A4', width: 2480, height: 3508, category: 'print_flyer', unit: 'px' },
  poster_a3: { format: 'poster_a3', name: 'Poster A3', width: 3508, height: 4961, category: 'print_poster', unit: 'px' },
  one_pager: { format: 'one_pager', name: 'One-Pager', width: 2480, height: 3508, category: 'print_one_pager', unit: 'px' },
  web_banner_leaderboard: { format: 'web_banner_leaderboard', name: 'Leaderboard Banner', width: 728, height: 90, category: 'digital_web_banner', unit: 'px' },
  web_banner_medium: { format: 'web_banner_medium', name: 'Medium Rectangle', width: 300, height: 250, category: 'digital_web_banner', unit: 'px' },
  web_banner_skyscraper: { format: 'web_banner_skyscraper', name: 'Skyscraper', width: 160, height: 600, category: 'digital_web_banner', unit: 'px' },
  email_header: { format: 'email_header', name: 'Email Header', width: 600, height: 200, category: 'digital_email_header', unit: 'px' },
  custom: { format: 'custom', name: 'Custom', width: 800, height: 600, category: 'other', unit: 'px' },
}

export const CATEGORY_LABELS: Record<TemplateCategory, string> = {
  social_instagram: 'Instagram',
  social_linkedin: 'LinkedIn',
  social_twitter: 'Twitter',
  social_facebook: 'Facebook',
  print_business_card: 'Business Cards',
  print_flyer: 'Flyers',
  print_poster: 'Posters',
  print_one_pager: 'One-Pagers',
  digital_web_banner: 'Web Banners',
  digital_email_header: 'Email Headers',
  digital_newsletter: 'Newsletters',
  presentation: 'Presentations',
  report: 'Reports',
  other: 'Other',
}

export const CATEGORY_GROUPS = {
  'Social Media & Ads': ['social_instagram', 'social_linkedin', 'social_twitter', 'social_facebook'],
  'Print': ['print_business_card', 'print_flyer', 'print_poster', 'print_one_pager'],
  'Digital': ['digital_web_banner', 'digital_email_header', 'digital_newsletter'],
  'Documents': ['presentation', 'report', 'other'],
} as const

/** Cria um ID único para nós */
export function generateNodeId(): string {
  return `node_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

/** Encontra um nó por ID na árvore */
export function findNodeById(root: SceneNode, id: string): SceneNode | null {
  if (root.id === id) return root
  if (root.type === 'FRAME') {
    for (const child of root.children) {
      const found = findNodeById(child, id)
      if (found) return found
    }
  }
  return null
}

/** Retorna todos os nós da árvore como array plano */
export function flattenNodes(root: SceneNode): SceneNode[] {
  const nodes: SceneNode[] = [root]
  if (root.type === 'FRAME') {
    for (const child of root.children) {
      nodes.push(...flattenNodes(child))
    }
  }
  return nodes
}
