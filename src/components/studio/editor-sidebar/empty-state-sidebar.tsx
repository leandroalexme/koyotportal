'use client'

import { 
  MousePointer2, 
  Layers, 
  Sparkles, 
  Type, 
  Image, 
  Square, 
  LayoutGrid,
  Keyboard,
} from 'lucide-react'
import { SidebarFooter } from './components'

// ============================================
// TYPES
// ============================================

interface QuickTip {
  icon: React.ReactNode
  title: string
  description: string
}

// ============================================
// CONSTANTS
// ============================================

const QUICK_TIPS: QuickTip[] = [
  {
    icon: <Layers className="size-4" />,
    title: 'Layers',
    description: 'Use a árvore à esquerda para navegar',
  },
  {
    icon: <Type className="size-4" />,
    title: 'Textos',
    description: 'Clique em textos para editar o conteúdo',
  },
  {
    icon: <Image className="size-4" />,
    title: 'Imagens',
    description: 'Arraste imagens do DAM para o canvas',
  },
  {
    icon: <Keyboard className="size-4" />,
    title: 'Atalhos',
    description: 'Ctrl+Z para desfazer, Ctrl+S para salvar',
  },
]

const ELEMENT_TYPES = [
  { icon: <Type className="size-4" />, label: 'Texto', color: 'bg-blue-500/10 text-blue-600' },
  { icon: <Image className="size-4" />, label: 'Imagem', color: 'bg-green-500/10 text-green-600' },
  { icon: <Square className="size-4" />, label: 'Forma', color: 'bg-purple-500/10 text-purple-600' },
  { icon: <LayoutGrid className="size-4" />, label: 'Frame', color: 'bg-orange-500/10 text-orange-600' },
]

// ============================================
// EMPTY STATE SIDEBAR
// ============================================

export function EmptyStateSidebar() {
  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="px-6 py-5">
        <h3 className="text-base font-medium">Visão Geral</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Selecione um elemento para editar
        </p>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        <div className="px-6 py-5 space-y-8">
          {/* Empty State Illustration */}
          <div className="flex flex-col items-center text-center py-6">
            <div className="size-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <MousePointer2 className="size-7 text-muted-foreground" />
            </div>
            <h4 className="text-sm font-medium mb-2">
              Nenhum elemento selecionado
            </h4>
            <p className="text-xs text-muted-foreground leading-relaxed max-w-[200px]">
              Clique em um elemento no canvas ou na árvore de layers para editar suas propriedades.
            </p>
          </div>

          {/* Element Types */}
          <section>
            <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
              Tipos de Elementos
            </h4>
            <div className="grid grid-cols-2 gap-2">
              {ELEMENT_TYPES.map((type) => (
                <div 
                  key={type.label}
                  className={`flex items-center gap-2 p-3 rounded-lg ${type.color}`}
                >
                  {type.icon}
                  <span className="text-xs font-medium">{type.label}</span>
                </div>
              ))}
            </div>
          </section>

          {/* Quick Tips */}
          <section>
            <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
              Dicas Rápidas
            </h4>
            <div className="space-y-2">
              {QUICK_TIPS.map((tip) => (
                <div 
                  key={tip.title}
                  className="flex items-start gap-3 p-3 rounded-lg bg-muted/50"
                >
                  <div className="text-muted-foreground shrink-0 mt-0.5">
                    {tip.icon}
                  </div>
                  <div>
                    <p className="text-xs font-medium">{tip.title}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {tip.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* AI Suggestion */}
          <section className="p-4 rounded-lg bg-gradient-to-br from-violet-500/10 to-purple-500/10 border border-violet-500/20">
            <div className="flex items-start gap-3">
              <Sparkles className="size-5 text-violet-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-medium text-violet-900">Sugestão com IA</p>
                <p className="text-[10px] text-violet-700 mt-1">
                  Selecione um texto e clique em "Sugerir com IA" para gerar variações automáticas.
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>

      {/* Footer */}
      <SidebarFooter />
    </div>
  )
}
