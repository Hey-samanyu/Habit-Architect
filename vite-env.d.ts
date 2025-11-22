// Fixed: Removed missing reference to vite/client
// /// <reference types="vite/client" />

export {};

declare global {
  interface ImportMetaEnv {
    readonly API_KEY: string;
    readonly SUPABASE_URL: string;
    readonly SUPABASE_ANON_KEY: string;
  }

  interface ImportMeta {
    readonly env: ImportMetaEnv;
  }

  // Augment NodeJS.ProcessEnv to provide types for process.env variables
  namespace NodeJS {
    interface ProcessEnv {
      API_KEY?: string;
      SUPABASE_URL?: string;
      SUPABASE_ANON_KEY?: string;
      [key: string]: string | undefined;
    }
  }

  // Fixed: Removed conflicting declaration of 'process'
}