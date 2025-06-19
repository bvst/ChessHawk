/**
 * ChessHawk - Game Logic
 * 
 * Håndterer spillogikk, løsningsvalidering og trekksekevenser
 * TypeScript version with proper type safety
 */

import type { ChessInstance, IGameLogic } from '../types/chess.types';
import type { Puzzle } from '../types/puzzle.types';

/**
 * GameLogic klasse for håndtering av spillogikk og løsningsvalidering
 */
class GameLogic implements IGameLogic {
    game: ChessInstance | null = null;
    initialized: boolean = false;
    #currentMoveIndex: number = 0;
    #currentHintIndex: number = 0;
    #solutionTimer: NodeJS.Timeout | null = null;

    constructor() {
        console.log('🧠 GameLogic initialized');
    }

    /**
     * Initialize game
     */
    initializeGame(): void {
        this.game = (window as any).game;
        this.initialized = true;
        console.log('♟️ Game logic initialized');
    }

    /**
     * Make a move
     */
    makeMove(move: string): any {
        if (!this.game) {
            console.error('❌ Game not initialized');
            return null;
        }
        
        try {
            return this.game.move(move);
        } catch (error) {
            console.error('❌ Invalid move:', move, error);
            return null;
        }
    }

    /**
     * Check if move is valid
     */
    isValidMove(move: string): boolean {
        if (!this.game) return false;
        
        try {
            const moves = this.game.moves() as string[];
            return moves.includes(move);
        } catch (error) {
            return false;
        }
    }

    /**
     * Check solution
     */
    checkSolution(): boolean {
        console.log(`🎯 === checkSolution() START ===`);
        
        const currentProblem = (window as any).currentProblem as Puzzle;
        const game = (window as any).game as ChessInstance;
        
        if (!currentProblem) {
            console.warn('⚠️ No current problem loaded');
            this.#showFeedback('Ingen problem lastet!', 'error');
            return false;
        }
        
        if (!game) {
            console.error('❌ Game not available');
            return false;
        }
        
        const history = game.history({ verbose: true });
        console.log(`📜 Game history (${history.length} moves):`, history);
        
        if (history.length === 0) {
            console.warn(`⚠️ No moves made yet`);
            this.#showFeedback('Du må gjøre et trekk først!', 'error');
            return false;
        }
        
        const lastMove = history[history.length - 1];
        const playerMove = (lastMove as any).san;
        
        console.log(`🎯 Player move: ${playerMove} (Index: ${this.#currentMoveIndex})`);
        console.log(`📋 Expected solution:`, currentProblem.solution);
        
        const expectedMove = currentProblem.solution[this.#currentMoveIndex];
        console.log(`🎯 Expected move at index ${this.#currentMoveIndex}: ${expectedMove}`);
        
        if (expectedMove && playerMove === expectedMove) {
            this.#currentMoveIndex++;
            console.log(`✅ Correct move! Moving to index ${this.#currentMoveIndex}`);
            
            if (this.#currentMoveIndex >= currentProblem.solution.length) {
                this.#handleSolutionComplete();
                return true;
            }
            
            this.#showFeedback(`✅ Riktig trekk! (${this.#currentMoveIndex}/${currentProblem.solution.length})`, 'success');
            return true;
            
        } else {
            console.log(`❌ Wrong move! Expected: ${expectedMove}, Got: ${playerMove}`);
            this.#handleWrongMove(expectedMove || '', playerMove);
            return false;
        }
    }

    /**
     * Show hint
     */
    showHint(): void {
        const currentProblem = (window as any).currentProblem as Puzzle;
        
        if (!currentProblem || !currentProblem.hint) {
            this.#showFeedback('Ingen hint tilgjengelig for dette problemet', 'info');
            return;
        }
        
        const hint = currentProblem.hint;
        this.#showFeedback(`💡 Hint: ${hint}`, 'info', 5000);
        
        this.#currentHintIndex++;
        console.log(`💡 Hint shown: ${hint}`);
    }

    /**
     * Show solution
     */
    showSolution(): void {
        const currentProblem = (window as any).currentProblem as Puzzle;
        
        if (!currentProblem) {
            this.#showFeedback('Ingen problem lastet!', 'error');
            return;
        }
        
        const solutionText = currentProblem.solution.join(', ');
        this.#showFeedback(`📖 Løsning: ${solutionText}`, 'info', 8000);
        
        // Update solution element if it exists
        const solutionElement = document.getElementById('solution');
        if (solutionElement) {
            solutionElement.innerHTML = `
                <h4>Løsning:</h4>
                <div class="solution-moves">${currentProblem.solution.map((move, i) => 
                    `<span class="move-number">${i + 1}.</span> <span class="move">${move}</span>`
                ).join(' ')}</div>
            `;
            solutionElement.style.display = 'block';
        }
        
        console.log(`📖 Solution shown: ${solutionText}`);
    }

    /**
     * Handle solution complete
     */
    #handleSolutionComplete(): void {
        console.log('🎉 === SOLUTION COMPLETE ===');
        
        const currentProblem = (window as any).currentProblem as Puzzle;
        const points = currentProblem.points || 10;
        
        // Update score
        const currentScore = (window as any).playerScore || 0;
        (window as any).playerScore = currentScore + points;
        
        // Add to solved problems
        if (!(window as any).solvedProblems) (window as any).solvedProblems = [];
        
        const alreadySolved = (window as any).solvedProblems.includes(currentProblem.id);
        if (!alreadySolved) {
            (window as any).solvedProblems.push(currentProblem.id);
        }
        
        const message = alreadySolved 
            ? `🎉 Løsning fullført! (Allerede løst tidligere)`
            : `🎉 Gratulerer! Du løste problemet og fikk ${points} poeng! Ny total: ${(window as any).playerScore}`;
            
        this.#showFeedback(message, 'success', 5000);
        
        // Reset move index for next problem
        this.#currentMoveIndex = 0;
        this.#currentHintIndex = 0;
    }

    /**
     * Handle wrong move
     */
    #handleWrongMove(expected: string, actual: string): void {
        this.#showFeedback(`❌ Feil trekk! Forventet: ${expected}, fikk: ${actual}`, 'error', 4000);
        
        // Reset move index
        this.#currentMoveIndex = 0;
    }

    /**
     * Show feedback helper
     */
    #showFeedback(message: string, type: string, duration: number = 3000): void {
        const uiManager = (window as any).uiManager;
        if (uiManager && typeof uiManager.showFeedback === 'function') {
            uiManager.showFeedback(message, type, duration);
        } else {
            console.log(`${type.toUpperCase()}: ${message}`);
        }
    }

    /**
     * Cleanup method
     */
    destroy(): void {
        if (this.#solutionTimer) {
            clearTimeout(this.#solutionTimer);
        }
        this.#currentMoveIndex = 0;
        this.#currentHintIndex = 0;
        this.game = null;
        this.initialized = false;
    }
}

export default GameLogic;

// Expose to global scope for compatibility
(window as any).GameLogic = GameLogic;