'use client'

import { useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useBlocksStore } from '@/store/editor-store'
import type { Block, BlockContent, BlockType } from '@/types'

export function useBlocks(pageId: string) {
  const {
    blocks,
    isLoading,
    error,
    setBlocks,
    addBlock,
    updateBlock,
    removeBlock,
    reorderBlocks,
    setLoading,
    setError,
  } = useBlocksStore()

  const supabase = createClient()

  const fetchBlocks = useCallback(async () => {
    setLoading(true)
    setError(null)

    const { data, error: fetchError } = await supabase
      .from('blocks')
      .select('*')
      .eq('page_id', pageId)
      .order('order_index', { ascending: true })

    if (fetchError) {
      setError(fetchError.message)
      setBlocks([])
    } else {
      setBlocks(data || [])
    }

    setLoading(false)
  }, [pageId, supabase, setBlocks, setLoading, setError])

  const createBlock = useCallback(async (
    type: BlockType,
    content: BlockContent,
    title?: string
  ) => {
    const maxOrder = blocks.length > 0
      ? Math.max(...blocks.map((b) => b.order_index))
      : -1

    const { data, error: createError } = await supabase
      .from('blocks')
      .insert({
        page_id: pageId,
        type,
        content,
        title,
        order_index: maxOrder + 1,
      })
      .select()
      .single()

    if (createError) {
      setError(createError.message)
      return null
    }

    addBlock(data)
    return data
  }, [pageId, blocks, supabase, addBlock, setError])

  const saveBlock = useCallback(async (
    blockId: string,
    updates: Partial<Block>
  ) => {
    const { data, error: updateError } = await supabase
      .from('blocks')
      .update(updates)
      .eq('id', blockId)
      .select()
      .single()

    if (updateError) {
      setError(updateError.message)
      return null
    }

    updateBlock(blockId, data)
    return data
  }, [supabase, updateBlock, setError])

  const deleteBlock = useCallback(async (blockId: string) => {
    const { error: deleteError } = await supabase
      .from('blocks')
      .delete()
      .eq('id', blockId)

    if (deleteError) {
      setError(deleteError.message)
      return false
    }

    removeBlock(blockId)
    return true
  }, [supabase, removeBlock, setError])

  const saveBlockOrder = useCallback(async () => {
    const updates = blocks.map((block, index) => ({
      id: block.id,
      order_index: index,
    }))

    for (const update of updates) {
      await supabase
        .from('blocks')
        .update({ order_index: update.order_index })
        .eq('id', update.id)
    }
  }, [blocks, supabase])

  useEffect(() => {
    if (pageId) {
      fetchBlocks()
    }
  }, [pageId, fetchBlocks])

  return {
    blocks,
    isLoading,
    error,
    refetch: fetchBlocks,
    createBlock,
    saveBlock,
    deleteBlock,
    reorderBlocks,
    saveBlockOrder,
  }
}
