import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [tailwindcss()],
  esbuild: {
    jsxInject: "import React from 'react';",
  },
});