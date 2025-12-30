'use client'

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, X, Loader2, Sparkles, CheckCircle2, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { uploadAsset, type AssetUploadResult } from '@/services/dam-service'

interface AssetUploadProps {
  brandId: string
  folder?: string
  onUploadComplete?: (result: AssetUploadResult) => void
  onUploadError?: (error: Error) => void
  className?: string
}

interface UploadingFile {
  file: File
  progress: number
  status: 'pending' | 'uploading' | 'tagging' | 'complete' | 'error'
  error?: string
  result?: AssetUploadResult
}

const ACCEPTED_TYPES = {
  'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg'],
  'application/pdf': ['.pdf'],
  'video/*': ['.mp4', '.webm', '.mov'],
  'font/*': ['.ttf', '.otf', '.woff', '.woff2'],
}

const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50MB

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}

export function AssetUpload({
  brandId,
  folder = 'general',
  onUploadComplete,
  onUploadError,
  className,
}: AssetUploadProps) {
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([])
  const [autoTag, setAutoTag] = useState(true)

  const updateFileStatus = useCallback((
    index: number,
    updates: Partial<UploadingFile>
  ) => {
    setUploadingFiles(prev => 
      prev.map((f, i) => i === index ? { ...f, ...updates } : f)
    )
  }, [])

  const processFile = useCallback(async (file: File, index: number) => {
    updateFileStatus(index, { status: 'uploading', progress: 10 })

    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setUploadingFiles(prev => {
          const current = prev[index]
          if (current.status === 'uploading' && current.progress < 60) {
            return prev.map((f, i) => 
              i === index ? { ...f, progress: f.progress + 10 } : f
            )
          }
          return prev
        })
      }, 200)

      updateFileStatus(index, { progress: 30 })

      if (autoTag && file.type.startsWith('image/')) {
        updateFileStatus(index, { status: 'tagging', progress: 60 })
      }

      const result = await uploadAsset({
        brandId,
        file,
        folder,
        autoTag,
      })

      clearInterval(progressInterval)
      updateFileStatus(index, { 
        status: 'complete', 
        progress: 100, 
        result 
      })
      
      onUploadComplete?.(result)
    } catch (error) {
      updateFileStatus(index, { 
        status: 'error', 
        error: error instanceof Error ? error.message : 'Upload failed'
      })
      onUploadError?.(error instanceof Error ? error : new Error('Upload failed'))
    }
  }, [brandId, folder, autoTag, updateFileStatus, onUploadComplete, onUploadError])

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles: UploadingFile[] = acceptedFiles.map(file => ({
      file,
      progress: 0,
      status: 'pending' as const,
    }))

    setUploadingFiles(prev => [...prev, ...newFiles])

    // Start uploading each file
    const startIndex = uploadingFiles.length
    acceptedFiles.forEach((file, i) => {
      processFile(file, startIndex + i)
    })
  }, [uploadingFiles.length, processFile])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ACCEPTED_TYPES,
    maxSize: MAX_FILE_SIZE,
    multiple: true,
  })

  const removeFile = (index: number) => {
    setUploadingFiles(prev => prev.filter((_, i) => i !== index))
  }

  const clearCompleted = () => {
    setUploadingFiles(prev => prev.filter(f => f.status !== 'complete'))
  }

  const hasCompleted = uploadingFiles.some(f => f.status === 'complete')

  return (
    <div className={cn('space-y-4', className)}>
      {/* Dropzone */}
      <div
        {...getRootProps()}
        className={cn(
          'relative cursor-pointer rounded-lg border-2 border-dashed p-8 transition-all',
          'hover:border-foreground/30 hover:bg-muted/50',
          isDragActive && 'border-primary bg-primary/5',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
        )}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center justify-center text-center">
          <div className={cn(
            'mb-4 rounded-full p-4 transition-colors',
            isDragActive ? 'bg-primary/10' : 'bg-muted'
          )}>
            <Upload className={cn(
              'h-8 w-8 transition-colors',
              isDragActive ? 'text-primary' : 'text-muted-foreground'
            )} />
          </div>
          <p className="text-lg font-medium">
            {isDragActive ? 'Solte os arquivos aqui' : 'Arraste arquivos ou clique para upload'}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            PNG, JPG, SVG, PDF, MP4 até 50MB
          </p>
        </div>
      </div>

      {/* Auto-tag toggle */}
      <div className="flex items-center justify-between rounded-lg border bg-muted/30 px-4 py-3">
        <div className="flex items-center gap-3">
          <Sparkles className="h-5 w-5 text-amber-500" />
          <div>
            <Label htmlFor="auto-tag" className="font-medium">
              Auto-tagging com IA
            </Label>
            <p className="text-xs text-muted-foreground">
              Gera tags e descrições automaticamente para imagens
            </p>
          </div>
        </div>
        <Switch
          id="auto-tag"
          checked={autoTag}
          onCheckedChange={setAutoTag}
        />
      </div>

      {/* Upload queue */}
      {uploadingFiles.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">
              Uploads ({uploadingFiles.filter(f => f.status === 'complete').length}/{uploadingFiles.length})
            </p>
            {hasCompleted && (
              <Button variant="ghost" size="sm" onClick={clearCompleted}>
                Limpar concluídos
              </Button>
            )}
          </div>
          
          <div className="max-h-64 space-y-2 overflow-y-auto">
            {uploadingFiles.map((item, index) => (
              <div
                key={`${item.file.name}-${index}`}
                className={cn(
                  'flex items-center gap-3 rounded-lg border p-3',
                  item.status === 'error' && 'border-destructive/50 bg-destructive/5',
                  item.status === 'complete' && 'border-green-500/50 bg-green-500/5'
                )}
              >
                {/* Status icon */}
                <div className="shrink-0">
                  {item.status === 'uploading' && (
                    <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  )}
                  {item.status === 'tagging' && (
                    <Sparkles className="h-5 w-5 animate-pulse text-amber-500" />
                  )}
                  {item.status === 'complete' && (
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                  )}
                  {item.status === 'error' && (
                    <AlertCircle className="h-5 w-5 text-destructive" />
                  )}
                  {item.status === 'pending' && (
                    <div className="h-5 w-5 rounded-full border-2 border-muted-foreground/30" />
                  )}
                </div>

                {/* File info */}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{item.file.name}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{formatFileSize(item.file.size)}</span>
                    {item.status === 'tagging' && (
                      <Badge variant="secondary" className="text-[10px]">
                        <Sparkles className="mr-1 h-3 w-3" />
                        Analisando...
                      </Badge>
                    )}
                    {item.status === 'error' && (
                      <span className="text-destructive">{item.error}</span>
                    )}
                  </div>
                  
                  {/* Progress bar */}
                  {(item.status === 'uploading' || item.status === 'tagging') && (
                    <Progress value={item.progress} className="mt-2 h-1" />
                  )}
                </div>

                {/* Remove button */}
                {(item.status === 'complete' || item.status === 'error') && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 shrink-0"
                    onClick={() => removeFile(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
