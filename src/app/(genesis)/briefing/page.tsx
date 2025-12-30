'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2, Sparkles, X } from 'lucide-react'

const PERSONALITY_SUGGESTIONS = [
  'Audaz', 'Minimalista', 'Tradicional', 'Inovador', 'Sofisticado',
  'Acessível', 'Premium', 'Jovem', 'Confiável', 'Criativo',
  'Elegante', 'Moderno', 'Clássico', 'Disruptivo', 'Acolhedor'
]

const MARKET_SEGMENTS = [
  'Tecnologia',
  'Saúde & Bem-estar',
  'Educação',
  'Finanças',
  'E-commerce',
  'Alimentação',
  'Moda & Beleza',
  'Entretenimento',
  'Imobiliário',
  'Serviços Profissionais',
  'Sustentabilidade',
  'Outro'
]

interface BriefingFormData {
  brandName: string
  targetAudience: string
  personality: string[]
  marketSegment: string
  additionalContext: string
}

export default function BriefingPage() {
  const router = useRouter()
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [personalityInput, setPersonalityInput] = useState('')
  
  const [formData, setFormData] = useState<BriefingFormData>({
    brandName: '',
    targetAudience: '',
    personality: [],
    marketSegment: '',
    additionalContext: ''
  })

  const addPersonality = (trait: string) => {
    const normalizedTrait = trait.trim()
    if (
      normalizedTrait && 
      formData.personality.length < 5 && 
      !formData.personality.includes(normalizedTrait)
    ) {
      setFormData(prev => ({
        ...prev,
        personality: [...prev.personality, normalizedTrait]
      }))
      setPersonalityInput('')
    }
  }

  const removePersonality = (trait: string) => {
    setFormData(prev => ({
      ...prev,
      personality: prev.personality.filter(p => p !== trait)
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!formData.brandName.trim()) {
      setError('Nome da marca é obrigatório')
      return
    }
    if (!formData.targetAudience.trim()) {
      setError('Público-alvo é obrigatório')
      return
    }
    if (formData.personality.length < 3) {
      setError('Selecione pelo menos 3 adjetivos de personalidade')
      return
    }
    if (!formData.marketSegment) {
      setError('Segmento de mercado é obrigatório')
      return
    }

    setIsGenerating(true)

    try {
      const response = await fetch('/api/genesis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erro ao gerar marca')
      }

      const { brandId } = await response.json()
      router.push(`/${brandId}/identity`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido')
      setIsGenerating(false)
    }
  }

  const isFormValid = 
    formData.brandName.trim() && 
    formData.targetAudience.trim() && 
    formData.personality.length >= 3 && 
    formData.marketSegment

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <Sparkles className="h-8 w-8" />
            <h1 className="text-3xl font-bold tracking-tight">Genesis</h1>
          </div>
          <p className="text-muted-foreground">
            Transforme sua visão em uma identidade de marca completa com IA
          </p>
        </div>

        <Card className="border-border/50">
          <CardHeader>
            <CardTitle>Briefing da Marca</CardTitle>
            <CardDescription>
              Preencha as informações abaixo para gerar sua identidade visual
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Brand Name */}
              <div className="space-y-2">
                <Label htmlFor="brandName">Nome da Marca *</Label>
                <Input
                  id="brandName"
                  placeholder="Ex: Koyot, Nubank, Notion..."
                  value={formData.brandName}
                  onChange={(e) => setFormData(prev => ({ ...prev, brandName: e.target.value }))}
                  disabled={isGenerating}
                  className="bg-background"
                />
              </div>

              {/* Target Audience */}
              <div className="space-y-2">
                <Label htmlFor="targetAudience">Público-alvo *</Label>
                <Textarea
                  id="targetAudience"
                  placeholder="Descreva seu público ideal: idade, interesses, comportamentos, necessidades..."
                  value={formData.targetAudience}
                  onChange={(e) => setFormData(prev => ({ ...prev, targetAudience: e.target.value }))}
                  disabled={isGenerating}
                  className="bg-background min-h-[80px]"
                />
              </div>

              {/* Personality Traits */}
              <div className="space-y-3">
                <Label>Personalidade da Marca * (3-5 adjetivos)</Label>
                
                {/* Selected traits */}
                {formData.personality.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {formData.personality.map(trait => (
                      <Badge 
                        key={trait} 
                        variant="secondary"
                        className="px-3 py-1 text-sm cursor-pointer hover:bg-destructive hover:text-destructive-foreground transition-colors"
                        onClick={() => !isGenerating && removePersonality(trait)}
                      >
                        {trait}
                        <X className="h-3 w-3 ml-1" />
                      </Badge>
                    ))}
                  </div>
                )}

                {/* Input for custom trait */}
                <div className="flex gap-2">
                  <Input
                    placeholder="Digite um adjetivo..."
                    value={personalityInput}
                    onChange={(e) => setPersonalityInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        addPersonality(personalityInput)
                      }
                    }}
                    disabled={isGenerating || formData.personality.length >= 5}
                    className="bg-background"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => addPersonality(personalityInput)}
                    disabled={isGenerating || formData.personality.length >= 5 || !personalityInput.trim()}
                  >
                    Adicionar
                  </Button>
                </div>

                {/* Suggestions */}
                <div className="flex flex-wrap gap-1.5">
                  {PERSONALITY_SUGGESTIONS
                    .filter(s => !formData.personality.includes(s))
                    .slice(0, 10)
                    .map(suggestion => (
                      <Badge
                        key={suggestion}
                        variant="outline"
                        className="cursor-pointer hover:bg-accent transition-colors text-xs"
                        onClick={() => !isGenerating && addPersonality(suggestion)}
                      >
                        {suggestion}
                      </Badge>
                    ))}
                </div>
              </div>

              {/* Market Segment */}
              <div className="space-y-2">
                <Label htmlFor="marketSegment">Segmento de Mercado *</Label>
                <Select
                  value={formData.marketSegment}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, marketSegment: value }))}
                  disabled={isGenerating}
                >
                  <SelectTrigger className="bg-background">
                    <SelectValue placeholder="Selecione o segmento" />
                  </SelectTrigger>
                  <SelectContent>
                    {MARKET_SEGMENTS.map(segment => (
                      <SelectItem key={segment} value={segment}>
                        {segment}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Additional Context */}
              <div className="space-y-2">
                <Label htmlFor="additionalContext">Contexto Adicional (opcional)</Label>
                <Textarea
                  id="additionalContext"
                  placeholder="Informações extras: concorrentes, referências visuais, valores da empresa..."
                  value={formData.additionalContext}
                  onChange={(e) => setFormData(prev => ({ ...prev, additionalContext: e.target.value }))}
                  disabled={isGenerating}
                  className="bg-background min-h-[80px]"
                />
              </div>

              {/* Error Message */}
              {error && (
                <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
                  <p className="text-sm text-destructive">{error}</p>
                </div>
              )}

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full"
                size="lg"
                disabled={!isFormValid || isGenerating}
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Gerando sua marca...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Gerar Identidade de Marca
                  </>
                )}
              </Button>

              {isGenerating && (
                <p className="text-center text-sm text-muted-foreground">
                  Isso pode levar alguns segundos. A IA está criando sua identidade visual completa.
                </p>
              )}
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground mt-6">
          Powered by Gemini 2.5 • Koyot Genesis Engine
        </p>
      </div>
    </div>
  )
}
