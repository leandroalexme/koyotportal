# Koyot Figma Plugin

Plugin para exportar designs do Figma para o Koyot com fidelidade total, incluindo:
- ✅ Bullet points e listas numeradas
- ✅ Paths vetoriais (pen tool, shapes)
- ✅ Rich text formatting
- ✅ Espaçamento de parágrafos
- ✅ Imagens embutidas
- ✅ Auto-layout completo

## Instalação

### 1. Instalar dependências

```bash
cd figma-plugin
npm install
```

### 2. Compilar o plugin

```bash
npm run build
```

Isso vai gerar o arquivo `code.js` a partir do `code.ts`.

### 3. Carregar no Figma

1. Abra o Figma Desktop
2. Vá em **Plugins** > **Development** > **Import plugin from manifest...**
3. Selecione o arquivo `manifest.json` desta pasta

## Uso

1. Selecione um frame no Figma
2. Execute o plugin: **Plugins** > **Development** > **Koyot Exporter**
3. Configure a URL da API (padrão: `http://localhost:3000/api/figma/plugin-import`)
4. Clique em **Send to Koyot**

## Desenvolvimento

Para desenvolvimento com hot-reload:

```bash
npm run watch
```

## Estrutura

```
figma-plugin/
├── manifest.json    # Configuração do plugin
├── code.ts          # Código principal (TypeScript)
├── code.js          # Código compilado (gerado)
├── ui.html          # Interface do usuário
├── package.json     # Dependências
└── tsconfig.json    # Configuração TypeScript
```

## API Endpoint

O plugin envia dados para `/api/figma/plugin-import` com a seguinte estrutura:

```typescript
{
  version: string
  fileKey: string
  fileName: string
  exportedAt: string
  rootNode: ExportedNode
  images: Record<string, string> // imageHash -> base64
}
```

## Dados Exportados

### TextNode
- `characters` - Conteúdo do texto
- `listOptions` - Array com tipo de lista por linha (ORDERED, UNORDERED, NONE)
- `paragraphSpacing` - Espaçamento entre parágrafos
- `paragraphIndent` - Indentação

### VectorNode
- `fillGeometry` - Paths SVG de preenchimento
- `strokeGeometry` - Paths SVG de contorno
- `strokeCap`, `strokeJoin`, `dashPattern` - Propriedades de stroke

### FrameNode
- `layoutMode` - HORIZONTAL, VERTICAL, NONE
- `layoutPositioning` - AUTO, ABSOLUTE
- Auto-layout completo com padding, gap, alignment
