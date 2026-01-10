'use client'

/**
 * Admin - Mockup Editor Page
 * 
 * Página para criar e editar definições de mockups.
 * Permite fazer upload de imagens e definir os 4 pontos de perspectiva.
 */

import { useState } from 'react'
import { MockupDefinitionEditor } from '@/components/studio/mockup-editor'
import type { MockupDefinition } from '@/lib/studio/mockups'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, Plus, Trash2 } from 'lucide-react'
import Link from 'next/link'

export default function MockupEditorPage() {
  const [savedMockups, setSavedMockups] = useState<MockupDefinition[]>([])
  const [editingMockup, setEditingMockup] = useState<MockupDefinition | null>(null)
  
  const handleSave = (definition: MockupDefinition) => {
    setSavedMockups((prev) => {
      const existing = prev.findIndex((m) => m.id === definition.id)
      if (existing >= 0) {
        const updated = [...prev]
        updated[existing] = definition
        return updated
      }
      return [...prev, definition]
    })
    setEditingMockup(null)
    
    // Log para debug
    console.log('Mockup salvo:', definition)
    console.log('JSON para presets.ts:')
    console.log(JSON.stringify(definition, null, 2))
  }
  
  const handleDelete = (id: string) => {
    setSavedMockups((prev) => prev.filter((m) => m.id !== id))
  }
  
  return (
    <div className="container mx-auto px-6 py-8">
      {/* Header */}
      <div className="mb-8">
        <Link href="/admin" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="h-4 w-4 mr-1" />
          Voltar para Admin
        </Link>
        <h1 className="text-3xl font-bold tracking-tight">Editor de Mockups</h1>
        <p className="mt-2 text-muted-foreground">
          Crie e edite definições de mockups para o sistema de Visual Identity
        </p>
      </div>
      
      {/* Editor ou Lista */}
      {editingMockup !== null || savedMockups.length === 0 ? (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">
              {editingMockup ? 'Editando Mockup' : 'Novo Mockup'}
            </h2>
            {editingMockup && (
              <Button variant="outline" onClick={() => setEditingMockup(null)}>
                Cancelar
              </Button>
            )}
          </div>
          
          <MockupDefinitionEditor
            initialDefinition={editingMockup ?? undefined}
            onSave={handleSave}
          />
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Mockups Salvos ({savedMockups.length})</h2>
            <Button onClick={() => setEditingMockup(null)}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Mockup
            </Button>
          </div>
          
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {savedMockups.map((mockup) => (
              <Card key={mockup.id} className="overflow-hidden">
                <div className="aspect-video bg-muted relative">
                  {mockup.layers.base.src && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={mockup.layers.base.src}
                      alt={mockup.name}
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">{mockup.name}</CardTitle>
                  <CardDescription className="text-xs">
                    {mockup.category} • {mockup.canvasSize.width}×{mockup.canvasSize.height}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => setEditingMockup(mockup)}
                    >
                      Editar
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(mockup.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          
          {/* Instruções */}
          <Card className="mt-8">
            <CardHeader>
              <CardTitle className="text-lg">Como usar</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-muted-foreground">
              <ol className="list-decimal list-inside space-y-2">
                <li>Faça upload da imagem base do mockup (foto real do cenário)</li>
                <li>Arraste os 4 pontos para definir onde o template será inserido</li>
                <li>Opcionalmente, adicione uma camada de overlay (sombras/luz)</li>
                <li>Configure o blend mode e opacidade do overlay</li>
                <li>Copie o JSON gerado e adicione ao arquivo <code className="bg-muted px-1 rounded">presets.ts</code></li>
              </ol>
              
              <div className="bg-muted p-4 rounded-lg">
                <p className="font-medium text-foreground mb-2">Dica: Estrutura de arquivos</p>
                <pre className="text-xs">
{`/public/mockups/[mockup-id]/
├── base.jpg      # Imagem de fundo
├── overlay.png   # Camada de sombras (transparente)
└── thumb.jpg     # Thumbnail para preview`}
                </pre>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
