'use client'

/**
 * MockupShowcase
 * 
 * Componente para exibir uma galeria de mockups com um template aplicado.
 * Usado na página de Visual Identity para mostrar a marca em ação.
 */

import { useState, useMemo } from 'react'
import { cn } from '@/lib/utils'
import { MockupViewer } from './mockup-viewer'
import {
  mockupPresets,
  type MockupDefinition,
  type TemplateSnapshot,
  type MockupCategory,
} from '@/lib/studio/mockups'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  CreditCard, 
  Smartphone, 
  Image as ImageIcon,
  Package,
  Share2,
  Grid3X3,
} from 'lucide-react'

interface MockupShowcaseProps {
  /** Snapshot do template a ser aplicado em todos os mockups */
  templateSnapshot?: TemplateSnapshot
  /** Filtrar por categorias específicas */
  categories?: MockupCategory[]
  /** Classe CSS adicional */
  className?: string
  /** Título da seção */
  title?: string
  /** Descrição da seção */
  description?: string
  /** Callback quando um mockup é selecionado */
  onMockupSelect?: (mockup: MockupDefinition) => void
  /** Callback para download */
  onDownload?: (blob: Blob, mockup: MockupDefinition) => void
}

const categoryConfig: Record<MockupCategory, { icon: React.ElementType; label: string }> = {
  'business-card': { icon: CreditCard, label: 'Cartões' },
  'stationery': { icon: Grid3X3, label: 'Papelaria' },
  'billboard': { icon: ImageIcon, label: 'Outdoors' },
  'poster': { icon: ImageIcon, label: 'Posters' },
  'device': { icon: Smartphone, label: 'Dispositivos' },
  'apparel': { icon: Package, label: 'Vestuário' },
  'packaging': { icon: Package, label: 'Embalagens' },
  'social-media': { icon: Share2, label: 'Social' },
}

export function MockupShowcase({
  templateSnapshot,
  categories,
  className,
  title = 'Brand in Action',
  description = 'Veja como sua marca aparece em diferentes contextos',
  onMockupSelect,
  onDownload,
}: MockupShowcaseProps) {
  const [selectedCategory, setSelectedCategory] = useState<MockupCategory | 'all'>('all')
  // Selecionar primeiro mockup por padrão usando initializer
  const [selectedMockup, setSelectedMockup] = useState<MockupDefinition | null>(() => {
    const filtered = categories && categories.length > 0
      ? mockupPresets.filter((m: MockupDefinition) => categories.includes(m.category))
      : mockupPresets
    return filtered[0] ?? null
  })
  
  // Filtrar mockups disponíveis
  const availableMockups = useMemo(() => {
    let mockups = mockupPresets
    
    // Filtrar por categorias permitidas
    if (categories && categories.length > 0) {
      mockups = mockups.filter((m: MockupDefinition) => categories.includes(m.category))
    }
    
    // Filtrar por categoria selecionada
    if (selectedCategory !== 'all') {
      mockups = mockups.filter((m: MockupDefinition) => m.category === selectedCategory)
    }
    
    return mockups
  }, [categories, selectedCategory])
  
  // Categorias únicas disponíveis
  const uniqueCategories = useMemo(() => {
    const cats = new Set(mockupPresets.map((m: MockupDefinition) => m.category))
    if (categories) {
      return categories.filter((c: MockupCategory) => cats.has(c))
    }
    return Array.from(cats) as MockupCategory[]
  }, [categories])
  
  // Criar snapshots map para o viewer
  const snapshotsMap = useMemo(() => {
    const map = new Map<number, TemplateSnapshot>()
    if (templateSnapshot) {
      map.set(0, templateSnapshot)
    }
    return map
  }, [templateSnapshot])
  
  const handleMockupClick = (mockup: MockupDefinition) => {
    setSelectedMockup(mockup)
    onMockupSelect?.(mockup)
  }
  
  const handleDownload = (blob: Blob) => {
    if (selectedMockup) {
      onDownload?.(blob, selectedMockup)
    }
  }
  
  return (
    <section className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-xl font-semibold">{title}</h2>
          {description && (
            <p className="mt-1 text-sm text-muted-foreground">{description}</p>
          )}
        </div>
      </div>
      
      {/* Filtros de categoria */}
      {uniqueCategories.length > 1 && (
        <Tabs
          value={selectedCategory}
          onValueChange={(v) => setSelectedCategory(v as MockupCategory | 'all')}
        >
          <TabsList className="h-auto flex-wrap gap-1 bg-transparent p-0">
            <TabsTrigger
              value="all"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              Todos
            </TabsTrigger>
            {uniqueCategories.map((cat: MockupCategory) => {
              const config = categoryConfig[cat]
              const Icon = config.icon
              return (
                <TabsTrigger
                  key={cat}
                  value={cat}
                  className="gap-1.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                >
                  <Icon className="h-3.5 w-3.5" />
                  {config.label}
                </TabsTrigger>
              )
            })}
          </TabsList>
        </Tabs>
      )}
      
      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        {/* Viewer principal */}
        <div className="min-h-[400px] lg:min-h-[500px]">
          {selectedMockup ? (
            <MockupViewer
              definition={selectedMockup}
              templateSnapshots={snapshotsMap}
              showControls={true}
              interactive={true}
              onDownload={onDownload ? handleDownload : undefined}
              className="h-full"
            />
          ) : (
            <div className="flex h-full items-center justify-center rounded-lg border border-dashed bg-muted/50">
              <p className="text-sm text-muted-foreground">
                Selecione um mockup para visualizar
              </p>
            </div>
          )}
        </div>
        
        {/* Lista de mockups */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground">
            Mockups Disponíveis
          </h3>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
            {availableMockups.map((mockup: MockupDefinition) => {
              const isSelected = selectedMockup?.id === mockup.id
              const config = categoryConfig[mockup.category]
              const Icon = config.icon
              
              return (
                <button
                  key={mockup.id}
                  onClick={() => handleMockupClick(mockup)}
                  className={cn(
                    'flex items-start gap-3 rounded-lg border p-3 text-left transition-colors',
                    isSelected
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50 hover:bg-muted/50'
                  )}
                >
                  <div className={cn(
                    'flex h-10 w-10 shrink-0 items-center justify-center rounded-md',
                    isSelected ? 'bg-primary text-primary-foreground' : 'bg-muted'
                  )}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{mockup.name}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {mockup.description}
                    </p>
                    <Badge variant="secondary" className="mt-1.5 text-xs">
                      {config.label}
                    </Badge>
                  </div>
                </button>
              )
            })}
          </div>
          
          {availableMockups.length === 0 && (
            <div className="rounded-lg border border-dashed p-6 text-center">
              <p className="text-sm text-muted-foreground">
                Nenhum mockup disponível para esta categoria
              </p>
            </div>
          )}
        </div>
      </div>
      
      {/* Info do mockup selecionado */}
      {selectedMockup && (
        <div className="flex items-center justify-between rounded-lg bg-muted/50 px-4 py-3">
          <div className="flex items-center gap-3">
            <div>
              <p className="text-sm font-medium">{selectedMockup.name}</p>
              <p className="text-xs text-muted-foreground">
                {selectedMockup.canvasSize.width} × {selectedMockup.canvasSize.height}px
              </p>
            </div>
          </div>
          {selectedMockup.tags && selectedMockup.tags.length > 0 && (
            <div className="flex gap-1">
              {selectedMockup.tags.slice(0, 3).map((tag) => (
                <Badge key={tag} variant="outline" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  )
}
