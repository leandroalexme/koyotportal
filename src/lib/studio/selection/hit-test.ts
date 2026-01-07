/**
 * Hit Testing
 * 
 * Funções para detectar qual elemento está sob o cursor.
 * Suporta deep selection (Cmd+click) para selecionar elementos aninhados.
 */

import type { SceneNode, FrameNode } from '@/types/studio'
import type { ComputedLayout } from '../yoga-adapter'

export interface HitTestOptions {
  /** Tolerância de hit em pixels (para facilitar clique em bordas) */
  tolerance?: number
  /** Set de IDs dos pais dos elementos selecionados (para deep selection) */
  parentIdSet?: Set<string>
  /** Se true, permite selecionar elementos profundamente aninhados */
  deepSelect?: boolean
  /** Zoom atual do viewport */
  zoom?: number
}

export interface HitTestResult {
  node: SceneNode
  nodeId: string
  depth: number
}

/**
 * Encontra o elemento mais ao topo sob o ponto dado
 */
export function hitTest(
  rootNode: FrameNode,
  point: { x: number; y: number },
  layoutMap: Map<string, ComputedLayout>,
  options: HitTestOptions = {}
): HitTestResult | null {
  const { tolerance = 0, parentIdSet = new Set(), deepSelect = false } = options
  
  const result = hitTestNode(rootNode, point, layoutMap, {
    tolerance,
    parentIdSet,
    deepSelect,
    depth: 0,
  })
  
  return result
}

interface InternalHitTestOptions {
  tolerance: number
  parentIdSet: Set<string>
  deepSelect: boolean
  depth: number
}

/**
 * Hit test recursivo em um nó e seus filhos
 */
function hitTestNode(
  node: SceneNode,
  point: { x: number; y: number },
  layoutMap: Map<string, ComputedLayout>,
  options: InternalHitTestOptions
): HitTestResult | null {
  const layout = layoutMap.get(node.id)
  if (!layout) return null
  
  // Verifica se o nó está visível
  if ('visible' in node && node.visible === false) return null
  
  const { tolerance, parentIdSet, deepSelect, depth } = options
  
  // Bounds do nó
  const x = layout.x
  const y = layout.y
  const width = layout.width
  const height = layout.height
  
  // Verifica se o ponto está dentro do nó (com tolerância)
  const isInside = 
    point.x >= x - tolerance &&
    point.x <= x + width + tolerance &&
    point.y >= y - tolerance &&
    point.y <= y + height + tolerance
  
  if (!isInside) return null
  
  // Se o nó tem filhos, verifica filhos primeiro (de trás para frente)
  if ('children' in node && Array.isArray(node.children) && node.children.length > 0) {
    const children = node.children as SceneNode[]
    
    // Itera de trás para frente (elementos no topo primeiro)
    for (let i = children.length - 1; i >= 0; i--) {
      const child = children[i]
      const childResult = hitTestNode(child, point, layoutMap, {
        ...options,
        depth: depth + 1,
      })
      
      if (childResult) {
        // Deep select: retorna o elemento mais profundo
        if (deepSelect) {
          return childResult
        }
        
        // Se o pai está selecionado (no parentIdSet), permite selecionar o filho
        if (parentIdSet.has(node.id)) {
          return childResult
        }
        
        // Caso contrário, retorna o container pai (comportamento normal)
        // Mas só se não for o root node
        if (depth > 0) {
          return { node, nodeId: node.id, depth }
        }
        
        return childResult
      }
    }
  }
  
  // Se chegou aqui, o ponto está no nó mas não em nenhum filho
  // Retorna o próprio nó (exceto se for o root)
  if (depth === 0) {
    // Root node - não seleciona, apenas seus filhos
    return null
  }
  
  return { node, nodeId: node.id, depth }
}

/**
 * Encontra todos os elementos sob o ponto (para debug ou seleção múltipla)
 */
export function hitTestAll(
  rootNode: FrameNode,
  point: { x: number; y: number },
  layoutMap: Map<string, ComputedLayout>,
  options: HitTestOptions = {}
): HitTestResult[] {
  const results: HitTestResult[] = []
  const { tolerance = 0 } = options
  
  hitTestAllRecursive(rootNode, point, layoutMap, tolerance, 0, results)
  
  // Ordena por profundidade (mais profundo primeiro)
  return results.sort((a, b) => b.depth - a.depth)
}

function hitTestAllRecursive(
  node: SceneNode,
  point: { x: number; y: number },
  layoutMap: Map<string, ComputedLayout>,
  tolerance: number,
  depth: number,
  results: HitTestResult[]
) {
  const layout = layoutMap.get(node.id)
  if (!layout) return
  
  if ('visible' in node && node.visible === false) return
  
  const x = layout.x
  const y = layout.y
  const width = layout.width
  const height = layout.height
  
  const isInside = 
    point.x >= x - tolerance &&
    point.x <= x + width + tolerance &&
    point.y >= y - tolerance &&
    point.y <= y + height + tolerance
  
  if (!isInside) return
  
  // Adiciona o nó (exceto root)
  if (depth > 0) {
    results.push({ node, nodeId: node.id, depth })
  }
  
  // Verifica filhos
  if ('children' in node && Array.isArray(node.children)) {
    for (const child of node.children as SceneNode[]) {
      hitTestAllRecursive(child, point, layoutMap, tolerance, depth + 1, results)
    }
  }
}

/**
 * Verifica se um ponto está dentro de um retângulo
 */
export function isPointInRect(
  point: { x: number; y: number },
  rect: { x: number; y: number; width: number; height: number },
  tolerance: number = 0
): boolean {
  return (
    point.x >= rect.x - tolerance &&
    point.x <= rect.x + rect.width + tolerance &&
    point.y >= rect.y - tolerance &&
    point.y <= rect.y + rect.height + tolerance
  )
}

/**
 * Calcula bounding box de múltiplos nós
 */
export function getBoundingBox(
  nodes: SceneNode[],
  layoutMap: Map<string, ComputedLayout>
): { x: number; y: number; width: number; height: number } | null {
  if (nodes.length === 0) return null
  
  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity
  
  for (const node of nodes) {
    const layout = layoutMap.get(node.id)
    if (!layout) continue
    
    minX = Math.min(minX, layout.x)
    minY = Math.min(minY, layout.y)
    maxX = Math.max(maxX, layout.x + layout.width)
    maxY = Math.max(maxY, layout.y + layout.height)
  }
  
  if (!isFinite(minX)) return null
  
  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY,
  }
}

/**
 * Encontra um nó por ID na árvore
 */
export function findNodeById(
  rootNode: SceneNode,
  nodeId: string
): SceneNode | null {
  if (rootNode.id === nodeId) return rootNode
  
  if ('children' in rootNode && Array.isArray(rootNode.children)) {
    for (const child of rootNode.children as SceneNode[]) {
      const found = findNodeById(child, nodeId)
      if (found) return found
    }
  }
  
  return null
}

/**
 * Encontra múltiplos nós por IDs
 */
export function findNodesByIds(
  rootNode: SceneNode,
  nodeIds: string[]
): SceneNode[] {
  const idSet = new Set(nodeIds)
  const results: SceneNode[] = []
  
  findNodesByIdsRecursive(rootNode, idSet, results)
  
  return results
}

function findNodesByIdsRecursive(
  node: SceneNode,
  idSet: Set<string>,
  results: SceneNode[]
) {
  if (idSet.has(node.id)) {
    results.push(node)
  }
  
  if ('children' in node && Array.isArray(node.children)) {
    for (const child of node.children as SceneNode[]) {
      findNodesByIdsRecursive(child, idSet, results)
    }
  }
}
