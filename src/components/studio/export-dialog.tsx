'use client'

import { useState } from 'react'
import { 
  Download, 
  FileImage, 
  FileText, 
  Loader2,
  Check,
  Settings,
  ChevronDown
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { cn } from '@/lib/utils'
import type { FrameNode, Template } from '@/types/studio'

// ============================================
// TYPES
// ============================================

export type ExportFormat = 'png' | 'jpg' | 'pdf' | 'svg'

export interface ExportSettings {
  format: ExportFormat
  scale: number // 1x, 2x, 3x, 4x
  quality: number // 0-100 for JPG
  includeBleed: boolean
  bleedSize: number // in mm for print
  colorProfile: 'srgb' | 'cmyk'
}

interface ExportDialogProps {
  template: Template
  onExport: (settings: ExportSettings) => Promise<void>
  children?: React.ReactNode
}

// ============================================
// EXPORT PRESETS
// ============================================

const EXPORT_PRESETS = {
  web: {
    name: 'Web (Redes Sociais)',
    format: 'png' as ExportFormat,
    scale: 1,
    quality: 90,
    includeBleed: false,
    bleedSize: 0,
    colorProfile: 'srgb' as const,
  },
  webRetina: {
    name: 'Web Retina (2x)',
    format: 'png' as ExportFormat,
    scale: 2,
    quality: 90,
    includeBleed: false,
    bleedSize: 0,
    colorProfile: 'srgb' as const,
  },
  print: {
    name: 'Impressão (PDF)',
    format: 'pdf' as ExportFormat,
    scale: 1,
    quality: 100,
    includeBleed: true,
    bleedSize: 3,
    colorProfile: 'cmyk' as const,
  },
  printHighRes: {
    name: 'Impressão Alta Resolução',
    format: 'pdf' as ExportFormat,
    scale: 2,
    quality: 100,
    includeBleed: true,
    bleedSize: 5,
    colorProfile: 'cmyk' as const,
  },
}

// ============================================
// MAIN COMPONENT
// ============================================

export function ExportDialog({ template, onExport, children }: ExportDialogProps) {
  const [open, setOpen] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [exported, setExported] = useState(false)
  const [showAdvanced, setShowAdvanced] = useState(false)
  
  const [settings, setSettings] = useState<ExportSettings>({
    format: 'png',
    scale: 1,
    quality: 90,
    includeBleed: false,
    bleedSize: 3,
    colorProfile: 'srgb',
  })
  
  const handlePresetSelect = (presetKey: keyof typeof EXPORT_PRESETS) => {
    setSettings(EXPORT_PRESETS[presetKey])
  }
  
  const handleExport = async () => {
    setExporting(true)
    setExported(false)
    
    try {
      await onExport(settings)
      setExported(true)
      
      // Auto close after success
      setTimeout(() => {
        setOpen(false)
        setExported(false)
      }, 1500)
    } catch (error) {
      console.error('Export failed:', error)
    } finally {
      setExporting(false)
    }
  }
  
  // Calculate final dimensions
  const finalWidth = Math.round(template.rootNode.size.width * settings.scale)
  const finalHeight = Math.round(template.rootNode.size.height * settings.scale)
  
  // Estimate file size
  const estimateFileSize = () => {
    const pixels = finalWidth * finalHeight
    let bytesPerPixel = 4 // PNG with alpha
    
    if (settings.format === 'jpg') {
      bytesPerPixel = 3 * (settings.quality / 100)
    } else if (settings.format === 'pdf') {
      bytesPerPixel = 0.5 // PDFs are usually well compressed
    }
    
    const bytes = pixels * bytesPerPixel
    if (bytes > 1024 * 1024) {
      return `~${(bytes / (1024 * 1024)).toFixed(1)} MB`
    }
    return `~${(bytes / 1024).toFixed(0)} KB`
  }
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        )}
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Exportar Template</DialogTitle>
          <DialogDescription>
            Configure as opções de exportação para &quot;{template.name}&quot;
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {/* Quick Presets */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Presets rápidos</Label>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(EXPORT_PRESETS).map(([key, preset]) => (
                <button
                  key={key}
                  onClick={() => handlePresetSelect(key as keyof typeof EXPORT_PRESETS)}
                  className={cn(
                    'p-3 rounded-lg border text-left transition-all hover:border-foreground/30',
                    settings.format === preset.format && 
                    settings.scale === preset.scale &&
                    'border-primary bg-primary/5'
                  )}
                >
                  <div className="flex items-center gap-2 mb-1">
                    {preset.format === 'pdf' ? (
                      <FileText className="h-4 w-4" />
                    ) : (
                      <FileImage className="h-4 w-4" />
                    )}
                    <span className="text-sm font-medium">{preset.name}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {preset.format.toUpperCase()} • {preset.scale}x
                  </p>
                </button>
              ))}
            </div>
          </div>
          
          {/* Format Selection */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Formato</Label>
            <RadioGroup
              value={settings.format}
              onValueChange={(value) => setSettings({ ...settings, format: value as ExportFormat })}
              className="flex gap-4"
            >
              {(['png', 'jpg', 'pdf', 'svg'] as const).map((format) => (
                <div key={format} className="flex items-center space-x-2">
                  <RadioGroupItem value={format} id={format} />
                  <Label htmlFor={format} className="text-sm uppercase cursor-pointer">
                    {format}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>
          
          {/* Scale */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Escala</Label>
              <span className="text-sm text-muted-foreground">{settings.scale}x</span>
            </div>
            <Slider
              value={[settings.scale]}
              onValueChange={([value]) => setSettings({ ...settings, scale: value })}
              min={0.5}
              max={4}
              step={0.5}
            />
            <p className="text-xs text-muted-foreground">
              Dimensões finais: {finalWidth} × {finalHeight}px
            </p>
          </div>
          
          {/* JPG Quality */}
          {settings.format === 'jpg' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Qualidade</Label>
                <span className="text-sm text-muted-foreground">{settings.quality}%</span>
              </div>
              <Slider
                value={[settings.quality]}
                onValueChange={([value]) => setSettings({ ...settings, quality: value })}
                min={10}
                max={100}
                step={5}
              />
            </div>
          )}
          
          {/* Advanced Settings */}
          <Collapsible open={showAdvanced} onOpenChange={setShowAdvanced}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="w-full justify-between">
                <span className="flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  Configurações avançadas
                </span>
                <ChevronDown className={cn(
                  'h-4 w-4 transition-transform',
                  showAdvanced && 'rotate-180'
                )} />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-4 space-y-4">
              {/* Bleed for print */}
              {settings.format === 'pdf' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm">Incluir sangria (bleed)</Label>
                    <Switch
                      checked={settings.includeBleed}
                      onCheckedChange={(checked) => setSettings({ ...settings, includeBleed: checked })}
                    />
                  </div>
                  
                  {settings.includeBleed && (
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">
                        Tamanho da sangria: {settings.bleedSize}mm
                      </Label>
                      <Slider
                        value={[settings.bleedSize]}
                        onValueChange={([value]) => setSettings({ ...settings, bleedSize: value })}
                        min={1}
                        max={10}
                        step={1}
                      />
                    </div>
                  )}
                </div>
              )}
              
              {/* Color Profile */}
              <div className="space-y-2">
                <Label className="text-sm">Perfil de cor</Label>
                <Select
                  value={settings.colorProfile}
                  onValueChange={(value) => setSettings({ ...settings, colorProfile: value as 'srgb' | 'cmyk' })}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="srgb">sRGB (Web/Digital)</SelectItem>
                    <SelectItem value="cmyk">CMYK (Impressão)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CollapsibleContent>
          </Collapsible>
          
          {/* Preview info */}
          <div className="bg-muted/50 rounded-lg p-3 text-sm">
            <div className="flex justify-between mb-1">
              <span className="text-muted-foreground">Tamanho estimado:</span>
              <span className="font-medium">{estimateFileSize()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Dimensões:</span>
              <span className="font-medium">{finalWidth} × {finalHeight}px</span>
            </div>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button onClick={handleExport} disabled={exporting || exported}>
            {exporting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Exportando...
              </>
            ) : exported ? (
              <>
                <Check className="h-4 w-4 mr-2" />
                Exportado!
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Exportar {settings.format.toUpperCase()}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ============================================
// EXPORT UTILITY FUNCTIONS
// ============================================

export async function exportToPng(
  canvas: HTMLCanvasElement,
  scale: number = 1
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob)
      } else {
        reject(new Error('Failed to create PNG blob'))
      }
    }, 'image/png')
  })
}

export async function exportToJpg(
  canvas: HTMLCanvasElement,
  quality: number = 0.9
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob)
      } else {
        reject(new Error('Failed to create JPG blob'))
      }
    }, 'image/jpeg', quality)
  })
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export default ExportDialog
