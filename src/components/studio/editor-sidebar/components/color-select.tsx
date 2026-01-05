'use client'

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

// ============================================
// TYPES
// ============================================

export interface BrandColor {
  id: string
  name: string
  value: string
}

interface ColorSelectProps {
  value: string
  colors: BrandColor[]
  onChange: (color: BrandColor) => void
  disabled?: boolean
}

// ============================================
// HELPER
// ============================================

function findBrandColorByValue(colors: BrandColor[], value: string): BrandColor | undefined {
  return colors.find(c => c.value.toLowerCase() === value.toLowerCase())
}

// ============================================
// COLOR SELECT
// ============================================

export function ColorSelect({ value, colors, onChange, disabled }: ColorSelectProps) {
  const selectedBrandColor = findBrandColorByValue(colors, value) || colors[0]
  
  return (
    <Select 
      value={selectedBrandColor?.id} 
      onValueChange={(id) => {
        const color = colors.find(c => c.id === id)
        if (color) onChange(color)
      }}
      disabled={disabled}
    >
      <SelectTrigger className="w-full h-10 bg-muted/50 border-0">
        <div className="flex items-center gap-3">
          <span 
            className="size-5 rounded-md border shrink-0" 
            style={{ backgroundColor: selectedBrandColor?.value }} 
          />
          <span>{selectedBrandColor?.name}</span>
        </div>
      </SelectTrigger>
      <SelectContent>
        {colors.map((color) => (
          <SelectItem key={color.id} value={color.id}>
            <div className="flex items-center gap-3">
              <span 
                className="size-5 rounded-md border shrink-0" 
                style={{ backgroundColor: color.value }} 
              />
              <span>{color.name}</span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
