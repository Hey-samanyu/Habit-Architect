import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
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

  return {
    plugins: [react()],
    define: {
      // Strictly define API_KEY
      'process.env.API_KEY': JSON.stringify(apiKey),
    },
  };
});