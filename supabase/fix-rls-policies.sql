-- Fix RLS Policies - Run this in Supabase SQL Editor
-- This fixes the infinite recursion issue

-- ============================================
-- STEP 1: DROP ALL EXISTING POLICIES
-- ============================================

-- Drop ALL brands policies
DROP POLICY IF EXISTS "Public brands viewable by all" ON brands;
DROP POLICY IF EXISTS "Members can view their brands" ON brands;
DROP POLICY IF EXISTS "Users can create brands" ON brands;
DROP POLICY IF EXISTS "Owners/admins can update brands" ON brands;
DROP POLICY IF EXISTS "Only owners can delete brands" ON brands;

-- Drop ALL brand_members policies
DROP POLICY IF EXISTS "Members can view brand_members" ON brand_members;
DROP POLICY IF EXISTS "Owners can manage brand_members" ON brand_members;
DROP POLICY IF EXISTS "Users can view brand_members of their brands" ON brand_members;
DROP POLICY IF EXISTS "Owners can insert brand_members" ON brand_members;
DROP POLICY IF EXISTS "Owners can update brand_members" ON brand_members;
DROP POLICY IF EXISTS "Owners can delete brand_members" ON brand_members;

-- Drop ALL pages policies
DROP POLICY IF EXISTS "Pages viewable by brand members" ON pages;
DROP POLICY IF EXISTS "Editors can manage pages" ON pages;

-- Drop ALL blocks policies
DROP POLICY IF EXISTS "Blocks viewable by brand members" ON blocks;
DROP POLICY IF EXISTS "Editors can manage blocks" ON blocks;

-- ============================================
-- STEP 2: CREATE SIMPLE NON-RECURSIVE POLICIES
-- ============================================

-- BRANDS: Simple owner-based policies (NO reference to brand_members)
CREATE POLICY "brands_select" ON brands
  FOR SELECT USING (is_public = true OR owner_id = auth.uid());

CREATE POLICY "brands_insert" ON brands
  FOR INSERT WITH CHECK (owner_id = auth.uid());

CREATE POLICY "brands_update" ON brands
  FOR UPDATE USING (owner_id = auth.uid());

CREATE POLICY "brands_delete" ON brands
  FOR DELETE USING (owner_id = auth.uid());

-- BRAND_MEMBERS: Simple policies (NO reference to brands policies)
CREATE POLICY "brand_members_select" ON brand_members
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "brand_members_insert" ON brand_members
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM brands WHERE id = brand_id AND owner_id = auth.uid())
  );

CREATE POLICY "brand_members_update" ON brand_members
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM brands WHERE id = brand_id AND owner_id = auth.uid())
  );

CREATE POLICY "brand_members_delete" ON brand_members
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM brands WHERE id = brand_id AND owner_id = auth.uid())
  );

-- Recreate brands policies without recursion
CREATE POLICY "Members can view their brands" ON brands
  FOR SELECT USING (
    auth.uid() = owner_id OR
    auth.uid() IN (SELECT user_id FROM brand_members WHERE brand_id = id)
  );

CREATE POLICY "Owners/admins can update brands" ON brands
  FOR UPDATE USING (
    auth.uid() = owner_id OR
    auth.uid() IN (SELECT user_id FROM brand_members WHERE brand_id = id AND role IN ('owner', 'admin'))
  );

-- Create brand_members policies without recursion
CREATE POLICY "Users can view brand_members of their brands" ON brand_members
  FOR SELECT USING (
    user_id = auth.uid() OR
    brand_id IN (SELECT id FROM brands WHERE owner_id = auth.uid())
  );

CREATE POLICY "Owners can insert brand_members" ON brand_members
  FOR INSERT WITH CHECK (
    brand_id IN (SELECT id FROM brands WHERE owner_id = auth.uid())
  );

CREATE POLICY "Owners can update brand_members" ON brand_members
  FOR UPDATE USING (
    brand_id IN (SELECT id FROM brands WHERE owner_id = auth.uid())
  );

CREATE POLICY "Owners can delete brand_members" ON brand_members
  FOR DELETE USING (
    brand_id IN (SELECT id FROM brands WHERE owner_id = auth.uid())
  );

-- Also fix pages policies
DROP POLICY IF EXISTS "Pages viewable by brand members" ON pages;
DROP POLICY IF EXISTS "Editors can manage pages" ON pages;

CREATE POLICY "Pages viewable by brand members" ON pages
  FOR SELECT USING (
    brand_id IN (
      SELECT id FROM brands WHERE is_public = true OR owner_id = auth.uid()
    ) OR
    brand_id IN (
      SELECT brand_id FROM brand_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Editors can manage pages" ON pages
  FOR ALL USING (
    brand_id IN (SELECT id FROM brands WHERE owner_id = auth.uid()) OR
    brand_id IN (SELECT brand_id FROM brand_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'editor'))
  );

-- Fix blocks policies
DROP POLICY IF EXISTS "Blocks viewable by brand members" ON blocks;
DROP POLICY IF EXISTS "Editors can manage blocks" ON blocks;

CREATE POLICY "Blocks viewable by brand members" ON blocks
  FOR SELECT USING (
    page_id IN (
      SELECT id FROM pages WHERE brand_id IN (
        SELECT id FROM brands WHERE is_public = true OR owner_id = auth.uid()
        UNION
        SELECT brand_id FROM brand_members WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Editors can manage blocks" ON blocks
  FOR ALL USING (
    page_id IN (
      SELECT id FROM pages WHERE brand_id IN (
        SELECT id FROM brands WHERE owner_id = auth.uid()
        UNION
        SELECT brand_id FROM brand_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'editor')
      )
    )
  );
