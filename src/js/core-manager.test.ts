/**
 * Core Manager Tests
 * 
 * Tests for core-manager.ts module functionality
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import type { ChessInstance, ChessPuzzle, GameState } from '../types/chess-hawk'

// Mock all the modules that CoreManager imports
vi.mock('./chess-global.ts', () => ({
  Chess: vi.fn().mockImplementation(() => ({
    fen: vi.fn().mockReturnValue('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'),
    turn: vi.fn().mockReturnValue('w'),
    moves: vi.fn().mockReturnValue(['e4', 'e5']),
    move: vi.fn().mockReturnValue({ san: 'e4' }),
    load: vi.fn().mockReturnValue(true),
    history: vi.fn().mockReturnValue([]),
    isCheck: vi.fn().mockReturnValue(false),
    isGameOver: vi.fn().mockReturnValue(false),
    reset: vi.fn()
  }))
}))

vi.mock('./board-manager.ts', () => ({
  default: vi.fn().mockImplementation(() => ({
    initializeBoard: vi.fn().mockReturnValue({}),
    updatePosition: vi.fn(),
    setBoardOrientation: vi.fn(),
    destroy: vi.fn()
  }))
}))

vi.mock('./problem-manager.ts', () => ({
  default: vi.fn().mockImplementation(() => ({
    loadProblems: vi.fn().mockResolvedValue([]),
    getRandomProblem: vi.fn().mockReturnValue({
      id: 'test-1',
      title: 'Test Problem',
      fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
      solution: ['e4'],
      difficulty: 'beginner',
      category: 'opening',
      points: 10,
      rating: 1200
    }),
    getNextProblem: vi.fn(),
    getPreviousProblem: vi.fn(),
    displayProblem: vi.fn(),
    destroy: vi.fn()
  }))
}))

vi.mock('./game-logic.ts', () => ({
  default: vi.fn().mockImplementation(() => ({
    showHint: vi.fn(),
    showSolution: vi.fn(),
    checkSolution: vi.fn(),
    destroy: vi.fn()
  }))
}))

vi.mock('./ui-manager.ts', () => ({
  default: vi.fn().mockImplementation(() => ({
    showFeedback: vi.fn(),
    updateGameStatus: vi.fn(),
    clearFeedback: vi.fn(),
    clearSolution: vi.fn(),
    destroy: vi.fn()
  }))
}))

vi.mock('./debug-tools.ts', () => ({
  default: vi.fn().mockImplementation(() => ({
    analyzeProblems: vi.fn(),
    destroy: vi.fn()
  }))
}))

describe('Core Manager', () => {
  let CoreManager: any
  let coreManager: any
  let mockLocalStorage: any

  beforeEach(async () => {
    vi.clearAllMocks()
    
    // Mock localStorage
    mockLocalStorage = {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn()
    }
    global.localStorage = mockLocalStorage
    
    // Mock global objects
    global.window = {
      ...global.window,
      Chess: vi.fn(),
      Chessboard: vi.fn(),
      location: { protocol: 'http:' }
    } as any
    
    global.$ = vi.fn()
    
    // Mock DOM
    global.document = {
      ...global.document,
      readyState: 'complete',
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      getElementById: vi.fn().mockImplementation((id) => {
        if (id === 'myBoard') {
          return { id: 'myBoard', addEventListener: vi.fn() }
        }
        return { id, addEventListener: vi.fn(), removeEventListener: vi.fn() }
      }),
      body: { children: { length: 5 } }
    } as any
    
    // Mock timers
    vi.useFakeTimers()
    
    // Import module (this will create a singleton)
    const module = await import('./core-manager')
    CoreManager = module.default.constructor
    coreManager = module.default
    
    // Reset the instance for testing
    coreManager.destroy()
    coreManager['_initialized'] = false
    coreManager['initialized'] = false
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.resetModules()
  })

  describe('Constructor and Initialization', () => {
    it('should initialize all modules on construction', () => {
      expect(coreManager).toBeDefined()
      expect(coreManager.modules.size).toBe(5) // board, problems, gameLogic, ui, debug
    })

    it('should handle DOM ready states correctly', () => {
      // Test loading state
      global.document.readyState = 'loading'
      const addEventListenerSpy = vi.spyOn(global.document, 'addEventListener')
      
      coreManager['_ensureDOMReady']()
      
      expect(addEventListenerSpy).toHaveBeenCalledWith('DOMContentLoaded', expect.any(Function))
    })

    it('should handle interactive DOM state', () => {
      global.document.readyState = 'interactive'
      
      coreManager['_ensureDOMReady']()
      
      // Should set timeout for initialization
      expect(setTimeout).toHaveBeenCalled()
    })

    it('should handle complete DOM state', () => {
      global.document.readyState = 'complete'
      
      coreManager['_ensureDOMReady']()
      
      expect(setTimeout).toHaveBeenCalled()
    })

    it('should prevent double initialization', async () => {
      coreManager['_initialized'] = true
      
      await coreManager.init()
      
      expect(console.warn).toHaveBeenCalledWith('⚠️ CoreManager already initialized')
    })
  })

  describe('Library and DOM Checks', () => {
    it('should check required libraries successfully', () => {
      global.$ = vi.fn()
      global.Chess = vi.fn()
      global.window.Chessboard = vi.fn()
      
      const result = coreManager['_checkLibraries']()
      
      expect(result).toBe(true)
    })

    it('should handle missing libraries', () => {
      global.$ = undefined
      
      const result = coreManager['_checkLibraries']()
      
      expect(result).toBe(false)
    })

    it('should check required DOM elements', () => {
      const result = coreManager['_checkRequiredElements']()
      
      expect(result).toBe(true)
      expect(global.document.getElementById).toHaveBeenCalledWith('myBoard')
    })

    it('should handle missing DOM elements', () => {
      global.document.getElementById = vi.fn().mockReturnValue(null)
      
      const result = coreManager['_checkRequiredElements']()
      
      expect(result).toBe(false)
    })

    it('should retry initialization on DOM not ready', async () => {
      let domReadyCallCount = 0
      coreManager['_checkRequiredElements'] = vi.fn().mockImplementation(() => {
        domReadyCallCount++
        return domReadyCallCount > 1 // Fail first time, succeed second
      })
      
      const initSpy = vi.spyOn(coreManager, 'init')
      
      await coreManager.init()
      
      // Fast-forward timers for retry
      vi.advanceTimersByTime(500)
      
      expect(initSpy).toHaveBeenCalledTimes(2) // Initial + retry
    })

    it('should proceed after max retries', async () => {
      coreManager['_checkRequiredElements'] = vi.fn().mockReturnValue(false)
      coreManager['_maxRetries'] = 1
      
      await coreManager.init()
      
      expect(coreManager.handleWarning).toHaveBeenCalledWith(
        'Max retries reached, proceeding with initialization anyway',
        'DOM Check'
      )
    })
  })

  describe('Problem Management', () => {
    beforeEach(async () => {
      await coreManager.init()
    })

    it('should load random problem', () => {
      coreManager.loadRandomProblem()
      
      const problemManager = coreManager.getModule('problems')
      expect(problemManager.getRandomProblem).toHaveBeenCalled()
    })

    it('should load next problem', () => {
      const mockProblem = { id: 'next', title: 'Next Problem' }
      const problemManager = coreManager.getModule('problems')
      problemManager.getNextProblem.mockReturnValue(mockProblem)
      
      coreManager.loadNextProblem()
      
      expect(problemManager.getNextProblem).toHaveBeenCalled()
    })

    it('should load previous problem', () => {
      const mockProblem = { id: 'prev', title: 'Previous Problem' }
      const problemManager = coreManager.getModule('problems')
      problemManager.getPreviousProblem.mockReturnValue(mockProblem)
      
      coreManager.loadPreviousProblem()
      
      expect(problemManager.getPreviousProblem).toHaveBeenCalled()
    })

    it('should handle failed random problem loading', () => {
      const problemManager = coreManager.getModule('problems')
      problemManager.getRandomProblem.mockReturnValue(null)
      
      coreManager.loadRandomProblem()
      
      expect(console.error).toHaveBeenCalledWith('❌ Failed to get random problem')
    })

    it('should load problem correctly', () => {
      const testProblem: ChessPuzzle = {
        id: 'test-load',
        type: 'tactic',
        title: 'Load Test',
        description: 'Test loading',
        fen: 'test-fen',
        solution: ['e4'],
        difficulty: 'beginner',
        category: 'fork',
        points: 10,
        rating: 1200
      }
      
      coreManager['_loadProblem'](testProblem)
      
      expect(coreManager.gameState.currentProblem).toBe(testProblem)
      
      const boardManager = coreManager.getModule('board')
      expect(boardManager.updatePosition).toHaveBeenCalledWith('test-fen')
      expect(boardManager.setBoardOrientation).toHaveBeenCalled()
      
      const uiManager = coreManager.getModule('ui')
      expect(uiManager.updateGameStatus).toHaveBeenCalledWith('Hvit sin tur')
      expect(uiManager.clearFeedback).toHaveBeenCalled()
      expect(uiManager.clearSolution).toHaveBeenCalled()
    })
  })

  describe('Game Actions', () => {
    beforeEach(async () => {
      await coreManager.init()
    })

    it('should show hint', () => {
      coreManager.showHint()
      
      const gameLogic = coreManager.getModule('gameLogic')
      expect(gameLogic.showHint).toHaveBeenCalled()
    })

    it('should show solution', () => {
      coreManager.showSolution()
      
      const gameLogic = coreManager.getModule('gameLogic')
      expect(gameLogic.showSolution).toHaveBeenCalled()
    })

    it('should check solution', () => {
      coreManager.checkSolution()
      
      const gameLogic = coreManager.getModule('gameLogic')
      expect(gameLogic.checkSolution).toHaveBeenCalled()
    })

    it('should reset position', () => {
      const testProblem: ChessPuzzle = {
        id: 'reset-test',
        fen: 'reset-fen',
        solution: ['e4']
      } as ChessPuzzle
      
      coreManager['_gameState'].currentProblem = testProblem
      
      coreManager.resetPosition()
      
      expect(coreManager.game.load).toHaveBeenCalledWith('reset-fen')
      
      const boardManager = coreManager.getModule('board')
      expect(boardManager.updatePosition).toHaveBeenCalledWith('reset-fen')
      
      const uiManager = coreManager.getModule('ui')
      expect(uiManager.clearFeedback).toHaveBeenCalled()
      expect(uiManager.updateGameStatus).toHaveBeenCalledWith('Posisjon tilbakestilt')
    })

    it('should handle reset position with no current problem', () => {
      coreManager['_gameState'].currentProblem = null
      
      expect(() => coreManager.resetPosition()).not.toThrow()
    })

    it('should analyze problems', () => {
      coreManager.analyzeProblems()
      
      const debugTools = coreManager.getModule('debug')
      expect(debugTools.analyzeProblems).toHaveBeenCalled()
    })
  })

  describe('Event Handling', () => {
    beforeEach(async () => {
      await coreManager.init()
    })

    it('should setup event handlers correctly', async () => {
      const addEventListenerSpy = vi.spyOn(global.document, 'addEventListener')
      
      await coreManager['_setupEventHandlers']()
      
      expect(addEventListenerSpy).toHaveBeenCalledWith(
        'keydown',
        expect.any(Function),
        expect.objectContaining({ signal: expect.any(AbortSignal) })
      )
    })

    it('should handle keyboard shortcuts', () => {
      const loadRandomSpy = vi.spyOn(coreManager, 'loadRandomProblem')
      const showHintSpy = vi.spyOn(coreManager, 'showHint')
      const showSolutionSpy = vi.spyOn(coreManager, 'showSolution')
      
      // Test 'n' key
      coreManager['_handleKeyboardShortcuts']({ key: 'n', preventDefault: vi.fn() })
      expect(loadRandomSpy).toHaveBeenCalled()
      
      // Test 'h' key
      coreManager['_handleKeyboardShortcuts']({ key: 'h', preventDefault: vi.fn() })
      expect(showHintSpy).toHaveBeenCalled()
      
      // Test 's' key
      coreManager['_handleKeyboardShortcuts']({ key: 's', preventDefault: vi.fn() })
      expect(showSolutionSpy).toHaveBeenCalled()
    })

    it('should ignore keyboard shortcuts with modifier keys', () => {
      const loadRandomSpy = vi.spyOn(coreManager, 'loadRandomProblem')
      
      coreManager['_handleKeyboardShortcuts']({ 
        key: 'n', 
        ctrlKey: true, 
        preventDefault: vi.fn() 
      })
      
      expect(loadRandomSpy).not.toHaveBeenCalled()
    })

    it('should handle missing button elements gracefully', async () => {
      global.document.getElementById = vi.fn().mockReturnValue(null)
      
      await expect(coreManager['_setupEventHandlers']()).resolves.not.toThrow()
      expect(coreManager.handleWarning).toHaveBeenCalled()
    })
  })

  describe('Global Exposure', () => {
    beforeEach(async () => {
      await coreManager.init()
    })

    it('should expose all modules globally', () => {
      expect(global.window.coreManager).toBe(coreManager)
      expect(global.window.boardManager).toBeDefined()
      expect(global.window.problemManager).toBeDefined()
      expect(global.window.gameLogic).toBeDefined()
      expect(global.window.uiManager).toBeDefined()
      expect(global.window.debugTools).toBeDefined()
    })

    it('should expose game instances globally', () => {
      expect(global.window.game).toBe(coreManager.game)
      expect(global.window.board).toBe(coreManager.board)
    })

    it('should expose legacy functions', () => {
      expect(typeof global.window.initChessHawk).toBe('function')
      expect(typeof global.window.loadRandomProblem).toBe('function')
      expect(typeof global.window.showHint).toBe('function')
      expect(typeof global.window.showSolution).toBe('function')
    })

    it('should expose error handling functions', () => {
      expect(typeof global.window.handleError).toBe('function')
      expect(typeof global.window.handleWarning).toBe('function')
    })

    it('should handle currentProblem property', () => {
      const testProblem = { id: 'property-test' } as ChessPuzzle
      
      global.window.currentProblem = testProblem
      expect(coreManager.currentProblem).toBe(testProblem)
      
      coreManager.currentProblem = null
      expect(global.window.currentProblem).toBeNull()
    })
  })

  describe('State Management', () => {
    it('should load persisted state from localStorage', () => {
      const savedState = {
        playerScore: 150,
        solvedProblems: 5,
        totalProblems: 10
      }
      
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(savedState))
      
      coreManager['_loadPersistedState']()
      
      expect(coreManager.gameState.score).toBe(150)
      expect(coreManager.gameState.solvedProblems).toBe(5)
      expect(coreManager.gameState.totalProblems).toBe(10)
    })

    it('should handle invalid localStorage data', () => {
      mockLocalStorage.getItem.mockReturnValue('invalid-json')
      
      expect(() => coreManager['_loadPersistedState']()).not.toThrow()
      expect(console.warn).toHaveBeenCalled()
    })

    it('should persist state to localStorage', () => {
      coreManager['_gameState'].score = 200
      coreManager['_gameState'].solvedProblems = 8
      
      coreManager['_persistState']()
      
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'chesshawk-state',
        expect.stringContaining('"playerScore":200')
      )
    })

    it('should handle localStorage write errors', () => {
      mockLocalStorage.setItem.mockImplementation(() => {
        throw new Error('Storage full')
      })
      
      expect(() => coreManager['_persistState']()).not.toThrow()
      expect(console.warn).toHaveBeenCalled()
    })

    it('should clear persisted data', () => {
      const result = coreManager.clearPersistedData()
      
      expect(result).toBe(true)
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('chesshawk-state')
      expect(coreManager.gameState.score).toBe(0)
      expect(coreManager.gameState.solvedProblems).toBe(0)
    })

    it('should handle localStorage clear errors', () => {
      mockLocalStorage.removeItem.mockImplementation(() => {
        throw new Error('Clear failed')
      })
      
      const result = coreManager.clearPersistedData()
      
      expect(result).toBe(false)
    })
  })

  describe('Statistics and Scoring', () => {
    it('should update statistics correctly', () => {
      coreManager.updateStatistics({ problemSolved: true })
      
      expect(coreManager.gameState.solvedProblems).toBe(1)
    })

    it('should update game completion statistics', () => {
      coreManager.updateStatistics({ gameCompleted: true })
      
      expect(coreManager.gameState.totalProblems).toBe(1)
    })

    it('should get current statistics', () => {
      coreManager['_gameState'].score = 100
      coreManager['_gameState'].solvedProblems = 3
      coreManager['_gameState'].totalProblems = 5
      
      const stats = coreManager.getStatistics()
      
      expect(stats).toEqual({
        score: 100,
        solvedProblems: 3,
        totalProblems: 5
      })
    })

    it('should handle player score property', () => {
      coreManager.playerScore = 250
      
      expect(coreManager.playerScore).toBe(250)
      expect(coreManager.gameState.score).toBe(250)
    })

    it('should add solved problem', () => {
      const initialSolved = coreManager.solvedProblems
      
      coreManager.addSolvedProblem('test-problem')
      
      expect(coreManager.solvedProblems).toBe(initialSolved + 1)
    })
  })

  describe('Error Handling', () => {
    it('should handle errors with context', () => {
      const result = coreManager.handleError(new Error('Test error'), 'Test Context')
      
      expect(result).toMatchObject({
        context: 'Test Context',
        message: 'Test error',
        handled: true
      })
      expect(console.error).toHaveBeenCalled()
    })

    it('should handle warnings with context', () => {
      const result = coreManager.handleWarning('Test warning', 'Test Context')
      
      expect(result).toMatchObject({
        context: 'Test Context',
        message: 'Test warning',
        type: 'warning'
      })
      expect(console.warn).toHaveBeenCalled()
    })

    it('should show errors to user when requested', () => {
      coreManager.handleError(new Error('User error'), 'Test', true)
      
      const uiManager = coreManager.getModule('ui')
      expect(uiManager.showFeedback).toHaveBeenCalledWith(
        '❌ User error',
        'error'
      )
    })

    it('should show warnings to user when requested', () => {
      coreManager.handleWarning('User warning', 'Test', true)
      
      const uiManager = coreManager.getModule('ui')
      expect(uiManager.showFeedback).toHaveBeenCalledWith(
        '⚠️ User warning',
        'warning'
      )
    })

    it('should handle non-Error objects', () => {
      const result = coreManager.handleError('String error', 'Test')
      
      expect(result.message).toBe('String error')
    })

    it('should handle null/undefined errors', () => {
      const result = coreManager.handleError(null, 'Test')
      
      expect(result.message).toBe('Unknown error')
    })
  })

  describe('Welcome and Error Messages', () => {
    beforeEach(async () => {
      await coreManager.init()
    })

    it('should show welcome message', () => {
      coreManager['_showWelcomeMessage']()
      
      const uiManager = coreManager.getModule('ui')
      expect(uiManager.showFeedback).toHaveBeenCalledWith(
        expect.stringContaining('Velkommen til Chess Hawk!'),
        'info'
      )
    })

    it('should show error messages', () => {
      coreManager['_showErrorMessage']('Test error message')
      
      const uiManager = coreManager.getModule('ui')
      expect(uiManager.showFeedback).toHaveBeenCalledWith(
        '❌ Test error message',
        'error'
      )
    })
  })

  describe('Module Access', () => {
    beforeEach(async () => {
      await coreManager.init()
    })

    it('should get modules by name', () => {
      expect(coreManager.getModule('board')).toBeDefined()
      expect(coreManager.getModule('problems')).toBeDefined()
      expect(coreManager.getModule('gameLogic')).toBeDefined()
      expect(coreManager.getModule('ui')).toBeDefined()
      expect(coreManager.getModule('debug')).toBeDefined()
    })

    it('should return undefined for unknown modules', () => {
      expect(coreManager.getModule('unknown')).toBeUndefined()
    })

    it('should provide access to game instance', () => {
      expect(coreManager.game).toBeDefined()
      expect(typeof coreManager.game.fen).toBe('function')
    })

    it('should provide access to board instance', () => {
      expect(coreManager.board).toBeDefined()
    })
  })

  describe('File Protocol Handling', () => {
    it('should show file protocol guidance on CORS errors', async () => {
      global.window.location.protocol = 'file:'
      
      const problemManager = coreManager.getModule('problems')
      problemManager.loadProblems.mockRejectedValue(new Error('CORS error'))
      
      await coreManager.init()
      
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('python3 -m http.server 8000')
      )
    })
  })

  describe('Cleanup', () => {
    it('should cleanup all modules and resources', () => {
      coreManager.destroy()
      
      expect(coreManager['_initialized']).toBe(false)
      expect(coreManager['_modules'].size).toBe(0)
    })

    it('should abort event controllers on cleanup', () => {
      const mockAbortController = { abort: vi.fn() }
      coreManager['_abortController'] = mockAbortController
      
      coreManager.destroy()
      
      expect(mockAbortController.abort).toHaveBeenCalled()
    })

    it('should handle cleanup with modules that have destroy methods', () => {
      const mockModule = { destroy: vi.fn() }
      coreManager['_modules'].set('test', mockModule)
      
      coreManager.destroy()
      
      expect(mockModule.destroy).toHaveBeenCalled()
    })

    it('should handle cleanup with modules without destroy methods', () => {
      const mockModule = { someMethod: vi.fn() }
      coreManager['_modules'].set('test', mockModule)
      
      expect(() => coreManager.destroy()).not.toThrow()
    })
  })
})