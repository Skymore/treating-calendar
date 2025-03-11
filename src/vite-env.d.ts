/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
  readonly VITE_APP_URL: string;
  readonly VITE_PORT: string;
  readonly VITE_APP_DEV_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
} 