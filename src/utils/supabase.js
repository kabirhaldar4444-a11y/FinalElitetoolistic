import { createClient } from '@supabase/supabase-js';

const DEFAULT_SUPABASE_URL = 'https://yfsirevgniajjjdgsgsk.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlmc2lyZXZnbmlhampqZGdzZ3NrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE1ODYzODUsImV4cCI6MjA5NzE2MjM4NX0.IzohNG_S3dUcNw96ebbZ0c-EivTK35XnFneHOap4-R4';

const rawUrl = import.meta.env.VITE_SUPABASE_URL;
const rawKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const supabaseUrl = (rawUrl && rawUrl !== 'PLACEHOLDER_URL') ? rawUrl : DEFAULT_SUPABASE_URL;
const supabaseAnonKey = (rawKey && rawKey !== 'PLACEHOLDER_KEY') ? rawKey : DEFAULT_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: window.sessionStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});

export default supabase;
