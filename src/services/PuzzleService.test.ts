/**
 * Puzzle Service Tests
 * Tests for the abstracted puzzle service layer
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { LocalPuzzleService, ApiPuzzleService, PuzzleServiceFactory } from './PuzzleService';
import type { PuzzleFilter, UserProgress, SolutionResult } from './PuzzleService';
import type { Puzzle } from '../stores/GameStore';

// Mock fetch for API service tests
global.fetch = vi.fn();

// Mock localStorage for local service tests
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    clear: vi.fn(() => {
      store = {};
    })
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

const mockPuzzleData = {
  version: "3.0",
  puzzles: [
    {
      id: "test_fork_1",
      theme: "fork",
      title: "Gaffel-test 1",
      description: "Angrip to brikker samtidig",
      fen: "rnbqkb1r/pppp1ppp/5n2/4p3/2B1P3/8/PPPP1PPP/RNBQK1NR w KQkq - 2 3",
      solution: ["Nxe5"],
      difficulty: "beginner" as const,
      rating: 1200,
      points: 10,
      hint: "Se etter gaffel-muligheter",
      tags: ["fork", "beginner"],
      source: "Test",
      createdAt: "2024-01-01T00:00:00.000Z"
    },
    {
      id: "test_pin_1",
      theme: "pin",
      title: "Binding-test 1",
      description: "Bind en brikke til kongen",
      fen: "rnbqk2r/pppp1ppp/5n2/2b1p3/2B1P3/3P1N2/PPP2PPP/RNBQK2R w KQkq - 3 4",
      solution: ["Bb5"],
      difficulty: "intermediate" as const,
      rating: 1500,
      points: 15,
      hint: "Se etter binding-muligheter",
      tags: ["pin", "intermediate"],
      source: "Test",
      createdAt: "2024-01-01T00:00:00.000Z"
    },
    {
      id: "test_mate_1",
      theme: "mate",
      title: "Matt-test 1",
      description: "Oppnå sjakkmatt",
      fen: "rnbqkb1r/pppp1ppp/5n2/4p3/2B1P2Q/8/PPPP1PPP/RNB1K1NR w KQkq - 2 3",
      solution: ["Qh5"],
      difficulty: "advanced" as const,
      rating: 1800,
      points: 25,
      hint: "Se etter matt-muligheter",
      tags: ["mate", "advanced"],
      source: "Test",
      createdAt: "2024-01-01T00:00:00.000Z"
    }
  ]
};

describe('LocalPuzzleService', () => {
  let service: LocalPuzzleService;
  let mockFetch: typeof vi.fn;

  beforeEach(() => {
    mockFetch = vi.mocked(fetch);
    mockFetch.mockClear();
    localStorageMock.clear();
    
    // Mock successful puzzle data fetch
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => mockPuzzleData
    } as Response);
    
    service = new LocalPuzzleService();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Initialization', () => {
    it('should load puzzle data on initialization', async () => {
      await service.getPuzzles();
      
      expect(mockFetch).toHaveBeenCalledWith('/src/data/problems.json');
    });

    it('should handle initialization errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Failed to load'));
      
      const newService = new LocalPuzzleService();
      await expect(newService.getPuzzles()).rejects.toThrow('Failed to load');
    });

    it('should handle invalid data format', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ invalid: 'data' })
      } as Response);
      
      const newService = new LocalPuzzleService();
      await expect(newService.getPuzzles()).rejects.toThrow('Invalid puzzle database format');
    });
  });

  describe('Puzzle Retrieval', () => {
    it('should get puzzle by ID', async () => {
      const puzzle = await service.getPuzzle('test_fork_1');
      
      expect(puzzle).toBeDefined();
      expect(puzzle?.id).toBe('test_fork_1');
      expect(puzzle?.theme).toBe('fork');
    });

    it('should return null for non-existent puzzle', async () => {
      const puzzle = await service.getPuzzle('non_existent');
      expect(puzzle).toBeNull();
    });

    it('should get all puzzles without filter', async () => {
      const puzzles = await service.getPuzzles();
      
      expect(puzzles).toHaveLength(3);
      expect(puzzles.map(p => p.id)).toEqual(['test_fork_1', 'test_pin_1', 'test_mate_1']);
    });

    it('should filter puzzles by theme', async () => {
      const filter: PuzzleFilter = { theme: 'fork' };
      const puzzles = await service.getPuzzles(filter);
      
      expect(puzzles).toHaveLength(1);
      expect(puzzles[0].theme).toBe('fork');
    });

    it('should filter puzzles by difficulty', async () => {
      const filter: PuzzleFilter = { difficulty: 'intermediate' };
      const puzzles = await service.getPuzzles(filter);
      
      expect(puzzles).toHaveLength(1);
      expect(puzzles[0].difficulty).toBe('intermediate');
    });

    it('should filter puzzles by rating range', async () => {
      const filter: PuzzleFilter = { 
        rating: { min: 1400, max: 1600 } 
      };
      const puzzles = await service.getPuzzles(filter);
      
      expect(puzzles).toHaveLength(1);
      expect(puzzles[0].rating).toBe(1500);
    });

    it('should apply limit and offset', async () => {
      const filter: PuzzleFilter = { limit: 2, offset: 1 };
      const puzzles = await service.getPuzzles(filter);
      
      expect(puzzles).toHaveLength(2);
      expect(puzzles[0].id).toBe('test_pin_1'); // Skip first puzzle
    });

    it('should filter by tags', async () => {
      const filter: PuzzleFilter = { tags: ['intermediate'] };
      const puzzles = await service.getPuzzles(filter);
      
      expect(puzzles).toHaveLength(1);
      expect(puzzles[0].tags).toContain('intermediate');
    });
  });

  describe('Random Puzzle Selection', () => {
    it('should get random puzzle without filter', async () => {
      const puzzle = await service.getRandomPuzzle();
      
      expect(puzzle).toBeDefined();
      expect(['test_fork_1', 'test_pin_1', 'test_mate_1']).toContain(puzzle!.id);
    });

    it('should get random puzzle with filter', async () => {
      const filter: PuzzleFilter = { theme: 'pin' };
      const puzzle = await service.getRandomPuzzle(filter);
      
      expect(puzzle).toBeDefined();
      expect(puzzle!.theme).toBe('pin');
    });

    it('should return null when no puzzles match filter', async () => {
      const filter: PuzzleFilter = { theme: 'nonexistent' };
      const puzzle = await service.getRandomPuzzle(filter);
      
      expect(puzzle).toBeNull();
    });
  });

  describe('User Progress Management', () => {
    it('should return null for non-existent user progress', async () => {
      const progress = await service.getUserProgress('new_user');
      expect(progress).toBeNull();
    });

    it('should load user progress from localStorage', async () => {
      const mockProgress: UserProgress = {
        userId: 'test_user',
        puzzlesSolved: ['test_fork_1'],
        totalTime: 120,
        averageRating: 1200,
        streaks: { current: 1, best: 5 },
        themeProgress: {
          fork: { solved: 1, total: 1, averageRating: 1200 }
        }
      };

      localStorageMock.setItem('chess-hawk-progress-test_user', JSON.stringify(mockProgress));

      const progress = await service.getUserProgress('test_user');
      expect(progress).toEqual(mockProgress);
    });

    it('should handle corrupted localStorage data', async () => {
      localStorageMock.setItem('chess-hawk-progress-test_user', 'invalid json');

      const progress = await service.getUserProgress('test_user');
      expect(progress).toBeNull();
    });
  });

  describe('Solution Submission', () => {
    it('should validate correct solutions', async () => {
      const result = await service.submitSolution('test_user', 'test_fork_1', ['Nxe5'], 30, 1);
      
      expect(result.success).toBe(true);
      expect(result.timeSpent).toBe(30);
      expect(result.attempts).toBe(1);
      expect(result.score).toBeGreaterThan(0);
    });

    it('should reject incorrect solutions', async () => {
      const result = await service.submitSolution('test_user', 'test_fork_1', ['e4'], 30, 1);
      
      expect(result.success).toBe(false);
      expect(result.score).toBe(0);
    });

    it('should reject solutions with wrong length', async () => {
      const result = await service.submitSolution('test_user', 'test_fork_1', ['Nxe5', 'e4'], 30, 1);
      
      expect(result.success).toBe(false);
      expect(result.score).toBe(0);
    });

    it('should calculate score based on time and attempts', async () => {
      // Fast solve with few attempts should score higher
      const fastResult = await service.submitSolution('test_user', 'test_fork_1', ['Nxe5'], 10, 1);
      
      // Slow solve with many attempts should score lower
      const slowResult = await service.submitSolution('test_user2', 'test_fork_1', ['Nxe5'], 120, 5);
      
      expect(fastResult.score).toBeGreaterThan(slowResult.score);
    });

    it('should update user progress after submission', async () => {
      await service.submitSolution('progress_user', 'test_fork_1', ['Nxe5'], 30, 1);
      
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'chess-hawk-progress-progress_user',
        expect.stringContaining('"puzzlesSolved":["test_fork_1"]')
      );
    });

    it('should suggest next puzzle after successful solve', async () => {
      const result = await service.submitSolution('test_user', 'test_fork_1', ['Nxe5'], 30, 1);
      
      expect(result.nextPuzzleId).toBeDefined();
      expect(['test_pin_1', 'test_mate_1']).toContain(result.nextPuzzleId!);
    });
  });

  describe('Database Validation', () => {
    it('should validate correct database structure', async () => {
      const isValid = await service.validatePuzzleDatabase();
      expect(isValid).toBe(true);
    });

    it('should reject empty database', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ puzzles: [] })
      } as Response);
      
      const newService = new LocalPuzzleService();
      const isValid = await newService.validatePuzzleDatabase();
      expect(isValid).toBe(false);
    });

    it('should reject puzzles with missing required fields', async () => {
      const invalidData = {
        puzzles: [{
          id: 'invalid',
          // Missing required fields
          theme: 'fork'
        }]
      };
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => invalidData
      } as Response);
      
      const newService = new LocalPuzzleService();
      const isValid = await newService.validatePuzzleDatabase();
      expect(isValid).toBe(false);
    });
  });

  describe('Data Import/Export', () => {
    it('should export user data', async () => {
      const mockProgress: UserProgress = {
        userId: 'export_user',
        puzzlesSolved: ['test_fork_1'],
        totalTime: 120,
        averageRating: 1200,
        streaks: { current: 1, best: 5 },
        themeProgress: {}
      };

      localStorageMock.setItem('chess-hawk-progress-export_user', JSON.stringify(mockProgress));
      localStorageMock.setItem('chess-hawk-settings-export_user', '{"theme":"dark"}');

      const exportedData = await service.exportUserData('export_user');
      
      expect(exportedData.progress).toEqual(mockProgress);
      expect(exportedData.settings).toEqual({theme: "dark"});
      expect(exportedData.exportedAt).toBeDefined();
    });

    it('should import user data', async () => {
      const importData = {
        progress: {
          userId: 'import_user',
          puzzlesSolved: ['test_pin_1'],
          totalTime: 60,
          averageRating: 1500,
          streaks: { current: 2, best: 3 },
          themeProgress: {}
        },
        settings: { theme: 'light' }
      };

      await service.importUserData('import_user', importData);

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'chess-hawk-progress-import_user',
        JSON.stringify(importData.progress)
      );
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'chess-hawk-settings-import_user',
        JSON.stringify(importData.settings)
      );
    });
  });
});

describe('ApiPuzzleService', () => {
  let service: ApiPuzzleService;
  let mockFetch: typeof vi.fn;

  beforeEach(() => {
    mockFetch = vi.mocked(fetch);
    mockFetch.mockClear();
    service = new ApiPuzzleService('https://api.example.com', 'test-api-key');
  });

  describe('Authentication', () => {
    it('should include API key in headers', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockPuzzleData.puzzles[0]
      } as Response);

      await service.getPuzzle('test123');

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.example.com/puzzles/test123',
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': 'Bearer test-api-key',
            'Content-Type': 'application/json'
          })
        })
      );
    });

    it('should work without API key', async () => {
      const serviceNoAuth = new ApiPuzzleService('https://api.example.com');
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockPuzzleData.puzzles[0]
      } as Response);

      await serviceNoAuth.getPuzzle('test123');

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.example.com/puzzles/test123',
        expect.objectContaining({
          headers: expect.not.objectContaining({
            'Authorization': expect.anything()
          })
        })
      );
    });
  });

  describe('API Error Handling', () => {
    it('should handle 404 responses gracefully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404
      } as Response);

      const puzzle = await service.getPuzzle('nonexistent');
      expect(puzzle).toBeNull();
    });

    it('should throw errors for other HTTP errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500
      } as Response);

      await expect(service.getPuzzle('test123')).rejects.toThrow('API error: 500');
    });

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const puzzle = await service.getPuzzle('test123');
      expect(puzzle).toBeNull();
    });
  });

  describe('Filter Parameters', () => {
    it('should construct correct query parameters', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ puzzles: [] })
      } as Response);

      const filter: PuzzleFilter = {
        theme: 'fork',
        difficulty: 'intermediate',
        rating: { min: 1400, max: 1600 },
        limit: 10,
        offset: 5,
        tags: ['tactical', 'endgame']
      };

      await service.getPuzzles(filter);

      const expectedUrl = 'https://api.example.com/puzzles?theme=fork&difficulty=intermediate&minRating=1400&maxRating=1600&limit=10&offset=5&tags=tactical&tags=endgame';
      expect(mockFetch).toHaveBeenCalledWith(expectedUrl, expect.any(Object));
    });
  });

  describe('Solution Submission', () => {
    it('should submit solutions to API', async () => {
      const mockResult: SolutionResult = {
        success: true,
        timeSpent: 30,
        attempts: 1,
        score: 85,
        nextPuzzleId: 'next123'
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResult
      } as Response);

      const result = await service.submitSolution('user123', 'puzzle123', ['e4'], 30, 1);

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.example.com/users/user123/solutions',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            puzzleId: 'puzzle123',
            solution: ['e4'],
            timeSpent: 30,
            attempts: 1
          })
        })
      );

      expect(result).toEqual(mockResult);
    });
  });
});

describe('PuzzleServiceFactory', () => {
  it('should create local service', () => {
    const service = PuzzleServiceFactory.createLocalService();
    expect(service).toBeInstanceOf(LocalPuzzleService);
  });

  it('should create API service', () => {
    const service = PuzzleServiceFactory.createApiService('https://api.example.com', 'key');
    expect(service).toBeInstanceOf(ApiPuzzleService);
  });

  it('should create service based on config', () => {
    const localService = PuzzleServiceFactory.createService({ type: 'local' });
    expect(localService).toBeInstanceOf(LocalPuzzleService);

    const apiService = PuzzleServiceFactory.createService({ 
      type: 'api', 
      baseUrl: 'https://api.example.com' 
    });
    expect(apiService).toBeInstanceOf(ApiPuzzleService);
  });

  it('should throw error for missing API base URL', () => {
    expect(() => {
      PuzzleServiceFactory.createService({ type: 'api' });
    }).toThrow('API base URL is required for API service');
  });

  it('should throw error for unknown service type', () => {
    expect(() => {
      PuzzleServiceFactory.createService({ type: 'unknown' as any });
    }).toThrow('Unknown service type: unknown');
  });
});

// Integration test helpers
export const createTestPuzzle = (overrides: Partial<Puzzle> = {}): Puzzle => {
  return {
    id: 'test_' + Math.random().toString(36).substr(2, 9),
    theme: 'fork',
    title: 'Test Puzzle',
    description: 'Test description',
    fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
    solution: ['e4'],
    difficulty: 'beginner',
    rating: 1200,
    points: 10,
    hint: 'Test hint',
    tags: ['fork', 'beginner'],
    source: 'Test',
    createdAt: new Date().toISOString(),
    ...overrides
  };
};

export const createTestUserProgress = (overrides: Partial<UserProgress> = {}): UserProgress => {
  return {
    userId: 'test_user',
    puzzlesSolved: [],
    totalTime: 0,
    averageRating: 0,
    streaks: { current: 0, best: 0 },
    themeProgress: {},
    ...overrides
  };
};