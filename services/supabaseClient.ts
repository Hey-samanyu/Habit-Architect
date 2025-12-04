import { createClient } from '@supabase/supabase-js';

let supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

// Robustly fix URL issues
if (supabaseUrl) {
    // Ensure https://
    if (!supabaseUrl.startsWith('http')) {
        supabaseUrl = `https://${supabaseUrl}`;
    }
    // Remove trailing slash if present (causes auth errors)
    if (supabaseUrl.endsWith('/')) {
        supabaseUrl = supabaseUrl.slice(0, -1);
    }
}

export const supabase = (supabaseUrl && supabaseKey) 
  ? createClient(supabaseUrl, supabaseKey) 
  : null;

export const isSupabaseConfigured = () => {
    return !!supabase;
};