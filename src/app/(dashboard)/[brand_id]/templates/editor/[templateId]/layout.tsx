'use client'

import { useEffect } from 'react'

export default function EditorLayout({
  children,
}: {
  children: React.ReactNode
}) {
  useEffect(() => {
    // Hide body scrollbar when editor is mounted
    document.body.style.overflow = 'hidden'
    document.documentElement.style.overflow = 'hidden'
    
    return () => {
      // Restore scrollbar when editor is unmounted
      document.body.style.overflow = ''
      document.documentElement.style.overflow = ''
    }
  }, [])

  return (
    <div className="fixed inset-0 z-50 bg-background overflow-hidden">
      {children}
    </div>
  )
}
