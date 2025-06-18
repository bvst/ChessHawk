import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import type { Puzzle } from '../../types/chess-hawk';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

describe('Legacy Puzzle Database Quality Tests (problems.json)', () => {
  let puzzleData: { puzzles: Puzzle[] };
  
  beforeAll(() => {
    const dataPath = join(__dirname, '../../data/problems.json');
    puzzleData = JSON.parse(readFileSync(dataPath, 'utf8'));
    
    console.warn('⚠️ Testing LEGACY database (problems.json) - known quality issues documented');
    console.warn('✅ For high-quality puzzles, see lichess-quality.test.ts');
  });

  describe('Basic Requirements', () => {
    it('should have exactly 1000 puzzles', () => {
      expect(puzzleData.puzzles).toHaveLength(1000);
    });

    it('should have all required fields for each puzzle', () => {
      puzzleData.puzzles.forEach((puzzle, index) => {
        expect(puzzle.id, `Puzzle ${index} missing id`).toBeDefined();
        expect(puzzle.theme, `Puzzle ${index} missing theme`).toBeDefined();
        expect(puzzle.fen, `Puzzle ${index} missing fen`).toBeDefined();
        expect(puzzle.solution, `Puzzle ${index} missing solution`).toBeDefined();
        expect(Array.isArray(puzzle.solution), `Puzzle ${index} solution not array`).toBe(true);
        expect(puzzle.solution.length, `Puzzle ${index} empty solution`).toBeGreaterThan(0);
        expect(puzzle.rating, `Puzzle ${index} missing rating`).toBeDefined();
        expect(puzzle.difficulty, `Puzzle ${index} missing difficulty`).toBeDefined();
      });
    });

    it('should have valid FEN positions', () => {
      const fenRegex = /^[rnbqkpRNBQKP1-8]+\/[rnbqkpRNBQKP1-8]+\/[rnbqkpRNBQKP1-8]+\/[rnbqkpRNBQKP1-8]+\/[rnbqkpRNBQKP1-8]+\/[rnbqkpRNBQKP1-8]+\/[rnbqkpRNBQKP1-8]+\/[rnbqkpRNBQKP1-8]+ [wb] [KQkq-]+ [a-h36-]* \d+ \d+$/;
      
      puzzleData.puzzles.forEach((puzzle, index) => {
        expect(puzzle.fen, `Invalid FEN at puzzle ${index}`).toMatch(fenRegex);
      });
    });
  });

  describe('Position Uniqueness', () => {
    it('should have mostly unique positions (>80%)', () => {
      const uniqueFens = new Set(puzzleData.puzzles.map(p => p.fen));
      const uniquenessRatio = uniqueFens.size / puzzleData.puzzles.length;
      
      expect(uniquenessRatio, 'Too many duplicate positions').toBeGreaterThan(0.8);
    });

    it('should not reuse the same position more than 5 times', () => {
      const fenCount = new Map<string, number>();
      puzzleData.puzzles.forEach(puzzle => {
        fenCount.set(puzzle.fen, (fenCount.get(puzzle.fen) || 0) + 1);
      });
      
      const overusedPositions = Array.from(fenCount.entries())
        .filter(([_, count]) => count > 5);
      
      expect(overusedPositions.length, 'Too many overused positions').toBe(0);
    });

    it('should not have identical puzzles (same FEN + solution)', () => {
      const puzzleKeys = new Set<string>();
      const duplicates: string[] = [];
      
      puzzleData.puzzles.forEach(puzzle => {
        const key = `${puzzle.fen}||${puzzle.solution.join(',')}`;
        if (puzzleKeys.has(key)) {
          duplicates.push(key);
        }
        puzzleKeys.add(key);
      });
      
      expect(duplicates.length, 'Found identical puzzles').toBe(0);
    });
  });

  describe('Theme Distribution', () => {
    it('should have balanced theme distribution', () => {
      const themeCount = new Map<string, number>();
      puzzleData.puzzles.forEach(puzzle => {
        themeCount.set(puzzle.theme, (themeCount.get(puzzle.theme) || 0) + 1);
      });
      
      const expectedThemes = [
        'fork', 'pin', 'skewer', 'mate', 'mateIn1', 
        'mateIn2', 'sacrifice', 'deflection', 'decoy', 'discoveredAttack'
      ];
      
      expectedThemes.forEach(theme => {
        const count = themeCount.get(theme) || 0;
        expect(count, `Theme ${theme} should have 80-120 puzzles`).toBeGreaterThan(80);
        expect(count, `Theme ${theme} should have 80-120 puzzles`).toBeLessThan(120);
      });
    });
  });

  describe('Solution Quality', () => {
    it('should have diverse solutions', () => {
      const solutionPatterns = new Set(puzzleData.puzzles.map(p => p.solution.join(',')));
      const diversityRatio = solutionPatterns.size / puzzleData.puzzles.length;
      
      expect(diversityRatio, 'Solutions too repetitive').toBeGreaterThan(0.5);
    });

    it('should have valid chess notation in solutions', () => {
      const moveRegex = /^[RNBQK]?[a-h]?[1-8]?x?[a-h][1-8][+#]?$|^O-O(-O)?[+#]?$/;
      
      puzzleData.puzzles.forEach((puzzle, index) => {
        puzzle.solution.forEach((move, moveIndex) => {
          expect(move, `Invalid move notation at puzzle ${index}, move ${moveIndex}`).toMatch(moveRegex);
        });
      });
    });

    it('should have appropriate solution lengths', () => {
      puzzleData.puzzles.forEach((puzzle, index) => {
        const solutionLength = puzzle.solution.length;
        
        if (puzzle.theme === 'mateIn1') {
          expect(solutionLength, `MateIn1 puzzle ${index} should have 1 move`).toBe(1);
        } else if (puzzle.theme === 'mateIn2') {
          expect(solutionLength, `MateIn2 puzzle ${index} should have 2-3 moves`).toBeGreaterThanOrEqual(2);
          expect(solutionLength, `MateIn2 puzzle ${index} should have 2-3 moves`).toBeLessThanOrEqual(3);
        } else {
          expect(solutionLength, `Puzzle ${index} solution too long`).toBeLessThan(10);
        }
      });
    });
  });

  describe('Rating Distribution', () => {
    it('should have a reasonable rating distribution', () => {
      const ratings = puzzleData.puzzles.map(p => p.rating);
      const minRating = Math.min(...ratings);
      const maxRating = Math.max(...ratings);
      
      expect(minRating, 'Minimum rating too low').toBeGreaterThanOrEqual(800);
      expect(maxRating, 'Maximum rating too high').toBeLessThanOrEqual(2800);
      
      // Check for reasonable spread
      const ratingBuckets = new Map<number, number>();
      ratings.forEach(rating => {
        const bucket = Math.floor(rating / 200) * 200;
        ratingBuckets.set(bucket, (ratingBuckets.get(bucket) || 0) + 1);
      });
      
      expect(ratingBuckets.size, 'Rating distribution too narrow').toBeGreaterThan(3);
    });

    it('should have difficulty matching rating ranges', () => {
      puzzleData.puzzles.forEach((puzzle, index) => {
        if (puzzle.difficulty === 'beginner') {
          expect(puzzle.rating, `Beginner puzzle ${index} rating mismatch`).toBeLessThan(1400);
        } else if (puzzle.difficulty === 'intermediate') {
          expect(puzzle.rating, `Intermediate puzzle ${index} rating mismatch`).toBeGreaterThanOrEqual(1200);
          expect(puzzle.rating, `Intermediate puzzle ${index} rating mismatch`).toBeLessThan(1800);
        } else if (puzzle.difficulty === 'advanced') {
          expect(puzzle.rating, `Advanced puzzle ${index} rating mismatch`).toBeGreaterThanOrEqual(1600);
        }
      });
    });
  });

  describe('Localization', () => {
    it('should have Norwegian content in titles and descriptions', () => {
      const norwegianWords = ['taktikk', 'angrip', 'brikke', 'konge', 'dronning', 'tårn', 'løper', 'springer', 'bonde'];
      let norwegianCount = 0;
      
      puzzleData.puzzles.forEach(puzzle => {
        const text = `${puzzle.title} ${puzzle.description}`.toLowerCase();
        if (norwegianWords.some(word => text.includes(word))) {
          norwegianCount++;
        }
      });
      
      const norwegianRatio = norwegianCount / puzzleData.puzzles.length;
      expect(norwegianRatio, 'Not enough Norwegian content').toBeGreaterThan(0.8);
    });
  });
});