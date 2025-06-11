/**
 * Problem Manager Tests
 * 
 * Tests for problem-manager.ts module functionality
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import type { ChessPuzzle } from '../types/chess-hawk'

// Mock fetch for JSON loading tests
global.fetch = vi.fn()

describe('Problem Manager', () => {
  let ProblemManager: any
  let problemManager: any

  beforeEach(async () => {
    vi.clearAllMocks()
    
    // Reset DOM mocks
    global.document.getElementById = vi.fn().mockReturnValue({
      textContent: '',
      className: '',
      innerHTML: '',
      style: { display: 'block' }
    })
    
    // Reset fetch mock
    vi.mocked(fetch).mockReset()
    
    // Import fresh module
    const module = await import('./problem-manager')
    ProblemManager = module.default
    problemManager = new ProblemManager()
  })

  afterEach(() => {
    vi.resetModules()
  })

  describe('Constructor', () => {
    it('should initialize with empty problems array', () => {
      expect(problemManager.problems).toEqual([])
      expect(problemManager.currentProblem).toBeNull()
      expect(problemManager.problemCount).toBe(0)
    })

    it('should log initialization message', () => {
      expect(console.log).toHaveBeenCalledWith('🏗️ ProblemManager initialized')
    })
  })

  describe('Problem Loading', () => {
    const mockProblemsData = {
      version: '1.0',
      totalPuzzles: 2,
      puzzles: [
        {
          id: 'test-1',
          type: 'tactic',
          title: 'Test Problem 1',
          description: 'Test description 1',
          fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
          solution: ['e4', 'e5'],
          difficulty: 'beginner',
          category: 'fork',
          points: 10,
          rating: 1200
        },
        {
          id: 'test-2',
          type: 'tactic',
          title: 'Test Problem 2',
          description: 'Test description 2',
          fen: 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1',
          solution: ['d5', 'exd5'],
          difficulty: 'intermediate',
          category: 'pin',
          points: 15,
          rating: 1400
        }
      ]
    }

    it('should load problems from JSON successfully', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockProblemsData
      } as Response)

      const problems = await problemManager.loadProblems()
      
      expect(fetch).toHaveBeenCalledWith(
        'src/data/problems.json',
        expect.objectContaining({ cache: 'no-cache' })
      )
      expect(problems).toHaveLength(2)
      expect(problemManager.problemCount).toBe(2)
      expect(problems[0].id).toBe('test-1')
      expect(problems[1].id).toBe('test-2')
    })

    it('should try multiple paths when first fails', async () => {
      vi.mocked(fetch)
        .mockRejectedValueOnce(new Error('First path failed'))
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => mockProblemsData
        } as Response)

      await problemManager.loadProblems()
      
      expect(fetch).toHaveBeenCalledTimes(2)
      expect(fetch).toHaveBeenNthCalledWith(1, 'src/data/problems.json', expect.any(Object))
      expect(fetch).toHaveBeenNthCalledWith(2, './src/data/problems.json', expect.any(Object))
    })

    it('should handle problems vs puzzles field compatibility', async () => {
      const dataWithProblems = {
        ...mockProblemsData,
        problems: mockProblemsData.puzzles,
        puzzles: undefined
      }
      
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => dataWithProblems
      } as Response)

      const problems = await problemManager.loadProblems()
      
      expect(problems).toHaveLength(2)
      expect(problemManager.problemCount).toBe(2)
    })

    it('should use fallback data when JSON loading fails', async () => {
      vi.mocked(fetch).mockRejectedValue(new Error('Network error'))

      const problems = await problemManager.loadProblems()
      
      // Should load fallback data
      expect(problems).toHaveLength(2)
      expect(problems[0].id).toBe('fallback_1')
      expect(problems[1].id).toBe('fallback_2')
    })

    it('should throw error when no fallback available and fetch fails', async () => {
      vi.mocked(fetch).mockRejectedValue(new Error('Network error'))
      
      // Mock createFallbackData to return null
      problemManager.createFallbackData = vi.fn().mockReturnValue(null)
      
      await expect(problemManager.loadProblems()).rejects.toThrow()
    })

    it('should validate data format', async () => {
      const invalidData = { version: '1.0', totalPuzzles: 0 } // Missing puzzles/problems array
      
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => invalidData
      } as Response)

      await expect(problemManager.loadProblems()).rejects.toThrow('Invalid data format')
    })

    it('should update UI status during loading', async () => {
      const statusElement = { textContent: '', className: '' }
      global.document.getElementById = vi.fn().mockReturnValue(statusElement)
      
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockProblemsData
      } as Response)

      await problemManager.loadProblems()
      
      expect(statusElement.textContent).toBe('✅ 2 problemer lastet')
      expect(statusElement.className).toBe('status-success')
    })
  })

  describe('Random Problem Selection', () => {
    beforeEach(() => {
      // Set up test data
      problemManager.problems = [
        { id: 'test-1', title: 'Problem 1', category: 'fork', difficulty: 'beginner', rating: 1200 },
        { id: 'test-2', title: 'Problem 2', category: 'pin', difficulty: 'intermediate', rating: 1400 },
        { id: 'test-3', title: 'Problem 3', category: 'skewer', difficulty: 'advanced', rating: 1600 }
      ]
    })

    it('should get random problem from loaded problems', () => {
      // Mock Math.random to return predictable value
      vi.spyOn(Math, 'random').mockReturnValue(0.5) // Should select index 1
      
      const problem = problemManager.getRandomProblem()
      
      expect(problem).toBeDefined()
      expect(problem.id).toBe('test-2')
      expect(problemManager.currentProblem).toBe(problem)
      expect((global.window as any).currentProblem).toBe(problem)
      
      Math.random.mockRestore()
    })

    it('should return null when no problems are loaded', () => {
      problemManager.problems = []
      
      const problem = problemManager.getRandomProblem()
      
      expect(problem).toBeNull()
    })

    it('should handle edge case with single problem', () => {
      problemManager.problems = [{ id: 'only-one', title: 'Only Problem' }]
      
      const problem = problemManager.getRandomProblem()
      
      expect(problem).toBeDefined()
      expect(problem.id).toBe('only-one')
    })

    it('should select different problems on multiple calls', () => {
      const selectedIds = new Set()
      
      // Call multiple times with different random values
      for (let i = 0; i < 10; i++) {
        vi.spyOn(Math, 'random').mockReturnValue(i / 10)
        const problem = problemManager.getRandomProblem()
        if (problem) selectedIds.add(problem.id)
        Math.random.mockRestore()
      }
      
      // Should have selected multiple different problems
      expect(selectedIds.size).toBeGreaterThan(1)
    })
  })

  describe('Problem Display', () => {
    const testProblem: ChessPuzzle = {
      id: 'display-test',
      type: 'tactic',
      title: 'Display Test Problem',
      description: 'Test problem for display functionality',
      fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
      solution: ['e4', 'e5'],
      difficulty: 'beginner',
      category: 'fork',
      theme: 'tactical-fork',
      points: 10,
      rating: 1200
    }

    it('should display problem information correctly', () => {
      const elements = {
        title: { textContent: '' },
        description: { textContent: '' },
        category: { textContent: '' },
        difficulty: { textContent: '' },
        rating: { textContent: '' },
        points: { textContent: '' }
      }
      
      global.document.getElementById = vi.fn().mockImplementation((id) => {
        const elementMap: any = {
          'problem-title': elements.title,
          'problem-description': elements.description,
          'category': elements.category,
          'difficulty': elements.difficulty,
          'rating': elements.rating,
          'points': elements.points
        }
        return elementMap[id] || null
      })

      problemManager.displayProblem(testProblem)
      
      expect(elements.title.textContent).toBe('Display Test Problem')
      expect(elements.description.textContent).toBe('Test problem for display functionality')
      expect(elements.category.textContent).toBe('fork')
      expect(elements.difficulty.textContent).toBe('beginner')
      expect(elements.rating.textContent).toBe('1200')
      expect(elements.points.textContent).toBe('10')
    })

    it('should handle theme vs category field', () => {
      const problemWithTheme = { ...testProblem, category: undefined }
      const categoryElement = { textContent: '' }
      
      global.document.getElementById = vi.fn().mockImplementation((id) => {
        return id === 'category' ? categoryElement : null
      })

      problemManager.displayProblem(problemWithTheme)
      
      expect(categoryElement.textContent).toBe('tactical-fork')
    })

    it('should handle missing elements gracefully', () => {
      global.document.getElementById = vi.fn().mockReturnValue(null)
      
      // Should not throw error
      expect(() => problemManager.displayProblem(testProblem)).not.toThrow()
    })

    it('should handle null problem gracefully', () => {
      expect(() => problemManager.displayProblem(null as any)).not.toThrow()
    })

    it('should update meta information', () => {
      const metaElement = { innerHTML: '', style: { display: '' } }
      
      global.document.getElementById = vi.fn().mockImplementation((id) => {
        return id === 'problem-meta' ? metaElement : null
      })

      problemManager.displayProblem(testProblem)
      
      expect(metaElement.innerHTML).toContain('fork')
      expect(metaElement.innerHTML).toContain('beginner')
      expect(metaElement.innerHTML).toContain('1200')
      expect(metaElement.innerHTML).toContain('10 poeng')
      expect(metaElement.style.display).toBe('block')
    })
  })

  describe('Statistics', () => {
    beforeEach(() => {
      problemManager.problems = [
        { id: '1', category: 'fork', difficulty: 'beginner', rating: 1200 },
        { id: '2', category: 'fork', difficulty: 'intermediate', rating: 1400 },
        { id: '3', category: 'pin', difficulty: 'beginner', rating: 1300 },
        { id: '4', category: 'pin', difficulty: 'advanced', rating: 1600 },
        { id: '5', category: 'skewer', difficulty: 'intermediate', rating: 1500 }
      ]
    })

    it('should calculate statistics correctly', () => {
      const stats = problemManager.getStatistics()
      
      expect(stats.total).toBe(5)
      expect(stats.categories.fork).toBe(2)
      expect(stats.categories.pin).toBe(2)
      expect(stats.categories.skewer).toBe(1)
      expect(stats.difficulties.beginner).toBe(2)
      expect(stats.difficulties.intermediate).toBe(2)
      expect(stats.difficulties.advanced).toBe(1)
      expect(stats.ratings.min).toBe(1200)
      expect(stats.ratings.max).toBe(1600)
      expect(stats.ratings.avg).toBe(1400) // (1200+1400+1300+1600+1500)/5
    })

    it('should return null when no problems loaded', () => {
      problemManager.problems = []
      
      const stats = problemManager.getStatistics()
      
      expect(stats).toBeNull()
    })

    it('should handle problems with missing categories', () => {
      problemManager.problems = [
        { id: '1', difficulty: 'beginner', rating: 1200 }, // Missing category
        { id: '2', category: 'fork', difficulty: 'intermediate', rating: 1400 }
      ]
      
      const stats = problemManager.getStatistics()
      
      expect(stats.categories.unknown).toBe(1)
      expect(stats.categories.fork).toBe(1)
    })
  })

  describe('Cleanup', () => {
    it('should cleanup resources properly', () => {
      problemManager.problems = [{ id: 'test' }]
      problemManager.currentProblem = { id: 'current' }
      
      problemManager.destroy()
      
      expect(problemManager.problems).toEqual([])
      expect(problemManager.currentProblem).toBeNull()
      expect((global.window as any).currentProblem).toBeNull()
    })

    it('should abort ongoing fetch requests', () => {
      const abortSpy = vi.fn()
      problemManager.abortController = { abort: abortSpy }
      
      problemManager.destroy()
      
      expect(abortSpy).toHaveBeenCalled()
    })
  })

  describe('Fallback Data', () => {
    it('should create valid fallback data', () => {
      const fallbackData = problemManager.createFallbackData()
      
      expect(fallbackData).toHaveLength(2)
      expect(fallbackData[0].id).toBe('fallback_1')
      expect(fallbackData[1].id).toBe('fallback_2')
      
      // Validate structure
      fallbackData.forEach((problem: ChessPuzzle) => {
        expect(problem).toHaveProperty('id')
        expect(problem).toHaveProperty('title')
        expect(problem).toHaveProperty('fen')
        expect(problem).toHaveProperty('solution')
        expect(problem).toHaveProperty('difficulty')
        expect(problem).toHaveProperty('category')
        expect(problem).toHaveProperty('points')
        expect(problem).toHaveProperty('rating')
      })
    })
  })
})