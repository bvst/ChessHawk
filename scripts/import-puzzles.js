#!/usr/bin/env node

/**
 * ChessHawk Puzzle Importer - CLI Version
 * Command-line tool for importing chess puzzles from various sources
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

class PuzzleImporterCLI {
    constructor() {
        this.importedPuzzles = [];
        this.outputDir = path.join(__dirname, 'imported-puzzles');
        
        // Ensure output directory exists
        if (!fs.existsSync(this.outputDir)) {
            fs.mkdirSync(this.outputDir, { recursive: true });
        }
    }

    /**
     * Fetch data from URL using Node.js https module
     */
    async fetch(url) {
        return new Promise((resolve, reject) => {
            console.log(`📡 Fetching: ${url}`);
            
            https.get(url, (res) => {
                let data = '';
                
                res.on('data', (chunk) => {
                    data += chunk;
                });
                
                res.on('end', () => {
                    try {
                        const jsonData = JSON.parse(data);
                        resolve(jsonData);
                    } catch (error) {
                        reject(new Error(`Failed to parse JSON: ${error.message}`));
                    }
                });
                
            }).on('error', (error) => {
                reject(error);
            });
        });
    }

    /**
     * Import puzzles from Lichess API
     */
    async importFromLichess(count = 50, theme = null, minRating = 1000, maxRating = 2500) {
        console.log(`🌐 === Importing ${count} puzzles from Lichess ===`);
        console.log(`   🎯 Theme: ${theme || 'all'}`);
        console.log(`   📊 Rating range: ${minRating}-${maxRating}`);
        
        try {
            // Lichess API endpoint for puzzle batch
            let url = `https://lichess.org/api/puzzle/batch?nb=${count}`;
            
            if (theme) {
                url += `&themes=${theme}`;
            }
            
            const data = await this.fetch(url);
            
            if (data.puzzles && data.puzzles.length > 0) {
                console.log(`✅ Received ${data.puzzles.length} puzzles from Lichess`);
                
                // Filter by rating if specified
                let filteredPuzzles = data.puzzles;
                if (minRating || maxRating) {
                    filteredPuzzles = data.puzzles.filter(p => {
                        const rating = p.puzzle.rating;
                        return rating >= (minRating || 0) && rating <= (maxRating || 9999);
                    });
                    console.log(`📊 Filtered to ${filteredPuzzles.length} puzzles within rating range`);
                }
                
                const convertedPuzzles = this.convertLichessPuzzles(filteredPuzzles);
                this.importedPuzzles.push(...convertedPuzzles);
                
                return convertedPuzzles;
            } else {
                console.warn('⚠️ No puzzles received from Lichess');
                return [];
            }
            
        } catch (error) {
            console.error('❌ Error importing from Lichess:', error.message);
            throw error;
        }
    }

    /**
     * Convert Lichess puzzles to ChessHawk format
     */
    convertLichessPuzzles(lichessPuzzles) {
        console.log(`🔄 Converting ${lichessPuzzles.length} Lichess puzzles...`);
        
        return lichessPuzzles.map((puzzle, index) => {
            const p = puzzle.puzzle;
            
            // Extract who is to move from FEN
            const fenParts = p.fen.split(' ');
            const toMove = fenParts[1]; // 'w' or 'b'
            
            // Convert solution moves
            const solution = this.convertLichessSolution(p.solution);
            
            // Map themes and difficulty
            const themes = p.themes || [];
            const difficulty = this.mapRatingToDifficulty(p.rating);
            const category = this.mapThemeToCategory(themes[0] || 'general');
            
            const converted = {
                id: `lichess_${p.id}`,
                type: 'tactical',
                title: this.generateTitle(themes),
                description: this.generateDescription(themes, p.rating, toMove),
                fen: p.fen,
                toMove: toMove,
                solution: solution,
                hints: this.generateHints(themes),
                difficulty: difficulty,
                category: category,
                points: this.calculatePoints(p.rating),
                source: 'lichess',
                originalId: p.id,
                rating: p.rating,
                themes: themes
            };
            
            if ((index + 1) % 10 === 0) {
                console.log(`   ✅ Converted ${index + 1}/${lichessPuzzles.length} puzzles`);
            }
            
            return converted;
        });
    }

    /**
     * Convert Lichess solution format
     */
    convertLichessSolution(moves) {
        const solution = [];
        
        for (let i = 0; i < moves.length; i++) {
            const move = moves[i];
            let explanation;
            
            // Generate better explanations based on move index
            if (i === 0) {
                explanation = "Første trekk i kombinasjonen";
            } else if (i === moves.length - 1) {
                explanation = "Avsluttende trekk";
            } else {
                explanation = `Fortsetter kombinasjonen`;
            }
            
            const solutionMove = {
                move: move,
                explanation: explanation
            };
            
            // Add opponent response if there's a next move
            if (i + 1 < moves.length) {
                solutionMove.opponentResponse = moves[i + 1];
                i++; // Skip next move since we used it as opponent response
            }
            
            solution.push(solutionMove);
        }
        
        return solution;
    }

    /**
     * Map rating to difficulty
     */
    mapRatingToDifficulty(rating) {
        if (rating < 1200) return 'beginner';
        if (rating < 1600) return 'intermediate';  
        if (rating < 2000) return 'advanced';
        return 'expert';
    }

    /**
     * Map theme to category
     */
    mapThemeToCategory(theme) {
        const mapping = {
            'fork': 'fork',
            'pin': 'pin', 
            'skewer': 'skewer',
            'discoveredAttack': 'discovered_attack',
            'deflection': 'deflection',
            'decoy': 'decoy',
            'mate': 'mate',
            'mateIn1': 'mate',
            'mateIn2': 'mate',
            'mateIn3': 'mate',
            'sacrifice': 'sacrifice',
            'opening': 'opening',
            'middlegame': 'middlegame', 
            'endgame': 'endgame',
            'attraction': 'attraction',
            'clearance': 'clearance',
            'interference': 'interference'
        };
        
        return mapping[theme] || 'general';
    }

    /**
     * Generate Norwegian title based on themes
     */
    generateTitle(themes) {
        const themeNames = {
            'fork': 'Gaffel-taktikk',
            'pin': 'Binding-kombinasjon', 
            'skewer': 'Spidding-trekk',
            'mate': 'Matt-kombinasjon',
            'mateIn1': 'Matt i 1 trekk',
            'mateIn2': 'Matt i 2 trekk',
            'mateIn3': 'Matt i 3 trekk',
            'sacrifice': 'Ofring-kombinasjon',
            'deflection': 'Avlednings-taktikk',
            'decoy': 'Lokkemiddel-kombinasjon',
            'discoveredAttack': 'Oppdaget angrep',
            'attraction': 'Tiltrekning',
            'clearance': 'Rydding',
            'interference': 'Forstyrrelse'
        };
        
        const primaryTheme = themes[0] || 'general';
        return themeNames[primaryTheme] || 'Finn det beste trekket';
    }

    /**
     * Generate Norwegian description
     */
    generateDescription(themes, rating, toMove) {
        const moveColor = toMove === 'w' ? 'Hvit' : 'Svart';
        const themeDesc = themes.length > 0 ? ` ${themes[0]} taktikk.` : '';
        return `${moveColor} å spille.${themeDesc} (Rating: ${rating})`;
    }

    /**
     * Generate hints in Norwegian
     */
    generateHints(themes) {
        const hintTemplates = {
            'fork': ['Se etter gaffel-muligheter', 'Kan du angripe to brikker samtidig?', 'Hvilken brikke kan gi dobbelt angrep?'],
            'pin': ['Se etter binding-muligheter', 'Hvilke brikker kan ikke flytte?', 'Er det noen brikker på linje?'],
            'skewer': ['Se etter spidding-muligheter', 'Kan du tvinge en verdifull brikke til å flytte?'],
            'mate': ['Dette er matt!', 'Kongen kan ikke unnslippe', 'Finn den avgjørende kombinasjonen'],
            'mateIn1': ['Matt i 1 trekk', 'Ett trekk som avgjør partiet'],
            'mateIn2': ['Matt i 2 trekk', 'Planlegg to trekk fremover'],
            'sacrifice': ['Vurder et offer', 'Kan du ofre noe for større gevinst?', 'Materiell er ikke alt'],
            'deflection': ['Avled en viktig forsvarsbrikke', 'Hvilken brikke forsvarer motstanderen?'],
            'discoveredAttack': ['Se etter oppdaget angrep', 'Hvilken brikke kan flytte og åpne for angrep?']
        };
        
        let hints = ['Studer posisjonen nøye', 'Tenk på taktiske motiver'];
        
        themes.forEach(theme => {
            if (hintTemplates[theme]) {
                hints.push(...hintTemplates[theme].slice(0, 2));
            }
        });
        
        return [...new Set(hints)].slice(0, 3); // Remove duplicates and limit to 3
    }

    /**
     * Calculate points based on rating
     */
    calculatePoints(rating) {
        if (rating < 1200) return 5;
        if (rating < 1400) return 10;
        if (rating < 1600) return 15;
        if (rating < 1800) return 20;
        if (rating < 2000) return 25;
        if (rating < 2200) return 30;
        return 35;
    }

    /**
     * Save puzzles to JSON file
     */
    saveToFile(filename = null) {
        if (this.importedPuzzles.length === 0) {
            console.warn('⚠️ No puzzles to save');
            return;
        }
        
        const timestamp = new Date().toISOString().split('T')[0];
        const defaultFilename = `chesshawk-puzzles-${timestamp}.json`;
        const finalFilename = filename || defaultFilename;
        
        const exportData = {
            problems: this.importedPuzzles,
            metadata: {
                exportDate: new Date().toISOString(),
                totalProblems: this.importedPuzzles.length,
                sources: [...new Set(this.importedPuzzles.map(p => p.source))],
                generatedBy: 'ChessHawk Puzzle Importer CLI'
            }
        };
        
        const filepath = path.join(this.outputDir, finalFilename);
        fs.writeFileSync(filepath, JSON.stringify(exportData, null, 2));
        
        console.log(`💾 Saved ${this.importedPuzzles.length} puzzles to: ${filepath}`);
        return filepath;
    }

    /**
     * Print statistics
     */
    printStatistics() {
        if (this.importedPuzzles.length === 0) {
            console.log('📊 No puzzles imported yet');
            return;
        }

        console.log('\n📊 === IMPORT STATISTICS ===');
        console.log(`   Total puzzles: ${this.importedPuzzles.length}`);
        
        // Group by difficulty
        const byDifficulty = {};
        const byCategory = {};
        const byRating = { min: Infinity, max: -Infinity, total: 0, count: 0 };
        
        this.importedPuzzles.forEach(puzzle => {
            byDifficulty[puzzle.difficulty] = (byDifficulty[puzzle.difficulty] || 0) + 1;
            byCategory[puzzle.category] = (byCategory[puzzle.category] || 0) + 1;
            
            if (puzzle.rating) {
                byRating.min = Math.min(byRating.min, puzzle.rating);
                byRating.max = Math.max(byRating.max, puzzle.rating);
                byRating.total += puzzle.rating;
                byRating.count++;
            }
        });
        
        console.log('\n   📈 By Difficulty:');
        Object.entries(byDifficulty).forEach(([diff, count]) => {
            console.log(`      ${diff}: ${count}`);
        });
        
        console.log('\n   🏷️  By Category:');
        Object.entries(byCategory).forEach(([cat, count]) => {
            console.log(`      ${cat}: ${count}`);
        });
        
        if (byRating.count > 0) {
            const avgRating = Math.round(byRating.total / byRating.count);
            console.log(`\n   ⭐ Rating Range: ${byRating.min}-${byRating.max} (avg: ${avgRating})`);
        }
        
        console.log('');
    }
}

// CLI interface
async function main() {
    const args = process.argv.slice(2);
    const importer = new PuzzleImporterCLI();
    
    console.log('🎯 ChessHawk Puzzle Importer CLI');
    console.log('=================================\n');
    
    // Parse command line arguments
    const count = parseInt(args.find(arg => arg.startsWith('--count='))?.split('=')[1]) || 50;
    const theme = args.find(arg => arg.startsWith('--theme='))?.split('=')[1] || null;
    const minRating = parseInt(args.find(arg => arg.startsWith('--min-rating='))?.split('=')[1]) || 1000;
    const maxRating = parseInt(args.find(arg => arg.startsWith('--max-rating='))?.split('=')[1]) || 2500;
    const filename = args.find(arg => arg.startsWith('--output='))?.split('=')[1] || null;
    
    try {
        // Import puzzles
        await importer.importFromLichess(count, theme, minRating, maxRating);
        
        // Print statistics
        importer.printStatistics();
        
        // Save to file
        const savedFile = importer.saveToFile(filename);
        
        console.log('✅ Import completed successfully!');
        console.log(`💡 Use the generated file in your ChessHawk application\n`);
        
    } catch (error) {
        console.error('❌ Import failed:', error.message);
        process.exit(1);
    }
}

// Help text
function showHelp() {
    console.log(`
🎯 ChessHawk Puzzle Importer CLI

Usage: node import-puzzles.js [options]

Options:
  --count=N           Number of puzzles to import (default: 50)
  --theme=THEME       Filter by theme (fork, pin, mate, etc.)
  --min-rating=N      Minimum puzzle rating (default: 1000)
  --max-rating=N      Maximum puzzle rating (default: 2500)
  --output=FILE       Output filename (default: auto-generated)
  --help              Show this help message

Examples:
  node import-puzzles.js --count=100 --theme=fork
  node import-puzzles.js --count=50 --min-rating=1500 --max-rating=2000
  node import-puzzles.js --theme=mate --output=mate-puzzles.json

Available themes: fork, pin, skewer, mate, mateIn1, mateIn2, sacrifice, deflection, decoy, discoveredAttack
`);
}

// Check for help flag
if (process.argv.includes('--help') || process.argv.includes('-h')) {
    showHelp();
} else {
    main();
}

module.exports = PuzzleImporterCLI;
