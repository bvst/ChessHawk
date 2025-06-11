import { defineConfig } from 'vite'
import legacy from '@vitejs/plugin-legacy'

export default defineConfig({
  plugins: [
    legacy({
      targets: ['defaults', 'not IE 11']
    })
  ],
  
  // Build configuration
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      input: {
        main: 'index.html',
        test: 'test-basic-load.html'
      }
    }
  },
  
  // Development server
  server: {
    port: 8000,
    open: true,
    host: true
  },
  
  // Asset handling
  assetsInclude: ['**/*.png', '**/*.jpg', '**/*.jpeg', '**/*.gif', '**/*.svg'],
  
  // Resolve configuration
  resolve: {
    alias: {
      '@': '/src',
      '@css': '/src/css',
      '@js': '/src/js',
      '@data': '/src/data'
    }
  },
  
  // CSS configuration
  css: {
    devSourcemap: true
  }
})