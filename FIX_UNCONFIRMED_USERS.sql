-- ============================================================
-- FIX: Confirm all unconfirmed users
-- Run this in: Supabase Dashboard > SQL Editor
-- ============================================================

-- Option 1: Confirm ALL unconfirmed users at once
UPDATE auth.users 
SET 
  email_confirmed_at = NOW(),
  updated_at = NOW()
WHERE email_confirmed_at IS NULL;

-- Option 2: Confirm a SPECIFIC user only (safer)
-- UPDATE auth.users 
-- SET 
--   email_confirmed_at = NOW(),
--   updated_at = NOW()
-- WHERE email = 'user03@gmail.com';

-- Verify: Check if any users are still unconfirmed
SELECT email, email_confirmed_at, created_at 
FROM auth.users 
ORDER BY created_at DESC;
