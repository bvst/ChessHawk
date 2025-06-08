/**
 * ChessHawk Lichess Importer
 * Importerer sjakk-taktikkproblemer fra Lichess API
 */

class LichessImporter {
    constructor() {
        this.baseUrl = 'https://lichess.org/api/puzzle/batch';
    }

    /**
     * Importer problemer fra Lichess API
     * @param {number} count - Antall problemer å hente (standard: 50)
     * @param {string} theme - Tematisk filter (fork, pin, skewer, etc.)
     */
    async importPuzzles(count = 50, theme = null) {
        console.log(`🌐 === Importing ${count} puzzles from Lichess ===`);
        
        try {
            let url = `${this.baseUrl}?nb=${count}`;
            
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
                return data.puzzles;
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
     * Konverter Lichess løsning til vårt format
     * @param {Array} moves - Array av trekk fra Lichess
     */
    convertSolution(moves) {
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
}

// Export for use in browser
if (typeof window !== 'undefined') {
    window.LichessImporter = LichessImporter;
}

// Export for Node.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = LichessImporter;
}
