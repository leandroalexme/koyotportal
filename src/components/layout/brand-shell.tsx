'use client'

import { PowerBar } from './power-bar'
import { TopNav } from './top-nav'

interface BrandShellProps {
  children: React.ReactNode
  brandId?: string
  brandName?: string
}

export function BrandShell({
  children,
  brandId = 'demo',
  brandName = 'Koyot',
}: BrandShellProps) {
  return (
    <div className="min-h-screen bg-background">
      <PowerBar brandId={brandId} />
      <TopNav brandId={brandId} brandName={brandName} />
      <main className="ml-14 mt-14 min-h-[calc(100vh-3.5rem)]">
        {children}
      </main>
    </div>
  )
}
