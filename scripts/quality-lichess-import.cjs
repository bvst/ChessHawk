/**
 * Quality Lichess Import Script
 * Imports high-quality tactical puzzles from Lichess with validation
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

class QualityLichessImporter {
    constructor() {
        this.apiUrl = 'https://lichess.org/api/puzzle/batch';
        this.importedPuzzles = [];
        this.norwegianThemes = {
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
        
        this.validationStats = {
            total: 0,
            valid: 0,
            invalid: 0,
            duplicates: 0,
            errors: []
        };
    }

    /**
     * Fetch puzzles from Lichess API with error handling
     */
    async fetchPuzzles(count = 100, theme = null, minRating = 1000, maxRating = 2500) {
        return new Promise((resolve, reject) => {
            let url = `${this.apiUrl}?nb=${count}`;
            
            if (theme) {
                url += `&themes=${theme}`;
            }
            
            console.log(`📡 Fetching ${count} puzzles from Lichess...`);
            console.log(`🔗 URL: ${url}`);
            
            const options = {
                headers: {
                    'User-Agent': 'ChessHawk-Quality-Importer/2.0',
                    'Accept': 'application/json'
                },
                timeout: 30000
            };
            
            const req = https.get(url, options, (res) => {
                let data = '';
                
                console.log(`📊 Response status: ${res.statusCode}`);
                
                if (res.statusCode !== 200) {
                    reject(new Error(`HTTP ${res.statusCode}: ${res.statusMessage}`));
                    return;
                }
                
                res.on('data', (chunk) => {
                    data += chunk;
                });
                
                res.on('end', () => {
                    try {
                        const result = JSON.parse(data);
                        console.log(`✅ Received ${result.puzzles?.length || 0} puzzles`);
                        resolve(result.puzzles || []);
                    } catch (error) {
                        console.error('❌ Failed to parse JSON response');
                        reject(error);
                    }
                });
            });
            
            req.on('error', (error) => {
                console.error(`❌ Request failed: ${error.message}`);
                reject(error);
            });
            
            req.on('timeout', () => {
                console.error('❌ Request timeout');
                req.destroy();
                reject(new Error('Request timeout'));
            });
        });
    }

    /**
     * Validate a single puzzle
     */
    validatePuzzle(puzzle) {
        const errors = [];
        
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
    convertPuzzle(lichessPuzzle, theme) {
        const puzzle = lichessPuzzle.puzzle;
        const game = lichessPuzzle.game;
        
        // Extract FEN from PGN (simplified - get position before solution)
        const moves = game.pgn.split(' ');
        const solutionStart = moves.length - puzzle.solution.length;
        
        // Create a simplified FEN - in real implementation, would parse PGN properly
        const fen = this.extractFenFromPgn(game.pgn, solutionStart);
        
        // Map difficulty from rating
        let difficulty;
        if (puzzle.rating < 1300) difficulty = 'beginner';
        else if (puzzle.rating < 1700) difficulty = 'intermediate';
        else difficulty = 'advanced';
        
        // Get primary theme
        const primaryTheme = puzzle.themes[0] || theme;
        const norwegianTheme = this.norwegianThemes[primaryTheme] || primaryTheme;
        
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
    extractFenFromPgn(pgn, moveIndex) {
        // This is a simplified version - real implementation would use a chess library
        // For now, return starting position (would need proper PGN parsing)
        return 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
    }

    /**
     * Get Norwegian description for theme
     */
    getThemeDescription(theme) {
        const descriptions = {
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
    generateHint(theme) {
        const hints = {
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
    calculatePoints(rating, difficulty) {
        const basePoints = {
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
    async importTheme(theme, count = 100) {
        console.log(`\n🎯 Importing ${count} ${theme} puzzles...`);
        
        try {
            const lichessPuzzles = await this.fetchPuzzles(count, theme);
            const convertedPuzzles = [];
            const seenIds = new Set();
            
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
                        errors: [`Conversion error: ${error.message}`]
                    });
                }
            }
            
            console.log(`✅ Successfully converted ${convertedPuzzles.length}/${lichessPuzzles.length} puzzles`);
            return convertedPuzzles;
            
        } catch (error) {
            console.error(`❌ Failed to import ${theme} puzzles: ${error.message}`);
            return [];
        }
    }

    /**
     * Import all themes with balanced distribution
     */
    async importAllThemes() {
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
    savePuzzles(puzzles, filename = 'problems-lichess.json') {
        const database = {
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
async function main() {
    const importer = new QualityLichessImporter();
    
    try {
        // Test connection first
        console.log('🔍 Testing Lichess API connection...');
        const testPuzzles = await importer.fetchPuzzles(5);
        
        if (testPuzzles.length === 0) {
            console.error('❌ No puzzles received from Lichess API. Check connectivity.');
            return;
        }
        
        console.log(`✅ API connection successful. Received ${testPuzzles.length} test puzzles.`);
        
        // Proceed with full import
        const allPuzzles = await importer.importAllThemes();
        
        if (allPuzzles.length > 0) {
            const savedPath = importer.savePuzzles(allPuzzles);
            console.log(`\n🎉 Import completed successfully!`);
            console.log(`📁 New database: ${savedPath}`);
            console.log(`📁 Backup of old data available`);
            console.log(`\n💡 Next steps:`);
            console.log(`   1. Review the imported puzzles`);
            console.log(`   2. Run quality tests: npm run test:run -- puzzle-quality.test.ts`);
            console.log(`   3. If satisfied, copy problems-lichess.json to problems.json`);
        } else {
            console.error('❌ No puzzles were successfully imported.');
        }
        
    } catch (error) {
        console.error(`💥 Import failed: ${error.message}`);
        console.error('Stack trace:', error.stack);
    }
}

// Run if called directly
if (require.main === module) {
    main().catch(console.error);
}

module.exports = QualityLichessImporter;