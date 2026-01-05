'use client'

import { useState } from 'react'
import { Plus, Database, Sparkles } from 'lucide-react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { CollectionSection } from './collection-section'
import { useVariablesStore } from '@/stores/variables-store'
import { getMockVariablesData } from '@/lib/variables/mock-data'
import type { VariableType } from '@/types/variables'

// ============================================
// TYPES
// ============================================

interface NewVariableForm {
  name: string
  displayName: string
  type: VariableType
  collectionId: string
  initialValue: string
}

const initialForm: NewVariableForm = {
  name: '',
  displayName: '',
  type: 'string',
  collectionId: '',
  initialValue: '',
}

// ============================================
// VARIABLES PANEL
// ============================================

export function VariablesPanel() {
  const { collections, createVariable, createCollection, loadFromData } = useVariablesStore()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [form, setForm] = useState<NewVariableForm>(initialForm)

  const handleLoadMockData = () => {
    loadFromData(getMockVariablesData())
  }

  const handleOpenDialog = (collectionId?: string) => {
    setForm({
      ...initialForm,
      collectionId: collectionId || collections[0]?.id || '',
    })
    setIsDialogOpen(true)
  }

  const handleCreateVariable = () => {
    if (!form.name || !form.displayName || !form.collectionId) return

    createVariable({
      name: form.name.toLowerCase().replace(/\s+/g, '_'),
      displayName: form.displayName,
      type: form.type,
      collectionId: form.collectionId,
      initialValue: form.initialValue || null,
    })

    setIsDialogOpen(false)
    setForm(initialForm)
  }

  const handleCreateCollection = () => {
    const name = prompt('Nome da coleção:')
    if (name) {
      createCollection(name)
    }
  }

  // Initialize default collections if empty
  if (collections.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6 text-center">
        <Database className="size-10 text-muted-foreground mb-4" />
        <h3 className="text-sm font-medium mb-2">
          Nenhuma variável ainda
        </h3>
        <p className="text-xs text-muted-foreground mb-4">
          Crie variáveis para centralizar textos, cores e imagens do seu template.
        </p>
        <div className="space-y-2">
          <Button size="sm" onClick={handleLoadMockData} variant="default">
            <Sparkles className="size-4 mr-2" />
            Carregar Exemplos
          </Button>
          <Button size="sm" onClick={handleCreateCollection} variant="outline" className="w-full">
            <Plus className="size-4 mr-2" />
            Criar Coleção
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-3 border-b">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium">Variáveis</h3>
          <Button
            variant="ghost"
            size="icon"
            className="size-7"
            onClick={() => handleOpenDialog()}
          >
            <Plus className="size-4" />
          </Button>
        </div>
        
        {/* Info banner */}
        <div className="p-2 rounded-md bg-violet-500/10 border border-violet-500/20">
          <div className="flex items-start gap-2">
            <Sparkles className="size-3.5 text-violet-600 shrink-0 mt-0.5" />
            <p className="text-[10px] text-violet-700">
              Alterações em variáveis atualizam todos os elementos linkados.
            </p>
          </div>
        </div>
      </div>

      {/* Collections */}
      <ScrollArea className="flex-1 [&_[data-radix-scroll-area-scrollbar]]:w-1.5 [&_[data-radix-scroll-area-thumb]]:bg-zinc-200 [&_[data-radix-scroll-area-thumb]]:rounded-full">
        <div className="py-2">
          {collections.map((collection) => (
            <CollectionSection
              key={collection.id}
              collection={collection}
              onAddVariable={handleOpenDialog}
            />
          ))}
        </div>
      </ScrollArea>

      {/* Footer */}
      <div className="p-3 border-t">
        <Button
          variant="outline"
          size="sm"
          className="w-full text-xs"
          onClick={handleCreateCollection}
        >
          <Plus className="size-3.5 mr-2" />
          Nova Coleção
        </Button>
      </div>

      {/* Create Variable Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Nova Variável</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="displayName">Nome</Label>
              <Input
                id="displayName"
                value={form.displayName}
                onChange={(e) => setForm({ 
                  ...form, 
                  displayName: e.target.value,
                  name: e.target.value.toLowerCase().replace(/\s+/g, '_'),
                })}
                placeholder="Ex: Título Principal"
              />
              <p className="text-[10px] text-muted-foreground">
                ID: {form.name || 'titulo_principal'}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Tipo</Label>
              <Select
                value={form.type}
                onValueChange={(value) => setForm({ ...form, type: value as VariableType })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="string">Texto</SelectItem>
                  <SelectItem value="number">Número</SelectItem>
                  <SelectItem value="color">Cor</SelectItem>
                  <SelectItem value="image">Imagem</SelectItem>
                  <SelectItem value="boolean">Sim/Não</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="collection">Coleção</Label>
              <Select
                value={form.collectionId}
                onValueChange={(value) => setForm({ ...form, collectionId: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {collections.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="initialValue">Valor Inicial</Label>
              <Input
                id="initialValue"
                value={form.initialValue}
                onChange={(e) => setForm({ ...form, initialValue: e.target.value })}
                placeholder={form.type === 'color' ? '#000000' : 'Digite o valor...'}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreateVariable}>
              Criar Variável
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
