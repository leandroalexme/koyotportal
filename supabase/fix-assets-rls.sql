-- Fix Assets RLS Policies
-- Run this in Supabase SQL Editor

-- Drop existing policies on assets
DO $$ 
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'assets' LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON assets', pol.policyname);
    END LOOP;
END $$;

-- Create simple non-recursive policies for assets
CREATE POLICY "assets_select" ON assets
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM brands WHERE brands.id = assets.brand_id AND (brands.is_public = true OR brands.owner_id = auth.uid()))
  );

CREATE POLICY "assets_insert" ON assets
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM brands WHERE brands.id = assets.brand_id AND brands.owner_id = auth.uid())
  );

CREATE POLICY "assets_update" ON assets
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM brands WHERE brands.id = assets.brand_id AND brands.owner_id = auth.uid())
  );

CREATE POLICY "assets_delete" ON assets
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM brands WHERE brands.id = assets.brand_id AND brands.owner_id = auth.uid())
  );

-- Also fix asset_collections if needed
DO $$ 
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'asset_collections' LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON asset_collections', pol.policyname);
    END LOOP;
END $$;

CREATE POLICY "asset_collections_select" ON asset_collections
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM brands WHERE brands.id = asset_collections.brand_id AND (brands.is_public = true OR brands.owner_id = auth.uid()))
  );

CREATE POLICY "asset_collections_insert" ON asset_collections
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM brands WHERE brands.id = asset_collections.brand_id AND brands.owner_id = auth.uid())
  );

CREATE POLICY "asset_collections_update" ON asset_collections
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM brands WHERE brands.id = asset_collections.brand_id AND brands.owner_id = auth.uid())
  );

CREATE POLICY "asset_collections_delete" ON asset_collections
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM brands WHERE brands.id = asset_collections.brand_id AND brands.owner_id = auth.uid())
  );

-- Fix asset_folders if it exists
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'asset_folders') THEN
    -- Drop existing policies
    EXECUTE 'DROP POLICY IF EXISTS "asset_folders_select" ON asset_folders';
    EXECUTE 'DROP POLICY IF EXISTS "asset_folders_insert" ON asset_folders';
    EXECUTE 'DROP POLICY IF EXISTS "asset_folders_update" ON asset_folders';
    EXECUTE 'DROP POLICY IF EXISTS "asset_folders_delete" ON asset_folders';
    
    -- Enable RLS
    ALTER TABLE asset_folders ENABLE ROW LEVEL SECURITY;
    
    -- Create policies
    EXECUTE 'CREATE POLICY "asset_folders_select" ON asset_folders FOR SELECT USING (
      EXISTS (SELECT 1 FROM brands WHERE brands.id = asset_folders.brand_id AND (brands.is_public = true OR brands.owner_id = auth.uid()))
    )';
    
    EXECUTE 'CREATE POLICY "asset_folders_insert" ON asset_folders FOR INSERT WITH CHECK (
      EXISTS (SELECT 1 FROM brands WHERE brands.id = asset_folders.brand_id AND brands.owner_id = auth.uid())
    )';
    
    EXECUTE 'CREATE POLICY "asset_folders_update" ON asset_folders FOR UPDATE USING (
      EXISTS (SELECT 1 FROM brands WHERE brands.id = asset_folders.brand_id AND brands.owner_id = auth.uid())
    )';
    
    EXECUTE 'CREATE POLICY "asset_folders_delete" ON asset_folders FOR DELETE USING (
      EXISTS (SELECT 1 FROM brands WHERE brands.id = asset_folders.brand_id AND brands.owner_id = auth.uid())
    )';
  END IF;
END $$;
