import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const BUCKET_NAME = 'brand-assets'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Usuário não autenticado' },
        { status: 401 }
      )
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const brandId = formData.get('brandId') as string
    const folder = (formData.get('folder') as string) || 'general'
    const name = formData.get('name') as string
    const fileType = formData.get('fileType') as string
    const tags = formData.get('tags') as string
    const aiTags = formData.get('aiTags') as string
    const aiDescription = formData.get('aiDescription') as string
    const aiColors = formData.get('aiColors') as string
    const width = formData.get('width') as string
    const height = formData.get('height') as string
    const metadata = formData.get('metadata') as string

    if (!file || !brandId) {
      return NextResponse.json(
        { error: 'Arquivo e brandId são obrigatórios' },
        { status: 400 }
      )
    }

    // Verify user has access to brand
    const { data: brand, error: brandError } = await supabase
      .from('brands')
      .select('id, owner_id')
      .eq('id', brandId)
      .single()

    if (brandError || !brand) {
      return NextResponse.json(
        { error: 'Marca não encontrada' },
        { status: 404 }
      )
    }

    if (brand.owner_id !== user.id) {
      // Check if user is a member
      const { data: member } = await supabase
        .from('brand_members')
        .select('role')
        .eq('brand_id', brandId)
        .eq('user_id', user.id)
        .single()

      if (!member || !['owner', 'admin', 'editor'].includes(member.role)) {
        return NextResponse.json(
          { error: 'Sem permissão para fazer upload nesta marca' },
          { status: 403 }
        )
      }
    }

    // Generate unique filename
    const fileExt = file.name.split('.').pop()?.toLowerCase() || 'bin'
    const timestamp = Date.now()
    const randomId = Math.random().toString(36).substring(2, 9)
    const sanitizedName = (name || file.name)
      .replace(/\.[^/.]+$/, '')
      .replace(/[^a-zA-Z0-9-_]/g, '-')
      .substring(0, 50)
    const fileName = `${brandId}/${folder}/${timestamp}-${randomId}-${sanitizedName}.${fileExt}`

    // Convert File to ArrayBuffer for server upload
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Upload to storage
    const { error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(fileName, buffer, {
        contentType: file.type,
        cacheControl: '3600',
        upsert: false,
      })

    if (uploadError) {
      console.error('Upload error:', uploadError)
      return NextResponse.json(
        { error: `Upload falhou: ${uploadError.message}` },
        { status: 500 }
      )
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(fileName)

    // Parse arrays from JSON strings
    const parsedTags = tags ? JSON.parse(tags) : []
    const parsedAiTags = aiTags ? JSON.parse(aiTags) : []
    const parsedAiColors = aiColors ? JSON.parse(aiColors) : []
    const parsedMetadata = metadata ? JSON.parse(metadata) : {}

    // Create asset record
    const { data: asset, error: assetError } = await supabase
      .from('assets')
      .insert({
        brand_id: brandId,
        name: name || file.name,
        file_path: fileName,
        file_type: fileType || 'other',
        file_size: file.size,
        mime_type: file.type,
        width: width ? parseInt(width, 10) : null,
        height: height ? parseInt(height, 10) : null,
        tags: parsedTags,
        ai_tags: parsedAiTags,
        ai_description: aiDescription || null,
        ai_colors: parsedAiColors,
        metadata: parsedMetadata,
        uploaded_by: user.id,
        version: 1,
      })
      .select()
      .single()

    if (assetError || !asset) {
      // Cleanup uploaded file on error
      await supabase.storage.from(BUCKET_NAME).remove([fileName])
      console.error('Asset creation error:', assetError)
      return NextResponse.json(
        { error: `Erro ao criar asset: ${assetError?.message}` },
        { status: 500 }
      )
    }

    return NextResponse.json({
      asset,
      publicUrl,
    })

  } catch (error) {
    console.error('Asset upload error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
