'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { initTemplateDB, saveTemplate } from '@/lib/studio/template-db'
import type { Template, TemplateFonts } from '@/types/studio'

interface ImportedTemplate {
  id: string
  name: string
  description?: string
  thumbnail?: string
  rootNode: Template['rootNode']
  createdAt?: string
  fonts?: TemplateFonts
}

export default function PluginImportPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<'loading' | 'fonts' | 'saving' | 'success' | 'error'>('loading')
  const [error, setError] = useState<string | null>(null)
  const [templateId, setTemplateId] = useState<string | null>(null)
  const [template, setTemplate] = useState<ImportedTemplate | null>(null)
  const [useOriginalFonts, setUseOriginalFonts] = useState(true)

  // Fetch template on mount
  useEffect(() => {
    async function fetchTemplate() {
      try {
        const tid = searchParams.get('templateId')
        
        if (!tid) {
          setError('No template ID provided')
          setStatus('error')
          return
        }

        // Fetch template from server
        const response = await fetch(`/api/figma/plugin-import?templateId=${tid}`)
        
        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Failed to fetch template')
        }
        
        const { template: fetchedTemplate } = await response.json()
        
        console.log('[Plugin Import] Received template:', fetchedTemplate.id, fetchedTemplate.name)
        console.log('[Plugin Import] Fonts:', fetchedTemplate.fonts)

        setTemplate(fetchedTemplate)
        
        // Se tem fontes, mostrar step de configuração
        if (fetchedTemplate.fonts && 
            (fetchedTemplate.fonts.googleFonts?.length > 0 || fetchedTemplate.fonts.customFonts?.length > 0)) {
          setStatus('fonts')
        } else {
          // Sem fontes, salvar direto
          await saveTemplateToDb(fetchedTemplate)
        }

      } catch (err) {
        console.error('[Plugin Import] Error:', err)
        setError(String(err))
        setStatus('error')
      }
    }

    fetchTemplate()
  }, [searchParams])

  // Função para salvar o template
  async function saveTemplateToDb(tmpl: ImportedTemplate) {
    try {
      setStatus('saving')
      
      // Initialize the database
      await initTemplateDB()

      // Preparar fontes finais
      const finalFonts = useOriginalFonts 
        ? tmpl.fonts 
        : tmpl.fonts ? {
            ...tmpl.fonts,
            customFonts: [], // Não importar fontes customizadas
          } : undefined

      // Save the template to IndexedDB
      await saveTemplate(
        tmpl.id,
        'default', // Use default brand for now
        {
          id: tmpl.id,
          brandId: 'default',
          name: tmpl.name,
          description: tmpl.description || '',
          category: 'other',
          format: 'custom',
          thumbnailUrl: tmpl.thumbnail || '',
          rootNode: tmpl.rootNode,
          schemaVersion: 1,
          tags: ['figma', 'imported'],
          isPublic: false,
          aiGenerated: false,
          createdAt: tmpl.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          createdBy: 'plugin',
          fonts: finalFonts,
        }
      )

      console.log('[Plugin Import] Template saved to IndexedDB:', tmpl.id)
      
      setTemplateId(tmpl.id)
      setStatus('success')

      // Redirect to editor after a short delay
      setTimeout(() => {
        router.push(`/default/templates/editor/${tmpl.id}`)
      }, 1500)

    } catch (err) {
      console.error('[Plugin Import] Save error:', err)
      setError(String(err))
      setStatus('error')
    }
  }

  // Handler para confirmar fontes
  const handleConfirmFonts = () => {
    if (template) {
      saveTemplateToDb(template)
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <div className="bg-gray-800 rounded-xl p-8 max-w-md w-full mx-4 text-center">
        <div className="mb-6">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-purple-600 flex items-center justify-center">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Koyot Plugin Import</h1>
        </div>

        {(status === 'loading' || status === 'saving') && (
          <div>
            <div className="animate-spin w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-300">
              {status === 'loading' ? 'Importing your design...' : 'Saving template...'}
            </p>
          </div>
        )}

        {status === 'fonts' && template?.fonts && (
          <div className="text-left">
            <h2 className="text-lg font-semibold text-white mb-4">Fontes Detectadas</h2>
            
            {/* Google Fonts */}
            {template.fonts.googleFonts.length > 0 && (
              <div className="mb-4">
                <p className="text-sm text-green-400 mb-2 flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Google Fonts ({template.fonts.googleFonts.length})
                </p>
                <div className="flex flex-wrap gap-2">
                  {template.fonts.googleFonts.map(f => (
                    <span key={f.family} className="px-2 py-1 text-xs rounded bg-green-900/50 text-green-300">
                      {f.family}
                    </span>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-1">Carregadas via Google Fonts CDN</p>
              </div>
            )}

            {/* Custom Fonts */}
            {template.fonts.customFonts.length > 0 && (
              <div className="mb-4">
                <p className="text-sm text-amber-400 mb-2 flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  Fontes Customizadas ({template.fonts.customFonts.length})
                </p>
                <div className="flex flex-wrap gap-2">
                  {template.fonts.customFonts.map(f => (
                    <span key={f} className="px-2 py-1 text-xs rounded bg-amber-900/50 text-amber-300">
                      {f}
                    </span>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-1">Não disponíveis no Google Fonts</p>
              </div>
            )}

            {/* Toggle para usar fontes originais */}
            <div className="bg-gray-700/50 rounded-lg p-4 mb-4">
              <label className="flex items-center justify-between cursor-pointer">
                <div>
                  <p className="text-sm font-medium text-white">Usar fontes originais</p>
                  <p className="text-xs text-gray-400">
                    {useOriginalFonts 
                      ? 'Fontes do design serão mantidas' 
                      : 'Fontes customizadas serão substituídas'}
                  </p>
                </div>
                <div 
                  className={`relative w-11 h-6 rounded-full transition-colors ${useOriginalFonts ? 'bg-purple-600' : 'bg-gray-600'}`}
                  onClick={() => setUseOriginalFonts(!useOriginalFonts)}
                >
                  <div 
                    className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform ${useOriginalFonts ? 'translate-x-5' : 'translate-x-0.5'}`}
                  />
                </div>
              </label>
            </div>

            {/* Botão de confirmar */}
            <button
              onClick={handleConfirmFonts}
              className="w-full py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition font-medium"
            >
              Confirmar e Continuar
            </button>
          </div>
        )}

        {status === 'success' && (
          <div>
            <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-green-500 flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-green-400 font-medium mb-2">Import successful!</p>
            <p className="text-gray-400 text-sm">Redirecting to editor...</p>
            {templateId && (
              <p className="text-gray-500 text-xs mt-2">Template ID: {templateId}</p>
            )}
          </div>
        )}

        {status === 'error' && (
          <div>
            <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-red-500 flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <p className="text-red-400 font-medium mb-2">Import failed</p>
            <p className="text-gray-400 text-sm">{error}</p>
            <button
              onClick={() => window.close()}
              className="mt-4 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition"
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
