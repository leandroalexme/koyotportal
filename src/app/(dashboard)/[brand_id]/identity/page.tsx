'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { BlockList } from '@/components/brand/blocks'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { useEditorStore } from '@/store/editor-store'
import { createClient } from '@/lib/supabase/client'
import type { Block, Brand } from '@/types'
import { Sparkles } from 'lucide-react'

export default function IdentityPage() {
  const params = useParams()
  const brandId = params.brand_id as string
  const { mode } = useEditorStore()
  
  const [brand, setBrand] = useState<Brand | null>(null)
  const [blocks, setBlocks] = useState<Block[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadData() {
      const supabase = createClient()

      // Fetch brand
      const { data: brandData, error: brandError } = await supabase
        .from('brands')
        .select('*')
        .eq('id', brandId)
        .single()

      if (brandError) {
        setError('Marca não encontrada')
        setLoading(false)
        return
      }

      setBrand(brandData as Brand)

      // Fetch identity page
      const { data: pageData } = await supabase
        .from('pages')
        .select('id')
        .eq('brand_id', brandId)
        .eq('slug', 'identity')
        .single()

      if (pageData) {
        // Fetch blocks for the identity page
        const { data: blocksData } = await supabase
          .from('blocks')
          .select('*')
          .eq('page_id', pageData.id)
          .eq('is_visible', true)
          .order('order_index', { ascending: true })

        if (blocksData) {
          setBlocks(blocksData as Block[])
        }
      }

      setLoading(false)
    }

    if (brandId) {
      loadData()
    }
  }, [brandId])

  if (loading) {
    return (
      <div className="container mx-auto px-6 py-12">
        <Skeleton className="h-10 w-64 mb-4" />
        <Skeleton className="h-5 w-96 mb-8" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-12">
          <Skeleton className="aspect-video" />
          <Skeleton className="aspect-video" />
          <Skeleton className="aspect-video" />
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (error || !brand) {
    return (
      <div className="container mx-auto px-6 py-12">
        <div className="text-center py-12">
          <p className="text-muted-foreground">{error || 'Erro ao carregar marca'}</p>
        </div>
      </div>
    )
  }

  const logoConceptData = brand.settings as { logo_concept?: string } | null

  return (
    <div className="container mx-auto px-6 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Identidade Visual</h1>
        <p className="mt-2 text-muted-foreground">
          A fundação visual da marca {brand.name}
        </p>
      </div>

      {/* Logo Section */}
      <section id="logo" className="mb-12">
        <h2 className="mb-6 text-xl font-semibold">Logo</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="flex aspect-video items-center justify-center rounded-lg border bg-muted">
            <span className="text-4xl font-bold tracking-tighter">{brand.name}</span>
          </div>
          <div className="flex aspect-video items-center justify-center rounded-lg border bg-foreground">
            <span className="text-4xl font-bold tracking-tighter text-background">
              {brand.name}
            </span>
          </div>
          <div className="flex aspect-video items-center justify-center rounded-lg border">
            <span className="text-4xl font-bold tracking-tighter">
              {brand.name.charAt(0)}
            </span>
          </div>
        </div>
        
        {/* Logo Concept from AI */}
        {logoConceptData?.logo_concept && (
          <div className="mt-6 p-4 rounded-lg border bg-muted/50">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Conceito do Logo (IA)</span>
            </div>
            <p className="text-sm text-muted-foreground">
              {logoConceptData.logo_concept}
            </p>
          </div>
        )}
      </section>

      {/* Mission & Vision */}
      {(brand.mission || brand.vision) && (
        <>
          <section className="mb-12">
            <h2 className="mb-6 text-xl font-semibold">Propósito</h2>
            <div className="grid gap-6 md:grid-cols-2">
              {brand.mission && (
                <div className="p-6 rounded-lg border">
                  <h3 className="font-medium mb-2">Missão</h3>
                  <p className="text-muted-foreground">{brand.mission}</p>
                </div>
              )}
              {brand.vision && (
                <div className="p-6 rounded-lg border">
                  <h3 className="font-medium mb-2">Visão</h3>
                  <p className="text-muted-foreground">{brand.vision}</p>
                </div>
              )}
            </div>
          </section>
          <Separator className="my-12" />
        </>
      )}

      {/* Dynamic Blocks */}
      {blocks.length > 0 ? (
        <BlockList blocks={blocks} isEditing={mode === 'edit'} />
      ) : (
        <div className="text-center py-12 border rounded-lg bg-muted/30">
          <p className="text-muted-foreground">
            Nenhum bloco de identidade visual encontrado.
          </p>
        </div>
      )}
    </div>
  )
}
