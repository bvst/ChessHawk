/**
 * Quality Lichess Import Script - TypeScript Version
 * Imports high-quality tactical puzzles from Lichess with validation
 */

import https from 'https';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface LichessPuzzle {
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

interface ChessHawkPuzzle {
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
  lichessUrl: string;
  createdAt: string;
}

interface PuzzleDatabase {
  version: string;
  generated: string;
  totalPuzzles: number;
  themes: string[];
  source: string;
  importStats: ValidationStats;
  puzzles: ChessHawkPuzzle[];
}

interface ValidationStats {
  total: number;
  valid: number;
  invalid: number;
  duplicates: number;
  errors: Array<{
    id: string;
    errors: string[];
  }>;
}

type ThemeKey = 'fork' | 'pin' | 'skewer' | 'mateIn1' | 'mateIn2' | 'mate' | 'sacrifice' | 'deflection' | 'decoy' | 'discoveredAttack';

class QualityLichessImporter {
  private readonly dbUrl = 'https://database.lichess.org/lichess_db_puzzle.csv.zst';
  private importedPuzzles: ChessHawkPuzzle[] = [];
  
  private readonly norwegianThemes: Record<ThemeKey, string> = {
    'fork': 'Gaffel',
    'pin': 'Binding',
    'skewer': 'Spett',
    'mateIn1': 'Matt i ett',
    'mateIn2': 'Matt i to',
    'mate': 'Sjakkmatt',
    'sacrifice': 'Offer',
    'deflection': 'Avledning',
    'decoy': 'Lokking',
    'discoveredAttack': 'Oppdekking'
  };
  
  private validationStats: ValidationStats = {
    total: 0,
    valid: 0,
    invalid: 0,
    duplicates: 0,
    errors: []
  };

  /**
   * Download and process Lichess puzzle database
   */
  async downloadPuzzleDatabase(): Promise<string> {
    console.log('📥 Downloading Lichess puzzle database...');
    console.log('⚠️  This is a large file (~500MB compressed, ~2GB uncompressed)');
    console.log('🔗 Source: https://database.lichess.org/');
    
    const dbPath = path.join(process.cwd(), 'puzzle-database.csv.zst');
    
    return new Promise((resolve, reject) => {
      const file = fs.createWriteStream(dbPath);
      
      const req = https.get(this.dbUrl, (res) => {
        console.log(`📊 Response status: ${res.statusCode}`);
        
        if (res.statusCode !== 200) {
          reject(new Error(`Failed to download: ${res.statusCode} ${res.statusMessage}`));
          return;
        }
        
        const totalSize = parseInt(res.headers['content-length'] || '0', 10);
        let downloadedSize = 0;
        
        res.on('data', (chunk) => {
          downloadedSize += chunk.length;
          if (totalSize > 0) {
            const percent = ((downloadedSize / totalSize) * 100).toFixed(1);
            process.stdout.write(`\r💾 Downloaded: ${percent}%`);
          }
        });
        
        res.pipe(file);
        
        file.on('finish', () => {
          console.log('\n✅ Database downloaded successfully');
          console.log(`📁 Location: ${dbPath}`);
          console.log('🔧 To decompress: zstd -d puzzle-database.csv.zst');
          resolve(dbPath);
        });
      });
      
      req.on('error', (error) => {
        console.error(`❌ Download failed: ${error.message}`);
        reject(error);
      });
    });
  }

  /**
   * Parse puzzles from CSV data
   */
  parsePuzzlesFromCSV(csvData: string, theme?: string, limit: number = 100): LichessPuzzle[] {
    console.log(`📊 Parsing puzzles from CSV data...`);
    
    const lines = csvData.split('\n');
    const puzzles: LichessPuzzle[] = [];
    let processed = 0;
    
    // Skip header line
    for (let i = 1; i < lines.length && puzzles.length < limit; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      processed++;
      if (processed % 10000 === 0) {
        console.log(`📊 Processed ${processed} lines, found ${puzzles.length} matching puzzles...`);
      }
      
      try {
        // CSV format: PuzzleId,FEN,Moves,Rating,RatingDeviation,Popularity,NbPlays,Themes,GameUrl,OpeningTags
        const columns = this.parseCSVLine(line);
        if (columns.length < 8) continue;
        
        const [puzzleId, fen, moves, rating, ratingDeviation, popularity, nbPlays, themes] = columns;
        
        // Filter by theme if specified
        if (theme && !themes.toLowerCase().includes(theme.toLowerCase())) {
          continue;
        }
        
        // Convert CSV format to our expected format
        const puzzle: LichessPuzzle = {
          puzzle: {
            id: puzzleId,
            solution: moves.split(' '),
            themes: themes.split(' '),
            rating: parseInt(rating, 10)
          },
          game: {
            pgn: '', // Will be generated from FEN
            id: puzzleId
          }
        };
        
        // Add FEN to puzzle object for easier access
        (puzzle as any).fen = fen;
        
        puzzles.push(puzzle);
        
      } catch (error) {
        // Skip malformed lines silently
        continue;
      }
    }
    
    console.log(`✅ Parsed ${puzzles.length} puzzles from ${processed} lines`);
    return puzzles;
  }
  
  /**
   * Parse CSV line handling quoted fields
   */
  private parseCSVLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    
    result.push(current);
    return result;
  }

  /**
   * Fetch puzzles from downloaded database or fallback
   */
  async fetchPuzzles(
    count = 100, 
    theme: string | null = null, 
    minRating = 1000, 
    maxRating = 2500
  ): Promise<LichessPuzzle[]> {
    console.log(`📡 Fetching ${count} puzzles with theme: ${theme || 'any'}...`);
    
    // Check if decompressed CSV exists
    const csvPath = path.join(process.cwd(), 'puzzle-database.csv');
    
    if (fs.existsSync(csvPath)) {
      console.log('📂 Using local puzzle database...');
      const csvData = fs.readFileSync(csvPath, 'utf-8');
      return this.parsePuzzlesFromCSV(csvData, theme || undefined, count);
    }
    
    // Check if compressed file exists
    const zstPath = path.join(process.cwd(), 'puzzle-database.csv.zst');
    if (fs.existsSync(zstPath)) {
      console.log('🔧 Found compressed database. Please decompress first:');
      console.log('   zstd -d puzzle-database.csv.zst');
      throw new Error('Database is compressed. Please decompress with: zstd -d puzzle-database.csv.zst');
    }
    
    // No local database found - show instructions
    console.log('❌ No local puzzle database found.');
    console.log('💡 To download and use the complete Lichess puzzle database:');
    console.log('   1. Install zstd: sudo apt install zstd (Ubuntu) or brew install zstd (macOS)');
    console.log('   2. Run download: node scripts/quality-lichess-import.ts --download');
    console.log('   3. Decompress: zstd -d puzzle-database.csv.zst');
    console.log('   4. Run import again');
    
    throw new Error('No puzzle database available. Use --download to get the database first.');
  }

  /**
   * Validate a single puzzle
   */
  private validatePuzzle(puzzle: LichessPuzzle): string[] {
    const errors: string[] = [];
    
    // Check required fields
    if (!puzzle.puzzle?.id) errors.push('Missing puzzle ID');
    if (!puzzle.game?.pgn) errors.push('Missing game PGN');
    if (!puzzle.puzzle?.solution) errors.push('Missing solution');
    if (!puzzle.puzzle?.themes) errors.push('Missing themes');
    if (!puzzle.puzzle?.rating) errors.push('Missing rating');
    
    // Validate rating range
    const rating = puzzle.puzzle?.rating;
    if (rating && (rating < 500 || rating > 3000)) {
      errors.push(`Invalid rating: ${rating}`);
    }
    
    // Validate solution format
    const solution = puzzle.puzzle?.solution;
    if (solution && (!Array.isArray(solution) || solution.length === 0)) {
      errors.push('Invalid solution format');
    }
    
    // Check for valid themes
    const themes = puzzle.puzzle?.themes;
    if (themes && !Array.isArray(themes)) {
      errors.push('Invalid themes format');
    }
    
    return errors;
  }

  /**
   * Convert Lichess puzzle to Chess Hawk format
   */
  private convertPuzzle(lichessPuzzle: LichessPuzzle, theme: string): ChessHawkPuzzle {
    const puzzle = lichessPuzzle.puzzle;
    
    // Use FEN from CSV data if available, otherwise use default
    const fen = (lichessPuzzle as any).fen || 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
    
    // Map difficulty from rating
    const difficulty: ChessHawkPuzzle['difficulty'] = 
      puzzle.rating < 1300 ? 'beginner' :
      puzzle.rating < 1700 ? 'intermediate' : 'advanced';
    
    // Get primary theme
    const primaryTheme = puzzle.themes[0] || theme;
    const norwegianTheme = this.norwegianThemes[primaryTheme as ThemeKey] || primaryTheme;
    
    return {
      id: `lichess_${puzzle.id}`,
      theme: primaryTheme,
      title: `${norwegianTheme} ${puzzle.rating}`,
      description: this.getThemeDescription(primaryTheme),
      fen: fen,
      solution: puzzle.solution,
      difficulty: difficulty,
      rating: puzzle.rating,
      points: this.calculatePoints(puzzle.rating, difficulty),
      hint: this.generateHint(primaryTheme),
      tags: [primaryTheme, difficulty, ...puzzle.themes.slice(1, 3)],
      source: 'Lichess',
      lichessUrl: `https://lichess.org/training/${puzzle.id}`,
      createdAt: new Date().toISOString()
    };
  }

  /**
   * Extract FEN from PGN (simplified implementation)
   */
  private extractFenFromPgn(pgn: string, solutionLength: number): string {
    // This is a simplified version - real implementation would use a chess library
    // For now, return starting position (would need proper PGN parsing)
    return 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
  }

  /**
   * Get Norwegian description for theme
   */
  private getThemeDescription(theme: string): string {
    const descriptions: Record<string, string> = {
      'fork': 'Angrip to eller flere brikker samtidig',
      'pin': 'Bind en brikke til en verdifull brikke bak',
      'skewer': 'Tving en verdifull brikke til å flytte og vinn brikken bak',
      'mate': 'Oppnå sjakkmatt',
      'mateIn1': 'Sett matt i ett trekk',
      'mateIn2': 'Sett matt i to trekk',
      'sacrifice': 'Offer materiale for posisjonell eller taktisk fordel',
      'deflection': 'Led en brikke bort fra et viktig forsvar',
      'decoy': 'Lokk en brikke til et dårlig felt',
      'discoveredAttack': 'Avdekk et angrep ved å flytte en brikke'
    };
    return descriptions[theme] || 'Løs den taktiske oppgaven';
  }

  /**
   * Generate hint for theme
   */
  private generateHint(theme: string): string {
    const hints: Record<string, string> = {
      'fork': 'Se etter muligheter til å angripe flere brikker med ett trekk',
      'pin': 'Finn en brikke som kan bindes til kongen eller en verdifull brikke',
      'skewer': 'Angrip en verdifull brikke som må flytte og avdekker en annen',
      'mate': 'Se etter trekk som gir sjakkmatt',
      'mateIn1': 'Ett trekk til matt - hvilket?',
      'mateIn2': 'Planlegg to trekk frem til matt',
      'sacrifice': 'Vurder å ofre materiale for større fordel',
      'deflection': 'Hvilken brikke holder forsvaret sammen?',
      'decoy': 'Kan du lokke en brikke til et dårlig felt?',
      'discoveredAttack': 'Flytt en brikke for å avdekke et angrep'
    };
    return hints[theme] || 'Analyser posisjonen nøye';
  }

  /**
   * Calculate points based on rating and difficulty
   */
  private calculatePoints(rating: number, difficulty: ChessHawkPuzzle['difficulty']): number {
    const basePoints: Record<ChessHawkPuzzle['difficulty'], number> = {
      'beginner': 5,
      'intermediate': 15,
      'advanced': 35
    };
    
    const bonus = Math.floor((rating - 1000) / 100);
    return basePoints[difficulty] + Math.max(0, bonus);
  }

  /**
   * Import puzzles for a specific theme
   */
  async importTheme(theme: string, count = 100): Promise<ChessHawkPuzzle[]> {
    console.log(`\n🎯 Importing ${count} ${theme} puzzles...`);
    
    try {
      const lichessPuzzles = await this.fetchPuzzles(count, theme);
      const convertedPuzzles: ChessHawkPuzzle[] = [];
      const seenIds = new Set<string>();
      
      for (const lichessPuzzle of lichessPuzzles) {
        this.validationStats.total++;
        
        // Validate puzzle
        const errors = this.validatePuzzle(lichessPuzzle);
        if (errors.length > 0) {
          this.validationStats.invalid++;
          this.validationStats.errors.push({
            id: lichessPuzzle.puzzle?.id || 'unknown',
            errors
          });
          continue;
        }
        
        // Check for duplicates
        const puzzleId = lichessPuzzle.puzzle.id;
        if (seenIds.has(puzzleId)) {
          this.validationStats.duplicates++;
          continue;
        }
        seenIds.add(puzzleId);
        
        // Convert puzzle
        try {
          const converted = this.convertPuzzle(lichessPuzzle, theme);
          convertedPuzzles.push(converted);
          this.validationStats.valid++;
        } catch (error) {
          this.validationStats.invalid++;
          this.validationStats.errors.push({
            id: puzzleId,
            errors: [`Conversion error: ${error instanceof Error ? error.message : 'Unknown error'}`]
          });
        }
      }
      
      console.log(`✅ Successfully converted ${convertedPuzzles.length}/${lichessPuzzles.length} puzzles`);
      return convertedPuzzles;
      
    } catch (error) {
      console.error(`❌ Failed to import ${theme} puzzles: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return [];
    }
  }

  /**
   * Import all themes with balanced distribution
   */
  async importAllThemes(): Promise<ChessHawkPuzzle[]> {
    console.log('🚀 Starting comprehensive Lichess import...');
    
    const themes = Object.keys(this.norwegianThemes);
    const puzzlesPerTheme = 100;
    
    for (const theme of themes) {
      const themePuzzles = await this.importTheme(theme, puzzlesPerTheme);
      this.importedPuzzles.push(...themePuzzles);
      
      // Rate limiting - wait between requests
      if (theme !== themes[themes.length - 1]) {
        console.log('⏳ Waiting 2 seconds before next theme...');
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
    
    console.log(`\n📊 Import Summary:`);
    console.log(`   Total puzzles processed: ${this.validationStats.total}`);
    console.log(`   Valid puzzles: ${this.validationStats.valid}`);
    console.log(`   Invalid puzzles: ${this.validationStats.invalid}`);
    console.log(`   Duplicates: ${this.validationStats.duplicates}`);
    console.log(`   Successfully imported: ${this.importedPuzzles.length}`);
    
    if (this.validationStats.errors.length > 0) {
      console.log(`\n⚠️ Errors encountered:`);
      this.validationStats.errors.slice(0, 5).forEach(error => {
        console.log(`   ${error.id}: ${error.errors.join(', ')}`);
      });
      if (this.validationStats.errors.length > 5) {
        console.log(`   ... and ${this.validationStats.errors.length - 5} more errors`);
      }
    }
    
    return this.importedPuzzles;
  }

  /**
   * Save imported puzzles to database
   */
  savePuzzles(puzzles: ChessHawkPuzzle[], filename = 'problems-lichess.json'): string {
    const database: PuzzleDatabase = {
      version: '3.0',
      generated: new Date().toISOString(),
      totalPuzzles: puzzles.length,
      themes: Object.keys(this.norwegianThemes),
      source: 'Lichess API Import with Norwegian Localization',
      importStats: this.validationStats,
      puzzles: puzzles
    };
    
    const outputPath = path.join(__dirname, '..', 'src', 'data', filename);
    const backupPath = path.join(__dirname, '..', 'src', 'data', 'problems-backup.json');
    
    // Create backup of existing file
    const existingPath = path.join(__dirname, '..', 'src', 'data', 'problems.json');
    if (fs.existsSync(existingPath)) {
      fs.copyFileSync(existingPath, backupPath);
      console.log(`📦 Backup created: ${backupPath}`);
    }
    
    // Save new database
    fs.writeFileSync(outputPath, JSON.stringify(database, null, 2));
    console.log(`💾 Saved ${puzzles.length} puzzles to ${outputPath}`);
    
    return outputPath;
  }
}

// Main execution
async function main(): Promise<void> {
  const importer = new QualityLichessImporter();
  const args = process.argv.slice(2);
  
  try {
    // Handle download option
    if (args.includes('--download')) {
      console.log('🚀 Starting Lichess puzzle database download...');
      const dbPath = await importer.downloadPuzzleDatabase();
      console.log(`\n✅ Download completed: ${dbPath}`);
      console.log('📝 Next steps:');
      console.log('   1. Install zstd if not available: sudo apt install zstd (Ubuntu) or brew install zstd (macOS)');
      console.log('   2. Decompress: zstd -d puzzle-database.csv.zst');
      console.log('   3. Run import: npm run import:lichess');
      return;
    }
    
    // Test puzzle fetching
    console.log('🔍 Testing puzzle database access...');
    const testPuzzles = await importer.fetchPuzzles(5);
    
    if (testPuzzles.length === 0) {
      console.error('❌ No puzzles available.');
      return;
    }
    
    console.log(`✅ Database access successful. Found ${testPuzzles.length} test puzzles.`);
    
    // Proceed with full import
    const allPuzzles = await importer.importAllThemes();
    
    if (allPuzzles.length > 0) {
      const savedPath = importer.savePuzzles(allPuzzles);
      console.log(`\n🎉 Import completed successfully!`);
      console.log(`📁 New database: ${savedPath}`);
      console.log(`📁 Backup of old data available`);
      console.log(`\n💡 Next steps:`);
      console.log(`   1. Review the imported puzzles`);
      console.log(`   2. Run quality tests: npm run test:run`);
      console.log(`   3. If satisfied, copy problems-lichess.json to problems.json`);
    } else {
      console.error('❌ No puzzles were successfully imported.');
    }
    
  } catch (error) {
    console.error(`💥 Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    if (error instanceof Error) {
      console.error('Stack trace:', error.stack);
    }
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { QualityLichessImporter, type ChessHawkPuzzle, type PuzzleDatabase };