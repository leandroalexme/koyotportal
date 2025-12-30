'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Brand } from '@/types'

export function useBrand(brandId: string) {
  const [brand, setBrand] = useState<Brand | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const supabase = createClient()

  const fetchBrand = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    const { data, error: fetchError } = await supabase
      .from('brands')
      .select('*')
      .eq('id', brandId)
      .single()

    if (fetchError) {
      setError(fetchError.message)
      setBrand(null)
    } else {
      setBrand(data)
    }

    setIsLoading(false)
  }, [brandId, supabase])

  const updateBrand = useCallback(async (updates: Partial<Brand>) => {
    const { data, error: updateError } = await supabase
      .from('brands')
      .update(updates)
      .eq('id', brandId)
      .select()
      .single()

    if (updateError) {
      setError(updateError.message)
      return null
    }

    setBrand(data)
    return data
  }, [brandId, supabase])

  useEffect(() => {
    if (brandId) {
      fetchBrand()
    }
  }, [brandId, fetchBrand])

  return {
    brand,
    isLoading,
    error,
    refetch: fetchBrand,
    updateBrand,
  }
}

export function useBrands() {
  const [brands, setBrands] = useState<Brand[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const supabase = createClient()

  const fetchBrands = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    const { data, error: fetchError } = await supabase
      .from('brands')
      .select('*')
      .order('created_at', { ascending: false })

    if (fetchError) {
      setError(fetchError.message)
      setBrands([])
    } else {
      setBrands(data || [])
    }

    setIsLoading(false)
  }, [supabase])

  const createBrand = useCallback(async (brand: Partial<Brand>) => {
    const { data, error: createError } = await supabase
      .from('brands')
      .insert(brand)
      .select()
      .single()

    if (createError) {
      setError(createError.message)
      return null
    }

    setBrands((prev) => [data, ...prev])
    return data
  }, [supabase])

  useEffect(() => {
    fetchBrands()
  }, [fetchBrands])

  return {
    brands,
    isLoading,
    error,
    refetch: fetchBrands,
    createBrand,
  }
}
