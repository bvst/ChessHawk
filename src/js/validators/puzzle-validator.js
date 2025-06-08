/**
 * ChessHawk Puzzle Validator
 * Validerer og genererer statistikk for puzzles
 */

class PuzzleValidator {
    /**
     * Get statistics about puzzles
     * @param {Array} puzzles - Array av puzzles
     */
    static getStatistics(puzzles) {
        if (puzzles.length === 0) {
            return { message: 'No puzzles to analyze' };
        }

        const stats = {
            total: puzzles.length,
            byDifficulty: {},
            byCategory: {},
            bySource: {},
            ratingRange: {
                min: Math.min(...puzzles.map(p => p.rating || 0)),
                max: Math.max(...puzzles.map(p => p.rating || 0))
            }
        };

        puzzles.forEach(puzzle => {
            // Count by difficulty
            stats.byDifficulty[puzzle.difficulty] = (stats.byDifficulty[puzzle.difficulty] || 0) + 1;
            
            // Count by category
            stats.byCategory[puzzle.category] = (stats.byCategory[puzzle.category] || 0) + 1;
            
            // Count by source
            stats.bySource[puzzle.source] = (stats.bySource[puzzle.source] || 0) + 1;
        });

        return stats;
    }

    /**
     * Valider at en puzzle har alle nødvendige felt
     * @param {Object} puzzle - Puzzle å validere
     */
    static validatePuzzle(puzzle) {
        const requiredFields = ['id', 'title', 'description', 'fen', 'solution', 'difficulty', 'category'];
        const missing = requiredFields.filter(field => !puzzle[field]);
        
        if (missing.length > 0) {
            throw new Error(`Puzzle ${puzzle.id || 'unknown'} mangler felt: ${missing.join(', ')}`);
        }

        // Valider FEN format (grunnleggende)
        if (typeof puzzle.fen !== 'string' || puzzle.fen.split(' ').length < 4) {
            throw new Error(`Ugyldig FEN-posisjon for puzzle ${puzzle.id}`);
        }

        // Valider at solution er en array
        if (!Array.isArray(puzzle.solution) || puzzle.solution.length === 0) {
            throw new Error(`Ugyldig løsning for puzzle ${puzzle.id}`);
        }

        return true;
    }

    /**
     * Valider en samling av puzzles
     * @param {Array} puzzles - Array av puzzles å validere
     */
    static validatePuzzleCollection(puzzles) {
        const errors = [];
        const duplicateIds = new Set();
        const seenIds = new Set();

        puzzles.forEach((puzzle, index) => {
            try {
                this.validatePuzzle(puzzle);
                
                // Sjekk for duplikat ID-er
                if (seenIds.has(puzzle.id)) {
                    duplicateIds.add(puzzle.id);
                } else {
                    seenIds.add(puzzle.id);
                }
                
            } catch (error) {
                errors.push(`Index ${index}: ${error.message}`);
            }
        });

        if (duplicateIds.size > 0) {
            errors.push(`Duplikat ID-er funnet: ${Array.from(duplicateIds).join(', ')}`);
        }

        if (errors.length > 0) {
            throw new Error(`Validering feilet:\n${errors.join('\n')}`);
        }

        return {
            valid: true,
            totalPuzzles: puzzles.length,
            uniqueIds: seenIds.size,
            message: `Alle ${puzzles.length} puzzles er gyldige`
        };
    }

    /**
     * Fjern duplikater basert på ID
     * @param {Array} puzzles - Array av puzzles
     */
    static removeDuplicates(puzzles) {
        const seen = new Set();
        const unique = [];

        puzzles.forEach(puzzle => {
            if (!seen.has(puzzle.id)) {
                seen.add(puzzle.id);
                unique.push(puzzle);
            }
        });

        const removed = puzzles.length - unique.length;
        if (removed > 0) {
            console.log(`🧹 Removed ${removed} duplicate puzzles`);
        }

        return unique;
    }
}

// Export for use in browser
if (typeof window !== 'undefined') {
    window.PuzzleValidator = PuzzleValidator;
}

// Export for Node.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PuzzleValidator;
}
