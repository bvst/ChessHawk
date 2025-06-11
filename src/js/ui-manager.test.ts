/**
 * UI Manager Tests
 * 
 * Tests for ui-manager.ts module functionality
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import type { ChessPuzzle, FeedbackType, NotificationOptions } from '../types/chess-hawk'

describe('UI Manager', () => {
  let UIManager: any
  let uiManager: any
  let mockElements: Record<string, any>

  beforeEach(async () => {
    vi.clearAllMocks()
    
    // Mock DOM elements
    mockElements = {
      feedback: {
        innerHTML: '',
        className: '',
        style: { display: 'none' },
        classList: { add: vi.fn(), remove: vi.fn() }
      },
      solution: {
        innerHTML: '',
        style: { display: 'none' },
        classList: { add: vi.fn(), remove: vi.fn() }
      },
      status: { textContent: '' },
      score: { textContent: '' },
      'problems-solved': { textContent: '' },
      'problem-title': { textContent: '' },
      'problem-description': { textContent: '' },
      category: { textContent: '' },
      difficulty: { textContent: '' },
      rating: { textContent: '' },
      points: { textContent: '' }
    }
    
    global.document.getElementById = vi.fn().mockImplementation((id) => {
      return mockElements[id] || null
    })
    
    // Mock window object
    global.window = {
      ...global.window,
      currentProblem: null
    }
    
    // Mock timers
    vi.useFakeTimers()
    
    // Import fresh module
    const module = await import('./ui-manager')
    UIManager = module.default
    uiManager = new UIManager()
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.resetModules()
  })

  describe('Constructor', () => {
    it('should initialize successfully', () => {
      expect(uiManager).toBeDefined()
      expect(console.log).toHaveBeenCalledWith('🎨 UIManager initialized')
    })
  })

  describe('Feedback Management', () => {
    it('should show feedback with default parameters', () => {
      uiManager.showFeedback('Test message')
      
      expect(mockElements.feedback.innerHTML).toContain('Test message')
      expect(mockElements.feedback.innerHTML).toContain('ℹ️') // Info icon
      expect(mockElements.feedback.className).toBe('feedback info show')
      expect(mockElements.feedback.style.display).toBe('block')
    })

    it('should show feedback with custom type and duration', () => {
      uiManager.showFeedback('Success message', 'success', 5000)
      
      expect(mockElements.feedback.innerHTML).toContain('Success message')
      expect(mockElements.feedback.innerHTML).toContain('✅') // Success icon
      expect(mockElements.feedback.className).toBe('feedback success show')
    })

    it('should show different icons for different feedback types', () => {
      const testCases: Array<{ type: FeedbackType; icon: string }> = [
        { type: 'success', icon: '✅' },
        { type: 'error', icon: '❌' },
        { type: 'warning', icon: '⚠️' },
        { type: 'info', icon: 'ℹ️' }
      ]
      
      testCases.forEach(({ type, icon }) => {
        uiManager.showFeedback(`Test ${type}`, type)
        expect(mockElements.feedback.innerHTML).toContain(icon)
      })
    })

    it('should auto-hide feedback after duration', () => {
      uiManager.showFeedback('Test message', 'info', 1000)
      
      // Fast-forward time
      vi.advanceTimersByTime(1000)
      
      expect(mockElements.feedback.classList.add).toHaveBeenCalledWith('fade-out')
    })

    it('should not auto-hide with zero duration', () => {
      uiManager.showFeedback('Persistent message', 'info', 0)
      
      // Fast-forward time
      vi.advanceTimersByTime(5000)
      
      expect(mockElements.feedback.classList.add).not.toHaveBeenCalledWith('fade-out')
    })

    it('should clear previous timer when showing new feedback', () => {
      uiManager.showFeedback('First message', 'info', 2000)
      uiManager.showFeedback('Second message', 'info', 2000)
      
      // Only one timer should be active
      expect(mockElements.feedback.innerHTML).toContain('Second message')
    })

    it('should handle missing feedback element', () => {
      global.document.getElementById = vi.fn().mockReturnValue(null)
      
      expect(() => uiManager.showFeedback('Test')).not.toThrow()
      expect(console.error).toHaveBeenCalledWith('❌ Feedback element not found')
    })

    it('should clear feedback manually', () => {
      uiManager.showFeedback('Test message')
      uiManager.clearFeedback()
      
      expect(mockElements.feedback.classList.add).toHaveBeenCalledWith('fade-out')
      
      // Fast-forward fade-out animation
      vi.advanceTimersByTime(300)
      
      expect(mockElements.feedback.style.display).toBe('none')
      expect(mockElements.feedback.className).toBe('feedback')
      expect(mockElements.feedback.innerHTML).toBe('')
    })

    it('should handle clearing feedback when element missing', () => {
      global.document.getElementById = vi.fn().mockReturnValue(null)
      
      expect(() => uiManager.clearFeedback()).not.toThrow()
    })
  })

  describe('Solution Display', () => {
    const testProblem: ChessPuzzle = {
      id: 'test-1',
      type: 'tactic',
      title: 'Test Problem',
      description: 'Test description',
      fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
      solution: ['e4', 'e5', 'Nf3'],
      difficulty: 'beginner',
      category: 'fork',
      points: 10,
      rating: 1200
    }

    it('should show solution for current problem', () => {
      global.window.currentProblem = testProblem
      
      uiManager.showSolution()
      
      expect(mockElements.solution.innerHTML).toContain('📖 Løsning:')
      expect(mockElements.solution.innerHTML).toContain('e4')
      expect(mockElements.solution.innerHTML).toContain('e5')
      expect(mockElements.solution.innerHTML).toContain('Nf3')
      expect(mockElements.solution.innerHTML).toContain('fork')
      expect(mockElements.solution.innerHTML).toContain('beginner')
      expect(mockElements.solution.innerHTML).toContain('1200')
      expect(mockElements.solution.style.display).toBe('block')
      expect(mockElements.solution.classList.add).toHaveBeenCalledWith('visible')
    })

    it('should handle problem with theme instead of category', () => {
      const problemWithTheme = { ...testProblem, category: undefined, theme: 'tactical-fork' }
      global.window.currentProblem = problemWithTheme
      
      uiManager.showSolution()
      
      expect(mockElements.solution.innerHTML).toContain('tactical-fork')
    })

    it('should handle problem with no category or theme', () => {
      const problemNoCategory = { ...testProblem, category: undefined, theme: undefined }
      global.window.currentProblem = problemNoCategory
      
      uiManager.showSolution()
      
      expect(mockElements.solution.innerHTML).toContain('Ukjent')
    })

    it('should handle empty solution array', () => {
      const problemEmptySolution = { ...testProblem, solution: [] }
      global.window.currentProblem = problemEmptySolution
      
      uiManager.showSolution()
      
      expect(mockElements.solution.innerHTML).toContain('📖 Løsning:')
      expect(mockElements.solution.style.display).toBe('block')
    })

    it('should show error when no problem loaded', () => {
      global.window.currentProblem = null
      
      uiManager.showSolution()
      
      expect(mockElements.feedback.innerHTML).toContain('Ingen problem lastet!')
      expect(mockElements.feedback.className).toBe('feedback error show')
    })

    it('should handle missing solution element', () => {
      global.window.currentProblem = testProblem
      global.document.getElementById = vi.fn().mockImplementation((id) => {
        return id === 'solution' ? null : mockElements[id]
      })
      
      expect(() => uiManager.showSolution()).not.toThrow()
      expect(console.error).toHaveBeenCalledWith('❌ Solution element not found')
    })

    it('should clear solution display', () => {
      uiManager.clearSolution()
      
      expect(mockElements.solution.style.display).toBe('none')
      expect(mockElements.solution.classList.remove).toHaveBeenCalledWith('visible')
      expect(mockElements.solution.innerHTML).toBe('')
    })

    it('should handle clearing solution when element missing', () => {
      global.document.getElementById = vi.fn().mockReturnValue(null)
      
      expect(() => uiManager.clearSolution()).not.toThrow()
    })
  })

  describe('Game Status Updates', () => {
    it('should update game status', () => {
      uiManager.updateGameStatus('White to move')
      
      expect(mockElements.status.textContent).toBe('White to move')
    })

    it('should handle missing status element', () => {
      global.document.getElementById = vi.fn().mockImplementation((id) => {
        return id === 'status' ? null : mockElements[id]
      })
      
      expect(() => uiManager.updateGameStatus('Test')).not.toThrow()
    })
  })

  describe('Problem Display Updates', () => {
    const testProblem: ChessPuzzle = {
      id: 'test-1',
      type: 'tactic',
      title: 'Display Test Problem',
      description: 'Test problem description',
      fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
      solution: ['e4'],
      difficulty: 'intermediate',
      category: 'pin',
      points: 15,
      rating: 1400
    }

    it('should update all problem display elements', () => {
      uiManager.updateProblemDisplay(testProblem)
      
      expect(mockElements['problem-title'].textContent).toBe('Display Test Problem')
      expect(mockElements['problem-description'].textContent).toBe('Test problem description')
      expect(mockElements.category.textContent).toBe('pin')
      expect(mockElements.difficulty.textContent).toBe('intermediate')
      expect(mockElements.rating.textContent).toBe('1400')
      expect(mockElements.points.textContent).toBe('15')
    })

    it('should handle problem with theme instead of category', () => {
      const problemWithTheme = { ...testProblem, category: undefined, theme: 'pin-theme' }
      
      uiManager.updateProblemDisplay(problemWithTheme)
      
      expect(mockElements.category.textContent).toBe('pin-theme')
    })

    it('should handle problem with no category or theme', () => {
      const problemNoCategory = { ...testProblem, category: undefined, theme: undefined }
      
      uiManager.updateProblemDisplay(problemNoCategory)
      
      expect(mockElements.category.textContent).toBe('Ukjent')
    })

    it('should handle missing description', () => {
      const problemNoDescription = { ...testProblem, description: undefined }
      
      uiManager.updateProblemDisplay(problemNoDescription)
      
      expect(mockElements['problem-description'].textContent).toBe('')
    })

    it('should handle missing DOM elements gracefully', () => {
      global.document.getElementById = vi.fn().mockReturnValue(null)
      
      expect(() => uiManager.updateProblemDisplay(testProblem)).not.toThrow()
    })
  })

  describe('Notifications', () => {
    it('should show notification with default options', () => {
      uiManager.showNotification('Test notification')
      
      expect(mockElements.feedback.innerHTML).toContain('Test notification')
      expect(mockElements.feedback.className).toBe('feedback info show')
    })

    it('should show notification with custom options', () => {
      const options: NotificationOptions = {
        type: 'success',
        duration: 5000,
        persistent: false
      }
      
      uiManager.showNotification('Success notification', options)
      
      expect(mockElements.feedback.innerHTML).toContain('Success notification')
      expect(mockElements.feedback.className).toBe('feedback success show')
    })

    it('should show persistent notification', () => {
      const options: NotificationOptions = {
        persistent: true,
        type: 'warning'
      }
      
      uiManager.showNotification('Persistent warning', options)
      
      // Fast-forward time to ensure it doesn't auto-hide
      vi.advanceTimersByTime(10000)
      
      expect(mockElements.feedback.classList.add).not.toHaveBeenCalledWith('fade-out')
    })
  })

  describe('Score Management', () => {
    it('should update score display', () => {
      uiManager.updateScore(150)
      
      expect(mockElements.score.textContent).toBe('150')
    })

    it('should handle missing score element', () => {
      global.document.getElementById = vi.fn().mockImplementation((id) => {
        return id === 'score' ? null : mockElements[id]
      })
      
      expect(() => uiManager.updateScore(100)).not.toThrow()
    })

    it('should update problems solved display', () => {
      uiManager.updateProblemsSolved(5, 10)
      
      expect(mockElements['problems-solved'].textContent).toBe('5/10')
    })

    it('should handle missing problems solved element', () => {
      global.document.getElementById = vi.fn().mockImplementation((id) => {
        return id === 'problems-solved' ? null : mockElements[id]
      })
      
      expect(() => uiManager.updateProblemsSolved(1, 5)).not.toThrow()
    })
  })

  describe('Icon Management', () => {
    it('should return correct icons for feedback types', () => {
      // Test through the feedback system since the method is private
      uiManager.showFeedback('Test', 'success')
      expect(mockElements.feedback.innerHTML).toContain('✅')
      
      uiManager.showFeedback('Test', 'error')
      expect(mockElements.feedback.innerHTML).toContain('❌')
      
      uiManager.showFeedback('Test', 'warning')
      expect(mockElements.feedback.innerHTML).toContain('⚠️')
      
      uiManager.showFeedback('Test', 'info')
      expect(mockElements.feedback.innerHTML).toContain('ℹ️')
    })
  })

  describe('Cleanup', () => {
    it('should cleanup all resources', () => {
      // Set up some state to cleanup
      uiManager.showFeedback('Test message', 'info', 5000)
      global.window.currentProblem = {
        id: 'test',
        title: 'Test',
        solution: ['e4']
      } as ChessPuzzle
      
      uiManager.showSolution()
      
      // Cleanup
      uiManager.destroy()
      
      // Check that cleanup occurred
      expect(mockElements.feedback.classList.add).toHaveBeenCalledWith('fade-out')
      expect(mockElements.solution.style.display).toBe('none')
    })

    it('should handle cleanup with no active timers', () => {
      expect(() => uiManager.destroy()).not.toThrow()
    })
  })

  describe('Global Exposure', () => {
    it('should expose UIManager to global scope', async () => {
      await import('./ui-manager')
      expect((global.window as any).UIManager).toBeDefined()
    })
  })

  describe('Error Handling', () => {
    it('should handle null elements gracefully', () => {
      global.document.getElementById = vi.fn().mockReturnValue(null)
      
      expect(() => {
        uiManager.showFeedback('Test')
        uiManager.showSolution()
        uiManager.updateGameStatus('Test')
        uiManager.updateScore(100)
        uiManager.updateProblemsSolved(1, 5)
        uiManager.clearFeedback()
        uiManager.clearSolution()
      }).not.toThrow()
    })

    it('should handle timer errors gracefully', () => {
      // Mock setTimeout to throw
      vi.spyOn(global, 'setTimeout').mockImplementation(() => {
        throw new Error('Timer error')
      })
      
      expect(() => uiManager.showFeedback('Test', 'info', 1000)).not.toThrow()
    })
  })
})