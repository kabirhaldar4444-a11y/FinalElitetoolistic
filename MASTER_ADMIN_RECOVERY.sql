-- ==========================================
-- MASTER PASSWORD RECOVERY & PROFILE SETUP
-- ==========================================
-- Run this in Supabase SQL Editor to ensure your Master Admin UID 
-- is correctly mapped to the admin role in your profiles table.

INSERT INTO public.profiles (id, email, role, profile_completed)
VALUES ('1b0a4dd1-024f-41c4-b1fd-c22a5268a9fd', 'kabirhaldar4444@gmail.com', 'admin', true)
ON CONFLICT (id) DO UPDATE SET role = 'admin', profile_completed = true;

-- Optional: Ensure the auth.users table also has the correct role in metadata
UPDATE auth.users 
SET raw_user_meta_data = raw_user_meta_data || '{"role":"admin"}'::jsonb
WHERE email IN ('kabirhaldar4444@gmail.com', 'support@elitetoolistic.com');
