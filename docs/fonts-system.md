# Sistema de Fontes do Koyot

O Koyot suporta importação de fontes do Figma com uma abordagem híbrida:

- **Google Fonts** → Carregadas via CDN (sem armazenamento)
- **Fontes Customizadas** → Upload para o storage do Supabase

## Arquitetura

```
src/
├── lib/fonts/
│   ├── index.ts              # Exportações do módulo
│   ├── font-service.ts       # CRUD de fontes no banco
│   ├── figma-font-importer.ts # Importação de fontes do Figma
│   └── google-fonts.ts       # Integração com Google Fonts CDN
├── app/api/fonts/
│   ├── route.ts              # GET (listar) e POST (upload)
│   └── [fontId]/route.ts     # GET, PATCH, DELETE individual
└── types/
    └── fonts.ts              # Tipos TypeScript
```

## Configuração

### 1. Executar o Schema SQL

Execute o arquivo `supabase/fonts-schema.sql` no Supabase SQL Editor:

```sql
-- Cria a tabela brand_fonts e o bucket de storage
```

### 2. Regenerar Tipos do Supabase

```bash
npx supabase gen types typescript --project-id YOUR_PROJECT_ID > src/types/supabase.ts
```

## Uso

### Importação do Figma (Plugin ou REST API)

Quando um template é importado do Figma, o sistema automaticamente:

1. **Coleta todas as fontes** usadas nos nós de texto
2. **Categoriza** em Google Fonts ou fontes customizadas
3. **Gera URL do CDN** para Google Fonts
4. **Adiciona ao template** as informações de fontes

```typescript
// Template importado inclui:
{
  fonts: {
    googleFonts: [
      { family: 'Inter', weights: [400, 500, 600, 700] },
      { family: 'Playfair Display', weights: [400, 700] }
    ],
    customFonts: ['MinhaFonteCustomizada'],
    googleFontsUrl: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Playfair+Display:wght@400;700&display=swap'
  }
}
```

### Carregar Fontes no Frontend

```tsx
// No componente de renderização do template
import Head from 'next/head'

function TemplateRenderer({ template }) {
  return (
    <>
      <Head>
        {template.fonts?.googleFontsUrl && (
          <link href={template.fonts.googleFontsUrl} rel="stylesheet" />
        )}
      </Head>
      {/* Renderização do template */}
    </>
  )
}
```

### Upload de Fonte Customizada

```typescript
// POST /api/fonts
const formData = new FormData()
formData.append('file', fontFile)
formData.append('brandId', 'uuid-da-marca')
formData.append('family', 'MinhaFonte')
formData.append('weight', '400')
formData.append('category', 'body')

const response = await fetch('/api/fonts', {
  method: 'POST',
  body: formData,
})
```

### Listar Fontes da Marca

```typescript
// GET /api/fonts?brandId=uuid-da-marca
const response = await fetch('/api/fonts?brandId=uuid-da-marca')
const { fonts } = await response.json()
```

## Formatos Suportados

| Formato | MIME Type | Extensão |
|---------|-----------|----------|
| TrueType | font/ttf | .ttf |
| OpenType | font/otf | .otf |
| WOFF | font/woff | .woff |
| WOFF2 | font/woff2 | .woff2 |

## Google Fonts Suportadas

O sistema reconhece automaticamente as fontes mais populares do Google Fonts:

- **Sans-serif**: Inter, Roboto, Open Sans, Lato, Montserrat, Poppins, etc.
- **Serif**: Playfair Display, Merriweather, Lora, PT Serif, etc.
- **Display**: Oswald, Bebas Neue, Anton, etc.
- **Monospace**: JetBrains Mono, Fira Code, Source Code Pro, etc.

Para adicionar mais fontes à lista, edite `src/lib/fonts/google-fonts.ts`.

## Fluxo de Decisão

```
Fonte do Figma
      │
      ▼
┌─────────────────┐
│ É Google Font?  │
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
   Sim       Não
    │         │
    ▼         ▼
┌────────┐ ┌──────────────┐
│ CDN    │ │ Fonte        │
│ Google │ │ Customizada  │
└────────┘ └──────────────┘
                  │
                  ▼
         ┌───────────────┐
         │ Upload para   │
         │ Storage?      │
         └───────┬───────┘
                 │
            ┌────┴────┐
            │         │
           Sim       Não
            │         │
            ▼         ▼
       ┌────────┐ ┌────────────┐
       │ Salva  │ │ Usa fonte  │
       │ no DB  │ │ fallback   │
       └────────┘ └────────────┘
```

## Substituição de Fontes

O usuário pode optar por substituir fontes do Figma pela fonte padrão da marca:

```typescript
import { applyFontMappings } from '@/lib/fonts'

const mappings = [
  { originalFamily: 'Roboto', replacementFamily: 'Inter', preserveWeight: true }
]

const templateWithMappedFonts = applyFontMappings(template, mappings)
```

## API Reference

### `listBrandFonts(brandId: string)`
Lista todas as fontes ativas de uma marca.

### `createFont(font: BrandFontInsert)`
Cria uma nova fonte no banco.

### `uploadFontFile(brandId, file, fileName, mimeType)`
Faz upload de um arquivo de fonte para o storage.

### `isGoogleFont(fontFamily: string)`
Verifica se uma fonte está disponível no Google Fonts.

### `getGoogleFontsUrl(fonts: Array<{family, weights}>)`
Gera URL do CDN do Google Fonts para múltiplas fontes.

### `categorizeFonts(fontFamilies: string[])`
Separa fontes em Google Fonts e customizadas.
