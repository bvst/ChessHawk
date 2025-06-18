/**
 * Chess Hawk Utilities
 * Common utility functions and helpers
 */

import type { ChessMove, BoardState, Platform } from '../types'

// Platform detection utilities
export function detectPlatform(): Platform {
  if (typeof window !== 'undefined') {
    // Browser environment
    if ((window as any).__TAURI__) {
      return 'tauri'
    }
    if ((window as any).require && (window as any).process?.versions?.electron) {
      return 'electron'
    }
    return 'web'
  } else if (typeof global !== 'undefined' && (global as any).__DEV__ !== undefined) {
    // React Native environment
    return 'react-native'
  } else {
    // Node.js or other environment
    return 'web' // Default fallback
  }
}

export function isBrowser(): boolean {
  return typeof window !== 'undefined'
}

export function isReactNative(): boolean {
  return typeof global !== 'undefined' && (global as any).__DEV__ !== undefined
}

export function isElectron(): boolean {
  return isBrowser() && (window as any).require && (window as any).process?.versions?.electron
}

// Chess utilities
export function isValidSquare(square: string): boolean {
  return /^[a-h][1-8]$/.test(square)
}

export function isValidFEN(fen: string): boolean {
  // Basic FEN validation
  const parts = fen.split(' ')
  if (parts.length !== 6) return false
  
  const [position, turn, castling, enPassant, halfMove, fullMove] = parts
  
  // Validate position
  const ranks = position.split('/')
  if (ranks.length !== 8) return false
  
  // Validate turn
  if (!['w', 'b'].includes(turn)) return false
  
  // Validate castling
  if (!/^[KQkq]*$/.test(castling)) return false
  
  // Validate en passant
  if (enPassant !== '-' && !isValidSquare(enPassant)) return false
  
  // Validate move numbers
  if (isNaN(parseInt(halfMove)) || isNaN(parseInt(fullMove))) return false
  
  return true
}

export function parseFEN(fen: string): BoardState | null {
  if (!isValidFEN(fen)) return null
  
  const parts = fen.split(' ')
  if (parts.length !== 6) return null
  
  const [, turn, castling, enPassant, halfMove, fullMove] = parts
  
  if (!turn || !castling || !enPassant || !halfMove || !fullMove) {
    return null
  }
  
  return {
    fen,
    turn: turn as 'w' | 'b',
    castling,
    enPassant: enPassant === '-' ? null : enPassant,
    halfMove: parseInt(halfMove),
    fullMove: parseInt(fullMove)
  }
}

export function moveToAlgebraicNotation(move: ChessMove): string {
  let notation = move.from + move.to
  if (move.promotion) {
    notation += move.promotion
  }
  return notation
}

export function parseAlgebraicMove(notation: string): ChessMove | null {
  const match = notation.match(/^([a-h][1-8])([a-h][1-8])([qrbn])?$/)
  if (!match || !match[1] || !match[2]) return null
  
  return {
    from: match[1],
    to: match[2],
    promotion: match[3] as 'q' | 'r' | 'b' | 'n' | undefined
  }
}

// Timing utilities
export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

export function parseTime(timeString: string): number {
  const match = timeString.match(/^(\d+):(\d{2})$/)
  if (!match || !match[1] || !match[2]) return 0
  
  return parseInt(match[1]) * 60 + parseInt(match[2])
}

// Scoring utilities
export function calculateScore(timeSpent: number, attempts: number, puzzleRating: number): number {
  const baseScore = 100
  const timePenalty = Math.max(0, timeSpent - 30) * 0.5 // Penalty for time over 30 seconds
  const attemptPenalty = (attempts - 1) * 10 // Penalty for multiple attempts
  const ratingBonus = (puzzleRating - 1000) / 100 // Bonus for harder puzzles
  
  return Math.max(0, Math.round(baseScore - timePenalty - attemptPenalty + ratingBonus))
}

export function calculateRatingChange(success: boolean, puzzleRating: number, userRating: number): number {
  const k = 32 // K-factor for rating changes
  const expected = 1 / (1 + Math.pow(10, (puzzleRating - userRating) / 400))
  const actual = success ? 1 : 0
  
  return Math.round(k * (actual - expected))
}

// Data validation utilities
export function validatePuzzle(puzzle: any): string[] {
  const errors: string[] = []
  
  if (!puzzle.id) errors.push('Missing puzzle ID')
  if (!puzzle.fen) errors.push('Missing FEN')
  if (!puzzle.solution || !Array.isArray(puzzle.solution) || puzzle.solution.length === 0) {
    errors.push('Invalid solution')
  }
  if (!puzzle.theme) errors.push('Missing theme')
  if (typeof puzzle.rating !== 'number' || puzzle.rating < 500 || puzzle.rating > 3000) {
    errors.push('Invalid rating')
  }
  if (!['beginner', 'intermediate', 'advanced'].includes(puzzle.difficulty)) {
    errors.push('Invalid difficulty')
  }
  
  return errors
}

// Error handling utilities
export function createErrorHandler(context: string) {
  return (error: Error | unknown) => {
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.error(`[${context}] Error:`, errorMessage)
    
    if (error instanceof Error && error.stack) {
      console.error('Stack trace:', error.stack)
    }
  }
}

export function withErrorHandling<T extends (...args: any[]) => any>(
  fn: T,
  context: string
): T {
  return ((...args: any[]) => {
    try {
      const result = fn(...args)
      
      // Handle async functions
      if (result instanceof Promise) {
        return result.catch(createErrorHandler(context))
      }
      
      return result
    } catch (error) {
      createErrorHandler(context)(error)
      throw error
    }
  }) as T
}

// Storage utilities (platform-agnostic)
export interface StorageAdapter {
  getItem(key: string): string | null | Promise<string | null>
  setItem(key: string, value: string): void | Promise<void>
  removeItem(key: string): void | Promise<void>
  clear(): void | Promise<void>
}

export class BrowserStorageAdapter implements StorageAdapter {
  constructor(private storage: Storage = localStorage) {}
  
  getItem(key: string): string | null {
    return this.storage.getItem(key)
  }
  
  setItem(key: string, value: string): void {
    this.storage.setItem(key, value)
  }
  
  removeItem(key: string): void {
    this.storage.removeItem(key)
  }
  
  clear(): void {
    this.storage.clear()
  }
}

export class MemoryStorageAdapter implements StorageAdapter {
  private data: Map<string, string> = new Map()
  
  getItem(key: string): string | null {
    return this.data.get(key) || null
  }
  
  setItem(key: string, value: string): void {
    this.data.set(key, value)
  }
  
  removeItem(key: string): void {
    this.data.delete(key)
  }
  
  clear(): void {
    this.data.clear()
  }
}

export function createStorageAdapter(): StorageAdapter {
  if (isBrowser()) {
    return new BrowserStorageAdapter()
  } else {
    return new MemoryStorageAdapter()
  }
}

// Debug utilities
export function enableDebugMode(): void {
  if (isBrowser()) {
    (window as any).CHESS_HAWK_DEBUG = true
  } else {
    (global as any).CHESS_HAWK_DEBUG = true
  }
}

export function isDebugMode(): boolean {
  if (isBrowser()) {
    return !!(window as any).CHESS_HAWK_DEBUG
  } else {
    return !!(global as any).CHESS_HAWK_DEBUG
  }
}

export function debugLog(...args: any[]): void {
  if (isDebugMode()) {
    console.log('[Chess Hawk Debug]', ...args)
  }
}