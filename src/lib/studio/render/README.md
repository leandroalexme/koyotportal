# Koyot Studio - Render Module

Este módulo fornece uma camada de abstração para renderização 2D, suportando dois backends:

- **Canvas2D** - Backend padrão, compatibilidade universal
- **CanvasKit (Skia)** - Backend GPU acelerado via WebGL

## Instalação

A dependência `canvaskit-wasm` já está instalada no projeto.

## Uso Básico

```typescript
import { createRenderContext, type IRenderContext } from '@/lib/studio/render'

// Criar contexto de renderização (auto-detecta melhor backend)
const { context, backend } = await createRenderContext(canvasElement)

console.log(`Usando backend: ${backend}`) // 'webgl' ou 'canvas2d'

// Usar o contexto como Canvas2D padrão
context.fillStyle = '#ff0000'
context.fillRect(0, 0, 100, 100)

// IMPORTANTE: Para CanvasKit, sempre chamar flush() no final
context.flush()
```

## Forçar Backend Específico

```typescript
// Forçar Canvas2D
const { context } = await createRenderContext(canvasElement, {
  forceBackend: 'canvas2d'
})

// Forçar CanvasKit (WebGL)
const { context } = await createRenderContext(canvasElement, {
  forceBackend: 'webgl'
})
```

## Usando CanvasEngineV2

Para integração completa com o editor:

```typescript
import { CanvasEngineV2 } from '@/lib/studio/canvas-engine-v2'

const engine = new CanvasEngineV2({
  canvas: canvasElement,
  container: containerElement,
  rootNode: templateRootNode,
  backend: 'canvaskit', // ou 'canvas2d'
  onReady: (backend) => {
    console.log(`Engine pronto com backend: ${backend}`)
  }
})

// Aguardar inicialização
await engine.ready

// Verificar backend
if (engine.isCanvasKit) {
  console.log('Usando GPU acelerada!')
}

// Renderizar
engine.render()

// Limpar recursos
engine.destroy()
```

## Arquitetura

```
render/
├── index.ts                  # Exports públicos
├── render-context.ts         # Interface IRenderContext
├── canvas2d-context.ts       # Implementação Canvas2D
├── canvaskit-context.ts      # Implementação CanvasKit
├── canvaskit-loader.ts       # Carregador WASM
├── backend-detector.ts       # Detecção de capacidades
└── render-context-factory.ts # Factory para criar contextos
```

## API IRenderContext

A interface `IRenderContext` espelha a API do `CanvasRenderingContext2D`:

### Transformações
- `save()` / `restore()`
- `transform()` / `setTransform()` / `resetTransform()`
- `scale()` / `rotate()` / `translate()`

### Paths
- `beginPath()` / `closePath()`
- `moveTo()` / `lineTo()`
- `bezierCurveTo()` / `quadraticCurveTo()`
- `arc()` / `arcTo()`
- `rect()` / `roundRect()` / `ellipse()`

### Desenho
- `fill()` / `stroke()` / `clip()`
- `fillRect()` / `strokeRect()` / `clearRect()`
- `drawImage()`

### Texto
- `fillText()` / `strokeText()` / `measureText()`

### Propriedades
- `fillStyle` / `strokeStyle`
- `lineWidth` / `lineCap` / `lineJoin`
- `globalAlpha` / `globalCompositeOperation`
- `font` / `textAlign` / `textBaseline`

## Recursos Exclusivos do CanvasKit

O CanvasKit oferece recursos avançados:

### BlendModes
Todos os blend modes CSS são suportados:
- `multiply`, `screen`, `overlay`
- `darken`, `lighten`
- `color-dodge`, `color-burn`
- `hard-light`, `soft-light`
- `difference`, `exclusion`
- `hue`, `saturation`, `color`, `luminosity`

### Transformações de Perspectiva (para Mockups)

```typescript
import { getCanvasKit } from '@/lib/studio/render'

const ck = getCanvasKit()

// Criar matriz de perspectiva para 4 pontos
const srcPoints = [0, 0, 100, 0, 100, 100, 0, 100] // Retângulo original
const dstPoints = [10, 5, 95, 10, 90, 95, 5, 90]   // Pontos de destino (perspectiva)

const matrix = ck.Matrix.makeIdentity()
// Aplicar homografia...

canvas.concat(matrix)
canvas.drawImage(templateImage, 0, 0)
```

## Fallback Automático

Se o CanvasKit falhar ao carregar (ex: WebGL não disponível), o sistema automaticamente faz fallback para Canvas2D:

```typescript
const { context, backend } = await createRenderContext(canvasElement, {
  forceBackend: 'webgl',
  onBackendError: (error, fallbackBackend) => {
    console.warn('CanvasKit falhou, usando:', fallbackBackend)
  }
})
```

## Performance

- **Canvas2D**: ~60fps para cenas simples
- **CanvasKit (WebGL)**: ~60fps para cenas complexas, melhor para muitos elementos

Recomendações:
- Use `requestAnimationFrame` para animações
- Chame `flush()` apenas uma vez por frame
- Reutilize paths quando possível
