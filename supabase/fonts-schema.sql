-- Koyot Fonts Schema
-- Sistema de gerenciamento de fontes customizadas por marca

-- ============================================
-- BRAND FONTS TABLE
-- ============================================
CREATE TABLE brand_fonts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  brand_id UUID REFERENCES brands(id) ON DELETE CASCADE NOT NULL,
  
  -- Font identification
  family TEXT NOT NULL,           -- Nome da família (ex: "Roboto", "Open Sans")
  style TEXT NOT NULL DEFAULT 'normal',  -- normal, italic
  weight INTEGER NOT NULL DEFAULT 400,   -- 100-900
  
  -- File info
  file_path TEXT NOT NULL,        -- Caminho no storage
  file_name TEXT NOT NULL,        -- Nome original do arquivo
  file_size BIGINT NOT NULL,      -- Tamanho em bytes
  format TEXT NOT NULL,           -- ttf, otf, woff, woff2
  
  -- Source tracking
  source TEXT NOT NULL DEFAULT 'upload',  -- upload, figma, google, system
  source_url TEXT,                -- URL original (Google Fonts CDN ou arquivo)
  figma_postscript_name TEXT,     -- Nome PostScript do Figma (para matching)
  google_fonts_url TEXT,          -- URL do Google Fonts CDN (se source = 'google')
  
  -- Metadata
  is_default BOOLEAN DEFAULT false,  -- Se é a fonte padrão da marca
  category TEXT,                     -- display, heading, body, ui
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Unique constraint: uma família/peso/estilo por marca
  UNIQUE(brand_id, family, weight, style)
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX idx_brand_fonts_brand ON brand_fonts(brand_id);
CREATE INDEX idx_brand_fonts_family ON brand_fonts(family);
CREATE INDEX idx_brand_fonts_source ON brand_fonts(source);
CREATE INDEX idx_brand_fonts_figma_name ON brand_fonts(figma_postscript_name);

-- ============================================
-- TRIGGERS
-- ============================================
CREATE TRIGGER brand_fonts_updated_at BEFORE UPDATE ON brand_fonts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================
ALTER TABLE brand_fonts ENABLE ROW LEVEL SECURITY;

-- Fonts viewable by brand members
CREATE POLICY "Fonts viewable by brand members" ON brand_fonts
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM brands WHERE id = brand_fonts.brand_id AND (
        is_public = true OR owner_id = auth.uid() OR
        EXISTS (SELECT 1 FROM brand_members WHERE brand_id = brands.id AND user_id = auth.uid())
      )
    )
  );

-- Editors can manage fonts
CREATE POLICY "Editors can manage fonts" ON brand_fonts
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM brands WHERE id = brand_fonts.brand_id AND (
        owner_id = auth.uid() OR
        EXISTS (SELECT 1 FROM brand_members WHERE brand_id = brands.id AND user_id = auth.uid() AND role IN ('owner', 'admin', 'editor'))
      )
    )
  );

-- ============================================
-- STORAGE BUCKET FOR FONTS
-- ============================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'brand-fonts', 
  'brand-fonts', 
  true,  -- Público para servir as fontes via CSS
  10485760,  -- 10MB max
  ARRAY['font/ttf', 'font/otf', 'font/woff', 'font/woff2', 'application/x-font-ttf', 'application/x-font-otf', 'application/font-woff', 'application/font-woff2']
)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for fonts
CREATE POLICY "Anyone can view fonts" ON storage.objects
  FOR SELECT USING (bucket_id = 'brand-fonts');

CREATE POLICY "Editors can upload fonts" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'brand-fonts' AND
    EXISTS (
      SELECT 1 FROM brands WHERE id::text = (storage.foldername(name))[1] AND (
        owner_id = auth.uid() OR
        EXISTS (SELECT 1 FROM brand_members WHERE brand_id = brands.id AND user_id = auth.uid() AND role IN ('owner', 'admin', 'editor'))
      )
    )
  );

CREATE POLICY "Editors can delete fonts" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'brand-fonts' AND
    EXISTS (
      SELECT 1 FROM brands WHERE id::text = (storage.foldername(name))[1] AND (
        owner_id = auth.uid() OR
        EXISTS (SELECT 1 FROM brand_members WHERE brand_id = brands.id AND user_id = auth.uid() AND role IN ('owner', 'admin', 'editor'))
      )
    )
  );
