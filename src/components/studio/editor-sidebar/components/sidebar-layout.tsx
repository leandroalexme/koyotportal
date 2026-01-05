'use client'

import type { ReactNode } from 'react'
import { SidebarHeader, type BadgeVariant } from './sidebar-header'
import { SidebarFooter } from './sidebar-footer'
import { InfoAlert } from './info-alert'

// ============================================
// TYPES
// ============================================

interface SidebarLayoutProps {
  /** Title displayed in the header */
  title: string
  /** Badge text (e.g., "text-32px", "Frame") */
  badge?: string
  /** Badge variant for styling */
  badgeVariant?: BadgeVariant
  /** Icon for the info alert */
  icon?: ReactNode
  /** Description text for the info alert */
  description?: string
  /** Callback when back button is clicked */
  onBack?: () => void
  /** Undo callback */
  onUndo?: () => void
  /** Redo callback */
  onRedo?: () => void
  /** Whether undo is available */
  canUndo?: boolean
  /** Whether redo is available */
  canRedo?: boolean
  /** Save status */
  status?: 'saved' | 'saving' | 'unsaved'
  /** Main content */
  children: ReactNode
}

// ============================================
// SIDEBAR LAYOUT
// ============================================

export function SidebarLayout({ 
  title, 
  badge, 
  badgeVariant,
  icon,
  description,
  onBack,
  onUndo,
  onRedo,
  canUndo = false,
  canRedo = false,
  status = 'saved',
  children,
}: SidebarLayoutProps) {
  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <SidebarHeader 
        title={title} 
        badge={badge} 
        badgeVariant={badgeVariant}
        onBack={onBack} 
      />

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-zinc-200 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-zinc-300">
        <div className="px-6 py-5 space-y-8">
          {/* Info Alert */}
          {description && (
            <InfoAlert icon={icon}>{description}</InfoAlert>
          )}
          
          {/* Main Content */}
          {children}
        </div>
      </div>

      {/* Footer */}
      <SidebarFooter 
        onUndo={onUndo}
        onRedo={onRedo}
        canUndo={canUndo}
        canRedo={canRedo}
        status={status}
      />
    </div>
  )
}
