/**
 * Módulo de gerenciamento de fontes
 * 
 * Suporta:
 * - Google Fonts (via CDN, sem armazenamento)
 * - Fontes customizadas (upload para storage)
 * 
 * NOTA: Para fontes customizadas, execute o schema SQL em /supabase/fonts-schema.sql
 * e regenere os tipos do Supabase com: npx supabase gen types typescript
 */

export * from './font-service'
export * from './figma-font-importer'
export * from './google-fonts'
