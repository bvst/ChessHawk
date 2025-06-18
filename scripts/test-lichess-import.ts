/**
 * Test Lichess Import Integration
 * Comprehensive testing of the new import system
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface ImportedDatabase {
  version: string;
  generated: string;
  totalPuzzles: number;
  source: string;
  importMethod: string;
  stats: {
    attempted: number;
    successful: number;
    failed: number;
    duplicates: number;
    errors: Array<{ id: string; error: string; }>;
  };
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

class LichessImportTester {
  
  async testImportedDatabase(): Promise<void> {
    console.log('🧪 Testing Lichess Import Integration');
    console.log('=====================================\n');
    
    const dbPath = path.join(__dirname, '..', 'src', 'data', 'problems-test-improved.json');
    
    if (!fs.existsSync(dbPath)) {
      console.error('❌ No imported database found at:', dbPath);
      console.log('💡 Run the import first: node scripts/robust-lichess-import.mjs');
      return;
    }
    
    const database: ImportedDatabase = JSON.parse(fs.readFileSync(dbPath, 'utf-8'));
    
    console.log('📊 Database Overview:');
    console.log(`   Version: ${database.version}`);
    console.log(`   Source: ${database.source}`);
    console.log(`   Method: ${database.importMethod}`);
    console.log(`   Generated: ${new Date(database.generated).toLocaleString()}`);
    console.log(`   Total Puzzles: ${database.totalPuzzles}\n`);
    
    console.log('📈 Import Statistics:');
    console.log(`   Attempted: ${database.stats.attempted}`);
    console.log(`   Successful: ${database.stats.successful}`);
    console.log(`   Failed: ${database.stats.failed}`);
    console.log(`   Duplicates: ${database.stats.duplicates}`);
    console.log(`   Success Rate: ${((database.stats.successful / database.stats.attempted) * 100).toFixed(1)}%\n`);
    
    if (database.stats.errors.length > 0) {
      console.log('⚠️ Import Errors:');
      database.stats.errors.forEach(error => {
        console.log(`   ${error.id}: ${error.error}`);
      });
      console.log('');
    }
    
    // Test each puzzle
    console.log('🔍 Testing Individual Puzzles:');
    let passedTests = 0;
    const totalTests = database.puzzles.length;
    
    for (let i = 0; i < database.puzzles.length; i++) {
      const puzzle = database.puzzles[i];
      const testResult = this.testPuzzle(puzzle, i + 1);
      if (testResult.passed) {
        passedTests++;
      }
      
      console.log(`   ${testResult.passed ? '✅' : '❌'} Puzzle ${i + 1}: ${puzzle.id}`);
      if (!testResult.passed) {
        testResult.errors.forEach(error => {
          console.log(`      - ${error}`);
        });
      }
    }
    
    console.log(`\n📊 Test Summary: ${passedTests}/${totalTests} puzzles passed`);
    
    // Quality analysis
    this.analyzeQuality(database);
    
    // Integration readiness
    this.assessIntegrationReadiness(database);
  }
  
  testPuzzle(puzzle: any, index: number): { passed: boolean; errors: string[] } {
    const errors: string[] = [];
    
    // Required fields
    if (!puzzle.id) errors.push('Missing ID');
    if (!puzzle.theme) errors.push('Missing theme');
    if (!puzzle.title) errors.push('Missing title');
    if (!puzzle.description) errors.push('Missing description');
    if (!puzzle.fen) errors.push('Missing FEN');
    if (!puzzle.solution || !Array.isArray(puzzle.solution) || puzzle.solution.length === 0) {
      errors.push('Missing or invalid solution');
    }
    if (!puzzle.difficulty) errors.push('Missing difficulty');
    if (!puzzle.rating || typeof puzzle.rating !== 'number') {
      errors.push('Missing or invalid rating');
    }
    if (!puzzle.points || typeof puzzle.points !== 'number') {
      errors.push('Missing or invalid points');
    }
    if (!puzzle.hint) errors.push('Missing hint');
    if (!puzzle.tags || !Array.isArray(puzzle.tags) || puzzle.tags.length === 0) {
      errors.push('Missing or invalid tags');
    }
    if (!puzzle.source) errors.push('Missing source');
    if (!puzzle.lichessUrl) errors.push('Missing Lichess URL');
    if (!puzzle.createdAt) errors.push('Missing creation date');
    
    // Value validation
    if (puzzle.rating && (puzzle.rating < 500 || puzzle.rating > 3000)) {
      errors.push(`Invalid rating range: ${puzzle.rating}`);
    }
    
    if (puzzle.difficulty && !['beginner', 'intermediate', 'advanced'].includes(puzzle.difficulty)) {
      errors.push(`Invalid difficulty: ${puzzle.difficulty}`);
    }
    
    if (puzzle.solution && puzzle.solution.some((move: string) => !move || typeof move !== 'string')) {
      errors.push('Invalid move format in solution');
    }
    
    if (puzzle.fen && !puzzle.fen.includes(' ')) {
      errors.push('Invalid FEN format');
    }
    
    // Lichess-specific validation
    if (puzzle.id && !puzzle.id.startsWith('lichess_')) {
      errors.push('ID should start with "lichess_"');
    }
    
    if (puzzle.lichessUrl && !puzzle.lichessUrl.includes('lichess.org/training/')) {
      errors.push('Invalid Lichess URL format');
    }
    
    return {
      passed: errors.length === 0,
      errors
    };
  }
  
  analyzeQuality(database: ImportedDatabase): void {
    console.log('\n🎯 Quality Analysis:');
    
    if (database.puzzles.length === 0) {
      console.log('   ❌ No puzzles to analyze');
      return;
    }
    
    // Rating distribution
    const ratings = database.puzzles.map(p => p.rating);
    const minRating = Math.min(...ratings);
    const maxRating = Math.max(...ratings);
    const avgRating = Math.round(ratings.reduce((a, b) => a + b, 0) / ratings.length);
    
    console.log(`   📊 Rating Range: ${minRating} - ${maxRating} (avg: ${avgRating})`);
    
    // Difficulty distribution
    const difficulties = database.puzzles.reduce((acc, p) => {
      acc[p.difficulty] = (acc[p.difficulty] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    console.log('   📈 Difficulty Distribution:');
    Object.entries(difficulties).forEach(([diff, count]) => {
      const percentage = ((count / database.puzzles.length) * 100).toFixed(1);
      console.log(`      ${diff}: ${count} (${percentage}%)`);
    });
    
    // Theme distribution
    const themes = database.puzzles.reduce((acc, p) => {
      acc[p.theme] = (acc[p.theme] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    console.log('   🏷️ Theme Distribution:');
    Object.entries(themes).forEach(([theme, count]) => {
      console.log(`      ${theme}: ${count}`);
    });
    
    // Uniqueness check
    const uniqueIds = new Set(database.puzzles.map(p => p.id));
    const uniquePositions = new Set(database.puzzles.map(p => p.fen));
    const uniqueSolutions = new Set(database.puzzles.map(p => p.solution.join(' ')));
    
    console.log(`   🔄 Uniqueness:`);
    console.log(`      IDs: ${uniqueIds.size}/${database.puzzles.length} (${((uniqueIds.size / database.puzzles.length) * 100).toFixed(1)}%)`);
    console.log(`      Positions: ${uniquePositions.size}/${database.puzzles.length} (${((uniquePositions.size / database.puzzles.length) * 100).toFixed(1)}%)`);
    console.log(`      Solutions: ${uniqueSolutions.size}/${database.puzzles.length} (${((uniqueSolutions.size / database.puzzles.length) * 100).toFixed(1)}%)`);
  }
  
  assessIntegrationReadiness(database: ImportedDatabase): void {
    console.log('\n🚀 Integration Readiness Assessment:');
    
    const issues: string[] = [];
    const recommendations: string[] = [];
    
    // Check puzzle count
    if (database.puzzles.length < 10) {
      issues.push(`Low puzzle count: ${database.puzzles.length} (recommended: 100+)`);
      recommendations.push('Run import with higher --count parameter');
    }
    
    // Check success rate
    const successRate = (database.stats.successful / database.stats.attempted) * 100;
    if (successRate < 50) {
      issues.push(`Low success rate: ${successRate.toFixed(1)}% (recommended: 80%+)`);
      recommendations.push('Check API connectivity and puzzle ID generation strategy');
    }
    
    // Check for Norwegian localization
    const norwegianizedPuzzles = database.puzzles.filter(p => 
      p.title.includes('Gaffel') || 
      p.title.includes('Binding') || 
      p.title.includes('Matt') ||
      p.title.includes('Kort kombinasjon') ||
      p.title.includes('Lang kombinasjon') ||
      p.description.includes('Angrip') ||
      p.description.includes('Løs') ||
      p.hint.includes('Se etter') ||
      p.hint.includes('Dette løses') ||
      p.hint.includes('Analyser')
    );
    
    if (norwegianizedPuzzles.length === 0 && database.puzzles.length > 0) {
      issues.push('No Norwegian localization detected');
      recommendations.push('Verify Norwegian theme mapping is working correctly');
    }
    
    // Check errors
    if (database.stats.errors.length > 0) {
      issues.push(`${database.stats.errors.length} import errors occurred`);
      recommendations.push('Review error log and adjust import strategy');
    }
    
    if (issues.length === 0) {
      console.log('   ✅ Ready for integration!');
      console.log('   💡 The imported database meets quality standards');
    } else {
      console.log('   ⚠️ Issues found:');
      issues.forEach(issue => console.log(`      - ${issue}`));
      console.log('\n   📋 Recommendations:');
      recommendations.forEach(rec => console.log(`      - ${rec}`));
    }
    
    console.log('\n   📁 Files ready for production:');
    console.log(`      - ${path.relative(process.cwd(), path.join(__dirname, '..', 'src', 'data', 'problems-lichess-robust.json'))}`);
    console.log('      - Copy to problems.json to replace current database');
  }
}

// Main execution
async function main(): Promise<void> {
  const tester = new LichessImportTester();
  await tester.testImportedDatabase();
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { LichessImportTester };