/**
 * Board Integration Tests
 * 
 * Simple tests for chess board functionality without excessive mocking.
 * Focus on move validation and basic board operations.
 */

import { describe, it, expect } from 'vitest'

describe('Chess Board Integration', () => {
  
  describe('Move Validation', () => {
    it('should validate chess moves correctly', async () => {
      const { Chess } = await import('./chess-global')
      
      const game = new Chess()
      
      // Test legal moves
      const legalMoves = ['e4', 'e3', 'd4', 'd3', 'Nf3', 'Nc3']
      for (const move of legalMoves) {
        const testGame = new Chess()
        const result = testGame.move(move)
        expect(result).toBeTruthy()
        expect(result.san).toBe(move)
      }
    })
    
    it('should reject illegal moves', async () => {
      const { Chess } = await import('./chess-global')
      
      const game = new Chess()
      
      // Test illegal moves - newer Chess.js throws errors
      const illegalMoves = ['e5', 'e6', 'Ke2', 'Qd5', 'invalid']
      for (const move of illegalMoves) {
        const testGame = new Chess()
        expect(() => testGame.move(move)).toThrow()
      }
    })
  })
  
  describe('Position Management', () => {
    it('should load positions from FEN correctly', async () => {
      const { Chess } = await import('./chess-global')
      
      const testPositions = [
        'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1', // Starting position
        'rnbqkb1r/pppp1ppp/5n2/4p3/2B1P3/8/PPPP1PPP/RNBQK1NR w KQkq - 2 3', // After 1.e4 e5 2.Bc4 Nf6
        '8/8/8/8/8/8/8/K6k w - - 0 1' // King endgame
      ]
      
      for (const fen of testPositions) {
        const game = new Chess(fen)
        expect(game.fen()).toBe(fen)
      }
    })
    
    it('should handle position validation', async () => {
      const { Chess } = await import('./chess-global')
      
      // Valid position - Chess.js may normalize en passant field
      const validFen = 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1'
      const game1 = new Chess(validFen)
      expect(game1.turn()).toBe('b')
      expect(game1.fen()).toContain('rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq')
      
      // Invalid position should throw
      const invalidFen = 'invalid-fen-string'
      expect(() => new Chess(invalidFen)).toThrow()
    })
  })
  
  describe('Game State Detection', () => {
    it('should detect checkmate correctly', async () => {
      const { Chess } = await import('./chess-global')
      
      // Scholar's mate position
      const game = new Chess()
      game.move('e4')
      game.move('e5')
      game.move('Bc4')
      game.move('Nc6')
      game.move('Qh5')
      game.move('Nf6')
      game.move('Qxf7')
      
      expect(game.isCheckmate()).toBe(true)
      expect(game.isGameOver()).toBe(true)
    })
    
    it('should detect check correctly', async () => {
      const { Chess } = await import('./chess-global')
      
      // Create a simple check position
      const game = new Chess()
      game.move('e4')
      game.move('f6')  // Weak move
      game.move('Qh5') // Queen gives check
      
      expect(game.isCheck()).toBe(true)
      expect(game.isCheckmate()).toBe(false)
      expect(game.isGameOver()).toBe(false)
    })
    
    it('should detect stalemate', async () => {
      const { Chess } = await import('./chess-global')
      
      // Create a valid stalemate position - king vs king + pawn
      const stalemateFen = '8/8/8/8/8/8/p7/k1K5 b - - 0 1'
      const game = new Chess(stalemateFen)
      
      expect(game.isStalemate()).toBe(true)
      expect(game.isGameOver()).toBe(true)
      expect(game.isCheckmate()).toBe(false)
    })
  })
  
  describe('Move History', () => {
    it('should track move history correctly', async () => {
      const { Chess } = await import('./chess-global')
      
      const game = new Chess()
      
      // Initially no moves
      expect(game.history()).toEqual([])
      
      // Make some moves
      game.move('e4')
      game.move('e5')
      game.move('Nf3')
      
      const history = game.history()
      expect(history).toEqual(['e4', 'e5', 'Nf3'])
      expect(history.length).toBe(3)
    })
  })
  
  describe('Legal Moves Generation', () => {
    it('should generate correct legal moves for starting position', async () => {
      const { Chess } = await import('./chess-global')
      
      const game = new Chess()
      const moves = game.moves()
      
      expect(Array.isArray(moves)).toBe(true)
      expect(moves.length).toBe(20) // 20 legal moves in starting position
      
      // Check some expected moves
      expect(moves).toContain('e4')
      expect(moves).toContain('e3')
      expect(moves).toContain('Nf3')
      expect(moves).toContain('Nc3')
    })
    
    it('should generate moves for specific positions', async () => {
      const { Chess } = await import('./chess-global')
      
      // Position where white has limited moves - king endgame
      const limitedFen = '8/8/8/8/8/8/k6p/K7 w - - 0 1'
      const game = new Chess(limitedFen)
      const moves = game.moves()
      
      expect(moves.length).toBeGreaterThan(0)
      expect(moves.length).toBeLessThan(10) // Limited moves available
    })
  })
  
  describe('Turn Management', () => {
    it('should alternate turns correctly', async () => {
      const { Chess } = await import('./chess-global')
      
      const game = new Chess()
      
      // White starts
      expect(game.turn()).toBe('w')
      
      // After white move, black's turn
      game.move('e4')
      expect(game.turn()).toBe('b')
      
      // After black move, white's turn
      game.move('e5')
      expect(game.turn()).toBe('w')
    })
  })
})