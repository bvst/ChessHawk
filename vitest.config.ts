import { defineConfig } from 'vitest/config'
import { resolve } from 'path'

export default defineConfig({
  test: {
    // Test environment
    environment: 'node',
    
    // Global setup
    globals: true,
    
    // Test file patterns
    include: [
      'src/**/*.test.ts',
      'src/**/*.spec.ts',
      'tests/**/*.test.ts',
      'tests/**/*.spec.ts'
    ],
    
    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text'],
      reportsDirectory: './coverage',
      exclude: [
        'node_modules/',
        'src/lib/',
        'tests/',
        '**/*.d.ts',
        '**/*.config.*',
        'dist/',
        'backup-js/',
        'src/types/',
        'vite.config.ts',
        'vitest.config.ts'
      ],
      include: [
        'src/js/**/*.ts'
      ],
      thresholds: {
        global: {
          lines: 80,
          functions: 80,
          branches: 75,
          statements: 80
        }
      },
      watermarks: {
        lines: [80, 95],
        functions: [80, 95],
        branches: [75, 90],
        statements: [80, 95]
      }
    },
    
    // Setup files
    setupFiles: ['./tests/setup.ts'],
    
    // Mock configuration
    mockReset: true,
    clearMocks: true,
    
    // Reporter configuration
    reporter: ['verbose'],
    
    // Watch configuration
    watch: true,
  },
  
  // Resolve configuration for imports
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@css': resolve(__dirname, './src/css'),
      '@js': resolve(__dirname, './src/js'),
      '@data': resolve(__dirname, './src/data'),
      '@types': resolve(__dirname, './src/types')
    }
  },
  
  // Define configuration for TypeScript
  define: {
    'import.meta.vitest': 'undefined',
  },
})