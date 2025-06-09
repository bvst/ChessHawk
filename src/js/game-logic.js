/**
 * ChessHawk - Game Logic
 * 
 * Håndterer spillogikk, løsningsvalidering og trekksekevenser
 * Modernized with ES2024+ features and ES6 modules
 */

/**
 * GameLogic klasse for håndtering av spillogikk og løsningsvalidering
 */
class GameLogic {
    #currentMoveIndex = 0;
    #isWaitingForOpponentMove = false;
    #currentHintIndex = 0;
    #solutionTimer = null;

    constructor() {
        console.log('🧠 GameLogic initialized');
    }

    /**
     * Sjekk om den nåværende posisjonen matcher løsningen
     */
    checkSolution() {
        console.log(`🎯 === checkSolution() START ===`);
        console.log(`   🎯 Problem ID: ${window.currentProblem?.id || 'UNKNOWN'}`);
        
        if (!window.currentProblem) {
            console.warn('⚠️  No current problem loaded');
            this.#showFeedback('Ingen problem lastet!', 'error');
            return;
        }
        
        // Få spillhistorikk
        const history = window.game.history({ verbose: true });
        console.log(`📜 Game history for problem ${window.currentProblem.id} (${history.length} moves):`, history);
        
        if (history.length === 0) {
            console.warn(`⚠️  WARNING - No moves made yet in problem: ${window.currentProblem.id}`);
            this.#showFeedback('Du må gjøre et trekk først!', 'error');
            return;
        }
        
        const lastMove = history[history.length - 1];
        const playerMove = lastMove.san;
        
        console.log(`   🎯 Player move: ${playerMove} (Index: ${this.#currentMoveIndex})`);
        console.log(`   📋 Expected solution:`, window.currentProblem.solution);
        
        // Sjekk om spillerens trekk matcher forventet trekk i løsningen
        const expectedMove = window.currentProblem.solution[this.#currentMoveIndex];
        console.log(`   🎯 Expected move at index ${this.#currentMoveIndex}: ${expectedMove}`);
        
        if (playerMove === expectedMove) {
            this.#currentMoveIndex++;
            console.log(`   ✅ Correct move! Moving to index ${this.#currentMoveIndex}`);
            
            // Sjekk om løsningen er fullført
            if (this.#currentMoveIndex >= window.currentProblem.solution.length) {
                this.#handleSolutionComplete();
                return;
            }
            
            // Hvis det er flere trekk i løsningen, simuler motstanderens trekk
            this.#playOpponentMove();
            
        } else {
            console.log(`   ❌ Wrong move! Expected: ${expectedMove}, Got: ${playerMove}`);
            this.#handleWrongMove(expectedMove, playerMove);
        }
        
        console.log(`🎯 === checkSolution() END ===`);
    }

    /**
     * Håndter fullført løsning
     */
    #handleSolutionComplete() {
        console.log('🎉 === SOLUTION COMPLETE ===');
        
        const points = window.currentProblem.points || 10;
        const rating = window.currentProblem.rating || 1000;
        
        // Oppdater score
        window.playerScore = (window.playerScore || 0) + points;
        
        // Legg til i solved problems hvis ikke allerede der
        if (!window.solvedProblems) window.solvedProblems = [];
        
        const alreadySolved = window.solvedProblems.includes(window.currentProblem.id);
        if (!alreadySolved) {
            window.solvedProblems.push(window.currentProblem.id);
        }
        
        // Vis suksessmelding
        const message = alreadySolved 
            ? `🎉 Løsning fullført! (Allerede løst tidligere)`
            : `🎉 Gratulerer! Du løste problemet og fikk ${points} poeng! Ny total: ${window.playerScore}`;
            
        this.#showFeedback(message, 'success');
        
        // Oppdater UI
        this.#updateGameStatus('Løsning fullført!');
        
        // Vis achievement hvis første gang solved
        if (!alreadySolved) {
            this.#showAchievement(points, rating);
        }
        
        console.log(`   💎 Points earned: ${points}`);
        console.log(`   📊 Total score: ${window.playerScore}`);
        console.log(`   🏆 Solved problems: ${window.solvedProblems.length}`);
    }

    /**
     * Håndter feil trekk
     */
    #handleWrongMove(expected, actual) {
        console.log('❌ === WRONG MOVE ===');
        
        // Tilbakestill move index
        this.#currentMoveIndex = 0;
        
        // Vis feilmelding
        const message = `❌ Feil trekk! Forventet: ${expected}, Du spilte: ${actual}`;
        this.#showFeedback(message, 'error');
        
        // Oppdater status
        this.#updateGameStatus('Prøv igjen!');
        
        console.log(`   🔄 Reset move index to 0`);
    }

    /**
     * Spill motstanderens trekk
     */
    async #playOpponentMove() {
        if (this.#currentMoveIndex >= window.currentProblem.solution.length) {
            console.log('📝 No more opponent moves in solution');
            return;
        }
        
        const opponentMove = window.currentProblem.solution[this.#currentMoveIndex];
        console.log(`🤖 === PLAYING OPPONENT MOVE: ${opponentMove} ===`);
        
        // Sett flagg for venting
        this.#isWaitingForOpponentMove = true;
        if (window.boardManager) {
            window.boardManager.setWaitingForOpponent(true);
        }
        
        // Vis at vi venter på motstandertrekk
        this.#updateGameStatus('Motstanderen tenker...');
        
        // Vent litt før trekket (for realisme)
        await this.#delay(800);
        
        try {
            const move = window.game.move(opponentMove);
            
            if (move === null) {
                console.error(`❌ ERROR: Invalid opponent move: ${opponentMove}`);
                this.#showFeedback(`Feil i løsning: Ugyldig motstandertrekk ${opponentMove}`, 'error');
                return;
            }
            
            console.log(`   ✅ Opponent move executed:`, move);
            
            // Oppdater brett
            if (window.boardManager) {
                window.boardManager.updatePosition(window.game.fen());
            }
            
            // Oppdater move index
            this.#currentMoveIndex++;
            
            // Sjekk spilltilstand etter motstandertrekk
            this.#checkGameState();
            
        } catch (error) {
            console.error('❌ Error playing opponent move:', error);
            this.#showFeedback('Feil ved utføring av motstandertrekk', 'error');
        } finally {
            // Fjern venteflagg
            this.#isWaitingForOpponentMove = false;
            if (window.boardManager) {
                window.boardManager.setWaitingForOpponent(false);
            }
        }
        
        console.log(`🤖 === OPPONENT MOVE COMPLETE ===`);
    }

    /**
     * Sjekk spilltilstand (sjakkmatt, remis, etc.)
     */
    #checkGameState() {
        let status = '';
        const moveColor = window.game.turn() === 'b' ? 'Svart' : 'Hvit';
        
        if (window.game.in_checkmate()) {
            status = 'Sjakkmatt, ' + moveColor + ' tapte.';
        } else if (window.game.in_draw()) {
            status = 'Remis';
        } else {
            status = moveColor + ' sin tur';
            
            // Sjekk for sjakk
            if (window.game.in_check()) {
                status += ' (sjakk)';
            }
        }
        
        this.#updateGameStatus(status);
        console.log(`🎮 Game status: ${status}`);
    }

    /**
     * Vis hint
     */
    showHint() {
        console.log('💡 === SHOWING HINT ===');
        
        if (!window.currentProblem) {
            this.#showFeedback('Ingen problem lastet!', 'error');
            return;
        }
        
        const solution = window.currentProblem.solution;
        if (!solution || solution.length === 0) {
            this.#showFeedback('Ingen løsning tilgjengelig!', 'error');
            return;
        }
        
        // Vis hint basert på nåværende move index og hint index
        const hintMoveIndex = Math.min(this.#currentHintIndex, solution.length - 1);
        const hintMove = solution[hintMoveIndex];
        
        const hintMessage = `💡 Hint: Prøv trekket ${hintMove}`;
        this.#showFeedback(hintMessage, 'info');
        
        // Øk hint index for neste gang
        this.#currentHintIndex = Math.min(this.#currentHintIndex + 1, solution.length - 1);
        
        console.log(`   💡 Hint given: ${hintMove} (move ${hintMoveIndex + 1}/${solution.length})`);
    }

    /**
     * Vis komplett løsning
     */
    showSolution() {
        console.log('📖 === SHOWING SOLUTION ===');
        
        if (!window.currentProblem) {
            this.#showFeedback('Ingen problem lastet!', 'error');
            return;
        }
        
        const solution = window.currentProblem.solution;
        if (!solution || solution.length === 0) {
            this.#showFeedback('Ingen løsning tilgjengelig!', 'error');
            return;
        }
        
        // Format løsning
        const formattedSolution = solution
            .map((move, index) => `${Math.floor(index/2) + 1}${index % 2 === 0 ? '.' : '...'} ${move}`)
            .join(' ');
        
        const solutionHTML = `
            <div class="solution-display">
                <h4>📖 Komplett løsning:</h4>
                <div class="moves-notation">${formattedSolution}</div>
                <div class="solution-note">Kategori: ${window.currentProblem.category} | Rating: ${window.currentProblem.rating}</div>
            </div>
        `;
        
        this.#showSolution(solutionHTML);
        
        console.log(`   📖 Solution shown: ${solution.join(' ')}`);
    }

    /**
     * Reset spilltilstand
     */
    resetGameState() {
        this.#currentMoveIndex = 0;
        this.#currentHintIndex = 0;
        this.#isWaitingForOpponentMove = false;
        
        if (this.#solutionTimer) {
            clearTimeout(this.#solutionTimer);
            this.#solutionTimer = null;
        }
        
        console.log('🔄 Game state reset');
    }

    /**
     * Hjelpemetoder for UI-oppdateringer
     */
    #showFeedback(message, type = 'info') {
        if (window.uiManager) {
            window.uiManager.showFeedback(message, type);
        } else {
            console.log(`UI: ${message}`);
        }
    }

    #showSolution(html) {
        const solutionEl = document.getElementById('solution');
        if (solutionEl) {
            solutionEl.innerHTML = html;
            solutionEl.style.display = 'block';
        }
    }

    #updateGameStatus(status) {
        const statusEl = document.getElementById('status');
        if (statusEl) {
            statusEl.textContent = status;
        }
    }

    #showAchievement(points, rating) {
        // Simple achievement notification
        this.#solutionTimer = setTimeout(() => {
            this.#showFeedback(`🏆 Problem løst! ${points} poeng (Rating: ${rating})`, 'success');
        }, 1000);
    }

    /**
     * Hjelpemetode for å vente
     */
    #delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Getters for tilstand
     */
    get currentMoveIndex() {
        return this.#currentMoveIndex;
    }

    get isWaitingForOpponentMove() {
        return this.#isWaitingForOpponentMove;
    }

    /**
     * Cleanup metode
     */
    destroy() {
        if (this.#solutionTimer) {
            clearTimeout(this.#solutionTimer);
            this.#solutionTimer = null;
        }
        this.resetGameState();
    }
}

// Export the class as default
export default GameLogic;

// Expose to global scope for compatibility with existing code
window.GameLogic = GameLogic;
