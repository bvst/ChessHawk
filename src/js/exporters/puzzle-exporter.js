/**
 * ChessHawk Puzzle Exporter
 * Eksporterer og merger puzzles med eksisterende database
 */

class PuzzleExporter {
    /**
     * Eksporter problemer til JSON-fil
     * @param {Array} puzzles - Array av puzzles å eksportere
     */
    static exportToJSON(puzzles) {
        if (puzzles.length === 0) {
            console.warn('⚠️ No puzzles to export');
            return null;
        }
        
        const exportData = {
            problems: puzzles,
            metadata: {
                exportDate: new Date().toISOString(),
                totalProblems: puzzles.length,
                sources: [...new Set(puzzles.map(p => p.source))]
            }
        };
        
        return JSON.stringify(exportData, null, 2);
    }

    /**
     * Last opp problemer til eksisterende problems.json
     * @param {Array} newPuzzles - Nye puzzles å merge
     */
    static async mergeWithExistingProblems(newPuzzles) {
        try {
            // Last eksisterende problemer
            const response = await fetch('src/data/problems.json');
            const existingData = await response.json();
            
            // Merge med nye problemer
            const allProblems = [
                ...existingData.problems,
                ...newPuzzles
            ];
            
            // Fjern duplikater basert på ID
            const uniqueProblems = allProblems.filter((problem, index, arr) => 
                arr.findIndex(p => p.id === problem.id) === index
            );
            
            console.log(`📊 Merged puzzles: ${existingData.problems.length} existing + ${newPuzzles.length} new = ${uniqueProblems.length} unique`);
            
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
     * Last ned data som fil
     * @param {string} jsonData - JSON data å laste ned
     * @param {string} filename - Navn på fil (standard: puzzles.json)
     */
    static downloadJSON(jsonData, filename = 'puzzles.json') {
        if (typeof window === 'undefined') {
            console.warn('⚠️ Download functionality only available in browser');
            return;
        }

        const blob = new Blob([jsonData], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        console.log(`💾 Downloaded ${filename}`);
    }

    /**
     * Backup eksisterende database før merge
     */
    static async backupExistingDatabase() {
        try {
            const response = await fetch('src/data/problems.json');
            const data = await response.json();
            
            const backupData = {
                ...data,
                backupDate: new Date().toISOString()
            };
            
            const backupJson = JSON.stringify(backupData, null, 2);
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const filename = `problems-backup-${timestamp}.json`;
            
            this.downloadJSON(backupJson, filename);
            
            return backupData;
            
        } catch (error) {
            console.error('❌ Error creating backup:', error);
            throw error;
        }
    }
}

// Export for use in browser
if (typeof window !== 'undefined') {
    window.PuzzleExporter = PuzzleExporter;
}

// Export for Node.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PuzzleExporter;
}
