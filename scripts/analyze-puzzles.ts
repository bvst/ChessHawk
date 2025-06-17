/**
 * Puzzle Quality Analysis Script - TypeScript Version
 * Analyzes the current puzzle database and reports issues
 */

import { readFileSync } from 'fs';
import { join } from 'path';

interface Puzzle {
  id: string;
  theme: string;
  title: string;
  description: string;
  fen: string;
  solution: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  rating: number;
  points: number;
  hint: string;
  tags: string[];
  source: string;
  createdAt: string;
}

interface PuzzleDatabase {
  version: string;
  generated: string;
  totalPuzzles: number;
  themes: string[];
  source: string;
  puzzles: Puzzle[];
}

interface AnalysisResult {
  overview: DatabaseOverview;
  themes: Record<string, number>;
  difficulties: DifficultyStats;
  duplicates: DuplicateAnalysis;
  titles: ContentAnalysis;
  descriptions: ContentAnalysis;
  localization: LocalizationStats;
  samples: Puzzle[];
  issues: Issue[];
}

interface DatabaseOverview {
  totalPuzzles: number;
  version: string;
  generated: string;
  source: string;
}

interface DifficultyStats {
  [difficulty: string]: {
    count: number;
    avgRating: number;
    minRating: number;
    maxRating: number;
  };
}

interface DuplicateAnalysis {
  uniquePositions: number;
  duplicatePositions: number;
  topDuplicates: Array<{
    fen: string;
    count: number;
  }>;
}

interface ContentAnalysis {
  uniqueCount: number;
  repetitiveItems: Array<{
    content: string;
    count: number;
  }>;
}

interface LocalizationStats {
  norwegianContent: number;
  percentage: number;
}

interface Issue {
  severity: 'high' | 'medium' | 'low';
  description: string;
  metric?: string;
  value?: number;
  expected?: number;
}

class PuzzleAnalyzer {
  private puzzles: Puzzle[];
  private database: PuzzleDatabase;

  constructor(dataPath: string) {
    try {
      const content = readFileSync(dataPath, 'utf-8');
      this.database = JSON.parse(content);
      this.puzzles = this.database.puzzles;
    } catch (error) {
      throw new Error(`Failed to load puzzle database: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Perform comprehensive analysis of the puzzle database
   */
  analyze(): AnalysisResult {
    console.log('🔍 Chess Hawk Puzzle Quality Analysis');
    console.log('=====================================\n');

    const overview = this.analyzeOverview();
    const themes = this.analyzeThemes();
    const difficulties = this.analyzeDifficulties();
    const duplicates = this.analyzeDuplicates();
    const titles = this.analyzeTitles();
    const descriptions = this.analyzeDescriptions();
    const localization = this.analyzeLocalization();
    const samples = this.getSamplePuzzles();
    const issues = this.identifyIssues({
      overview,
      themes,
      difficulties,
      duplicates,
      titles,
      descriptions,
      localization,
      samples
    });

    return {
      overview,
      themes,
      difficulties,
      duplicates,
      titles,
      descriptions,
      localization,
      samples,
      issues
    };
  }

  private analyzeOverview(): DatabaseOverview {
    const overview = {
      totalPuzzles: this.puzzles.length,
      version: this.database.version,
      generated: this.database.generated,
      source: this.database.source
    };

    console.log('📊 Database Overview:');
    console.log(`   Total puzzles: ${overview.totalPuzzles}`);
    console.log(`   Database version: ${overview.version}`);
    console.log(`   Generated: ${overview.generated}`);
    console.log(`   Source: ${overview.source}\n`);

    return overview;
  }

  private analyzeThemes(): Record<string, number> {
    const themes = this.puzzles.reduce((acc, puzzle) => {
      acc[puzzle.theme] = (acc[puzzle.theme] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    console.log('🎯 Theme Distribution:');
    Object.entries(themes).forEach(([theme, count]) => {
      console.log(`   ${theme}: ${count} puzzles`);
    });
    console.log();

    return themes;
  }

  private analyzeDifficulties(): DifficultyStats {
    const difficulties: DifficultyStats = {};

    ['beginner', 'intermediate', 'advanced'].forEach(difficulty => {
      const puzzlesOfDifficulty = this.puzzles.filter(p => p.difficulty === difficulty);
      if (puzzlesOfDifficulty.length > 0) {
        const ratings = puzzlesOfDifficulty.map(p => p.rating);
        const avgRating = ratings.reduce((sum, r) => sum + r, 0) / ratings.length;
        
        difficulties[difficulty] = {
          count: puzzlesOfDifficulty.length,
          avgRating: Math.round(avgRating),
          minRating: Math.min(...ratings),
          maxRating: Math.max(...ratings)
        };
      }
    });

    console.log('⭐ Difficulty Distribution:');
    Object.entries(difficulties).forEach(([difficulty, stats]) => {
      console.log(`   ${difficulty}: ${stats.count} puzzles (avg: ${stats.avgRating}, range: ${stats.minRating}-${stats.maxRating})`);
    });
    console.log();

    return difficulties;
  }

  private analyzeDuplicates(): DuplicateAnalysis {
    const fenCounts = this.puzzles.reduce((acc, puzzle) => {
      acc[puzzle.fen] = (acc[puzzle.fen] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const duplicateEntries = Object.entries(fenCounts)
      .filter(([_, count]) => count > 1)
      .sort(([,a], [,b]) => b - a);

    const topDuplicates = duplicateEntries.slice(0, 5).map(([fen, count]) => ({
      fen: fen.substring(0, 50) + '...',
      count
    }));

    const duplicates: DuplicateAnalysis = {
      uniquePositions: Object.keys(fenCounts).length,
      duplicatePositions: duplicateEntries.length,
      topDuplicates
    };

    console.log('🔄 Duplicate Analysis:');
    console.log(`   Unique positions: ${duplicates.uniquePositions}`);
    console.log(`   Duplicate positions: ${duplicates.duplicatePositions}`);

    if (topDuplicates.length > 0) {
      console.log('   Top duplicates:');
      topDuplicates.forEach(({ fen, count }) => {
        console.log(`     - Used ${count} times: ${fen}`);
      });
    }
    console.log();

    return duplicates;
  }

  private analyzeTitles(): ContentAnalysis {
    const titleCounts = this.puzzles.reduce((acc, puzzle) => {
      const baseTitle = puzzle.title.replace(/\s+\d+$/, ''); // Remove numbers
      acc[baseTitle] = (acc[baseTitle] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const repetitiveItems = Object.entries(titleCounts)
      .filter(([_, count]) => count > 50)
      .sort(([,a], [,b]) => b - a)
      .map(([content, count]) => ({ content, count }));

    const titles: ContentAnalysis = {
      uniqueCount: Object.keys(titleCounts).length,
      repetitiveItems
    };

    console.log('📝 Title Analysis:');
    console.log(`   Unique title patterns: ${titles.uniqueCount}`);
    console.log(`   Repetitive titles (>50 uses):`);
    repetitiveItems.forEach(({ content, count }) => {
      console.log(`     - "${content}": ${count} times`);
    });
    console.log();

    return titles;
  }

  private analyzeDescriptions(): ContentAnalysis {
    const descriptionCounts = this.puzzles.reduce((acc, puzzle) => {
      acc[puzzle.description] = (acc[puzzle.description] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const repetitiveItems = Object.entries(descriptionCounts)
      .filter(([_, count]) => count > 50)
      .sort(([,a], [,b]) => b - a)
      .map(([content, count]) => ({ content, count }));

    const descriptions: ContentAnalysis = {
      uniqueCount: Object.keys(descriptionCounts).length,
      repetitiveItems
    };

    console.log('📖 Description Analysis:');
    console.log(`   Unique descriptions: ${descriptions.uniqueCount}`);
    console.log(`   Repetitive descriptions (>50 uses):`);
    repetitiveItems.forEach(({ content, count }) => {
      console.log(`     - "${content}": ${count} times`);
    });
    console.log();

    return descriptions;
  }

  private analyzeLocalization(): LocalizationStats {
    const norwegianKeywords = ['angrip', 'samtidig', 'gaffel', 'spiss', 'mat', 'offer', 'trekk', 'hvit', 'sort'];
    let norwegianContent = 0;

    this.puzzles.forEach(puzzle => {
      const content = `${puzzle.title} ${puzzle.description} ${puzzle.hint}`.toLowerCase();
      if (norwegianKeywords.some(keyword => content.includes(keyword))) {
        norwegianContent++;
      }
    });

    const localization: LocalizationStats = {
      norwegianContent,
      percentage: Math.round((norwegianContent / this.puzzles.length) * 100 * 10) / 10
    };

    console.log('🇳🇴 Norwegian Content Analysis:');
    console.log(`   Norwegian content: ${norwegianContent}/${this.puzzles.length} puzzles (${localization.percentage}%)`);
    console.log();

    return localization;
  }

  private getSamplePuzzles(): Puzzle[] {
    const indices = [0, 50, 100, 500, this.puzzles.length - 1];
    const samples = indices.map(i => this.puzzles[i]).filter(Boolean);

    console.log('🔍 Sample Puzzles for Manual Review:');
    samples.forEach((puzzle, index) => {
      console.log(`\n   Sample ${index + 1} (${puzzle.id}):`);
      console.log(`     Title: ${puzzle.title}`);
      console.log(`     Description: ${puzzle.description}`);
      console.log(`     FEN: ${puzzle.fen}`);
      console.log(`     Solution: ${puzzle.solution.join(', ')}`);
      console.log(`     Theme: ${puzzle.theme}, Difficulty: ${puzzle.difficulty}, Rating: ${puzzle.rating}`);
    });

    return samples;
  }

  private identifyIssues(analysis: Omit<AnalysisResult, 'issues'>): Issue[] {
    const issues: Issue[] = [];

    // Check for high duplication
    const uniquePercentage = (analysis.duplicates.uniquePositions / this.puzzles.length) * 100;
    if (uniquePercentage < 70) {
      issues.push({
        severity: 'high',
        description: `Too many duplicate positions (only ${uniquePercentage.toFixed(1)}% unique)`,
        metric: 'uniqueness',
        value: uniquePercentage,
        expected: 70
      });
    }

    // Check for repetitive titles
    if (analysis.titles.repetitiveItems.length > 5) {
      issues.push({
        severity: 'high',
        description: `Very repetitive titles (${analysis.titles.repetitiveItems.length} patterns with >50 uses)`,
        metric: 'title_variety',
        value: analysis.titles.repetitiveItems.length,
        expected: 5
      });
    }

    // Check for repetitive descriptions
    if (analysis.descriptions.repetitiveItems.length > 5) {
      issues.push({
        severity: 'high',
        description: `Very repetitive descriptions (${analysis.descriptions.repetitiveItems.length} patterns with >50 uses)`,
        metric: 'description_variety',
        value: analysis.descriptions.repetitiveItems.length,
        expected: 5
      });
    }

    // Check Norwegian localization
    if (analysis.localization.percentage < 80) {
      issues.push({
        severity: 'medium',
        description: `Low Norwegian localization (${analysis.localization.percentage}% vs expected 80%+)`,
        metric: 'norwegian_content',
        value: analysis.localization.percentage,
        expected: 80
      });
    }

    // Check for too many duplicates
    if (analysis.duplicates.duplicatePositions > 100) {
      issues.push({
        severity: 'high',
        description: `High number of duplicate positions (${analysis.duplicates.duplicatePositions})`,
        metric: 'duplicates',
        value: analysis.duplicates.duplicatePositions,
        expected: 100
      });
    }

    console.log('\n\n🚨 Issues Identified:');
    console.log('=====================');

    if (issues.length === 0) {
      console.log('✅ No major issues detected!');
    } else {
      issues.forEach(issue => {
        const emoji = issue.severity === 'high' ? '❌' : issue.severity === 'medium' ? '⚠️' : 'ℹ️';
        console.log(`${emoji} ${issue.description}`);
      });
      console.log(`\n💡 Recommendation: Import fresh, high-quality puzzles from Lichess to replace generated content.`);
    }

    console.log(`\n📋 Analysis complete. Found ${issues.length} major issues.`);

    return issues;
  }

  /**
   * Export analysis results to JSON
   */
  exportResults(results: AnalysisResult, outputPath?: string): string {
    const path = outputPath || join(__dirname, '..', 'src', 'data', 'puzzle-analysis.json');
    
    try {
      readFileSync(path); // Check if file exists
      const backup = path.replace('.json', '-backup.json');
      // In a real implementation, you'd copy the file to backup
      console.log(`📦 Backup would be created: ${backup}`);
    } catch {
      // File doesn't exist, no backup needed
    }

    // In a real implementation, you'd write the file
    console.log(`📊 Analysis results would be saved to: ${path}`);
    
    return path;
  }
}

// Main execution
async function main(): Promise<void> {
  try {
    const dataPath = join(__dirname, '..', 'src', 'data', 'problems.json');
    const analyzer = new PuzzleAnalyzer(dataPath);
    
    const results = analyzer.analyze();
    
    // Optional: Export results
    if (process.argv.includes('--export')) {
      analyzer.exportResults(results);
    }
    
  } catch (error) {
    console.error(`💥 Analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { PuzzleAnalyzer, type AnalysisResult, type Issue };