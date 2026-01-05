'use client'

import { TextSettings } from './text-settings'
import { FrameSettings } from './frame-settings'
import { ImageSettings } from './image-settings'
import { ShapeSettings } from './shape-settings'
import { ButtonSettings } from './button-settings'
import { LogoSettings } from './logo-settings'
import { EmptyStateSidebar } from './empty-state-sidebar'
import type { 
  SceneNode, 
  TextNode, 
  FrameNode, 
  ImageNode, 
  RectangleNode, 
  EllipseNode, 
  LineNode, 
  UserRole 
} from '@/types/studio'

// ============================================
// TYPES
// ============================================

interface EditorSidebarProps {
  selectedNode: SceneNode | null
  userRole: UserRole
  onUpdateNode: (nodeId: string, updates: Partial<SceneNode>) => void
  onDeselectNode?: () => void
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/** Check if a frame is a button based on naming convention */
function isButtonFrame(node: FrameNode): boolean {
  const name = node.name.toLowerCase()
  return name.includes('button') || name.includes('btn') || name.includes('cta')
}

/** Check if an image is a logo based on naming convention */
function isLogoImage(node: ImageNode): boolean {
  const name = node.name.toLowerCase()
  return name.includes('logo') || name.includes('marca') || name.includes('brand')
}

// ============================================
// SIDEBAR WRAPPER
// ============================================

const SIDEBAR_CLASSES = "w-96 h-full border-l bg-white flex flex-col overflow-hidden [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"

// ============================================
// MAIN EDITOR SIDEBAR
// ============================================

export function EditorSidebar({ 
  selectedNode, 
  userRole, 
  onUpdateNode,
  onDeselectNode,
}: EditorSidebarProps) {
  // No node selected - show empty state
  if (!selectedNode) {
    return (
      <aside className={SIDEBAR_CLASSES}>
        <EmptyStateSidebar />
      </aside>
    )
  }

  // TEXT node
  if (selectedNode.type === 'TEXT') {
    return (
      <aside className={SIDEBAR_CLASSES}>
        <TextSettings
          node={selectedNode as TextNode}
          userRole={userRole}
          onUpdate={onUpdateNode}
          onBack={onDeselectNode}
        />
      </aside>
    )
  }

  // FRAME node - check if it's a button
  if (selectedNode.type === 'FRAME') {
    const frameNode = selectedNode as FrameNode
    
    // Button frame
    if (isButtonFrame(frameNode)) {
      return (
        <aside className={SIDEBAR_CLASSES}>
          <ButtonSettings
            node={frameNode}
            userRole={userRole}
            onUpdate={onUpdateNode}
            onBack={onDeselectNode}
          />
        </aside>
      )
    }
    
    // Regular frame
    return (
      <aside className={SIDEBAR_CLASSES}>
        <FrameSettings
          node={frameNode}
          userRole={userRole}
          onUpdate={onUpdateNode}
          onBack={onDeselectNode}
        />
      </aside>
    )
  }

  // IMAGE node - check if it's a logo
  if (selectedNode.type === 'IMAGE') {
    const imageNode = selectedNode as ImageNode
    
    // Logo image
    if (isLogoImage(imageNode)) {
      return (
        <aside className={SIDEBAR_CLASSES}>
          <LogoSettings
            node={imageNode}
            userRole={userRole}
            onUpdate={onUpdateNode}
            onBack={onDeselectNode}
          />
        </aside>
      )
    }
    
    // Regular image
    return (
      <aside className={SIDEBAR_CLASSES}>
        <ImageSettings
          node={imageNode}
          userRole={userRole}
          onUpdate={onUpdateNode}
          onBack={onDeselectNode}
        />
      </aside>
    )
  }

  // RECTANGLE node
  if (selectedNode.type === 'RECTANGLE') {
    return (
      <aside className={SIDEBAR_CLASSES}>
        <ShapeSettings
          node={selectedNode as RectangleNode}
          userRole={userRole}
          onUpdate={onUpdateNode}
          onBack={onDeselectNode}
        />
      </aside>
    )
  }

  // ELLIPSE node
  if (selectedNode.type === 'ELLIPSE') {
    return (
      <aside className={SIDEBAR_CLASSES}>
        <ShapeSettings
          node={selectedNode as EllipseNode}
          userRole={userRole}
          onUpdate={onUpdateNode}
          onBack={onDeselectNode}
        />
      </aside>
    )
  }

  // LINE node
  if (selectedNode.type === 'LINE') {
    return (
      <aside className={SIDEBAR_CLASSES}>
        <ShapeSettings
          node={selectedNode as LineNode}
          userRole={userRole}
          onUpdate={onUpdateNode}
          onBack={onDeselectNode}
        />
      </aside>
    )
  }

  // Fallback - unknown node type
  return (
    <aside className={SIDEBAR_CLASSES}>
      <EmptyStateSidebar />
    </aside>
  )
}
