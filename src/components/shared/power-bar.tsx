'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Home,
  Palette,
  Image,
  FileText,
  Settings,
  Search,
  Bell,
  Users,
  Layers,
  BookOpen,
  Sparkles,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

interface PowerBarProps {
  brandId?: string
}

const mainNavItems = [
  { icon: Home, label: 'Home', href: '' },
  { icon: Palette, label: 'Visual Identity', href: '/identity' },
  { icon: Image, label: 'Brand Assets', href: '/assets' },
  { icon: FileText, label: 'Templates', href: '/templates' },
]

const toolItems = [
  { icon: Layers, label: 'Content Blocks', href: '/blocks' },
  { icon: BookOpen, label: 'Guidelines', href: '/guidelines' },
  { icon: Sparkles, label: 'AI Studio', href: '/ai' },
  { icon: Users, label: 'Team', href: '/team' },
]

export function PowerBar({ brandId = 'demo' }: PowerBarProps) {
  const pathname = usePathname()
  const basePath = `/${brandId}`

  return (
    <TooltipProvider delayDuration={0}>
      <aside className="fixed left-0 top-0 z-40 flex h-screen w-14 flex-col border-r bg-sidebar">
        <div className="flex h-14 items-center justify-center border-b">
          <Link href="/" className="flex items-center justify-center">
            <span className="text-xl font-bold tracking-tighter">K</span>
          </Link>
        </div>

        <nav className="flex flex-1 flex-col gap-1 p-2">
          {mainNavItems.map((item) => {
            const href = `${basePath}${item.href}`
            const isActive = pathname === href || (item.href === '' && pathname === basePath)

            return (
              <Tooltip key={item.label}>
                <TooltipTrigger asChild>
                  <Button
                    variant={isActive ? 'secondary' : 'ghost'}
                    size="icon"
                    className={cn(
                      'h-10 w-10',
                      isActive && 'bg-sidebar-accent'
                    )}
                    asChild
                  >
                    <Link href={href}>
                      <item.icon className="h-5 w-5" />
                      <span className="sr-only">{item.label}</span>
                    </Link>
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right" sideOffset={10}>
                  {item.label}
                </TooltipContent>
              </Tooltip>
            )
          })}

          <Separator className="my-2" />

          {toolItems.map((item) => {
            const href = `${basePath}${item.href}`
            const isActive = pathname === href

            return (
              <Tooltip key={item.label}>
                <TooltipTrigger asChild>
                  <Button
                    variant={isActive ? 'secondary' : 'ghost'}
                    size="icon"
                    className={cn(
                      'h-10 w-10',
                      isActive && 'bg-sidebar-accent'
                    )}
                    asChild
                  >
                    <Link href={href}>
                      <item.icon className="h-5 w-5" />
                      <span className="sr-only">{item.label}</span>
                    </Link>
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right" sideOffset={10}>
                  {item.label}
                </TooltipContent>
              </Tooltip>
            )
          })}
        </nav>

        <div className="flex flex-col gap-1 border-t p-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-10 w-10">
                <Search className="h-5 w-5" />
                <span className="sr-only">Search</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right" sideOffset={10}>
              Search
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-10 w-10">
                <Bell className="h-5 w-5" />
                <span className="sr-only">Notifications</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right" sideOffset={10}>
              Notifications
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-10 w-10" asChild>
                <Link href={`${basePath}/settings`}>
                  <Settings className="h-5 w-5" />
                  <span className="sr-only">Settings</span>
                </Link>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right" sideOffset={10}>
              Settings
            </TooltipContent>
          </Tooltip>
        </div>
      </aside>
    </TooltipProvider>
  )
}
