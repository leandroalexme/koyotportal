/**
 * useTemplateSnapshot
 * 
 * Hook para capturar o template do editor como snapshot
 * para uso em mockups. Sincroniza automaticamente quando
 * o template é modificado.
 */

import { useEffect, useRef, useCallback, useState } from 'react'
import { useEditorStore } from '@/stores/editor-store'
import { renderScene } from '../render-engine'
import type { TemplateSnapshot } from './types'
import type { FrameNode } from '@/types/studio'

interface UseTemplateSnapshotOptions {
  /** Debounce em ms para evitar re-renders excessivos */
  debounceMs?: number
  /** Escala do snapshot (1 = tamanho original) */
  scale?: number
  /** Callback quando snapshot é atualizado */
  onSnapshot?: (snapshot: TemplateSnapshot) => void
}

interface UseTemplateSnapshotReturn {
  /** Snapshot atual do template */
  snapshot: TemplateSnapshot | null
  /** Canvas usado para renderização */
  canvas: HTMLCanvasElement | null
  /** Está processando */
  isProcessing: boolean
  /** Forçar atualização do snapshot */
  refresh: () => Promise<void>
  /** Gerar snapshot de um node específico */
  captureNode: (node: FrameNode) => Promise<TemplateSnapshot | null>
}

/**
 * Hook para capturar snapshots do template do editor
 */
export function useTemplateSnapshot(
  options: UseTemplateSnapshotOptions = {}
): UseTemplateSnapshotReturn {
  const { debounceMs = 150, scale = 1, onSnapshot } = options
  
  const template = useEditorStore((state) => state.template)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const debounceRef = useRef<NodeJS.Timeout | null>(null)
  
  const [snapshot, setSnapshot] = useState<TemplateSnapshot | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  
  // Criar canvas offscreen
  useEffect(() => {
    if (!canvasRef.current) {
      canvasRef.current = document.createElement('canvas')
    }
  }, [])
  
  /**
   * Renderiza um node para canvas e retorna snapshot
   */
  const captureNode = useCallback(async (
    node: FrameNode
  ): Promise<TemplateSnapshot | null> => {
    const canvas = canvasRef.current
    if (!canvas) return null
    
    try {
      setIsProcessing(true)
      
      // Calcular dimensões
      const width = Math.ceil(node.size.width * scale)
      const height = Math.ceil(node.size.height * scale)
      
      canvas.width = width
      canvas.height = height
      
      const ctx = canvas.getContext('2d')
      if (!ctx) return null
      
      // Limpar canvas
      ctx.clearRect(0, 0, width, height)
      
      // Renderizar cena
      await renderScene(canvas, node, {
        zoom: scale,
        centerOffset: { x: 0, y: 0 },
        showGrid: false,
      })
      
      // Criar snapshot
      const imageData = ctx.getImageData(0, 0, width, height)
      
      const newSnapshot: TemplateSnapshot = {
        templateId: node.id,
        imageData,
        width,
        height,
        updatedAt: Date.now(),
      }
      
      return newSnapshot
    } catch (error) {
      console.error('[useTemplateSnapshot] Erro ao capturar node:', error)
      return null
    } finally {
      setIsProcessing(false)
    }
  }, [scale])
  
  /**
   * Atualiza snapshot do template atual
   */
  const refresh = useCallback(async () => {
    if (!template?.rootNode) {
      setSnapshot(null)
      return
    }
    
    const newSnapshot = await captureNode(template.rootNode)
    if (newSnapshot) {
      setSnapshot(newSnapshot)
      onSnapshot?.(newSnapshot)
    }
  }, [template, captureNode, onSnapshot])
  
  // Atualizar snapshot quando template mudar (com debounce)
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }
    
    debounceRef.current = setTimeout(() => {
      refresh()
    }, debounceMs)
    
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
    }
  }, [template, refresh, debounceMs])
  
  return {
    snapshot,
    canvas: canvasRef.current,
    isProcessing,
    refresh,
    captureNode,
  }
}

/**
 * Hook simplificado para obter apenas o canvas do snapshot
 */
export function useTemplateSnapshotCanvas(
  options: UseTemplateSnapshotOptions = {}
): HTMLCanvasElement | null {
  const { snapshot, canvas } = useTemplateSnapshot(options)
  
  // Retornar canvas se tiver snapshot
  if (snapshot && canvas) {
    return canvas
  }
  
  return null
}

/**
 * Função utilitária para capturar snapshot de um node específico
 * (sem hook, para uso imperativo)
 */
export async function captureNodeSnapshot(
  node: FrameNode,
  scale: number = 1
): Promise<TemplateSnapshot | null> {
  const canvas = document.createElement('canvas')
  
  try {
    const width = Math.ceil(node.size.width * scale)
    const height = Math.ceil(node.size.height * scale)
    
    canvas.width = width
    canvas.height = height
    
    await renderScene(canvas, node, {
      zoom: scale,
      centerOffset: { x: 0, y: 0 },
      showGrid: false,
    })
    
    const ctx = canvas.getContext('2d')
    if (!ctx) return null
    
    const imageData = ctx.getImageData(0, 0, width, height)
    
    return {
      templateId: node.id,
      imageData,
      width,
      height,
      updatedAt: Date.now(),
    }
  } catch (error) {
    console.error('[captureNodeSnapshot] Erro:', error)
    return null
  }
}

/**
 * Função para criar snapshot a partir de um canvas existente
 */
export function createSnapshotFromCanvas(
  canvas: HTMLCanvasElement,
  templateId: string
): TemplateSnapshot {
  return {
    templateId,
    imageData: canvas,
    width: canvas.width,
    height: canvas.height,
    updatedAt: Date.now(),
  }
}
