-- ================================================================
-- ELITETOOLISTIC EXAM PORTAL — COMPLETE DATABASE SETUP SCRIPT
-- ================================================================
-- Run this ONCE in Supabase SQL Editor.
-- Safe to re-run: uses IF NOT EXISTS and ON CONFLICT.
-- ================================================================

-- ────────────────────────────────────────────
-- STEP 1: CLEANUP OLD CONFLICTING POLICIES
-- ────────────────────────────────────────────
DO $$
BEGIN
    DROP POLICY IF EXISTS "Anyone can view profiles" ON public.profiles;
    DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
    DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
    DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
    DROP POLICY IF EXISTS "Service role can insert profiles" ON public.profiles;
    DROP POLICY IF EXISTS "Anyone can view exams" ON public.exams;
    DROP POLICY IF EXISTS "Admins can manage exams" ON public.exams;
    DROP POLICY IF EXISTS "Anyone can view questions" ON public.questions;
    DROP POLICY IF EXISTS "Admins can manage questions" ON public.questions;
    DROP POLICY IF EXISTS "Users can insert their own submissions" ON public.submissions;
    DROP POLICY IF EXISTS "Users can view their own submissions" ON public.submissions;
    DROP POLICY IF EXISTS "Admins can manage submissions" ON public.submissions;
    DROP POLICY IF EXISTS "Public Access" ON storage.objects;
    DROP POLICY IF EXISTS "Authenticated Upload" ON storage.objects;
    DROP POLICY IF EXISTS "Owner Access" ON storage.objects;
EXCEPTION WHEN others THEN NULL;
END $$;

-- ────────────────────────────────────────────
-- STEP 2: TABLES
-- ────────────────────────────────────────────

-- PROFILES TABLE
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid references auth.users not null primary key,
  email text,
  full_name text,
  phone text,
  address text,
  aadhaar_front_url text,
  aadhaar_back_url text,
  pan_url text,
  signature_url text,
  profile_photo_url text,
  profile_completed boolean default false,
  disclaimer_accepted boolean default false,
  role text check (role in ('admin', 'candidate')),
  is_exam_locked boolean default false
);

-- Add missing columns safely if table already exists
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS address text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS aadhaar_front_url text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS aadhaar_back_url text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS pan_url text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS signature_url text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS profile_photo_url text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS profile_completed boolean DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS disclaimer_accepted boolean DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_exam_locked boolean DEFAULT false;

-- EXAMS TABLE
CREATE TABLE IF NOT EXISTS public.exams (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  duration integer not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- QUESTIONS TABLE
CREATE TABLE IF NOT EXISTS public.questions (
  id uuid default gen_random_uuid() primary key,
  exam_id uuid references public.exams on delete cascade not null,
  question_text text not null,
  options jsonb not null,
  correct_option integer not null,
  explanation text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Add explanation column if table already exists
ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS explanation text;

-- SUBMISSIONS TABLE
CREATE TABLE IF NOT EXISTS public.submissions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  exam_id uuid references public.exams not null,
  score integer not null,
  total_questions integer not null,
  answers jsonb not null,
  is_released boolean default false,
  admin_score_override integer,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Add missing columns safely
ALTER TABLE public.submissions ADD COLUMN IF NOT EXISTS is_released boolean DEFAULT false;
ALTER TABLE public.submissions ADD COLUMN IF NOT EXISTS admin_score_override integer;

-- ────────────────────────────────────────────
-- STEP 3: ENABLE ROW LEVEL SECURITY
-- ────────────────────────────────────────────
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;

-- ────────────────────────────────────────────
-- STEP 4: HELPER FUNCTION (needed by all RLS)
-- ────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS text AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER;

-- ────────────────────────────────────────────
-- STEP 5: RLS POLICIES
-- ────────────────────────────────────────────

-- PROFILES
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Service role can insert profiles" ON public.profiles FOR INSERT WITH CHECK (true);

-- EXAMS
CREATE POLICY "Anyone can view exams" ON public.exams FOR SELECT USING (true);
CREATE POLICY "Admins can manage exams" ON public.exams FOR ALL USING (public.get_user_role() = 'admin');

-- QUESTIONS
CREATE POLICY "Anyone can view questions" ON public.questions FOR SELECT USING (true);
CREATE POLICY "Admins can manage questions" ON public.questions FOR ALL USING (public.get_user_role() = 'admin');

-- SUBMISSIONS
CREATE POLICY "Users can insert their own submissions" ON public.submissions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view their own submissions" ON public.submissions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage submissions" ON public.submissions FOR ALL USING (public.get_user_role() = 'admin');

-- ────────────────────────────────────────────
-- STEP 6: STORAGE BUCKET
-- ────────────────────────────────────────────
INSERT INTO storage.buckets (id, name, public)
VALUES ('aadhaar_cards', 'aadhaar_cards', true)
ON CONFLICT (id) DO UPDATE SET public = true;

CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'aadhaar_cards');
CREATE POLICY "Authenticated Upload" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'aadhaar_cards');
CREATE POLICY "Owner Access" ON storage.objects FOR ALL TO authenticated USING (bucket_id = 'aadhaar_cards');

-- ────────────────────────────────────────────
-- STEP 7: RPC FUNCTIONS
-- ────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- RPC 1: Admin Create Candidate
CREATE OR REPLACE FUNCTION public.admin_create_candidate(
  candidate_email text,
  candidate_password text,
  candidate_name text
) RETURNS uuid AS $$
DECLARE
  new_user_id uuid;
  encrypted_pw text;
BEGIN
  IF public.get_user_role() != 'admin' THEN
    RAISE EXCEPTION 'Not authorized to create candidates';
  END IF;
  IF EXISTS (SELECT 1 FROM auth.users WHERE email = candidate_email) THEN
    RAISE EXCEPTION 'User with this email already exists';
  END IF;
  new_user_id := gen_random_uuid();
  encrypted_pw := crypt(candidate_password, gen_salt('bf', 10));
  INSERT INTO auth.users (
    instance_id, id, aud, role, email, encrypted_password,
    email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
    created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token
  ) VALUES (
    '00000000-0000-0000-0000-000000000000', new_user_id, 'authenticated', 'authenticated',
    candidate_email, encrypted_pw, now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"role":"candidate"}'::jsonb,
    now(), now(), '', '', '', ''
  );
  INSERT INTO auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
  VALUES (new_user_id, new_user_id, new_user_id::text,
    format('{"sub":"%s","email":"%s"}', new_user_id::text, candidate_email)::jsonb,
    'email', now(), now(), now()
  );
  INSERT INTO public.profiles (id, email, full_name, role, profile_completed)
  VALUES (new_user_id, candidate_email, candidate_name, 'candidate', false);
  RETURN new_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RPC 2: Admin Delete User
DROP FUNCTION IF EXISTS public.admin_delete_user(uuid);
CREATE OR REPLACE FUNCTION public.admin_delete_user(target_user_id uuid)
RETURNS json AS $$
DECLARE
    caller_role text;
    target_exists boolean;
BEGIN
    caller_role := public.get_user_role();
    IF caller_role != 'admin' THEN
        RAISE EXCEPTION 'Unauthorized: Only admins can delete users';
    END IF;
    IF target_user_id = auth.uid() THEN
        RAISE EXCEPTION 'Safety Violation: You cannot delete your own account';
    END IF;
    SELECT EXISTS(SELECT 1 FROM public.profiles WHERE id = target_user_id) INTO target_exists;
    IF NOT target_exists THEN
        RETURN json_build_object('success', false, 'message', 'User not found or already deleted');
    END IF;
    DELETE FROM public.submissions WHERE user_id = target_user_id;
    DELETE FROM public.profiles WHERE id = target_user_id;
    DELETE FROM auth.users WHERE id = target_user_id;
    RETURN json_build_object('success', true, 'message', 'User deleted successfully', 'timestamp', now());
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Deletion failed: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RPC 3: Admin Update Candidate
CREATE OR REPLACE FUNCTION public.admin_update_candidate(
  target_user_id uuid,
  new_email text,
  new_password text DEFAULT NULL,
  new_name text DEFAULT NULL,
  new_exams_allotted integer DEFAULT NULL
) RETURNS void AS $$
DECLARE
  encrypted_pw text;
BEGIN
  IF public.get_user_role() != 'admin' THEN
    RAISE EXCEPTION 'Not authorized to update candidates';
  END IF;
  UPDATE auth.users SET email = new_email WHERE id = target_user_id;
  IF new_password IS NOT NULL AND new_password != '' THEN
    encrypted_pw := crypt(new_password, gen_salt('bf', 10));
    UPDATE auth.users SET encrypted_password = encrypted_pw WHERE id = target_user_id;
  END IF;
  UPDATE public.profiles SET
    full_name = COALESCE(new_name, full_name),
    email = new_email
  WHERE id = target_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ────────────────────────────────────────────
-- STEP 8: INSERT ADMIN USERS (from auth fix script)
-- ────────────────────────────────────────────
INSERT INTO public.profiles (id, email, role, full_name, profile_completed)
VALUES
  ('f124184f-eed0-4882-83ef-31bc28b7ef9a', 'info@elitetoolistic.com', 'admin', 'Super Admin', true),
  ('620b0234-863f-4dd3-9038-0016e0aa2cf1', 'staffadmin@gmail.com', 'admin', 'Staff Admin', true)
ON CONFLICT (id) DO UPDATE SET
  role = EXCLUDED.role,
  full_name = EXCLUDED.full_name,
  profile_completed = true,
  email = EXCLUDED.email;

-- ────────────────────────────────────────────
-- STEP 9: VERIFY
-- ────────────────────────────────────────────
SELECT 'PROFILES' as table_name, count(*) FROM public.profiles
UNION ALL SELECT 'EXAMS', count(*) FROM public.exams
UNION ALL SELECT 'QUESTIONS', count(*) FROM public.questions
UNION ALL SELECT 'SUBMISSIONS', count(*) FROM public.submissions;
