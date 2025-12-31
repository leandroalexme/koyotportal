'use client'

import { useState, useMemo } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { 
  Plus, 
  Sparkles, 
  Search, 
  LayoutGrid, 
  List,
  Filter,
  ChevronRight,
  FileImage,
  Instagram,
  Linkedin,
  Twitter,
  Facebook,
  CreditCard,
  FileText,
  Globe,
  Mail,
  MoreHorizontal,
  Copy,
  Trash2,
  Edit,
  Clock
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import { MOCK_TEMPLATES, getMockTemplatesByBrand } from '@/lib/studio/mocks'
import { 
  CATEGORY_LABELS, 
  CATEGORY_GROUPS, 
  TEMPLATE_FORMATS,
  type Template,
  type TemplateCategory 
} from '@/types/studio'

// ============================================
// CATEGORY ICONS
// ============================================

const categoryIcons: Record<string, React.ElementType> = {
  social_instagram: Instagram,
  social_linkedin: Linkedin,
  social_twitter: Twitter,
  social_facebook: Facebook,
  print_business_card: CreditCard,
  print_flyer: FileText,
  print_poster: FileImage,
  print_one_pager: FileText,
  digital_web_banner: Globe,
  digital_email_header: Mail,
  digital_newsletter: Mail,
  presentation: FileText,
  report: FileText,
  other: FileImage,
}

// ============================================
// TEMPLATE CARD COMPONENT
// ============================================

interface TemplateCardProps {
  template: Template
  onSelect: (template: Template) => void
  onEdit: (template: Template) => void
  onDuplicate: (template: Template) => void
  onDelete: (template: Template) => void
}

function TemplateCard({ template, onSelect, onEdit, onDuplicate, onDelete }: TemplateCardProps) {
  const formatInfo = TEMPLATE_FORMATS[template.format]
  const CategoryIcon = categoryIcons[template.category] || FileImage
  
  return (
    <div className="group relative bg-card border rounded-lg overflow-hidden transition-all hover:shadow-lg hover:border-foreground/20">
      {/* Preview Area */}
      <div 
        className="relative aspect-[4/3] bg-muted cursor-pointer"
        onClick={() => onSelect(template)}
      >
        {/* Placeholder preview - will be replaced with actual canvas render */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div 
            className="relative bg-background border shadow-sm"
            style={{
              width: '80%',
              aspectRatio: `${formatInfo.width} / ${formatInfo.height}`,
              maxHeight: '85%',
            }}
          >
            <div className="absolute inset-0 flex items-center justify-center text-muted-foreground/30">
              <CategoryIcon className="h-12 w-12" />
            </div>
          </div>
        </div>
        
        {/* Hover overlay */}
        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <Button variant="secondary" size="sm">
            Use this Template
          </Button>
        </div>
        
        {/* AI Badge */}
        {template.aiGenerated && (
          <Badge 
            variant="secondary" 
            className="absolute top-2 right-2 bg-background/90 backdrop-blur-sm"
          >
            <Sparkles className="h-3 w-3 mr-1" />
            AI
          </Badge>
        )}
      </div>
      
      {/* Info Area */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-medium truncate">{template.name}</h3>
            <p className="text-sm text-muted-foreground truncate">
              {formatInfo.name} • {formatInfo.width}×{formatInfo.height}
            </p>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(template)}>
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onDuplicate(template)}>
                <Copy className="h-4 w-4 mr-2" />
                Duplicate
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => onDelete(template)}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        
        {/* Tags */}
        {template.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-3">
            {template.tags.slice(0, 3).map((tag) => (
              <Badge key={tag} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
            {template.tags.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{template.tags.length - 3}
              </Badge>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// ============================================
// SIDEBAR NAVIGATION
// ============================================

interface SidebarProps {
  selectedCategory: string | null
  onSelectCategory: (category: string | null) => void
  templateCounts: Record<string, number>
}

function Sidebar({ selectedCategory, onSelectCategory, templateCounts }: SidebarProps) {
  const totalCount = Object.values(templateCounts).reduce((a, b) => a + b, 0)
  
  return (
    <aside className="w-64 border-r bg-muted/30 flex flex-col">
      <div className="p-4 border-b">
        <h2 className="font-semibold text-lg">Categories</h2>
      </div>
      
      <ScrollArea className="flex-1">
        <div className="p-2">
          {/* All Templates */}
          <button
            onClick={() => onSelectCategory(null)}
            className={cn(
              'w-full flex items-center justify-between px-3 py-2 rounded-md text-sm transition-colors',
              selectedCategory === null 
                ? 'bg-primary text-primary-foreground' 
                : 'hover:bg-muted'
            )}
          >
            <span>All Templates</span>
            <Badge variant={selectedCategory === null ? 'secondary' : 'outline'} className="ml-2">
              {totalCount}
            </Badge>
          </button>
          
          <Separator className="my-3" />
          
          {/* Category Groups */}
          {Object.entries(CATEGORY_GROUPS).map(([groupName, categories]) => (
            <div key={groupName} className="mb-4">
              <h3 className="px-3 py-1 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                {groupName}
              </h3>
              <div className="mt-1 space-y-0.5">
                {categories.map((category) => {
                  const Icon = categoryIcons[category] || FileImage
                  const count = templateCounts[category] || 0
                  
                  return (
                    <button
                      key={category}
                      onClick={() => onSelectCategory(category)}
                      className={cn(
                        'w-full flex items-center justify-between px-3 py-2 rounded-md text-sm transition-colors',
                        selectedCategory === category 
                          ? 'bg-primary text-primary-foreground' 
                          : 'hover:bg-muted'
                      )}
                    >
                      <span className="flex items-center gap-2">
                        <Icon className="h-4 w-4" />
                        {CATEGORY_LABELS[category as TemplateCategory]}
                      </span>
                      {count > 0 && (
                        <Badge 
                          variant={selectedCategory === category ? 'secondary' : 'outline'} 
                          className="ml-2"
                        >
                          {count}
                        </Badge>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </aside>
  )
}

// ============================================
// CREATE TEMPLATE DIALOG
// ============================================

function CreateTemplateDialog() {
  const [selectedFormat, setSelectedFormat] = useState<string | null>(null)
  
  const formatsByCategory = useMemo(() => {
    const grouped: Record<string, typeof TEMPLATE_FORMATS[keyof typeof TEMPLATE_FORMATS][]> = {}
    Object.values(TEMPLATE_FORMATS).forEach((format) => {
      const group = format.category
      if (!grouped[group]) grouped[group] = []
      grouped[group].push(format)
    })
    return grouped
  }, [])
  
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Create New
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create New Template</DialogTitle>
          <DialogDescription>
            Choose a format to start designing your template
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="max-h-[60vh]">
          <div className="space-y-6 pr-4">
            {Object.entries(CATEGORY_GROUPS).map(([groupName, categories]) => {
              const formats = categories.flatMap(cat => formatsByCategory[cat] || [])
              if (formats.length === 0) return null
              
              return (
                <div key={groupName}>
                  <h3 className="text-sm font-medium mb-3">{groupName}</h3>
                  <div className="grid grid-cols-3 gap-2">
                    {formats.map((format) => (
                      <button
                        key={format.format}
                        onClick={() => setSelectedFormat(format.format)}
                        className={cn(
                          'p-3 border rounded-lg text-left transition-all hover:border-foreground/30',
                          selectedFormat === format.format && 'border-primary bg-primary/5'
                        )}
                      >
                        <div className="text-sm font-medium">{format.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {format.width}×{format.height}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </ScrollArea>
        
        <div className="flex justify-between pt-4 border-t">
          <Button variant="outline" className="gap-2">
            <Sparkles className="h-4 w-4" />
            Generate with AI
          </Button>
          <Button disabled={!selectedFormat}>
            Create Template
            <ChevronRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ============================================
// MAIN PAGE COMPONENT
// ============================================

export default function TemplatesPage() {
  const params = useParams()
  const router = useRouter()
  const brandId = params.brand_id as string
  
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  
  // Get templates for this brand (using mocks for now)
  const templates = useMemo(() => {
    return getMockTemplatesByBrand(brandId).length > 0 
      ? getMockTemplatesByBrand(brandId)
      : MOCK_TEMPLATES // Fallback to all mocks for demo
  }, [brandId])
  
  // Calculate counts per category
  const templateCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    templates.forEach((t) => {
      counts[t.category] = (counts[t.category] || 0) + 1
    })
    return counts
  }, [templates])
  
  // Filter templates
  const filteredTemplates = useMemo(() => {
    return templates.filter((template) => {
      // Category filter
      if (selectedCategory && template.category !== selectedCategory) {
        return false
      }
      
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        return (
          template.name.toLowerCase().includes(query) ||
          template.description?.toLowerCase().includes(query) ||
          template.tags.some(tag => tag.toLowerCase().includes(query))
        )
      }
      
      return true
    })
  }, [templates, selectedCategory, searchQuery])
  
  // Handlers
  const handleSelectTemplate = (template: Template) => {
    router.push(`/${brandId}/templates/editor/${template.id}`)
  }
  
  const handleEditTemplate = (template: Template) => {
    router.push(`/${brandId}/templates/editor/${template.id}`)
  }
  
  const handleDuplicateTemplate = (template: Template) => {
    console.log('Duplicate template:', template.id)
    // TODO: Implement duplication
  }
  
  const handleDeleteTemplate = (template: Template) => {
    console.log('Delete template:', template.id)
    // TODO: Implement deletion with confirmation
  }
  
  return (
    <div className="flex h-[calc(100vh-4rem)]">
      {/* Sidebar */}
      <Sidebar 
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
        templateCounts={templateCounts}
      />
      
      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="border-b bg-background">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-semibold">Template Library</h1>
                <p className="text-sm text-muted-foreground mt-1">
                  Create and manage your brand templates
                </p>
              </div>
              
              <div className="flex items-center gap-3">
                <Button variant="outline" className="gap-2">
                  <Sparkles className="h-4 w-4" />
                  Create with AI
                </Button>
                <CreateTemplateDialog />
              </div>
            </div>
            
            {/* Search and filters */}
            <div className="flex items-center gap-4 mt-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search templates..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              
              <div className="flex items-center gap-1 border rounded-md p-1">
                <Button
                  variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setViewMode('grid')}
                >
                  <LayoutGrid className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setViewMode('list')}
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </header>
        
        {/* Template Grid */}
        <ScrollArea className="flex-1">
          <div className="p-6">
            {/* Category title */}
            {selectedCategory && (
              <div className="flex items-center gap-2 mb-4">
                <Badge variant="secondary" className="text-sm">
                  {CATEGORY_LABELS[selectedCategory as TemplateCategory]}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {filteredTemplates.length} template{filteredTemplates.length !== 1 ? 's' : ''}
                </span>
              </div>
            )}
            
            {filteredTemplates.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <FileImage className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <h3 className="font-medium text-lg">No templates found</h3>
                <p className="text-sm text-muted-foreground mt-1 max-w-sm">
                  {searchQuery 
                    ? `No templates match "${searchQuery}"`
                    : 'Create your first template to get started'
                  }
                </p>
                <Button className="mt-4">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Template
                </Button>
              </div>
            ) : (
              <div className={cn(
                'grid gap-6',
                viewMode === 'grid' 
                  ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
                  : 'grid-cols-1'
              )}>
                {filteredTemplates.map((template) => (
                  <TemplateCard
                    key={template.id}
                    template={template}
                    onSelect={handleSelectTemplate}
                    onEdit={handleEditTemplate}
                    onDuplicate={handleDuplicateTemplate}
                    onDelete={handleDeleteTemplate}
                  />
                ))}
              </div>
            )}
          </div>
        </ScrollArea>
      </main>
    </div>
  )
}
