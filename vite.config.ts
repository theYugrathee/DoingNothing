import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [],
  base: './',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: true,
    minify: 'esbuild',
    target: 'es2022'
  },
  server: {
    port: 3000,
    open: true
  }
});
