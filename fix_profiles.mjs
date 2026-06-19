// fix_profiles.mjs - Upsert profiles using direct SQL via Supabase REST
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://yfsirevgniajjjdgsgsk.supabase.co';
const SECRET_KEY = 'sb_secret_4MLvxXGtVeKoHQJlGgQl2Q_LfHlp6HZ';

const supabase = createClient(SUPABASE_URL, SECRET_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

const users = [
  { email: 'info@elitetoolistic.com',  id: 'f124184f-eed0-4882-83ef-31bc28b7ef9a', role: 'admin', full_name: 'Super Admin' },
  { email: 'staffadmin@gmail.com',     id: '620b0234-863f-4dd3-9038-0016e0aa2cf1', role: 'admin', full_name: 'Staff Admin' },
];

async function run() {
  console.log('🚀 Fixing Profiles via SQL...\n');

  for (const u of users) {
    console.log(`🔄 Upserting profile for ${u.email} (${u.id})`);

    // Try direct SQL using rpc
    const { data, error } = await supabase.rpc('exec_sql', {
      query: `
        INSERT INTO public.profiles (id, email, role, full_name, profile_completed)
        VALUES ('${u.id}', '${u.email}', '${u.role}', '${u.full_name}', true)
        ON CONFLICT (id) DO UPDATE SET
          role = '${u.role}',
          full_name = '${u.full_name}',
          profile_completed = true,
          email = '${u.email}';
      `
    });

    if (error) {
      console.log(`  ⚠️  RPC failed (${error.message}), trying raw fetch...`);

      // Fallback: use raw REST with service key as Authorization
      const res = await fetch(`${SUPABASE_URL}/rest/v1/profiles`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SECRET_KEY}`,
          'apikey': SECRET_KEY,
          'Prefer': 'resolution=merge-duplicates'
        },
        body: JSON.stringify({
          id: u.id,
          email: u.email,
          role: u.role,
          full_name: u.full_name,
          profile_completed: true
        })
      });

      const text = await res.text();
      if (res.ok || res.status === 201 || res.status === 200) {
        console.log(`  ✅ Profile upserted via REST`);
      } else {
        console.log(`  ❌ REST failed (${res.status}): ${text}`);
        
        // Last resort: try the anon key with service role header
        console.log(`  🔄 Trying with publishable key...`);
        const ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlmc2lyZXZnbmlhampqZGdzZ3NrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE1ODYzODUsImV4cCI6MjA5NzE2MjM4NX0.IzohNG_S3dUcNw96ebbZ0c-EivTK35XnFneHOap4-R4';
        const res2 = await fetch(`${SUPABASE_URL}/rest/v1/profiles`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${SECRET_KEY}`,
            'apikey': ANON,
            'Prefer': 'resolution=merge-duplicates'
          },
          body: JSON.stringify({
            id: u.id,
            email: u.email,
            role: u.role,
            full_name: u.full_name,
            profile_completed: true
          })
        });
        const text2 = await res2.text();
        console.log(`  Status: ${res2.status} → ${text2 || '(empty = success)'}`);
      }
    } else {
      console.log(`  ✅ Profile upserted via RPC`);
    }
  }

  // Verify by listing profiles
  console.log('\n📋 Verifying profiles table...');
  const res = await fetch(`${SUPABASE_URL}/rest/v1/profiles?select=id,email,role,profile_completed`, {
    headers: {
      'Authorization': `Bearer ${SECRET_KEY}`,
      'apikey': SECRET_KEY,
    }
  });
  const text = await res.text();
  console.log(`Status: ${res.status}`);
  console.log(`Response: ${text}`);
}

run().catch(console.error);
