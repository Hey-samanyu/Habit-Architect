import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // This handles .env.local, .env.production, etc.
  // Fix: Cast process to any to avoid "Property 'cwd' does not exist on type 'Process'" error when Node types are missing/conflicted
  const env = loadEnv(mode, (process as any).cwd(), '');
  
  // Priority: 
  // 1. Environment variable from Vercel System (process.env)
  // 2. .env file loaded by Vite (env)
  let apiKey = process.env.API_KEY || env.API_KEY;

  // Sanitize: Remove extra quotes if the user added them in Vercel
  if (apiKey && (apiKey.startsWith('"') || apiKey.startsWith("'"))) {
    apiKey = apiKey.substring(1, apiKey.length - 1);
  }

  return {
    plugins: [react()],
    define: {
      // Safely pass the API key to the browser code
      // If apiKey is undefined, this becomes "undefined" (string) or undefined (value), which our code handles.
      'process.env.API_KEY': JSON.stringify(apiKey),
    },
  };
});