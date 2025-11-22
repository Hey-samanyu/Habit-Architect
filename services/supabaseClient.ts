import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

export const isSupabaseConfigured = () => {
    return supabaseUrl && supabaseKey && 
           !supabaseUrl.includes('your-project') && 
           !supabaseKey.includes('your-anon-key');
};

export const supabase = isSupabaseConfigured() 
    ? createClient(supabaseUrl!, supabaseKey!) 
    : null;