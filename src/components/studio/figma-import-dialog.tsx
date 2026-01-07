'use client'

import { useState, useCallback, useMemo } from 'react'
import { Loader2, Figma, Link2, AlertCircle, CheckCircle2, Info, Type, RefreshCw } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { useFigmaImport } from '@/hooks/use-figma-import'
import type { Template } from '@/types/studio'

interface FigmaImportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  brandId?: string
  onImportSuccess?: (template: Template) => void
}

function SuccessStep({ template, warnings }: { template: Template | null; warnings: string[] }) {
  if (!template) return null
  
  return (
    <div className="space-y-4 py-4">
      <div className="flex items-center gap-3 p-4 rounded-lg bg-green-50 dark:bg-green-950/30">
        <CheckCircle2 className="h-8 w-8 text-green-600" />
        <div>
          <p className="font-medium text-green-800 dark:text-green-200">
            Importação concluída!
          </p>
          <p className="text-sm text-green-700 dark:text-green-300">
            Template &quot;{template.name}&quot; criado com sucesso
          </p>
        </div>
      </div>

      {warnings.length > 0 && (
        <div className="rounded-lg bg-yellow-50 dark:bg-yellow-950/30 p-3">
          <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200 mb-2">
            Avisos ({warnings.length}):
          </p>
          <ul className="text-xs text-yellow-700 dark:text-yellow-300 space-y-1 max-h-32 overflow-y-auto">
            {warnings.map((w, i) => (
              <li key={i}>• {w}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 text-sm">
        <div className="p-3 rounded-lg bg-muted">
          <p className="text-muted-foreground">Formato</p>
          <p className="font-medium">{template.format}</p>
        </div>
        <div className="p-3 rounded-lg bg-muted">
          <p className="text-muted-foreground">Dimensões</p>
          <p className="font-medium">
            {template.rootNode.size.width} × {template.rootNode.size.height}
          </p>
        </div>
      </div>

      {/* Mostrar fontes importadas */}
      {template.fonts && (template.fonts.googleFonts.length > 0 || template.fonts.customFonts.length > 0) && (
        <div className="p-3 rounded-lg bg-muted">
          <p className="text-muted-foreground text-sm mb-2">Fontes</p>
          <div className="flex flex-wrap gap-1">
            {template.fonts.googleFonts.map(f => (
              <span key={f.family} className="px-2 py-0.5 text-xs rounded bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300">
                {f.family}
              </span>
            ))}
            {template.fonts.customFonts.map(f => (
              <span key={f} className="px-2 py-0.5 text-xs rounded bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300">
                {f}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export function FigmaImportDialog({
  open,
  onOpenChange,
  brandId,
  onImportSuccess,
}: FigmaImportDialogProps) {
  const [figmaUrl, setFigmaUrl] = useState('')
  const [accessToken, setAccessToken] = useState('')
  const [urlValidation, setUrlValidation] = useState<{
    valid: boolean
    fileKey?: string
    nodeId?: string
    error?: string
  } | null>(null)
  const [step, setStep] = useState<'input' | 'importing' | 'fonts' | 'success' | 'error'>('input')
  const [useOriginalFonts, setUseOriginalFonts] = useState(true)
  const [pendingTemplate, setPendingTemplate] = useState<Template | null>(null)

  const {
    importFromUrl,
    validateUrl,
    isLoading,
    error,
    template,
    warnings,
    reset,
  } = useFigmaImport({
    brandId,
    onSuccess: (t) => {
      // Se tem fontes, mostrar step de configuração
      if (t.fonts && (t.fonts.googleFonts.length > 0 || t.fonts.customFonts.length > 0)) {
        setPendingTemplate(t)
        setStep('fonts')
      } else {
        setStep('success')
        onImportSuccess?.(t)
      }
    },
    onError: () => {
      setStep('error')
    },
  })

  // Fontes detectadas no template
  const detectedFonts = useMemo(() => {
    const t = pendingTemplate || template
    if (!t?.fonts) return { google: [], custom: [] }
    return {
      google: t.fonts.googleFonts.map(f => f.family),
      custom: t.fonts.customFonts,
    }
  }, [pendingTemplate, template])

  const handleUrlChange = useCallback(async (url: string) => {
    setFigmaUrl(url)
    setUrlValidation(null)
    
    if (url.length > 20 && url.includes('figma.com')) {
      const result = await validateUrl(url)
      setUrlValidation(result)
    }
  }, [validateUrl])

  const handleImport = useCallback(async () => {
    if (!figmaUrl || !accessToken) return
    
    setStep('importing')
    await importFromUrl(figmaUrl, accessToken)
  }, [figmaUrl, accessToken, importFromUrl])

  const handleClose = useCallback(() => {
    setFigmaUrl('')
    setAccessToken('')
    setUrlValidation(null)
    setStep('input')
    setUseOriginalFonts(true)
    setPendingTemplate(null)
    reset()
    onOpenChange(false)
  }, [onOpenChange, reset])

  const handleConfirmFonts = useCallback(() => {
    if (pendingTemplate) {
      // Se não usar fontes originais, remover info de fontes customizadas
      const finalTemplate = useOriginalFonts 
        ? pendingTemplate 
        : {
            ...pendingTemplate,
            fonts: pendingTemplate.fonts ? {
              ...pendingTemplate.fonts,
              customFonts: [], // Não importar fontes customizadas
            } : undefined,
          }
      
      setStep('success')
      onImportSuccess?.(finalTemplate)
    }
  }, [pendingTemplate, useOriginalFonts, onImportSuccess])

  const handleUseTemplate = useCallback(() => {
    if (template) {
      // Chamar callback ANTES de fechar para garantir que o template seja usado
      onImportSuccess?.(template)
      // Fechar sem resetar o estado (o template já foi passado)
      setFigmaUrl('')
      setAccessToken('')
      setUrlValidation(null)
      setStep('input')
      onOpenChange(false)
    }
  }, [template, onImportSuccess, onOpenChange])

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Figma className="h-5 w-5" />
            Importar do Figma
          </DialogTitle>
          <DialogDescription>
            Cole a URL de um frame do Figma para importá-lo como template.
            <br />
            <span className="text-amber-500 text-xs">
              Dica: Se estiver com rate limit, crie um novo token em figma.com/developers
            </span>
          </DialogDescription>
        </DialogHeader>

        {step === 'input' && (
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="figma-url">URL do Figma</Label>
              <div className="relative">
                <Link2 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="figma-url"
                  placeholder="https://www.figma.com/file/..."
                  value={figmaUrl}
                  onChange={(e) => handleUrlChange(e.target.value)}
                  className="pl-10"
                />
              </div>
              {urlValidation && (
                <div className={`flex items-center gap-2 text-sm ${urlValidation.valid ? 'text-green-600' : 'text-red-600'}`}>
                  {urlValidation.valid ? (
                    <>
                      <CheckCircle2 className="h-4 w-4" />
                      <span>
                        URL válida
                        {urlValidation.nodeId && ` • Node: ${urlValidation.nodeId.substring(0, 10)}...`}
                      </span>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="h-4 w-4" />
                      <span>{urlValidation.error || 'URL inválida'}</span>
                    </>
                  )}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="access-token">Personal Access Token</Label>
              <Input
                id="access-token"
                type="password"
                placeholder="figd_..."
                value={accessToken}
                onChange={(e) => setAccessToken(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Obtenha em Figma → Settings → Account → Personal access tokens
              </p>
            </div>

            <div className="rounded-lg bg-blue-50 dark:bg-blue-950/30 p-3 text-sm">
              <div className="flex gap-2">
                <Info className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
                <div className="text-blue-800 dark:text-blue-200">
                  <p className="font-medium">O que será importado:</p>
                  <ul className="mt-1 list-disc list-inside text-blue-700 dark:text-blue-300 space-y-0.5">
                    <li>Estrutura de frames e grupos</li>
                    <li>Auto Layout → Yoga Layout</li>
                    <li>Textos, cores e estilos</li>
                    <li>Imagens (como referências)</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {step === 'importing' && (
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <div className="text-center">
              <p className="font-medium">Importando do Figma...</p>
              <p className="text-sm text-muted-foreground">
                Convertendo estrutura para o formato do editor
              </p>
            </div>
          </div>
        )}

        {step === 'fonts' && pendingTemplate && (
          <div className="space-y-4 py-4">
            <div className="flex items-center gap-3 p-4 rounded-lg bg-blue-50 dark:bg-blue-950/30">
              <Type className="h-8 w-8 text-blue-600" />
              <div>
                <p className="font-medium text-blue-800 dark:text-blue-200">
                  Fontes Detectadas
                </p>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  Escolha como importar as fontes do design
                </p>
              </div>
            </div>

            {/* Lista de fontes Google */}
            {detectedFonts.google.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  Google Fonts ({detectedFonts.google.length})
                </p>
                <div className="flex flex-wrap gap-2">
                  {detectedFonts.google.map((font) => (
                    <span
                      key={font}
                      className="px-2 py-1 text-xs rounded-full bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200"
                    >
                      {font}
                    </span>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  Serão carregadas automaticamente via Google Fonts CDN
                </p>
              </div>
            )}

            {/* Lista de fontes customizadas */}
            {detectedFonts.custom.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-amber-600" />
                  Fontes Customizadas ({detectedFonts.custom.length})
                </p>
                <div className="flex flex-wrap gap-2">
                  {detectedFonts.custom.map((font) => (
                    <span
                      key={font}
                      className="px-2 py-1 text-xs rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200"
                    >
                      {font}
                    </span>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  Fontes não disponíveis no Google Fonts
                </p>
              </div>
            )}

            {/* Opção de usar fontes originais ou substituir */}
            <div className="rounded-lg border p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="use-original-fonts" className="text-sm font-medium">
                    Usar fontes originais do Figma
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    {useOriginalFonts 
                      ? 'As fontes do design serão mantidas' 
                      : 'Fontes customizadas serão substituídas pela fonte padrão'}
                  </p>
                </div>
                <Switch
                  id="use-original-fonts"
                  checked={useOriginalFonts}
                  onCheckedChange={setUseOriginalFonts}
                />
              </div>

              {!useOriginalFonts && detectedFonts.custom.length > 0 && (
                <div className="flex items-center gap-2 text-xs text-amber-600 dark:text-amber-400">
                  <RefreshCw className="h-3 w-3" />
                  <span>
                    {detectedFonts.custom.length} fonte(s) serão substituídas por Inter
                  </span>
                </div>
              )}
            </div>

            {/* Info sobre Google Fonts */}
            <div className="rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground">
              <p>
                <strong>Dica:</strong> Fontes do Google Fonts são carregadas automaticamente 
                sem necessidade de upload. Fontes customizadas podem precisar de upload manual 
                ou serão substituídas pela fonte padrão da marca.
              </p>
            </div>
          </div>
        )}

        {step === 'success' && (
          <SuccessStep 
            template={pendingTemplate || template} 
            warnings={warnings} 
          />
        )}

        {step === 'error' && (
          <div className="space-y-4 py-4">
            <div className="flex items-center gap-3 p-4 rounded-lg bg-red-50 dark:bg-red-950/30">
              <AlertCircle className="h-8 w-8 text-red-600" />
              <div>
                <p className="font-medium text-red-800 dark:text-red-200">
                  Falha na importação
                </p>
                <p className="text-sm text-red-700 dark:text-red-300">
                  {error || 'Erro desconhecido'}
                </p>
              </div>
            </div>

            {error?.includes('429') || error?.includes('rate') || error?.includes('Limite') ? (
              <div className="text-sm text-muted-foreground">
                <p className="font-medium text-amber-600">Rate Limit da API do Figma</p>
                <p className="mt-1">Você fez muitas requisições em pouco tempo. Aguarde 30-60 segundos e tente novamente.</p>
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">
                <p>Possíveis causas:</p>
                <ul className="list-disc list-inside mt-1 space-y-1">
                  <li>Token de acesso inválido ou expirado</li>
                  <li>URL do Figma incorreta</li>
                  <li>Sem permissão para acessar o arquivo</li>
                  <li>Frame não encontrado</li>
                </ul>
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          {step === 'input' && (
            <>
              <Button variant="outline" onClick={handleClose}>
                Cancelar
              </Button>
              <Button
                onClick={handleImport}
                disabled={!figmaUrl || !accessToken || isLoading || (urlValidation !== null && !urlValidation.valid)}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Importando...
                  </>
                ) : (
                  <>
                    <Figma className="mr-2 h-4 w-4" />
                    Importar
                  </>
                )}
              </Button>
            </>
          )}

          {step === 'fonts' && (
            <>
              <Button variant="outline" onClick={handleClose}>
                Cancelar
              </Button>
              <Button onClick={handleConfirmFonts}>
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Confirmar e Continuar
              </Button>
            </>
          )}

          {step === 'success' && (
            <>
              <Button variant="outline" onClick={handleClose}>
                Fechar
              </Button>
              <Button onClick={handleUseTemplate}>
                Usar Template
              </Button>
            </>
          )}

          {step === 'error' && (
            <>
              <Button variant="outline" onClick={handleClose}>
                Fechar
              </Button>
              <Button onClick={() => setStep('input')}>
                Tentar Novamente
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default FigmaImportDialog
