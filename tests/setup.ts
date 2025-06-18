/**
 * Vitest Setup File
 * 
 * Global test configuration and mocks
 */

import { vi } from 'vitest'

// Mock global objects that would normally be provided by the browser
global.window = global.window || {}
global.document = global.document || {}

// Mock jQuery
global.$ = vi.fn()
global.jQuery = vi.fn()

// Mock Chessboard.js
global.Chessboard = vi.fn().mockImplementation(() => ({
  position: vi.fn(),
  clear: vi.fn(),
  destroy: vi.fn(),
  orientation: vi.fn(),
  resize: vi.fn(),
  start: vi.fn()
}))

// Mock console methods for cleaner test output
global.console = {
  ...console,
  log: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
}

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
}
global.localStorage = localStorageMock

// Mock DOM methods commonly used
global.document.getElementById = vi.fn()
global.document.createElement = vi.fn()
global.document.addEventListener = vi.fn()

// Mock fetch globally
global.fetch = vi.fn()

// Reset all mocks before each test
beforeEach(() => {
  vi.clearAllMocks()
})