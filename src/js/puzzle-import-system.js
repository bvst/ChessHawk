/**
 * ChessHawk Puzzle Import System
 * Index fil som laster alle puzzle import moduler
 */

// Load all modules in correct order
// Note: I browser, disse må lastes via script tags i HTML

// For Node.js environment
if (typeof require !== 'undefined') {
    // Import all modules
    const LichessImporter = require('./importers/lichess-importer.js');
    const PuzzleConverter = require('./converters/puzzle-converter.js');
    const PuzzleValidator = require('./validators/puzzle-validator.js');
    const PuzzleExporter = require('./exporters/puzzle-exporter.js');
    const PuzzleImporter = require('./puzzle-importer-main.js');

    // Make available globally in Node.js
    global.LichessImporter = LichessImporter;
    global.PuzzleConverter = PuzzleConverter;
    global.PuzzleValidator = PuzzleValidator;
    global.PuzzleExporter = PuzzleExporter;
    global.PuzzleImporter = PuzzleImporter;

    // Export main class
    module.exports = PuzzleImporter;
}

// For browser environment, create a loader function
if (typeof window !== 'undefined') {
    window.PuzzleImportSystem = {
        /**
         * Last alle nødvendige script filer for puzzle import system
         * @param {string} basePath - Base path til js moduler (standard: 'src/js/')
         */
        async loadModules(basePath = 'src/js/') {
            const modules = [
                'importers/lichess-importer.js',
                'converters/puzzle-converter.js', 
                'validators/puzzle-validator.js',
                'exporters/puzzle-exporter.js',
                'puzzle-importer-main.js'
            ];

            console.log('🔄 Loading Puzzle Import System modules...');

            for (const module of modules) {
                await this.loadScript(`${basePath}${module}`);
            }

            console.log('✅ All Puzzle Import System modules loaded');
            
            // Return main importer class
            return window.PuzzleImporter;
        },

        /**
         * Last et enkelt script
         * @param {string} src - Script source path
         */
        loadScript(src) {
            return new Promise((resolve, reject) => {
                const script = document.createElement('script');
                script.src = src;
                script.onload = () => {
                    console.log(`✅ Loaded: ${src}`);
                    resolve();
                };
                script.onerror = () => {
                    console.error(`❌ Failed to load: ${src}`);
                    reject(new Error(`Failed to load script: ${src}`));
                };
                document.head.appendChild(script);
            });
        }
    };
}

/**
 * Usage examples:
 * 
 * Browser:
 * --------
 * const PuzzleImporter = await window.PuzzleImportSystem.loadModules();
 * const importer = new PuzzleImporter();
 * await importer.importFromLichess(10, 'fork');
 * 
 * Node.js:
 * --------
 * const PuzzleImporter = require('./src/js/puzzle-import-system.js');
 * const importer = new PuzzleImporter();
 * await importer.importFromLichess(10, 'fork');
 */
