/**
 * EQI Financial Report Template V3 - Design Premium
 * 
 * Tabelas com colunas FIXAS para alinhamento perfeito
 * Identidade visual real da EQI
 */

import type { Template, FrameNode, TextNode, Color } from '@/types/studio'
import { DEFAULT_GOVERNANCE } from '@/types/studio'
import { DATA_FIELD_GOVERNANCE } from '@/lib/brands/eqi-design-system'

const EQI_BRAND_ID = 'a0295b8d-c0f9-49db-b839-8a6021d3ecf7'

// Design Tokens
const C = {
  primary: { r: 13, g: 59, b: 47, a: 1 } as Color,
  accent: { r: 0, g: 200, b: 150, a: 1 } as Color,
  white: { r: 255, g: 255, b: 255, a: 1 } as Color,
  cream: { r: 250, g: 248, b: 245, a: 1 } as Color,
  textDark: { r: 13, g: 59, b: 47, a: 1 } as Color,
  textBody: { r: 51, g: 51, b: 51, a: 1 } as Color,
  textMuted: { r: 128, g: 128, b: 128, a: 1 } as Color,
  textWhite: { r: 255, g: 255, b: 255, a: 1 } as Color,
  success: { r: 0, g: 200, b: 150, a: 1 } as Color,
  error: { r: 220, g: 53, b: 69, a: 1 } as Color,
  tableRowAlt: { r: 250, g: 251, b: 252, a: 1 } as Color,
  border: { r: 229, g: 231, b: 235, a: 1 } as Color,
}

import type { TextStyle } from '@/types/studio'

const baseStyle = {
  fontStyle: 'normal' as const,
  letterSpacing: 0,
  textAlign: 'LEFT' as const,
  textDecoration: 'NONE' as const,
  textTransform: 'NONE' as const,
}

const T: Record<string, TextStyle> = {
  display: { ...baseStyle, fontFamily: 'Inter', fontSize: 44, fontWeight: 600, lineHeight: 1.1 },
  h1: { ...baseStyle, fontFamily: 'Inter', fontSize: 28, fontWeight: 600, lineHeight: 1.3 },
  h2: { ...baseStyle, fontFamily: 'Inter', fontSize: 22, fontWeight: 600, lineHeight: 1.3 },
  h3: { ...baseStyle, fontFamily: 'Inter', fontSize: 18, fontWeight: 600, lineHeight: 1.4 },
  body: { ...baseStyle, fontFamily: 'Inter', fontSize: 14, fontWeight: 400, lineHeight: 1.5 },
  bodySm: { ...baseStyle, fontFamily: 'Inter', fontSize: 12, fontWeight: 400, lineHeight: 1.5 },
  label: { ...baseStyle, fontFamily: 'Inter', fontSize: 10, fontWeight: 600, lineHeight: 1.4, letterSpacing: 0.08 },
}

const PAGE = { W: 1240, H: 1754, M: 60 }

// Helper: criar célula com largura FIXA
function cell(id: string, text: string, w: number, isHead: boolean, align: 'LEFT'|'RIGHT'|'CENTER' = 'LEFT', color?: Color): FrameNode {
  return {
    id, name: text, type: 'FRAME', visible: true, locked: isHead, opacity: 1, blendMode: 'NORMAL',
    position: { x: 0, y: 0 }, size: { width: w, height: 0 }, rotation: 0, cornerRadius: 0,
    fills: [], shadows: [],
    autoLayout: {
      layoutMode: 'HORIZONTAL', horizontalSizing: 'FIXED', verticalSizing: 'HUG',
      primaryAxisAlignment: align === 'LEFT' ? 'START' : align === 'RIGHT' ? 'END' : 'CENTER',
      counterAxisAlignment: 'CENTER', padding: { top: 0, right: 0, bottom: 0, left: 0 }, gap: 0, wrap: false,
    },
    clipsContent: false,
    children: [{
      id: `${id}-t`, name: text, type: 'TEXT', visible: true, locked: isHead, opacity: 1, blendMode: 'NORMAL',
      position: { x: 0, y: 0 }, size: { width: 0, height: 0 }, rotation: 0, cornerRadius: 0,
      fills: [{ type: 'SOLID', color: color || (isHead ? C.textWhite : C.textBody) }], shadows: [],
      autoLayout: { layoutMode: 'NONE', horizontalSizing: 'HUG', verticalSizing: 'HUG', primaryAxisAlignment: 'START', counterAxisAlignment: 'START', padding: { top: 0, right: 0, bottom: 0, left: 0 }, gap: 0, wrap: false },
      governance: isHead ? DEFAULT_GOVERNANCE : DATA_FIELD_GOVERNANCE,
      textProps: { content: text, style: { ...T.body, fontWeight: isHead ? 600 : 400, textAlign: align }, editable: !isHead },
    } as TextNode],
    governance: DEFAULT_GOVERNANCE,
  }
}

// Helper: criar linha da tabela
function row(id: string, cells: FrameNode[], isHead: boolean, alt: boolean = false): FrameNode {
  return {
    id, name: isHead ? 'Header' : 'Row', type: 'FRAME', visible: true, locked: isHead, opacity: 1, blendMode: 'NORMAL',
    position: { x: 0, y: 0 }, size: { width: 0, height: 0 }, rotation: 0, cornerRadius: isHead ? 8 : 0,
    fills: [{ type: 'SOLID', color: isHead ? C.primary : (alt ? C.tableRowAlt : C.white) }], shadows: [],
    autoLayout: {
      layoutMode: 'HORIZONTAL', horizontalSizing: 'FILL', verticalSizing: 'HUG',
      primaryAxisAlignment: 'START', counterAxisAlignment: 'CENTER',
      padding: { top: 14, right: 20, bottom: 14, left: 20 }, gap: 0, wrap: false,
    },
    clipsContent: isHead, children: cells, governance: DEFAULT_GOVERNANCE,
  }
}

// Larguras das colunas (total = 1080px = PAGE.W - 2*PAGE.M - 2*rowPadding)
// Row padding = 20 left + 20 right = 40px, então: 1240 - 120 - 40 = 1080px
const COL = { asset: 300, value: 180, pct: 140, rentM: 200, rentY: 260 }
const MOV_COL = { date: 100, desc: 440, type: 180, value: 360 }

// ============ HEADER ============
const header: FrameNode = {
  id: 'v3-header', name: 'Header', type: 'FRAME', visible: true, locked: true, opacity: 1, blendMode: 'NORMAL',
  position: { x: 0, y: 0 }, size: { width: PAGE.W, height: 100 }, rotation: 0, cornerRadius: 0,
  fills: [{ type: 'SOLID', color: C.primary }], shadows: [],
  autoLayout: {
    layoutMode: 'HORIZONTAL', horizontalSizing: 'FIXED', verticalSizing: 'FIXED',
    primaryAxisAlignment: 'SPACE_BETWEEN', counterAxisAlignment: 'CENTER',
    padding: { top: 0, right: PAGE.M, bottom: 0, left: PAGE.M }, gap: 24, wrap: false,
  },
  clipsContent: false,
  children: [
    { id: 'v3-logo', name: 'Logo', type: 'TEXT', visible: true, locked: true, opacity: 1, blendMode: 'NORMAL', position: { x: 0, y: 0 }, size: { width: 0, height: 0 }, rotation: 0, cornerRadius: 0, fills: [{ type: 'SOLID', color: C.textWhite }], shadows: [], autoLayout: { layoutMode: 'NONE', horizontalSizing: 'HUG', verticalSizing: 'HUG', primaryAxisAlignment: 'START', counterAxisAlignment: 'START', padding: { top: 0, right: 0, bottom: 0, left: 0 }, gap: 0, wrap: false }, governance: DEFAULT_GOVERNANCE, textProps: { content: 'EQI', style: { ...T.display, fontSize: 36 }, editable: false } } as TextNode,
    { id: 'v3-title', name: 'Title', type: 'TEXT', visible: true, locked: false, opacity: 1, blendMode: 'NORMAL', position: { x: 0, y: 0 }, size: { width: 0, height: 0 }, rotation: 0, cornerRadius: 0, fills: [{ type: 'SOLID', color: C.textWhite }], shadows: [], autoLayout: { layoutMode: 'NONE', horizontalSizing: 'HUG', verticalSizing: 'HUG', primaryAxisAlignment: 'START', counterAxisAlignment: 'START', padding: { top: 0, right: 0, bottom: 0, left: 0 }, gap: 0, wrap: false }, governance: DEFAULT_GOVERNANCE, textProps: { content: 'Relatório de Performance', style: { ...T.h2, fontWeight: 400 }, editable: true } } as TextNode,
  ],
  governance: DEFAULT_GOVERNANCE,
}

// ============ CLIENT INFO ============
const clientInfo: FrameNode = {
  id: 'v3-client', name: 'Client', type: 'FRAME', visible: true, locked: false, opacity: 1, blendMode: 'NORMAL',
  position: { x: 0, y: 0 }, size: { width: 0, height: 0 }, rotation: 0, cornerRadius: 0, fills: [], shadows: [],
  autoLayout: { layoutMode: 'HORIZONTAL', horizontalSizing: 'FILL', verticalSizing: 'HUG', primaryAxisAlignment: 'SPACE_BETWEEN', counterAxisAlignment: 'START', padding: { top: 28, right: 0, bottom: 28, left: 0 }, gap: 40, wrap: false },
  clipsContent: false,
  children: [
    { id: 'v3-cl-left', name: 'Left', type: 'FRAME', visible: true, locked: false, opacity: 1, blendMode: 'NORMAL', position: { x: 0, y: 0 }, size: { width: 400, height: 0 }, rotation: 0, cornerRadius: 0, fills: [], shadows: [], autoLayout: { layoutMode: 'VERTICAL', horizontalSizing: 'FIXED', verticalSizing: 'HUG', primaryAxisAlignment: 'START', counterAxisAlignment: 'START', padding: { top: 0, right: 0, bottom: 0, left: 0 }, gap: 4, wrap: false }, clipsContent: false, children: [
      { id: 'v3-cl-lbl', name: 'Lbl', type: 'TEXT', visible: true, locked: true, opacity: 1, blendMode: 'NORMAL', position: { x: 0, y: 0 }, size: { width: 400, height: 0 }, rotation: 0, cornerRadius: 0, fills: [{ type: 'SOLID', color: C.textMuted }], shadows: [], autoLayout: { layoutMode: 'NONE', horizontalSizing: 'FIXED', verticalSizing: 'HUG', primaryAxisAlignment: 'START', counterAxisAlignment: 'START', padding: { top: 0, right: 0, bottom: 0, left: 0 }, gap: 0, wrap: false }, governance: DEFAULT_GOVERNANCE, textProps: { content: 'CLIENTE', style: T.label, editable: false } } as TextNode,
      { id: 'v3-cl-name', name: 'Name', type: 'TEXT', visible: true, locked: false, opacity: 1, blendMode: 'NORMAL', position: { x: 0, y: 0 }, size: { width: 400, height: 0 }, rotation: 0, cornerRadius: 0, fills: [{ type: 'SOLID', color: C.textDark }], shadows: [], autoLayout: { layoutMode: 'NONE', horizontalSizing: 'FIXED', verticalSizing: 'HUG', primaryAxisAlignment: 'START', counterAxisAlignment: 'START', padding: { top: 0, right: 0, bottom: 0, left: 0 }, gap: 0, wrap: false }, governance: DATA_FIELD_GOVERNANCE, textProps: { content: 'João Carlos da Silva', style: T.h1, editable: true } } as TextNode,
      { id: 'v3-cl-info', name: 'Info', type: 'TEXT', visible: true, locked: false, opacity: 1, blendMode: 'NORMAL', position: { x: 0, y: 0 }, size: { width: 400, height: 0 }, rotation: 0, cornerRadius: 0, fills: [{ type: 'SOLID', color: C.textMuted }], shadows: [], autoLayout: { layoutMode: 'NONE', horizontalSizing: 'FIXED', verticalSizing: 'HUG', primaryAxisAlignment: 'START', counterAxisAlignment: 'START', padding: { top: 0, right: 0, bottom: 0, left: 0 }, gap: 0, wrap: false }, governance: DATA_FIELD_GOVERNANCE, textProps: { content: 'Conta: 12345-6 • CPF: ***.***789-00', style: T.body, editable: true } } as TextNode,
    ], governance: DEFAULT_GOVERNANCE } as FrameNode,
    { id: 'v3-cl-right', name: 'Right', type: 'FRAME', visible: true, locked: false, opacity: 1, blendMode: 'NORMAL', position: { x: 0, y: 0 }, size: { width: 250, height: 0 }, rotation: 0, cornerRadius: 0, fills: [], shadows: [], autoLayout: { layoutMode: 'VERTICAL', horizontalSizing: 'FIXED', verticalSizing: 'HUG', primaryAxisAlignment: 'START', counterAxisAlignment: 'END', padding: { top: 0, right: 0, bottom: 0, left: 0 }, gap: 4, wrap: false }, clipsContent: false, children: [
      { id: 'v3-pd-lbl', name: 'Lbl', type: 'TEXT', visible: true, locked: true, opacity: 1, blendMode: 'NORMAL', position: { x: 0, y: 0 }, size: { width: 250, height: 0 }, rotation: 0, cornerRadius: 0, fills: [{ type: 'SOLID', color: C.textMuted }], shadows: [], autoLayout: { layoutMode: 'NONE', horizontalSizing: 'FIXED', verticalSizing: 'HUG', primaryAxisAlignment: 'START', counterAxisAlignment: 'START', padding: { top: 0, right: 0, bottom: 0, left: 0 }, gap: 0, wrap: false }, governance: DEFAULT_GOVERNANCE, textProps: { content: 'PERÍODO', style: { ...T.label, textAlign: 'RIGHT' }, editable: false } } as TextNode,
      { id: 'v3-pd-val', name: 'Val', type: 'TEXT', visible: true, locked: false, opacity: 1, blendMode: 'NORMAL', position: { x: 0, y: 0 }, size: { width: 250, height: 0 }, rotation: 0, cornerRadius: 0, fills: [{ type: 'SOLID', color: C.textDark }], shadows: [], autoLayout: { layoutMode: 'NONE', horizontalSizing: 'FIXED', verticalSizing: 'HUG', primaryAxisAlignment: 'START', counterAxisAlignment: 'START', padding: { top: 0, right: 0, bottom: 0, left: 0 }, gap: 0, wrap: false }, governance: DATA_FIELD_GOVERNANCE, textProps: { content: 'Janeiro 2026', style: { ...T.h1, textAlign: 'RIGHT' }, editable: true } } as TextNode,
      { id: 'v3-pd-dates', name: 'Dates', type: 'TEXT', visible: true, locked: false, opacity: 1, blendMode: 'NORMAL', position: { x: 0, y: 0 }, size: { width: 250, height: 0 }, rotation: 0, cornerRadius: 0, fills: [{ type: 'SOLID', color: C.textMuted }], shadows: [], autoLayout: { layoutMode: 'NONE', horizontalSizing: 'FIXED', verticalSizing: 'HUG', primaryAxisAlignment: 'START', counterAxisAlignment: 'START', padding: { top: 0, right: 0, bottom: 0, left: 0 }, gap: 0, wrap: false }, governance: DATA_FIELD_GOVERNANCE, textProps: { content: '01/01/2026 a 31/01/2026', style: { ...T.body, textAlign: 'RIGHT' }, editable: true } } as TextNode,
    ], governance: DEFAULT_GOVERNANCE } as FrameNode,
  ],
  governance: DEFAULT_GOVERNANCE,
}

// ============ PATRIMONIO HERO ============
const patrimonioHero: FrameNode = {
  id: 'v3-hero', name: 'Hero', type: 'FRAME', visible: true, locked: false, opacity: 1, blendMode: 'NORMAL',
  position: { x: 0, y: 0 }, size: { width: 0, height: 0 }, rotation: 0, cornerRadius: 12,
  fills: [{ type: 'SOLID', color: C.cream }], shadows: [],
  autoLayout: { layoutMode: 'HORIZONTAL', horizontalSizing: 'FILL', verticalSizing: 'HUG', primaryAxisAlignment: 'SPACE_BETWEEN', counterAxisAlignment: 'CENTER', padding: { top: 28, right: 32, bottom: 28, left: 32 }, gap: 24, wrap: false },
  clipsContent: false,
  children: [
    { id: 'v3-pat-main', name: 'Pat', type: 'FRAME', visible: true, locked: false, opacity: 1, blendMode: 'NORMAL', position: { x: 0, y: 0 }, size: { width: 0, height: 0 }, rotation: 0, cornerRadius: 0, fills: [], shadows: [], autoLayout: { layoutMode: 'VERTICAL', horizontalSizing: 'HUG', verticalSizing: 'HUG', primaryAxisAlignment: 'START', counterAxisAlignment: 'START', padding: { top: 0, right: 0, bottom: 0, left: 0 }, gap: 6, wrap: false }, clipsContent: false, children: [
      { id: 'v3-pat-lbl', name: 'Lbl', type: 'TEXT', visible: true, locked: true, opacity: 1, blendMode: 'NORMAL', position: { x: 0, y: 0 }, size: { width: 0, height: 0 }, rotation: 0, cornerRadius: 0, fills: [{ type: 'SOLID', color: C.textMuted }], shadows: [], autoLayout: { layoutMode: 'NONE', horizontalSizing: 'HUG', verticalSizing: 'HUG', primaryAxisAlignment: 'START', counterAxisAlignment: 'START', padding: { top: 0, right: 0, bottom: 0, left: 0 }, gap: 0, wrap: false }, governance: DEFAULT_GOVERNANCE, textProps: { content: 'PATRIMÔNIO TOTAL', style: T.label, editable: false } } as TextNode,
      { id: 'v3-pat-val', name: 'Val', type: 'TEXT', visible: true, locked: false, opacity: 1, blendMode: 'NORMAL', position: { x: 0, y: 0 }, size: { width: 0, height: 0 }, rotation: 0, cornerRadius: 0, fills: [{ type: 'SOLID', color: C.textDark }], shadows: [], autoLayout: { layoutMode: 'NONE', horizontalSizing: 'HUG', verticalSizing: 'HUG', primaryAxisAlignment: 'START', counterAxisAlignment: 'START', padding: { top: 0, right: 0, bottom: 0, left: 0 }, gap: 0, wrap: false }, governance: DATA_FIELD_GOVERNANCE, textProps: { content: 'R$ 1.250.000,00', style: T.display, editable: true } } as TextNode,
      { id: 'v3-pat-chg', name: 'Chg', type: 'TEXT', visible: true, locked: false, opacity: 1, blendMode: 'NORMAL', position: { x: 0, y: 0 }, size: { width: 0, height: 0 }, rotation: 0, cornerRadius: 0, fills: [{ type: 'SOLID', color: C.accent }], shadows: [], autoLayout: { layoutMode: 'NONE', horizontalSizing: 'HUG', verticalSizing: 'HUG', primaryAxisAlignment: 'START', counterAxisAlignment: 'START', padding: { top: 0, right: 0, bottom: 0, left: 0 }, gap: 0, wrap: false }, governance: DATA_FIELD_GOVERNANCE, textProps: { content: '↗ +R$ 45.320,00 no mês', style: { ...T.body, fontWeight: 500, fontSize: 15 }, editable: true } } as TextNode,
    ], governance: DEFAULT_GOVERNANCE } as FrameNode,
    { id: 'v3-kpis', name: 'KPIs', type: 'FRAME', visible: true, locked: false, opacity: 1, blendMode: 'NORMAL', position: { x: 0, y: 0 }, size: { width: 0, height: 0 }, rotation: 0, cornerRadius: 0, fills: [], shadows: [], autoLayout: { layoutMode: 'HORIZONTAL', horizontalSizing: 'HUG', verticalSizing: 'HUG', primaryAxisAlignment: 'END', counterAxisAlignment: 'START', padding: { top: 0, right: 0, bottom: 0, left: 0 }, gap: 40, wrap: false }, clipsContent: false, children: [
      { id: 'v3-k1', name: 'K1', type: 'FRAME', visible: true, locked: false, opacity: 1, blendMode: 'NORMAL', position: { x: 0, y: 0 }, size: { width: 110, height: 0 }, rotation: 0, cornerRadius: 0, fills: [], shadows: [], autoLayout: { layoutMode: 'VERTICAL', horizontalSizing: 'FIXED', verticalSizing: 'HUG', primaryAxisAlignment: 'START', counterAxisAlignment: 'END', padding: { top: 0, right: 0, bottom: 0, left: 0 }, gap: 2, wrap: false }, clipsContent: false, children: [
        { id: 'v3-k1-lbl', name: 'L', type: 'TEXT', visible: true, locked: true, opacity: 1, blendMode: 'NORMAL', position: { x: 0, y: 0 }, size: { width: 110, height: 0 }, rotation: 0, cornerRadius: 0, fills: [{ type: 'SOLID', color: C.textMuted }], shadows: [], autoLayout: { layoutMode: 'NONE', horizontalSizing: 'FIXED', verticalSizing: 'HUG', primaryAxisAlignment: 'START', counterAxisAlignment: 'START', padding: { top: 0, right: 0, bottom: 0, left: 0 }, gap: 0, wrap: false }, governance: DEFAULT_GOVERNANCE, textProps: { content: 'RENT. MÊS', style: { ...T.label, textAlign: 'RIGHT' }, editable: false } } as TextNode,
        { id: 'v3-k1-val', name: 'V', type: 'TEXT', visible: true, locked: false, opacity: 1, blendMode: 'NORMAL', position: { x: 0, y: 0 }, size: { width: 110, height: 0 }, rotation: 0, cornerRadius: 0, fills: [{ type: 'SOLID', color: C.accent }], shadows: [], autoLayout: { layoutMode: 'NONE', horizontalSizing: 'FIXED', verticalSizing: 'HUG', primaryAxisAlignment: 'START', counterAxisAlignment: 'START', padding: { top: 0, right: 0, bottom: 0, left: 0 }, gap: 0, wrap: false }, governance: DATA_FIELD_GOVERNANCE, textProps: { content: '+2,45%', style: { ...T.h1, fontSize: 28, textAlign: 'RIGHT' }, editable: true } } as TextNode,
        { id: 'v3-k1-sub', name: 'S', type: 'TEXT', visible: true, locked: false, opacity: 1, blendMode: 'NORMAL', position: { x: 0, y: 0 }, size: { width: 110, height: 0 }, rotation: 0, cornerRadius: 0, fills: [{ type: 'SOLID', color: C.textMuted }], shadows: [], autoLayout: { layoutMode: 'NONE', horizontalSizing: 'FIXED', verticalSizing: 'HUG', primaryAxisAlignment: 'START', counterAxisAlignment: 'START', padding: { top: 0, right: 0, bottom: 0, left: 0 }, gap: 0, wrap: false }, governance: DATA_FIELD_GOVERNANCE, textProps: { content: 'vs CDI +0,32%', style: { ...T.bodySm, textAlign: 'RIGHT' }, editable: true } } as TextNode,
      ], governance: DEFAULT_GOVERNANCE } as FrameNode,
      { id: 'v3-k2', name: 'K2', type: 'FRAME', visible: true, locked: false, opacity: 1, blendMode: 'NORMAL', position: { x: 0, y: 0 }, size: { width: 110, height: 0 }, rotation: 0, cornerRadius: 0, fills: [], shadows: [], autoLayout: { layoutMode: 'VERTICAL', horizontalSizing: 'FIXED', verticalSizing: 'HUG', primaryAxisAlignment: 'START', counterAxisAlignment: 'END', padding: { top: 0, right: 0, bottom: 0, left: 0 }, gap: 2, wrap: false }, clipsContent: false, children: [
        { id: 'v3-k2-lbl', name: 'L', type: 'TEXT', visible: true, locked: true, opacity: 1, blendMode: 'NORMAL', position: { x: 0, y: 0 }, size: { width: 110, height: 0 }, rotation: 0, cornerRadius: 0, fills: [{ type: 'SOLID', color: C.textMuted }], shadows: [], autoLayout: { layoutMode: 'NONE', horizontalSizing: 'FIXED', verticalSizing: 'HUG', primaryAxisAlignment: 'START', counterAxisAlignment: 'START', padding: { top: 0, right: 0, bottom: 0, left: 0 }, gap: 0, wrap: false }, governance: DEFAULT_GOVERNANCE, textProps: { content: 'RENT. ANO', style: { ...T.label, textAlign: 'RIGHT' }, editable: false } } as TextNode,
        { id: 'v3-k2-val', name: 'V', type: 'TEXT', visible: true, locked: false, opacity: 1, blendMode: 'NORMAL', position: { x: 0, y: 0 }, size: { width: 110, height: 0 }, rotation: 0, cornerRadius: 0, fills: [{ type: 'SOLID', color: C.accent }], shadows: [], autoLayout: { layoutMode: 'NONE', horizontalSizing: 'FIXED', verticalSizing: 'HUG', primaryAxisAlignment: 'START', counterAxisAlignment: 'START', padding: { top: 0, right: 0, bottom: 0, left: 0 }, gap: 0, wrap: false }, governance: DATA_FIELD_GOVERNANCE, textProps: { content: '+8,72%', style: { ...T.h1, fontSize: 28, textAlign: 'RIGHT' }, editable: true } } as TextNode,
        { id: 'v3-k2-sub', name: 'S', type: 'TEXT', visible: true, locked: false, opacity: 1, blendMode: 'NORMAL', position: { x: 0, y: 0 }, size: { width: 110, height: 0 }, rotation: 0, cornerRadius: 0, fills: [{ type: 'SOLID', color: C.textMuted }], shadows: [], autoLayout: { layoutMode: 'NONE', horizontalSizing: 'FIXED', verticalSizing: 'HUG', primaryAxisAlignment: 'START', counterAxisAlignment: 'START', padding: { top: 0, right: 0, bottom: 0, left: 0 }, gap: 0, wrap: false }, governance: DATA_FIELD_GOVERNANCE, textProps: { content: 'vs CDI +1,15%', style: { ...T.bodySm, textAlign: 'RIGHT' }, editable: true } } as TextNode,
      ], governance: DEFAULT_GOVERNANCE } as FrameNode,
      { id: 'v3-k3', name: 'K3', type: 'FRAME', visible: true, locked: false, opacity: 1, blendMode: 'NORMAL', position: { x: 0, y: 0 }, size: { width: 110, height: 0 }, rotation: 0, cornerRadius: 0, fills: [], shadows: [], autoLayout: { layoutMode: 'VERTICAL', horizontalSizing: 'FIXED', verticalSizing: 'HUG', primaryAxisAlignment: 'START', counterAxisAlignment: 'END', padding: { top: 0, right: 0, bottom: 0, left: 0 }, gap: 2, wrap: false }, clipsContent: false, children: [
        { id: 'v3-k3-lbl', name: 'L', type: 'TEXT', visible: true, locked: true, opacity: 1, blendMode: 'NORMAL', position: { x: 0, y: 0 }, size: { width: 110, height: 0 }, rotation: 0, cornerRadius: 0, fills: [{ type: 'SOLID', color: C.textMuted }], shadows: [], autoLayout: { layoutMode: 'NONE', horizontalSizing: 'FIXED', verticalSizing: 'HUG', primaryAxisAlignment: 'START', counterAxisAlignment: 'START', padding: { top: 0, right: 0, bottom: 0, left: 0 }, gap: 0, wrap: false }, governance: DEFAULT_GOVERNANCE, textProps: { content: 'DESDE INÍCIO', style: { ...T.label, textAlign: 'RIGHT' }, editable: false } } as TextNode,
        { id: 'v3-k3-val', name: 'V', type: 'TEXT', visible: true, locked: false, opacity: 1, blendMode: 'NORMAL', position: { x: 0, y: 0 }, size: { width: 110, height: 0 }, rotation: 0, cornerRadius: 0, fills: [{ type: 'SOLID', color: C.accent }], shadows: [], autoLayout: { layoutMode: 'NONE', horizontalSizing: 'FIXED', verticalSizing: 'HUG', primaryAxisAlignment: 'START', counterAxisAlignment: 'START', padding: { top: 0, right: 0, bottom: 0, left: 0 }, gap: 0, wrap: false }, governance: DATA_FIELD_GOVERNANCE, textProps: { content: '+42,18%', style: { ...T.h1, fontSize: 28, textAlign: 'RIGHT' }, editable: true } } as TextNode,
        { id: 'v3-k3-sub', name: 'S', type: 'TEXT', visible: true, locked: false, opacity: 1, blendMode: 'NORMAL', position: { x: 0, y: 0 }, size: { width: 110, height: 0 }, rotation: 0, cornerRadius: 0, fills: [{ type: 'SOLID', color: C.textMuted }], shadows: [], autoLayout: { layoutMode: 'NONE', horizontalSizing: 'FIXED', verticalSizing: 'HUG', primaryAxisAlignment: 'START', counterAxisAlignment: 'START', padding: { top: 0, right: 0, bottom: 0, left: 0 }, gap: 0, wrap: false }, governance: DATA_FIELD_GOVERNANCE, textProps: { content: 'Jan/2023', style: { ...T.bodySm, textAlign: 'RIGHT' }, editable: true } } as TextNode,
      ], governance: DEFAULT_GOVERNANCE } as FrameNode,
    ], governance: DEFAULT_GOVERNANCE } as FrameNode,
  ],
  governance: DEFAULT_GOVERNANCE,
}

// ============ ALLOCATION TABLE ============
const allocTitle: TextNode = { id: 'v3-alloc-t', name: 'T', type: 'TEXT', visible: true, locked: true, opacity: 1, blendMode: 'NORMAL', position: { x: 0, y: 0 }, size: { width: 0, height: 0 }, rotation: 0, cornerRadius: 0, fills: [{ type: 'SOLID', color: C.textDark }], shadows: [], autoLayout: { layoutMode: 'NONE', horizontalSizing: 'HUG', verticalSizing: 'HUG', primaryAxisAlignment: 'START', counterAxisAlignment: 'START', padding: { top: 0, right: 0, bottom: 0, left: 0 }, gap: 0, wrap: false }, governance: DEFAULT_GOVERNANCE, textProps: { content: 'Alocação por Classe de Ativo', style: T.h2, editable: false } }

const allocTable: FrameNode = {
  id: 'v3-alloc-tbl', name: 'Table', type: 'FRAME', visible: true, locked: false, opacity: 1, blendMode: 'NORMAL',
  position: { x: 0, y: 0 }, size: { width: 0, height: 0 }, rotation: 0, cornerRadius: 0, fills: [], shadows: [],
  autoLayout: { layoutMode: 'VERTICAL', horizontalSizing: 'FILL', verticalSizing: 'HUG', primaryAxisAlignment: 'START', counterAxisAlignment: 'START', padding: { top: 0, right: 0, bottom: 0, left: 0 }, gap: 1, wrap: false },
  clipsContent: false,
  children: [
    row('v3-ah', [cell('v3-ah1','Classe de Ativo',COL.asset,true), cell('v3-ah2','Valor (R$)',COL.value,true,'RIGHT'), cell('v3-ah3','% Carteira',COL.pct,true,'RIGHT'), cell('v3-ah4','Rent. Mês',COL.rentM,true,'RIGHT'), cell('v3-ah5','Rent. Ano',COL.rentY,true,'RIGHT')], true),
    row('v3-a1', [cell('v3-a11','Renda Fixa',COL.asset,false), cell('v3-a12','625.000,00',COL.value,false,'RIGHT'), cell('v3-a13','50,0%',COL.pct,false,'RIGHT'), cell('v3-a14','+1,12%',COL.rentM,false,'RIGHT',C.success), cell('v3-a15','+6,45%',COL.rentY,false,'RIGHT',C.success)], false, false),
    row('v3-a2', [cell('v3-a21','Renda Variável',COL.asset,false), cell('v3-a22','312.500,00',COL.value,false,'RIGHT'), cell('v3-a23','25,0%',COL.pct,false,'RIGHT'), cell('v3-a24','+4,85%',COL.rentM,false,'RIGHT',C.success), cell('v3-a25','+12,30%',COL.rentY,false,'RIGHT',C.success)], false, true),
    row('v3-a3', [cell('v3-a31','Fundos Multimercado',COL.asset,false), cell('v3-a32','187.500,00',COL.value,false,'RIGHT'), cell('v3-a33','15,0%',COL.pct,false,'RIGHT'), cell('v3-a34','+2,30%',COL.rentM,false,'RIGHT',C.success), cell('v3-a35','+8,90%',COL.rentY,false,'RIGHT',C.success)], false, false),
    row('v3-a4', [cell('v3-a41','Fundos Imobiliários',COL.asset,false), cell('v3-a42','125.000,00',COL.value,false,'RIGHT'), cell('v3-a43','10,0%',COL.pct,false,'RIGHT'), cell('v3-a44','+1,95%',COL.rentM,false,'RIGHT',C.success), cell('v3-a45','+7,20%',COL.rentY,false,'RIGHT',C.success)], false, true),
  ],
  governance: DEFAULT_GOVERNANCE,
}

const allocSection: FrameNode = { id: 'v3-alloc-sec', name: 'Alloc', type: 'FRAME', visible: true, locked: false, opacity: 1, blendMode: 'NORMAL', position: { x: 0, y: 0 }, size: { width: 0, height: 0 }, rotation: 0, cornerRadius: 0, fills: [], shadows: [], autoLayout: { layoutMode: 'VERTICAL', horizontalSizing: 'FILL', verticalSizing: 'HUG', primaryAxisAlignment: 'START', counterAxisAlignment: 'START', padding: { top: 28, right: 0, bottom: 0, left: 0 }, gap: 14, wrap: false }, clipsContent: false, children: [allocTitle, allocTable], governance: DEFAULT_GOVERNANCE }

// ============ MOVEMENTS TABLE ============
const movTitle: TextNode = { id: 'v3-mov-t', name: 'T', type: 'TEXT', visible: true, locked: true, opacity: 1, blendMode: 'NORMAL', position: { x: 0, y: 0 }, size: { width: 0, height: 0 }, rotation: 0, cornerRadius: 0, fills: [{ type: 'SOLID', color: C.textDark }], shadows: [], autoLayout: { layoutMode: 'NONE', horizontalSizing: 'HUG', verticalSizing: 'HUG', primaryAxisAlignment: 'START', counterAxisAlignment: 'START', padding: { top: 0, right: 0, bottom: 0, left: 0 }, gap: 0, wrap: false }, governance: DEFAULT_GOVERNANCE, textProps: { content: 'Movimentações do Período', style: T.h2, editable: false } }

const movTable: FrameNode = {
  id: 'v3-mov-tbl', name: 'Table', type: 'FRAME', visible: true, locked: false, opacity: 1, blendMode: 'NORMAL',
  position: { x: 0, y: 0 }, size: { width: 0, height: 0 }, rotation: 0, cornerRadius: 0, fills: [], shadows: [],
  autoLayout: { layoutMode: 'VERTICAL', horizontalSizing: 'FILL', verticalSizing: 'HUG', primaryAxisAlignment: 'START', counterAxisAlignment: 'START', padding: { top: 0, right: 0, bottom: 0, left: 0 }, gap: 1, wrap: false },
  clipsContent: false,
  children: [
    row('v3-mh', [cell('v3-mh1','Data',MOV_COL.date,true), cell('v3-mh2','Descrição',MOV_COL.desc,true), cell('v3-mh3','Tipo',MOV_COL.type,true,'CENTER'), cell('v3-mh4','Valor (R$)',MOV_COL.value,true,'RIGHT')], true),
    row('v3-m1', [cell('v3-m11','05/01/2026',MOV_COL.date,false), cell('v3-m12','Aplicação CDB Banco XYZ 120% CDI',MOV_COL.desc,false), cell('v3-m13','Aplicação',MOV_COL.type,false,'CENTER'), cell('v3-m14','+50.000,00',MOV_COL.value,false,'RIGHT',C.success)], false, false),
    row('v3-m2', [cell('v3-m21','12/01/2026',MOV_COL.date,false), cell('v3-m22','Dividendos PETR4 - Petrobras PN',MOV_COL.desc,false), cell('v3-m23','Provento',MOV_COL.type,false,'CENTER'), cell('v3-m24','+1.250,00',MOV_COL.value,false,'RIGHT',C.success)], false, true),
    row('v3-m3', [cell('v3-m31','18/01/2026',MOV_COL.date,false), cell('v3-m32','Resgate Fundo DI Premium',MOV_COL.desc,false), cell('v3-m33','Resgate',MOV_COL.type,false,'CENTER'), cell('v3-m34','-15.000,00',MOV_COL.value,false,'RIGHT',C.error)], false, false),
    row('v3-m4', [cell('v3-m41','25/01/2026',MOV_COL.date,false), cell('v3-m42','Rendimento FII HGLG11',MOV_COL.desc,false), cell('v3-m43','Provento',MOV_COL.type,false,'CENTER'), cell('v3-m44','+890,00',MOV_COL.value,false,'RIGHT',C.success)], false, true),
  ],
  governance: DEFAULT_GOVERNANCE,
}

const movSection: FrameNode = { id: 'v3-mov-sec', name: 'Mov', type: 'FRAME', visible: true, locked: false, opacity: 1, blendMode: 'NORMAL', position: { x: 0, y: 0 }, size: { width: 0, height: 0 }, rotation: 0, cornerRadius: 0, fills: [], shadows: [], autoLayout: { layoutMode: 'VERTICAL', horizontalSizing: 'FILL', verticalSizing: 'HUG', primaryAxisAlignment: 'START', counterAxisAlignment: 'START', padding: { top: 28, right: 0, bottom: 0, left: 0 }, gap: 14, wrap: false }, clipsContent: false, children: [movTitle, movTable], governance: DEFAULT_GOVERNANCE }

// ============ FOOTER ============
const footer: FrameNode = {
  id: 'v3-footer', name: 'Footer', type: 'FRAME', visible: true, locked: true, opacity: 1, blendMode: 'NORMAL',
  position: { x: 0, y: 0 }, size: { width: 0, height: 0 }, rotation: 0, cornerRadius: 0, fills: [], shadows: [],
  autoLayout: { layoutMode: 'VERTICAL', horizontalSizing: 'FILL', verticalSizing: 'HUG', primaryAxisAlignment: 'END', counterAxisAlignment: 'START', padding: { top: 32, right: 0, bottom: 0, left: 0 }, gap: 12, wrap: false },
  clipsContent: false,
  children: [
    { id: 'v3-ft-line', name: 'Line', type: 'FRAME', visible: true, locked: true, opacity: 1, blendMode: 'NORMAL', position: { x: 0, y: 0 }, size: { width: 0, height: 1 }, rotation: 0, cornerRadius: 0, fills: [{ type: 'SOLID', color: C.border }], shadows: [], autoLayout: { layoutMode: 'NONE', horizontalSizing: 'FILL', verticalSizing: 'FIXED', primaryAxisAlignment: 'START', counterAxisAlignment: 'START', padding: { top: 0, right: 0, bottom: 0, left: 0 }, gap: 0, wrap: false }, clipsContent: false, children: [], governance: DEFAULT_GOVERNANCE } as FrameNode,
    { id: 'v3-ft-txt', name: 'Disclaimer', type: 'TEXT', visible: true, locked: true, opacity: 1, blendMode: 'NORMAL', position: { x: 0, y: 0 }, size: { width: 0, height: 0 }, rotation: 0, cornerRadius: 0, fills: [{ type: 'SOLID', color: C.textMuted }], shadows: [], autoLayout: { layoutMode: 'NONE', horizontalSizing: 'FILL', verticalSizing: 'HUG', primaryAxisAlignment: 'START', counterAxisAlignment: 'START', padding: { top: 0, right: 0, bottom: 0, left: 0 }, gap: 0, wrap: false }, governance: DEFAULT_GOVERNANCE, textProps: { content: 'Este relatório é meramente informativo e não constitui recomendação de investimento. Rentabilidade passada não é garantia de rentabilidade futura. EQI Investimentos - CNPJ: 35.950.807/0001-90 - Av. Brigadeiro Faria Lima, 3477, 14º andar - São Paulo, SP', style: { ...T.bodySm, fontSize: 10, lineHeight: 1.4 }, editable: false } } as TextNode,
  ],
  governance: DEFAULT_GOVERNANCE,
}

// ============ CONTENT WRAPPER ============
const content: FrameNode = {
  id: 'v3-content', name: 'Content', type: 'FRAME', visible: true, locked: false, opacity: 1, blendMode: 'NORMAL',
  position: { x: 0, y: 0 }, size: { width: 0, height: 0 }, rotation: 0, cornerRadius: 0, fills: [], shadows: [],
  autoLayout: { layoutMode: 'VERTICAL', horizontalSizing: 'FILL', verticalSizing: 'FILL', primaryAxisAlignment: 'START', counterAxisAlignment: 'START', padding: { top: 0, right: PAGE.M, bottom: 40, left: PAGE.M }, gap: 0, wrap: false },
  clipsContent: false,
  children: [clientInfo, patrimonioHero, allocSection, movSection, footer],
  governance: DEFAULT_GOVERNANCE,
}

// ============ ROOT ============
const rootNode: FrameNode = {
  id: 'v3-root', name: 'Relatório V3', type: 'FRAME', visible: true, locked: false, opacity: 1, blendMode: 'NORMAL',
  position: { x: 0, y: 0 }, size: { width: PAGE.W, height: PAGE.H }, rotation: 0, cornerRadius: 0,
  fills: [{ type: 'SOLID', color: C.white }], shadows: [],
  autoLayout: { layoutMode: 'VERTICAL', horizontalSizing: 'FIXED', verticalSizing: 'FIXED', primaryAxisAlignment: 'START', counterAxisAlignment: 'START', padding: { top: 0, right: 0, bottom: 0, left: 0 }, gap: 0, wrap: false },
  clipsContent: true,
  children: [header, content],
  governance: DEFAULT_GOVERNANCE,
}

export const eqiFinancialReportV3Template: Template = {
  id: 'eqi-financial-report-v3',
  name: 'Relatório Financeiro EQI V3',
  description: 'Relatório premium com tabelas estruturadas - A4',
  category: 'print_one_pager',
  format: 'one_pager',
  brandId: EQI_BRAND_ID,
  rootNode,
  schemaVersion: 1,
  tags: ['relatorio', 'financeiro', 'report', 'eqi', 'a4', 'tabela', 'premium'],
  isPublic: false,
  aiGenerated: false,
  createdAt: '2026-01-06T00:00:00.000Z',
  updatedAt: '2026-01-06T00:00:00.000Z',
  createdBy: 'system',
}
