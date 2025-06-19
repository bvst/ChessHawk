import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

describe('Production Puzzle Database Quality Tests', () => {
  let puzzleData: any;
  
  beforeAll(() => {
    // Test our production-ready puzzle database
    const dbPath = join(__dirname, '../../data/problems.json');
    
    if (!existsSync(dbPath)) {
      console.error('❌ Production database not found at:', dbPath);
      puzzleData = { puzzles: [] };
      return;
    }
    
    puzzleData = JSON.parse(readFileSync(dbPath, 'utf8'));
    console.log(`✅ Testing production database with ${puzzleData.puzzles?.length || 0} puzzles`);
  });

  describe('Production Quality Validation', () => {
    it('should have puzzles', () => {
      expect(puzzleData.puzzles).toBeDefined();
      expect(Array.isArray(puzzleData.puzzles)).toBe(true);
      expect(puzzleData.puzzles.length).toBeGreaterThan(0);
    });

    it('should have 100% position uniqueness', () => {
      if (puzzleData.puzzles.length === 0) return;
      
      const positions = new Set(puzzleData.puzzles.map((p: any) => p.fen));
      const uniquenessRatio = positions.size / puzzleData.puzzles.length;
      
      expect(uniquenessRatio, 'All positions should be unique').toBe(1.0);
    });

    it('should have zero duplicate puzzles', () => {
      if (puzzleData.puzzles.length === 0) return;
      
      const puzzleKeys = new Set();
      let duplicates = 0;
      
      puzzleData.puzzles.forEach((puzzle: any) => {
        const key = `${puzzle.fen}|${puzzle.solution.join(',')}`;
        if (puzzleKeys.has(key)) {
          duplicates++;
        }
        puzzleKeys.add(key);
      });
      
      expect(duplicates, 'No duplicate puzzles should exist').toBe(0);
    });

    it('should have valid puzzle integration', () => {
      if (puzzleData.puzzles.length === 0) return;
      
      puzzleData.puzzles.forEach((puzzle: any, index: number) => {
        expect(puzzle.id, `Puzzle ${index} should have proper ID`).toMatch(/^lichess_/);
        expect(puzzle.source, `Puzzle ${index} should have valid source`).toBe('Lichess');
        expect(puzzle.lichessUrl, `Puzzle ${index} should have valid URL`).toMatch(/lichess\.org\/training\//);
      });
    });

    it('should have Norwegian localization', () => {
      if (puzzleData.puzzles.length === 0) return;
      
      let norwegianCount = 0;
      
      puzzleData.puzzles.forEach((puzzle: any) => {
        // Check for Norwegian content
        const hasNorwegianTitle = /Gaffel|Binding|Matt|Kort kombinasjon|Lang kombinasjon|Offer|Spett|Avledning|Lokking|Oppdekking|Sluttspill/.test(puzzle.title);
        const hasNorwegianDesc = /Løs|Angrip|Oppnå|Bind|Tving|Offer|Led|Lokk|Avdekk|Sett matt|Mester/.test(puzzle.description);
        const hasNorwegianHint = /Se etter|Dette løses|Analyser|Finn|Planlegg|Vurder|Hvilken|Ett trekk|Fokuser/.test(puzzle.hint);
        
        if (hasNorwegianTitle || hasNorwegianDesc || hasNorwegianHint) {
          norwegianCount++;
        }
      });
      
      const norwegianRatio = norwegianCount / puzzleData.puzzles.length;
      expect(norwegianRatio, 'Should have high Norwegian content').toBeGreaterThanOrEqual(0.8);
    });

    it('should have valid solutions', () => {
      if (puzzleData.puzzles.length === 0) return;
      
      puzzleData.puzzles.forEach((puzzle: any, index: number) => {
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
      if (puzzleData.puzzles.length === 0) return;
      
      puzzleData.puzzles.forEach((puzzle: any, index: number) => {
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
      expect(puzzleData.version, 'Should have version').toBeDefined();
      expect(puzzleData.source, 'Should have source').toBeDefined();
      expect(puzzleData.generated, 'Should have generation timestamp').toBeDefined();
      expect(puzzleData.totalPuzzles, 'Should match puzzle count').toBe(puzzleData.puzzles.length);
    });

    it('should have import statistics', () => {
      expect(puzzleData.stats, 'Should have import stats').toBeDefined();
      expect(puzzleData.stats.attempted, 'Should track attempted imports').toBeTypeOf('number');
      expect(puzzleData.stats.successful, 'Should track successful imports').toBeTypeOf('number');
      expect(puzzleData.stats.failed, 'Should track failed imports').toBeTypeOf('number');
      
      // Success rate should be good
      if (puzzleData.stats.attempted > 0) {
        const successRate = puzzleData.stats.successful / puzzleData.stats.attempted;
        expect(successRate, 'Should have good success rate').toBeGreaterThan(0.5);
      }
    });
  });

  describe('Production Readiness', () => {
    it('should meet minimum quality standards for production', () => {
      if (puzzleData.puzzles.length === 0) {
        console.warn('⚠️ No puzzles to test - database may not be generated yet');
        return;
      }
      
      // All quality checks in one test for production readiness
      const positions = new Set(puzzleData.puzzles.map((p: any) => p.fen));
      const uniquenessRatio = positions.size / puzzleData.puzzles.length;
      
      expect(uniquenessRatio, 'Production requires 100% position uniqueness').toBe(1.0);
      
      // Check all puzzles have required fields
      puzzleData.puzzles.forEach((puzzle: any, index: number) => {
        const requiredFields = ['id', 'theme', 'title', 'description', 'fen', 'solution', 'difficulty', 'rating', 'source', 'lichessUrl'];
        requiredFields.forEach(field => {
          expect(puzzle[field], `Puzzle ${index} missing required field: ${field}`).toBeDefined();
        });
      });
      
      console.log(`✅ Production Quality Check: ${puzzleData.puzzles.length} puzzles ready for deployment`);
    });
  });
});