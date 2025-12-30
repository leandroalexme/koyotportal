'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Eye, Pencil, ChevronDown, ExternalLink, Save, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useEditorStore } from '@/store/editor-store'

interface TopNavProps {
  brandName?: string
  brandId?: string
  onSave?: () => Promise<void>
}

const navItems = [
  { label: 'Home', href: '' },
  { label: 'Visual Identity', href: '/identity' },
  {
    label: 'Brand Assets',
    href: '/assets',
    children: [
      { label: 'All Assets', href: '/assets' },
      { label: 'Logos', href: '/assets/logos' },
      { label: 'Images', href: '/assets/images' },
      { label: 'Documents', href: '/assets/documents' },
    ],
  },
  { label: 'Templates', href: '/templates' },
  {
    label: 'Campaign Toolkits',
    href: '/campaigns',
    children: [
      { label: 'Active Campaigns', href: '/campaigns' },
      { label: 'Archive', href: '/campaigns/archive' },
    ],
  },
  { label: 'FAQ', href: '/faq' },
]

export function TopNav({ brandName = 'Koyot', brandId = 'demo', onSave }: TopNavProps) {
  const pathname = usePathname()
  const basePath = `/${brandId}`
  const { mode, toggleMode, hasUnsavedChanges } = useEditorStore()

  const handleSave = async () => {
    if (onSave) {
      await onSave()
    }
  }

  return (
    <header className="fixed left-14 right-0 top-0 z-30 flex h-14 items-center justify-between border-b bg-background px-6">
      <div className="flex items-center gap-8">
        <Link
          href={basePath}
          className="text-lg font-semibold tracking-tight text-primary"
        >
          {brandName}
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {navItems.map((item) => {
            const href = `${basePath}${item.href}`
            const isActive =
              pathname === href || (item.href === '' && pathname === basePath)

            if (item.children) {
              return (
                <DropdownMenu key={item.label}>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      className={cn(
                        'h-9 gap-1 px-3 text-sm font-medium',
                        isActive && 'bg-accent'
                      )}
                    >
                      {item.label}
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start">
                    {item.children.map((child) => (
                      <DropdownMenuItem key={child.label} asChild>
                        <Link href={`${basePath}${child.href}`}>
                          {child.label}
                        </Link>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              )
            }

            return (
              <Button
                key={item.label}
                variant="ghost"
                className={cn(
                  'h-9 px-3 text-sm font-medium',
                  isActive && 'bg-accent'
                )}
                asChild
              >
                <Link href={href}>{item.label}</Link>
              </Button>
            )
          })}
        </nav>
      </div>

      <div className="flex items-center gap-2">
        {mode === 'edit' && hasUnsavedChanges && (
          <Button
            variant="default"
            size="sm"
            className="gap-2"
            onClick={handleSave}
          >
            <Save className="h-4 w-4" />
            Save
          </Button>
        )}

        <div className="flex rounded-md border">
          <Button
            variant={mode === 'view' ? 'secondary' : 'ghost'}
            size="sm"
            className="gap-2 rounded-r-none border-r"
            onClick={() => mode !== 'view' && toggleMode()}
          >
            <Eye className="h-4 w-4" />
            <span className="hidden sm:inline">View</span>
          </Button>

          <Button
            variant={mode === 'edit' ? 'secondary' : 'ghost'}
            size="sm"
            className="gap-2 rounded-l-none"
            onClick={() => mode !== 'edit' && toggleMode()}
          >
            <Pencil className="h-4 w-4" />
            <span className="hidden sm:inline">Edit</span>
          </Button>
        </div>

        <Button variant="outline" size="sm" className="ml-2 gap-2">
          <ExternalLink className="h-4 w-4" />
          <span className="hidden sm:inline">Portal</span>
        </Button>
      </div>
    </header>
  )
}
