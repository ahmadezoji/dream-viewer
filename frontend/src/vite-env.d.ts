/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

// plotly.js-basic-dist-min ships without type declarations; we consume it
// through react-plotly.js's factory, so a loose module declaration suffices.
declare module 'plotly.js-basic-dist-min';
