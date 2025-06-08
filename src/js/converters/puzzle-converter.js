/**
 * ChessHawk Puzzle Converter
 * Konverterer puzzles mellom forskjellige formater
 */

class PuzzleConverter {
    /**
     * Konverter Lichess puzzle format til ChessHawk format
     * @param {Array} lichessPuzzles - Array av Lichess puzzles
     * @param {LichessImporter} lichessImporter - Lichess importer instance
     */
    static convertLichessPuzzles(lichessPuzzles, lichessImporter) {
        console.log(`🔄 Converting ${lichessPuzzles.length} Lichess puzzles...`);
        
        return lichessPuzzles.map((puzzle, index) => {
            console.log(`   ${index + 1}. Converting puzzle ${puzzle.puzzle.id}`);
            
            // Konverter Lichess format til vårt format
            const solution = lichessImporter.convertSolution(puzzle.puzzle.solution);
            const themes = puzzle.puzzle.themes || [];
            
            // Map Lichess rating til vårt difficulty system
            const difficulty = lichessImporter.mapRatingToDifficulty(puzzle.puzzle.rating);
            
            // Map første tema til kategori
            const category = lichessImporter.mapThemeToCategory(themes[0] || 'general');
            
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
     * Generer tittel basert på temaer
     */
    static generateTitle(themes) {
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
    static generateDescription(themes, rating) {
        const moveColor = Math.random() > 0.5 ? 'Hvit' : 'Svart'; // Kan forbedres ved å lese FEN
        return `${moveColor} å spille. Finn den beste kombinasjonen! (Rating: ${rating})`;
    }

    /**
     * Generer hints basert på temaer
     */
    static generateHints(themes) {
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
    static calculatePoints(rating) {
        if (rating < 1200) return 5;
        if (rating < 1400) return 10;
        if (rating < 1600) return 15;
        if (rating < 1800) return 20;
        if (rating < 2000) return 25;
        return 30;
    }
}

// Export for use in browser
if (typeof window !== 'undefined') {
    window.PuzzleConverter = PuzzleConverter;
}

// Export for Node.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PuzzleConverter;
}
