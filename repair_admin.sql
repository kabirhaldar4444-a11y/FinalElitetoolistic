-- ==========================================
-- SCRIPT TO REPAIR / UPDATE ADMIN ROLE
-- ==========================================
-- Use this if 'info@elitetoolistic.com' already exists but cannot login as admin.

DO $$
DECLARE
  target_email text := 'kabirhaldar4444@gmail.com';
  user_id uuid;
BEGIN
  -- 1. Get the existing user's ID
  SELECT id INTO user_id FROM auth.users WHERE email = target_email;

  IF user_id IS NULL THEN
    RAISE NOTICE 'User % not found. Please run create_admin.sql instead.', target_email;
  ELSE
    -- 2. Ensure raw_user_meta_data has admin role
    UPDATE auth.users 
    SET raw_user_meta_data = raw_user_meta_data || '{"role":"admin"}'::jsonb
    WHERE id = user_id;

    -- 3. Ensure profile exists and has admin role
    INSERT INTO public.profiles (id, full_name, role)
    VALUES (user_id, 'System Admin', 'admin')
    ON CONFLICT (id) DO UPDATE SET role = 'admin';

    RAISE NOTICE 'User % has been successfully updated to ADMIN role.', target_email;
  END IF;
END $$;
