-- Koyot Database Schema v2 - Block-Based Architecture
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enum types
CREATE TYPE member_role AS ENUM ('owner', 'admin', 'editor', 'viewer');

-- ============================================
-- BRANDS TABLE (Brand Core + AI DNA)
-- ============================================
CREATE TABLE brands (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  -- Basic Info
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  logo_url TEXT,
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  -- AI Context (Brand DNA)
  ai_context_prompt TEXT,
  
  -- Brand Core (AI-Generated)
  mission TEXT,
  vision TEXT,
  values TEXT[],
  voice_tone JSONB DEFAULT '{}',
  personality JSONB DEFAULT '{}',
  
  -- Settings
  settings JSONB DEFAULT '{}',
  is_public BOOLEAN DEFAULT false
);

-- ============================================
-- PAGES TABLE (Container for Blocks)
-- ============================================
CREATE TABLE pages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  brand_id UUID REFERENCES brands(id) ON DELETE CASCADE NOT NULL,
  
  title TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  order_index INTEGER DEFAULT 0,
  is_published BOOLEAN DEFAULT true,
  
  UNIQUE(brand_id, slug)
);

-- ============================================
-- BLOCKS TABLE (The Heart - JSONB Content)
-- ============================================
CREATE TABLE blocks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  page_id UUID REFERENCES pages(id) ON DELETE CASCADE NOT NULL,
  
  -- Block Type (color_palette, typography_showcase, logo_grid, voice_tone, etc.)
  type TEXT NOT NULL,
  
  -- JSONB Content - Flexible for any block type
  content JSONB NOT NULL DEFAULT '{}',
  
  -- Metadata
  title TEXT,
  description TEXT,
  order_index INTEGER DEFAULT 0,
  is_visible BOOLEAN DEFAULT true,
  
  -- AI Generation tracking
  ai_generated BOOLEAN DEFAULT false,
  ai_prompt TEXT,
  ai_model TEXT
);

-- ============================================
-- ASSETS TABLE (DAM)
-- ============================================
CREATE TABLE assets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  brand_id UUID REFERENCES brands(id) ON DELETE CASCADE NOT NULL,
  
  name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  mime_type TEXT NOT NULL,
  
  -- Dimensions (for images/videos)
  width INTEGER,
  height INTEGER,
  
  -- Metadata
  alt_text TEXT,
  tags TEXT[],
  
  -- AI-Generated metadata
  ai_tags TEXT[],
  ai_description TEXT,
  ai_colors TEXT[],
  
  metadata JSONB DEFAULT '{}',
  
  -- Versioning
  version INTEGER DEFAULT 1,
  parent_asset_id UUID REFERENCES assets(id) ON DELETE SET NULL,
  
  is_archived BOOLEAN DEFAULT false,
  uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL NOT NULL
);

-- ============================================
-- ASSET COLLECTIONS
-- ============================================
CREATE TABLE asset_collections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  brand_id UUID REFERENCES brands(id) ON DELETE CASCADE NOT NULL,
  
  name TEXT NOT NULL,
  description TEXT,
  cover_asset_id UUID REFERENCES assets(id) ON DELETE SET NULL,
  is_public BOOLEAN DEFAULT false
);

CREATE TABLE asset_collection_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  collection_id UUID REFERENCES asset_collections(id) ON DELETE CASCADE NOT NULL,
  asset_id UUID REFERENCES assets(id) ON DELETE CASCADE NOT NULL,
  order_index INTEGER DEFAULT 0,
  UNIQUE(collection_id, asset_id)
);

-- ============================================
-- BRAND MEMBERS (Governance)
-- ============================================
CREATE TABLE brand_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  brand_id UUID REFERENCES brands(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role member_role NOT NULL DEFAULT 'viewer',
  UNIQUE(brand_id, user_id)
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX idx_brands_owner ON brands(owner_id);
CREATE INDEX idx_brands_slug ON brands(slug);
CREATE INDEX idx_pages_brand ON pages(brand_id);
CREATE INDEX idx_pages_slug ON pages(brand_id, slug);
CREATE INDEX idx_blocks_page ON blocks(page_id);
CREATE INDEX idx_blocks_type ON blocks(type);
CREATE INDEX idx_assets_brand ON assets(brand_id);
CREATE INDEX idx_assets_tags ON assets USING GIN(tags);
CREATE INDEX idx_assets_ai_tags ON assets USING GIN(ai_tags);
CREATE INDEX idx_brand_members_user ON brand_members(user_id);
CREATE INDEX idx_brand_members_brand ON brand_members(brand_id);

-- ============================================
-- TRIGGERS
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER brands_updated_at BEFORE UPDATE ON brands
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER pages_updated_at BEFORE UPDATE ON pages
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER blocks_updated_at BEFORE UPDATE ON blocks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER assets_updated_at BEFORE UPDATE ON assets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER asset_collections_updated_at BEFORE UPDATE ON asset_collections
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================
ALTER TABLE brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE asset_collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE brand_members ENABLE ROW LEVEL SECURITY;

-- Brands policies
CREATE POLICY "Public brands viewable by all" ON brands
  FOR SELECT USING (is_public = true);

CREATE POLICY "Members can view their brands" ON brands
  FOR SELECT USING (
    auth.uid() = owner_id OR
    EXISTS (SELECT 1 FROM brand_members WHERE brand_id = brands.id AND user_id = auth.uid())
  );

CREATE POLICY "Users can create brands" ON brands
  FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Owners/admins can update brands" ON brands
  FOR UPDATE USING (
    auth.uid() = owner_id OR
    EXISTS (SELECT 1 FROM brand_members WHERE brand_id = brands.id AND user_id = auth.uid() AND role IN ('owner', 'admin'))
  );

CREATE POLICY "Only owners can delete brands" ON brands
  FOR DELETE USING (auth.uid() = owner_id);

-- Pages policies
CREATE POLICY "Pages viewable by brand members" ON pages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM brands WHERE id = pages.brand_id AND (
        is_public = true OR owner_id = auth.uid() OR
        EXISTS (SELECT 1 FROM brand_members WHERE brand_id = brands.id AND user_id = auth.uid())
      )
    )
  );

CREATE POLICY "Editors can manage pages" ON pages
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM brands WHERE id = pages.brand_id AND (
        owner_id = auth.uid() OR
        EXISTS (SELECT 1 FROM brand_members WHERE brand_id = brands.id AND user_id = auth.uid() AND role IN ('owner', 'admin', 'editor'))
      )
    )
  );

-- Blocks policies
CREATE POLICY "Blocks viewable via page access" ON blocks
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM pages 
      JOIN brands ON brands.id = pages.brand_id 
      WHERE pages.id = blocks.page_id AND (
        brands.is_public = true OR brands.owner_id = auth.uid() OR
        EXISTS (SELECT 1 FROM brand_members WHERE brand_id = brands.id AND user_id = auth.uid())
      )
    )
  );

CREATE POLICY "Editors can manage blocks" ON blocks
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM pages 
      JOIN brands ON brands.id = pages.brand_id 
      WHERE pages.id = blocks.page_id AND (
        brands.owner_id = auth.uid() OR
        EXISTS (SELECT 1 FROM brand_members WHERE brand_id = brands.id AND user_id = auth.uid() AND role IN ('owner', 'admin', 'editor'))
      )
    )
  );

-- Assets policies
CREATE POLICY "Assets viewable by brand members" ON assets
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM brands WHERE id = assets.brand_id AND (
        is_public = true OR owner_id = auth.uid() OR
        EXISTS (SELECT 1 FROM brand_members WHERE brand_id = brands.id AND user_id = auth.uid())
      )
    )
  );

CREATE POLICY "Editors can manage assets" ON assets
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM brands WHERE id = assets.brand_id AND (
        owner_id = auth.uid() OR
        EXISTS (SELECT 1 FROM brand_members WHERE brand_id = brands.id AND user_id = auth.uid() AND role IN ('owner', 'admin', 'editor'))
      )
    )
  );

-- Brand members policies
CREATE POLICY "Members can view team" ON brand_members
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM brands WHERE id = brand_members.brand_id AND (
        owner_id = auth.uid() OR
        EXISTS (SELECT 1 FROM brand_members bm WHERE bm.brand_id = brands.id AND bm.user_id = auth.uid())
      )
    )
  );

CREATE POLICY "Admins can manage members" ON brand_members
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM brands WHERE id = brand_members.brand_id AND (
        owner_id = auth.uid() OR
        EXISTS (SELECT 1 FROM brand_members bm WHERE bm.brand_id = brands.id AND bm.user_id = auth.uid() AND bm.role IN ('owner', 'admin'))
      )
    )
  );

-- ============================================
-- STORAGE BUCKET
-- ============================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('brand-assets', 'brand-assets', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
CREATE POLICY "Brand members can view storage" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'brand-assets' AND
    EXISTS (
      SELECT 1 FROM brands WHERE id::text = (storage.foldername(name))[1] AND (
        is_public = true OR owner_id = auth.uid() OR
        EXISTS (SELECT 1 FROM brand_members WHERE brand_id = brands.id AND user_id = auth.uid())
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

-- ============================================
-- SEED DEFAULT PAGES FOR NEW BRANDS
-- ============================================
CREATE OR REPLACE FUNCTION create_default_pages()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO pages (brand_id, title, slug, order_index) VALUES
    (NEW.id, 'Home', 'home', 0),
    (NEW.id, 'Visual Identity', 'identity', 1),
    (NEW.id, 'Brand Assets', 'assets', 2),
    (NEW.id, 'Templates', 'templates', 3);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER create_brand_default_pages
  AFTER INSERT ON brands
  FOR EACH ROW EXECUTE FUNCTION create_default_pages();
