
import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

let client: SupabaseClient;

// Check if keys are present and not empty strings (common issue with some env setups)
const hasKeys = supabaseUrl && supabaseAnonKey && supabaseUrl.length > 0 && supabaseAnonKey.length > 0;

if (!hasKeys) {
  console.warn('Supabase keys are missing. Authentication will not work until keys are added to Vercel Environment Variables.');
  // Initialize with dummy values to prevent "URL is required" crash during app load.
  // This allows the UI to render so the user sees the Auth Screen (which will then fail gracefully or show an error).
  client = createClient('https://placeholder.supabase.co', 'placeholder');
} else {
  client = createClient(supabaseUrl!, supabaseAnonKey!);
}

export const supabase = client;

export const isSupabaseConfigured = () => {
    return hasKeys && supabaseUrl !== 'https://placeholder.supabase.co';
};
