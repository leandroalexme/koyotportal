/**
 * Auto Layout Handles Types
 * 
 * Tipos para handles visuais de padding e gap em frames com auto-layout.
 * Inspirado no Suika Editor.
 */

export type AutoLayoutHandleType =
  | 'padding-top'
  | 'padding-right'
  | 'padding-bottom'
  | 'padding-left'
  | 'gap'

export interface PaddingHandle {
  type: 'padding-top' | 'padding-right' | 'padding-bottom' | 'padding-left'
  start: { x: number; y: number }
  end: { x: number; y: number }
  value: number
  frameId: string
}

export interface GapHandle {
  type: 'gap'
  start: { x: number; y: number }
  end: { x: number; y: number }
  value: number
  frameId: string
  gapIndex: number
}

export type AutoLayoutHandle = PaddingHandle | GapHandle

export interface AutoLayoutColors {
  padding: string
  gap: string
  paddingFill: string
  gapFill: string
}

export const DEFAULT_AUTO_LAYOUT_COLORS: AutoLayoutColors = {
  // Cores mais sutis para os handles (menos saturadas)
  padding: 'rgba(13, 153, 255, 0.3)', // Azul com 60% opacidade
  gap: 'rgba(200, 0, 200, 0.6)', // Magenta mais suave com 60% opacidade
  paddingFill: 'rgba(13, 153, 255, 0.05)', // Background muito sutil
  gapFill: 'rgba(200, 0, 200, 0.05)', // Background muito sutil
}

export interface AutoLayoutFrameAttrs {
  id: string
  width: number
  height: number
  autoLayoutEnabled?: boolean
  layoutDirection?: 'horizontal' | 'vertical'
  layoutGap?: number
  paddingTop?: number
  paddingRight?: number
  paddingBottom?: number
  paddingLeft?: number
}
