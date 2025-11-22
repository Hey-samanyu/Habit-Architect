import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, (process as any).cwd(), '');
  
  let apiKey = process.env.API_KEY || env.API_KEY;
  let supabaseUrl = process.env.SUPABASE_URL || env.SUPABASE_URL;
  let supabaseKey = process.env.SUPABASE_ANON_KEY || env.SUPABASE_ANON_KEY;

  // Sanitize keys
  const sanitize = (key: string | undefined) => {
    if (key && (key.startsWith('"') || key.startsWith("'"))) {
      return key.substring(1, key.length - 1);
    }
    return key;
  }

  apiKey = sanitize(apiKey);
  supabaseUrl = sanitize(supabaseUrl);
  supabaseKey = sanitize(supabaseKey);

  return {
    plugins: [react()],
    define: {
      'process.env.API_KEY': JSON.stringify(apiKey),
      'process.env.SUPABASE_URL': JSON.stringify(supabaseUrl),
      'process.env.SUPABASE_ANON_KEY': JSON.stringify(supabaseKey),
    },
  };
});