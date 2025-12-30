-- Koyot Database Schema
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enum types
CREATE TYPE block_type AS ENUM ('color', 'typography', 'logo', 'imagery', 'spacing', 'custom');
CREATE TYPE member_role AS ENUM ('owner', 'admin', 'editor', 'viewer');

-- Brands table (Brand Core)
CREATE TABLE brands (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  mission TEXT,
  vision TEXT,
  values TEXT[],
  voice_tone JSONB DEFAULT '{}',
  ai_generated_core JSONB DEFAULT '{}',
  settings JSONB DEFAULT '{}',
  is_public BOOLEAN DEFAULT false
);

-- Guidelines table (Content Blocks)
CREATE TABLE guidelines (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  brand_id UUID REFERENCES brands(id) ON DELETE CASCADE NOT NULL,
  block_type block_type NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  content JSONB NOT NULL DEFAULT '{}',
  order_index INTEGER DEFAULT 0,
  is_published BOOLEAN DEFAULT true,
  version INTEGER DEFAULT 1
);

-- Assets table (DAM)
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
  width INTEGER,
  height INTEGER,
  alt_text TEXT,
  tags TEXT[],
  ai_tags TEXT[],
  ai_description TEXT,
  metadata JSONB DEFAULT '{}',
  version INTEGER DEFAULT 1,
  parent_asset_id UUID REFERENCES assets(id) ON DELETE SET NULL,
  is_archived BOOLEAN DEFAULT false,
  uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL NOT NULL
);

-- Asset Collections
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

-- Junction table for assets in collections
CREATE TABLE asset_collection_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  collection_id UUID REFERENCES asset_collections(id) ON DELETE CASCADE NOT NULL,
  asset_id UUID REFERENCES assets(id) ON DELETE CASCADE NOT NULL,
  order_index INTEGER DEFAULT 0,
  UNIQUE(collection_id, asset_id)
);

-- Brand Members (Governance)
CREATE TABLE brand_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  brand_id UUID REFERENCES brands(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role member_role NOT NULL DEFAULT 'viewer',
  UNIQUE(brand_id, user_id)
);

-- Indexes for performance
CREATE INDEX idx_brands_owner ON brands(owner_id);
CREATE INDEX idx_brands_slug ON brands(slug);
CREATE INDEX idx_guidelines_brand ON guidelines(brand_id);
CREATE INDEX idx_guidelines_type ON guidelines(block_type);
CREATE INDEX idx_assets_brand ON assets(brand_id);
CREATE INDEX idx_assets_tags ON assets USING GIN(tags);
CREATE INDEX idx_assets_ai_tags ON assets USING GIN(ai_tags);
CREATE INDEX idx_brand_members_user ON brand_members(user_id);
CREATE INDEX idx_brand_members_brand ON brand_members(brand_id);

-- Updated at trigger function
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
CREATE TRIGGER brands_updated_at BEFORE UPDATE ON brands
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER guidelines_updated_at BEFORE UPDATE ON guidelines
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER assets_updated_at BEFORE UPDATE ON assets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER asset_collections_updated_at BEFORE UPDATE ON asset_collections
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Row Level Security (RLS)
ALTER TABLE brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE guidelines ENABLE ROW LEVEL SECURITY;
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE asset_collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE brand_members ENABLE ROW LEVEL SECURITY;

-- RLS Policies for brands
CREATE POLICY "Public brands are viewable by everyone"
  ON brands FOR SELECT
  USING (is_public = true);

CREATE POLICY "Users can view brands they are members of"
  ON brands FOR SELECT
  USING (
    auth.uid() = owner_id OR
    EXISTS (
      SELECT 1 FROM brand_members
      WHERE brand_members.brand_id = brands.id
      AND brand_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create brands"
  ON brands FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Owners and admins can update brands"
  ON brands FOR UPDATE
  USING (
    auth.uid() = owner_id OR
    EXISTS (
      SELECT 1 FROM brand_members
      WHERE brand_members.brand_id = brands.id
      AND brand_members.user_id = auth.uid()
      AND brand_members.role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Only owners can delete brands"
  ON brands FOR DELETE
  USING (auth.uid() = owner_id);

-- RLS Policies for guidelines
CREATE POLICY "Guidelines viewable by brand members"
  ON guidelines FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM brands
      WHERE brands.id = guidelines.brand_id
      AND (
        brands.is_public = true OR
        brands.owner_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM brand_members
          WHERE brand_members.brand_id = brands.id
          AND brand_members.user_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Editors can manage guidelines"
  ON guidelines FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM brands
      WHERE brands.id = guidelines.brand_id
      AND (
        brands.owner_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM brand_members
          WHERE brand_members.brand_id = brands.id
          AND brand_members.user_id = auth.uid()
          AND brand_members.role IN ('owner', 'admin', 'editor')
        )
      )
    )
  );

-- RLS Policies for assets
CREATE POLICY "Assets viewable by brand members"
  ON assets FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM brands
      WHERE brands.id = assets.brand_id
      AND (
        brands.is_public = true OR
        brands.owner_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM brand_members
          WHERE brand_members.brand_id = brands.id
          AND brand_members.user_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Editors can manage assets"
  ON assets FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM brands
      WHERE brands.id = assets.brand_id
      AND (
        brands.owner_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM brand_members
          WHERE brand_members.brand_id = brands.id
          AND brand_members.user_id = auth.uid()
          AND brand_members.role IN ('owner', 'admin', 'editor')
        )
      )
    )
  );

-- RLS Policies for brand_members
CREATE POLICY "Members can view other members of their brands"
  ON brand_members FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM brands
      WHERE brands.id = brand_members.brand_id
      AND (
        brands.owner_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM brand_members bm
          WHERE bm.brand_id = brands.id
          AND bm.user_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Admins can manage members"
  ON brand_members FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM brands
      WHERE brands.id = brand_members.brand_id
      AND (
        brands.owner_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM brand_members bm
          WHERE bm.brand_id = brands.id
          AND bm.user_id = auth.uid()
          AND bm.role IN ('owner', 'admin')
        )
      )
    )
  );

-- Storage bucket for brand assets
INSERT INTO storage.buckets (id, name, public)
VALUES ('brand-assets', 'brand-assets', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
CREATE POLICY "Brand members can view assets"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'brand-assets' AND
    EXISTS (
      SELECT 1 FROM brands
      WHERE brands.id::text = (storage.foldername(name))[1]
      AND (
        brands.is_public = true OR
        brands.owner_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM brand_members
          WHERE brand_members.brand_id = brands.id
          AND brand_members.user_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Editors can upload assets"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'brand-assets' AND
    EXISTS (
      SELECT 1 FROM brands
      WHERE brands.id::text = (storage.foldername(name))[1]
      AND (
        brands.owner_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM brand_members
          WHERE brand_members.brand_id = brands.id
          AND brand_members.user_id = auth.uid()
          AND brand_members.role IN ('owner', 'admin', 'editor')
        )
      )
    )
  );
