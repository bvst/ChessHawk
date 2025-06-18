import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

describe('Lichess Import Quality Tests', () => {
  let lichessData: any;
  
  beforeAll(() => {
    // Test our new high-quality Lichess import
    const lichessPath = join(__dirname, '../../data/problems-test-improved.json');
    
    if (!existsSync(lichessPath)) {
      console.warn('⚠️ Lichess import not found - run: node scripts/robust-lichess-import.mjs');
      lichessData = { puzzles: [] };
      return;
    }
    
    lichessData = JSON.parse(readFileSync(lichessPath, 'utf8'));
  });

  describe('Import Quality Validation', () => {
    it('should have imported puzzles', () => {
      expect(lichessData.puzzles).toBeDefined();
      expect(Array.isArray(lichessData.puzzles)).toBe(true);
      expect(lichessData.puzzles.length).toBeGreaterThan(0);
    });

    it('should have 100% position uniqueness', () => {
      if (lichessData.puzzles.length === 0) return;
      
      const positions = new Set(lichessData.puzzles.map((p: any) => p.fen));
      const uniquenessRatio = positions.size / lichessData.puzzles.length;
      
      expect(uniquenessRatio, 'All positions should be unique').toBe(1.0);
    });

    it('should have zero duplicate puzzles', () => {
      if (lichessData.puzzles.length === 0) return;
      
      const puzzleKeys = new Set();
      let duplicates = 0;
      
      lichessData.puzzles.forEach((puzzle: any) => {
        const key = `${puzzle.fen}|${puzzle.solution.join(',')}`;
        if (puzzleKeys.has(key)) {
          duplicates++;
        }
        puzzleKeys.add(key);
      });
      
      expect(duplicates, 'No duplicate puzzles should exist').toBe(0);
    });

    it('should have valid Lichess integration', () => {
      if (lichessData.puzzles.length === 0) return;
      
      lichessData.puzzles.forEach((puzzle: any, index: number) => {
        expect(puzzle.id, `Puzzle ${index} should have lichess_ prefix`).toMatch(/^lichess_/);
        expect(puzzle.source, `Puzzle ${index} should be from Lichess`).toBe('Lichess');
        expect(puzzle.lichessUrl, `Puzzle ${index} should have valid Lichess URL`).toMatch(/lichess\.org\/training\//);
      });
    });

    it('should have Norwegian localization', () => {
      if (lichessData.puzzles.length === 0) return;
      
      let norwegianCount = 0;
      
      lichessData.puzzles.forEach((puzzle: any) => {
        // Check for Norwegian content
        const hasNorwegianTitle = /Gaffel|Binding|Matt|Kort kombinasjon|Lang kombinasjon|Offer/.test(puzzle.title);
        const hasNorwegianDesc = /Løs|Angrip|Oppnå|Bind|Tving|Offer/.test(puzzle.description);
        const hasNorwegianHint = /Se etter|Dette løses|Analyser|Finn|Planlegg/.test(puzzle.hint);
        
        if (hasNorwegianTitle || hasNorwegianDesc || hasNorwegianHint) {
          norwegianCount++;
        }
      });
      
      const norwegianRatio = norwegianCount / lichessData.puzzles.length;
      expect(norwegianRatio, 'Should have high Norwegian content').toBeGreaterThanOrEqual(0.8);
    });

    it('should have valid solutions', () => {
      if (lichessData.puzzles.length === 0) return;
      
      lichessData.puzzles.forEach((puzzle: any, index: number) => {
        expect(puzzle.solution, `Puzzle ${index} should have solution array`).toBeDefined();
        expect(Array.isArray(puzzle.solution), `Puzzle ${index} solution should be array`).toBe(true);
        expect(puzzle.solution.length, `Puzzle ${index} should have non-empty solution`).toBeGreaterThan(0);
        
        // Check move format
        puzzle.solution.forEach((move: any, moveIndex: number) => {
          expect(typeof move, `Puzzle ${index} move ${moveIndex} should be string`).toBe('string');
          expect(move.length, `Puzzle ${index} move ${moveIndex} should have valid format`).toBeGreaterThanOrEqual(2);
        });
      });
    });

    it('should have valid ratings and difficulty mapping', () => {
      if (lichessData.puzzles.length === 0) return;
      
      lichessData.puzzles.forEach((puzzle: any, index: number) => {
        expect(puzzle.rating, `Puzzle ${index} should have numeric rating`).toBeTypeOf('number');
        expect(puzzle.rating, `Puzzle ${index} rating should be in valid range`).toBeGreaterThanOrEqual(500);
        expect(puzzle.rating, `Puzzle ${index} rating should be in valid range`).toBeLessThanOrEqual(3000);
        
        // Check difficulty mapping consistency
        const expectedDifficulty = 
          puzzle.rating < 1300 ? 'beginner' :
          puzzle.rating < 1700 ? 'intermediate' : 'advanced';
        
        expect(puzzle.difficulty, `Puzzle ${index} difficulty should match rating`).toBe(expectedDifficulty);
      });
    });
  });

  describe('Database Metadata', () => {
    it('should have proper version and source information', () => {
      expect(lichessData.version, 'Should have version').toBeDefined();
      expect(lichessData.source, 'Should have source').toContain('Lichess');
      expect(lichessData.generated, 'Should have generation timestamp').toBeDefined();
      expect(lichessData.totalPuzzles, 'Should match puzzle count').toBe(lichessData.puzzles.length);
    });

    it('should have import statistics', () => {
      expect(lichessData.stats, 'Should have import stats').toBeDefined();
      expect(lichessData.stats.attempted, 'Should track attempted imports').toBeTypeOf('number');
      expect(lichessData.stats.successful, 'Should track successful imports').toBeTypeOf('number');
      expect(lichessData.stats.failed, 'Should track failed imports').toBeTypeOf('number');
      
      // Success rate should be good
      if (lichessData.stats.attempted > 0) {
        const successRate = lichessData.stats.successful / lichessData.stats.attempted;
        expect(successRate, 'Should have good success rate').toBeGreaterThan(0.5);
      }
    });
  });

  describe('Production Readiness', () => {
    it('should meet minimum quality standards for production', () => {
      if (lichessData.puzzles.length === 0) {
        console.warn('⚠️ No puzzles to test - this is expected if import not run yet');
        return;
      }
      
      // All quality checks in one test for production readiness
      const positions = new Set(lichessData.puzzles.map((p: any) => p.fen));
      const uniquenessRatio = positions.size / lichessData.puzzles.length;
      
      expect(uniquenessRatio, 'Production requires 100% position uniqueness').toBe(1.0);
      
      // Check all puzzles have required fields
      lichessData.puzzles.forEach((puzzle: any, index: number) => {
        const requiredFields = ['id', 'theme', 'title', 'description', 'fen', 'solution', 'difficulty', 'rating', 'source', 'lichessUrl'];
        requiredFields.forEach(field => {
          expect(puzzle[field], `Puzzle ${index} missing required field: ${field}`).toBeDefined();
        });
      });
      
      console.log(`✅ Production Quality Check: ${lichessData.puzzles.length} puzzles ready for deployment`);
    });
  });
});