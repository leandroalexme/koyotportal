'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Asset } from '@/types'

interface UseAssetsOptions {
  tags?: string[]
  type?: string
  limit?: number
}

export function useAssets(brandId: string, options: UseAssetsOptions = {}) {
  const [assets, setAssets] = useState<Asset[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const supabase = createClient()

  const fetchAssets = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    let query = supabase
      .from('assets')
      .select('*')
      .eq('brand_id', brandId)
      .eq('is_archived', false)
      .order('created_at', { ascending: false })

    if (options.type) {
      query = query.eq('file_type', options.type)
    }

    if (options.tags && options.tags.length > 0) {
      query = query.overlaps('tags', options.tags)
    }

    if (options.limit) {
      query = query.limit(options.limit)
    }

    const { data, error: fetchError } = await query

    if (fetchError) {
      setError(fetchError.message)
      setAssets([])
    } else {
      setAssets(data || [])
    }

    setIsLoading(false)
  }, [brandId, options.type, options.tags, options.limit, supabase])

  const uploadAsset = useCallback(async (
    file: File,
    metadata?: Partial<Asset>
  ) => {
    const fileExt = file.name.split('.').pop()
    const fileName = `${brandId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`

    const { error: uploadError } = await supabase.storage
      .from('brand-assets')
      .upload(fileName, file)

    if (uploadError) {
      setError(uploadError.message)
      return null
    }

    const { data: { publicUrl } } = supabase.storage
      .from('brand-assets')
      .getPublicUrl(fileName)

    const { data, error: insertError } = await supabase
      .from('assets')
      .insert({
        brand_id: brandId,
        name: file.name,
        file_path: fileName,
        file_type: file.type.split('/')[0],
        file_size: file.size,
        mime_type: file.type,
        uploaded_by: (await supabase.auth.getUser()).data.user?.id,
        ...metadata,
      })
      .select()
      .single()

    if (insertError) {
      setError(insertError.message)
      return null
    }

    setAssets((prev) => [data, ...prev])
    return { ...data, publicUrl }
  }, [brandId, supabase])

  const updateAsset = useCallback(async (
    assetId: string,
    updates: Partial<Asset>
  ) => {
    const { data, error: updateError } = await supabase
      .from('assets')
      .update(updates)
      .eq('id', assetId)
      .select()
      .single()

    if (updateError) {
      setError(updateError.message)
      return null
    }

    setAssets((prev) =>
      prev.map((a) => (a.id === assetId ? data : a))
    )
    return data
  }, [supabase])

  const deleteAsset = useCallback(async (assetId: string) => {
    const asset = assets.find((a) => a.id === assetId)
    if (!asset) return false

    const { error: storageError } = await supabase.storage
      .from('brand-assets')
      .remove([asset.file_path])

    if (storageError) {
      setError(storageError.message)
      return false
    }

    const { error: deleteError } = await supabase
      .from('assets')
      .delete()
      .eq('id', assetId)

    if (deleteError) {
      setError(deleteError.message)
      return false
    }

    setAssets((prev) => prev.filter((a) => a.id !== assetId))
    return true
  }, [assets, supabase])

  const searchAssets = useCallback(async (query: string) => {
    const { data, error: searchError } = await supabase
      .from('assets')
      .select('*')
      .eq('brand_id', brandId)
      .eq('is_archived', false)
      .or(`name.ilike.%${query}%,ai_description.ilike.%${query}%`)
      .order('created_at', { ascending: false })

    if (searchError) {
      setError(searchError.message)
      return []
    }

    return data || []
  }, [brandId, supabase])

  useEffect(() => {
    if (brandId) {
      fetchAssets()
    }
  }, [brandId, fetchAssets])

  return {
    assets,
    isLoading,
    error,
    refetch: fetchAssets,
    uploadAsset,
    updateAsset,
    deleteAsset,
    searchAssets,
  }
}
