import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

let supabase: SupabaseClient;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Missing Supabase environment variables — auth and data features will be unavailable.');
  // Create a dummy client that won't connect but won't crash the app
  supabase = createClient('https://placeholder.supabase.co', 'placeholder');
} else {
  supabase = createClient(supabaseUrl, supabaseAnonKey);
}

export { supabase };
