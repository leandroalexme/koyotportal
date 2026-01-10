'use client'

/**
 * MockupUploader
 * 
 * Componente para upload de arquivos PSD e criação de MockupTemplates
 */

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, FileImage, Loader2, CheckCircle, AlertCircle, Layers } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { parsePsdFile, isPsdFile, type MockupTemplate, type MockupCategory } from '@/lib/studio/mockup-engine'

interface MockupUploaderProps {
  onTemplateCreated?: (template: MockupTemplate, layerImages: Map<string, string>) => void
  className?: string
}

const categories: { value: MockupCategory; label: string }[] = [
  { value: 'device', label: 'Dispositivo' },
  { value: 'print', label: 'Impressão' },
  { value: 'apparel', label: 'Vestuário' },
  { value: 'packaging', label: 'Embalagem' },
  { value: 'social', label: 'Social Media' },
  { value: 'outdoor', label: 'Outdoor' },
  { value: 'stationery', label: 'Papelaria' },
  { value: 'other', label: 'Outro' },
]

type UploadState = 'idle' | 'uploading' | 'parsing' | 'success' | 'error'

export function MockupUploader({ onTemplateCreated, className }: MockupUploaderProps) {
  const [state, setState] = useState<UploadState>('idle')
  const [error, setError] = useState<string | null>(null)
  const [warnings, setWarnings] = useState<string[]>([])
  const [template, setTemplate] = useState<MockupTemplate | null>(null)
  const [layerImages, setLayerImages] = useState<Map<string, string>>(new Map())
  
  // Form state
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState<MockupCategory>('other')
  const [tags, setTags] = useState('')

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (!file) return

    if (!isPsdFile(file)) {
      setError('Por favor, selecione um arquivo PSD válido.')
      setState('error')
      return
    }

    setError(null)
    setWarnings([])
    setState('parsing')

    try {
      const result = await parsePsdFile(file, {
        name: name || file.name.replace('.psd', ''),
        description,
        category,
        tags: tags.split(',').map(t => t.trim()).filter(Boolean),
        extractLayerImages: true,
      })

      if (!result.success) {
        setError(result.errors.join(', '))
        setState('error')
        return
      }

      if (result.warnings.length > 0) {
        setWarnings(result.warnings)
      }

      setTemplate(result.template!)
      setLayerImages(result.layerImages ?? new Map())
      setState('success')

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao processar PSD')
      setState('error')
    }
  }, [name, description, category, tags])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/vnd.adobe.photoshop': ['.psd'],
    },
    maxFiles: 1,
    disabled: state === 'parsing',
  })

  const handleConfirm = () => {
    if (template) {
      onTemplateCreated?.(template, layerImages)
    }
  }

  const handleReset = () => {
    setState('idle')
    setError(null)
    setWarnings([])
    setTemplate(null)
    setLayerImages(new Map())
  }

  return (
    <Card className={cn('w-full max-w-2xl', className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileImage className="h-5 w-5" />
          Importar Mockup PSD
        </CardTitle>
        <CardDescription>
          Faça upload de um arquivo PSD com Smart Objects para criar um mockup
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Form fields */}
        {state === 'idle' && (
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Nome do Mockup</Label>
              <Input
                id="name"
                placeholder="Ex: iPhone na mão"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="category">Categoria</Label>
              <Select value={category} onValueChange={(v) => setCategory(v as MockupCategory)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="description">Descrição (opcional)</Label>
              <Input
                id="description"
                placeholder="Descrição do mockup"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
            
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="tags">Tags (separadas por vírgula)</Label>
              <Input
                id="tags"
                placeholder="Ex: iphone, mão, dispositivo"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
              />
            </div>
          </div>
        )}

        {/* Dropzone */}
        <div
          {...getRootProps()}
          className={cn(
            'border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors',
            isDragActive && 'border-primary bg-primary/5',
            state === 'parsing' && 'pointer-events-none opacity-50',
            state === 'error' && 'border-destructive',
            state === 'success' && 'border-green-500 bg-green-500/5',
            state === 'idle' && 'border-muted-foreground/25 hover:border-primary/50'
          )}
        >
          <input {...getInputProps()} />
          
          {state === 'idle' && (
            <div className="flex flex-col items-center gap-2">
              <Upload className="h-10 w-10 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                {isDragActive
                  ? 'Solte o arquivo PSD aqui...'
                  : 'Arraste um arquivo PSD ou clique para selecionar'}
              </p>
              <p className="text-xs text-muted-foreground/70">
                Apenas arquivos .psd com Smart Objects
              </p>
            </div>
          )}
          
          {state === 'parsing' && (
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="h-10 w-10 text-primary animate-spin" />
              <p className="text-sm">Processando PSD...</p>
            </div>
          )}
          
          {state === 'error' && (
            <div className="flex flex-col items-center gap-2">
              <AlertCircle className="h-10 w-10 text-destructive" />
              <p className="text-sm text-destructive">{error}</p>
              <Button variant="outline" size="sm" onClick={handleReset}>
                Tentar novamente
              </Button>
            </div>
          )}
          
          {state === 'success' && template && (
            <div className="flex flex-col items-center gap-4">
              <CheckCircle className="h-10 w-10 text-green-500" />
              <div className="text-center">
                <p className="font-medium">{template.name}</p>
                <p className="text-sm text-muted-foreground">
                  {template.canvasSize.width} × {template.canvasSize.height}px
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Warnings */}
        {warnings.length > 0 && (
          <div className="rounded-lg bg-yellow-500/10 border border-yellow-500/20 p-3">
            <p className="text-sm font-medium text-yellow-600 dark:text-yellow-400">Avisos:</p>
            <ul className="text-sm text-yellow-600/80 dark:text-yellow-400/80 list-disc list-inside">
              {warnings.map((w, i) => (
                <li key={i}>{w}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Template info */}
        {state === 'success' && template && (
          <div className="space-y-4">
            <div className="rounded-lg border p-4 space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Layers className="h-4 w-4" />
                Smart Objects encontrados: {template.insertAreas.length}
              </div>
              
              {template.insertAreas.length > 0 && (
                <div className="space-y-2">
                  {template.insertAreas.map((area, i) => (
                    <div key={i} className="text-sm bg-muted/50 rounded px-3 py-2">
                      <span className="font-medium">{area.name}</span>
                      <span className="text-muted-foreground ml-2">
                        {area.placedContent.width} × {area.placedContent.height}px
                      </span>
                      {area.perspectiveQuad && (
                        <span className="text-xs text-green-600 ml-2">(perspectiva)</span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleReset} className="flex-1">
                Cancelar
              </Button>
              <Button onClick={handleConfirm} className="flex-1">
                Criar Mockup
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
