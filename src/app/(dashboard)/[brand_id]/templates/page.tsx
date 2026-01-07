'use client'

import { useState, useMemo, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ChevronLeft, ChevronRight, Clock, Plus, Figma, FolderPlus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import { TEMPLATE_FOLDERS, type TemplateFolder } from '@/lib/studio/template-service'
import { templateRegistry, initializeTemplates } from '@/lib/studio/template-loader'
import { 
  CATEGORY_LABELS, 
  TEMPLATE_FORMATS,
  type Template,
} from '@/types/studio'
import { FigmaPicker, type ImportResult } from '@/components/studio/figma-picker'

// Initialize templates
initializeTemplates()

// ============================================
// SIDEBAR NAVIGATION (Folder-based)
// ============================================

interface SidebarNavProps {
  selectedTemplateId: string | null
  onSelectTemplate: (template: Template) => void
}

function SidebarNav({ selectedTemplateId, onSelectTemplate }: SidebarNavProps) {
  // Get root folders
  const rootFolders = TEMPLATE_FOLDERS.filter(f => f.parentId === null)
    .sort((a, b) => a.order - b.order)
  
  const [openFolders, setOpenFolders] = useState<string[]>(
    rootFolders.map(f => f.id)
  )
  
  const toggleFolder = (folderId: string) => {
    setOpenFolders((prev) =>
      prev.includes(folderId) ? prev.filter((id) => id !== folderId) : [...prev, folderId]
    )
  }
  
  // Get subfolders for a parent
  const getSubfolders = (parentId: string): TemplateFolder[] => {
    return TEMPLATE_FOLDERS
      .filter(f => f.parentId === parentId)
      .sort((a, b) => a.order - b.order)
  }
  
  // Get templates for a folder (by matching category to folder)
  const getTemplatesForFolder = (folderId: string): Template[] => {
    const metadata = templateRegistry.getTemplatesByFolder(folderId)
    return metadata
      .map(m => templateRegistry.getTemplate(m.id))
      .filter((t): t is Template => t !== undefined)
  }
  
  return (
    <aside className="w-56 border-r bg-background flex flex-col">
      <ScrollArea className="flex-1">
        <div className="py-6 px-4">
          {rootFolders.map((folder, idx) => {
            const subfolders = getSubfolders(folder.id)
            const hasContent = subfolders.some(sf => getTemplatesForFolder(sf.id).length > 0)
            if (!hasContent) return null
            
            return (
              <div key={folder.id} className={cn(idx > 0 && 'mt-6')}>
                <Collapsible
                  open={openFolders.includes(folder.id)}
                  onOpenChange={() => toggleFolder(folder.id)}
                >
                  <CollapsibleTrigger className="flex items-center gap-1 text-sm font-medium text-primary hover:text-primary/80 transition-colors cursor-pointer">
                    <ChevronRight
                      className={cn(
                        'h-3 w-3 transition-transform',
                        openFolders.includes(folder.id) && 'rotate-90'
                      )}
                    />
                    {folder.name}
                  </CollapsibleTrigger>
                  
                  <CollapsibleContent className="mt-2 ml-4 space-y-1">
                    {subfolders.map((subfolder) => {
                      const folderTemplates = getTemplatesForFolder(subfolder.id)
                      if (folderTemplates.length === 0) return null
                      
                      return (
                        <div key={subfolder.id} className="space-y-0.5">
                          {folderTemplates.map((template) => (
                            <button
                              key={template.id}
                              onClick={() => onSelectTemplate(template)}
                              className={cn(
                                'w-full text-left text-sm py-1.5 px-2 rounded-sm transition-colors',
                                selectedTemplateId === template.id
                                  ? 'text-primary font-medium bg-muted'
                                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                              )}
                            >
                              {template.name}
                            </button>
                          ))}
                        </div>
                      )
                    })}
                  </CollapsibleContent>
                </Collapsible>
              </div>
            )
          })}
        </div>
      </ScrollArea>
    </aside>
  )
}

// ============================================
// TEMPLATE PREVIEW
// ============================================

interface TemplatePreviewProps {
  template: Template
  templates: Template[]
  currentIndex: number
  onUseTemplate: () => void
  onNavigate: (direction: 'prev' | 'next') => void
}

function TemplatePreview({ 
  template, 
  templates,
  currentIndex,
  onUseTemplate, 
  onNavigate 
}: TemplatePreviewProps) {
  const formatInfo = TEMPLATE_FORMATS[template.format]
  const categoryLabel = CATEGORY_LABELS[template.category]
  
  // Calculate aspect ratio for preview
  const aspectRatio = formatInfo.width / formatInfo.height
  const isWide = aspectRatio > 1.2
  const isTall = aspectRatio < 0.8
  
  // Get prev/next template info
  const prevTemplate = currentIndex > 0 ? templates[currentIndex - 1] : null
  const nextTemplate = currentIndex < templates.length - 1 ? templates[currentIndex + 1] : null
  const prevCategory = prevTemplate ? CATEGORY_LABELS[prevTemplate.category] : null
  const nextCategory = nextTemplate ? CATEGORY_LABELS[nextTemplate.category] : null
  
  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Main Content */}
      <div className="flex-1 p-12 max-w-5xl mx-auto w-full">
        {/* Title */}
        <h1 className="text-3xl md:text-4xl font-medium tracking-tight text-foreground mb-12">
          {template.name}
        </h1>
        
        {/* Main content area */}
        <div className="flex gap-12 items-start">
          {/* Template Preview */}
          <div className="flex-1">
            <div 
              className={cn(
                'relative bg-muted/30 border border-dashed border-border/50 rounded-sm flex items-center justify-center overflow-hidden',
                isWide ? 'aspect-video' : isTall ? 'aspect-[3/4]' : 'aspect-square'
              )}
              style={{ maxHeight: '500px' }}
            >
              {/* Placeholder for template preview */}
              <div 
                className="bg-[#f5f0eb] flex items-center justify-center shadow-sm"
                style={{
                  width: isWide ? '90%' : isTall ? '60%' : '75%',
                  aspectRatio: `${formatInfo.width} / ${formatInfo.height}`,
                  maxHeight: '90%',
                }}
              >
                <span className="text-2xl font-medium text-muted-foreground/40">
                  EQI
                </span>
              </div>
            </div>
          </div>
          
          {/* Info Panel */}
          <div className="w-64 shrink-0 space-y-6">
            <div>
              <h2 className="text-xl font-medium text-foreground">
                {template.name}
              </h2>
              {template.description && (
                <p className="text-sm text-muted-foreground mt-2">
                  {template.description}
                </p>
              )}
            </div>
            
            <Button 
              onClick={onUseTemplate}
              className="w-full"
            >
              Use this Template
            </Button>
            
            <Separator />
            
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Category</span>
                <span className="text-foreground">{categoryLabel}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Size</span>
                <span className="text-foreground">
                  {formatInfo.width} × {formatInfo.height}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Format</span>
                <span className="text-foreground">{formatInfo.name}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Fixed Footer Navigation */}
      <div className="border-t bg-background px-12 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          {/* Previous */}
          <button
            onClick={() => prevTemplate && onNavigate('prev')}
            disabled={!prevTemplate}
            className={cn(
              'flex items-center gap-3 text-left transition-opacity',
              prevTemplate ? 'opacity-100 hover:opacity-70 cursor-pointer' : 'opacity-30 cursor-not-allowed'
            )}
          >
            <ChevronLeft className="h-5 w-5 text-muted-foreground" />
            <div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                {prevCategory || ''}
              </div>
              <div className="text-sm font-medium text-foreground">
                {prevTemplate?.name || ''}
              </div>
            </div>
          </button>
          
          {/* Last modified */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            <span>Last modified on {new Date(template.updatedAt).toLocaleDateString('en-US', {
              weekday: 'short',
              day: '2-digit',
              month: 'short',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}</span>
          </div>
          
          {/* Next */}
          <button
            onClick={() => nextTemplate && onNavigate('next')}
            disabled={!nextTemplate}
            className={cn(
              'flex items-center gap-3 text-right transition-opacity',
              nextTemplate ? 'opacity-100 hover:opacity-70 cursor-pointer' : 'opacity-30 cursor-not-allowed'
            )}
          >
            <div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                {nextCategory || ''}
              </div>
              <div className="text-sm font-medium text-foreground">
                {nextTemplate?.name || ''}
              </div>
            </div>
            <ChevronRight className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>
      </div>
    </div>
  )
}

// ============================================
// EMPTY STATE
// ============================================

function EmptyState() {
  return (
    <div className="flex-1 flex items-center justify-center">
      <div className="text-center max-w-md">
        <h2 className="text-2xl font-medium text-muted-foreground mb-2">
          Select a template
        </h2>
        <p className="text-sm text-muted-foreground">
          Choose a template from the sidebar to preview and use it.
        </p>
      </div>
    </div>
  )
}

// ============================================
// MAIN PAGE
// ============================================

export default function TemplatesPage() {
  const params = useParams()
  const router = useRouter()
  const brandId = params.brand_id as string
  
  // FigmaPicker state
  const [figmaPickerOpen, setFigmaPickerOpen] = useState(false)
  
  // Get all templates from registry
  const templates = useMemo(() => {
    const allMeta = templateRegistry.getAllTemplates()
    return allMeta
      .map(m => templateRegistry.getTemplate(m.id))
      .filter((t): t is Template => t !== undefined)
  }, [])
  
  const [selectedIndex, setSelectedIndex] = useState(0)
  const selectedTemplate = templates[selectedIndex] || null
  
  const handleSelectTemplate = (template: Template) => {
    const index = templates.findIndex((t: Template) => t.id === template.id)
    if (index >= 0) setSelectedIndex(index)
  }
  
  const handleNavigate = (direction: 'prev' | 'next') => {
    if (direction === 'prev' && selectedIndex > 0) {
      setSelectedIndex(selectedIndex - 1)
    } else if (direction === 'next' && selectedIndex < templates.length - 1) {
      setSelectedIndex(selectedIndex + 1)
    }
  }
  
  const handleUseTemplate = () => {
    if (selectedTemplate) {
      router.push(`/${brandId}/templates/editor/${selectedTemplate.id}`)
    }
  }
  
  const handleFigmaImportComplete = useCallback((results: ImportResult[]) => {
    // Pegar o primeiro template importado com sucesso
    const firstSuccess = results.find(r => r.success)
    if (firstSuccess) {
      // Redirecionar para o novo template no editor
      router.push(`/${brandId}/templates/editor/${firstSuccess.templateId}`)
    }
  }, [brandId, router])
  
  return (
    <div className="flex h-[calc(100vh-4rem)] bg-background">
      {/* Sidebar */}
      <SidebarNav
        selectedTemplateId={selectedTemplate?.id || null}
        onSelectTemplate={handleSelectTemplate}
      />
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header with New button */}
        <div className="flex items-center justify-end p-4 border-b">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button className="gap-2">
                <Plus className="size-4" />
                New
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64">
              <DropdownMenuItem onClick={() => console.log('New folder')}>
                <FolderPlus className="size-4 mr-3 text-muted-foreground" />
                <div>
                  <div className="font-medium">Folder</div>
                  <div className="text-xs text-muted-foreground">Create a new folder</div>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFigmaPickerOpen(true)}>
                <Figma className="size-4 mr-3 text-muted-foreground" />
                <div>
                  <div className="font-medium">Figma</div>
                  <div className="text-xs text-muted-foreground">Import from Figma designs</div>
                </div>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        
        {/* Template Preview */}
        {selectedTemplate ? (
          <TemplatePreview
            template={selectedTemplate}
            templates={templates}
            currentIndex={selectedIndex}
            onUseTemplate={handleUseTemplate}
            onNavigate={handleNavigate}
          />
        ) : (
          <EmptyState />
        )}
      </div>
      
      {/* FigmaPicker Dialog */}
      <FigmaPicker
        open={figmaPickerOpen}
        onOpenChange={setFigmaPickerOpen}
        brandId={brandId}
        onImportComplete={handleFigmaImportComplete}
        context="library"
      />
    </div>
  )
}
