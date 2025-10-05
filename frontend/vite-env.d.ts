/// <reference types="vite/client" />

/**
 * Vite Environment Variables
 *
 * Type definitions for environment variables used in the application.
 */

interface ImportMetaEnv {
  readonly VITE_API_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
