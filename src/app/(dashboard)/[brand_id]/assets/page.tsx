'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useParams } from 'next/navigation'
import { Upload, Grid, List, Plus, FolderOpen, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { AssetCard, AssetUpload, AssetPreview, AssetFilters, type AssetFiltersState } from '@/components/dam'
import { getAssets, deleteAsset, archiveAsset, getAsset, type Asset } from '@/services/dam-service'
import { cn } from '@/lib/utils'

export default function AssetsPage() {
  const params = useParams()
  const brandId = params.brand_id as string

  const [assets, setAssets] = useState<Asset[]>([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false)
  const [previewAsset, setPreviewAsset] = useState<Asset | null>(null)
  const [selectedAssets, setSelectedAssets] = useState<Set<string>>(new Set())
  const [analyzingAssets, setAnalyzingAssets] = useState<Set<string>>(new Set())
  
  const [filters, setFilters] = useState<AssetFiltersState>({
    search: '',
    category: 'all',
    sortBy: 'recent',
    sortOrder: 'desc',
    tags: [],
  })

  const loadAssets = useCallback(async () => {
    if (!brandId) return
    
    setLoading(true)
    try {
      const data = await getAssets(brandId, {
        category: filters.category !== 'all' ? filters.category : undefined,
        search: filters.search || undefined,
        tags: filters.tags.length > 0 ? filters.tags : undefined,
      })
      setAssets(data)
    } catch (error) {
      console.error('Error loading assets:', error)
    } finally {
      setLoading(false)
    }
  }, [brandId, filters.category, filters.search, filters.tags])

  useEffect(() => {
    loadAssets()
  }, [loadAssets])

  // Calculate asset counts by category
  const assetCounts = useMemo(() => {
    const counts: Record<string, number> = { all: assets.length }
    assets.forEach(asset => {
      const cat = asset.file_type || 'other'
      counts[cat] = (counts[cat] || 0) + 1
    })
    return counts
  }, [assets])

  // Get unique tags from all assets
  const availableTags = useMemo(() => {
    const tagSet = new Set<string>()
    assets.forEach(asset => {
      asset.ai_tags?.forEach(tag => tagSet.add(tag))
      asset.tags?.forEach(tag => tagSet.add(tag))
    })
    return Array.from(tagSet).slice(0, 20)
  }, [assets])

  // Sort and filter assets
  const filteredAssets = useMemo(() => {
    const result = [...assets]
    
    // Sort
    result.sort((a, b) => {
      switch (filters.sortBy) {
        case 'name':
          return filters.sortOrder === 'asc' 
            ? a.name.localeCompare(b.name)
            : b.name.localeCompare(a.name)
        case 'size':
          return filters.sortOrder === 'asc'
            ? a.file_size - b.file_size
            : b.file_size - a.file_size
        case 'recent':
        default:
          return filters.sortOrder === 'asc'
            ? new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
            : new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      }
    })
    
    return result
  }, [assets, filters.sortBy, filters.sortOrder])

  const handleUploadComplete = () => {
    loadAssets()
  }

  const handleDelete = async (asset: Asset) => {
    if (!confirm(`Excluir "${asset.name}"?`)) return
    
    try {
      await deleteAsset(asset.id)
      setAssets(prev => prev.filter(a => a.id !== asset.id))
      setPreviewAsset(null)
    } catch (error) {
      console.error('Error deleting asset:', error)
    }
  }

  const handleArchive = async (asset: Asset) => {
    try {
      await archiveAsset(asset.id)
      setAssets(prev => prev.filter(a => a.id !== asset.id))
    } catch (error) {
      console.error('Error archiving asset:', error)
    }
  }

  const handleDownload = (asset: Asset) => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const url = `${supabaseUrl}/storage/v1/object/public/brand-assets/${asset.file_path}`
    const link = document.createElement('a')
    link.href = url
    link.download = asset.name
    link.click()
  }

  const handleCopyUrl = (asset: Asset) => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const url = `${supabaseUrl}/storage/v1/object/public/brand-assets/${asset.file_path}`
    navigator.clipboard.writeText(url)
  }

  const toggleAssetSelection = (asset: Asset) => {
    setSelectedAssets(prev => {
      const next = new Set(prev)
      if (next.has(asset.id)) {
        next.delete(asset.id)
      } else {
        next.add(asset.id)
      }
      return next
    })
  }

  const handleReanalyze = async (asset: Asset) => {
    if (analyzingAssets.has(asset.id)) return

    setAnalyzingAssets(prev => new Set(prev).add(asset.id))

    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      const url = `${supabaseUrl}/storage/v1/object/public/brand-assets/${asset.file_path}`

      const response = await fetch('/api/assets/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assetId: asset.id,
          url,
        }),
      })

      if (!response.ok) {
        throw new Error('Falha na análise')
      }

      // Reload the updated asset
      const updatedAsset = await getAsset(asset.id)
      if (updatedAsset) {
        setAssets(prev => prev.map(a => a.id === asset.id ? updatedAsset : a))
      }
    } catch (error) {
      console.error('Error analyzing asset:', error)
    } finally {
      setAnalyzingAssets(prev => {
        const next = new Set(prev)
        next.delete(asset.id)
        return next
      })
    }
  }

  return (
    <div className="container mx-auto px-6 py-8">
      {/* Header */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Brand Assets</h1>
          <p className="mt-1 text-muted-foreground">
            Biblioteca digital centralizada da sua marca
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="flex rounded-lg border bg-muted p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={cn(
                'rounded-md p-2 transition-colors',
                viewMode === 'grid' ? 'bg-background shadow-sm' : 'hover:bg-background/50'
              )}
            >
              <Grid className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={cn(
                'rounded-md p-2 transition-colors',
                viewMode === 'list' ? 'bg-background shadow-sm' : 'hover:bg-background/50'
              )}
            >
              <List className="h-4 w-4" />
            </button>
          </div>

          {/* Upload button */}
          <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Upload className="h-4 w-4" />
                Upload
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-xl">
              <DialogHeader>
                <DialogTitle>Upload de Assets</DialogTitle>
              </DialogHeader>
              <AssetUpload
                brandId={brandId}
                onUploadComplete={handleUploadComplete}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filters */}
      <AssetFilters
        filters={filters}
        onFiltersChange={setFilters}
        availableTags={availableTags}
        assetCounts={assetCounts}
      />

      {/* Content */}
      <div className="mt-6">
        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : filteredAssets.length === 0 ? (
          <div className="flex h-64 flex-col items-center justify-center rounded-lg border border-dashed">
            <FolderOpen className="h-12 w-12 text-muted-foreground/50" />
            <p className="mt-4 text-lg font-medium">Nenhum asset encontrado</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {filters.search || filters.category !== 'all' || filters.tags.length > 0
                ? 'Tente ajustar os filtros'
                : 'Faça upload do primeiro asset da sua marca'}
            </p>
            <Button 
              className="mt-4 gap-2" 
              onClick={() => setUploadDialogOpen(true)}
            >
              <Plus className="h-4 w-4" />
              Adicionar Asset
            </Button>
          </div>
        ) : (
          <div className={cn(
            'grid gap-4',
            viewMode === 'grid' 
              ? 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6'
              : 'grid-cols-1'
          )}>
            {filteredAssets.map((asset) => (
              <AssetCard
                key={asset.id}
                asset={asset}
                selected={selectedAssets.has(asset.id)}
                onSelect={toggleAssetSelection}
                onPreview={setPreviewAsset}
                onDelete={handleDelete}
                onDownload={handleDownload}
                onArchive={handleArchive}
                onCopyUrl={handleCopyUrl}
                onReanalyze={handleReanalyze}
                analyzing={analyzingAssets.has(asset.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Preview modal */}
      <AssetPreview
        asset={previewAsset}
        assets={filteredAssets}
        open={!!previewAsset}
        onOpenChange={(open) => !open && setPreviewAsset(null)}
        onDelete={handleDelete}
        onDownload={handleDownload}
      />
    </div>
  )
}
