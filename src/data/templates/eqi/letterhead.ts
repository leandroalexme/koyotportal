/**
 * EQI Letterhead Template (A4)
 * 
 * Papel timbrado A4 - 210mm x 297mm @ 300dpi
 * Dimensões: 1240px x 1754px (scaled for web preview)
 * 
 * Estrutura:
 * - Cabeçalho: Logo + Linha divisória
 * - Corpo: Área de texto editável
 * - Rodapé: Informações de contato
 */

import type { Template, FrameNode, TextNode } from '@/types/studio'
import { DEFAULT_GOVERNANCE } from '@/types/studio'

const EQI_BRAND_ID = 'a0295b8d-c0f9-49db-b839-8a6021d3ecf7'

// EQI Brand Colors
const PRIMARY = { r: 1, g: 46, b: 35, a: 1 }       // #012E23 Deep Forest
const SURFACE = { r: 255, g: 255, b: 255, a: 1 }   // White
const TEXT_MAIN = { r: 1, g: 46, b: 35, a: 1 }

// Shared autoLayout configs
const FILL_HUG = {
  layoutMode: 'NONE' as const,
  horizontalSizing: 'FILL' as const,
  verticalSizing: 'HUG' as const,
  primaryAxisAlignment: 'START' as const,
  counterAxisAlignment: 'START' as const,
  padding: { top: 0, right: 0, bottom: 0, left: 0 },
  gap: 0,
  wrap: false,
}

// ============================================
// HEADER
// ============================================

const logoText: TextNode = {
  id: 'lh-logo',
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
  fills: [{ type: 'SOLID', color: PRIMARY }],
  shadows: [],
  autoLayout: FILL_HUG,
  governance: DEFAULT_GOVERNANCE,
  textProps: {
    content: 'EQI',
    style: {
      fontFamily: 'Playfair Display',
      fontSize: 48,
      fontWeight: 700,
      fontStyle: 'normal',
      lineHeight: 1,
      letterSpacing: 0,
      textAlign: 'LEFT',
      textDecoration: 'NONE',
      textTransform: 'NONE',
    },
    editable: false,
  },
}

// ============================================
// BODY - Clauses/Content
// ============================================

const bodyTitle: TextNode = {
  id: 'lh-title',
  name: 'Título',
  type: 'TEXT',
  visible: true,
  locked: false,
  opacity: 1,
  blendMode: 'NORMAL',
  position: { x: 0, y: 0 },
  size: { width: 0, height: 0 },
  rotation: 0,
  cornerRadius: 0,
  fills: [{ type: 'SOLID', color: PRIMARY }],
  shadows: [],
  autoLayout: FILL_HUG,
  governance: DEFAULT_GOVERNANCE,
  textProps: {
    content: 'CONTRATO DE PRESTAÇÃO DE SERVIÇOS\nDE CONSULTORIA FINANCEIRA',
    style: {
      fontFamily: 'Playfair Display',
      fontSize: 28,
      fontWeight: 700,
      fontStyle: 'normal',
      lineHeight: 1.4,
      letterSpacing: 0,
      textAlign: 'CENTER',
      textDecoration: 'NONE',
      textTransform: 'NONE',
    },
    editable: true,
  },
}

const bodyClause1: TextNode = {
  id: 'lh-clause1',
  name: 'Cláusula 1',
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
    content: '1. DAS PARTES\n\nCONTRATANTE: [Nome do Cliente], portador do CPF nº [000.000.000-00], residente em [Endereço Completo].\n\nCONTRATADA: EQI INVESTIMENTOS, inscrita no CNPJ sob o nº [00.000.000/0001-00], com sede em [Endereço da Sede].',
    style: {
      fontFamily: 'Inter',
      fontSize: 14,
      fontWeight: 400,
      fontStyle: 'normal',
      lineHeight: 1.6,
      letterSpacing: 0,
      textAlign: 'LEFT',
      textDecoration: 'NONE',
      textTransform: 'NONE',
    },
    editable: true,
  },
}

const bodyClause2: TextNode = {
  id: 'lh-clause2',
  name: 'Cláusula 2',
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
    content: '2. DO OBJETO\n\nO presente contrato tem por objeto a prestação de serviços de assessoria de investimentos, compreendendo a análise de perfil, recomendação de alocação de ativos e acompanhamento periódico da carteira do CONTRATANTE.',
    style: {
      fontFamily: 'Inter',
      fontSize: 14,
      fontWeight: 400,
      fontStyle: 'normal',
      lineHeight: 1.6,
      letterSpacing: 0,
      textAlign: 'LEFT',
      textDecoration: 'NONE',
      textTransform: 'NONE',
    },
    editable: true,
  },
}

const bodyClause3: TextNode = {
  id: 'lh-clause3',
  name: 'Cláusula 3',
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
    content: '3. DA VIGÊNCIA\n\nEste contrato entra em vigor na data de sua assinatura e terá vigência por prazo indeterminado, podendo ser rescindido por qualquer das partes mediante aviso prévio de 30 (trinta) dias.',
    style: {
      fontFamily: 'Inter',
      fontSize: 14,
      fontWeight: 400,
      fontStyle: 'normal',
      lineHeight: 1.6,
      letterSpacing: 0,
      textAlign: 'LEFT',
      textDecoration: 'NONE',
      textTransform: 'NONE',
    },
    editable: true,
  },
}

const bodyContainer: FrameNode = {
  id: 'lh-body',
  name: 'Conteúdo',
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
    primaryAxisAlignment: 'START',
    counterAxisAlignment: 'START',
    padding: { top: 40, right: 0, bottom: 0, left: 0 }, // Top padding instead of divider
    gap: 24,
    wrap: false,
  },
  clipsContent: false,
  children: [bodyTitle, bodyClause1, bodyClause2, bodyClause3], // Removed dividerLine
  governance: DEFAULT_GOVERNANCE,
}

// ============================================
// SIGNATURES
// ============================================

const sigLine1: FrameNode = {
  id: 'lh-sig-line1',
  name: 'Linha Assinatura 1',
  type: 'FRAME',
  visible: true,
  locked: true,
  opacity: 1,
  blendMode: 'NORMAL',
  position: { x: 0, y: 0 },
  size: { width: 200, height: 1 },
  rotation: 0,
  cornerRadius: 0,
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

const sigName1: TextNode = {
  id: 'lh-sig-name1',
  name: 'Nome Contratante',
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
    content: 'CONTRATANTE',
    style: {
      fontFamily: 'Inter',
      fontSize: 12,
      fontWeight: 600,
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

const sig1Container: FrameNode = {
  id: 'lh-sig1',
  name: 'Assinatura 1',
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
    verticalSizing: 'HUG',
    primaryAxisAlignment: 'START',
    counterAxisAlignment: 'CENTER',
    padding: { top: 0, right: 0, bottom: 0, left: 0 },
    gap: 8,
    wrap: false,
  },
  clipsContent: false,
  children: [sigLine1, sigName1],
  governance: DEFAULT_GOVERNANCE,
}

const sigLine2: FrameNode = {
  id: 'lh-sig-line2',
  name: 'Linha Assinatura 2',
  type: 'FRAME',
  visible: true,
  locked: true,
  opacity: 1,
  blendMode: 'NORMAL',
  position: { x: 0, y: 0 },
  size: { width: 200, height: 1 },
  rotation: 0,
  cornerRadius: 0,
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

const sigName2: TextNode = {
  id: 'lh-sig-name2',
  name: 'Nome EQI',
  type: 'TEXT',
  visible: true,
  locked: true,
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
    content: 'EQI INVESTIMENTOS',
    style: {
      fontFamily: 'Inter',
      fontSize: 12,
      fontWeight: 600,
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

const sig2Container: FrameNode = {
  id: 'lh-sig2',
  name: 'Assinatura 2',
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
    verticalSizing: 'HUG',
    primaryAxisAlignment: 'START',
    counterAxisAlignment: 'CENTER',
    padding: { top: 0, right: 0, bottom: 0, left: 0 },
    gap: 8,
    wrap: false,
  },
  clipsContent: false,
  children: [sigLine2, sigName2],
  governance: DEFAULT_GOVERNANCE,
}

const signaturesContainer: FrameNode = {
  id: 'lh-signatures',
  name: 'Assinaturas',
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
    layoutMode: 'HORIZONTAL',
    horizontalSizing: 'FILL',
    verticalSizing: 'HUG',
    primaryAxisAlignment: 'START',
    counterAxisAlignment: 'START',
    padding: { top: 80, right: 0, bottom: 0, left: 0 },
    gap: 80,
    wrap: false,
  },
  clipsContent: false,
  children: [sig1Container, sig2Container],
  governance: DEFAULT_GOVERNANCE,
}

// ============================================
// ROOT NODE
// ============================================

const rootNode: FrameNode = {
  id: 'lh-root',
  name: 'Contrato A4',
  type: 'FRAME',
  visible: true,
  locked: false,
  opacity: 1,
  blendMode: 'NORMAL',
  position: { x: 0, y: 0 },
  size: { width: 1240, height: 1754 }, // A4 scaled for web
  rotation: 0,
  cornerRadius: 0,
  fills: [{ type: 'SOLID', color: SURFACE }],
  shadows: [],
  autoLayout: {
    layoutMode: 'VERTICAL',
    horizontalSizing: 'FIXED',
    verticalSizing: 'FIXED',
    primaryAxisAlignment: 'START',
    counterAxisAlignment: 'START',
    padding: { top: 100, right: 100, bottom: 100, left: 100 },
    gap: 40,
    wrap: false,
  },
  clipsContent: true,
  children: [logoText, bodyContainer, signaturesContainer],
  governance: DEFAULT_GOVERNANCE,
}

export const eqiLetterheadTemplate: Template = {
  id: 'eqi-letterhead-a4-v1',
  name: 'Papel Timbrado A4 EQI',
  description: 'Papel timbrado profissional EQI Investimentos - A4 (210mm x 297mm)',
  category: 'print_one_pager',
  format: 'one_pager',
  brandId: EQI_BRAND_ID,
  rootNode,
  schemaVersion: 1,
  tags: ['papel-timbrado', 'letterhead', 'eqi', 'a4', 'print'],
  isPublic: false,
  aiGenerated: false,
  createdAt: '2026-01-05T00:00:00.000Z',
  updatedAt: '2026-01-05T00:00:00.000Z',
  createdBy: 'system',
}
