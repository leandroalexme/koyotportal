/**
 * EQI Business Card Template
 * 
 * Cartão de visita profissional - 90mm x 50mm @ 300dpi
 * Dimensões: 1050px x 600px
 * 
 * Estrutura:
 * - Frente: Logo centralizado + Tagline
 * - Verso: Info do colaborador + QR Code
 */

import type { Template, FrameNode, TextNode } from '@/types/studio'
import { DEFAULT_GOVERNANCE } from '@/types/studio'

const EQI_BRAND_ID = 'a0295b8d-c0f9-49db-b839-8a6021d3ecf7'

// EQI Brand Colors
const PRIMARY = { r: 1, g: 46, b: 35, a: 1 }       // #012E23 Deep Forest
const SECONDARY = { r: 39, g: 215, b: 149, a: 1 }  // #27D795 Growth Green
const SURFACE = { r: 255, g: 255, b: 255, a: 1 }   // White
const TEXT_MAIN = { r: 1, g: 46, b: 35, a: 1 }
const TEXT_MUTED = { r: 1, g: 46, b: 35, a: 0.6 }

// Shared autoLayout configs for TEXT nodes
// Note: For leaf nodes (TEXT), layoutMode doesn't affect layout since they have no children
// But we keep it consistent for future-proofing
const FILL_HUG = {
  layoutMode: 'VERTICAL' as const, // Changed from NONE - allows proper flex participation
  horizontalSizing: 'FILL' as const,
  verticalSizing: 'HUG' as const,
  primaryAxisAlignment: 'START' as const,
  counterAxisAlignment: 'START' as const,
  padding: { top: 0, right: 0, bottom: 0, left: 0 },
  gap: 0,
  wrap: false,
}

const HUG_HUG = {
  layoutMode: 'VERTICAL' as const, // Changed from NONE
  horizontalSizing: 'HUG' as const,
  verticalSizing: 'HUG' as const,
  primaryAxisAlignment: 'START' as const,
  counterAxisAlignment: 'START' as const,
  padding: { top: 0, right: 0, bottom: 0, left: 0 },
  gap: 0,
  wrap: false,
}

// ============================================
// FRONT SIDE - Logo + Tagline
// ============================================

const frontLogo: TextNode = {
  id: 'bc-front-logo',
  name: 'Logo',
  type: 'TEXT',
  visible: true,
  locked: true,
  opacity: 1,
  blendMode: 'NORMAL',
  position: { x: 0, y: 0 },
  size: { width: 0, height: 0 },
  rotation: 0,
  cornerRadius: 0,
  fills: [{ type: 'SOLID', color: SURFACE }],
  shadows: [],
  autoLayout: HUG_HUG,
  governance: DEFAULT_GOVERNANCE,
  textProps: {
    content: 'EQI',
    style: {
      fontFamily: 'Playfair Display',
      fontSize: 120,
      fontWeight: 700,
      fontStyle: 'normal',
      lineHeight: 1,
      letterSpacing: 0,
      textAlign: 'CENTER',
      textDecoration: 'NONE',
      textTransform: 'NONE',
    },
    editable: false,
  },
}

const frontTagline: TextNode = {
  id: 'bc-front-tagline',
  name: 'Tagline',
  type: 'TEXT',
  visible: true,
  locked: true,
  opacity: 1,
  blendMode: 'NORMAL',
  position: { x: 0, y: 0 },
  size: { width: 0, height: 0 },
  rotation: 0,
  cornerRadius: 0,
  fills: [{ type: 'SOLID', color: SECONDARY }],
  shadows: [],
  autoLayout: HUG_HUG,
  governance: DEFAULT_GOVERNANCE,
  textProps: {
    content: 'Investimentos Inteligentes',
    style: {
      fontFamily: 'Inter',
      fontSize: 24,
      fontWeight: 400,
      fontStyle: 'normal',
      lineHeight: 1,
      letterSpacing: 0,
      textAlign: 'CENTER',
      textDecoration: 'NONE',
      textTransform: 'NONE',
    },
    editable: false,
  },
}

const frontRoot: FrameNode = {
  id: 'bc-front',
  name: 'Frente',
  type: 'FRAME',
  visible: true,
  locked: false,
  opacity: 1,
  blendMode: 'NORMAL',
  position: { x: 0, y: 0 },
  size: { width: 1050, height: 600 },
  rotation: 0,
  cornerRadius: 0,
  fills: [{ type: 'SOLID', color: PRIMARY }],
  shadows: [],
  autoLayout: {
    layoutMode: 'VERTICAL',
    horizontalSizing: 'FIXED',
    verticalSizing: 'FIXED',
    primaryAxisAlignment: 'CENTER',
    counterAxisAlignment: 'CENTER',
    padding: { top: 0, right: 0, bottom: 0, left: 0 },
    gap: 16,
    wrap: false,
  },
  clipsContent: true,
  children: [frontLogo, frontTagline],
  governance: DEFAULT_GOVERNANCE,
}

// ============================================
// BACK SIDE - Contact Info + QR
// ============================================

const backName: TextNode = {
  id: 'bc-back-name',
  name: 'Nome',
  type: 'TEXT',
  visible: true,
  locked: false,
  opacity: 1,
  blendMode: 'NORMAL',
  position: { x: 0, y: 0 },
  size: { width: 0, height: 0 },
  rotation: 0,
  cornerRadius: 0,
  fills: [{ type: 'SOLID', color: TEXT_MAIN }],
  shadows: [],
  autoLayout: FILL_HUG,
  governance: DEFAULT_GOVERNANCE,
  textProps: {
    content: 'Alex Morgan',
    style: {
      fontFamily: 'Playfair Display',
      fontSize: 56,
      fontWeight: 700,
      fontStyle: 'normal',
      lineHeight: 1,
      letterSpacing: 0,
      textAlign: 'LEFT',
      textDecoration: 'NONE',
      textTransform: 'NONE',
    },
    editable: true,
  },
}

const backTitle: TextNode = {
  id: 'bc-back-title',
  name: 'Cargo',
  type: 'TEXT',
  visible: true,
  locked: false,
  opacity: 1,
  blendMode: 'NORMAL',
  position: { x: 0, y: 0 },
  size: { width: 0, height: 0 },
  rotation: 0,
  cornerRadius: 0,
  fills: [{ type: 'SOLID', color: SECONDARY }],
  shadows: [],
  autoLayout: FILL_HUG,
  governance: DEFAULT_GOVERNANCE,
  textProps: {
    content: 'Senior Wealth Advisor',
    style: {
      fontFamily: 'Inter',
      fontSize: 28,
      fontWeight: 500,
      fontStyle: 'normal',
      lineHeight: 1,
      letterSpacing: 0,
      textAlign: 'LEFT',
      textDecoration: 'NONE',
      textTransform: 'NONE',
    },
    editable: true,
  },
}

const backSpacer: FrameNode = {
  id: 'bc-back-spacer',
  name: 'Spacer',
  type: 'FRAME',
  visible: true,
  locked: true,
  opacity: 1,
  blendMode: 'NORMAL',
  position: { x: 0, y: 0 },
  size: { width: 0, height: 32 },
  rotation: 0,
  cornerRadius: 0,
  fills: [],
  shadows: [],
  autoLayout: {
    layoutMode: 'NONE',
    horizontalSizing: 'FILL',
    verticalSizing: 'FIXED',
    primaryAxisAlignment: 'START',
    counterAxisAlignment: 'START',
    padding: { top: 0, right: 0, bottom: 0, left: 0 },
    gap: 0,
    wrap: false,
  },
  clipsContent: false,
  children: [],
  governance: DEFAULT_GOVERNANCE,
}

const backPhone: TextNode = {
  id: 'bc-back-phone',
  name: 'Telefone',
  type: 'TEXT',
  visible: true,
  locked: false,
  opacity: 1,
  blendMode: 'NORMAL',
  position: { x: 0, y: 0 },
  size: { width: 0, height: 0 },
  rotation: 0,
  cornerRadius: 0,
  fills: [{ type: 'SOLID', color: TEXT_MUTED }],
  shadows: [],
  autoLayout: FILL_HUG,
  governance: DEFAULT_GOVERNANCE,
  textProps: {
    content: '+55 11 99999-0000',
    style: {
      fontFamily: 'Inter',
      fontSize: 22,
      fontWeight: 400,
      fontStyle: 'normal',
      lineHeight: 1.4,
      letterSpacing: 0,
      textAlign: 'LEFT',
      textDecoration: 'NONE',
      textTransform: 'NONE',
    },
    editable: true,
  },
}

const backEmail: TextNode = {
  id: 'bc-back-email',
  name: 'Email',
  type: 'TEXT',
  visible: true,
  locked: false,
  opacity: 1,
  blendMode: 'NORMAL',
  position: { x: 0, y: 0 },
  size: { width: 0, height: 0 },
  rotation: 0,
  cornerRadius: 0,
  fills: [{ type: 'SOLID', color: TEXT_MUTED }],
  shadows: [],
  autoLayout: FILL_HUG,
  governance: DEFAULT_GOVERNANCE,
  textProps: {
    content: 'alex.morgan@eqi.com.br',
    style: {
      fontFamily: 'Inter',
      fontSize: 22,
      fontWeight: 400,
      fontStyle: 'normal',
      lineHeight: 1.4,
      letterSpacing: 0,
      textAlign: 'LEFT',
      textDecoration: 'NONE',
      textTransform: 'NONE',
    },
    editable: true,
  },
}

const backWebsite: TextNode = {
  id: 'bc-back-web',
  name: 'Website',
  type: 'TEXT',
  visible: true,
  locked: true,
  opacity: 1,
  blendMode: 'NORMAL',
  position: { x: 0, y: 0 },
  size: { width: 0, height: 0 },
  rotation: 0,
  cornerRadius: 0,
  fills: [{ type: 'SOLID', color: TEXT_MUTED }],
  shadows: [],
  autoLayout: FILL_HUG,
  governance: DEFAULT_GOVERNANCE,
  textProps: {
    content: 'eqi.com.br',
    style: {
      fontFamily: 'Inter',
      fontSize: 22,
      fontWeight: 400,
      fontStyle: 'normal',
      lineHeight: 1.4,
      letterSpacing: 0,
      textAlign: 'LEFT',
      textDecoration: 'NONE',
      textTransform: 'NONE',
    },
    editable: false,
  },
}

const backInfoBlock: FrameNode = {
  id: 'bc-back-info',
  name: 'Info Block',
  type: 'FRAME',
  visible: true,
  locked: false,
  opacity: 1,
  blendMode: 'NORMAL',
  position: { x: 0, y: 0 },
  size: { width: 0, height: 0 },
  rotation: 0,
  cornerRadius: 0,
  fills: [],
  shadows: [],
  autoLayout: {
    layoutMode: 'VERTICAL',
    horizontalSizing: 'FILL',
    verticalSizing: 'FILL',
    primaryAxisAlignment: 'CENTER',
    counterAxisAlignment: 'START',
    padding: { top: 0, right: 0, bottom: 0, left: 0 },
    gap: 8,
    wrap: false,
  },
  clipsContent: false,
  children: [backName, backTitle, backSpacer, backPhone, backEmail, backWebsite],
  governance: DEFAULT_GOVERNANCE,
}

const backQRArea: FrameNode = {
  id: 'bc-back-qr',
  name: 'QR Code Area',
  type: 'FRAME',
  visible: true,
  locked: true,
  opacity: 1,
  blendMode: 'NORMAL',
  position: { x: 0, y: 0 },
  size: { width: 180, height: 180 },
  rotation: 0,
  cornerRadius: 12,
  fills: [{ type: 'SOLID', color: TEXT_MAIN }],
  shadows: [],
  autoLayout: {
    layoutMode: 'NONE',
    horizontalSizing: 'FIXED',
    verticalSizing: 'FIXED',
    primaryAxisAlignment: 'START',
    counterAxisAlignment: 'START',
    padding: { top: 0, right: 0, bottom: 0, left: 0 },
    gap: 0,
    wrap: false,
  },
  clipsContent: false,
  children: [],
  governance: DEFAULT_GOVERNANCE,
}

const rootNode: FrameNode = {
  id: 'bc-back',
  name: 'Verso',
  type: 'FRAME',
  visible: true,
  locked: false,
  opacity: 1,
  blendMode: 'NORMAL',
  position: { x: 0, y: 0 },
  size: { width: 1050, height: 600 },
  rotation: 0,
  cornerRadius: 0,
  fills: [{ type: 'SOLID', color: SURFACE }],
  shadows: [],
  autoLayout: {
    layoutMode: 'HORIZONTAL',
    horizontalSizing: 'FIXED',
    verticalSizing: 'FIXED',
    primaryAxisAlignment: 'SPACE_BETWEEN',
    counterAxisAlignment: 'START',
    padding: { top: 60, right: 80, bottom: 60, left: 80 },
    gap: 40,
    wrap: false,
  },
  clipsContent: true,
  children: [backInfoBlock, backQRArea],
  governance: DEFAULT_GOVERNANCE,
}

// Export front side for multi-page support
export const eqiBusinessCardFront = frontRoot

export const eqiBusinessCardTemplate: Template = {
  id: 'eqi-business-card-v1',
  name: 'Cartão de Visita EQI',
  description: 'Cartão de visita profissional EQI Investimentos - 90mm x 50mm',
  category: 'print_business_card',
  format: 'business_card',
  brandId: EQI_BRAND_ID,
  rootNode, // Back side as default (more content to show)
  schemaVersion: 1,
  tags: ['cartao-visita', 'eqi', 'investimentos', 'print'],
  isPublic: false,
  aiGenerated: false,
  createdAt: '2026-01-05T00:00:00.000Z',
  updatedAt: '2026-01-05T00:00:00.000Z',
  createdBy: 'system',
}
