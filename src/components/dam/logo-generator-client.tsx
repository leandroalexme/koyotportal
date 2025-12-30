'use client'

import { useState } from 'react'
import { Loader2, Sparkles, CheckCircle2, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { generateTypographicLogoSVG, svgToPng, type LogoOptions } from '@/services/logo-generator'

interface LogoGeneratorClientProps {
  brandId: string
  brandName: string
  primaryColor: string
  fontFamily: string
  onComplete?: (result: { assetId: string; publicUrl: string }) => void
}

type GenerationStep = 'idle' | 'generating-svg' | 'converting-png' | 'uploading' | 'complete' | 'error'

const stepMessages: Record<GenerationStep, string> = {
  'idle': 'Pronto para gerar',
  'generating-svg': 'Gerando logo vetorial...',
  'converting-png': 'Convertendo para PNG...',
  'uploading': 'Salvando no DAM...',
  'complete': 'Logo gerado com sucesso!',
  'error': 'Erro ao gerar logo',
}

const stepProgress: Record<GenerationStep, number> = {
  'idle': 0,
  'generating-svg': 25,
  'converting-png': 50,
  'uploading': 75,
  'complete': 100,
  'error': 0,
}

export function LogoGeneratorClient({
  brandId,
  brandName,
  primaryColor,
  fontFamily,
  onComplete,
}: LogoGeneratorClientProps) {
  const [step, setStep] = useState<GenerationStep>('idle')
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<{ assetId: string; publicUrl: string } | null>(null)
  const [previewSvg, setPreviewSvg] = useState<string | null>(null)

  const generateLogo = async () => {
    setStep('generating-svg')
    setError(null)

    try {
      const logoOptions: LogoOptions = {
        brandName,
        primaryColor,
        fontFamily,
        style: 'modern',
      }

      // Generate SVG
      const svgContent = generateTypographicLogoSVG(logoOptions)
      setPreviewSvg(svgContent)

      // Convert to PNG
      setStep('converting-png')
      const pngBlob = await svgToPng(svgContent, 3)

      // Upload via API
      setStep('uploading')
      
      const formData = new FormData()
      formData.append('file', pngBlob, `${brandName.toLowerCase().replace(/\s+/g, '-')}-logo.png`)
      formData.append('brandId', brandId)
      formData.append('folder', 'logos')
      formData.append('name', `${brandName} - Logo Tipográfico`)
      formData.append('fileType', 'logo')
      formData.append('tags', JSON.stringify(['logo', 'tipográfico', 'principal', 'gerado-ia']))
      formData.append('aiTags', JSON.stringify(['logo', 'tipografia', 'identidade-visual', 'marca']))
      formData.append('aiDescription', `Logo tipográfico oficial da marca ${brandName}, gerado automaticamente pelo Koyot Genesis.`)
      formData.append('aiColors', JSON.stringify([primaryColor]))
      formData.append('metadata', JSON.stringify({
        folder: 'logos',
        source: 'ai_generated',
        generator: 'koyot-genesis',
        brand_name: brandName,
        primary_color: primaryColor,
        font_family: fontFamily,
        style: 'modern',
        generated_at: new Date().toISOString(),
      }))

      const response = await fetch('/api/assets/upload', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Falha no upload')
      }

      const data = await response.json()
      
      // Also upload SVG version
      const svgBlob = new Blob([svgContent], { type: 'image/svg+xml' })
      const svgFormData = new FormData()
      svgFormData.append('file', svgBlob, `${brandName.toLowerCase().replace(/\s+/g, '-')}-logo.svg`)
      svgFormData.append('brandId', brandId)
      svgFormData.append('folder', 'logos')
      svgFormData.append('name', `${brandName} - Logo Tipográfico (SVG)`)
      svgFormData.append('fileType', 'logo')
      svgFormData.append('tags', JSON.stringify(['logo', 'tipográfico', 'svg', 'vetorial', 'gerado-ia']))
      svgFormData.append('aiTags', JSON.stringify(['logo', 'svg', 'vetorial', 'escalável']))
      svgFormData.append('aiDescription', `Versão vetorial (SVG) do logo tipográfico da marca ${brandName}.`)
      svgFormData.append('aiColors', JSON.stringify([primaryColor]))

      await fetch('/api/assets/upload', {
        method: 'POST',
        body: svgFormData,
      })

      setStep('complete')
      setResult({
        assetId: data.asset.id,
        publicUrl: data.publicUrl,
      })
      
      onComplete?.({
        assetId: data.asset.id,
        publicUrl: data.publicUrl,
      })

    } catch (err) {
      console.error('Logo generation error:', err)
      setStep('error')
      setError(err instanceof Error ? err.message : 'Erro desconhecido')
    }
  }

  const downloadLogo = () => {
    if (!result?.publicUrl) return
    const link = document.createElement('a')
    link.href = result.publicUrl
    link.download = `${brandName}-logo.png`
    link.click()
  }

  return (
    <Card className="border-dashed">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-amber-500" />
          Logo Tipográfico
        </CardTitle>
        <CardDescription>
          Gere automaticamente um logo tipográfico para sua marca
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Preview */}
        {previewSvg && (
          <div 
            className="flex items-center justify-center rounded-lg border bg-white p-8"
            dangerouslySetInnerHTML={{ __html: previewSvg }}
          />
        )}

        {/* Progress */}
        {step !== 'idle' && step !== 'complete' && step !== 'error' && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{stepMessages[step]}</span>
              <span className="font-medium">{stepProgress[step]}%</span>
            </div>
            <Progress value={stepProgress[step]} className="h-2" />
          </div>
        )}

        {/* Error */}
        {step === 'error' && error && (
          <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {/* Success */}
        {step === 'complete' && (
          <div className="flex items-center gap-2 rounded-lg border border-green-500/50 bg-green-500/10 p-3 text-sm text-green-600">
            <CheckCircle2 className="h-4 w-4" />
            Logo salvo na biblioteca de assets!
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          {step === 'idle' || step === 'error' ? (
            <Button onClick={generateLogo} className="gap-2">
              <Sparkles className="h-4 w-4" />
              Gerar Logo
            </Button>
          ) : step === 'complete' ? (
            <>
              <Button onClick={downloadLogo} variant="outline" className="gap-2">
                <Download className="h-4 w-4" />
                Download
              </Button>
              <Button onClick={generateLogo} variant="ghost" className="gap-2">
                <Sparkles className="h-4 w-4" />
                Gerar Novamente
              </Button>
            </>
          ) : (
            <Button disabled className="gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              {stepMessages[step]}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
