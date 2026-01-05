/**
 * Mock Data para testar o sistema de Variables
 */

import type { VariableCollection, Variable } from '@/types/variables'

// ============================================
// MOCK COLLECTIONS
// ============================================

export const MOCK_COLLECTIONS: VariableCollection[] = [
  {
    id: 'col-textos',
    name: 'Textos',
    description: 'Variáveis de texto editáveis',
    modes: [{ id: 'default', name: 'Padrão', isDefault: true }],
    variableIds: ['var-titulo', 'var-subtitulo', 'var-cta'],
    order: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'col-cores',
    name: 'Cores',
    description: 'Paleta de cores da marca',
    modes: [{ id: 'default', name: 'Padrão', isDefault: true }],
    variableIds: ['var-cor-primaria', 'var-cor-secundaria'],
    order: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
]

// ============================================
// MOCK VARIABLES
// ============================================

export const MOCK_VARIABLES: Record<string, Variable> = {
  'var-titulo': {
    id: 'var-titulo',
    name: 'titulo_principal',
    displayName: 'Título Principal',
    type: 'string',
    collectionId: 'col-textos',
    scopes: ['text'],
    editableBy: ['owner', 'admin', 'editor', 'member'],
    isLocked: false,
    valuesByMode: {
      default: 'Invista no seu futuro',
    },
    description: 'Título principal do template',
    tags: ['headline', 'titulo'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  'var-subtitulo': {
    id: 'var-subtitulo',
    name: 'subtitulo',
    displayName: 'Subtítulo',
    type: 'string',
    collectionId: 'col-textos',
    scopes: ['text'],
    editableBy: ['owner', 'admin', 'editor', 'member'],
    isLocked: false,
    valuesByMode: {
      default: 'Descubra as melhores oportunidades de investimento',
    },
    description: 'Subtítulo ou descrição',
    tags: ['subtitle', 'descricao'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  'var-cta': {
    id: 'var-cta',
    name: 'texto_cta',
    displayName: 'Texto do Botão',
    type: 'string',
    collectionId: 'col-textos',
    scopes: ['text'],
    editableBy: ['owner', 'admin', 'editor'],
    isLocked: false,
    valuesByMode: {
      default: 'Saiba Mais',
    },
    description: 'Texto do botão de ação',
    tags: ['cta', 'button'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  'var-cor-primaria': {
    id: 'var-cor-primaria',
    name: 'cor_primaria',
    displayName: 'Cor Primária',
    type: 'color',
    collectionId: 'col-cores',
    scopes: ['fill', 'stroke'],
    editableBy: ['owner', 'admin'],
    isLocked: true,
    valuesByMode: {
      default: '#1E1B4B',
    },
    description: 'Cor principal da marca',
    tags: ['brand', 'primary'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  'var-cor-secundaria': {
    id: 'var-cor-secundaria',
    name: 'cor_secundaria',
    displayName: 'Cor Secundária',
    type: 'color',
    collectionId: 'col-cores',
    scopes: ['fill', 'stroke'],
    editableBy: ['owner', 'admin'],
    isLocked: true,
    valuesByMode: {
      default: '#7C3AED',
    },
    description: 'Cor secundária da marca',
    tags: ['brand', 'secondary'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
}

// ============================================
// HELPER: Load mock data into store
// ============================================

export function getMockVariablesData() {
  return {
    collections: MOCK_COLLECTIONS,
    variables: MOCK_VARIABLES,
    bindings: [],
    activeModeId: 'default',
  }
}
