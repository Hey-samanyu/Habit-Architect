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
      'process.env.FIREBASE_API_KEY': JSON.stringify(cleanKey(process.env.FIREBASE_API_KEY || env.FIREBASE_API_KEY)),
      'process.env.FIREBASE_AUTH_DOMAIN': JSON.stringify(cleanKey(process.env.FIREBASE_AUTH_DOMAIN || env.FIREBASE_AUTH_DOMAIN)),
      'process.env.FIREBASE_PROJECT_ID': JSON.stringify(cleanKey(process.env.FIREBASE_PROJECT_ID || env.FIREBASE_PROJECT_ID)),
      'process.env.FIREBASE_STORAGE_BUCKET': JSON.stringify(cleanKey(process.env.FIREBASE_STORAGE_BUCKET || env.FIREBASE_STORAGE_BUCKET)),
      'process.env.FIREBASE_MESSAGING_SENDER_ID': JSON.stringify(cleanKey(process.env.FIREBASE_MESSAGING_SENDER_ID || env.FIREBASE_MESSAGING_SENDER_ID)),
      'process.env.FIREBASE_APP_ID': JSON.stringify(cleanKey(process.env.FIREBASE_APP_ID || env.FIREBASE_APP_ID)),
    },
  };
});