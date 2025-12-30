import { createClient } from '@/lib/supabase/client'

const BUCKET_NAME = 'brand-assets'

export interface LogoGenerationResult {
  assetId: string
  publicUrl: string
  filePath: string
}

export interface LogoOptions {
  brandName: string
  primaryColor: string
  secondaryColor?: string
  fontFamily: string
  style?: 'minimal' | 'bold' | 'elegant' | 'modern'
}

/**
 * Generates a typographic logo SVG for a brand
 * This creates a professional text-based logo using the brand's typography and colors
 */
export function generateTypographicLogoSVG(options: LogoOptions): string {
  const { brandName, primaryColor, fontFamily, style = 'modern' } = options

  // Calculate dimensions based on text length
  const charWidth = style === 'bold' ? 60 : 50
  const width = Math.max(400, brandName.length * charWidth + 80)
  const height = 120

  // Style variations
  const styles = {
    minimal: {
      fontSize: 48,
      fontWeight: 400,
      letterSpacing: '0.1em',
      textTransform: 'uppercase' as const,
    },
    bold: {
      fontSize: 56,
      fontWeight: 700,
      letterSpacing: '0.02em',
      textTransform: 'none' as const,
    },
    elegant: {
      fontSize: 44,
      fontWeight: 300,
      letterSpacing: '0.15em',
      textTransform: 'uppercase' as const,
    },
    modern: {
      fontSize: 52,
      fontWeight: 600,
      letterSpacing: '0.05em',
      textTransform: 'none' as const,
    },
  }

  const currentStyle = styles[style]
  const displayText = currentStyle.textTransform === 'uppercase' 
    ? brandName.toUpperCase() 
    : brandName

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
  <defs>
    <style>
      @import url('https://fonts.googleapis.com/css2?family=${fontFamily.replace(/ /g, '+')}:wght@300;400;600;700&amp;display=swap');
    </style>
  </defs>
  <rect width="100%" height="100%" fill="transparent"/>
  <text 
    x="50%" 
    y="50%" 
    dominant-baseline="middle" 
    text-anchor="middle"
    font-family="'${fontFamily}', sans-serif"
    font-size="${currentStyle.fontSize}"
    font-weight="${currentStyle.fontWeight}"
    letter-spacing="${currentStyle.letterSpacing}"
    fill="${primaryColor}"
  >${displayText}</text>
</svg>`
}

/**
 * Converts SVG to PNG using canvas
 */
export async function svgToPng(
  svgString: string,
  scale = 2
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' })
    const url = URL.createObjectURL(svgBlob)

    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = img.width * scale
      canvas.height = img.height * scale
      
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        reject(new Error('Could not get canvas context'))
        return
      }

      // Enable high-quality rendering
      ctx.imageSmoothingEnabled = true
      ctx.imageSmoothingQuality = 'high'
      
      // Scale for higher resolution
      ctx.scale(scale, scale)
      ctx.drawImage(img, 0, 0)

      canvas.toBlob(
        (blob) => {
          URL.revokeObjectURL(url)
          if (blob) {
            resolve(blob)
          } else {
            reject(new Error('Failed to create PNG blob'))
          }
        },
        'image/png',
        1.0
      )
    }

    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Failed to load SVG'))
    }

    img.src = url
  })
}

/**
 * Saves a generated logo to the DAM
 */
export async function saveLogoToDAM(
  brandId: string,
  logoOptions: LogoOptions,
  userId: string
): Promise<LogoGenerationResult> {
  const supabase = createClient()

  // Generate SVG
  const svgContent = generateTypographicLogoSVG(logoOptions)
  
  // Convert to PNG
  const pngBlob = await svgToPng(svgContent, 3) // 3x scale for high resolution

  // Generate filename
  const timestamp = Date.now()
  const sanitizedName = logoOptions.brandName
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '-')
    .substring(0, 30)
  const fileName = `${brandId}/logos/${timestamp}-${sanitizedName}-logo.png`

  // Upload to storage
  const { error: uploadError } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(fileName, pngBlob, {
      contentType: 'image/png',
      cacheControl: '3600',
      upsert: false,
    })

  if (uploadError) {
    throw new Error(`Logo upload failed: ${uploadError.message}`)
  }

  // Get public URL
  const { data: { publicUrl } } = supabase.storage
    .from(BUCKET_NAME)
    .getPublicUrl(fileName)

  // Get image dimensions from the blob
  const dimensions = await getImageDimensionsFromBlob(pngBlob)

  // Create asset record
  const { data: asset, error: assetError } = await supabase
    .from('assets')
    .insert({
      brand_id: brandId,
      name: `${logoOptions.brandName} - Logo Tipográfico`,
      file_path: fileName,
      file_type: 'logo',
      file_size: pngBlob.size,
      mime_type: 'image/png',
      width: dimensions?.width || 800,
      height: dimensions?.height || 240,
      tags: ['logo', 'tipográfico', 'principal', 'gerado-ia'],
      ai_tags: ['logo', 'tipografia', 'identidade-visual', 'marca'],
      ai_description: `Logo tipográfico oficial da marca ${logoOptions.brandName}, gerado automaticamente pelo Koyot Genesis.`,
      ai_colors: [logoOptions.primaryColor, logoOptions.secondaryColor].filter(Boolean) as string[],
      metadata: {
        folder: 'logos',
        source: 'ai_generated',
        generator: 'koyot-genesis',
        brand_name: logoOptions.brandName,
        primary_color: logoOptions.primaryColor,
        font_family: logoOptions.fontFamily,
        style: logoOptions.style || 'modern',
        generated_at: new Date().toISOString(),
      },
      uploaded_by: userId,
      version: 1,
    })
    .select()
    .single()

  if (assetError || !asset) {
    // Cleanup on error
    await supabase.storage.from(BUCKET_NAME).remove([fileName])
    throw new Error(`Failed to create asset record: ${assetError?.message}`)
  }

  // Also save the SVG version
  const svgFileName = `${brandId}/logos/${timestamp}-${sanitizedName}-logo.svg`
  const svgBlob = new Blob([svgContent], { type: 'image/svg+xml' })
  
  await supabase.storage
    .from(BUCKET_NAME)
    .upload(svgFileName, svgBlob, {
      contentType: 'image/svg+xml',
      cacheControl: '3600',
      upsert: false,
    })

  // Create SVG asset record
  await supabase
    .from('assets')
    .insert({
      brand_id: brandId,
      name: `${logoOptions.brandName} - Logo Tipográfico (SVG)`,
      file_path: svgFileName,
      file_type: 'logo',
      file_size: svgBlob.size,
      mime_type: 'image/svg+xml',
      tags: ['logo', 'tipográfico', 'svg', 'vetorial', 'gerado-ia'],
      ai_tags: ['logo', 'svg', 'vetorial', 'escalável'],
      ai_description: `Versão vetorial (SVG) do logo tipográfico da marca ${logoOptions.brandName}.`,
      ai_colors: [logoOptions.primaryColor, logoOptions.secondaryColor].filter(Boolean) as string[],
      metadata: {
        folder: 'logos',
        source: 'ai_generated',
        generator: 'koyot-genesis',
        brand_name: logoOptions.brandName,
        primary_color: logoOptions.primaryColor,
        font_family: logoOptions.fontFamily,
        style: logoOptions.style || 'modern',
        parent_png_id: asset.id,
      },
      uploaded_by: userId,
      version: 1,
      parent_asset_id: asset.id,
    })

  return {
    assetId: asset.id,
    publicUrl,
    filePath: fileName,
  }
}

async function getImageDimensionsFromBlob(
  blob: Blob
): Promise<{ width: number; height: number } | null> {
  return new Promise((resolve) => {
    const img = new Image()
    const url = URL.createObjectURL(blob)
    
    img.onload = () => {
      resolve({ width: img.width, height: img.height })
      URL.revokeObjectURL(url)
    }
    img.onerror = () => {
      resolve(null)
      URL.revokeObjectURL(url)
    }
    img.src = url
  })
}
