'use client'

import type { ReactNode } from 'react'

// ============================================
// TYPES
// ============================================

interface InfoAlertProps {
  icon?: ReactNode
  children: ReactNode
}

// ============================================
// INFO ALERT
// ============================================

export function InfoAlert({ icon, children }: InfoAlertProps) {
  return (
    <div className="flex items-start gap-3 p-4 bg-muted/50 rounded-lg">
      {icon && (
        <div className="size-5 text-muted-foreground shrink-0 mt-0.5">
          {icon}
        </div>
      )}
      <p className="text-sm text-muted-foreground">{children}</p>
    </div>
  )
}
