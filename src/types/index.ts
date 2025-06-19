/**
 * Chess Hawk Type Definitions
 * Shared types across the entire library
 */

// Production-ready concrete puzzle types (PRIMARY)
export * from './puzzle.types';

// Re-export all types from stores and services (SECONDARY)
export type {
  UserSettings,
  GameState,
  GameActions,
  UserStats,
  ThemeProgress
} from '../stores/game-store'

export type {
  IPuzzleService,
  PuzzleServiceConfig,
  UserProgressData,
  ExportedUserData,
  UserProgress,
  SolutionResult,
  PuzzleFilter
} from '../services/puzzle-service'

// Component types
export interface ChessHawkLibraryConfig {
  puzzleService?: {
    type: 'local' | 'api'
    baseUrl?: string
    apiKey?: string
  }
  ui?: {
    theme?: 'light' | 'dark' | 'auto'
    language?: 'en' | 'no'
    boardTheme?: string
    pieceSet?: string
  }
  features?: {
    enableHints?: boolean
    enableSolutions?: boolean
    enableProgress?: boolean
    enableStatistics?: boolean
  }
  platform?: {
    target: 'web' | 'react-native' | 'electron'
    legacy?: boolean
  }
}

// Move types
export interface ChessMove {
  from: string
  to: string
  promotion?: 'q' | 'r' | 'b' | 'n'
  san?: string // Standard Algebraic Notation
  fen?: string // Position after move
}

// Board state types
export interface BoardState {
  fen: string
  turn: 'w' | 'b'
  castling: string
  enPassant: string | null
  halfMove: number
  fullMove: number
}

// Event types
export interface PuzzleEvent {
  type: 'puzzle_loaded' | 'move_made' | 'puzzle_solved' | 'puzzle_failed' | 'hint_requested' | 'solution_shown'
  puzzle?: Puzzle
  move?: ChessMove
  success?: boolean
  timeSpent?: number
  attempts?: number
}

export interface GameEvent {
  type: 'game_started' | 'game_paused' | 'game_resumed' | 'game_ended'
  timestamp: number
  data?: any
}

// Callback types
export type PuzzleEventHandler = (event: PuzzleEvent) => void
export type GameEventHandler = (event: GameEvent) => void
export type MoveHandler = (move: ChessMove) => boolean
export type PositionHandler = (fen: string) => void

// Error types
export interface ChessHawkError extends Error {
  code: string
  context?: any
}

export class PuzzleNotFoundError extends Error implements ChessHawkError {
  code = 'PUZZLE_NOT_FOUND'
  constructor(puzzleId: string) {
    super(`Puzzle not found: ${puzzleId}`)
  }
}

export class InvalidMoveError extends Error implements ChessHawkError {
  code = 'INVALID_MOVE'
  constructor(move: string) {
    super(`Invalid move: ${move}`)
  }
}

export class ServiceInitializationError extends Error implements ChessHawkError {
  code = 'SERVICE_INIT_ERROR'
  context?: { service: string; cause?: Error }
  
  constructor(service: string, cause?: Error) {
    super(`Failed to initialize ${service}: ${cause?.message || 'Unknown error'}`)
    this.context = { service, cause }
  }
}

// Utility types - use concrete types from puzzle.types.ts
export type Platform = 'web' | 'react-native' | 'electron' | 'tauri'
export type Theme = 'light' | 'dark' | 'auto'
export type Language = 'en' | 'no'

// Import concrete types instead of redefining
export type { PuzzleDifficulty as Difficulty, TacticalTheme as PuzzleTheme } from './puzzle.types';

// Backward compatibility aliases
export type { Puzzle as ChessPuzzle } from './puzzle.types';

// Configuration validation
export function validateConfig(config: ChessHawkLibraryConfig): string[] {
  const errors: string[] = []
  
  if (config.puzzleService?.type === 'api' && !config.puzzleService.baseUrl) {
    errors.push('API base URL is required when using API puzzle service')
  }
  
  if (config.platform?.target && !['web', 'react-native', 'electron', 'tauri'].includes(config.platform.target)) {
    errors.push(`Invalid platform target: ${config.platform.target}`)
  }
  
  if (config.ui?.theme && !['light', 'dark', 'auto'].includes(config.ui.theme)) {
    errors.push(`Invalid theme: ${config.ui.theme}`)
  }
  
  if (config.ui?.language && !['en', 'no'].includes(config.ui.language)) {
    errors.push(`Invalid language: ${config.ui.language}`)
  }
  
  return errors
}

// Version information
export const CHESS_HAWK_VERSION = '3.0.0'
export const SUPPORTED_PLATFORMS: Platform[] = ['web', 'react-native', 'electron']
export const SUPPORTED_LANGUAGES: Language[] = ['en', 'no']
export const SUPPORTED_THEMES: Theme[] = ['light', 'dark', 'auto']