import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig({
  mode: 'production',
  
  // Build configuration for production
  build: {
    outDir: 'dist',
    sourcemap: false,
    minify: 'terser',
    rollupOptions: {
      input: 'src/js/chess-hawk-production.ts',
      output: {
        // Create a single standalone bundle
        format: 'iife',
        name: 'ChessHawk',
        entryFileNames: 'chess-hawk.min.js',
        inlineDynamicImports: true
      },
      external: [
        // These will be loaded via script tags
        'jquery',
        'chess.js', 
        '@chrisoakman/chessboardjs'
      ]
    },
    // Terser options for better minification
    terserOptions: {
      compress: {
        drop_console: false, // Keep console logs for debugging
        drop_debugger: true
      },
      mangle: {
        reserved: ['Chess', 'Chessboard', '$', 'jQuery']
      }
    }
  },
  
  // Resolve configuration
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@css': resolve(__dirname, './src/css'),
      '@js': resolve(__dirname, './src/js'),
      '@data': resolve(__dirname, './src/data'),
      '@types': resolve(__dirname, './src/types')
    }
  },
  
  // Define global constants for production
  define: {
    __CHESS_HAWK_PRODUCTION__: true,
    __CHESS_HAWK_VERSION__: JSON.stringify(process.env.npm_package_version || '2.0.0')
  }
})