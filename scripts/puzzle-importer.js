/**
 * ChessHawk Puzzle Importer - Legacy Compatibility Loader
 * 
 * NOTICE: This file now loads the new modular puzzle import system.
 * The modular system provides better maintainability and extensibility.
 * 
 * For new development, please use the modules directly:
 * - puzzle-import-system.js (main loader)
 * - puzzle-importer-main.js (main class)
 * 
 * This file maintains backward compatibility with existing code.
 */

console.warn('⚠️ Loading legacy puzzle-importer.js - Consider migrating to new modular system');

// Try to load the new modular system if in browser
if (typeof window !== 'undefined') {
    // Load the new system dynamically
    const script = document.createElement('script');
    script.src = 'puzzle-import-system.js';
    script.onload = () => {
        console.log('✅ New modular system loaded via legacy wrapper');
    };
    document.head.appendChild(script);
}

// Backward compatibility class that wraps the new system
class PuzzleImporter {
    constructor() {
        this.importedPuzzles = [];
        this._modernImporter = null;
        this._initializeModernImporter();
    }

    async _initializeModernImporter() {
        // Wait for modules to be available
        const maxWait = 5000; // 5 seconds
        const startTime = Date.now();
        
        while (!window.PuzzleImportSystem && (Date.now() - startTime) < maxWait) {
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        if (window.PuzzleImportSystem) {
            try {
                const ModernPuzzleImporter = await window.PuzzleImportSystem.loadModules();
                this._modernImporter = new ModernPuzzleImporter();
                console.log('✅ Legacy wrapper connected to modern system');
            } catch (error) {
                console.error('❌ Failed to load modern system:', error);
            }
        } else {
            console.warn('⚠️ Modern system not available, falling back to basic functionality');
        }
    }

    /**
     * Importer problemer fra Lichess API
     * @param {number} count - Antall problemer å hente (standard: 50)
     * @param {string} theme - Tematisk filter (fork, pin, skewer, etc.)
     */
    async importFromLichess(count = 50, theme = null) {
        if (this._modernImporter) {
            const result = await this._modernImporter.importFromLichess(count, theme);
            this.importedPuzzles = this._modernImporter.getImportedPuzzles();
            return result;
        } else {
            console.error('❌ Modern import system not available');
            throw new Error('Import system not initialized');
        }
    }    /**
     * Legacy method - delegates to modern system
     */
    exportToJSON() {
        if (this._modernImporter) {
            return this._modernImporter.exportToJSON();
        }
        return null;
    }

    /**
     * Legacy method - delegates to modern system
     */
    async mergeWithExistingProblems() {
        if (this._modernImporter) {
            return this._modernImporter.mergeWithExistingProblems();
        }
        throw new Error('Modern system not available');
    }

    /**
     * Legacy method - delegates to modern system
     */
    clear() {
        this.importedPuzzles = [];
        if (this._modernImporter) {
            this._modernImporter.clear();
        }
    }

    /**
     * Legacy method - delegates to modern system
     */
    getStatistics() {
        if (this._modernImporter) {
            return this._modernImporter.getStatistics();
        }
        return { message: 'Modern system not available' };
    }

    /**
     * Legacy method - placeholder for Chess.com
     */
    async importFromChessCom(apiKey, count = 20) {
        if (this._modernImporter) {
            return this._modernImporter.importFromChessCom(apiKey, count);
        }
        throw new Error('Modern system not available');
    }
}

// Migration notice
console.info(`
🔄 MIGRATION NOTICE:
The puzzle import system has been refactored into modular components.

New modular structure:
- puzzle-import-system.js (main loader)
- importers/lichess-importer.js
- converters/puzzle-converter.js  
- validators/puzzle-validator.js
- exporters/puzzle-exporter.js

This legacy file provides backward compatibility.
For new development, please use the modular system directly.

Example migration:
OLD: const importer = new PuzzleImporter();
NEW: const PuzzleImporter = await window.PuzzleImportSystem.loadModules();
     const importer = new PuzzleImporter();
`);

// Export for use in browser
if (typeof window !== 'undefined') {
    window.PuzzleImporter = PuzzleImporter;
}

// Export for Node.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PuzzleImporter;
}
