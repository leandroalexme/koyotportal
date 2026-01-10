/**
 * Canvas Engine - Gerencia renderização do canvas independente do React
 * 
 * Inspirado no padrão do Suika Editor onde o render é explícito,
 * não dependendo de hooks do React que causam loops de feedback.
 */

import { 
  renderScene, 
  fontEngine,
  calculateSceneLayout,
  clearLayoutCache,
} from './render-engine'
import { type ComputedLayout } from './yoga-adapter'
import type { FrameNode, SceneNode } from '@/types/studio'
import { 
  SelectionManager, 
  SelectionRenderer, 
  hitTest as selectionHitTest,
} from './selection'
import { AutoLayoutHandlesRenderer, autoLayoutState } from './auto-layout'

// Constants
const MIN_ZOOM = 0.1
const MAX_ZOOM = 3
const ZOOM_SENSITIVITY = 0.002
const MIN_EDGE_MARGIN = 50
const ZOOM_THRESHOLD = 0.45

interface TemplateFonts {
  googleFonts?: Array<{ family: string; weights: number[] }>
  customFonts?: string[]
  googleFontsUrl?: string | null
}

interface CanvasEngineOptions {
  canvas: HTMLCanvasElement
  container: HTMLDivElement
  rootNode: FrameNode
  fonts?: TemplateFonts
  onZoomChange?: (zoom: number) => void
  onPanChange?: (offset: { x: number; y: number }) => void
  onNodeClick?: (nodeId: string | null) => void
}

interface ViewportState {
  zoom: number
  panOffset: { x: number; y: number }
  containerSize: { width: number; height: number }
}

// Track active engine instance to prevent duplicates
let activeEngineId = 0

export class CanvasEngine {
  private canvas: HTMLCanvasElement
  private container: HTMLDivElement
  private rootNode: FrameNode
  private fonts?: TemplateFonts
  private showGrid: boolean = false
  
  // Selection system
  private selectionManager: SelectionManager
  private selectionRenderer: SelectionRenderer
  
  // Auto-layout handles
  private autoLayoutRenderer: AutoLayoutHandlesRenderer
  private hoveredAutoLayoutHandle: string | null = null
  
  private viewport: ViewportState = {
    zoom: 1,
    panOffset: { x: 0, y: 0 },
    containerSize: { width: 0, height: 0 },
  }
  
  private layoutCache: {
    rootNodeId: string
    layoutMap: Map<string, ComputedLayout>
  } | null = null
  
  private fontsLoaded: boolean = false
  private isPanning: boolean = false
  private isSpacePressed: boolean = false
  private isCommandPressed: boolean = false
  private lastMousePos: { x: number; y: number } = { x: 0, y: 0 }
  
  private animationFrameId: number | null = null
  private resizeObserver: ResizeObserver | null = null
  private destroyed: boolean = false
  private engineId: number
  private autoLayoutStateUnsubscribe: (() => void) | null = null
  
  // Callbacks
  private onZoomChange?: (zoom: number) => void
  private onPanChange?: (offset: { x: number; y: number }) => void
  private onNodeClick?: (nodeId: string | null) => void
  private onSelectionChange?: (selectedIds: string[]) => void
  
  constructor(options: CanvasEngineOptions) {
    this.engineId = ++activeEngineId
    
    this.canvas = options.canvas
    this.container = options.container
    this.rootNode = options.rootNode
    this.fonts = options.fonts
    this.onZoomChange = options.onZoomChange
    this.onPanChange = options.onPanChange
    this.onNodeClick = options.onNodeClick
    
    // Initialize selection system
    this.selectionManager = new SelectionManager(this.rootNode)
    this.selectionRenderer = new SelectionRenderer()
    
    // Initialize auto-layout handles renderer
    this.autoLayoutRenderer = new AutoLayoutHandlesRenderer()
    
    // Listen to selection changes
    this.selectionManager.on('selectionChange', (selectedIds) => {
      this.onSelectionChange?.(selectedIds)
      this.render()
    })
    this.selectionManager.on('hoverChange', () => {
      this.render()
    })
    
    // Listen to auto-layout state changes (for sidebar editing feedback)
    this.autoLayoutStateUnsubscribe = autoLayoutState.subscribe(() => {
      this.render()
    })
    
    this.init()
  }
  
  private async init() {
    // Load template fonts if available, otherwise load brand fonts
    if (this.fonts) {
      await fontEngine.loadTemplateFonts(this.fonts)
    } else {
      await fontEngine.loadBrandFonts()
    }
    this.fontsLoaded = true
    
    // Setup resize observer
    this.resizeObserver = new ResizeObserver(() => {
      this.updateContainerSize()
      this.render()
    })
    this.resizeObserver.observe(this.container)
    
    // Initial size
    this.updateContainerSize()
    
    // Bind events
    this.bindEvents()
    
    // Initial render
    this.render()
  }
  
  private updateContainerSize() {
    this.viewport.containerSize = {
      width: this.container.clientWidth,
      height: this.container.clientHeight,
    }
  }
  
  private bindEvents() {
    // Wheel for zoom
    this.canvas.addEventListener('wheel', this.handleWheel, { passive: false })
    
    // Mouse events
    this.canvas.addEventListener('mousedown', this.handleMouseDown)
    this.canvas.addEventListener('mousemove', this.handleMouseMove)
    this.canvas.addEventListener('mouseup', this.handleMouseUp)
    this.canvas.addEventListener('mouseleave', this.handleMouseLeave)
    this.canvas.addEventListener('dblclick', this.handleDoubleClick)
    this.canvas.addEventListener('contextmenu', (e) => e.preventDefault())
    
    // Keyboard events
    window.addEventListener('keydown', this.handleKeyDown)
    window.addEventListener('keyup', this.handleKeyUp)
  }
  
  private unbindEvents() {
    this.canvas.removeEventListener('wheel', this.handleWheel)
    this.canvas.removeEventListener('mousedown', this.handleMouseDown)
    this.canvas.removeEventListener('mousemove', this.handleMouseMove)
    this.canvas.removeEventListener('mouseup', this.handleMouseUp)
    this.canvas.removeEventListener('mouseleave', this.handleMouseLeave)
    this.canvas.removeEventListener('dblclick', this.handleDoubleClick)
    window.removeEventListener('keydown', this.handleKeyDown)
    window.removeEventListener('keyup', this.handleKeyUp)
  }
  
  // ============================================
  // EVENT HANDLERS
  // ============================================
  
  private handleWheel = (e: WheelEvent) => {
    e.preventDefault()
    if (this.destroyed) return
    
    const { zoom, panOffset, containerSize } = this.viewport
    
    const rect = this.canvas.getBoundingClientRect()
    const mouseX = e.clientX - rect.left
    const mouseY = e.clientY - rect.top
    
    // Calculate zoom delta
    const delta = -e.deltaY * ZOOM_SENSITIVITY
    let newZoom = zoom * Math.exp(delta)
    newZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, newZoom))
    
    if (Math.abs(newZoom - zoom) < 0.001) return
    
    const threshold = ZOOM_THRESHOLD
    const wasAboveThreshold = zoom >= threshold
    const isAboveThreshold = newZoom >= threshold
    
    let newPanX: number
    let newPanY: number
    
    if (!isAboveThreshold) {
      newPanX = 0
      newPanY = 0
    } else {
      const viewportCenterX = containerSize.width / 2
      const viewportCenterY = containerSize.height / 2
      const mouseFromCenterX = mouseX - viewportCenterX
      const mouseFromCenterY = mouseY - viewportCenterY
      
      if (!wasAboveThreshold) {
        const zoomRatio = newZoom / threshold
        newPanX = mouseFromCenterX * (1 - 1/zoomRatio)
        newPanY = mouseFromCenterY * (1 - 1/zoomRatio)
      } else {
        const mouseInPanSpaceX = mouseFromCenterX - panOffset.x
        const mouseInPanSpaceY = mouseFromCenterY - panOffset.y
        const zoomRatio = newZoom / zoom
        newPanX = mouseFromCenterX - mouseInPanSpaceX * zoomRatio
        newPanY = mouseFromCenterY - mouseInPanSpaceY * zoomRatio
      }
    }
    
    // Clamp pan
    let finalPan = { x: newPanX, y: newPanY }
    if (isAboveThreshold) {
      finalPan = this.clampPan({ x: newPanX, y: newPanY }, newZoom)
    }
    
    // Update state
    this.viewport.zoom = newZoom
    this.viewport.panOffset = finalPan
    
    // Render immediately
    this.render()
    
    // Notify callbacks
    this.onZoomChange?.(newZoom)
    this.onPanChange?.(finalPan)
  }
  
  private handleMouseDown = (e: MouseEvent) => {
    if (this.destroyed) return
    if (this.viewport.zoom < ZOOM_THRESHOLD) return
    
    // Middle mouse button or space + left click = pan
    if (e.button === 1 || (this.isSpacePressed && e.button === 0)) {
      e.preventDefault()
      this.isPanning = true
      this.lastMousePos = { x: e.clientX, y: e.clientY }
      this.canvas.style.cursor = 'grabbing'
    }
  }
  
  private handleMouseMove = (e: MouseEvent) => {
    if (this.destroyed) return
    
    if (this.isPanning && this.viewport.zoom >= ZOOM_THRESHOLD) {
      const deltaX = e.clientX - this.lastMousePos.x
      const deltaY = e.clientY - this.lastMousePos.y
      this.lastMousePos = { x: e.clientX, y: e.clientY }
      
      const newPan = this.clampPan(
        { 
          x: this.viewport.panOffset.x + deltaX, 
          y: this.viewport.panOffset.y + deltaY 
        },
        this.viewport.zoom
      )
      
      this.viewport.panOffset = newPan
      this.render()
      this.onPanChange?.(newPan)
      return
    }
    
    // Update hover state
    this.updateHover(e)
  }
  
  /**
   * Update hover state based on mouse position
   */
  private updateHover = (e: MouseEvent) => {
    const centerOffset = this.getCenterOffset()
    const rect = this.canvas.getBoundingClientRect()
    const mouseX = e.clientX - rect.left
    const mouseY = e.clientY - rect.top
    
    const artX = (mouseX - centerOffset.x) / this.viewport.zoom
    const artY = (mouseY - centerOffset.y) / this.viewport.zoom
    
    const layoutMap = this.layoutCache?.layoutMap ?? new Map()
    
    // Hit test for hover
    const isDeepSelect = e.metaKey || e.ctrlKey
    const result = selectionHitTest(this.rootNode, { x: artX, y: artY }, layoutMap, {
      deepSelect: isDeepSelect,
      parentIdSet: this.selectionManager.getParentIdSet(),
    })
    
    if (result) {
      this.selectionManager.setHover(result.nodeId)
      this.canvas.style.cursor = 'pointer'
    } else {
      this.selectionManager.setHover(null)
      this.canvas.style.cursor = 'default'
    }
  }
  
  private handleMouseUp = (e: MouseEvent) => {
    if (this.destroyed) return
    if (this.isPanning) {
      this.isPanning = false
      this.canvas.style.cursor = this.isSpacePressed ? 'grab' : 'default'
      return
    }
    
    // Only handle left click for selection
    if (e.button !== 0) return
    
    const centerOffset = this.getCenterOffset()
    const rect = this.canvas.getBoundingClientRect()
    const clickX = e.clientX - rect.left
    const clickY = e.clientY - rect.top
    
    const artX = (clickX - centerOffset.x) / this.viewport.zoom
    const artY = (clickY - centerOffset.y) / this.viewport.zoom
    
    const layoutMap = this.layoutCache?.layoutMap ?? new Map()
    
    // Use new selection hit test with deep selection support
    const isDeepSelect = e.metaKey || e.ctrlKey
    const result = selectionHitTest(this.rootNode, { x: artX, y: artY }, layoutMap, {
      deepSelect: isDeepSelect,
      parentIdSet: this.selectionManager.getParentIdSet(),
    })
    
    if (result) {
      if (e.shiftKey) {
        // Multi-select with Shift
        this.selectionManager.toggleSelection(result.nodeId)
      } else {
        this.selectionManager.select(result.nodeId)
      }
      this.onNodeClick?.(result.nodeId)
    } else {
      this.selectionManager.clearSelection()
      this.onNodeClick?.(null)
    }
  }
  
  private handleMouseLeave = () => {
    this.isPanning = false
    this.canvas.style.cursor = 'default'
  }
  
  /**
   * Handle double click for deep selection (enter into children)
   * Similar to Figma/Suika: double click enters into a frame to select children
   */
  private handleDoubleClick = (e: MouseEvent) => {
    if (this.destroyed) return
    if (e.button !== 0) return
    
    const centerOffset = this.getCenterOffset()
    const rect = this.canvas.getBoundingClientRect()
    const clickX = e.clientX - rect.left
    const clickY = e.clientY - rect.top
    
    const artX = (clickX - centerOffset.x) / this.viewport.zoom
    const artY = (clickY - centerOffset.y) / this.viewport.zoom
    
    const layoutMap = this.layoutCache?.layoutMap ?? new Map()
    
    // Get currently selected node
    const selectedIds = this.selectionManager.getSelectedIds()
    
    if (selectedIds.length === 1) {
      const selectedNode = this.findNodeById(selectedIds[0])
      
      // If selected node is a frame with children, try to select a child
      if (selectedNode && selectedNode.type === 'FRAME') {
        const frameNode = selectedNode as FrameNode
        
        if (frameNode.children && frameNode.children.length > 0) {
          // Find child under cursor
          const result = selectionHitTest(frameNode, { x: artX, y: artY }, layoutMap, {
            deepSelect: true,
            parentIdSet: new Set([frameNode.id]),
          })
          
          if (result && result.nodeId !== frameNode.id) {
            this.selectionManager.select(result.nodeId)
            this.onNodeClick?.(result.nodeId)
            return
          }
        }
      }
    }
    
    // If no special handling, do a deep select from root
    const result = selectionHitTest(this.rootNode, { x: artX, y: artY }, layoutMap, {
      deepSelect: true,
      parentIdSet: this.selectionManager.getParentIdSet(),
    })
    
    if (result) {
      this.selectionManager.select(result.nodeId)
      this.onNodeClick?.(result.nodeId)
    }
  }
  
  private handleKeyDown = (e: KeyboardEvent) => {
    if (this.destroyed) return
    if (e.code === 'Space' && !this.isSpacePressed && e.target === document.body) {
      e.preventDefault()
      this.isSpacePressed = true
      this.canvas.style.cursor = 'grab'
    }
  }
  
  private handleKeyUp = (e: KeyboardEvent) => {
    if (this.destroyed) return
    if (e.code === 'Space') {
      this.isSpacePressed = false
      this.isPanning = false
      this.canvas.style.cursor = 'default'
    }
  }
  
  // ============================================
  // UTILITY METHODS
  // ============================================
  
  private clampPan(pan: { x: number; y: number }, zoom: number): { x: number; y: number } {
    const { containerSize } = this.viewport
    const scaledWidth = this.rootNode.size.width * zoom
    const scaledHeight = this.rootNode.size.height * zoom
    
    let maxPanX: number
    let maxPanY: number
    
    if (scaledWidth <= containerSize.width) {
      maxPanX = Math.max(0, (containerSize.width - scaledWidth) / 2 - MIN_EDGE_MARGIN)
    } else {
      maxPanX = (scaledWidth - containerSize.width) / 2 + MIN_EDGE_MARGIN
    }
    
    if (scaledHeight <= containerSize.height) {
      maxPanY = Math.max(0, (containerSize.height - scaledHeight) / 2 - MIN_EDGE_MARGIN)
    } else {
      maxPanY = (scaledHeight - containerSize.height) / 2 + MIN_EDGE_MARGIN
    }
    
    return {
      x: Math.max(-maxPanX, Math.min(maxPanX, pan.x)),
      y: Math.max(-maxPanY, Math.min(maxPanY, pan.y)),
    }
  }
  
  private getCenterOffset(): { x: number; y: number } {
    const { zoom, panOffset, containerSize } = this.viewport
    
    if (containerSize.width === 0 || containerSize.height === 0) {
      return { x: 0, y: 0 }
    }
    
    const artWidth = this.rootNode.size.width * zoom
    const artHeight = this.rootNode.size.height * zoom
    
    const offsetX = (containerSize.width - artWidth) / 2
    const offsetY = (containerSize.height - artHeight) / 2
    
    return {
      x: offsetX + panOffset.x,
      y: offsetY + panOffset.y,
    }
  }
  
  // ============================================
  // RENDER
  // ============================================
  
  render() {
    if (this.destroyed) return
    if (!this.fontsLoaded || this.viewport.containerSize.width === 0) return
    
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId)
    }
    
    this.animationFrameId = requestAnimationFrame(async () => {
      if (this.destroyed) return
      // Get or calculate layout
      let layoutMap: Map<string, ComputedLayout>
      
      if (this.layoutCache?.rootNodeId === this.rootNode.id) {
        layoutMap = this.layoutCache.layoutMap
      } else {
        // Calculating layout
        clearLayoutCache()
        layoutMap = calculateSceneLayout(this.rootNode)
        this.layoutCache = {
          rootNodeId: this.rootNode.id,
          layoutMap,
        }
      }
      
      const centerOffset = this.getCenterOffset()
      
      // Render scene without selection (selection is rendered separately)
      await renderScene(this.canvas, this.rootNode, {
        zoom: this.viewport.zoom,
        centerOffset,
        showGrid: this.showGrid,
        layoutMap,
      })
      
      // Render selection overlays
      this.renderSelectionOverlays(layoutMap, centerOffset)
    })
  }
  
  /**
   * Render selection and hover overlays using SelectionRenderer
   */
  private renderSelectionOverlays(
    layoutMap: Map<string, ComputedLayout>,
    centerOffset: { x: number; y: number }
  ) {
    const ctx = this.canvas.getContext('2d')
    if (!ctx) return
    
    const dpr = window.devicePixelRatio || 1
    const renderOptions = {
      ctx,
      layoutMap,
      zoom: this.viewport.zoom,
      dpr,
      centerOffset,
    }
    
    // Draw hover outline (if not selected)
    const hoveredId = this.selectionManager.getHoveredId()
    const selectedIds = this.selectionManager.getSelectedIds()
    
    if (hoveredId && !selectedIds.includes(hoveredId)) {
      const hoveredNode = this.findNodeById(hoveredId)
      if (hoveredNode) {
        this.selectionRenderer.drawHoverOutline(hoveredNode, renderOptions)
      }
    }
    
    // Draw selection
    if (selectedIds.length === 1) {
      const selectedNode = this.findNodeById(selectedIds[0])
      if (selectedNode) {
        this.selectionRenderer.drawSelectionBox(selectedNode, renderOptions, true)
        
        // Draw auto-layout handles if the selected node is a frame with auto-layout
        if (selectedNode.type === 'FRAME') {
          const frameNode = selectedNode as FrameNode
          if (frameNode.autoLayout?.layoutMode !== 'NONE') {
            this.autoLayoutRenderer.renderHandles(
              frameNode,
              renderOptions,
              this.hoveredAutoLayoutHandle
            )
          }
        }
      }
    } else if (selectedIds.length > 1) {
      const selectedNodes = selectedIds
        .map(id => this.findNodeById(id))
        .filter((n): n is SceneNode => n !== null)
      
      if (selectedNodes.length > 0) {
        // Draw individual outlines
        for (const node of selectedNodes) {
          this.selectionRenderer.drawSelectionBox(node, renderOptions, false)
        }
        // Draw bounding box
        this.selectionRenderer.drawMultiSelectionBox(selectedNodes, renderOptions)
      }
    }
  }
  
  /**
   * Find a node by ID in the tree
   */
  private findNodeById(nodeId: string): SceneNode | null {
    const findInNode = (node: SceneNode): SceneNode | null => {
      if (node.id === nodeId) return node
      if ('children' in node && Array.isArray(node.children)) {
        for (const child of node.children as SceneNode[]) {
          const found = findInNode(child)
          if (found) return found
        }
      }
      return null
    }
    return findInNode(this.rootNode)
  }
  
  // ============================================
  // PUBLIC API
  // ============================================
  
  setRootNode(rootNode: FrameNode) {
    // Always update rootNode and re-render when called
    // This ensures edits from sidebar are reflected in canvas
    this.rootNode = rootNode
    this.layoutCache = null // Clear cache to recalculate layout
    this.selectionManager.setRootNode(rootNode) // Update selection manager
    this.render()
  }
  
  setSelectedNodeId(nodeId: string | null) {
    if (nodeId) {
      this.selectionManager.select(nodeId)
    } else {
      this.selectionManager.clearSelection()
    }
    // Render is triggered by selectionManager event
  }
  
  getSelectedIds(): string[] {
    return this.selectionManager.getSelectedIds()
  }
  
  setShowGrid(showGrid: boolean) {
    if (this.showGrid !== showGrid) {
      this.showGrid = showGrid
      this.render()
    }
  }
  
  setZoom(zoom: number) {
    if (Math.abs(this.viewport.zoom - zoom) > 0.001) {
      this.viewport.zoom = zoom
      this.render()
    }
  }
  
  setPanOffset(offset: { x: number; y: number }) {
    if (this.viewport.panOffset.x !== offset.x || this.viewport.panOffset.y !== offset.y) {
      this.viewport.panOffset = offset
      this.render()
    }
  }
  
  getZoom(): number {
    return this.viewport.zoom
  }
  
  getPanOffset(): { x: number; y: number } {
    return { ...this.viewport.panOffset }
  }
  
  destroy() {
    // Destroying instance
    this.destroyed = true
    this.unbindEvents()
    this.resizeObserver?.disconnect()
    this.autoLayoutStateUnsubscribe?.()
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId)
      this.animationFrameId = null
    }
  }
}
