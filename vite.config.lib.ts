import { defineConfig } from 'vite'
import { resolve } from 'path'
import dts from 'vite-plugin-dts'

// Library build configuration for Chess Hawk
export default defineConfig({
  plugins: [
    dts({
      insertTypesEntry: true,
      include: ['src/**/*'],
      exclude: ['src/**/*.test.ts', 'src/**/*.spec.ts', '**/*.d.ts']
    })
  ],
  
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'ChessHawk',
      formats: ['es', 'umd', 'cjs'],
      fileName: (format) => `chess-hawk.${format}.js`
    },
    rollupOptions: {
      external: [
        'react',
        'react-native', 
        'react-dom',
        'vue',
        'svelte',
        'chess.js',
        '@chrisoakman/chessboardjs',
        'jquery',
        'zustand'
      ],
      output: {
        globals: {
          'react': 'React',
          'react-native': 'ReactNative',
          'react-dom': 'ReactDOM',
          'vue': 'Vue',
          'svelte': 'Svelte',
          'chess.js': 'Chess',
          '@chrisoakman/chessboardjs': 'Chessboard',
          'jquery': '$',
          'zustand': 'zustand'
        },
        exports: 'named'
      }
    },
    sourcemap: true,
    outDir: 'dist/lib',
    emptyOutDir: true
  },
  
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@core': resolve(__dirname, 'src/core'),
      '@components': resolve(__dirname, 'src/components'),
      '@services': resolve(__dirname, 'src/services'),
      '@stores': resolve(__dirname, 'src/stores'),
      '@types': resolve(__dirname, 'src/types'),
      '@utils': resolve(__dirname, 'src/utils')
    }
  },
  
  define: {
    'process.env.NODE_ENV': JSON.stringify('production')
  }
})