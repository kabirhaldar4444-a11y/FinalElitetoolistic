-- ============================================================
-- ELITETOOLISTIC ADMISSION & VIDEO STORAGE SETUP SCRIPT
-- ============================================================
-- Execute this script in your Supabase SQL Editor:

-- 1. Create admissions table (with video_url support)
CREATE TABLE IF NOT EXISTS public.admissions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  full_name text NOT NULL,
  email text NOT NULL,
  phone text NOT NULL,
  course_name text NOT NULL,
  pincode text,
  state text,
  city text,
  address text,
  aadhaar_front_url text,
  aadhaar_back_url text,
  pan_url text,
  signature_url text,
  profile_photo_url text,
  video_url text,
  ip_address text,
  status text CHECK (status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
  remarks text
);

-- Safely add missing columns if table already exists
ALTER TABLE public.admissions ADD COLUMN IF NOT EXISTS video_url text;
ALTER TABLE public.admissions ADD COLUMN IF NOT EXISTS profile_photo_url text;
ALTER TABLE public.admissions ADD COLUMN IF NOT EXISTS remarks text;
ALTER TABLE public.admissions ADD COLUMN IF NOT EXISTS ip_address text;

-- Also add video_url column to profiles table if missing
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS video_url text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS profile_photo_url text;

-- 2. Enable Row Level Security (RLS)
ALTER TABLE public.admissions ENABLE ROW LEVEL SECURITY;

-- 3. Drop existing policies if any to prevent conflicts
DO $$
BEGIN
  DROP POLICY IF EXISTS "Public insert admissions" ON public.admissions;
  DROP POLICY IF EXISTS "Public select admissions" ON public.admissions;
  DROP POLICY IF EXISTS "Public update admissions" ON public.admissions;
  DROP POLICY IF EXISTS "Public delete admissions" ON public.admissions;
  DROP POLICY IF EXISTS "Admins full access admissions" ON public.admissions;
EXCEPTION WHEN others THEN NULL;
END $$;

-- 4. Create Policies for admissions table
CREATE POLICY "Public insert admissions" ON public.admissions FOR INSERT WITH CHECK (true);
CREATE POLICY "Public select admissions" ON public.admissions FOR SELECT USING (true);
CREATE POLICY "Public update admissions" ON public.admissions FOR UPDATE USING (true);
CREATE POLICY "Public delete admissions" ON public.admissions FOR DELETE USING (true);

-- 5. Create storage buckets for admissions and video files
INSERT INTO storage.buckets (id, name, public)
VALUES ('admissions', 'admissions', true)
ON CONFLICT (id) DO UPDATE SET public = true;

INSERT INTO storage.buckets (id, name, public)
VALUES ('aadhaar_cards', 'aadhaar_cards', true)
ON CONFLICT (id) DO UPDATE SET public = true;

INSERT INTO storage.buckets (id, name, public)
VALUES ('videos', 'videos', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 6. Storage Policies for admissions, aadhaar_cards, and videos buckets
DO $$
BEGIN
  DROP POLICY IF EXISTS "Public Access Admissions Storage" ON storage.objects;
  DROP POLICY IF EXISTS "Public Upload Admissions Storage" ON storage.objects;
  DROP POLICY IF EXISTS "Public Update Admissions Storage" ON storage.objects;
  DROP POLICY IF EXISTS "Public Delete Admissions Storage" ON storage.objects;

  DROP POLICY IF EXISTS "Public Access Aadhaar Storage" ON storage.objects;
  DROP POLICY IF EXISTS "Public Upload Aadhaar Storage" ON storage.objects;

  DROP POLICY IF EXISTS "Public Access Videos Storage" ON storage.objects;
  DROP POLICY IF EXISTS "Public Upload Videos Storage" ON storage.objects;
EXCEPTION WHEN others THEN NULL;
END $$;

-- Public Storage Access Policies
CREATE POLICY "Public Access Admissions Storage" ON storage.objects 
  FOR SELECT USING (bucket_id IN ('admissions', 'aadhaar_cards', 'videos'));

CREATE POLICY "Public Upload Admissions Storage" ON storage.objects 
  FOR INSERT WITH CHECK (bucket_id IN ('admissions', 'aadhaar_cards', 'videos'));

CREATE POLICY "Public Update Admissions Storage" ON storage.objects 
  FOR UPDATE USING (bucket_id IN ('admissions', 'aadhaar_cards', 'videos'));

CREATE POLICY "Public Delete Admissions Storage" ON storage.objects 
  FOR DELETE USING (bucket_id IN ('admissions', 'aadhaar_cards', 'videos'));
