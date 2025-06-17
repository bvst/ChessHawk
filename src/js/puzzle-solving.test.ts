/**
 * Puzzle Solving Core Tests
 * 
 * Focus on the essential puzzle solving logic without excessive mocking.
 * Tests real chess moves and solution validation.
 */

import { describe, it, expect, beforeEach } from 'vitest'

describe('Puzzle Solving Core Logic', () => {
  
  describe('Basic Solution Checking', () => {
    it('should identify correct single-move solutions', async () => {
      const { Chess } = await import('./chess-global')
      
      // Simple puzzle: White to play basic opening
      const puzzle = {
        id: 'simple_opening',
        fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
        solution: [{ move: 'e4', explanation: 'Control center' }]
      }
      
      const game = new Chess(puzzle.fen)
      
      // Test the correct solution
      const correctMove = game.move(puzzle.solution[0].move)
      expect(correctMove).toBeTruthy()
      expect(correctMove.san).toBe('e4')
      
      // Reset and test incorrect move
      const game2 = new Chess(puzzle.fen)
      const incorrectMove = game2.move('d4')
      expect(incorrectMove).toBeTruthy() // Legal but not the solution
      expect(incorrectMove.san).not.toBe(puzzle.solution[0].move)
    })
    
    it('should handle multi-move puzzle sequences', async () => {
      const { Chess } = await import('./chess-global')
      
      // Multi-move puzzle - scholar's mate sequence
      const puzzle = {
        id: 'scholars_mate',
        fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
        solution: [
          { move: 'e4', explanation: 'Control center' },
          { move: 'e5', explanation: 'Counter center', opponentResponse: true },
          { move: 'Bc4', explanation: 'Develop bishop' }
        ]
      }
      
      const game = new Chess(puzzle.fen)
      
      // Execute the solution sequence
      let move = game.move(puzzle.solution[0].move)
      expect(move).toBeTruthy()
      expect(move.san).toBe('e4')
      
      move = game.move(puzzle.solution[1].move)
      expect(move).toBeTruthy()
      expect(move.san).toBe('e5')
      
      move = game.move(puzzle.solution[2].move)
      expect(move).toBeTruthy()
      expect(move.san).toBe('Bc4')
    })
  })
  
  describe('Move Validation Logic', () => {
    it('should validate moves against expected solutions', async () => {
      const { Chess } = await import('./chess-global')
      
      const puzzle = {
        fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
        solution: [{ move: 'e4', explanation: 'Control center' }]
      }
      
      const game = new Chess(puzzle.fen)
      
      // Helper function to check if move matches solution
      const checkSolution = (game: any, attemptedMove: string, expectedMoves: any[]) => {
        try {
          const moveResult = game.move(attemptedMove)
          if (!moveResult) return false
          
          return expectedMoves.some(sol => sol.move === moveResult.san)
        } catch (error) {
          return false // Invalid move
        }
      }
      
      // Test correct solution
      const game1 = new Chess(puzzle.fen)
      expect(checkSolution(game1, 'e4', puzzle.solution)).toBe(true)
      
      // Test incorrect solution (valid move but not the expected solution)
      const game2 = new Chess(puzzle.fen)
      expect(checkSolution(game2, 'd4', puzzle.solution)).toBe(false) // d4 is valid but not e4
    })
    
    it('should handle illegal moves gracefully', async () => {
      const { Chess } = await import('./chess-global')
      
      const game = new Chess()
      
      // Test various illegal moves - newer Chess.js throws errors
      expect(() => game.move('e5')).toThrow() // Can't move pawn 2 squares to e5 from starting
      expect(() => game.move('Kd2')).toThrow() // King can't move into danger
      expect(() => game.move('xyz')).toThrow() // Invalid notation
      expect(() => game.move('')).toThrow() // Empty move
      
      // Game state should remain unchanged
      expect(game.fen()).toBe('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1')
    })
  })
  
  describe('Score Calculation', () => {
    it('should calculate scores based on puzzle difficulty', () => {
      const calculateScore = (difficulty: string, basePoints: number) => {
        const multipliers = {
          'beginner': 1,
          'intermediate': 1.5,
          'advanced': 2,
          'expert': 3
        }
        return Math.round(basePoints * (multipliers[difficulty] || 1))
      }
      
      expect(calculateScore('beginner', 10)).toBe(10)
      expect(calculateScore('intermediate', 10)).toBe(15)
      expect(calculateScore('advanced', 10)).toBe(20)
      expect(calculateScore('expert', 10)).toBe(30)
      expect(calculateScore('unknown', 10)).toBe(10) // Default multiplier
    })
    
    it('should award bonus points for quick solutions', () => {
      const calculateTimeBonus = (timeSeconds: number, basePoints: number) => {
        if (timeSeconds <= 5) return Math.round(basePoints * 0.5) // 50% bonus for < 5 seconds
        if (timeSeconds <= 10) return Math.round(basePoints * 0.25) // 25% bonus for < 10 seconds
        if (timeSeconds <= 30) return Math.round(basePoints * 0.1) // 10% bonus for < 30 seconds
        return 0 // No bonus for slow solutions
      }
      
      expect(calculateTimeBonus(3, 10)).toBe(5) // Fast solution
      expect(calculateTimeBonus(8, 10)).toBe(3) // Medium solution  
      expect(calculateTimeBonus(25, 10)).toBe(1) // Slower solution
      expect(calculateTimeBonus(45, 10)).toBe(0) // No bonus
    })
  })
  
  describe('Hint System', () => {
    it('should provide contextual hints for puzzles', () => {
      const puzzle = {
        id: 'fork_puzzle',
        category: 'fork',
        solution: [{ move: 'Nd5', explanation: 'Knight fork attacks queen and bishop' }],
        hints: [
          'Look for a knight move',
          'The knight can attack two pieces at once',
          'A fork on d5 wins material'
        ]
      }
      
      // Test hint progression
      const getHint = (hintLevel: number, hints: string[]) => {
        if (hintLevel < 1 || hintLevel > hints.length) return null
        return hints[hintLevel - 1]
      }
      
      expect(getHint(1, puzzle.hints)).toBe('Look for a knight move')
      expect(getHint(2, puzzle.hints)).toBe('The knight can attack two pieces at once')
      expect(getHint(3, puzzle.hints)).toBe('A fork on d5 wins material')
      expect(getHint(4, puzzle.hints)).toBe(null) // Beyond available hints
      expect(getHint(0, puzzle.hints)).toBe(null) // Invalid hint level
    })
  })
  
  describe('Game State Management', () => {
    it('should track puzzle completion state', async () => {
      const { Chess } = await import('./chess-global')
      
      const puzzle = {
        id: 'completion_test',
        fen: 'r1bqkb1r/pppp1ppp/2n2n2/4p3/2B1P3/3P1N2/PPP2PPP/RNBQK2R w KQkq - 4 4',
        solution: [{ move: 'Ng5' }]
      }
      
      // Simulate puzzle state
      let puzzleState = {
        currentMoveIndex: 0,
        completed: false,
        score: 0
      }
      
      const game = new Chess(puzzle.fen)
      const move = game.move(puzzle.solution[0].move)
      
      if (move && move.san === puzzle.solution[0].move) {
        puzzleState.currentMoveIndex++
        if (puzzleState.currentMoveIndex >= puzzle.solution.length) {
          puzzleState.completed = true
          puzzleState.score = 10 // Base points
        }
      }
      
      expect(puzzleState.completed).toBe(true)
      expect(puzzleState.score).toBe(10)
      expect(puzzleState.currentMoveIndex).toBe(1)
    })
  })
})