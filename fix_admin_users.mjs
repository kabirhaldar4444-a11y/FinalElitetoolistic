// fix_admin_users.mjs
// Fixes/creates admin users in Supabase using the Service Role key
// Run with: node fix_admin_users.mjs

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://yfsirevgniajjjdgsgsk.supabase.co';

// ⚠️ We need the SERVICE ROLE key (not anon key) to manage users
// You can find it in: Supabase Dashboard > Project Settings > API > service_role
// PASTE IT BELOW:
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'PASTE_SERVICE_ROLE_KEY_HERE';

if (SERVICE_ROLE_KEY === 'PASTE_SERVICE_ROLE_KEY_HERE') {
  console.error('\n❌ ERROR: Please set SUPABASE_SERVICE_ROLE_KEY environment variable!');
  console.log('\nRun with:');
  console.log('  $env:SUPABASE_SERVICE_ROLE_KEY="your_service_role_key"; node fix_admin_users.mjs\n');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

const adminUsers = [
  { email: 'info@elitetoolistic.com', password: 'qwerty@123', role: 'admin', full_name: 'Super Admin' },
  { email: 'staffadmin@gmail.com',    password: 'ABC123',      role: 'admin', full_name: 'Staff Admin' },
];

async function upsertUser({ email, password, role, full_name }) {
  console.log(`\n🔄 Processing: ${email}`);

  // 1. Check if user exists in auth.users
  const { data: listData, error: listError } = await supabase.auth.admin.listUsers();
  if (listError) { console.error('  ❌ listUsers error:', listError.message); return; }

  const existing = listData.users.find(u => u.email === email);

  let userId;

  if (existing) {
    userId = existing.id;
    console.log(`  ✅ Found existing auth user: ${userId}`);

    // 2a. Update password
    const { error: updateError } = await supabase.auth.admin.updateUserById(userId, {
      password,
      email_confirm: true,
      user_metadata: { role }
    });
    if (updateError) {
      console.error('  ❌ Password update error:', updateError.message);
    } else {
      console.log(`  ✅ Password updated successfully`);
    }
  } else {
    // 2b. Create new user
    const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { role }
    });
    if (createError) {
      console.error('  ❌ Create user error:', createError.message);
      return;
    }
    userId = newUser.user.id;
    console.log(`  ✅ Created new auth user: ${userId}`);
  }

  // 3. Upsert profile
  const { error: profileError } = await supabase.from('profiles').upsert({
    id: userId,
    email,
    role,
    full_name,
    profile_completed: true
  }, { onConflict: 'id' });

  if (profileError) {
    console.error('  ❌ Profile upsert error:', profileError.message);
  } else {
    console.log(`  ✅ Profile set: role=${role}, profile_completed=true`);
  }
}

async function main() {
  console.log('🚀 Elitetoolistic Admin User Fix Script');
  console.log('='.repeat(45));
  console.log(`📡 Connected to: ${SUPABASE_URL}`);

  for (const user of adminUsers) {
    await upsertUser(user);
  }

  console.log('\n' + '='.repeat(45));
  console.log('✅ Done! Try logging in now at http://localhost:5173/');
  console.log('\nCredentials:');
  for (const u of adminUsers) {
    console.log(`  ${u.role.toUpperCase()}: ${u.email} / ${u.password}`);
  }
}

main().catch(console.error);
