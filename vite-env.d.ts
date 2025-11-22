// /// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly API_KEY: string;
  readonly SUPABASE_URL: string;
  readonly SUPABASE_ANON_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

// Augment the NodeJS namespace to fix 'process' errors without needing @types/node
declare global {
  namespace NodeJS {
    interface ProcessEnv {
      API_KEY: string;
      SUPABASE_URL: string;
      SUPABASE_ANON_KEY: string;
      [key: string]: string | undefined;
    }
  }
}

export {}