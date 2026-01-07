/**
 * Figma API Test Route
 * 
 * POST /api/figma/test
 * 
 * Testa a conexão com a API do Figma diretamente.
 */

import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { accessToken, fileKey } = body
    
    if (!accessToken) {
      return NextResponse.json({ error: 'accessToken is required' }, { status: 400 })
    }
    
    if (!fileKey) {
      return NextResponse.json({ error: 'fileKey is required' }, { status: 400 })
    }
    
    console.log('[Figma Test] Token length:', accessToken.length)
    console.log('[Figma Test] Token prefix:', accessToken.substring(0, 10))
    console.log('[Figma Test] FileKey:', fileKey)
    
    // Fazer requisição direta à API do Figma
    const url = `https://api.figma.com/v1/files/${fileKey}?depth=1`
    console.log('[Figma Test] URL:', url)
    
    const startTime = Date.now()
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'X-Figma-Token': accessToken,
      },
    })
    
    const elapsed = Date.now() - startTime
    console.log('[Figma Test] Response status:', response.status)
    console.log('[Figma Test] Response time:', elapsed, 'ms')
    console.log('[Figma Test] Headers:', Object.fromEntries(response.headers.entries()))
    
    if (response.status === 429) {
      const retryAfter = response.headers.get('Retry-After')
      const rateLimitRemaining = response.headers.get('X-RateLimit-Remaining')
      const rateLimitReset = response.headers.get('X-RateLimit-Reset')
      
      return NextResponse.json({
        success: false,
        error: 'Rate limit (429)',
        retryAfter,
        rateLimitRemaining,
        rateLimitReset,
        headers: Object.fromEntries(response.headers.entries()),
      }, { status: 429 })
    }
    
    if (!response.ok) {
      const errorText = await response.text()
      return NextResponse.json({
        success: false,
        status: response.status,
        error: errorText,
      }, { status: response.status })
    }
    
    const data = await response.json()
    
    return NextResponse.json({
      success: true,
      fileName: data.name,
      lastModified: data.lastModified,
      version: data.version,
      elapsed,
    })
    
  } catch (error) {
    console.error('[Figma Test] Error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 })
  }
}
