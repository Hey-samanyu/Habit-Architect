import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Use process if available (Node env), otherwise empty object to prevent crash
  const processEnv = (typeof process !== 'undefined' ? process.env : {}) as Record<string, string | undefined>;
  
  // Load env file based on mode
  const env = loadEnv(mode, (process as any).cwd ? (process as any).cwd() : '.', '');
  
  // Prioritize Vercel process.env, then .env file
  let apiKey = processEnv.API_KEY || env.API_KEY;
  let supabaseUrl = processEnv.SUPABASE_URL || env.SUPABASE_URL;
  let supabaseKey = processEnv.SUPABASE_ANON_KEY || env.SUPABASE_ANON_KEY;

  // Sanitize keys (remove quotes if present)
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
      // Robustly define process.env variables for the client
      'process.env.API_KEY': JSON.stringify(apiKey),
      'process.env.SUPABASE_URL': JSON.stringify(supabaseUrl),
      'process.env.SUPABASE_ANON_KEY': JSON.stringify(supabaseKey),
      // Prevent "process is not defined" crash in browser if libraries access it
      'process.env': {}, 
    },
  };
});