
import { createClient } from '@supabase/supabase-js';

// User provided credentials as defaults
const DEFAULT_URL = 'https://isfqdvhtqeuyywwmyvpx.supabase.co';
const DEFAULT_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlzZnFkdmh0cWV1eXl3d215dnB4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMwNTE2OTEsImV4cCI6MjA3ODYyNzY5MX0.pvTd1KYakHfWUMrVmPyZ-XVZC2OlYX3Ueq9n3ns7jII';

let supabaseUrl = process.env.SUPABASE_URL || DEFAULT_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY || DEFAULT_KEY;

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
