'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Page } from '@/types'

export function usePages(brandId: string) {
  const [pages, setPages] = useState<Page[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const supabase = createClient()

  const fetchPages = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    const { data, error: fetchError } = await supabase
      .from('pages')
      .select('*')
      .eq('brand_id', brandId)
      .order('order_index', { ascending: true })

    if (fetchError) {
      setError(fetchError.message)
      setPages([])
    } else {
      setPages(data || [])
    }

    setIsLoading(false)
  }, [brandId, supabase])

  const createPage = useCallback(async (page: Partial<Page>) => {
    const maxOrder = pages.length > 0
      ? Math.max(...pages.map((p) => p.order_index))
      : -1

    const { data, error: createError } = await supabase
      .from('pages')
      .insert({
        brand_id: brandId,
        order_index: maxOrder + 1,
        ...page,
      })
      .select()
      .single()

    if (createError) {
      setError(createError.message)
      return null
    }

    setPages((prev) => [...prev, data])
    return data
  }, [brandId, pages, supabase])

  const updatePage = useCallback(async (
    pageId: string,
    updates: Partial<Page>
  ) => {
    const { data, error: updateError } = await supabase
      .from('pages')
      .update(updates)
      .eq('id', pageId)
      .select()
      .single()

    if (updateError) {
      setError(updateError.message)
      return null
    }

    setPages((prev) =>
      prev.map((p) => (p.id === pageId ? data : p))
    )
    return data
  }, [supabase])

  const deletePage = useCallback(async (pageId: string) => {
    const { error: deleteError } = await supabase
      .from('pages')
      .delete()
      .eq('id', pageId)

    if (deleteError) {
      setError(deleteError.message)
      return false
    }

    setPages((prev) => prev.filter((p) => p.id !== pageId))
    return true
  }, [supabase])

  useEffect(() => {
    if (brandId) {
      fetchPages()
    }
  }, [brandId, fetchPages])

  return {
    pages,
    isLoading,
    error,
    refetch: fetchPages,
    createPage,
    updatePage,
    deletePage,
  }
}

export function usePage(pageId: string) {
  const [page, setPage] = useState<Page | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const supabase = createClient()

  const fetchPage = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    const { data, error: fetchError } = await supabase
      .from('pages')
      .select('*')
      .eq('id', pageId)
      .single()

    if (fetchError) {
      setError(fetchError.message)
      setPage(null)
    } else {
      setPage(data)
    }

    setIsLoading(false)
  }, [pageId, supabase])

  useEffect(() => {
    if (pageId) {
      fetchPage()
    }
  }, [pageId, fetchPage])

  return {
    page,
    isLoading,
    error,
    refetch: fetchPage,
  }
}
