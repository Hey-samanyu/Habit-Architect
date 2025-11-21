import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, (process as any).cwd(), '');
  
  // Priority: 
  // 1. Environment variable from shell/Vercel (process.env.API_KEY)
  // 2. .env file loaded by Vite (env.API_KEY)
  const apiKey = process.env.API_KEY || env.API_KEY;

  return {
    plugins: [react()],
    define: {
      // Safely pass the API key to the browser
      'process.env.API_KEY': JSON.stringify(apiKey),
    },
  };
});