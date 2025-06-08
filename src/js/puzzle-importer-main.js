/**
 * ChessHawk Puzzle Importer - Main Orchestrator
 * Koordinerer import av sjakk-taktikkproblemer fra forskjellige kilder
 */

class PuzzleImporter {
    constructor() {
        this.importedPuzzles = [];
        
        // Initialize sub-modules
        this.lichessImporter = new LichessImporter();
    }

    /**
     * Importer problemer fra Lichess API
     * @param {number} count - Antall problemer å hente (standard: 50)
     * @param {string} theme - Tematisk filter (fork, pin, skewer, etc.)
     */
    async importFromLichess(count = 50, theme = null) {
        try {
            const rawPuzzles = await this.lichessImporter.importPuzzles(count, theme);
            
            if (rawPuzzles.length > 0) {
                const convertedPuzzles = PuzzleConverter.convertLichessPuzzles(rawPuzzles, this.lichessImporter);
                
                // Valider puzzles før de legges til
                PuzzleValidator.validatePuzzleCollection(convertedPuzzles);
                
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
     * Hent problemer fra Chess.com (placeholder)
     * @param {string} apiKey - API nøkkel for Chess.com
     * @param {number} count - Antall problemer å hente
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
            return [];
            
        } catch (error) {
            console.error('❌ Error importing from Chess.com:', error);
            throw error;
        }
    }

    /**
     * Eksporter problemer til JSON-fil
     */
    exportToJSON() {
        return PuzzleExporter.exportToJSON(this.importedPuzzles);
    }

    /**
     * Last opp problemer til eksisterende problems.json
     */
    async mergeWithExistingProblems() {
        return PuzzleExporter.mergeWithExistingProblems(this.importedPuzzles);
    }

    /**
     * Backup og last ned eksisterende database
     */
    async backupDatabase() {
        return PuzzleExporter.backupExistingDatabase();
    }

    /**
     * Last ned importerte puzzles som JSON-fil
     * @param {string} filename - Navn på fil (standard: imported-puzzles.json)
     */
    downloadImportedPuzzles(filename = 'imported-puzzles.json') {
        const jsonData = this.exportToJSON();
        if (jsonData) {
            PuzzleExporter.downloadJSON(jsonData, filename);
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
        return PuzzleValidator.getStatistics(this.importedPuzzles);
    }

    /**
     * Valider alle importerte puzzles
     */
    validateImportedPuzzles() {
        return PuzzleValidator.validatePuzzleCollection(this.importedPuzzles);
    }

    /**
     * Fjern duplikater fra importerte puzzles
     */
    removeDuplicates() {
        this.importedPuzzles = PuzzleValidator.removeDuplicates(this.importedPuzzles);
        return this.importedPuzzles.length;
    }

    /**
     * Get antall importerte puzzles
     */
    getImportedCount() {
        return this.importedPuzzles.length;
    }

    /**
     * Get alle importerte puzzles
     */
    getImportedPuzzles() {
        return [...this.importedPuzzles]; // Return copy
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
