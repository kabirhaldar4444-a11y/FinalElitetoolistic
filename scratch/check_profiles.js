import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://yfsirevgniajjjdgsgsk.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlmc2lyZXZnbmlhampqZGdzZ3NrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE1ODYzODUsImV4cCI6MjA5NzE2MjM4NX0.IzohNG_S3dUcNw96ebbZ0c-EivTK35XnFneHOap4-R4';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('id, email, full_name, role, aadhaar_front_url, aadhaar_back_url, pan_url, profile_photo_url');
  
  if (error) {
    console.error("Error fetching profiles:", error);
  } else {
    console.log("Profiles found:", JSON.stringify(profiles, null, 2));
  }
}

run();
