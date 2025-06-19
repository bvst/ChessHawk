/**
 * ChessHawk - Debug Tools
 * 
 * Håndterer debugging, analyse og utviklingsverktøy
 * TypeScript version with proper type safety
 */

import type { ChessPuzzle, IDebugTools } from '../types/chess.types';

/**
 * DebugTools klasse for debugging og analyse
 */
class DebugTools implements IDebugTools {
    constructor() {
        console.log('🔧 DebugTools initialized');
    }

    /**
     * Analyze problems in the database
     */
    analyzeProblems(): void {
        console.log('🔍 === ANALYZING PROBLEMS ===');
        
        const problemManager = (window as any).problemManager;
        if (!problemManager || !problemManager.problems) {
            console.error('❌ No problem manager or problems available');
            return;
        }
        
        const problems: ChessPuzzle[] = problemManager.problems;
        console.log(`📊 Total problems: ${problems.length}`);
        
        // Analyze by category
        const categoryStats: Record<string, number> = {};
        const difficultyStats: Record<string, number> = {};
        const ratingStats: number[] = [];
        
        problems.forEach(problem => {
            const category = problem.category || problem.theme || 'unknown';
            const difficulty = problem.difficulty || 'unknown';
            
            categoryStats[category] = (categoryStats[category] || 0) + 1;
            difficultyStats[difficulty] = (difficultyStats[difficulty] || 0) + 1;
            ratingStats.push(problem.rating);
        });
        
        console.log('📈 Category distribution:', categoryStats);
        console.log('⭐ Difficulty distribution:', difficultyStats);
        
        // Rating statistics
        const sortedRatings = ratingStats.sort((a, b) => a - b);
        const stats = {
            min: sortedRatings[0],
            max: sortedRatings[sortedRatings.length - 1],
            avg: Math.round(ratingStats.reduce((sum, r) => sum + r, 0) / ratingStats.length),
            median: sortedRatings[Math.floor(sortedRatings.length / 2)]
        };
        
        console.log('📊 Rating statistics:', stats);
        
        // Display results to user
        this.#displayAnalysisResults({
            total: problems.length,
            categories: categoryStats,
            difficulties: difficultyStats,
            ratings: stats
        });
    }

    /**
     * Log current game state
     */
    logGameState(): void {
        console.log('🎮 === CURRENT GAME STATE ===');
        
        const game = (window as any).game;
        const currentProblem = (window as any).currentProblem;
        const playerScore = (window as any).playerScore;
        const solvedProblems = (window as any).solvedProblems;
        
        console.log('♟️ Chess game state:');
        if (game) {
            console.log(`   FEN: ${game.fen()}`);
            console.log(`   Turn: ${game.turn()}`);
            console.log(`   History: ${game.history().join(' ')}`);
            console.log(`   In check: ${game.isCheck()}`);
            console.log(`   Game over: ${game.isGameOver()}`);
        } else {
            console.log('   ❌ No game instance available');
        }
        
        console.log('🧩 Current problem:');
        if (currentProblem) {
            console.log(`   ID: ${currentProblem.id}`);
            console.log(`   Title: ${currentProblem.title}`);
            console.log(`   Category: ${currentProblem.category || currentProblem.theme}`);
            console.log(`   Difficulty: ${currentProblem.difficulty}`);
            console.log(`   Rating: ${currentProblem.rating}`);
            console.log(`   Solution: ${currentProblem.solution.join(', ')}`);
        } else {
            console.log('   ❌ No current problem loaded');
        }
        
        console.log('📊 Player statistics:');
        console.log(`   Score: ${playerScore || 0}`);
        console.log(`   Solved problems: ${Array.isArray(solvedProblems) ? solvedProblems.length : 0}`);
        
        console.log('🌐 Global objects:');
        console.log(`   coreManager: ${typeof (window as any).coreManager}`);
        console.log(`   boardManager: ${typeof (window as any).boardManager}`);
        console.log(`   problemManager: ${typeof (window as any).problemManager}`);
        console.log(`   uiManager: ${typeof (window as any).uiManager}`);
        console.log(`   gameLogic: ${typeof (window as any).gameLogic}`);
    }

    /**
     * Export game data for analysis
     */
    exportGameData(): any {
        const data = {
            timestamp: new Date().toISOString(),
            gameState: {
                fen: (window as any).game?.fen(),
                turn: (window as any).game?.turn(),
                history: (window as any).game?.history(),
                inCheck: (window as any).game?.isCheck(),
                gameOver: (window as any).game?.isGameOver()
            },
            currentProblem: (window as any).currentProblem,
            playerStats: {
                score: (window as any).playerScore || 0,
                solvedProblems: (window as any).solvedProblems || []
            },
            problemDatabase: {
                total: (window as any).problemManager?.problems?.length || 0,
                loaded: !!(window as any).problemManager?.problems
            }
        };
        
        console.log('💾 Game data exported:', data);
        
        // Copy to clipboard if possible
        if (navigator.clipboard) {
            navigator.clipboard.writeText(JSON.stringify(data, null, 2))
                .then(() => console.log('📋 Data copied to clipboard'))
                .catch(err => console.log('❌ Failed to copy to clipboard:', err));
        }
        
        return data;
    }

    /**
     * Test board functionality
     */
    testBoard(): void {
        console.log('🧪 === TESTING BOARD FUNCTIONALITY ===');
        
        const boardManager = (window as any).boardManager;
        if (!boardManager) {
            console.error('❌ Board manager not available');
            return;
        }
        
        console.log('✅ Board manager available');
        console.log(`   Board instance: ${typeof boardManager.board}`);
        
        // Test position loading
        try {
            const testFen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
            boardManager.updatePosition(testFen);
            console.log('✅ Position update test passed');
        } catch (error) {
            console.error('❌ Position update test failed:', error);
        }
        
        // Test orientation
        try {
            boardManager.setBoardOrientation('w');
            console.log('✅ Board orientation test passed');
        } catch (error) {
            console.error('❌ Board orientation test failed:', error);
        }
    }

    /**
     * Display analysis results in UI
     */
    #displayAnalysisResults(analysis: any): void {
        const message = `
📊 Problem Database Analysis:
• Total: ${analysis.total} problems
• Categories: ${Object.keys(analysis.categories).length}
• Difficulties: ${Object.keys(analysis.difficulties).length}
• Rating range: ${analysis.ratings.min}-${analysis.ratings.max} (avg: ${analysis.ratings.avg})
        `.trim();
        
        const uiManager = (window as any).uiManager;
        if (uiManager && typeof uiManager.showFeedback === 'function') {
            uiManager.showFeedback(message, 'info', 8000);
        }
        
        // Also create a detailed breakdown
        const breakdown = document.getElementById('debug-analysis');
        if (breakdown) {
            breakdown.innerHTML = `
                <h4>📊 Database Analysis</h4>
                <div class="analysis-section">
                    <h5>Categories (${Object.keys(analysis.categories).length}):</h5>
                    ${Object.entries(analysis.categories)
                        .map(([cat, count]) => `<span class="stat-item">${cat}: ${count}</span>`)
                        .join('')}
                </div>
                <div class="analysis-section">
                    <h5>Difficulties:</h5>
                    ${Object.entries(analysis.difficulties)
                        .map(([diff, count]) => `<span class="stat-item">${diff}: ${count}</span>`)
                        .join('')}
                </div>
                <div class="analysis-section">
                    <h5>Ratings:</h5>
                    <span class="stat-item">Min: ${analysis.ratings.min}</span>
                    <span class="stat-item">Max: ${analysis.ratings.max}</span>
                    <span class="stat-item">Average: ${analysis.ratings.avg}</span>
                </div>
            `;
            breakdown.style.display = 'block';
        }
    }

    /**
     * Clear debug displays
     */
    clearDebugDisplay(): void {
        const breakdown = document.getElementById('debug-analysis');
        if (breakdown) {
            breakdown.style.display = 'none';
            breakdown.innerHTML = '';
        }
    }

    /**
     * Cleanup method
     */
    destroy(): void {
        this.clearDebugDisplay();
    }
}

export default DebugTools;

// Expose to global scope for compatibility
(window as any).DebugTools = DebugTools;