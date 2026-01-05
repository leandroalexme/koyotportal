/**
 * Koyot Variables System - Design Tokens
 * 
 * Sistema de variáveis escalável que serve como Single Source of Truth
 * para toda a plataforma: Editor, Portal, Export, API.
 * 
 * Inspirado em: Figma Variables + Frontify Smart Linking
 */

import type { UserRole } from './studio'

// ============================================
// VARIABLE TYPES
// ============================================

/** Tipos de dados suportados por variáveis */
export type VariableType = 
  | 'string'    // Texto
  | 'number'    // Número
  | 'color'     // Cor (hex, rgba)
  | 'image'     // URL ou Asset ID
  | 'boolean'   // Verdadeiro/Falso

/** Escopos onde a variável pode ser aplicada */
export type VariableScope = 
  | 'text'      // Conteúdo de texto
  | 'fill'      // Preenchimento/Background
  | 'stroke'    // Borda
  | 'image'     // Fonte de imagem
  | 'number'    // Valores numéricos (opacity, size, etc)
  | 'all'       // Qualquer contexto

// ============================================
// VARIABLE VALUE
// ============================================

/** Valor de uma variável (pode ser qualquer tipo) */
export type VariableValue = string | number | boolean | null

/** Valores por modo/contexto */
export interface VariableValuesByMode {
  [modeId: string]: VariableValue
}

// ============================================
// EXTERNAL SOURCE (v2)
// ============================================

/** Tipo de fonte externa de dados */
export type ExternalSourceType = 'static' | 'api' | 'csv' | 'database'

/** Configuração de fonte externa */
export interface ExternalSource {
  type: ExternalSourceType
  /** Endpoint da API ou URL do CSV */
  endpoint?: string
  /** Campo no JSON retornado */
  field?: string
  /** Intervalo de refresh em ms (0 = manual) */
  refreshInterval?: number
  /** Headers para requisição */
  headers?: Record<string, string>
}

// ============================================
// VARIABLE
// ============================================

/** Variável - Data Point central do sistema */
export interface Variable {
  /** ID único */
  id: string
  
  /** Nome técnico (snake_case): "primary_cta_color" */
  name: string
  
  /** Nome amigável para UI: "Cor do CTA Principal" */
  displayName: string
  
  /** Tipo de dado */
  type: VariableType
  
  /** Valores por modo/contexto */
  valuesByMode: VariableValuesByMode
  
  /** Aliasing - aponta para outra variável (herança) */
  aliasOf?: string
  
  /** Fonte externa de dados (v2) */
  source?: ExternalSource
  
  /** Escopos onde pode ser usado */
  scopes: VariableScope[]
  
  /** Quem pode editar esta variável */
  editableBy: UserRole[]
  
  /** Se está travada globalmente */
  isLocked: boolean
  
  /** ID da coleção pai */
  collectionId: string
  
  /** Descrição para documentação */
  description?: string
  
  /** Tags para busca/filtro */
  tags?: string[]
  
  /** Timestamps */
  createdAt: string
  updatedAt: string
}

// ============================================
// VARIABLE MODE
// ============================================

/** Modo/Contexto (ex: idioma, região, campanha) */
export interface VariableMode {
  /** ID único */
  id: string
  
  /** Nome do modo: "Português BR", "Campanha Verão" */
  name: string
  
  /** Se é o modo padrão */
  isDefault: boolean
  
  /** Descrição */
  description?: string
}

// ============================================
// VARIABLE COLLECTION
// ============================================

/** Coleção de variáveis (agrupamento lógico) */
export interface VariableCollection {
  /** ID único */
  id: string
  
  /** Nome da coleção: "Textos", "Cores da Marca" */
  name: string
  
  /** Descrição */
  description?: string
  
  /** Modos disponíveis nesta coleção */
  modes: VariableMode[]
  
  /** IDs das variáveis nesta coleção */
  variableIds: string[]
  
  /** Ordem de exibição */
  order: number
  
  /** Timestamps */
  createdAt: string
  updatedAt: string
}

// ============================================
// VARIABLE BINDING
// ============================================

/** Binding - conexão entre variável e propriedade de um nó */
export interface VariableBinding {
  /** ID único do binding */
  id: string
  
  /** ID do nó no scene graph */
  nodeId: string
  
  /** Caminho da propriedade: "textProps.content", "fills[0].color" */
  property: string
  
  /** ID da variável conectada */
  variableId: string
  
  /** Timestamps */
  createdAt: string
}

// ============================================
// RESOLVED VALUE
// ============================================

/** Resultado da resolução de uma variável */
export interface ResolvedVariable {
  /** Variável original */
  variable: Variable
  
  /** Valor resolvido (após alias, source, mode) */
  value: VariableValue
  
  /** Cadeia de resolução (para debug) */
  resolutionChain: string[]
  
  /** Se veio de fonte externa */
  isFromExternalSource: boolean
  
  /** Se é um alias */
  isAlias: boolean
}

// ============================================
// VARIABLES STATE (para Store)
// ============================================

/** Estado completo do sistema de variáveis */
export interface VariablesState {
  /** Todas as coleções */
  collections: VariableCollection[]
  
  /** Todas as variáveis (mapa por ID para acesso rápido) */
  variables: Record<string, Variable>
  
  /** Todos os bindings */
  bindings: VariableBinding[]
  
  /** ID do modo ativo */
  activeModeId: string
  
  /** Se está carregando do backend */
  isLoading: boolean
  
  /** Erro de carregamento */
  error: string | null
}

// ============================================
// HELPER TYPES
// ============================================

/** Input para criar uma nova variável */
export interface CreateVariableInput {
  name: string
  displayName: string
  type: VariableType
  collectionId: string
  scopes?: VariableScope[]
  editableBy?: UserRole[]
  description?: string
  tags?: string[]
  initialValue?: VariableValue
}

/** Input para atualizar uma variável */
export interface UpdateVariableInput {
  displayName?: string
  scopes?: VariableScope[]
  editableBy?: UserRole[]
  isLocked?: boolean
  description?: string
  tags?: string[]
  aliasOf?: string | null
}

/** Input para criar um binding */
export interface CreateBindingInput {
  nodeId: string
  property: string
  variableId: string
}

/** Filtros para buscar variáveis */
export interface VariableFilters {
  type?: VariableType
  scope?: VariableScope
  collectionId?: string
  tags?: string[]
  search?: string
}

// ============================================
// DEFAULT VALUES
// ============================================

/** Modo padrão */
export const DEFAULT_MODE: VariableMode = {
  id: 'default',
  name: 'Padrão',
  isDefault: true,
}

/** Coleções padrão para novos projetos */
export const DEFAULT_COLLECTIONS: Omit<VariableCollection, 'id' | 'createdAt' | 'updatedAt'>[] = [
  {
    name: 'Textos',
    description: 'Variáveis de texto editáveis',
    modes: [DEFAULT_MODE],
    variableIds: [],
    order: 0,
  },
  {
    name: 'Cores',
    description: 'Paleta de cores da marca',
    modes: [DEFAULT_MODE],
    variableIds: [],
    order: 1,
  },
  {
    name: 'Imagens',
    description: 'Assets e imagens dinâmicas',
    modes: [DEFAULT_MODE],
    variableIds: [],
    order: 2,
  },
]

// ============================================
// TYPE GUARDS
// ============================================

export function isStringVariable(variable: Variable): boolean {
  return variable.type === 'string'
}

export function isColorVariable(variable: Variable): boolean {
  return variable.type === 'color'
}

export function isImageVariable(variable: Variable): boolean {
  return variable.type === 'image'
}

export function isNumberVariable(variable: Variable): boolean {
  return variable.type === 'number'
}

export function isBooleanVariable(variable: Variable): boolean {
  return variable.type === 'boolean'
}

/** Verifica se variável pode ser usada em um escopo */
export function canUseInScope(variable: Variable, scope: VariableScope): boolean {
  return variable.scopes.includes('all') || variable.scopes.includes(scope)
}

/** Verifica se usuário pode editar variável */
export function canEditVariable(variable: Variable, userRole: UserRole): boolean {
  if (variable.isLocked) return false
  return variable.editableBy.includes(userRole)
}
