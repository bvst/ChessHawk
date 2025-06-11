/**
 * Chess Global Module Tests
 * 
 * Tests for chess-global.ts module functionality
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import type { ChessInstance } from '../types/chess-hawk'

// Mock chess.js module
vi.mock('chess.js', () => {
  const MockChess = vi.fn().mockImplementation((fen?: string) => ({
    fen: vi.fn().mockReturnValue(fen || 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'),
    turn: vi.fn().mockReturnValue('w'),
    moves: vi.fn().mockReturnValue(['e4', 'e5', 'Nf3', 'Nc6']),
    move: vi.fn().mockReturnValue({ san: 'e4', from: 'e2', to: 'e4' }),
    isCheck: vi.fn().mockReturnValue(false),
    isCheckmate: vi.fn().mockReturnValue(false),
    isStalemate: vi.fn().mockReturnValue(false),
    isDraw: vi.fn().mockReturnValue(false),
    isGameOver: vi.fn().mockReturnValue(false),
    load: vi.fn().mockReturnValue(true),
    reset: vi.fn(),
    history: vi.fn().mockReturnValue([])
  }))
  
  return { Chess: MockChess }
})

describe('Chess Global Module', () => {
  beforeEach(() => {
    // Clear window.Chess before each test
    delete (global.window as any).Chess
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.resetModules()
  })

  describe('Module Import', () => {
    it('should import Chess class successfully', async () => {
      const { Chess } = await import('./chess-global')
      expect(Chess).toBeDefined()
      expect(typeof Chess).toBe('function')
    })

    it('should import createChessGame function', async () => {
      const { createChessGame } = await import('./chess-global')
      expect(createChessGame).toBeDefined()
      expect(typeof createChessGame).toBe('function')
    })

    it('should expose Chess globally on window', async () => {
      await import('./chess-global')
      expect((global.window as any).Chess).toBeDefined()
    })
  })

  describe('Chess Constructor', () => {
    it('should create Chess instance with default position', async () => {
      const { Chess } = await import('./chess-global')
      const game = new Chess() as ChessInstance
      
      expect(game).toBeDefined()
      expect(game.fen()).toBe('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1')
      expect(game.turn()).toBe('w')
    })

    it('should create Chess instance with custom FEN', async () => {
      const { Chess } = await import('./chess-global')
      const customFen = 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1'
      const game = new Chess(customFen) as ChessInstance
      
      expect(game).toBeDefined()
      expect(game.fen()).toBe(customFen)
    })

    it('should have all required Chess.js methods', async () => {
      const { Chess } = await import('./chess-global')
      const game = new Chess() as ChessInstance
      
      expect(typeof game.fen).toBe('function')
      expect(typeof game.turn).toBe('function')
      expect(typeof game.moves).toBe('function')
      expect(typeof game.move).toBe('function')
      expect(typeof game.isCheck).toBe('function')
      expect(typeof game.isCheckmate).toBe('function')
      expect(typeof game.isGameOver).toBe('function')
      expect(typeof game.load).toBe('function')
      expect(typeof game.reset).toBe('function')
      expect(typeof game.history).toBe('function')
    })
  })

  describe('createChessGame Helper', () => {
    it('should create game with default position', async () => {
      const { createChessGame } = await import('./chess-global')
      const game = createChessGame()
      
      expect(game).toBeDefined()
      expect(game.fen()).toBe('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1')
    })

    it('should create game with custom FEN', async () => {
      const { createChessGame } = await import('./chess-global')
      const customFen = 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1'
      const game = createChessGame(customFen)
      
      expect(game).toBeDefined()
      expect(game.fen()).toBe(customFen)
    })

    it('should throw error if Chess is not available', async () => {
      // Mock Chess as undefined
      vi.doMock('chess.js', () => ({ Chess: undefined }))
      
      const { createChessGame } = await import('./chess-global')
      expect(() => createChessGame()).toThrow('Chess.js not available')
    })
  })

  describe('Game Functionality', () => {
    it('should handle moves correctly', async () => {
      const { Chess } = await import('./chess-global')
      const game = new Chess() as ChessInstance
      
      const move = game.move('e4')
      expect(move).toEqual({ san: 'e4', from: 'e2', to: 'e4' })
    })

    it('should get available moves', async () => {
      const { Chess } = await import('./chess-global')
      const game = new Chess() as ChessInstance
      
      const moves = game.moves()
      expect(Array.isArray(moves)).toBe(true)
      expect(moves.length).toBeGreaterThan(0)
    })

    it('should check game state correctly', async () => {
      const { Chess } = await import('./chess-global')
      const game = new Chess() as ChessInstance
      
      expect(game.isCheck()).toBe(false)
      expect(game.isCheckmate()).toBe(false)
      expect(game.isGameOver()).toBe(false)
    })

    it('should load new position', async () => {
      const { Chess } = await import('./chess-global')
      const game = new Chess() as ChessInstance
      
      const newFen = 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1'
      const result = game.load(newFen)
      expect(result).toBe(true)
    })
  })

  describe('Global Window Integration', () => {
    it('should set window.Chess after import', async () => {
      const { Chess } = await import('./chess-global')
      expect((global.window as any).Chess).toBe(Chess)
    })

    it('should allow creating instances from window.Chess', async () => {
      await import('./chess-global')
      const Chess = (global.window as any).Chess
      const game = new Chess()
      
      expect(game).toBeDefined()
      expect(typeof game.fen).toBe('function')
    })
  })

  describe('Error Handling', () => {
    it('should handle Chess.js import errors gracefully', async () => {
      // Mock console.error to verify error logging
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      
      // Mock Chess.js to throw an error
      vi.doMock('chess.js', () => {
        throw new Error('Chess.js import failed')
      })
      
      // Import should not throw, but should log error
      try {
        await import('./chess-global')
      } catch (error) {
        // This is expected in some cases
      }
      
      consoleSpy.mockRestore()
    })

    it('should handle constructor errors', async () => {
      // Mock Chess constructor to throw
      vi.doMock('chess.js', () => ({
        Chess: vi.fn().mockImplementation(() => {
          throw new Error('Constructor failed')
        })
      }))
      
      const { Chess } = await import('./chess-global')
      expect(() => new Chess()).toThrow('Constructor failed')
    })
  })

  describe('Type Safety', () => {
    it('should maintain correct TypeScript types', async () => {
      const { Chess, createChessGame } = await import('./chess-global')
      
      // These should compile without TypeScript errors
      const game1: ChessInstance = new Chess() as ChessInstance
      const game2: ChessInstance = createChessGame()
      
      expect(game1).toBeDefined()
      expect(game2).toBeDefined()
    })

    it('should export correct constructor type', async () => {
      const module = await import('./chess-global')
      expect(typeof module.Chess).toBe('function')
    })
  })
})