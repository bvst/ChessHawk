/**
 * Chess.js Integration Tests
 * 
 * Simple tests to verify Chess.js library works correctly.
 * No mocking - test real chess functionality.
 */

import { describe, it, expect } from 'vitest'

describe('Chess.js Integration', () => {
  
  it('should create and use Chess instances', async () => {
    const { Chess } = await import('./chess-global')
    
    const game = new Chess()
    expect(game).toBeDefined()
    
    // Test basic chess functionality
    const initialFen = game.fen()
    expect(initialFen).toBe('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1')
    
    const turn = game.turn()
    expect(turn).toBe('w')
    
    const moves = game.moves()
    expect(Array.isArray(moves)).toBe(true)
    expect(moves.length).toBeGreaterThan(0)
  })
  
  it('should handle chess moves correctly', async () => {
    const { Chess } = await import('./chess-global')
    
    const game = new Chess()
    
    // Make a legal move
    const move = game.move('e4')
    expect(move).toBeTruthy()
    expect(move.san).toBe('e4')
    
    // Turn should switch
    expect(game.turn()).toBe('b')
    
    // Make another move
    const move2 = game.move('e5')
    expect(move2).toBeTruthy()
    expect(move2.san).toBe('e5')
  })
  
  it('should reject illegal moves', async () => {
    const { Chess } = await import('./chess-global')
    
    const game = new Chess()
    
    // Try illegal moves - newer Chess.js throws errors instead of returning null
    expect(() => game.move('e5')).toThrow() // Can't move pawn two squares from starting position to e5
    expect(() => game.move('Ke2')).toThrow() // King can't move when not in check
    expect(() => game.move('invalid')).toThrow() // Invalid notation
    
    // Position shouldn't change after illegal moves
    expect(game.fen()).toBe('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1')
  })
  
  it('should work with custom positions', async () => {
    const { Chess } = await import('./chess-global')
    
    const customFen = 'rnbqkb1r/pppp1ppp/5n2/4p3/2B1P3/8/PPPP1PPP/RNBQK1NR w KQkq - 2 3'
    const game = new Chess(customFen)
    
    // Chess.js may normalize the FEN, so just check the position is loaded correctly
    expect(game.turn()).toBe('w')
    expect(game.fen()).toContain('rnbqkb1r/pppp1ppp/5n2/4p3/2B1P3/8/PPPP1PPP/RNBQK1NR w KQkq')
    
    // Should be able to make moves from this position
    const move = game.move('d3')
    expect(move).toBeTruthy()
  })
})