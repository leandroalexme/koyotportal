-- Fix RLS Policies v2 - Run this in Supabase SQL Editor
-- This completely removes recursion by using simple owner-based policies

-- ============================================
-- STEP 1: DROP ALL EXISTING POLICIES
-- ============================================

DO $$ 
DECLARE
    pol RECORD;
BEGIN
    -- Drop all policies on brands
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'brands' LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON brands', pol.policyname);
    END LOOP;
    
    -- Drop all policies on brand_members
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'brand_members' LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON brand_members', pol.policyname);
    END LOOP;
    
    -- Drop all policies on pages
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'pages' LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON pages', pol.policyname);
    END LOOP;
    
    -- Drop all policies on blocks
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'blocks' LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON blocks', pol.policyname);
    END LOOP;
    
    -- Drop all policies on assets
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'assets' LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON assets', pol.policyname);
    END LOOP;
    
    -- Drop all policies on asset_collections
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'asset_collections' LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON asset_collections', pol.policyname);
    END LOOP;
END $$;

-- ============================================
-- STEP 2: BRANDS - Simple owner-based (NO recursion)
-- ============================================

CREATE POLICY "brands_select_public" ON brands
  FOR SELECT USING (is_public = true);

CREATE POLICY "brands_select_owner" ON brands
  FOR SELECT USING (owner_id = auth.uid());

CREATE POLICY "brands_insert" ON brands
  FOR INSERT WITH CHECK (owner_id = auth.uid());

CREATE POLICY "brands_update" ON brands
  FOR UPDATE USING (owner_id = auth.uid());

CREATE POLICY "brands_delete" ON brands
  FOR DELETE USING (owner_id = auth.uid());

-- ============================================
-- STEP 3: PAGES - Based on brand ownership
-- ============================================

CREATE POLICY "pages_select" ON pages
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM brands WHERE brands.id = pages.brand_id AND (brands.is_public = true OR brands.owner_id = auth.uid()))
  );

CREATE POLICY "pages_insert" ON pages
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM brands WHERE brands.id = pages.brand_id AND brands.owner_id = auth.uid())
  );

CREATE POLICY "pages_update" ON pages
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM brands WHERE brands.id = pages.brand_id AND brands.owner_id = auth.uid())
  );

CREATE POLICY "pages_delete" ON pages
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM brands WHERE brands.id = pages.brand_id AND brands.owner_id = auth.uid())
  );

-- ============================================
-- STEP 4: BLOCKS - Based on page->brand ownership
-- ============================================

CREATE POLICY "blocks_select" ON blocks
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM pages 
      JOIN brands ON brands.id = pages.brand_id 
      WHERE pages.id = blocks.page_id AND (brands.is_public = true OR brands.owner_id = auth.uid())
    )
  );

CREATE POLICY "blocks_insert" ON blocks
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM pages 
      JOIN brands ON brands.id = pages.brand_id 
      WHERE pages.id = blocks.page_id AND brands.owner_id = auth.uid()
    )
  );

CREATE POLICY "blocks_update" ON blocks
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM pages 
      JOIN brands ON brands.id = pages.brand_id 
      WHERE pages.id = blocks.page_id AND brands.owner_id = auth.uid()
    )
  );

CREATE POLICY "blocks_delete" ON blocks
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM pages 
      JOIN brands ON brands.id = pages.brand_id 
      WHERE pages.id = blocks.page_id AND brands.owner_id = auth.uid()
    )
  );

-- ============================================
-- STEP 5: BRAND_MEMBERS - Simple policies
-- ============================================

CREATE POLICY "brand_members_select" ON brand_members
  FOR SELECT USING (
    user_id = auth.uid() OR
    EXISTS (SELECT 1 FROM brands WHERE brands.id = brand_members.brand_id AND brands.owner_id = auth.uid())
  );

CREATE POLICY "brand_members_insert" ON brand_members
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM brands WHERE brands.id = brand_members.brand_id AND brands.owner_id = auth.uid())
  );

CREATE POLICY "brand_members_update" ON brand_members
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM brands WHERE brands.id = brand_members.brand_id AND brands.owner_id = auth.uid())
  );

CREATE POLICY "brand_members_delete" ON brand_members
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM brands WHERE brands.id = brand_members.brand_id AND brands.owner_id = auth.uid())
  );

-- ============================================
-- STEP 6: ASSETS - Based on brand ownership
-- ============================================

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

-- ============================================
-- STEP 7: ASSET_COLLECTIONS - Based on brand ownership
-- ============================================

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
