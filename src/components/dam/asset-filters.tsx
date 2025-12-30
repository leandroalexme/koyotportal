'use client'

import { useState } from 'react'
import { 
  Search, 
  X,
  Crown,
  FileImage,
  FileText,
  FileVideo,
  Type,
  Shapes,
  File,
  SlidersHorizontal
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'

export interface AssetFiltersState {
  search: string
  category: string
  sortBy: 'recent' | 'name' | 'size'
  sortOrder: 'asc' | 'desc'
  tags: string[]
}

interface AssetFiltersProps {
  filters: AssetFiltersState
  onFiltersChange: (filters: AssetFiltersState) => void
  availableTags?: string[]
  assetCounts?: Record<string, number>
}

const categories = [
  { id: 'all', label: 'Todos', icon: File },
  { id: 'logo', label: 'Logos', icon: Crown },
  { id: 'image', label: 'Imagens', icon: FileImage },
  { id: 'document', label: 'Documentos', icon: FileText },
  { id: 'video', label: 'Vídeos', icon: FileVideo },
  { id: 'typography', label: 'Tipografia', icon: Type },
  { id: 'icon', label: 'Ícones', icon: Shapes },
]

export function AssetFilters({
  filters,
  onFiltersChange,
  availableTags = [],
  assetCounts = {},
}: AssetFiltersProps) {
  const [isOpen, setIsOpen] = useState(false)

  const updateFilter = <K extends keyof AssetFiltersState>(
    key: K,
    value: AssetFiltersState[K]
  ) => {
    onFiltersChange({ ...filters, [key]: value })
  }

  const toggleTag = (tag: string) => {
    const newTags = filters.tags.includes(tag)
      ? filters.tags.filter(t => t !== tag)
      : [...filters.tags, tag]
    updateFilter('tags', newTags)
  }

  const clearFilters = () => {
    onFiltersChange({
      search: '',
      category: 'all',
      sortBy: 'recent',
      sortOrder: 'desc',
      tags: [],
    })
  }

  const hasActiveFilters = 
    filters.search || 
    filters.category !== 'all' || 
    filters.tags.length > 0

  return (
    <div className="space-y-4">
      {/* Search and quick filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome, tags ou descrição..."
            value={filters.search}
            onChange={(e) => updateFilter('search', e.target.value)}
            className="pl-9 pr-9"
          />
          {filters.search && (
            <button
              onClick={() => updateFilter('search', '')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Sort */}
        <Select
          value={filters.sortBy}
          onValueChange={(value) => updateFilter('sortBy', value as AssetFiltersState['sortBy'])}
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Ordenar por" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="recent">Mais recentes</SelectItem>
            <SelectItem value="name">Nome</SelectItem>
            <SelectItem value="size">Tamanho</SelectItem>
          </SelectContent>
        </Select>

        {/* Advanced filters button */}
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" className="gap-2">
              <SlidersHorizontal className="h-4 w-4" />
              Filtros
              {hasActiveFilters && (
                <Badge variant="secondary" className="ml-1 h-5 w-5 rounded-full p-0 text-xs">
                  {(filters.category !== 'all' ? 1 : 0) + filters.tags.length}
                </Badge>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent className="w-80">
            <SheetHeader>
              <SheetTitle className="flex items-center justify-between">
                Filtros
                {hasActiveFilters && (
                  <Button variant="ghost" size="sm" onClick={clearFilters}>
                    Limpar
                  </Button>
                )}
              </SheetTitle>
            </SheetHeader>

            <div className="mt-6 space-y-6">
              {/* Category filter */}
              <div className="space-y-3">
                <h4 className="text-sm font-medium">Categoria</h4>
                <div className="grid grid-cols-2 gap-2">
                  {categories.map((cat) => {
                    const Icon = cat.icon
                    const count = assetCounts[cat.id] || 0
                    const isActive = filters.category === cat.id
                    
                    return (
                      <button
                        key={cat.id}
                        onClick={() => updateFilter('category', cat.id)}
                        className={cn(
                          'flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors',
                          isActive 
                            ? 'border-primary bg-primary/5 text-primary' 
                            : 'hover:bg-muted'
                        )}
                      >
                        <Icon className="h-4 w-4" />
                        <span className="flex-1 text-left">{cat.label}</span>
                        {count > 0 && (
                          <span className="text-xs text-muted-foreground">
                            {count}
                          </span>
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>

              <Separator />

              {/* Tags filter */}
              {availableTags.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-sm font-medium">Tags</h4>
                  <div className="flex flex-wrap gap-2">
                    {availableTags.map((tag) => (
                      <Badge
                        key={tag}
                        variant={filters.tags.includes(tag) ? 'default' : 'outline'}
                        className="cursor-pointer"
                        onClick={() => toggleTag(tag)}
                      >
                        {tag}
                        {filters.tags.includes(tag) && (
                          <X className="ml-1 h-3 w-3" />
                        )}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Category tabs (desktop) */}
      <div className="hidden md:flex items-center gap-1 overflow-x-auto pb-1">
        {categories.map((cat) => {
          const Icon = cat.icon
          const count = assetCounts[cat.id] || 0
          const isActive = filters.category === cat.id
          
          return (
            <button
              key={cat.id}
              onClick={() => updateFilter('category', cat.id)}
              className={cn(
                'flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors whitespace-nowrap',
                isActive 
                  ? 'bg-foreground text-background' 
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              <Icon className="h-4 w-4" />
              {cat.label}
              {count > 0 && (
                <span className={cn(
                  'rounded-full px-2 py-0.5 text-xs',
                  isActive ? 'bg-background/20' : 'bg-muted'
                )}>
                  {count}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Active filters display */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-muted-foreground">Filtros ativos:</span>
          
          {filters.category !== 'all' && (
            <Badge variant="secondary" className="gap-1">
              {categories.find(c => c.id === filters.category)?.label}
              <button onClick={() => updateFilter('category', 'all')}>
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          
          {filters.tags.map((tag) => (
            <Badge key={tag} variant="secondary" className="gap-1">
              {tag}
              <button onClick={() => toggleTag(tag)}>
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
          
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            Limpar todos
          </Button>
        </div>
      )}
    </div>
  )
}
