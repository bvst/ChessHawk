/**
 * Board Manager Tests
 * 
 * Tests for board-manager.ts module functionality
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import type { ChessInstance, ChessboardInstance } from '../types/chess-hawk'

// Mock Chessboard constructor
const mockChessboard = vi.fn()
global.Chessboard = mockChessboard

describe('Board Manager', () => {
  let BoardManager: any
  let boardManager: any
  let mockBoardInstance: ChessboardInstance
  let mockGame: ChessInstance

  beforeEach(async () => {
    vi.clearAllMocks()
    
    // Create mock board instance
    mockBoardInstance = {
      position: vi.fn(),
      clear: vi.fn(),
      destroy: vi.fn(),
      orientation: vi.fn(),
      resize: vi.fn(),
      start: vi.fn()
    }
    
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
    
    // Mock global objects
    global.window = {
      ...global.window,
      Chessboard: mockChessboard.mockReturnValue(mockBoardInstance),
      game: mockGame,
      currentProblem: { id: 'test-problem', solution: ['e4', 'e5'] },
      updateStatus: vi.fn(),
      checkSolution: vi.fn(),
      $: vi.fn().mockReturnValue({
        css: vi.fn(),
        hasClass: vi.fn().mockReturnValue(false)
      })
    }
    
    // Mock DOM elements
    const mockBoardElement = {
      id: 'myBoard',
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      classList: { add: vi.fn(), remove: vi.fn() }
    }
    
    global.document.getElementById = vi.fn().mockImplementation((id) => {
      return id === 'myBoard' ? mockBoardElement : null
    })
    
    global.document.body = {
      classList: { add: vi.fn(), remove: vi.fn() }
    } as any
    
    // Mock touch detection
    Object.defineProperty(global.window, 'ontouchstart', {
      value: undefined,
      writable: true
    })
    
    // Import fresh module
    const module = await import('./board-manager')
    BoardManager = module.default
    boardManager = new BoardManager()
  })

  afterEach(() => {
    vi.resetModules()
  })

  describe('Constructor', () => {
    it('should initialize with default configuration', () => {
      expect(boardManager).toBeDefined()
      expect(boardManager.board).toBeNull()
    })

    it('should initialize configuration object', () => {
      // Access private config through initialization
      expect(() => boardManager.initializeBoard()).not.toThrow()
    })
  })

  describe('Board Initialization', () => {
    it('should initialize board successfully', () => {
      const board = boardManager.initializeBoard()
      
      expect(board).toBe(mockBoardInstance)
      expect(mockChessboard).toHaveBeenCalledWith('myBoard', expect.any(Object))
      expect(boardManager.board).toBe(mockBoardInstance)
    })

    it('should throw error when board element not found', () => {
      global.document.getElementById = vi.fn().mockReturnValue(null)
      
      expect(() => boardManager.initializeBoard()).toThrow('Board container element not found')
    })

    it('should throw error when Chessboard creation fails', () => {
      mockChessboard.mockReturnValue(null)
      
      expect(() => boardManager.initializeBoard()).toThrow('Failed to create chessboard')
    })

    it('should initialize mobile touch handlers on touch devices', () => {
      // Mock touch device
      Object.defineProperty(global.window, 'ontouchstart', {
        value: {},
        writable: true
      })
      
      const mockElement = {
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        classList: { add: vi.fn(), remove: vi.fn() }
      }
      
      global.document.getElementById = vi.fn().mockReturnValue(mockElement)
      
      boardManager.initializeBoard()
      
      expect(mockElement.addEventListener).toHaveBeenCalledWith('touchstart', expect.any(Function), expect.any(Object))
      expect(mockElement.addEventListener).toHaveBeenCalledWith('touchmove', expect.any(Function), expect.any(Object))
    })
  })

  describe('Board Orientation', () => {
    beforeEach(() => {
      boardManager.initializeBoard()
    })

    it('should set orientation to white for white to move', () => {
      boardManager.setBoardOrientation('w')
      
      expect(mockBoardInstance.orientation).toHaveBeenCalledWith('white')
    })

    it('should set orientation to black for black to move', () => {
      boardManager.setBoardOrientation('b')
      
      expect(mockBoardInstance.orientation).toHaveBeenCalledWith('black')
    })

    it('should handle errors when setting orientation', () => {
      mockBoardInstance.orientation = vi.fn().mockImplementation(() => {
        throw new Error('Orientation error')
      })
      
      expect(() => boardManager.setBoardOrientation('w')).not.toThrow()
      expect(console.error).toHaveBeenCalled()
    })

    it('should handle board not initialized', () => {
      const newBoardManager = new BoardManager()
      
      expect(() => newBoardManager.setBoardOrientation('w')).not.toThrow()
    })
  })

  describe('Position Management', () => {
    beforeEach(() => {
      boardManager.initializeBoard()
    })

    it('should load position from FEN', () => {
      const testFen = 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1'
      
      boardManager.loadPosition(testFen)
      
      expect(mockBoardInstance.position).toHaveBeenCalledWith(testFen)
    })

    it('should handle errors when loading position', () => {
      mockBoardInstance.position = vi.fn().mockImplementation(() => {
        throw new Error('Position error')
      })
      
      expect(() => boardManager.loadPosition('invalid-fen')).not.toThrow()
      expect(console.error).toHaveBeenCalled()
    })

    it('should handle board not initialized', () => {
      const newBoardManager = new BoardManager()
      
      expect(() => newBoardManager.loadPosition('test-fen')).not.toThrow()
    })

    it('should have updatePosition alias', () => {
      const testFen = 'test-fen'
      
      boardManager.updatePosition(testFen)
      
      expect(mockBoardInstance.position).toHaveBeenCalledWith(testFen)
    })
  })

  describe('Drag and Drop Handlers', () => {
    beforeEach(() => {
      boardManager.initializeBoard()
    })

    it('should allow drag start for valid moves', () => {
      const result = boardManager.onDragStart('e2', 'wP', {}, 'white')
      
      expect(result).toBe(true)
      expect(global.document.body.classList.add).toHaveBeenCalledWith('dragging')
    })

    it('should prevent drag start when game is over', () => {
      mockGame.isGameOver = vi.fn().mockReturnValue(true)
      
      const result = boardManager.onDragStart('e2', 'wP', {}, 'white')
      
      expect(result).toBe(false)
    })

    it('should prevent drag start for wrong color pieces', () => {
      mockGame.turn = vi.fn().mockReturnValue('w')
      
      const result = boardManager.onDragStart('e7', 'bP', {}, 'white')
      
      expect(result).toBe(false)
    })

    it('should handle game over compatibility with different Chess.js versions', () => {
      // Test game_over method
      mockGame.isGameOver = undefined
      mockGame.game_over = vi.fn().mockReturnValue(true)
      
      const result = boardManager.onDragStart('e2', 'wP', {}, 'white')
      
      expect(result).toBe(false)
    })

    it('should handle drop for legal moves', () => {
      const result = boardManager.onDrop('e2', 'e4')
      
      expect(global.document.body.classList.remove).toHaveBeenCalledWith('dragging')
      expect(mockGame.move).toHaveBeenCalledWith({
        from: 'e2',
        to: 'e4',
        promotion: 'q'
      })
      expect(result).toBeUndefined()
    })

    it('should handle drop for illegal moves', () => {
      mockGame.move = vi.fn().mockReturnValue(null)
      
      const result = boardManager.onDrop('e2', 'e5')
      
      expect(result).toBe('snapback')
    })

    it('should handle snap end', () => {
      boardManager.onSnapEnd()
      
      expect(mockBoardInstance.position).toHaveBeenCalledWith(mockGame.fen())
      expect(global.document.body.classList.remove).toHaveBeenCalledWith('dragging')
    })
  })

  describe('Square Highlighting', () => {
    beforeEach(() => {
      boardManager.initializeBoard()
    })

    it('should highlight squares on mouse over', () => {
      const mockMoves = [
        { to: 'e4' },
        { to: 'e3' }
      ]
      
      mockGame.moves = vi.fn().mockReturnValue(mockMoves)
      
      boardManager.onMouseoverSquare('e2', 'wP')
      
      expect(mockGame.moves).toHaveBeenCalledWith({
        square: 'e2',
        verbose: true
      })
    })

    it('should handle no available moves', () => {
      mockGame.moves = vi.fn().mockReturnValue([])
      
      expect(() => boardManager.onMouseoverSquare('e2', 'wP')).not.toThrow()
    })

    it('should remove highlighting on mouse out', () => {
      boardManager.onMouseoutSquare('e2', 'wP')
      
      // Should call jQuery to remove highlighting
      expect(global.window.$).toHaveBeenCalled()
    })
  })

  describe('Game Over Detection', () => {
    it('should detect game over with isGameOver method', () => {
      mockGame.isGameOver = vi.fn().mockReturnValue(true)
      
      const result = boardManager.onDragStart('e2', 'wP', {}, 'white')
      
      expect(result).toBe(false)
    })

    it('should detect game over with game_over method', () => {
      mockGame.isGameOver = undefined
      mockGame.game_over = vi.fn().mockReturnValue(true)
      
      const result = boardManager.onDragStart('e2', 'wP', {}, 'white')
      
      expect(result).toBe(false)
    })

    it('should detect game over with gameOver method', () => {
      mockGame.isGameOver = undefined
      mockGame.game_over = undefined
      mockGame.gameOver = vi.fn().mockReturnValue(true)
      
      const result = boardManager.onDragStart('e2', 'wP', {}, 'white')
      
      expect(result).toBe(false)
    })

    it('should fallback to moves check', () => {
      mockGame.isGameOver = undefined
      mockGame.game_over = undefined
      mockGame.gameOver = undefined
      mockGame.moves = vi.fn().mockReturnValue([])
      
      const result = boardManager.onDragStart('e2', 'wP', {}, 'white')
      
      expect(result).toBe(false)
    })

    it('should handle null game', () => {
      global.window.game = null
      
      const result = boardManager.onDragStart('e2', 'wP', {}, 'white')
      
      expect(result).toBe(true) // Should allow drag if game is null
    })
  })

  describe('Mobile Touch Handling', () => {
    it('should skip mobile handlers on desktop', () => {
      // Desktop environment (no ontouchstart)
      Object.defineProperty(global.window, 'ontouchstart', {
        value: undefined,
        writable: true
      })
      
      const mockElement = {
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        classList: { add: vi.fn(), remove: vi.fn() }
      }
      
      global.document.getElementById = vi.fn().mockReturnValue(mockElement)
      
      boardManager.initializeBoard()
      
      expect(mockElement.addEventListener).not.toHaveBeenCalled()
    })

    it('should handle touch start events', () => {
      Object.defineProperty(global.window, 'ontouchstart', {
        value: {},
        writable: true
      })
      
      const mockElement = {
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        classList: { add: vi.fn(), remove: vi.fn() }
      }
      
      global.document.getElementById = vi.fn().mockReturnValue(mockElement)
      
      boardManager.initializeBoard()
      
      // Get the touch handler
      const touchStartHandler = mockElement.addEventListener.mock.calls
        .find(call => call[0] === 'touchstart')?.[1]
      
      expect(touchStartHandler).toBeDefined()
      
      // Mock touch event
      const mockTouchEvent = {
        preventDefault: vi.fn(),
        stopPropagation: vi.fn()
      }
      
      expect(() => touchStartHandler(mockTouchEvent)).not.toThrow()
    })
  })

  describe('Cleanup', () => {
    it('should cleanup mobile handlers', () => {
      Object.defineProperty(global.window, 'ontouchstart', {
        value: {},
        writable: true
      })
      
      const mockElement = {
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        classList: { add: vi.fn(), remove: vi.fn() }
      }
      
      global.document.getElementById = vi.fn().mockReturnValue(mockElement)
      
      boardManager.initializeBoard()
      boardManager.destroy()
      
      expect(mockElement.removeEventListener).toHaveBeenCalled()
    })

    it('should handle cleanup when board element not found', () => {
      boardManager.initializeBoard()
      
      // Mock getElementById to return null during cleanup
      global.document.getElementById = vi.fn().mockReturnValue(null)
      
      expect(() => boardManager.destroy()).not.toThrow()
    })
  })

  describe('Configuration', () => {
    it('should have correct default configuration', () => {
      boardManager.initializeBoard()
      
      expect(mockChessboard).toHaveBeenCalledWith('myBoard', expect.objectContaining({
        draggable: true,
        position: 'start',
        orientation: 'white',
        pieceTheme: 'src/img/chesspieces/wikipedia/{piece}.png'
      }))
    })

    it('should bind event handlers correctly', () => {
      boardManager.initializeBoard()
      
      const config = mockChessboard.mock.calls[0][1]
      
      expect(typeof config.onDrop).toBe('function')
      expect(typeof config.onSnapEnd).toBe('function')
      expect(typeof config.onMouseoutSquare).toBe('function')
      expect(typeof config.onMouseoverSquare).toBe('function')
      expect(typeof config.onDragStart).toBe('function')
    })
  })

  describe('Global Exposure', () => {
    it('should expose BoardManager to global scope', async () => {
      await import('./board-manager')
      expect((global.window as any).BoardManager).toBeDefined()
    })
  })

  describe('Error Handling', () => {
    it('should handle missing jQuery gracefully', () => {
      global.window.$ = undefined
      
      boardManager.initializeBoard()
      
      expect(() => boardManager.onMouseoverSquare('e2', 'wP')).not.toThrow()
      expect(() => boardManager.onMouseoutSquare('e2', 'wP')).not.toThrow()
    })

    it('should handle missing game object', () => {
      global.window.game = undefined
      
      boardManager.initializeBoard()
      
      expect(() => boardManager.onDrop('e2', 'e4')).not.toThrow()
      expect(() => boardManager.onSnapEnd()).not.toThrow()
    })

    it('should handle missing global functions', () => {
      global.window.updateStatus = undefined
      global.window.checkSolution = undefined
      
      boardManager.initializeBoard()
      
      expect(() => boardManager.onDrop('e2', 'e4')).not.toThrow()
    })
  })
})