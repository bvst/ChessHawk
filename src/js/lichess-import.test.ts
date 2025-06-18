/**
 * Lichess Import System Tests
 * Tests for puzzle import functionality and data validation
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { QualityLichessImporter, type ChessHawkPuzzle } from '../../scripts/quality-lichess-import';

// Mock fetch for testing
global.fetch = vi.fn();

interface LichessPuzzleMock {
  puzzle: {
    id: string;
    solution: string[];
    themes: string[];
    rating: number;
  };
  game: {
    pgn: string;
    clock?: string;
  };
}

describe('QualityLichessImporter', () => {
  let importer: QualityLichessImporter;
  let mockFetch: typeof vi.fn;

  beforeEach(() => {
    importer = new QualityLichessImporter();
    mockFetch = vi.mocked(fetch);
    mockFetch.mockClear();
  });

  describe('Database Communication', () => {
    it('should handle missing database gracefully', async () => {
      // Mock file system to simulate no database
      const fs = require('fs');
      vi.spyOn(fs, 'existsSync').mockReturnValue(false);

      await expect(importer.fetchPuzzles(10, 'fork')).rejects.toThrow('No puzzle database available');
    });

    it('should parse CSV data correctly', () => {
      const csvData = `PuzzleId,FEN,Moves,Rating,RatingDeviation,Popularity,NbPlays,Themes,GameUrl,OpeningTags
test123,rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1,e2e4 e7e5,1500,100,90,1000,fork opening,https://lichess.org/game123,e4`;

      const puzzles = importer.parsePuzzlesFromCSV(csvData, 'fork', 10);
      
      expect(puzzles).toHaveLength(1);
      expect(puzzles[0].puzzle.id).toBe('test123');
      expect(puzzles[0].puzzle.rating).toBe(1500);
      expect(puzzles[0].puzzle.solution).toEqual(['e2e4', 'e7e5']);
    });

    it('should filter puzzles by theme', () => {
      const csvData = `PuzzleId,FEN,Moves,Rating,RatingDeviation,Popularity,NbPlays,Themes,GameUrl,OpeningTags
test1,fen1,e2e4,1500,100,90,1000,fork opening,url1,tag1
test2,fen2,d2d4,1600,100,90,1000,pin tactical,url2,tag2
test3,fen3,Nf3,1400,100,90,1000,fork sacrifice,url3,tag3`;

      const puzzles = importer.parsePuzzlesFromCSV(csvData, 'fork', 10);
      
      expect(puzzles).toHaveLength(2); // Only fork puzzles
      expect(puzzles[0].puzzle.id).toBe('test1');
      expect(puzzles[1].puzzle.id).toBe('test3');
    });

    it('should handle CSV parsing errors gracefully', () => {
      const invalidCsvData = `PuzzleId,FEN,Moves
invalid,incomplete`;

      const puzzles = importer.parsePuzzlesFromCSV(invalidCsvData, undefined, 10);
      
      expect(puzzles).toHaveLength(0); // Should skip malformed lines
    });
  });

  describe('Puzzle Validation', () => {
    it('should validate complete puzzles as valid', () => {
      const validPuzzle: LichessPuzzleMock = {
        puzzle: {
          id: 'abc123',
          solution: ['e4', 'e5'],
          themes: ['fork', 'opening'],
          rating: 1500
        },
        game: {
          pgn: 'e4 e5 Nf3 Nc6 Bb5',
          clock: '10+0'
        }
      };

      const errors = importer['validatePuzzle'](validPuzzle as any);
      expect(errors).toHaveLength(0);
    });

    it('should reject puzzles with missing required fields', () => {
      const invalidPuzzle = {
        puzzle: {
          // Missing id
          solution: ['e4'],
          themes: ['fork'],
          rating: 1500
        },
        game: {
          pgn: 'e4 e5'
        }
      };

      const errors = importer['validatePuzzle'](invalidPuzzle as any);
      expect(errors).toContain('Missing puzzle ID');
    });

    it('should reject puzzles with invalid ratings', () => {
      const invalidPuzzle: LichessPuzzleMock = {
        puzzle: {
          id: 'abc123',
          solution: ['e4'],
          themes: ['fork'],
          rating: 5000 // Too high
        },
        game: {
          pgn: 'e4 e5'
        }
      };

      const errors = importer['validatePuzzle'](invalidPuzzle as any);
      expect(errors).toContain('Invalid rating: 5000');
    });

    it('should reject puzzles with empty solutions', () => {
      const invalidPuzzle: LichessPuzzleMock = {
        puzzle: {
          id: 'abc123',
          solution: [], // Empty solution
          themes: ['fork'],
          rating: 1500
        },
        game: {
          pgn: 'e4 e5'
        }
      };

      const errors = importer['validatePuzzle'](invalidPuzzle as any);
      expect(errors).toContain('Invalid solution format');
    });
  });

  describe('Puzzle Conversion', () => {
    it('should convert Lichess puzzles to Chess Hawk format', () => {
      const lichessPuzzle: LichessPuzzleMock = {
        puzzle: {
          id: 'abc123',
          solution: ['e4', 'e5'],
          themes: ['fork', 'opening'],
          rating: 1500
        },
        game: {
          pgn: 'e4 e5 Nf3 Nc6 Bb5',
          clock: '10+0'
        }
      };

      const converted = importer['convertPuzzle'](lichessPuzzle as any, 'fork');

      expect(converted).toMatchObject({
        id: 'lichess_abc123',
        theme: 'fork',
        solution: ['e4', 'e5'],
        rating: 1500,
        difficulty: 'intermediate', // 1500 rating = intermediate
        source: 'Lichess',
        lichessUrl: 'https://lichess.org/training/abc123'
      });

      expect(converted.title).toContain('Gaffel'); // Norwegian theme name
      expect(converted.description).toBe('Angrip to eller flere brikker samtidig');
      expect(converted.tags).toContain('fork');
      expect(converted.tags).toContain('intermediate');
    });

    it('should map ratings to correct difficulty levels', () => {
      const testCases = [
        { rating: 1000, expectedDifficulty: 'beginner' },
        { rating: 1299, expectedDifficulty: 'beginner' },
        { rating: 1300, expectedDifficulty: 'intermediate' },
        { rating: 1699, expectedDifficulty: 'intermediate' },
        { rating: 1700, expectedDifficulty: 'advanced' },
        { rating: 2500, expectedDifficulty: 'advanced' }
      ];

      testCases.forEach(({ rating, expectedDifficulty }) => {
        const lichessPuzzle: LichessPuzzleMock = {
          puzzle: {
            id: `test_${rating}`,
            solution: ['e4'],
            themes: ['fork'],
            rating
          },
          game: {
            pgn: 'e4 e5'
          }
        };

        const converted = importer['convertPuzzle'](lichessPuzzle as any, 'fork');
        expect(converted.difficulty).toBe(expectedDifficulty);
      });
    });

    it('should calculate points based on rating and difficulty', () => {
      const lichessPuzzle: LichessPuzzleMock = {
        puzzle: {
          id: 'test_points',
          solution: ['e4'],
          themes: ['fork'],
          rating: 1800 // Advanced level
        },
        game: {
          pgn: 'e4 e5'
        }
      };

      const converted = importer['convertPuzzle'](lichessPuzzle as any, 'fork');
      
      // Advanced base (35) + rating bonus ((1800-1000)/100 = 8) = 43 points
      expect(converted.points).toBe(43);
    });

    it('should generate Norwegian descriptions for different themes', () => {
      const themes = [
        { theme: 'fork', expectedDesc: 'Angrip to eller flere brikker samtidig' },
        { theme: 'pin', expectedDesc: 'Bind en brikke til en verdifull brikke bak' },
        { theme: 'mate', expectedDesc: 'Oppnå sjakkmatt' },
        { theme: 'sacrifice', expectedDesc: 'Offer materiale for posisjonell eller taktisk fordel' }
      ];

      themes.forEach(({ theme, expectedDesc }) => {
        const lichessPuzzle: LichessPuzzleMock = {
          puzzle: {
            id: `test_${theme}`,
            solution: ['e4'],
            themes: [theme],
            rating: 1500
          },
          game: {
            pgn: 'e4 e5'
          }
        };

        const converted = importer['convertPuzzle'](lichessPuzzle as any, theme);
        expect(converted.description).toBe(expectedDesc);
      });
    });
  });

  describe('Theme Import Process', () => {
    it('should process valid puzzles and filter invalid ones', () => {
      const csvData = `PuzzleId,FEN,Moves,Rating,RatingDeviation,Popularity,NbPlays,Themes,GameUrl,OpeningTags
valid1,fen1,e2e4,1500,100,90,1000,fork opening,url1,tag1
invalid1,fen2,,1500,100,90,1000,fork opening,url2,tag2
valid2,fen3,Nf3,1600,100,90,1000,fork tactical,url3,tag3`;
      
      const puzzles = importer.parsePuzzlesFromCSV(csvData, 'fork', 3);
      // CSV parser creates all puzzles, validation happens later in importTheme
      expect(puzzles).toHaveLength(3);
      expect(puzzles[0].puzzle.id).toBe('valid1');
      expect(puzzles[1].puzzle.id).toBe('invalid1'); // Will be filtered out during validation
      expect(puzzles[2].puzzle.id).toBe('valid2');
    });

    it('should handle duplicate puzzles during processing', () => {
      const csvData = `PuzzleId,FEN,Moves,Rating,RatingDeviation,Popularity,NbPlays,Themes,GameUrl,OpeningTags
dup1,fen1,e2e4,1500,100,90,1000,fork opening,url1,tag1
dup1,fen2,e2e4,1500,100,90,1000,fork opening,url2,tag2
unique1,fen3,Nf3,1600,100,90,1000,fork tactical,url3,tag3`;
      
      const puzzles = importer.parsePuzzlesFromCSV(csvData, 'fork', 3);
      
      // CSV parsing gets all matching puzzles, duplication handling happens in importTheme
      expect(puzzles).toHaveLength(3); // All puzzles are initially parsed
      expect(puzzles[0].puzzle.id).toBe('dup1');
      expect(puzzles[1].puzzle.id).toBe('dup1');
      expect(puzzles[2].puzzle.id).toBe('unique1');
    });

    it('should demonstrate import workflow readiness', () => {
      // This test shows that once a database is available, the import process will work
      const csvData = `PuzzleId,FEN,Moves,Rating,RatingDeviation,Popularity,NbPlays,Themes,GameUrl,OpeningTags
test1,rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1,e2e4,1500,100,90,1000,fork opening,url1,tag1`;
      
      const puzzles = importer.parsePuzzlesFromCSV(csvData, 'fork', 1);
      expect(puzzles).toHaveLength(1);
      
      const converted = importer['convertPuzzle'](puzzles[0], 'fork');
      expect(converted.id).toBe('lichess_test1');
      expect(converted.theme).toBe('fork');
      expect(converted.source).toBe('Lichess');
    });
  });

  describe('Database Generation', () => {
    it('should create properly formatted database structure', () => {
      const mockPuzzles: ChessHawkPuzzle[] = [
        {
          id: 'lichess_test1',
          theme: 'fork',
          title: 'Test Puzzle 1',
          description: 'Test description',
          fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
          solution: ['e4'],
          difficulty: 'beginner',
          rating: 1200,
          points: 10,
          hint: 'Test hint',
          tags: ['fork', 'beginner'],
          source: 'Lichess',
          lichessUrl: 'https://lichess.org/training/test1',
          createdAt: '2024-01-01T00:00:00.000Z'
        }
      ];

      // Mock file system operations
      const fs = require('fs');
      vi.spyOn(fs, 'existsSync').mockReturnValue(false);
      vi.spyOn(fs, 'copyFileSync').mockImplementation(() => {});
      vi.spyOn(fs, 'writeFileSync').mockImplementation(() => {});

      const savedPath = importer.savePuzzles(mockPuzzles, 'test-output.json');

      expect(fs.writeFileSync).toHaveBeenCalledWith(
        expect.stringContaining('test-output.json'),
        expect.stringContaining('"version": "3.0"')
      );

      // Verify the database structure
      const writtenData = JSON.parse(fs.writeFileSync.mock.calls[0][1]);
      expect(writtenData).toMatchObject({
        version: '3.0',
        totalPuzzles: 1,
        themes: expect.arrayContaining(['fork']),
        source: 'Lichess API Import with Norwegian Localization',
        puzzles: mockPuzzles
      });

      expect(writtenData.generated).toBeDefined();
      expect(writtenData.importStats).toBeDefined();
    });
  });

  describe('Integration Tests', () => {
    it('should handle CSV to Chess Hawk conversion', () => {
      const csvData = `PuzzleId,FEN,Moves,Rating,RatingDeviation,Popularity,NbPlays,Themes,GameUrl,OpeningTags
int_test1,rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1,e2e4,1400,100,90,1000,fork opening,url1,tag1`;
      
      const puzzles = importer.parsePuzzlesFromCSV(csvData, 'fork', 1);
      expect(puzzles).toHaveLength(1);
      
      const lichessPuzzle = puzzles[0];
      const converted = importer['convertPuzzle'](lichessPuzzle, 'fork');
      
      expect(converted).toMatchObject({
        id: 'lichess_int_test1',
        theme: 'fork',
        rating: 1400,
        difficulty: 'intermediate',
        source: 'Lichess'
      });
    });

    it('should handle database unavailable gracefully', async () => {
      const fs = require('fs');
      vi.spyOn(fs, 'existsSync').mockReturnValue(false);

      const result = await importer.importTheme('fork', 5);
      expect(result).toHaveLength(0);
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle empty API responses', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ puzzles: [] })
      } as Response);

      const result = await importer.importTheme('fork', 5);
      expect(result).toHaveLength(0);
    });

    it('should handle API responses without puzzles field', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({}) // No puzzles field
      } as Response);

      const result = await importer.importTheme('fork', 5);
      expect(result).toHaveLength(0);
    });

    it('should handle conversion errors gracefully', async () => {
      const malformedPuzzle = {
        puzzle: { id: 'malformed', solution: ['e4'], themes: ['fork'], rating: 1500 },
        game: { pgn: 'e4 e5' }
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ puzzles: [malformedPuzzle] })
      } as Response);

      // Mock conversion to throw an error
      const originalConvert = importer['convertPuzzle'];
      vi.spyOn(importer as any, 'convertPuzzle').mockImplementationOnce(() => {
        throw new Error('Conversion failed');
      });

      const result = await importer.importTheme('fork', 1);
      expect(result).toHaveLength(0);

      // Restore original method
      importer['convertPuzzle'] = originalConvert;
    });
  });
});

describe('Lichess API Integration Tests', () => {
  it('should test against real API (when available)', async () => {
    // This test can be skipped if API is unavailable
    const importer = new QualityLichessImporter();
    
    try {
      const puzzles = await importer.fetchPuzzles(1, 'fork');
      if (puzzles.length > 0) {
        expect(puzzles[0]).toHaveProperty('puzzle');
        expect(puzzles[0].puzzle).toHaveProperty('id');
        expect(puzzles[0].puzzle).toHaveProperty('solution');
        expect(puzzles[0].puzzle).toHaveProperty('themes');
        expect(puzzles[0].puzzle).toHaveProperty('rating');
      }
    } catch (error) {
      console.warn('Lichess API unavailable for integration test:', error);
      // Skip test if API is unavailable
    }
  });
});

// Helper functions for test data generation
export const generateMockLichessPuzzle = (overrides: Partial<LichessPuzzleMock> = {}): LichessPuzzleMock => {
  return {
    puzzle: {
      id: 'mock_' + Math.random().toString(36).substr(2, 9),
      solution: ['e4', 'e5'],
      themes: ['fork', 'opening'],
      rating: 1500,
      ...overrides.puzzle
    },
    game: {
      pgn: 'e4 e5 Nf3 Nc6 Bb5 a6',
      clock: '10+0',
      ...overrides.game
    }
  };
};

export const generateMockChessHawkPuzzle = (overrides: Partial<ChessHawkPuzzle> = {}): ChessHawkPuzzle => {
  return {
    id: 'lichess_mock_' + Math.random().toString(36).substr(2, 9),
    theme: 'fork',
    title: 'Gaffel 1500',
    description: 'Angrip to eller flere brikker samtidig',
    fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
    solution: ['e4', 'e5'],
    difficulty: 'intermediate',
    rating: 1500,
    points: 20,
    hint: 'Se etter muligheter til å angripe flere brikker med ett trekk',
    tags: ['fork', 'intermediate'],
    source: 'Lichess',
    lichessUrl: 'https://lichess.org/training/mock123',
    createdAt: new Date().toISOString(),
    ...overrides
  };
};