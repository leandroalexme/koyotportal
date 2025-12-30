-- ============================================
-- KOYOT DAM - Digital Asset Management Schema
-- Run this in Supabase SQL Editor
-- ============================================

-- ============================================
-- ENHANCED ASSETS TABLE
-- ============================================

-- Add new columns to existing assets table
ALTER TABLE assets 
ADD COLUMN IF NOT EXISTS dimensions JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS folder_name TEXT DEFAULT 'general',
ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'other',
ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'upload',
ADD COLUMN IF NOT EXISTS processing_status TEXT DEFAULT 'ready',
ADD COLUMN IF NOT EXISTS thumbnail_path TEXT;

-- Create enum for asset categories
DO $$ BEGIN
  CREATE TYPE asset_category AS ENUM ('logo', 'image', 'typography', 'document', 'icon', 'video', 'other');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create enum for asset source
DO $$ BEGIN
  CREATE TYPE asset_source AS ENUM ('upload', 'ai_generated', 'imported', 'transformed');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create index for folder-based queries
CREATE INDEX IF NOT EXISTS idx_assets_folder ON assets(brand_id, folder_name);
CREATE INDEX IF NOT EXISTS idx_assets_category ON assets(category);
CREATE INDEX IF NOT EXISTS idx_assets_source ON assets(source);

-- ============================================
-- ASSET FOLDERS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS asset_folders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  brand_id UUID REFERENCES brands(id) ON DELETE CASCADE NOT NULL,
  
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  parent_folder_id UUID REFERENCES asset_folders(id) ON DELETE CASCADE,
  description TEXT,
  color TEXT DEFAULT '#6B7280',
  icon TEXT DEFAULT 'folder',
  
  UNIQUE(brand_id, slug, parent_folder_id)
);

CREATE INDEX IF NOT EXISTS idx_asset_folders_brand ON asset_folders(brand_id);
CREATE INDEX IF NOT EXISTS idx_asset_folders_parent ON asset_folders(parent_folder_id);

-- Trigger for updated_at
CREATE TRIGGER asset_folders_updated_at BEFORE UPDATE ON asset_folders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- ASSET TRANSFORMATIONS TABLE (Cache)
-- ============================================

CREATE TABLE IF NOT EXISTS asset_transformations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  asset_id UUID REFERENCES assets(id) ON DELETE CASCADE NOT NULL,
  
  -- Transformation params
  width INTEGER,
  height INTEGER,
  format TEXT NOT NULL DEFAULT 'webp',
  quality INTEGER DEFAULT 80,
  grayscale BOOLEAN DEFAULT false,
  
  -- Result
  transformed_path TEXT NOT NULL,
  file_size BIGINT,
  
  -- Unique constraint for caching
  UNIQUE(asset_id, width, height, format, quality, grayscale)
);

CREATE INDEX IF NOT EXISTS idx_transformations_asset ON asset_transformations(asset_id);

-- ============================================
-- RLS POLICIES FOR NEW TABLES
-- ============================================

ALTER TABLE asset_folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE asset_transformations ENABLE ROW LEVEL SECURITY;

-- Asset Folders policies
CREATE POLICY "Folders viewable by brand members" ON asset_folders
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM brands WHERE id = asset_folders.brand_id AND (
        is_public = true OR owner_id = auth.uid() OR
        EXISTS (SELECT 1 FROM brand_members WHERE brand_id = brands.id AND user_id = auth.uid())
      )
    )
  );

CREATE POLICY "Editors can manage folders" ON asset_folders
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM brands WHERE id = asset_folders.brand_id AND (
        owner_id = auth.uid() OR
        EXISTS (SELECT 1 FROM brand_members WHERE brand_id = brands.id AND user_id = auth.uid() AND role IN ('owner', 'admin', 'editor'))
      )
    )
  );

-- Asset Transformations policies (public read for cached transforms)
CREATE POLICY "Transformations viewable by asset access" ON asset_transformations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM assets 
      JOIN brands ON brands.id = assets.brand_id 
      WHERE assets.id = asset_transformations.asset_id AND (
        brands.is_public = true OR brands.owner_id = auth.uid() OR
        EXISTS (SELECT 1 FROM brand_members WHERE brand_id = brands.id AND user_id = auth.uid())
      )
    )
  );

CREATE POLICY "System can manage transformations" ON asset_transformations
  FOR ALL USING (true);

-- ============================================
-- STORAGE BUCKET POLICIES (Enhanced)
-- ============================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Brand members can view storage" ON storage.objects;
DROP POLICY IF EXISTS "Editors can upload to storage" ON storage.objects;
DROP POLICY IF EXISTS "Editors can update storage" ON storage.objects;
DROP POLICY IF EXISTS "Editors can delete storage" ON storage.objects;

-- Recreate with better policies
CREATE POLICY "Brand members can view storage" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'brand-assets' AND
    (
      -- Public access for transformed/cached assets
      (storage.foldername(name))[2] = 'transformed' OR
      -- Member access for original assets
      EXISTS (
        SELECT 1 FROM brands WHERE id::text = (storage.foldername(name))[1] AND (
          is_public = true OR owner_id = auth.uid() OR
          EXISTS (SELECT 1 FROM brand_members WHERE brand_id = brands.id AND user_id = auth.uid())
        )
      )
    )
  );

CREATE POLICY "Editors can upload to storage" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'brand-assets' AND
    EXISTS (
      SELECT 1 FROM brands WHERE id::text = (storage.foldername(name))[1] AND (
        owner_id = auth.uid() OR
        EXISTS (SELECT 1 FROM brand_members WHERE brand_id = brands.id AND user_id = auth.uid() AND role IN ('owner', 'admin', 'editor'))
      )
    )
  );

CREATE POLICY "Editors can update storage" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'brand-assets' AND
    EXISTS (
      SELECT 1 FROM brands WHERE id::text = (storage.foldername(name))[1] AND (
        owner_id = auth.uid() OR
        EXISTS (SELECT 1 FROM brand_members WHERE brand_id = brands.id AND user_id = auth.uid() AND role IN ('owner', 'admin', 'editor'))
      )
    )
  );

CREATE POLICY "Editors can delete storage" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'brand-assets' AND
    EXISTS (
      SELECT 1 FROM brands WHERE id::text = (storage.foldername(name))[1] AND (
        owner_id = auth.uid() OR
        EXISTS (SELECT 1 FROM brand_members WHERE brand_id = brands.id AND user_id = auth.uid() AND role IN ('owner', 'admin', 'editor'))
      )
    )
  );

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Function to get asset public URL with transformations
CREATE OR REPLACE FUNCTION get_asset_url(
  p_asset_id UUID,
  p_width INTEGER DEFAULT NULL,
  p_height INTEGER DEFAULT NULL,
  p_format TEXT DEFAULT 'webp',
  p_grayscale BOOLEAN DEFAULT false
)
RETURNS TEXT AS $$
DECLARE
  v_path TEXT;
  v_transform_path TEXT;
BEGIN
  -- Get original asset path
  SELECT file_path INTO v_path FROM assets WHERE id = p_asset_id;
  
  IF v_path IS NULL THEN
    RETURN NULL;
  END IF;
  
  -- If no transformations, return original
  IF p_width IS NULL AND p_height IS NULL AND p_format = 'webp' AND p_grayscale = false THEN
    RETURN v_path;
  END IF;
  
  -- Check for cached transformation
  SELECT transformed_path INTO v_transform_path 
  FROM asset_transformations 
  WHERE asset_id = p_asset_id 
    AND (width = p_width OR (width IS NULL AND p_width IS NULL))
    AND (height = p_height OR (height IS NULL AND p_height IS NULL))
    AND format = p_format
    AND grayscale = p_grayscale;
  
  IF v_transform_path IS NOT NULL THEN
    RETURN v_transform_path;
  END IF;
  
  -- Return path with query params for on-the-fly transformation
  RETURN v_path || '?w=' || COALESCE(p_width::TEXT, '') || 
         '&h=' || COALESCE(p_height::TEXT, '') || 
         '&f=' || p_format || 
         '&g=' || p_grayscale::TEXT;
END;
$$ LANGUAGE plpgsql;

-- Function to create default folders for a brand
CREATE OR REPLACE FUNCTION create_default_asset_folders()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO asset_folders (brand_id, name, slug, description, icon) VALUES
    (NEW.id, 'Logos', 'logos', 'Logotipos e variações', 'crown'),
    (NEW.id, 'Imagens', 'images', 'Fotografias e ilustrações', 'image'),
    (NEW.id, 'Tipografia', 'typography', 'Fontes e estilos tipográficos', 'type'),
    (NEW.id, 'Documentos', 'documents', 'PDFs e documentos oficiais', 'file-text'),
    (NEW.id, 'Ícones', 'icons', 'Ícones e símbolos', 'shapes');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for default folders
DROP TRIGGER IF EXISTS create_brand_default_folders ON brands;
CREATE TRIGGER create_brand_default_folders
  AFTER INSERT ON brands
  FOR EACH ROW EXECUTE FUNCTION create_default_asset_folders();
