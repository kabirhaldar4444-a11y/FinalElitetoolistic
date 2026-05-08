-- ==========================================
-- SCRIPT TO CREATE THE INITIAL ADMIN USER
-- ==========================================
-- This script creates a fully verified user for the Supabase Auth system
-- and correctly assigns them the 'admin' role in your custom tables.

DO $$
DECLARE
  new_id uuid := gen_random_uuid();
BEGIN
  -- 1. Insert into auth.users
  INSERT INTO auth.users (
    instance_id, id, aud, role, email, encrypted_password, 
    email_confirmed_at, raw_app_meta_data, raw_user_meta_data, 
    created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token
  ) VALUES (
    '00000000-0000-0000-0000-000000000000', new_id, 'authenticated', 'authenticated', 'kabirhaldar4444@gmail.com', crypt('qwerty@123', gen_salt('bf', 10)),
    now(), '{"provider":"email","providers":["email"]}'::jsonb, '{"role":"admin"}'::jsonb, 
    now(), now(), '', '', '', ''
  );

  -- 2. Insert into auth.identities
  INSERT INTO auth.identities (
    id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at
  ) VALUES (
    new_id, new_id, new_id::text, format('{"sub":"%s","email":"%s"}', new_id::text, 'kabirhaldar4444@gmail.com')::jsonb, 'email', now(), now(), now()
  );

  -- 3. Insert into profiles with 'admin' role
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (new_id, 'System Admin', 'admin');
END $$;
