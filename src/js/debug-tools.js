/**
 * ChessHawk - Debug Tools
 * 
 * Debug og testverktøy for problemanalyse og utvikling
 * Modernized with ES2024+ features and ES6 modules
 */

/**
 * DebugTools klasse for debugging og analyse
 */
class DebugTools {
    #debugMode = false;
    #performanceMarks = new Map();
    #logBuffer = [];
    #maxLogSize = 1000;

    constructor() {
        console.log('🔬 DebugTools initialized');
        
        // Enable debug mode if URL parameter exists
        const urlParams = new URLSearchParams(window.location.search);
        this.#debugMode = urlParams.has('debug') || localStorage.getItem('chess-hawk-debug') === 'true';
        
        if (this.#debugMode) {
            console.log('🐛 Debug mode activated');
            this.#enableDebugMode();
        }
    }

    /**
     * Debug-funksjon for å analysere alle lastede problemer
     */
    analyzeProblems() {
        console.log('🔬 === DEBUG PROBLEM ANALYSIS ===');
        
        const problems = window.problemManager?.problems || [];
        const solvedProblems = window.solvedProblems || [];
        
        if (!problems || problems.length === 0) {
            console.error('❌ No problems loaded!');
            return {
                error: 'No problems loaded',
                total: 0,
                analyzed: 0
            };
        }
        
        console.log(`📊 Total problems loaded: ${problems.length}`);
        console.log(`📋 Solved problems: [${solvedProblems.join(', ')}]`);
        
        const analysis = {
            total: problems.length,
            byCategory: {},
            byDifficulty: {},
            bySolved: { solved: 0, unsolved: 0 },
            ratings: {
                min: Infinity,
                max: -Infinity,
                avg: 0,
                distribution: {}
            },
            issues: []
        };
        
        problems.forEach((problem, index) => {
            console.log(`\n🎯 === PROBLEM ${index + 1}/${problems.length} ===`);
            console.log(`   📌 ID: ${problem.id}`);
            console.log(`   🏷️  Category: ${problem.category}`);
            console.log(`   📝 Title: ${problem.title}`);
            console.log(`   🎚️  Difficulty: ${problem.difficulty}`);
            console.log(`   💰 Points: ${problem.points}`);
            console.log(`   📊 Rating: ${problem.rating}`);
            console.log(`   📊 FEN: ${problem.fen?.substring(0, 50)}...`);
            
            const isSolved = solvedProblems.includes(problem.id);
            console.log(`   ✅ Solved: ${isSolved ? 'YES' : 'NO'}`);
            
            // Validate problem structure
            this.#validateProblem(problem, analysis.issues);
            
            // Update statistics
            this.#updateAnalysisStats(problem, isSolved, analysis);
        });
        
        // Calculate averages
        analysis.ratings.avg = Math.round(
            problems.reduce((sum, p) => sum + (p.rating || 0), 0) / problems.length
        );
        
        console.log('\n📈 === ANALYSIS SUMMARY ===');
        console.log('📊 Statistics:', analysis);
        
        return analysis;
    }

    /**
     * Debug nuværende problem
     */
    debugCurrentProblem() {
        console.log('🎯 === DEBUG CURRENT PROBLEM ===');
        
        const problem = window.currentProblem;
        if (!problem) {
            console.error('❌ No current problem loaded');
            return null;
        }
        
        console.log('🔍 Current Problem Details:');
        console.log('   📌 ID:', problem.id);
        console.log('   📝 Title:', problem.title);
        console.log('   📂 Category:', problem.category);
        console.log('   ⭐ Difficulty:', problem.difficulty);
        console.log('   📊 Rating:', problem.rating);
        console.log('   💎 Points:', problem.points);
        console.log('   🎯 FEN:', problem.fen);
        console.log('   📋 Solution:', problem.solution);
        
        // Analyze current game state
        if (window.game) {
            console.log('\n🎮 Game State:');
            console.log('   📊 Current FEN:', window.game.fen());
            console.log('   ⏰ Turn:', window.game.turn() === 'w' ? 'White' : 'Black');
            console.log('   📜 History:', window.game.history());
            console.log('   ♔ In Check:', window.game.in_check());
            console.log('   ⚰️ Checkmate:', window.game.in_checkmate());
            console.log('   🤝 Draw:', window.game.in_draw());
        }
        
        // Analyze solution
        this.#analyzeSolution(problem);
        
        return problem;
    }

    /**
     * Test alle problemer for validitet
     */
    async testAllProblems() {
        console.log('🧪 === TESTING ALL PROBLEMS ===');
        
        const problems = window.problemManager?.problems || [];
        if (problems.length === 0) {
            console.error('❌ No problems to test');
            return { tested: 0, passed: 0, failed: 0, errors: [] };
        }
        
        const results = {
            tested: 0,
            passed: 0,
            failed: 0,
            errors: []
        };
        
        for (const [index, problem] of problems.entries()) {
            console.log(`🧪 Testing problem ${index + 1}/${problems.length}: ${problem.id}`);
            
            try {
                const testResult = await this.#testSingleProblem(problem);
                results.tested++;
                
                if (testResult.valid) {
                    results.passed++;
                    console.log(`   ✅ Problem ${problem.id} passed all tests`);
                } else {
                    results.failed++;
                    results.errors.push({
                        id: problem.id,
                        errors: testResult.errors
                    });
                    console.error(`   ❌ Problem ${problem.id} failed:`, testResult.errors);
                }
                
            } catch (error) {
                results.failed++;
                results.errors.push({
                    id: problem.id,
                    errors: [`Test execution error: ${error.message}`]
                });
                console.error(`   💥 Error testing problem ${problem.id}:`, error);
            }
            
            // Small delay to prevent blocking
            if (index % 10 === 0) {
                await new Promise(resolve => setTimeout(resolve, 10));
            }
        }
        
        console.log('\n📊 === TEST RESULTS ===');
        console.log(`✅ Passed: ${results.passed}`);
        console.log(`❌ Failed: ${results.failed}`);
        console.log(`📊 Success Rate: ${Math.round((results.passed / results.tested) * 100)}%`);
        
        if (results.errors.length > 0) {
            console.log('\n🚨 === FAILED PROBLEMS ===');
            results.errors.forEach(error => {
                console.log(`❌ ${error.id}:`, error.errors);
            });
        }
        
        return results;
    }

    /**
     * Performance monitoring
     */
    startPerformanceTimer(label) {
        const markName = `chess-hawk-${label}`;
        performance.mark(`${markName}-start`);
        this.#performanceMarks.set(label, Date.now());
        
        if (this.#debugMode) {
            console.log(`⏱️ Performance timer started: ${label}`);
        }
    }

    endPerformanceTimer(label) {
        const markName = `chess-hawk-${label}`;
        const startTime = this.#performanceMarks.get(label);
        
        if (startTime) {
            const duration = Date.now() - startTime;
            performance.mark(`${markName}-end`);
            performance.measure(markName, `${markName}-start`, `${markName}-end`);
            
            this.#performanceMarks.delete(label);
            
            if (this.#debugMode) {
                console.log(`⏱️ Performance timer ${label}: ${duration}ms`);
            }
            
            return duration;
        }
        
        return null;
    }

    /**
     * Få performance statistikk
     */
    getPerformanceStats() {
        const measures = performance.getEntriesByType('measure')
            .filter(entry => entry.name.startsWith('chess-hawk-'));
            
        const stats = {
            measures: measures.map(m => ({
                name: m.name.replace('chess-hawk-', ''),
                duration: Math.round(m.duration * 100) / 100
            })),
            averages: {}
        };
        
        // Calculate averages for repeated measures
        const grouped = measures.reduce((acc, measure) => {
            const name = measure.name.replace('chess-hawk-', '');
            if (!acc[name]) acc[name] = [];
            acc[name].push(measure.duration);
            return acc;
        }, {});
        
        Object.entries(grouped).forEach(([name, durations]) => {
            stats.averages[name] = Math.round(
                (durations.reduce((sum, d) => sum + d, 0) / durations.length) * 100
            ) / 100;
        });
        
        return stats;
    }

    /**
     * Toggle debug mode
     */
    toggleDebugMode() {
        this.#debugMode = !this.#debugMode;
        
        if (this.#debugMode) {
            this.#enableDebugMode();
            localStorage.setItem('chess-hawk-debug', 'true');
            console.log('🐛 Debug mode enabled');
        } else {
            this.#disableDebugMode();
            localStorage.removeItem('chess-hawk-debug');
            console.log('🔇 Debug mode disabled');
        }
        
        return this.#debugMode;
    }

    /**
     * Få debug info som objekt
     */
    getDebugInfo() {
        return {
            mode: this.#debugMode,
            currentProblem: window.currentProblem?.id || null,
            gameState: window.game ? {
                fen: window.game.fen(),
                turn: window.game.turn(),
                history: window.game.history(),
                inCheck: window.game.in_check(),
                isCheckmate: window.game.in_checkmate(),
                isDraw: window.game.in_draw()
            } : null,
            performance: this.getPerformanceStats(),
            problems: {
                total: window.problemManager?.problemCount || 0,
                solved: window.solvedProblems?.length || 0
            },
            modules: {
                board: !!window.boardManager,
                problems: !!window.problemManager,
                gameLogic: !!window.gameLogic,
                ui: !!window.uiManager
            }
        };
    }

    /**
     * Privat metode for å validere problem
     */
    #validateProblem(problem, issues) {
        const requiredFields = ['id', 'title', 'category', 'difficulty', 'fen', 'solution'];
        
        requiredFields.forEach(field => {
            if (!problem[field]) {
                issues.push(`Problem ${problem.id || 'unknown'}: Missing ${field}`);
            }
        });
        
        // Validate FEN
        if (problem.fen) {
            try {
                const testGame = new Chess(problem.fen);
                if (!testGame.fen()) {
                    issues.push(`Problem ${problem.id}: Invalid FEN`);
                }
            } catch (error) {
                issues.push(`Problem ${problem.id}: FEN validation error - ${error.message}`);
            }
        }
        
        // Validate solution format
        if (problem.solution && !Array.isArray(problem.solution)) {
            issues.push(`Problem ${problem.id}: Solution should be an array`);
        }
    }

    /**
     * Privat metode for å oppdatere analysestats
     */
    #updateAnalysisStats(problem, isSolved, analysis) {
        // Category stats
        analysis.byCategory[problem.category] = (analysis.byCategory[problem.category] || 0) + 1;
        
        // Difficulty stats
        analysis.byDifficulty[problem.difficulty] = (analysis.byDifficulty[problem.difficulty] || 0) + 1;
        
        // Solved stats
        if (isSolved) {
            analysis.bySolved.solved++;
        } else {
            analysis.bySolved.unsolved++;
        }
        
        // Rating stats
        if (problem.rating) {
            analysis.ratings.min = Math.min(analysis.ratings.min, problem.rating);
            analysis.ratings.max = Math.max(analysis.ratings.max, problem.rating);
            
            const ratingRange = Math.floor(problem.rating / 100) * 100;
            analysis.ratings.distribution[ratingRange] = (analysis.ratings.distribution[ratingRange] || 0) + 1;
        }
    }

    /**
     * Privat metode for å analysere løsning
     */
    #analyzeSolution(problem) {
        if (!problem.solution) {
            console.warn('   ⚠️ No solution provided');
            return;
        }
        
        console.log('\n📋 Solution Analysis:');
        console.log('   🔢 Move count:', problem.solution.length);
        console.log('   📝 Moves:', problem.solution.join(' '));
        
        // Try to validate solution moves
        try {
            const testGame = new Chess(problem.fen);
            let validMoves = 0;
            
            for (const move of problem.solution) {
                const result = testGame.move(move);
                if (result) {
                    validMoves++;
                } else {
                    console.error(`   ❌ Invalid move: ${move} at position ${testGame.fen()}`);
                    break;
                }
            }
            
            console.log(`   ✅ Valid moves: ${validMoves}/${problem.solution.length}`);
            
        } catch (error) {
            console.error('   💥 Error validating solution:', error.message);
        }
    }

    /**
     * Privat metode for å teste enkelt problem
     */
    async #testSingleProblem(problem) {
        const errors = [];
        
        // Test FEN validity
        try {
            const testGame = new Chess(problem.fen);
            if (!testGame.fen()) {
                errors.push('Invalid FEN position');
            }
        } catch (error) {
            errors.push(`FEN error: ${error.message}`);
        }
        
        // Test solution validity
        if (problem.solution && Array.isArray(problem.solution)) {
            try {
                const testGame = new Chess(problem.fen);
                
                for (const [index, move] of problem.solution.entries()) {
                    const result = testGame.move(move);
                    if (!result) {
                        errors.push(`Invalid solution move ${index + 1}: ${move}`);
                        break;
                    }
                }
            } catch (error) {
                errors.push(`Solution test error: ${error.message}`);
            }
        } else {
            errors.push('Solution is not a valid array');
        }
        
        return {
            valid: errors.length === 0,
            errors
        };
    }

    /**
     * Privat metode for å aktivere debug mode
     */
    #enableDebugMode() {
        // Add debug CSS class to body
        document.body.classList.add('debug-mode');
        
        // Add debug panel if it doesn't exist
        this.#createDebugPanel();
        
        // Enhanced logging
        const originalLog = console.log;
        console.log = (...args) => {
            this.#addToLogBuffer('log', args);
            originalLog.apply(console, args);
        };
    }

    /**
     * Privat metode for å deaktivere debug mode
     */
    #disableDebugMode() {
        document.body.classList.remove('debug-mode');
        
        const debugPanel = document.getElementById('debug-panel');
        if (debugPanel) {
            debugPanel.remove();
        }
    }

    /**
     * Privat metode for å lage debug panel
     */
    #createDebugPanel() {
        if (document.getElementById('debug-panel')) return;
        
        const panel = document.createElement('div');
        panel.id = 'debug-panel';
        panel.innerHTML = `
            <div class="debug-header">🔬 Debug Tools</div>
            <button onclick="window.debugTools.analyzeProblems()">Analyze Problems</button>
            <button onclick="window.debugTools.debugCurrentProblem()">Debug Current</button>
            <button onclick="window.debugTools.testAllProblems()">Test All</button>
            <button onclick="window.debugTools.toggleDebugMode()">Toggle Debug</button>
        `;
        
        // Add styles
        panel.style.cssText = `
            position: fixed; top: 10px; right: 10px; width: 200px;
            background: #333; color: white; padding: 10px;
            border-radius: 5px; font-size: 12px; z-index: 9999;
            box-shadow: 0 2px 10px rgba(0,0,0,0.3);
        `;
        
        document.body.appendChild(panel);
    }

    /**
     * Privat metode for å legge til i log buffer
     */
    #addToLogBuffer(level, args) {
        this.#logBuffer.push({
            timestamp: Date.now(),
            level,
            message: args.join(' ')
        });
        
        // Keep buffer size under control
        if (this.#logBuffer.length > this.#maxLogSize) {
            this.#logBuffer.splice(0, this.#logBuffer.length - this.#maxLogSize);
        }
    }

    /**
     * Cleanup metode
     */
    destroy() {
        this.#disableDebugMode();
        this.#performanceMarks.clear();
        this.#logBuffer = [];
    }
}

// Export the class as default
export default DebugTools;

// Expose to global scope for compatibility with existing code
window.DebugTools = DebugTools;
