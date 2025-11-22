import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Fix: Cast process to any to avoid "Property 'cwd' does not exist on type 'Process'" error
  const env = loadEnv(mode, (process as any).cwd(), '');
  
  // Helper to clean keys
  const cleanKey = (key: string | undefined) => {
    if (!key) return undefined;
    if (key.startsWith('"') || key.startsWith("'")) {
      return key.substring(1, key.length - 1);
    }
    return key;
  };

  // Load variables
  const apiKey = cleanKey(process.env.API_KEY || env.API_KEY);
  const supabaseUrl = cleanKey(process.env.SUPABASE_URL || env.SUPABASE_URL);
  const supabaseKey = cleanKey(process.env.SUPABASE_ANON_KEY || env.SUPABASE_ANON_KEY);

  return {
    plugins: [react()],
    define: {
      'process.env.API_KEY': JSON.stringify(apiKey),
      'process.env.SUPABASE_URL': JSON.stringify(supabaseUrl),
      'process.env.SUPABASE_ANON_KEY': JSON.stringify(supabaseKey),
    },
  };
});