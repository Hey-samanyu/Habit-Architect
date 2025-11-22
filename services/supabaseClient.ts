import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

// Helper to check if keys are configured
export const isSupabaseConfigured = () => {
  return !!supabaseUrl && !!supabaseAnonKey && 
         supabaseUrl !== 'undefined' && supabaseAnonKey !== 'undefined';
};

// We create the client conditionally to avoid crashing if keys are missing during development
export const supabase = isSupabaseConfigured() 
  ? createClient(supabaseUrl!, supabaseAnonKey!) 
  : null;