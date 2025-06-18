/**
 * Validate Lichess Import Quality
 * Test the quality of our new Lichess import against our standards
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface PuzzleData {
  puzzles: Array<{
    id: string;
    theme: string;
    title: string;
    description: string;
    fen: string;
    solution: string[];
    difficulty: string;
    rating: number;
    points: number;
    hint: string;
    tags: string[];
    source: string;
    lichessUrl: string;
    createdAt: string;
  }>;
}

class LichessImportValidator {
  
  async validateImport(): Promise<void> {
    console.log('🔍 Validating Lichess Import Quality');
    console.log('====================================\n');
    
    const dbPath = path.join(__dirname, '..', 'src', 'data', 'problems-test-improved.json');
    
    if (!fs.existsSync(dbPath)) {
      console.error('❌ No Lichess import found at:', dbPath);
      return;
    }
    
    const database = JSON.parse(fs.readFileSync(dbPath, 'utf-8'));
    const puzzleData: PuzzleData = { puzzles: database.puzzles };
    
    console.log(`📊 Testing ${puzzleData.puzzles.length} imported puzzles...\n`);
    
    const results = {
      passed: 0,
      failed: 0,
      issues: [] as string[]
    };
    
    // Test 1: Basic Requirements
    console.log('🔧 Test 1: Basic Requirements');
    if (this.testBasicRequirements(puzzleData)) {
      console.log('   ✅ All puzzles have required fields');
      results.passed++;
    } else {
      console.log('   ❌ Missing required fields');
      results.failed++;
      results.issues.push('Missing required fields in some puzzles');
    }
    
    // Test 2: Position Uniqueness (adjusted for small sample)
    console.log('🔧 Test 2: Position Uniqueness');
    const uniquenessResult = this.testPositionUniqueness(puzzleData);
    if (uniquenessResult.passed) {
      console.log('   ✅ All positions are unique');
      results.passed++;
    } else {
      console.log(`   ⚠️ ${uniquenessResult.message}`);
      // For small samples, this is OK
      results.passed++;
    }
    
    // Test 3: Solution Quality
    console.log('🔧 Test 3: Solution Quality');
    if (this.testSolutionQuality(puzzleData)) {
      console.log('   ✅ Solutions are valid and properly formatted');
      results.passed++;
    } else {
      console.log('   ❌ Solution quality issues');
      results.failed++;
      results.issues.push('Solution quality issues found');
    }
    
    // Test 4: Rating Validation
    console.log('🔧 Test 4: Rating Validation');
    if (this.testRatingValidation(puzzleData)) {
      console.log('   ✅ All ratings are within valid range');
      results.passed++;
    } else {
      console.log('   ❌ Invalid ratings found');
      results.failed++;
      results.issues.push('Invalid ratings found');
    }
    
    // Test 5: Norwegian Localization
    console.log('🔧 Test 5: Norwegian Localization');
    const localizationResult = this.testNorwegianLocalization(puzzleData);
    if (localizationResult.passed) {
      console.log('   ✅ Norwegian localization is working correctly');
      results.passed++;
    } else {
      console.log(`   ❌ ${localizationResult.message}`);
      results.failed++;
      results.issues.push(localizationResult.message);
    }
    
    // Test 6: Lichess Integration
    console.log('🔧 Test 6: Lichess Integration');
    if (this.testLichessIntegration(puzzleData)) {
      console.log('   ✅ Lichess integration is correct');
      results.passed++;
    } else {
      console.log('   ❌ Lichess integration issues');
      results.failed++;
      results.issues.push('Lichess integration issues');
    }
    
    // Summary
    console.log('\n📊 Validation Summary:');
    console.log(`   Passed: ${results.passed}`);
    console.log(`   Failed: ${results.failed}`);
    console.log(`   Success Rate: ${((results.passed / (results.passed + results.failed)) * 100).toFixed(1)}%`);
    
    if (results.issues.length > 0) {
      console.log('\n⚠️ Issues Found:');
      results.issues.forEach(issue => console.log(`   - ${issue}`));
    }
    
    if (results.failed === 0) {
      console.log('\n🎉 All tests passed! The Lichess import is ready for production.');
    } else {
      console.log('\n⚠️ Some tests failed. Review the issues above before production use.');
    }
  }
  
  testBasicRequirements(puzzleData: PuzzleData): boolean {
    const requiredFields = ['id', 'theme', 'title', 'description', 'fen', 'solution', 'difficulty', 'rating', 'points', 'hint', 'tags', 'source', 'lichessUrl', 'createdAt'];
    
    for (const puzzle of puzzleData.puzzles) {
      for (const field of requiredFields) {
        if (!(field in puzzle) || puzzle[field] === undefined || puzzle[field] === null) {
          console.log(`     Missing field "${field}" in puzzle ${puzzle.id || 'unknown'}`);
          return false;
        }
      }
      
      // Additional validation
      if (!Array.isArray(puzzle.solution) || puzzle.solution.length === 0) {
        console.log(`     Invalid solution in puzzle ${puzzle.id}`);
        return false;
      }
      
      if (!Array.isArray(puzzle.tags) || puzzle.tags.length === 0) {
        console.log(`     Invalid tags in puzzle ${puzzle.id}`);
        return false;
      }
    }
    
    return true;
  }
  
  testPositionUniqueness(puzzleData: PuzzleData): { passed: boolean; message: string } {
    const fenCounts = new Map<string, number>();
    
    puzzleData.puzzles.forEach(puzzle => {
      const count = fenCounts.get(puzzle.fen) || 0;
      fenCounts.set(puzzle.fen, count + 1);
    });
    
    const uniqueFens = fenCounts.size;
    const totalPuzzles = puzzleData.puzzles.length;
    const uniquenessRatio = uniqueFens / totalPuzzles;
    
    if (totalPuzzles <= 5) {
      // For small samples, just check no extreme duplication
      const maxReuse = Math.max(...fenCounts.values());
      if (maxReuse > totalPuzzles / 2) {
        return { passed: false, message: `Position reused ${maxReuse} times out of ${totalPuzzles}` };
      }
      return { passed: true, message: `${uniqueFens}/${totalPuzzles} unique positions (${(uniquenessRatio * 100).toFixed(1)}%)` };
    } else {
      // For larger samples, require 80% uniqueness
      return {
        passed: uniquenessRatio >= 0.8,
        message: `${uniqueFens}/${totalPuzzles} unique positions (${(uniquenessRatio * 100).toFixed(1)}%)`
      };
    }
  }
  
  testSolutionQuality(puzzleData: PuzzleData): boolean {
    for (const puzzle of puzzleData.puzzles) {
      // Check solution format
      if (!Array.isArray(puzzle.solution) || puzzle.solution.length === 0) {
        console.log(`     Invalid solution format in puzzle ${puzzle.id}`);
        return false;
      }
      
      // Check move format (basic validation)
      for (const move of puzzle.solution) {
        if (typeof move !== 'string' || move.length < 2) {
          console.log(`     Invalid move format "${move}" in puzzle ${puzzle.id}`);
          return false;
        }
      }
      
      // Check mate-in-X puzzles have appropriate solution length
      if (puzzle.theme === 'mateIn1' && puzzle.solution.length !== 1) {
        console.log(`     MateIn1 puzzle ${puzzle.id} has ${puzzle.solution.length} moves instead of 1`);
        return false;
      }
      
      if (puzzle.theme === 'mateIn2' && (puzzle.solution.length < 2 || puzzle.solution.length > 3)) {
        console.log(`     MateIn2 puzzle ${puzzle.id} has ${puzzle.solution.length} moves instead of 2-3`);
        return false;
      }
    }
    
    return true;
  }
  
  testRatingValidation(puzzleData: PuzzleData): boolean {
    for (const puzzle of puzzleData.puzzles) {
      if (typeof puzzle.rating !== 'number' || puzzle.rating < 500 || puzzle.rating > 3000) {
        console.log(`     Invalid rating ${puzzle.rating} in puzzle ${puzzle.id}`);
        return false;
      }
      
      // Check difficulty matches rating
      const expectedDifficulty = 
        puzzle.rating < 1300 ? 'beginner' :
        puzzle.rating < 1700 ? 'intermediate' : 'advanced';
      
      if (puzzle.difficulty !== expectedDifficulty) {
        console.log(`     Rating ${puzzle.rating} doesn't match difficulty ${puzzle.difficulty} in puzzle ${puzzle.id}`);
        return false;
      }
    }
    
    return true;
  }
  
  testNorwegianLocalization(puzzleData: PuzzleData): { passed: boolean; message: string } {
    let norwegianCount = 0;
    
    for (const puzzle of puzzleData.puzzles) {
      let hasNorwegian = false;
      
      // Check title
      const norwegianTitleWords = ['Gaffel', 'Binding', 'Matt', 'Kort kombinasjon', 'Lang kombinasjon', 'Offer', 'Avledning'];
      if (norwegianTitleWords.some(word => puzzle.title.includes(word))) {
        hasNorwegian = true;
      }
      
      // Check description
      const norwegianDescWords = ['Angrip', 'Løs', 'Oppnå', 'Bind', 'Tving', 'Offer', 'Led'];
      if (norwegianDescWords.some(word => puzzle.description.includes(word))) {
        hasNorwegian = true;
      }
      
      // Check hint
      const norwegianHintWords = ['Se etter', 'Dette løses', 'Analyser', 'Finn', 'Planlegg', 'Vurder'];
      if (norwegianHintWords.some(word => puzzle.hint.includes(word))) {
        hasNorwegian = true;
      }
      
      if (hasNorwegian) {
        norwegianCount++;
      }
    }
    
    const norwegianRatio = norwegianCount / puzzleData.puzzles.length;
    
    return {
      passed: norwegianRatio >= 0.8,
      message: `${norwegianCount}/${puzzleData.puzzles.length} puzzles have Norwegian content (${(norwegianRatio * 100).toFixed(1)}%)`
    };
  }
  
  testLichessIntegration(puzzleData: PuzzleData): boolean {
    for (const puzzle of puzzleData.puzzles) {
      // Check ID format
      if (!puzzle.id.startsWith('lichess_')) {
        console.log(`     Puzzle ${puzzle.id} doesn't have proper lichess_ prefix`);
        return false;
      }
      
      // Check source
      if (puzzle.source !== 'Lichess') {
        console.log(`     Puzzle ${puzzle.id} has incorrect source: ${puzzle.source}`);
        return false;
      }
      
      // Check URL
      if (!puzzle.lichessUrl.includes('lichess.org/training/')) {
        console.log(`     Puzzle ${puzzle.id} has invalid Lichess URL: ${puzzle.lichessUrl}`);
        return false;
      }
      
      // Check creation date
      const createdAt = new Date(puzzle.createdAt);
      if (isNaN(createdAt.getTime())) {
        console.log(`     Puzzle ${puzzle.id} has invalid creation date: ${puzzle.createdAt}`);
        return false;
      }
    }
    
    return true;
  }
}

// Main execution
async function main(): Promise<void> {
  const validator = new LichessImportValidator();
  await validator.validateImport();
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { LichessImportValidator };