import { resolve } from 'path';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [],
  base: '/',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: true,
    minify: 'esbuild',
    target: 'es2022',
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        about: resolve(__dirname, 'about/index.html'),
        rules: resolve(__dirname, 'rules/index.html'),
        hallOfFame: resolve(__dirname, 'hall-of-fame/index.html'),
        dontPress: resolve(__dirname, 'dont-press/index.html'),
        getRoasted: resolve(__dirname, 'get-roasted/index.html'),
        challenge: resolve(__dirname, 'challenge/index.html'),
        excuses: resolve(__dirname, 'excuses/index.html'),
        privacy: resolve(__dirname, 'privacy/index.html'),
        terms: resolve(__dirname, 'terms/index.html'),
        notFound: resolve(__dirname, '404.html')
      }
    }
  },
  server: {
    port: 3000,
    open: true
  }
});
