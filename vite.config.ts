import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, (process as any).cwd(), '');
  
  const cleanKey = (key: string | undefined) => {
    if (!key) return undefined;
    if (key.startsWith('"') || key.startsWith("'")) {
      return key.substring(1, key.length - 1);
    }
    return key;
  };

  return {
    plugins: [react()],
    define: {
      'process.env.API_KEY': JSON.stringify(cleanKey(process.env.API_KEY || env.API_KEY)),
      'process.env.SUPABASE_URL': JSON.stringify(cleanKey(process.env.SUPABASE_URL || env.SUPABASE_URL)),
      'process.env.SUPABASE_ANON_KEY': JSON.stringify(cleanKey(process.env.SUPABASE_ANON_KEY || env.SUPABASE_ANON_KEY)),
    },
  };
});