// /// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly API_KEY: string;
  readonly FIREBASE_API_KEY: string;
  readonly FIREBASE_AUTH_DOMAIN: string;
  readonly FIREBASE_PROJECT_ID: string;
  readonly FIREBASE_STORAGE_BUCKET: string;
  readonly FIREBASE_MESSAGING_SENDER_ID: string;
  readonly FIREBASE_APP_ID: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      API_KEY: string;
      FIREBASE_API_KEY: string;
      FIREBASE_AUTH_DOMAIN: string;
      FIREBASE_PROJECT_ID: string;
      FIREBASE_STORAGE_BUCKET: string;
      FIREBASE_MESSAGING_SENDER_ID: string;
      FIREBASE_APP_ID: string;
      [key: string]: string | undefined;
    }
  }
}

export {}