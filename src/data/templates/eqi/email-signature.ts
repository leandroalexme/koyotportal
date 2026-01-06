/**
 * EQI Email Signature Template
 * 
 * Assinatura de e-mail profissional - 600px x 200px
 */

import type { Template, FrameNode, TextNode, RectangleNode } from '@/types/studio'
import { DEFAULT_GOVERNANCE } from '@/types/studio'

const EQI_BRAND_ID = 'a0295b8d-c0f9-49db-b839-8a6021d3ecf7'

// Colors
const PRIMARY_DARK = { r: 0, g: 75, b: 60, a: 1 }
const TEXT_DARK = { r: 30, g: 30, b: 30, a: 1 }
const TEXT_MUTED = { r: 100, g: 100, b: 100, a: 1 }
const SURFACE_LIGHT = { r: 240, g: 237, b: 233, a: 1 }

// Default autoLayout for leaf nodes (TEXT, RECTANGLE, etc.)
// Note: layoutMode doesn't affect leaf nodes but we use VERTICAL for consistency
const nodeAutoLayout = {
  layoutMode: 'VERTICAL' as const, // Changed from NONE for consistency
  horizontalSizing: 'HUG' as const,
  verticalSizing: 'HUG' as const,
  primaryAxisAlignment: 'START' as const,
  counterAxisAlignment: 'START' as const,
  padding: { top: 0, right: 0, bottom: 0, left: 0 },
  gap: 0,
  wrap: false,
}

// Logo
const logoText: TextNode = {
  id: 'eqi-es-logo',
  name: 'Logo EQI',
  type: 'TEXT',
  visible: true,
  locked: true,
  opacity: 1,
  blendMode: 'NORMAL',
  position: { x: 0, y: 0 },
  size: { width: 80, height: 40 },
  rotation: 0,
  cornerRadius: 0,
  fills: [{ type: 'SOLID', color: PRIMARY_DARK }],
  shadows: [],
  autoLayout: nodeAutoLayout,
  governance: DEFAULT_GOVERNANCE,
  textProps: {
    content: 'EQI',
    style: {
      fontFamily: 'Inter',
      fontSize: 28,
      fontWeight: 700,
      fontStyle: 'normal',
      lineHeight: 1.2,
      letterSpacing: 0.1,
      textAlign: 'LEFT',
      textDecoration: 'NONE',
      textTransform: 'NONE',
    },
    editable: false,
  },
}

// Divider line
const dividerLine: RectangleNode = {
  id: 'eqi-es-divider',
  name: 'Divisor',
  type: 'RECTANGLE',
  visible: true,
  locked: true,
  opacity: 1,
  blendMode: 'NORMAL',
  position: { x: 0, y: 0 },
  size: { width: 2, height: 120 },
  rotation: 0,
  cornerRadius: 0,
  fills: [{ type: 'SOLID', color: PRIMARY_DARK }],
  shadows: [],
  autoLayout: nodeAutoLayout,
  governance: DEFAULT_GOVERNANCE,
}

// Name
const nameText: TextNode = {
  id: 'eqi-es-name',
  name: 'Nome',
  type: 'TEXT',
  visible: true,
  locked: false,
  opacity: 1,
  blendMode: 'NORMAL',
  position: { x: 0, y: 0 },
  size: { width: 300, height: 24 },
  rotation: 0,
  cornerRadius: 0,
  fills: [{ type: 'SOLID', color: TEXT_DARK }],
  shadows: [],
  autoLayout: nodeAutoLayout,
  governance: DEFAULT_GOVERNANCE,
  textProps: {
    content: 'João Silva',
    style: {
      fontFamily: 'Inter',
      fontSize: 18,
      fontWeight: 600,
      fontStyle: 'normal',
      lineHeight: 1.3,
      letterSpacing: 0,
      textAlign: 'LEFT',
      textDecoration: 'NONE',
      textTransform: 'NONE',
    },
    editable: true,
  },
}

// Role
const roleText: TextNode = {
  id: 'eqi-es-role',
  name: 'Cargo',
  type: 'TEXT',
  visible: true,
  locked: false,
  opacity: 1,
  blendMode: 'NORMAL',
  position: { x: 0, y: 0 },
  size: { width: 300, height: 18 },
  rotation: 0,
  cornerRadius: 0,
  fills: [{ type: 'SOLID', color: TEXT_MUTED }],
  shadows: [],
  autoLayout: nodeAutoLayout,
  governance: DEFAULT_GOVERNANCE,
  textProps: {
    content: 'Assessor de Investimentos',
    style: {
      fontFamily: 'Inter',
      fontSize: 12,
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

// Contact info
const contactText: TextNode = {
  id: 'eqi-es-contact',
  name: 'Contato',
  type: 'TEXT',
  visible: true,
  locked: false,
  opacity: 1,
  blendMode: 'NORMAL',
  position: { x: 0, y: 0 },
  size: { width: 300, height: 40 },
  rotation: 0,
  cornerRadius: 0,
  fills: [{ type: 'SOLID', color: TEXT_MUTED }],
  shadows: [],
  autoLayout: nodeAutoLayout,
  governance: DEFAULT_GOVERNANCE,
  textProps: {
    content: 'joao.silva@eqi.com.br\n+55 11 99999-9999',
    style: {
      fontFamily: 'Inter',
      fontSize: 11,
      fontWeight: 400,
      fontStyle: 'normal',
      lineHeight: 1.5,
      letterSpacing: 0,
      textAlign: 'LEFT',
      textDecoration: 'NONE',
      textTransform: 'NONE',
    },
    editable: true,
  },
}

// Info container
const infoContainer: FrameNode = {
  id: 'eqi-es-info',
  name: 'Informações',
  type: 'FRAME',
  visible: true,
  locked: false,
  opacity: 1,
  blendMode: 'NORMAL',
  position: { x: 0, y: 0 },
  size: { width: 300, height: 120 },
  rotation: 0,
  cornerRadius: 0,
  fills: [],
  shadows: [],
  autoLayout: {
    layoutMode: 'VERTICAL',
    horizontalSizing: 'HUG',
    verticalSizing: 'HUG',
    primaryAxisAlignment: 'START',
    counterAxisAlignment: 'START',
    padding: { top: 0, right: 0, bottom: 0, left: 0 },
    gap: 8,
    wrap: false,
  },
  clipsContent: false,
  children: [nameText, roleText, contactText],
  governance: DEFAULT_GOVERNANCE,
}

const rootNode: FrameNode = {
  id: 'eqi-es-root',
  name: 'Assinatura de E-mail',
  type: 'FRAME',
  visible: true,
  locked: false,
  opacity: 1,
  blendMode: 'NORMAL',
  position: { x: 0, y: 0 },
  size: { width: 600, height: 200 },
  rotation: 0,
  cornerRadius: 0,
  fills: [{ type: 'SOLID', color: SURFACE_LIGHT }],
  shadows: [],
  autoLayout: {
    layoutMode: 'HORIZONTAL',
    horizontalSizing: 'FIXED',
    verticalSizing: 'FIXED',
    primaryAxisAlignment: 'START',
    counterAxisAlignment: 'CENTER',
    padding: { top: 24, right: 32, bottom: 24, left: 32 },
    gap: 24,
    wrap: false,
  },
  clipsContent: true,
  children: [logoText, dividerLine, infoContainer],
  governance: DEFAULT_GOVERNANCE,
}

export const eqiEmailSignatureTemplate: Template = {
  id: 'eqi-email-signature-v1',
  name: 'Assinatura de E-mail EQI',
  description: 'Assinatura de e-mail profissional EQI Investimentos - 600px x 200px',
  category: 'digital_email_header',
  format: 'email_header',
  brandId: EQI_BRAND_ID,
  rootNode,
  schemaVersion: 1,
  tags: ['email', 'assinatura', 'signature', 'eqi', 'digital'],
  isPublic: false,
  aiGenerated: false,
  createdAt: '2026-01-05T00:00:00.000Z',
  updatedAt: '2026-01-05T00:00:00.000Z',
  createdBy: 'system',
}
