# Koyot Mockup Engine V2 - Arquitetura

## Visão Geral

Sistema profissional de geração de mockups com suporte a **PSD com Smart Objects**, similar ao Mockuuups Studio e Dynamic Mockups.

## Stack Tecnológico

| Componente | Tecnologia | Motivo |
|------------|------------|--------|
| **PSD Parser** | `ag-psd` | Leitura/escrita de PSD, suporte a Smart Objects |
| **Render Engine** | `CanvasKit (Skia WASM)` | GPU acceleration, WebGL, alta qualidade |
| **Perspective Transform** | `SkMatrix.setPolyToPoly()` | Homografia nativa do Skia, precisão profissional |
| **Image Processing** | `sharp` (server) / CanvasKit (client) | Composição de alta performance |
| **Storage** | Supabase Storage | Armazenamento de PSDs e mockups gerados |
| **Cache** | In-memory + IndexedDB | Cache de PSDs parseados e imagens |

### Por que CanvasKit/Skia?

1. **GPU Acceleration** - Renderização via WebGL, muito mais rápido que Canvas 2D
2. **setPolyToPoly()** - Transformação de perspectiva nativa e precisa
3. **Blend Modes Profissionais** - Todos os blend modes do Photoshop
4. **Anti-aliasing de Alta Qualidade** - Bordas suaves em transformações
5. **Consistência** - Mesmo motor gráfico do Chrome, Flutter e Android

---

## Arquitetura de Módulos

```
/src/lib/studio/mockup-engine/
├── core/
│   ├── psd-parser.ts           # Parser de PSD usando ag-psd
│   ├── smart-object.ts         # Manipulação de Smart Objects
│   ├── layer-compositor.ts     # Composição de camadas
│   └── types.ts                # Tipos TypeScript
│
├── transform/
│   ├── perspective.ts          # Transformações de perspectiva
│   ├── warp.ts                 # Distorções (envelope, mesh)
│   └── affine.ts               # Transformações afins
│
├── render/
│   ├── canvaskit-renderer.ts   # Renderização GPU via CanvasKit/Skia
│   ├── perspective-skia.ts     # Perspectiva com SkMatrix.setPolyToPoly
│   ├── blend-modes.ts          # Mapeamento de blend modes PSD → Skia
│   └── compositor.ts           # Composição final de camadas
│
├── storage/
│   ├── psd-storage.ts          # Upload/download de PSDs
│   ├── cache.ts                # Cache de PSDs parseados
│   └── export.ts               # Exportação (PNG, JPG, WebP)
│
├── api/
│   ├── mockup-service.ts       # Serviço principal
│   └── presets.ts              # Mockups pré-configurados
│
└── index.ts                    # Exports públicos
```

---

## Fluxo de Dados

```
┌─────────────────────────────────────────────────────────────────┐
│                        UPLOAD DE PSD                             │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  1. PSD PARSER                                                   │
│  ─────────────────────────────────────────────────────────────  │
│  • Parse PSD com ag-psd                                         │
│  • Extrair metadados de layers                                  │
│  • Identificar Smart Objects                                     │
│  • Extrair transformações (posição, rotação, escala, warp)      │
│  • Gerar MockupTemplate JSON                                     │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  2. SMART OBJECT DETECTION                                       │
│  ─────────────────────────────────────────────────────────────  │
│  • Identificar layers do tipo "Smart Object"                    │
│  • Extrair bounds (x, y, width, height)                         │
│  • Extrair matriz de transformação                               │
│  • Identificar pontos de perspectiva (se houver warp)           │
│  • Mapear para "insertAreas" no template                         │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  3. TEMPLATE STORAGE                                             │
│  ─────────────────────────────────────────────────────────────  │
│  • Salvar PSD original no Supabase Storage                      │
│  • Salvar JSON de metadados (MockupTemplate)                    │
│  • Gerar thumbnail para preview                                  │
│  • Indexar para busca                                            │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    GERAÇÃO DE MOCKUP                             │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  4. USER INPUT                                                   │
│  ─────────────────────────────────────────────────────────────  │
│  • Usuário seleciona mockup template                            │
│  • Usuário fornece imagem do design                              │
│  • Opcionalmente: ajustes de cor, brilho, etc.                  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  5. PERSPECTIVE TRANSFORM                                        │
│  ─────────────────────────────────────────────────────────────  │
│  • Calcular matriz de homografia (4 pontos → 4 pontos)          │
│  • Aplicar transformação de perspectiva no design               │
│  • Preservar proporções e qualidade                              │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  6. LAYER COMPOSITION                                            │
│  ─────────────────────────────────────────────────────────────  │
│  • Renderizar camadas na ordem correta                          │
│  • Aplicar blend modes (multiply, overlay, etc.)                │
│  • Aplicar máscaras e clipping                                   │
│  • Aplicar efeitos (sombras, brilhos)                           │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  7. EXPORT                                                       │
│  ─────────────────────────────────────────────────────────────  │
│  • Exportar como PNG, JPG ou WebP                               │
│  • Múltiplas resoluções (1x, 2x, 4K, 8K)                        │
│  • Otimização de tamanho                                         │
└─────────────────────────────────────────────────────────────────┘
```

---

## Tipos TypeScript

```typescript
// Representação de um Smart Object extraído do PSD
interface SmartObjectLayer {
  id: string
  name: string
  bounds: {
    left: number
    top: number
    right: number
    bottom: number
  }
  transform: {
    // Matriz 2x3 de transformação afim
    xx: number  // scale x
    xy: number  // skew y
    yx: number  // skew x
    yy: number  // scale y
    tx: number  // translate x
    ty: number  // translate y
  }
  // Pontos de perspectiva (se warp aplicado)
  perspectiveQuad?: {
    topLeft: { x: number; y: number }
    topRight: { x: number; y: number }
    bottomRight: { x: number; y: number }
    bottomLeft: { x: number; y: number }
  }
  // Conteúdo original do Smart Object
  placedContent?: {
    width: number
    height: number
    type: 'embedded' | 'linked'
  }
  blendMode: string
  opacity: number
  visible: boolean
}

// Template de Mockup gerado a partir do PSD
interface MockupTemplate {
  id: string
  name: string
  description: string
  category: MockupCategory
  tags: string[]
  
  // Dimensões do canvas
  canvasSize: {
    width: number
    height: number
  }
  
  // Camadas do PSD
  layers: {
    id: string
    name: string
    type: 'image' | 'smartObject' | 'text' | 'shape' | 'group'
    zIndex: number
    visible: boolean
    opacity: number
    blendMode: string
    bounds: Bounds
    // Dados de imagem (base64 ou URL)
    imageData?: string
  }[]
  
  // Áreas onde o design será inserido (Smart Objects)
  insertAreas: SmartObjectLayer[]
  
  // Metadados
  metadata: {
    psdPath: string
    originalFilename: string
    createdAt: string
    version: number
  }
}

// Requisição de renderização
interface RenderRequest {
  templateId: string
  designs: {
    smartObjectId: string
    imageUrl: string
    // Ajustes opcionais
    adjustments?: {
      brightness?: number
      contrast?: number
      saturation?: number
    }
  }[]
  output: {
    format: 'png' | 'jpg' | 'webp'
    quality?: number // 1-100
    scale?: number   // 1, 2, 4 (multiplier)
  }
}

// Resultado da renderização
interface RenderResult {
  success: boolean
  imageUrl?: string
  imageBase64?: string
  width: number
  height: number
  renderTimeMs: number
}
```

---

## Dependências

```json
{
  "dependencies": {
    "ag-psd": "^18.0.0",
    "sharp": "^0.33.0"
  }
}
```

---

## Fases de Implementação

### Fase 1: Core PSD Parser (2-3 dias)
- [ ] Implementar `psd-parser.ts` usando ag-psd
- [ ] Extrair metadados de layers
- [ ] Identificar Smart Objects
- [ ] Extrair transformações e bounds
- [ ] Testes unitários

### Fase 2: Smart Object Engine (2-3 dias)
- [ ] Implementar `smart-object.ts`
- [ ] Substituição de conteúdo de Smart Objects
- [ ] Preservar transformações
- [ ] Suporte a múltiplos Smart Objects
- [ ] Testes unitários

### Fase 3: Perspective Transform (2-3 dias)
- [ ] Implementar `perspective.ts`
- [ ] Matriz de homografia 3x3
- [ ] Transformação de 4 pontos
- [ ] Suporte a warp do Photoshop
- [ ] Testes visuais

### Fase 4: Composition Engine (2-3 dias)
- [ ] Implementar `compositor.ts`
- [ ] Composição de camadas
- [ ] Blend modes
- [ ] Máscaras e clipping
- [ ] Exportação multi-formato

### Fase 5: Storage & API (2 dias)
- [ ] Upload de PSDs para Supabase
- [ ] Cache de templates parseados
- [ ] API de renderização
- [ ] Rate limiting

### Fase 6: UI Components (2-3 dias)
- [ ] MockupGallery - navegação de templates
- [ ] MockupEditor - preview e ajustes
- [ ] MockupUploader - upload de PSDs
- [ ] Integração com editor existente

### Fase 7: Otimização & Polish (2 dias)
- [ ] Performance optimization
- [ ] Error handling robusto
- [ ] Documentação
- [ ] Testes E2E

---

## Estimativa Total: 14-19 dias de desenvolvimento

---

## CanvasKit Perspective Transform

### Como funciona o `setPolyToPoly()`

O Skia oferece `SkMatrix.setPolyToPoly()` que calcula automaticamente a matriz de transformação para mapear 4 pontos de origem para 4 pontos de destino - exatamente o que precisamos para mockups com perspectiva.

```typescript
// Exemplo de uso
const ck = getCanvasKit()

// Pontos do design original (retângulo)
const srcPoints = [
  0, 0,           // top-left
  width, 0,       // top-right
  width, height,  // bottom-right
  0, height       // bottom-left
]

// Pontos de destino no mockup (quadrilátero com perspectiva)
const dstPoints = [
  quad.topLeft.x, quad.topLeft.y,
  quad.topRight.x, quad.topRight.y,
  quad.bottomRight.x, quad.bottomRight.y,
  quad.bottomLeft.x, quad.bottomLeft.y
]

// Criar matriz de transformação
const matrix = ck.Matrix.identity()
ck.Matrix.setPolyToPoly(matrix, srcPoints, dstPoints, 4)

// Aplicar ao canvas
canvas.concat(matrix)
canvas.drawImage(designImage, 0, 0)
```

### Vantagens sobre Canvas 2D

| Aspecto | Canvas 2D | CanvasKit/Skia |
|---------|-----------|----------------|
| Perspectiva | Aproximação por subdivisão | Nativo, preciso |
| Performance | CPU bound | GPU accelerated |
| Qualidade | Artefatos em ângulos extremos | Anti-aliasing de alta qualidade |
| Blend Modes | Limitado | Todos do Photoshop |

---

## Próximos Passos

1. **Aprovar arquitetura** - Revisar e ajustar se necessário
2. **Criar estrutura de pastas** - Setup inicial do módulo
3. **Implementar Fase 1** - PSD Parser core
4. **Iteração** - Testar com PSDs reais e ajustar

---

## Referências

- [ag-psd](https://github.com/Agamnentzar/ag-psd) - Biblioteca de parsing PSD
- [sharp](https://sharp.pixelplumbing.com/) - Processamento de imagens Node.js
- [Dynamic Mockups API](https://docs.dynamicmockups.com/) - Referência de API
- [Mockuuups Studio](https://mockuuups.studio/) - Referência de UX
