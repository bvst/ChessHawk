/**
 * Fixed ChessHawk Puzzle Importer - CLI Version
 * Works around CORS and API issues
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
     * Fetch data from URL with proper headers
     */
    async fetch(url) {
        return new Promise((resolve, reject) => {
            console.log(`📡 Fetching: ${url}`);
            
            const options = {
                headers: {
                    'User-Agent': 'ChessHawk-Puzzle-Importer/1.0',
                    'Accept': 'application/json',
                    'Accept-Language': 'en-US,en;q=0.9'
                }
            };
            
            https.get(url, options, (res) => {
                let data = '';
                
                console.log(`📊 Response status: ${res.statusCode}`);
                console.log(`📊 Response headers:`, res.headers);
                
                res.on('data', (chunk) => {
                    data += chunk;
                });
                
                res.on('end', () => {
                    try {
                        // Check if response looks like HTML (error page)
                        if (data.trim().startsWith('<!DOCTYPE') || data.trim().startsWith('<html')) {
                            console.log(`❌ Received HTML instead of JSON. First 200 chars:`);
                            console.log(data.substring(0, 200));
                            reject(new Error('API returned HTML instead of JSON - possibly blocked or rate limited'));
                            return;
                        }
                        
                        const jsonData = JSON.parse(data);
                        resolve(jsonData);
                    } catch (error) {
                        console.log(`❌ Failed to parse response. First 200 chars:`);
                        console.log(data.substring(0, 200));
                        reject(new Error(`Failed to parse JSON: ${error.message}`));
                    }
                });
                
            }).on('error', (error) => {
                reject(error);
            });
        });
    }

    /**
     * Generate sample tactical problems when API is not available
     */
    async generateSampleProblems(count = 50, theme = null) {
        console.log(`🎲 === Generating ${count} sample puzzles (theme: ${theme || 'mixed'}) ===`);
        
        const sampleProblems = [];
        const themes = theme ? [theme] : ['fork', 'pin', 'skewer', 'mate', 'sacrifice'];
        const difficulties = ['beginner', 'intermediate', 'advanced'];
        
        for (let i = 0; i < count; i++) {
            const currentTheme = theme || themes[i % themes.length];
            const difficulty = difficulties[i % difficulties.length];
            const rating = this.getDifficultyRating(difficulty) + Math.floor(Math.random() * 200);
            
            const problem = {
                id: `sample_${currentTheme}_${i + 1}`,
                type: 'tactical',
                title: this.generateTitle([currentTheme]),
                description: this.generateDescription([currentTheme], rating, Math.random() > 0.5 ? 'w' : 'b'),
                fen: this.getSampleFEN(currentTheme),
                toMove: Math.random() > 0.5 ? 'w' : 'b',
                solution: this.generateSampleSolution(currentTheme),
                hints: this.generateHints([currentTheme]),
                difficulty: difficulty,
                category: this.mapThemeToCategory(currentTheme),
                points: this.calculatePoints(rating),
                source: 'generated',
                originalId: `sample_${i + 1}`,
                rating: rating,
                themes: [currentTheme]
            };
            
            sampleProblems.push(problem);
        }
        
        this.importedPuzzles.push(...sampleProblems);
        console.log(`✅ Generated ${sampleProblems.length} sample problems`);
        return sampleProblems;
    }

    /**
     * Get sample FEN positions for different themes
     */
    getSampleFEN(theme) {
        const sampleFENs = {
            fork: "r1bqk2r/pppp1ppp/2n2n2/2b1p3/2B1P3/3P1N2/PPP2PPP/RNBQK2R w KQkq - 4 4",
            pin: "rnbqkb1r/ppp2ppp/3p1n2/4p3/4P3/3P1N2/PPP2PPP/RNBQKB1R w KQkq - 0 4",
            skewer: "r1bqk2r/pppp1ppp/2n2n2/4p3/1bB1P3/3P1N2/PPP2PPP/RNBQK2R w KQkq - 4 4",
            mate: "6k1/5ppp/8/8/8/8/5PPP/4R1K1 w - - 0 1",
            sacrifice: "r1bqkb1r/pppp1ppp/2n2n2/4p3/2B1P3/3P1N2/PPP2PPP/RNBQK2R w KQkq - 4 4",
            deflection: "r1bq1rk1/ppp2ppp/2n2n2/3p4/3P4/2N1PN2/PPP2PPP/R1BQKB1R w KQ - 0 7",
            decoy: "r1bqkb1r/pppp1ppp/2n2n2/4p3/2B1P3/3P1N2/PPP2PPP/RNBQK2R w KQkq - 4 4"
        };
        
        return sampleFENs[theme] || sampleFENs.fork;
    }

    /**
     * Generate sample solutions for different themes
     */
    generateSampleSolution(theme) {
        const solutions = {
            fork: [{
                move: "Nd5",
                explanation: "Springer gaffel - angriper både dame og tårn"
            }],
            pin: [{
                move: "Bg5",
                explanation: "Binder springeren til damen"
            }],
            skewer: [{
                move: "Bb5+",
                explanation: "Spidder kongen til tårnet"
            }],
            mate: [{
                move: "Re8#",
                explanation: "Sjakkmatt! Tårnet på åttende rad"
            }],
            sacrifice: [{
                move: "Bxf7+",
                explanation: "Løperoffer som åpner kongestillingen",
                opponentResponse: "Kxf7"
            }, {
                move: "Ng5+",
                explanation: "Gaffel konge og dame"
            }]
        };
        
        return solutions[theme] || solutions.fork;
    }

    /**
     * Get base rating for difficulty
     */
    getDifficultyRating(difficulty) {
        const ratings = {
            beginner: 1000,
            intermediate: 1400,
            advanced: 1800,
            expert: 2200
        };
        return ratings[difficulty] || 1400;
    }

    /**
     * Try to import from Lichess API, fallback to samples if it fails
     */
    async importFromLichess(count = 50, theme = null, minRating = 1000, maxRating = 2500) {
        console.log(`🌐 === Attempting to import ${count} puzzles from Lichess ===`);
        console.log(`   🎯 Theme: ${theme || 'all'}`);
        console.log(`   📊 Rating range: ${minRating}-${maxRating}`);
        
        try {
            // Try individual puzzle endpoint first
            const testUrl = 'https://lichess.org/api/puzzle/daily';
            await this.fetch(testUrl);
            
            // If that works, try batch endpoint
            let url = `https://lichess.org/api/puzzle/batch?nb=${Math.min(count, 50)}`; // Limit to 50 per request
            
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
                throw new Error('No puzzles received from API');
            }
            
        } catch (error) {
            console.warn(`⚠️ Lichess API failed: ${error.message}`);
            console.log(`🎲 Falling back to generated sample problems...`);
            
            return await this.generateSampleProblems(count, theme);
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
        const defaultFilename = filename || `chesshawk-puzzles-${timestamp}.json`;
        
        const exportData = {
            problems: this.importedPuzzles,
            metadata: {
                exportDate: new Date().toISOString(),
                totalProblems: this.importedPuzzles.length,
                sources: [...new Set(this.importedPuzzles.map(p => p.source))],
                generatedBy: 'ChessHawk Puzzle Importer CLI'
            }
        };
        
        const filepath = path.join(this.outputDir, defaultFilename);
        fs.writeFileSync(filepath, JSON.stringify(exportData, null, 2));
        
        console.log(`💾 Saved ${this.importedPuzzles.length} puzzles to: ${filepath}`);
        return filepath;
    }

    /**
     * Replace problems.json with imported puzzles
     */
    async replaceProblemsFile() {
        const problemsPath = path.join(__dirname, 'src', 'data', 'problems.json');
        
        if (this.importedPuzzles.length === 0) {
            console.warn('⚠️ No puzzles to save');
            return;
        }
        
        // Create backup first
        const backupPath = `${problemsPath}.backup.${new Date().toISOString().slice(0,19).replace(/:/g, '-')}`;
        if (fs.existsSync(problemsPath)) {
            fs.copyFileSync(problemsPath, backupPath);
            console.log(`📋 Backup created: ${backupPath}`);
        }
        
        const exportData = {
            problems: this.importedPuzzles,
            metadata: {
                exportDate: new Date().toISOString(),
                totalProblems: this.importedPuzzles.length,
                sources: [...new Set(this.importedPuzzles.map(p => p.source))],
                generatedBy: 'ChessHawk Puzzle Importer CLI'
            }
        };
        
        fs.writeFileSync(problemsPath, JSON.stringify(exportData, null, 2));
        console.log(`✅ Replaced problems.json with ${this.importedPuzzles.length} puzzles`);
        
        return problemsPath;
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
        const bySource = {};
        const byRating = { min: Infinity, max: -Infinity, total: 0, count: 0 };
        
        this.importedPuzzles.forEach(puzzle => {
            byDifficulty[puzzle.difficulty] = (byDifficulty[puzzle.difficulty] || 0) + 1;
            byCategory[puzzle.category] = (byCategory[puzzle.category] || 0) + 1;
            bySource[puzzle.source] = (bySource[puzzle.source] || 0) + 1;
            
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
        
        console.log('\n   📚 By Source:');
        Object.entries(bySource).forEach(([source, count]) => {
            console.log(`      ${source}: ${count}`);
        });
        
        if (byRating.count > 0) {
            const avgRating = Math.round(byRating.total / byRating.count);
            console.log(`\n   ⭐ Rating Range: ${byRating.min}-${byRating.max} (avg: ${avgRating})`);
        }
        
        console.log('');
    }

    /**
     * Clear all imported puzzles
     */
    clear() {
        this.importedPuzzles = [];
        console.log('🧹 Cleared all imported puzzles');
    }
}

module.exports = PuzzleImporterCLI;
