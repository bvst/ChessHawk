/**
 * ChessHawk Puzzle Importer
 * Importer sjakk-taktikkproblemer fra forskjellige kilder
 */

class PuzzleImporter {
    constructor() {
        this.baseUrls = {
            lichess: 'https://lichess.org/api/puzzle',
            chesscom: 'https://api.chess.com/pub/puzzle',
            chesstempo: 'https://chesstempo.com/api' // Eksempel
        };
        this.importedPuzzles = [];
    }

    /**
     * Importer problemer fra Lichess API
     * @param {number} count - Antall problemer å hente (standard: 50)
     * @param {string} theme - Tematisk filter (fork, pin, skewer, etc.)
     */
    async importFromLichess(count = 50, theme = null) {
        console.log(`🌐 === Importing ${count} puzzles from Lichess ===`);
        
        try {
            const baseUrl = 'https://lichess.org/api/puzzle/batch';
            let url = `${baseUrl}?nb=${count}`;
            
            if (theme) {
                url += `&themes=${theme}`;
            }
            
            console.log(`📡 Fetching from: ${url}`);
            
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            console.log(`✅ Received ${data.puzzles?.length || 0} puzzles from Lichess`);
            
            if (data.puzzles && data.puzzles.length > 0) {
                const convertedPuzzles = this.convertLichessPuzzles(data.puzzles);
                this.importedPuzzles.push(...convertedPuzzles);
                return convertedPuzzles;
            } else {
                console.warn('⚠️ No puzzles received from Lichess');
                return [];
            }
            
        } catch (error) {
            console.error('❌ Error importing from Lichess:', error);
            throw error;
        }
    }

    /**
     * Konverter Lichess puzzle format til ChessHawk format
     * @param {Array} lichessPuzzles - Array av Lichess puzzles
     */
    convertLichessPuzzles(lichessPuzzles) {
        console.log(`🔄 Converting ${lichessPuzzles.length} Lichess puzzles...`);
        
        return lichessPuzzles.map((puzzle, index) => {
            console.log(`   ${index + 1}. Converting puzzle ${puzzle.puzzle.id}`);
            
            // Konverter Lichess format til vårt format
            const solution = this.convertLichessSolution(puzzle.puzzle.solution);
            const themes = puzzle.puzzle.themes || [];
            
            // Map Lichess rating til vårt difficulty system
            const difficulty = this.mapRatingToDifficulty(puzzle.puzzle.rating);
            
            // Map første tema til kategori
            const category = this.mapThemeToCategory(themes[0] || 'general');
            
            return {
                id: `lichess_${puzzle.puzzle.id}`,
                type: 'tactical',
                title: this.generateTitle(themes),
                description: this.generateDescription(themes, puzzle.puzzle.rating),
                fen: puzzle.puzzle.fen,
                toMove: puzzle.puzzle.fen.split(' ')[1], // Utleder fra FEN
                solution: solution,
                hints: this.generateHints(themes),
                difficulty: difficulty,
                category: category,
                points: this.calculatePoints(puzzle.puzzle.rating),
                source: 'lichess',
                originalId: puzzle.puzzle.id,
                rating: puzzle.puzzle.rating,
                themes: themes
            };
        });
    }

    /**
     * Konverter Lichess løsning til vårt format
     * @param {Array} moves - Array av trekk fra Lichess
     */
    convertLichessSolution(moves) {
        const solution = [];
        
        for (let i = 0; i < moves.length; i++) {
            const move = moves[i];
            const explanation = i === 0 ? "Første trekk i løsningen" : `Fortsettelse av kombinasjonen`;
            
            solution.push({
                move: move,
                explanation: explanation
            });
            
            // Legg til motstanderens svar hvis det finnes
            if (i + 1 < moves.length) {
                const opponentMove = moves[i + 1];
                solution[solution.length - 1].opponentResponse = opponentMove;
                i++; // Skip neste siden vi tok den som opponent response
            }
        }
        
        return solution;
    }

    /**
     * Map Lichess rating til vårt difficulty system
     */
    mapRatingToDifficulty(rating) {
        if (rating < 1200) return 'beginner';
        if (rating < 1600) return 'intermediate';
        if (rating < 2000) return 'advanced';
        return 'expert';
    }

    /**
     * Map Lichess themes til våre kategorier
     */
    mapThemeToCategory(theme) {
        const themeMapping = {
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
            'endgame': 'endgame'
        };
        
        return themeMapping[theme] || 'general';
    }

    /**
     * Generer tittel basert på temaer
     */
    generateTitle(themes) {
        const themeNames = {
            'fork': 'Gaffel',
            'pin': 'Binding',
            'skewer': 'Spidding',
            'mate': 'Matt',
            'mateIn1': 'Matt i 1',
            'mateIn2': 'Matt i 2',
            'sacrifice': 'Offer',
            'deflection': 'Avledning',
            'decoy': 'Lokkemiddel'
        };
        
        const primaryTheme = themes[0] || 'general';
        return themeNames[primaryTheme] || 'Finn det beste trekket';
    }

    /**
     * Generer beskrivelse
     */
    generateDescription(themes, rating) {
        const moveColor = Math.random() > 0.5 ? 'Hvit' : 'Svart'; // Kan forbedres ved å lese FEN
        return `${moveColor} å spille. Finn den beste kombinasjonen! (Rating: ${rating})`;
    }

    /**
     * Generer hints basert på temaer
     */
    generateHints(themes) {
        const hintTemplates = {
            'fork': ['Se etter muligheter for gaffel', 'Kan du angripe to brikker samtidig?'],
            'pin': ['Se etter binding-muligheter', 'Hvilke brikker kan ikke flytte?'],
            'mate': ['Dette er matt!', 'Kongen kan ikke unnslippe'],
            'sacrifice': ['Vurder et offer', 'Kan du ofre noe for større gevinst?']
        };
        
        const hints = ['Studer posisjonen nøye'];
        themes.forEach(theme => {
            if (hintTemplates[theme]) {
                hints.push(...hintTemplates[theme]);
            }
        });
        
        return hints.slice(0, 3); // Maksimum 3 hints
    }

    /**
     * Kalkuler poeng basert på rating
     */
    calculatePoints(rating) {
        if (rating < 1200) return 5;
        if (rating < 1400) return 10;
        if (rating < 1600) return 15;
        if (rating < 1800) return 20;
        if (rating < 2000) return 25;
        return 30;
    }

    /**
     * Eksporter problemer til JSON-fil
     */
    exportToJSON() {
        if (this.importedPuzzles.length === 0) {
            console.warn('⚠️ No puzzles to export');
            return null;
        }
        
        const exportData = {
            problems: this.importedPuzzles,
            metadata: {
                exportDate: new Date().toISOString(),
                totalProblems: this.importedPuzzles.length,
                sources: [...new Set(this.importedPuzzles.map(p => p.source))]
            }
        };
        
        return JSON.stringify(exportData, null, 2);
    }

    /**
     * Last opp problemer til eksisterende problems.json
     */
    async mergeWithExistingProblems() {
        try {
            // Last eksisterende problemer
            const response = await fetch('src/data/problems.json');
            const existingData = await response.json();
            
            // Merge med nye problemer
            const allProblems = [
                ...existingData.problems,
                ...this.importedPuzzles
            ];
            
            // Fjern duplikater basert på ID
            const uniqueProblems = allProblems.filter((problem, index, arr) => 
                arr.findIndex(p => p.id === problem.id) === index
            );
            
            console.log(`📊 Merged puzzles: ${existingData.problems.length} existing + ${this.importedPuzzles.length} new = ${uniqueProblems.length} unique`);
            
            return {
                problems: uniqueProblems,
                metadata: {
                    lastUpdated: new Date().toISOString(),
                    totalProblems: uniqueProblems.length
                }
            };
            
        } catch (error) {
            console.error('❌ Error merging with existing problems:', error);
            throw error;
        }
    }

    /**
     * Hent problemer fra Chess.com (krever API-nøkkel)
     */
    async importFromChessCom(apiKey, count = 20) {
        console.log(`🌐 === Importing ${count} puzzles from Chess.com ===`);
        
        // Note: Chess.com API krever autentisering for puzzles
        // Dette er et eksempel på strukturen
        try {
            const response = await fetch(`https://api.chess.com/pub/puzzle/random`, {
                headers: {
                    'Authorization': `Bearer ${apiKey}`
                }
            });
            
            // Implementation would depend on Chess.com API structure
            console.warn('⚠️ Chess.com puzzle import not fully implemented yet');
            
        } catch (error) {
            console.error('❌ Error importing from Chess.com:', error);
            throw error;
        }
    }

    /**
     * Clear imported puzzles
     */
    clear() {
        this.importedPuzzles = [];
        console.log('🧹 Cleared imported puzzles');
    }

    /**
     * Get statistics about imported puzzles
     */
    getStatistics() {
        if (this.importedPuzzles.length === 0) {
            return { message: 'No puzzles imported yet' };
        }

        const stats = {
            total: this.importedPuzzles.length,
            byDifficulty: {},
            byCategory: {},
            bySource: {},
            ratingRange: {
                min: Math.min(...this.importedPuzzles.map(p => p.rating || 0)),
                max: Math.max(...this.importedPuzzles.map(p => p.rating || 0))
            }
        };

        this.importedPuzzles.forEach(puzzle => {
            // Count by difficulty
            stats.byDifficulty[puzzle.difficulty] = (stats.byDifficulty[puzzle.difficulty] || 0) + 1;
            
            // Count by category
            stats.byCategory[puzzle.category] = (stats.byCategory[puzzle.category] || 0) + 1;
            
            // Count by source
            stats.bySource[puzzle.source] = (stats.bySource[puzzle.source] || 0) + 1;
        });

        return stats;
    }
}

// Export for use in browser
if (typeof window !== 'undefined') {
    window.PuzzleImporter = PuzzleImporter;
}

// Export for Node.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PuzzleImporter;
}
