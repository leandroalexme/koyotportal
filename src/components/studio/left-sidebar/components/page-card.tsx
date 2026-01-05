'use client'

import { cn } from '@/lib/utils'

// ============================================
// TYPES
// ============================================

export interface PageData {
  id: string
  name: string
  thumbnail?: string
  width: number
  height: number
  isVisible: boolean
  isEdited?: boolean
  format?: string
}

interface PageCardProps {
  page: PageData
  isSelected: boolean
  onSelect: (pageId: string) => void
}

// ============================================
// PAGE CARD COMPONENT
// Container fixo com preview proporcional interno
// ============================================

export function PageCard({ 
  page, 
  isSelected, 
  onSelect, 
}: PageCardProps) {
  // Calcular proporção para o preview interno
  const aspectRatio = page.width / page.height
  
  // Determinar dimensões do preview interno mantendo proporção
  const getPreviewStyle = () => {
    const containerAspect = 4 / 3
    
    if (aspectRatio > containerAspect) {
      return { width: '90%', height: 'auto', aspectRatio: String(aspectRatio) }
    } else {
      return { width: 'auto', height: '85%', aspectRatio: String(aspectRatio) }
    }
  }

  return (
    <div 
      className="group cursor-pointer"
      onClick={() => onSelect(page.id)}
    >
      {/* Container com seleção apenas no preview */}
      <div className={cn(
        "aspect-[4/3] bg-muted rounded-lg flex items-center justify-center overflow-hidden transition-all",
        isSelected && "ring-2 ring-foreground ring-offset-2"
      )}>
        {page.thumbnail ? (
          <img 
            src={page.thumbnail} 
            alt={page.name}
            className="max-w-[90%] max-h-[85%] object-contain rounded shadow-sm"
            style={getPreviewStyle()}
          />
        ) : (
          <div 
            className="bg-zinc-800 rounded shadow-sm flex items-center justify-center"
            style={getPreviewStyle()}
          >
            <div className="p-3 space-y-1.5">
              <div className="h-1.5 w-10 bg-zinc-600 rounded" />
              <div className="h-1 w-6 bg-zinc-700 rounded" />
              <div className="h-1 w-8 bg-zinc-700 rounded" />
            </div>
          </div>
        )}
      </div>
      
      {/* Nome da página - fora da seleção */}
      <p className={cn(
        "text-sm mt-2 truncate",
        isSelected ? "text-foreground font-medium" : "text-muted-foreground"
      )}>
        {page.name}
      </p>
    </div>
  )
}
