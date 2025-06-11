/**
 * Debug Tools Tests
 * 
 * Tests for debug-tools.ts module functionality
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import type { ChessPuzzle, ChessInstance } from '../types/chess-hawk'

describe('Debug Tools', () => {
  let DebugTools: any
  let debugTools: any
  let mockGame: ChessInstance
  let mockProblemManager: any
  let mockUIManager: any
  let mockProblems: ChessPuzzle[]

  beforeEach(async () => {
    vi.clearAllMocks()
    
    // Create mock problems data
    mockProblems = [
      {
        id: 'prob-1',
        type: 'tactic',
        title: 'Problem 1',
        description: 'Fork tactic',
        fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
        solution: ['e4', 'e5'],
        difficulty: 'beginner',
        category: 'fork',
        points: 10,
        rating: 1200
      },
      {
        id: 'prob-2',
        type: 'tactic',
        title: 'Problem 2',
        description: 'Pin tactic',
        fen: 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1',
        solution: ['d5', 'exd5'],
        difficulty: 'intermediate',
        category: 'pin',
        points: 15,
        rating: 1400
      },
      {
        id: 'prob-3',
        type: 'tactic',
        title: 'Problem 3',
        description: 'Skewer with theme',
        fen: 'test-fen-3',
        solution: ['Qh5'],
        difficulty: 'advanced',
        theme: 'skewer-theme', // Using theme instead of category
        points: 20,
        rating: 1600
      }
    ]
    
    // Create mock game instance
    mockGame = {
      fen: vi.fn().mockReturnValue('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'),
      turn: vi.fn().mockReturnValue('w'),
      moves: vi.fn().mockReturnValue(['e4', 'e5', 'Nf3', 'Nc6']),
      move: vi.fn().mockReturnValue({ san: 'e4', from: 'e2', to: 'e4' }),
      isCheck: vi.fn().mockReturnValue(false),
      isGameOver: vi.fn().mockReturnValue(false),
      load: vi.fn().mockReturnValue(true),
      reset: vi.fn(),
      history: vi.fn().mockReturnValue(['e4', 'e5'])
    }
    
    // Create mock problem manager
    mockProblemManager = {
      problems: mockProblems
    }
    
    // Create mock UI manager
    mockUIManager = {
      showFeedback: vi.fn()
    }
    
    // Mock global objects
    global.window = {
      ...global.window,
      game: mockGame,
      problemManager: mockProblemManager,
      uiManager: mockUIManager,
      currentProblem: mockProblems[0],
      playerScore: 150,
      solvedProblems: ['prob-1'],
      coreManager: {},
      boardManager: { board: {}, updatePosition: vi.fn(), setBoardOrientation: vi.fn() },
      gameLogic: {}
    }
    
    // Mock DOM elements
    const mockDebugElement = {
      innerHTML: '',
      style: { display: 'none' }
    }
    
    global.document.getElementById = vi.fn().mockImplementation((id) => {
      return id === 'debug-analysis' ? mockDebugElement : null
    })
    
    // Mock clipboard API
    global.navigator = {
      ...global.navigator,
      clipboard: {
        writeText: vi.fn().mockResolvedValue(undefined)
      }
    } as any
    
    // Import fresh module
    const module = await import('./debug-tools')
    DebugTools = module.default
    debugTools = new DebugTools()
  })

  afterEach(() => {
    vi.resetModules()
  })

  describe('Constructor', () => {
    it('should initialize successfully', () => {
      expect(debugTools).toBeDefined()
      expect(console.log).toHaveBeenCalledWith('🔧 DebugTools initialized')
    })
  })

  describe('Problem Analysis', () => {
    it('should analyze problems database correctly', () => {
      debugTools.analyzeProblems()
      
      expect(console.log).toHaveBeenCalledWith('🔍 === ANALYZING PROBLEMS ===')
      expect(console.log).toHaveBeenCalledWith('📊 Total problems: 3')
      expect(console.log).toHaveBeenCalledWith('📈 Category distribution:', {
        fork: 1,
        pin: 1,
        'skewer-theme': 1
      })
      expect(console.log).toHaveBeenCalledWith('⭐ Difficulty distribution:', {
        beginner: 1,
        intermediate: 1,
        advanced: 1
      })
      expect(console.log).toHaveBeenCalledWith('📊 Rating statistics:', {
        min: 1200,
        max: 1600,
        avg: 1400,
        median: 1400
      })
    })

    it('should handle problems with missing categories', () => {
      const problemsWithMissing = [
        ...mockProblems,
        {
          id: 'prob-4',
          type: 'tactic',
          title: 'Problem 4',
          description: 'No category',
          fen: 'test-fen',
          solution: ['e4'],
          difficulty: 'beginner',
          points: 10,
          rating: 1300
        } as ChessPuzzle
      ]
      
      global.window.problemManager.problems = problemsWithMissing
      
      debugTools.analyzeProblems()
      
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('📈 Category distribution:'),
        expect.objectContaining({ unknown: 1 })
      )
    })

    it('should handle problems with missing difficulty', () => {
      const problemsWithMissingDifficulty = [
        {
          id: 'prob-1',
          type: 'tactic',
          title: 'Problem 1',
          fen: 'test',
          solution: ['e4'],
          category: 'fork',
          points: 10,
          rating: 1200
        } as ChessPuzzle
      ]
      
      global.window.problemManager.problems = problemsWithMissingDifficulty
      
      debugTools.analyzeProblems()
      
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('⭐ Difficulty distribution:'),
        expect.objectContaining({ unknown: 1 })
      )
    })

    it('should handle no problem manager', () => {
      global.window.problemManager = null
      
      debugTools.analyzeProblems()
      
      expect(console.error).toHaveBeenCalledWith('❌ No problem manager or problems available')
    })

    it('should handle no problems in manager', () => {
      global.window.problemManager.problems = null
      
      debugTools.analyzeProblems()
      
      expect(console.error).toHaveBeenCalledWith('❌ No problem manager or problems available')
    })

    it('should display analysis results in UI', () => {
      const mockDebugElement = {
        innerHTML: '',
        style: { display: 'none' }
      }
      
      global.document.getElementById = vi.fn().mockReturnValue(mockDebugElement)
      
      debugTools.analyzeProblems()
      
      expect(mockUIManager.showFeedback).toHaveBeenCalledWith(
        expect.stringContaining('📊 Problem Database Analysis:'),
        'info',
        8000
      )
      
      expect(mockDebugElement.innerHTML).toContain('📊 Database Analysis')
      expect(mockDebugElement.innerHTML).toContain('fork: 1')
      expect(mockDebugElement.innerHTML).toContain('pin: 1')
      expect(mockDebugElement.style.display).toBe('block')
    })

    it('should handle missing debug element', () => {
      global.document.getElementById = vi.fn().mockReturnValue(null)
      
      expect(() => debugTools.analyzeProblems()).not.toThrow()
      expect(mockUIManager.showFeedback).toHaveBeenCalled()
    })
  })

  describe('Game State Logging', () => {
    it('should log complete game state', () => {
      debugTools.logGameState()
      
      expect(console.log).toHaveBeenCalledWith('🎮 === CURRENT GAME STATE ===')
      expect(console.log).toHaveBeenCalledWith('♟️ Chess game state:')
      expect(console.log).toHaveBeenCalledWith(expect.stringContaining('FEN:'))
      expect(console.log).toHaveBeenCalledWith(expect.stringContaining('Turn: w'))
      expect(console.log).toHaveBeenCalledWith(expect.stringContaining('History: e4 e5'))
      expect(console.log).toHaveBeenCalledWith(expect.stringContaining('In check: false'))
      expect(console.log).toHaveBeenCalledWith(expect.stringContaining('Game over: false'))
    })

    it('should log current problem information', () => {
      debugTools.logGameState()
      
      expect(console.log).toHaveBeenCalledWith('🧩 Current problem:')
      expect(console.log).toHaveBeenCalledWith('   ID: prob-1')
      expect(console.log).toHaveBeenCalledWith('   Title: Problem 1')
      expect(console.log).toHaveBeenCalledWith('   Category: fork')
      expect(console.log).toHaveBeenCalledWith('   Difficulty: beginner')
      expect(console.log).toHaveBeenCalledWith('   Rating: 1200')
      expect(console.log).toHaveBeenCalledWith('   Solution: e4, e5')
    })

    it('should log player statistics', () => {
      debugTools.logGameState()
      
      expect(console.log).toHaveBeenCalledWith('📊 Player statistics:')
      expect(console.log).toHaveBeenCalledWith('   Score: 150')
      expect(console.log).toHaveBeenCalledWith('   Solved problems: 1')
    })

    it('should log global objects availability', () => {
      debugTools.logGameState()
      
      expect(console.log).toHaveBeenCalledWith('🌐 Global objects:')
      expect(console.log).toHaveBeenCalledWith('   coreManager: object')
      expect(console.log).toHaveBeenCalledWith('   boardManager: object')
      expect(console.log).toHaveBeenCalledWith('   problemManager: object')
      expect(console.log).toHaveBeenCalledWith('   uiManager: object')
      expect(console.log).toHaveBeenCalledWith('   gameLogic: object')
    })

    it('should handle missing game instance', () => {
      global.window.game = null
      
      debugTools.logGameState()
      
      expect(console.log).toHaveBeenCalledWith('   ❌ No game instance available')
    })

    it('should handle missing current problem', () => {
      global.window.currentProblem = null
      
      debugTools.logGameState()
      
      expect(console.log).toHaveBeenCalledWith('   ❌ No current problem loaded')
    })

    it('should handle missing player statistics', () => {
      global.window.playerScore = undefined
      global.window.solvedProblems = undefined
      
      debugTools.logGameState()
      
      expect(console.log).toHaveBeenCalledWith('   Score: 0')
      expect(console.log).toHaveBeenCalledWith('   Solved problems: 0')
    })

    it('should handle problem with theme instead of category', () => {
      global.window.currentProblem = mockProblems[2] // Has theme instead of category
      
      debugTools.logGameState()
      
      expect(console.log).toHaveBeenCalledWith('   Category: skewer-theme')
    })
  })

  describe('Game Data Export', () => {
    it('should export complete game data', () => {
      const result = debugTools.exportGameData()
      
      expect(result).toMatchObject({
        timestamp: expect.any(String),
        gameState: {
          fen: expect.any(String),
          turn: 'w',
          history: ['e4', 'e5'],
          inCheck: false,
          gameOver: false
        },
        currentProblem: mockProblems[0],
        playerStats: {
          score: 150,
          solvedProblems: ['prob-1']
        },
        problemDatabase: {
          total: 3,
          loaded: true
        }
      })
      
      expect(console.log).toHaveBeenCalledWith('💾 Game data exported:', result)
    })

    it('should handle missing game instance', () => {
      global.window.game = null
      
      const result = debugTools.exportGameData()
      
      expect(result.gameState).toMatchObject({
        fen: undefined,
        turn: undefined,
        history: undefined,
        inCheck: undefined,
        gameOver: undefined
      })
    })

    it('should handle missing player data', () => {
      global.window.playerScore = undefined
      global.window.solvedProblems = undefined
      
      const result = debugTools.exportGameData()
      
      expect(result.playerStats).toMatchObject({
        score: 0,
        solvedProblems: []
      })
    })

    it('should handle missing problem manager', () => {
      global.window.problemManager = null
      
      const result = debugTools.exportGameData()
      
      expect(result.problemDatabase).toMatchObject({
        total: 0,
        loaded: false
      })
    })

    it('should copy to clipboard when available', async () => {
      const result = debugTools.exportGameData()
      
      // Wait for async clipboard operation
      await new Promise(resolve => setTimeout(resolve, 0))
      
      expect(global.navigator.clipboard.writeText).toHaveBeenCalledWith(
        JSON.stringify(result, null, 2)
      )
      expect(console.log).toHaveBeenCalledWith('📋 Data copied to clipboard')
    })

    it('should handle clipboard errors', async () => {
      global.navigator.clipboard.writeText = vi.fn().mockRejectedValue(new Error('Clipboard error'))
      
      debugTools.exportGameData()
      
      // Wait for async clipboard operation
      await new Promise(resolve => setTimeout(resolve, 0))
      
      expect(console.log).toHaveBeenCalledWith(
        '❌ Failed to copy to clipboard:',
        expect.any(Error)
      )
    })

    it('should handle missing clipboard API', () => {
      global.navigator.clipboard = undefined
      
      expect(() => debugTools.exportGameData()).not.toThrow()
    })
  })

  describe('Board Testing', () => {
    it('should test board functionality successfully', () => {
      debugTools.testBoard()
      
      expect(console.log).toHaveBeenCalledWith('🧪 === TESTING BOARD FUNCTIONALITY ===')
      expect(console.log).toHaveBeenCalledWith('✅ Board manager available')
      expect(console.log).toHaveBeenCalledWith('   Board instance: object')
      expect(console.log).toHaveBeenCalledWith('✅ Position update test passed')
      expect(console.log).toHaveBeenCalledWith('✅ Board orientation test passed')
      
      expect(global.window.boardManager.updatePosition).toHaveBeenCalledWith(
        'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'
      )
      expect(global.window.boardManager.setBoardOrientation).toHaveBeenCalledWith('w')
    })

    it('should handle missing board manager', () => {
      global.window.boardManager = null
      
      debugTools.testBoard()
      
      expect(console.error).toHaveBeenCalledWith('❌ Board manager not available')
    })

    it('should handle position update errors', () => {
      global.window.boardManager.updatePosition = vi.fn().mockImplementation(() => {
        throw new Error('Position error')
      })
      
      debugTools.testBoard()
      
      expect(console.error).toHaveBeenCalledWith(
        '❌ Position update test failed:',
        expect.any(Error)
      )
    })

    it('should handle orientation errors', () => {
      global.window.boardManager.setBoardOrientation = vi.fn().mockImplementation(() => {
        throw new Error('Orientation error')
      })
      
      debugTools.testBoard()
      
      expect(console.error).toHaveBeenCalledWith(
        '❌ Board orientation test failed:',
        expect.any(Error)
      )
    })
  })

  describe('Debug Display Management', () => {
    it('should clear debug display', () => {
      const mockElement = {
        innerHTML: 'test content',
        style: { display: 'block' }
      }
      
      global.document.getElementById = vi.fn().mockReturnValue(mockElement)
      
      debugTools.clearDebugDisplay()
      
      expect(mockElement.style.display).toBe('none')
      expect(mockElement.innerHTML).toBe('')
    })

    it('should handle missing debug element', () => {
      global.document.getElementById = vi.fn().mockReturnValue(null)
      
      expect(() => debugTools.clearDebugDisplay()).not.toThrow()
    })
  })

  describe('UI Manager Integration', () => {
    it('should show feedback when UI manager available', () => {
      debugTools.analyzeProblems()
      
      expect(mockUIManager.showFeedback).toHaveBeenCalled()
    })

    it('should handle missing UI manager', () => {
      global.window.uiManager = null
      
      expect(() => debugTools.analyzeProblems()).not.toThrow()
    })

    it('should handle UI manager without showFeedback method', () => {
      global.window.uiManager = { notShowFeedback: vi.fn() }
      
      expect(() => debugTools.analyzeProblems()).not.toThrow()
    })
  })

  describe('Cleanup', () => {
    it('should cleanup debug displays', () => {
      const mockElement = {
        innerHTML: 'test',
        style: { display: 'block' }
      }
      
      global.document.getElementById = vi.fn().mockReturnValue(mockElement)
      
      debugTools.destroy()
      
      expect(mockElement.style.display).toBe('none')
      expect(mockElement.innerHTML).toBe('')
    })

    it('should handle cleanup with missing elements', () => {
      global.document.getElementById = vi.fn().mockReturnValue(null)
      
      expect(() => debugTools.destroy()).not.toThrow()
    })
  })

  describe('Global Exposure', () => {
    it('should expose DebugTools to global scope', async () => {
      await import('./debug-tools')
      expect((global.window as any).DebugTools).toBeDefined()
    })
  })

  describe('Error Handling', () => {
    it('should handle malformed problem data', () => {
      global.window.problemManager.problems = [
        { id: 'malformed' }, // Missing required fields
        null,
        undefined
      ]
      
      expect(() => debugTools.analyzeProblems()).not.toThrow()
    })

    it('should handle game method errors', () => {
      mockGame.fen = vi.fn().mockImplementation(() => {
        throw new Error('FEN error')
      })
      mockGame.history = vi.fn().mockImplementation(() => {
        throw new Error('History error')
      })
      
      expect(() => debugTools.logGameState()).not.toThrow()
      expect(() => debugTools.exportGameData()).not.toThrow()
    })

    it('should handle empty problems array', () => {
      global.window.problemManager.problems = []
      
      expect(() => debugTools.analyzeProblems()).not.toThrow()
    })

    it('should handle zero ratings for statistics', () => {
      global.window.problemManager.problems = [
        {
          id: 'zero-rating',
          rating: 0,
          category: 'test',
          difficulty: 'beginner'
        } as ChessPuzzle
      ]
      
      expect(() => debugTools.analyzeProblems()).not.toThrow()
    })
  })
})