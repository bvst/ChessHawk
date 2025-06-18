/**
 * Chess Hawk - Tactical Chess Training Library
 * Main entry point for library consumers
 */

// Core exports
export * from './core'
export * from './stores/GameStore'

// Service layer exports  
export * from './services/PuzzleService'

// Type definitions
export * from './types'

// Component abstractions (when available)
export * from './components'

// Utilities
export * from './utils'

// Re-export commonly used types
export type {
  Puzzle,
  UserProgress,
  UserSettings,
  GameState,
  PuzzleFilter,
  SolutionResult
} from './stores/GameStore'

export type {
  IPuzzleService,
  PuzzleServiceConfig
} from './services/PuzzleService'

// Library metadata
export const ChessHawkVersion = '3.0.0'
export const ChessHawkAuthor = 'Chess Hawk Development Team'