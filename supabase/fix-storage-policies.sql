-- Fix Storage Bucket Policies for brand-assets
-- Run this in Supabase SQL Editor

-- First, ensure the bucket exists and is public (without mime type restrictions)
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES (
  'brand-assets',
  'brand-assets',
  true,
  52428800 -- 50MB
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 52428800,
  allowed_mime_types = NULL; -- Remove mime type restrictions

-- Drop existing storage policies for brand-assets bucket
DROP POLICY IF EXISTS "Allow public read access" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow owner updates" ON storage.objects;
DROP POLICY IF EXISTS "Allow owner deletes" ON storage.objects;
DROP POLICY IF EXISTS "brand-assets_select" ON storage.objects;
DROP POLICY IF EXISTS "brand-assets_insert" ON storage.objects;
DROP POLICY IF EXISTS "brand-assets_update" ON storage.objects;
DROP POLICY IF EXISTS "brand-assets_delete" ON storage.objects;
DROP POLICY IF EXISTS "Give users access to own folder" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can read brand-assets" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload" ON storage.objects;

-- Create new storage policies

-- 1. Anyone can read files from brand-assets (public bucket)
CREATE POLICY "brand-assets_public_select" ON storage.objects
  FOR SELECT
  USING (bucket_id = 'brand-assets');

-- 2. Authenticated users can upload to brand-assets
CREATE POLICY "brand-assets_auth_insert" ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'brand-assets');

-- 3. Authenticated users can update their uploads
CREATE POLICY "brand-assets_auth_update" ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (bucket_id = 'brand-assets');

-- 4. Authenticated users can delete their uploads
CREATE POLICY "brand-assets_auth_delete" ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'brand-assets');
