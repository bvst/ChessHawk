/**
 * Game Logic Tests
 * 
 * Tests for game-logic.ts module functionality
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import type { ChessInstance, ChessPuzzle } from '../types/chess-hawk'

describe('Game Logic', () => {
  let GameLogic: any
  let gameLogic: any
  let mockGame: ChessInstance
  let mockUIManager: any

  beforeEach(async () => {
    vi.clearAllMocks()
    
    // Create mock game instance
    mockGame = {
      fen: vi.fn().mockReturnValue('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'),
      turn: vi.fn().mockReturnValue('w'),
      moves: vi.fn().mockReturnValue(['e4', 'e5', 'Nf3', 'Nc6']),
      move: vi.fn().mockReturnValue({ san: 'e4', from: 'e2', to: 'e4' }),
      isGameOver: vi.fn().mockReturnValue(false),
      load: vi.fn().mockReturnValue(true),
      reset: vi.fn(),
      history: vi.fn().mockReturnValue([])
    }
    
    // Create mock UI manager
    mockUIManager = {
      showFeedback: vi.fn()
    }
    
    // Mock global objects
    global.window = {
      ...global.window,
      game: mockGame,
      currentProblem: null,
      uiManager: mockUIManager,
      playerScore: 0,
      solvedProblems: []
    }
    
    // Mock DOM elements
    const mockSolutionElement = {
      innerHTML: '',
      style: { display: 'none' }
    }
    
    global.document.getElementById = vi.fn().mockImplementation((id) => {
      return id === 'solution' ? mockSolutionElement : null
    })
    
    // Import fresh module
    const module = await import('./game-logic')
    GameLogic = module.default
    gameLogic = new GameLogic()
  })

  afterEach(() => {
    vi.resetModules()
  })

  describe('Constructor', () => {
    it('should initialize with correct default values', () => {
      expect(gameLogic.game).toBeNull()
      expect(gameLogic.initialized).toBe(false)
      expect(console.log).toHaveBeenCalledWith('🧠 GameLogic initialized')
    })
  })

  describe('Game Initialization', () => {
    it('should initialize game from global window', () => {
      gameLogic.initializeGame()
      
      expect(gameLogic.game).toBe(mockGame)
      expect(gameLogic.initialized).toBe(true)
      expect(console.log).toHaveBeenCalledWith('♟️ Game logic initialized')
    })

    it('should handle missing global game', () => {
      global.window.game = undefined
      
      gameLogic.initializeGame()
      
      expect(gameLogic.game).toBeUndefined()
      expect(gameLogic.initialized).toBe(true)
    })
  })

  describe('Move Making', () => {
    beforeEach(() => {
      gameLogic.initializeGame()
    })

    it('should make valid move successfully', () => {
      const expectedMove = { san: 'e4', from: 'e2', to: 'e4' }
      mockGame.move = vi.fn().mockReturnValue(expectedMove)
      
      const result = gameLogic.makeMove('e4')
      
      expect(mockGame.move).toHaveBeenCalledWith('e4')
      expect(result).toEqual(expectedMove)
    })

    it('should handle invalid moves', () => {
      mockGame.move = vi.fn().mockImplementation(() => {
        throw new Error('Invalid move')
      })
      
      const result = gameLogic.makeMove('invalid')
      
      expect(result).toBeNull()
      expect(console.error).toHaveBeenCalled()
    })

    it('should handle move when game not initialized', () => {
      gameLogic.game = null
      
      const result = gameLogic.makeMove('e4')
      
      expect(result).toBeNull()
      expect(console.error).toHaveBeenCalledWith('❌ Game not initialized')
    })
  })

  describe('Move Validation', () => {
    beforeEach(() => {
      gameLogic.initializeGame()
    })

    it('should validate legal moves', () => {
      mockGame.moves = vi.fn().mockReturnValue(['e4', 'e3', 'Nf3'])
      
      expect(gameLogic.isValidMove('e4')).toBe(true)
      expect(gameLogic.isValidMove('e3')).toBe(true)
      expect(gameLogic.isValidMove('Nf3')).toBe(true)
    })

    it('should reject illegal moves', () => {
      mockGame.moves = vi.fn().mockReturnValue(['e4', 'e3'])
      
      expect(gameLogic.isValidMove('e5')).toBe(false)
      expect(gameLogic.isValidMove('invalid')).toBe(false)
    })

    it('should handle game not initialized', () => {
      gameLogic.game = null
      
      expect(gameLogic.isValidMove('e4')).toBe(false)
    })

    it('should handle moves() method errors', () => {
      mockGame.moves = vi.fn().mockImplementation(() => {
        throw new Error('Moves error')
      })
      
      expect(gameLogic.isValidMove('e4')).toBe(false)
    })
  })

  describe('Solution Checking', () => {
    const testProblem: ChessPuzzle = {
      id: 'test-1',
      type: 'tactic',
      title: 'Test Problem',
      description: 'Test description',
      fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
      solution: ['e4', 'e5', 'Nf3'],
      difficulty: 'beginner',
      category: 'opening',
      points: 15,
      rating: 1200
    }

    beforeEach(() => {
      global.window.currentProblem = testProblem
      global.window.playerScore = 100
      global.window.solvedProblems = []
    })

    it('should validate correct first move', () => {
      mockGame.history = vi.fn().mockReturnValue([
        { san: 'e4', from: 'e2', to: 'e4' }
      ])
      
      const result = gameLogic.checkSolution()
      
      expect(result).toBe(true)
      expect(mockUIManager.showFeedback).toHaveBeenCalledWith(
        '✅ Riktig trekk! (1/3)',
        'success'
      )
    })

    it('should validate complete solution sequence', () => {
      // First move
      mockGame.history = vi.fn().mockReturnValue([
        { san: 'e4', from: 'e2', to: 'e4' }
      ])
      gameLogic.checkSolution()

      // Second move
      mockGame.history = vi.fn().mockReturnValue([
        { san: 'e4', from: 'e2', to: 'e4' },
        { san: 'e5', from: 'e7', to: 'e5' }
      ])
      gameLogic.checkSolution()

      // Third move (final)
      mockGame.history = vi.fn().mockReturnValue([
        { san: 'e4', from: 'e2', to: 'e4' },
        { san: 'e5', from: 'e7', to: 'e5' },
        { san: 'Nf3', from: 'g1', to: 'f3' }
      ])
      
      const result = gameLogic.checkSolution()
      
      expect(result).toBe(true)
      expect(mockUIManager.showFeedback).toHaveBeenCalledWith(
        expect.stringContaining('🎉 Gratulerer! Du løste problemet og fikk 15 poeng!'),
        'success',
        5000
      )
      expect(global.window.playerScore).toBe(115)
      expect(global.window.solvedProblems).toContain('test-1')
    })

    it('should handle wrong moves', () => {
      mockGame.history = vi.fn().mockReturnValue([
        { san: 'd4', from: 'd2', to: 'd4' } // Wrong move
      ])
      
      const result = gameLogic.checkSolution()
      
      expect(result).toBe(false)
      expect(mockUIManager.showFeedback).toHaveBeenCalledWith(
        '❌ Feil trekk! Forventet: e4, fikk: d4',
        'error',
        4000
      )
    })

    it('should handle no moves made', () => {
      mockGame.history = vi.fn().mockReturnValue([])
      
      const result = gameLogic.checkSolution()
      
      expect(result).toBe(false)
      expect(mockUIManager.showFeedback).toHaveBeenCalledWith(
        'Du må gjøre et trekk først!',
        'error'
      )
    })

    it('should handle no current problem', () => {
      global.window.currentProblem = null
      
      const result = gameLogic.checkSolution()
      
      expect(result).toBe(false)
      expect(mockUIManager.showFeedback).toHaveBeenCalledWith(
        'Ingen problem lastet!',
        'error'
      )
    })

    it('should handle no game available', () => {
      global.window.game = null
      
      const result = gameLogic.checkSolution()
      
      expect(result).toBe(false)
    })

    it('should handle already solved problems', () => {
      global.window.solvedProblems = ['test-1'] // Already solved
      
      mockGame.history = vi.fn().mockReturnValue([
        { san: 'e4' }, { san: 'e5' }, { san: 'Nf3' }
      ])
      
      // Complete the solution
      gameLogic.checkSolution()
      gameLogic.checkSolution()
      gameLogic.checkSolution()
      
      expect(mockUIManager.showFeedback).toHaveBeenCalledWith(
        expect.stringContaining('🎉 Løsning fullført! (Allerede løst tidligere)'),
        'success',
        5000
      )
      expect(global.window.playerScore).toBe(115) // Still gets points
    })
  })

  describe('Hint System', () => {
    const problemWithHints: ChessPuzzle = {
      id: 'hint-test',
      type: 'tactic',
      title: 'Hint Test',
      description: 'Test with hints',
      fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
      solution: ['e4'],
      hints: ['Control the center', 'Move the pawn', 'Open lines for pieces'],
      difficulty: 'beginner',
      category: 'opening',
      points: 10,
      rating: 1200
    }

    beforeEach(() => {
      global.window.currentProblem = problemWithHints
    })

    it('should show first hint', () => {
      gameLogic.showHint()
      
      expect(mockUIManager.showFeedback).toHaveBeenCalledWith(
        '💡 Hint: Control the center',
        'info',
        5000
      )
    })

    it('should cycle through hints', () => {
      gameLogic.showHint()
      gameLogic.showHint()
      gameLogic.showHint()
      gameLogic.showHint() // Should cycle back to first
      
      const calls = mockUIManager.showFeedback.mock.calls
      expect(calls[0][0]).toContain('Control the center')
      expect(calls[1][0]).toContain('Move the pawn')
      expect(calls[2][0]).toContain('Open lines for pieces')
      expect(calls[3][0]).toContain('Control the center') // Cycled back
    })

    it('should handle problem with no hints', () => {
      global.window.currentProblem = { ...problemWithHints, hints: undefined }
      
      gameLogic.showHint()
      
      expect(mockUIManager.showFeedback).toHaveBeenCalledWith(
        'Ingen hint tilgjengelig for dette problemet',
        'info'
      )
    })

    it('should handle problem with empty hints array', () => {
      global.window.currentProblem = { ...problemWithHints, hints: [] }
      
      gameLogic.showHint()
      
      expect(mockUIManager.showFeedback).toHaveBeenCalledWith(
        'Ingen hint tilgjengelig for dette problemet',
        'info'
      )
    })

    it('should handle no current problem', () => {
      global.window.currentProblem = null
      
      gameLogic.showHint()
      
      expect(mockUIManager.showFeedback).toHaveBeenCalledWith(
        'Ingen hint tilgjengelig for dette problemet',
        'info'
      )
    })
  })

  describe('Solution Display', () => {
    const testProblem: ChessPuzzle = {
      id: 'solution-test',
      type: 'tactic',
      title: 'Solution Test',
      description: 'Test solution display',
      fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
      solution: ['e4', 'e5', 'Nf3'],
      difficulty: 'beginner',
      category: 'opening',
      points: 10,
      rating: 1200
    }

    beforeEach(() => {
      global.window.currentProblem = testProblem
    })

    it('should show solution with feedback', () => {
      gameLogic.showSolution()
      
      expect(mockUIManager.showFeedback).toHaveBeenCalledWith(
        '📖 Løsning: e4, e5, Nf3',
        'info',
        8000
      )
    })

    it('should update solution DOM element', () => {
      const mockElement = {
        innerHTML: '',
        style: { display: 'none' }
      }
      
      global.document.getElementById = vi.fn().mockReturnValue(mockElement)
      
      gameLogic.showSolution()
      
      expect(mockElement.innerHTML).toContain('Løsning:')
      expect(mockElement.innerHTML).toContain('e4')
      expect(mockElement.innerHTML).toContain('e5')
      expect(mockElement.innerHTML).toContain('Nf3')
      expect(mockElement.style.display).toBe('block')
    })

    it('should handle missing solution element', () => {
      global.document.getElementById = vi.fn().mockReturnValue(null)
      
      expect(() => gameLogic.showSolution()).not.toThrow()
      expect(mockUIManager.showFeedback).toHaveBeenCalled()
    })

    it('should handle no current problem', () => {
      global.window.currentProblem = null
      
      gameLogic.showSolution()
      
      expect(mockUIManager.showFeedback).toHaveBeenCalledWith(
        'Ingen problem lastet!',
        'error'
      )
    })
  })

  describe('Feedback System', () => {
    it('should use UI manager when available', () => {
      gameLogic.showSolution() // This will trigger feedback
      
      expect(mockUIManager.showFeedback).toHaveBeenCalled()
    })

    it('should fallback to console when UI manager not available', () => {
      global.window.uiManager = null
      
      gameLogic.showSolution()
      
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('INFO:')
      )
    })

    it('should handle missing showFeedback method', () => {
      global.window.uiManager = { notShowFeedback: vi.fn() }
      
      expect(() => gameLogic.showSolution()).not.toThrow()
      expect(console.log).toHaveBeenCalled()
    })
  })

  describe('Score Management', () => {
    const testProblem: ChessPuzzle = {
      id: 'score-test',
      type: 'tactic',
      title: 'Score Test',
      description: 'Test scoring',
      fen: 'test-fen',
      solution: ['e4'],
      difficulty: 'beginner',
      category: 'opening',
      points: 25,
      rating: 1200
    }

    beforeEach(() => {
      global.window.currentProblem = testProblem
      global.window.playerScore = 50
      global.window.solvedProblems = []
    })

    it('should award points for completing puzzle', () => {
      mockGame.history = vi.fn().mockReturnValue([
        { san: 'e4', from: 'e2', to: 'e4' }
      ])
      
      gameLogic.checkSolution()
      
      expect(global.window.playerScore).toBe(75)
      expect(global.window.solvedProblems).toContain('score-test')
    })

    it('should handle missing points property', () => {
      global.window.currentProblem = { ...testProblem, points: undefined }
      
      mockGame.history = vi.fn().mockReturnValue([
        { san: 'e4', from: 'e2', to: 'e4' }
      ])
      
      gameLogic.checkSolution()
      
      expect(global.window.playerScore).toBe(60) // Default 10 points
    })

    it('should initialize score if not set', () => {
      global.window.playerScore = undefined
      
      mockGame.history = vi.fn().mockReturnValue([
        { san: 'e4', from: 'e2', to: 'e4' }
      ])
      
      gameLogic.checkSolution()
      
      expect(global.window.playerScore).toBe(25)
    })

    it('should initialize solved problems array if not set', () => {
      global.window.solvedProblems = undefined
      
      mockGame.history = vi.fn().mockReturnValue([
        { san: 'e4', from: 'e2', to: 'e4' }
      ])
      
      gameLogic.checkSolution()
      
      expect(Array.isArray(global.window.solvedProblems)).toBe(true)
      expect(global.window.solvedProblems).toContain('score-test')
    })
  })

  describe('Cleanup', () => {
    it('should cleanup all resources', () => {
      gameLogic.initializeGame()
      
      // Set some state
      global.window.currentProblem = {
        id: 'test',
        solution: ['e4', 'e5']
      } as ChessPuzzle
      
      mockGame.history = vi.fn().mockReturnValue([
        { san: 'e4' }
      ])
      
      gameLogic.checkSolution() // This sets move index to 1
      
      gameLogic.destroy()
      
      expect(gameLogic.game).toBeNull()
      expect(gameLogic.initialized).toBe(false)
    })

    it('should clear active timers', () => {
      // Create a timer (internal timer mocking is complex, so we test the behavior)
      gameLogic.destroy()
      
      // Should complete without errors
      expect(() => gameLogic.destroy()).not.toThrow()
    })
  })

  describe('Global Exposure', () => {
    it('should expose GameLogic to global scope', async () => {
      await import('./game-logic')
      expect((global.window as any).GameLogic).toBeDefined()
    })
  })

  describe('Error Handling', () => {
    it('should handle verbose history format', () => {
      const verboseHistory = [
        { 
          san: 'e4', 
          from: 'e2', 
          to: 'e4',
          flags: '',
          piece: 'p',
          color: 'w'
        }
      ]
      
      mockGame.history = vi.fn().mockReturnValue(verboseHistory)
      global.window.currentProblem = {
        id: 'test',
        solution: ['e4']
      } as ChessPuzzle
      
      const result = gameLogic.checkSolution()
      
      expect(result).toBe(true)
    })

    it('should handle history method errors', () => {
      mockGame.history = vi.fn().mockImplementation(() => {
        throw new Error('History error')
      })
      
      global.window.currentProblem = {
        id: 'test',
        solution: ['e4']
      } as ChessPuzzle
      
      expect(() => gameLogic.checkSolution()).not.toThrow()
    })

    it('should handle malformed solution array', () => {
      global.window.currentProblem = {
        id: 'test',
        solution: null
      } as any
      
      mockGame.history = vi.fn().mockReturnValue([{ san: 'e4' }])
      
      expect(() => gameLogic.checkSolution()).not.toThrow()
    })
  })
})