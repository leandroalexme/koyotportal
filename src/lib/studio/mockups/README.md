# Koyot Studio - Módulo de Mockups

Sistema de mockups dinâmicos para visualização de templates em cenários reais.

## Recursos

- **Transformações de Perspectiva (Homografia)**: Mapeia templates para qualquer quadrilátero
- **Renderização GPU**: Usa CanvasKit/Skia para performance via WebGL
- **Camadas com Blend Modes**: Suporte a multiply, overlay, screen, etc.
- **Estado Reativo**: Integração com Zustand para sincronização em tempo real
- **Fallback Canvas2D**: Funciona sem WebGL com aproximação por subdivisão

## Estrutura

```
mockups/
├── types.ts              # Interfaces e tipos
├── perspective-transform.ts # Matemática de homografia
├── mockup-renderer.ts    # Engine de renderização
├── mockup-store.ts       # Estado Zustand
├── presets.ts            # Mockups pré-definidos
├── index.ts              # Exports públicos
└── README.md             # Esta documentação
```

## Uso Básico

### 1. Renderizar um Mockup

```typescript
import { MockupRenderer, businessCardInHandMockup } from '@/lib/studio/mockups'

// Criar renderer (preferindo GPU)
const renderer = new MockupRenderer({ preferCanvasKit: true })
await renderer.ready

// Criar snapshot do template
const templateCanvas = document.createElement('canvas')
// ... renderizar template no canvas ...

const snapshot: TemplateSnapshot = {
  templateId: 'my-template',
  imageData: templateCanvas,
  width: 350,
  height: 200,
  updatedAt: Date.now(),
}

// Renderizar mockup
const templateSnapshots = new Map([[0, snapshot]])
const result = await renderer.render(businessCardInHandMockup, templateSnapshots)

// result.canvas contém o mockup renderizado
document.body.appendChild(result.canvas)

console.log(`Renderizado em ${result.renderTimeMs}ms usando ${result.backend}`)
```

### 2. Usar o Componente React

```tsx
import { MockupViewer } from '@/components/studio/mockup-viewer'
import { businessCardInHandMockup, type TemplateSnapshot } from '@/lib/studio/mockups'

function MyComponent() {
  const [snapshots, setSnapshots] = useState<Map<number, TemplateSnapshot>>(new Map())
  
  const handleDownload = (blob: Blob) => {
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'mockup.png'
    a.click()
  }
  
  return (
    <MockupViewer
      definition={businessCardInHandMockup}
      templateSnapshots={snapshots}
      showControls={true}
      interactive={true}
      onDownload={handleDownload}
    />
  )
}
```

### 3. Usar o Store Zustand

```typescript
import { useMockupStore } from '@/lib/studio/mockups'

function MyComponent() {
  const {
    availableMockups,
    createMockupInstance,
    updateTemplateSnapshot,
    getSelectedMockup,
  } = useMockupStore()
  
  // Criar instância de mockup
  const handleSelectMockup = (definition: MockupDefinition) => {
    const instanceId = createMockupInstance(definition)
    console.log('Mockup criado:', instanceId)
  }
  
  // Atualizar template
  const handleTemplateChange = (snapshot: TemplateSnapshot) => {
    const selected = getSelectedMockup()
    if (selected) {
      updateTemplateSnapshot(selected.id, 0, snapshot)
    }
  }
}
```

## Criar um Mockup Customizado

### Estrutura do MockupDefinition

```typescript
const myCustomMockup: MockupDefinition = {
  id: 'my-custom-mockup',
  name: 'Meu Mockup',
  description: 'Descrição opcional',
  category: 'business-card', // ou 'billboard', 'poster', 'device', etc.
  tags: ['custom', 'exemplo'],
  
  canvasSize: {
    width: 1200,
    height: 800,
  },
  
  layers: {
    base: {
      src: '/mockups/my-mockup/base.jpg',
      opacity: 1,
    },
    overlay: {
      src: '/mockups/my-mockup/shadows.png',
      opacity: 0.5,
      blendMode: 'multiply', // ou 'overlay', 'screen', 'soft-light', 'hard-light'
    },
  },
  
  insertAreas: [
    {
      // 4 pontos que definem onde o template será inserido
      // Ordem: top-left, top-right, bottom-right, bottom-left
      quad: {
        topLeft: { x: 100, y: 100 },
        topRight: { x: 500, y: 120 },
        bottomRight: { x: 520, y: 400 },
        bottomLeft: { x: 80, y: 380 },
      },
      expectedSize: {
        width: 400,
        height: 280,
      },
      rotation: 0,
      opacity: 1,
    },
  ],
  
  thumbnail: '/mockups/my-mockup/thumb.jpg',
}
```

### Como Determinar os Pontos do Quad

1. Abra a imagem base em um editor de imagem (Figma, Photoshop, etc.)
2. Identifique os 4 cantos da área onde o template deve ser inserido
3. Anote as coordenadas (x, y) de cada canto
4. Use essas coordenadas no `quad`

## Transformação de Perspectiva

O módulo usa **homografia** (transformação projetiva 3x3) para mapear o template retangular em qualquer quadrilátero.

### API de Baixo Nível

```typescript
import { 
  rectToQuadMatrix, 
  transformPoint,
  matrixToCanvasKit,
  applyPerspectiveCanvas2D 
} from '@/lib/studio/mockups'

// Calcular matriz de transformação
const matrix = rectToQuadMatrix(
  400, 280, // tamanho do template
  {
    topLeft: { x: 100, y: 100 },
    topRight: { x: 500, y: 120 },
    bottomRight: { x: 520, y: 400 },
    bottomLeft: { x: 80, y: 380 },
  }
)

// Transformar um ponto
const transformed = transformPoint({ x: 200, y: 140 }, matrix)

// Usar com CanvasKit
const ckMatrix = matrixToCanvasKit(matrix)
skCanvas.concat(ckMatrix)
skCanvas.drawImage(templateImage, 0, 0)

// Usar com Canvas2D (aproximação)
applyPerspectiveCanvas2D(ctx, templateImage, 400, 280, quad, 8)
```

## Exportação

```typescript
// Exportar em alta resolução
const blob = await renderer.export(definition, snapshots, {
  format: 'png', // ou 'jpeg', 'webp'
  quality: 0.92, // para jpeg/webp
  scale: 2, // 2x resolução
})

// Criar download
const url = URL.createObjectURL(blob)
const a = document.createElement('a')
a.href = url
a.download = 'mockup-2x.png'
a.click()
URL.revokeObjectURL(url)
```

## Performance

| Backend | FPS Médio | Uso de GPU |
|---------|-----------|------------|
| CanvasKit (WebGL) | 60+ | Sim |
| Canvas2D (fallback) | 30-45 | Não |

### Dicas

- Use `preferCanvasKit: true` para melhor performance
- Limite subdivisões em Canvas2D para cenas simples
- Cache snapshots de templates quando possível
- Use `scale: 1` para preview, `scale: 2+` para exportação final

## Integração com Editor

Para sincronizar templates do editor com mockups em tempo real:

```typescript
import { useEditorStore } from '@/stores/editor-store'
import { useMockupStore } from '@/lib/studio/mockups'

function useMockupSync() {
  const { template } = useEditorStore()
  const { updateTemplateSnapshot, getSelectedMockup } = useMockupStore()
  
  // Debounce para não re-renderizar a cada keystroke
  const debouncedUpdate = useMemo(
    () => debounce((snapshot: TemplateSnapshot) => {
      const mockup = getSelectedMockup()
      if (mockup) {
        updateTemplateSnapshot(mockup.id, 0, snapshot)
      }
    }, 100),
    []
  )
  
  useEffect(() => {
    if (!template) return
    
    // Renderizar template para snapshot
    const canvas = renderTemplateToCanvas(template)
    
    const snapshot: TemplateSnapshot = {
      templateId: template.id,
      imageData: canvas,
      width: template.rootNode.size.width,
      height: template.rootNode.size.height,
      updatedAt: Date.now(),
    }
    
    debouncedUpdate(snapshot)
  }, [template])
}
```
